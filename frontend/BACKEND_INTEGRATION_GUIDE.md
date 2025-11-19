# 后端集成指南

本文档说明如何将前端代码从 localStorage 集成替换为真正的后端 API。

## 当前状态
- ✅ 前端所有功能已实现
- ✅ 使用 localStorage 进行本地测试
- 📝 需要替换成后端 API 调用

## 需要集成的位置

### 1. **Quiz.tsx** - 获取和保存问卷数据

#### 位置 1: 初始化数据加载 (第 51-74 行)
```typescript
// TODO: 后端集成 - 将 localStorage.getItem("activities") 替换为后端 API 调用
// 后端接口应该是: GET /api/activities/{id} - 根据活动 ID 获取活动详情
```

**替换方案：**
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const activityId = params.get("id");
  const mode = params.get("mode");

  if (mode === "edit" && activityId) {
    // 后端 API 调用
    fetch(`/api/activities/${activityId}`)
      .then(res => res.json())
      .then(activity => {
        if (activity) {
          setDraftName(activity.title);
          setQuestions(activity.questions);
          setCurrentQuestionId(activity.questions[0]?.id || 1);
        }
      })
      .catch(err => console.error("Failed to load activity:", err));
  }
}, []);
```

#### 位置 2: 保存数据 (第 95-128 行)
```typescript
// TODO: 后端集成 - 将 localStorage.setItem 替换为后端 API 调用
// 后端接口应该是:
// POST /api/activities (创建新活动)
// PUT /api/activities/{id} (更新已有活动)
// 请求体应包含: { title, type, activityType, questions }
```

**替换方案：**
```typescript
const handleSave = async () => {
  const params = new URLSearchParams(window.location.search);
  const activityId = params.get("id");
  
  const newActivity = {
    title: draftName,
    type: "Classroom Quiz",
    activityType: "quiz",
    questions: questions,
  };

  try {
    if (activityId && params.get("mode") === "edit") {
      // 更新已有活动
      await fetch(`/api/activities/${activityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newActivity),
      });
    } else {
      // 创建新活动
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newActivity),
      });
    }
    window.location.href = "/activities";
  } catch (err) {
    console.error("Failed to save activity:", err);
  }
};
```

---

### 2. **OpenQuestion.tsx** - 类似 Quiz.tsx

与 Quiz.tsx 的集成方案相同，只需将：
- `type: "Open-ended Question"` 
- `activityType: "open-question"`
- `slides` 替换为 `questions` 字段名

---

### 3. **Activities.tsx** - 获取活动列表

#### 位置: 初始化活动列表 (第 23-32 行)
```typescript
// TODO: 后端集成 - 将 localStorage.getItem("activities") 替换为后端 API 调用
// 后端接口应该是: GET /api/activities - 获取当前用户的所有活动列表
// 后端返回应该是一个活动对象数组，每个对象包含: { id, title, type, activityType, edited, thumbnail, questions/slides }
```

**替换方案：**
```typescript
useEffect(() => {
  // 从后端获取活动列表
  fetch("/api/activities")
    .then(res => res.json())
    .then(data => setRecentWork(data))
    .catch(err => console.error("Failed to load activities:", err));
}, []);
```

---

## 后端 API 规范

### 1. GET /api/activities
获取当前用户的所有活动列表

**Response (200 OK):**
```json
[
  {
    "id": "activity_1699999999999",
    "title": "My Quiz",
    "type": "Classroom Quiz",
    "activityType": "quiz",
    "edited": "Just now",
    "thumbnail": "What is OOP?",
    "questions": [
      { "id": 1, "text": "What is OOP?", "type": "short-answer" }
    ]
  },
  {
    "id": "activity_1700000000000",
    "title": "My Question",
    "type": "Open-ended Question",
    "activityType": "open-question",
    "edited": "2 hours ago",
    "thumbnail": "What do you think about AI?",
    "slides": [
      { "id": 1, "text": "What do you think about AI?" }
    ]
  }
]
```

### 2. GET /api/activities/{id}
获取单个活动详情

**Response (200 OK):**
```json
{
  "id": "activity_1699999999999",
  "title": "My Quiz",
  "type": "Classroom Quiz",
  "activityType": "quiz",
  "edited": "Just now",
  "thumbnail": "What is OOP?",
  "questions": [
    { "id": 1, "text": "What is OOP?", "type": "short-answer" },
    { "id": 2, "text": "What is inheritance?", "type": "multiple-choice" }
  ]
}
```

### 3. POST /api/activities
创建新活动

**Request Body:**
```json
{
  "title": "My Quiz",
  "type": "Classroom Quiz",
  "activityType": "quiz",
  "questions": [
    { "id": 1, "text": "What is OOP?", "type": "short-answer" }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "activity_1700001234567",
  "title": "My Quiz",
  "type": "Classroom Quiz",
  "activityType": "quiz",
  "edited": "Just now",
  "thumbnail": "What is OOP?",
  "questions": [
    { "id": 1, "text": "What is OOP?", "type": "short-answer" }
  ]
}
```

### 4. PUT /api/activities/{id}
更新活动

**Request Body:**
```json
{
  "title": "Updated Quiz Title",
  "type": "Classroom Quiz",
  "activityType": "quiz",
  "questions": [
    { "id": 1, "text": "Updated question?", "type": "short-answer" }
  ]
}
```

**Response (200 OK):**
```json
{
  "id": "activity_1699999999999",
  "title": "Updated Quiz Title",
  "type": "Classroom Quiz",
  "activityType": "quiz",
  "edited": "Just now",
  "thumbnail": "Updated question?",
  "questions": [
    { "id": 1, "text": "Updated question?", "type": "short-answer" }
  ]
}
```

---

## 数据模型

### Activity 对象
```typescript
interface Activity {
  id: string;                          // 活动唯一标识
  title: string;                       // 活动标题（用户输入的草稿名字）
  type: string;                        // 活动类型显示名称 (e.g., "Classroom Quiz")
  activityType: string;                // 活动类型标识 (e.g., "quiz")
  edited: string;                      // 最后编辑时间（可选，后端生成）
  thumbnail: string;                   // 缩略图（通常是第一个问题的文本）
  questions?: Question[];              // 问题数组（Quiz 使用）
  slides?: Slide[];                    // 幻灯片数组（OpenQuestion 使用）
}

interface Question {
  id: number;
  text: string;
  type: "short-answer" | "multiple-choice" | "true-false";
}

interface Slide {
  id: number;
  text: string;
}
```

---

## 测试检查清单

- [ ] 创建新 Quiz 活动并保存
- [ ] 创建新 OpenQuestion 活动并保存
- [ ] 编辑已保存的活动
- [ ] 在 Activities 页面看到保存的活动缩略图
- [ ] 活动列表显示正确的标题和类型
- [ ] 点击活动缩略图能成功加载编辑页面

---

## 认证说明

根据项目的认证方式，可能需要在 API 请求中添加：
- JWT Token (Authorization header)
- 用户 ID (query parameter 或 body)
- Session cookie

示例：
```typescript
fetch("/api/activities", {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  }
})
```

---

## 错误处理建议

添加更完善的错误处理：
```typescript
const handleSave = async () => {
  try {
    const response = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newActivity),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    window.location.href = `/activities?saved=${data.id}`;
  } catch (err) {
    console.error("Save failed:", err);
    alert("Failed to save activity. Please try again.");
  }
};
```
