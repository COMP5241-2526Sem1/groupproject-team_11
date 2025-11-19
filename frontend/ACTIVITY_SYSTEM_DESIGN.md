# 📚 活动系统设计文档

## 🎯 系统概览

### 核心流程
```
Activities 页面
    ↓
点击活动类型卡片（如 Classroom Quiz）
    ↓
创建新活动并跳转到编辑页面（?id=xxx&mode=create）
    ↓
编辑内容，可以使用 AI Assistant 辅助
    ↓
保存活动到 Recently Work
    ↓
显示在 Recently Work 中（固定 3 列布局）
    ↓
点击缩略图可以重新编辑（?id=xxx&mode=edit）
```

---

## 📋 已实现的功能

### 1️⃣ **Activities 页面**（主页）

✅ **已完成的改动**：
- ❌ 删除了 "New Activities" 按钮
- ❌ 删除了 "Start With AI" 按钮
- ✅ 活动类型卡片：点击后创建新活动
- ✅ Recently Work：3 列固定布局
- ✅ 缩略图固定大小（高度 192px）

**活动类型**：
1. Opinion Poll（意见投票）- 红色
2. Classroom Quiz（课堂测验）- 绿色
3. Group Discussion（小组讨论）- 蓝色
4. Open-ended Question（开放式问题）- 紫色
5. Scales Question（量表问题）- 橙色

**Recently Work 布局**：
```
┌─────────┬─────────┬─────────┐
│ Activity│ Activity│ Activity│
│    1    │    2    │    3    │
└─────────┴─────────┴─────────┘
┌─────────┬─────────┬─────────┐
│ Activity│ Activity│ Activity│
│    4    │    5    │    6    │
└─────────┴─────────┴─────────┘
```

---

### 2️⃣ **AI Assistant Panel**（AI 辅助侧边栏）

✅ **特性**：
- 固定在页面右侧，宽度 384px (w-96)
- 浮动在页面之上（z-50）
- 显示当前活动上下文
- 支持多轮对话
- Enter 发送，Shift+Enter 换行
- 智能建议提示

**使用场景**：
- 生成问题建议
- 优化问题表述
- 提供教学建议
- 内容创作辅助

**AI 面板结构**：
```
┌────────────────────────┐
│ AI Assistant      [X]  │ ← Header
├────────────────────────┤
│ 当前活动: Quiz         │ ← Context
├────────────────────────┤
│                        │
│   对话消息区域         │ ← Messages
│                        │
├────────────────────────┤
│ [输入框]          [↑] │ ← Input
└────────────────────────┘
```

---

### 3️⃣ **Open-ended Question 页面**

✅ **新增功能**：
- AI Assistant 按钮（顶部工具栏）
- 点击按钮打开 AI 辅助面板
- 返回按钮链接到 `/activities`

---

### 4️⃣ **Classroom Quiz 页面**

✅ **新增功能**：
- AI Assistant 按钮（顶部工具栏）
- 点击按钮打开 AI 辅助面板
- 返回按钮链接到 `/activities`

---

## 🔄 数据流设计

### 活动创建流程

```typescript
// 1. 用户点击活动类型卡片
handleCreateActivity("quiz")
    ↓
// 2. 生成唯一 ID
const newId = `activity_${Date.now()}`;
    ↓
// 3. 跳转到编辑页面
window.location.href = `/quiz?id=${newId}&mode=create`;
    ↓
// 4. 页面加载，检测 mode=create
// 初始化空白活动
    ↓
// 5. 用户编辑内容
// 可以使用 AI Assistant 辅助
    ↓
// 6. 点击 "create" 保存
// 保存到 localStorage 或后端
    ↓
// 7. 添加到 Recently Work
recentWork.push({
  id: newId,
  title: "问题标题",
  type: "Classroom Quiz",
  activityType: "quiz",
  edited: "刚刚",
  thumbnail: "问题内容"
});
```

---

## 📦 组件结构

### AIAssistantPanel 组件

```typescript
interface AIAssistantPanelProps {
  isOpen: boolean;        // 是否打开
  onClose: () => void;    // 关闭回调
  context?: string;       // 当前活动上下文
}
```

**使用示例**：
```tsx
const [isAIOpen, setIsAIOpen] = useState(false);

<Button onClick={() => setIsAIOpen(true)}>
  <Sparkles /> AI Assistant
</Button>

<AIAssistantPanel
  isOpen={isAIOpen}
  onClose={() => setIsAIOpen(false)}
  context="Classroom Quiz"
/>
```

---

## 🎨 UI 设计要点

### 1. 缩略图尺寸

```css
/* 固定高度 */
height: 192px; /* h-48 */

/* 内容居中显示 */
display: flex;
align-items: center;
justify-content: center;

/* 文本截断（最多 3 行） */
line-clamp: 3;
```

### 2. 网格布局

