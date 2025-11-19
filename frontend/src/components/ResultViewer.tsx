import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowLeft, Download, Trophy, Medal, Award } from "lucide-react";
import { WordCloudComponent } from "@/components/WordCloud";
import { API_BASE_URL } from "@/services/api";

// Global token definition - replace with actual token from login
const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiIyNTA0MDc1OEciLCJ1c2VyX25hbWUiOiJUZXN0IFVzZXIiLCJyb2xlIjoidGVhY2hlciIsImV4cCI6MjEyMzMyNTY2OH0.6ZNz0Ym4WaXVWgfO7riGh16fpXhKOOWJzFRX0zX8sBY";

interface ResultViewerProps {
  activityId: string;
  activity: any;
  onClose: () => void;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export const ResultViewer = ({ activityId, activity, onClose }: ResultViewerProps) => {
  const [responses, setResponses] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    // 从后端 API 获取结果数据和排行榜
    const loadResponses = async () => {
      try {
        // 根据活动类型选择不同的 API 端点
        let apiUrl = '';
        const activityType = activity.activityType;
        
        if (activityType === 'quiz') {
          apiUrl = `${API_BASE_URL}/classroom_quiz/${activityId}/results`;
        } else if (activityType === 'open-question') {
          apiUrl = `${API_BASE_URL}/open-questions/${activityId}/results`;
        } else if (activityType === 'scales-question') {
          apiUrl = `${API_BASE_URL}/scales-questions/${activityId}/results`;
        } else {
          console.error('Unknown activity type:', activityType);
          return;
        }

        // 获取响应数据
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Backend response data:', data);
        
        if (data.success && data.responses) {
          // 转换后端数据格式,将 answers 对象转换为前端需要的格式
          const formattedResponses = data.responses.map((resp: any, index: number) => ({
            id: `response-${index + 1}`, // 生成唯一 ID
            studentName: resp.studentName,
            answers: resp.answers, // answers 是对象格式 { "1": "答案", "2": "B" }
            submittedAt: resp.submittedAt,
          }));

          setResponses(formattedResponses);
          
          // 计算统计数据
          const stats = calculateStatistics(formattedResponses, activity);
          setStatistics(stats);

          // 只有 Quiz 类型才需要排行榜
          if (activityType === 'quiz') {
            await loadLeaderboard(formattedResponses);
          }
        }
      } catch (error) {
        console.error('Error loading responses:', error);
        // 如果加载失败，保持空数据
      }
    };

    const loadLeaderboard = async (currentResponses: any[]) => {
      try {
        // 调用后端评分接口
        const gradeResponse = await fetch(`${API_BASE_URL}/classroom_quiz/${activityId}/grade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!gradeResponse.ok) {
          throw new Error(`Grading API Error: ${gradeResponse.statusText}`);
        }

        const gradeData = await gradeResponse.json();
        console.log('Grade response data:', gradeData);
        
        // 后端返回格式可能是:
        // 1. { leaderboard: [...] }
        // 2. [...] 直接数组
        let leaderboardData = gradeData;
        if (gradeData && gradeData.leaderboard && Array.isArray(gradeData.leaderboard)) {
          leaderboardData = gradeData.leaderboard;
        }
        
        if (leaderboardData && Array.isArray(leaderboardData)) {
          const formattedLeaderboard = leaderboardData.map((entry: any) => {
            // 解析 percentage 字符串: "20/10 (200.00%)" 或直接使用 score
            let percentageNum = 0;
            let totalPossible = 0;
            let scoreNum = entry.score || 0;
            
            if (entry.percentage && typeof entry.percentage === 'string') {
              // 提取百分比数字: "20/10 (200.00%)" -> 200.00
              const percentMatch = entry.percentage.match(/\(([0-9.]+)%\)/);
              if (percentMatch) {
                percentageNum = parseFloat(percentMatch[1]);
              }
              
              // 提取得分: "20/10 (200.00%)" -> 20
              const scoreFromPercentage = entry.percentage.match(/^(\d+)\//);
              if (scoreFromPercentage) {
                scoreNum = parseInt(scoreFromPercentage[1]);
              }
              
              // 提取总分: "20/10 (200.00%)" -> 10
              const totalMatch = entry.percentage.match(/\/(\d+)/);
              if (totalMatch) {
                totalPossible = parseInt(totalMatch[1]);
              }
            } else if (typeof entry.percentage === 'number') {
              percentageNum = entry.percentage;
            }
            
            // 如果没有 percentage 字段，根据 score 计算（假设某个总分）
            if (!entry.percentage && totalPossible === 0) {
              // 尝试从其他记录中获取总分，或使用默认值
              totalPossible = 10; // 默认总分
              percentageNum = totalPossible > 0 ? (scoreNum / totalPossible) * 100 : 0;
            }
            
            return {
              studentId: entry.student_id || `student-${entry.rank}`,
              studentName: entry.student_name,
              score: scoreNum,
              totalPossibleScore: totalPossible,
              percentage: Math.round(percentageNum),
              rank: entry.rank,
              submittedAt: entry.submitted_at || new Date().toISOString(),
            };
          });
          console.log('Setting leaderboard from backend:', formattedLeaderboard);
          setLeaderboard(formattedLeaderboard);
        } else {
          console.warn('Backend leaderboard format unexpected:', gradeData);
          // 使用本地计算作为备用方案
          const localLeaderboard = calculateLeaderboardLocally(currentResponses, activity);
          console.log('Using local leaderboard:', localLeaderboard);
          setLeaderboard(localLeaderboard);
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        // 如果后端评分失败，使用本地计算作为备用方案
        console.log('Falling back to local calculation');
        const localLeaderboard = calculateLeaderboardLocally(currentResponses, activity);
        console.log('Local leaderboard:', localLeaderboard);
        setLeaderboard(localLeaderboard);
      }
    };
    
    if (activityId) {
      loadResponses();
    }
  }, [activityId, activity]);

  const calculateStatistics = (responses: any[], activity: any) => {
    const questions = activity?.questions || activity?.slides || [];
    const stats: any = {};

    questions.forEach((question: any) => {
      const questionId = String(question.id); // 确保 ID 为字符串
      const answers = responses
        .map((r) => {
          // answers 是对象格式,需要使用字符串 key 访问
          const answerKey = String(question.id);
          return r.answers[answerKey];
        })
        .filter((a) => a !== undefined && a !== null && a !== "");

      if (question.type === "short-answer" || 
          question.type === "open-question" ||
          activity.activityType === "open-question") {
        // 对于开放题，存储所有答案用于词云和列表展示
        stats[questionId] = {
          type: "text",
          answers: answers,
          totalResponses: answers.length,
        };
      } else if (question.type === "multiple-choice") {
        // 统计每个选项的选择次数
        const optionCounts: { [key: string]: number } = {};
        question.options?.forEach((_: string, index: number) => {
          optionCounts[index] = 0;
        });
        
        answers.forEach((answer) => {
          if (optionCounts.hasOwnProperty(answer)) {
            optionCounts[answer]++;
          }
        });

        stats[questionId] = {
          type: "multiple-choice",
          data: question.options?.map((option: string, index: number) => ({
            name: option,
            value: optionCounts[index] || 0,
            percentage: answers.length > 0 
              ? Math.round((optionCounts[index] / answers.length) * 100) 
              : 0,
          })),
          totalResponses: answers.length,
        };
      } else if (question.type === "true-false") {
        const trueFalseCount = { true: 0, false: 0 };
        answers.forEach((answer) => {
          if (answer === "true" || answer === true) trueFalseCount.true++;
          else if (answer === "false" || answer === false) trueFalseCount.false++;
        });

        stats[questionId] = {
          type: "true-false",
          data: [
            { name: "True", value: trueFalseCount.true, percentage: answers.length > 0 ? Math.round((trueFalseCount.true / answers.length) * 100) : 0 },
            { name: "False", value: trueFalseCount.false, percentage: answers.length > 0 ? Math.round((trueFalseCount.false / answers.length) * 100) : 0 },
          ],
          totalResponses: answers.length,
        };
      } else if (question.type === "scales-question" || 
                 activity.activityType === "scales-question") {
        const scaleCounts: { [key: number]: number } = {};
        question.scaleOptions?.forEach((option: any) => {
          scaleCounts[option.value] = 0;
        });
        
        answers.forEach((answer) => {
          if (scaleCounts.hasOwnProperty(answer)) {
            scaleCounts[answer]++;
          }
        });

        stats[questionId] = {
          type: "scale",
          data: question.scaleOptions?.map((option: any) => ({
            name: `${option.value} - ${option.label}`,
            value: scaleCounts[option.value] || 0,
            percentage: answers.length > 0 
              ? Math.round((scaleCounts[option.value] / answers.length) * 100) 
              : 0,
          })),
          totalResponses: answers.length,
          average: answers.length > 0 
            ? (answers.reduce((sum, a) => sum + Number(a), 0) / answers.length).toFixed(2)
            : 0,
        };
      }
    });

    return stats;
  };

  const calculateLeaderboardLocally = (responses: any[], activity: any) => {
    // 本地计算排行榜 - 作为后端接口的备用方案
    // 优先使用后端评分接口: POST /api/classroom_quiz/{activityId}/grade
    
    const questions = activity?.questions || [];
    
    const scoredResponses = responses.map((response) => {
      let totalScore = 0;
      let totalPossibleScore = 0;
      
      questions.forEach((question: any) => {
        const questionKey = String(question.id); // 确保 ID 为字符串
        const studentAnswer = response.answers[questionKey];
        const points = question.points || 10;
        totalPossibleScore += points;
        
        if (studentAnswer === undefined || studentAnswer === null || studentAnswer === "") {
          return; // 跳过未作答的题目
        }
        
        // 根据题型评分
        if (question.type === "multiple-choice") {
          if (question.correctAnswer !== undefined && 
              studentAnswer === question.correctAnswer) {
            totalScore += points;
          }
        } else if (question.type === "true-false") {
          if (question.correctAnswer !== undefined && 
              studentAnswer?.toString() === question.correctAnswer?.toString()) {
            totalScore += points;
          }
        } else if (question.type === "short-answer") {
          // TODO: 后端 AI 评分
          // 暂时使用随机评分模拟 AI 评分结果
          // 实际应调用: POST /api/activities/{activityId}/grade-text
          // Body: { questionId, studentAnswer, questionText }
          // Response: { isCorrect: boolean }
          const isCorrect = Math.random() > 0.5; // 模拟 AI 判断
          if (isCorrect) {
            totalScore += points;
          }
        }
      });
      
      return {
        studentId: response.id,
        studentName: response.studentName,
        score: totalScore,
        totalPossibleScore: totalPossibleScore,
        percentage: totalPossibleScore > 0 ? Math.round((totalScore / totalPossibleScore) * 100) : 0,
        submittedAt: response.submittedAt,
      };
    });
    
    // 按分数排序
    scoredResponses.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // 分数相同时，按提交时间排序（早提交的排前面）
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });
    
    // 添加排名
    return scoredResponses.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  };

  const exportResults = async () => {
    // 从后端 API 导出结果
    try {
      // 根据活动类型选择不同的导出端点
      let exportUrl = '';
      const activityType = activity.activityType;
      
      if (activityType === 'quiz') {
        exportUrl = `${API_BASE_URL}/classroom_quiz/${activityId}/export`;
      } else if (activityType === 'open-question') {
        exportUrl = `${API_BASE_URL}/open-questions/${activityId}/export`;
      } else if (activityType === 'scales-question') {
        exportUrl = `${API_BASE_URL}/scales-questions/${activityId}/export`;
      } else {
        console.error('Unknown activity type:', activityType);
        throw new Error('Unknown activity type');
      }

      const response = await fetch(exportUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      // 如果后端返回 CSV 文件
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${activity.title}_results.csv`);
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting results:', error);
      // 如果后端导出失败，使用本地导出功能
      alert('Backend export failed. Using local export...');
      const csvContent = generateCSV();
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${activity.title}_results.csv`);
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const generateCSV = () => {
    const questions = activity?.questions || activity?.slides || [];
    let csv = "Student Name,Submitted At,";
    
    // Headers
    questions.forEach((q: any, index: number) => {
      csv += `Q${index + 1},`;
    });
    csv += "\n";

    // Data rows
    responses.forEach((response) => {
      csv += `${response.studentName},${new Date(response.submittedAt).toLocaleString()},`;
      questions.forEach((q: any) => {
        const questionKey = String(q.id);
        const answer = response.answers[questionKey] || "";
        csv += `"${answer}",`;
      });
      csv += "\n";
    });

    return csv;
  };

  const questions = activity?.questions || activity?.slides || [];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{activity.title}</h1>
              <p className="text-sm text-muted-foreground">
                Total Responses: {responses.length}
              </p>
            </div>
          </div>
          <Button onClick={exportResults} className="gap-2">
            <Download className="h-4 w-4" />
            Export Results
          </Button>
        </div>

        {/* Leaderboard for Quiz */}
        {leaderboard.length > 0 && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">Leaderboard</h2>
            </div>
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.studentId}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    index === 0
                      ? "bg-yellow-50 border-2 border-yellow-300"
                      : index === 1
                      ? "bg-gray-50 border-2 border-gray-300"
                      : index === 2
                      ? "bg-amber-50 border-2 border-amber-300"
                      : "bg-white border border-border hover:shadow-md"
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Student Info */}
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{entry.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {new Date(entry.submittedAt).toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {entry.score}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.percentage}%
                      {entry.totalPossibleScore && ` (${entry.score}/${entry.totalPossibleScore})`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Results */}
        <div className="space-y-6">
          {questions.map((question: any, index: number) => {
            const stat = statistics[question.id];
            if (!stat) return null;

            return (
              <Card key={question.id} className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Question {index + 1}: {question.text}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Responses: {stat.totalResponses}
                </p>

                {/* Text answers (Short answer / Open-ended) */}
                {stat.type === "text" && (
                  <Tabs defaultValue="list" className="w-full">
                    <TabsList>
                      <TabsTrigger value="list">All Responses</TabsTrigger>
                      <TabsTrigger value="wordcloud">Word Cloud</TabsTrigger>
                    </TabsList>
                    <TabsContent value="list" className="space-y-2 max-h-96 overflow-y-auto">
                      {stat.answers.map((answer: string, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">
                            Response {idx + 1}
                          </p>
                          <p className="whitespace-pre-wrap">{answer}</p>
                        </div>
                      ))}
                      {stat.answers.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          No responses yet
                        </p>
                      )}
                    </TabsContent>
                    <TabsContent value="wordcloud">
                      <WordCloudComponent 
                        words={stat.answers} 
                        width={800} 
                        height={400} 
                      />
                    </TabsContent>
                  </Tabs>
                )}

                {/* Bar chart for multiple choice */}
                {stat.type === "multiple-choice" && stat.data && (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stat.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {stat.data.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {item.value} ({item.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pie chart for true/false */}
                {stat.type === "true-false" && stat.data && (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stat.data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.percentage}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {stat.data.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Bar chart for scales */}
                {stat.type === "scale" && stat.data && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <p className="text-sm text-muted-foreground">
                        Average Score: <span className="font-bold text-lg text-primary">{stat.average}</span>
                      </p>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stat.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
