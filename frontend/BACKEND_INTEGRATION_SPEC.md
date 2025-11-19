# 后端集成完整规范文档

**文档版本:** 1.0  
**创建日期:** 2025-01-16  
**项目名称:** 互动教学平台 (Interactive Teaching Platform)

---

## 📋 目录

1. [概述](#概述)
2. [数据模型定义](#数据模型定义)
3. [API端点规范](#api端点规范)
4. [认证与授权](#认证与授权)
5. [迁移检查清单](#迁移检查清单)
6. [测试建议](#测试建议)
7. [错误处理规范](#错误处理规范)

---

## 概述

### 工作量统计

| 项目 | 数量 |
|------|------|
| 需要修改的文件 | 15+ 个 |
| localStorage 操作点 | 100+ 处 |
| 需要实现的 API 端点 | ~35 个 |
| 数据模型 | 10+ 个 |

### 存储键映射

| localStorage Key | 用途 | 对应 API |
|------------------|------|----------|
| `activities` | 所有活动数据 | `/api/activities` |
| `activityLog` | 活动日志 | `/api/activity-logs` |
| `courses` | 课程列表 | `/api/courses` |
| `course_{id}_items` | 课程内容 | `/api/courses/{id}/items` |
| `responses_{activityId}` | 学生回答 | `/api/activities/{id}/responses` |
| `opinion_polls` | 意见问卷 | `/api/polls` |
| `discussions` | 讨论区数据 | `/api/discussions` |

---

## 数据模型定义

### 1. Activity (活动)

```typescript
interface Activity {
  id: string;                    // 活动ID,格式: "activity_timestamp"
  title: string;                 // 活动标题
  activityType: ActivityType;    // 活动类型
  edited: number;                // 最后编辑时间戳
  questions?: Question[];        // 问题列表 (Quiz类型)
  slides?: Slide[];             // 幻灯片列表 (OpenQuestion/Scales类型)
  timerMinutes?: number;        // 计时器-分钟
  timerSeconds?: number;        // 计时器-秒
  code?: string;                // Markdown代码 (MindMap类型)
}

type ActivityType = 
  | "quiz" 
  | "open-question" 
  | "scales-question" 
  | "mind-map" 
  | "ppt-generator";

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;        // 正确答案索引
  points: number;               // 题目分值
}

interface Slide {
  id: number;
  text: string;
  scaleOptions?: ScaleOption[]; // Scales类型专用
}

interface ScaleOption {
  label: string;                // 选项文字
  value: number;                // 选项值
}
```

### 2. Course (课程)

```typescript
interface Course {
  id: string;                    // 课程ID
  code: string;                  // 课程代码,如 "COMP1001"
  title: string;                 // 课程名称
  status: CourseStatus;          // 课程状态
  schedule: string;              // 课程时间 (遗留字段)
  students: string;              // 学生数量
  year?: string;                 // 开课年份,如 "2025"
  semester?: string;             // 学期: "Sem1" | "Sem2" | "Summer Term" | "Winter Term"
  weekday?: string;              // 星期几: "Monday" ~ "Sunday"
  classTime?: string;            // 上课时间,如 "18:00-21:00"
  capacity?: string;             // 课程容量
}

type CourseStatus = "Open" | "Closed" | "Coming Soon";
```

### 3. ContentItem (课程内容项)

```typescript
interface ContentItem {
  id: string;                    // 内容ID
  title: string;                 // 标题
  content: string;               // 文本内容
  file: string;                  // 文件名
  date: string;                  // 创建日期,格式: "MM/DD/YYYY"
}

// 课程内容分三类存储
interface CourseItems {
  content: ContentItem[];        // 课程内容
  assignment: ContentItem[];     // 作业
  quiz: ContentItem[];          // 测验
}
```

### 4. Response (学生回答)

```typescript
interface Response {
  id: string;                    // 回答ID
  activityId: string;           // 关联的活动ID
  studentName: string;          // 学生姓名
  timestamp: number;            // 提交时间戳
  
  // Quiz类型回答
  answers?: number[];           // 选择的答案索引数组
  score?: number;               // 得分
  totalPoints?: number;         // 总分
  
  // OpenQuestion类型回答
  answer?: string;              // 文本回答
  
  // ScalesQuestion类型回答
  scaleAnswers?: {              // 量表回答
    [slideId: number]: number;  // slideId -> 选择的值
  };
  
  // AI评分 (OpenQuestion)
  aiGrade?: {
    score: number;              // AI评分
    feedback: string;           // AI反馈
    gradedAt: number;           // 评分时间
  };
}
```

### 5. ActivityLog (活动日志)

```typescript
interface ActivityLog {
  type: LogType;                // 日志类型
  title: string;                // 日志标题
  description: string;          // 日志描述
  timestamp: number;            // 时间戳
  activityId: string;           // 关联活动ID
}

type LogType = "created" | "shared" | "edited";
```

### 6. OpinionPoll (意见问卷)

```typescript
interface OpinionPoll {
  id: string;                   // 问卷ID
  title: string;                // 问卷标题
  description: string;          // 问卷描述
  questions: PollQuestion[];    // 问题列表
  allowAnonymous: boolean;      // 是否允许匿名
  responses?: PollResponse[];   // 回答列表
  createdAt: number;            // 创建时间
}

interface PollQuestion {
  id: string;
  text: string;
  type: "single-choice" | "multiple-choice" | "text";
  options?: string[];           // 选项 (选择题)
  required: boolean;
}

interface PollResponse {
  id: string;
  pollId: string;
  respondentName: string;
  isAnonymous: boolean;
  answers: {
    [questionId: string]: string | string[]; // 问题ID -> 答案
  };
  submittedAt: number;
}
```

### 7. Discussion (讨论区)

```typescript
interface DiscussionData {
  publicDiscussions: DiscussionPost[];
  questions: DiscussionPost[];
}

interface DiscussionPost {
  id: string;
  authorId: string;
  authorName: string;
  userRole: UserRole;
  isAnonymous: boolean;
  type: "public" | "question";
  title: string;
  content: string;
  likes: number;
  likedBy: string[];            // 点赞用户ID列表
  replies: Reply[];
  timestamp: number;
}

type UserRole = "teacher" | "student" | "ta";

interface Reply {
  id: string;
  authorId: string;
  authorName: string;
  userRole: UserRole;
  content: string;
  likes: number;
  likedBy: string[];
  timestamp: number;
}
```

---

## API端点规范

### 🎯 Activities API (活动管理)

#### 1. 获取活动列表

**端点:** `GET /api/activities`

**请求参数:**
```typescript
{
  page?: number;        // 页码,默认1
  limit?: number;       // 每页数量,默认20
  type?: string;        // 活动类型筛选
  search?: string;      // 搜索关键词
}
```

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": "activity_1705392000000",
      "title": "Week 1 Quiz",
      "activityType": "quiz",
      "edited": 1705392000000,
      "questions": [
        {
          "id": 1,
          "text": "What is 2+2?",
          "options": ["3", "4", "5"],
          "correctAnswer": 1,
          "points": 10
        }
      ],
      "timerMinutes": 5,
      "timerSeconds": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

**前端代码位置:**
- `Activities.tsx` 第 37 行
- `Homepage.tsx` 第 28 行

---

#### 2. 获取单个活动

**端点:** `GET /api/activities/{id}`

**URL参数:**
- `id`: 活动ID (如: "activity_1705392000000")

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "activity_1705392000000",
    "title": "Week 1 Quiz",
    "activityType": "quiz",
    "edited": 1705392000000,
    "questions": [...],
    "timerMinutes": 5,
    "timerSeconds": 0
  }
}
```

**前端代码位置:**
- `Quiz.tsx` 第 88 行
- `OpenQuestion.tsx` 第 42 行
- `ScalesQuestion.tsx` 第 64 行
- `MindMap.tsx` 第 43 行
- `PPTGenerator.tsx` 第 57 行

---

#### 3. 创建活动

**端点:** `POST /api/activities`

**请求体:**
```json
{
  "title": "New Quiz",
  "activityType": "quiz",
  "questions": [
    {
      "id": 1,
      "text": "What is React?",
      "options": ["Library", "Framework", "Language"],
      "correctAnswer": 0,
      "points": 10
    }
  ],
  "timerMinutes": 10,
  "timerSeconds": 0
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "activity_1705392000000",
    "title": "New Quiz",
    "activityType": "quiz",
    "edited": 1705392000000,
    "questions": [...],
    "timerMinutes": 10,
    "timerSeconds": 0
  }
}
```

**前端代码位置:**
- `Quiz.tsx` 第 329 行 (新建分支)
- `OpenQuestion.tsx` 第 143 行
- `ScalesQuestion.tsx` 第 208 行
- `MindMap.tsx` 第 195 行
- `PPTGenerator.tsx` 第 194 行

---

#### 4. 更新活动

**端点:** `PUT /api/activities/{id}`

**URL参数:**
- `id`: 活动ID

**请求体:**
```json
{
  "title": "Updated Quiz",
  "questions": [...],
  "timerMinutes": 15
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "activity_1705392000000",
    "title": "Updated Quiz",
    "activityType": "quiz",
    "edited": 1705392100000,
    ...
  }
}
```

**前端代码位置:**
- `Quiz.tsx` 第 329 行 (编辑分支)
- `OpenQuestion.tsx` 第 143 行
- `ScalesQuestion.tsx` 第 208 行

---

#### 5. 删除活动

**端点:** `DELETE /api/activities/{id}`

**URL参数:**
- `id`: 活动ID

**响应:**
```json
{
  "success": true,
  "message": "Activity deleted successfully"
}
```

**前端代码位置:**
- `Activities.tsx` 第 114 行

---

### 📚 Courses API (课程管理)

#### 1. 获取课程列表

**端点:** `GET /api/courses`

**请求参数:**
```typescript
{
  search?: string;      // 搜索关键词
  status?: string;      // 状态筛选: "Open" | "Closed" | "Coming Soon"
  semester?: string;    // 学期筛选,如 "2025 Sem1"
  year?: string;        // 年份筛选
}
```

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": "course_1",
      "code": "COMP1001",
      "title": "Introduction to Programming",
      "status": "Open",
      "schedule": "Mon 18:00-21:00",
      "students": "45",
      "year": "2025",
      "semester": "Sem1",
      "weekday": "Monday",
      "classTime": "18:00-21:00",
      "capacity": "50"
    }
  ]
}
```

**前端代码位置:**
- `Courses.tsx` 第 61 行
- `Homepage.tsx` 第 16 行

---

#### 2. 获取单个课程

**端点:** `GET /api/courses/{id}`

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "course_1",
    "code": "COMP1001",
    "title": "Introduction to Programming",
    ...
  }
}
```

**前端代码位置:**
- `CourseDetail.tsx` 第 70 行

---

#### 3. 创建课程

**端点:** `POST /api/courses`

**请求体:**
```json
{
  "code": "COMP2001",
  "title": "Data Structures",
  "status": "Open",
  "students": "0",
  "year": "2025",
  "semester": "Sem2",
  "weekday": "Wednesday",
  "classTime": "14:00-17:00",
  "capacity": "60"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "course_1705392000000",
    "code": "COMP2001",
    ...
  }
}
```

**前端代码位置:**
- `Courses.tsx` 第 73 行

---

#### 4. 更新课程

**端点:** `PUT /api/courses/{id}`

**请求体:** 同创建课程

**前端代码位置:**
- `Courses.tsx` 第 90 行

---

#### 5. 删除课程

**端点:** `DELETE /api/courses/{id}`

**前端代码位置:**
- `Courses.tsx` 第 147 行

---

### 📝 Course Items API (课程内容)

#### 1. 获取课程所有内容

**端点:** `GET /api/courses/{courseId}/items`

**响应:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "item_1",
        "title": "Lecture 1 Slides",
        "content": "Introduction to the course",
        "file": "lecture1.pdf",
        "date": "01/15/2025"
      }
    ],
    "assignment": [],
    "quiz": []
  }
}
```

