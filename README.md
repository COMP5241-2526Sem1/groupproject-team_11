# 智能课堂互动系统 (Smart Classroom Interactive System)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)

一个功能丰富的智能课堂互动平台，集成了 AI 助手、课程管理、学生互动、成绩分析等多项功能，旨在提升教学效率和学生参与度。

## 📋 目录

- [项目简介](#项目简介)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [功能模块详解](#功能模块详解)
- [API 接口文档](#api-接口文档)
- [环境配置](#环境配置)
- [部署说明](#部署说明)
- [开发团队](#开发团队)

## 🎯 项目简介

智能课堂互动系统是一个为现代教育环境设计的全栈 Web 应用，帮助教师更高效地管理课堂、与学生互动，并通过 AI 技术提供智能辅助功能。系统支持多种教学活动、实时数据分析和个性化教学建议。

### 主要特点

- 🤖 **AI 智能助手**：集成 OpenAI GPT 模型，提供智能问答和教学建议
- 📊 **数据分析**：实时成绩统计、可视化分析和智能洞察
- 🎮 **互动活动**：支持投票、问答、测验、随机点名等多种课堂活动
- 🗺️ **思维导图**：自动生成课程知识点思维导图
- 📱 **响应式设计**：完美支持桌面端和移动端
- 🔐 **安全认证**：JWT 令牌认证，保障数据安全

## ✨ 核心功能

### 1. 课程管理
- 课程创建与编辑
- 课程材料上传（支持 PDF、Word、Excel）
- 学生名单批量导入
- 课程回放与历史记录

### 2. 互动活动
- **随机点名**：公平随机选择学生
- **随机分组**：智能打乱学生分组
- **意见投票**：单选、多选、量表题型
- **开放问答**：自由文本回答
- **实时测验**：即时反馈的课堂测验
- **词云生成**：可视化学生回答

### 3. AI 辅助功能
- AI 聊天助手：回答教学相关问题
- PPT 大纲生成：根据主题自动生成演示文稿大纲
- 成绩智能分析：识别学习趋势和问题
- 教学建议生成：个性化教学改进建议

### 4. 数据分析与可视化
- 成绩分布图（柱状图、饼图）
- 学生表现趋势分析
- 班级整体数据统计
- 导出分析报告

### 5. 讨论与协作
- 课程讨论区
- 主题发布与回复
- 实时消息通知

## 🛠️ 技术栈

### 前端 (Frontend)
- **框架**: React 18.3.1 + TypeScript 5.8.3
- **构建工具**: Vite 7.2.2
- **UI 库**: 
  - Radix UI（无障碍组件）
  - Shadcn UI（现代 UI 组件）
  - Tailwind CSS 3.4.17（样式框架）
- **状态管理**: TanStack Query 5.83.0
- **路由**: React Router DOM 6.30.1
- **图表**: Recharts 2.15.4
- **其他核心库**:
  - Mermaid（图表渲染）
  - Markmap（思维导图）
  - QRCode（二维码生成）
  - WordCloud（词云）
  - XLSX（Excel 处理）

### 后端 (Backend)
- **框架**: Flask 2.3.2
- **数据库**: 
  - MySQL（主数据库，使用 PyMySQL）
  - Redis 7.0.1（缓存与会话）
- **AI 集成**: OpenAI API 1.106.1
- **认证**: PyJWT 2.8.0
- **数据处理**:
  - Pandas 2.0.3
  - NumPy 1.26.4
  - Matplotlib 3.7.2
- **文件处理**:
  - OpenPyXL 3.1.2（Excel）
  - PyMuPDF 1.26.0（PDF）
  - Python-docx 1.2.0（Word）
- **其他**:
  - Flask-CORS 6.0.0（跨域支持）
  - Flask-Caching 2.3.1（缓存）
  - Gunicorn 21.2.0（WSGI 服务器）

## 📁 项目结构

```
project_final/
│
├── backend/                      # 后端服务
│   ├── src/                      # 源代码目录
│   │   ├── flask_backend.py      # Flask 主应用
│   │   ├── db_connection.py      # 数据库连接池
│   │   ├── auth_decorator.py     # JWT 认证装饰器
│   │   ├── user_auth.py          # 用户认证模块
│   │   ├── course_routes.py      # 课程相关路由
│   │   ├── activities.py         # 课堂活动接口
│   │   ├── LLM.py                # AI 大语言模型集成
│   │   ├── grade_statistics.py   # 成绩统计分析
│   │   ├── student_importer.py   # 学生信息导入
│   │   ├── studentpoll.py        # 学生投票模块
│   │   ├── mindmap_api.py        # 思维导图 API
│   │   ├── mindmap_generator.py  # 思维导图生成
│   │   ├── discussion_api.py     # 讨论区接口
│   │   ├── file_processor.py     # 文件处理
│   │   ├── file_upload.py        # 文件上传
│   │   ├── generate_qr_code.py   # 二维码生成
│   │   ├── random_student_selector.py  # 随机点名
│   │   ├── fetch_and_shuffle_groups.py # 分组打乱
│   │   ├── scales_question.py    # 量表题型
│   │   ├── share_link.py         # 分享链接
│   │   ├── poll_results.py       # 投票结果
│   │   ├── new_topic.py          # 新话题
│   │   └── testredis.py          # Redis 测试
│   │
│   ├── static/                   # 静态文件（QR 码等）
│   ├── uploads/                  # 上传文件存储
│   ├── venv/                     # Python 虚拟环境
│   │   └── .env                  # 环境变量配置
│   ├── requirements.txt          # Python 依赖
│   ├── Jenkinsfile              # CI/CD 配置
│   └── readme                    # 后端说明文档
│
├── frontend/                     # 前端应用
│   ├── src/                      # 源代码目录
│   │   ├── components/           # React 组件
│   │   │   ├── ui/               # 基础 UI 组件
│   │   │   ├── Layout.tsx        # 布局组件
│   │   │   ├── NavLink.tsx       # 导航链接
│   │   │   ├── AIAssistantPanel.tsx  # AI 助手面板
│   │   │   ├── GradeAnalysis.tsx # 成绩分析
│   │   │   ├── QRCodeGenerator.tsx   # 二维码生成器
│   │   │   ├── ResultViewer.tsx  # 结果查看器
│   │   │   └── WordCloud.tsx     # 词云组件
│   │   │
│   │   ├── pages/                # 页面组件
│   │   │   ├── Homepage.tsx      # 首页
│   │   │   ├── Courses.tsx       # 课程列表
│   │   │   ├── CourseDetail.tsx  # 课程详情
│   │   │   ├── CourseReplay.tsx  # 课程回放
│   │   │   ├── Activities.tsx    # 活动页面
│   │   │   ├── AIAssistant.tsx   # AI 助手
│   │   │   ├── Discussion.tsx    # 讨论区
│   │   │   ├── MindMap.tsx       # 思维导图
│   │   │   ├── PPTGenerator.tsx  # PPT 生成器
│   │   │   ├── OpinionPoll.tsx   # 意见投票
│   │   │   ├── OpenQuestion.tsx  # 开放问答
│   │   │   ├── Quiz.tsx          # 测验
│   │   │   ├── RandomRollCall.tsx # 随机点名
│   │   │   ├── RandomSort.tsx    # 随机分组
│   │   │   ├── ScalesQuestion.tsx # 量表问题
│   │   │   ├── Timer.tsx         # 计时器
│   │   │   ├── Tools.tsx         # 工具页面
│   │   │   ├── TakePoll.tsx      # 参与投票
│   │   │   ├── MobileResponse.tsx # 移动端响应
│   │   │   ├── Messages.tsx      # 消息
│   │   │   ├── Announcement.tsx  # 公告
│   │   │   └── NotFound.tsx      # 404 页面
│   │   │
│   │   ├── services/             # 服务层
│   │   │   ├── api.ts            # API 客户端
│   │   │   ├── aiService.ts      # AI 服务
│   │   │   ├── activityService.ts # 活动服务
│   │   │   └── urlConfig.ts      # URL 配置
│   │   │
│   │   ├── hooks/                # 自定义 Hooks
│   │   ├── lib/                  # 工具库
│   │   ├── App.tsx               # 根组件
│   │   ├── main.tsx              # 入口文件
│   │   └── index.css             # 全局样式
│   │
│   ├── public/                   # 公共资源
│   ├── .env.development          # 开发环境变量
│   ├── .env.production           # 生产环境变量
│   ├── .env.example              # 环境变量示例
│   ├── package.json              # Node 依赖
│   ├── vite.config.ts            # Vite 配置
│   ├── tailwind.config.ts        # Tailwind 配置
│   ├── tsconfig.json             # TypeScript 配置
│   ├── Dockerfile                # Docker 配置
│   ├── nginx.conf                # Nginx 配置
│   └── 文档/                      # 各类开发文档
│
├── .gitignore                    # Git 忽略文件
└── README.md                     # 项目说明文档（本文件）
```

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 16.0.0
- **Python**: >= 3.8
- **MySQL**: >= 8.0
- **Redis**: >= 6.0
- **npm** 或 **yarn**

### 1. 克隆项目

```bash
git clone https://github.com/COMP5241-2526Sem1/groupproject-team_11.git
cd groupproject-team_11
```

### 2. 后端设置

#### 2.1 创建虚拟环境

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

#### 2.2 安装依赖

```bash
pip install -r requirements.txt
```

#### 2.3 配置环境变量

在 `backend/venv/` 目录下创建 `.env` 文件：

```env
# GitHub Token（用于 AI 功能）
GITHUB_TOKEN=your_github_token_here

# 数据库配置
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=group-11-project

# Redis 配置
REDIS_HOST=your_redis_host
REDIS_PORT=6380
REDIS_PASSWORD=your_redis_password
```

#### 2.4 初始化数据库

运行数据库迁移脚本（如有）或手动创建所需表结构。

#### 2.5 启动后端服务

```bash
cd src
python flask_backend.py
```

后端服务将运行在 `http://localhost:5000`

### 3. 前端设置

#### 3.1 安装依赖

```bash
cd frontend
npm install
```

#### 3.2 配置环境变量

复制 `.env.example` 并重命名为 `.env.development`：

```bash
cp .env.example .env.development
```

编辑 `.env.development` 文件：

```env
VITE_API_URL=http://localhost:5000
```

#### 3.3 启动前端开发服务器

```bash
npm run dev
```

前端应用将运行在 `http://localhost:5173`

### 4. 访问应用

打开浏览器访问 `http://localhost:5173`，开始使用智能课堂互动系统！

## 📚 功能模块详解

### 1. AI 智能助手

**文件**: `backend/src/LLM.py`, `frontend/src/pages/AIAssistant.tsx`

- 支持上下文对话
- 可上传课程材料作为参考
- 支持生成 PPT 大纲
- 智能教学建议

**核心 API**:
- `POST /api/ai/chat` - AI 聊天
- `POST /ppt_assistant` - PPT 助手

### 2. 课程管理

**文件**: `backend/src/course_routes.py`, `frontend/src/pages/Courses.tsx`

- 课程 CRUD 操作
- 学生名单导入（Excel 格式）
- 课程材料管理
- 课程历史记录

**核心 API**:
- `GET /api/courses` - 获取课程列表
- `POST /api/courses` - 创建课程
- `POST /import_students` - 导入学生
- `POST /upload_course_material` - 上传材料

### 3. 课堂活动

#### 3.1 随机点名
**文件**: `backend/src/random_student_selector.py`, `frontend/src/pages/RandomRollCall.tsx`

- 从课程学生中随机选择
- 支持指定选择数量
- 避免重复选择（可配置）

#### 3.2 随机分组
**文件**: `backend/src/fetch_and_shuffle_groups.py`, `frontend/src/pages/RandomSort.tsx`

- 智能打乱学生分组
- 支持自定义分组规则
- 保存分组历史

#### 3.3 投票系统
**文件**: `backend/src/studentpoll.py`, `frontend/src/pages/OpinionPoll.tsx`

- 支持单选、多选、量表题
- 实时结果展示
- 词云可视化（开放问答）
- 匿名/实名投票

#### 3.4 测验系统
**文件**: `backend/src/activities.py`, `frontend/src/pages/Quiz.tsx`

- 多种题型支持
- 即时反馈
- 自动评分
- 成绩统计

### 4. 成绩分析

**文件**: `backend/src/grade_statistics.py`, `frontend/src/components/GradeAnalysis.tsx`

- 上传成绩表（Excel）
- 自动统计分析
- 可视化图表（柱状图、饼图、折线图）
- AI 智能洞察
- 识别学习趋势和问题点

**核心 API**:
- `POST /upload_grades` - 上传成绩
- `GET /upload_grades/<quiz_anal_id>` - 获取统计数据
- `GET /analyze_grades_with_ai/<quiz_anal_id>` - AI 分析

### 5. 思维导图

**文件**: `backend/src/mindmap_generator.py`, `frontend/src/pages/MindMap.tsx`

- 根据主题自动生成思维导图
- 支持 Markdown 和 Markmap 格式
- 可视化知识结构
- 导出功能

**核心 API**:
- `POST /api/generate_mindmap` - 生成思维导图

### 6. 讨论区

**文件**: `backend/src/discussion_api.py`, `frontend/src/pages/Discussion.tsx`

- 课程讨论主题
- 多级回复
- 实时更新
- 消息通知

### 7. 二维码分享

**文件**: `backend/src/generate_qr_code.py`, `frontend/src/components/QRCodeGenerator.tsx`

- 活动快速分享
- 学生扫码参与
- 动态链接生成

## 📡 API 接口文档

### 认证相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/logout` | POST | 用户登出 |

### 课程相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/courses` | GET | 获取课程列表 |
| `/api/courses` | POST | 创建课程 |
| `/api/courses/<id>` | GET | 获取课程详情 |
| `/api/courses/<id>` | PUT | 更新课程 |
| `/api/courses/<id>` | DELETE | 删除课程 |
| `/import_students` | POST | 导入学生（Excel） |
| `/upload_course_material` | POST | 上传课程材料 |

### AI 功能

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/ai/chat` | POST | AI 聊天对话 |
| `/ppt_assistant` | POST | PPT 大纲生成 |
| `/api/generate_mindmap` | POST | 生成思维导图 |
| `/analyze_grades_with_ai/<id>` | GET | AI 成绩分析 |

### 课堂活动

| 接口 | 方法 | 说明 |
|------|------|------|
| `/random_student_selection` | POST | 随机点名 |
| `/group_shuffle` | POST | 随机分组 |
| `/api/studentpoll` | POST | 创建投票 |
| `/api/studentpoll/<id>` | GET | 查看投票 |
| `/api/studentpoll/<id>` | POST | 提交投票答案 |
| `/api/studentpoll/<id>/results` | GET | 获取投票结果 |
| `/api/studentpoll/<id>/text_results` | GET | 获取文本投票结果 |

### 成绩管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/upload_grades` | POST | 上传成绩 |
| `/upload_grades/<id>` | GET | 获取成绩统计 |
| `/delete_quiz_analysis/<id>` | DELETE | 删除成绩分析 |
| `/update_ai_analysis/<id>` | GET | 更新 AI 分析 |

### 讨论区

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/discussions/<course_id>` | GET | 获取讨论列表 |
| `/api/discussions` | POST | 创建讨论主题 |
| `/api/discussions/<id>` | GET | 获取讨论详情 |
| `/api/discussions/<id>/reply` | POST | 回复讨论 |

### 工具功能

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/generate_qr` | POST | 生成二维码 |
| `/api/share_link` | POST | 生成分享链接 |

详细 API 文档请参考：`frontend/openapi.json`

## ⚙️ 环境配置

### 数据库配置

#### MySQL 表结构

主要数据表包括：
- `users` - 用户表
- `courses` - 课程表
- `students` - 学生表
- `activities` - 活动表
- `polls` - 投票表
- `quiz_analysis` - 成绩分析表
- `discussions` - 讨论表
- `messages` - 消息表

### Redis 配置

Redis 用于：
- 会话管理
- 缓存热点数据
- 实时消息队列

### AI 配置

需要配置 OpenAI API 密钥或兼容的 API 端点。

## 🐳 部署说明

### Docker 部署

前端已提供 Dockerfile：

```bash
cd frontend
docker build -t classroom-frontend .
docker run -p 80:80 classroom-frontend
```

### Nginx 配置

参考 `frontend/nginx.conf` 文件配置反向代理。

### 生产环境

1. 构建前端：
```bash
cd frontend
npm run build
```

2. 使用 Gunicorn 运行后端：
```bash
cd backend/src
gunicorn -w 4 -b 0.0.0.0:5000 flask_backend:app
```

3. 配置 Nginx 反向代理
4. 设置 SSL 证书
5. 配置防火墙规则

详细部署文档请参考：
- `frontend/DEPLOYMENT_GUIDE.md`
- `frontend/FINAL_DEPLOYMENT_CHECKLIST.md`

## 📖 开发文档

项目包含丰富的开发文档：

- `QUICKSTART.md` - 快速开始指南
- `BACKEND_INTEGRATION_GUIDE.md` - 后端集成指南
- `AI_INTEGRATION_GUIDE.md` - AI 集成指南
- `TESTING_GUIDE.md` - 测试指南
- `TOKEN_USAGE_GUIDE.md` - Token 使用指南
- `ACTIVITY_SYSTEM_DESIGN.md` - 活动系统设计
- `WORDCLOUD_IMPLEMENTATION.md` - 词云实现文档

## 🧪 测试

### 前端测试

```bash
cd frontend
npm run lint
```

### 后端测试

```bash
cd backend
python -m pytest tests/
```

## 🤝 开发团队

**Team 11** - COMP5241 2025 Semester 1

- 项目管理与协调
- 前端开发
- 后端开发
- AI 集成
- 数据库设计
- UI/UX 设计

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [React](https://reactjs.org/)
- [Flask](https://flask.palletsprojects.com/)
- [OpenAI](https://openai.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [项目 Issues](https://github.com/COMP5241-2526Sem1/groupproject-team_11/issues)
- 项目仓库: [https://github.com/COMP5241-2526Sem1/groupproject-team_11](https://github.com/COMP5241-2526Sem1/groupproject-team_11)

---

**Built with ❤️ by Team 11**
