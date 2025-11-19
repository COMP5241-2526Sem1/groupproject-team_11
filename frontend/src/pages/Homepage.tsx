import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, BookOpen, MessageSquare, Users, PieChart, FileText, TrendingUp, Calendar, CheckCircle, Play, Award, BarChart3, LineChart } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_BASE_URL, getToken } from "@/services/api";

const Homepage = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [openCoursesCount, setOpenCoursesCount] = useState(0);
  const [assignmentCompletionRate, setAssignmentCompletionRate] = useState(0);
  const [quizAverageScore, setQuizAverageScore] = useState(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const token = getToken();
        const authHeaders = token ? { "Authorization": `Bearer ${token}` } : {};
        
        // 从后端加载课程数据
        const coursesResponse = await fetch(`${API_BASE_URL}/courses`, {
          headers: authHeaders
        });
        if (!coursesResponse.ok) {
          throw new Error(`API Error: ${coursesResponse.statusText}`);
        }
        const coursesData = await coursesResponse.json();
        const courses = coursesData.courses || [];
        
        // 计算 Open 状态课程的总学生数和课程数
        const openCourses = courses.filter((course: any) => course.status === "Open");
        const studentsTotal = openCourses.reduce((sum: number, course: any) => {
          return sum + (parseInt(course.students) || 0);
        }, 0);
        
        setTotalStudents(studentsTotal);
        setOpenCoursesCount(openCourses.length);

        // 从后端加载 Quiz 数据计算完成率和平均分
        const quizzesResponse = await fetch(`${API_BASE_URL}/homepage_classroom_quiz`, {
          headers: authHeaders
        });
        if (!quizzesResponse.ok) {
          throw new Error(`API Error: ${quizzesResponse.statusText}`);
        }
        const quizzesData = await quizzesResponse.json();
        const quizzes = quizzesData.quizzes || [];
    
        // 计算 Quiz 完成率
        if (quizzes.length > 0) {
          let totalResponses = 0;
          
          // 为每个 Quiz 获取响应数据
          for (const quiz of quizzes) {
            try {
              const responsesResponse = await fetch(`${API_BASE_URL}/classroom_quiz/${quiz.id}/responses`, {
                headers: authHeaders
              });
              if (responsesResponse.ok) {
                const responsesData = await responsesResponse.json();
                totalResponses += (responsesData.responses || []).length;
              }
            } catch (error) {
              console.error(`Error fetching responses for quiz ${quiz.id}:`, error);
            }
          }
          
          // 假设每个 Quiz 应该有和当前学生数相同的提交数
          const expectedResponses = quizzes.length * studentsTotal;
          const completionRate = expectedResponses > 0 
            ? Math.round((totalResponses / expectedResponses) * 100) 
            : 0;
          setAssignmentCompletionRate(Math.min(completionRate, 100));
        }

        // 计算 Quiz 平均分
        if (quizzes.length > 0) {
          let totalScore = 0;
          let totalPossibleScore = 0;
          let responseCount = 0;

          for (const quiz of quizzes) {
            try {
              const responsesResponse = await fetch(`${API_BASE_URL}/classroom_quiz/${quiz.id}/responses`, {
                headers: authHeaders
              });
              if (!responsesResponse.ok) continue;
              
              const responsesData = await responsesResponse.json();
              const responses = responsesData.responses || [];
              
              for (const response of responses) {
                const questions = quiz.questions || [];
                let studentScore = 0;
                let possibleScore = 0;

                for (const question of questions) {
                  const points = question.points || 10;
                  possibleScore += points;
                  
                  const studentAnswer = response.answers[question.id];
                  
                  // 根据题型评分
                  const questionType = question.type === 'multiplechoice' ? 'multiple-choice' : 
                                     question.type === 'truefalse' ? 'true-false' : 
                                     question.type === 'shortanswer' ? 'short-answer' : question.type;
                  
                  if (questionType === "multiple-choice") {
                    // 处理多选题：correctAnswer 是数组
                    if (Array.isArray(question.correctAnswer)) {
                      const correctAnswers = question.correctAnswer;
                      const studentAnswers = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer];
                      
                      // 完全匹配才得分
                      const isCorrect = correctAnswers.length === studentAnswers.length &&
                                       correctAnswers.every((ans: number) => studentAnswers.includes(ans));
                      if (isCorrect) {
                        studentScore += points;
                      }
                    } else {
                      // 单选题
                      if (studentAnswer === question.correctAnswer) {
                        studentScore += points;
                      }
                    }
                  } else if (questionType === "true-false" && 
                             question.correctAnswer !== undefined && 
                             studentAnswer?.toString() === question.correctAnswer?.toString()) {
                    studentScore += points;
                  } else if (questionType === "short-answer") {
                    // 简答题随机评分 (模拟 AI 评分)
                    studentScore += Math.random() > 0.5 ? points : 0;
                  }
                }

                totalScore += studentScore;
                totalPossibleScore += possibleScore;
                responseCount++;
              }
            } catch (error) {
              console.error(`Error processing quiz ${quiz.id}:`, error);
            }
          }

          const averagePercentage = totalPossibleScore > 0 
            ? Math.round((totalScore / totalPossibleScore) * 100) 
            : 0;
          setQuizAverageScore(averagePercentage);
        }

        // 加载最近活动日志（从 localStorage 读取）
        // TODO: 后期改回使用后端接口
        try {
          // 方法1: 使用后端接口（暂时注释）
          // const activityLogResponse = await fetch("http://localhost:3000/api/activity-logs", {
          //   headers: authHeaders
          // });
          // if (activityLogResponse.ok) {
          //   const activityLogData = await activityLogResponse.json();
          //   const activityLog = activityLogData.logs || [];
          //   const sortedActivities = activityLog
          //     .sort((a: any, b: any) => b.timestamp - a.timestamp)
          //     .slice(0, 10);
          //   setRecentActivities(sortedActivities);
          // }

          // 方法2: 使用 localStorage（当前使用）
          const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
          // 按时间倒序排列,最多显示10条
          const sortedActivities = activityLog
            .sort((a: any, b: any) => b.timestamp - a.timestamp)
            .slice(0, 10);
          setRecentActivities(sortedActivities);
        } catch (error) {
          console.error("Error fetching activity logs:", error);
          setRecentActivities([]);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        alert("Failed to load dashboard data. Please try again later.");
      }
    };
    
    loadDashboardData();
  }, []);

  // 格式化时间显示
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return minutes <= 1 ? "Just now" : `${minutes} minutes ago`;
    } else if (hours < 24) {
      return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    } else {
      return days === 1 ? "1 day ago" : `${days} days ago`;
    }
  };

  // 获取活动类型的图标和颜色
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "created":
        return { icon: Play, bgColor: "bg-blue-100", iconColor: "text-blue-600" };
      case "shared":
        return { icon: CheckCircle, bgColor: "bg-green-100", iconColor: "text-green-600" };
      case "edited":
        return { icon: Award, bgColor: "bg-orange-100", iconColor: "text-orange-600" };
      default:
        return { icon: Play, bgColor: "bg-gray-100", iconColor: "text-gray-600" };
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Section */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-lg text-muted-foreground">Here's what's happening with your teaching journey!</p>
      </section>

      {/* Top Statistics */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {/* Student Count */}
          <Card className="p-4 hover:shadow-lg transition-shadow flex items-center justify-center">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-10 w-10 text-blue-500" />
              </div>
              <p className="text-3xl font-bold">{totalStudents.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Students (Open Courses)</p>
            </div>
          </Card>

          {/* Courses Count */}
          <Card className="p-4 hover:shadow-lg transition-shadow flex items-center justify-center">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="bg-green-100 p-3 rounded-lg">
                <BookOpen className="h-10 w-10 text-green-500" />
              </div>
              <p className="text-3xl font-bold">{openCoursesCount}</p>
              <p className="text-sm text-muted-foreground">Open Courses</p>
            </div>
          </Card>

          {/* Completion Rate */}
          <Card className="p-4 hover:shadow-lg transition-shadow flex items-center justify-center">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="h-10 w-10 text-purple-500" />
              </div>
              <p className="text-3xl font-bold">{assignmentCompletionRate}%</p>
              <p className="text-sm text-muted-foreground">Quiz Completion Rate</p>
            </div>
          </Card>

          {/* Task Accuracy Chart */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <p className="text-sm font-medium mb-3">Quiz Average Score</p>
              <div className="flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    {/* Progress circle */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="#20c997" 
                      strokeWidth="8"
                      strokeDasharray={`${45 * 2 * Math.PI * (quizAverageScore / 100)} ${45 * 2 * Math.PI}`}
                      strokeLinecap="round"
                    />
                    {/* Error portion */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="8"
                      strokeDasharray={`${45 * 2 * Math.PI * ((100 - quizAverageScore) / 100)} ${45 * 2 * Math.PI}`}
                      strokeDashoffset={`${-45 * 2 * Math.PI * (quizAverageScore / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-semibold">{quizAverageScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <Card className="p-6 border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9'
          }}>
            <style>{`
              .activity-scroll::-webkit-scrollbar {
                width: 8px;
              }
              .activity-scroll::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
              }
              .activity-scroll::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
              }
              .activity-scroll::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}</style>
            <div className="activity-scroll space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => {
                  const { icon: Icon, bgColor, iconColor } = getActivityIcon(activity.type);
                  return (
                    <div key={index} className={`flex items-start gap-4 pb-3 ${index < recentActivities.length - 1 ? 'border-b' : ''}`}>
                      <div className={`${bgColor} p-2 rounded-lg mt-1 flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent activities yet</p>
                  <p className="text-xs mt-2">Create or share activities to see them here</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default Homepage;