**前端代码位置:**
- `CourseDetail.tsx` 第 89 行

---

#### 2. 添加课程内容

**端点:** `POST /api/courses/{courseId}/items`

**请求体:**
```json
{
  "type": "content",  // "content" | "assignment" | "quiz"
  "title": "Lecture 2 Slides",
  "content": "Data types and variables",
  "file": "lecture2.pdf"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "item_1705392000000",
    "title": "Lecture 2 Slides",
    "content": "Data types and variables",
    "file": "lecture2.pdf",
    "date": "01/16/2025"
  }
}
```

**前端代码位置:**
- `CourseDetail.tsx` 第 106 行

---

#### 3. 删除课程内容

**端点:** `DELETE /api/courses/{courseId}/items/{itemId}`

**URL参数:**
- `courseId`: 课程ID
- `itemId`: 内容项ID

**前端代码位置:**
- `CourseDetail.tsx` 第 158 行

---

#### 4. 下载课程文件

**端点:** `GET /api/courses/{courseId}/files/{itemId}/download`

**响应:** 文件流 (application/octet-stream)

**前端代码位置:**
- `CourseDetail.tsx` 第 589 行

**实现示例:**
```typescript
const handleDownload = async (courseId: string, itemId: string, fileName: string) => {
  try {
    const response = await fetch(`/api/courses/${courseId}/files/${itemId}/download`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
  }
};
```

