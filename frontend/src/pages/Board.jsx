import { useState, useMemo, useEffect } from 'react';
import {
  Input,
  Button,
  Select,
  Avatar,
  Tag,
  Tooltip,
  Dropdown,
  Space,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  ThunderboltFilled,
  EllipsisOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { ISSUE_TYPES, ISSUE_PRIORITIES, KANBAN_COLUMNS } from '../constants/jira';

function Board() {
  const { user } = useAuth();
  const {
    issues,
    projects,
    activeProjectKey,
    setActiveProjectKey,
    activeProject,
    teamMembers,
    moveIssueStatus,
    setSelectedIssueId,
    setCreateIssueModalOpen,
    setViewScope,
  } = useProject();

  useEffect(() => {
    setViewScope('all');
  }, [setViewScope]);

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedAssignee, setSelectedAssignee] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [onlyMyIssues, setOnlyMyIssues] = useState(false);

  // Filtered issues calculation
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Project filter
      if (activeProjectKey !== 'ALL' && issue.projectKey !== activeProjectKey) {
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
  }, [issues, activeProjectKey, search, selectedType, selectedAssignee, onlyMyIssues, selectedPriority, user]);

  return (
    <div className="flex flex-col gap-4">
      {/* Board Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight !mb-0">
              {activeProject ? `${activeProject.name} Board` : 'Kanban Board'}
            </h1>
            {activeProject && (
              <Tag color="blue" className="text-xs">
                {activeProject.key}
              </Tag>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage workflow stages, assignees, and delivery milestones.
          </p>
        </div>

        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateIssueModalOpen(true)}
            className="bg-blue-600 hover:!bg-blue-700"
          >
            Create Issue
          </Button>
        </Space>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            placeholder="Search board..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            size="small"
            style={{ width: 180 }}
            className="text-xs"
          />

          <Select
            size="small"
            value={activeProjectKey}
            onChange={setActiveProjectKey}
            style={{ width: 150 }}
            options={[
              { value: 'ALL', label: 'All Projects' },
              ...projects.map((p) => ({ value: p.key, label: `${p.key} - ${p.name}` })),
            ]}
          />

          {/* Quick Assignee Avatar Filter Pills */}
          <div className="flex items-center gap-1 pl-1">
            <Tooltip title="Filter: All Assignees">
              <button
                onClick={() => setSelectedAssignee('ALL')}
                className={`text-xs px-2 py-0.5 rounded-full border transition ${
                  selectedAssignee === 'ALL'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All
              </button>
            </Tooltip>
            {teamMembers.map((member) => (
              <Tooltip key={member.id} title={member.name}>
                <div
                  onClick={() =>
                    setSelectedAssignee((prev) => (prev === member.id ? 'ALL' : member.id))
                  }
                  className={`cursor-pointer rounded-full p-0.5 transition ${
                    selectedAssignee === member.id
                      ? 'ring-2 ring-blue-600 ring-offset-1 scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Avatar size={24} icon={<UserOutlined />} />
                </div>
              </Tooltip>
            ))}
          </div>

          <Button
            size="small"
            type={onlyMyIssues ? 'primary' : 'default'}
            onClick={() => setOnlyMyIssues((prev) => !prev)}
            className="text-xs"
          >
            Only My Issues
          </Button>

          <Select
            size="small"
            value={selectedType}
            onChange={setSelectedType}
            style={{ width: 110 }}
            options={[
              { value: 'ALL', label: 'All Types' },
              ...Object.keys(ISSUE_TYPES).map((k) => ({ value: k, label: ISSUE_TYPES[k].label })),
            ]}
          />

          <Select
            size="small"
            value={selectedPriority}
            onChange={setSelectedPriority}
            style={{ width: 110 }}
            options={[
              { value: 'ALL', label: 'All Priority' },
              ...Object.keys(ISSUE_PRIORITIES).map((k) => ({
                value: k,
                label: ISSUE_PRIORITIES[k].label,
              })),
            ]}
          />
        </div>

        {(search ||
          selectedType !== 'ALL' ||
          selectedAssignee !== 'ALL' ||
          selectedPriority !== 'ALL' ||
          onlyMyIssues ||
          activeProjectKey !== 'ALL') && (
          <Button
            size="small"
            type="text"
            onClick={() => {
              setSearch('');
              setSelectedType('ALL');
              setSelectedAssignee('ALL');
              setSelectedPriority('ALL');
              setOnlyMyIssues(false);
              setActiveProjectKey('ALL');
            }}
            className="text-xs text-blue-600"
          >
            Reset Filters
          </Button>
        )}
      </div>

      {/* Kanban Board Columns Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-start">
        {KANBAN_COLUMNS.map((column) => {
          const columnIssues = filteredIssues.filter((i) => i.status === column.id);

          return (
            <div
              key={column.id}
              className="kanban-column flex flex-col p-2.5 rounded-lg min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1.5 py-1 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {column.title}
                  </span>
                  <span className="text-xs font-medium text-slate-400 bg-white px-1.5 py-0.2 rounded-full border border-slate-200">
                    {columnIssues.length}
                  </span>
                </div>

                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateIssueModalOpen(true)}
                  className="!w-6 !h-6 flex items-center justify-center text-slate-400 hover:text-slate-700"
                />
              </div>

              {/* Column Cards List */}
              <div className="flex flex-col gap-2 flex-1">
                {columnIssues.map((issue) => {
                  const typeConfig = ISSUE_TYPES[issue.type] || ISSUE_TYPES.Task;
                  const priorityConfig =
                    ISSUE_PRIORITIES[issue.priority] || ISSUE_PRIORITIES.MEDIUM;
                  const completedSubtasks =
                    issue.subtasks?.filter((s) => s.completed).length || 0;
                  const totalSubtasks = issue.subtasks?.length || 0;

                  const statusMenuItems = KANBAN_COLUMNS.map((col) => ({
                    key: col.id,
                    label: (
                      <div className="flex items-center justify-between gap-3 text-xs py-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: col.color }}
                          />
                          <span>Move to {col.title}</span>
                        </div>
                        {issue.status === col.id && <CheckOutlined className="text-blue-600" />}
                      </div>
                    ),
                    onClick: () => moveIssueStatus(issue.id, col.id),
                  }));

                  return (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssueId(issue.id)}
                      className="kanban-card bg-white p-3 rounded-md border border-slate-200/80 shadow-xs flex flex-col gap-2.5 group"
                    >
                      {/* Card Header: Type, Key, and Quick Menu */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Tooltip title={typeConfig.label}>
                            <span className="flex items-center">{typeConfig.icon}</span>
                          </Tooltip>
                          <span className="font-mono text-xs font-semibold text-slate-500">
                            {issue.key}
                          </span>
                        </div>

                        <div onClick={(e) => e.stopPropagation()}>
                          <Dropdown
                            menu={{ items: statusMenuItems }}
                            trigger={['click']}
                            placement="bottomRight"
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<EllipsisOutlined />}
                              className="!w-5 !h-5 flex items-center justify-center text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition"
                            />
                          </Dropdown>
                        </div>
                      </div>

                      {/* Card Title */}
                      <h4 className="text-xs font-medium text-slate-800 line-clamp-2 leading-relaxed group-hover:text-blue-600 transition">
                        {issue.title}
                      </h4>

                      {/* Labels / Tags */}
                      {issue.labels?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {issue.labels.slice(0, 2).map((label) => (
                            <span
                              key={label}
                              className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-normal"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Subtasks Progress if any */}
                      {totalSubtasks > 0 && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <ThunderboltFilled className="text-[10px] text-amber-500" />
                          <span>
                            {completedSubtasks}/{totalSubtasks} subtasks
                          </span>
                        </div>
                      )}

                      {/* Card Footer: Priority, Story Points, Assignee */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-0.5">
                        <div className="flex items-center gap-1.5">
                          <Tooltip title={`Priority: ${priorityConfig.label}`}>
                            <span className="flex items-center">{priorityConfig.icon}</span>
                          </Tooltip>
                          {issue.storyPoints && (
                            <span className="text-[10px] font-mono px-1 rounded bg-slate-100 text-slate-600">
                              {issue.storyPoints}pt
                            </span>
                          )}
                        </div>

                        <Tooltip title={issue.assignee?.name || 'Unassigned'}>
                          <Avatar
                            src={issue.assignee?.avatar}
                            size={20}
                            icon={<UserOutlined />}
                            className="border border-slate-200"
                          />
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}

                {columnIssues.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-slate-200/80 rounded-md flex items-center justify-center text-xs text-slate-400">
                    No issues
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Board;
