import { useState, useEffect } from 'react';
import { Modal, Button, Input, InputNumber, Space, App } from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

function ColumnManagerModal({ open, columns = [], onClose, onSaveColumns }) {
  const [cols, setCols] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    if (open) {
      setCols(columns.map((c) => ({ ...c })));
    }
  }, [open, columns]);

  const handleAddColumn = () => {
    const newId = `COL_${Date.now()}`;
    setCols([...cols, { id: newId, title: 'New Stage', status: 'IN_PROGRESS', wipLimit: 0, color: '#3b82f6' }]);
  };

  const handleUpdateCol = (index, field, value) => {
    const updated = [...cols];
    updated[index][field] = value;
    setCols(updated);
  };

  const handleDeleteCol = (index) => {
    if (cols.length <= 1) {
      message.warning('At least one column is required on the board');
      return;
    }
    setCols(cols.filter((_, i) => i !== index));
  };

  const handleMoveCol = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= cols.length) return;
    const updated = [...cols];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setCols(updated);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await onSaveColumns(cols);
      message.success('Board columns updated successfully!');
      onClose();
    } catch (err) {
      message.error('Failed to update board columns');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={<div className="text-base font-semibold text-slate-800 dark:text-slate-100">Configure Board Columns & WIP Limits</div>}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText="Save Columns"
      confirmLoading={submitting}
      destroyOnHidden
      width={600}
    >
      <div className="py-2 flex flex-col gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Customize workflow stages, display names, and WIP (Work In Progress) constraints.
        </p>

        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
          {cols.map((col, index) => (
            <div
              key={col.id || index}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
            >
              <div className="flex items-center gap-0.5">
                <Button
                  size="small"
                  type="text"
                  icon={<ArrowUpOutlined />}
                  disabled={index === 0}
                  onClick={() => handleMoveCol(index, -1)}
                />
                <Button
                  size="small"
                  type="text"
                  icon={<ArrowDownOutlined />}
                  disabled={index === cols.length - 1}
                  onClick={() => handleMoveCol(index, 1)}
                />
              </div>

              <Input
                value={col.title}
                onChange={(e) => handleUpdateCol(index, 'title', e.target.value)}
                placeholder="Column Title"
                className="flex-1 font-semibold text-xs"
              />

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[11px] text-slate-400">WIP Limit:</span>
                <InputNumber
                  min={0}
                  value={col.wipLimit}
                  onChange={(val) => handleUpdateCol(index, 'wipLimit', val || 0)}
                  size="small"
                  className="w-16 text-xs"
                />
              </div>

              <Button
                size="small"
                danger
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteCol(index)}
              />
            </div>
          ))}
        </div>

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddColumn}
          className="w-full mt-1 text-xs"
        >
          Add Workflow Column
        </Button>
      </div>
    </Modal>
  );
}

export default ColumnManagerModal;
