require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('../models/Company.model');
const User = require('../models/User.model');
const Project = require('../models/Project.model');
const Issue = require('../models/Issue.model');
const { ROLES } = require('../constants/roles');

async function seed() {
  console.log('[seeder] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[seeder] Connected.');

  // 1. Ensure Acme Technologies Company exists
  let company = await Company.findOne({ code: 'ACME' });
  if (!company) {
    company = await Company.create({
      name: 'Acme Technologies',
      code: 'ACME',
      slug: 'acme',
      email: 'admin@acme.com',
      status: 'ACTIVE',
      isActive: true,
    });
    console.log('[seeder] Created company: Acme Technologies');
  }

  // 2. Ensure Admin User exists (admin@company.com / admin123 and kartik@acme.com / admin123)
  const defaultPassword = 'admin123';

  let adminUser = await User.findOne({ email: 'admin@company.com' });
  if (!adminUser) {
    adminUser = new User({
      companyId: company._id,
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'admin@company.com',
      password: defaultPassword,
      role: ROLES.ADMIN,
      department: 'Engineering',
      isActive: true,
    });
    await adminUser.save();
    console.log('[seeder] Created admin user: admin@company.com');
  } else {
    adminUser.password = defaultPassword;
    await adminUser.save();
    console.log('[seeder] Updated admin user password for: admin@company.com');
  }

  let kartikUser = await User.findOne({ email: 'kartik@acme.com' });
  if (kartikUser) {
    kartikUser.password = defaultPassword;
    await kartikUser.save();
    console.log('[seeder] Updated kartik user password for: kartik@acme.com');
  }

  // Ensure team members exist
  const teamStaff = [
    {
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'sarah.chen@company.com',
      role: ROLES.SUPERVISOR,
      department: 'Product Design',
    },
    {
      firstName: 'David',
      lastName: 'Kumar',
      email: 'david.kumar@company.com',
      role: ROLES.EMPLOYEE,
      department: 'Engineering',
    },
    {
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'elena.rostova@company.com',
      role: ROLES.SUPERVISOR,
      department: 'Infrastructure',
    },
    {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@company.com',
      role: ROLES.EMPLOYEE,
      department: 'Engineering',
    },
  ];

  const createdStaff = [adminUser];
  for (const s of teamStaff) {
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
        createdBy: adminUser._id,
      });
      await u.save();
      console.log(`[seeder] Created user: ${s.email}`);
    }
    createdStaff.push(u);
  }

  // 3. Ensure Projects exist
  const initialProjects = [
    {
      key: 'CORE',
      name: 'Enterprise Core ERP',
      category: 'Software Architecture',
      description: 'Core financial, inventory and enterprise management system platform.',
      lead: 'Alex Morgan',
      leadEmail: 'admin@company.com',
      leadAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      avatarBg: '#2563eb',
      status: 'Active',
      star: true,
    },
    {
      key: 'UI',
      name: 'Design System & UI Tokens',
      category: 'Design Engineering',
      description: 'Modern component library and visual identity for all web services.',
      lead: 'Sarah Chen',
      leadEmail: 'sarah.chen@company.com',
      leadAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
      avatarBg: '#0891b2',
      status: 'Active',
      star: true,
    },
    {
      key: 'PAY',
      name: 'Payments & Reconciliation',
      category: 'Fintech Service',
      description: 'Automated ledger settlements, gateway integrations and multi-currency billing.',
      lead: 'David Kumar',
      leadEmail: 'david.kumar@company.com',
      leadAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      avatarBg: '#059669',
      status: 'Active',
      star: false,
    },
    {
      key: 'OPS',
      name: 'Cloud Infrastructure & K8s',
      category: 'DevOps & Reliability',
      description: 'Zero-downtime cluster upgrades, Prometheus metrics and security compliance.',
      lead: 'Elena Rostova',
      leadEmail: 'elena.rostova@company.com',
      leadAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
      avatarBg: '#7c3aed',
      status: 'Planning',
      star: false,
    },
  ];

  const dbProjects = [];
  for (const p of initialProjects) {
    let proj = await Project.findOne({ companyId: company._id, key: p.key });
    if (!proj) {
      proj = await Project.create({
        companyId: company._id,
        key: p.key,
        name: p.name,
        category: p.category,
        description: p.description,
        lead: p.lead,
        leadEmail: p.leadEmail,
        leadAvatar: p.leadAvatar,
        avatarBg: p.avatarBg,
        status: p.status,
        star: p.star,
        createdBy: adminUser._id,
      });
      console.log(`[seeder] Created project: ${p.name} (${p.key})`);
    }
    dbProjects.push(proj);
  }

  // 4. Ensure Real Issues exist
  const coreProj = dbProjects.find((p) => p.key === 'CORE');
  const uiProj = dbProjects.find((p) => p.key === 'UI');
  const payProj = dbProjects.find((p) => p.key === 'PAY');
  const opsProj = dbProjects.find((p) => p.key === 'OPS');

  const initialIssues = [
    {
      project: coreProj,
      key: 'CORE-101',
      issueNumber: 101,
      title: 'Migrate MongoDB aggregation pipeline for ledger reports',
      type: 'Story',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assignee: {
        id: adminUser._id.toString(),
        name: 'Alex Morgan',
        email: 'admin@company.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        role: 'ADMIN',
        department: 'Engineering',
      },
      storyPoints: 5,
      dueDate: '2026-08-20',
      epic: 'Performance Optimization',
      description: 'Optimize long-running financial monthly trial balance queries by adding compound index and streaming aggregations.',
      labels: ['Backend', 'Database', 'Performance'],
      subtasks: [
        { id: 'sub-1', title: 'Audit current slow queries in staging', completed: true },
        { id: 'sub-2', title: 'Implement composite index on tenant_id + created_at', completed: true },
        { id: 'sub-3', title: 'Refactor aggregate cursor stream handler', completed: false },
      ],
      comments: [
        {
          id: 'c-1',
          author: { id: adminUser._id.toString(), name: 'Alex Morgan', avatar: '' },
          content: 'Query plan on the 2M document dataset verified. Index cuts execution time down to 42ms.',
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      project: uiProj,
      key: 'UI-101',
      issueNumber: 101,
      title: 'Standardize collapsible sidebar transitions and tooltips',
      type: 'Task',
      status: 'IN_REVIEW',
      priority: 'MEDIUM',
      assignee: {
        id: createdStaff[1]._id.toString(),
        name: 'Sarah Chen',
        email: 'sarah.chen@company.com',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
        role: 'SUPERVISOR',
        department: 'Product Design',
      },
      storyPoints: 3,
      dueDate: '2026-08-15',
      epic: 'Navigation Overhaul',
      description: 'Ensure smooth 200ms cubic-bezier transition when expanding/collapsing sidebar and display clean Ant Design tooltips for collapsed items.',
      labels: ['UI/UX', 'Components', 'AntDesign'],
      subtasks: [
        { id: 'sub-4', title: 'Verify responsive breakpoint behavior', completed: true },
        { id: 'sub-5', title: 'Test keyboard tab navigation in menu items', completed: true },
      ],
      comments: [],
    },
    {
      project: payProj,
      key: 'PAY-101',
      issueNumber: 101,
      title: 'Fix race condition during concurrent invoice payment webhooks',
      type: 'Bug',
      status: 'TODO',
      priority: 'CRITICAL',
      assignee: {
        id: createdStaff[2]._id.toString(),
        name: 'David Kumar',
        email: 'david.kumar@company.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
        role: 'EMPLOYEE',
        department: 'Engineering',
      },
      storyPoints: 8,
      dueDate: '2026-08-14',
      epic: 'Webhook Reliability',
      description: 'When payment gateway sends duplicate delivery pings, invoice status occasionally enters dual settlement conflict.',
      labels: ['Fintech', 'Bugfix', 'Critical'],
      subtasks: [
        { id: 'sub-6', title: 'Add idempotent redis transaction lock', completed: false },
        { id: 'sub-7', title: 'Write concurrency test suite', completed: false },
      ],
      comments: [],
    },
    {
      project: coreProj,
      key: 'CORE-102',
      issueNumber: 102,
      title: 'Role-based access matrix for staff management routes',
      type: 'Story',
      status: 'DONE',
      priority: 'HIGH',
      assignee: {
        id: adminUser._id.toString(),
        name: 'Alex Morgan',
        email: 'admin@company.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        role: 'ADMIN',
        department: 'Engineering',
      },
      storyPoints: 5,
      dueDate: '2026-08-12',
      epic: 'Security & RBAC',
      description: 'Enforce granular permissions for creating, deactivating, and editing staff members in enterprise workspace.',
      labels: ['Security', 'RBAC', 'Auth'],
      subtasks: [
        { id: 'sub-8', title: 'Define permission enums', completed: true },
        { id: 'sub-9', title: 'Attach permission middleware to express routes', completed: true },
      ],
      comments: [],
    },
    {
      project: opsProj,
      key: 'OPS-101',
      issueNumber: 101,
      title: 'Set up automated Prometheus alerts for API latency spikes',
      type: 'Task',
      status: 'BACKLOG',
      priority: 'LOW',
      assignee: {
        id: createdStaff[3]._id.toString(),
        name: 'Elena Rostova',
        email: 'elena.rostova@company.com',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
        role: 'SUPERVISOR',
        department: 'Infrastructure',
      },
      storyPoints: 2,
      dueDate: '2026-08-28',
      epic: 'Observability',
      description: 'Trigger Slack and PagerDuty notifications when p99 latency exceeds 350ms for over 3 minutes.',
      labels: ['DevOps', 'Alerting', 'Monitoring'],
      subtasks: [],
      comments: [],
    },
    {
      project: payProj,
      key: 'PAY-102',
      issueNumber: 102,
      title: 'Automated PDF receipt generation on completed settlement',
      type: 'Task',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assignee: {
        id: createdStaff[2]._id.toString(),
        name: 'David Kumar',
        email: 'david.kumar@company.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
        role: 'EMPLOYEE',
        department: 'Engineering',
      },
      storyPoints: 3,
      dueDate: '2026-08-19',
      epic: 'Billing Features',
      description: 'Generate compliant tax invoices in PDF format and upload to S3 bucket with signed download links.',
      labels: ['PDF', 'Invoicing', 'S3'],
      subtasks: [
        { id: 'sub-10', title: 'Design PDF layout template', completed: true },
        { id: 'sub-11', title: 'Integrate PDFKit pipeline', completed: false },
      ],
      comments: [],
    },
  ];

  for (const iss of initialIssues) {
    if (!iss.project) continue;
    const exists = await Issue.findOne({ companyId: company._id, key: iss.key });
    if (!exists) {
      await Issue.create({
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
        reporter: {
          id: adminUser._id.toString(),
          name: 'Alex Morgan',
          email: 'admin@company.com',
        },
        storyPoints: iss.storyPoints,
        dueDate: iss.dueDate,
        epic: iss.epic,
        labels: iss.labels,
        subtasks: iss.subtasks,
        comments: iss.comments,
        createdBy: adminUser._id,
      });
      console.log(`[seeder] Created issue: ${iss.key} - ${iss.title}`);
    }
  }

  console.log('[seeder] Database seeding finished successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seeder] Error seeding database:', err);
  process.exit(1);
});
