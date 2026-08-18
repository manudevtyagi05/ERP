function createIssueSchema(body) {
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return 'Issue summary/title is required';
  }
  return null;
}

function updateIssueSchema() {
  return null;
}

function moveStatusSchema(body) {
  if (!body.status) {
    return 'Status is required';
  }
  return null;
}

function assignIssueSchema() {
  return null;
}

module.exports = {
  createIssueSchema,
  updateIssueSchema,
  moveStatusSchema,
  assignIssueSchema,
};
