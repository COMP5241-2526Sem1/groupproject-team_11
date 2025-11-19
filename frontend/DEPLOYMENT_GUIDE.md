# 服务器部署指南

## 服务器信息
- **服务器IP**: 49.232.227.144
- **项目类型**: React + Vite 前端应用

## 部署方式选择

### 方式一：使用 Nginx（推荐）

#### 1. 本地构建生产版本

```bash
# 安装依赖（如果还没安装）
npm install

# 构建生产版本
npm run build
```

构建完成后，会在项目根目录生成 `dist` 文件夹，包含所有静态文件。

#### 2. 服务器环境准备

连接到服务器：
```bash
ssh root@49.232.227.144
```

安装 Nginx：
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 3. 上传构建文件到服务器

从本地电脑上传（使用 PowerShell）：
```powershell
# 使用 SCP 上传 dist 文件夹
scp -r .\dist root@49.232.227.144:/var/www/html/my-app
```

或者使用 WinSCP、FileZilla 等 FTP 工具上传 `dist` 文件夹。

#### 4. 配置 Nginx

在服务器上创建 Nginx 配置文件：
```bash
sudo nano /etc/nginx/sites-available/my-app
```

添加以下配置：
```nginx
server {
    listen 80;
    server_name 49.232.227.144;

    root /var/www/html/my-app;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 启用 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/my-app /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 5. 配置防火墙

```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

#### 6. 访问应用

打开浏览器访问：`http://49.232.227.144`

---

### 方式二：使用 Docker（推荐用于容器化部署）

#### 1. 创建 Dockerfile

在项目根目录创建 `Dockerfile`（已在下方创建）。

#### 2. 构建 Docker 镜像

```bash
docker build -t my-react-app .
```

#### 3. 上传到服务器

```bash
# 保存镜像
docker save my-react-app > my-react-app.tar

# 上传到服务器
scp my-react-app.tar root@49.232.227.144:/root/

# 在服务器上加载镜像
ssh root@49.232.227.144
docker load < /root/my-react-app.tar

# 运行容器
docker run -d -p 80:80 --name my-app my-react-app
```

---

### 方式三：使用 PM2 + Node.js 静态服务器

#### 1. 服务器安装 Node.js 和 PM2

```bash
# 安装 Node.js (使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 安装 PM2
npm install -g pm2

# 安装 serve（静态文件服务器）
npm install -g serve
```

#### 2. 上传 dist 文件夹到服务器

```powershell
scp -r .\dist root@49.232.227.144:/root/my-app
```

#### 3. 在服务器上运行

```bash
cd /root/my-app
pm2 serve dist 80 --name "my-app" --spa
pm2 save
pm2 startup
```

---

## 环境变量配置

如果你的应用需要环境变量，创建 `.env.production` 文件：

```env
VITE_API_URL=http://49.232.227.144:8000
VITE_APP_TITLE=My Application
```

**重要**：构建前确保环境变量正确设置。

---

## HTTPS 配置（可选但推荐）

### 使用 Let's Encrypt 免费 SSL 证书

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书（需要域名）
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

**注意**：使用 IP 地址无法申请 SSL 证书，需要域名。

---

## 后端 API 配置

如果你的前端需要连接后端 API：

1. 确保后端服务运行在服务器上（如 `http://49.232.227.144:8000`）
2. 配置 Nginx 反向代理：

```nginx
location /api {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

## 持续集成/持续部署（CI/CD）

### 自动化部署脚本

创建 `deploy.sh` 脚本（已在下方创建），然后：

```bash
# 赋予执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

---

## 故障排查

### 1. 页面刷新 404 错误
- 确保 Nginx 配置了 `try_files $uri $uri/ /index.html;`

### 2. 静态资源加载失败
- 检查构建路径配置
- 确认文件权限：`sudo chmod -R 755 /var/www/html/my-app`

### 3. API 请求跨域问题
- 配置后端 CORS
- 或使用 Nginx 反向代理

### 4. 查看 Nginx 日志
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 性能优化建议

1. **启用 Gzip 压缩**（已在 Nginx 配置中）
2. **配置静态资源缓存**（已在 Nginx 配置中）
3. **使用 CDN** 加速静态资源
4. **代码分割**：Vite 默认已启用
5. **图片优化**：使用 WebP 格式

---

## 监控和维护

```bash
# 查看 Nginx 状态
sudo systemctl status nginx

# 重启 Nginx
sudo systemctl restart nginx

# 查看服务器资源使用
htop

# 查看磁盘使用
df -h
```

---

## 快速部署检查清单

- [ ] 本地构建成功（`npm run build`）
- [ ] 服务器已安装 Nginx/Docker
- [ ] 防火墙已开放 80/443 端口
- [ ] dist 文件已上传到服务器
- [ ] Nginx 配置文件已创建
- [ ] Nginx 已重启
- [ ] 浏览器可访问 `http://49.232.227.144`
- [ ] 后端 API 连接正常（如需要）
- [ ] 环境变量配置正确

---

## 需要帮助？

如果遇到问题，请检查：
1. 服务器日志
2. 浏览器控制台错误
3. 网络连接
4. 防火墙规则
