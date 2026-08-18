import { useState } from 'react';
import { Modal, Form, Select, App } from 'antd';
import { ISSUE_LINK_TYPES } from '../../constants/jira';

function LinkIssueModal({ open, currentIssue, allIssues = [], onClose, onLinkIssue }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  const candidateIssues = allIssues.filter((i) => i.id !== currentIssue?.id);

  const handleFinish = async (values) => {
    setSubmitting(true);
    try {
      await onLinkIssue(currentIssue.id, {
        relationship: values.relationship,
        targetIssueKey: values.targetIssueKey,
      });
      message.success('Issue linked successfully!');
      form.resetFields();
      onClose();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to link issue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={<div className="text-base font-semibold text-slate-800 dark:text-slate-100">Link Issue to {currentIssue?.key}</div>}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Link"
      confirmLoading={submitting}
      destroyOnHidden
      width={480}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ relationship: 'relates to' }}
        className="mt-3"
        requiredMark={false}
      >
        <Form.Item
          name="relationship"
          label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Relationship</span>}
          rules={[{ required: true }]}
        >
          <Select options={ISSUE_LINK_TYPES} />
        </Form.Item>

        <Form.Item
          name="targetIssueKey"
          label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Issue</span>}
          rules={[{ required: true, message: 'Select an issue to link' }]}
        >
          <Select
            showSearch
            placeholder="Search issue by key or summary"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={candidateIssues.map((i) => ({
              value: i.key,
              label: `${i.key} — ${i.title}`,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default LinkIssueModal;
