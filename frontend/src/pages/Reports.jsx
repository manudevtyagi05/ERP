import { useEffect } from 'react';
import { Card, Row, Col, Progress } from 'antd';
import { useProject } from '../context/ProjectContext';
import { ISSUE_STATUSES, ISSUE_PRIORITIES } from '../constants/jira';

function Reports() {
  const { issues, stats, teamMembers, setViewScope } = useProject();

  useEffect(() => {
    setViewScope('all');
  }, [setViewScope]);

  // Status distribution breakdown
  const statusCounts = Object.keys(ISSUE_STATUSES).map((key) => {
    const count = issues.filter((i) => i.status === key).length;
    const percentage = issues.length > 0 ? Math.round((count / issues.length) * 100) : 0;
    return {
      key,
      ...ISSUE_STATUSES[key],
      count,
      percentage,
    };
  });

  // Priority breakdown
  const priorityCounts = Object.keys(ISSUE_PRIORITIES).map((key) => {
    const count = issues.filter((i) => i.priority === key).length;
    const percentage = issues.length > 0 ? Math.round((count / issues.length) * 100) : 0;
    return {
      key,
      ...ISSUE_PRIORITIES[key],
      count,
      percentage,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">Reports & Analytics</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Completion rates, issue distribution, and team workload analytics.
        </p>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Completion Rate
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {stats.completionRate}%
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">{stats.completedCount} of {stats.totalIssuesCount} issues resolved</p>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Story Points
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {stats.completedStoryPoints} / {stats.totalStoryPoints}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">Completed vs. total story points</p>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Open Issues
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {stats.openIssuesCount}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">Backlog and to-do issues</p>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              In Progress
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {stats.inProgressCount}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">Actively being worked on</p>
          </Card>
        </Col>
      </Row>

      {/* Charts & Breakdown Grid */}
      <Row gutter={[20, 20]}>
        {/* Status Distribution */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]"
            title={<span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Issue Status Distribution</span>}
          >
            <div className="flex flex-col gap-4">
              {statusCounts.map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.badgeColor }}
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 font-mono">
                      {item.count} ({item.percentage}%)
                    </div>
                  </div>
                  <Progress
                    percent={item.percentage}
                    size="small"
                    showInfo={false}
                    strokeColor={item.badgeColor}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Priority Breakdown */}
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]"
            title={<span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Priority Breakdown</span>}
          >
            <div className="flex flex-col gap-4">
              {priorityCounts.map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 font-mono">
                      {item.count} issues ({item.percentage}%)
                    </div>
                  </div>
                  <Progress
                    percent={item.percentage}
                    size="small"
                    showInfo={false}
                    strokeColor={item.color}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Workload by Team Member */}
        <Col xs={24}>
          <Card
            bordered={false}
            className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]"
            title={<span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Team Workload Distribution</span>}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => {
                const memberIssues = issues.filter((i) => i.assignee?.id === member.id);
                const points = memberIssues.reduce((acc, i) => acc + (i.storyPoints || 0), 0);
                const completedIssues = memberIssues.filter((i) => i.status === 'DONE').length;

                return (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {member.name}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">{member.role}</div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                        {points} pts
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <span>{member.activeTasks} active issues</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{completedIssues} completed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Reports;
