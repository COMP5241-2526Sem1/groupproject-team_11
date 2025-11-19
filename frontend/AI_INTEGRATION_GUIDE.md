# AI 多轮问答 - 前后端集成指南

## 📋 前端已实现的功能

✅ **已完成的前端功能**：

1. **多轮对话状态管理**
   - Topic（话题）管理：创建、编辑、删除
   - 消息历史存储和显示
   - 自动滚动到最新消息

2. **消息显示**
   - 用户消息/助手消息区分（不同颜色和对齐）
   - 消息时间戳显示
   - 附件显示（上传的文件）
   - 加载状态提示（"Assistant is typing..."）
   - 错误消息显示

3. **用户交互**
   - 按 Enter 发送消息
   - 按 Shift+Enter 换行
   - 图片和文档上传
   - 发送按钮禁用状态（加载中或空消息）

4. **API 集成框架**
   - `src/services/aiService.ts` - AI 服务层
   - 支持多种 API 端点调用

---

## 🔧 后端需要实现的 API 接口

### 1️⃣ **多轮聊天接口** ⭐（最重要）

```
POST /api/ai/chat
```

**请求体**：
```json
{
  "topicId": "1",
  "message": "用户输入的消息",
  "attachments": ["file1.pdf", "image.png"],
  "conversationHistory": [
    {
      "id": "msg1",
      "role": "user",
      "content": "之前的用户消息",
      "timestamp": "2025-11-12T10:00:00Z"
    },
    {
      "id": "msg2",
      "role": "assistant",
      "content": "之前的 AI 回复",
      "timestamp": "2025-11-12T10:00:05Z"
    }
  ]
}
```

**响应体**：
```json
{
  "id": "msg3",
  "content": "AI 的回复内容",
  "status": "success"
}
```

**说明**：
- `conversationHistory` 参数用于上下文理解（多轮问答）
- 后端应该基于完整的对话历史生成回复
- 如果没有上传附件，`attachments` 可以为空数组

---

### 2️⃣ **获取对话历史**（可选但推荐）

```
GET /api/ai/conversations/:topicId
```

**响应体**：
```json
{
  "topicId": "1",
  "messages": [
    {
      "id": "msg1",
      "role": "user",
      "content": "用户消息",
      "timestamp": "2025-11-12T10:00:00Z"
    }
  ]
}
```

**用途**：刷新页面后恢复对话历史

---

### 3️⃣ **保存对话**（可选）

```
POST /api/ai/conversations
```

**请求体**：
```json
{
  "topicId": "1",
  "messages": [...]
}
```

**用途**：持久化保存对话内容到数据库

---

### 4️⃣ **清除对话历史**（可选）

```
DELETE /api/ai/conversations/:topicId
```

**用途**：清空指定话题的对话历史

---

### 5️⃣ **文件上传到 AI 服务**（可选）

```
POST /api/ai/upload
```

**请求体**：FormData（multipart/form-data）

**响应体**：
```json
{
  "fileId": "file_abc123",
  "filename": "document.pdf"
}
```

**用途**：上传文件供 AI 分析（如果需要）

---

## 🚀 如何集成

### 步骤 1: 配置 API 地址

在 `.env` 文件中添加：
```env
REACT_APP_AI_API_URL=http://localhost:3001/api/ai
```

### 步骤 2: 在 AIAssistant.tsx 中使用 aiService

当前代码已经硬编码了 API 调用，如果想用 `aiService.ts`，改为：

```typescript
import { sendChatMessage } from "@/services/aiService";

const handleSendMessage = async () => {
  // ... 代码 ...
  
  try {
    const response = await sendChatMessage({
      topicId: selectedTopicId,
      message: userMessage.content,
      attachments: uploadedFiles,
      conversationHistory: selectedTopic?.messages || [],
    });

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response.content,
      timestamp: new Date().toISOString(),
    };
    
    // ... 更新 UI ...
  } catch (err) {
    // ... 处理错误 ...
  }
};
```

### 步骤 3: 处理认证（如果需要）

如果后端需要认证令牌，在 `aiService.ts` 中添加：

```typescript
headers: {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
}
```

---

## 📝 前端环境变量配置

创建 `.env` 文件（或 `.env.local`）：

```env
# AI API 配置
REACT_APP_AI_API_URL=http://localhost:3001/api/ai

# 其他配置
REACT_APP_API_URL=http://localhost:3000/api
```

---

## ✨ 前端已支持的特性

- ✅ 多轮对话（带完整历史）
- ✅ 消息时间戳
- ✅ 文件上传显示
- ✅ 加载状态反馈
- ✅ 错误处理和显示
- ✅ 话题管理（创建、编辑、删除）
- ✅ 自动滚动到最新消息
- ✅ 禁用发送按钮（防止重复提交）

---

## 🔗 相关文件

- **前端页面**：`src/pages/AIAssistant.tsx`
- **AI 服务**：`src/services/aiService.ts`
- **API 类型定义**：都在 `aiService.ts` 中

---

## 📞 后端示例（Node.js Express）

如果你需要后端示例代码，可以参考这个基本结构：

```javascript
// 简单示例
app.post('/api/ai/chat', async (req, res) => {
  const { topicId, message, conversationHistory } = req.body;
  
  // 构建上下文
  const context = conversationHistory.map(m => 
    `${m.role}: ${m.content}`
  ).join('\n');
  
  // 调用 AI 模型（OpenAI、Claude 等）
  const aiResponse = await callAIModel(context, message);
  
  res.json({
    id: generateId(),
    content: aiResponse,
    status: 'success'
  });
});
```

---

祝你集成顺利！有任何问题，随时告诉我。🎉
