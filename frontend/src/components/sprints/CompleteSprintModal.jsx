import { useState } from 'react';
import { Modal, Radio, Alert, App } from 'antd';
import { CheckCircleFilled, WarningFilled } from '@ant-design/icons';

function CompleteSprintModal({ open, sprint, sprintIssues = [], futureSprints = [], onClose, onCompleteSprint }) {
  const [targetSprintId, setTargetSprintId] = useState('BACKLOG');
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  const completedIssues = sprintIssues.filter((i) => i.status === 'DONE');
  const incompleteIssues = sprintIssues.filter((i) => i.status !== 'DONE');

  const completedPoints = completedIssues.reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);
  const incompletePoints = incompleteIssues.reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await onCompleteSprint(sprint.id, {
        targetSprintId: targetSprintId === 'BACKLOG' ? null : targetSprintId,
      });
      message.success(`Sprint "${sprint?.name}" completed successfully!`);
      onClose();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to complete sprint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={<div className="text-base font-semibold text-slate-800 dark:text-slate-100">Complete {sprint?.name}</div>}
      open={open}
      onCancel={onClose}
      onOk={handleComplete}
      okText="Complete Sprint"
      okButtonProps={{ className: '!bg-green-600 hover:!bg-green-700' }}
      confirmLoading={submitting}
      destroyOnHidden
      width={500}
    >
      <div className="py-2 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <CheckCircleFilled className="text-green-500 text-lg" />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Completed</div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {completedIssues.length} issues ({completedPoints} pts)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <WarningFilled className="text-amber-500 text-lg" />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Open / Incomplete</div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {incompleteIssues.length} issues ({incompletePoints} pts)
              </div>
            </div>
          </div>
        </div>

        {incompleteIssues.length > 0 ? (
          <div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Move {incompleteIssues.length} open issue(s) to:
            </div>
            <Radio.Group
              value={targetSprintId}
              onChange={(e) => setTargetSprintId(e.target.value)}
              className="flex flex-col gap-2 w-full"
            >
              <Radio
                value="BACKLOG"
                className="p-2.5 rounded border border-slate-200 dark:border-slate-700 !flex items-center"
              >
                <div>
                  <div className="font-medium text-xs text-slate-800 dark:text-slate-200">Backlog</div>
                  <div className="text-[11px] text-slate-500">Return incomplete tickets to the unassigned backlog</div>
                </div>
              </Radio>

              {futureSprints.map((fs) => (
                <Radio
                  key={fs.id}
                  value={fs.id}
                  className="p-2.5 rounded border border-slate-200 dark:border-slate-700 !flex items-center"
                >
                  <div>
                    <div className="font-medium text-xs text-slate-800 dark:text-slate-200">Next Sprint: {fs.name}</div>
                    <div className="text-[11px] text-slate-500">Rollover directly to next planned iteration</div>
                  </div>
                </Radio>
              ))}
            </Radio.Group>
          </div>
        ) : (
          <Alert
            type="success"
            showIcon
            message="Outstanding!"
            description="All planned issues in this sprint were successfully delivered and completed."
          />
        )}
      </div>
    </Modal>
  );
}

export default CompleteSprintModal;
