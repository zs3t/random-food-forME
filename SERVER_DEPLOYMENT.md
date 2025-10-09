# 🖥️ 独立服务器部署指南（PM2）

## 📋 目录

1. [部署前准备](#部署前准备)
2. [快速开始](#快速开始)
3. [详细步骤](#详细步骤)
4. [配置说明](#配置说明)
5. [PM2 管理](#pm2-管理)
6. [Nginx 反向代理](#nginx-反向代理)
7. [故障排查](#故障排查)
8. [生产环境优化](#生产环境优化)

---

## 🎯 部署前准备

### 系统要求

- **操作系统**: Linux (Ubuntu 20.04+ / CentOS 7+ / Debian 10+)
- **Node.js**: >= 20.x
- **pnpm**: >= 8.x
- **PM2**: >= 5.x
- **Nginx**: >= 1.18 (可选，用于反向代理)
- **磁盘空间**: >= 2GB
- **内存**: >= 2GB

### 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y  # Ubuntu/Debian
# 或
sudo yum update -y                       # CentOS/RHEL

# 安装基础工具
sudo apt install -y curl git build-essential python3 sqlite3  # Ubuntu/Debian
# 或
sudo yum install -y curl git gcc-c++ make python3 sqlite      # CentOS/RHEL
```

---

## 🚀 快速开始

### 1. 安装 Node.js 20

#### 方式一：使用 NodeSource 仓库（推荐）

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

#### 方式二：使用 nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

验证安装：

```bash
node -v    # 应显示 v20.x.x
npm -v     # 应显示 10.x.x
```

### 2. 安装 pnpm

```bash
# 使用 npm 安装
npm install -g pnpm

# 或使用官方脚本
curl -fsSL https://get.pnpm.io/install.sh | sh -

# 验证安装
pnpm -v
```

### 3. 安装 PM2

```bash
npm install -g pm2

# 验证安装
pm2 -v

# 设置开机自启
pm2 startup
# 执行输出的命令（类似 sudo env PATH=...）
```

### 4. 克隆项目

```bash

# 克隆项目（如果从 GitHub 部署）
sudo git clone https://github.com/zs3t/random-food-forME.git
cd random-food-forME

# 设置权限
sudo chown -R $USER:$USER /var/www/random-food-forME
```


## 📖 部署详细步骤

### Step 1: 配置环境变量

```bash
# 编辑生产环境配置
nano .env.production
```

关键配置项：

```env
# API 基础路径（使用相对路径）
NEXT_PUBLIC_API_URL=/api/backend

# 后端服务配置
BACKEND_HOST=127.0.0.1
BACKEND_PORT=9091

# Node 环境
NODE_ENV=production
```

### Step 2: 安装依赖

```bash
# 安装所有依赖（包括前端和后端）
pnpm install --frozen-lockfile

# 验证 better-sqlite3 编译
cd backend
npm rebuild better-sqlite3 --build-from-source
cd ..
```

**注意**：如果 `better-sqlite3` 编译失败：

```bash
# 安装编译工具
sudo apt install -y build-essential python3  # Ubuntu/Debian
# 或
sudo yum install -y gcc-c++ make python3     # CentOS/RHEL

# 重新编译
cd backend
npm rebuild better-sqlite3 --build-from-source
```

### Step 3: 检查数据库

```bash
# 确保数据库文件存在
ls -lh backend/food_db.sqlite

# 测试数据库连接
sqlite3 backend/food_db.sqlite "SELECT COUNT(*) FROM foods;"


### Step 4: 构建前端

```bash
# 构建 Next.js 应用
pnpm run build

# 验证构建产物
ls -lh .next/
```

构建选项：

```bash
# 使用生产环境变量构建
NODE_ENV=production pnpm run build

# 清理缓存后重新构建
pnpm run clean && pnpm run build
```

### Step 5: 配置 PM2

项目已包含 `ecosystem.config.js`，检查配置：

```javascript
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
        BACKEND_HOST: '127.0.0.1',
        BACKEND_PORT: 9091,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
    },
    {
      name: 'random-food-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 127.0.0.1 -p 9090',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
    },
  ],
}
```

### Step 6: 启动服务

```bash
# 使用 PM2 启动
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 保存配置（开机自启）
pm2 save
```

### Step 7: 验证部署

```bash
# 测试后端 API
curl http://127.0.0.1:9091/

# 测试前端
curl http://127.0.0.1:9090/

# 检查进程
pm2 list

# 查看详细信息
pm2 show random-food-backend
pm2 show random-food-frontend
```

---

## ⚙️ 配置说明

### ecosystem.config.js 详解

#### 后端配置

```javascript
{
  name: 'random-food-backend',        // 应用名称
  cwd: './backend',                   // 工作目录
  script: 'index.js',                 // 入口文件
  instances: 1,                       // 实例数（1 = 单实例，max = CPU 核心数）
  exec_mode: 'fork',                  // 执行模式（fork / cluster）
  autorestart: true,                  // 自动重启
  watch: false,                       // 监听文件变化（生产环境建议关闭）
  max_memory_restart: '200M',         // 内存超限自动重启

  env: {
    NODE_ENV: 'production',
    BACKEND_HOST: '127.0.0.1',
    BACKEND_PORT: 9091,
  },

  // 日志配置
  error_file: './logs/backend-error.log',
  out_file: './logs/backend-out.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,

  // 高级配置
  min_uptime: '10s',                  // 最小运行时间（避免频繁重启）
  max_restarts: 10,                   // 最大重启次数
  restart_delay: 4000,                // 重启延迟（毫秒）
}
```

#### 前端配置

```javascript
{
  name: 'random-food-frontend',
  script: 'node_modules/next/dist/bin/next',
  args: 'start -H 127.0.0.1 -p 9090', // 启动参数
  instances: 1,                       // 可以设为 max 以启用集群模式
  exec_mode: 'cluster',               // 集群模式（可选）
  max_memory_restart: '500M',

  env: {
    NODE_ENV: 'production',
    PORT: 9090,
  },
}
```

### 环境变量配置

#### 方式一：.env 文件

```bash
# .env.production
NEXT_PUBLIC_API_URL=/api/backend
BACKEND_HOST=127.0.0.1
BACKEND_PORT=9091
NODE_ENV=production
```

PM2 加载：

```javascript
{
  env_file: '.env.production',
}
```

#### 方式二：ecosystem.config.js 中定义

```javascript
{
  env: {
    NODE_ENV: 'production',
    NEXT_PUBLIC_API_URL: '/api/backend',
    BACKEND_HOST: '127.0.0.1',
    BACKEND_PORT: '9091',
  },
}
```

---

## 🛠️ PM2 管理

### 基础命令

```bash
# 启动
pm2 start ecosystem.config.js

# 停止
pm2 stop all                    # 停止所有
pm2 stop random-food-backend    # 停止特定应用

# 重启
pm2 restart all
pm2 restart random-food-frontend

# 重载（零停机）
pm2 reload all

# 删除
pm2 delete all
pm2 delete random-food-backend

# 查看状态
pm2 status
pm2 list

# 查看详情
pm2 show random-food-backend

# 查看日志
pm2 logs                        # 所有日志
pm2 logs random-food-backend    # 特定应用日志
pm2 logs --lines 100            # 最近 100 行
pm2 logs --err                  # 只看错误日志
```

### 进阶命令

```bash
# 监控
pm2 monit                       # 实时监控（CPU、内存）

# 实时日志
pm2 logs --raw                  # 原始日志
pm2 logs --json                 # JSON 格式

# 清空日志
pm2 flush                       # 清空所有日志
pm2 flush random-food-backend   # 清空特定应用日志

# 开机自启
pm2 startup                     # 生成启动脚本
pm2 save                        # 保存当前配置
pm2 resurrect                   # 恢复保存的配置

# 更新 PM2
pm2 update

# 生成配置文件
pm2 ecosystem                   # 生成 ecosystem.config.js 模板
```

### 日志管理

```bash
# 安装日志轮转模块
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M        # 单个日志文件最大 10MB
pm2 set pm2-logrotate:retain 7            # 保留 7 个日志文件
pm2 set pm2-logrotate:compress true       # 压缩旧日志
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'  # 每天轮转

# 查看日志轮转配置
pm2 conf pm2-logrotate
```

### 性能监控

```bash
# 使用 PM2 Plus（可选，需要注册）
pm2 link <secret_key> <public_key>

# 或使用内置监控
pm2 monit

# Web 界面监控（不推荐生产环境）
pm2 web
```

---

## 🌐 Nginx 反向代理

### 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install -y nginx

# CentOS/RHEL
sudo yum install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

### 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/random-food`:

```nginx
# HTTP 配置
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或 IP

    # 访问日志
    access_log /var/log/nginx/random-food-access.log;
    error_log /var/log/nginx/random-food-error.log;

    # 限制请求体大小
    client_max_body_size 10M;

    # 前端（Next.js）
    location / {
        proxy_pass http://127.0.0.1:9090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 后端 API
    location /api/backend/ {
        rewrite ^/api/backend/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:9091;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存（可选）
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:9090;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/random-food /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### 配置 HTTPS (Let's Encrypt)

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx  # Ubuntu/Debian
# 或
sudo yum install -y certbot python3-certbot-nginx  # CentOS/RHEL

# 获取证书并自动配置
sudo certbot --nginx -d your-domain.com

# 测试自动续期
sudo certbot renew --dry-run

# 设置自动续期（Cron）
sudo crontab -e
# 添加以下行：
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

HTTPS 配置示例（Certbot 会自动添加）：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # 其余配置同上...
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 🔍 故障排查

### 1. 应用无法启动

```bash
# 查看 PM2 日志
pm2 logs random-food-backend --err
pm2 logs random-food-frontend --err

# 查看详细信息
pm2 describe random-food-backend

# 手动测试启动
cd backend
node index.js

# 检查端口占用
sudo lsof -i :9090
sudo lsof -i :9091
```

常见问题：

- **端口被占用**：修改 `ecosystem.config.js` 中的端口
- **依赖缺失**：运行 `pnpm install`
- **权限问题**：检查文件权限 `ls -l backend/food_db.sqlite`

### 2. better-sqlite3 错误

```bash
# 重新编译
cd backend
npm rebuild better-sqlite3 --build-from-source

# 检查系统依赖
which python3
which make
which g++

# 如果缺少，安装构建工具
sudo apt install -y build-essential python3  # Ubuntu/Debian
sudo yum install -y gcc-c++ make python3     # CentOS/RHEL
```

### 3. 数据库错误

```bash
# 检查数据库文件
ls -lh backend/food_db.sqlite

# 测试数据库
sqlite3 backend/food_db.sqlite
sqlite> .tables
sqlite> SELECT COUNT(*) FROM foods;
sqlite> .quit

# 修复权限
chmod 644 backend/food_db.sqlite
```

### 4. 前端构建失败

```bash
# 清理缓存
pnpm run clean
rm -rf .next node_modules/.cache

# 重新安装依赖
rm -rf node_modules
pnpm install

# 重新构建
pnpm run build

# 检查 Node.js 版本
node -v  # 应该是 v20.x.x
```

### 5. Nginx 错误

```bash
# 测试 Nginx 配置
sudo nginx -t

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/random-food-error.log

# 检查 Nginx 状态
sudo systemctl status nginx

# 重启 Nginx
sudo systemctl restart nginx
```

### 6. 内存不足

```bash
# 查看内存使用
free -h
pm2 list

# 降低内存限制
pm2 delete all
# 修改 ecosystem.config.js 中的 max_memory_restart
pm2 start ecosystem.config.js

# 增加交换空间（临时方案）
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 🏭 生产环境优化

### 1. 配置防火墙

```bash
# 使用 UFW (Ubuntu/Debian)
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# 或使用 firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. 配置集群模式（多核 CPU）

修改 `ecosystem.config.js`：

```javascript
{
  name: 'random-food-frontend',
  instances: 'max',           // 使用所有 CPU 核心
  exec_mode: 'cluster',       // 集群模式
  // 其他配置...
}
```

重启应用：

```bash
pm2 reload ecosystem.config.js
```

### 3. 定期备份

创建备份脚本 `backup.sh`：

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/random-food"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
cp /var/www/random-food-forME/backend/food_db.sqlite \
   "$BACKUP_DIR/food_db_$DATE.sqlite"

# 备份日志
pm2 logs --raw > "$BACKUP_DIR/logs_$DATE.log"

# 清理 30 天前的备份
find $BACKUP_DIR -name "*.sqlite" -mtime +30 -delete
find $BACKUP_DIR -name "*.log" -mtime +30 -delete

echo "备份完成: $DATE"
```

添加到 Cron：

```bash
sudo crontab -e
# 每天凌晨 2 点备份
0 2 * * * /var/www/random-food-forME/backup.sh
```

### 4. 监控和告警

安装监控工具：

```bash
# 安装 htop
sudo apt install -y htop

# 安装 netdata（可选）
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

创建监控脚本 `monitor.sh`：

```bash
#!/bin/bash

# 检查应用状态
check_app() {
    if ! pm2 list | grep -q "online"; then
        echo "应用异常，尝试重启..."
        pm2 restart all

        # 发送告警邮件（需要配置 sendmail）
        echo "Random Food 应用异常，已自动重启" | \
            mail -s "应用告警" admin@example.com
    fi
}

# 检查磁盘空间
check_disk() {
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        echo "磁盘空间不足: ${DISK_USAGE}%"
        # 发送告警
    fi
}

check_app
check_disk
```

添加到 Cron（每 5 分钟检查）：

```bash
*/5 * * * * /var/www/random-food-forME/monitor.sh
```

### 5. 自动更新脚本

创建 `auto-deploy.sh`：

```bash
#!/bin/bash

set -e

cd /var/www/random-food-forME

# 备份当前版本
git rev-parse HEAD > .last_commit

# 拉取最新代码
git pull origin main

# 检查是否有更新
NEW_COMMIT=$(git rev-parse HEAD)
OLD_COMMIT=$(cat .last_commit)

if [ "$NEW_COMMIT" != "$OLD_COMMIT" ]; then
    echo "检测到更新，开始部署..."

    # 安装依赖
    pnpm install --frozen-lockfile

    # 构建前端
    pnpm run build

    # 重启服务
    pm2 reload ecosystem.config.js

    echo "部署完成！"
else
    echo "无更新"
fi
```

### 6. 性能优化

#### Next.js 配置优化

修改 `next.config.mjs`：

```javascript
const nextConfig = {
  // 启用压缩
  compress: true,

  // 生成环境禁用 sourcemap
  productionBrowserSourceMaps: false,

  // 启用 SWC 压缩
  swcMinify: true,

  // 其他现有配置...
}
```

#### Nginx 优化

添加到 Nginx 配置：

```nginx
# Gzip 压缩
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript
           application/json application/javascript application/xml+rss;

# 连接优化
keepalive_timeout 65;
keepalive_requests 100;

# 缓冲优化
client_body_buffer_size 128k;
client_header_buffer_size 1k;
large_client_header_buffers 4 16k;
```

---

## 📌 部署检查清单

部署前确认：

- [ ] Node.js 20.x 已安装
- [ ] pnpm 已安装
- [ ] PM2 已安装并配置开机自启
- [ ] 数据库文件存在并可访问
- [ ] 环境变量配置正确
- [ ] 端口未被占用（9090, 9091）
- [ ] 防火墙规则配置正确

部署后确认：

- [ ] PM2 应用状态为 `online`
- [ ] 前端页面可以访问
- [ ] 后端 API 可以访问
- [ ] 日志无错误
- [ ] Nginx 反向代理配置正确（如使用）
- [ ] HTTPS 证书配置正确（如使用）
- [ ] 配置了自动备份
- [ ] 配置了监控告警

---

## 🆘 获取帮助

如遇到问题：

1. 查看 PM2 日志：`pm2 logs`
2. 查看 Nginx 日志：`sudo tail -f /var/log/nginx/error.log`
3. 查看本文档的故障排查章节
4. 提交 GitHub Issue

---

## 📚 相关文档

- [PM2 官方文档](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Docker Compose 部署方案](./DOCKER_DEPLOYMENT.md)
- [项目 README](./README.md)
