#!/bin/bash

# 部署脚本 - 自动化部署到服务器
# 使用方法: ./deploy.sh

# 配置变量
SERVER_IP="49.232.227.144"
SERVER_USER="root"
SERVER_PATH="/var/www/html/my-app"
LOCAL_DIST="./dist"

echo "🚀 开始部署流程..."

# 1. 清理旧的构建文件
echo "📦 清理旧的构建文件..."
rm -rf dist

# 2. 安装依赖
echo "📚 安装依赖..."
npm install

# 3. 构建生产版本
echo "🔨 构建生产版本..."
npm run build

# 检查构建是否成功
if [ ! -d "$LOCAL_DIST" ]; then
    echo "❌ 构建失败，dist 目录不存在"
    exit 1
fi

echo "✅ 构建成功"

# 4. 备份服务器上的旧版本
echo "💾 备份服务器上的旧版本..."
ssh $SERVER_USER@$SERVER_IP "if [ -d $SERVER_PATH ]; then cp -r $SERVER_PATH ${SERVER_PATH}_backup_$(date +%Y%m%d_%H%M%S); fi"

# 5. 创建服务器目录
echo "📁 创建服务器目录..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_PATH"

# 6. 上传文件到服务器
echo "📤 上传文件到服务器..."
rsync -avz --delete $LOCAL_DIST/ $SERVER_USER@$SERVER_IP:$SERVER_PATH/

# 7. 设置文件权限
echo "🔐 设置文件权限..."
ssh $SERVER_USER@$SERVER_IP "chmod -R 755 $SERVER_PATH"

# 8. 重启 Nginx
echo "🔄 重启 Nginx..."
ssh $SERVER_USER@$SERVER_IP "sudo systemctl restart nginx"

echo "✅ 部署完成！"
echo "🌐 访问地址: http://$SERVER_IP"

# 9. 测试连接
echo "🧪 测试服务器连接..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP)
if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ 服务器响应正常 (HTTP $HTTP_CODE)"
else
    echo "⚠️  服务器响应异常 (HTTP $HTTP_CODE)"
fi

echo "🎉 部署流程结束"
