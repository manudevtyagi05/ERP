import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, App } from 'antd';
import { useProject } from '../../context/ProjectContext';
import { ISSUE_TYPES, ISSUE_PRIORITIES } from '../../constants/jira';

function CreateIssueModal() {
  const {
    createIssueModalOpen,
    setCreateIssueModalOpen,
    projects,
    teamMembers,
    sprints,
    epics,
    releases,
    components,
    addIssue,
  } = useProject();

  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  const selectedProjectKey = Form.useWatch('projectKey', form);

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
        sprintId: values.sprintId === 'BACKLOG' ? null : values.sprintId,
        epicId: values.epicId === 'NONE' ? null : values.epicId,
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
      width={640}
      destroyOnHidden
    >
      <div className="max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            projectKey: projects[0]?.key || 'WEB',
            type: 'Task',
            priority: 'MEDIUM',
            assigneeId: teamMembers[0]?.id,
            storyPoints: 3,
            originalEstimate: 8,
            sprintId: 'BACKLOG',
          }}
          className="mt-2"
          requiredMark={false}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Form.Item
              name="projectKey"
              label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Project</span>}
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
              label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Issue Type</span>}
              rules={[{ required: true }]}
            >
              <Select
                options={Object.keys(ISSUE_TYPES).map((k) => ({
                  value: k,
                  label: (
                    <div className="flex items-center gap-2">
                      {ISSUE_TYPES[k].icon}
                      <span>{ISSUE_TYPES[k].label}</span>
                    </div>
                  ),
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="title"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Summary</span>}
            rules={[{ required: true, message: 'Issue summary is required' }]}
          >
            <Input placeholder="e.g. Implement user login session invalidation" className="text-xs" />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Description (Markdown supported)</span>}
          >
            <Input.TextArea rows={4} placeholder="Describe the feature or reproduction steps..." className="text-xs" />
          </Form.Item>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Form.Item
              name="sprintId"
              label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sprint</span>}
            >
              <Select
                options={[
                  { value: 'BACKLOG', label: 'Backlog (No Sprint)' },
                  ...sprints.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            </Form.Item>

            <Form.Item
              name="epicId"
              label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Epic</span>}
            >
              <Select
                allowClear
                placeholder="Select Epic"
                options={[
                  { value: 'NONE', label: 'None' },
                  ...epics.map((e) => ({ value: e.id, label: e.name })),
                ]}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Form.Item
              name="priority"
              label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Priority</span>}
              rules={[{ required: true }]}
            >
              <Select
                options={Object.keys(ISSUE_PRIORITIES).map((k) => ({
                  value: k,
                  label: (
                    <div className="flex items-center gap-1.5">
                      {ISSUE_PRIORITIES[k].icon}
                      <span>{ISSUE_PRIORITIES[k].label}</span>
                    </div>
                  ),
                }))}
              />
            </Form.Item>

            <Form.Item
              name="storyPoints"
              label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Story Points</span>}
            >
              <InputNumber min={0} max={100} className="w-full text-xs" />
            </Form.Item>

            <Form.Item
              name="originalEstimate"
              label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Estimate (Hours)</span>}
            >
              <InputNumber min={0} step={1} className="w-full text-xs" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Form.Item
              name="assigneeId"
              label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Assignee</span>}
            >
              <Select
                allowClear
                placeholder="Unassigned"
                options={teamMembers.map((m) => ({
                  value: m.id,
                  label: (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-500 text-[10px] text-white flex items-center justify-center font-bold">
                        {m.name?.[0]}
                      </span>
                      <span>{m.name}</span>
                    </div>
                  ),
                }))}
              />
            </Form.Item>

            <Form.Item
              name="dueDate"
              label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Due Date</span>}
            >
              <DatePicker className="w-full text-xs" format="YYYY-MM-DD" />
            </Form.Item>
          </div>
        </Form>
      </div>
    </Modal>
  );
}

export default CreateIssueModal;
