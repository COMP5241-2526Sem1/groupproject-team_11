# ✅ 最终部署清单

## 已完成项
- [x] ✅ 环境变量配置完成（`.env.production` 和 `.env.development`）
- [x] ✅ API地址配置为 `http://49.232.227.144:5000`
- [x] ✅ 前端地址配置为 `http://49.232.227.144`
- [x] ✅ 分享链接使用 `FRONTEND_URL` 环境变量
- [x] ✅ 代码构建成功（`npm run build`）
- [x] ✅ 构建产物验证通过（包含正确的URL）

## 🎯 现在可以部署了！

### 立即执行的命令

```powershell
# 1. 上传dist文件夹到服务器
scp -r .\dist\* root@49.232.227.144:/var/www/html/my-app/
```

### 服务器配置步骤

连接到服务器后：

```bash
# 1. 确保目录权限正确
chmod -R 755 /var/www/html/my-app

# 2. 创建Nginx配置（如果还没有）
sudo nano /etc/nginx/sites-available/my-app
```

粘贴以下Nginx配置：
```nginx
server {
    listen 80;
    server_name 49.232.227.144;
    
    root /var/www/html/my-app;
    index index.html;
    
    # 处理 React Router 路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API反向代理（如果后端在同一服务器）
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;
}
```

启用配置：
```bash
# 3. 启用站点配置
sudo ln -s /etc/nginx/sites-available/my-app /etc/nginx/sites-enabled/

# 4. 测试配置
sudo nginx -t

# 5. 重启Nginx
sudo systemctl restart nginx

# 6. 检查状态
sudo systemctl status nginx
```

## 📋 验证清单

部署后请验证：

### 1. 基础访问
- [ ] 打开浏览器访问 `http://49.232.227.144`
- [ ] 首页正常显示
- [ ] 能够导航到不同页面

### 2. API连接
- [ ] 课程列表加载正常
- [ ] 活动列表加载正常
- [ ] 可以创建新活动

### 3. 分享功能（重要！）
- [ ] 创建一个测验/投票
- [ ] 点击"Share"按钮
- [ ] 检查分享链接格式：`http://49.232.227.144/response/xxx`
- [ ] 二维码可以扫描
- [ ] 通过链接可以访问答题页面

### 4. 路由功能
- [ ] 直接访问 `/courses` 不会404
- [ ] 刷新页面能正常加载
- [ ] 浏览器前进后退按钮正常工作

## 🔧 后端配置要求

确保后端满足以下条件：

### 1. 运行在5000端口
```bash
# 检查后端是否运行
curl http://localhost:5000/api/courses
```

### 2. 配置CORS（如果前后端分开部署）

**Python Flask 示例：**
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://49.232.227.144"], supports_credentials=True)
```

**Node.js Express 示例：**
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'http://49.232.227.144',
  credentials: true
}));
```

### 3. API端点要求
所有API端点必须以 `/api` 开头：
- ✅ `GET /api/polls`
- ✅ `POST /api/classroom_quiz/create`
- ✅ `GET /api/courses`
- ❌ `GET /polls`（错误格式）

## 🐛 常见问题解决

### 问题1：页面空白
**检查：**
```bash
# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 检查文件权限
ls -la /var/www/html/my-app
```

**解决：**
```bash
chmod -R 755 /var/www/html/my-app
sudo systemctl restart nginx
```

### 问题2：API调用失败
**检查：**
```bash
# 测试后端连接
curl http://localhost:5000/api/courses

# 检查防火墙
sudo ufw status
```

**解决：**
```bash
# 开放5000端口（如果需要从外部访问）
sudo ufw allow 5000

# 或者使用Nginx反向代理（推荐）
```

### 问题3：分享链接错误
**症状：** 分享链接显示 `http://localhost/response/xxx`

**原因：** 使用了开发环境构建

**解决：**
```powershell
# 删除旧的构建
Remove-Item -Recurse -Force dist

# 确认使用生产环境
$env:NODE_ENV = "production"

# 重新构建
npm run build

# 验证构建产物
Select-String -Path "dist/assets/*.js" -Pattern "49.232.227.144" | Select-Object -First 1
```

### 问题4：页面刷新404
**症状：** 直接访问 `/courses` 显示404

**原因：** Nginx未配置SPA路由支持

**解决：** 确保Nginx配置包含：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 📊 部署后监控

### 查看访问日志
```bash
sudo tail -f /var/log/nginx/access.log
```

### 查看错误日志
```bash
sudo tail -f /var/log/nginx/error.log
```

### 监控系统资源
```bash
# 安装htop
sudo apt install htop

# 查看系统资源
htop
```

## 🎉 部署完成后

1. ✅ 访问 `http://49.232.227.144` 验证前端
2. ✅ 测试创建活动功能
3. ✅ 测试分享链接生成
4. ✅ 在手机上扫描二维码测试
5. ✅ 验证学生提交答案功能

## 📝 重要提示

- 🔒 **生产环境安全**：建议配置HTTPS和域名
- 🔄 **自动部署**：可以使用 GitHub Actions 或 GitLab CI/CD
- 📦 **备份**：定期备份 `/var/www/html/my-app` 目录
- 🔍 **监控**：设置服务器监控和告警

## 需要帮助？

如果遇到问题：
1. 检查 Nginx 错误日志
2. 检查浏览器控制台（F12）
3. 检查后端日志
4. 确认防火墙规则
5. 验证文件权限

---

**祝部署顺利！🚀**
