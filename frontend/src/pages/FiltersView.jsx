import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Table,
  Tag,
  Avatar,
  Tooltip,
  Modal,
  Form,
  Select,
  Segmented,
  App,
} from 'antd';
import {
  SearchOutlined,
  StarOutlined,
  StarFilled,
  PlusOutlined,
  FilterOutlined,
  CodeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { ISSUE_TYPES, ISSUE_PRIORITIES, ISSUE_STATUSES } from '../constants/jira';
import { createFilter, toggleFavoriteFilter } from '../services/filterService';
import { listIssues } from '../services/issueService';

const JQL_SUGGESTIONS = [
  'project = WEB AND status = "In Progress"',
  'assignee = currentUser() AND status != "Done"',
  'priority = Highest AND type = Bug',
  'sprint = "Active Sprint" AND status = "To Do"',
  'status = Done ORDER BY created DESC',
];

function FiltersView() {
  const {
    savedFilters,
    projects,
    activeProject,
    setSelectedIssueId,
    refreshData,
  } = useProject();

  const [mode, setMode] = useState('JQL'); // 'JQL' | 'BASIC'
  const [jqlQuery, setJqlQuery] = useState('project = WEB AND status = "In Progress"');
  const [selectedFilterId, setSelectedFilterId] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const { message } = App.useApp();

  // Execute JQL query
  const executeQuery = async (queryText) => {
    setSearching(true);
    try {
      const results = await listIssues({ jql: queryText, scope: 'all' });
      setSearchResults(results || []);
    } catch (err) {
      message.error('Invalid query syntax or error executing search');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    executeQuery(jqlQuery);
  }, []);

  const handleApplyFilter = (filt) => {
    setSelectedFilterId(filt.id);
    setJqlQuery(filt.query);
    executeQuery(filt.query);
  };

  const handleToggleFavorite = async (e, filterId) => {
    e.stopPropagation();
    try {
      await toggleFavoriteFilter(filterId);
      refreshData();
    } catch (err) {
      message.error('Failed to toggle favorite');
    }
  };

  const handleSaveFilter = async (values) => {
    setSubmitting(true);
    try {
      await createFilter({
        name: values.name,
        description: values.description || '',
        query: jqlQuery,
        visibility: values.visibility || 'ORGANIZATION',
        isFavorite: true,
      });
      message.success(`Filter "${values.name}" saved!`);
      form.resetFields();
      setSaveModalOpen(false);
      refreshData();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to save filter');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 100,
      render: (key) => (
        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
          {key}
        </span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (type) => {
        const conf = ISSUE_TYPES[type] || ISSUE_TYPES.Task;
        return (
          <Tooltip title={conf.label}>
            <span className="text-xs flex items-center gap-1">
              {conf.icon} <span className="text-[11px]">{conf.label}</span>
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Summary',
      dataIndex: 'title',
      key: 'title',
      render: (title) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
          {title}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => {
        const conf = ISSUE_STATUSES[status] || ISSUE_STATUSES.TODO;
        return (
          <Tag color={conf.tagColor} className="text-[10px] font-bold">
            {conf.label}
          </Tag>
        );
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => {
        const conf = ISSUE_PRIORITIES[priority] || ISSUE_PRIORITIES.MEDIUM;
        return (
          <span className="flex items-center gap-1 text-xs">
            {conf.icon} <span className="text-[11px]">{conf.label}</span>
          </span>
        );
      },
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 140,
      render: (assignee) =>
        assignee ? (
          <div className="flex items-center gap-1.5">
            <Avatar size={20} className="bg-blue-600 text-[10px]">
              {assignee.name?.[0] || 'U'}
            </Avatar>
            <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
              {assignee.name}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">
            JQL Search & Saved Filters
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Query across issues with Jira Query Language (JQL) syntax or select saved filters.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setSaveModalOpen(true)}
          className="text-xs font-semibold !bg-blue-600 hover:!bg-blue-700"
        >
          Save Filter
        </Button>
      </div>

      {/* Main Grid: Sidebar Filters + JQL Search Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        {/* Left Saved Filters Sidebar */}
        <div className="lg:col-span-1 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Saved Filters ({savedFilters.length})
          </div>

          <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto">
            {savedFilters.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No saved filters yet.</div>
            ) : (
              savedFilters.map((filt) => (
                <div
                  key={filt.id}
                  onClick={() => handleApplyFilter(filt)}
                  className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                    selectedFilterId === filt.id
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                      {filt.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{filt.query}</div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(e, filt.id)}
                    className="text-xs text-amber-500 hover:scale-125 transition-transform"
                  >
                    {filt.isFavorite ? <StarFilled /> : <StarOutlined className="text-slate-300" />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Search Box & Results Matrix */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* JQL Query Box */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <CodeOutlined className="text-blue-500" /> JQL Query Editor
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Syntax: field = &quot;value&quot; AND status = &quot;In Progress&quot;
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={jqlQuery}
                onChange={(e) => setJqlQuery(e.target.value)}
                onPressEnter={() => executeQuery(jqlQuery)}
                placeholder="e.g. project = WEB AND priority = Highest"
                className="font-mono text-xs"
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => executeQuery(jqlQuery)}
                loading={searching}
                className="text-xs font-semibold !bg-blue-600 hover:!bg-blue-700"
              >
                Search
              </Button>
            </div>

            {/* Quick JQL Suggestion Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Try:</span>
              {JQL_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => {
                    setJqlQuery(sug);
                    executeQuery(sug);
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-slate-700 transition"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Results Table */}
          <Card
            variant="borderless"
            className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] overflow-hidden"
            title={
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Matching Issues ({searchResults.length})
              </span>
            }
          >
            <Table
              dataSource={searchResults}
              columns={columns}
              rowKey="id"
              loading={searching}
              onRow={(record) => ({
                onClick: () => setSelectedIssueId(record.id),
                className: 'cursor-pointer hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition',
              })}
              pagination={{ pageSize: 10, size: 'small' }}
              className="jira-table"
            />
          </Card>
        </div>
      </div>

      {/* Save Filter Modal */}
      <Modal
        title={<div className="text-base font-semibold text-slate-800 dark:text-slate-100">Save Filter</div>}
        open={saveModalOpen}
        onCancel={() => setSaveModalOpen(false)}
        onOk={() => form.submit()}
        okText="Save Filter"
        confirmLoading={submitting}
        destroyOnHidden
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveFilter} className="mt-3" requiredMark={false}>
          <Form.Item
            name="name"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Filter Name</span>}
            rules={[{ required: true, message: 'Filter name is required' }]}
          >
            <Input placeholder="e.g. My High Priority Blockers" />
          </Form.Item>

          <Form.Item
            name="visibility"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Visibility</span>}
            initialValue="ORGANIZATION"
          >
            <Select
              options={[
                { value: 'ORGANIZATION', label: 'Shared with Organization' },
                { value: 'PROJECT', label: 'Project Members' },
                { value: 'PRIVATE', label: 'Private (Only Me)' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Description</span>}
          >
            <Input.TextArea rows={2} placeholder="Filter purpose and scope" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default FiltersView;
