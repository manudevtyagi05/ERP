import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  DatePicker,
  Dropdown,
  Form,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Tag,
  Tooltip,
  App,
} from 'antd';
import {
  PlusOutlined,
  MoreOutlined,
  UserOutlined,
  HolderOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useProject } from '../context/ProjectContext';
import { ISSUE_TYPES, ISSUE_PRIORITIES, ISSUE_STATUSES, SPRINT_STATUSES } from '../constants/jira';
import { getErrorMessage } from '../utils/getErrorMessage';
import {
  getBacklog,
  createSprint as createSprintApi,
  updateSprint as updateSprintApi,
  deleteSprint as deleteSprintApi,
  startSprint as startSprintApi,
  completeSprint as completeSprintApi,
} from '../services/sprintService';
import { reorderIssues as reorderIssuesApi } from '../services/issueService';

const emptySprintModal = { open: false, mode: 'create', target: null, submitting: false };
const emptyCompleteModal = { open: false, target: null, submitting: false };

function bucketTotals(list) {
  const totalPoints = list.reduce((acc, i) => acc + (i.storyPoints || 0), 0);
  const completed = list.filter((i) => i.status === 'DONE').length;
  const completedPoints = list
    .filter((i) => i.status === 'DONE')
    .reduce((acc, i) => acc + (i.storyPoints || 0), 0);
  return {
    total: list.length,
    completed,
    totalPoints,
    completedPoints,
    progress: list.length > 0 ? Math.round((completed / list.length) * 100) : 0,
  };
}

