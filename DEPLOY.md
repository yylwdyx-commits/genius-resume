# 部署指南（TencentOS Server 3.3 / RHEL 8）

## 本地开发

```bash
cd job-assistant
npm install
# 编辑 .env.local，填入 API Keys
npm run dev
# 访问 http://localhost:3000
```

---

## 服务器部署

### 第一步：安装 Node.js 20

```bash
# 添加 NodeSource 源（RHEL 8 兼容）
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# 验证
node -v   # 应输出 v20.x.x
npm -v
```

### 第二步：安装 PM2

```bash
sudo npm install -g pm2
```

### 第三步：上传项目代码

**方式一：scp（从本地 Mac 上传）**

```bash
# 在你的 Mac 上执行
scp -r /Users/yl/job-assistant root@你的服务器IP:/var/www/job-assistant
```

**方式二：git（推荐，需先把代码推到 GitHub）**

```bash
# 服务器上
sudo mkdir -p /var/www
cd /var/www
git clone https://github.com/你的用户名/job-assistant.git
```

### 第四步：安装依赖并构建

```bash
cd /var/www/job-assistant

# 创建环境变量文件（填入真实的 API Keys）
cat > .env.local << 'EOF'
ANTHROPIC_API_KEY=你的ClaudeKey
TAVILY_API_KEY=你的TavilyKey
EOF

npm install
npm run build
```

### 第五步：PM2 启动

```bash
# 修改 ecosystem.config.js 中的 cwd 路径为 /var/www/job-assistant
pm2 start ecosystem.config.js
pm2 save

# 配置开机自启
pm2 startup
# 按照命令输出，执行它给出的 sudo env 那行命令
```

### 第六步：安装并配置 Nginx

```bash
# 安装 Nginx
sudo dnf install -y nginx

# 复制配置文件
sudo cp /var/www/job-assistant/nginx.conf /etc/nginx/conf.d/job-assistant.conf

# 编辑配置，把 server_name 改成你的服务器 IP 或域名
sudo vi /etc/nginx/conf.d/job-assistant.conf

# 测试配置语法
sudo nginx -t

# 启动 Nginx 并设置开机自启
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 第七步：开放防火墙端口

TencentOS 用 firewalld，同时腾讯云控制台也要开放端口：

```bash
# 系统防火墙开放 HTTP/HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# 验证
sudo firewall-cmd --list-all
```

**腾讯云控制台也要操作：**
> 控制台 → 云服务器 → 实例 → 安全组 → 添加入站规则：
> - 协议 TCP，端口 80，来源 0.0.0.0/0
> - 协议 TCP，端口 443，来源 0.0.0.0/0（如果要 HTTPS）

### 第八步：配置 SSL（可选，有域名才能做）

```bash
# 安装 certbot（RHEL 8 用 EPEL 源）
sudo dnf install -y epel-release
sudo dnf install -y certbot python3-certbot-nginx

# 申请证书（替换为你的域名）
sudo certbot --nginx -d your-domain.com

# 证书自动续期（certbot 会自动设置，可手动验证）
sudo certbot renew --dry-run
```

---

## 常用运维命令

```bash
# PM2
pm2 status                    # 查看进程状态
pm2 logs job-assistant        # 查看日志（实时）
pm2 restart job-assistant     # 重启应用
pm2 stop job-assistant        # 停止应用

# Nginx
sudo systemctl status nginx   # 查看 Nginx 状态
sudo systemctl reload nginx   # 重载配置（不中断服务）
sudo tail -f /var/log/nginx/error.log  # 查看 Nginx 错误日志

# 查看应用是否监听 3000 端口
sudo ss -tlnp | grep 3000
```

---

## 域名配置（可选）

1. 在域名服务商（腾讯云 DNSPod 等）添加 **A 记录**，指向服务器 IP
2. DNS 生效后（5~30 分钟），再做 certbot SSL
3. 没有域名也可以直接用 `http://服务器IP` 访问

---

## 验证部署成功

```bash
# 本地测试（服务器上执行）
curl http://localhost:3000

# 如果返回 HTML 内容，说明 Next.js 正常运行
```

浏览器访问 `http://你的服务器IP`，看到求职助手界面即部署成功。
