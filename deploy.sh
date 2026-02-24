#!/bin/bash
set -e

echo "=== [1/7] 安装 Node.js 20 ==="
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs

echo "=== [2/7] 安装 PM2 和 git ==="
npm install -g pm2
dnf install -y git

echo "=== [3/7] 拉取代码 ==="
mkdir -p /var/www
cd /var/www
rm -rf job-assistant
git clone https://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@github.com/yylwdyx-commits/genius-resume.git job-assistant
cd /var/www/job-assistant

echo "=== [4/7] 写入 API Keys ==="
printf 'ANTHROPIC_API_KEY=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\nTAVILY_API_KEY=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\n' > .env.local

echo "=== [5/7] 安装依赖并构建（约3-5分钟）==="
npm install
npm run build

echo "=== [6/7] PM2 启动 ==="
pm2 delete job-assistant 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash || true

echo "=== [7/7] Nginx ==="
dnf install -y nginx
cp /var/www/job-assistant/nginx.conf /etc/nginx/conf.d/genius-resume.conf
rm -f /etc/nginx/conf.d/default.conf
nginx -t
systemctl enable nginx
systemctl restart nginx
firewall-cmd --permanent --add-service=http
firewall-cmd --reload

echo ""
echo "✅ 部署完成！访问 http://43.133.236.84"
