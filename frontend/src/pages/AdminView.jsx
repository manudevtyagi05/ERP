import { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Tag,
  Avatar,
  Select,
  Input,
  Modal,
  Form,
  Space,
  App,
} from 'antd';
import {
  SafetyCertificateOutlined,
  UserOutlined,
  AppstoreOutlined,
  BranchesOutlined,
  AuditOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { listAuditLogs } from '../services/auditLogService';
import { ISSUE_TYPES, ISSUE_PRIORITIES, ISSUE_STATUSES } from '../constants/jira';

function AdminView() {
  const { teamMembers, projects } = useProject();
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [customFields, setCustomFields] = useState([
    { id: 'cf-1', name: 'Environment', type: 'Select', options: 'Dev, Staging, Production', applicableTo: 'Bug, Task' },
    { id: 'cf-2', name: 'Customer Impact', type: 'Select', options: 'Critical, Moderate, Low', applicableTo: 'Bug' },
    { id: 'cf-3', name: 'Release Notes Snippet', type: 'Long Text', options: '—', applicableTo: 'Story, Feature' },
  ]);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    setLoadingLogs(true);
    listAuditLogs({ limit: 50 })
      .then((data) => setAuditLogs(data || []))
      .catch(() => {})
      .finally(() => setLoadingLogs(false));
  }, [user?.role]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <SafetyCertificateOutlined className="text-4xl text-rose-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Access Denied</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          You need Administrator permissions to access the Organization Admin Console.
        </p>
      </div>
    );
  }

  const handleAddField = (values) => {
    setCustomFields([
      ...customFields,
      {
        id: `cf-${Date.now()}`,
        name: values.name,
        type: values.type,
        options: values.options || '—',
        applicableTo: values.applicableTo || 'All Issue Types',
      },
    ]);
    message.success('Custom field created!');
    form.resetFields();
    setFieldModalOpen(false);
  };

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center gap-2.5">
          <Avatar size={28} className="bg-blue-600 font-semibold text-xs">
            {record.name?.[0] || 'U'}
          </Avatar>
          <div>
            <div className="font-semibold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              {record.name}
              {record.role === 'ADMIN' && <CrownOutlined className="text-amber-500 text-xs" />}
            </div>
            <div className="text-[11px] text-slate-400">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (d) => <span className="text-xs text-slate-600 dark:text-slate-300">{d}</span>,
    },
    {
      title: 'Global Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'ADMIN' ? 'gold' : role === 'SUPERVISOR' ? 'blue' : 'default'} className="text-xs font-semibold">
          {role}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => (
        <Tag color={active ? 'success' : 'error'} className="text-[11px]">
          {active ? 'Active' : 'Suspended'}
        </Tag>
      ),
    },
  ];

  const auditColumns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <Tag color="blue" className="text-[10px] font-bold uppercase">
          {action}
        </Tag>
      ),
    },
    {
      title: 'Object',
      key: 'object',
      render: (_, record) => (
        <div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {record.objectType}: {record.objectLabel || record.objectId}
          </span>
        </div>
      ),
    },
    {
      title: 'Actor',
      dataIndex: 'actor',
      key: 'actor',
      render: (actor) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          {actor?.name || 'System'}
        </span>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t) => (
        <span className="text-[11px] text-slate-400 font-mono">
          {new Date(t).toLocaleString()}
        </span>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'users',
      label: (
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <UserOutlined /> Users & Roles ({teamMembers.length})
        </span>
      ),
      children: (
        <Table
          dataSource={teamMembers}
          columns={userColumns}
          rowKey="id"
          pagination={false}
          className="jira-table"
        />
      ),
    },
    {
      key: 'workflows',
      label: (
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <BranchesOutlined /> Custom Workflows
        </span>
      ),
      children: (
        <div className="flex flex-col gap-4 py-2">
          <p className="text-xs text-slate-500">
            Standard Software Development Workflow Engine. Issues progress through stages with role authorization checks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { title: '1. Backlog', desc: 'Requirements & planning pool', color: '#94a3b8' },
              { title: '2. To Do', desc: 'Committed to active sprint', color: '#60a5fa' },
              { title: '3. In Progress', desc: 'Active implementation in branch', color: '#3b82f6' },
              { title: '4. Code Review', desc: 'Pull request under peer review', color: '#f59e0b' },
              { title: '5. Done', desc: 'Merged & deployed to production', color: '#22c55e' },
            ].map((st) => (
              <div
                key={st.title}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{st.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'custom_fields',
      label: (
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <AppstoreOutlined /> Custom Fields
        </span>
      ),
      children: (
        <div className="flex flex-col gap-3 py-2">
          <div className="flex justify-end">
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setFieldModalOpen(true)}
              className="text-xs font-semibold"
            >
              Add Custom Field
            </Button>
          </div>

          <Table
            dataSource={customFields}
            rowKey="id"
            pagination={false}
            columns={[
              { title: 'Field Name', dataIndex: 'name', key: 'name', render: (n) => <span className="font-bold text-xs">{n}</span> },
              { title: 'Field Type', dataIndex: 'type', key: 'type', render: (t) => <Tag color="blue" className="text-xs">{t}</Tag> },
              { title: 'Options / Values', dataIndex: 'options', key: 'options', render: (o) => <span className="text-xs text-slate-500">{o}</span> },
              { title: 'Applicable Issue Types', dataIndex: 'applicableTo', key: 'applicableTo', render: (a) => <span className="text-xs text-slate-500">{a}</span> },
            ]}
          />
        </div>
      ),
    },
    {
      key: 'audit',
      label: (
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <AuditOutlined /> Compliance Audit Logs ({auditLogs.length})
        </span>
      ),
      children: (
        <Table
          dataSource={auditLogs}
          columns={auditColumns}
          rowKey="id"
          loading={loadingLogs}
          pagination={{ pageSize: 10, size: 'small' }}
          className="jira-table"
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">
          Organization Administration & Governance
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure security permissions, custom field schemas, workflow state transitions, and audit logs.
        </p>
      </div>

      <Card variant="borderless" className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]">
        <Tabs items={tabItems} defaultActiveKey="users" />
      </Card>

      {/* Add Custom Field Modal */}
      <Modal
        title={<div className="text-base font-semibold text-slate-800 dark:text-slate-100">Add Custom Field</div>}
        open={fieldModalOpen}
        onCancel={() => setFieldModalOpen(false)}
        onOk={() => form.submit()}
        okText="Create Field"
        destroyOnHidden
        width={460}
      >
        <Form form={form} layout="vertical" onFinish={handleAddField} className="mt-3" requiredMark={false}>
          <Form.Item
            name="name"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Field Name</span>}
            rules={[{ required: true, message: 'Field name is required' }]}
          >
            <Input placeholder="e.g. Target Environment, Impact Level" />
          </Form.Item>

          <Form.Item
            name="type"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Field Type</span>}
            rules={[{ required: true }]}
            initialValue="Select"
          >
            <Select
              options={[
                { value: 'Text', label: 'Short Text' },
                { value: 'Long Text', label: 'Long Text / Markdown' },
                { value: 'Number', label: 'Number' },
                { value: 'Date', label: 'Date' },
                { value: 'Select', label: 'Dropdown Select' },
                { value: 'Checkbox', label: 'Checkbox Toggle' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="options"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Options (Comma separated)</span>}
          >
            <Input placeholder="Dev, Staging, Production" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AdminView;
