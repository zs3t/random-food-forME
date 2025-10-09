#!/bin/bash

set -e

echo "🧪 开始 Docker Compose 本地测试..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker 是否运行
echo "📋 检查环境..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请先启动 Docker${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker 运行正常${NC}"

# 检查端口占用
echo ""
echo "📋 检查端口占用..."
if lsof -i :9090 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  端口 9090 被占用，正在尝试停止服务...${NC}"
    pm2 stop all > /dev/null 2>&1 || true
    sleep 2
    if lsof -i :9090 > /dev/null 2>&1; then
        echo -e "${RED}❌ 端口 9090 仍被占用，请手动停止占用进程${NC}"
        lsof -i :9090
        exit 1
    fi
fi

if lsof -i :9091 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  端口 9091 被占用，请停止占用进程${NC}"
    lsof -i :9091
    exit 1
fi
echo -e "${GREEN}✅ 端口 9090 和 9091 可用${NC}"

# 检查数据库文件
echo ""
echo "📋 检查数据库文件..."
if [ ! -f "backend/food_db.sqlite" ]; then
    echo -e "${RED}❌ 数据库文件不存在: backend/food_db.sqlite${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 数据库文件存在${NC}"

# 备份数据库
echo ""
echo "💾 备份数据库..."
cp backend/food_db.sqlite backend/food_db.backup.$(date +%Y%m%d_%H%M%S).sqlite
echo -e "${GREEN}✅ 数据库已备份${NC}"

# 清理旧容器
echo ""
echo "🧹 清理旧容器..."
docker compose down > /dev/null 2>&1 || true
echo -e "${GREEN}✅ 清理完成${NC}"

# 构建镜像
echo ""
echo "🔨 构建 Docker 镜像..."
if docker compose build --no-cache; then
    echo -e "${GREEN}✅ 镜像构建成功${NC}"
else
    echo -e "${RED}❌ 镜像构建失败${NC}"
    exit 1
fi

# 启动服务
echo ""
echo "🚀 启动 Docker 服务..."
if docker compose up -d; then
    echo -e "${GREEN}✅ 服务启动成功${NC}"
else
    echo -e "${RED}❌ 服务启动失败${NC}"
    docker compose logs
    exit 1
fi

# 等待服务启动
echo ""
echo "⏳ 等待服务就绪..."
for i in {1..30}; do
    if curl -s http://localhost:9090/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 服务已就绪 (${i}s)${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ 服务启动超时${NC}"
        docker compose logs
        exit 1
    fi
    sleep 1
    echo -n "."
done

# 查看服务状态
echo ""
echo "📊 服务状态："
docker compose ps

# 测试前端
echo ""
echo "🧪 测试前端访问..."
if curl -f -s http://localhost:9090/ > /dev/null; then
    echo -e "${GREEN}✅ 前端访问正常 (http://localhost:9090)${NC}"
else
    echo -e "${RED}❌ 前端访问失败${NC}"
    docker compose logs frontend
    exit 1
fi

# 测试 127.0.0.1
echo ""
echo "🧪 测试 127.0.0.1 访问..."
if curl -f -s http://127.0.0.1:9090/ > /dev/null; then
    echo -e "${GREEN}✅ 127.0.0.1 访问正常${NC}"
else
    echo -e "${RED}❌ 127.0.0.1 访问失败${NC}"
    exit 1
fi

# 测试后端 API
echo ""
echo "🧪 测试后端 API..."
if curl -f -s http://localhost:9090/api/backend/foods > /dev/null; then
    echo -e "${GREEN}✅ 后端 API 正常 (http://localhost:9090/api/backend/foods)${NC}"
else
    echo -e "${RED}❌ 后端 API 访问失败${NC}"
    docker compose logs backend
    exit 1
fi

# 测试容器间通信
echo ""
echo "🧪 测试容器间通信..."
if docker compose exec -T frontend wget -q -O- http://backend:9091/ > /dev/null; then
    echo -e "${GREEN}✅ 容器间通信正常${NC}"
else
    echo -e "${RED}❌ 容器间通信失败${NC}"
    exit 1
fi

# 测试端口绑定安全性（应该无法从局域网 IP 访问）
echo ""
echo "🔐 测试端口绑定安全性..."
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
if [ -n "$LOCAL_IP" ]; then
    echo "   本机局域网 IP: $LOCAL_IP"
    if curl -f -s --connect-timeout 2 "http://${LOCAL_IP}:9090/" > /dev/null 2>&1; then
        echo -e "${RED}❌ 警告：服务可以从局域网 IP 访问（安全配置可能有问题）${NC}"
    else
        echo -e "${GREEN}✅ 服务无法从局域网 IP 访问（安全配置正确）${NC}"
    fi
fi

# 检查健康状态
echo ""
echo "🏥 检查健康状态..."
BACKEND_HEALTH=$(docker inspect random-food-backend | grep -o '"Status": "[^"]*"' | head -1 | cut -d'"' -f4)
FRONTEND_HEALTH=$(docker inspect random-food-frontend | grep -o '"Status": "[^"]*"' | head -1 | cut -d'"' -f4)

if [ "$BACKEND_HEALTH" = "running" ]; then
    echo -e "${GREEN}✅ 后端容器健康${NC}"
else
    echo -e "${RED}❌ 后端容器状态异常: $BACKEND_HEALTH${NC}"
fi

if [ "$FRONTEND_HEALTH" = "running" ]; then
    echo -e "${GREEN}✅ 前端容器健康${NC}"
else
    echo -e "${RED}❌ 前端容器状态异常: $FRONTEND_HEALTH${NC}"
fi

# 显示日志（最后 20 行）
echo ""
echo "📋 最近日志（后端）："
docker compose logs --tail=20 backend

echo ""
echo "📋 最近日志（前端）："
docker compose logs --tail=20 frontend

# 完成
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Docker Compose 测试全部通过！${NC}"
echo "=========================================="
echo ""
echo "📝 后续操作："
echo "  - 浏览器访问: http://localhost:9090"
echo "  - 查看日志: docker compose logs -f"
echo "  - 查看状态: docker compose ps"
echo "  - 停止服务: docker compose down"
echo "  - 恢复开发: pnpm run dev:all"
echo ""
