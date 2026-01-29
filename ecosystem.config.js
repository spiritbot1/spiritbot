// PM2 配置文件
module.exports = {
  apps: [{
    name: 'spirit-gateway',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      GATEWAY_PORT: 3100
    },
    env_file: '.env'
  }]
};

