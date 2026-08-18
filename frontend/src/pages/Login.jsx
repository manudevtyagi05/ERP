import { useState } from 'react';
import { Form, Input, Button, Card, Alert, App } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  ThunderboltFilled,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/getErrorMessage';
import ThemeToggle from '../components/common/ThemeToggle';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [loginForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (values) => {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090d16] px-4 relative transition-colors">
      {/* Floating Theme Toggle in top right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md flex flex-col gap-5 my-8">
        {/* Brand header */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30 mb-3">
            <ThunderboltFilled />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight !mb-0">
            Axiom Flow
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise Agile Project Management &amp; Issue Tracking
          </p>
        </div>

        <Card
          variant="borderless"
          className="shadow-md border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] p-2 sm:p-4 rounded-2xl"
        >
          <div className="mb-5 text-center">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 m-0">
              Sign In
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0">
              Enter your credentials to access your workspace
            </p>
          </div>

          {error && (
            <Alert
              type="error"
              showIcon
              message={error}
              className="mb-4 text-xs rounded-lg"
              closable
              onClose={() => setError(null)}
            />
          )}

          <Form
            form={loginForm}
            layout="vertical"
            onFinish={handleLogin}
            disabled={submitting}
            requiredMark={false}
          >
            <Form.Item
              label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</span>}
              name="email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Enter a valid email address' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-slate-400" />}
                placeholder="name@company.com"
                autoComplete="email"
                className="text-xs h-9 rounded-lg"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</span>}
              name="password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="••••••••"
                autoComplete="current-password"
                className="text-xs h-9 rounded-lg"
              />
            </Form.Item>

            <Form.Item className="!mb-2 mt-4">
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                className="!bg-blue-600 hover:!bg-blue-700 font-bold h-9 rounded-lg shadow-sm"
              >
                Sign In <ArrowRightOutlined />
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <div className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          Protected by enterprise SSO &amp; multi-tenant security isolation policies
        </div>
      </div>
    </div>
  );
}

export default Login;
