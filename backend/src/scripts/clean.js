require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('../models/Company.model');
const User = require('../models/User.model');
const Project = require('../models/Project.model');
const ProjectMember = require('../models/ProjectMember.model');
const Milestone = require('../models/Milestone.model');
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

async function clean() {
  try {
    console.log('[cleaner] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[cleaner] Connected.');

    console.log('[cleaner] Deleting all Issues...');
    await Issue.deleteMany({});

    console.log('[cleaner] Deleting all Sprints...');
    await Sprint.deleteMany({});

    console.log('[cleaner] Deleting all Epics...');
    await Epic.deleteMany({});

    console.log('[cleaner] Deleting all Releases...');
    await Release.deleteMany({});

    console.log('[cleaner] Deleting all Components...');
    await Component.deleteMany({});

    console.log('[cleaner] Deleting all Boards...');
    await Board.deleteMany({});

    console.log('[cleaner] Deleting all Saved Filters...');
    await Filter.deleteMany({});

    console.log('[cleaner] Deleting all Dashboards...');
    await Dashboard.deleteMany({});

    console.log('[cleaner] Deleting all Automation Rules...');
    await AutomationRule.deleteMany({});

    console.log('[cleaner] Deleting all Audit Logs...');
    await AuditLog.deleteMany({});

    console.log('[cleaner] Deleting all Milestones...');
    await Milestone.deleteMany({});

    console.log('[cleaner] Deleting all Project Members...');
    await ProjectMember.deleteMany({});

    console.log('[cleaner] Deleting all Projects...');
    await Project.deleteMany({});

    console.log('[cleaner] Deleting ALL Users (including admin@company.com)...');
    await User.deleteMany({});

    console.log('[cleaner] Deleting ALL Companies...');
    await Company.deleteMany({});

    console.log('\n[cleaner] ✅ 100% of all data and users removed from database!');
    process.exit(0);
  } catch (err) {
    console.error('[cleaner] Error during data removal:', err);
    process.exit(1);
  }
}

clean();
