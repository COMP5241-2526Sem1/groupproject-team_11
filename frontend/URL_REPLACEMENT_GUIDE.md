# URL替换指南

本文档说明了如何将项目中所有硬编码的URL替换为使用环境变量。

## 已配置的环境变量

### `.env.production`（生产环境）
```
VITE_API_URL=http://49.232.227.144:5000/api
VITE_BASE_URL=http://49.232.227.144:5000
VITE_FRONTEND_URL=http://49.232.227.144
```

### `.env.development`（开发环境）
```
VITE_API_URL=http://localhost:3000/api
VITE_BASE_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:8080
```

## 替换规则

### 1. API调用（后端接口）
**原代码：**
```typescript
fetch("http://localhost:3000/api/xxx")
```

**新代码：**
```typescript
import { getApiUrl } from "@/services/urlConfig";
fetch(getApiUrl("/xxx"))
```

或直接使用：
```typescript
import { API_BASE_URL } from "@/services/api";
fetch(`${API_BASE_URL}/xxx`)
```

### 2. 文件上传/下载
**原代码：**
```typescript
fetch("http://localhost:3000/upload/xxx")
```

**新代码：**
```typescript
import { getBaseUrl } from "@/services/urlConfig";
fetch(getBaseUrl("/upload/xxx"))
```

或直接使用：
```typescript
import { BASE_URL } from "@/services/api";
fetch(`${BASE_URL}/upload/xxx`)
```

### 3. 生成分享链接
**原代码：**
```typescript
const shareUrl = `${window.location.origin}/response/${id}`;
```

**新代码：**
```typescript
import { getShareUrl } from "@/services/urlConfig";
const shareUrl = getShareUrl(`/response/${id}`);
```

或直接使用：
```typescript
import { FRONTEND_URL } from "@/services/api";
const shareUrl = `${FRONTEND_URL}/response/${id}`;
```

## 需要替换的文件列表

根据搜索结果，以下文件需要替换：

### 高优先级（包含分享链接生成）
- [ ] `src/pages/OpinionPoll.tsx` - 投票分享链接
- [ ] `src/pages/Quiz.tsx` - 测验分享链接
- [ ] `src/pages/ScalesQuestion.tsx` - 量表问卷分享链接
- [ ] `src/pages/OpenQuestion.tsx` - 开放问题分享链接

### 中优先级（API调用）
- [ ] `src/pages/Homepage.tsx`
- [ ] `src/pages/Activities.tsx`
- [ ] `src/pages/Courses.tsx`
- [ ] `src/pages/CourseDetail.tsx`
- [ ] `src/pages/Discussion.tsx`
- [ ] `src/pages/AIAssistant.tsx`
- [ ] `src/pages/MindMap.tsx`
- [ ] `src/pages/RandomRollCall.tsx`
- [ ] `src/pages/RandomSort.tsx`

## 自动化替换示例

可以使用以下PowerShell脚本批量替换：

```powershell
# 定义替换映射
$replacements = @{
    '"http://localhost:3000/api/' = 'getApiUrl("/'
    'fetch("http://localhost:3000/' = 'fetch(getBaseUrl("/'
    '`${window.location.origin}' = '`${FRONTEND_URL}'
    'window.location.origin' = 'FRONTEND_URL'
}

# 需要处理的文件
$files = Get-ChildItem -Path "src/pages/*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    foreach ($key in $replacements.Keys) {
        if ($content -match [regex]::Escape($key)) {
            $content = $content -replace [regex]::Escape($key), $replacements[$key]
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Updated: $($file.Name)"
    }
}
```

## 验证步骤

替换完成后，请验证：

1. **本地开发环境**：
   ```bash
   npm run dev
   # 应该连接到 localhost:3000
   ```

2. **生产构建**：
   ```bash
   npm run build
   # 检查 dist 目录中是否包含正确的生产URL
   ```

3. **测试分享链接**：
   - 创建一个投票/测验
   - 生成分享链接
   - 确认链接格式为 `http://49.232.227.144/response/xxx`

## 注意事项

1. ✅ 不要在代码中硬编码任何URL
2. ✅ 始终使用环境变量或辅助函数
3. ✅ 分享链接使用 `FRONTEND_URL`
4. ✅ API调用使用 `API_BASE_URL`
5. ✅ 文件上传使用 `BASE_URL`
6. ⚠️ 不要将 `.env.production` 提交到公开仓库
7. ⚠️ 确保服务器上的后端运行在 5000 端口
8. ⚠️ 确保前端通过 Nginx 在 80 端口提供服务
