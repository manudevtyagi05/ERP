import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Avatar,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { ISSUE_TYPES, ISSUE_STATUSES, ISSUE_PRIORITIES } from '../constants/jira';

function Issues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status') || 'ALL';

  const {
    issues,
    projects,
    activeProjectKey,
    setActiveProjectKey,
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
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Status filter from query param or local
      if (statusParam === 'OPEN' && !(issue.status === 'TODO' || issue.status === 'BACKLOG')) {
        return false;
      }
      if (statusParam === 'IN_PROGRESS' && !(issue.status === 'IN_PROGRESS' || issue.status === 'IN_REVIEW')) {
        return false;
      }
      if (statusParam === 'DONE' && issue.status !== 'DONE') {
        return false;
      }

      // Project filter
      if (activeProjectKey !== 'ALL' && issue.projectKey !== activeProjectKey) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'ALL' && issue.type !== typeFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && issue.priority !== priorityFilter) {
        return false;
      }

      // Assignee filter
      if (assigneeFilter !== 'ALL' && issue.assignee?.id !== assigneeFilter) {
        return false;
      }

      // Search query
      if (
        search &&
        !issue.title.toLowerCase().includes(search.toLowerCase()) &&
        !issue.key.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [issues, statusParam, activeProjectKey, typeFilter, priorityFilter, assigneeFilter, search]);

  const handleStatusTab = (status) => {
    if (status === 'ALL') {
      searchParams.delete('status');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ ...Object.fromEntries(searchParams), status });
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      width: 60,
      render: (type) => {
        const config = ISSUE_TYPES[type] || ISSUE_TYPES.Task;
        return (
          <Tooltip title={config.label}>
            <span className="p-1 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center w-6 h-6">
              {config.icon}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Key',
      dataIndex: 'key',
      width: 100,
      render: (key) => (
        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          {key}
        </span>
      ),
    },
    {
      title: 'Summary',
      dataIndex: 'title',
      render: (title, record) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition">
            {title}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{record.projectName}</span>
            {record.epic && (
              <span className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800 px-1 rounded">
                {record.epic}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 140,
      render: (status, record) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            size="small"
            value={status}
            onChange={(newStatus) => moveIssueStatus(record.id, newStatus)}
            style={{ width: '100%' }}
            options={Object.keys(ISSUE_STATUSES).map((k) => ({
              value: k,
              label: (
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ISSUE_STATUSES[k].badgeColor }}
                  />
                  <span>{ISSUE_STATUSES[k].label}</span>
                </div>
              ),
            }))}
            className="text-xs"
          />
        </div>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      width: 110,
      render: (priority) => {
        const config = ISSUE_PRIORITIES[priority] || ISSUE_PRIORITIES.MEDIUM;
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            {config.icon}
            <span>{config.label}</span>
          </div>
        );
      },
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      width: 150,
      render: (assignee) => (
        <div className="flex items-center gap-2">
          <Avatar src={assignee?.avatar} size={22} icon={<UserOutlined />} className="bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{assignee?.name || 'Unassigned'}</span>
        </div>
      ),
    },
    {
      title: 'Story Pts',
      dataIndex: 'storyPoints',
      width: 90,
      align: 'center',
      render: (pts) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
          {pts || 0}
        </span>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      width: 120,
      render: (dueDate) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
          <CalendarOutlined className="text-slate-400 dark:text-slate-500" /> {dueDate}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">All Issues</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full issue tracker across all sprints, backlogs, and epics.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateIssueModalOpen(true)}
          className="bg-blue-600 hover:!bg-blue-700"
        >
          Create Issue
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#131b2e] p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-3">
        {/* Quick Status Buttons */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 overflow-x-auto flex-nowrap min-w-0">
          {[
            { key: 'ALL', label: 'All Issues', count: issues.length },
            {
              key: 'OPEN',
              label: 'Open',
              count: issues.filter((i) => i.status === 'TODO' || i.status === 'BACKLOG').length,
            },
            {
              key: 'IN_PROGRESS',
              label: 'In Progress',
              count: issues.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'IN_REVIEW').length,
            },
            {
              key: 'DONE',
              label: 'Completed',
              count: issues.filter((i) => i.status === 'DONE').length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusTab(tab.key)}
              className={`text-xs px-3 py-1 rounded-md font-medium transition flex items-center gap-2 cursor-pointer flex-shrink-0 ${
                statusParam === tab.key
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  statusParam === tab.key
                    ? 'bg-blue-200/60 dark:bg-blue-800/60 text-blue-800 dark:text-blue-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
            <Input
              placeholder="Search issues by summary or key..."
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              size="small"
              className="text-xs w-full sm:w-56"
            />

            <Select
              size="small"
              value={activeProjectKey}
              onChange={setActiveProjectKey}
              className="w-full sm:w-36 text-xs"
              options={[
                { value: 'ALL', label: 'All Projects' },
                ...projects.map((p) => ({ value: p.key, label: p.name })),
              ]}
            />

            <Select
              size="small"
              value={typeFilter}
              onChange={setTypeFilter}
              className="w-28 text-xs"
              options={[
                { value: 'ALL', label: 'All Types' },
                ...Object.keys(ISSUE_TYPES).map((k) => ({ value: k, label: ISSUE_TYPES[k].label })),
              ]}
            />

            <Select
              size="small"
              value={priorityFilter}
              onChange={setPriorityFilter}
              className="w-28 text-xs"
              options={[
                { value: 'ALL', label: 'All Priority' },
                ...Object.keys(ISSUE_PRIORITIES).map((k) => ({
                  value: k,
                  label: ISSUE_PRIORITIES[k].label,
                })),
              ]}
            />

            <Select
              size="small"
              value={assigneeFilter}
              onChange={setAssigneeFilter}
              className="w-36 text-xs"
              options={[
                { value: 'ALL', label: 'All Assignees' },
                ...teamMembers.map((m) => ({ value: m.id, label: m.name })),
              ]}
            />
          </div>

          {(search ||
            typeFilter !== 'ALL' ||
            priorityFilter !== 'ALL' ||
            assigneeFilter !== 'ALL' ||
            activeProjectKey !== 'ALL') && (
            <Button
              size="small"
              type="text"
              onClick={() => {
                setSearch('');
                setTypeFilter('ALL');
                setPriorityFilter('ALL');
                setAssigneeFilter('ALL');
                setActiveProjectKey('ALL');
              }}
              className="text-xs text-blue-600 dark:text-blue-400"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Issues Table */}
      <Card variant="borderless" className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredIssues}
          pagination={{ pageSize: 12, showSizeChanger: false }}
          scroll={{ x: 850 }}
          onRow={(record) => ({
            onClick: () => setSelectedIssueId(record.id),
            className: 'cursor-pointer',
          })}
          className="jira-table"
        />
      </Card>
    </div>
  );
}

export default Issues;
