# URL自动替换脚本
# 将所有硬编码的 localhost:3000 替换为使用环境变量

Write-Host "开始替换URL..." -ForegroundColor Green

# 获取所有需要处理的文件
$files = Get-ChildItem -Path "src/pages" -Filter "*.tsx"

$totalFiles = 0
$modifiedFiles = 0

foreach ($file in $files) {
    $totalFiles++
    $filePath = $file.FullName
    $content = Get-Content $filePath -Raw -Encoding UTF8
    $originalContent = $content
    $modified = $false
    
    Write-Host "`n处理文件: $($file.Name)" -ForegroundColor Cyan
    
    # 1. 替换 API 调用
    if ($content -match 'fetch\("http://localhost:3000/api/') {
        # 检查是否已经导入
        if ($content -notmatch 'import.*\{.*API_BASE_URL.*\}.*from.*["'']@/services/api["'']') {
            # 在第一个 import 后添加
            if ($content -match '(import[^;]+;)') {
                $content = $content -replace '(import[^;]+;)', "`$1`nimport { API_BASE_URL } from `"@/services/api`";"
            }
        }
        
        # 替换 fetch 调用
        $content = $content -replace 'fetch\("http://localhost:3000/api/([^"]+)"\)', 'fetch(`${API_BASE_URL}/$1`)'
        $content = $content -replace "fetch\('http://localhost:3000/api/([^']+)'\)", 'fetch(`${API_BASE_URL}/$1`)'
        Write-Host "  - 替换了 API 调用" -ForegroundColor Yellow
        $modified = $true
    }
    
    # 2. 替换文件上传/下载 URL
    if ($content -match 'http://localhost:3000/(upload|download|delete)/') {
        if ($content -notmatch 'import.*\{.*BASE_URL.*\}.*from.*["'']@/services/api["'']') {
            if ($content -match 'import \{ API_BASE_URL \} from') {
                $content = $content -replace 'import \{ API_BASE_URL \} from', 'import { API_BASE_URL, BASE_URL } from'
            } else {
                if ($content -match '(import[^;]+;)') {
                    $content = $content -replace '(import[^;]+;)', "`$1`nimport { BASE_URL } from `"@/services/api`";"
                }
            }
        }
        
        $content = $content -replace '"http://localhost:3000/(upload|download|delete)/([^"]+)"', '`${BASE_URL}/$1/$2`'
        $content = $content -replace "'http://localhost:3000/(upload|download|delete)/([^']+)'", '`${BASE_URL}/$1/$2`'
        Write-Host "  - 替换了文件上传/下载 URL" -ForegroundColor Yellow
        $modified = $true
    }
    
    # 3. 替换分享链接生成
    if ($content -match 'window\.location\.origin') {
        if ($content -notmatch 'import.*\{.*FRONTEND_URL.*\}.*from.*["'']@/services/api["'']') {
            if ($content -match 'import \{ (API_BASE_URL|BASE_URL)[^}]* \} from ["'']@/services/api["'']') {
                $content = $content -replace '(import \{ (?:API_BASE_URL|BASE_URL)[^}]*)\} from ["'']@/services/api["'']', '$1, FRONTEND_URL } from "@/services/api"'
            } else {
                if ($content -match '(import[^;]+;)') {
                    $content = $content -replace '(import[^;]+;)', "`$1`nimport { FRONTEND_URL } from `"@/services/api`";"
                }
            }
        }
        
        $content = $content -replace 'window\.location\.origin', 'FRONTEND_URL'
        $content = $content -replace '\$\{window\.location\.origin\}', '${FRONTEND_URL}'
        Write-Host "  - 替换了分享链接生成" -ForegroundColor Yellow
        $modified = $true
    }
    
    # 如果内容被修改，保存文件
    if ($modified -and $content -ne $originalContent) {
        Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
        $modifiedFiles++
        Write-Host "  ✓ 文件已更新" -ForegroundColor Green
    } else {
        Write-Host "  - 无需修改" -ForegroundColor Gray
    }
}

Write-Host "`n======================================" -ForegroundColor Green
Write-Host "替换完成!" -ForegroundColor Green
Write-Host "总文件数: $totalFiles" -ForegroundColor Cyan
Write-Host "修改文件数: $modifiedFiles" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Green
