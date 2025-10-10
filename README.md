# Random Food 美食推荐系统

一个基于 Next.js + Express 的美食随机推荐应用，支持美食管理和智能推荐。默认美食菜单来源：
[CookLikeHOC归纳整理的《老乡鸡菜品》](https://github.com/Gar-b-age/CookLikeHOC)

## 🚢 部署指南

### 方式一：独立服务器（PM2）

**前提条件**
- Linux 服务器（Ubuntu 20.04+/Debian/CentOS）
- Node.js 20+、pnpm 8+、PM2 5+、SQLite
- 已开放 9090（前端）与 9091（后端）端口或配合 Nginx 反向代理

**部署步骤**
1. 安装运行环境（示例为 Ubuntu）：
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs build-essential python3 sqlite3
   npm install -g pnpm pm2
   ```
2. 克隆代码并进入项目目录：
   ```bash
   git clone https://github.com/zs3t/random-food-forME.git
   cd random-food-forME
   ```
3. 检查生产环境变量：
   ```bash
   # 仔细检查已提供的 .env.production，根据服务器环境调整字段
   nano .env.production
   ```
4. 安装依赖并构建：
   ```bash
   pnpm install --frozen-lockfile
   pnpm run build
   ```
5. 使用 PM2 启动并常驻：
   ```bash
   pm2 start ecosystem.config.js
   pm2 save            # 保存进程，系统重启后自动恢复
   pm2 status          # 查看运行状态
   pm2 logs            # 查看实时日志
   ```
6. （可选）使用 Nginx 做反向代理，将 80/443 请求转发到前端：9090。

更多服务器部署细节请参考 `SERVER_DEPLOYMENT.md`。

### 方式二：Docker Compose

**前提条件**
- Docker 20.10+ 与 Docker Compose 2+
- 宿主机保留 `data/` 目录用于 SQLite 持久化

**部署步骤**
1. 安装运行环境并克隆代码（以 Ubuntu 为例）：
   ```bash
   # 安装 Docker 与 Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER

   # 克隆仓库并进入项目目录
   git clone https://github.com/zs3t/random-food-forME.git
   cd random-food-forME
   ```
2. 准备环境文件与数据库：
   ```bash
   cp .env.docker .env         # 如需自定义端口可修改该文件
   mkdir -p data logs/backend
   cp backend/food_db.sqlite data/food_db.sqlite
   ```
3. 构建并启动服务：
   ```bash
   docker compose build
   docker compose up -d
   ```
4. 验证与运维：
   ```bash
   docker compose ps            # 查看容器状态
   docker compose logs -f       # 查看实时日志
   open http://localhost:9090   # 访问前端（macOS 可用 open）
   docker compose down          # 停止并清理
   ```

如需一键检查与构建，可执行项目自带的 `./test-docker.sh`，脚本会完成端口检测、镜像构建和连通性验证。更多 Docker 部署细节请参考 `DOCKER_DEPLOYMENT.md`。

## 📁 项目结构

```
random-food-forME/
├── app/                       # Next.js 应用目录
│   ├── page.tsx              # 主页面
│   ├── layout.tsx            # 布局组件
│   └── global.css            # 全局样式
├── backend/                   # Express 后端
│   ├── index.js              # API 服务器
│   ├── food_db.sqlite        # SQLite 数据库
│   ├── package.json          # 后端依赖
│   └── tsconfig.json         # 后端 TS 配置
├── components/                # React 组件
│   ├── food-manager.tsx      # 美食管理组件
│   ├── markdown-renderer.tsx # Markdown 渲染器
│   └── ui/                   # shadcn/ui 组件库
├── lib/                       # 工具函数
│   ├── api.ts                # API 配置
│   └── utils.ts              # 通用工具
├── types/                     # TypeScript 类型
│   └── food.ts               # 美食类型定义
├── docs/                      # 文档目录
│   └── WEBPACK_WARNINGS.md   # Webpack 警告修复说明
├── .env.local                 # 开发环境变量
├── .env.production            # 生产环境变量
├── .env.example               # 环境变量示例
├── ecosystem.config.js        # PM2 部署配置
├── next.config.mjs            # Next.js 配置
├── package.json               # 项目依赖
├── pnpm-workspace.yaml        # pnpm workspace 配置
├── tsconfig.json              # TypeScript 配置

```

---

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 14
- **UI 库**: shadcn/ui + Radix UI
- **样式**: Tailwind CSS
- **状态管理**: React Hooks
- **表单**: React Hook Form + Zod
- **主题**: next-themes
- **图标**: Lucide React

### 后端
- **运行时**: Node.js
- **框架**: Express 5
- **数据库**: SQLite (better-sqlite3)
- **CORS**: cors

### 开发工具
- **包管理**: pnpm (workspace)
- **类型检查**: TypeScript
- **代码规范**: ESLint
- **部署**: PM2
- **并发运行**: concurrently

---

## 📝 主要功能

1. **美食管理**
   - ✅ 添加、编辑、删除美食
   - ✅ 支持 Markdown 格式描述
   - ✅ 分类管理（25+ 种分类）
   - ✅ 搜索和筛选

2. **智能推荐**
   - ✅ 按分类随机推荐
   - ✅ 动画效果
   - ✅ 实时更新

3. **用户体验**
   - ✅ 响应式设计
   - ✅ 暗色模式支持
   - ✅ 流畅的动画
   - ✅ Toast 通知

---

## 🐛 故障排查

### 清理缓存
```bash
# 使用脚本清理
pnpm run clean

# 或手动清理
rm -rf .next
rm -rf node_modules/.cache
```

### 端口占用
```bash
# 查看端口占用
lsof -i :9090  # 前端
lsof -i :9091  # 后端

# 杀死进程
kill -9 <PID>
```
## 📚 相关文档

- [SERVER_DEPLOYMENT.md](./SERVER_DEPLOYMENT.md) - 服务器部署细节
- [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) - Docker Compose 部署说明
- [.env.example](./.env.example) - 环境变量示例

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
