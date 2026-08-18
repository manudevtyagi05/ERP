import { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Avatar,
  Modal,
  Form,
  Input,
  Select,
  Dropdown,
  App,
} from 'antd';
import {
  PlusOutlined,
  AppstoreOutlined,
  UserOutlined,
  MoreOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { createComponent, deleteComponent } from '../services/componentService';

function ComponentsView() {
  const { components, projects, activeProject, activeProjectKey, teamMembers, refreshData } = useProject();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  const currentProjectId = activeProject?.id || projects[0]?.id;

  const filteredComponents = useMemo(() => {
    return components.filter((c) => {
      if (activeProjectKey !== 'ALL' && c.projectKey !== activeProjectKey) return false;
      return true;
    });
  }, [components, activeProjectKey]);

  const handleCreateComponent = async (values) => {
    setSubmitting(true);
    try {
      const leadMember = teamMembers.find((m) => m.id === values.leadId);
      const assigneeMember = teamMembers.find((m) => m.id === values.defaultAssigneeId);

      await createComponent({
        projectId: currentProjectId,
        name: values.name,
        description: values.description || '',
        lead: leadMember ? { id: leadMember.id, name: leadMember.name, email: leadMember.email } : null,
        defaultAssignee: assigneeMember ? { id: assigneeMember.id, name: assigneeMember.name, email: assigneeMember.email } : null,
      });
      message.success(`Component "${values.name}" created successfully!`);
      form.resetFields();
      setCreateModalOpen(false);
      refreshData();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to create component');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (componentId) => {
    try {
      await deleteComponent(componentId);
      message.success('Component deleted successfully');
      refreshData();
    } catch (err) {
      message.error('Failed to delete component');
    }
  };

  const columns = [
    {
      title: 'Component Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <div className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <AppstoreOutlined className="text-blue-500" />
            {name}
          </div>
          {record.description && (
            <div className="text-[11px] text-slate-400 mt-0.5">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Component Lead',
      dataIndex: 'lead',
      key: 'lead',
      render: (lead) =>
        lead ? (
          <div className="flex items-center gap-1.5">
            <Avatar size={22} className="bg-blue-600 text-[10px]">
              {lead.name?.[0] || 'U'}
            </Avatar>
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              {lead.name}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        ),
    },
    {
      title: 'Default Assignee',
      dataIndex: 'defaultAssignee',
      key: 'defaultAssignee',
      render: (assignee) =>
        assignee ? (
          <div className="flex items-center gap-1.5">
            <Avatar size={22} className="bg-emerald-600 text-[10px]">
              {assignee.name?.[0] || 'U'}
            </Avatar>
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              {assignee.name}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Project Default</span>
        ),
    },
    {
      title: 'Issues',
      dataIndex: 'issuesCount',
      key: 'issuesCount',
      render: (count, record) => (
        <span className="font-bold text-xs text-slate-700 dark:text-slate-300">
          {count || 0} issues ({record.completedCount || 0} resolved)
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'del',
                label: 'Delete Component',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDelete(record.id),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button size="small" type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">
              {activeProject ? `${activeProject.name} Components` : 'Project Components'}
            </h1>
            {activeProject && (
              <Tag color="blue" className="text-xs font-mono">
                {activeProject.key}
              </Tag>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize codebase features and modules into architectural components with designated leads.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          className="text-xs font-semibold !bg-blue-600 hover:!bg-blue-700"
        >
          Add Component
        </Button>
      </div>

      {/* Table */}
      <Card variant="borderless" className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] overflow-hidden">
        <Table
          dataSource={filteredComponents}
          columns={columns}
          rowKey="id"
          pagination={false}
          className="jira-table"
        />
      </Card>

      {/* Create Component Modal */}
      <Modal
        title={<div className="text-base font-semibold text-slate-800 dark:text-slate-100">Add Component</div>}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => form.submit()}
        okText="Add"
        confirmLoading={submitting}
        destroyOnHidden
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateComponent} className="mt-3" requiredMark={false}>
          <Form.Item
            name="name"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Component Name</span>}
            rules={[{ required: true, message: 'Component name is required' }]}
          >
            <Input placeholder="e.g. Frontend Web UI, Authentication Gateway" />
          </Form.Item>

          <Form.Item
            name="leadId"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Component Lead</span>}
          >
            <Select
              allowClear
              placeholder="Select lead"
              options={teamMembers.map((m) => ({ value: m.id, label: m.name }))}
            />
          </Form.Item>

          <Form.Item
            name="defaultAssigneeId"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Default Assignee</span>}
          >
            <Select
              allowClear
              placeholder="Select default assignee"
              options={teamMembers.map((m) => ({ value: m.id, label: m.name }))}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Description</span>}
          >
            <Input.TextArea rows={3} placeholder="Technical scope of this component" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ComponentsView;
