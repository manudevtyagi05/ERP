import { useState } from 'react';
import { Form, Input, Button, Card, Alert, Divider, App } from 'antd';
import { MailOutlined, LockOutlined, ThunderboltFilled } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/getErrorMessage';
import ThemeToggle from '../components/common/ThemeToggle';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setError(null);
    try {
      await login(values);
      message.success('Welcome back!');
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid email or password'));
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoCredentials = (email, password) => {
    form.setFieldsValue({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090d16] px-4 relative transition-colors">
      {/* Floating Theme Toggle in top right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* Brand header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shadow-sm mb-3">
            <ThunderboltFilled />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">
            Acme Platform
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise Project Management & ERP
          </p>
        </div>

        <Card variant="borderless" className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] p-2">
          {error && (
            <Alert
              type="error"
              showIcon
              message={error}
              className="mb-4 text-xs"
              closable
              onClose={() => setError(null)}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            disabled={submitting}
            requiredMark={false}
          >
            <Form.Item
              label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Email Address</span>}
              name="email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Enter a valid email address' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-slate-400" />}
                placeholder="you@company.com"
                autoComplete="email"
                className="text-xs"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-medium text-slate-600 dark:text-slate-300">Password</span>}
              name="password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="••••••••"
                autoComplete="current-password"
                className="text-xs"
              />
            </Form.Item>

            <Form.Item className="!mb-3 mt-4">
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                className="bg-blue-600 hover:!bg-blue-700 font-medium"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <div className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          Protected by enterprise SSO & RBAC security policies
        </div>
      </div>
    </div>
  );
}

export default Login;
