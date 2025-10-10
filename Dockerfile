# ================================
# 前端 Dockerfile (Next.js)
# ================================
# 多阶段构建，优化镜像大小
# ================================

# ================================
# Stage 1: 依赖安装
# ================================
FROM node:20-alpine AS deps

# 安装编译工具（用于编译 better-sqlite3 等原生模块）
RUN apk add --no-cache \
    python3 \
    make \
    g++

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmfile.cjs ./
COPY backend/package.json ./backend/

# 安装依赖（better-sqlite3 会自动编译）
RUN pnpm install --frozen-lockfile

# ================================
# Stage 2: 构建应用
# ================================
FROM node:20-alpine AS builder

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 后端服务地址配置（用于构建时生成正确的重写规则）
ARG BACKEND_HOST=backend
ARG BACKEND_PORT=9091
ENV BACKEND_HOST=${BACKEND_HOST}
ENV BACKEND_PORT=${BACKEND_PORT}

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# 复制源代码
COPY . .

# 确保 public 目录存在，避免生产阶段 COPY 失败
RUN mkdir -p public

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建 Next.js
RUN pnpm run build

# ================================
# Stage 3: 生产运行环境
# ================================
FROM node:20-alpine AS runner

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ARG BACKEND_HOST=backend
ARG BACKEND_PORT=9091
ENV BACKEND_HOST=${BACKEND_HOST}
ENV BACKEND_PORT=${BACKEND_PORT}

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换用户
USER nextjs

# 暴露端口
EXPOSE 9090

ENV PORT=9090
ENV HOSTNAME=0.0.0.0

# 启动应用
CMD ["node", "server.js"]
