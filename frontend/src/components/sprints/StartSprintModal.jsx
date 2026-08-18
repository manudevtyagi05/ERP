import { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Select, App } from 'antd';
import dayjs from 'dayjs';

function StartSprintModal({ open, sprint, onClose, onStartSprint }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    if (sprint && open) {
      form.setFieldsValue({
        name: sprint.name,
        goal: sprint.goal || '',
        duration: '2_WEEKS',
        startDate: dayjs(),
        endDate: dayjs().add(2, 'week'),
      });
    }
  }, [sprint, open, form]);

  const handleDurationChange = (val) => {
    const startDate = form.getFieldValue('startDate') || dayjs();
    if (val === '1_WEEK') form.setFieldValue('endDate', startDate.add(1, 'week'));
    if (val === '2_WEEKS') form.setFieldValue('endDate', startDate.add(2, 'week'));
    if (val === '3_WEEKS') form.setFieldValue('endDate', startDate.add(3, 'week'));
    if (val === '4_WEEKS') form.setFieldValue('endDate', startDate.add(4, 'week'));
  };

  const handleFinish = async (values) => {
    setSubmitting(true);
    try {
      await onStartSprint(sprint.id, {
        name: values.name,
        goal: values.goal,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
        endDate: values.endDate ? values.endDate.toISOString() : undefined,
      });
      message.success(`Sprint "${values.name}" started successfully!`);
      onClose();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to start sprint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={<div className="text-base font-semibold text-slate-800 dark:text-slate-100">Start Sprint</div>}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Start Sprint"
      confirmLoading={submitting}
      destroyOnHidden
      width={520}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="mt-3" requiredMark={false}>
        <Form.Item
          name="name"
          label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sprint Name</span>}
          rules={[{ required: true, message: 'Sprint name is required' }]}
        >
          <Input placeholder="e.g. WEB Sprint 2" />
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Form.Item
            name="duration"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Duration</span>}
          >
            <Select
              onChange={handleDurationChange}
              options={[
                { value: '1_WEEK', label: '1 Week' },
                { value: '2_WEEKS', label: '2 Weeks (Standard)' },
                { value: '3_WEEKS', label: '3 Weeks' },
                { value: '4_WEEKS', label: '4 Weeks' },
                { value: 'CUSTOM', label: 'Custom' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="startDate"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Start Date</span>}
            rules={[{ required: true }]}
          >
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>
        </div>

        <Form.Item
          name="endDate"
          label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">End Date</span>}
          rules={[{ required: true }]}
        >
          <DatePicker className="w-full" format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item
          name="goal"
          label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sprint Goal</span>}
        >
          <Input.TextArea
            rows={3}
            placeholder="What is the team aiming to achieve during this iteration?"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default StartSprintModal;