---

### 📊 Responses API (学生回答)

#### 1. 获取活动的所有回答

**端点:** `GET /api/activities/{activityId}/responses`

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": "response_1",
      "activityId": "activity_1705392000000",
      "studentName": "张三",
      "timestamp": 1705392100000,
      "answers": [1, 0, 2],
      "score": 25,
      "totalPoints": 30
    }
  ]
}
```

**前端代码位置:**
- `Homepage.tsx` 第 35, 57 行
- `ResultViewer.tsx` 第 30 行

---

#### 2. 提交回答

**端点:** `POST /api/activities/{activityId}/responses`

**请求体 (Quiz):**
```json
{
  "studentName": "张三",
  "answers": [1, 0, 2],
  "score": 25,
  "totalPoints": 30
}
```

**请求体 (OpenQuestion):**
```json
{
  "studentName": "李四",
  "answer": "我认为React是一个强大的前端库..."
}
```

**请求体 (ScalesQuestion):**
```json
{
  "studentName": "王五",
  "scaleAnswers": {
    "1": 4,
    "2": 5,
    "3": 3
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "response_1705392100000",
    "activityId": "activity_1705392000000",
    "studentName": "张三",
    "timestamp": 1705392100000,
    ...
  }
}
```

**前端代码位置:**
- `MobileResponse.tsx` 第 100 行

---

#### 3. AI评分 (OpenQuestion)

**端点:** `POST /api/responses/{responseId}/ai-grade`

**请求体:**
```json
{
  "question": "请解释React的核心概念",
  "answer": "React是一个JavaScript库...",
  "rubric": "评分标准: 1. 概念准确性 2. 深度 3. 示例"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "score": 85,
    "feedback": "回答很好地解释了React的核心概念,包括组件化和虚拟DOM...",
    "gradedAt": 1705392200000
  }
}
```

**前端代码位置:**
- `ResultViewer.tsx` (AI评分功能)

---

### 📋 Activity Logs API (活动日志)

#### 1. 获取活动日志

**端点:** `GET /api/activity-logs`

**请求参数:**
```typescript
{
  limit?: number;       // 返回数量,默认10
  since?: number;       // 起始时间戳
}
```

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "type": "created",
      "title": "Created: Week 1 Quiz",
      "description": "Quiz added to COMP1001",
      "timestamp": 1705392000000,
      "activityId": "activity_1705392000000"
    },
    {
      "type": "shared",
      "title": "Shared: Week 1 Quiz",
      "description": "Shared with students",
      "timestamp": 1705392100000,
      "activityId": "activity_1705392000000"
    },
    {
      "type": "edited",
      "title": "Deleted: Assignment 1",
      "description": "Assignment removed from COMP1001",
      "timestamp": 1705392200000,
      "activityId": "item_123"
    }
  ]
}
```

