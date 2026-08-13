import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tabs,
  Input,
  Select,
  Button,
  Tag,
  Avatar,
  Tooltip,
  Space,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { ISSUE_TYPES, ISSUE_STATUSES, ISSUE_PRIORITIES } from '../constants/jira';

function Work() {
  const { filter = 'my-tasks' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    issues,
    projects,
    moveIssueStatus,
    setSelectedIssueId,
    setCreateIssueModalOpen,
    setViewScope,
  } = useProject();

  useEffect(() => {
    setViewScope('mine');
  }, [setViewScope]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const handleTabChange = (key) => {
    navigate(`/work/${key}`);
  };

  const today = new Date().toISOString().split('T')[0];

  // Filter tasks based on route subpath & filters
  const filteredIssues = issues.filter((issue) => {
    if ((filter === 'assigned' || filter === 'my-tasks') && issue.assignee?.id !== user?.id) {
      return false;
    }
    if (filter === 'created' && issue.reporter?.id !== user?.id) {
      return false;
    }
    if (
      search &&
      !issue.title.toLowerCase().includes(search.toLowerCase()) &&
      !issue.key.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (statusFilter === 'OVERDUE') {
      if (issue.status === 'DONE' || !issue.dueDate || issue.dueDate >= today) return false;
    } else if (statusFilter === 'DUE_TODAY') {
      if (issue.status === 'DONE' || issue.dueDate !== today) return false;
    } else if (statusFilter !== 'ALL' && issue.status !== statusFilter) {
      return false;
    }
    if (priorityFilter !== 'ALL' && issue.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      width: 60,
      render: (type) => {
        const config = ISSUE_TYPES[type] || ISSUE_TYPES.Task;
        return (
          <Tooltip title={config.label}>
            <span className="p-1 rounded bg-slate-100 flex items-center justify-center w-6 h-6">
              {config.icon}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Key',
      dataIndex: 'key',
      width: 110,
      render: (key) => (
        <span className="font-mono text-xs font-semibold text-slate-600 hover:text-blue-600">
          {key}
        </span>
      ),
    },
    {
      title: 'Summary',
      dataIndex: 'title',
      render: (title, record) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-800 hover:text-blue-600 transition">
            {title}
          </span>
          <span className="text-[11px] text-slate-400">{record.projectName}</span>
        </div>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      width: 120,
      render: (priority) => {
        const config = ISSUE_PRIORITIES[priority] || ISSUE_PRIORITIES.MEDIUM;
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            {config.icon}
            <span>{config.label}</span>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 150,
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
      title: 'Due Date',
      dataIndex: 'dueDate',
      width: 130,
      render: (dueDate) => (
        <span className="text-xs text-slate-600 flex items-center gap-1">
          <CalendarOutlined className="text-slate-400" /> {dueDate}
        </span>
      ),
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      width: 160,
      render: (assignee) => (
        <div className="flex items-center gap-2">
          <Avatar src={assignee?.avatar} size={22} icon={<UserOutlined />} />
          <span className="text-xs text-slate-700 truncate">{assignee?.name || 'Unassigned'}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight !mb-0">Your Work</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track tasks and issues assigned to you or created by you across all projects.
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

      {/* Tabs & Filters */}
      <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <Tabs
          activeKey={filter}
          onChange={handleTabChange}
          className="!mb-0"
          items={[
            { key: 'my-tasks', label: 'My Tasks' },
            { key: 'assigned', label: 'Assigned to Me' },
            { key: 'created', label: 'Created by Me' },
          ]}
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            placeholder="Filter tasks..."
            prefix={<SearchOutlined className="text-slate-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            size="small"
            style={{ width: 170 }}
            className="text-xs"
          />

          <Select
            size="small"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
            options={[
              { value: 'ALL', label: 'All Status' },
              ...Object.keys(ISSUE_STATUSES).map((k) => ({
                value: k,
                label: ISSUE_STATUSES[k].label,
              })),
              { value: 'DUE_TODAY', label: 'Due Today' },
              { value: 'OVERDUE', label: 'Overdue' },
            ]}
          />

          <Select
            size="small"
            value={priorityFilter}
            onChange={setPriorityFilter}
            style={{ width: 120 }}
            options={[
              { value: 'ALL', label: 'All Priority' },
              ...Object.keys(ISSUE_PRIORITIES).map((k) => ({
                value: k,
                label: ISSUE_PRIORITIES[k].label,
              })),
            ]}
          />
        </div>
      </div>

      {/* Tasks Table */}
      <Card bordered={false} className="shadow-sm border border-slate-200/80">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredIssues}
          pagination={{ pageSize: 10, showSizeChanger: false }}
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

export default Work;
