import { useState, useMemo, useEffect } from 'react';
import {
  Input,
  Button,
  Select,
  Avatar,
  Tag,
  Tooltip,
  Dropdown,
  App,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  ThunderboltFilled,
  SettingOutlined,
  CheckCircleOutlined,
  WarningFilled,
  FireOutlined,
} from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { ISSUE_TYPES, ISSUE_PRIORITIES, ISSUE_STATUSES, KANBAN_COLUMNS } from '../constants/jira';
import ColumnManagerModal from '../components/board/ColumnManagerModal';
import CompleteSprintModal from '../components/sprints/CompleteSprintModal';
import { getBoard, updateBoard } from '../services/boardService';

const PRIORITY_BORDER_MAP = {
  HIGHEST: 'border-l-4 border-l-red-500',
  HIGH: 'border-l-4 border-l-orange-500',
  MEDIUM: 'border-l-4 border-l-amber-400',
  LOW: 'border-l-4 border-l-blue-400',
  LOWEST: 'border-l-4 border-l-slate-400',
};

function KanbanCard({ issue, onSelect, onDragStart, onStatusChange }) {
  const typeConfig = ISSUE_TYPES[issue.type] || ISSUE_TYPES.Task;
  const priorityConfig = ISSUE_PRIORITIES[issue.priority] || ISSUE_PRIORITIES.MEDIUM;
  const borderClass = PRIORITY_BORDER_MAP[issue.priority] || 'border-l-4 border-l-blue-400';

  const completedSubtasks = (issue.subtasks || []).filter((s) => s.completed).length;
  const totalSubtasks = (issue.subtasks || []).length;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, issue.id)}
      onClick={() => onSelect(issue.id)}
      className={`bg-white dark:bg-[#131b2e] rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-grab active:cursor-grabbing flex flex-col gap-2 group ${borderClass}`}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
          {issue.key}
        </span>
        <Tooltip title={`Priority: ${priorityConfig.label}`}>
          <span className="flex items-center text-xs">{priorityConfig.icon}</span>
        </Tooltip>
      </div>

      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2 leading-relaxed">
        {issue.title}
      </p>

      {issue.epic && (
        <span className="self-start text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300">
          {issue.epic}
        </span>
      )}

      {totalSubtasks > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <CheckCircleOutlined className="text-emerald-500 text-xs" />
          <span>
            {completedSubtasks}/{totalSubtasks} subtasks
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-0.5">
        <div className="flex items-center gap-1.5">
          <Tooltip title={typeConfig.label}>
            <span className="text-xs">{typeConfig.icon}</span>
          </Tooltip>
          <span className="font-bold text-[11px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {issue.storyPoints || 0} pts
          </span>
        </div>

        {issue.assignee ? (
          <Tooltip title={`Assignee: ${issue.assignee.name}`}>
            <Avatar size={24} className="bg-blue-600 text-[10px] font-bold shadow-xs">
              {issue.assignee.name?.[0] || 'U'}
            </Avatar>
          </Tooltip>
        ) : (
          <Avatar size={24} icon={<UserOutlined />} className="bg-slate-200 dark:bg-slate-700 text-[10px]" />
        )}
      </div>
    </div>
  );
}

