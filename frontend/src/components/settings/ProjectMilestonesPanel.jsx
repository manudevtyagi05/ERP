import { useCallback, useEffect, useState } from 'react';
import { Button, Table, Tag, Progress, Popconfirm, Modal, Form, Input, Select, DatePicker, Alert, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  listMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from '../../services/milestoneService';
import { getErrorMessage } from '../../utils/getErrorMessage';

const STATUS_LABELS = { PLANNED: 'Planned', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' };
const STATUS_COLORS = { PLANNED: 'default', IN_PROGRESS: 'blue', COMPLETED: 'green' };

const emptyModal = { open: false, mode: 'create', target: null, submitting: false };

function ProjectMilestonesPanel({ project }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [modal, setModal] = useState(emptyModal);

  const fetchMilestones = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    setLoadError(null);
    try {
      setMilestones(await listMilestones(project.id));
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Could not load milestones'));
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ status: 'PLANNED' });
    setModal({ ...emptyModal, open: true, mode: 'create' });
  };

  const openEdit = (record) => {
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      status: record.status,
      startDate: record.startDate ? dayjs(record.startDate) : undefined,
      dueDate: record.dueDate ? dayjs(record.dueDate) : undefined,
    });
    setModal({ ...emptyModal, open: true, mode: 'edit', target: record });
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setModal((s) => ({ ...s, submitting: true }));
    const payload = {
      ...values,
      startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
      dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null,
    };
    try {
      if (modal.mode === 'create') {
        await createMilestone(project.id, payload);
        message.success('Milestone created');
      } else {
        await updateMilestone(project.id, modal.target.id, payload);
        message.success('Milestone updated');
      }
      setModal((s) => ({ ...s, open: false, submitting: false }));
      fetchMilestones();
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not save milestone'));
      setModal((s) => ({ ...s, submitting: false }));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMilestone(project.id, id);
      message.success('Milestone deleted');
      fetchMilestones();
    } catch (err) {
      message.error(getErrorMessage(err, 'Could not delete milestone'));
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    {
      title: 'Timeline',
      key: 'timeline',
      render: (_, record) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {record.startDate || '—'} &rarr; {record.dueDate || '—'}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>,
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <div className="w-32">
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
            <span>
              {record.completedIssues}/{record.totalIssues} issues
            </span>
            <span>{record.progress}%</span>
          </div>
          <Progress percent={record.progress} size="small" showInfo={false} />
        </div>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <div className="flex gap-1">
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Delete this milestone?"
            description="Issues linked to it will be unlinked, not deleted."
            onConfirm={() => handleDelete(record.id)}
            okButtonProps={{ danger: true }}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  if (!project) {
    return (
      <Alert type="info" showIcon message="Select a project from the switcher above to manage its milestones." />
    );
  }

  return (
    <div className="flex flex-col gap-3 mt-2 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400 !mb-0">Key delivery checkpoints for {project.name}.</p>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate} className="bg-blue-600">
          Add milestone
        </Button>
      </div>

      {loadError && <Alert type="error" showIcon message={loadError} />}

      <Table rowKey="id" columns={columns} dataSource={milestones} loading={loading} pagination={false} size="small" />

      <Modal
        title={modal.mode === 'create' ? 'Add milestone' : 'Edit milestone'}
        open={modal.open}
        onCancel={() => setModal((s) => ({ ...s, open: false }))}
        onOk={handleSubmit}
        okText={modal.mode === 'create' ? 'Create' : 'Save changes'}
        confirmLoading={modal.submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Milestone name is required' }]}>
            <Input placeholder="e.g., Beta Launch" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="startDate" label="Start date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="dueDate" label="Due date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={Object.keys(STATUS_LABELS).map((key) => ({ value: key, label: STATUS_LABELS[key] }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ProjectMilestonesPanel;
