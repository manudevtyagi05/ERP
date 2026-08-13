import { useEffect } from 'react';
import { Modal, Form, Select, Alert, Typography } from 'antd';
import { ROLES, ROLE_LABELS } from '../../constants/roles';

function ChangeRoleModal({ open, staff, submitting, error, onCancel, onSubmit }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ role: staff?.role });
    }
  }, [open, staff, form]);

  const handleOk = () => {
    form.validateFields().then((values) => onSubmit(values.role));
  };

  return (
    <Modal
      title="Change role"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Update role"
      confirmLoading={submitting}
      destroyOnClose
    >
      {error && <Alert type="error" showIcon message={error} className="mb-4" />}
      <Typography.Text type="secondary" className="block mb-4">
        {staff?.firstName} {staff?.lastName} &middot; {staff?.email}
      </Typography.Text>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item label="Role" name="role" rules={[{ required: true, message: 'Role is required' }]}>
          <Select options={ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default ChangeRoleModal;