**前端代码位置:**
- `Homepage.tsx` 第 99 行

---

#### 2. 创建活动日志

**端点:** `POST /api/activity-logs`

**请求体:**
```json
{
  "type": "created",
  "title": "Created: New Quiz",
  "description": "Quiz added to COMP2001",
  "activityId": "activity_1705392000000"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "type": "created",
    "title": "Created: New Quiz",
    "description": "Quiz added to COMP2001",
    "timestamp": 1705392000000,
    "activityId": "activity_1705392000000"
  }
}
```

**前端代码位置:**
- `Quiz.tsx` 第 333, 362 行
- `OpenQuestion.tsx` 第 147, 173 行
- `ScalesQuestion.tsx` 第 208, 236 行
- `CourseDetail.tsx` 第 130, 166 行

---

### 📊 Opinion Polls API (意见问卷)

#### 1. 获取问卷列表

**端点:** `GET /api/polls`

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": "poll_1",
      "title": "Course Feedback",
      "description": "Please rate this course",
      "questions": [...],
      "allowAnonymous": true,
      "responses": [...],
      "createdAt": 1705392000000
    }
  ]
}
```

**前端代码位置:**
- `OpinionPoll.tsx` 第 98 行
- `Activities.tsx` 第 179 行 (与activities合并显示)

---

#### 2. 获取单个问卷

**端点:** `GET /api/polls/{pollId}`

**前端代码位置:**
- `TakePoll.tsx` 第 49 行

---

#### 3. 创建问卷

**端点:** `POST /api/polls`

**请求体:**
```json
{
  "title": "Mid-term Feedback",
  "description": "Course evaluation survey",
  "questions": [
    {
      "id": "q1",
      "text": "How satisfied are you?",
      "type": "single-choice",
      "options": ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied"],
      "required": true
    }
  ],
  "allowAnonymous": true
}
```

**前端代码位置:**
- `OpinionPoll.tsx` 第 110 行

---

#### 4. 提交问卷回答

**端点:** `POST /api/polls/{pollId}/responses`

**请求体:**
```json
{
  "respondentName": "张三",
  "isAnonymous": false,
  "answers": {
    "q1": "Very satisfied",
    "q2": ["Option1", "Option2"],
    "q3": "This course is great!"
  }
}
```

**前端代码位置:**
- `TakePoll.tsx` 第 118 行

---

#### 5. 删除问卷

**端点:** `DELETE /api/polls/{pollId}`

**前端代码位置:**
- `Activities.tsx` 第 123 行 (删除opinion poll类型活动时)

---

### 💬 Discussions API (讨论区)

#### 1. 获取讨论列表

**端点:** `GET /api/discussions`

**请求参数:**
```typescript
{
  courseId?: string;    // 课程ID筛选
  type?: string;        // "public" | "question"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "publicDiscussions": [
      {
        "id": "post_1",
        "authorId": "user_1",
        "authorName": "张老师",
        "userRole": "teacher",
        "isAnonymous": false,
        "type": "public",
        "title": "Week 1 Discussion",
        "content": "Let's discuss the key concepts...",
        "likes": 5,
        "likedBy": ["user_2", "user_3"],
        "replies": [
          {
            "id": "reply_1",
            "authorId": "user_2",
            "authorName": "李同学",
            "userRole": "student",
            "content": "I think...",
            "likes": 2,
            "likedBy": ["user_1"],
            "timestamp": 1705392100000
          }
        ],
        "timestamp": 1705392000000
      }
    ],
    "questions": []
  }
}
```

**前端代码位置:**
- `Discussion.tsx` 第 90 行

---

#### 2. 创建讨论帖

**端点:** `POST /api/discussions`

**请求体:**
```json
{
  "type": "public",
  "title": "New Discussion",
  "content": "Discussion content...",
  "isAnonymous": false
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "post_1705392000000",
    "authorId": "user_1",
    "authorName": "张老师",
    "userRole": "teacher",
    ...
  }
}
```

**前端代码位置:**
- `Discussion.tsx` 第 146 行

---

#### 3. 点赞讨论帖

**端点:** `PUT /api/discussions/{postId}/like`

**请求体:**
```json
{
  "userId": "user_1"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "likes": 6,
    "likedBy": ["user_1", "user_2", "user_3"]
  }
}
```

**前端代码位置:**
- `Discussion.tsx` 第 178 行

---

#### 4. 添加回复

**端点:** `POST /api/discussions/{postId}/replies`

**请求体:**
```json
{
  "content": "I agree with this point..."
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "reply_1705392000000",
    "authorId": "user_2",
    "authorName": "李同学",
    "userRole": "student",
    "content": "I agree with this point...",
    "likes": 0,
    "likedBy": [],
    "timestamp": 1705392000000
  }
}
```

**前端代码位置:**
- `Discussion.tsx` 第 225 行

---

#### 5. 点赞回复

**端点:** `PUT /api/discussions/{postId}/replies/{replyId}/like`

**前端代码位置:**
- `Discussion.tsx` 第 266 行

---

### 🤖 AI Service API (AI助手)

#### 1. AI聊天

**端点:** `POST /api/ai/chat`

**请求体:**
```json
{
  "message": "如何使用React Hooks?",
  "topicId": "topic_1",
  "conversationHistory": [
    {
      "role": "user",
      "content": "什么是React?"
    },
    {
      "role": "assistant",
      "content": "React是..."
    }
  ]
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "response": "React Hooks是React 16.8引入的新特性...",
    "conversationId": "conv_1"
  }
}
```

**前端代码位置:**
- `AIAssistant.tsx` 第 112 行

---

#### 2. 文件上传 (AI分析)

**端点:** `POST /api/ai/upload`

**请求体:** FormData
- `file`: 上传的文件
- `topicId`: 话题ID

**响应:**
```json
{
  "success": true,
  "data": {
    "fileId": "file_1",
    "fileName": "document.pdf",
    "analysis": "文档分析结果..."
  }
}
```

**前端代码位置:**
- `AIAssistant.tsx` 第 137 行

---

## 认证与授权

### 认证方式

**使用 JWT (JSON Web Token)**

所有需要认证的API请求必须在Header中包含:
```
Authorization: Bearer <token>
```

### Token 获取

**登录端点:** `POST /api/auth/login`

**请求体:**
```json
{
  "email": "teacher@example.com",
  "password": "password123"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_1",
      "name": "张老师",
      "email": "teacher@example.com",
      "role": "teacher"
    }
  }
}
```

### 前端Token存储

```typescript
// 登录后保存token
localStorage.setItem('token', response.data.token);
localStorage.setItem('userId', response.data.user.id);
localStorage.setItem('userName', response.data.user.name);

