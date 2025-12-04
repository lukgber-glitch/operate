module.exports = {
  apps: [{
    name: 'operate-api',
    script: 'dist/main.js',
    cwd: '/home/master/applications/eagqdkxvzv/public_html/apps/api',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '500M',
    error_file: '/home/master/applications/eagqdkxvzv/public_html/apps/api/logs/error.log',
    out_file: '/home/master/applications/eagqdkxvzv/public_html/apps/api/logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
