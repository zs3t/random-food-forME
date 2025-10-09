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

module.exports = {
  apps: [
    {
      name: 'random-food-backend',
      cwd: './backend',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: 9091,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'random-food-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 9090',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}
