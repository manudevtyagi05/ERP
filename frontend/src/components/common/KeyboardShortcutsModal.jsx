import { Modal, Tag } from 'antd';

const SHORTCUT_GROUPS = [
  {
    title: 'Global Navigation',
    items: [
      { key: 'c', description: 'Create new issue' },
      { key: '/', description: 'Focus global search / JQL' },
      { key: '?', description: 'Show keyboard shortcuts help' },
      { key: 'ESC', description: 'Close modal or issue drawer' },
    ],
  },
  {
    title: 'Go to View',
    items: [
      { key: 'g + b', description: 'Go to Active Board' },
      { key: 'g + k', description: 'Go to Backlog' },
      { key: 'g + r', description: 'Go to Roadmap Timeline' },
      { key: 'g + d', description: 'Go to Executive Dashboard' },
      { key: 'g + p', description: 'Go to Projects list' },
      { key: 'g + f', description: 'Go to Filters & Search' },
    ],
  },
  {
    title: 'Issue Actions (When Issue Selected)',
    items: [
      { key: 'e', description: 'Edit issue summary & description' },
      { key: 'a', description: 'Assign issue to member' },
      { key: 'm', description: 'Log work time spent' },
      { key: 'l', description: 'Link related issue' },
      { key: 'w', description: 'Toggle watch issue' },
    ],
  },
];

function KeyboardShortcutsModal({ open, onClose }) {
  return (
    <Modal
      title={<div className="text-base font-semibold text-slate-800 dark:text-slate-100">Keyboard Shortcuts</div>}
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
    >
      <div className="py-2 flex flex-col gap-5">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {group.title}
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              {group.items.map((item) => (
                <div
                  key={item.key}
                  className="px-3.5 py-2 flex items-center justify-between bg-white dark:bg-slate-900"
                >
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {item.description}
                  </span>
                  <Tag className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 !m-0">
                    {item.key}
                  </Tag>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default KeyboardShortcutsModal;
