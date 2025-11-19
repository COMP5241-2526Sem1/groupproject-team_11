# 功能测试步骤

## 当前实现总结

✅ **已完成的功能：**
1. Save 按钮已添加到 Quiz 和 OpenQuestion 页面工具栏
2. 按钮顺序正确：Save → Present → Share → Result
3. 数据保存到 localStorage (用于本地测试)
4. 编辑模式支持：从 URL 参数 id 和 mode 加载已保存的活动
5. Recently Work 显示格式已更新：
   - 显示活动标题（草稿名字）
   - 显示活动类型
   - 显示编辑时间
6. 空状态提示：当问题为空时显示 "Enter your question here"

## 测试步骤

### 测试 1：创建并保存一个 Quiz

**步骤：**
1. 打开应用 → Activities 页面
2. 点击 "Classroom Quiz" 卡片
3. 在右上角工具栏中：
   - 修改 "Draft Name" → "My First Quiz"
   - 问题类型选择为 "Short Answer"
   - 在主区域输入第一个问题：如 "What is OOP?"
4. 点击左侧 "Add" 按钮添加第二个问题
5. 输入第二个问题：如 "What is inheritance?"
6. 选择问题类型为 "Multiple Choice"
7. 点击右上角 **"Save"** 按钮
8. 应该被重定向回 Activities 页面

**预期结果：**
- ✅ Activities 页面的 Recently Work 中显示新的 Quiz
- ✅ 卡片显示：
  - 标题：**"My First Quiz"** (在顶部，粗体)
  - 类型：**"Classroom Quiz"**
  - 编辑时间：**"Just now"**
  - 缩略图：**"What is OOP?"** (第一个问题的文本)

### 测试 2：编辑已保存的 Quiz

**步骤：**
1. 在 Activities 页面的 Recently Work 中，点击刚创建的 "My First Quiz" 卡片
2. 应该进入编辑页面，且所有数据都应该被加载：
   - 草稿名字：**"My First Quiz"**
   - 有 2 个问题的缩略图
   - 主区域显示第一个问题：**"What is OOP?"**
3. 修改第一个问题为：**"What is SOLID principle?"**
4. 点击 **"Save"** 按钮
5. 返回 Activities 页面

**预期结果：**
- ✅ 数据成功加载（不是空白状态）
- ✅ 修改已保存成功
- ✅ Recently Work 中的缩略图已更新为：**"What is SOLID principle?"**

### 测试 3：创建并保存一个 Open-ended Question

**步骤：**
1. Activities 页面 → 点击 "Open-ended Question" 卡片
2. 修改草稿名字为：**"Student Feedback"**
3. 在主区域输入问题：**"What did you learn from this course?"**
4. 点击 **"Save"** 按钮

**预期结果：**
- ✅ Recently Work 显示新活动
- ✅ 卡片显示：
  - 标题：**"Student Feedback"**
  - 类型：**"Open-ended Question"**
  - 缩略图：**"What did you learn from this course?"**

### 测试 4：空状态提示

**步骤：**
1. Activities 页面 → 点击任意活动类型创建新活动
2. 在左侧不添加任何内容，直接查看右侧主区域

**预期结果：**
- ✅ 右侧主区域显示：
  - 📝 图标
  - **"Enter your question here"** (或相应的提示文本)
  - 无任何真实的问题内容显示

### 测试 5：多问题管理

**步骤：**
1. 创建一个 Quiz
2. 添加 5 个问题（通过左侧 "Add" 按钮）
3. 点击不同的缩略图切换问题
4. 每个问题应该显示独立的内容
5. 删除中间的一个问题（点击 X 按钮）

**预期结果：**
- ✅ 所有问题都能正确管理
- ✅ 问题切换流畅
- ✅ 删除后列表更新

### 测试 6：localStorage 数据验证

**步骤：**
1. 创建并保存任何活动
2. 打开浏览器开发者工具 (F12)
3. 进入 Application/Storage → LocalStorage
4. 查找 "activities" 键

**预期结果：**
- ✅ 存在 "activities" 键
- ✅ 值是一个 JSON 数组
- ✅ 数组包含所有已保存的活动对象
- ✅ 每个活动对象包含：id, title, type, activityType, edited, thumbnail, questions/slides

**localStorage 数据结构示例：**
```json
[
  {
    "id": "activity_1699999999999",
    "title": "My First Quiz",
    "type": "Classroom Quiz",
    "activityType": "quiz",
    "edited": "Just now",
    "thumbnail": "What is OOP?",
    "questions": [
      { "id": 1, "text": "What is OOP?", "type": "short-answer" },
      { "id": 2, "text": "What is inheritance?", "type": "multiple-choice" }
    ]
  }
]
```

---

## 代码注释位置参考

### Quiz.tsx
- **行 51-74**: 初始化加载数据的 useEffect (标注了后端集成 TODO)
- **行 95-128**: handleSave 函数 (标注了后端集成 TODO)

### OpenQuestion.tsx
- **行 24-47**: 初始化加载数据的 useEffect (标注了后端集成 TODO)
- **行 82-114**: handleSave 函数 (标注了后端集成 TODO)

### Activities.tsx
- **行 23-32**: 初始化加载活动列表的 useEffect (标注了后端集成 TODO)

所有标有 "TODO: 后端集成" 的位置都清晰地说明了需要替换为什么后端 API。

---

## 快速集成检查清单

当准备集成后端时，逐一检查：

- [ ] Quiz.tsx 第 51-74 行：添加 GET /api/activities/{id}
- [ ] Quiz.tsx 第 95-128 行：添加 POST/PUT /api/activities
- [ ] OpenQuestion.tsx 第 24-47 行：添加 GET /api/activities/{id}
- [ ] OpenQuestion.tsx 第 82-114 行：添加 POST/PUT /api/activities
- [ ] Activities.tsx 第 23-32 行：添加 GET /api/activities
- [ ] 测试所有 CRUD 操作
- [ ] 测试错误处理和网络超时
- [ ] 验证认证/授权工作正常

---

## 常见问题排查

### Q: 编辑页面打开时没有加载数据？
**A:** 检查：
1. URL 是否包含 `id` 和 `mode=edit` 参数
2. localStorage 中是否存在该 id 的活动
3. 浏览器控制台是否有错误

### Q: Save 按钮没有工作？
**A:** 检查：
1. 是否至少输入了一个问题内容
2. 浏览器控制台是否有 JavaScript 错误
3. localStorage 是否启用

### Q: Recently Work 显示空白？
**A:** 检查：
1. 是否已保存任何活动
2. 打开浏览器开发者工具，查看 localStorage 中是否有 "activities" 键
3. 刷新页面

---

## 后续优化建议

- [ ] 添加加载状态 spinner
- [ ] 添加保存成功提示
- [ ] 添加确认对话框用于删除活动
- [ ] 添加草稿自动保存功能
- [ ] 添加活动分享功能
- [ ] 添加活动版本历史
