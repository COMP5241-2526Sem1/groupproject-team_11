import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Lightbulb, FileText, TrendingUp, Trash2, Lightbulb as MindMapIcon, BarChart3, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/services/api";

const Activities = () => {
  const [recentWork, setRecentWork] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<{ id: string; title: string } | null>(null);
  const [activityToCopy, setActivityToCopy] = useState<any | null>(null);
  const [, setUpdateTrigger] = useState(0);

  const activityTypes = [
    { id: 1, name: "Opinion Poll", type: "opinion-poll", icon: BarChart3, bgColor: "bg-indigo-100", iconColor: "text-indigo-500" },
    { id: 2, name: "Classroom Quiz", type: "quiz", icon: Lightbulb, bgColor: "bg-green-100", iconColor: "text-green-500" },
    { id: 3, name: "Open-ended Question", type: "open-question", icon: FileText, bgColor: "bg-purple-100", iconColor: "text-purple-500" },
    { id: 4, name: "Scales Question", type: "scales-question", icon: TrendingUp, bgColor: "bg-orange-100", iconColor: "text-orange-500" },
    { id: 5, name: "Mind Map", type: "mind-map", icon: MindMapIcon, bgColor: "bg-pink-100", iconColor: "text-pink-500" },
  ];

  useEffect(() => {
    // 从后端 API 加载活动列表
    loadActivities();
  }, []);

  // 加载活动列表 - 从多个后端 API 获取所有活动类型
  const loadActivities = async () => {
    try {
      const allActivities: any[] = [];

      // 1. 加载 Opinion Polls
      try {
        const pollsResponse = await fetch(`${API_BASE_URL}/polls`);
        if (pollsResponse.ok) {
          const pollsData = await pollsResponse.json();
          const polls = pollsData.polls || [];
          polls.forEach((poll: any) => {
            allActivities.push({
              id: poll.id,
              title: poll.title,
              activityType: "opinion-poll",
              thumbnail: poll.description || poll.title,
              edited: poll.createdAt || Date.now(),
            });
          });
        }
      } catch (error) {
        console.error('Error loading polls:', error);
      }

      // 2. 加载 Mind Maps
      try {
        const mindMapsResponse = await fetch(`${API_BASE_URL}/mind-maps`);
        if (mindMapsResponse.ok) {
          const mindMapsData = await mindMapsResponse.json();
          const mindMaps = mindMapsData.activities || mindMapsData.mindMaps || [];
          mindMaps.forEach((mindMap: any) => {
            allActivities.push({
              id: mindMap.id,
              title: mindMap.title,
              activityType: "mind-map",
              thumbnail: mindMap.thumbnail || mindMap.title,
              edited: mindMap.createdAt || Date.now(),
            });
          });
        }
      } catch (error) {
        console.error('Error loading mind maps:', error);
      }

      // 3. 加载 Open Questions
      try {
        const openQuestionsResponse = await fetch(`${API_BASE_URL}/open-questions`);
        if (openQuestionsResponse.ok) {
          const openQuestionsData = await openQuestionsResponse.json();
          const openQuestions = openQuestionsData.activities || openQuestionsData.openQuestions || [];
          openQuestions.forEach((question: any) => {
            allActivities.push({
              id: question.id,
              title: question.title,
              activityType: "open-question",
              thumbnail: question.thumbnail || (question.slides && question.slides[0]?.text) || question.title,
              edited: question.createdAt || Date.now(),
            });
          });
        }
      } catch (error) {
        console.error('Error loading open questions:', error);
      }

      // 4. 加载 Scales Questions
      try {
        const scalesQuestionsResponse = await fetch(`${API_BASE_URL}/scales-questions`);
        if (scalesQuestionsResponse.ok) {
          const scalesQuestionsData = await scalesQuestionsResponse.json();
          const scalesQuestions = scalesQuestionsData.activities || scalesQuestionsData.scalesQuestions || [];
          scalesQuestions.forEach((question: any) => {
            allActivities.push({
              id: question.id,
              title: question.title,
              activityType: "scales-question",
              thumbnail: question.thumbnail || (question.slides && question.slides[0]?.text) || question.title,
              edited: question.createdAt || Date.now(),
            });
          });
        }
      } catch (error) {
        console.error('Error loading scales questions:', error);
      }

      // 5. 加载 Quizzes
      try {
        const quizzesResponse = await fetch(`${API_BASE_URL}/classroom_quiz`);
        if (quizzesResponse.ok) {
          const quizzesData = await quizzesResponse.json();
          const quizzes = quizzesData.activities || quizzesData.quizzes || [];
          quizzes.forEach((quiz: any) => {
            allActivities.push({
              id: quiz.id,
              title: quiz.title,
              activityType: "quiz",
              thumbnail: quiz.thumbnail || quiz.title,
              edited: quiz.createdAt || Date.now(),
            });
          });
        }
      } catch (error) {
        console.error('Error loading quizzes:', error);
      }

      // 按编辑时间排序（最新的在前面）
      allActivities.sort((a, b) => {
        const timeA = typeof a.edited === 'number' ? a.edited : new Date(a.edited).getTime();
        const timeB = typeof b.edited === 'number' ? b.edited : new Date(b.edited).getTime();
        return timeB - timeA;
      });

      setRecentWork(allActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      alert('Failed to load activities. Please try again later.');
    }
  };

  // 定时更新相对时间（每秒刷新一次）
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 60000); // 每分钟更新一次
    return () => clearInterval(interval);
  }, []);

  // 计算相对时间
  const getRelativeTime = (timestamp: number | string) => {
    // 处理两种格式：新的时间戳（number）和旧的字符串格式
    if (typeof timestamp === "string") {
      return timestamp;
    }

    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffSeconds < 60) {
      return "Just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffWeeks < 4) {
      return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
    } else {
      // 如果超过一个月，显示具体日期
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      });
    }
  };

  // Helper function for activity type display
  const getActivityTypeDisplay = (activityType: string) => {
    const typeMap: Record<string, string> = {
      "quiz": "Classroom Quiz",
      "opinion-poll": "Opinion Poll",
      "open-question": "Open-ended Question",
      "group-discussion": "Group Discussion",
      "scales-question": "Scales Question",
      "mind-map": "Mind Map",
    };
    return typeMap[activityType] || activityType;
  };

  // 删除活动
  const handleDeleteActivity = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const activity = recentWork.find((a) => a.id === id);
    if (activity) {
      setActivityToDelete({ id, title: activity.title });
      setDeleteDialogOpen(true);
    }
  };

  // 确认删除
  const confirmDelete = async () => {
    if (activityToDelete) {
      try {
        // 根据活动类型调用不同的后端 API 删除
        const activity = recentWork.find((a) => a.id === activityToDelete.id);
        if (!activity) return;

        let response;
        switch (activity.activityType) {
          case "opinion-poll":
            response = await fetch(`${API_BASE_URL}/polls/delete/${activityToDelete.id}`, {
              method: "DELETE",
            });
            break;
          case "quiz":
            response = await fetch(`${API_BASE_URL}/classroom_quiz/${activityToDelete.id}`, {
              method: "DELETE",
            });
            break;
          case "open-question":
            response = await fetch(`${API_BASE_URL}/open-questions/${activityToDelete.id}`, {
              method: "DELETE",
            });
            break;
          case "scales-question":
            response = await fetch(`${API_BASE_URL}/scales-questions/${activityToDelete.id}`, {
              method: "DELETE",
            });
            break;
          case "mind-map":
            response = await fetch(`${API_BASE_URL}/mind-maps/${activityToDelete.id}`, {
              method: "DELETE",
            });
            break;
          default:
            throw new Error("Unknown activity type");
        }

        if (response && !response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }
        
        // 删除成功后重新加载列表
        await loadActivities();
        alert("Activity deleted successfully!");
      } catch (error) {
        console.error('Delete activity error:', error);
        alert('Failed to delete activity. Please try again.');
      }
      
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    }
  };

  // 创建新活动
  const handleCreateActivity = (activityType: string) => {
    // 跳转到对应的活动创建页面，带上 mode=create 参数
    window.location.href = `/${activityType}?mode=create`;
  };

  // 复制活动
  const handleCopyActivity = (activity: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActivityToCopy(activity);
    setCopyDialogOpen(true);
  };

  const confirmCopyActivity = async () => {
    if (!activityToCopy) return;

    // 查找已有的副本数量
    const copyRegex = new RegExp(`^${activityToCopy.title.replace(/\s*\(\d+\)$/, '')}(?:\\s*\\((\\d+)\\))?$`);
    const existingCopies = recentWork.filter(a => copyRegex.test(a.title));
    const maxCopyNumber = existingCopies.reduce((max, a) => {
      const match = a.title.match(/\((\d+)\)$/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    
    const newCopyNumber = maxCopyNumber + 1;
    const baseTitle = activityToCopy.title.replace(/\s*\(\d+\)$/, '');
    const newTitle = `${baseTitle} (${newCopyNumber})`;

    const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiIyNTA0MDc1OEciLCJ1c2VyX25hbWUiOiJUZXN0IFVzZXIiLCJyb2xlIjoidGVhY2hlciIsImV4cCI6MjEyMzMyNTY2OH0.6ZNz0Ym4WaXVWgfO7riGh16fpXhKOOWJzFRX0zX8sBY";
    const currentUserId = "user_123";

    try {
      let response;
      
      // 根据活动类型，先获取完整数据，然后使用对应格式创建副本
      switch (activityToCopy.activityType) {
        case "opinion-poll": {
          // 获取完整的 Poll 数据
          const pollResponse = await fetch(`${API_BASE_URL}/polls`);
          if (!pollResponse.ok) throw new Error("Failed to fetch poll data");
          const pollData = await pollResponse.json();
          
          // 从返回的 polls 数组中找到对应的 poll
          const originalPoll = pollData.polls?.find((p: any) => p.id === activityToCopy.id);
          if (!originalPoll) throw new Error("Poll not found");
          
          // 使用 OpinionPoll.tsx 的格式，确保所有必需字段都存在
          const pollRequestData = {
            title: newTitle,
            description: originalPoll.description || "",
            questions: Array.isArray(originalPoll.questions) ? originalPoll.questions : [],
            openTime: typeof originalPoll.openTime === 'number' ? originalPoll.openTime : Date.now(),
            closeTime: typeof originalPoll.closeTime === 'number' ? originalPoll.closeTime : undefined,
            allowAnonymous: typeof originalPoll.allowAnonymous === 'boolean' ? originalPoll.allowAnonymous : false,
            status: "draft",
            createdBy: currentUserId,
            createdAt: Date.now(),
          };

          response = await fetch(`${API_BASE_URL}/polls/create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(pollRequestData),
          });
          break;
        }

        case "quiz": {
          // 获取完整的 Quiz 数据
          const quizResponse = await fetch(`${API_BASE_URL}/classroom_quiz/${activityToCopy.id}`);
          if (!quizResponse.ok) throw new Error("Failed to fetch quiz data");
          const quizData = await quizResponse.json();
          const originalQuiz = quizData;
          
          // 使用 Quiz.tsx 的格式
          const quizRequestData = {
            title: newTitle,
            type: "quiz",
            classroom_quizType: "standard",
            questions: originalQuiz.questions,
          };

          response = await fetch(`${API_BASE_URL}/classroom_quiz`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(quizRequestData),
          });
          break;
        }

        case "open-question": {
          // 获取完整的 Open Question 数据
          const openQuestionResponse = await fetch(`${API_BASE_URL}/open-questions/${activityToCopy.id}`);
          if (!openQuestionResponse.ok) throw new Error("Failed to fetch open question data");
          const openQuestionData = await openQuestionResponse.json();
          const originalQuestion = openQuestionData.activity;
          
          // 使用 OpenQuestion.tsx 的格式
          const openQuestionRequestData = {
            title: newTitle,
            type: "Open-ended Question",
            activityType: "open-question",
            slides: originalQuestion.slides || [],
            thumbnail: originalQuestion.slides?.[0]?.text || newTitle,
          };

          response = await fetch(`${API_BASE_URL}/open-questions/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(openQuestionRequestData),
          });
          break;
        }

        case "scales-question": {
          // 获取完整的 Scales Question 数据
          const scalesQuestionResponse = await fetch(`${API_BASE_URL}/scales-questions/${activityToCopy.id}`);
          if (!scalesQuestionResponse.ok) throw new Error("Failed to fetch scales question data");
          const scalesQuestionData = await scalesQuestionResponse.json();
          const originalScales = scalesQuestionData.activity;
          
          // 使用 ScalesQuestion.tsx 的格式
          const scalesQuestionRequestData = {
            title: newTitle,
            type: "Scales Question",
            activityType: "scales-question",
            thumbnail: originalScales.slides?.[0]?.text || newTitle,
            slides: originalScales.slides || [],
          };

          response = await fetch(`${API_BASE_URL}/scales-questions/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(scalesQuestionRequestData),
          });
          break;
        }

        case "mind-map": {
          // 获取完整的 Mind Map 数据
          const mindMapResponse = await fetch(`${API_BASE_URL}/mind-maps/${activityToCopy.id}`);
          if (!mindMapResponse.ok) throw new Error("Failed to fetch mind map data");
          const mindMapData = await mindMapResponse.json();
          const originalMindMap = mindMapData.activity;
          
          // 使用 MindMap.tsx 的格式
          const mindMapRequestData = {
            title: newTitle,
            type: "Mind Map",
            activityType: "mind-map",
            thumbnail: newTitle,
            markdownCode: originalMindMap.markdownCode || "# New Mind Map",
          };

          response = await fetch(`${API_BASE_URL}/mind-maps/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mindMapRequestData),
          });
          break;
        }

        default:
          throw new Error("Unknown activity type");
      }
      
      if (!response || !response.ok) {
        throw new Error(`API Error: ${response?.statusText}`);
      }
      
      const data = await response.json();
      if (data.success) {
        await loadActivities();
        alert("Activity copied successfully!");
      }
    } catch (error) {
      console.error("Error copying activity:", error);
      alert("Failed to copy activity. Please try again later.");
    }
    
    setCopyDialogOpen(false);
    setActivityToCopy(null);
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-8">Activities</h2>

      {/* Activity Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
        {activityTypes.map((activity) => {
          const Icon = activity.icon;
          return (
            <Card
              key={activity.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-40 flex flex-col items-center justify-center gap-3"
              onClick={() => handleCreateActivity(activity.type)}
            >
              <div className={`${activity.bgColor} p-3 rounded-lg`}>
                <Icon className={`h-8 w-8 ${activity.iconColor}`} />
              </div>
              <span className="font-medium text-center text-sm">{activity.name}</span>
            </Card>
          );
        })}
      </div>

      {/* Recently Work - 固定 3 列布局 */}
      <h3 className="text-xl font-bold mb-4">Recently Work</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recentWork.map((work) => (
          <div key={work.id} className="relative group">
            <Link to={`/${work.activityType}?id=${work.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                {/* 固定大小的缩略图 */}
                <div className="h-48 flex items-center justify-center bg-muted/30 border-b">
                  <p className="text-center px-6 text-lg font-medium line-clamp-3">{work.thumbnail || "Enter your question here"}</p>
                </div>
                {/* 活动信息 */}
                <div className="p-4">
                  <p className="font-semibold text-sm mb-2">{work.title}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-xs text-muted-foreground">{getActivityTypeDisplay(work.activityType)}</p>
                    <p className="text-xs text-muted-foreground">{getRelativeTime(work.edited)}</p>
                  </div>
                </div>
              </Card>
            </Link>
            
            {/* 复制按钮 - 悬停时显示 */}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleCopyActivity(work, e)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            
            {/* 删除按钮 - 悬停时显示 */}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleDeleteActivity(work.id, e)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Copy Confirmation Dialog */}
      <AlertDialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm Activity Duplication</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to duplicate the activity <span className="font-semibold text-foreground">"{activityToCopy?.title}"</span> ？
          </AlertDialogDescription>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={confirmCopyActivity}>
                Agree
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Activity</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <span className="font-semibold text-foreground">"{activityToDelete?.title}"</span>? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Activities;
