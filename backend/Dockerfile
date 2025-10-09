# ================================
# 后端 Dockerfile (Express + SQLite)
# ================================
# 包含 better-sqlite3 原生模块编译
# ================================

FROM node:20-alpine

# 安装编译 better-sqlite3 所需的构建工具
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite

WORKDIR /app

# 复制 package 文件
COPY package.json ./

# 使用 npm 安装依赖并重新构建 better-sqlite3
RUN npm install --production && \
    npm rebuild better-sqlite3 --build-from-source

# 复制源代码
COPY . .

# 创建日志目录
RUN mkdir -p /app/logs

# 创建数据目录（用于 SQLite 数据库）
RUN mkdir -p /app/data

# 设置环境变量
ENV NODE_ENV=production
ENV BACKEND_HOST=0.0.0.0
ENV BACKEND_PORT=9091
ENV PORT=9091

# 暴露端口
EXPOSE 9091

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:9091/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "index.js"]
