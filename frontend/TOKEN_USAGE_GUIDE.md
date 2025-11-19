# Token 验证权限使用指南

## 📋 概述

前端已实现统一的 Token 管理系统，所有 API 请求都会自动在请求头中带上 `Authorization: Bearer <token>`。

---

## 🔑 Token 管理 API

### 1. 导入 Token 管理函数

```typescript
import { getToken, setToken, clearToken, hasToken } from "@/services/api";
```

### 2. Token 管理函数

#### `getToken(): string | null`
获取当前存储的 Token
```typescript
const token = getToken();
if (token) {
  console.log("Token exists:", token);
}
```

#### `setToken(token: string): void`
设置/更新 Token（通常在登录成功后调用）
```typescript
// 登录成功后
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password })
});

const data = await response.json();
if (data.success && data.token) {
  setToken(data.token);
}
```

#### `clearToken(): void`
清除 Token（通常在登出时调用）
```typescript
// 用户登出
clearToken();
window.location.href = "/login";
```

#### `hasToken(): boolean`
检查是否有 Token
```typescript
if (!hasToken()) {
  // 跳转到登录页
  window.location.href = "/login";
}
```

---

## 🌐 在页面中使用 Token

### 方法一：使用 `api.ts` 提供的函数（推荐）

```typescript
import { API_BASE_URL, getToken } from "@/services/api";

const token = getToken();
const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};

// GET 请求
const response = await fetch(`${API_BASE_URL}/courses`, {
  headers: authHeaders
});

// POST 请求
const response = await fetch(`${API_BASE_URL}/courses/create`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...authHeaders
  },
  body: JSON.stringify(courseData)
});

// PUT 请求
const response = await fetch(`${API_BASE_URL}/courses/update/${id}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    ...authHeaders
  },
  body: JSON.stringify(updateData)
});

// DELETE 请求
const response = await fetch(`${API_BASE_URL}/courses/delete/${id}`, {
  method: "DELETE",
  headers: authHeaders
});
```

### 方法二：使用 `api.ts` 中的 `apiCall` 函数（封装版）

如果需要，可以直接使用 `api.ts` 中封装好的函数：

```typescript
import api from "@/services/api";

// 获取课程列表
const courses = await api.getCourses();

// 创建课程
const newCourse = await api.createCourse({
  code: "COMP5421",
  title: "Software Engineering",
  status: "Open",
  schedule: "Mon 9:00",
  students: "150"
});

// 更新课程
const updated = await api.updateCourse("course_id", {
  title: "Updated Title"
});

// 删除课程
const success = await api.deleteCourse("course_id");
```

**注意：** `api.ts` 中的所有函数都会**自动添加 Token**到请求头，无需手动处理。

---

## 📝 实际使用示例

### 示例 1: Homepage.tsx（已实现）

```typescript
import { getToken } from "@/services/api";

useEffect(() => {
  const loadDashboardData = async () => {
    try {
      const token = getToken();
      const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};
      
      // 所有请求都带上 Token
      const coursesResponse = await fetch("http://localhost:3000/api/courses", {
        headers: authHeaders
      });
      
      const quizzesResponse = await fetch("http://localhost:3000/api/classroom_quiz", {
        headers: authHeaders
      });
      
      // ... 其他请求
    } catch (error) {
      console.error("Error:", error);
    }
  };
  
  loadDashboardData();
}, []);
```

### 示例 2: 登录页面

```typescript
import { setToken } from "@/services/api";

const handleLogin = async (username: string, password: string) => {
  try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
      // 保存 Token
      setToken(data.token);
      
      // 跳转到首页
      navigate("/");
    } else {
      alert("Login failed: " + (data.message || "Invalid credentials"));
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed. Please try again.");
  }
};
```

### 示例 3: 登出功能

```typescript
import { clearToken } from "@/services/api";

