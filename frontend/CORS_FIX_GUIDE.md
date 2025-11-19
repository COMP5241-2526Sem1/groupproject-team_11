# CORS 问题修复指南

## 问题描述
前端在访问后端 API (`http://localhost:3000/api/classroom_quiz`) 时遇到 CORS 错误：
```
Access to fetch at 'http://localhost:3000/api/classroom_quiz' from origin 'http://localhost:8080' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check
```

后端返回 `415 Unsupported Media Type` 错误。

## 问题原因
1. **CORS 配置缺失或不正确** - 后端未正确处理跨域请求
2. **OPTIONS 预检请求未处理** - 后端未正确响应 OPTIONS 请求
3. **Content-Type 不支持** - 后端未配置 JSON 解析中间件

## 解决方案

### 方案 1: Flask 后端 (Python)

如果你的后端使用 Flask，需要安装并配置 `flask-cors`：

```bash
pip install flask-cors
```

在你的 Flask 应用中添加 CORS 配置：

```python
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# 配置 CORS - 允许来自前端的请求
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:8080", "http://127.0.0.1:8080"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# 确保解析 JSON 请求体
@app.route('/api/classroom_quiz', methods=['POST', 'OPTIONS'])
def classroom_quiz():
    # OPTIONS 请求（预检）直接返回 200
    if request.method == 'OPTIONS':
        return '', 200
    
    # POST 请求处理
    try:
        data = request.get_json()  # 解析 JSON 数据
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # 处理你的业务逻辑
        # ...
        
        return jsonify({"success": True, "id": "generated_id"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)
```

### 方案 2: Express (Node.js)

如果你的后端使用 Express，需要安装并配置 `cors`：

```bash
npm install cors
```

在你的 Express 应用中添加 CORS 配置：

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// 配置 CORS
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 解析 JSON 请求体
app.use(express.json());

// 处理 OPTIONS 预检请求
app.options('*', cors());

// API 路由
app.post('/api/classroom_quiz', (req, res) => {
  try {
    const data = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }
    
    // 处理你的业务逻辑
    // ...
    
    res.json({ success: true, id: 'generated_id' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### 方案 3: 手动设置响应头（任何后端框架）

如果不想使用 CORS 库，可以手动设置响应头：

```python
# Flask 示例
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:8080')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@app.route('/api/classroom_quiz', methods=['POST', 'OPTIONS'])
def classroom_quiz():
    if request.method == 'OPTIONS':
        return '', 200
    
    # POST 请求处理...
```

## 验证修复

1. **重启后端服务器**
2. **清除浏览器缓存**（Ctrl+Shift+Delete）
3. **打开浏览器开发者工具**（F12）
4. **查看 Network 标签**
5. **尝试保存 Quiz**
6. **检查请求和响应头**：
   - 请求应包含：`Content-Type: application/json`
   - 响应应包含：
     - `Access-Control-Allow-Origin: http://localhost:8080`
     - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
     - `Access-Control-Allow-Headers: Content-Type, Authorization`

## 前端已添加的调试日志

前端代码已添加详细的日志输出，打开浏览器控制台可以看到：
- 请求的完整 URL
- 请求数据
- 响应状态码
- 响应头信息
- 错误详情

这些信息可以帮助你诊断问题。

## 常见问题

### Q1: 为什么会出现 415 错误？
A: 后端没有正确解析 JSON 格式的请求体。需要添加 JSON 解析中间件：
- Flask: 确保使用 `request.get_json()`
- Express: 添加 `app.use(express.json())`

### Q2: 为什么需要处理 OPTIONS 请求？
A: 浏览器在发送跨域 POST 请求前，会先发送一个 OPTIONS 预检请求。后端必须正确响应这个请求，返回 200 状态码和正确的 CORS 头。

### Q3: 生产环境如何配置？
A: 生产环境不应该使用 `*` 允许所有来源，而应该明确指定允许的域名：
```python
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://your-production-domain.com"],
        # ...
    }
})
```

## 需要帮助？

如果问题仍然存在，请：
1. 检查后端日志，查看是否有错误信息
2. 在浏览器控制台查看前端的调试日志
3. 确认后端是否正确运行在 `http://localhost:3000`
4. 确认后端路由是否为 `/api/classroom_quiz`（不是 `/classroom_quiz`）
