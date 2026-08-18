import { useState, useMemo, useEffect } from 'react';
import {
  Button,
  Input,
  Tag,
  Avatar,
  Tooltip,
  Dropdown,
  Progress,
  App,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ThunderboltFilled,
  MoreOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  RightOutlined,
  DownOutlined,
  CalendarOutlined,
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { ISSUE_TYPES, ISSUE_PRIORITIES, ISSUE_STATUSES } from '../constants/jira';
import StartSprintModal from '../components/sprints/StartSprintModal';
import CompleteSprintModal from '../components/sprints/CompleteSprintModal';
import CreateEpicModal from '../components/epics/CreateEpicModal';

function BacklogIssueRow({
  issue,
  onSelect,
  onMoveToSprint,
  sprints = [],
  epics = [],
}) {
  const typeConfig = ISSUE_TYPES[issue.type] || ISSUE_TYPES.Task;
  const priorityConfig = ISSUE_PRIORITIES[issue.priority] || ISSUE_PRIORITIES.MEDIUM;
  const statusConfig = ISSUE_STATUSES[issue.status] || ISSUE_STATUSES.TODO;
  const epic = epics.find((e) => e.id === issue.epicId || e.name === issue.epic);

  const moveMenuItems = [
    { key: 'backlog', label: 'Move to Backlog', onClick: () => onMoveToSprint(issue.id, null) },
    ...sprints.map((s) => ({
      key: s.id,
      label: `Move to ${s.name}`,
      onClick: () => onMoveToSprint(issue.id, s.id),
    })),
  ];

  return (
    <div
      onClick={() => onSelect(issue.id)}
      className="group flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 transition cursor-pointer"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <Tooltip title={typeConfig.label}>
          <span className="flex items-center flex-shrink-0 text-sm">{typeConfig.icon}</span>
        </Tooltip>

        <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">
          {issue.key}
        </span>

        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
          {issue.title}
        </span>

        {epic && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: `${epic.color || '#7c3aed'}18`, color: epic.color || '#7c3aed' }}
          >
            {epic.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Tag color={statusConfig.tagColor} className="text-[11px] !m-0">
          {statusConfig.label}
        </Tag>

        <Tooltip title={`Priority: ${priorityConfig.label}`}>
          <span className="flex items-center text-xs">{priorityConfig.icon}</span>
        </Tooltip>

        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[11px]">
          {issue.storyPoints || 0}
        </div>

        {issue.assignee ? (
          <Tooltip title={`Assignee: ${issue.assignee.name}`}>
            <Avatar size={24} className="bg-blue-600 text-[11px]">
              {issue.assignee.name?.[0] || 'U'}
            </Avatar>
          </Tooltip>
        ) : (
          <Avatar size={24} icon={<UserOutlined />} className="bg-slate-300 dark:bg-slate-700 text-[10px]" />
        )}

        <Dropdown menu={{ items: moveMenuItems }} trigger={['click']}>
          <Button
            size="small"
            type="text"
            icon={<MoreOutlined />}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          />
        </Dropdown>
      </div>
    </div>
  );
}

function SprintContainer({
  sprint,
  issues = [],
  allSprints = [],
  epics = [],
  onSelectIssue,
  onMoveToSprint,
  onStartSprint,
  onCompleteSprint,
  onDeleteSprint,
  onQuickCreate,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const totalPoints = issues.reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);
  const donePoints = issues
    .filter((i) => i.status === 'DONE')
    .reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);
  const inProgressPoints = issues
    .filter((i) => i.status === 'IN_PROGRESS' || i.status === 'IN_REVIEW')
    .reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);
  const todoPoints = issues
    .filter((i) => i.status === 'TODO' || i.status === 'BACKLOG')
    .reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    setCreating(true);
    try {
      await onQuickCreate({
        title: quickTitle.trim(),
        sprintId: sprint?.id || null,
      });
      setQuickTitle('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
          >
            {collapsed ? <RightOutlined /> : <DownOutlined />}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {sprint ? sprint.name : 'Backlog'}
              </span>
              {sprint?.status === 'ACTIVE' && (
                <Tag color="green" className="text-[10px] font-bold uppercase tracking-wider !m-0">
                  Active Sprint
                </Tag>
              )}
              <span className="text-xs text-slate-400">
                ({issues.length} {issues.length === 1 ? 'issue' : 'issues'})
              </span>
            </div>

            {sprint?.goal && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md">
                Goal: {sprint.goal}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls & Points */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Story Points Pills */}
          <div className="flex items-center gap-1 text-[11px] font-bold mr-1">
            <Tooltip title="To Do points">
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {todoPoints}
              </span>
            </Tooltip>
            <Tooltip title="In Progress points">
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                {inProgressPoints}
              </span>
            </Tooltip>
            <Tooltip title="Done points">
              <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                {donePoints}
              </span>
            </Tooltip>
          </div>

          {sprint && sprint.status === 'FUTURE' && (
            <Button
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => onStartSprint(sprint)}
              className="text-xs font-semibold !bg-blue-600 hover:!bg-blue-700"
            >
              Start Sprint
            </Button>
          )}

          {sprint && sprint.status === 'ACTIVE' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => onCompleteSprint(sprint, issues)}
              className="text-xs font-semibold !bg-emerald-600 hover:!bg-emerald-700"
            >
              Complete Sprint
            </Button>
          )}

          {sprint && (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'del',
                    label: 'Delete Sprint',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => onDeleteSprint(sprint.id),
                  },
                ],
              }}
              trigger={['click']}
            >
              <Button size="small" type="text" icon={<MoreOutlined />} />
            </Dropdown>
          )}
        </div>
      </div>

      {/* Issues list & Inline create */}
      {!collapsed && (
        <div>
          {issues.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              Plan issues into this container by dragging or selecting &quot;Move to Sprint&quot;.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {issues.map((issue) => (
                <BacklogIssueRow
                  key={issue.id}
                  issue={issue}
                  onSelect={onSelectIssue}
                  onMoveToSprint={onMoveToSprint}
                  sprints={allSprints}
                  epics={epics}
                />
              ))}
            </div>
          )}

          {/* Quick Create row */}
          <form
            onSubmit={handleCreateSubmit}
            className="px-3.5 py-2.5 bg-slate-50/60 dark:bg-slate-900/60 flex items-center gap-2 border-t border-slate-200/60 dark:border-slate-800"
          >
            <PlusOutlined className="text-slate-400 text-xs" />
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="+ What needs to be done? (Press Enter to create)"
              className="flex-1 bg-transparent border-none text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
              disabled={creating}
            />
            {quickTitle.trim() && (
              <Button size="small" type="primary" htmlType="submit" loading={creating} className="text-xs">
                Create
              </Button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

function Backlog() {
  const {
    issues,
    projects,
    activeProjectKey,
    setActiveProjectKey,
    activeProject,
    sprints,
    epics,
    createSprintAction,
    startSprintAction,
    completeSprintAction,
    deleteSprintAction,
    editIssue,
    addIssue,
    setSelectedIssueId,
    setCreateIssueModalOpen,
  } = useProject();

  const [search, setSearch] = useState('');
  const [selectedEpicId, setSelectedEpicId] = useState('ALL');
  const [startModal, setStartModal] = useState({ open: false, sprint: null });
  const [completeModal, setCompleteModal] = useState({ open: false, sprint: null, issues: [] });
  const [epicModalOpen, setEpicModalOpen] = useState(false);
  const [showEpicsPanel, setShowEpicsPanel] = useState(true);
  const { message } = App.useApp();

  const currentProjectId = activeProject?.id || projects[0]?.id;

  // Filter sprints for current project
  const projectSprints = useMemo(() => {
    return sprints.filter((s) => {
      if (activeProjectKey !== 'ALL' && s.projectKey !== activeProjectKey) return false;
      return s.status !== 'CLOSED';
    });
  }, [sprints, activeProjectKey]);

  const activeSprint = projectSprints.find((s) => s.status === 'ACTIVE');
  const futureSprints = projectSprints.filter((s) => s.status === 'FUTURE');

  // Filter issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (activeProjectKey !== 'ALL' && issue.projectKey !== activeProjectKey) return false;
      if (search && !issue.title.toLowerCase().includes(search.toLowerCase()) && !issue.key.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (selectedEpicId !== 'ALL' && issue.epicId !== selectedEpicId) {
        return false;
      }
      return true;
    });
  }, [issues, activeProjectKey, search, selectedEpicId]);

  const activeSprintIssues = filteredIssues.filter((i) => activeSprint && i.sprintId === activeSprint.id);
  const backlogIssues = filteredIssues.filter((i) => !i.sprintId);

  const handleMoveToSprint = async (issueId, sprintId) => {
    try {
      await editIssue(issueId, { sprintId });
      message.success('Issue moved successfully');
    } catch (err) {
      message.error('Failed to move issue');
    }
  };

  const handleCreateSprint = async () => {
    try {
      const count = sprints.filter((s) => s.projectId === currentProjectId).length + 1;
      const key = activeProject?.key || 'WEB';
      await createSprintAction({
        projectId: currentProjectId,
        name: `${key} Sprint ${count}`,
        goal: 'Iteration objectives and deliverable targets',
      });
      message.success('New sprint created in backlog');
    } catch (err) {
      message.error('Failed to create sprint');
    }
  };

  const handleQuickCreate = async ({ title, sprintId }) => {
    await addIssue({
      projectKey: activeProject?.key || 'WEB',
      title,
      sprintId,
      type: 'Story',
      priority: 'MEDIUM',
      storyPoints: 3,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">
              {activeProject ? `${activeProject.name} Backlog` : 'Project Backlog & Sprint Planning'}
            </h1>
            {activeProject && (
              <Tag color="blue" className="text-xs font-mono">
                {activeProject.key}
              </Tag>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Plan future sprints, estimate story points, and manage epics breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowEpicsPanel(!showEpicsPanel)}
            className="text-xs font-semibold"
          >
            {showEpicsPanel ? 'Hide Epics' : 'Show Epics'}
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateSprint}
            className="text-xs font-semibold !bg-blue-600 hover:!bg-blue-700"
          >
            Create Sprint
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <Input
          placeholder="Search backlog issues..."
          prefix={<SearchOutlined className="text-slate-400" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="max-w-xs text-xs"
        />

        {epics.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-xs font-semibold text-slate-400">Epic:</span>
            <button
              type="button"
              onClick={() => setSelectedEpicId('ALL')}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${
                selectedEpicId === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {epics.map((ep) => (
              <button
                key={ep.id}
                type="button"
                onClick={() => setSelectedEpicId(ep.id)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${
                  selectedEpicId === ep.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {ep.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Epics Sidebar + Sprints Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        {/* Epics Panel */}
        {showEpicsPanel && (
          <div className="lg:col-span-1 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Epics ({epics.length})
              </span>
              <Button
                size="small"
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => setEpicModalOpen(true)}
                className="text-xs"
              >
                New Epic
              </Button>
            </div>

            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto">
              {epics.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No epics created yet.</div>
              ) : (
                epics.map((ep) => (
                  <div
                    key={ep.id}
                    onClick={() => setSelectedEpicId(selectedEpicId === ep.id ? 'ALL' : ep.id)}
                    className={`p-3 rounded-lg border transition cursor-pointer ${
                      selectedEpicId === ep.id
                        ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                        {ep.name}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ep.color || '#7c3aed' }}
                      />
                    </div>
                    {ep.summary && <p className="text-[11px] text-slate-500 truncate">{ep.summary}</p>}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{ep.issueCount || 0} issues</span>
                      <span>{ep.progress || 0}% done</span>
                    </div>
                    <Progress
                      percent={ep.progress || 0}
                      size="small"
                      strokeColor={ep.color || '#7c3aed'}
                      showInfo={false}
                      className="!mt-1 !mb-0"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Sprints and Backlog List */}
        <div className={`flex flex-col gap-5 ${showEpicsPanel ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          {/* Active Sprint Container */}
          {activeSprint && (
            <SprintContainer
              sprint={activeSprint}
              issues={activeSprintIssues}
              allSprints={projectSprints}
              epics={epics}
              onSelectIssue={setSelectedIssueId}
              onMoveToSprint={handleMoveToSprint}
              onStartSprint={(s) => setStartModal({ open: true, sprint: s })}
              onCompleteSprint={(s, iss) => setCompleteModal({ open: true, sprint: s, issues: iss })}
              onDeleteSprint={deleteSprintAction}
              onQuickCreate={handleQuickCreate}
            />
          )}

          {/* Future Sprints */}
          {futureSprints.map((fs) => {
            const fsIssues = filteredIssues.filter((i) => i.sprintId === fs.id);
            return (
              <SprintContainer
                key={fs.id}
                sprint={fs}
                issues={fsIssues}
                allSprints={projectSprints}
                epics={epics}
                onSelectIssue={setSelectedIssueId}
                onMoveToSprint={handleMoveToSprint}
                onStartSprint={(s) => setStartModal({ open: true, sprint: s })}
                onCompleteSprint={(s, iss) => setCompleteModal({ open: true, sprint: s, issues: iss })}
                onDeleteSprint={deleteSprintAction}
                onQuickCreate={handleQuickCreate}
              />
            );
          })}

          {/* Backlog Issues Container */}
          <SprintContainer
            sprint={null}
            issues={backlogIssues}
            allSprints={projectSprints}
            epics={epics}
            onSelectIssue={setSelectedIssueId}
            onMoveToSprint={handleMoveToSprint}
            onStartSprint={(s) => setStartModal({ open: true, sprint: s })}
            onCompleteSprint={(s, iss) => setCompleteModal({ open: true, sprint: s, issues: iss })}
            onDeleteSprint={deleteSprintAction}
            onQuickCreate={handleQuickCreate}
          />
        </div>
      </div>

      {/* Start Sprint Modal */}
      <StartSprintModal
        open={startModal.open}
        sprint={startModal.sprint}
        onClose={() => setStartModal({ open: false, sprint: null })}
        onStartSprint={startSprintAction}
      />

      {/* Complete Sprint Modal */}
      <CompleteSprintModal
        open={completeModal.open}
        sprint={completeModal.sprint}
        sprintIssues={completeModal.issues}
        futureSprints={futureSprints}
        onClose={() => setCompleteModal({ open: false, sprint: null, issues: [] })}
        onCompleteSprint={completeSprintAction}
      />

      {/* Create Epic Modal */}
      <CreateEpicModal
        open={epicModalOpen}
        projectId={currentProjectId}
        onClose={() => setEpicModalOpen(false)}
        onEpicCreated={() => {}}
      />
    </div>
  );
}

export default Backlog;
