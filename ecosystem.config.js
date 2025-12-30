/**
 * PM2 生产环境部署配置
 *
 * 使用方法：
 * 1. 安装 PM2: npm install -g pm2
 * 2. 构建项目: pnpm run build
 * 3. 启动服务: pm2 start ecosystem.config.js
 * 4. 查看状态: pm2 status
 * 5. 查看日志: pm2 logs
 * 6. 停止服务: pm2 stop all
 * 7. 重启服务: pm2 restart all
 */

// 1. 先定义 Node 22 的具体路径
const node22Path = '/home/ubuntu/.nvm/versions/node/v22.21.1/bin/node';
const rootPath = '/home/ubuntu/random-food-forME';

module.exports = {
  apps: [
    {
      name: 'random-food-backend',
      cwd: `${rootPath}/backend`,
      script: 'index.js',
      interpreter: node22Path,
      instances: 1,
      exec_mode: 'fork', // 显式声明，防止冲突
      env: {
        NODE_ENV: 'production',
        PORT: 9091,
      },
      error_file: `${rootPath}/backend/logs/backend-error.log`,
      out_file: `${rootPath}/backend/logs/backend-out.log`,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'random-food-frontend',
      cwd: `${rootPath}/.next/standalone`,
      script: `server.js`,
      interpreter: node22Path,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 9090,
        NODE_OPTIONS: '--no-deprecation',
      },
      error_file: `${rootPath}/logs/frontend-error.log`,
      out_file: `${rootPath}/logs/frontend-out.log`,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}