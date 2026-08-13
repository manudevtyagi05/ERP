import { useCallback, useEffect, useState } from 'react';
import { Table, Button, Input, Select, Space, Tag, Tooltip, Popconfirm, Alert, Typography, App } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  KeyOutlined,
  SwapOutlined,
  StopOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../constants/permissions';
import { ROLES, ROLE_LABELS, ROLE_COLORS } from '../constants/roles';
import {
  listStaff,
  createStaff,
  updateStaff,
  activateStaff,
  deactivateStaff,
  deleteStaff,
  resetStaffPassword,
  changeStaffRole,
} from '../services/staffService';
import { getErrorMessage } from '../utils/getErrorMessage';
import StaffFormModal from '../components/staff/StaffFormModal';
import ChangeRoleModal from '../components/staff/ChangeRoleModal';
import ResetPasswordModal from '../components/staff/ResetPasswordModal';

const PAGE_SIZE = 20;

const emptyModalState = { open: false, target: null, submitting: false, error: null };

function Team() {
  const { user, hasPermission } = useAuth();
  const { message } = App.useApp();

  const canRead = hasPermission(PERMISSIONS.USER_READ);
  const canCreate = hasPermission(PERMISSIONS.USER_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.USER_UPDATE);
  const canActivate = hasPermission(PERMISSIONS.USER_ACTIVATE);
  const canDeactivate = hasPermission(PERMISSIONS.USER_DEACTIVATE);
  const canDelete = hasPermission(PERMISSIONS.USER_DELETE);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState(undefined);
  const [isActive, setIsActive] = useState(undefined);

  const [formModal, setFormModal] = useState({ ...emptyModalState, mode: 'create' });
  const [roleModal, setRoleModal] = useState(emptyModalState);
  const [resetModal, setResetModal] = useState(emptyModalState);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { items: staff, meta } = await listStaff({
        page,
        limit: PAGE_SIZE,
        role,
        isActive,
        search: search || undefined,
      });
      setItems(staff);
      setTotal(meta.total);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Could not load the team directory'));
    } finally {
      setLoading(false);
    }
  }, [page, role, isActive, search]);

  useEffect(() => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    fetchStaff();
  }, [canRead, fetchStaff]);

  const openCreateModal = () => setFormModal({ ...emptyModalState, open: true, mode: 'create' });
  const openEditModal = (record) => setFormModal({ ...emptyModalState, open: true, mode: 'edit', target: record });
  const closeFormModal = () => setFormModal((s) => ({ ...s, open: false }));

  const handleFormSubmit = async (values) => {
    setFormModal((s) => ({ ...s, submitting: true, error: null }));
    try {
      if (formModal.mode === 'create') {
        await createStaff(values);
        message.success('Staff member created');
      } else {
        const { firstName, lastName, email, department } = values;
        await updateStaff(formModal.target.id, { firstName, lastName, email, department });
        message.success('Staff member updated');
      }
      setFormModal((s) => ({ ...s, open: false, submitting: false }));
      fetchStaff();
    } catch (err) {
      setFormModal((s) => ({ ...s, submitting: false, error: getErrorMessage(err, 'Could not save staff member') }));
    }
  };

  const openRoleModal = (record) => setRoleModal({ ...emptyModalState, open: true, target: record });
  const closeRoleModal = () => setRoleModal((s) => ({ ...s, open: false }));

  const handleRoleSubmit = async (newRole) => {
    setRoleModal((s) => ({ ...s, submitting: true, error: null }));
    try {
      await changeStaffRole(roleModal.target.id, newRole);
      message.success('Role updated');
      setRoleModal((s) => ({ ...s, open: false, submitting: false }));
      fetchStaff();
    } catch (err) {
      setRoleModal((s) => ({ ...s, submitting: false, error: getErrorMessage(err, 'Could not update role') }));
    }
  };

  const openResetModal = (record) => setResetModal({ ...emptyModalState, open: true, target: record });
  const closeResetModal = () => setResetModal((s) => ({ ...s, open: false }));

  const handleResetSubmit = async (newPassword) => {
    setResetModal((s) => ({ ...s, submitting: true, error: null }));
    try {
      await resetStaffPassword(resetModal.target.id, newPassword);
      message.success('Password reset successfully');
      setResetModal((s) => ({ ...s, open: false, submitting: false }));
    } catch (err) {
      setResetModal((s) => ({ ...s, submitting: false, error: getErrorMessage(err, 'Could not reset password') }));
    }
  };

  const handleActivate = async (record) => {
    try {
      await activateStaff(record.id);
      message.success(`${record.firstName} activated`);
      fetchStaff();
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not activate staff member'));
    }
  };

  const handleDeactivate = async (record) => {
    try {
      await deactivateStaff(record.id);
      message.success(`${record.firstName} deactivated`);
      fetchStaff();
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not deactivate staff member'));
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteStaff(record.id);
      message.success(`${record.firstName} deleted`);
      fetchStaff();
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not delete staff member'));
    }
  };

  const renderActions = (record) => {
    const isSelf = record.id === user?.id;
    return (
      <Space size="small" wrap>
        {canUpdate && (
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          </Tooltip>
        )}
        {canUpdate && (
          <Tooltip title={isSelf ? 'You cannot change your own role' : 'Change role'}>
            <Button size="small" icon={<SwapOutlined />} disabled={isSelf} onClick={() => openRoleModal(record)} />
          </Tooltip>
        )}
        {canUpdate && (
          <Tooltip title="Reset password">
            <Button size="small" icon={<KeyOutlined />} onClick={() => openResetModal(record)} />
          </Tooltip>
        )}
        {record.isActive && canDeactivate && (
          <Tooltip title={isSelf ? 'You cannot deactivate your own account' : 'Deactivate'}>
            <Popconfirm
              title="Deactivate this staff member?"
              description="They will no longer be able to sign in."
              okText="Deactivate"
              okButtonProps={{ danger: true }}
              disabled={isSelf}
              onConfirm={() => handleDeactivate(record)}
            >
              <Button size="small" icon={<StopOutlined />} disabled={isSelf} danger />
            </Popconfirm>
          </Tooltip>
        )}
        {!record.isActive && canActivate && (
          <Tooltip title="Activate">
            <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleActivate(record)} />
          </Tooltip>
        )}
        {canDelete && (
          <Tooltip title={isSelf ? 'You cannot delete your own account' : 'Delete'}>
            <Popconfirm
              title="Delete this staff member?"
              description="This removes them from the team directory."
              okText="Delete"
              okButtonProps={{ danger: true }}
              disabled={isSelf}
              onConfirm={() => handleDelete(record)}
            >
              <Button size="small" icon={<DeleteOutlined />} disabled={isSelf} danger />
            </Popconfirm>
          </Tooltip>
        )}
      </Space>
    );
  };

  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    { title: 'Email', dataIndex: 'email' },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (roleValue) => <Tag color={ROLE_COLORS[roleValue]}>{ROLE_LABELS[roleValue]}</Tag>,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      render: (department) => department || <span className="text-gray-400">—</span>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      render: (activeValue) => <Tag color={activeValue ? 'green' : 'default'}>{activeValue ? 'Active' : 'Inactive'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => renderActions(record),
    },
  ];

  if (!canRead) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Access restricted"
        description="You don't have permission to view the team directory."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Typography.Title level={4} className="!mb-0">
          Team
        </Typography.Title>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Add staff
          </Button>
        )}
      </div>

      <Space wrap>
        <Input.Search
          placeholder="Search name or email"
          allowClear
          style={{ width: 240 }}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <Select
          placeholder="Role"
          allowClear
          style={{ width: 160 }}
          options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          onChange={(value) => {
            setRole(value);
            setPage(1);
          }}
        />
        <Select
          placeholder="Status"
          allowClear
          style={{ width: 140 }}
          options={[
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
          onChange={(value) => {
            setIsActive(value);
            setPage(1);
          }}
        />
      </Space>

      {loadError && <Alert type="error" showIcon message={loadError} />}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          onChange: (nextPage) => setPage(nextPage),
          showSizeChanger: false,
        }}
      />

      <StaffFormModal
        open={formModal.open}
        mode={formModal.mode}
        initialValues={formModal.target}
        submitting={formModal.submitting}
        error={formModal.error}
        onCancel={closeFormModal}
        onSubmit={handleFormSubmit}
      />
      <ChangeRoleModal
        open={roleModal.open}
        staff={roleModal.target}
        submitting={roleModal.submitting}
        error={roleModal.error}
        onCancel={closeRoleModal}
        onSubmit={handleRoleSubmit}
      />
      <ResetPasswordModal
        open={resetModal.open}
        staff={resetModal.target}
        submitting={resetModal.submitting}
        error={resetModal.error}
        onCancel={closeResetModal}
        onSubmit={handleResetSubmit}
      />
    </div>
  );
}

export default Team;
