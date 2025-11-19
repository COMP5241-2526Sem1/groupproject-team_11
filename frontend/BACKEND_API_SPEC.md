# 后端 API 接口规范文档

## 📋 目录
1. [认证授权](#1-认证授权)
2. [课程管理](#2-课程管理)
3. [活动管理](#3-活动管理)
4. [问卷调查](#4-问卷调查)
5. [讨论区](#5-讨论区)
6. [文件管理](#6-文件管理)

---

## 1. 认证授权

### 1.1 用户登录
```http
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "string",
  "password": "string"
}

Response 200:
{
  "token": "string",          // JWT token
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "student" | "teacher" | "admin",
    "avatar": "string"
  }
}
```

### 1.2 获取当前用户信息
```http
GET /api/auth/me
Authorization: Bearer {token}

Response 200:
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "student" | "teacher" | "admin",
  "avatar": "string"
}
```

---

## 2. 课程管理

### 2.1 获取课程列表
```http
GET /api/courses
Authorization: Bearer {token}

Response 200:
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "instructor": "string",
    "color": "string",       // 课程颜色标识
    "enrolledCount": number,
    "icon": "string",
    "createdAt": number,     // timestamp
    "updatedAt": number
  }
]

文件位置: src/pages/Courses.tsx (Line 46-60)
```

### 2.2 创建课程
```http
POST /api/courses
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "title": "string",
  "description": "string",
  "color": "string",
  "icon": "string"
}

Response 201:
{
  "id": "string",
  "title": "string",
  "description": "string",
  "instructor": "string",
  "color": "string",
  "enrolledCount": 0,
  "icon": "string",
  "createdAt": number,
  "updatedAt": number
}

文件位置: src/pages/Courses.tsx (Line 58-60)
```

### 2.3 获取课程详情
```http
GET /api/courses/{courseId}
Authorization: Bearer {token}

Response 200:
{
  "id": "string",
  "title": "string",
  "description": "string",
  "instructor": "string",
  "color": "string",
  "enrolledCount": number,
  "icon": "string",
  "createdAt": number,
  "updatedAt": number
}

文件位置: src/pages/CourseDetail.tsx (Line 64-77)
```

### 2.4 获取课程内容列表
```http
GET /api/courses/{courseId}/items
Authorization: Bearer {token}

Response 200:
[
  {
    "id": "string",
    "type": "folder" | "file" | "link" | "assignment",
    "name": "string",
    "parentId": "string" | null,
    "description": "string",
    "dueDate": number | null,
    "fileSize": "string",
    "url": "string",
    "createdAt": number
  }
]

文件位置: src/pages/CourseDetail.tsx (Line 80-95)
```

### 2.5 创建/更新课程内容
```http
POST /api/courses/{courseId}/items
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "type": "folder" | "file" | "link" | "assignment",
  "name": "string",
  "parentId": "string" | null,
  "description": "string",
  "dueDate": number | null,
  "url": "string"
}

Response 201:
{
  "id": "string",
  "type": "string",
  "name": "string",
  "parentId": "string" | null,
  "createdAt": number
}

文件位置: src/pages/CourseDetail.tsx (Line 97-104)
```

### 2.6 下载文件
```http
GET /api/courses/{courseId}/files/{fileId}/download
Authorization: Bearer {token}

Response 200:
Binary file stream

文件位置: src/pages/CourseDetail.tsx (Line 504)
```

---

## 3. 活动管理

### 3.1 获取活动列表
```http
GET /api/activities
Authorization: Bearer {token}
Query Parameters:
  - type?: string  // 可选过滤类型

Response 200:
[
  {
    "id": "string",
    "title": "string",
    "type": "Classroom Quiz" | "Mind Map" | "PPT" | "Open Question" | "Scales Question",
    "activityType": "quiz" | "mind-map" | "ppt" | "open-question" | "scales-question",
    "edited": number,        // timestamp
    "thumbnail": "string",
    "questions": [...],      // 根据类型不同
    "markdownCode": "string", // Mind Map 专用
    "slides": [...],         // PPT 专用
    "text": "string",        // Open Question 专用
    "scalesData": {...}      // Scales Question 专用
  }
]

文件位置: src/pages/Activities.tsx (Line 30-37)
```

### 3.2 获取单个活动详情
```http
GET /api/activities/{activityId}
Authorization: Bearer {token}

Response 200:
{
  "id": "string",
  "title": "string",
  "type": "string",
  "activityType": "string",
  "edited": number,
  "thumbnail": "string",
  // ... 其他字段根据类型而定
}

文件位置:
- src/pages/Quiz.tsx (Line 62-79)
- src/pages/MindMap.tsx (Line 34-50)
- src/pages/PPTGenerator.tsx (Line 50-61)
- src/pages/OpenQuestion.tsx (Line 25-41)
- src/pages/ScalesQuestion.tsx (Line 47-63)
```

### 3.3 创建活动 (Quiz)
```http
POST /api/activities/quiz
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "title": "string",
  "type": "Classroom Quiz",
  "activityType": "quiz",
  "questions": [
    {
      "id": number,
      "text": "string",
      "type": "short-answer" | "multiple-choice" | "true-false",
      "options": ["string"],     // multiple-choice 专用
      "correctAnswer": string | number  // true-false 或 multiple-choice
    }
  ]
}

Response 201:
{
  "id": "string",
  "title": "string",
  "type": "Classroom Quiz",
  "activityType": "quiz",
  "edited": number,
  "thumbnail": "string",
  "questions": [...]
}

文件位置: src/pages/Quiz.tsx (Line 206-233)
```

### 3.4 更新活动 (Quiz)
```http
PUT /api/activities/quiz/{activityId}
Authorization: Bearer {token}
Content-Type: application/json

Request Body: (同创建)

Response 200:
{
  "id": "string",
  "title": "string",
  "type": "Classroom Quiz",
  "activityType": "quiz",
  "edited": number,
  "thumbnail": "string",
  "questions": [...]
}

文件位置: src/pages/Quiz.tsx (Line 206-233)
```

### 3.5 创建/更新 Mind Map
```http
POST /api/activities/mind-map
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "title": "string",
  "type": "Mind Map",
  "activityType": "mind-map",
  "markdownCode": "string"   // Markdown 格式的思维导图内容
}

Response 201:
{
  "id": "string",
  "title": "string",
  "type": "Mind Map",
  "activityType": "mind-map",
  "edited": number,
  "thumbnail": "string",
  "markdownCode": "string"
}

PUT /api/activities/mind-map/{activityId}
(同上)

文件位置: src/pages/MindMap.tsx (Line 188-221)
```

### 3.6 创建/更新 PPT
```http
POST /api/activities/ppt
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "title": "string",
  "type": "PPT",
  "activityType": "ppt",
  "slides": [
    {
      "id": number,
      "content": "string"
    }
  ]
}

Response 201:
{
  "id": "string",
  "title": "string",
  "type": "PPT",
  "activityType": "ppt",
  "edited": number,
  "thumbnail": "string",
  "slides": [...]
}

文件位置: src/pages/PPTGenerator.tsx (Line 194-220)
```

### 3.7 创建/更新 Open Question
```http
POST /api/activities/open-question
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "title": "string",
  "type": "Open Question",
  "activityType": "open-question",
  "text": "string"           // 问题文本
}

Response 201:
{
  "id": "string",
  "title": "string",
  "type": "Open Question",
  "activityType": "open-question",
  "edited": number,
  "thumbnail": "string",
  "text": "string"
}

文件位置: src/pages/OpenQuestion.tsx (Line 105-135)
```

### 3.8 创建/更新 Scales Question
```http
POST /api/activities/scales-question
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "title": "string",
  "type": "Scales Question",
  "activityType": "scales-question",
  "minLabel": "string",
  "maxLabel": "string",
  "scaleLabels": [
    {
      "id": number,
      "label": "string"
    }
  ]
}

Response 201:
{
  "id": "string",
  "title": "string",
  "type": "Scales Question",
  "activityType": "scales-question",
  "edited": number,
  "thumbnail": "string",
  "minLabel": "string",
  "maxLabel": "string",
  "scaleLabels": [...]
}

文件位置: src/pages/ScalesQuestion.tsx (Line 166-199)
```

### 3.9 删除活动
```http
DELETE /api/activities/{activityId}
Authorization: Bearer {token}

Response 204: No Content

文件位置: src/pages/Activities.tsx (Line 111-115)
```

---

## 4. 问卷调查

### 4.1 获取问卷列表
```http
GET /api/polls
Authorization: Bearer {token}
Query Parameters:
  - status?: "draft" | "open" | "closed"

Response 200:
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "questions": [...],
    "createdBy": "string",
    "createdAt": number,
    "openTime": number,
    "closeTime": number | null,
    "status": "draft" | "open" | "closed",
    "shareLink": "string",
    "allowAnonymous": boolean,
    "responses": [...],
    "responseCount": number
  }
]

文件位置: src/pages/OpinionPoll.tsx (Line 88-99)
```

### 4.2 创建/更新问卷
```http
POST /api/polls
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "title": "string",
  "description": "string",
  "questions": [
    {
      "id": "string",
      "question": "string",
      "type": "single" | "multiple" | "text" | "scale",
      "options": ["string"],      // single/multiple 专用
      "required": boolean
    }
  ],
  "openTime": number,
  "closeTime": number | null,
  "status": "draft" | "open",
  "allowAnonymous": boolean
}

Response 201:
{
  "id": "string",
  "title": "string",
  "description": "string",
  "questions": [...],
  "createdBy": "string",
  "createdAt": number,
  "openTime": number,
  "closeTime": number | null,
  "status": "draft" | "open",
  "shareLink": "string",
  "allowAnonymous": boolean,
  "responses": [],
  "responseCount": 0
}

PUT /api/polls/{pollId}
(同上)

文件位置: src/pages/OpinionPoll.tsx (Line 103-106)
```

### 4.3 获取单个问卷（用于答题）
```http
GET /api/polls/{pollId}/public
# 无需认证，通过分享链接访问

Response 200:
{
  "id": "string",
  "title": "string",
  "description": "string",
  "questions": [
    {
      "id": "string",
      "question": "string",
      "type": "single" | "multiple" | "text" | "scale",
      "options": ["string"],
      "required": boolean
    }
  ],
  "status": "draft" | "open" | "closed",
  "openTime": number,
  "closeTime": number | null,
  "allowAnonymous": boolean
}

文件位置: src/pages/TakePoll.tsx (Line 45-82)
```

### 4.4 提交问卷回答
```http
POST /api/polls/{pollId}/responses
Content-Type: application/json

Request Body:
{
  "respondentName": "string",   // 非匿名必填
  "isAnonymous": boolean,
  "answers": [
    {
      "questionId": "string",
      "answer": string | string[]  // 根据题型：单选/文本为 string，多选为 string[]
    }
  ]
}

Response 201:
{
  "id": "string",
  "respondentId": "string",
  "respondentName": "string",
  "answers": [...],
  "submittedAt": number,
  "isAnonymous": boolean
}

文件位置: src/pages/TakePoll.tsx (Line 113-143)
```

### 4.5 更新问卷状态
```http
PATCH /api/polls/{pollId}/status
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "status": "open" | "closed"
}

Response 200:
{
  "id": "string",
  "status": "open" | "closed",
  "updatedAt": number
}

文件位置: src/pages/OpinionPoll.tsx (Line 502-515) - Pause/Resume
```

---

## 5. 讨论区

### 5.1 获取讨论列表
```http
GET /api/discussions
Authorization: Bearer {token}
Query Parameters:
  - courseId?: string   // 可选，筛选特定课程

Response 200:
[
  {
    "id": "string",
    "title": "string",
    "content": "string",
    "author": {
      "id": "string",
      "name": "string",
      "avatar": "string",
      "role": "student" | "teacher" | "admin"
    },
    "replies": number,
    "views": number,
    "likes": number,
    "isPinned": boolean,
    "createdAt": number,
    "updatedAt": number
  }
]

文件位置: src/pages/Discussion.tsx (Line 79-98)
```

### 5.2 创建讨论
```http
POST /api/discussions
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "title": "string",
  "content": "string",
  "courseId": "string"    // 可选
}

Response 201:
{
  "id": "string",
  "title": "string",
  "content": "string",
  "author": {...},
  "replies": 0,
  "views": 0,
  "likes": 0,
  "isPinned": false,
  "createdAt": number,
  "updatedAt": number
}

文件位置: src/pages/Discussion.tsx (Line 101-106)
```

### 5.3 更新讨论
```http
PUT /api/discussions/{discussionId}
Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "title": "string",
  "content": "string"
}

Response 200:
{
  "id": "string",
  "title": "string",
  "content": "string",
  "updatedAt": number
}

文件位置: src/pages/Discussion.tsx (Line 101-106)
```

### 5.4 删除讨论
```http
DELETE /api/discussions/{discussionId}
Authorization: Bearer {token}

Response 204: No Content

文件位置: src/pages/Discussion.tsx (Line 101-106)
```

---

## 6. 文件管理

### 6.1 上传文件
```http
POST /api/files/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Request Body:
{
  "file": File,
  "courseId": "string",    // 可选
  "parentId": "string"     // 可选，文件夹ID
}

Response 201:
{
  "id": "string",
  "name": "string",
  "size": number,
  "url": "string",
  "createdAt": number
}

文件位置: src/pages/CourseDetail.tsx (需添加上传功能)
```

---

## 🔐 认证说明

所有需要 `Authorization: Bearer {token}` 的接口都需要在请求头中携带 JWT token。

Token 格式：
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token 应包含以下信息：
```json
{
  "userId": "string",
  "email": "string",
  "role": "student" | "teacher" | "admin",
  "iat": number,
  "exp": number
}
```

---

## 📝 错误响应格式

所有接口的错误响应统一格式：

```json
{
  "error": {
    "code": "string",        // 错误代码
    "message": "string",     // 错误信息
    "details": {...}         // 可选，详细信息
  }
}
```

常见错误码：
- `400` - Bad Request (请求参数错误)
- `401` - Unauthorized (未认证)
- `403` - Forbidden (无权限)
- `404` - Not Found (资源不存在)
- `500` - Internal Server Error (服务器错误)

---

## 📍 前端代码位置汇总

### 课程相关
- **Courses.tsx** (Line 46-60): 课程列表加载/保存
- **CourseDetail.tsx** (Line 64-104): 课程详情、内容列表
- **CourseDetail.tsx** (Line 504): 文件下载

### 活动相关
- **Activities.tsx** (Line 30-37, 111-115): 活动列表、删除
- **Quiz.tsx** (Line 62-79, 206-233): Quiz 加载/保存
- **MindMap.tsx** (Line 34-50, 188-221): Mind Map 加载/保存
- **PPTGenerator.tsx** (Line 50-61, 194-220): PPT 加载/保存
- **OpenQuestion.tsx** (Line 25-41, 105-135): 开放问题加载/保存
- **ScalesQuestion.tsx** (Line 47-63, 166-199): 量表问题加载/保存

### 问卷相关
- **OpinionPoll.tsx** (Line 88-99, 103-106): 问卷列表、创建/更新
- **OpinionPoll.tsx** (Line 502-515): 状态更新（暂停/恢复）
- **TakePoll.tsx** (Line 45-82, 113-143): 获取问卷、提交回答

### 讨论相关
- **Discussion.tsx** (Line 79-106): 讨论列表、创建/更新/删除

---

## 💡 实现建议

1. **使用 axios 或 fetch** 创建统一的 API 客户端
2. **创建 API 服务层** (如 `src/services/api.ts`)
3. **使用环境变量** 配置 API base URL
4. **实现请求/响应拦截器** 统一处理 token 和错误
5. **添加加载状态** 提升用户体验
6. **实现错误处理** 显示友好的错误提示

示例代码结构：
```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
});

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 统一错误处理
    return Promise.reject(error);
  }
);

export default api;
```
