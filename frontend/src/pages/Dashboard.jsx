import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Progress,
  Tag,
  Avatar,
  Button,
  Select,
  Tooltip,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  ThunderboltFilled,
  ArrowRightOutlined,
  UserOutlined,
  ProjectOutlined,
  BranchesOutlined,
  CalendarOutlined,
  RocketOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { ISSUE_TYPES, ISSUE_STATUSES, ISSUE_PRIORITIES } from '../constants/jira';

function IssueRow({ issue, onSelect, onStatusChange }) {
  const typeConfig = ISSUE_TYPES[issue.type] || ISSUE_TYPES.Task;
  const priorityConfig = ISSUE_PRIORITIES[issue.priority] || ISSUE_PRIORITIES.MEDIUM;

  return (
    <div
      className="py-3 px-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 rounded-xl transition group cursor-pointer border border-transparent hover:border-slate-200/80 dark:hover:border-slate-800"
      onClick={() => onSelect(issue.id)}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <Tooltip title={typeConfig.label}>
          <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center flex-shrink-0 text-sm">
            {typeConfig.icon}
          </span>
        </Tooltip>
        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">
          {issue.key}
        </span>
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
          {issue.title}
        </span>
        {issue.epic && (
          <span className="hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 flex-shrink-0">
            {issue.epic}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Tooltip title={`Priority: ${priorityConfig.label}`}>
          <span className="flex items-center text-xs">{priorityConfig.icon}</span>
        </Tooltip>

        <Select
          size="small"
          value={issue.status}
          onChange={(newStatus) => onStatusChange(issue.id, newStatus)}
          style={{ width: 110 }}
          options={Object.keys(ISSUE_STATUSES).map((k) => ({
            value: k,
            label: ISSUE_STATUSES[k].label,
          }))}
          className="text-xs font-semibold"
        />
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    projects,
    issues,
    sprints,
    activeSprint,
    stats,
    setSelectedIssueId,
    moveIssueStatus,
    activeProject,
    setViewScope,
  } = useProject();

  useEffect(() => {
    setViewScope('all');
  }, [setViewScope]);

  const myAssignedIssues = issues.filter((i) => i.assignee?.id === user?.id);
  const activeProjectsCount = projects.filter((p) => p.status === 'Active').length;

  const recentIssues = [...issues]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const activeSprintIssues = issues.filter((i) => activeSprint && i.sprintId === activeSprint.id);
  const activeSprintDone = activeSprintIssues.filter((i) => i.status === 'DONE').length;
  const sprintCompletionRate =
    activeSprintIssues.length > 0
      ? Math.round((activeSprintDone / activeSprintIssues.length) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Dashboard Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/20">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight">
              Welcome back, {user?.firstName || 'Developer'}! 👋
            </span>
            <Tag className="!bg-white/20 !text-white !border-none font-bold text-[10px] uppercase">
              {activeProject ? activeProject.key : 'Global Workspace'}
            </Tag>
          </div>
          <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
            {activeSprint
              ? `Active Sprint: "${activeSprint.name}" • ${activeSprintDone} of ${activeSprintIssues.length} issues resolved (${sprintCompletionRate}% complete).`
              : `Tracking ${stats.totalIssuesCount} total issues across ${projects.length} software projects.`}
          </p>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] rounded-2xl hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Completion Rate
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {stats.completionRate}%
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg shadow-sm">
                <CheckCircleOutlined />
              </div>
            </div>
            <div className="mt-3">
              <Progress percent={stats.completionRate} size="small" showInfo={false} strokeColor="#2563eb" />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>{stats.completedCount} resolved</span>
                <span>{stats.totalIssuesCount} total</span>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] rounded-2xl hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  In Progress Tasks
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {stats.inProgressCount}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shadow-sm">
                <ClockCircleOutlined />
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Active development tasks</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] rounded-2xl hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Story Points Burned
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {stats.completedStoryPoints} / {stats.totalStoryPoints}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shadow-sm">
                <ThunderboltOutlined />
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Across active sprints</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] rounded-2xl hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Projects
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {activeProjectsCount}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg shadow-sm">
                <ProjectOutlined />
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>{projects.length} configured workspaces</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Dashboard Grid */}
      <Row gutter={[20, 20]}>
        {/* Left 15 Cols: Assigned to You & Quick Board Shortcuts */}
        <Col xs={24} lg={15} className="flex flex-col gap-6">
          {/* Assigned to You */}
          <Card
            variant="borderless"
            className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] rounded-2xl overflow-hidden"
            title={
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Assigned to You ({myAssignedIssues.length})
                </span>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate('/work/assigned')}
                  className="text-xs text-blue-600 dark:text-blue-400 !p-0 font-semibold"
                >
                  View All ({myAssignedIssues.length})
                </Button>
              </div>
            }
          >
            <div className="flex flex-col gap-1.5">
              {myAssignedIssues.slice(0, 5).map((issue) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  onSelect={setSelectedIssueId}
                  onStatusChange={moveIssueStatus}
                />
              ))}
              {myAssignedIssues.length === 0 && (
                <div className="text-xs text-slate-400 py-6 text-center">
                  You have no pending issues assigned. Great job! 🎉
                </div>
              )}
            </div>
          </Card>

          {/* Active Projects Cards */}
          <Card
            variant="borderless"
            className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] rounded-2xl"
            title={
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Active Projects
                </span>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate('/projects')}
                  className="text-xs text-blue-600 dark:text-blue-400 !p-0 font-semibold"
                >
                  All Projects <ArrowRightOutlined />
                </Button>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.slice(0, 4).map((p) => {
                const pIssues = issues.filter((i) => i.projectKey === p.key);
                const pDone = pIssues.filter((i) => i.status === 'DONE').length;
                const pProg = pIssues.length > 0 ? Math.round((pDone / pIssues.length) * 100) : 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/board`)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-blue-400 transition cursor-pointer flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                          {p.name}
                        </span>
                        <Tag color="blue" className="text-[10px] font-mono font-bold !m-0">
                          {p.key}
                        </Tag>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{p.description}</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{pIssues.length} issues</span>
                        <span className="font-bold">{pProg}%</span>
                      </div>
                      <Progress percent={pProg} size="small" showInfo={false} strokeColor="#2563eb" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* Right 9 Cols: Quick Navigation & Activity Stream */}
        <Col xs={24} lg={9} className="flex flex-col gap-6">
          {/* Quick Shortcuts */}
          <Card
            variant="borderless"
            className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] rounded-2xl"
            title={
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Quick Shortcuts
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/backlog')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/60 hover:bg-blue-50/50 dark:hover:bg-slate-800 hover:border-blue-400 transition flex items-center gap-2 text-left"
              >
                <BranchesOutlined className="text-blue-500 text-lg" />
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Backlog</div>
                  <div className="text-[10px] text-slate-400">Plan sprints</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/roadmap')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/60 hover:bg-purple-50/50 dark:hover:bg-slate-800 hover:border-purple-400 transition flex items-center gap-2 text-left"
              >
                <CalendarOutlined className="text-purple-500 text-lg" />
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Roadmap</div>
                  <div className="text-[10px] text-slate-400">Gantt timeline</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/releases')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/60 hover:bg-emerald-50/50 dark:hover:bg-slate-800 hover:border-emerald-400 transition flex items-center gap-2 text-left"
              >
                <RocketOutlined className="text-emerald-500 text-lg" />
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Releases</div>
                  <div className="text-[10px] text-slate-400">Versions &amp; build</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/automation')}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/60 hover:bg-amber-50/50 dark:hover:bg-slate-800 hover:border-amber-400 transition flex items-center gap-2 text-left"
              >
                <ThunderboltFilled className="text-amber-500 text-lg" />
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Automation</div>
                  <div className="text-[10px] text-slate-400">WHEN-IF-THEN</div>
                </div>
              </button>
            </div>
          </Card>

          {/* Recent Activity Feed */}
          <Card
            variant="borderless"
            className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] rounded-2xl"
            title={
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                Recent Issues Activity
              </span>
            }
          >
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className="py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-1 rounded transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                      {issue.key}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                      {issue.title}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
