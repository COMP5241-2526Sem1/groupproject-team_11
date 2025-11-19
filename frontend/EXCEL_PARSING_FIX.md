# Excel 解析问题修复说明

## 问题原因

之前的代码只支持以下列名格式：
- `StudentID` 或 `学号`
- `TotalScore` 或 `总分`
- `Q1`, `Q2`, `Q3` 或 `题目1`, `题目2`, `题目3`

但是用户的 Excel 文件使用的是：
- `student_id`
- `total_score`
- `question_1`, `question_2`, `question_3`

## 修复内容

### 1. 更新列名匹配逻辑

现在支持多种列名格式：

**学号列：**
- `student_id` ✅ (新增支持)
- `StudentID`
- `学号`

**总分列：**
- `total_score` ✅ (新增支持)
- `TotalScore`
- `总分`

**题目列：**
- `question_1`, `question_2`, ... ✅ (新增支持，使用 `startsWith("question_")`)
- `Q1`, `Q2`, ... (使用正则 `/^Q\d+$/`)
- `题目1`, `题目2`, ... (使用 `startsWith("题目")`)

### 2. 添加调试日志

在控制台输出解析后的数据，帮助调试：
```javascript
console.log("Parsed data:", parsedData);
console.log("Sample row:", parsedData[0]);
console.log("Statistics:", stats);
```

### 3. 更新格式说明

在上传界面显示了两种示例格式：
- **Example 1**: 使用 `student_id`, `total_score`, `question_1` (推荐格式)
- **Example 2**: 使用 `StudentID`, `TotalScore`, `Q1` (替代格式)

## 测试方法

### 1. 准备测试数据

使用你提供的 Excel 文件，格式如下：

| student_id | total_score | question_1 | question_2 | question_3 |
|------------|-------------|------------|------------|------------|
| 12         | 60          | 10         | 0          | 50         |
| 13         | 80          | 20         | 0          | 60         |
| 14         | 70          | 30         | 10         | 30         |
| 15         | 70          | 40         | 10         | 20         |
| 16         | 60          | 50         | 0          | 10         |

### 2. 上传并验证

1. 访问课程详情页
2. 点击 "Learning situation"
3. 选择 Assignment 或 Quiz
4. 选择要查看的项目
5. 点击 "Upload Excel" 上传文件
6. 打开浏览器控制台 (F12)
7. 查看解析日志

### 3. 预期结果

**控制台输出：**
```javascript
Parsed data: [
  {
    studentId: "12",
    totalScore: 60,
    questionScores: { question_1: 10, question_2: 0, question_3: 50 }
  },
  {
    studentId: "13",
    totalScore: 80,
    questionScores: { question_1: 20, question_2: 0, question_3: 60 }
  },
  // ...
]

Statistics: {
  max: 80,
  min: 60,
  median: 70,
  average: 68,
  distribution: [
    { range: "0-59", count: 0 },
    { range: "60-69", count: 3 },
    { range: "70-79", count: 2 },
    { range: "80-89", count: 0 },
    { range: "90-100", count: 0 }
  ]
}
```

**页面显示：**
- 柱状图显示分数分布
- 最高分: 80
- 最低分: 60
- 中位数: 70
- 平均分: 68

**AI 分析：**
- 显示错误最多的题目
- 显示满分最多的题目
- 提供改进建议

## 调试技巧

如果统计结果还是不对：

1. **检查控制台日志**
   ```
   F12 → Console
   查看 "Parsed data" 和 "Statistics" 输出
   ```

2. **验证列名**
   - 确保 Excel 第一行是列名
   - 列名不能有空格（如 `total score` 应该是 `total_score`）
   - 列名大小写敏感

3. **验证数据类型**
   - 确保所有分数都是数字，不是文本
   - Excel 中选中数据列，检查格式是否为"数字"

4. **检查空值**
   - 空单元格会被解析为 0
   - 确保没有意外的空值

## 兼容性

现在支持的所有列名格式：

| 列类型 | 支持的列名 |
|--------|-----------|
| 学号   | `student_id`, `StudentID`, `学号` |
| 总分   | `total_score`, `TotalScore`, `总分` |
| 题目   | `question_1`, `question_2`, ...<br>`Q1`, `Q2`, ...<br>`题目1`, `题目2`, ... |

## 常见问题

### Q: 为什么我的数据没有正确解析？
A: 检查列名是否完全匹配支持的格式，注意下划线和大小写。

### Q: 如何查看解析后的原始数据？
A: 打开浏览器控制台 (F12)，上传文件后会自动输出日志。

### Q: 可以同时使用不同的列名格式吗？
A: 可以！例如学号用 `student_id`，总分用 `TotalScore` 都可以。

### Q: 题目列必须连续编号吗？
A: 不需要，只要列名符合格式（如 `question_1`, `question_5`, `question_10`）都会被识别。

## 文件位置

修改的文件：
- `src/components/GradeAnalysis.tsx` (第 143-172 行)
  - 更新了列名匹配逻辑
  - 添加了调试日志
  - 更新了格式说明界面
