import { useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Select,
  Switch,
  Alert,
  App,
} from 'antd';
import {
  SaveOutlined,
  SettingOutlined,
  BellOutlined,
  ApartmentOutlined,
  TeamOutlined,
  FlagOutlined,
  BgColorsOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getErrorMessage } from '../utils/getErrorMessage';
import { updateNotificationPreferencesRequest } from '../services/authService';
import ProjectMembersPanel from '../components/settings/ProjectMembersPanel';
import ProjectMilestonesPanel from '../components/settings/ProjectMilestonesPanel';

function SettingsView() {
  const { activeProject, updateProject } = useProject();
  const { user, updateUser } = useAuth();
  const { themeMode, setThemeMode, isDark } = useTheme();
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const handleSave = async (values) => {
    if (!activeProject) {
      message.warning('Select a project from the switcher above to save changes.');
      return;
    }
    try {
      await updateProject(activeProject.id, {
        name: values.projectName,
        category: values.category,
        lead: values.lead,
        description: values.description,
      });
      message.success('Settings updated successfully');
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not update project settings'));
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      projectName: activeProject?.name,
      projectKey: activeProject?.key,
      category: activeProject?.category,
      lead: activeProject?.lead,
      description: activeProject?.description,
    });
  }, [activeProject, form]);

  const handlePreferenceChange = async (key, checked) => {
    try {
      const updatedUser = await updateNotificationPreferencesRequest({ [key]: checked });
      updateUser({ notificationPreferences: updatedUser.notificationPreferences });
      message.success('Notification preference updated');
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not update notification preference'));
    }
  };

  const themeOptions = [
    {
      key: 'light',
      title: 'Light Theme',
      description: 'Clean, high-clarity appearance for daytime work.',
      icon: <SunOutlined className="text-xl text-amber-500" />,
      previewBg: 'bg-slate-50 border-slate-200 text-slate-800',
    },
    {
      key: 'dark',
      title: 'Dark Theme',
      description: 'Sleek, deep-slate palette designed for low eye strain.',
      icon: <MoonOutlined className="text-xl text-indigo-400" />,
      previewBg: 'bg-[#0f172a] border-slate-700 text-slate-100',
    },
    {
      key: 'system',
      title: 'System Default',
      description: 'Automatically synchronizes with your OS appearance.',
      icon: <DesktopOutlined className="text-xl text-blue-500" />,
      previewBg: 'bg-gradient-to-r from-slate-100 to-slate-800 border-slate-300 text-slate-800',
    },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure project parameters, workflow statuses, appearance, access permissions, and notifications.
        </p>
      </div>

      <Card bordered={false} className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]">
        <Tabs
          defaultActiveKey="general"
          items={[
            {
              key: 'general',
              label: (
                <span className="flex items-center gap-1.5">
                  <SettingOutlined /> General
                </span>
              ),
              children: (
                <div>
                  {!activeProject && (
                    <Alert
                      type="warning"
                      showIcon
                      message="No project selected"
                      description="Select a project from the switcher in the top bar to edit and save its settings."
                      className="mb-4 max-w-2xl"
                    />
                  )}
                  <Form
                    form={form}
                    layout="vertical"
                    disabled={!activeProject}
                    initialValues={{
                      projectName: activeProject?.name,
                      projectKey: activeProject?.key,
                      category: activeProject?.category,
                      lead: activeProject?.lead,
                      description: activeProject?.description,
                    }}
                    onFinish={handleSave}
                    className="max-w-2xl mt-2"
                    requiredMark={false}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item
                        name="projectName"
                        label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Project Name</span>}
                        rules={[{ required: true }]}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        name="projectKey"
                        label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Key Prefix</span>}
                        rules={[{ required: true }]}
                      >
                        <Input disabled />
                      </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                        name="lead"
                        label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Project Lead</span>}
                      >
                        <Input />
                      </Form.Item>
                    </div>

                    <Form.Item
                      name="description"
                      label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Description</span>}
                    >
                      <Input.TextArea rows={3} />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} className="bg-blue-600">
                      Save Changes
                    </Button>
                  </Form>
                </div>
              ),
            },
            {
              key: 'appearance',
              label: (
                <span className="flex items-center gap-1.5">
                  <BgColorsOutlined /> Appearance
                </span>
              ),
              children: (
                <div className="flex flex-col gap-5 mt-2 max-w-2xl">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Interface Theme</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Select your preferred theme or sync automatically with your system settings.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {themeOptions.map((opt) => {
                      const isSelected = themeMode === opt.key;
                      return (
                        <div
                          key={opt.key}
                          onClick={() => {
                            setThemeMode(opt.key);
                            message.success(`Theme switched to ${opt.title}`);
                          }}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-900/20 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center">
                              {opt.icon}
                            </div>
                            {isSelected && <CheckCircleFilled className="text-blue-600 text-base" />}
                          </div>

                          <div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                              {opt.title}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                              {opt.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-200">Active Mode: </span>
                      <span className="capitalize">{themeMode} ({isDark ? 'Dark Mode' : 'Light Mode'})</span>
                    </div>
                    <Button
                      size="small"
                      onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
                    >
                      Toggle to {isDark ? 'Light' : 'Dark'}
                    </Button>
                  </div>
                </div>
              ),
            },
            {
              key: 'members',
              label: (
                <span className="flex items-center gap-1.5">
                  <TeamOutlined /> Members
                </span>
              ),
              children: <ProjectMembersPanel project={activeProject} />,
            },
            {
              key: 'milestones',
              label: (
                <span className="flex items-center gap-1.5">
                  <FlagOutlined /> Milestones
                </span>
              ),
              children: <ProjectMilestonesPanel project={activeProject} />,
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
                    Every issue moves through this fixed pipeline. Stages are not currently customizable.
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
            {
              key: 'notifications',
              label: (
                <span className="flex items-center gap-1.5">
                  <BellOutlined /> Notification Preferences
                </span>
              ),
              children: (
                <div className="flex flex-col gap-4 mt-2 max-w-xl">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Issue Assignments</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        Get notified when a task or bug is assigned to you
                      </div>
                    </div>
                    <Switch
                      checked={user?.notificationPreferences?.assigned !== false}
                      onChange={(checked) => handlePreferenceChange('assigned', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Status Changes</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        Get notified when an issue assigned to you changes status
                      </div>
                    </div>
                    <Switch
                      checked={user?.notificationPreferences?.statusChanged !== false}
                      onChange={(checked) => handlePreferenceChange('statusChanged', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Comments</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        Get notified when someone comments on an issue you're involved in
                      </div>
                    </div>
                    <Switch
                      checked={user?.notificationPreferences?.comment !== false}
                      onChange={(checked) => handlePreferenceChange('comment', checked)}
                    />
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

export default SettingsView;
