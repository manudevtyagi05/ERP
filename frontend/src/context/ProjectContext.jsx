import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as projectService from '../services/projectService';
import * as issueService from '../services/issueService';
import * as sprintService from '../services/sprintService';
import * as epicService from '../services/epicService';
import * as releaseService from '../services/releaseService';
import * as componentService from '../services/componentService';
import * as filterService from '../services/filterService';
import * as notificationService from '../services/notificationService';
import { listStaff } from '../services/staffService';

function mapNotification(n) {
  return {
    id: n.id,
    title: n.title,
    description: n.message,
    time: n.createdAt
      ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Recently',
    unread: !n.read,
    type: n.type,
    issueKey: n.issueKey,
  };
}

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const { isAuthenticated, user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [epics, setEpics] = useState([]);
  const [releases, setReleases] = useState([]);
  const [components, setComponents] = useState([]);
  const [savedFilters, setSavedFilters] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    totalIssuesCount: 0,
    openIssuesCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    totalStoryPoints: 0,
    completedStoryPoints: 0,
    completionRate: 0,
    overdueCount: 0,
    dueTodayCount: 0,
    upcomingCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [viewScope, setViewScope] = useState('all');
  const [activeProjectKey, setActiveProjectKey] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [createIssueModalOpen, setCreateIssueModalOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedIssueLoading, setSelectedIssueLoading] = useState(false);

  // Fetch all backend data
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [
        fetchedProjects,
        fetchedIssues,
        fetchedStats,
        fetchedSprints,
        fetchedEpics,
        fetchedReleases,
        fetchedComponents,
        fetchedFilters,
        staffResponse,
        notificationResponse,
      ] = await Promise.all([
        projectService.listProjects().catch(() => []),
        issueService.listIssues({ scope: viewScope }).catch(() => []),
        issueService.getIssueStats().catch(() => null),
        sprintService.listSprints().catch(() => []),
        epicService.listEpics().catch(() => []),
        releaseService.listReleases().catch(() => []),
        componentService.listComponents().catch(() => []),
        filterService.listFilters().catch(() => []),
        listStaff({ limit: 50 }).catch(() => ({ items: [] })),
        notificationService.listNotifications({ limit: 50 }).catch(() => ({ items: [] })),
      ]);

      setProjects(fetchedProjects || []);
      setIssues(fetchedIssues || []);
      setSprints(fetchedSprints || []);
      setEpics(fetchedEpics || []);
      setReleases(fetchedReleases || []);
      setComponents(fetchedComponents || []);
      setSavedFilters(fetchedFilters || []);

      if (fetchedStats) {
        setStats(fetchedStats);
      }

      if (staffResponse?.items) {
        const mappedMembers = staffResponse.items.map((member) => ({
          id: member.id || member._id,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email,
          role: member.role,
          department: member.department || 'Unassigned',
          activeTasks: (fetchedIssues || []).filter(
            (i) => i.assignee?.email === member.email && i.status !== 'DONE'
          ).length,
          isActive: member.isActive,
        }));
        setTeamMembers(mappedMembers);
      }

      setNotifications((notificationResponse?.items || []).map(mapNotification));
    } catch (err) {
      console.error('Failed to load project management data:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, viewScope]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Fetch full details of selected issue
  useEffect(() => {
    if (!selectedIssueId) {
      setSelectedIssue(null);
      return undefined;
    }
    let cancelled = false;
    setSelectedIssueLoading(true);
    issueService
      .getIssue(selectedIssueId)
      .then((data) => {
        if (!cancelled) setSelectedIssue(data);
      })
      .catch(() => {
        if (!cancelled) setSelectedIssue(null);
      })
      .finally(() => {
        if (!cancelled) setSelectedIssueLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedIssueId]);

  const activeProject =
    activeProjectKey === 'ALL' ? null : projects.find((p) => p.key === activeProjectKey) || null;

  const activeSprint =
    sprints.find(
      (s) =>
        s.status === 'ACTIVE' &&
        (activeProjectKey === 'ALL' || s.projectKey === activeProjectKey)
    ) || null;

  // Apply issue update locally & sync open drawer
  const applyIssueUpdate = useCallback(
    (updatedIssue) => {
      setIssues((prev) => {
        const exists = prev.some((i) => i.id === updatedIssue.id);
        if (exists) {
          return prev.map((i) => (i.id === updatedIssue.id ? updatedIssue : i));
        }
        return [updatedIssue, ...prev];
      });

      if (selectedIssue && selectedIssue.id === updatedIssue.id) {
        setSelectedIssue(updatedIssue);
      }
    },
    [selectedIssue]
  );

  // Issue CRUD actions
  const addIssue = async (payload) => {
    const created = await issueService.createIssue(payload);
    setIssues((prev) => [created, ...prev]);
    return created;
  };

  const editIssue = async (id, payload) => {
    const updated = await issueService.updateIssue(id, payload);
    applyIssueUpdate(updated);
    return updated;
  };

  const moveIssueStatus = async (id, newStatus) => {
    // Optimistic update
    setIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    );
    if (selectedIssue && selectedIssue.id === id) {
      setSelectedIssue((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    try {
      const updated = await issueService.moveIssueStatus(id, newStatus);
      applyIssueUpdate(updated);
      return updated;
    } catch (err) {
      refreshData();
      throw err;
    }
  };

  const assignIssueAction = async (id, assigneeId) => {
    const updated = await issueService.assignIssue(id, assigneeId);
    applyIssueUpdate(updated);
    return updated;
  };

  const deleteIssueAction = async (id) => {
    await issueService.deleteIssue(id);
    setIssues((prev) => prev.filter((i) => i.id !== id));
    if (selectedIssueId === id) {
      setSelectedIssueId(null);
      setSelectedIssue(null);
    }
  };

  const addCommentAction = async (id, content) => {
    const updated = await issueService.addComment(id, content);
    applyIssueUpdate(updated);
    return updated;
  };

  const addReactionAction = async (id, commentId, emoji) => {
    const updated = await issueService.addReaction(id, commentId, emoji);
    applyIssueUpdate(updated);
    return updated;
  };

  const logWorkAction = async (id, payload) => {
    const updated = await issueService.logWork(id, payload);
    applyIssueUpdate(updated);
    return updated;
  };

  const linkIssueAction = async (id, payload) => {
    const updated = await issueService.linkIssue(id, payload);
    applyIssueUpdate(updated);
    return updated;
  };

  const deleteLinkAction = async (id, linkId) => {
    const updated = await issueService.deleteLink(id, linkId);
    applyIssueUpdate(updated);
    return updated;
  };

  const toggleWatcherAction = async (id) => {
    const updated = await issueService.toggleWatcher(id);
    applyIssueUpdate(updated);
    return updated;
  };

  const toggleVoteAction = async (id) => {
    const updated = await issueService.toggleVote(id);
    applyIssueUpdate(updated);
    return updated;
  };

  const addSubtaskAction = async (id, payload) => {
    const updated = await issueService.addSubtask(id, payload);
    applyIssueUpdate(updated);
    return updated;
  };

  const toggleSubtaskAction = async (id, subtaskId) => {
    const updated = await issueService.toggleSubtask(id, subtaskId);
    applyIssueUpdate(updated);
    return updated;
  };

  const deleteSubtaskAction = async (id, subtaskId) => {
    const updated = await issueService.deleteSubtask(id, subtaskId);
    applyIssueUpdate(updated);
    return updated;
  };

  // Sprint actions
  const createSprintAction = async (payload) => {
    const created = await sprintService.createSprint(payload);
    setSprints((prev) => [...prev, created]);
    return created;
  };

  const startSprintAction = async (id, payload) => {
    const started = await sprintService.startSprint(id, payload);
    setSprints((prev) => prev.map((s) => (s.id === id ? started : s)));
    refreshData();
    return started;
  };

  const completeSprintAction = async (id, payload) => {
    const res = await sprintService.completeSprint(id, payload);
    refreshData();
    return res;
  };

  const deleteSprintAction = async (id) => {
    await sprintService.deleteSprint(id);
    setSprints((prev) => prev.filter((s) => s.id !== id));
    refreshData();
  };

  // Project star action
  const toggleProjectStar = async (projectId) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    const updated = await projectService.updateProject(projectId, { star: !proj.star });
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, star: updated.star } : p)));
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        issues,
        sprints,
        epics,
        releases,
        components,
        savedFilters,
        teamMembers,
        notifications,
        stats,
        loading,
        viewScope,
        setViewScope,
        activeProjectKey,
        setActiveProjectKey,
        activeProject,
        activeSprint,
        searchQuery,
        setSearchQuery,
        createIssueModalOpen,
        setCreateIssueModalOpen,
        selectedIssueId,
        setSelectedIssueId,
        selectedIssue,
        selectedIssueLoading,
        refreshData,
        addIssue,
        editIssue,
        moveIssueStatus,
        assignIssueAction,
        deleteIssueAction,
        addCommentAction,
        addReactionAction,
        logWorkAction,
        linkIssueAction,
        deleteLinkAction,
        toggleWatcherAction,
        toggleVoteAction,
        addSubtaskAction,
        toggleSubtaskAction,
        deleteSubtaskAction,
        createSprintAction,
        startSprintAction,
        completeSprintAction,
        deleteSprintAction,
        toggleProjectStar,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return ctx;
}
