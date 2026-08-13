function companyFilter(req, extra = {}) {
  return {
    companyId: req.company._id,
    ...extra,
  };
}

module.exports = { companyFilter };