```css
/* 桌面端：3 列 */
grid-template-columns: repeat(3, 1fr);
gap: 1.5rem; /* gap-6 */

/* 平板：2 列 */
@media (max-width: 1024px) {
  grid-template-columns: repeat(2, 1fr);
}

/* 手机：1 列 */
@media (max-width: 768px) {
  grid-template-columns: repeat(1, 1fr);
}
```

### 3. AI 面板样式

```css
/* 固定右侧 */
position: fixed;
right: 0;
top: 0;
width: 24rem; /* w-96 */
height: 100vh;
z-index: 50;

/* 阴影效果 */
box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
```

---

## 🔧 下一步开发建议

### 1️⃣ **数据持久化**

**当前状态**: 硬编码示例数据

**建议实现**:
```typescript
// 使用 localStorage
const saveActivity = (activity: Activity) => {
  const activities = JSON.parse(
    localStorage.getItem('activities') || '[]'
  );
  activities.push(activity);
  localStorage.setItem('activities', JSON.stringify(activities));
};

// 或者使用后端 API
const saveActivity = async (activity: Activity) => {
  await fetch('/api/activities', {
    method: 'POST',
    body: JSON.stringify(activity),
  });
};
```

---

### 2️⃣ **AI 集成**

**当前状态**: 模拟回复

**建议实现**:
```typescript
import { sendChatMessage } from "@/services/aiService";

const handleSend = async () => {
  const response = await sendChatMessage({
    topicId: activityId,
    message: input,
    conversationHistory: messages,
  });
  
  // 显示 AI 回复
  setMessages([...messages, {
    role: "assistant",
    content: response.content,
  }]);
};
```

**AI 辅助功能示例**:
- 📝 "帮我生成 5 个关于 OOP 的选择题"
- ✨ "优化这个问题的表述：xxx"
- 💡 "推荐一些适合大学生的编程练习题"

---

### 3️⃣ **活动编辑器增强**

**当前状态**: 基础显示

**建议添加**:
- [ ] 富文本编辑器（TinyMCE 或 Quill）
- [ ] 拖拽排序（react-beautiful-dnd）
- [ ] 图片上传
- [ ] 代码高亮（Monaco Editor）
- [ ] 实时预览

---

### 4️⃣ **其他活动类型实现**

**待开发页面**:
```
src/pages/
├── OpinionPoll.tsx       ← 意见投票
├── GroupDiscussion.tsx   ← 小组讨论
└── ScalesQuestion.tsx    ← 量表问题
```

每个页面应该包含：
- 顶部工具栏（返回、AI、保存、分享、展示）
- 左侧编辑区域
- 右侧预览区域
- AI Assistant Panel

---

## 📝 代码示例

### 创建新活动类型页面模板

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { AIAssistantPanel } from "@/components/AIAssistantPanel";

const NewActivityType = () => {
  const [isAIOpen, setIsAIOpen] = useState(false);

  return (
    <>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/activities">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h2 className="text-xl font-bold">Activity Name</h2>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsAIOpen(!isAIOpen)}
            >
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </Button>
            <Button className="bg-primary">create</Button>
            <Button variant="outline">result</Button>
            <Button variant="outline">share</Button>
            <Button variant="outline">present</Button>
          </div>
        </div>

        {/* Your activity content */}
        <div className="grid grid-cols-4 gap-6">
          {/* Left: Editor */}
          <div className="col-span-1">
            {/* Editor components */}
          </div>

          {/* Right: Preview */}
          <Card className="col-span-3 p-12">
            {/* Preview content */}
          </Card>
        </div>
      </div>

      <AIAssistantPanel
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        context="Activity Name"
      />
    </>
  );
};

export default NewActivityType;
```

---

## 🎯 设计理念

### 1. **简洁直观**
- 删除冗余按钮（New Activities、Start With AI）
- 点击活动卡片直接创建，减少操作步骤

### 2. **智能辅助**
- AI Assistant 可在需要时随时打开
- 不干扰主要工作流程
- 提供上下文感知的建议

### 3. **一致性**
- 所有活动类型使用相同的布局结构
- 统一的工具栏设计
- 一致的交互模式

### 4. **响应式**
- 桌面端 3 列，平板 2 列，手机 1 列
- AI 面板在小屏幕上可以覆盖整个屏幕

---

## ✨ 未来功能展望

- 📊 **数据分析**: 学生答题统计、正确率分析
- 🔄 **模板系统**: 预设问题模板，快速创建
- 👥 **协作功能**: 多人共同编辑活动
- 📱 **学生端**: 学生答题 App/网页
- 🎨 **主题定制**: 自定义活动样式
- 🌐 **多语言**: 支持中英文切换
- ⚡ **实时协同**: WebSocket 实时更新

---

完成这些功能后，你将拥有一个功能完整、用户体验优秀的教学活动管理系统！🎉
