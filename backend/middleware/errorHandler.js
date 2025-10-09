/**
 * 错误处理中间件
 * 统一处理后端错误，提供日志记录和友好的错误响应
 */

/**
 * 记录错误日志
 */
function logError(err, req) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;

  console.error(`[${timestamp}] ${method} ${url} - Error:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    body: req.body,
  });
}

/**
 * 错误处理中间件
 */
function errorHandler(err, req, res, next) {
  // 记录错误
  logError(err, req);

  // 数据库错误
  if (err.code) {
    switch (err.code) {
      case 'SQLITE_CONSTRAINT':
        return res.status(400).json({
          error: '数据约束错误',
          message: '该记录可能已存在或违反了数据完整性约束',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });

      case 'SQLITE_ERROR':
        return res.status(500).json({
          error: '数据库错误',
          message: '数据库操作失败',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });

      default:
        return res.status(500).json({
          error: '服务器错误',
          message: '服务器处理请求时发生错误',
          detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: '验证错误',
      message: err.message,
      fields: err.fields,
    });
  }

  // 默认错误
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    error: statusCode >= 500 ? '服务器错误' : '请求错误',
    message,
    detail: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

/**
 * 404 Not Found 处理器
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: '未找到',
    message: `路由 ${req.method} ${req.url} 不存在`,
  });
}

/**
 * 异步路由包装器（捕获异步错误）
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  logError,
};
