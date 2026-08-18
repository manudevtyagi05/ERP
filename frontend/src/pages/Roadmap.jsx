import { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Tag,
  Tooltip,
  Select,
  Progress,
  Avatar,
  Segmented,
  App,
} from 'antd';
import {
  PlusOutlined,
  CalendarOutlined,
  RightOutlined,
  DownOutlined,
  UserOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import CreateEpicModal from '../components/epics/CreateEpicModal';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function Roadmap() {
  const {
    epics,
    issues,
    projects,
    activeProject,
    activeProjectKey,
    setSelectedIssueId,
  } = useProject();

  const [zoom, setZoom] = useState('Months'); // 'Months' | 'Quarters'
  const [epicModalOpen, setEpicModalOpen] = useState(false);
  const [expandedEpics, setExpandedEpics] = useState({});

  const currentProjectId = activeProject?.id || projects[0]?.id;

  // Filter epics for current project
  const filteredEpics = useMemo(() => {
    return epics.filter((e) => {
      if (activeProjectKey !== 'ALL' && e.projectKey !== activeProjectKey) return false;
      return true;
    });
  }, [epics, activeProjectKey]);

  const toggleEpicExpand = (epicId) => {
    setExpandedEpics((prev) => ({ ...prev, [epicId]: !prev[epicId] }));
  };

  // Timeline headers
  const currentMonthIdx = new Date().getMonth();
  const timelineColumns = useMemo(() => {
    if (zoom === 'Months') {
      return Array.from({ length: 6 }, (_, i) => {
        const idx = (currentMonthIdx + i) % 12;
        return { label: `${MONTHS[idx]} 2026`, idx: i };
      });
    }
    return [
      { label: 'Q1 2026', idx: 0 },
      { label: 'Q2 2026', idx: 1 },
      { label: 'Q3 2026', idx: 2 },
      { label: 'Q4 2026', idx: 3 },
    ];
  }, [zoom, currentMonthIdx]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">
              {activeProject ? `${activeProject.name} Roadmap` : 'Project Roadmap & Gantt Timeline'}
            </h1>
            {activeProject && (
              <Tag color="blue" className="text-xs font-mono">
                {activeProject.key}
              </Tag>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize epic deliveries, long-term quarterly milestones, and story schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Segmented
            value={zoom}
            onChange={setZoom}
            options={['Months', 'Quarters']}
            className="text-xs font-semibold"
          />

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setEpicModalOpen(true)}
            className="text-xs font-semibold !bg-blue-600 hover:!bg-blue-700"
          >
            Create Epic
          </Button>
        </div>
      </div>

      {/* Gantt / Timeline Matrix */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
        {/* Timeline Header Row */}
        <div className="grid grid-cols-12 min-w-[800px] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 font-semibold text-xs text-slate-600 dark:text-slate-300">
          <div className="col-span-4 p-3 border-r border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <span>Epic / Item</span>
          </div>

          <div className="col-span-8 grid grid-cols-6 divide-x divide-slate-200 dark:divide-slate-800 text-center">
            {timelineColumns.map((col) => (
              <div key={col.label} className="p-3 text-[11px] truncate">
                {col.label}
              </div>
            ))}
          </div>
        </div>

        {/* Epics and Sub-items */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 min-w-[800px]">
          {filteredEpics.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No epics created yet. Click &quot;Create Epic&quot; to establish your roadmap.
            </div>
          ) : (
            filteredEpics.map((epic, index) => {
              const childIssues = issues.filter((i) => i.epicId === epic.id || i.epic === epic.name);
              const isExpanded = !!expandedEpics[epic.id];
              const spanStart = (index % 3) + 1;
              const spanWidth = Math.min(3, 6 - spanStart);

              return (
                <div key={epic.id} className="flex flex-col">
                  {/* Epic Main Row */}
                  <div className="grid grid-cols-12 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <div className="col-span-4 p-3 border-r border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleEpicExpand(epic.id)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        {isExpanded ? <DownOutlined /> : <RightOutlined />}
                      </button>
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: epic.color || '#7c3aed' }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                          {epic.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {childIssues.length} issues • {epic.progress || 0}% complete
                        </div>
                      </div>
                    </div>

                    {/* Visual Gantt Bar */}
                    <div className="col-span-8 p-3 grid grid-cols-6 relative items-center">
                      <div
                        className="h-7 rounded-lg shadow-sm flex items-center px-2.5 text-white font-semibold text-xs cursor-pointer hover:opacity-90 transition"
                        style={{
                          backgroundColor: epic.color || '#7c3aed',
                          gridColumnStart: spanStart,
                          gridColumnEnd: `span ${spanWidth}`,
                        }}
                      >
                        <span className="truncate">{epic.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Child Issues */}
                  {isExpanded &&
                    childIssues.map((child, cIdx) => (
                      <div
                        key={child.id}
                        onClick={() => setSelectedIssueId(child.id)}
                        className="grid grid-cols-12 items-center bg-slate-50/30 dark:bg-slate-900/30 hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition cursor-pointer border-t border-slate-100 dark:border-slate-800/60"
                      >
                        <div className="col-span-4 py-2 px-3 pl-9 border-r border-slate-200 dark:border-slate-800 flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-400">{child.key}</span>
                          <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{child.title}</span>
                        </div>

                        <div className="col-span-8 p-2 grid grid-cols-6 relative items-center">
                          <div
                            className="h-5 rounded-md bg-blue-500/80 dark:bg-blue-600/80 text-white font-medium text-[10px] flex items-center px-2 truncate"
                            style={{
                              gridColumnStart: (spanStart + cIdx) % 5 + 1,
                              gridColumnEnd: 'span 2',
                            }}
                          >
                            {child.key}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Epic Modal */}
      <CreateEpicModal
        open={epicModalOpen}
        projectId={currentProjectId}
        onClose={() => setEpicModalOpen(false)}
      />
    </div>
  );
}

export default Roadmap;
