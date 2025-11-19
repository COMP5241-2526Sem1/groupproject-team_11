# 分享链接和移动响应页面更新

## 更新日期
2025年11月18日

## 更新概述
统一了所有活动类型的分享链接格式，并更新了移动响应页面以支持所有活动类型（Quiz、Opinion Poll、Open Question、Scales Question）。

## 主要更改

### 1. ScalesQuestion.tsx
- **更新分享功能**: 移除了对后端 `/api/scales-questions/{id}/share` 接口的调用
- **统一链接格式**: 使用 `/response/{activityId}` 格式生成分享链接
- **简化流程**: 直接在前端生成分享链接和二维码，无需等待后端响应

**关键代码**:
```typescript
const handleShare = async () => {
  if (!activityId) {
    alert("Please save the question first");
    return;
  }
  
  // 直接生成前端移动响应页面链接,不需要调用后端
  const frontendUrl = window.location.origin;
  const link = `${frontendUrl}/response/${activityId}`;
  setShareLink(link);
  setShareDialogOpen(true);
  
  // 添加到本地 activityLog
  // ...
};
```

### 2. OpinionPoll.tsx
- **添加 Share2 图标导入**: 从 lucide-react 导入
- **更新分享链接格式**: 所有 Opinion Poll 的分享链接改为 `/response/{id}` 格式
- **简化分享UI**: 合并了 Copy Link 和 QR Code 按钮为单一的 "QR Code & Link" 按钮
- **更新多处链接生成**:
  - `loadPolls` 函数中的 shareLink 生成
  - `generateShareLink` 函数
  - `handlePublishPoll` 函数中的 shareLink 设置

**关键更改**:
```typescript
// 更新 generateShareLink 函数
const generateShareLink = (pollId: string) => {
  return `${window.location.origin}/response/${pollId}`;
};

// 更新 loadPolls 中的 shareLink
shareLink: `${window.location.origin}/response/${poll.id}`,

// 简化分享按钮
<Button
  variant="outline"
  size="sm"
  onClick={() => handleViewQR(poll.shareLink)}
  className="gap-2"
>
  <Share2 className="h-4 w-4" />
  QR Code & Link
</Button>
```

### 3. MobileResponse.tsx
这是最重要的更新，使移动响应页面能够处理所有活动类型。

#### 3.1 多类型活动加载
- **增强 useEffect**: 尝试从不同的 API 端点加载活动数据
- **支持的活动类型**:
  1. Quiz - `GET /api/classroom_quiz/{id}`
  2. Opinion Poll - `GET /api/polls` (从列表中查找)
  3. Open Question - `GET /api/open-questions/{id}`
  4. Scales Question - `GET /api/scales-questions/{id}`

