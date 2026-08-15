import { useEffect } from 'react';
import { Modal, Form, Input, Select, Alert } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, ApartmentOutlined } from '@ant-design/icons';
import { ROLES, ROLE_LABELS } from '../../constants/roles';

function StaffFormModal({ open, mode, initialValues, submitting, error, onCancel, onSubmit }) {
  const [form] = Form.useForm();
  const isEdit = mode === 'edit';

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        isEdit
          ? {
              firstName: initialValues?.firstName,
              lastName: initialValues?.lastName,
              email: initialValues?.email,
              department: initialValues?.department,
            }
          : { role: 'EMPLOYEE' }
      );
    }
  }, [open, isEdit, initialValues, form]);

  const handleOk = () => {
    form.validateFields().then((values) => onSubmit(values));
  };

  return (
    <Modal
      title={isEdit ? 'Edit staff member' : 'Add staff member'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={isEdit ? 'Save changes' : 'Create staff member'}
      confirmLoading={submitting}
      destroyOnHidden
    >
      {error && <Alert type="error" showIcon message={error} className="mb-4" />}
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          label="First name"
          name="firstName"
          rules={[{ required: true, message: 'First name is required' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Jane" />
        </Form.Item>

        <Form.Item
          label="Last name"
          name="lastName"
          rules={[{ required: true, message: 'Last name is required' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Doe" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Enter a valid email address' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="jane@company.com" autoComplete="off" />
        </Form.Item>

        {!isEdit && (
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Password is required' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="At least 8 characters" autoComplete="new-password" />
          </Form.Item>
        )}

        {!isEdit && (
          <Form.Item label="Role" name="role" rules={[{ required: true, message: 'Role is required' }]}>
            <Select
              options={ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
            />
          </Form.Item>
        )}

        <Form.Item label="Department" name="department">
          <Input prefix={<ApartmentOutlined />} placeholder="Engineering" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default StaffFormModal;
