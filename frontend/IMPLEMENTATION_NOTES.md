# 分享和结果统计功能实现说明

## 已完成的修改

### 1. 新建组件

#### QRCodeGenerator.tsx
- 二维码生成组件
- 使用 qrcode 库生成二维码

#### MobileResponse.tsx
- 手机端答题界面
- 支持所有题型（选择题、简答题、量表题等）
- 响应式设计，适配移动端
- 提交答案到 localStorage（后端集成时需替换）

#### ResultViewer.tsx
- 结果统计查看组件
- 支持图表展示（柱状图、饼图）
- 开放题支持词云图和列表展示
- 可导出 CSV 格式结果

### 2. 修改的文件

#### Quiz.tsx
- 添加 Share 功能：生成分享链接和二维码
- 添加 Result 功能：查看答题统计结果
- Share Dialog：显示链接和二维码
- 集成 ResultViewer 组件

#### OpenQuestion.tsx
- 添加 Share 和 Result 功能
- 相同的分享和结果查看逻辑

#### ScalesQuestion.tsx
- 需要添加相同的 Share 和 Result 功能
- （部分代码已添加导入，需要继续完成）

### 3. 后端接口标记

所有需要后端集成的地方都有 TODO 注释标记：

```typescript
// TODO: 后端集成 - 替换为后端 API 调用
// 后端接口: POST /api/activities/{activityId}/share
// 请求体: { title, questions, type }
// 返回: { shareLink, qrCode }
```

## 需要安装的依赖

```bash
npm install qrcode
npm install @types/qrcode --save-dev
npm install recharts
npm install react-wordcloud  # 可选，用于词云图
```

## 需要添加的路由

在 `src/App.tsx` 或路由配置文件中添加：

```typescript
import MobileResponse from "./pages/MobileResponse";

// 在路由配置中添加
<Route path="/response/:activityId" element={<MobileResponse />} />
```

## 后端 API 接口设计

### 1. 分享活动
```
POST /api/activities/{activityId}/share
Request Body: {
  title: string,
  questions: Question[],
  type: string
}
Response: {
  shareLink: string,
  qrCodeUrl: string  // 可选
}
```

### 2. 获取答题界面数据
```
GET /api/activities/share/{activityId}
Response: {
  id: string,
  title: string,
  type: string,
  questions: Question[]
}
```

### 3. 提交答案
```
POST /api/activities/share/{activityId}/responses
Request Body: {
  answers: { [questionId]: answer },
  submittedAt: number
}
Response: {
  success: boolean,
  responseId: string
}
```

### 4. 获取结果统计
```
GET /api/activities/{activityId}/results
Response: {
  responses: Response[],
  statistics: {
    [questionId]: {
      type: string,
      data: any[],
      totalResponses: number
    }
  }
}
```

### 5. 导出结果
```
GET /api/activities/{activityId}/export
Response: CSV 或 Excel 文件
```

## OpinionPoll 二维码功能

需要在 OpinionPoll.tsx 中添加类似的二维码查看功能：

在现有的 Copy Link 按钮旁边添加"View QR Code"按钮，点击后显示二维码对话框。

## 本地测试

当前所有功能使用 localStorage 实现，可以本地测试：

1. 创建一个活动（Quiz/OpenQuestion/ScalesQuestion）
2. 保存后点击 Share 按钮
3. 复制链接或扫描二维码
4. 在手机或新窗口打开链接答题
5. 提交答案后点击 Result 查看统计结果

## 词云图集成（可选）

如果需要为开放题添加词云图功能，可以使用 `react-wordcloud` 库：

```typescript
import ReactWordcloud from 'react-wordcloud';

// 在 ResultViewer.tsx 的 wordcloud tab 中使用
<ReactWordcloud 
  words={wordCloudData} 
  options={{
    rotations: 2,
    rotationAngles: [-90, 0],
  }}
/>
```

需要处理文本分词和词频统计。

## 注意事项

1. 所有后端集成点都有 TODO 注释标记
2. 手机端界面已做响应式适配
3. 二维码生成使用 canvas，确保浏览器支持
4. 结果统计图表使用 recharts 库
5. CSV 导出功能使用简单的文本拼接，可根据需要优化

## 下一步工作

1. 完成 ScalesQuestion.tsx 的完整 Share 和 Result 功能
2. 为 OpinionPoll 添加二维码查看按钮
3. 集成词云图库（可选）
4. 后端 API 开发和集成
5. 测试和优化用户体验
