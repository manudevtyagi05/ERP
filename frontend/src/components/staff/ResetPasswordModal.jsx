import { Modal, Form, Input, Alert, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';

function ResetPasswordModal({ open, staff, submitting, error, onCancel, onSubmit }) {
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then((values) => onSubmit(values.newPassword));
  };

  return (
    <Modal
      title="Reset password"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Reset password"
      confirmLoading={submitting}
      destroyOnClose
    >
      {error && <Alert type="error" showIcon message={error} className="mb-4" />}
      <Typography.Text type="secondary" className="block mb-4">
        Set a new password for {staff?.firstName} {staff?.lastName} ({staff?.email}). They will need to use it
        the next time they sign in.
      </Typography.Text>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          label="New password"
          name="newPassword"
          rules={[
            { required: true, message: 'New password is required' },
            { min: 8, message: 'Password must be at least 8 characters' },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="At least 8 characters" autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default ResetPasswordModal;
