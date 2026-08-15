import { useEffect, useState } from 'react';
import {
  Drawer,
  Tag,
  Select,
  Avatar,
  Button,
  Input,
  Checkbox,
  Space,
  Divider,
  Popconfirm,
  App,
} from 'antd';
import {
  CloseOutlined,
  DeleteOutlined,
  SendOutlined,
  CalendarOutlined,
  UserOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import { useTheme } from '../../context/ThemeContext';
import { ISSUE_TYPES, ISSUE_STATUSES, ISSUE_PRIORITIES } from '../../constants/jira';
import { listMilestones } from '../../services/milestoneService';

function IssueDetailDrawer() {
  const {
    selectedIssueId,
    selectedIssue,
    selectedIssueLoading,
    setSelectedIssueId,
    updateIssue,
    reassignIssue,
    deleteIssue,
    moveIssueStatus,
    addComment,
    toggleSubtask,
    teamMembers,
  } = useProject();
  const { isDark } = useTheme();

  const [commentText, setCommentText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const { message } = App.useApp();

  useEffect(() => {
    if (!selectedIssue?.projectId) {
      setMilestones([]);
      return;
    }
    listMilestones(selectedIssue.projectId)
      .then(setMilestones)
      .catch(() => setMilestones([]));
  }, [selectedIssue?.projectId]);

  if (!selectedIssueId) return null;

  if (!selectedIssue) {
    return (
      <Drawer
        placement="right"
        width="min(680px, 100vw)"
        onClose={() => setSelectedIssueId(null)}
        open={Boolean(selectedIssueId)}
        closeIcon={<CloseOutlined className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />}
      >
        <div className="text-sm text-slate-400 dark:text-slate-500 text-center py-10">
          {selectedIssueLoading ? 'Loading issue…' : 'Unable to load this issue.'}
        </div>
      </Drawer>
    );
  }

  const timeline = [
    ...(selectedIssue.comments || []).map((c) => ({
      kind: 'comment',
      id: c.id,
      createdAt: c.createdAt,
      author: c.author,
      content: c.content,
    })),
    ...(selectedIssue.activity || [])
      .filter((a) => a.type !== 'COMMENT_ADDED')
      .map((a) => ({ kind: 'activity', ...a })),
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const handleClose = () => {
    setSelectedIssueId(null);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await moveIssueStatus(selectedIssue.id, newStatus);
      message.success(`Status changed to ${ISSUE_STATUSES[newStatus]?.label}`);
    } catch {
      message.error('Failed to change status');
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      await updateIssue(selectedIssue.id, { priority: newPriority });
      message.success(`Priority set to ${newPriority}`);
    } catch {
      message.error('Failed to update priority');
    }
  };

  const handleAssigneeChange = async (assigneeId) => {
    const assignee = teamMembers.find((m) => m.id === assigneeId);
    try {
      await reassignIssue(selectedIssue.id, assigneeId);
      message.success(`Assigned to ${assignee?.name || 'selected member'}`);
    } catch {
      message.error('Failed to update assignee');
    }
  };

  const handleMilestoneChange = async (milestoneId) => {
    try {
      await updateIssue(selectedIssue.id, { milestoneId: milestoneId || null });
      message.success('Milestone updated');
    } catch {
      message.error('Failed to update milestone');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      await addComment(selectedIssue.id, commentText);
      setCommentText('');
      message.success('Comment added');
    } catch {
      message.error('Failed to add comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    const subtask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    try {
      await updateIssue(selectedIssue.id, {
        subtasks: [...(selectedIssue.subtasks || []), subtask],
      });
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
      message.success('Subtask added');
    } catch {
      message.error('Failed to add subtask');
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      await toggleSubtask(selectedIssue.id, subtaskId);
    } catch {
      message.error('Failed to toggle subtask');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteIssue(selectedIssue.id);
      message.success(`Deleted issue ${selectedIssue.key}`);
      handleClose();
    } catch {
      message.error('Failed to delete issue');
    }
  };

  const issueTypeConfig = ISSUE_TYPES[selectedIssue.type] || ISSUE_TYPES.Task;

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between w-full pr-2 sm:pr-4 min-w-0">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className="p-1 rounded bg-slate-100 dark:bg-slate-800 flex items-center flex-shrink-0">{issueTypeConfig.icon}</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200 text-sm flex-shrink-0">{selectedIssue.key}</span>
            <Tag color={issueTypeConfig.color} className="!mr-0 truncate">
              {issueTypeConfig.label}
            </Tag>
          </div>
          <Space className="flex-shrink-0">
            <Popconfirm
              title="Delete this issue?"
              description="This action cannot be undone."
              onConfirm={handleDelete}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        </div>
      }
      placement="right"
      width="min(680px, 100vw)"
      onClose={handleClose}
      open={Boolean(selectedIssueId)}
      closeIcon={<CloseOutlined className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />}
      styles={{
        body: { padding: '16px' },
        header: {
          borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
          padding: '12px 16px',
        },
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-0">
        {/* Main Content Column */}
        <div className="md:col-span-2 flex flex-col gap-5">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
              {selectedIssue.title}
            </h1>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Description
            </h3>
            <div className="text-sm text-slate-700 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-md border border-slate-200/70 dark:border-slate-700/60 whitespace-pre-wrap leading-relaxed">
              {selectedIssue.description || 'No description provided.'}
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Subtasks ({selectedIssue.subtasks?.filter((s) => s.completed).length || 0}/
                {selectedIssue.subtasks?.length || 0})
              </h3>
              {!isAddingSubtask && (
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setIsAddingSubtask(true)}
                  className="text-xs text-blue-600 dark:text-blue-400"
                >
                  Add Subtask
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-1.5 bg-white dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-md p-2">
              {(!selectedIssue.subtasks || selectedIssue.subtasks.length === 0) && !isAddingSubtask && (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-2 text-center">No subtasks yet</p>
              )}
              {selectedIssue.subtasks?.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center justify-between p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded text-xs text-slate-700 dark:text-slate-200 transition"
                >
                  <Checkbox
                    checked={subtask.completed}
                    onChange={() => handleToggleSubtask(subtask.id)}
                  >
                    <span className={subtask.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                      {subtask.title}
                    </span>
                  </Checkbox>
                </div>
              ))}

              {isAddingSubtask && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <Input
                    size="small"
                    placeholder="Subtask title..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onPressEnter={handleAddSubtask}
                    autoFocus
                  />
                  <Button size="small" type="primary" onClick={handleAddSubtask}>
                    Save
                  </Button>
                  <Button size="small" onClick={() => setIsAddingSubtask(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Comments & Activity */}
          <Divider className="!my-2 dark:border-slate-800" />
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Activity & Comments
            </h3>

            <div className="flex flex-col gap-2.5 mb-4">
              {timeline.length === 0 && (
                <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">No activity yet.</div>
              )}
              {timeline.map((entry) =>
                entry.kind === 'comment' ? (
                  <div key={entry.id} className="flex items-start gap-2.5">
                    <Avatar
                      src={entry.author?.avatar}
                      icon={<UserOutlined />}
                      size="small"
                      className="mt-0.5 bg-slate-200 dark:bg-slate-700"
                    />
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-md p-2.5 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{entry.author?.name}</span>
                        <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-normal">{entry.content}</p>
                    </div>
                  </div>
                ) : (
                  <div key={entry.id} className="flex items-center gap-2.5 pl-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
                    <span className="truncate">
                      <span className="font-medium text-slate-600 dark:text-slate-300">{entry.actor?.name || 'Someone'}</span>{' '}
                      {entry.message?.charAt(0).toLowerCase() + entry.message?.slice(1)}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 flex-shrink-0 ml-auto">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="flex items-start gap-2">
              <Input.TextArea
                rows={2}
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="text-xs"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleAddComment}
                loading={commentSubmitting}
                disabled={!commentText.trim()}
              >
                Send
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar / Meta Details Column */}
        <div className="flex flex-col gap-4 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Status</div>
            <Select
              value={selectedIssue.status}
              onChange={handleStatusChange}
              style={{ width: '100%' }}
              options={Object.keys(ISSUE_STATUSES).map((statusKey) => ({
                value: statusKey,
                label: (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: ISSUE_STATUSES[statusKey].badgeColor }}
                    />
                    <span>{ISSUE_STATUSES[statusKey].label}</span>
                  </div>
                ),
              }))}
            />
          </div>

          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Assignee</div>
            <Select
              value={selectedIssue.assignee?.id || selectedIssue.assignee?._id}
              onChange={handleAssigneeChange}
              style={{ width: '100%' }}
              options={teamMembers.map((m) => ({
                value: m.id,
                label: (
                  <div className="flex items-center gap-2">
                    <Avatar src={m.avatar} size={20} icon={<UserOutlined />} className="bg-slate-200 dark:bg-slate-700" />
                    <span className="truncate">{m.name}</span>
                  </div>
                ),
              }))}
            />
          </div>

          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Priority</div>
            <Select
              value={selectedIssue.priority}
              onChange={handlePriorityChange}
              style={{ width: '100%' }}
              options={Object.keys(ISSUE_PRIORITIES).map((priorityKey) => ({
                value: priorityKey,
                label: (
                  <div className="flex items-center gap-1.5">
                    {ISSUE_PRIORITIES[priorityKey].icon}
                    <span>{ISSUE_PRIORITIES[priorityKey].label}</span>
                  </div>
                ),
              }))}
            />
          </div>

          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Milestone</div>
            <Select
              value={selectedIssue.milestoneId || undefined}
              onChange={handleMilestoneChange}
              allowClear
              placeholder="No milestone"
              style={{ width: '100%' }}
              options={milestones.map((m) => ({ value: m.id, label: m.name }))}
            />
          </div>

          <Divider className="!my-1 dark:border-slate-700" />

          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Project</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{selectedIssue.projectName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Story Points</span>
              <span className="font-mono font-medium px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                {selectedIssue.storyPoints || 0} pts
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Due Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <CalendarOutlined className="text-slate-400 dark:text-slate-500" /> {selectedIssue.dueDate}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Reporter</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{selectedIssue.reporter?.name || 'Admin'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Created</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {selectedIssue.createdAt ? new Date(selectedIssue.createdAt).toLocaleDateString() : '—'}
              </span>
            </div>

            {selectedIssue.completedAt && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Completed</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {new Date(selectedIssue.completedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {selectedIssue.labels?.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Labels</div>
              <div className="flex flex-wrap gap-1">
                {selectedIssue.labels.map((label) => (
                  <Tag key={label} className="!mr-0 text-[11px] font-normal text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    {label}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

export default IssueDetailDrawer;
