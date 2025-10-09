/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 standalone 输出模式，用于 Docker 部署
  output: 'standalone',

  images: {
    unoptimized: true,
  },

  // 配置 webpack 以解决 pnpm workspace 的符号链接缓存问题
  webpack: (config, { isServer }) => {
    // 彻底禁用文件系统缓存以避免 pnpm symlinks 导致的 snapshot 错误
    // 注意：这会稍微降低构建速度，但避免了警告
    config.cache = false

    return config
  },

  async rewrites() {
    // 从环境变量读取后端端口，默认为 9091
    // Docker 环境下会使用服务名 'backend'
    const backendHost = process.env.BACKEND_HOST || 'localhost'
    const backendPort = process.env.BACKEND_PORT || '9091'

    return [
      {
        source: '/api/backend/:path*',
        destination: `http://${backendHost}:${backendPort}/:path*`,
      },
    ];
  },
}

export default nextConfig
