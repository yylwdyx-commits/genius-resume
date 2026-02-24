module.exports = {
  apps: [
    {
      name: "job-assistant",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/job-assistant",  // 服务器上的部署路径
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "800M",     // 2核服务器留点余量
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
