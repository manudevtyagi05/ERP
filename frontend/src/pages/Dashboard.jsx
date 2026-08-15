import { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Progress,
  Tag,
  Avatar,
  Button,
  Space,
  Select,
  Tooltip,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  UserOutlined,
  ProjectOutlined,
  FlagOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../constants/permissions';
import { ISSUE_TYPES, ISSUE_STATUSES, ISSUE_PRIORITIES } from '../constants/jira';
import { listMilestones } from '../services/milestoneService';

function useUpcomingMilestones(projects) {
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    if (!projects.length) {
      setMilestones([]);
      return undefined;
    }
    let cancelled = false;
    Promise.all(projects.map((p) => listMilestones(p.id).catch(() => []))).then((results) => {
      if (cancelled) return;
      const upcoming = results
        .flat()
        .filter((m) => m.status !== 'COMPLETED' && m.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 4);
      setMilestones(upcoming);
    });
    return () => {
      cancelled = true;
    };
  }, [projects]);

  return milestones;
}

function IssueRow({ issue, onSelect, onStatusChange }) {
  const typeConfig = ISSUE_TYPES[issue.type] || ISSUE_TYPES.Task;
  const priorityConfig = ISSUE_PRIORITIES[issue.priority] || ISSUE_PRIORITIES.MEDIUM;

  return (
    <div
      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 -mx-4 px-4 transition group rounded-md cursor-pointer"
      onClick={() => onSelect(issue.id)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Tooltip title={typeConfig.label}>
          <span className="p-1 rounded bg-slate-100 dark:bg-slate-800 flex items-center">{typeConfig.icon}</span>
        </Tooltip>
        <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">{issue.key}</span>
        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
          {issue.title}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Tooltip title={`Priority: ${priorityConfig.label}`}>
          <span className="flex items-center">{priorityConfig.icon}</span>
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
          className="text-xs"
        />
      </div>
    </div>
  );
}

function UpcomingMilestonesCard({ milestones }) {
  return (
    <Card
      bordered={false}
      className="shadow-sm border border-slate-200/70 dark:border-slate-800 dark:bg-[#131b2e]"
      title={<span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Upcoming Milestones</span>}
    >
      {milestones.length === 0 ? (
        <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No upcoming milestones scheduled.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {milestones.map((m) => (
            <div key={m.id} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{m.name}</span>
                <Tag color={m.status === 'IN_PROGRESS' ? 'blue' : 'default'} className="!mr-0 text-[10px]">
                  {m.status === 'IN_PROGRESS' ? 'In Progress' : 'Planned'}
                </Tag>
              </div>
              <Progress percent={m.progress} size="small" showInfo={false} strokeColor="#2563eb" />
              <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                <span>{m.completedIssues}/{m.totalIssues} issues</span>
                {m.dueDate && <span>Due {m.dueDate}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    projects,
    issues,
    stats,
    setSelectedIssueId,
    setCreateIssueModalOpen,
    moveIssueStatus,
    activeProject,
    setViewScope,
  } = useProject();

  useEffect(() => {
    setViewScope('all');
  }, [setViewScope]);

  const milestones = useUpcomingMilestones(projects);
  const myAssignedIssues = issues.filter((i) => i.assignee?.id === user?.id);
  const activeProjectsCount = projects.filter((p) => p.status === 'Active').length;

  const recentIssues = [...issues]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">
            {activeProject ? `${activeProject.name} Dashboard` : 'Workspace Overview'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tracking {stats.totalIssuesCount} total issues across {projects.length} projects
          </p>
        </div>

        <Space>
          <Button icon={<ThunderboltOutlined />} onClick={() => navigate('/board')}>
            Go to Board
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateIssueModalOpen(true)}
            className="bg-blue-600 hover:!bg-blue-700"
          >
            Create Issue
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm border border-slate-200/70 dark:border-slate-800 dark:bg-[#131b2e] hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Completion Rate
                </div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.completionRate}%</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
                <CheckCircleOutlined />
              </div>
            </div>
            <div className="mt-3">
              <Progress percent={stats.completionRate} size="small" showInfo={false} strokeColor="#2563eb" />
              <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                <span>{stats.completedCount} completed</span>
                <span>{stats.totalIssuesCount} total</span>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm border border-slate-200/70 dark:border-slate-800 dark:bg-[#131b2e] hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">In Progress</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.inProgressCount}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
                <ClockCircleOutlined />
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
              <span>Active development tasks</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm border border-slate-200/70 dark:border-slate-800 dark:bg-[#131b2e] hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Story Points Done
                </div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {stats.completedStoryPoints} / {stats.totalStoryPoints}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
                <ThunderboltOutlined />
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>Across all active projects</span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm border border-slate-200/70 dark:border-slate-800 dark:bg-[#131b2e] hover:border-slate-300 dark:hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Active Projects
                </div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{activeProjectsCount}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg">
                <ProjectOutlined />
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-500" />
              <span>{projects.length} total projects</span>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={15} className="flex flex-col gap-6">
          <Card
            bordered={false}
            className="shadow-sm border border-slate-200/70 dark:border-slate-800 dark:bg-[#131b2e]"
            title={
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Assigned to You ({myAssignedIssues.length})
                </span>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate('/work/assigned')}
                  className="text-xs text-blue-600 dark:text-blue-400 !p-0"
                >
                  View All
                </Button>
              </div>
            }
          >
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {myAssignedIssues.slice(0, 5).map((issue) => (
                <IssueRow key={issue.id} issue={issue} onSelect={setSelectedIssueId} onStatusChange={moveIssueStatus} />
              ))}
              {myAssignedIssues.length === 0 && (
                <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No issues assigned to you.</div>
              )}
            </div>
          </Card>

          <Card
            bordered={false}
            className="shadow-sm border border-slate-200/70 dark:border-slate-800 dark:bg-[#131b2e]"
            title={
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Active Projects</span>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate('/projects')}
                  className="text-xs text-blue-600 dark:text-blue-400 !p-0"
                >
                  All Projects <ArrowRightOutlined />
                </Button>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate('/board')}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-900/20 transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {project.key}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">{project.category}</span>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">{project.name}</h3>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      <span>Progress</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{project.progress}%</span>
                    </div>
                    <Progress percent={project.progress} size="small" showInfo={false} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={9} className="flex flex-col gap-6">
          <UpcomingMilestonesCard milestones={milestones} />

          <Card
            bordered={false}
            className="shadow-sm border border-slate-200/70 dark:border-slate-800 dark:bg-[#131b2e]"
            title={<span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Updates</span>}
          >
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {recentIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="py-2.5 flex items-start gap-2.5 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/60 -mx-2 px-2 rounded transition"
                  onClick={() => setSelectedIssueId(issue.id)}
                >
                  <Avatar size="small" icon={<UserOutlined />} className="mt-0.5 bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{issue.assignee?.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(issue.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 truncate mt-0.5">
                      Updated <span className="font-mono font-medium text-blue-600 dark:text-blue-400">{issue.key}</span>: {issue.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function MemberDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    projects,
    issues,
    setSelectedIssueId,
    setCreateIssueModalOpen,
    moveIssueStatus,
    setViewScope,
  } = useProject();

  useEffect(() => {
    setViewScope('mine');
  }, [setViewScope]);

  const milestones = useUpcomingMilestones(projects);
  const myIssues = issues.filter((i) => i.assignee?.id === user?.id || i.reporter?.id === user?.id);
  const myAssigned = issues.filter((i) => i.assignee?.id === user?.id);
  const myOpen = myAssigned.filter((i) => i.status === 'TODO' || i.status === 'BACKLOG');
  const myInProgress = myAssigned.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'IN_REVIEW');
  const myCompleted = myAssigned.filter((i) => i.status === 'DONE');
  const myProjectKeys = new Set(myAssigned.map((i) => i.projectKey));

  const today = new Date().toISOString().split('T')[0];
  const myOverdue = myAssigned.filter((i) => i.status !== 'DONE' && i.dueDate && i.dueDate < today);
  const myDueToday = myAssigned.filter((i) => i.status !== 'DONE' && i.dueDate === today);

  const recentActivity = [...myIssues]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">
            {user?.firstName ? `Welcome back, ${user.firstName}` : 'Your Workspace'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            You have {myOpen.length + myInProgress.length} open issue{myOpen.length + myInProgress.length === 1 ? '' : 's'} assigned to you
          </p>
        </div>

        <Space>
          <Button icon={<ThunderboltOutlined />} onClick={() => navigate('/work/assigned')}>
            My Work
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateIssueModalOpen(true)}
            className="bg-blue-600 hover:!bg-blue-700"
          >
            Create Issue
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} className="shadow-sm border border-slate-200/70 dark:border-slate-800 dark:bg-[#131b2e]">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">To Do</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{myOpen.length}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} className="shadow-sm border border-slate-200/70 dark:border-slate-800 dark:bg-[#131b2e]">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">In Progress</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{myInProgress.length}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} className="shadow-sm border border-slate-200/70 dark:border-slate-800 dark:bg-[#131b2e]">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{myCompleted.length}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} className="shadow-sm border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-900/20">
            <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Due Today</div>
            <div className="text-2xl font-bold text-amber-800 dark:text-amber-300 mt-1">{myDueToday.length}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} className="shadow-sm border border-red-200 dark:border-red-800/60 bg-red-50/40 dark:bg-red-900/20">
            <div className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">Overdue</div>
            <div className="text-2xl font-bold text-red-800 dark:text-red-300 mt-1">{myOverdue.length}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} className="shadow-sm border border-slate-200/70 dark:border-slate-800 dark:bg-[#131b2e]">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">My Projects</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{myProjectKeys.size}</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={15} className="flex flex-col gap-6">
          <Card
            bordered={false}
            className="shadow-sm border border-slate-200/70 dark:border-slate-800 dark:bg-[#131b2e]"
            title={
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">My Assigned Issues ({myAssigned.length})</span>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate('/work/assigned')}
                  className="text-xs text-blue-600 dark:text-blue-400 !p-0"
                >
                  View All
                </Button>
              </div>
            }
          >
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {myAssigned.slice(0, 6).map((issue) => (
                <IssueRow key={issue.id} issue={issue} onSelect={setSelectedIssueId} onStatusChange={moveIssueStatus} />
              ))}
              {myAssigned.length === 0 && (
                <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                  Nothing assigned to you yet.
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={9} className="flex flex-col gap-6">
          <UpcomingMilestonesCard milestones={milestones} />

          <Card
            bordered={false}
            className="shadow-sm border border-slate-200/70 dark:border-slate-800 dark:bg-[#131b2e]"
            title={<span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Your Recent Activity</span>}
          >
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {recentActivity.map((issue) => (
                <div
                  key={issue.id}
                  className="py-2.5 flex items-start gap-2.5 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/60 -mx-2 px-2 rounded transition"
                  onClick={() => setSelectedIssueId(issue.id)}
                >
                  <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FlagOutlined className="text-slate-400 dark:text-slate-500 text-xs" />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-medium text-blue-600 dark:text-blue-400">{issue.key}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(issue.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 truncate mt-0.5">{issue.title}</div>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No activity yet.</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function Dashboard() {
  const { hasPermission } = useAuth();
  const isManager = hasPermission(PERMISSIONS.PROJECT_UPDATE);
  return isManager ? <ManagerDashboard /> : <MemberDashboard />;
}

export default Dashboard;
