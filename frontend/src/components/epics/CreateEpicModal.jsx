import { useState } from 'react';
import { Modal, Form, Input, DatePicker, Select, App } from 'antd';
import { createEpic } from '../../services/epicService';

const EPIC_COLORS = [
  '#7c3aed', // Purple
  '#2563eb', // Blue
  '#0891b2', // Cyan
  '#059669', // Green
  '#d97706', // Amber
  '#dc2626', // Red
  '#db2777', // Pink
];

function CreateEpicModal({ open, projectId, onClose, onEpicCreated }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedColor, setSelectedColor] = useState(EPIC_COLORS[0]);
  const { message } = App.useApp();

  const handleFinish = async (values) => {
    setSubmitting(true);
    try {
      const epic = await createEpic({
        projectId,
        name: values.name,
        summary: values.summary || values.name,
        description: values.description || '',
        color: selectedColor,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
        targetDate: values.targetDate ? values.targetDate.toISOString() : undefined,
      });
      message.success(`Epic "${epic.name}" created successfully!`);
      form.resetFields();
      if (onEpicCreated) onEpicCreated(epic);
      onClose();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to create epic');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={<div className="text-base font-semibold text-slate-800 dark:text-slate-100">Create Epic</div>}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Create Epic"
      confirmLoading={submitting}
      destroyOnHidden
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-3" requiredMark={false}>
        <Form.Item
          name="name"
          label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Epic Name</span>}
          rules={[{ required: true, message: 'Epic name is required' }]}
        >
          <Input placeholder="e.g. Authentication & Multi-Factor Security" />
        </Form.Item>

        <Form.Item
          name="summary"
          label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Summary</span>}
        >
          <Input placeholder="Brief one-line goal for this epic" />
        </Form.Item>

        <div className="mb-4">
          <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Epic Color</span>
          <div className="flex items-center gap-2">
            {EPIC_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={`w-6 h-6 rounded-full transition-transform ${
                  selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Form.Item
            name="startDate"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Start Date</span>}
          >
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            name="targetDate"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Target Date</span>}
          >
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>
        </div>

        <Form.Item
          name="description"
          label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Description</span>}
        >
          <Input.TextArea rows={3} placeholder="Detailed requirements and scope of work" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default CreateEpicModal;
