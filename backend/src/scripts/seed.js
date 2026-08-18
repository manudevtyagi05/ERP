require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('../models/Company.model');
const User = require('../models/User.model');
const Project = require('../models/Project.model');
const Issue = require('../models/Issue.model');
const Sprint = require('../models/Sprint.model');
const Epic = require('../models/Epic.model');
const Release = require('../models/Release.model');
const Component = require('../models/Component.model');
const Board = require('../models/Board.model');
const Filter = require('../models/Filter.model');
const Dashboard = require('../models/Dashboard.model');
const AutomationRule = require('../models/AutomationRule.model');
const AuditLog = require('../models/AuditLog.model');
const { ROLES } = require('../constants/roles');

async function seed() {
  console.log('[seeder] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[seeder] Connected.');

  // 1. Ensure Acme Technologies Company exists
  let company = await Company.findOne({ code: 'ACME' });
  if (!company) {
    company = await Company.create({
      name: 'Acme Software Labs',
      code: 'ACME',
      slug: 'acme',
      email: 'admin@acme.com',
      status: 'ACTIVE',
      isActive: true,
    });
    console.log('[seeder] Created company: Acme Software Labs');
  }

  // 2. Users
  const defaultPassword = 'admin123';
  const staffList = [
    {
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'admin@company.com',
      role: ROLES.ADMIN,
      department: 'Engineering Leadership',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
    },
    {
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'sarah.chen@company.com',
      role: ROLES.SUPERVISOR,
      department: 'Product Management',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=faces',
    },
    {
      firstName: 'David',
      lastName: 'Kumar',
      email: 'david.kumar@company.com',
      role: ROLES.EMPLOYEE,
      department: 'Backend Platform',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
    },
    {
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'elena.rostova@company.com',
      role: ROLES.SUPERVISOR,
      department: 'DevOps & SRE',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces',
    },
    {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@company.com',
      role: ROLES.EMPLOYEE,
      department: 'Frontend Engineering',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop&crop=faces',
    },
    {
      firstName: 'Marcus',
      lastName: 'Vance',
      email: 'marcus.vance@company.com',
      role: ROLES.EMPLOYEE,
      department: 'QA & Test Automation',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
    },
  ];

  const userMap = {};
  for (const s of staffList) {
    let u = await User.findOne({ email: s.email });
    if (!u) {
      u = new User({
        companyId: company._id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        password: defaultPassword,
        role: s.role,
        department: s.department,
        isActive: true,
      });
      await u.save();
    } else {
      u.password = defaultPassword;
      await u.save();
    }
    userMap[s.email] = u;
  }
  console.log('[seeder] Users configured.');

  const admin = userMap['admin@company.com'];
  const sarah = userMap['sarah.chen@company.com'];
  const david = userMap['david.kumar@company.com'];
  const priya = userMap['priya.sharma@company.com'];
  const elena = userMap['elena.rostova@company.com'];
  const marcus = userMap['marcus.vance@company.com'];

  // 3. Projects
  const projectDefs = [
    {
      key: 'WEB',
      name: 'Web Application Platform',
      category: 'Software Development',
      description: 'Modern React/Next.js client workspace, design system, and user experience.',
      lead: `${sarah.firstName} ${sarah.lastName}`,
      leadEmail: sarah.email,
      leadAvatar: staffList[1].avatar,
      avatarBg: '#2563eb',
      status: 'Active',
      star: true,
    },
    {
      key: 'MOB',
      name: 'Mobile iOS & Android App',
      category: 'Product Development',
      description: 'Cross-platform mobile application with offline mode and push notifications.',
      lead: `${priya.firstName} ${priya.lastName}`,
      leadEmail: priya.email,
      leadAvatar: staffList[4].avatar,
      avatarBg: '#0891b2',
      status: 'Active',
      star: true,
    },
    {
      key: 'OPS',
      name: 'Cloud Infrastructure & SRE',
      category: 'IT / Service Project',
      description: 'Kubernetes orchestration, CI/CD automated deployment pipelines, and observability.',
      lead: `${elena.firstName} ${elena.lastName}`,
      leadEmail: elena.email,
      leadAvatar: staffList[3].avatar,
      avatarBg: '#7c3aed',
      status: 'Active',
      star: false,
    },
  ];

  const projectMap = {};
  for (const p of projectDefs) {
    let proj = await Project.findOne({ companyId: company._id, key: p.key });
    if (!proj) {
      proj = await Project.create({
        companyId: company._id,
        ...p,
        createdBy: admin._id,
      });
    }
    projectMap[p.key] = proj;
  }
  console.log('[seeder] Projects created.');

  const webProj = projectMap['WEB'];
  const mobProj = projectMap['MOB'];
  const opsProj = projectMap['OPS'];

  // 4. Boards with WIP Limits
  const boardConfigs = [
    {
      projectId: webProj._id,
      projectKey: webProj.key,
      name: 'Web Platform Scrum Board',
      type: 'SCRUM',
      columns: [
        { id: 'BACKLOG', title: 'Backlog', status: 'BACKLOG', wipLimit: 0, color: '#94a3b8' },
        { id: 'TODO', title: 'To Do', status: 'TODO', wipLimit: 0, color: '#60a5fa' },
        { id: 'IN_PROGRESS', title: 'In Progress', status: 'IN_PROGRESS', wipLimit: 4, color: '#3b82f6' },
        { id: 'IN_REVIEW', title: 'Code Review', status: 'IN_REVIEW', wipLimit: 3, color: '#f59e0b' },
        { id: 'DONE', title: 'Done', status: 'DONE', wipLimit: 0, color: '#22c55e' },
      ],
    },
    {
      projectId: mobProj._id,
      projectKey: mobProj.key,
      name: 'Mobile Kanban Board',
      type: 'KANBAN',
      columns: [
        { id: 'TODO', title: 'Ready for Dev', status: 'TODO', wipLimit: 5, color: '#60a5fa' },
        { id: 'IN_PROGRESS', title: 'In Development', status: 'IN_PROGRESS', wipLimit: 3, color: '#3b82f6' },
        { id: 'IN_REVIEW', title: 'QA Testing', status: 'IN_REVIEW', wipLimit: 2, color: '#f59e0b' },
        { id: 'DONE', title: 'Shipped', status: 'DONE', wipLimit: 0, color: '#22c55e' },
      ],
    },
  ];

  for (const b of boardConfigs) {
    let board = await Board.findOne({ projectId: b.projectId, companyId: company._id });
    if (!board) {
      await Board.create({ companyId: company._id, ...b });
    }
  }

  // 5. Sprints for WEB
  const now = Date.now();
  const sprintDefs = [
    {
      name: 'WEB Sprint 1 (Foundation)',
      goal: 'Deliver core authentication, responsive layout, and REST API foundation.',
      status: 'CLOSED',
      startDate: new Date(now - 28 * 86400000),
      endDate: new Date(now - 14 * 86400000),
      completedAt: new Date(now - 14 * 86400000),
      storyPointsPlanned: 24,
      storyPointsDone: 24,
    },
    {
      name: 'WEB Sprint 2 (Active Delivery)',
      goal: 'Complete Kanban drag-and-drop, sprint management, and JQL query engine.',
      status: 'ACTIVE',
      startDate: new Date(now - 5 * 86400000),
      endDate: new Date(now + 9 * 86400000),
      storyPointsPlanned: 32,
      storyPointsDone: 13,
    },
    {
      name: 'WEB Sprint 3 (Analytics & Automation)',
      goal: 'Build interactive burndown charts, CFD analytics, and automated workflow triggers.',
      status: 'FUTURE',
      startDate: new Date(now + 10 * 86400000),
      endDate: new Date(now + 24 * 86400000),
      storyPointsPlanned: 28,
      storyPointsDone: 0,
    },
  ];

  const sprintMap = {};
  for (const s of sprintDefs) {
    let sp = await Sprint.findOne({ projectId: webProj._id, name: s.name, companyId: company._id });
    if (!sp) {
      sp = await Sprint.create({
        companyId: company._id,
        projectId: webProj._id,
        projectKey: webProj.key,
        ...s,
        createdBy: admin._id,
      });
    }
    sprintMap[s.name] = sp;
  }
  const activeSprint = sprintMap['WEB Sprint 2 (Active Delivery)'];
  const futureSprint = sprintMap['WEB Sprint 3 (Analytics & Automation)'];

  // 6. Epics
  const epicDefs = [
    {
      projectId: webProj._id,
      projectKey: webProj.key,
      name: 'Authentication & Security Infrastructure',
      summary: 'OAuth2, JWT session governance, and RBAC permission guards.',
      description: 'End-to-end security suite ensuring strict workspace tenant isolation and session renewal.',
      color: '#7c3aed',
      status: 'DONE',
      startDate: new Date(now - 30 * 86400000),
      targetDate: new Date(now - 10 * 86400000),
      owner: { id: sarah._id.toString(), name: `${sarah.firstName} ${sarah.lastName}`, email: sarah.email },
    },
    {
      projectId: webProj._id,
      projectKey: webProj.key,
      name: 'Interactive Boards & Sprint Workflows',
      summary: 'Kanban drag-and-drop, sprint containers, and backlog reordering.',
      description: 'Smooth productivity canvas allowing developers to move tickets and plan sprints effortlessly.',
      color: '#2563eb',
      status: 'IN_PROGRESS',
      startDate: new Date(now - 10 * 86400000),
      targetDate: new Date(now + 15 * 86400000),
      owner: { id: priya._id.toString(), name: `${priya.firstName} ${priya.lastName}`, email: priya.email },
    },
    {
      projectId: webProj._id,
      projectKey: webProj.key,
      name: 'Executive Reporting & Automation Engine',
      summary: 'Burndown charts, velocity tracking, and WHEN-IF-THEN rule executions.',
      description: 'High-level analytics and smart automation rules that eliminate manual issue triage.',
      color: '#059669',
      status: 'TODO',
      startDate: new Date(now + 10 * 86400000),
      targetDate: new Date(now + 40 * 86400000),
      owner: { id: david._id.toString(), name: `${david.firstName} ${david.lastName}`, email: david.email },
    },
  ];

  const epicMap = {};
  for (const ep of epicDefs) {
    let epic = await Epic.findOne({ projectId: ep.projectId, name: ep.name, companyId: company._id });
    if (!epic) {
      epic = await Epic.create({ companyId: company._id, ...ep, createdBy: admin._id });
    }
    epicMap[ep.name] = epic;
  }

  // 7. Releases / Versions
  const releaseDefs = [
    {
      projectId: webProj._id,
      projectKey: webProj.key,
      name: 'v1.0.0 (Initial GA)',
      description: 'Production launch with project management, authentication, and team directories.',
      startDate: new Date(now - 40 * 86400000),
      releaseDate: new Date(now - 14 * 86400000),
      status: 'RELEASED',
    },
    {
      projectId: webProj._id,
      projectKey: webProj.key,
      name: 'v1.1.0 (Sprint & Board Suite)',
      description: 'Sprint planning lifecycle, Kanban boards, and work logging.',
      startDate: new Date(now - 10 * 86400000),
      releaseDate: new Date(now + 10 * 86400000),
      status: 'UNRELEASED',
    },
    {
      projectId: webProj._id,
      projectKey: webProj.key,
      name: 'v2.0.0 (Enterprise Automation)',
      description: 'Advanced custom workflows, JQL query parsing, and third-party webhook integrations.',
      startDate: new Date(now + 15 * 86400000),
      releaseDate: new Date(now + 60 * 86400000),
      status: 'UNRELEASED',
    },
  ];

  const releaseMap = {};
  for (const r of releaseDefs) {
    let rel = await Release.findOne({ projectId: r.projectId, name: r.name, companyId: company._id });
    if (!rel) {
      rel = await Release.create({ companyId: company._id, ...r, createdBy: admin._id });
    }
    releaseMap[r.name] = rel;
  }
  const rel1_1 = releaseMap['v1.1.0 (Sprint & Board Suite)'];

  // 8. Components
  const componentDefs = [
    {
      projectId: webProj._id,
      projectKey: webProj.key,
      name: 'Frontend UI & Tokens',
      description: 'Tailwind CSS design system, dark mode components, and dialogs.',
      lead: { id: priya._id.toString(), name: `${priya.firstName} ${priya.lastName}`, email: priya.email },
      defaultAssignee: { id: priya._id.toString(), name: `${priya.firstName} ${priya.lastName}`, email: priya.email },
    },
    {
      projectId: webProj._id,
      projectKey: webProj.key,
      name: 'Backend API & MongoDB',
      description: 'Express controllers, aggregation pipelines, and schema validation.',
      lead: { id: david._id.toString(), name: `${david.firstName} ${david.lastName}`, email: david.email },
      defaultAssignee: { id: david._id.toString(), name: `${david.firstName} ${david.lastName}`, email: david.email },
    },
    {
      projectId: webProj._id,
      projectKey: webProj.key,
      name: 'Auth & RBAC Guards',
      description: 'JWT encryption, token rotation, and multi-tenant company isolation.',
      lead: { id: sarah._id.toString(), name: `${sarah.firstName} ${sarah.lastName}`, email: sarah.email },
      defaultAssignee: { id: sarah._id.toString(), name: `${sarah.firstName} ${sarah.lastName}`, email: sarah.email },
    },
  ];

  const compMap = {};
  for (const c of componentDefs) {
    let comp = await Component.findOne({ projectId: c.projectId, name: c.name, companyId: company._id });
    if (!comp) {
      comp = await Component.create({ companyId: company._id, ...c, createdBy: admin._id });
    }
    compMap[c.name] = comp;
  }

  // 9. Realistic Issues with Subtasks, Worklogs, Links, and PRs
  const epicAuth = epicMap['Authentication & Security Infrastructure'];
  const epicBoards = epicMap['Interactive Boards & Sprint Workflows'];
  const epicReports = epicMap['Executive Reporting & Automation Engine'];

  const issuesSeedData = [
    {
      project: webProj,
      key: 'WEB-101',
      issueNumber: 101,
      title: 'Design high-fidelity Kanban board with WIP limit badges',
      description:
        'Implement responsive drag-and-drop Kanban columns with visual WIP indicators (e.g. warning when exceeding 4 active tickets), avatar assignments, and quick priority indicators.',
      type: 'Story',
      status: 'DONE',
      priority: 'HIGH',
      assignee: {
        id: priya._id.toString(),
        name: `${priya.firstName} ${priya.lastName}`,
        email: priya.email,
        role: priya.role,
        department: priya.department,
      },
      storyPoints: 5,
      sprintId: activeSprint._id,
      epicId: epicBoards._id,
      epic: epicBoards.name,
      fixVersionIds: [rel1_1._id.toString()],
      componentIds: [compMap['Frontend UI & Tokens']._id.toString()],
      labels: ['UI', 'Kanban', 'Sprint2'],
      originalEstimate: 12,
      remainingEstimate: 0,
      timeSpent: 12,
      subtasks: [
        { id: 'sub-1', title: 'Setup column drop targets with animation', completed: true, status: 'DONE' },
        { id: 'sub-2', title: 'Display column issue counter and WIP warning badge', completed: true, status: 'DONE' },
        { id: 'sub-3', title: 'Add quick create ticket input on column bottom', completed: true, status: 'DONE' },
      ],
      workLogs: [
        {
          id: 'wl-1',
          author: { id: priya._id.toString(), name: 'Priya Sharma', email: priya.email },
          timeSpent: 6,
          remainingEstimate: 6,
          description: 'Constructed draggable cards and CSS drop shadow effects.',
        },
        {
          id: 'wl-2',
          author: { id: priya._id.toString(), name: 'Priya Sharma', email: priya.email },
          timeSpent: 6,
          remainingEstimate: 0,
          description: 'Completed backend status change synchronization and tests.',
        },
      ],
      devInfo: {
        branches: [{ name: 'feature/WEB-101-kanban-dnd', url: '#' }],
        pullRequests: [{ id: 'PR #108', title: 'Feat: Drag and Drop Kanban Board', status: 'MERGED', url: '#' }],
        buildStatus: 'Passed',
        deploymentStatus: 'Production',
      },
    },
    {
      project: webProj,
      key: 'WEB-102',
      issueNumber: 102,
      title: 'Implement Sprint Lifecycle Engine (Start, Active, Complete Rollover)',
      description:
        'Create complete sprint lifecycle handlers: Start Sprint with custom goal and date duration, Active Sprint board filtering, and Complete Sprint modal with unfinished issue rollover to next sprint or backlog.',
      type: 'Story',
      status: 'IN_PROGRESS',
      priority: 'HIGHEST',
      assignee: {
        id: david._id.toString(),
        name: `${david.firstName} ${david.lastName}`,
        email: david.email,
        role: david.role,
        department: david.department,
      },
      storyPoints: 8,
      sprintId: activeSprint._id,
      epicId: epicBoards._id,
      epic: epicBoards.name,
      fixVersionIds: [rel1_1._id.toString()],
      componentIds: [compMap['Backend API & MongoDB']._id.toString()],
      labels: ['Sprint', 'Backend', 'Core'],
      originalEstimate: 16,
      remainingEstimate: 6,
      timeSpent: 10,
      subtasks: [
        { id: 'sub-4', title: 'MongoDB schema for sprint status transitions', completed: true, status: 'DONE' },
        { id: 'sub-5', title: 'Rollover logic for incomplete sprint issues', completed: true, status: 'DONE' },
        { id: 'sub-6', title: 'Sprint burndown calculation helper', completed: false, status: 'TODO' },
      ],
      workLogs: [
        {
          id: 'wl-3',
          author: { id: david._id.toString(), name: 'David Kumar', email: david.email },
          timeSpent: 10,
          remainingEstimate: 6,
          description: 'Built sprint controller endpoints and transaction handlers.',
        },
      ],
      devInfo: {
        branches: [{ name: 'feature/WEB-102-sprint-engine', url: '#' }],
        pullRequests: [{ id: 'PR #112', title: 'Sprint Lifecycle & Rollover API', status: 'OPEN', url: '#' }],
        buildStatus: 'Passed',
        deploymentStatus: 'Staging',
      },
    },
    {
      project: webProj,
      key: 'WEB-103',
      issueNumber: 103,
      title: 'Fix issue detail drawer keyboard shortcuts and tab navigation',
      description:
        'Ensure pressing ESC closes the drawer, `c` triggers create issue dialog from anywhere, and `/` focuses the global search bar.',
      type: 'Bug',
      status: 'IN_REVIEW',
      priority: 'HIGH',
      assignee: {
        id: priya._id.toString(),
        name: `${priya.firstName} ${priya.lastName}`,
        email: priya.email,
        role: priya.role,
        department: priya.department,
      },
      storyPoints: 3,
      sprintId: activeSprint._id,
      epicId: epicBoards._id,
      epic: epicBoards.name,
      componentIds: [compMap['Frontend UI & Tokens']._id.toString()],
      labels: ['Shortcuts', 'UX'],
      originalEstimate: 4,
      remainingEstimate: 1,
      timeSpent: 3,
      devInfo: {
        branches: [{ name: 'fix/WEB-103-keyboard-hotkeys', url: '#' }],
        pullRequests: [{ id: 'PR #115', title: 'Fix: Global Hotkey Listener', status: 'OPEN', url: '#' }],
        buildStatus: 'Passed',
        deploymentStatus: 'Staging',
      },
    },
    {
      project: webProj,
      key: 'WEB-104',
      issueNumber: 104,
      title: 'Build JQL query parser & smart filter bar',
      description:
        'Support queries like `project = WEB AND status = "In Progress" AND assignee = currentUser()` with live auto-suggestions and syntax validation.',
      type: 'Feature',
      status: 'TODO',
      priority: 'HIGH',
      assignee: {
        id: david._id.toString(),
        name: `${david.firstName} ${david.lastName}`,
        email: david.email,
        role: david.role,
        department: david.department,
      },
      storyPoints: 8,
      sprintId: activeSprint._id,
      epicId: epicReports._id,
      epic: epicReports.name,
      labels: ['JQL', 'Search', 'Filters'],
      originalEstimate: 12,
      remainingEstimate: 12,
      timeSpent: 0,
    },
    {
      project: webProj,
      key: 'WEB-105',
      issueNumber: 105,
      title: 'Automated burndown chart & velocity analytics visualization',
      description:
        'Render ideal line vs actual story points completed per day across active and past sprints using vector SVG line charts.',
      type: 'Story',
      status: 'TODO',
      priority: 'MEDIUM',
      assignee: {
        id: marcus._id.toString(),
        name: `${marcus.firstName} ${marcus.lastName}`,
        email: marcus.email,
        role: marcus.role,
        department: marcus.department,
      },
      storyPoints: 5,
      sprintId: activeSprint._id,
      epicId: epicReports._id,
      epic: epicReports.name,
      labels: ['Analytics', 'Charts'],
      originalEstimate: 10,
      remainingEstimate: 10,
      timeSpent: 0,
    },
    {
      project: webProj,
      key: 'WEB-106',
      issueNumber: 106,
      title: 'Interactive Project Roadmap with Gantt-style timeline bars',
      description:
        'Allow dragging start and due dates for Epics and linked Stories across weeks and months, with zoom level toggles.',
      type: 'Story',
      status: 'BACKLOG',
      priority: 'MEDIUM',
      assignee: {
        id: sarah._id.toString(),
        name: `${sarah.firstName} ${sarah.lastName}`,
        email: sarah.email,
        role: sarah.role,
        department: sarah.department,
      },
      storyPoints: 8,
      sprintId: futureSprint._id,
      epicId: epicBoards._id,
      epic: epicBoards.name,
      labels: ['Roadmap', 'Timeline'],
      originalEstimate: 16,
      remainingEstimate: 16,
      timeSpent: 0,
    },
    {
      project: webProj,
      key: 'WEB-107',
      issueNumber: 107,
      title: 'Configurable Automation Rule Builder (WHEN -> IF -> THEN)',
      description:
        'Enable team leads to configure triggers (e.g. status changes to Done) to automatically assign resolutions, send notifications, or log audit events.',
      type: 'Feature',
      status: 'BACKLOG',
      priority: 'HIGH',
      assignee: {
        id: elena._id.toString(),
        name: `${elena.firstName} ${elena.lastName}`,
        email: elena.email,
        role: elena.role,
        department: elena.department,
      },
      storyPoints: 8,
      sprintId: null, // in pure backlog pool
      epicId: epicReports._id,
      epic: epicReports.name,
      labels: ['Automation', 'Workflow'],
      originalEstimate: 20,
      remainingEstimate: 20,
      timeSpent: 0,
    },
  ];

  for (const iss of issuesSeedData) {
    let existing = await Issue.findOne({ companyId: company._id, key: iss.key });
    if (!existing) {
      const newIssue = new Issue({
        companyId: company._id,
        projectId: iss.project._id,
        projectKey: iss.project.key,
        projectName: iss.project.name,
        key: iss.key,
        issueNumber: iss.issueNumber,
        title: iss.title,
        description: iss.description,
        type: iss.type,
        status: iss.status,
        priority: iss.priority,
        assignee: iss.assignee,
        assignedAt: new Date(),
        reporter: {
          id: admin._id.toString(),
          name: `${admin.firstName} ${admin.lastName}`,
          email: admin.email,
        },
        storyPoints: iss.storyPoints,
        dueDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
        sprintId: iss.sprintId || null,
        epicId: iss.epicId || null,
        epic: iss.epic || '',
        fixVersionIds: iss.fixVersionIds || [],
        componentIds: iss.componentIds || [],
        labels: iss.labels || [],
        originalEstimate: iss.originalEstimate || 8,
        remainingEstimate: iss.remainingEstimate || 8,
        timeSpent: iss.timeSpent || 0,
        subtasks: iss.subtasks || [],
        workLogs: iss.workLogs || [],
        devInfo: iss.devInfo || {},
        comments: [
          {
            id: 'c-1',
            author: { id: sarah._id.toString(), name: 'Sarah Chen', email: sarah.email },
            content: 'Please ensure we include responsive mobile breakpoints for this component! @priya',
            createdAt: new Date(now - 2 * 86400000).toISOString(),
          },
          {
            id: 'c-2',
            author: { id: priya._id.toString(), name: 'Priya Sharma', email: priya.email },
            content: 'Covered and validated on iPhone and iPad screen viewports. Ready for review!',
            createdAt: new Date(now - 1 * 86400000).toISOString(),
          },
        ],
        watchers: [{ id: sarah._id.toString(), name: 'Sarah Chen', email: sarah.email }],
        activity: [
          {
            id: 'act-1',
            type: 'CREATED',
            message: 'Alex Morgan created this issue',
            actor: { id: admin._id.toString(), name: 'Alex Morgan', email: admin.email },
            createdAt: new Date(now - 4 * 86400000).toISOString(),
          },
        ],
        createdBy: admin._id,
      });

      await newIssue.save();
    }
  }
  console.log('[seeder] Issues created.');

  // 10. Saved Filters
  const filterDefs = [
    {
      name: 'My Assigned Issues',
      description: 'All open items currently assigned to the logged-in user',
      query: 'assignee = currentUser() AND status != "Done"',
      isFavorite: true,
      visibility: 'ORGANIZATION',
    },
    {
      name: 'Active Sprint Blockers & High Priority',
      description: 'Critical and High priority items in the active sprint',
      query: 'sprint = "Active Sprint" AND priority IN ("HIGHEST", "HIGH")',
      isFavorite: true,
      visibility: 'PROJECT',
      projectId: webProj._id,
    },
    {
      name: 'Unassigned Backlog Items',
      description: 'Items in the backlog awaiting developer assignment',
      query: 'status = "Backlog" AND assignee is EMPTY',
      isFavorite: false,
      visibility: 'ORGANIZATION',
    },
  ];

  for (const f of filterDefs) {
    let filt = await Filter.findOne({ name: f.name, companyId: company._id });
    if (!filt) {
      await Filter.create({
        companyId: company._id,
        ...f,
        owner: { id: admin._id.toString(), name: 'Alex Morgan', email: admin.email },
      });
    }
  }

  // 11. Dashboards
  let defaultDash = await Dashboard.findOne({ companyId: company._id, isDefault: true });
  if (!defaultDash) {
    await Dashboard.create({
      companyId: company._id,
      name: 'Executive Engineering Dashboard',
      description: 'Primary overview of sprint velocity, assigned items, release progress and active issues.',
      isDefault: true,
      owner: { id: admin._id.toString(), name: 'Alex Morgan', email: admin.email },
      widgets: [
        { id: 'w1', type: 'STATS_KPIS', title: 'Key Metrics & Completion', colSpan: 24, config: {} },
        { id: 'w2', type: 'ASSIGNED_TO_ME', title: 'Assigned to Me', colSpan: 12, config: { limit: 6 } },
        { id: 'w3', type: 'STATUS_PIE', title: 'Issue Status Breakdown', colSpan: 12, config: {} },
        { id: 'w4', type: 'SPRINT_BURNDOWN', title: 'Active Sprint Health & Burndown', colSpan: 12, config: {} },
        { id: 'w5', type: 'ACTIVITY_STREAM', title: 'Team Activity Feed', colSpan: 12, config: { limit: 6 } },
      ],
    });
  }

  // 12. Automation Rules
  const autoRules = [
    {
      name: 'Auto-Assign Highest Priority Bugs to Lead',
      description: 'When an issue with type Bug and priority HIGHEST is created, auto-assign to Sarah Chen.',
      enabled: true,
      trigger: { type: 'ISSUE_CREATED', config: {} },
      conditions: [
        { field: 'type', operator: 'EQUALS', value: 'Bug' },
        { field: 'priority', operator: 'EQUALS', value: 'HIGHEST' },
      ],
      actions: [
        { type: 'ASSIGN_USER', config: { assigneeId: sarah._id.toString(), assigneeName: 'Sarah Chen' } },
        { type: 'SEND_NOTIFICATION', config: { message: 'High priority bug automatically escalated to Lead.' } },
      ],
      executionCount: 7,
      lastExecutedAt: new Date(now - 3600000),
      logs: [
        {
          id: 'log-1',
          timestamp: new Date(now - 3600000).toISOString(),
          issueKey: 'WEB-103',
          status: 'SUCCESS',
          message: 'Escalated bug WEB-103 to Sarah Chen.',
        },
      ],
    },
    {
      name: 'Auto-Close Subtasks When Parent Issue is Done',
      description: 'When an issue transitions to DONE, automatically mark all nested subtasks completed.',
      enabled: true,
      trigger: { type: 'STATUS_CHANGED', config: { targetStatus: 'DONE' } },
      conditions: [{ field: 'status', operator: 'EQUALS', value: 'DONE' }],
      actions: [{ type: 'COMPLETE_SUBTASKS', config: {} }],
      executionCount: 14,
      lastExecutedAt: new Date(now - 7200000),
      logs: [
        {
          id: 'log-2',
          timestamp: new Date(now - 7200000).toISOString(),
          issueKey: 'WEB-101',
          status: 'SUCCESS',
          message: 'Marked 3 subtasks as completed for WEB-101.',
        },
      ],
    },
  ];

  for (const ar of autoRules) {
    let r = await AutomationRule.findOne({ name: ar.name, companyId: company._id });
    if (!r) {
      await AutomationRule.create({ companyId: company._id, ...ar });
    }
  }

  // 13. Audit Logs
  const auditEntries = [
    {
      actor: { id: admin._id.toString(), name: 'Alex Morgan', email: admin.email },
      action: 'PROJECT_CREATED',
      objectType: 'Project',
      objectId: webProj._id.toString(),
      objectLabel: 'Web Application Platform (WEB)',
    },
    {
      actor: { id: sarah._id.toString(), name: 'Sarah Chen', email: sarah.email },
      action: 'SPRINT_STARTED',
      objectType: 'Sprint',
      objectId: activeSprint._id.toString(),
      objectLabel: 'WEB Sprint 2 (Active Delivery)',
      details: { plannedPoints: 32, issueCount: 5 },
    },
    {
      actor: { id: priya._id.toString(), name: 'Priya Sharma', email: priya.email },
      action: 'ISSUE_TRANSITIONED',
      objectType: 'Issue',
      objectId: 'WEB-101',
      objectLabel: 'WEB-101',
      details: { from: 'IN_PROGRESS', to: 'DONE' },
    },
  ];

  for (const a of auditEntries) {
    await AuditLog.create({ companyId: company._id, ...a });
  }

  console.log('[seeder] Demo workspace fully initialized and populated successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seeder] Error seeding database:', err);
  process.exit(1);
});
