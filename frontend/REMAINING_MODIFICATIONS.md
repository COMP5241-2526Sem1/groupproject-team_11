# ScalesQuestion.tsx 和 OpinionPoll.tsx 补充修改

## ScalesQuestion.tsx 需要添加的代码

### 1. 在 handleSave 函数后添加以下三个函数：

```typescript
const handleShare = () => {
  // TODO: 后端集成 - POST /api/activities/{activityId}/share
  
  if (!activityId) {
    alert("Please save the scale question first");
    return;
  }
  
  const link = `${window.location.origin}/response/${activityId}`;
  setShareLink(link);
  setShareDialogOpen(true);
};

const handleViewResults = () => {
  // TODO: 后端集成 - GET /api/activities/{activityId}/results
  
  if (!activityId) {
    alert("Please save the scale question first");
    return;
  }
  
  setShowResults(true);
};

const copyLink = () => {
  navigator.clipboard.writeText(shareLink);
  alert("Link copied to clipboard!");
};
```

### 2. 修改 handleSave 函数中的 id 逻辑：

```typescript
const handleSave = () => {
  const activities = JSON.parse(localStorage.getItem("activities") || "[]");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || `activity_${Date.now()}`;
  const activityIndex = activities.findIndex((a: any) => a.id === id);
  
  const newActivity = {
    id: id,  // 改为使用 id 变量
    title: draftName,
    type: "Scales Question",
    activityType: "scales-question",
    edited: Date.now(),
    thumbnail: slides[0]?.text || "Untitled Scale",
    slides: slides,
  };

  if (activityIndex >= 0) {
    activities[activityIndex] = newActivity;
  } else {
    activities.push(newActivity);
  }

  localStorage.setItem("activities", JSON.stringify(activities));
  setActivityId(id);  // 添加这行
};
```

### 3. 在 return 语句开始处添加 ResultViewer：

```typescript
return (
  <>
    {/* Results Viewer */}
    {showResults && activityId && (
      <ResultViewer
        activityId={activityId}
        activity={{
          id: activityId,
          title: draftName,
          type: "Scales Question",
          activityType: "scales-question",
          slides: slides,
        }}
        onClose={() => setShowResults(false)}
      />
    )}

    <div className={`p-8 transition-all duration-300 ${isAIOpen ? "pr-[416px]" : ""}`}>
    ...
```

### 4. 更新 Share 和 Result 按钮：

找到这两行：
```typescript
<Button variant="outline">Share</Button>
<Button variant="outline">Result</Button>
```

替换为：
```typescript
<Button variant="outline" className="gap-2" onClick={handleShare}>
  <Share2 className="h-4 w-4" />
  Share
</Button>
<Button variant="outline" className="gap-2" onClick={handleViewResults}>
  <BarChart className="h-4 w-4" />
  Result
</Button>
```

### 5. 在文件末尾 AIAssistantPanel 之前添加 Share Dialog：

```typescript
{/* Share Dialog */}
<Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Share Scale Question</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Share Link</label>
        <div className="flex gap-2">
          <Input value={shareLink} readOnly className="flex-1" />
          <Button onClick={copyLink} variant="outline">Copy</Button>
        </div>
      </div>
      <div className="text-center">
        <label className="text-sm font-medium mb-2 block">QR Code</label>
        <div className="inline-block p-4 bg-white border rounded-lg">
          <QRCodeGenerator value={shareLink} size={200} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Scan this QR code to access the scale question
        </p>
      </div>
    </div>
  </DialogContent>
</Dialog>

{/* AI Assistant Panel */}
<AIAssistantPanel ...
```

## OpinionPoll.tsx 需要添加的二维码功能

### 1. 在文件顶部添加导入：

```typescript
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { QrCode } from "lucide-react";
```

### 2. 在组件状态中添加：

```typescript
const [qrDialogOpen, setQrDialogOpen] = useState(false);
const [selectedPollForQR, setSelectedPollForQR] = useState<OpinionPoll | null>(null);
```

### 3. 找到 Copy Link 按钮的位置（大约在 Poll share link 部分）：

```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => copyLink(poll.shareLink)}
  className="gap-2"
>
  <Copy className="h-4 w-4" />
  Copy
</Button>
```

在这个按钮后面添加 QR Code 按钮：

```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => {
    setSelectedPollForQR(poll);
    setQrDialogOpen(true);
  }}
  className="gap-2"
>
  <QrCode className="h-4 w-4" />
  QR Code
</Button>
```

### 4. 在文件末尾 AIAssistantPanel 之前添加 QR Dialog：

```typescript
{/* QR Code Dialog */}
<Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Poll QR Code</DialogTitle>
    </DialogHeader>
    {selectedPollForQR && (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="font-semibold mb-2">{selectedPollForQR.title}</h3>
          <div className="inline-block p-4 bg-white border rounded-lg">
            <QRCodeGenerator value={selectedPollForQR.shareLink} size={250} />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Scan this QR code to access the poll
          </p>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Share Link</label>
          <div className="flex gap-2">
            <Input value={selectedPollForQR.shareLink} readOnly className="flex-1" />
            <Button 
              onClick={() => copyLink(selectedPollForQR.shareLink)} 
              variant="outline"
            >
              Copy
            </Button>
          </div>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

{/* AI Assistant Panel */}
<AIAssistantPanel ...
```

## 安装必要的依赖

在项目根目录运行：

```bash
npm install qrcode @types/qrcode recharts
```

## 添加路由

在 `src/App.tsx` 或主路由文件中添加：

```typescript
import MobileResponse from "./pages/MobileResponse";

// 在路由配置中
<Route path="/response/:activityId" element={<MobileResponse />} />
```

## 测试步骤

1. 保存任意活动（Quiz/OpenQuestion/ScalesQuestion）
2. 点击 Share 按钮，查看生成的链接和二维码
3. 复制链接或用手机扫描二维码
4. 在新窗口/手机上打开链接并填写答案
5. 提交答案后返回原页面
6. 点击 Result 按钮查看统计结果
7. 对于 OpinionPoll，点击 QR Code 按钮查看二维码

## 后续优化建议

1. 添加词云图库用于开放题结果展示
2. 优化移动端答题界面的用户体验
3. 添加实时更新功能（WebSocket）
4. 添加答题进度保存功能
5. 优化结果导出格式（Excel）
6. 添加多语言支持
