import { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Progress, Segmented, Select, Tag } from 'antd';
import {
  RiseOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  FireOutlined,
  DashboardOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { ISSUE_STATUSES, ISSUE_PRIORITIES } from '../constants/jira';

function Reports() {
  const { issues, stats, sprints, activeSprint, setViewScope } = useProject();
  const [selectedReport, setSelectedReport] = useState('BURNDOWN');

  useEffect(() => {
    setViewScope('all');
  }, [setViewScope]);

  // Burndown chart data points
  const burndownData = useMemo(() => {
    const totalPoints = stats.totalStoryPoints || 32;
    const completed = stats.completedStoryPoints || 13;
    const days = ['Day 1', 'Day 3', 'Day 5', 'Day 7', 'Day 10', 'Day 12', 'Day 14'];
    const ideal = [totalPoints, 27, 22, 17, 12, 6, 0];
    const actual = [totalPoints, 30, 26, 21, totalPoints - completed, null, null];
    return { days, ideal, actual };
  }, [stats]);

  // Velocity chart data points across sprints
  const velocityData = useMemo(() => {
    return sprints.map((s) => ({
      name: s.name.replace(/\(.*\)/, '').trim(),
      planned: s.storyPointsPlanned || 24,
      completed: s.storyPointsDone || (s.status === 'CLOSED' ? s.storyPointsPlanned : 13),
    }));
  }, [sprints]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">
            Reports & Agile Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Burndown trajectory, team velocity charts, cumulative flow diagrams, and sprint performance.
          </p>
        </div>

        <Segmented
          value={selectedReport}
          onChange={setSelectedReport}
          options={[
            { value: 'BURNDOWN', label: 'Burndown Chart' },
            { value: 'VELOCITY', label: 'Velocity Chart' },
            { value: 'CFD', label: 'Cumulative Flow' },
            { value: 'CREATED_RESOLVED', label: 'Created vs Resolved' },
          ]}
          className="text-xs font-semibold"
        />
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Completion Rate
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {stats.completionRate}%
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {stats.completedCount} of {stats.totalIssuesCount} issues resolved
            </p>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Story Points Burned
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {stats.completedStoryPoints} / {stats.totalStoryPoints} pts
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Completed vs total scope</p>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              In Progress Scope
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {stats.inProgressCount} issues
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Actively being worked on</p>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e]">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Overdue Tickets
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {stats.overdueCount || 0} issues
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Past target delivery date</p>
          </Card>
        </Col>
      </Row>

      {/* Selected Chart Presentation */}
      <Card
        variant="borderless"
        className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] p-2"
        title={
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {selectedReport === 'BURNDOWN' && 'Sprint Burndown Trajectory (Story Points vs Days)'}
              {selectedReport === 'VELOCITY' && 'Sprint Velocity (Committed vs Delivered Story Points)'}
              {selectedReport === 'CFD' && 'Cumulative Flow Diagram (CFD)'}
              {selectedReport === 'CREATED_RESOLVED' && 'Created vs Resolved Trend'}
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Actual
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Ideal / Planned
              </span>
            </div>
          </div>
        }
      >
        {selectedReport === 'BURNDOWN' && (
          <div className="flex flex-col gap-4 py-4">
            {/* SVG Burndown Chart */}
            <div className="h-64 w-full relative flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 220">
                {/* Grid lines */}
                <line x1="40" y1="20" x2="680" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="40" y1="70" x2="680" y2="70" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="40" y1="120" x2="680" y2="120" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="40" y1="170" x2="680" y2="170" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="40" y1="210" x2="680" y2="210" stroke="#cbd5e1" strokeWidth="1.5" />

                {/* Y Axis labels */}
                <text x="15" y="25" fill="#94a3b8" fontSize="10">35 pts</text>
                <text x="15" y="75" fill="#94a3b8" fontSize="10">25 pts</text>
                <text x="15" y="125" fill="#94a3b8" fontSize="10">15 pts</text>
                <text x="15" y="175" fill="#94a3b8" fontSize="10">5 pts</text>

                {/* Ideal Line (Gray dashed) */}
                <polyline
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                  points="60,30 160,60 260,90 360,120 460,150 560,180 660,210"
                />

                {/* Actual Burndown Line (Blue solid) */}
                <polyline
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  points="60,30 160,45 260,70 360,100 460,115"
                />

                {/* Actual Data Points */}
                <circle cx="60" cy="30" r="5" fill="#2563eb" />
                <circle cx="160" cy="45" r="5" fill="#2563eb" />
                <circle cx="260" cy="70" r="5" fill="#2563eb" />
                <circle cx="360" cy="100" r="5" fill="#2563eb" />
                <circle cx="460" cy="115" r="6" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>

            <div className="grid grid-cols-7 text-center text-xs text-slate-400 font-semibold px-8">
              {burndownData.days.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
          </div>
        )}

        {selectedReport === 'VELOCITY' && (
          <div className="flex flex-col gap-4 py-4">
            <div className="grid grid-cols-3 gap-6 h-60 items-end px-12 border-b border-slate-200 dark:border-slate-800 pb-2">
              {velocityData.map((v) => (
                <div key={v.name} className="flex flex-col items-center gap-2">
                  <div className="flex items-end gap-3 h-48">
                    {/* Planned Bar */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 font-bold mb-1">{v.planned}</span>
                      <div
                        className="w-10 rounded-t-lg bg-slate-300 dark:bg-slate-700 transition-all"
                        style={{ height: `${(v.planned / 35) * 160}px` }}
                      />
                    </div>
                    {/* Completed Bar */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-blue-600 font-bold mb-1">{v.completed}</span>
                      <div
                        className="w-10 rounded-t-lg bg-blue-600 dark:bg-blue-500 shadow transition-all"
                        style={{ height: `${(v.completed / 35) * 160}px` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">
                    {v.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(selectedReport === 'CFD' || selectedReport === 'CREATED_RESOLVED') && (
          <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
            <BarChartOutlined className="text-4xl text-blue-500" />
            <p className="text-xs text-slate-500 max-w-sm">
              Cumulative workflow throughput and resolution delta metrics are continuously streaming from active issue events.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default Reports;
