import { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Switch,
  Avatar,
  Tag,
  Divider,
  App,
} from 'antd';
import {
  UserOutlined,
  BgColorsOutlined,
  BellOutlined,
  LockOutlined,
  SaveOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  MailOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getErrorMessage } from '../utils/getErrorMessage';
import {
  updateNotificationPreferencesRequest,
  updateProfileRequest,
  changePasswordRequest,
} from '../services/authService';

function SettingsView() {
  const { user, updateUser } = useAuth();
  const { themeMode, setThemeMode, isDark } = useTheme();
  const [profileForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const { message } = App.useApp();

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: user.department || '',
      });
    }
  }, [user, profileForm]);

  const handleSaveProfile = async (values) => {
    setSavingProfile(true);
    try {
      const updatedUser = await updateProfileRequest({
        firstName: values.firstName,
        lastName: values.lastName,
        department: values.department,
      });
      updateUser(updatedUser);
      message.success('Profile updated successfully');
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not update profile'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('New passwords do not match');
      return;
    }
    setSavingSecurity(true);
    try {
      await changePasswordRequest({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Password changed successfully');
      securityForm.resetFields();
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not change password'));
    } finally {
      setSavingSecurity(false);
    }
  };

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
    },
    {
      key: 'dark',
      title: 'Dark Theme',
      description: 'Sleek, deep-slate palette designed for low eye strain.',
      icon: <MoonOutlined className="text-xl text-indigo-400" />,
    },
    {
      key: 'system',
      title: 'System Default',
      description: 'Automatically synchronizes with your OS appearance.',
      icon: <DesktopOutlined className="text-xl text-blue-500" />,
    },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">
          Account Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your personal profile, interface appearance, notifications, and account security.
        </p>
      </div>

      <Card variant="borderless" className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]">
        <Tabs
          defaultActiveKey="profile"
          items={[
            {
              key: 'profile',
              label: (
                <span className="flex items-center gap-1.5">
                  <UserOutlined /> Profile
                </span>
              ),
              children: (
                <div className="pt-2 max-w-2xl flex flex-col gap-6">
                  {/* User summary card header */}
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40">
                    <Avatar
                      size={54}
                      icon={<UserOutlined />}
                      className="bg-blue-600 text-white font-semibold text-xl border-2 border-white dark:border-slate-700 shadow-sm flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
                          {[user?.firstName, user?.lastName].filter(Boolean).join(' ')}
                        </span>
                        <Tag color="blue" className="text-xs font-medium">
                          {user?.role}
                        </Tag>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <MailOutlined className="text-slate-400" />
                        <span>{user?.email}</span>
                      </div>
                      {user?.department && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <ApartmentOutlined className="text-slate-400" />
                          <span>{user?.department}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleSaveProfile}
                    requiredMark={false}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item
                        name="firstName"
                        label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">First Name</span>}
                        rules={[{ required: true, message: 'First name is required' }]}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        name="lastName"
                        label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Last Name</span>}
                        rules={[{ required: true, message: 'Last name is required' }]}
                      >
                        <Input />
                      </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item
                        name="email"
                        label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Email Address</span>}
                      >
                        <Input disabled />
                      </Form.Item>

                      <Form.Item
                        name="department"
                        label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Department / Designation</span>}
                      >
                        <Input placeholder="e.g. Engineering, Product, QA" />
                      </Form.Item>
                    </div>

                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={savingProfile}
                      className="bg-blue-600 mt-2"
                    >
                      Save Profile
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
            {
              key: 'security',
              label: (
                <span className="flex items-center gap-1.5">
                  <LockOutlined /> Security
                </span>
              ),
              children: (
                <div className="flex flex-col gap-4 mt-2 max-w-xl">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <SafetyCertificateOutlined className="text-blue-500" /> Change Password
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Ensure your account uses a strong password of at least 8 characters.
                    </p>
                  </div>

                  <Divider className="!my-1" />

                  <Form
                    form={securityForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                    requiredMark={false}
                    className="mt-2"
                  >
                    <Form.Item
                      name="currentPassword"
                      label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Current Password</span>}
                      rules={[{ required: true, message: 'Please enter your current password' }]}
                    >
                      <Input.Password placeholder="••••••••" />
                    </Form.Item>

                    <Form.Item
                      name="newPassword"
                      label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">New Password</span>}
                      rules={[
                        { required: true, message: 'Please enter a new password' },
                        { min: 8, message: 'Password must be at least 8 characters' },
                      ]}
                    >
                      <Input.Password placeholder="Minimum 8 characters" />
                    </Form.Item>

                    <Form.Item
                      name="confirmPassword"
                      label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Confirm New Password</span>}
                      rules={[
                        { required: true, message: 'Please confirm your new password' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Passwords do not match'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password placeholder="Re-type new password" />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={savingSecurity}
                      className="bg-blue-600"
                    >
                      Update Password
                    </Button>
                  </Form>
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
