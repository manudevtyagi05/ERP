import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, App } from 'antd';
import { useProject } from '../../context/ProjectContext';
import { ISSUE_TYPES, ISSUE_PRIORITIES } from '../../constants/jira';
import { listMilestones } from '../../services/milestoneService';

function CreateIssueModal() {
  const { createIssueModalOpen, setCreateIssueModalOpen, projects, teamMembers, addIssue } = useProject();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const { message } = App.useApp();

  const selectedProjectKey = Form.useWatch('projectKey', form);

  useEffect(() => {
    const project = projects.find((p) => p.key === selectedProjectKey);
    if (!project) {
      setMilestones([]);
      return;
    }
    listMilestones(project.id)
      .then(setMilestones)
      .catch(() => setMilestones([]));
  }, [selectedProjectKey, projects]);

  const handleCancel = () => {
    form.resetFields();
    setCreateIssueModalOpen(false);
  };

  const handleFinish = async (values) => {
    setSubmitting(true);
    try {
      const newIssue = await addIssue({
        ...values,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
      });
      message.success(`Issue ${newIssue.key} created successfully`);
      form.resetFields();
      setCreateIssueModalOpen(false);
    } catch {
      message.error('Failed to create issue. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={<div className="text-base font-semibold text-slate-800 dark:text-slate-100">Create Issue</div>}
      open={createIssueModalOpen}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      okText="Create"
      confirmLoading={submitting}
      width={580}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          projectKey: projects[0]?.key || 'CORE',
          type: 'Task',
          priority: 'MEDIUM',
          assigneeId: teamMembers[0]?.id,
          storyPoints: 3,
        }}
        className="mt-4"
        requiredMark={false}
      >
        <div className="grid grid-cols-2 gap-3">
          <Form.Item
            name="projectKey"
            label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Project</span>}
            rules={[{ required: true, message: 'Please select a project' }]}
          >
            <Select
              options={projects.map((p) => ({
                value: p.key,
                label: (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {p.key}
                    </span>
                    <span className="truncate">{p.name}</span>
                  </div>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Issue Type</span>}
            rules={[{ required: true }]}
          >
            <Select
              options={Object.keys(ISSUE_TYPES).map((key) => ({
                value: key,
                label: (
                  <div className="flex items-center gap-2">
                    {ISSUE_TYPES[key].icon}
                    <span>{ISSUE_TYPES[key].label}</span>
                  </div>
                ),
              }))}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="title"
          label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Summary</span>}
          rules={[{ required: true, message: 'Please enter issue summary' }]}
        >
          <Input placeholder="Short summary of the task, feature, or bug" />
        </Form.Item>

        <Form.Item
          name="description"
          label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Description</span>}
        >
          <Input.TextArea
            rows={3}
            placeholder="Add any context, acceptance criteria, or reproduction steps..."
          />
        </Form.Item>

        <div className="grid grid-cols-3 gap-3">
          <Form.Item
            name="priority"
            label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Priority</span>}
            rules={[{ required: true }]}
          >
            <Select
              options={Object.keys(ISSUE_PRIORITIES).map((key) => ({
                value: key,
                label: (
                  <div className="flex items-center gap-1.5">
                    {ISSUE_PRIORITIES[key].icon}
                    <span>{ISSUE_PRIORITIES[key].label}</span>
                  </div>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item
            name="assigneeId"
            label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Assignee</span>}
            rules={[{ required: true }]}
          >
            <Select
              options={teamMembers.map((m) => ({
                value: m.id,
                label: (
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{m.name}</span>
                  </div>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item
            name="storyPoints"
            label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Story Points</span>}
          >
            <InputNumber min={1} max={21} style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Form.Item
            name="dueDate"
            label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Due Date</span>}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="milestoneId"
            label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Milestone</span>}
          >
            <Select
              allowClear
              placeholder="No milestone"
              options={milestones.map((m) => ({ value: m.id, label: m.name }))}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

export default CreateIssueModal;
