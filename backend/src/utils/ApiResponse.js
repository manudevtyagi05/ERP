class ApiResponse {
  static success(res, { statusCode = 200, message = 'Operation successful', data = null, meta = undefined } = {}) {
    const body = { success: true, message, data };
    if (meta !== undefined) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static error(res, { statusCode = 500, message = 'Something went wrong', error = null } = {}) {
    return res.status(statusCode).json({ success: false, message, error });
  }
}

module.exports = ApiResponse;