// 发送请求时使用
const response = await fetch('/api/activities', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});
```

### 权限控制

| 端点类型 | Teacher | Student | TA |
|---------|---------|---------|-----|
| 创建/编辑活动 | ✅ | ❌ | ✅ |
| 查看活动 | ✅ | ✅ | ✅ |
| 提交回答 | ❌ | ✅ | ✅ |
| 查看结果 | ✅ | ❌ | ✅ |
| 管理课程 | ✅ | ❌ | ❌ |
| 讨论区发帖 | ✅ | ✅ | ✅ |

---

## 迁移检查清单

### Phase 1: Activities (活动管理) - 高优先级

- [ ] **Activities.tsx**
  - [ ] Line 37: 替换 `localStorage.getItem("activities")` 为 `GET /api/activities`
  - [ ] Line 114: 替换 `localStorage` 删除逻辑为 `DELETE /api/activities/{id}`
  - [ ] Line 171: 替换复制活动逻辑为 `POST /api/activities`

- [ ] **Quiz.tsx**
  - [ ] Line 88: 替换活动加载为 `GET /api/activities/{id}`
  - [ ] Line 329: 替换保存逻辑为 `POST /api/activities` 或 `PUT /api/activities/{id}`
  - [ ] Line 333: 替换活动日志为 `POST /api/activity-logs`
  - [ ] Line 362: 替换分享日志为 `POST /api/activity-logs`

- [ ] **OpenQuestion.tsx**
  - [ ] Line 42: 替换活动加载为 `GET /api/activities/{id}`
  - [ ] Line 143: 替换保存逻辑为 `POST/PUT /api/activities`
  - [ ] Line 147: 替换活动日志为 `POST /api/activity-logs`
  - [ ] Line 173: 替换分享日志为 `POST /api/activity-logs`

- [ ] **ScalesQuestion.tsx**
  - [ ] Line 64: 替换活动加载为 `GET /api/activities/{id}`
  - [ ] Line 208: 替换保存逻辑为 `POST/PUT /api/activities`
  - [ ] Line 208: 替换活动日志为 `POST /api/activity-logs`
  - [ ] Line 236: 替换分享日志为 `POST /api/activity-logs`

- [ ] **MindMap.tsx**
  - [ ] Line 43: 替换活动加载为 `GET /api/activities/{id}`
  - [ ] Line 195: 替换保存逻辑为 `POST/PUT /api/activities`

- [ ] **PPTGenerator.tsx**
  - [ ] Line 57: 替换活动加载为 `GET /api/activities/{id}`
  - [ ] Line 194: 替换保存逻辑为 `POST/PUT /api/activities`

### Phase 2: Courses (课程管理) - 高优先级

- [ ] **Courses.tsx**
  - [ ] Line 61: 替换 `localStorage.getItem("courses")` 为 `GET /api/courses`
  - [ ] Line 73: 替换添加课程为 `POST /api/courses`
  - [ ] Line 90: 替换编辑课程为 `PUT /api/courses/{id}`
  - [ ] Line 147: 替换删除课程为 `DELETE /api/courses/{id}`

- [ ] **CourseDetail.tsx**
  - [ ] Line 70: 替换课程加载为 `GET /api/courses/{id}`
  - [ ] Line 89: 替换课程内容加载为 `GET /api/courses/{courseId}/items`
  - [ ] Line 106: 替换添加内容为 `POST /api/courses/{courseId}/items`
  - [ ] Line 130: 替换活动日志为 `POST /api/activity-logs`
  - [ ] Line 158: 替换删除内容为 `DELETE /api/courses/{courseId}/items/{itemId}`
  - [ ] Line 166: 替换删除日志为 `POST /api/activity-logs`
  - [ ] Line 589: 实现文件下载为 `GET /api/courses/{courseId}/files/{itemId}/download`

- [ ] **Homepage.tsx**
  - [ ] Line 16: 替换课程统计为 `GET /api/courses`
  - [ ] Line 28: 替换活动加载为 `GET /api/activities`
  - [ ] Line 35, 57: 替换回答数据为 `GET /api/activities/{id}/responses`
  - [ ] Line 99: 替换活动日志为 `GET /api/activity-logs`

### Phase 3: Responses (学生回答) - 中优先级

- [ ] **MobileResponse.tsx**
  - [ ] Line 91: 替换活动加载为 `GET /api/activities/{id}`
  - [ ] Line 100: 替换提交回答为 `POST /api/activities/{activityId}/responses`

- [ ] **ResultViewer.tsx**
  - [ ] Line 30: 替换回答加载为 `GET /api/activities/{activityId}/responses`
  - [ ] 实现AI评分为 `POST /api/responses/{responseId}/ai-grade`

- [ ] **GradeAnalysis.tsx**
  - [ ] 集成AI评分API
  - [ ] 替换评分数据保存

### Phase 4: Opinion Polls (意见问卷) - 中优先级

- [ ] **OpinionPoll.tsx**
  - [ ] Line 98: 替换问卷列表为 `GET /api/polls`
  - [ ] Line 110: 替换创建问卷为 `POST /api/polls`
  - [ ] Line 444: 替换保存问卷为 `PUT /api/polls/{id}`
  - [ ] 实现删除问卷为 `DELETE /api/polls/{id}`

- [ ] **TakePoll.tsx**
  - [ ] Line 49: 替换问卷加载为 `GET /api/polls/{pollId}`
  - [ ] Line 118: 替换提交回答为 `POST /api/polls/{pollId}/responses`

### Phase 5: Discussions (讨论区) - 低优先级

- [ ] **Discussion.tsx**
  - [ ] Line 90: 替换讨论加载为 `GET /api/discussions`
  - [ ] Line 146: 替换创建帖子为 `POST /api/discussions`
  - [ ] Line 178: 替换点赞为 `PUT /api/discussions/{postId}/like`
  - [ ] Line 225: 替换添加回复为 `POST /api/discussions/{postId}/replies`
  - [ ] Line 266: 替换回复点赞为 `PUT /api/discussions/{postId}/replies/{replyId}/like`

### Phase 6: AI Service (AI助手) - 已部分完成

- [ ] **AIAssistant.tsx**
  - [x] Line 112: AI聊天已使用 `POST /api/ai/chat` ✅
  - [ ] Line 137: 文件上传需使用 `POST /api/ai/upload`
  - [ ] 完善错误处理
  - [ ] 添加重试机制

---

## 测试建议

### 单元测试

**测试API调用函数**

```typescript
// __tests__/api/activities.test.ts
import { getActivities, createActivity } from '@/services/activityApi';

