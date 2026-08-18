import { useEffect, useState, useRef } from 'react';
import {
  Layout,
  Menu,
  Dropdown,
  Avatar,
  Badge,
  Button,
  Input,
  Drawer,
  Tag,
  Tooltip,
  App,
} from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  ThunderboltFilled,
  TeamOutlined,
  BarChartOutlined,
  CalendarOutlined,
  BellOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  BranchesOutlined,
  RocketOutlined,
  FilterOutlined,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/common/ThemeToggle';
import CreateIssueModal from '../components/issues/CreateIssueModal';
import IssueDetailDrawer from '../components/issues/IssueDetailDrawer';
import KeyboardShortcutsModal from '../components/common/KeyboardShortcutsModal';

const { Header, Sider, Content } = Layout;

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const searchInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const {
    projects,
    activeProjectKey,
    setActiveProjectKey,
    activeProject,
    notifications,
    searchQuery,
    setSearchQuery,
    setCreateIssueModalOpen,
  } = useProject();
  const { message } = App.useApp();

  const handleLogout = async () => {
    await logout();
    message.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    let lastKey = '';
    const handleKeyDown = (e) => {
      const targetTag = e.target.tagName.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'c') {
        e.preventDefault();
        setCreateIssueModalOpen(true);
      } else if (key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (key === '?') {
        e.preventDefault();
        setShortcutsModalOpen(true);
      } else if (lastKey === 'g') {
        if (key === 'b') {
          e.preventDefault();
          navigate('/board');
        } else if (key === 'k') {
          e.preventDefault();
          navigate('/backlog');
        } else if (key === 'r') {
          e.preventDefault();
          navigate('/roadmap');
        } else if (key === 'd') {
          e.preventDefault();
          navigate('/');
        } else if (key === 'p') {
          e.preventDefault();
          navigate('/projects');
        } else if (key === 'f') {
          e.preventDefault();
          navigate('/filters');
        }
        lastKey = '';
      } else {
        lastKey = key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, setCreateIssueModalOpen]);

  // Sidebar Menu Items
  const sidebarMenuItems = [
    {
      key: '/',
      icon: <DashboardOutlined style={{ fontSize: 16 }} />,
      label: 'Dashboard',
    },
    {
      key: '/board',
      icon: <AppstoreOutlined style={{ fontSize: 16 }} />,
      label: 'Active Board',
    },
    {
      key: '/backlog',
      icon: <BranchesOutlined style={{ fontSize: 16 }} />,
      label: 'Backlog & Sprints',
    },
    {
      key: '/roadmap',
      icon: <CalendarOutlined style={{ fontSize: 16 }} />,
      label: 'Roadmap',
    },
    {
      key: '/issues',
      icon: <CheckSquareOutlined style={{ fontSize: 16 }} />,
      label: 'All Issues',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined style={{ fontSize: 16 }} />,
      label: 'Projects',
    },
    {
      key: '/releases',
      icon: <RocketOutlined style={{ fontSize: 16 }} />,
      label: 'Releases',
    },
    {
      key: '/components',
      icon: <AppstoreOutlined style={{ fontSize: 16 }} />,
      label: 'Components',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined style={{ fontSize: 16 }} />,
      label: 'Reports & Velocity',
    },
    {
      key: '/filters',
      icon: <FilterOutlined style={{ fontSize: 16 }} />,
      label: 'JQL & Filters',
    },
    {
      key: '/automation',
      icon: <ThunderboltFilled style={{ fontSize: 16 }} className="text-amber-500" />,
      label: 'Automation Rules',
    },
    {
      key: '/teams',
      icon: <TeamOutlined style={{ fontSize: 16 }} />,
      label: 'Teams',
    },
    ...(user?.role === 'ADMIN'
      ? [
          {
            key: '/admin',
            icon: <SafetyCertificateOutlined style={{ fontSize: 16 }} />,
            label: 'Admin Console',
          },
        ]
      : []),
    {
      key: '/settings',
      icon: <SettingOutlined style={{ fontSize: 16 }} />,
      label: 'Settings',
    },
  ];

  // User menu items
  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <div className="py-1.5 px-1">
          <div className="font-bold text-xs text-slate-800 dark:text-slate-100">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="text-[11px] text-slate-500">{user?.email}</div>
          <Tag color="blue" className="text-[10px] font-bold mt-1">
            {user?.role}
          </Tag>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'User Settings',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'shortcuts',
      icon: <QuestionCircleOutlined />,
      label: 'Keyboard Shortcuts (?)',
      onClick: () => setShortcutsModalOpen(true),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Sign Out',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="h-screen w-screen overflow-hidden bg-[#f8fafc] dark:bg-[#090d16] flex flex-row" hasSider>
      {/* Sider Navigation (Desktop - Fixed in place) */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={256}
        collapsedWidth={68}
        className="hidden md:flex flex-col h-screen flex-shrink-0 z-30 border-r border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#0e1526]"
        theme={isDark ? 'dark' : 'light'}
      >
        {/* Brand Logo */}
        <div className="h-14 flex-shrink-0 px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
              <ThunderboltFilled />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                  Axiom Flow
                </span>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Agile PM Suite
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Project Switcher Pill in Sider */}
        {!collapsed && projects.length > 0 && (
          <div className="flex-shrink-0 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Active Project
            </label>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'ALL',
                    label: 'All Projects (Global)',
                    onClick: () => setActiveProjectKey('ALL'),
                  },
                  ...projects.map((p) => ({
                    key: p.key,
                    label: `${p.key} — ${p.name}`,
                    onClick: () => setActiveProjectKey(p.key),
                  })),
                ],
              }}
              trigger={['click']}
            >
              <button
                type="button"
                className="w-full text-left p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:border-blue-400 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex-shrink-0">
                    {activeProjectKey}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {activeProject ? activeProject.name : 'All Projects'}
                  </span>
                </div>
              </button>
            </Dropdown>
          </div>
        )}

        {/* Menu Items (Scrolls independently with visible scrollbar) */}
        <div className="flex-1 min-h-0 overflow-y-auto py-2 pb-6 sidebar-scroll-container pr-0.5">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={sidebarMenuItems}
            onClick={({ key }) => navigate(key)}
            className="!border-none font-semibold text-xs"
          />
        </div>
      </Sider>

      {/* Mobile Navigation Drawer */}
      <Drawer
        placement="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        width={260}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' } }}
        className="md:hidden"
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow">
            <ThunderboltFilled />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-slate-100">Axiom Flow</div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Agile Management</div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto py-2 pb-6 sidebar-scroll-container">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={sidebarMenuItems}
            onClick={({ key }) => navigate(key)}
            className="!border-none font-semibold text-xs py-2"
          />
        </div>
      </Drawer>

      {/* Main Layout Area (Right Side - Header fixed, Content scrollable) */}
      <Layout className="h-screen flex flex-col flex-1 overflow-hidden bg-transparent min-w-0">
        {/* Top Header (Fixed at top of screen) */}
        <Header className="h-14 flex-shrink-0 px-4 sticky top-0 z-20 bg-white/95 dark:bg-[#0e1526]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button (Only on mobile <768px) */}
            <div className="block md:hidden">
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileDrawerOpen(true)}
                className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              />
            </div>

            {/* Desktop Sider Collapse Toggle (Only on desktop >=768px) */}
            <div className="hidden md:block">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              />
            </div>

            {/* Global Search Input with Shortcut hint */}
            <div className="relative w-48 sm:w-64 md:w-80">
              <Input
                ref={searchInputRef}
                placeholder="Search tickets, epics, JQL... (/)"
                prefix={<SearchOutlined className="text-slate-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={() => navigate(`/filters?q=${encodeURIComponent(searchQuery)}`)}
                allowClear
                className="text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            <Tooltip title="Keyboard Shortcuts (?)">
              <Button
                type="text"
                icon={<QuestionCircleOutlined />}
                onClick={() => setShortcutsModalOpen(true)}
                className="hidden sm:flex text-slate-600 dark:text-slate-300"
              />
            </Tooltip>

            <Tooltip title="Notifications">
              <Badge count={unreadCount} size="small" offset={[-2, 4]}>
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  onClick={() => navigate('/notifications')}
                  className="text-slate-600 dark:text-slate-300"
                />
              </Badge>
            </Tooltip>

            <ThemeToggle />

            {/* User Dropdown */}
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <button
                type="button"
                className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-blue-400 transition"
              >
                <Avatar size={30} className="bg-blue-600 text-xs font-bold shadow-sm">
                  {user?.firstName?.[0] || 'U'}
                </Avatar>
              </button>
            </Dropdown>
          </div>
        </Header>

        {/* Content Body (Independent smooth scrollable area) */}
        <Content className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          <Outlet />
        </Content>
      </Layout>

      {/* Global Modals & Drawers */}
      <CreateIssueModal />
      <IssueDetailDrawer />
      <KeyboardShortcutsModal
        open={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </Layout>
  );
}

export default MainLayout;
