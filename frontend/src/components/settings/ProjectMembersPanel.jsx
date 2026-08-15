import { useCallback, useEffect, useState } from 'react';
import {
  Table,
  Button,
  Select,
  Tag,
  Avatar,
  Popconfirm,
  Modal,
  Form,
  Alert,
  App,
  Tooltip,
} from 'antd';
import { PlusOutlined, UserOutlined, DeleteOutlined, CrownOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../constants/permissions';
import {
  listProjectMembers,
  addProjectMember,
  updateProjectMemberRoles,
  removeProjectMember,
} from '../../services/projectMemberService';
import { listStaff } from '../../services/staffService';
import { getErrorMessage } from '../../utils/getErrorMessage';

/**
 * Project-scoped responsibility roles.
 * Completely separate from company roles (ADMIN/SUPERVISOR/EMPLOYEE/SUPPORT).
 */
const PROJECT_ROLES = ['PROJECT_LEAD', 'DEVELOPER', 'QA', 'DEVOPS', 'PR_REVIEWER', 'VIEWER'];

const PROJECT_ROLE_META = {
  PROJECT_LEAD: { label: 'Project Lead', color: 'blue' },
  DEVELOPER: { label: 'Developer', color: 'cyan' },
  QA: { label: 'QA', color: 'orange' },
  DEVOPS: { label: 'DevOps', color: 'purple' },
  PR_REVIEWER: { label: 'PR Reviewer', color: 'gold' },
  VIEWER: { label: 'Viewer', color: 'default' },
};

function RoleTag({ role }) {
  const meta = PROJECT_ROLE_META[role] || { label: role, color: 'default' };
  return (
    <Tag color={meta.color} className="text-[11px] font-medium">
      {meta.label}
    </Tag>
  );
}

function ProjectMembersPanel({ project }) {
  const { user, hasPermission } = useAuth();
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
    form.resetFields();
    form.setFieldsValue({ projectRoles: ['VIEWER'] });
    setAddOpen(true);
  };

  const handleAdd = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await addProjectMember(project.id, {
        userId: values.userId,
        projectRoles: values.projectRoles,
      });
      message.success('Member added to project');
      setAddOpen(false);
      fetchMembers();
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not add member'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRolesChange = async (memberId, projectRoles) => {
    try {
      await updateProjectMemberRoles(project.id, memberId, projectRoles);
      message.success('Roles updated');
      fetchMembers();
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not update roles'));
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

  const isLead =
    members.some(
      (m) => (m.user?.id === user?.id || m.user?.id === user?._id) && m.projectRoles?.includes('PROJECT_LEAD')
    ) || project?.projectLeads?.some((l) => l.id === user?.id || l.id === user?._id);
  const canManage = hasPermission(PERMISSIONS.PROJECT_UPDATE) || Boolean(isLead);

  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Avatar
            size="small"
            icon={<UserOutlined />}
            className="bg-slate-200 dark:bg-slate-700 flex-shrink-0"
          />
          <div>
            <div className="text-xs font-medium text-slate-700 dark:text-slate-200">
              {record.user ? `${record.user.firstName} ${record.user.lastName}` : 'Unknown user'}
            </div>
            <div className="text-[11px] text-slate-400">{record.user?.email || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Designation',
      key: 'designation',
      render: (_, record) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {record.user?.department || <span className="text-slate-400">—</span>}
        </span>
      ),
    },
    {
      title: 'Company Role',
      key: 'companyRole',
      render: (_, record) => (
        <Tag className="text-[11px]">{record.user?.role || '—'}</Tag>
      ),
    },
    {
      title: 'Project Roles',
      key: 'projectRoles',
      width: 260,
      render: (_, record) =>
        canManage ? (
          <Select
            mode="multiple"
            size="small"
            value={record.projectRoles || []}
            style={{ width: '100%', minWidth: 200 }}
            onChange={(values) => handleRolesChange(record.id, values)}
            options={PROJECT_ROLES.map((r) => ({
              value: r,
              label: PROJECT_ROLE_META[r]?.label || r,
            }))}
            maxTagCount={2}
            maxTagPlaceholder={(omittedValues) => (
              <Tooltip title={omittedValues.map((v) => PROJECT_ROLE_META[v.value]?.label || v.value).join(', ')}>
                <span>+{omittedValues.length}</span>
              </Tooltip>
            )}
          />
        ) : (
          <div className="flex flex-wrap gap-1">
            {(record.projectRoles || []).map((r) => (
              <RoleTag key={r} role={r} />
            ))}
          </div>
        ),
    },
    ...(canManage
      ? [
          {
            title: '',
            key: 'actions',
            width: 50,
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
        ]
      : []),
  ];

  if (!project) {
    return (
      <Alert
        type="info"
        showIcon
        message="No project specified to manage members."
      />
    );
  }

  const leadCount = members.filter((m) => m.projectRoles?.includes('PROJECT_LEAD')).length;

  return (
    <div className="flex flex-col gap-3 mt-2 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 !mb-0">
            People with explicit access to{' '}
            <span className="font-medium text-slate-700 dark:text-slate-200">{project.name}</span>.
          </p>
          {leadCount > 0 && (
            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
              <CrownOutlined className="text-amber-500" />
              {leadCount} project lead{leadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {canManage && (
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={openAddModal}
            className="bg-blue-600"
          >
            Add member
          </Button>
        )}
      </div>

      {loadError && <Alert type="error" showIcon message={loadError} />}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={members}
        loading={loading}
        pagination={false}
        size="small"
        locale={{ emptyText: 'No members yet. Add your first team member.' }}
      />

      {/* Role legend */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        {PROJECT_ROLES.map((r) => (
          <RoleTag key={r} role={r} />
        ))}
      </div>

      {/* Add member modal */}
      <Modal
        title="Add project member"
        open={addOpen}
        onCancel={() => {
          setAddOpen(false);
          form.resetFields();
        }}
        onOk={handleAdd}
        okText="Add"
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark={false} className="mt-4">
          <Form.Item
            name="userId"
            label={
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Staff member
              </span>
            }
            rules={[{ required: true, message: 'Select a staff member' }]}
          >
            <Select
              showSearch
              placeholder="Search staff by name or email"
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              options={staffOptions.map((s) => ({
                value: s.id,
                label: `${s.firstName} ${s.lastName} (${s.email})`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="projectRoles"
            label={
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Project roles
              </span>
            }
            rules={[{ required: true, message: 'Select at least one role' }]}
            extra={
              <span className="text-[11px] text-slate-400">
                A member can hold multiple project roles simultaneously.
              </span>
            }
          >
            <Select
              mode="multiple"
              placeholder="Select roles..."
              options={PROJECT_ROLES.map((r) => ({
                value: r,
                label: PROJECT_ROLE_META[r]?.label || r,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ProjectMembersPanel;
