import { useCallback, useEffect, useState } from 'react';
import { Table, Button, Select, Tag, Avatar, Popconfirm, Modal, Form, Alert, App } from 'antd';
import { PlusOutlined, UserOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  listProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
} from '../../services/projectMemberService';
import { listStaff } from '../../services/staffService';
import { getErrorMessage } from '../../utils/getErrorMessage';

const PROJECT_ROLES = ['OWNER', 'MANAGER', 'MEMBER', 'VIEWER'];
const PROJECT_ROLE_LABELS = { OWNER: 'Owner', MANAGER: 'Manager', MEMBER: 'Member', VIEWER: 'Viewer' };

function ProjectMembersPanel({ project }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [staffOptions, setStaffOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    setLoadError(null);
    try {
      setMembers(await listProjectMembers(project.id));
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Could not load project members'));
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const openAddModal = async () => {
    try {
      const { items } = await listStaff({ limit: 100, isActive: 'true' });
      const memberUserIds = new Set(members.map((m) => m.user?.id));
      setStaffOptions(items.filter((s) => !memberUserIds.has(s.id)));
    } catch {
      setStaffOptions([]);
    }
    form.setFieldsValue({ projectRole: 'MEMBER' });
    setAddOpen(true);
  };

  const handleAdd = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await addProjectMember(project.id, values);
      message.success('Member added to project');
      setAddOpen(false);
      fetchMembers();
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not add member'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId, projectRole) => {
    try {
      await updateProjectMemberRole(project.id, memberId, projectRole);
      message.success('Role updated');
      fetchMembers();
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not update role'));
    }
  };

  const handleRemove = async (memberId) => {
    try {
      await removeProjectMember(project.id, memberId);
      message.success('Member removed');
      fetchMembers();
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not remove member'));
    }
  };

  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" icon={<UserOutlined />} />
          <span className="text-xs font-medium text-slate-700">
            {record.user ? `${record.user.firstName} ${record.user.lastName}` : 'Unknown user'}
          </span>
        </div>
      ),
    },
    { title: 'Email', key: 'email', render: (_, record) => record.user?.email || '—' },
    {
      title: 'Company Role',
      key: 'companyRole',
      render: (_, record) => <Tag>{record.user?.role || '—'}</Tag>,
    },
    {
      title: 'Project Role',
      key: 'projectRole',
      render: (_, record) => (
        <Select
          size="small"
          value={record.projectRole}
          style={{ width: 130 }}
          onChange={(value) => handleRoleChange(record.id, value)}
          options={PROJECT_ROLES.map((r) => ({ value: r, label: PROJECT_ROLE_LABELS[r] }))}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Popconfirm
          title="Remove this member from the project?"
          onConfirm={() => handleRemove(record.id)}
          okButtonProps={{ danger: true }}
        >
          <Button size="small" type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  if (!project) {
    return (
      <Alert type="info" showIcon message="Select a project from the switcher above to manage its members." />
    );
  }

  return (
    <div className="flex flex-col gap-3 mt-2 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 !mb-0">People with explicit access to {project.name}.</p>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openAddModal} className="bg-blue-600">
          Add member
        </Button>
      </div>

      {loadError && <Alert type="error" showIcon message={loadError} />}

      <Table rowKey="id" columns={columns} dataSource={members} loading={loading} pagination={false} size="small" />

      <Modal
        title="Add project member"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={handleAdd}
        okText="Add"
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="userId"
            label="Staff member"
            rules={[{ required: true, message: 'Select a staff member' }]}
          >
            <Select
              showSearch
              placeholder="Search staff by name"
              filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
              options={staffOptions.map((s) => ({
                value: s.id,
                label: `${s.firstName} ${s.lastName} (${s.email})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="projectRole" label="Project role" rules={[{ required: true }]}>
            <Select options={PROJECT_ROLES.map((r) => ({ value: r, label: PROJECT_ROLE_LABELS[r] }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ProjectMembersPanel;