function Board() {
  const { user } = useAuth();
  const {
    issues,
    projects,
    activeProjectKey,
    setActiveProjectKey,
    activeProject,
    sprints,
    activeSprint,
    moveIssueStatus,
    setSelectedIssueId,
    setCreateIssueModalOpen,
    setViewScope,
    completeSprintAction,
    addIssue,
  } = useProject();

  useEffect(() => {
    setViewScope('all');
  }, [setViewScope]);

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [onlyMyIssues, setOnlyMyIssues] = useState(false);
  const [boardMode, setBoardMode] = useState('SCRUM'); // 'SCRUM' or 'KANBAN'
  const [columns, setColumns] = useState(KANBAN_COLUMNS);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [draggedIssueId, setDraggedIssueId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);
  const { message } = App.useApp();

  const currentProjectId = activeProject?.id || projects[0]?.id;

  // Load custom board columns from backend if available
  useEffect(() => {
    if (currentProjectId) {
      getBoard(currentProjectId)
        .then((b) => {
          if (b && b.columns?.length) {
            setColumns(b.columns);
          }
        })
        .catch(() => {});
    }
  }, [currentProjectId]);

  const handleSaveColumns = async (newCols) => {
    if (currentProjectId) {
      await updateBoard(currentProjectId, { columns: newCols });
      setColumns(newCols);
    }
  };

  // Filtered issues calculation
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Project filter
      if (activeProjectKey !== 'ALL' && issue.projectKey !== activeProjectKey) {
        return false;
      }
      // If Scrum mode and activeSprint exists, only show active sprint issues
      if (boardMode === 'SCRUM' && activeSprint && issue.sprintId !== activeSprint.id) {
        return false;
      }
      // Search filter
      if (
        search &&
        !issue.title.toLowerCase().includes(search.toLowerCase()) &&
        !issue.key.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      // Type filter
      if (selectedType !== 'ALL' && issue.type !== selectedType) {
        return false;
      }
      // Assignee filter
      if (selectedAssignee !== 'ALL' && issue.assignee?.id !== selectedAssignee) {
        return false;
      }
      // My issues toggle
      if (onlyMyIssues && issue.assignee?.id !== user?.id) {
        return false;
      }
      // Priority filter
      if (selectedPriority !== 'ALL' && issue.priority !== selectedPriority) {
        return false;
      }
      return true;
    });
  }, [
    issues,
    activeProjectKey,
    boardMode,
    activeSprint,
    search,
    selectedType,
    selectedAssignee,
    onlyMyIssues,
    selectedPriority,
    user,
  ]);

  // Story points calculation for active sprint
  const sprintTodoPts = filteredIssues
    .filter((i) => i.status === 'TODO' || i.status === 'BACKLOG')
    .reduce((s, i) => s + (i.storyPoints || 0), 0);
  const sprintInProgPts = filteredIssues
    .filter((i) => i.status === 'IN_PROGRESS' || i.status === 'IN_REVIEW')
    .reduce((s, i) => s + (i.storyPoints || 0), 0);
  const sprintDonePts = filteredIssues
    .filter((i) => i.status === 'DONE')
    .reduce((s, i) => s + (i.storyPoints || 0), 0);

  // Drag and Drop handlers
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedIssueId(id);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    setDragOverColId(colId);
  };

  const handleDragLeave = () => {
    setDragOverColId(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColId(null);
    const issueId = e.dataTransfer.getData('text/plain') || draggedIssueId;
    if (!issueId) return;

    try {
      await moveIssueStatus(issueId, targetStatus);
      message.success(`Issue moved to ${targetStatus.replace('_', ' ')}`);
    } catch (err) {
      message.error('Failed to update issue status');
    }
  };

  const handleQuickCreateInColumn = async (status) => {
    await addIssue({
      projectKey: activeProject?.key || 'WEB',
      title: 'New Task',
      status,
      sprintId: activeSprint?.id || null,
      type: 'Task',
      priority: 'MEDIUM',
      storyPoints: 3,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Board Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">
              {activeProject ? `${activeProject.name} Board` : 'Active Sprint & Kanban Board'}
            </h1>
            {activeProject && (
              <Tag color="blue" className="text-xs font-mono font-bold">
                {activeProject.key}
              </Tag>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Drag and drop issues across columns to update workflow status in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setBoardMode('SCRUM')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                boardMode === 'SCRUM'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Scrum Sprint
            </button>
            <button
              type="button"
              onClick={() => setBoardMode('KANBAN')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                boardMode === 'KANBAN'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Kanban
            </button>
          </div>

          <Button
            icon={<SettingOutlined />}
            onClick={() => setColumnModalOpen(true)}
            className="text-xs font-semibold"
          >
            Configure Columns
          </Button>

          {activeSprint && boardMode === 'SCRUM' && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setCompleteModalOpen(true)}
              className="text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 shadow-sm"
            >
              Complete Sprint
            </Button>
          )}

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateIssueModalOpen(true)}
            className="text-xs font-bold !bg-blue-600 hover:!bg-blue-700 shadow-sm"
          >
            Create Issue
          </Button>
        </div>
      </div>

      {/* Active Sprint Banner */}
      {boardMode === 'SCRUM' && activeSprint && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border border-blue-200/80 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                {activeSprint.name}
              </span>
              <Tag color="processing" className="text-[10px] font-bold uppercase !m-0">
                In Progress
              </Tag>
            </div>
            {activeSprint.goal && (
              <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                Goal: {activeSprint.goal}
              </p>
            )}
          </div>

          {/* Tri-color Story points counters */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <Tooltip title="To Do Story Points">
              <span className="px-2.5 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                🔵 {sprintTodoPts} pts
              </span>
            </Tooltip>
            <Tooltip title="In Progress Story Points">
              <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                🟡 {sprintInProgPts} pts
              </span>
            </Tooltip>
            <Tooltip title="Done Story Points">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                🟢 {sprintDonePts} pts
              </span>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2.5 bg-white dark:bg-[#131b2e] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <Input
          placeholder="Filter board..."
          prefix={<SearchOutlined className="text-slate-400" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="w-48 text-xs rounded-lg"
        />

        <button
          type="button"
          onClick={() => setOnlyMyIssues(!onlyMyIssues)}
          className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
            onlyMyIssues
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          Only My Issues
        </button>

        <Select
          value={selectedType}
          onChange={setSelectedType}
          style={{ width: 120 }}
          className="text-xs font-semibold"
          options={[
            { value: 'ALL', label: 'All Types' },
            ...Object.keys(ISSUE_TYPES).map((k) => ({
              value: k,
              label: ISSUE_TYPES[k].label,
            })),
          ]}
        />

        <Select
          value={selectedPriority}
          onChange={setSelectedPriority}
          style={{ width: 130 }}
          className="text-xs font-semibold"
          options={[
            { value: 'ALL', label: 'All Priorities' },
            ...Object.keys(ISSUE_PRIORITIES).map((k) => ({
              value: k,
              label: ISSUE_PRIORITIES[k].label,
            })),
          ]}
        />
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-start">
        {columns.map((col) => {
          const colIssues = filteredIssues.filter((i) => i.status === col.status || i.status === col.id);
          const colPoints = colIssues.reduce((s, i) => s + (i.storyPoints || 0), 0);
          const isOverWip = col.wipLimit > 0 && colIssues.length > col.wipLimit;
          const isDragTarget = dragOverColId === (col.status || col.id);

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.status || col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status || col.id)}
              className={`flex flex-col rounded-2xl p-3 bg-slate-100/60 dark:bg-[#0e1526]/80 border transition-all min-h-[520px] ${
                isDragTarget
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-400/40'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-xs"
                    style={{ backgroundColor: col.color || '#3b82f6' }}
                  />
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                    {col.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isOverWip && (
                    <Tooltip title={`WIP limit exceeded (Max: ${col.wipLimit})`}>
                      <WarningFilled className="text-amber-500 text-xs" />
                    </Tooltip>
                  )}
                  <span
                    className={`font-extrabold text-[10px] px-2 py-0.5 rounded-full ${
                      isOverWip
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs'
                    }`}
                  >
                    {colIssues.length}
                    {col.wipLimit > 0 ? `/${col.wipLimit}` : ''} • {colPoints}p
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex flex-col gap-3 flex-1">
                {colIssues.length === 0 ? (
                  <div className="py-14 border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl text-center text-xs text-slate-400 dark:text-slate-500">
                    Drop issues here
                  </div>
                ) : (
                  colIssues.map((issue) => (
                    <KanbanCard
                      key={issue.id}
                      issue={issue}
                      onSelect={setSelectedIssueId}
                      onDragStart={handleDragStart}
                      onStatusChange={moveIssueStatus}
                    />
                  ))
                )}
              </div>

              {/* Quick Create in column */}
              <button
                type="button"
                onClick={() => handleQuickCreateInColumn(col.status || col.id)}
                className="mt-3 py-1.5 text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-bold flex items-center justify-center gap-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
              >
                <PlusOutlined className="text-[10px]" /> Create ticket
              </button>
            </div>
          );
        })}
      </div>

      {/* Column Manager Modal */}
      <ColumnManagerModal
        open={columnModalOpen}
        columns={columns}
        onClose={() => setColumnModalOpen(false)}
        onSaveColumns={handleSaveColumns}
      />

      {/* Complete Sprint Modal */}
      <CompleteSprintModal
        open={completeModalOpen}
        sprint={activeSprint}
        sprintIssues={filteredIssues}
        futureSprints={sprints.filter((s) => s.status === 'FUTURE')}
        onClose={() => setCompleteModalOpen(false)}
        onCompleteSprint={completeSprintAction}
      />
    </div>
  );
}

export default Board;
