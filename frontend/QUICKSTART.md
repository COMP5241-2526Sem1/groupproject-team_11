# 🚀 快速开始指南

## 当前状态 ✅
所有功能已完成，可立即测试和集成后端。

---

## 本地测试（5 分钟快速体验）

### 步骤 1: 启动项目
```bash
cd "c:\Users\liuxinjiexx\Desktop\学习\POLYU\SED\project"
npm run dev
```
访问：http://localhost:8081

### 步骤 2: 创建活动
1. 点击 "Classroom Quiz" 卡片
2. 输入标题：`My Test Quiz`
3. 在右侧主区域输入问题：`What is React?`
4. 点击右上角 **Save** 按钮
5. 自动返回 Activities 页面

### 步骤 3: 验证保存
1. 在 "Recently Work" 中看到新的活动卡片
2. 卡片显示：
   - 标题：**My Test Quiz**
   - 类型：**Classroom Quiz**
   - 时间：**Just now**
   - 缩略图：**What is React?**

### 步骤 4: 编辑已保存的活动
1. 点击刚创建的活动卡片
2. 所有数据自动加载
3. 修改内容后再次 Save
4. 验证数据已更新

---

## 后端集成（30 分钟快速集成）

### 步骤 1: 了解 API 规范
打开 `BACKEND_INTEGRATION_GUIDE.md`，查看：
- API 端点（GET, POST, PUT）
- 请求/响应格式
- 数据模型

### 步骤 2: 实现后端 API
创建 5 个端点：
```
1. GET /api/activities              获取活动列表
2. GET /api/activities/{id}         获取单个活动
3. POST /api/activities             创建活动
4. PUT /api/activities/{id}         更新活动
```

### 步骤 3: 替换前端代码
在以下位置搜索 `TODO: 后端集成`：
- `src/pages/Quiz.tsx` (2 处)
- `src/pages/OpenQuestion.tsx` (2 处)
- `src/pages/Activities.tsx` (1 处)

按照 TODO 注释的说明替换 localStorage 代码为实际 API 调用。

### 步骤 4: 完整测试
参考 `TESTING_GUIDE.md` 进行 6 个测试场景验证。

---

## 文件位置速查

### 源代码
```
src/pages/
├── Quiz.tsx              ← Quiz 编辑页面
├── OpenQuestion.tsx      ← Open-ended 编辑页面
└── Activities.tsx        ← 活动列表页面
```

### 集成文档
```
项目根目录/
├── BACKEND_INTEGRATION_GUIDE.md     ← 📌 必读：API 规范
├── TESTING_GUIDE.md                 ← 测试步骤
├── IMPLEMENTATION_CHECKLIST.md      ← 完成度检查
└── CHANGES_SUMMARY.md               ← 变更总结
```

---

## 关键代码片段

### 保存活动到 localStorage（当前）
```typescript
// Quiz.tsx, 第 95-128 行
const handleSave = () => {
  const activities = JSON.parse(localStorage.getItem("activities") || "[]");
  const newActivity = {
    id: activityId,
    title: draftName,
    type: "Classroom Quiz",
    questions: questions,
  };
  activities.push(newActivity);
  localStorage.setItem("activities", JSON.stringify(activities));
  window.location.href = "/activities";
};
```

### 替换为后端 API（集成后）
```typescript
const handleSave = async () => {
  const response = await fetch("/api/activities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: draftName,
      type: "Classroom Quiz",
      activityType: "quiz",
      questions: questions,
    }),
  });
  window.location.href = "/activities";
};
```

---

## localStorage 数据结构

**Key:** `"activities"`  
**Value:** JSON 数组

```json
[
  {
    "id": "activity_1699999999999",
    "title": "My Test Quiz",
    "type": "Classroom Quiz",
    "activityType": "quiz",
    "edited": "Just now",
    "thumbnail": "What is React?",
    "questions": [
      { "id": 1, "text": "What is React?", "type": "short-answer" }
    ]
  }
]
```

在浏览器中查看：
- 按 F12 打开开发者工具
- 进入 Application → LocalStorage
- 找到 "activities" 键

---

## 常用操作

### 清除 localStorage（重新开始测试）
在浏览器控制台输入：
```javascript
localStorage.removeItem("activities");
location.reload();
```

### 查看所有保存的活动
在浏览器控制台输入：
```javascript
console.log(JSON.parse(localStorage.getItem("activities")));
```

### 导出数据（备份）
```javascript
copy(JSON.parse(localStorage.getItem("activities")));
// 然后粘贴到记事本保存
```

---

## 按钮顺序参考

**工具栏从左到右的顺序：**
```
[← 返回] [草稿名称输入框] | [题目类型选择] | [AI助手] [Save] [present] [share] [result]
```

---

## 需要立即替换的 5 个位置

### Position 1 & 2: Quiz.tsx
- **Line 51-74:** useEffect - 加载已保存的问卷
- **Line 95-128:** handleSave - 保存问卷

### Position 3 & 4: OpenQuestion.tsx  
- **Line 24-47:** useEffect - 加载已保存的问题
- **Line 82-114:** handleSave - 保存问题

### Position 5: Activities.tsx
- **Line 23-32:** useEffect - 加载活动列表

---

## 项目文件结构

```
src/
├── pages/
│   ├── Activities.tsx          完成 ✅
│   ├── Quiz.tsx                完成 ✅
│   ├── OpenQuestion.tsx        完成 ✅
│   └── ...
├── components/
│   ├── AIAssistantPanel.tsx
│   └── ...
└── services/
    ├── aiService.ts
    └── ...

项目根目录/
├── BACKEND_INTEGRATION_GUIDE.md
├── TESTING_GUIDE.md
├── CHANGES_SUMMARY.md
├── IMPLEMENTATION_CHECKLIST.md
├── 📄 本文件 (QUICKSTART.md)
└── vite.config.ts
```

---

## 预期工作流程

```
用户 → 创建活动 → 编辑内容 → 点击 Save
                                  ↓
                        保存到 localStorage
                                  ↓
                        重定向到 Activities
                                  ↓
                        显示新的活动卡片
                                  ↓
                        用户点击卡片
                                  ↓
                        从 localStorage 加载
                                  ↓
                        进入编辑页面继续编辑
```

---

## 下一步

- [ ] 运行 `npm run dev` 测试本地功能
- [ ] 参考 TESTING_GUIDE.md 完整测试
- [ ] 参考 BACKEND_INTEGRATION_GUIDE.md 实现后端 API
- [ ] 逐个替换 5 个 TODO 位置的代码
- [ ] 进行完整的集成测试

---

## 支持和文档

| 问题 | 查阅文档 |
|------|--------|
| 我需要实现哪些 API？ | BACKEND_INTEGRATION_GUIDE.md |
| 如何测试功能？ | TESTING_GUIDE.md |
| 完成度怎样？ | IMPLEMENTATION_CHECKLIST.md |
| 有哪些变更？ | CHANGES_SUMMARY.md |

---

**所有代码已准备好，可立即测试和集成！** 🎉