const handleLogout = async () => {
  try {
    // 可选：调用后端登出接口
    await fetch("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getToken()}`
      }
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // 清除本地 Token
    clearToken();
    
    // 跳转到登录页
    window.location.href = "/login";
  }
};
```

### 示例 4: 路由守卫（保护需要登录的页面）

```typescript
import { hasToken } from "@/services/api";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!hasToken()) {
      // 没有 Token，跳转到登录页
      navigate("/login");
    }
  }, [navigate]);
  
  return (
    <div>
      {/* 页面内容 */}
    </div>
  );
};
```

---

## ⚙️ Token 配置

### Token 存储位置
- Token 存储在 `localStorage` 中
- 存储 key: `auth_token`
- 自动持久化，刷新页面不会丢失

### Token 格式
- 标准 JWT Bearer Token 格式
- 请求头格式: `Authorization: Bearer <token>`

### Token 过期处理
`api.ts` 中的 `apiCall` 函数会自动处理 401 错误：

```typescript
if (response.status === 401) {
  clearToken();
  console.error("Unauthorized: Token may be invalid or expired");
  throw new Error("Authentication required. Please log in again.");
}
```

---

## 🔒 安全建议

1. **不要在代码中硬编码 Token**
   ```typescript
   // ❌ 错误
   const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
   
   // ✅ 正确
   const token = getToken();
   ```

2. **Token 过期后自动清除**
   - 后端返回 401 时，前端会自动清除 Token
   - 用户需要重新登录

3. **敏感操作需要验证**
   ```typescript
   if (!hasToken()) {
     alert("Please login first");
     navigate("/login");
     return;
   }
   ```

4. **HTTPS 传输**
   - 生产环境务必使用 HTTPS
   - 防止 Token 在传输过程中被窃取

---

## 📦 完整流程示例

### 用户登录到操作的完整流程

```typescript
// 1. 用户登录
const loginResponse = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password })
});

const loginData = await loginResponse.json();
if (loginData.success) {
  setToken(loginData.token);  // 保存 Token
}

// 2. 访问受保护的资源（Token 自动添加）
const token = getToken();
const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};

const coursesResponse = await fetch("/api/courses", {
  headers: authHeaders
});

// 3. 创建数据（Token 自动添加）
const createResponse = await fetch("/api/courses/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...authHeaders
  },
  body: JSON.stringify(newCourse)
});

// 4. 用户登出
clearToken();  // 清除 Token
navigate("/login");
```

---

## 🎯 已实现 Token 的页面

- ✅ **Homepage.tsx** - 仪表盘页面
  - GET /api/courses
  - GET /api/classroom_quiz
  - GET /api/classroom_quiz/{id}/responses
  - GET /api/activity-logs

---

## 📌 待实现 Token 的页面

以下页面需要按照相同的方式添加 Token：

- 📝 **Courses.tsx** - 课程管理
- 📝 **Activities.tsx** - 活动管理
- 📝 **Quiz.tsx** - 问卷管理
- 📝 **RandomRollCall.tsx** - 随机点名
- 📝 **RandomSort.tsx** - 随机排序
- 📝 **OpinionPoll.tsx** - 意见投票
- 📝 **OpenQuestion.tsx** - 开放问题
- 📝 **ScalesQuestion.tsx** - 量表问题
- 📝 **MobileResponse.tsx** - 移动端响应

---

## 🚀 快速开始

### 1. 在任意页面导入

```typescript
import { getToken } from "@/services/api";
```

### 2. 在请求中使用

```typescript
const token = getToken();
const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};

const response = await fetch("YOUR_API_URL", {
  headers: authHeaders
});
```

### 3. 完成！

所有请求都会自动带上 Token 进行身份验证。

---

## ❓ 常见问题

### Q: 为什么需要 Token？
A: Token 用于验证用户身份，确保只有授权用户才能访问受保护的资源。

### Q: Token 存储在哪里？
A: 存储在浏览器的 `localStorage` 中，key 为 `auth_token`。

### Q: Token 会过期吗？
A: 会的。后端可以设置 Token 过期时间，过期后需要重新登录。

### Q: 如何处理 Token 过期？
A: 当收到 401 错误时，`api.ts` 会自动清除 Token 并提示用户重新登录。

### Q: 可以手动清除 Token 吗？
A: 可以，使用 `clearToken()` 函数。

---

## 📚 相关文档

- [API 服务层文档](./src/services/api.ts)
- [后端 API 规范](./BACKEND_API_SPEC.md)

---

**最后更新:** 2025-01-18
