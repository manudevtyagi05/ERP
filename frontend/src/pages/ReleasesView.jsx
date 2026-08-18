import { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Tag,
  Progress,
  Modal,
  Form,
  Input,
  DatePicker,
  Dropdown,
  App,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  MoreOutlined,
  RocketOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useProject } from '../context/ProjectContext';
import { createRelease, updateRelease, deleteRelease } from '../services/releaseService';

function ReleasesView() {
  const { releases, projects, activeProject, activeProjectKey, refreshData } = useProject();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  const currentProjectId = activeProject?.id || projects[0]?.id;

  const filteredReleases = useMemo(() => {
    return releases.filter((r) => {
      if (activeProjectKey !== 'ALL' && r.projectKey !== activeProjectKey) return false;
      return true;
    });
  }, [releases, activeProjectKey]);

  const handleCreateRelease = async (values) => {
    setSubmitting(true);
    try {
      await createRelease({
        projectId: currentProjectId,
        name: values.name,
        description: values.description || '',
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
        releaseDate: values.releaseDate ? values.releaseDate.toISOString() : undefined,
      });
      message.success(`Version "${values.name}" created successfully!`);
      form.resetFields();
      setCreateModalOpen(false);
      refreshData();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to create release');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (releaseId, newStatus) => {
    try {
      await updateRelease(releaseId, { status: newStatus });
      message.success(`Version status updated to ${newStatus}`);
      refreshData();
    } catch (err) {
      message.error('Failed to update release');
    }
  };

  const handleDelete = async (releaseId) => {
    try {
      await deleteRelease(releaseId);
      message.success('Version deleted successfully');
      refreshData();
    } catch (err) {
      message.error('Failed to delete release');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight !mb-0">
              {activeProject ? `${activeProject.name} Releases` : 'Releases & Version Tracking'}
            </h1>
            {activeProject && (
              <Tag color="blue" className="text-xs font-mono">
                {activeProject.key}
              </Tag>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage release cadence, track build deliverables, and deploy software milestones.
          </p>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
          className="text-xs font-semibold !bg-blue-600 hover:!bg-blue-700"
        >
          Create Version
        </Button>
      </div>

      {/* Release Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReleases.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            No versions created yet. Click &quot;Create Version&quot; to plan your first release.
          </div>
        ) : (
          filteredReleases.map((release) => {
            const isReleased = release.status === 'RELEASED';
            return (
              <Card
                key={release.id}
                variant="borderless"
                className="shadow-sm border border-slate-200/80 dark:border-slate-800 dark:bg-[#131b2e] hover:shadow-md transition"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {release.name}
                    </span>
                    <Tag
                      color={isReleased ? 'success' : release.status === 'ARCHIVED' ? 'default' : 'processing'}
                      className="text-[10px] font-bold uppercase !m-0"
                    >
                      {release.status}
                    </Tag>
                  </div>

                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'rel',
                          label: 'Mark as Released',
                          icon: <RocketOutlined />,
                          disabled: isReleased,
                          onClick: () => handleStatusChange(release.id, 'RELEASED'),
                        },
                        {
                          key: 'unrel',
                          label: 'Mark as Unreleased',
                          disabled: !isReleased,
                          onClick: () => handleStatusChange(release.id, 'UNRELEASED'),
                        },
                        {
                          key: 'del',
                          label: 'Delete Version',
                          icon: <DeleteOutlined />,
                          danger: true,
                          onClick: () => handleDelete(release.id),
                        },
                      ],
                    }}
                    trigger={['click']}
                  >
                    <Button size="small" type="text" icon={<MoreOutlined />} />
                  </Dropdown>
                </div>

                {release.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {release.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {release.completedCount || 0} / {release.issuesCount || 0} issues ({release.progress || 0}%)
                  </span>
                </div>
                <Progress
                  percent={release.progress || 0}
                  status={isReleased ? 'success' : 'active'}
                  strokeColor={isReleased ? '#16a34a' : '#2563eb'}
                />

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <CalendarOutlined />
                    <span>
                      {release.releaseDate
                        ? `Release: ${new Date(release.releaseDate).toLocaleDateString()}`
                        : 'No date set'}
                    </span>
                  </div>

                  {!isReleased && (
                    <Button
                      size="small"
                      type="dashed"
                      icon={<RocketOutlined />}
                      onClick={() => handleStatusChange(release.id, 'RELEASED')}
                      className="text-[11px] font-semibold"
                    >
                      Release
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Version Modal */}
      <Modal
        title={<div className="text-base font-semibold text-slate-800 dark:text-slate-100">Create Version</div>}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => form.submit()}
        okText="Create"
        confirmLoading={submitting}
        destroyOnHidden
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateRelease} className="mt-3" requiredMark={false}>
          <Form.Item
            name="name"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Version Name</span>}
            rules={[{ required: true, message: 'Version name is required (e.g. v1.2.0)' }]}
          >
            <Input placeholder="e.g. v1.2.0" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="startDate"
              label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Start Date</span>}
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item
              name="releaseDate"
              label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Release Date</span>}
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Description</span>}
          >
            <Input.TextArea rows={3} placeholder="Highlights and release notes summary" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ReleasesView;
