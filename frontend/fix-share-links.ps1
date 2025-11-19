# 快速修复脚本 - 替换关键页面中的URL

$filesToFix = @(
    "src/pages/Quiz.tsx",
    "src/pages/OpinionPoll.tsx",
    "src/pages/OpenQuestion.tsx"
)

foreach ($file in $filesToFix) {
    if (Test-Path $file) {
        Write-Host "修复: $file" -ForegroundColor Cyan
        
        $content = Get-Content $file -Raw -Encoding UTF8
        $modified = $false
        
        # 添加 FRONTEND_URL 导入
        if ($content -match 'import \{ API_BASE_URL \} from "@/services/api";' -and
            $content -notmatch 'FRONTEND_URL') {
            $content = $content -replace 
                'import \{ API_BASE_URL \} from "@/services/api";',
                'import { API_BASE_URL, FRONTEND_URL } from "@/services/api";'
            $modified = $true
            Write-Host "  ✓ 添加了 FRONTEND_URL 导入" -ForegroundColor Green
        }
        
        # 替换 window.location.origin
        if ($content -match 'window\.location\.origin') {
            $content = $content -replace 'window\.location\.origin', 'FRONTEND_URL'
            $modified = $true
            Write-Host "  ✓ 替换了 window.location.origin" -ForegroundColor Green
        }
        
        if ($modified) {
            Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline
            Write-Host "  ✓ 文件已保存" -ForegroundColor Green
        } else {
            Write-Host "  - 无需修改" -ForegroundColor Gray
        }
    } else {
        Write-Host "文件不存在: $file" -ForegroundColor Red
    }
}

Write-Host "`n完成!" -ForegroundColor Green
