import { useEffect } from 'react';
import { Calendar, Card, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { ISSUE_STATUSES } from '../constants/jira';

function CalendarView() {
  const { issues, setSelectedIssueId, setCreateIssueModalOpen, setViewScope } = useProject();

  useEffect(() => {
    setViewScope('all');
  }, [setViewScope]);

  const getListData = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    return issues.filter((i) => i.dueDate === dateStr);
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    if (!listData.length) return null;

    return (
      <ul className="list-none p-0 m-0 flex flex-col gap-1">
        {listData.slice(0, 3).map((item) => {
          const statusConfig = ISSUE_STATUSES[item.status] || ISSUE_STATUSES.TODO;

          return (
            <li
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIssueId(item.id);
              }}
              className="p-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer text-[11px] truncate flex items-center gap-1 transition"
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusConfig.badgeColor }} />
              <span className="font-mono font-semibold text-slate-600 dark:text-slate-400 text-[10px]">{item.key}</span>
              <span className="truncate text-slate-700 dark:text-slate-200">{item.title}</span>
            </li>
          );
        })}
        {listData.length > 3 && (
          <li className="text-[10px] text-slate-400 dark:text-slate-500 pl-1">+{listData.length - 3} more</li>
        )}
      </ul>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">Release & Sprint Calendar</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track issue delivery deadlines, sprint milestones, and release windows.
          </p>
        </div>

        <Space>
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

      {/* Calendar Card */}
      <Card variant="borderless" className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] p-2">
        <Calendar cellRender={dateCellRender} />
      </Card>
    </div>
  );
}

export default CalendarView;
