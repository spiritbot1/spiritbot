// PM2 配置文件 - 精灵1号
module.exports = {
  apps: [
    // 主网关服务
    {
      name: 'spirit-one',
      script: './dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        GATEWAY_PORT: 3100
      },
      env_file: '.env',
      error_file: './logs/spirit-error.log',
      out_file: './logs/spirit-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    // Core 服务（如果需要独立运行）
    {
      name: 'spirit-core',
      script: './core/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      cwd: './core',
      env_file: './core/config/env.template',
      error_file: './logs/core-error.log',
      out_file: './logs/core-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 默认不启动，需要时手动启动
      exec_mode: 'fork',
      autostart: false
    }
  ]
};

