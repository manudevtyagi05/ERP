import { useEffect, useState } from 'react';
import {
  Layout,
  Menu,
  Dropdown,
  Avatar,
  Badge,
  Button,
  Input,
  Breadcrumb,
  Tag,
  Drawer,
  App,
} from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  CheckSquareOutlined,
  BugOutlined,
  AppstoreOutlined,
  TeamOutlined,
  BarChartOutlined,
  CalendarOutlined,
  BellOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  UnorderedListOutlined,
  ThunderboltFilled,
  SunOutlined,
  MoonOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/common/ThemeToggle';
import CreateIssueModal from '../components/issues/CreateIssueModal';
import IssueDetailDrawer from '../components/issues/IssueDetailDrawer';
import { listMilestones } from '../services/milestoneService';
import { PERMISSIONS } from '../constants/permissions';

const { Header, Sider, Content } = Layout;

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  const [upcomingMilestone, setUpcomingMilestone] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const {
    projects,
    activeProjectKey,
    setActiveProjectKey,
    activeProject,
    notifications,
    searchQuery,
    setSearchQuery,
    setSelectedIssueId,
    issues,
  } = useProject();
  const { message } = App.useApp();

  const handleLogout = async () => {
    await logout();
    message.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    if (!activeProject) {
      setUpcomingMilestone(null);
      return;
    }
    listMilestones(activeProject.id)
      .then((milestones) => {
        const upcoming = milestones
          .filter((m) => m.status !== 'COMPLETED' && m.dueDate)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
        setUpcomingMilestone(upcoming || null);
      })
      .catch(() => setUpcomingMilestone(null));
  }, [activeProject]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setMobileSearchVisible(false);
  }, [location.pathname, location.search]);

  // Navigation Items shared between Desktop Sider and Mobile Drawer
  const sidebarMenuItems = [
    {
      key: '/',
      icon: <DashboardOutlined style={{ fontSize: 16 }} />,
      label: 'Dashboard',
    },
    {
      key: '/board',
      icon: <AppstoreOutlined style={{ fontSize: 16 }} />,
      label: 'Board',
    },
    {
      key: '/backlog',
      icon: <UnorderedListOutlined style={{ fontSize: 16 }} />,
      label: 'Backlog',
    },
    {
      key: 'projects-group',
      icon: <ProjectOutlined style={{ fontSize: 16 }} />,
      label: 'Projects',
      children: [
        { key: '/projects', label: 'All Projects' },
        { key: '/projects?filter=my', label: 'My Projects' },
        { key: '/projects?filter=recent', label: 'Recent Projects' },
      ],
    },
    {
      key: 'work-group',
      icon: <CheckSquareOutlined style={{ fontSize: 16 }} />,
      label: 'Work',
      children: [
        { key: '/work/my-tasks', label: 'My Tasks' },
        { key: '/work/assigned', label: 'Assigned to Me' },
        { key: '/work/created', label: 'Created by Me' },
      ],
    },
    {
      key: 'issues-group',
      icon: <BugOutlined style={{ fontSize: 16 }} />,
      label: 'Issues',
      children: [
        { key: '/issues', label: 'All Issues' },
        { key: '/issues?status=OPEN', label: 'Open' },
        { key: '/issues?status=IN_PROGRESS', label: 'In Progress' },
        { key: '/issues?status=DONE', label: 'Completed' },
      ],
    },
    {
      type: 'divider',
      style: { margin: '8px 12px', borderColor: isDark ? '#1e293b' : '#f1f5f9' },
    },
    hasPermission(PERMISSIONS.USER_READ) && {
      key: '/teams',
      icon: <TeamOutlined style={{ fontSize: 16 }} />,
      label: 'Teams',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined style={{ fontSize: 16 }} />,
      label: 'Reports',
    },
    {
      key: '/calendar',
      icon: <CalendarOutlined style={{ fontSize: 16 }} />,
      label: 'Calendar',
    },
    {
      key: '/notifications',
      icon: (
        <Badge count={unreadCount} size="small" offset={[4, -2]} color="#2563eb">
          <BellOutlined style={{ fontSize: 16 }} />
        </Badge>
      ),
      label: 'Notifications',
    },
    {
      key: '/settings',
      icon: <SettingOutlined style={{ fontSize: 16 }} />,
      label: 'Settings',
    },
  ].filter(Boolean);

  // User Profile Dropdown
  const userMenuItems = [
    {
      key: 'user-header',
      label: (
        <div className="py-1 px-1">
          <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
            {[user?.firstName, user?.lastName].filter(Boolean).join(' ')}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</div>
          <div className="mt-1">
            <Tag color="blue" className="text-[11px] font-normal !mr-0">
              {user?.role}
            </Tag>
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'theme-toggle',
      icon: isDark ? <SunOutlined className="text-amber-500" /> : <MoonOutlined className="text-indigo-400" />,
      label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      onClick: toggleTheme,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Personal Settings',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Log out',
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Project Switcher Dropdown
  const projectMenuItems = [
    {
      key: 'ALL',
      label: (
        <div className="flex items-center justify-between gap-4 py-1">
          <span className="font-medium text-slate-800 dark:text-slate-200">All Workspaces</span>
          {activeProjectKey === 'ALL' && <span className="text-blue-500 text-xs font-semibold">Active</span>}
        </div>
      ),
      onClick: () => setActiveProjectKey('ALL'),
    },
    { type: 'divider' },
    ...projects.map((p) => ({
      key: p.key,
      label: (
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {p.key}
            </span>
            <span className="text-slate-800 dark:text-slate-200 text-xs font-medium">{p.name}</span>
          </div>
          {activeProjectKey === p.key && <span className="text-blue-500 text-xs font-semibold">Active</span>}
        </div>
      ),
      onClick: () => setActiveProjectKey(p.key),
    })),
  ];

  // Dynamic breadcrumb paths
  const getBreadcrumbs = () => {
    const currentPath = location.pathname;
    const items = [{ title: 'Home', href: '/' }];

    if (activeProject) {
      items.push({ title: `${activeProject.name} (${activeProject.key})` });
    }

    if (currentPath === '/board') items.push({ title: 'Kanban Board' });
    else if (currentPath === '/backlog') items.push({ title: 'Backlog & Sprints' });
    else if (currentPath.startsWith('/projects')) items.push({ title: 'Projects' });
    else if (currentPath.startsWith('/work')) items.push({ title: 'Work Directory' });
    else if (currentPath.startsWith('/issues')) items.push({ title: 'Issues Tracker' });
    else if (currentPath === '/teams') items.push({ title: 'Team Directory' });
    else if (currentPath === '/reports') items.push({ title: 'Reports & Velocity' });
    else if (currentPath === '/calendar') items.push({ title: 'Milestones & Calendar' });
    else if (currentPath === '/notifications') items.push({ title: 'Notifications' });
    else if (currentPath === '/settings') items.push({ title: 'Account Settings' });

    return items;
  };

  // Quick search results
  const matchingIssues = searchQuery.trim()
    ? issues.filter(
        (i) =>
          i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.key.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  /**
   * Shared Navigation Content Component
   * Used identically inside both the desktop/tablet Sider and the mobile Drawer
   */
  const renderNavContent = (isMobile = false) => (
    <div className="h-full flex flex-col justify-between overflow-hidden bg-white dark:bg-[#0e1526]">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand / Workspace Switcher */}
        <div className="h-14 border-b border-slate-100 dark:border-slate-800 flex items-center px-4 justify-between flex-shrink-0">
          <Dropdown menu={{ items: projectMenuItems }} trigger={['click']} placement="bottomLeft">
            <div className="flex items-center gap-2.5 cursor-pointer overflow-hidden group min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                <ThunderboltFilled />
              </div>
              {(!collapsed || isMobile) && (
                <div className="truncate flex flex-col min-w-0">
                  <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight truncate group-hover:text-blue-500 transition">
                    {activeProject ? activeProject.name : 'Enterprise ERP'}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                    {activeProject ? activeProject.key : 'Software Project'}
                  </span>
                </div>
              )}
            </div>
          </Dropdown>

          {!isMobile && !collapsed && (
            <Button
              type="text"
              size="small"
              icon={<MenuFoldOutlined className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />}
              onClick={() => setCollapsed(true)}
              className="!w-7 !h-7 flex items-center justify-center !p-0 flex-shrink-0"
            />
          )}

          {isMobile && (
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />}
              onClick={() => setMobileDrawerOpen(false)}
              className="!w-7 !h-7 flex items-center justify-center !p-0 flex-shrink-0"
            />
          )}
        </div>

        {/* Collapsed expand button for desktop/tablet */}
        {!isMobile && collapsed && (
          <div className="py-2 flex justify-center border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <Button
              type="text"
              size="small"
              icon={<MenuUnfoldOutlined className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />}
              onClick={() => setCollapsed(false)}
            />
          </div>
        )}

        {/* Navigation Menu */}
        <div className="py-2 flex-1 overflow-y-auto">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname + location.search, location.pathname]}
            defaultOpenKeys={['projects-group', 'work-group', 'issues-group']}
            items={sidebarMenuItems}
            onClick={({ key }) => {
              if (key && !key.endsWith('-group')) {
                navigate(key);
                if (isMobile) {
                  setMobileDrawerOpen(false);
                }
              }
            }}
            inlineIndent={16}
            className="!border-none !bg-transparent"
          />
        </div>
      </div>

      {/* Sidebar Footer: nearest upcoming milestone for active project */}
      {(!collapsed || isMobile) && upcomingMilestone && (
        <div className="p-3 mx-3 my-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1 font-medium">
            <span className="truncate">{upcomingMilestone.name}</span>
            <span className="text-blue-600 dark:text-blue-400">{upcomingMilestone.progress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 dark:bg-blue-500 h-full rounded-full" style={{ width: `${upcomingMilestone.progress}%` }} />
          </div>
          {upcomingMilestone.dueDate && (
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Due {upcomingMilestone.dueDate}</div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Layout hasSider className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#090d16]">
      {/* Desktop & Tablet Sider (hidden on mobile via CSS md:block) */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={250}
        collapsedWidth={64}
        className="jira-sidebar border-r border-slate-200/80 dark:border-slate-800 !bg-white dark:!bg-[#0e1526] h-screen select-none flex-shrink-0 hidden md:block"
        style={{ zIndex: 50 }}
      >
        {renderNavContent(false)}
      </Sider>

      {/* Mobile Navigation Drawer */}
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        styles={{ body: { padding: 0 } }}
        width={280}
        className="mobile-nav-drawer md:hidden"
      >
        {renderNavContent(true)}
      </Drawer>

      {/* Main Layout Container */}
      <Layout className="h-screen flex flex-col min-w-0 overflow-hidden !bg-slate-50 dark:!bg-[#090d16]">
        {/* Header Bar */}
        <Header className="!bg-white dark:!bg-[#0e1526] border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-4 md:px-6 h-14 flex items-center justify-between flex-shrink-0 z-40 transition-colors">
          {/* Left: Mobile menu toggle / Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Mobile Hamburger Button (visible only on mobile screens) */}
            <div className="block md:hidden">
              <Button
                type="text"
                size="small"
                icon={<MenuOutlined className="text-slate-600 dark:text-slate-300 text-base" />}
                onClick={() => setMobileDrawerOpen(true)}
                className="!w-8 !h-8 flex items-center justify-center !p-0 flex-shrink-0"
              />
            </div>

            {/* Breadcrumbs (collapses on tiny mobile viewports) */}
            <div className="min-w-0 truncate">
              <Breadcrumb
                className="truncate text-xs"
                items={getBreadcrumbs().map((b) => ({
                  title: <span className="text-xs text-slate-500 dark:text-slate-400">{b.title}</span>,
                }))}
              />
            </div>
          </div>

          {/* Center / Right: Global Search & Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Mobile search toggle button on small screens */}
            <div className="sm:hidden">
              <Button
                type="text"
                size="small"
                icon={<SearchOutlined className="text-slate-600 dark:text-slate-300 text-base" />}
                onClick={() => setMobileSearchVisible((prev) => !prev)}
                className="!w-8 !h-8 flex items-center justify-center !p-0"
              />
            </div>

            {/* Jira-style Global Search (visible on sm+ or toggled on mobile) */}
            <div className={`relative ${mobileSearchVisible ? 'absolute left-2 right-2 top-14 bg-white dark:bg-slate-900 p-2 shadow-lg rounded-b-lg border border-slate-200 dark:border-slate-800 z-50 flex items-center' : 'hidden sm:block'}`}>
              <Input
                placeholder="Search issues (e.g. CORE-104)..."
                prefix={<SearchOutlined className="text-slate-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                className="w-full sm:w-44 md:w-60 lg:w-72 text-xs bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 rounded-md focus:bg-white dark:focus:bg-slate-800 dark:text-slate-100 transition"
                autoFocus={mobileSearchVisible}
              />

              {/* Quick Search Dropdown Result Panel */}
              {searchQuery.trim() && (
                <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2 z-50">
                  <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Matching Issues ({matchingIssues.length})
                  </div>
                  {matchingIssues.length === 0 ? (
                    <div className="text-xs text-slate-400 py-3 text-center">No issues found</div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto flex flex-col gap-1">
                      {matchingIssues.map((issue) => (
                        <div
                          key={issue.id}
                          onClick={() => {
                            setSelectedIssueId(issue.id);
                            setSearchQuery('');
                            setMobileSearchVisible(false);
                          }}
                          className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer text-xs transition"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                              {issue.key}
                            </span>
                            <span className="truncate text-slate-700 dark:text-slate-200">{issue.title}</span>
                          </div>
                          <Tag className="!mr-0 text-[10px] scale-90">{issue.status}</Tag>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Notifications Button */}
            <Button
              type="text"
              icon={
                <Badge count={unreadCount} size="small" offset={[2, -2]} color="#2563eb">
                  <BellOutlined className="text-slate-600 dark:text-slate-300 text-base" />
                </Badge>
              }
              onClick={() => navigate('/notifications')}
              className="!w-8 sm:!w-9 !h-8 sm:!h-9 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            />

            {/* User Profile */}
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer pl-0.5 hover:opacity-85 transition flex-shrink-0">
                <Avatar
                  icon={<UserOutlined />}
                  size={28}
                  className="border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-700"
                />
                <span className="hidden lg:inline text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                  {[user?.firstName, user?.lastName].filter(Boolean).join(' ')}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content Body with Responsive Padding & Min-Width Constraint */}
        <Content className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 min-h-0">
          <div className="max-w-7xl w-full mx-auto min-w-0">
            <Outlet />
          </div>
        </Content>
      </Layout>

      {/* Global Create Issue Modal */}
      <CreateIssueModal />

      {/* Global Issue Details Drawer */}
      <IssueDetailDrawer />
    </Layout>
  );
}

export default MainLayout;
