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
      // Resolve the first selected lead for the legacy lead/leadEmail display fields
      const firstLeadId = values.projectLeadIds?.[0];
      const firstLead = firstLeadId
        ? teamMembers.find((m) => m.id === firstLeadId)
        : null;

      const payload = {
        name: values.name,
        key: values.key,
        category: values.category,
        description: values.description,
        // Legacy display fields (for project cards, backward compat)
        lead: firstLead?.name || `${user?.firstName} ${user?.lastName}`,
        leadEmail: firstLead?.email || user?.email,
        // New: authoritative project lead IDs — ProjectMember records will be created
        projectLeadIds: values.projectLeadIds || [user?.id],
      };

      const newProject = await addProject(payload);
      message.success(`Project "${newProject.name}" created!`);
      form.resetFields();
      onCancel();
    } catch {
      message.error('Failed to create project. Please check that the key prefix is unique.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="text-base font-semibold text-slate-800 dark:text-slate-100">
          Create Project
        </div>
      }
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={() => form.submit()}
      okText="Create Project"
      confirmLoading={submitting}
      width={540}
      destroyOnHidden
    >
      <div className="max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            category: 'Software Architecture',
            // Default: current user is the first project lead
            projectLeadIds: user?.id ? [user.id] : [],
          }}
          className="mt-2"
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label={
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Project Name
              </span>
            }
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Form.Item
              name="key"
              label={
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Project Key Prefix
                </span>
              }
              rules={[
                { required: true, message: 'Please enter project key prefix' },
                { max: 6, message: 'Max 6 characters' },
              ]}
            >
              <Input placeholder="e.g., SCG" style={{ textTransform: 'uppercase' }} />
            </Form.Item>

            <Form.Item
              name="category"
              label={
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Category
                </span>
              }
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

          {/* Multi-lead selection */}
          <Form.Item
            name="projectLeadIds"
            label={
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Project Lead(s)
              </span>
            }
            rules={[{ required: true, message: 'Select at least one project lead' }]}
            extra={
              <span className="text-[11px] text-slate-400">
                Select one or more project leads. Leads can manage the project team.
              </span>
            }
          >
            <Select
              mode="multiple"
              placeholder="Select project leads..."
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              showSearch
              options={teamMembers
                .filter((m) => m.isActive !== false)
                .map((m) => ({
                  value: m.id,
                  label: m.name,
                }))}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Description
              </span>
            }
          >
            <Input.TextArea
              rows={3}
              placeholder="Brief purpose and deliverables of this project..."
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}

export default CreateProjectModal;
