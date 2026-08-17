import {
  CheckCircleOutlined,
  BugOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  WarningOutlined,
} from '@ant-design/icons';

export const ISSUE_TYPES = {
  Story: {
    label: 'Story',
    color: '#16a34a',
    bg: '#f0fdf4',
    icon: <ThunderboltOutlined style={{ color: '#16a34a' }} />,
  },
  Bug: {
    label: 'Bug',
    color: '#dc2626',
    bg: '#fef2f2',
    icon: <BugOutlined style={{ color: '#dc2626' }} />,
  },
  Task: {
    label: 'Task',
    color: '#2563eb',
    bg: '#eff6ff',
    icon: <FileTextOutlined style={{ color: '#2563eb' }} />,
  },
  Epic: {
    label: 'Epic',
    color: '#7c3aed',
    bg: '#f5f3ff',
    icon: <CheckCircleOutlined style={{ color: '#7c3aed' }} />,
  },
};

export const ISSUE_STATUSES = {
  BACKLOG: {
    label: 'Backlog',
    color: '#64748b',
    tagColor: 'default',
    badgeColor: '#94a3b8',
  },
  TODO: {
    label: 'To Do',
    color: '#475569',
    tagColor: 'blue',
    badgeColor: '#60a5fa',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: '#2563eb',
    tagColor: 'processing',
    badgeColor: '#3b82f6',
  },
  IN_REVIEW: {
    label: 'In Review',
    color: '#d97706',
    tagColor: 'warning',
    badgeColor: '#f59e0b',
  },
  DONE: {
    label: 'Done',
    color: '#16a34a',
    tagColor: 'success',
    badgeColor: '#22c55e',
  },
};

export const ISSUE_PRIORITIES = {
  CRITICAL: {
    label: 'Critical',
    color: '#dc2626',
    icon: <WarningOutlined style={{ color: '#dc2626' }} />,
  },
  HIGH: {
    label: 'High',
    color: '#ea580c',
    icon: <ArrowUpOutlined style={{ color: '#ea580c' }} />,
  },
  MEDIUM: {
    label: 'Medium',
    color: '#ca8a04',
    icon: <MinusOutlined style={{ color: '#ca8a04' }} />,
  },
  LOW: {
    label: 'Low',
    color: '#16a34a',
    icon: <ArrowDownOutlined style={{ color: '#16a34a' }} />,
  },
};

export const SPRINT_STATUSES = {
  PLANNING: {
    label: 'Planning',
    color: 'default',
  },
  ACTIVE: {
    label: 'Active',
    color: 'processing',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'success',
  },
};

export const KANBAN_COLUMNS = [
  { id: 'BACKLOG', title: 'Backlog', color: '#94a3b8' },
  { id: 'TODO', title: 'To Do', color: '#60a5fa' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: '#3b82f6' },
  { id: 'IN_REVIEW', title: 'In Review', color: '#f59e0b' },
  { id: 'DONE', title: 'Done', color: '#22c55e' },
];
