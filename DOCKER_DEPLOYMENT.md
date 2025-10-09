# 🐳 Docker Compose 部署指南

## 📋 目录

1. [部署前准备](#部署前准备)
2. [快速开始](#快速开始)
3. [详细步骤](#详细步骤)
4. [配置说明](#配置说明)
5. [常用命令](#常用命令)
6. [故障排查](#故障排查)
7. [生产环境优化](#生产环境优化)

---

## 🎯 部署前准备

### 系统要求

- **操作系统**: Linux / macOS / Windows (推荐 Linux)
- **Docker**: >= 20.10.0
- **Docker Compose**: >= 2.0.0
- **磁盘空间**: >= 2GB
- **内存**: >= 1GB

### 检查 Docker 安装

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker compose version

# 检查 Docker 运行状态
docker info
```

### 安装 Docker（如未安装）

#### Ubuntu/Debian

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### CentOS/RHEL

```bash
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### macOS/Windows

下载并安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

## 🚀 快速开始

### 1. 克隆项目（如果从 GitHub 部署）

```bash
git clone https://github.com/zs3t/random-food-forME.git
cd random-food-forME
```

### 2. 准备数据库文件

确保 `backend/food_db.sqlite` 存在：

```bash
# 检查数据库文件
ls -lh backend/food_db.sqlite

# 如果不存在，复制示例数据库或运行初始化脚本
# cp backend/food_db.example.sqlite backend/food_db.sqlite
```

### 3. 一键启动

```bash
# 构建并启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps
```

### 4. 访问应用

- **前端**: http://localhost:9090 或 http://127.0.0.1:9090
- **后端 API**: 通过前端代理访问（容器间通信）

> **安全说明**：默认配置下，端口只绑定到 `127.0.0.1`，只允许宿主机本地访问，无法从局域网其他设备访问。这是最安全的配置方式。

---

## 📖 详细步骤

### Step 1: 配置环境变量

```bash
# 复制环境变量模板
cp .env.docker .env

# 根据需要修改配置
nano .env
```

关键配置项：

```env
# 前端端口（默认 9090）
FRONTEND_PORT=9090

# 后端端口（默认 9091）
BACKEND_PORT=9091

# 后端监听地址（容器内需要 0.0.0.0）
BACKEND_HOST=0.0.0.0

# API 路径
NEXT_PUBLIC_API_URL=/api/backend
```

### Step 2: 构建镜像

```bash
# 构建所有服务镜像
docker compose build

# 或单独构建
docker compose build frontend
docker compose build backend
```

构建选项：

```bash
# 不使用缓存重新构建
docker compose build --no-cache

# 并行构建（加速）
docker compose build --parallel
```

### Step 3: 启动服务

```bash
# 后台启动
docker compose up -d

# 前台启动（查看日志）
docker compose up

# 只启动特定服务
docker compose up -d backend
```

### Step 4: 验证部署

```bash
# 查看服务状态
docker compose ps

# 查看服务日志
docker compose logs

# 持续查看日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
```

健康检查：

```bash
# 测试前端（从宿主机）
curl http://localhost:9090/

# 测试后端 API（通过前端代理）
curl http://localhost:9090/api/backend/

# 或进入容器测试
docker compose exec backend wget -O- http://localhost:9091/
```

---

## ⚙️ 配置说明

### docker-compose.yml 配置详解

#### 后端服务配置

```yaml
backend:
  build:
    context: ./backend          # 构建上下文
    dockerfile: Dockerfile      # Dockerfile 路径

  ports:
    - "9091:9091"              # 主机端口:容器端口

  volumes:
    # SQLite 数据库持久化
    - ./data/food_db.sqlite:/app/food_db.sqlite
    # 日志持久化
    - ./logs/backend:/app/logs

  environment:
    - NODE_ENV=production
    - BACKEND_HOST=0.0.0.0
    - BACKEND_PORT=9091
```

#### 前端服务配置

```yaml
frontend:
  build:
    context: .                  # 构建上下文（根目录）
    dockerfile: Dockerfile

  ports:
    - "9090:9090"

  depends_on:
    backend:
      condition: service_healthy  # 等待后端健康检查通过

  environment:
    - NEXT_PUBLIC_API_URL=/api/backend
    - BACKEND_HOST=backend
    - BACKEND_PORT=9091
```

### 端口映射与安全配置

#### 默认配置（安全）✅

```yaml
# docker-compose.yml
ports:
  - "127.0.0.1:9090:9090"  # 前端
  - "127.0.0.1:9091:9091"  # 后端
```

**特点：**
- ✅ 只绑定到 `127.0.0.1`，只允许宿主机本地访问
- ✅ 无法从局域网其他设备访问
- ✅ 无法从公网访问（即使有公网 IP）
- ✅ 最安全的配置，适合生产环境

**访问方式：**
- ✅ `http://localhost:9090`
- ✅ `http://127.0.0.1:9090`
- ❌ `http://192.168.x.x:9090`（局域网 IP 无法访问）

---

#### 允许局域网访问（如手机测试）

如需要从局域网其他设备访问（如手机、平板测试）：

**修改 docker-compose.yml：**
```yaml
ports:
  - "0.0.0.0:9090:9090"  # 允许所有网络接口访问
  # 或
  - "9090:9090"          # 等同于 0.0.0.0:9090:9090
```

**访问方式：**
- ✅ `http://localhost:9090`
- ✅ `http://127.0.0.1:9090`
- ✅ `http://宿主机局域网IP:9090`（如 `http://192.168.1.100:9090`）

⚠️ **安全警告**：此配置会将服务暴露到局域网，如果宿主机有公网 IP，还会暴露到互联网！生产环境**不推荐**使用。

---

#### 修改端口号

**方式一：修改 .env.docker**（推荐）
```env
FRONTEND_PORT=8080
BACKEND_PORT=8081
```

**方式二：直接修改 docker-compose.yml**
```yaml
ports:
  - "127.0.0.1:8080:9090"  # 宿主机 8080 映射到容器 9090
  - "127.0.0.1:8081:9091"  # 宿主机 8081 映射到容器 9091
```

---

#### 端口映射格式说明

```yaml
ports:
  - "宿主机IP:宿主机端口:容器端口"
```

| 配置 | 含义 | 安全性 | 使用场景 |
|------|------|--------|---------|
| `"127.0.0.1:9090:9090"` | 只绑定本地回环 | ✅ 高 | 生产环境、个人开发 |
| `"0.0.0.0:9090:9090"` | 绑定所有网络接口 | ⚠️ 低 | 开发测试、局域网共享 |
| `"9090:9090"` | 等同于 `0.0.0.0:9090:9090` | ⚠️ 低 | 开发测试 |
| `"192.168.1.100:9090:9090"` | 绑定特定 IP | 🔒 中 | 多网卡服务器 |

### 数据持久化

#### 方式一：绑定挂载（当前使用）

```yaml
volumes:
  - ./backend/food_db.sqlite:/app/food_db.sqlite
```

优点：直接访问宿主机文件
缺点：路径依赖宿主机

#### 方式二：命名卷

```yaml
volumes:
  - sqlite-data:/app/data

volumes:
  sqlite-data:
    driver: local
```

优点：Docker 管理，跨平台
缺点：备份稍复杂

---

## 🛠️ 常用命令

### 服务管理

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose stop

# 重启服务
docker compose restart

# 停止并删除容器
docker compose down

# 停止并删除容器、网络、镜像、卷
docker compose down -v --rmi all
```

### 日志查看

```bash
# 查看所有服务日志
docker compose logs

# 实时查看日志
docker compose logs -f

# 查看最近 100 行日志
docker compose logs --tail=100

# 查看特定服务日志
docker compose logs frontend
docker compose logs backend
```

### 容器管理

```bash
# 查看运行中的容器
docker compose ps

# 进入容器 shell
docker compose exec backend sh
docker compose exec frontend sh

# 在容器中执行命令
docker compose exec backend node -v
docker compose exec backend ls -la
```

### 镜像管理

```bash
# 查看镜像
docker images

# 删除未使用的镜像
docker image prune

# 删除项目相关镜像
docker compose down --rmi all
```

### 数据备份

```bash
# 备份 SQLite 数据库
docker compose exec backend sqlite3 /app/food_db.sqlite .dump > backup.sql

# 或直接复制文件
docker compose cp backend:/app/food_db.sqlite ./backup/food_db_$(date +%Y%m%d).sqlite

# 恢复数据库
docker compose cp ./backup/food_db.sqlite backend:/app/food_db.sqlite
docker compose restart backend
```

### 更新部署

```bash
# 方式一：重新构建并启动
docker compose up -d --build

# 方式二：先停止，重新构建，再启动
docker compose down
docker compose build
docker compose up -d

# 方式三：滚动更新（零停机）
docker compose up -d --no-deps --build frontend
```

---

## 🔍 故障排查

### 1. 服务无法启动

```bash
# 查看详细日志
docker compose logs backend

# 检查容器状态
docker compose ps

# 检查容器详情
docker inspect random-food-backend
```

常见问题：

- **端口被占用**
  ```bash
  # 检查端口占用
  lsof -i :9090
  lsof -i :9091

  # 修改 .env.docker 中的端口配置
  ```

- **权限问题**
  ```bash
  # 检查数据库文件权限
  ls -l backend/food_db.sqlite

  # 修改权限
  chmod 644 backend/food_db.sqlite
  ```

### 2. 数据库错误

```bash
# 进入后端容器
docker compose exec backend sh

# 检查数据库文件
ls -lh /app/food_db.sqlite

# 测试数据库连接
sqlite3 /app/food_db.sqlite "SELECT * FROM foods LIMIT 1;"
```

### 3. better-sqlite3 编译失败

如果后端构建失败，可能是编译 better-sqlite3 的问题：

```dockerfile
# 确保 backend/Dockerfile 包含构建工具
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite
```

重新构建：

```bash
docker compose build --no-cache backend
```

### 4. 前端无法连接后端

检查网络连接：

```bash
# 进入前端容器
docker compose exec frontend sh

# 测试后端连接
wget -O- http://backend:9091/

# 检查环境变量
env | grep -E "API|BACKEND"
```

确保 `docker-compose.yml` 中：

- 两个服务在同一网络
- `depends_on` 配置正确
- 环境变量 `BACKEND_PORT` 正确

### 5. 健康检查失败

```bash
# 查看健康检查日志
docker inspect random-food-backend | grep -A 10 Health

# 手动测试健康检查命令
docker compose exec backend node -e "require('http').get('http://localhost:9091/', (r) => {console.log(r.statusCode)})"
```

### 6. 查看资源占用

```bash
# 查看容器资源使用
docker stats

# 查看磁盘占用
docker system df
```

---

## 🔐 安全最佳实践

### 1. 端口绑定策略

**默认配置（已实现）：**
```yaml
# docker-compose.yml
ports:
  - "127.0.0.1:9090:9090"  # 只允许本机访问
  - "127.0.0.1:9091:9091"
```

**为什么这样配置？**
- ✅ 防止服务意外暴露到局域网
- ✅ 防止服务暴露到公网（即使宿主机有公网 IP）
- ✅ 符合最小权限原则
- ✅ 与生产环境安全标准一致

### 2. 容器内监听地址

**容器内必须使用 `0.0.0.0`：**
```yaml
environment:
  - BACKEND_HOST=0.0.0.0  # 容器内监听所有接口
```

**为什么？**
- Docker 端口映射需要容器内绑定 `0.0.0.0`
- 容器间通信需要容器内绑定 `0.0.0.0`
- 宿主机绑定 `127.0.0.1` 与容器内绑定 `0.0.0.0` 不冲突

### 3. 不同环境的安全策略

| 环境 | 宿主机绑定 | 容器内监听 | 安全级别 |
|------|----------|----------|---------|
| **本地开发** | `127.0.0.1` | `0.0.0.0` | ✅ 高 |
| **测试环境（需局域网访问）** | `0.0.0.0` | `0.0.0.0` | ⚠️ 中 |
| **生产环境** | `127.0.0.1` + Nginx | `0.0.0.0` | ✅ 高 |
| **云服务器（公网）** | `127.0.0.1` + Nginx + SSL | `0.0.0.0` | ✅ 高 |

### 4. 安全检查清单

部署前确认：
- [ ] Docker 端口绑定使用 `127.0.0.1`（除非明确需要局域网访问）
- [ ] 容器内监听地址为 `0.0.0.0`
- [ ] 防火墙规则配置正确
- [ ] 如有公网 IP，必须使用 Nginx 反向代理 + SSL
- [ ] 定期更新 Docker 镜像和依赖

---

## 🏭 生产环境优化

### 1. 使用 Nginx 反向代理

创建 `nginx.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:9090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端 API
    location /api/backend/ {
        proxy_pass http://localhost:9091/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

添加到 `docker-compose.yml`：

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/conf.d/default.conf
  depends_on:
    - frontend
    - backend
```

### 2. 配置 HTTPS (Let's Encrypt)

```bash
# 安装 certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 3. 日志轮转

创建 `docker-compose.override.yml`：

```yaml
version: '3.8'

services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 4. 资源限制

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

  frontend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 5. 自动重启策略

```yaml
services:
  backend:
    restart: unless-stopped  # 总是重启，除非手动停止

  frontend:
    restart: on-failure      # 仅失败时重启
    restart: always          # 总是重启
```

### 6. 定期备份脚本

创建 `backup.sh`：

```bash
#!/bin/bash

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
docker compose exec -T backend cat /app/food_db.sqlite > "$BACKUP_DIR/food_db_$DATE.sqlite"

# 备份日志
docker compose logs > "$BACKUP_DIR/logs_$DATE.log"

# 清理 7 天前的备份
find $BACKUP_DIR -name "*.sqlite" -mtime +7 -delete
find $BACKUP_DIR -name "*.log" -mtime +7 -delete

echo "备份完成: $DATE"
```

添加到 crontab：

```bash
# 每天凌晨 2 点备份
0 2 * * * cd /path/to/project && ./backup.sh
```

### 7. 监控和告警

使用 Docker 自带的健康检查：

```bash
# 监控脚本 monitor.sh
#!/bin/bash

while true; do
  if ! docker compose ps | grep -q "healthy"; then
    echo "服务不健康，尝试重启..."
    docker compose restart

    # 发送告警（示例：发邮件）
    echo "Random Food 服务异常，已自动重启" | mail -s "服务告警" admin@example.com
  fi

  sleep 300  # 每 5 分钟检查一次
done
```

---

## 📌 部署检查清单

部署前确认：

- [ ] Docker 和 Docker Compose 已安装
- [ ] `backend/food_db.sqlite` 数据库文件存在
- [ ] 环境变量配置正确（`.env.docker`）
- [ ] 端口 9090 和 9091 未被占用
- [ ] 磁盘空间充足（>= 2GB）

部署后确认：

- [ ] 所有容器状态为 `healthy`
- [ ] 前端页面可以正常访问
- [ ] 后端 API 可以正常访问
- [ ] 数据库查询正常
- [ ] 日志无错误信息
- [ ] 配置了自动备份

---

## 🆘 获取帮助

如遇到问题：

1. 查看日志：`docker compose logs -f`
2. 检查容器状态：`docker compose ps`
3. 查看本文档的故障排查章节
4. 提交 GitHub Issue

---

## 📚 相关文档

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [项目 README](./README.md)
