import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as projectService from '../services/projectService';
import * as issueService from '../services/issueService';
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
  });

  const [loading, setLoading] = useState(true);
  // "mine" is the default, safe experience: only tasks this user created or is
  // assigned to. Pages that need the organizational picture (Board, All Issues,
  // Reports, Calendar, the manager dashboard) intentionally switch this to
  // "all" on mount — the backend re-enforces the same boundary either way.
  const [viewScope, setViewScope] = useState('mine');
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
      const [fetchedProjects, fetchedIssues, fetchedStats, staffResponse, notificationResponse] = await Promise.all([
        projectService.listProjects().catch(() => []),
        issueService.listIssues({ scope: viewScope }).catch(() => []),
        issueService.getIssueStats().catch(() => null),
        listStaff({ limit: 50 }).catch(() => ({ items: [] })),
        notificationService.listNotifications({ limit: 50 }).catch(() => ({ items: [] })),
      ]);

      setProjects(fetchedProjects || []);
      setIssues(fetchedIssues || []);

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

  // The issue drawer, global search and notification links can point at an
  // issue outside the currently-loaded scope (e.g. an admin opening an issue
  // assigned to someone else while viewing "My Tasks"), so it is always
  // fetched by id directly rather than looked up in the scoped `issues` list.
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

  // Applies a freshly-saved issue to local state: updates it in the scoped
  // list (dropping it if it no longer belongs to "mine", e.g. it was just
  // reassigned away from the current user) and syncs the open drawer.
  const applyIssueUpdate = useCallback(
    (updatedIssue) => {
      setIssues((prev) => {
        const stillMine =
          viewScope !== 'mine' ||
          updatedIssue.assignee?.id === user?.id ||
          updatedIssue.createdBy === user?.id ||
          updatedIssue.reporter?.id === user?.id;

        const exists = prev.some((i) => i.id === updatedIssue.id);
        if (!stillMine) {
          return prev.filter((i) => i.id !== updatedIssue.id);
        }
        if (!exists) {
          return [updatedIssue, ...prev];
        }
        return prev.map((i) => (i.id === updatedIssue.id ? updatedIssue : i));
      });
      setSelectedIssue((prev) => (prev && prev.id === updatedIssue.id ? updatedIssue : prev));
    },
    [viewScope, user]
  );

  const addIssue = async (issueData) => {
    try {
      const created = await issueService.createIssue(issueData);
      await refreshData();
      return created;
    } catch (err) {
      console.error('Failed to create issue:', err);
      throw err;
    }
  };

  const updateIssue = async (id, updates) => {
    try {
      const updated = await issueService.updateIssue(id, updates);
      applyIssueUpdate(updated);
      refreshData();
      return updated;
    } catch (err) {
      console.error('Failed to update issue:', err);
      throw err;
    }
  };

  const reassignIssue = async (id, assigneeId) => {
    try {
      const updated = await issueService.assignIssue(id, assigneeId);
      applyIssueUpdate(updated);
      refreshData();
      return updated;
    } catch (err) {
      console.error('Failed to reassign issue:', err);
      throw err;
    }
  };

  const deleteIssue = async (id) => {
    try {
      await issueService.deleteIssue(id);
      setIssues((prev) => prev.filter((i) => i.id !== id));
      refreshData();
    } catch (err) {
      console.error('Failed to delete issue:', err);
      throw err;
    }
  };

  const moveIssueStatus = async (issueId, newStatus) => {
    try {
      // Optimistic update for instant UI feedback
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i))
      );
      const updated = await issueService.moveIssueStatus(issueId, newStatus);
      applyIssueUpdate(updated);
      refreshData();
    } catch (err) {
      console.error('Failed to move issue status:', err);
      refreshData();
      throw err;
    }
  };

  const addComment = async (issueId, text) => {
    try {
      const updated = await issueService.addComment(issueId, text);
      applyIssueUpdate(updated);
      return updated;
    } catch (err) {
      console.error('Failed to add comment:', err);
      throw err;
    }
  };

  const toggleSubtask = async (issueId, subtaskId) => {
    try {
      const updated = await issueService.toggleSubtask(issueId, subtaskId);
      applyIssueUpdate(updated);
      return updated;
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
      throw err;
    }
  };

  const addProject = async (projectData) => {
    try {
      const created = await projectService.createProject(projectData);
      await refreshData();
      return created;
    } catch (err) {
      console.error('Failed to create project:', err);
      throw err;
    }
  };

  const updateProject = async (id, payload) => {
    try {
      const updated = await projectService.updateProject(id, payload);
      await refreshData();
      return updated;
    } catch (err) {
      console.error('Failed to update project:', err);
      throw err;
    }
  };

  const toggleProjectStar = async (idOrKey) => {
    try {
      await projectService.toggleProjectStar(idOrKey);
      setProjects((prev) =>
        prev.map((p) => (p.key === idOrKey || p.id === idOrKey ? { ...p, star: !p.star } : p))
      );
    } catch (err) {
      console.error('Failed to toggle project star:', err);
    }
  };

  const markNotificationAsRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    try {
      await notificationService.markNotificationAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await notificationService.markAllNotificationsAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const value = {
    loading,
    refreshData,
    projects,
    activeProjectKey,
    setActiveProjectKey,
    activeProject,
    addProject,
    updateProject,
    toggleProjectStar,
    issues,
    viewScope,
    setViewScope,
    addIssue,
    updateIssue,
    reassignIssue,
    deleteIssue,
    moveIssueStatus,
    addComment,
    toggleSubtask,
    teamMembers,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    searchQuery,
    setSearchQuery,
    createIssueModalOpen,
    setCreateIssueModalOpen,
    selectedIssueId,
    setSelectedIssueId,
    selectedIssue,
    selectedIssueLoading,
    stats,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within a ProjectProvider');
  return ctx;
}