**关键代码**:
```typescript
useEffect(() => {
  const loadActivity = async () => {
    if (!activityId) {
      setIsLoading(false);
      return;
    }

    try {
      let data = null;
      let activityType = '';

      // 1. 尝试加载 Quiz
      try {
        const response = await fetch(`http://localhost:3000/api/classroom_quiz/${activityId}`);
        if (response.ok) {
          data = await response.json();
          activityType = 'quiz';
        }
      } catch (error) {
        console.log('Not a quiz');
      }

      // 2. 尝试加载 Opinion Poll
      if (!data) {
        try {
          const response = await fetch(`http://localhost:3000/api/polls`);
          if (response.ok) {
            const pollsData = await response.json();
            const poll = pollsData.polls?.find((p: any) => p.id === activityId);
            if (poll) {
              data = poll;
              activityType = 'opinion-poll';
            }
          }
        } catch (error) {
          console.log('Not an opinion poll');
        }
      }

      // ... 类似的逻辑处理其他类型

      if (data) {
        // 根据活动类型格式化数据
        let formattedActivity: Activity;
        // ... 格式化逻辑
        setActivity(formattedActivity);
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  loadActivity();
}, [activityId]);
```

#### 3.2 多类型答案提交
- **根据活动类型调用不同的 API**:
  - Quiz: `POST /api/classroom_quiz/{id}/responses`
  - Opinion Poll: `POST /api/polls/{id}/responses`
  - Open Question: `POST /api/open-questions/{id}/responses`
  - Scales Question: `POST /api/scales-questions/{id}/responses`

**关键代码**:
```typescript
const handleSubmit = async () => {
  if (!studentName.trim()) {
    alert("Please enter your name");
    return;
  }

  if (!activity) {
    alert("Activity not found");
    return;
  }

  try {
    let response;

    if (activity.activityType === 'quiz') {
      // Quiz submission
      const formattedAnswers = Object.entries(answers).map(/*...*/);
      response = await fetch(`http://localhost:3000/api/classroom_quiz/${activityId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: activityId,
          studentName: studentName.trim(),
          answers: formattedAnswers,
          submittedAt: Math.floor(Date.now() / 1000),
        }),
      });
    } else if (activity.activityType === 'opinion-poll') {
      // Opinion Poll submission
      const formattedAnswers = Object.entries(answers).map(/*...*/);
      response = await fetch(`http://localhost:3000/api/polls/${activityId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondentId: `student_${Date.now()}`,
          respondentName: studentName.trim(),
          answers: formattedAnswers,
          submittedAt: Date.now(),
          isAnonymous: false,
        }),
      });
    }
    // ... 其他类型的处理

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success) {
      setIsSubmitted(true);
    }
  } catch (error) {
    console.error('Error submitting response:', error);
    alert('Failed to submit response. Please try again later.');
  }
};
```

#### 3.3 支持更多问题类型
- **新增问题类型渲染**:
  - `text` - 文本输入（Opinion Poll）
  - `single` - 单选（Opinion Poll）
  - `multiple` - 多选（Opinion Poll）
  - `scale` - 量表（Opinion Poll）

**关键代码**:
```typescript
{/* Multiple Choice (multiple answers) - for Opinion Poll */}
{currentQuestion.type === "multiple" && (
  <div className="space-y-3">
    {(currentQuestion.options || []).map((option, index) => (
      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
        <input
          type="checkbox"
          id={`option-${index}`}
          checked={(answers[currentQuestion.id] || []).includes(index)}
          onChange={(e) => {
            const currentAnswers = answers[currentQuestion.id] || [];
            if (e.target.checked) {
              handleAnswerChange(currentQuestion.id, [...currentAnswers, index]);
            } else {
              handleAnswerChange(currentQuestion.id, currentAnswers.filter((i: number) => i !== index));
            }
          }}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
          {option}
        </Label>
      </div>
    ))}
  </div>
)}

{/* Scales - with default options */}
{(currentQuestion.type === "scales-question" || 
  currentQuestion.type === "scale" ||
  activity.activityType === "scales-question") && (
  <div className="space-y-3">
    {(currentQuestion.scaleOptions || [
      { id: 1, label: "1", value: 1 },
      { id: 2, label: "2", value: 2 },
      { id: 3, label: "3", value: 3 },
      { id: 4, label: "4", value: 4 },
      { id: 5, label: "5", value: 5 },
    ]).map((option) => (
      <Button
        key={option.id}
        variant={answers[currentQuestion.id] === option.value ? "default" : "outline"}
        className="w-full justify-start h-auto py-4"
        onClick={() => handleAnswerChange(currentQuestion.id, option.value)}
      >
        <span className="font-bold mr-3">{option.value}</span>
        <span>{option.label}</span>
      </Button>
    ))}
  </div>
)}
```

### 4. QRCodeGenerator.tsx
- 无需更改，已经能够根据传入的 value 生成二维码

## 使用流程

### 教师端
1. 创建任意类型的活动（Quiz、Opinion Poll、Open Question、Scales Question）
2. 保存活动后，点击 "Share" 按钮
3. 系统自动生成统一格式的分享链接：`https://your-domain/response/{activityId}`
4. 显示二维码和链接，可以复制链接或让学生扫描二维码

