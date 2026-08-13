import { useState } from 'react';
import { Card, Tabs, Button, Tag, App } from 'antd';
import {
  CheckOutlined,
  BellOutlined,
  UserOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';

function NotificationsView() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, setSelectedIssueId } = useProject();
  const [tab, setTab] = useState('all');
  const { message } = App.useApp();

  const filteredNotifications = notifications.filter((n) => {
    if (tab === 'unread' && !n.unread) return false;
    if (tab === 'assigned' && n.type !== 'ASSIGNED') return false;
    if (tab === 'activity' && n.type === 'ASSIGNED') return false;
    return true;
  });

  const handleNotificationClick = (n) => {
    markNotificationAsRead(n.id);
    // Resolved directly by key (rather than looked up in the scoped `issues`
    // list) since a notification can point at an issue outside the currently
    // loaded "mine"/"all" scope — e.g. one reassigned away from this user.
    if (n.issueKey) {
      setSelectedIssueId(n.issueKey);
    }
  };

  const handleMarkAll = () => {
    markAllNotificationsAsRead();
    message.success('All notifications marked as read');
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight !mb-0">Notifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stay updated with issue assignments, status changes, and comments.
          </p>
        </div>

        <Button icon={<CheckOutlined />} onClick={handleMarkAll}>
          Mark all as read
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-sm">
        <Tabs
          activeKey={tab}
          onChange={setTab}
          className="!mb-0"
          items={[
            { key: 'all', label: `All (${notifications.length})` },
            { key: 'unread', label: `Unread (${notifications.filter((n) => n.unread).length})` },
            { key: 'assigned', label: 'Assigned' },
            { key: 'activity', label: 'Activity' },
          ]}
        />
      </div>

      {/* List */}
      <Card bordered={false} className="shadow-sm border border-slate-200/80 p-0">
        <div className="flex flex-col divide-y divide-slate-100">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 flex items-start justify-between gap-4 cursor-pointer transition ${
                n.unread ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 ${
                    n.type === 'ASSIGNED'
                      ? 'bg-blue-100 text-blue-600'
                      : n.type === 'COMMENT'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {n.type === 'ASSIGNED' ? (
                    <ThunderboltOutlined />
                  ) : n.type === 'COMMENT' ? (
                    <UserOutlined />
                  ) : (
                    <BellOutlined />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${n.unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {n.title}
                    </span>
                    {n.unread && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.description}</p>
                  <span className="text-[11px] text-slate-400 mt-1 block">{n.time}</span>
                </div>
              </div>

              {n.issueKey && (
                <Tag color="blue" className="font-mono text-xs flex-shrink-0">
                  {n.issueKey}
                </Tag>
              )}
            </div>
          ))}

          {filteredNotifications.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No notifications in this filter.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default NotificationsView;
