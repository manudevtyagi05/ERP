import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Tag,
  Switch,
  Modal,
  Form,
  Input,
  Select,
  Table,
  Badge,
  App,
} from 'antd';
import {
  PlusOutlined,
  ThunderboltFilled,
  PlayCircleOutlined,
  DeleteOutlined,
  HistoryOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  RightOutlined,
} from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import {
  listAutomationRules,
  createAutomationRule,
  toggleAutomationRule,
  testExecuteAutomationRule,
  deleteAutomationRule,
} from '../services/automationService';

const TRIGGER_TYPES = [
  { value: 'ISSUE_CREATED', label: 'WHEN: Issue is created' },
  { value: 'STATUS_CHANGED', label: 'WHEN: Issue status changes' },
  { value: 'PRIORITY_CHANGED', label: 'WHEN: Priority is escalated' },
  { value: 'SPRINT_STARTED', label: 'WHEN: Sprint starts' },
  { value: 'COMMENT_ADDED', label: 'WHEN: Comment is added' },
];

const ACTION_TYPES = [
  { value: 'ASSIGN_USER', label: 'THEN: Assign to Lead / Developer' },
  { value: 'CHANGE_STATUS', label: 'THEN: Transition issue status' },
  { value: 'SEND_NOTIFICATION', label: 'THEN: Send notification alert' },
  { value: 'COMPLETE_SUBTASKS', label: 'THEN: Mark all subtasks as Done' },
  { value: 'ADD_COMMENT', label: 'THEN: Add automated comment' },
];

function AutomationView() {
  const { projects, activeProject, activeProjectKey, teamMembers } = useProject();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  const currentProjectId = activeProject?.id || projects[0]?.id;

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await listAutomationRules();
      setRules(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (ruleId) => {
    try {
      const updated = await toggleAutomationRule(ruleId);
      setRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)));
      message.success(`Rule "${updated.name}" is now ${updated.enabled ? 'Enabled' : 'Disabled'}`);
    } catch (err) {
      message.error('Failed to toggle rule');
    }
  };

  const handleTestRun = async (ruleId) => {
    try {
      const res = await testExecuteAutomationRule(ruleId, { issueKey: 'WEB-101' });
      message.success(res.message || 'Rule executed successfully!');
      fetchRules();
    } catch (err) {
      message.error('Execution test failed');
    }
  };

  const handleDelete = async (ruleId) => {
    try {
      await deleteAutomationRule(ruleId);
      message.success('Rule deleted successfully');
      fetchRules();
    } catch (err) {
      message.error('Failed to delete rule');
    }
  };

  const handleCreateRule = async (values) => {
    setSubmitting(true);
    try {
      await createAutomationRule({
        projectId: currentProjectId,
        projectKey: activeProject?.key || 'GLOBAL',
        name: values.name,
        description: values.description || '',
        trigger: { type: values.triggerType, config: {} },
        conditions: [
          { field: values.conditionField || 'priority', operator: 'EQUALS', value: values.conditionValue || 'HIGHEST' },
        ],
        actions: [{ type: values.actionType, config: {} }],
        enabled: true,
      });
      message.success(`Automation rule "${values.name}" created!`);
      form.resetFields();
      setCreateModalOpen(false);
      fetchRules();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to create automation rule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">
            Automation Engine & Workflow Rules
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure smart WHEN `→` IF `→` THEN rules that automate issue triage, assignments, and alerts.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          className="text-xs font-semibold !bg-blue-600 hover:!bg-blue-700"
        >
          Create Rule
        </Button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <Card
            key={rule.id}
            variant="borderless"
            className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <ThunderboltFilled className={rule.enabled ? 'text-amber-500' : 'text-slate-400'} />
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {rule.name}
                  </span>
                </div>

                <Switch
                  checked={rule.enabled}
                  onChange={() => handleToggle(rule.id)}
                  size="small"
                />
              </div>

              {rule.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{rule.description}</p>
              )}

              {/* Visual Flow Pipeline: WHEN -> IF -> THEN */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex flex-col gap-2 my-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-blue-600 dark:text-blue-400 w-12 flex-shrink-0">WHEN</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {rule.trigger?.type?.replace('_', ' ')}
                  </span>
                </div>

                {rule.conditions?.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-purple-600 dark:text-purple-400 w-12 flex-shrink-0">IF</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {rule.conditions.map((c) => `${c.field} == "${c.value}"`).join(', ')}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-green-600 dark:text-green-400 w-12 flex-shrink-0">THEN</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {rule.actions?.map((a) => a.type?.replace('_', ' ')).join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Stats & Test Trigger */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                Executed {rule.executionCount || 0} times
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  size="small"
                  type="dashed"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleTestRun(rule.id)}
                  className="text-xs"
                >
                  Test Run
                </Button>

                <Button
                  size="small"
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(rule.id)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Execution History */}
      <Card
        variant="borderless"
        className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] mt-2"
        title={
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            <HistoryOutlined className="text-blue-500" /> Recent Execution Audit Logs
          </div>
        }
      >
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {rules
            .flatMap((r) => r.logs || [])
            .slice(-6)
            .map((log) => (
              <div key={log.id || log.timestamp} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircleFilled className="text-green-500 text-xs flex-shrink-0" />
                  <span className="font-mono text-slate-400 flex-shrink-0">{log.issueKey}</span>
                  <span className="text-slate-700 dark:text-slate-300 truncate">{log.message}</span>
                </div>

                <span className="text-[11px] text-slate-400 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
        </div>
      </Card>

      {/* Create Rule Modal */}
      <Modal
        title={<div className="text-base font-semibold text-slate-800 dark:text-slate-100">Create Automation Rule</div>}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => form.submit()}
        okText="Create Rule"
        confirmLoading={submitting}
        destroyOnHidden
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateRule} className="mt-3" requiredMark={false}>
          <Form.Item
            name="name"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Rule Name</span>}
            rules={[{ required: true, message: 'Rule name is required' }]}
          >
            <Input placeholder="e.g. Auto-assign high priority bugs to Lead" />
          </Form.Item>

          <Form.Item
            name="triggerType"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Trigger (WHEN)</span>}
            rules={[{ required: true }]}
            initialValue="ISSUE_CREATED"
          >
            <Select options={TRIGGER_TYPES} />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="conditionField"
              label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Condition Field (IF)</span>}
              initialValue="priority"
            >
              <Select
                options={[
                  { value: 'priority', label: 'Priority' },
                  { value: 'type', label: 'Issue Type' },
                  { value: 'status', label: 'Status' },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="conditionValue"
              label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Target Value</span>}
              initialValue="HIGHEST"
            >
              <Input placeholder="e.g. HIGHEST, Bug" />
            </Form.Item>
          </div>

          <Form.Item
            name="actionType"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Action (THEN)</span>}
            rules={[{ required: true }]}
            initialValue="ASSIGN_USER"
          >
            <Select options={ACTION_TYPES} />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Description</span>}
          >
            <Input.TextArea rows={2} placeholder="Explain why this rule runs and what it accomplishes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AutomationView;
