import { useState } from 'react';
import { Modal, Form, Input, Select, App } from 'antd';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';

function CreateProjectModal({ open, onCancel }) {
  const { addProject, teamMembers } = useProject();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  const handleFinish = async (values) => {
    setSubmitting(true);
    try {
      const lead = teamMembers.find((m) => m.email === values.lead);
      const payload = {
        ...values,
        lead: lead?.name || `${user?.firstName} ${user?.lastName}`,
        leadEmail: values.lead,
      };
      const newProject = await addProject(payload);
      message.success(`Project ${newProject.name} created!`);
      form.resetFields();
      onCancel();
    } catch {
      message.error('Failed to create project. Please check if key is unique.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={<div className="text-base font-semibold text-slate-800 dark:text-slate-100">Create Project</div>}
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={() => form.submit()}
      okText="Create Project"
      confirmLoading={submitting}
      width={520}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          category: 'Software Architecture',
          lead: user?.email,
        }}
        className="mt-4"
        requiredMark={false}
      >
        <Form.Item
          name="name"
          label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Project Name</span>}
          rules={[{ required: true, message: 'Please enter project name' }]}
        >
          <Input
            placeholder="e.g., Supply Chain Gateway"
            onChange={(e) => {
              const name = e.target.value;
              if (name && !form.isFieldTouched('key')) {
                const autoKey = name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 4);
                form.setFieldsValue({ key: autoKey });
              }
            }}
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-3">
          <Form.Item
            name="key"
            label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Project Key Prefix</span>}
            rules={[
              { required: true, message: 'Please enter project key prefix' },
              { max: 6, message: 'Max 6 characters' },
            ]}
          >
            <Input placeholder="e.g., SCG" style={{ textTransform: 'uppercase' }} />
          </Form.Item>

          <Form.Item
            name="category"
            label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Category</span>}
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'Software Architecture', label: 'Software Architecture' },
                { value: 'Design Engineering', label: 'Design Engineering' },
                { value: 'Fintech Service', label: 'Fintech Service' },
                { value: 'DevOps & Reliability', label: 'DevOps & Reliability' },
                { value: 'Operations', label: 'Operations' },
              ]}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="lead"
          label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Project Lead</span>}
          rules={[{ required: true }]}
        >
          <Select
            options={teamMembers.map((m) => ({
              value: m.email,
              label: m.name,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Description</span>}
        >
          <Input.TextArea rows={3} placeholder="Brief purpose and deliverables of this project..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default CreateProjectModal;
