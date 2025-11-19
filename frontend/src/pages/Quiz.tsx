import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Sparkles, X, ChevronDown, Share2, BarChart, Clock, Play, Pause, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { AIAssistantPanel } from "@/components/AIAssistantPanel";
import { API_BASE_URL, FRONTEND_URL } from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { ResultViewer } from "@/components/ResultViewer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type QuestionType = "short-answer" | "multiple-choice" | "true-false";

interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string | number; // For single-choice and true-false
  correctAnswers?: number[]; // For multiple-choice (array of option indices)
  points?: number;
}

const QuestionTypeLabel: Record<QuestionType, string> = {
  "short-answer": "Short Answer",
  "multiple-choice": "Multiple Choice",
  "true-false": "True/False",
};

const QuestionTypeColor: Record<QuestionType, { bg: string; text: string; border: string }> = {
  "short-answer": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  "multiple-choice": {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  "true-false": {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
};

const Quiz = () => {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [draftName, setDraftName] = useState("Untitled Quiz");
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, text: "", type: "short-answer" },
  ]);
  const [currentQuestionId, setCurrentQuestionId] = useState(1);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentPresentationIndex, setCurrentPresentationIndex] = useState(0);
  const [selectedPresentationAnswer, setSelectedPresentationAnswer] = useState<string | number | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [activityId, setActivityId] = useState("");

  // Timer states
  const [showTimer, setShowTimer] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化数据 - 根据 mode 和 id 决定是创建新问卷还是加载已有问卷
  // mode=create: 创建新问卷，使用默认模板
  // 有 id 且无 mode: 加载已有问卷数据 (GET /api/classroom_quiz/{id})
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const mode = params.get("mode");

    // 如果是创建模式，使用默认模板，不调用后端
    if (mode === "create") {
      // 保持默认状态，不加载任何数据
      return;
    }

    // 如果有 id 且不是创建模式，从后端加载数据
    if (id) {
      setActivityId(id);
      
      // 从后端 API 获取题目数据 (JSON 格式)
      fetch(`${API_BASE_URL}/classroom_quiz/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          if (data) {
            setDraftName(data.title || "Untitled Quiz");
            // 将后端返回的数据格式转换为前端格式
            if (data.questions && Array.isArray(data.questions)) {
              const formattedQuestions = data.questions.map((q: any) => {
                const questionType = q.type === 'shortanswer' ? 'short-answer' : 
                                   q.type === 'multiplechoice' ? 'multiple-choice' : 
                                   q.type === 'truefalse' ? 'true-false' : q.type;
                
                const baseQuestion = {
                  id: parseInt(q.id) || q.id,
                  text: q.text,
                  type: questionType,
                  options: q.options,
                  points: q.points,
                };

                // Handle correct answer based on question type
                if (questionType === 'multiple-choice' && Array.isArray(q.correctAnswer)) {
                  // Multiple-choice with multiple correct answers
                  return {
                    ...baseQuestion,
                    correctAnswers: q.correctAnswer,
                  };
                } else {
                  // Single correct answer (for true-false or multiple-choice with single answer)
                  return {
                    ...baseQuestion,
                    correctAnswer: q.correctAnswer,
                  };
                }
              });
              setQuestions(formattedQuestions);
              setCurrentQuestionId(formattedQuestions[0]?.id || 1);
            }
          }
        })
        .catch(error => {
          console.error('Error loading quiz:', error);
          alert('Failed to load quiz. Please try again.');
        });
    }
  }, []);

  // 处理演讲模式的键盘事件
  useEffect(() => {
    if (!isPresentationMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPresentationMode(false);
        setCurrentPresentationIndex(0);
      } else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (currentPresentationIndex < questions.length - 1) {
          setCurrentPresentationIndex(currentPresentationIndex + 1);
        } else {
          // 最后一页点击后返回编辑页面
          setIsPresentationMode(false);
          setCurrentPresentationIndex(0);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentPresentationIndex > 0) {
          setCurrentPresentationIndex(currentPresentationIndex - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPresentationMode, currentPresentationIndex, questions.length]);

  // Timer countdown effect
  useEffect(() => {
    if (isTimerRunning && timerTotalSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerTotalSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            alert("Timer finished!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timerTotalSeconds]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Get current question
  const currentQuestion = questions.find(q => q.id === currentQuestionId) || questions[0];

  // Add new question
  const addQuestion = () => {
    const newId = Math.max(...questions.map(q => q.id), 0) + 1;
    const newQuestion: Question = {
      id: newId,
      text: "",
      type: "short-answer",
      points: 10,
    };
    setQuestions([...questions, newQuestion]);
    setCurrentQuestionId(newId);
  };

  // Update question text
  const updateQuestionText = (text: string) => {
    setQuestions(questions.map(q => 
      q.id === currentQuestionId ? { ...q, text } : q
    ));
  };

  // Update question type
  const updateQuestionType = (type: QuestionType) => {
    setQuestions(questions.map(q => 
      q.id === currentQuestionId ? { ...q, type } : q
    ));
  };

  // Delete question
  const deleteQuestion = (id: number) => {
    if (questions.length === 1) return;
    const newQuestions = questions.filter(q => q.id !== id);
    setQuestions(newQuestions);
    if (currentQuestionId === id) {
      setCurrentQuestionId(newQuestions[0].id);
    }
  };

  // Update multiple-choice option
  const updateOption = (optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === currentQuestionId) {
        const newOptions = [...(q.options || ["", "", "", ""])];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  // Add new option
  const addOption = () => {
    setQuestions(questions.map(q => {
      if (q.id === currentQuestionId) {
        const currentOptions = q.options || ["", "", "", ""];
        // 限制最多 10 个选项
        if (currentOptions.length < 10) {
          return {
            ...q,
            options: [...currentOptions, ""]
          };
        }
      }
      return q;
    }));
  };

  // Delete option
  const deleteOption = (optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === currentQuestionId) {
        const newOptions = q.options || ["", "", "", ""];
        // 至少保留 2 个选项
        if (newOptions.length > 2) {
          return {
            ...q,
            options: newOptions.filter((_, i) => i !== optionIndex)
          };
        }
      }
      return q;
    }));
  };



  // Update correct answer for true/false and single-choice
  const updateCorrectAnswer = (answer: string | number) => {
    setQuestions(questions.map(q => 
      q.id === currentQuestionId ? { ...q, correctAnswer: answer } : q
    ));
  };

  // Update correct answers for multiple-choice (array of indices)
  const updateCorrectAnswers = (answers: number[]) => {
    setQuestions(questions.map(q => 
      q.id === currentQuestionId ? { ...q, correctAnswers: answers } : q
    ));
  };

  // Toggle correct answer for multiple-choice
  const toggleCorrectAnswer = (optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === currentQuestionId) {
        const currentAnswers = q.correctAnswers || [];
        const newAnswers = currentAnswers.includes(optionIndex)
          ? currentAnswers.filter(idx => idx !== optionIndex)
          : [...currentAnswers, optionIndex];
        return { ...q, correctAnswers: newAnswers };
      }
      return q;
    }));
  };

  // Update question points
  const updateQuestionPoints = (points: number) => {
    setQuestions(questions.map(q => 
      q.id === currentQuestionId ? { ...q, points } : q
    ));
  };

  // Handle presentation mode with backend data sync
  const handlePresent = async () => {
    if (!activityId) {
      alert("Please save the quiz first");
      return;
    }

    try {
      // 从后端获取最新的 Quiz 数据
      const response = await fetch(`${API_BASE_URL}/classroom_quiz/${activityId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data && data.title) {
        // 更新本地状态为最新数据
        setDraftName(data.title || "Untitled Quiz");
        if (data.questions && Array.isArray(data.questions)) {
          const formattedQuestions = data.questions.map((q: any) => {
            const questionType = q.type === 'shortanswer' ? 'short-answer' : 
                               q.type === 'multiplechoice' ? 'multiple-choice' : 
                               q.type === 'truefalse' ? 'true-false' : q.type;
            
            const baseQuestion = {
              id: q.id || q.id,
              text: q.text,
              type: questionType,
              options: q.options,
              points: q.points,
            };

            // Handle correct answer based on question type
            if (questionType === 'multiple-choice' && Array.isArray(q.correctAnswer)) {
              return {
                ...baseQuestion,
                correctAnswers: q.correctAnswer,
              };
            } else {
              return {
                ...baseQuestion,
                correctAnswer: q.correctAnswer,
              };
            }
          });
          setQuestions(formattedQuestions);
        }
        
        // 进入演示模式
        setIsPresentationMode(true);
      } else {
        alert('Failed to load quiz data. Please try again.');
      }
    } catch (error) {
      console.error('Error loading quiz for presentation:', error);
      alert('Failed to load quiz data. Please try again later.');
    }
  };

  // Timer functions
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, "0");
    const sec = (secs % 60).toString().padStart(2, "0");
    return `${mins}:${sec}`;
  };

  const handleTimerStart = () => {
    if (!isTimerRunning) {
      const total = timerMinutes * 60 + timerSeconds;
      if (total <= 0) {
        alert("Please set a valid countdown time");
        return;
      }
      setTimerTotalSeconds(total);
      setIsTimerRunning(true);
    }
  };

  const handleTimerPause = () => {
    setIsTimerRunning(false);
  };

  const handleTimerReset = () => {
    setIsTimerRunning(false);
    setTimerTotalSeconds(0);
    setTimerMinutes(5);
    setTimerSeconds(0);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  // Save activity - 根据是否有 activityId 决定是创建还是更新
  // 创建: POST /api/classroom_quiz
  // 更新: PUT /api/classroom_quiz/update/{id}
  const handleSave = async () => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    
    // 判断是创建模式还是更新模式
    const isCreating = mode === "create" || !activityId;
    
    // 将前端格式转换为后端要求的 JSON 格式
    const formattedQuestions = questions.map((q, index) => {
      const baseQuestion = {
        id: q.id,
        text: q.text,
        type: q.type === 'short-answer' ? 'shortanswer' : 
              q.type === 'multiple-choice' ? 'multiplechoice' : 
              q.type === 'true-false' ? 'truefalse' : q.type,
        options: q.options || null,
        points: q.points || 10,
      };

      // Handle correct answer based on question type
      if (q.type === 'multiple-choice') {
        // For multiple-choice, send correctAnswers array (can be single or multiple indices)
        return {
          ...baseQuestion,
          correctAnswer: q.correctAnswers && q.correctAnswers.length > 0 ? q.correctAnswers : null,
        };
      } else {
        // For true-false and single-choice, send single correctAnswer
        return {
          ...baseQuestion,
          correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : null,
        };
      }
    });

    // 准备发送给后端的完整数据 - 后端要求包含 title, type, classroom_quizType
    const requestData: any = {
      title: draftName,
      type: "quiz",  // 活动类型
      classroom_quizType: "standard",  // quiz 类型
      questions: formattedQuestions,
    };

    try {
      let response;
      let url;
      
      if (isCreating) {
        // 创建新问卷 - POST /api/classroom_quiz
        url = `${API_BASE_URL}/classroom_quiz`;
        console.log('Creating quiz at:', url);
        console.log('Request data:', requestData);
        
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
      } else {
        // 更新已有问卷 - PUT /api/classroom_quiz/update/{id}
        url = `${API_BASE_URL}/classroom_quiz/update/${activityId}`;
        console.log('Updating quiz at:', url);
        console.log('Request data:', requestData);
        
        response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
      }

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (isCreating) {
        // 创建成功后，保存返回的活动 ID 并跳转
        if (data.activity_id) {
          const savedId = String(data.activity_id);
          setActivityId(savedId);
          
          // 跳转到 quiz?id=<活动id> (不带 mode 参数)
          const newUrl = `${window.location.pathname}?id=${savedId}`;
          window.history.replaceState({}, '', newUrl);
          
          // 重新从后端加载数据
          const loadResponse = await fetch(`${API_BASE_URL}/classroom_quiz/${savedId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (loadResponse.ok) {
            const loadedData = await loadResponse.json();
            if (loadedData) {
              setDraftName(loadedData.title || "Untitled Quiz");
              if (loadedData.questions && Array.isArray(loadedData.questions)) {
                const formattedQuestions = loadedData.questions.map((q: any) => {
                  const questionType = q.type === 'shortanswer' ? 'short-answer' : 
                                     q.type === 'multiplechoice' ? 'multiple-choice' : 
                                     q.type === 'truefalse' ? 'true-false' : q.type;
                  
                  const baseQuestion = {
                    id: q.id || q.id,
                    text: q.text,
                    type: questionType,
                    options: q.options,
                    points: q.points,
                  };

                  if (questionType === 'multiple-choice' && Array.isArray(q.correctAnswer)) {
                    return {
                      ...baseQuestion,
                      correctAnswers: q.correctAnswer,
                    };
                  } else {
                    return {
                      ...baseQuestion,
                      correctAnswer: q.correctAnswer,
                    };
                  }
                });
                setQuestions(formattedQuestions);
                setCurrentQuestionId(formattedQuestions[0]?.id || 1);
              }
            }
          }
          
          // Record activity log
          const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
          activityLog.push({
            type: "created",
            title: `Created: ${draftName}`,
            description: `Quiz - ${draftName}`,
            timestamp: Date.now(),
            activityId: savedId,
          });
          localStorage.setItem("activityLog", JSON.stringify(activityLog));
          
          alert('Quiz created successfully!');
        }
      } else {
        // 更新成功
        // Record activity log
        const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
        activityLog.push({
          type: "edited",
          title: `Updated: ${draftName}`,
          description: `Quiz - ${draftName}`,
          timestamp: Date.now(),
          activityId: activityId,
        });
        localStorage.setItem("activityLog", JSON.stringify(activityLog));
        
        alert('Quiz updated successfully!');
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Failed to save quiz. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!activityId) {
      alert("Please save the quiz first");
      return;
    }
    
    // 直接生成前端移动响应页面链接,不需要调用后端
    const frontendUrl = FRONTEND_URL;
    const link = `${frontendUrl}/response/${activityId}`;
    setShareLink(link);
    setShareDialogOpen(true);
    
    // Record activity log
    const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
    activityLog.push({
      type: "shared",
      title: `Shared: ${draftName}`,
      description: `Quiz - Link: ${link}`,
      timestamp: Date.now(),
      activityId: activityId,
    });
    localStorage.setItem("activityLog", JSON.stringify(activityLog));
  };

  const handleViewResults = () => {
    // 结果查看功能会调用后端 API
    // GET /api/classroom_quiz/{activityId}/results
    
    if (!activityId) {
      alert("Please save the quiz first");
      return;
    }
    
    setShowResults(true);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert("Link copied to clipboard!");
  };

  return (
    <>
      {/* Results Viewer */}
      {showResults && activityId && (
        <ResultViewer
          activityId={activityId}
          activity={{
            id: activityId,
            title: draftName,
            type: "Classroom Quiz",
            activityType: "quiz",
            questions: questions,
          }}
          onClose={() => setShowResults(false)}
        />
      )}

      {/* Presentation Mode */}
      {!showResults && isPresentationMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Timer Button - Top Right */}
          <button
            onClick={() => setShowTimer(!showTimer)}
            className="fixed top-4 right-4 z-50 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all border-2 border-gray-200 hover:border-blue-400"
            title="Toggle Timer"
          >
            <Clock className="h-5 w-5 text-blue-600" />
          </button>

          {/* Mini Timer Display */}
          {showTimer && (
            <div className="fixed top-4 right-20 z-50 bg-white rounded-lg shadow-lg border-2 border-blue-200 p-4 min-w-[200px]">
              <div className="text-center space-y-3">
                {/* Timer Display */}
                <div className="text-3xl font-bold font-mono text-blue-900">
                  {timerTotalSeconds > 0 ? formatTime(timerTotalSeconds) : "00:00"}
                </div>

                {/* Settings (only when timer is not running) */}
                {!isTimerRunning && timerTotalSeconds === 0 && (
                  <div className="flex gap-2 items-center justify-center text-sm">
                    <Input
                      type="number"
                      min="0"
                      value={timerMinutes}
                      onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-center text-xs"
                      placeholder="min"
                    />
                    <span className="text-xs text-gray-600">:</span>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={timerSeconds}
                      onChange={(e) => setTimerSeconds(Math.min(59, parseInt(e.target.value) || 0))}
                      className="w-16 h-8 text-center text-xs"
                      placeholder="sec"
                    />
                  </div>
                )}

                {/* Controls */}
                <div className="flex gap-2 justify-center">
                  {!isTimerRunning && timerTotalSeconds === 0 ? (
                    <Button
                      size="sm"
                      onClick={handleTimerStart}
                      className="bg-green-500 hover:bg-green-600 text-white h-8 text-xs px-3"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  ) : isTimerRunning ? (
                    <Button
                      size="sm"
                      onClick={handleTimerPause}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white h-8 text-xs px-3"
                    >
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={handleTimerStart}
                        className="bg-green-500 hover:bg-green-600 text-white h-8 text-xs px-2"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleTimerReset}
                        className="bg-red-500 hover:bg-red-600 text-white h-8 text-xs px-2"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  {isTimerRunning && (
                    <Button
                      size="sm"
                      onClick={handleTimerReset}
                      className="bg-red-500 hover:bg-red-600 text-white h-8 text-xs px-2"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scrollable content area - includes everything */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1 flex flex-col justify-center items-center px-8 py-8">
              {/* Question type and points badges */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  QuestionTypeColor[questions[currentPresentationIndex].type].bg
                } ${QuestionTypeColor[questions[currentPresentationIndex].type].text}`}>
                  {QuestionTypeLabel[questions[currentPresentationIndex].type]}
                </div>
                <div className="px-4 py-2 rounded-full text-sm font-semibold bg-red-50 text-red-700 border-2 border-red-200">
                  {questions[currentPresentationIndex].points || 10} Points
                </div>
              </div>

              {/* Question text */}
              <h1 className="text-6xl font-bold text-foreground text-center max-w-4xl leading-tight mb-8 whitespace-pre-wrap break-words">
                {questions[currentPresentationIndex].text || `Question ${currentPresentationIndex + 1}`}
              </h1>

              {/* Answer options for multiple choice */}
              {questions[currentPresentationIndex].type === "multiple-choice" && (
                <div className="w-full max-w-2xl space-y-3 mb-8">
                  {(questions[currentPresentationIndex].options || ["", "", "", ""]).map((option, index) => (
                    <Button
                      key={index}
                      className="w-full px-6 py-4 text-lg font-semibold justify-start h-auto min-h-14"
                      variant={selectedPresentationAnswer === index ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPresentationAnswer(index);
                      }}
                    >
                      <span className="mr-4 flex-shrink-0">{String.fromCharCode(65 + index)}.</span>
                      <span className="whitespace-pre-wrap break-words text-left">{option || `Option ${String.fromCharCode(65 + index)}`}</span>
                    </Button>
                  ))}
                </div>
              )}

              {/* Answer options for true-false */}
              {questions[currentPresentationIndex].type === "true-false" && (
                <div className="flex gap-6 mb-8 flex-wrap justify-center">
                  <Button
                    className="px-8 py-3 text-lg font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPresentationAnswer("true");
                      updateCorrectAnswer("true");
                    }}
                    variant={selectedPresentationAnswer === "true" ? "default" : "outline"}
                  >
                    ✓ True
                  </Button>
                  <Button
                    className="px-8 py-3 text-lg font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPresentationAnswer("false");
                      updateCorrectAnswer("false");
                    }}
                    variant={selectedPresentationAnswer === "false" ? "default" : "outline"}
                  >
                    ✗ False
                  </Button>
                </div>
              )}

              {/* Navigation hint */}
              <div className="text-muted-foreground text-lg mt-8">
                {currentPresentationIndex + 1} / {questions.length}
              </div>
            </div>
          </div>

          {/* Bottom controls text - fixed */}
          <div className="w-full px-8 py-6 text-center text-muted-foreground text-sm border-t border-border bg-white flex-shrink-0">
            <p>Click or press Right Arrow / Space to continue • Press ESC to exit</p>
          </div>

          {/* Click area for next slide */}
          <div 
            className="fixed inset-0 cursor-pointer"
            onClick={() => {
              setSelectedPresentationAnswer(null);
              if (currentPresentationIndex < questions.length - 1) {
                setCurrentPresentationIndex(currentPresentationIndex + 1);
              } else {
                setIsPresentationMode(false);
                setCurrentPresentationIndex(0);
              }
            }}
            style={{ zIndex: -1 }}
          />
        </div>
      )}

      {/* Normal editing mode */}
      {!isPresentationMode && (
      <div className={`p-8 transition-all duration-300 ${isAIOpen ? 'pr-[416px]' : ''}`}>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to="/activities">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            {!isAIOpen && <h2 className="text-xl font-bold">Classroom Quiz</h2>}
          </div>

          {/* 工具栏 - 统一样式 */}
          <div className="flex items-center gap-6 px-6 py-3 bg-white rounded-lg border">
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Enter draft name..."
              className="text-sm border-0 focus-visible:ring-0 px-0 w-48"
            />
            
            <div className="w-px h-6 bg-border"></div>
            
            <Select
              value={currentQuestion.type}
              onValueChange={(value) => updateQuestionType(value as QuestionType)}
            >
              <SelectTrigger className="w-44 border-0 focus-visible:ring-0">
                <SelectValue placeholder="Question type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short-answer">Short Answer</SelectItem>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="true-false">True/False</SelectItem>
              </SelectContent>
            </Select>

            <div className="w-px h-6 bg-border"></div>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsAIOpen(!isAIOpen)}
            >
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </Button>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
            >
              Save
            </Button>
            <Button variant="outline" onClick={handlePresent}>Present</Button>
            <Button variant="outline" className="gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleViewResults}>
              <BarChart className="h-4 w-4" />
              Result
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          {/* Left: Thumbnails (Compact version) */}
          <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
            {questions.map((question, index) => {
              const colors = QuestionTypeColor[question.type];
              return (
                <div key={question.id} className="relative group">
                  <Card
                    className={`p-0 cursor-pointer transition-all overflow-hidden ${
                      currentQuestionId === question.id
                        ? `border-2 border-primary`
                        : `hover:shadow-md`
                    }`}
                    onClick={() => setCurrentQuestionId(question.id)}
                  >
                    {/* Thumbnail container - Smaller */}
                    <div className={`aspect-video ${colors.bg} border-l-4 ${colors.border} flex flex-col p-2 relative`}>
                      {/* Question number */}
                      <div className="absolute top-1 left-1">
                        <span className={`text-xs font-bold ${colors.text}`}>
                          Q{index + 1}
                        </span>
                      </div>

                      {/* Delete button */}
                      {questions.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuestion(question.id);
                          }}
                          className="absolute top-1 right-1 w-4 h-4 bg-destructive/10 hover:bg-destructive/20 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="h-2 w-2 text-destructive" />
                        </button>
                      )}

                      {/* Thumbnail content */}
                      <div className="flex-1 flex flex-col justify-center items-center px-1">
                        <p className="text-[10px] text-center line-clamp-2 leading-tight font-medium">
                          {question.text || "Edit"}
                        </p>
                      </div>

                      {/* Type label */}
                      <div className="flex justify-end pt-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                          {QuestionTypeLabel[question.type]}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}

            {/* Add button */}
            <Button
              variant="outline"
              onClick={addQuestion}
              size="sm"
              className="w-full h-10 border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </div>
          <Card className="lg:col-span-5 p-8 flex flex-col bg-white min-h-[calc(100vh-180px)] overflow-y-auto">
            <div className="flex flex-col items-center justify-center">
              {/* 题目类型标签 */}
              <div className={`mb-6 px-4 py-2 rounded-full text-sm font-medium ${
                QuestionTypeColor[currentQuestion.type].bg
              } ${QuestionTypeColor[currentQuestion.type].text}`}>
                {QuestionTypeLabel[currentQuestion.type]}
              </div>

              {currentQuestion.text ? (
                <h3 className="text-3xl font-medium text-center max-w-3xl mb-8 whitespace-pre-wrap break-words">
                  {currentQuestion.text}
                </h3>
              ) : (
                <div className="text-center space-y-4 mb-8">
                  <div className="text-6xl text-muted-foreground/20">📝</div>
                  <p className="text-muted-foreground">Click below to enter question</p>
                </div>
              )}

              {/* Dynamic content area - Show different content based on question type */}
              {currentQuestion.type === "multiple-choice" && (
                <div className="w-full max-w-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-foreground">Options</h4>
                    <span className="text-xs text-muted-foreground">Check correct answer(s)</span>
                  </div>
                  <div className="space-y-2">
                    {(currentQuestion.options || ["", "", "", ""]).map((option, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={(currentQuestion.correctAnswers || []).includes(index)}
                          onChange={() => toggleCorrectAnswer(index)}
                          className="mt-3 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                          title="Mark as correct answer"
                        />
                        <span className="font-semibold text-muted-foreground flex-shrink-0 pt-2.5">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <textarea
                            value={option}
                            onChange={(e) => {
                              updateOption(index, e.target.value);
                              // Auto-resize textarea
                              e.currentTarget.style.height = 'auto';
                              e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 120) + 'px';
                            }}
                            onInput={(e) => {
                              // Auto-resize on input
                              e.currentTarget.style.height = 'auto';
                              e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 120) + 'px';
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            className="text-sm w-full px-3 py-2 border border-input rounded-md bg-white resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            rows={1}
                            style={{ minHeight: '40px', overflow: 'hidden' }}
                          />
                        </div>
                        {(currentQuestion.options || ["", "", "", ""]).length > 2 && (
                          <button
                            onClick={() => deleteOption(index)}
                            className="text-destructive hover:text-destructive/80 transition-colors flex-shrink-0 pt-2.5"
                            title="Delete option"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {((currentQuestion.options || ["", "", "", ""]).length < 10) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 w-full"
                      onClick={addOption}
                    >
                      <Plus className="h-4 w-4" />
                      Add Option
                    </Button>
                  )}
                  {((currentQuestion.options || ["", "", "", ""]).length >= 10) && (
                    <p className="text-xs text-muted-foreground text-center">
                      Maximum 10 options reached
                    </p>
                  )}
                </div>
              )}

              {currentQuestion.type === "short-answer" && (
                <div className="w-full max-w-2xl space-y-3">
                  <p className="text-sm text-muted-foreground text-center italic">
                    Students can type their answer here
                  </p>
                </div>
              )}

              {currentQuestion.type === "true-false" && (
                <div className="w-full max-w-2xl space-y-3">
                  <div className="flex gap-4 justify-center">
                    <Button 
                      variant={currentQuestion.correctAnswer === "true" ? "default" : "outline"} 
                      className="gap-2"
                      onClick={() => updateCorrectAnswer("true")}
                    >
                      <span>✓</span>
                      True
                    </Button>
                    <Button 
                      variant={currentQuestion.correctAnswer === "false" ? "default" : "outline"} 
                      className="gap-2"
                      onClick={() => updateCorrectAnswer("false")}
                    >
                      <span>✗</span>
                      False
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom edit area */}
            <div className="mt-6 pt-6 border-t space-y-3 flex-shrink-0">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Question Content
                </label>
                <textarea
                  value={currentQuestion.text}
                  onChange={(e) => {
                    updateQuestionText(e.target.value);
                    // Auto-resize textarea
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 200) + 'px';
                  }}
                  onInput={(e) => {
                    // Auto-resize on input
                    e.currentTarget.style.height = 'auto';
                    e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 200) + 'px';
                  }}
                  placeholder="Enter question content..."
                  className="w-full px-3 py-2 mt-2 text-base border border-input rounded-md bg-white resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  rows={1}
                  style={{ minHeight: '44px', overflow: 'hidden' }}
                />
              </div>

              {/* Points and Correct Answer Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Points
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={currentQuestion.points || 10}
                    onChange={(e) => updateQuestionPoints(Number(e.target.value))}
                    placeholder="Points for this question"
                    className="mt-2"
                  />
                </div>
                
                {currentQuestion.type === "multiple-choice" && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Correct Answer(s)
                    </label>
                    <div className="mt-2 px-3 py-2 text-sm border border-input rounded-md bg-muted">
                      {(currentQuestion.correctAnswers || []).length > 0 ? (
                        <span className="text-foreground">
                          {(currentQuestion.correctAnswers || []).map(idx => String.fromCharCode(65 + idx)).join(", ")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Check options above to set correct answer(s)</span>
                      )}
                    </div>
                  </div>
                )}

                {currentQuestion.type === "short-answer" && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Grading Method
                    </label>
                    <div className="mt-2 px-3 py-2 text-sm border border-input rounded-md bg-muted text-muted-foreground">
                      AI Auto-grading (Correct/Incorrect)
                    </div>
                  </div>
                )}

                {currentQuestion.type === "true-false" && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Correct Answer
                    </label>
                    <Select
                      value={currentQuestion.correctAnswer?.toString() || ""}
                      onValueChange={(value) => updateCorrectAnswer(value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">✓ True</SelectItem>
                        <SelectItem value="false">✗ False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Quiz</DialogTitle>
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
                Scan this QR code to access the quiz
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Panel */}
      <AIAssistantPanel
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        context="Classroom Quiz"
      />
    </>
  );
};

export default Quiz;
