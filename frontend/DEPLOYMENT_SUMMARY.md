# 🚀 部署就绪摘要

## ✅ 已完成的配置

### 1. 环境变量配置
已创建并配置以下文件：

**生产环境 (`.env.production`)**
```env
VITE_API_URL=http://49.232.227.144:5000/api
VITE_BASE_URL=http://49.232.227.144:5000
VITE_FRONTEND_URL=http://49.232.227.144
```

**开发环境 (`.env.development`)**
```env
VITE_API_URL=http://localhost:3000/api
VITE_BASE_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:8080
```

### 2. 代码修改
已修改以下文件以支持环境变量：

#### 核心服务文件
- ✅ `src/services/api.ts` - 添加了 `FRONTEND_URL` 导出
- ✅ `src/services/aiService.ts` - 修复AI服务URL配置
- ✅ `src/services/urlConfig.ts` - 新建URL管理工具
- ✅ `src/vite-env.d.ts` - 添加环境变量类型定义

#### 页面文件（分享链接修复）
- ✅ `src/pages/Quiz.tsx` - 测验分享链接
- ✅ `src/pages/OpinionPoll.tsx` - 投票分享链接
- ✅ `src/pages/OpenQuestion.tsx` - 开放问题分享链接
- ✅ `src/pages/ScalesQuestion.tsx` - 量表问卷分享链接

### 3. Docker配置
- ✅ `Dockerfile` - 多阶段构建配置
- ✅ `nginx.conf` - Nginx服务器配置
- ✅ `.dockerignore` - Docker忽略文件

### 4. 部署脚本
- ✅ `deploy.sh` - 自动化部署脚本（Linux/Mac）
- ✅ `DEPLOYMENT_GUIDE.md` - 完整部署文档

---

## 📦 现在可以部署了！

### 方式一：直接上传（推荐-最简单）

1. **构建项目**（已完成）
   ```powershell
   npm run build
   ```

2. **上传dist文件夹到服务器**
   ```powershell
   scp -r .\dist\* root@49.232.227.144:/var/www/html/my-app/
   ```

3. **在服务器上配置Nginx**
   
   连接到服务器：
   ```bash
   ssh root@49.232.227.144
   ```
   
   创建Nginx配置：
   ```bash
   sudo nano /etc/nginx/sites-available/my-app
   ```
   
   粘贴配置（从项目根目录的 `nginx.conf` 文件）并修改：
   ```nginx
   server {
       listen 80;
       server_name 49.232.227.144;
       root /var/www/html/my-app;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # 如果后端也在同一服务器，添加反向代理
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   启用配置：
   ```bash
   sudo ln -s /etc/nginx/sites-available/my-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **访问应用**
   ```
   http://49.232.227.144
   ```

---

### 方式二：使用Docker

1. **构建Docker镜像**
   ```bash
   docker build -t my-learning-platform .
   ```

2. **运行容器**
   ```bash
   docker run -d -p 80:80 --name learning-platform my-learning-platform
   ```

---

## 🔧 后端配置要求

确保后端服务满足以下要求：

1. **运行在 5000 端口**
   ```bash
   # 检查后端是否运行
   curl http://49.232.227.144:5000/api
   ```

2. **启用CORS**（如果前后端分离）
   后端需要允许来自前端的请求：
   ```javascript
   // 示例：Express.js
   app.use(cors({
     origin: 'http://49.232.227.144',
     credentials: true
   }));
   ```

3. **API端点**
   确保所有API端点都以 `/api` 开头：
   - `GET /api/polls`
   - `POST /api/classroom_quiz/create`
   - `GET /api/courses`
   - 等等...

---

## ✨ 功能验证清单

部署后请验证以下功能：

### 基础功能
- [ ] 首页正常显示
- [ ] 课程列表加载正常
- [ ] 活动列表加载正常

### API连接
- [ ] 创建新测验
- [ ] 创建新投票
- [ ] 上传文件
- [ ] AI助手对话

### 分享功能（重要！）
- [ ] 创建测验并点击"Share"
- [ ] 分享链接格式正确：`http://49.232.227.144/response/xxx`
- [ ] 扫描二维码可以访问
- [ ] 学生可以通过分享链接提交答案

### 文件上传
- [ ] 课程资料上传
- [ ] 作业上传
- [ ] Excel导入

---

## 🐛 常见问题排查

### 问题1：分享链接生成错误
**症状**：分享链接是 `http://localhost/response/xxx`

**解决**：
1. 确认 `.env.production` 文件存在
2. 重新构建：`npm run build`
3. 检查构建产物中的URL

### 问题2：API调用失败
**症状**：页面加载但数据为空，控制台显示网络错误

**解决**：
1. 检查后端是否运行：`curl http://49.232.227.144:5000/api/courses`
2. 检查防火墙：`sudo ufw status`
3. 检查CORS配置

### 问题3：页面刷新404
**症状**：直接访问 `/courses` 等路径时显示404

**解决**：
确保Nginx配置包含：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 问题4：静态资源加载失败
**症状**：页面布局错乱，CSS/JS未加载

**解决**：
1. 检查文件权限：`ls -la /var/www/html/my-app`
2. 修复权限：`sudo chmod -R 755 /var/www/html/my-app`

---

## 📊 部署架构

```
┌─────────────────────────────────────────────┐
│         49.232.227.144 (服务器)              │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────┐      ┌──────────────┐    │
│  │   Nginx:80   │◄────►│ 前端静态文件  │    │
│  └──────┬───────┘      │  /var/www/   │    │
│         │              │  html/my-app │    │
│         │              └──────────────┘    │
│         │                                   │
│         ▼                                   │
│  ┌──────────────┐                          │
│  │ 后端API:5000 │                          │
│  └──────────────┘                          │
│                                              │
└─────────────────────────────────────────────┘

用户访问流程：
1. http://49.232.227.144 → Nginx → 返回前端页面
2. 前端调用 http://49.232.227.144:5000/api → 后端API
3. 分享链接：http://49.232.227.144/response/xxx
```

---

## 📝 环境变量说明

| 变量名 | 作用 | 生产环境值 |
|--------|------|------------|
| `VITE_API_URL` | 后端API地址（带/api） | `http://49.232.227.144:5000/api` |
| `VITE_BASE_URL` | 后端基础地址（文件上传等） | `http://49.232.227.144:5000` |
| `VITE_FRONTEND_URL` | 前端地址（生成分享链接） | `http://49.232.227.144` |

---

## 🎯 下一步

1. **立即部署**
   ```powershell
   # 如果还没构建，先构建
   npm run build
   
   # 上传到服务器
   scp -r .\dist\* root@49.232.227.144:/var/www/html/my-app/
   ```

2. **配置后端**
   - 确保后端运行在5000端口
   - 配置CORS允许前端域名

3. **测试功能**
   - 访问 http://49.232.227.144
   - 测试分享链接生成
   - 测试API调用

4. **（可选）配置域名和HTTPS**
   - 绑定域名
   - 使用Let's Encrypt获取SSL证书

---

## 📞 需要帮助？

如果遇到问题，请提供以下信息：
- 错误信息截图
- 浏览器控制台日志
- Nginx错误日志：`sudo tail -f /var/log/nginx/error.log`
- 后端日志

祝部署顺利！🎉
