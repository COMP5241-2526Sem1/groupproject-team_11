import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";
import { API_BASE_URL } from "@/services/api";

interface GradeData {
  studentId: string;
  totalScore: number;
  questionScores: { [key: string]: number };
}

interface StatisticsData {
  max: number;
  min: number;
  median: number;
  average: number;
  distribution: { range: string; count: number }[];
}

interface GradeAnalysisProps {
  itemTitle: string;
  itemType: "assignment" | "quiz";
}

export const GradeAnalysis = ({ itemTitle, itemType }: GradeAnalysisProps) => {
  const [gradesData, setGradesData] = useState<GradeData[]>([]);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFormatHelp, setShowFormatHelp] = useState(false);
  const [quizAnalId, setQuizAnalId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 从 localStorage 加载保存的分析数据
  useEffect(() => {
    const loadSavedAnalysis = async () => {
      try {
        const savedAnalysisKey = `grade_analysis_${itemType}_${itemTitle}`;
        const savedData = localStorage.getItem(savedAnalysisKey);
        
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setQuizAnalId(parsed.quizAnalId);
          setGradesData(parsed.gradesData || []);
          setStatistics(parsed.statistics || null);
          
          // 从后端获取 AI 分析内容
          if (parsed.quizAnalId) {
            console.log("Loading AI analysis for ID:", parsed.quizAnalId);
            const response = await fetch(`${API_BASE_URL}/analyze_grades_with_ai/${parsed.quizAnalId}`, {
              method: "GET",
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.ai_analysis) {
                setAiSummary(data.ai_analysis);
                console.log("AI analysis loaded successfully");
              }
            } else {
              console.warn("Failed to load AI analysis from server");
              // 使用本地保存的 AI 分析（如果有）
              if (parsed.aiSummary) {
                setAiSummary(parsed.aiSummary);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading saved analysis:", error);
      }
    };
    
    loadSavedAnalysis();
  }, [itemTitle, itemType]);

  // 确保 quizgrades 的 AI 分析调用逻辑与 GradeAnalysis 一致
  useEffect(() => {
    const loadQuizGradesAnalysis = async () => {
      try {
        const savedQuizGradesKey = `quizgrades_analysis_${itemType}_${itemTitle}`;
        const savedQuizGradesData = localStorage.getItem(savedQuizGradesKey);

        if (savedQuizGradesData) {
          const parsedQuizGrades = JSON.parse(savedQuizGradesData);
          setQuizAnalId(parsedQuizGrades.quizAnalId);
          setGradesData(parsedQuizGrades.gradesData || []);
          setStatistics(parsedQuizGrades.statistics || null);

          // 从后端获取 AI 分析内容
          if (parsedQuizGrades.quizAnalId) {
            console.log("Loading AI analysis for quizgrades ID:", parsedQuizGrades.quizAnalId);
            const response = await fetch(`${API_BASE_URL}/analyze_grades_with_ai/${parsedQuizGrades.quizAnalId}`, {
              method: "GET",
            });

            if (response.ok) {
              const data = await response.json();
              if (data.ai_analysis) {
                setAiSummary(data.ai_analysis);
                console.log("AI analysis for quizgrades loaded successfully");
              }
            } else {
              console.warn("Failed to load AI analysis for quizgrades from server");
              // 使用本地保存的 AI 分析（如果有）
              if (parsedQuizGrades.aiSummary) {
                setAiSummary(parsedQuizGrades.aiSummary);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading quizgrades analysis:", error);
      }
    };

    loadQuizGradesAnalysis();
  }, [itemTitle, itemType]);

  const calculateStatistics = (data: GradeData[]): StatisticsData => {
    if (data.length === 0) {
      return {
        max: 0,
        min: 0,
        median: 0,
        average: 0,
        distribution: [],
      };
    }

    const scores = data.map((d) => d.totalScore).sort((a, b) => a - b);
    const sum = scores.reduce((acc, score) => acc + score, 0);
    const average = sum / scores.length;
    const median = scores.length % 2 === 0
      ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
      : scores[Math.floor(scores.length / 2)];

    // 计算分数分布 (0-59, 60-69, 70-79, 80-89, 90-100)
    const distribution = [
      { range: "0-59", count: 0 },
      { range: "60-69", count: 0 },
      { range: "70-79", count: 0 },
      { range: "80-89", count: 0 },
      { range: "90-100", count: 0 },
    ];

    scores.forEach((score) => {
      if (score < 60) distribution[0].count++;
      else if (score < 70) distribution[1].count++;
      else if (score < 80) distribution[2].count++;
      else if (score < 90) distribution[3].count++;
      else distribution[4].count++;
    });

    return {
      max: Math.max(...scores),
      min: Math.min(...scores),
      median: Math.round(median * 100) / 100,
      average: Math.round(average * 100) / 100,
      distribution,
    };
  };

  const analyzeQuestions = (data: GradeData[]): string => {
    // 分析每道题的得分情况
    const questionStats: { [key: string]: { total: number; count: number; fullScores: number } } = {};

    data.forEach((student) => {
      Object.entries(student.questionScores).forEach(([qId, score]) => {
        if (!questionStats[qId]) {
          questionStats[qId] = { total: 0, count: 0, fullScores: 0 };
        }
        questionStats[qId].total += score;
        questionStats[qId].count += 1;
        // 假设满分是100或题目数量对应的满分
        if (score >= 90) questionStats[qId].fullScores++;
      });
    });

    // 找出平均分最低的题目（错误最多）
    let lowestAvg = 100;
    let hardestQuestion = "";
    let highestFullScore = 0;
    let easiestQuestion = "";

    Object.entries(questionStats).forEach(([qId, stats]) => {
      const avg = stats.total / stats.count;
      if (avg < lowestAvg) {
        lowestAvg = avg;
        hardestQuestion = qId;
      }
      if (stats.fullScores > highestFullScore) {
        highestFullScore = stats.fullScores;
        easiestQuestion = qId;
      }
    });

    return `Based on the analysis:
- **Most Challenging Question**: ${hardestQuestion} (Average: ${lowestAvg.toFixed(2)})
  Students struggled with this question the most. Consider reviewing related concepts.
  
- **Best Performance Question**: ${easiestQuestion} (${highestFullScore} students scored 90+)
  This question was well understood by most students.
  
**Recommendations**:
1. Focus additional teaching time on topics related to ${hardestQuestion}
2. Consider providing extra practice problems for challenging areas
3. Acknowledge students' strong performance in ${easiestQuestion} related topics`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      // 1. 上传文件到后端
      const formData = new FormData();
      formData.append("file", file);

      console.log("Uploading grades file to backend:", file.name);

      const uploadResponse = await fetch(`${API_BASE_URL}/upload_grades`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Error uploading grades:", errorText);
        alert("Failed to upload grades to server. Please try again.");
        return;
      }

      const uploadData = await uploadResponse.json();
      console.log("Upload grades response:", uploadData);

      if (!uploadData.quiz_anal_id) {
        alert("Grades uploaded, but no analysis ID returned.");
        return;
      }

      // 2. 存储 quiz_anal_id
      const newQuizAnalId = uploadData.quiz_anal_id;
      setQuizAnalId(newQuizAnalId);
      localStorage.setItem("quiz_anal_id", newQuizAnalId);
      console.log("Stored quiz_anal_id:", newQuizAnalId);

      // 3. 查询分析数据
      console.log("Fetching analysis data for ID:", newQuizAnalId);
      const analysisResponse = await fetch(`${API_BASE_URL}/upload_grades/${newQuizAnalId}`, {
        method: "GET",
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error("Error fetching analysis data:", errorText);
        alert("Failed to fetch analysis data. Please try again.");
        return;
      }

      const analysisData = await analysisResponse.json();
      console.log("Analysis data response:", analysisData);

      // 4. 解析后端返回的分析数据
      // 假设后端返回格式包含学生成绩数据和统计信息
      if (analysisData.grades && Array.isArray(analysisData.grades)) {
        const parsedData: GradeData[] = analysisData.grades.map((item: any) => ({
          studentId: String(item.student_id || item.studentId || ""),
          totalScore: parseFloat(item.total_score || item.totalScore || "0"),
          questionScores: item.question_scores || item.questionScores || {},
        }));

        setGradesData(parsedData);

        // 计算统计数据
        const stats = calculateStatistics(parsedData);
        console.log("Statistics:", stats);
        setStatistics(stats);

        // 从后端获取 AI 分析
        console.log("Fetching AI analysis for ID:", newQuizAnalId);
        const aiResponse = await fetch(`${API_BASE_URL}/update_ai_analysis/${newQuizAnalId}`, {
          method: "GET",
        });

        let aiAnalysisText = "";
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          if (aiData.ai_analysis) {
            aiAnalysisText = aiData.ai_analysis;
            setAiSummary(aiAnalysisText);
            console.log("AI analysis loaded from server");
          }
        } else {
          console.warn("Failed to load AI analysis, using local analysis");
          aiAnalysisText = analyzeQuestions(parsedData);
          setAiSummary(aiAnalysisText);
        }

        // 保存完整数据到 localStorage
        const savedAnalysisKey = `grade_analysis_${itemType}_${itemTitle}`;
        localStorage.setItem(savedAnalysisKey, JSON.stringify({
          quizAnalId: newQuizAnalId,
          gradesData: parsedData,
          statistics: stats,
          aiSummary: aiAnalysisText,
          timestamp: Date.now(),
        }));

        alert(`Grades uploaded and analyzed successfully! Analysis ID: ${newQuizAnalId}`);
      } else {
        // 如果后端没有返回完整数据，则本地解析
        console.log("Backend didn't return analysis data, parsing locally...");
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedData: GradeData[] = jsonData.map((row) => {
          const studentId = row["student_id"] || row["StudentID"] || row["学号"] || "";
          const totalScore = parseFloat(
            row["total_score"] || row["TotalScore"] || row["总分"] || "0"
          );
          
          const questionScores: { [key: string]: number } = {};
          Object.keys(row).forEach((key) => {
            if (
              key.startsWith("question_") || 
              key.match(/^Q\d+$/) || 
              key.startsWith("题目")
            ) {
              const score = parseFloat(row[key] || "0");
              questionScores[key] = score;
            }
          });

          return {
            studentId: String(studentId),
            totalScore,
            questionScores,
          };
        });

        setGradesData(parsedData);
        const stats = calculateStatistics(parsedData);
        setStatistics(stats);

        // 从后端获取 AI 分析
        console.log("Fetching AI analysis (fallback) for ID:", newQuizAnalId);
        const aiResponse = await fetch(`${API_BASE_URL}/analyze_grades_with_ai/${newQuizAnalId}`, {
          method: "GET",
        });

        let aiAnalysisText = "";
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          if (aiData.ai_analysis) {
            aiAnalysisText = aiData.ai_analysis;
            setAiSummary(aiAnalysisText);
            console.log("AI analysis loaded from server (fallback)");
          }
        } else {
          console.warn("Failed to load AI analysis (fallback), using local analysis");
          aiAnalysisText = analyzeQuestions(parsedData);
          setAiSummary(aiAnalysisText);
        }

        // 保存完整数据到 localStorage
        const savedAnalysisKey = `grade_analysis_${itemType}_${itemTitle}`;
        localStorage.setItem(savedAnalysisKey, JSON.stringify({
          quizAnalId: newQuizAnalId,
          gradesData: parsedData,
          statistics: stats,
          aiSummary: aiAnalysisText,
          timestamp: Date.now(),
        }));

        alert(`Grades uploaded successfully! Analysis ID: ${newQuizAnalId}`);
      }
      
    } catch (error) {
      console.error("Error uploading/parsing Excel file:", error);
      alert(`Failed to upload grades: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Upload Grades</h3>
              <p className="text-sm text-muted-foreground">
                Upload an Excel file containing student grades for {itemTitle}
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {isLoading ? "Processing..." : "Upload Excel"}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Format Requirements Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFormatHelp(!showFormatHelp)}
            className="mt-4"
          >
            {showFormatHelp ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Format Requirements
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show Format Requirements
              </>
            )}
          </Button>

          {/* Format Requirements */}
          {showFormatHelp && (
            <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Excel Format Requirements:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Column Headers</strong> (Row 1) must include:</li>
                    <li className="ml-4">- Student ID: <code className="bg-blue-100 px-1">student_id</code> or <code className="bg-blue-100 px-1">StudentID</code></li>
                    <li className="ml-4">- Total Score: <code className="bg-blue-100 px-1">total_score</code> or <code className="bg-blue-100 px-1">TotalScore</code></li>
                    <li className="ml-4">- Questions: <code className="bg-blue-100 px-1">question_1</code>, <code className="bg-blue-100 px-1">question_2</code>... or <code className="bg-blue-100 px-1">Q1</code>, <code className="bg-blue-100 px-1">Q2</code>...</li>
                    <li>• <strong>Example 1</strong> (Recommended format):</li>
                  </ul>
                  <div className="mt-2 p-2 bg-white rounded border border-blue-300 text-xs font-mono overflow-x-auto">
                    <div className="grid grid-cols-5 gap-2 min-w-max">
                      <div className="font-bold">student_id</div>
                      <div className="font-bold">total_score</div>
                      <div className="font-bold">question_1</div>
                      <div className="font-bold">question_2</div>
                      <div className="font-bold">question_3</div>
                      <div>12</div>
                      <div>60</div>
                      <div>10</div>
                      <div>0</div>
                      <div>50</div>
                      <div>13</div>
                      <div>80</div>
                      <div>20</div>
                      <div>0</div>
                      <div>60</div>
                    </div>
                  </div>
                  <ul className="text-sm text-blue-800 space-y-1 mt-2">
                    <li>• <strong>Example 2</strong> (Alternative format):</li>
                  </ul>
                  <div className="mt-2 p-2 bg-white rounded border border-blue-300 text-xs font-mono overflow-x-auto">
                    <div className="grid grid-cols-5 gap-2 min-w-max">
                      <div className="font-bold">StudentID</div>
                      <div className="font-bold">TotalScore</div>
                      <div className="font-bold">Q1</div>
                      <div className="font-bold">Q2</div>
                      <div className="font-bold">Q3</div>
                      <div>2024001</div>
                      <div>85</div>
                      <div>90</div>
                      <div>80</div>
                      <div>85</div>
                      <div>2024002</div>
                      <div>92</div>
                      <div>95</div>
                      <div>90</div>
                      <div>91</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Statistics Display */}
      {statistics && (
        <>
          {/* Score Distribution Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Total Score Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.distribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Highest Score</div>
              <div className="text-2xl font-bold text-green-600">{statistics.max}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Lowest Score</div>
              <div className="text-2xl font-bold text-red-600">{statistics.min}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Median Score</div>
              <div className="text-2xl font-bold text-blue-600">{statistics.median}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Average Score</div>
              <div className="text-2xl font-bold text-purple-600">{statistics.average}</div>
            </Card>
          </div>

          {/* AI Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Analysis Summary</h3>
            <div className="prose prose-sm max-w-none">
              {aiSummary.split('\n').map((line, index) => (
                <p key={index} className="mb-2 whitespace-pre-wrap">
                  {line}
                </p>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!statistics && !isLoading && (
        <Card className="p-12 text-center">
          <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Uploaded</h3>
          <p className="text-muted-foreground mb-4">
            Upload an Excel file to view grade statistics and AI analysis
          </p>
        </Card>
      )}
    </div>
  );
};