function IssueRow({ issue, onOpen, onDragStart, onDragOver, onDragEnd, isDragging }) {
  const typeConfig = ISSUE_TYPES[issue.type] || ISSUE_TYPES.Task;
  const priorityConfig = ISSUE_PRIORITIES[issue.priority] || ISSUE_PRIORITIES.MEDIUM;
  const statusConfig = ISSUE_STATUSES[issue.status] || ISSUE_STATUSES.TODO;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, issue)}
      onDragOver={(e) => onDragOver(e, issue)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(issue.id)}
      className={`flex items-center gap-2.5 px-2.5 py-2 bg-white border border-slate-200/70 rounded-md cursor-pointer hover:border-blue-300 hover:shadow-sm transition group ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <HolderOutlined className="text-slate-300 group-hover:text-slate-400 cursor-grab flex-shrink-0" />
      <Tooltip title={typeConfig.label}>
        <span className="flex items-center flex-shrink-0">{typeConfig.icon}</span>
      </Tooltip>
      <span className="font-mono text-xs font-semibold text-slate-500 flex-shrink-0">{issue.key}</span>
      <span className="text-xs text-slate-800 truncate flex-1">{issue.title}</span>
      <Tag color={statusConfig.tagColor} className="!mr-0 text-[10px] scale-90 flex-shrink-0">
        {statusConfig.label}
      </Tag>
      {issue.storyPoints ? (
        <span className="text-[10px] font-mono px-1 rounded bg-slate-100 text-slate-600 flex-shrink-0">
          {issue.storyPoints}pt
        </span>
      ) : null}
      <Tooltip title={`Priority: ${priorityConfig.label}`}>
        <span className="flex items-center flex-shrink-0">{priorityConfig.icon}</span>
      </Tooltip>
      <Tooltip title={issue.assignee?.name || 'Unassigned'}>
        <Avatar src={issue.assignee?.avatar} size={20} icon={<UserOutlined />} className="flex-shrink-0" />
      </Tooltip>
    </div>
  );
}

function Backlog() {
  const { message, modal } = App.useApp();
  const { projects, activeProjectKey, setActiveProjectKey, activeProject, setSelectedIssueId, setCreateIssueModalOpen } =
    useProject();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [sprintMeta, setSprintMeta] = useState([]);
  const [buckets, setBuckets] = useState({ backlog: [] });
  const bucketsRef = useRef(buckets);
  const dragRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

  const [sprintForm] = Form.useForm();
  const [sprintModal, setSprintModal] = useState(emptySprintModal);
  const [completeModal, setCompleteModal] = useState(emptyCompleteModal);
  const [moveTo, setMoveTo] = useState('backlog');

  useEffect(() => {
    bucketsRef.current = buckets;
  }, [buckets]);

  const fetchBacklog = useCallback(async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getBacklog(activeProject.id);
      setSprintMeta(data.sprints.map(({ issues, ...meta }) => meta));
      const nextBuckets = { backlog: data.backlog };
      data.sprints.forEach((s) => {
        nextBuckets[s.id] = s.issues;
      });
      setBuckets(nextBuckets);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Could not load the backlog'));
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    fetchBacklog();
  }, [fetchBacklog]);

  // --- Drag and drop -------------------------------------------------
  const handleDragStart = (e, issue) => {
    dragRef.current = { issueId: issue.id };
    setDraggingId(issue.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const removeDraggedFrom = (prev, draggingIssueId) => {
    let draggedIssue = null;
    const next = {};
    for (const key of Object.keys(prev)) {
      next[key] = prev[key].filter((i) => {
        if (i.id === draggingIssueId) {
          draggedIssue = i;
          return false;
        }
        return true;
      });
    }
    return { next, draggedIssue };
  };

  const handleRowDragOver = (e, bucketKey, overIssue) => {
    e.preventDefault();
    e.stopPropagation();
    const dragging = dragRef.current;
    if (!dragging || dragging.issueId === overIssue.id) return;
    setBuckets((prev) => {
      const { next, draggedIssue } = removeDraggedFrom(prev, dragging.issueId);
      if (!draggedIssue) return prev;
      const targetList = [...(next[bucketKey] || [])];
      const overIndex = targetList.findIndex((i) => i.id === overIssue.id);
      targetList.splice(overIndex === -1 ? targetList.length : overIndex, 0, draggedIssue);
      next[bucketKey] = targetList;
      return next;
    });
  };

  const handleBucketDragOver = (e, bucketKey) => {
    e.preventDefault();
    const dragging = dragRef.current;
    if (!dragging) return;
    setBuckets((prev) => {
      const alreadyThere = (prev[bucketKey] || []).some((i) => i.id === dragging.issueId);
      if (alreadyThere) return prev;
      const { next, draggedIssue } = removeDraggedFrom(prev, dragging.issueId);
      if (!draggedIssue) return prev;
      next[bucketKey] = [...(next[bucketKey] || []), draggedIssue];
      return next;
    });
  };

  const handleDrop = async (e, bucketKey) => {
    e.preventDefault();
    const dragging = dragRef.current;
    dragRef.current = null;
    setDraggingId(null);
    if (!dragging) return;
    const list = bucketsRef.current[bucketKey] || [];
    const orderedIds = list.map((i) => i.id);
    try {
      await reorderIssuesApi(bucketKey === 'backlog' ? null : bucketKey, orderedIds);
    } catch (err) {
      message.error(getErrorMessage(err, 'Failed to save new order'));
      fetchBacklog();
    }
  };

  const handleDragEnd = () => {
    dragRef.current = null;
    setDraggingId(null);
  };

  // --- Sprint CRUD -----------------------------------------------------
  const openCreateSprint = () => {
    sprintForm.resetFields();
    setSprintModal({ ...emptySprintModal, open: true, mode: 'create' });
  };

  const openEditSprint = (sprint) => {
    sprintForm.setFieldsValue({
      name: sprint.name,
      goal: sprint.goal,
      startDate: sprint.startDate ? dayjs(sprint.startDate) : undefined,
      endDate: sprint.endDate ? dayjs(sprint.endDate) : undefined,
    });
    setSprintModal({ ...emptySprintModal, open: true, mode: 'edit', target: sprint });
  };

  const handleSprintSubmit = async () => {
    const values = await sprintForm.validateFields();
    setSprintModal((s) => ({ ...s, submitting: true }));
    const payload = {
      ...values,
      startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
      endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
    };
    try {
      if (sprintModal.mode === 'create') {
        await createSprintApi(activeProject.id, payload);
        message.success('Sprint created');
      } else {
        await updateSprintApi(activeProject.id, sprintModal.target.id, payload);
        message.success('Sprint updated');
      }
      setSprintModal((s) => ({ ...s, open: false, submitting: false }));
      fetchBacklog();
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not save sprint'));
      setSprintModal((s) => ({ ...s, submitting: false }));
    }
  };

  const handleDeleteSprint = (sprint) => {
    modal.confirm({
      title: `Delete "${sprint.name}"?`,
      content: 'Issues in this sprint will be moved back to the backlog.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteSprintApi(activeProject.id, sprint.id);
          message.success('Sprint deleted');
          fetchBacklog();
        } catch (err) {
          message.error(getErrorMessage(err, 'Could not delete sprint'));
        }
      },
    });
  };

  const handleStartSprint = (sprint) => {
    modal.confirm({
      title: `Start "${sprint.name}"?`,
      content: 'This sprint becomes the active sprint shown on the Board.',
      okText: 'Start sprint',
      onOk: async () => {
        try {
          await startSprintApi(activeProject.id, sprint.id);
          message.success('Sprint started');
          fetchBacklog();
        } catch (err) {
          message.error(getErrorMessage(err, 'Could not start sprint'));
        }
      },
    });
  };

  const openCompleteSprint = (sprint) => {
    setMoveTo('backlog');
    setCompleteModal({ open: true, target: sprint, submitting: false });
  };

  const handleCompleteSprint = async () => {
    setCompleteModal((s) => ({ ...s, submitting: true }));
    try {
      await completeSprintApi(activeProject.id, completeModal.target.id, { moveTo });
      message.success('Sprint completed');
      setCompleteModal(emptyCompleteModal);
      fetchBacklog();
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not complete sprint'));
      setCompleteModal((s) => ({ ...s, submitting: false }));
    }
  };

  const activeSprint = sprintMeta.find((s) => s.status === 'ACTIVE');
  const otherPlanningSprints = (id) => sprintMeta.filter((s) => s.status === 'PLANNING' && s.id !== id);

  if (!activeProject) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Backlog</h1>
        <Alert
          type="info"
          showIcon
          message="Select a project to view its backlog"
          description={
            <Select
              className="mt-2"
              style={{ width: 280 }}
              placeholder="Choose a project"
              options={projects.map((p) => ({ value: p.key, label: `${p.key} — ${p.name}` }))}
              onChange={setActiveProjectKey}
              value={activeProjectKey === 'ALL' ? undefined : activeProjectKey}
            />
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight !mb-0">Backlog</h1>
            <Tag color="blue" className="text-xs">
              {activeProject.key}
            </Tag>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Plan sprints and groom the backlog for {activeProject.name}.
          </p>
        </div>
        <Space wrap>
          <Select
            size="small"
            value={activeProjectKey}
            onChange={setActiveProjectKey}
            style={{ width: 170 }}
            options={projects.map((p) => ({ value: p.key, label: `${p.key} - ${p.name}` }))}
          />
          <Button size="small" icon={<PlusOutlined />} onClick={openCreateSprint}>
            Create Sprint
          </Button>
        </Space>
      </div>

      {loadError && <Alert type="error" showIcon message={loadError} />}

      <div className="flex flex-col gap-4">
        {sprintMeta.map((sprint) => {
          const list = buckets[sprint.id] || [];
          const totals = bucketTotals(list);
          const canStart = sprint.status === 'PLANNING' && !activeSprint;

          return (
            <div key={sprint.id} className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">{sprint.name}</span>
                  <Tag color={SPRINT_STATUSES[sprint.status]?.color} className="!mr-0 text-[11px]">
                    {SPRINT_STATUSES[sprint.status]?.label}
                  </Tag>
                  {sprint.goal && <span className="text-xs text-slate-500 italic">"{sprint.goal}"</span>}
                  {(sprint.startDate || sprint.endDate) && (
                    <span className="text-[11px] text-slate-400">
                      {sprint.startDate || '—'} → {sprint.endDate || '—'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-28">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                      <span>
                        {totals.completed}/{totals.total} · {totals.totalPoints}pt
                      </span>
                      <span>{totals.progress}%</span>
                    </div>
                    <Progress percent={totals.progress} size="small" showInfo={false} />
                  </div>

                  {sprint.status === 'PLANNING' && (
                    <Tooltip title={activeSprint ? `Complete "${activeSprint.name}" first` : 'Start sprint'}>
                      <Button
                        size="small"
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        disabled={!canStart}
                        onClick={() => handleStartSprint(sprint)}
                        className="bg-blue-600"
                      >
                        Start
                      </Button>
                    </Tooltip>
                  )}
                  {sprint.status === 'ACTIVE' && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => openCompleteSprint(sprint)}
                      className="bg-emerald-600 hover:!bg-emerald-700 border-emerald-600"
                    >
                      Complete
                    </Button>
                  )}

                  <Dropdown
                    menu={{
                      items: [
                        { key: 'edit', label: 'Edit sprint', icon: <EditOutlined />, onClick: () => openEditSprint(sprint) },
                        sprint.status !== 'ACTIVE' && {
                          key: 'delete',
                          label: 'Delete sprint',
                          icon: <DeleteOutlined />,
                          danger: true,
                          onClick: () => handleDeleteSprint(sprint),
                        },
                      ].filter(Boolean),
                    }}
                    trigger={['click']}
                  >
                    <Button size="small" type="text" icon={<MoreOutlined />} />
                  </Dropdown>
                </div>
              </div>

              <div
                onDragOver={(e) => handleBucketDragOver(e, sprint.id)}
                onDrop={(e) => handleDrop(e, sprint.id)}
                className="flex flex-col gap-1.5 min-h-[48px]"
              >
                {list.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    isDragging={draggingId === issue.id}
                    onOpen={setSelectedIssueId}
                    onDragStart={handleDragStart}
                    onDragOver={(e) => handleRowDragOver(e, sprint.id, issue)}
                    onDragEnd={handleDragEnd}
                  />
                ))}
                {list.length === 0 && (
                  <div className="h-10 border-2 border-dashed border-slate-200 rounded-md flex items-center justify-center text-[11px] text-slate-400">
                    Drag issues here
                  </div>
                )}
              </div>

              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setCreateIssueModalOpen(true)}
                className="text-xs text-slate-500 hover:text-blue-600 mt-1.5"
              >
                Create issue
              </Button>
            </div>
          );
        })}

        {/* Backlog bucket */}
        <div className="bg-white border border-slate-200/80 rounded-lg p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">Backlog</span>
              <span className="text-xs text-slate-400">
                {buckets.backlog?.length || 0} issues · {bucketTotals(buckets.backlog || []).totalPoints}pt
              </span>
            </div>
          </div>

          <div
            onDragOver={(e) => handleBucketDragOver(e, 'backlog')}
            onDrop={(e) => handleDrop(e, 'backlog')}
            className="flex flex-col gap-1.5 min-h-[48px]"
          >
            {(buckets.backlog || []).map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                isDragging={draggingId === issue.id}
                onOpen={setSelectedIssueId}
                onDragStart={handleDragStart}
                onDragOver={(e) => handleRowDragOver(e, 'backlog', issue)}
                onDragEnd={handleDragEnd}
              />
            ))}
            {!loading && (buckets.backlog || []).length === 0 && (
              <div className="h-16 border-2 border-dashed border-slate-200 rounded-md flex items-center justify-center text-xs text-slate-400">
                Backlog is empty
              </div>
            )}
          </div>

          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setCreateIssueModalOpen(true)}
            className="text-xs text-slate-500 hover:text-blue-600 mt-1.5"
          >
            Create issue
          </Button>
        </div>
      </div>

      {/* Create / Edit sprint modal */}
      <Modal
        title={sprintModal.mode === 'create' ? 'Create sprint' : 'Edit sprint'}
        open={sprintModal.open}
        onCancel={() => setSprintModal((s) => ({ ...s, open: false }))}
        onOk={handleSprintSubmit}
        okText={sprintModal.mode === 'create' ? 'Create' : 'Save changes'}
        confirmLoading={sprintModal.submitting}
        destroyOnClose
      >
        <Form form={sprintForm} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Sprint name" rules={[{ required: true, message: 'Sprint name is required' }]}>
            <Input placeholder="e.g., Sprint 12" />
          </Form.Item>
          <Form.Item name="goal" label="Sprint goal">
            <Input.TextArea rows={2} placeholder="What should this sprint achieve?" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="startDate" label="Start date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endDate" label="End date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Complete sprint modal */}
      <Modal
        title={`Complete "${completeModal.target?.name || ''}"`}
        open={completeModal.open}
        onCancel={() => setCompleteModal(emptyCompleteModal)}
        onOk={handleCompleteSprint}
        okText="Complete sprint"
        confirmLoading={completeModal.submitting}
        destroyOnClose
      >
        <p className="text-xs text-slate-500 mb-2">
          Completed issues stay in this sprint's history. Where should incomplete issues go?
        </p>
        <Select
          style={{ width: '100%' }}
          value={moveTo}
          onChange={setMoveTo}
          options={[
            { value: 'backlog', label: 'Move to Backlog' },
            ...otherPlanningSprints(completeModal.target?.id).map((s) => ({
              value: s.id,
              label: `Move to "${s.name}"`,
            })),
          ]}
        />
      </Modal>
    </div>
  );
}

export default Backlog;
