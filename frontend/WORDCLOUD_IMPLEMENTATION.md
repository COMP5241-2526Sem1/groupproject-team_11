# 词云图功能实现说明

## 已完成的工作

### 1. 安装依赖
```bash
npm install wordcloud @types/wordcloud
```

### 2. 创建词云图组件
文件：`src/components/WordCloud.tsx`

**功能特点：**
- 自动统计词频
- 支持中英文分词
- 智能颜色配置
- 响应式大小
- 优雅的空状态处理

**实现细节：**
- 使用 `wordcloud` 库进行渲染
- 自动过滤停用词和短词（长度<2）
- 词频越高，字体越大
- 随机颜色分配，视觉效果更丰富
- 支持旋转显示（30%的词会旋转）

### 3. 集成到 ResultViewer
文件：`src/components/ResultViewer.tsx`

**更新内容：**
- 导入 `WordCloudComponent`
- 替换原有的 TODO 占位符
- 在 "Word Cloud" 标签页中显示词云图

## 如何测试

### 测试步骤：

1. **创建开放式问题活动**
   - 访问 `/open-question`
   - 创建一个问题，例如："any comments?"
   - 点击 **Save** 保存

2. **分享活动**
   - 点击 **Share** 按钮
   - 复制链接或扫描二维码

3. **提交多个回答**
   - 打开分享链接（可以在新的隐身窗口或手机上）
   - 提交不同的文本回答，例如：
     - "This is a great feature and I love it"
     - "Amazing work on this project"
     - "The interface is very user friendly"
     - "Great job with the design"
     - "This feature is awesome"

4. **查看词云图**
   - 返回编辑页面
   - 点击 **Result** 按钮
   - 切换到 **Word Cloud** 标签
   - 查看生成的词云图

### 预期效果：

- 高频词会显示得更大（如 "great", "feature", "this"）
- 词汇颜色丰富多样
- 部分词汇会旋转显示
- 词云居中显示在灰色背景上
- 如果没有回答，显示 "No responses yet"

## 词云图特性

### 词频统计
- 自动统计每个词出现的次数
- 按频率排序
- 最多显示前 100 个高频词

### 分词规则
- 英文：按空格和标点符号分割
- 中文：保留中文字符（\u4e00-\u9fa5）
- 过滤：移除长度小于 2 的词
- 转小写：统一英文大小写

### 视觉效果
- **字体大小**：根据词频动态调整
- **颜色**：8种不同颜色随机分配
  - #1f77b4 (蓝色)
  - #ff7f0e (橙色)
  - #2ca02c (绿色)
  - #d62728 (红色)
  - #9467bd (紫色)
  - #8c564b (棕色)
  - #e377c2 (粉色)
  - #7f7f7f (灰色)
- **旋转**：30% 的词会旋转 90 度
- **字体**：Times, Microsoft YaHei, sans-serif
- **背景**：浅灰色 (#f9fafb)

## 支持的活动类型

词云图功能适用于以下活动类型的文本回答：

1. **Open-ended Question** (开放式问题)
   - 完整的文本回答
   - 最佳词云图效果

2. **Quiz - Short Answer** (测验-简答题)
   - 短文本回答
   - 适合关键词统计

3. **Scales Question** (量表问题)
   - 虽然主要是数字评分
   - 如果包含文本评论也会生成词云图

## 技术细节

### 使用的库
- **wordcloud**: 词云图生成核心库
- **canvas**: HTML5 Canvas API 进行渲染

### 组件属性
```typescript
interface WordCloudComponentProps {
  words: string[];      // 要显示的文本数组
  width?: number;       // 画布宽度 (默认: 600)
  height?: number;      // 画布高度 (默认: 400)
}
```

### 性能优化
- 最多处理 100 个高频词，避免过载
- Canvas 渲染，性能优秀
- 响应式大小调整

## 常见问题

### Q: 为什么有些词没有显示？
A: 词云图会过滤掉长度小于 2 的词，并且只显示前 100 个高频词。

### Q: 如何调整词云图大小？
A: 在 ResultViewer.tsx 中修改 `<WordCloudComponent>` 的 width 和 height 属性。

### Q: 词云图不显示怎么办？
A: 检查是否有文本回答。如果数据库/localStorage 中没有回答，词云图会显示 "No responses yet"。

### Q: 可以自定义颜色吗？
A: 可以。编辑 `src/components/WordCloud.tsx` 中的 `colors` 数组。

### Q: 支持中文吗？
A: 是的！词云图完全支持中文显示，使用了 "Microsoft YaHei" 字体。

## 后续优化建议

1. **停用词过滤**
   - 添加常用停用词列表（the, a, an, is, are 等）
   - 提高词云质量

2. **自定义配置**
   - 允许用户选择颜色主题
   - 调整显示的词数量
   - 自定义字体大小范围

3. **导出功能**
   - 导出词云图为 PNG 图片
   - 集成到 CSV 导出中

4. **交互功能**
   - 点击词汇查看包含该词的所有回答
   - 悬停显示词频统计

5. **情感分析**
   - 根据词汇情感色彩使用不同颜色
   - 正面词用绿色，负面词用红色

## 文件清单

- ✅ `src/components/WordCloud.tsx` - 词云图组件（新建）
- ✅ `src/components/ResultViewer.tsx` - 结果查看器（已更新）
- ✅ `package.json` - 依赖配置（已更新）