describe('Activities API', () => {
  it('should fetch activities list', async () => {
    const activities = await getActivities();
    expect(activities).toBeInstanceOf(Array);
  });

  it('should create new activity', async () => {
    const newActivity = {
      title: 'Test Quiz',
      activityType: 'quiz',
      questions: []
    };
    const result = await createActivity(newActivity);
    expect(result).toHaveProperty('id');
  });
});
```

### 集成测试

**测试完整流程**

```typescript
// __tests__/integration/quiz-flow.test.ts
describe('Quiz Flow', () => {
  it('should complete full quiz cycle', async () => {
    // 1. 创建quiz
    const quiz = await createActivity({...});
    
    // 2. 学生提交回答
    const response = await submitResponse(quiz.id, {...});
    
    // 3. 查看结果
    const results = await getResponses(quiz.id);
    expect(results).toContain(response);
  });
});
```

### 端到端测试 (E2E)

**使用 Playwright 或 Cypress**

```typescript
// e2e/quiz.spec.ts
test('Teacher creates quiz and student submits', async ({ page }) => {
  // 教师登录
  await page.goto('/login');
  await page.fill('[name=email]', 'teacher@example.com');
  await page.click('button[type=submit]');

  // 创建quiz
  await page.goto('/quiz/create');
  await page.fill('[name=title]', 'Week 1 Quiz');
  await page.click('button:has-text("Save")');

  // 学生登录并回答
  await page.goto('/login');
  await page.fill('[name=email]', 'student@example.com');
  
  await page.goto('/quiz/1/take');
  await page.click('[data-option="0"]');
  await page.click('button:has-text("Submit")');

  // 验证提交成功
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### API测试清单

**每个端点都应测试:**

1. ✅ **正常情况** - 返回正确数据
2. ✅ **权限验证** - 未授权返回401
3. ✅ **参数验证** - 无效参数返回400
4. ✅ **资源不存在** - 返回404
5. ✅ **并发请求** - 数据一致性
6. ✅ **性能测试** - 响应时间<500ms

---

## 错误处理规范

### HTTP状态码

| 状态码 | 含义 | 使用场景 |
|-------|------|---------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证或token过期 |
| 403 | Forbidden | 无权限访问 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 (如重复创建) |
| 500 | Internal Server Error | 服务器错误 |

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "INVALID_ACTIVITY_TYPE",
    "message": "Activity type must be one of: quiz, open-question, scales-question",
    "details": {
      "field": "activityType",
      "value": "invalid-type"
    }
  }
}
```

### 前端错误处理

```typescript
// services/apiClient.ts
export const apiCall = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token过期,跳转登录
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }

      const error = await response.json();
      throw new Error(error.error?.message || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

### 错误代码表

| 错误代码 | 说明 | HTTP状态码 |
|---------|------|-----------|
| `AUTH_REQUIRED` | 需要登录 | 401 |
| `INVALID_TOKEN` | Token无效或过期 | 401 |
| `PERMISSION_DENIED` | 权限不足 | 403 |
| `RESOURCE_NOT_FOUND` | 资源不存在 | 404 |
| `INVALID_ACTIVITY_TYPE` | 无效的活动类型 | 400 |
| `MISSING_REQUIRED_FIELD` | 缺少必填字段 | 400 |
| `DUPLICATE_RESOURCE` | 资源已存在 | 409 |
| `DATABASE_ERROR` | 数据库错误 | 500 |
| `EXTERNAL_SERVICE_ERROR` | 外部服务错误(如AI) | 500 |

---

## 实施建议

### 1. 创建API客户端封装

```typescript
// services/apiClient.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export const api = {
  // Activities
  activities: {
    list: () => apiCall<Activity[]>(`${API_BASE_URL}/activities`),
    get: (id: string) => apiCall<Activity>(`${API_BASE_URL}/activities/${id}`),
    create: (data: Partial<Activity>) => 
      apiCall<Activity>(`${API_BASE_URL}/activities`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: Partial<Activity>) =>
      apiCall<Activity>(`${API_BASE_URL}/activities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      apiCall(`${API_BASE_URL}/activities/${id}`, { method: 'DELETE' })
  },

  // Courses
  courses: {
    list: () => apiCall<Course[]>(`${API_BASE_URL}/courses`),
    get: (id: string) => apiCall<Course>(`${API_BASE_URL}/courses/${id}`),
    create: (data: Partial<Course>) => 
      apiCall<Course>(`${API_BASE_URL}/courses`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    // ... 其他方法
  },

  // ... 其他资源
};
```

### 2. 迁移步骤

**Step 1: 创建后端API (2-3周)**
- 设置Express/NestJS项目
- 配置数据库(MongoDB/PostgreSQL)
- 实现所有端点
- 编写单元测试

**Step 2: 前端适配 (1周)**
- 创建API客户端封装
- 逐个文件替换localStorage调用
- 更新错误处理逻辑

**Step 3: 集成测试 (3-5天)**
- 端到端测试
- 性能测试
- 安全测试

**Step 4: 部署上线 (2-3天)**
- 生产环境配置
- 数据迁移
- 监控告警设置

### 3. 优先级建议

**P0 (必须先完成):**
- 用户认证登录
- Activities CRUD
- Responses提交和查看

**P1 (第二批):**
- Courses管理
- Course Items管理
- Activity Logs

**P2 (第三批):**
- Opinion Polls
- AI服务集成

**P3 (可延后):**
- Discussions
- 高级搜索功能

---

## 附录

### 环境变量配置

```bash
# .env.development
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_AI_API_URL=http://localhost:5000/api/ai

# .env.production
REACT_APP_API_URL=https://api.yourapp.com/api
REACT_APP_AI_API_URL=https://ai.yourapp.com/api/ai
```

### 数据库Schema建议

**MongoDB Collections:**
- `users` - 用户信息
- `activities` - 活动数据
- `courses` - 课程数据
- `course_items` - 课程内容
- `responses` - 学生回答
- `activity_logs` - 活动日志
- `opinion_polls` - 意见问卷
- `discussions` - 讨论帖子

**PostgreSQL Tables:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  role VARCHAR(50),
  created_at TIMESTAMP
);

CREATE TABLE activities (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255),
  activity_type VARCHAR(50),
  content JSONB,
  created_by UUID REFERENCES users(id),
  edited_at BIGINT
);

-- ... 其他表
```

### 技术栈建议

**后端:**
- Node.js + Express/NestJS
- TypeScript
- MongoDB (文档型数据) 或 PostgreSQL (关系型数据)
- JWT认证
- Socket.io (实时功能)

**部署:**
- Docker容器化
- Nginx反向代理
- PM2进程管理
- Redis缓存

---

**文档结束**

如有疑问,请联系开发团队。