### 学生端
1. 通过分享链接或扫描二维码访问 `/response/{activityId}`
2. 系统自动识别活动类型并加载相应数据
3. 根据问题类型渲染不同的输入界面：
   - 短答题：文本框
   - 单选题：单选按钮
   - 多选题：复选框
   - 判断题：True/False 按钮
   - 量表题：量表按钮
4. 填写完成后提交答案
5. 系统根据活动类型调用对应的 API 提交数据

## API 端点总结

### 加载活动数据
- Quiz: `GET /api/classroom_quiz/{id}`
- Opinion Poll: `GET /api/polls` (从列表中查找)
- Open Question: `GET /api/open-questions/{id}`
- Scales Question: `GET /api/scales-questions/{id}`

### 提交答案
- Quiz: `POST /api/classroom_quiz/{id}/responses`
- Opinion Poll: `POST /api/polls/{id}/responses`
- Open Question: `POST /api/open-questions/{id}/responses`
- Scales Question: `POST /api/scales-questions/{id}/responses`

## 测试建议

### 1. 分享功能测试
- [ ] 创建一个 Quiz，点击 Share，确认链接格式为 `/response/{id}`
- [ ] 创建一个 Opinion Poll，点击 Share，确认链接格式正确
- [ ] 创建一个 Open Question，点击 Share，确认链接格式正确
- [ ] 创建一个 Scales Question，点击 Share，确认链接格式正确

### 2. 移动响应页面测试
- [ ] 打开 Quiz 的分享链接，确认能正确加载并显示题目
- [ ] 打开 Opinion Poll 的分享链接，确认能正确加载并显示题目
- [ ] 打开 Open Question 的分享链接，确认能正确加载并显示题目
- [ ] 打开 Scales Question 的分享链接，确认能正确加载并显示题目

### 3. 答案提交测试
- [ ] 在 Quiz 响应页面填写答案并提交，确认后端接收正确
- [ ] 在 Opinion Poll 响应页面：
  - [ ] 测试单选题提交
  - [ ] 测试多选题提交
  - [ ] 测试文本题提交
  - [ ] 测试量表题提交
- [ ] 在 Open Question 响应页面填写答案并提交
- [ ] 在 Scales Question 响应页面选择量表并提交

### 4. 二维码测试
- [ ] 生成二维码，用手机扫描，确认能够正确跳转
- [ ] 在移动设备上打开链接，确认页面适配良好
- [ ] 在移动设备上填写并提交答案

## 注意事项

1. **链接格式统一**: 所有活动类型都使用 `/response/{activityId}` 格式，确保一致性
2. **活动ID唯一性**: 不同活动类型的ID必须唯一，否则可能导致加载错误的活动类型
3. **错误处理**: MobileResponse 会依次尝试所有活动类型的API，如果都失败会显示 "Activity not found"
4. **数据格式**: 确保后端API返回的数据格式与前端期望的格式一致
5. **时间戳格式**: 
   - Quiz 使用秒级时间戳
   - 其他活动类型使用毫秒级时间戳
6. **答案格式**: 不同活动类型的答案提交格式不同，需要在 handleSubmit 中正确转换

## 后续优化建议

1. **性能优化**: 可以考虑在 URL 中添加活动类型参数，避免尝试多个API端点
   - 例如: `/response/{activityType}/{activityId}`
   
2. **统一后端接口**: 建议后端提供一个统一的活动查询接口
   - 例如: `GET /api/activities/{id}` 返回任意类型的活动数据
   
3. **缓存机制**: 对已加载的活动数据进行缓存，减少重复请求

4. **离线支持**: 考虑添加 Service Worker 支持离线访问

5. **实时更新**: 对于 Opinion Poll，可以考虑添加 WebSocket 支持实时查看回答统计

## 相关文件

- `src/pages/ScalesQuestion.tsx` - Scales Question 分享功能更新
- `src/pages/OpinionPoll.tsx` - Opinion Poll 分享功能更新
- `src/pages/MobileResponse.tsx` - 移动响应页面多类型支持
- `src/components/QRCodeGenerator.tsx` - 二维码生成组件（无需更改）

## 更新完成 ✅

所有更改已完成并通过编译检查，没有错误。现在可以进行测试了。
