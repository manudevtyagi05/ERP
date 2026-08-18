import { useState, useEffect } from 'react';
import {
  Drawer,
  Tag,
  Avatar,
  Select,
  Button,
  Input,
  Progress,
  Tooltip,
  Dropdown,
  Tabs,
  Space,
  App,
} from 'antd';
import {
  CloseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PlusOutlined,
  DeleteOutlined,
  LinkOutlined,
  EyeOutlined,
  EyeFilled,
  LikeOutlined,
  LikeFilled,
  BranchesOutlined,
  FieldTimeOutlined,
  SendOutlined,
  ThunderboltFilled,
  SmileOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { ISSUE_TYPES, ISSUE_PRIORITIES, ISSUE_STATUSES } from '../../constants/jira';
import LogWorkModal from './LogWorkModal';
import LinkIssueModal from './LinkIssueModal';

const EMOJIS = ['👍', '❤️', '🚀', '👀', '🎉'];

function IssueDetailDrawer() {
  const {
    selectedIssueId,
    setSelectedIssueId,
    selectedIssue,
    selectedIssueLoading,
    issues,
    projects,
    sprints,
    epics,
    releases,
    components,
    teamMembers,
    moveIssueStatus,
    assignIssueAction,
    deleteIssueAction,
    addCommentAction,
    addReactionAction,
    logWorkAction,
    linkIssueAction,
    deleteLinkAction,
    toggleWatcherAction,
    toggleVoteAction,
    addSubtaskAction,
    toggleSubtaskAction,
    deleteSubtaskAction,
    editIssue,
  } = useProject();

  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState('');
  const [logWorkOpen, setLogWorkOpen] = useState(false);
  const [linkIssueOpen, setLinkIssueOpen] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    if (selectedIssue) {
      setTitleValue(selectedIssue.title || '');
      setDescValue(selectedIssue.description || '');
      setEditingTitle(false);
      setEditingDesc(false);
    }
  }, [selectedIssue]);

  if (!selectedIssueId) return null;

  const issue = selectedIssue;
  const typeConfig = issue ? ISSUE_TYPES[issue.type] || ISSUE_TYPES.Task : ISSUE_TYPES.Task;
  const priorityConfig = issue ? ISSUE_PRIORITIES[issue.priority] || ISSUE_PRIORITIES.MEDIUM : ISSUE_PRIORITIES.MEDIUM;
  const statusConfig = issue ? ISSUE_STATUSES[issue.status] || ISSUE_STATUSES.TODO : ISSUE_STATUSES.TODO;

  const subtasks = issue?.subtasks || [];
  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;
  const subtasksProgress = subtasks.length > 0 ? Math.round((completedSubtasksCount / subtasks.length) * 100) : 0;

  const isWatching = (issue?.watchers || []).some((w) => w.id === user?.id);
  const hasVoted = (issue?.votes || []).includes(user?.id);

  // Comments handler
  const handleAddComment = async (e) => {
    e?.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addCommentAction(issue.id, commentText.trim());
      setCommentText('');
      message.success('Comment posted');
    } catch (err) {
      message.error('Failed to post comment');
    }
  };

  const handleAddSubtask = async (e) => {
    e?.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    try {
      await addSubtaskAction(issue.id, { title: newSubtaskTitle.trim() });
      setNewSubtaskTitle('');
    } catch (err) {
      message.error('Failed to add subtask');
    }
  };

  const handleSaveTitle = async () => {
    if (!titleValue.trim() || titleValue === issue.title) {
      setEditingTitle(false);
      return;
    }
    try {
      await editIssue(issue.id, { title: titleValue.trim() });
      setEditingTitle(false);
      message.success('Title updated');
    } catch (err) {
      message.error('Failed to update title');
    }
  };

  const handleSaveDesc = async () => {
    try {
      await editIssue(issue.id, { description: descValue });
      setEditingDesc(false);
      message.success('Description updated');
    } catch (err) {
      message.error('Failed to update description');
    }
  };

  const handleDeleteIssue = async () => {
    Modal.confirm({
      title: `Delete issue ${issue.key}?`,
      content: 'This action cannot be undone and will remove all work logs, comments, and links.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deleteIssueAction(issue.id);
        message.success('Issue deleted');
      },
    });
  };

  return (
    <Drawer
      open={!!selectedIssueId}
      onClose={() => setSelectedIssueId(null)}
      width={window.innerWidth > 900 ? 820 : '95%'}
      closable={false}
      destroyOnClose
      bodyStyle={{ padding: 0 }}
      className="jira-drawer"
    >
      {selectedIssueLoading || !issue ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading issue details...</div>
      ) : (
        <div className="flex flex-col h-full bg-white dark:bg-[#0e1526] text-slate-800 dark:text-slate-100">
          {/* Top Bar Navigation */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="text-sm">{typeConfig.icon}</span>
              <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                {issue.key}
              </span>
              <Tag color={statusConfig.tagColor} className="text-[10px] font-bold uppercase !m-0">
                {statusConfig.label}
              </Tag>
            </div>

            <div className="flex items-center gap-1.5">
              <Tooltip title={isWatching ? 'Stop watching' : 'Watch issue'}>
                <Button
                  size="small"
                  type="text"
                  icon={isWatching ? <EyeFilled className="text-blue-500" /> : <EyeOutlined />}
                  onClick={() => toggleWatcherAction(issue.id)}
                  className="text-xs"
                >
                  {(issue.watchers || []).length}
                </Button>
              </Tooltip>

              <Tooltip title={hasVoted ? 'Remove vote' : 'Vote for this issue'}>
                <Button
                  size="small"
                  type="text"
                  icon={hasVoted ? <LikeFilled className="text-blue-500" /> : <LikeOutlined />}
                  onClick={() => toggleVoteAction(issue.id)}
                  className="text-xs"
                >
                  {(issue.votes || []).length}
                </Button>
              </Tooltip>

              <Button
                size="small"
                danger
                type="text"
                icon={<DeleteOutlined />}
                onClick={handleDeleteIssue}
              />

              <Button
                size="small"
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setSelectedIssueId(null)}
              />
            </div>
          </div>

          {/* Main Drawer Body: Split Pane */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
            {/* Left 8 Cols: Content, Subtasks, Comments, Links */}
            <div className="lg:col-span-8 p-5 flex flex-col gap-6">
              {/* Issue Title (Editable) */}
              <div>
                {editingTitle ? (
                  <div className="flex flex-col gap-1.5">
                    <Input.TextArea
                      value={titleValue}
                      onChange={(e) => setTitleValue(e.target.value)}
                      rows={2}
                      autoFocus
                      className="text-base font-bold"
                    />
                    <div className="flex items-center gap-2">
                      <Button size="small" type="primary" onClick={handleSaveTitle}>
                        Save
                      </Button>
                      <Button size="small" onClick={() => setEditingTitle(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <h2
                    onClick={() => setEditingTitle(true)}
                    className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 p-1 -m-1 rounded transition"
                  >
                    {issue.title}
                  </h2>
                )}
              </div>

              {/* Description (Editable) */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </div>
                {editingDesc ? (
                  <div className="flex flex-col gap-2">
                    <Input.TextArea
                      value={descValue}
                      onChange={(e) => setDescValue(e.target.value)}
                      rows={5}
                      autoFocus
                      placeholder="Add a detailed description..."
                    />
                    <div className="flex items-center gap-2">
                      <Button size="small" type="primary" onClick={handleSaveDesc}>
                        Save
                      </Button>
                      <Button size="small" onClick={() => setEditingDesc(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingDesc(true)}
                    className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 cursor-pointer hover:border-blue-400 transition leading-relaxed min-h-[70px]"
                  >
                    {issue.description || (
                      <span className="text-slate-400 italic">Click to add description...</span>
                    )}
                  </div>
                )}
              </div>

              {/* Subtasks Section */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Subtasks ({completedSubtasksCount}/{subtasks.length})
                  </div>
                  {subtasks.length > 0 && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      {subtasksProgress}% completed
                    </span>
                  )}
                </div>

                {subtasks.length > 0 && (
                  <Progress percent={subtasksProgress} size="small" status="active" strokeColor="#16a34a" />
                )}

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition"
                    >
                      <label className="flex items-center gap-2 text-xs cursor-pointer min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => toggleSubtaskAction(issue.id, st.id)}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span
                          className={`truncate ${
                            st.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {st.title}
                        </span>
                      </label>

                      <Button
                        size="small"
                        type="text"
                        icon={<DeleteOutlined className="text-slate-400 hover:text-red-500" />}
                        onClick={() => deleteSubtaskAction(issue.id, st.id)}
                      />
                    </div>
                  ))}

                  {/* Add subtask input */}
                  <form onSubmit={handleAddSubtask} className="p-2 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
                    <PlusOutlined className="text-slate-400 text-xs" />
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Add subtask... (Press Enter)"
                      className="flex-1 bg-transparent border-none text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
                    />
                  </form>
                </div>
              </div>

              {/* Linked Issues Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Linked Issues ({(issue.issueLinks || []).length})
                  </div>
                  <Button
                    size="small"
                    type="dashed"
                    icon={<LinkOutlined />}
                    onClick={() => setLinkIssueOpen(true)}
                    className="text-xs"
                  >
                    Link Issue
                  </Button>
                </div>

                {(issue.issueLinks || []).length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic py-1">No linked issues.</div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {issue.issueLinks.map((link) => (
                      <div
                        key={link.id}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs bg-slate-50/50 dark:bg-slate-900/50"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-semibold text-purple-600 dark:text-purple-400">
                            {link.relationship}
                          </span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {link.targetIssueKey}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300 truncate">
                            {link.targetIssueTitle}
                          </span>
                        </div>
                        <Button
                          size="small"
                          type="text"
                          icon={<DeleteOutlined className="text-slate-400 hover:text-red-500" />}
                          onClick={() => deleteLinkAction(issue.id, link.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Development Metadata */}
              {issue.devInfo && (
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BranchesOutlined className="text-blue-500" /> Development
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        feature/{issue.key.toLowerCase()}-branch
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">1 commit • 1 pull request</div>
                    </div>
                    <Tag color="success" className="text-[10px] font-bold uppercase">
                      {issue.devInfo.buildStatus || 'Passed'}
                    </Tag>
                  </div>
                </div>
              )}

              {/* Comments & Activity Stream Tabs */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <Tabs
                  defaultActiveKey="comments"
                  items={[
                    {
                      key: 'comments',
                      label: `Comments (${(issue.comments || []).length})`,
                      children: (
                        <div className="flex flex-col gap-4 py-2">
                          {/* New comment input */}
                          <form onSubmit={handleAddComment} className="flex gap-2.5 items-start">
                            <Avatar size={28} className="bg-blue-600 flex-shrink-0">
                              {user?.firstName?.[0] || 'U'}
                            </Avatar>
                            <div className="flex-1 flex flex-col gap-2">
                              <Input.TextArea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                rows={2}
                                placeholder="Add a comment... (Type @ to mention teammates)"
                                className="text-xs"
                              />
                              {commentText.trim() && (
                                <Button
                                  size="small"
                                  type="primary"
                                  htmlType="submit"
                                  icon={<SendOutlined />}
                                  className="self-end text-xs"
                                >
                                  Save Comment
                                </Button>
                              )}
                            </div>
                          </form>

                          {/* Comments List */}
                          <div className="flex flex-col gap-3">
                            {(issue.comments || []).map((c) => (
                              <div
                                key={c.id}
                                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 flex flex-col gap-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Avatar size={22} className="bg-blue-600 text-[10px]">
                                      {c.author?.name?.[0] || 'U'}
                                    </Avatar>
                                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                                      {c.author?.name}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(c.createdAt).toLocaleString()}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-7">
                                  {c.content}
                                </p>

                                {/* Emoji Reactions */}
                                <div className="flex items-center gap-1 pl-7 pt-1">
                                  {EMOJIS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => addReactionAction(issue.id, c.id, emoji)}
                                      className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition flex items-center gap-1"
                                    >
                                      <span>{emoji}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: 'history',
                      label: 'Activity History',
                      children: (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 py-2">
                          {(issue.activity || []).map((act) => (
                            <div key={act.id} className="py-2 flex items-center justify-between text-xs">
                              <span className="text-slate-600 dark:text-slate-300">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {act.actor?.name || 'System'}
                                </span>{' '}
                                {act.message}
                              </span>
                              <span className="text-[10px] text-slate-400 flex-shrink-0">
                                {new Date(act.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </div>

            {/* Right 4 Cols: Meta, Assignee, Sprint, Estimates */}
            <div className="lg:col-span-4 p-5 bg-slate-50/30 dark:bg-slate-900/30 flex flex-col gap-4">
              {/* Status Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Status
                </label>
                <Select
                  value={issue.status}
                  onChange={(val) => moveIssueStatus(issue.id, val)}
                  className="w-full font-semibold text-xs"
                  options={Object.keys(ISSUE_STATUSES).map((k) => ({
                    value: k,
                    label: ISSUE_STATUSES[k].label,
                  }))}
                />
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Priority
                </label>
                <Select
                  value={issue.priority}
                  onChange={(val) => editIssue(issue.id, { priority: val })}
                  className="w-full text-xs"
                  options={Object.keys(ISSUE_PRIORITIES).map((k) => ({
                    value: k,
                    label: ISSUE_PRIORITIES[k].label,
                  }))}
                />
              </div>

              {/* Assignee Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Assignee
                </label>
                <Select
                  value={issue.assignee?.id}
                  onChange={(val) => assignIssueAction(issue.id, val)}
                  placeholder="Unassigned"
                  className="w-full text-xs"
                  options={teamMembers.map((m) => ({
                    value: m.id,
                    label: m.name,
                  }))}
                />
              </div>

              {/* Story Points */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Story Points
                </label>
                <Input
                  type="number"
                  value={issue.storyPoints || 0}
                  onChange={(e) => editIssue(issue.id, { storyPoints: Number(e.target.value) })}
                  className="w-full text-xs font-bold"
                />
              </div>

              {/* Sprint Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Sprint
                </label>
                <Select
                  value={issue.sprintId || 'BACKLOG'}
                  onChange={(val) => editIssue(issue.id, { sprintId: val === 'BACKLOG' ? null : val })}
                  className="w-full text-xs"
                  options={[
                    { value: 'BACKLOG', label: 'Backlog (No Sprint)' },
                    ...sprints.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                />
              </div>

              {/* Epic */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Epic
                </label>
                <Select
                  value={issue.epicId || 'NONE'}
                  onChange={(val) => editIssue(issue.id, { epicId: val === 'NONE' ? null : val })}
                  className="w-full text-xs"
                  options={[
                    { value: 'NONE', label: 'None' },
                    ...epics.map((e) => ({ value: e.id, label: e.name })),
                  ]}
                />
              </div>

              {/* Time Tracking Progress */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Time Tracking
                  </span>
                  <Button
                    size="small"
                    type="link"
                    icon={<FieldTimeOutlined />}
                    onClick={() => setLogWorkOpen(true)}
                    className="!p-0 text-xs font-semibold"
                  >
                    Log Work
                  </Button>
                </div>

                <Progress
                  percent={
                    issue.originalEstimate
                      ? Math.min(100, Math.round(((issue.timeSpent || 0) / issue.originalEstimate) * 100))
                      : 0
                  }
                  size="small"
                  strokeColor="#3b82f6"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Logged: {issue.timeSpent || 0}h</span>
                  <span>Remaining: {issue.remainingEstimate || 0}h</span>
                </div>
              </div>

              {/* Dates */}
              <div className="flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>Created: {new Date(issue.createdAt).toLocaleDateString()}</div>
                <div>Updated: {new Date(issue.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Log Work Modal */}
          <LogWorkModal
            open={logWorkOpen}
            issue={issue}
            onClose={() => setLogWorkOpen(false)}
            onLogWork={logWorkAction}
          />

          {/* Link Issue Modal */}
          <LinkIssueModal
            open={linkIssueOpen}
            currentIssue={issue}
            allIssues={issues}
            onClose={() => setLinkIssueOpen(false)}
            onLinkIssue={linkIssueAction}
          />
        </div>
      )}
    </Drawer>
  );
}

export default IssueDetailDrawer;
