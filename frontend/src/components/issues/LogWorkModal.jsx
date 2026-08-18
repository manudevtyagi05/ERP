import { useState } from 'react';
import { Modal, Form, Input, InputNumber, App } from 'antd';

function LogWorkModal({ open, issue, onClose, onLogWork }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  const handleFinish = async (values) => {
    setSubmitting(true);
    try {
      await onLogWork(issue.id, {
        timeSpent: values.timeSpent,
        remainingEstimate: values.remainingEstimate,
        description: values.description || '',
      });
      message.success('Work logged successfully!');
      form.resetFields();
      onClose();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to log work');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={<div className="text-base font-semibold text-slate-800 dark:text-slate-100">Log Work: {issue?.key}</div>}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Log Work"
      confirmLoading={submitting}
      destroyOnHidden
      width={460}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          timeSpent: 1,
          remainingEstimate: Math.max(0, (issue?.remainingEstimate || 8) - 1),
        }}
        className="mt-3"
        requiredMark={false}
      >
        <div className="grid grid-cols-2 gap-3">
          <Form.Item
            name="timeSpent"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Time Spent (Hours)</span>}
            rules={[{ required: true, message: 'Time spent is required' }]}
          >
            <InputNumber min={0.25} step={0.5} className="w-full" />
          </Form.Item>

          <Form.Item
            name="remainingEstimate"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Remaining (Hours)</span>}
            rules={[{ required: true }]}
          >
            <InputNumber min={0} step={0.5} className="w-full" />
          </Form.Item>
        </div>

        <Form.Item
          name="description"
          label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Work Description</span>}
        >
          <Input.TextArea rows={3} placeholder="Describe the tasks and progress completed during this session" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default LogWorkModal;
