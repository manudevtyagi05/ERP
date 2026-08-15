import { useEffect, useState } from 'react';
import {
  Modal,
  Tabs,
  Form,
  Input,
  Button,
  Select,
  Alert,
  Avatar,
  Tag,
  Tooltip,
  App,
} from 'antd';
import {
  SettingOutlined,
  TeamOutlined,
  FlagOutlined,
  ApartmentOutlined,
  SaveOutlined,
  CrownOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { PERMISSIONS } from '../../constants/permissions';
import { getErrorMessage } from '../../utils/getErrorMessage';
import ProjectMembersPanel from '../settings/ProjectMembersPanel';
import ProjectMilestonesPanel from '../settings/ProjectMilestonesPanel';

function ProjectSettingsModal({ open, onClose, project, initialTab = 'general' }) {
  const { user, hasPermission } = useAuth();
  const { updateProject } = useProject();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (project && open) {
      form.setFieldsValue({
        projectName: project.name,
        projectKey: project.key,
        category: project.category,
        description: project.description,
        status: project.status || 'Active',
      });
    }
  }, [project, open, form]);

  const isLead = project?.projectLeads?.some(
    (l) => l.id === user?.id || l.id === user?._id
  );
  const canEdit = hasPermission(PERMISSIONS.PROJECT_UPDATE) || Boolean(isLead);

  const handleSaveGeneral = async (values) => {
    if (!project?.id) return;
    setSaving(true);
    try {
      await updateProject(project.id, {
        name: values.projectName,
        category: values.category,
        description: values.description,
        status: values.status,
      });
      message.success('Project settings updated successfully');
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not update project settings'));
    } finally {
      setSaving(false);
    }
  };

  if (!project) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={820}
      destroyOnHidden
      title={
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md text-white font-mono font-bold text-xs flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: project.avatarBg || '#2563eb' }}
          >
            {project.key}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {project.name}
            </div>
            <div className="text-[11px] text-slate-400 font-normal">Project Management</div>
          </div>
        </div>
      }
      className="project-settings-modal"
    >
      <div className="mt-2 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'general',
              label: (
                <span className="flex items-center gap-1.5">
                  <SettingOutlined /> General Details
                </span>
              ),
              children: (
                <div className="pt-2">
                  {!canEdit && (
                    <Alert
                      type="info"
                      showIcon
                      message="Read-only access"
                      description="You need the PROJECT_LEAD role or organization project update permissions to modify project details."
                      className="mb-4"
                    />
                  )}
                  <Form
                    form={form}
                    layout="vertical"
                    disabled={!canEdit}
                    onFinish={handleSaveGeneral}
                    requiredMark={false}
                    className="max-w-2xl"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Form.Item
                        name="projectName"
                        label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Project Name</span>}
                        rules={[{ required: true, message: 'Project name is required' }]}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        name="projectKey"
                        label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Key Prefix</span>}
                      >
                        <Input disabled />
                      </Form.Item>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Form.Item
                        name="category"
                        label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Category</span>}
                      >
                        <Select
                          options={[
                            { value: 'Software Architecture', label: 'Software Architecture' },
                            { value: 'Design Engineering', label: 'Design Engineering' },
                            { value: 'Fintech Service', label: 'Fintech Service' },
                            { value: 'DevOps & Reliability', label: 'DevOps & Reliability' },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item
                        name="status"
                        label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Status</span>}
                      >
                        <Select
                          options={[
                            { value: 'Active', label: 'Active' },
                            { value: 'Archived', label: 'Archived' },
                            { value: 'Planning', label: 'Planning' },
                          ]}
                        />
                      </Form.Item>
                    </div>

                    {/* Project leads display */}
                    <div className="mb-4">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1.5">
                        Project Lead(s)
                      </label>
                      <div className="flex flex-wrap gap-2 p-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 min-h-[36px]">
                        {project.projectLeads && project.projectLeads.length > 0 ? (
                          project.projectLeads.map((lead) => (
                            <Tooltip key={lead.id} title={lead.email}>
                              <Tag
                                icon={<CrownOutlined className="text-amber-500" />}
                                className="flex items-center gap-1 text-xs"
                              >
                                <Avatar
                                  size={14}
                                  icon={<UserOutlined />}
                                  className="bg-blue-500 mr-1"
                                />
                                {lead.name}
                              </Tag>
                            </Tooltip>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">
                            No project leads assigned. Add a member with the PROJECT_LEAD role in the Members tab.
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Manage project leads in the <strong>Members</strong> tab by assigning the PROJECT_LEAD role.
                      </p>
                    </div>

                    <Form.Item
                      name="description"
                      label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Description</span>}
                    >
                      <Input.TextArea rows={3} />
                    </Form.Item>

                    {canEdit && (
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={saving}
                        className="bg-blue-600"
                      >
                        Save Details
                      </Button>
                    )}
                  </Form>
                </div>
              ),
            },
            {
              key: 'members',
              label: (
                <span className="flex items-center gap-1.5">
                  <TeamOutlined /> Members & Roles
                </span>
              ),
              children: <ProjectMembersPanel project={project} />,
            },
            {
              key: 'milestones',
              label: (
                <span className="flex items-center gap-1.5">
                  <FlagOutlined /> Milestones
                </span>
              ),
              children: <ProjectMilestonesPanel project={project} />,
            },
            {
              key: 'workflows',
              label: (
                <span className="flex items-center gap-1.5">
                  <ApartmentOutlined /> Workflow Stages
                </span>
              ),
              children: (
                <div className="flex flex-col gap-4 mt-2 max-w-2xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Issues in <strong>{project.name}</strong> advance through this standard pipeline.
                  </p>

                  <div className="flex flex-col gap-2">
                    {[
                      { name: 'Backlog', color: '#94a3b8', desc: 'Initial triage & idea backlog' },
                      { name: 'To Do', color: '#60a5fa', desc: 'Committed work not yet started' },
                      { name: 'In Progress', color: '#3b82f6', desc: 'Under active engineering development' },
                      { name: 'In Review', color: '#f59e0b', desc: 'Code review & QA verification' },
                      { name: 'Done', color: '#22c55e', desc: 'Completed and verified' },
                    ].map((st, idx) => (
                      <div
                        key={st.name}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-slate-400 font-bold">0{idx + 1}</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: st.color }}
                          />
                          <div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{st.name}</span>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 m-0">{st.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </Modal>
  );
}

export default ProjectSettingsModal;

