import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, X, Trash2, Eye, Copy, Calendar, ArrowLeft, Sparkles, QrCode, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { AIAssistantPanel } from "@/components/AIAssistantPanel";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { WordCloudComponent } from "@/components/WordCloud";
import { API_BASE_URL, FRONTEND_URL } from "@/services/api";

interface PollQuestion {
  id: string;
  question: string;
  type: "single" | "multiple" | "text" | "scale";
  options?: string[];
  required: boolean;
}

interface PollResponse {
  id: string;
  respondentId: string;
  respondentName: string;
  answers: {
    questionId: string | number;  // 支持字符串ID和数字索引
    answer: string | string[] | number | number[];  // 支持文本和索引
  }[];
  submittedAt: number;
  isAnonymous: boolean;
}

interface OpinionPoll {
  id: string;
  title: string;
  description: string;
  questions: PollQuestion[];
  createdBy: string;
  createdAt: number;
  openTime: number;
  closeTime?: number;
  status: "draft" | "open" | "closed";
  shareLink: string;
  allowAnonymous: boolean;
  responses: PollResponse[];
  responseCount: number;
}

const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiIyNTA0MDc1OEciLCJ1c2VyX25hbWUiOiJUZXN0IFVzZXIiLCJyb2xlIjoidGVhY2hlciIsImV4cCI6MjEyMzMyNTY2OH0.6ZNz0Ym4WaXVWgfO7riGh16fpXhKOOWJzFRX0zX8sBY";

const OpinionPoll = () => {
  const navigate = useNavigate();
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [polls, setPolls] = useState<OpinionPoll[]>([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openResultsDialog, setOpenResultsDialog] = useState(false);
  const [openCopyDialog, setOpenCopyDialog] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [openTextDetailDialog, setOpenTextDetailDialog] = useState(false);
  const [selectedTextAnswers, setSelectedTextAnswers] = useState<string[]>([]);
  const [selectedTextQuestion, setSelectedTextQuestion] = useState("");
  const [selectedQRLink, setSelectedQRLink] = useState("");
  const [pollToCopy, setPollToCopy] = useState<OpinionPoll | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<OpinionPoll | null>(null);
  const [currentUserName] = useState("John");
  const [currentUserId] = useState("user_123");

  const [newPoll, setNewPoll] = useState({
    title: "",
    description: "",
    questions: [
      {
        id: "q_1",
        question: "Question 1",
        type: "single" as const,
        options: ["Option A", "Option B", "Option C"],
        required: true,
      },
    ],
    openTime: new Date().toISOString().slice(0, 16),
    closeTime: "",
    allowAnonymous: false,
  });

  // 从后端加载问卷
  useEffect(() => {
    const loadPolls = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/polls`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success && data.polls) {
          // Ensure shareLink, responses, and responseCount are set
          const pollsWithDefaults = data.polls.map((poll: OpinionPoll) => ({
            ...poll,
            shareLink: poll.shareLink || `${FRONTEND_URL}/opinion-poll/${poll.id}`,
            responses: poll.responses || [],
            responseCount: poll.responseCount || 0,
            questions: poll.questions || [],
          }));
          setPolls(pollsWithDefaults);
        }
      } catch (error) {
        console.error("Error loading polls:", error);
        alert("Failed to load polls. Please try again later.");
      }
    };
    
    loadPolls();
  }, []);

  // 当选中问卷时，加载其数据到编辑表单
  useEffect(() => {
    if (selectedPoll && openEditDialog) {
      setNewPoll({
        title: selectedPoll.title || "",
        description: selectedPoll.description || "",
        questions: Array.isArray(selectedPoll.questions) && selectedPoll.questions.length > 0 
          ? selectedPoll.questions as any
          : [
              {
                id: "q_1",
                question: "Question 1",
                type: "single",
                options: ["Option A", "Option B", "Option C"],
                required: true,
              },
            ],
        openTime: selectedPoll.openTime 
          ? new Date(selectedPoll.openTime).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        closeTime: selectedPoll.closeTime 
          ? new Date(selectedPoll.closeTime).toISOString().slice(0, 16) 
          : "",
        allowAnonymous: selectedPoll.allowAnonymous || false,
      });
    }
  }, [selectedPoll, openEditDialog]);

  // 生成分享链接
  const generateShareLink = (pollId: string) => {
    return `${FRONTEND_URL}/response/${pollId}`;
  };

  // Publish poll
  const handlePublishPoll = async () => {
    if (!newPoll.title || !newPoll.questions.some((q) => q.question)) {
      alert("Poll title and at least one question are required");
      return;
    }

    const pollData = {
      title: newPoll.title,
      description: newPoll.description,
      questions: newPoll.questions,
      openTime: new Date(newPoll.openTime).getTime(),
      closeTime: newPoll.closeTime ? new Date(newPoll.closeTime).getTime() : undefined,
      allowAnonymous: newPoll.allowAnonymous,
      status: "open",
      createdBy: currentUserId,
      createdAt: Date.now(),
    };

    try {
      if (selectedPoll) {
        // Edit existing poll
        const response = await fetch(`${API_BASE_URL}/polls/update/${selectedPoll.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(pollData),
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success) {
          setPolls(polls.map((p) =>
            p.id === selectedPoll.id
              ? { ...p, ...data.poll, shareLink: `${FRONTEND_URL}/response/${data.poll.id}` }
              : p
          ));
          // Record activity log
          const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
          activityLog.push({
            type: "edited",
            title: `Updated: ${newPoll.title}`,
            description: `Opinion Poll - ${newPoll.title}`,
            timestamp: Date.now(),
            activityId: selectedPoll.id,
          });
          localStorage.setItem("activityLog", JSON.stringify(activityLog));
          alert("Poll updated successfully!");
        }
      } else {
        // Create new poll
        const response = await fetch(`${API_BASE_URL}/polls/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(pollData),
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success && data.poll) {
          const pollWithDefaults = {
            ...data.poll,
            shareLink: `${FRONTEND_URL}/response/${data.poll.id}`,
            responses: [],
            responseCount: 0,
          };
          setPolls([pollWithDefaults, ...polls]);
          // Record activity log
          const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
          activityLog.push({
            type: "created",
            title: `Created: ${newPoll.title}`,
            description: `Opinion Poll - ${newPoll.title}`,
            timestamp: Date.now(),
            activityId: data.poll.id,
          });
          localStorage.setItem("activityLog", JSON.stringify(activityLog));
          alert("Poll published successfully!");
        }
      }
    } catch (error) {
      console.error("Error publishing poll:", error);
      alert("Failed to publish poll. Please try again later.");
    }

    resetNewPoll();
    setSelectedPoll(null);
    setOpenEditDialog(false);
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!newPoll.title || !newPoll.questions.some((q) => q.question)) {
      alert("Poll title and at least one question are required");
      return;
    }

    const pollData = {
      title: newPoll.title,
      description: newPoll.description,
      questions: newPoll.questions,
      openTime: new Date(newPoll.openTime).getTime(),
      closeTime: newPoll.closeTime ? new Date(newPoll.closeTime).getTime() : undefined,
      allowAnonymous: newPoll.allowAnonymous,
      status: "draft",
      createdBy: currentUserId,
      createdAt: Date.now(),
    };

    try {
      if (selectedPoll) {
        // Edit existing draft
        const response = await fetch(`${API_BASE_URL}/polls/update/${selectedPoll.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(pollData),
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success) {
          setPolls(polls.map((p) => p.id === selectedPoll.id ? { ...p, ...data.poll } : p));
          // Record activity log
          const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
          activityLog.push({
            type: "edited",
            title: `Updated Draft: ${newPoll.title}`,
            description: `Opinion Poll Draft - ${newPoll.title}`,
            timestamp: Date.now(),
            activityId: selectedPoll.id,
          });
          localStorage.setItem("activityLog", JSON.stringify(activityLog));
          alert("Draft saved successfully!");
        }
      } else {
        // Create new draft
        const response = await fetch(`${API_BASE_URL}/polls/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(pollData),
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success && data.poll) {
          const pollWithDefaults = {
            ...data.poll,
            shareLink: generateShareLink(data.poll.id),
            responses: [],
            responseCount: 0,
          };
          setPolls([pollWithDefaults, ...polls]);
          // Record activity log
          const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
          activityLog.push({
            type: "created",
            title: `Created Draft: ${newPoll.title}`,
            description: `Opinion Poll Draft - ${newPoll.title}`,
            timestamp: Date.now(),
            activityId: data.poll.id,
          });
          localStorage.setItem("activityLog", JSON.stringify(activityLog));
          alert("Draft saved successfully!");
        }
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Failed to save draft. Please try again later.");
    }

    alert("Poll saved as draft");
    resetNewPoll();
    setSelectedPoll(null);
    setOpenEditDialog(false);
  };

  // Reset form
  const resetNewPoll = () => {
    setNewPoll({
      title: "",
      description: "",
      questions: [
        {
          id: "q_1",
          question: "Question 1",
          type: "single",
          options: ["Option A", "Option B", "Option C"],
          required: true,
        },
      ],
      openTime: new Date().toISOString().slice(0, 16),
      closeTime: "",
      allowAnonymous: false,
    });
  };

  // Update question
  const updateQuestion = (questionId: string, field: string, value: any) => {
    setNewPoll({
      ...newPoll,
      questions: newPoll.questions.map((q) =>
        q.id === questionId ? { ...q, [field]: value } : q
      ),
    });
  };

  // Update option
  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setNewPoll({
      ...newPoll,
      questions: newPoll.questions.map((q) => {
        if (q.id === questionId && q.options) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      }),
    });
  };

  // Add option
  const addOption = (questionId: string) => {
    setNewPoll({
      ...newPoll,
      questions: newPoll.questions.map((q) => {
        if (q.id === questionId && q.options) {
          return {
            ...q,
            options: [...q.options, `Option ${String.fromCharCode(65 + q.options.length)}`],
          };
        }
        return q;
      }),
    });
  };

  // Delete option
  const deleteOption = (questionId: string, optionIndex: number) => {
    setNewPoll({
      ...newPoll,
      questions: newPoll.questions.map((q) => {
        if (q.id === questionId && q.options && q.options.length > 2) {
          return {
            ...q,
            options: q.options.filter((_, idx) => idx !== optionIndex),
          };
        }
        return q;
      }),
    });
  };

  // Add question
  const [questionCounter, setQuestionCounter] = useState(2);
  const addQuestion = () => {
    const newQId = `q_${questionCounter}`;
    setNewPoll({
      ...newPoll,
      questions: [
        ...newPoll.questions,
        {
          id: newQId,
          question: "New Question",
          type: "single",
          options: ["Option A", "Option B", "Option C"],
          required: true,
        },
      ],
    });
  };

  // Delete question
  const deleteQuestion = (questionId: string) => {
    if (newPoll.questions.length > 1) {
      setNewPoll({
        ...newPoll,
        questions: newPoll.questions.filter((q) => q.id !== questionId),
      });
    }
  };

  // Share poll
  const handleShare = (poll: OpinionPoll) => {
    const frontendUrl = FRONTEND_URL;
    const link = `${frontendUrl}/response/${poll.id}`;
    setSelectedQRLink(link);
    setOpenQRDialog(true);
    
    // 添加到本地 activityLog
    try {
      const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
      const newLog = {
        type: "shared",
        title: `Shared: ${poll.title}`,
        description: `Opinion Poll - Link: ${link}`,
        timestamp: Date.now(),
        activityId: poll.id,
      };
      activityLog.push(newLog);
      localStorage.setItem("activityLog", JSON.stringify(activityLog));
    } catch (logError) {
      console.error("Error saving to activity log:", logError);
    }
  };

  // Copy link
  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert("Link copied to clipboard");
  };

  // View QR Code
  const handleViewQR = (link: string) => {
    setSelectedQRLink(link);
    setOpenQRDialog(true);
  };

  // 查看结果时获取最新的响应数据
  const handleViewResults = async (poll: OpinionPoll) => {
    try {
      // 获取最新的问卷响应数据
      const response = await fetch(`${API_BASE_URL}/studentpoll/${poll.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success && data.poll) {
        // 后端返回的是完整的poll对象，包含responses
        const updatedPoll = {
          ...poll,
          responses: data.poll.responses || [],
          responseCount: data.poll.responseCount || 0,
          questions: data.poll.questions || poll.questions,
        };
        setSelectedPoll(updatedPoll);
        // 同时更新问卷列表中的数据
        setPolls(polls.map(p => p.id === poll.id ? updatedPoll : p));
      } else {
        // 如果接口返回失败，使用现有数据
        setSelectedPoll(poll);
      }
    } catch (error) {
      console.error("Error fetching poll responses:", error);
      // 出错时使用现有数据
      setSelectedPoll(poll);
    }
    
    setOpenResultsDialog(true);
  };

  // Copy poll
  const handleCopyPoll = (poll: OpinionPoll) => {
    setPollToCopy(poll);
    setOpenCopyDialog(true);
  };

  const confirmCopyPoll = async () => {
    if (!pollToCopy) return;

    // 查找已有的副本数量
    const copyRegex = new RegExp(`^${pollToCopy.title.replace(/\s*\(\d+\)$/, '')}(?:\\s*\\((\\d+)\\))?$`);
    const existingCopies = polls.filter(p => copyRegex.test(p.title));
    const maxCopyNumber = existingCopies.reduce((max, p) => {
      const match = p.title.match(/\((\d+)\)$/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    
    const newCopyNumber = maxCopyNumber + 1;
    const baseTitle = pollToCopy.title.replace(/\s*\(\d+\)$/, '');
    const newTitle = `${baseTitle} (${newCopyNumber})`;
    
    const pollData = {
      title: newTitle,
      description: pollToCopy.description,
      questions: pollToCopy.questions,
      openTime: pollToCopy.openTime,
      closeTime: pollToCopy.closeTime,
      allowAnonymous: pollToCopy.allowAnonymous,
      status: "draft",
      createdBy: currentUserId,
      createdAt: Date.now(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/polls/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pollData),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success && data.poll) {
        const copiedPoll = {
          ...data.poll,
          shareLink: generateShareLink(data.poll.id),
          responses: [],
          responseCount: 0,
        };
        setPolls([copiedPoll, ...polls]);
        alert("Poll copied successfully!");
      }
    } catch (error) {
      console.error("Error copying poll:", error);
      alert("Failed to copy poll. Please try again later.");
    }
    
    setOpenCopyDialog(false);
    setPollToCopy(null);
  };

  // Format time
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US");
  };

  // Calculate poll statistics
  const calculateStatistics = (poll: OpinionPoll) => {
    const stats: {
      [questionId: string]: {
        question: string;
        type: string;
        stats?: any;
        answers?: any[];
        totalResponses?: number;
      };
    } = {};

    // 确保 questions 和 responses 存在
    if (!poll.questions || !Array.isArray(poll.questions)) {
      return stats;
    }

    const responses = poll.responses || [];

    poll.questions.forEach((question, questionIndex) => {
      // 后端可能使用数字索引作为questionId，需要同时匹配字符串ID和数字索引
      const questionResponses = responses
        .map((r) => {
          // 尝试匹配字符串ID (q_1) 或数字索引 (1)
          const questionNumericId = parseInt(question.id.replace('q_', ''));
          const answer = r.answers?.find((a) => 
            a.questionId === question.id || 
            (typeof a.questionId === 'number' && a.questionId === questionNumericId) ||
            (typeof a.questionId === 'number' && a.questionId === questionIndex + 1)
          );
          return answer?.answer;
        })
        .filter((answer) => answer !== undefined && answer !== null);

      if (question.type === "single" || question.type === "multiple") {
        const optionCounts: { [key: string]: number } = {};
        const options = question.options || [];
        options.forEach((option) => {
          optionCounts[option] = 0;
        });

        questionResponses.forEach((answer) => {
          // 处理字符串答案（选项文本）
          if (typeof answer === "string" && optionCounts.hasOwnProperty(answer)) {
            optionCounts[answer]++;
          } 
          // 处理数字答案（选项索引）
          else if (typeof answer === "string" || typeof answer === "number") {
            const index = typeof answer === "string" ? parseInt(answer) : answer;
            if (!isNaN(index) && index >= 0 && index < options.length) {
              optionCounts[options[index]]++;
            }
          } 
          // 处理数组答案（多选）
          else if (Array.isArray(answer)) {
            answer.forEach((a) => {
              if (typeof a === "string" && optionCounts.hasOwnProperty(a)) {
                optionCounts[a]++;
              } else if (typeof a === "number" && a >= 0 && a < options.length) {
                optionCounts[options[a]]++;
              } else if (typeof a === "string") {
                const index = parseInt(a);
                if (!isNaN(index) && index >= 0 && index < options.length) {
                  optionCounts[options[index]]++;
                }
              }
            });
          }
        });

        stats[question.id] = {
          question: question.question,
          type: question.type,
          stats: Object.entries(optionCounts).map(([option, count]) => ({
            option,
            count,
            percentage: responses.length > 0 ? Math.round((count / responses.length) * 100) : 0,
          })),
        };
      } else if (question.type === "scale") {
        const scaleCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        questionResponses.forEach((answer) => {
          const scaleValue = typeof answer === "string" ? parseInt(answer) : answer;
          if (typeof scaleValue === "number" && scaleValue >= 1 && scaleValue <= 5) {
            scaleCounts[scaleValue]++;
          }
        });

        stats[question.id] = {
          question: question.question,
          type: question.type,
          stats: Object.entries(scaleCounts).map(([level, count]) => ({
            level: parseInt(level),
            count,
            percentage: responses.length > 0 ? Math.round((count / responses.length) * 100) : 0,
          })),
        };
      } else if (question.type === "text") {
        // 文本类型问题，收集所有答案
        stats[question.id] = {
          question: question.question,
          type: question.type,
          answers: questionResponses,
          totalResponses: questionResponses.length,
        };
      }
    });

    return stats;
  };

  // 删除问卷
  const handleDeletePoll = async (pollId: string) => {
    if (!window.confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/polls/delete/${pollId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        alert("Poll deleted successfully!");
        // Refresh the polls list
        setPolls((prevPolls) => prevPolls.filter((poll) => poll.id !== pollId));
      }
    } catch (error) {
      console.error("Error deleting poll:", error);
      alert("Failed to delete poll. Please try again later.");
    }
  };

  return (
    <>
      <div className={`p-8 transition-all duration-300 ${isAIOpen ? 'pr-[416px]' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/activities")}
              className="hover:bg-gray-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-2xl font-bold">Opinion Poll</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsAIOpen(!isAIOpen)}
            >
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </Button>
            <Button onClick={() => setOpenEditDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Poll
            </Button>
          </div>
        </div>

      {/* Poll list */}
      <div className="space-y-4">
        {polls.length > 0 ? (
          polls.map((poll) => (
            <Card key={poll.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{poll.title}</h3>
                  {poll.description && (
                    <p className="text-sm text-gray-600 mb-3">{poll.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>📅 Open: {formatTime(poll.openTime)}</span>
                    {poll.closeTime && <span>Close: {formatTime(poll.closeTime)}</span>}
                    <Badge variant={poll.status === "open" ? "default" : "secondary"}>
                      {poll.status === "open" ? "Active" : "Closed"}
                    </Badge>
                    <span>👥 {poll.responseCount} responses</span>
                  </div>
                </div>
              </div>

              {/* Poll share link */}
              <div className="bg-gray-50 p-4 rounded mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Share:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(poll)}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    QR Code & Link
                  </Button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewResults(poll)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Results ({poll.responseCount})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPoll(poll);
                    setOpenEditDialog(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyPoll(poll)}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const newStatus = poll.status === "open" ? "closed" : "open";
                    try {
                      const response = await fetch(`${API_BASE_URL}/polls/update/${poll.id}`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ ...poll, status: newStatus }),
                      });
                      
                      if (!response.ok) {
                        throw new Error(`API Error: ${response.statusText}`);
                      }
                      
                      const data = await response.json();
                      if (data.success) {
                        setPolls(polls.map((p) => p.id === poll.id ? { ...p, status: newStatus } : p));
                      }
                    } catch (error) {
                      console.error("Error updating poll status:", error);
                      alert("Failed to update poll status. Please try again later.");
                    }
                  }}
                  className={poll.status === "open" ? "gap-2" : "gap-2"}
                >
                  {poll.status === "open" ? "Pause Collection" : "Resume Collection"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => handleDeletePoll(poll.id)}
                  className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No polls yet. Create one using the button above!</p>
          </Card>
        )}
      </div>
      </div>

      {/* Copy confirmation dialog */}
      <Dialog open={openCopyDialog} onOpenChange={setOpenCopyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>复制活动</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              确定要复制活动 "{pollToCopy?.title}" 吗？
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenCopyDialog(false);
                setPollToCopy(null);
              }}
            >
              取消
            </Button>
            <Button onClick={confirmCopyPoll}>
              同意
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit poll dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPoll ? "Edit Poll" : "Create New Poll"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium mb-2">Poll Title *</label>
                <Input
                  placeholder="Enter poll title"
                  value={newPoll.title}
                  onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Poll Description</label>
                <Textarea
                  placeholder="Enter poll description (optional)"
                  value={newPoll.description}
                  onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Open Time</label>
                  <Input
                    type="datetime-local"
                    value={newPoll.openTime}
                    onChange={(e) => setNewPoll({ ...newPoll, openTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Close Time (optional)</label>
                  <Input
                    type="datetime-local"
                    value={newPoll.closeTime}
                    onChange={(e) => setNewPoll({ ...newPoll, closeTime: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Format: YYYY-MM-DD HH:MM</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={newPoll.allowAnonymous}
                  onChange={(e) => setNewPoll({ ...newPoll, allowAnonymous: e.target.checked })}
                />
                <label htmlFor="anonymous" className="text-sm font-medium">
                  Allow anonymous responses
                </label>
              </div>
            </div>

            {/* Question editing */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Questions</h3>
                <Button variant="outline" size="sm" onClick={addQuestion} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
              </div>

              <div className="space-y-6 border-l-4 border-gray-200 pl-4">
                {newPoll.questions.map((question, qIndex) => (
                  <div key={question.id} className="space-y-3 pb-4 border-b">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Question {qIndex + 1}</label>
                      {newPoll.questions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <Input
                      placeholder="Enter question text"
                      value={question.question}
                      onChange={(e) =>
                        updateQuestion(question.id, "question", e.target.value)
                      }
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Question Type</label>
                        <Select
                          value={question.type}
                          onValueChange={(value: any) =>
                            updateQuestion(question.id, "type", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">Single Choice</SelectItem>
                            <SelectItem value="multiple">Multiple Choice</SelectItem>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="scale">Scale (1-5)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) =>
                              updateQuestion(question.id, "required", e.target.checked)
                            }
                          />
                          <span className="text-sm font-medium">Required</span>
                        </label>
                      </div>
                    </div>

                    {/* Option editing */}
                    {(question.type === "single" || question.type === "multiple") &&
                      question.options && (
                        <div className="space-y-2 bg-gray-50 p-3 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Options</span>
                            {question.options.length < 10 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addOption(question.id)}
                                className="text-blue-600"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <span className="text-sm font-medium w-8">
                                {String.fromCharCode(65 + oIndex)}.
                              </span>
                              <Input
                                placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                value={option}
                                onChange={(e) =>
                                  updateOption(question.id, oIndex, e.target.value)
                                }
                              />
                              {question.options!.length > 2 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteOption(question.id, oIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setOpenEditDialog(false);
              setSelectedPoll(null);
              resetNewPoll();
            }}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} className="gap-2">
              Save Draft
            </Button>
            <Button onClick={handlePublishPoll} className="gap-2">
              <Calendar className="h-4 w-4" />
              {selectedPoll ? "Update Poll" : "Publish Poll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results statistics dialog */}
      {selectedPoll && (
        <Dialog open={openResultsDialog} onOpenChange={setOpenResultsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Poll Results - {selectedPoll.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="text-sm text-muted-foreground">
                Total Responses: {selectedPoll.responseCount}
              </div>

              {selectedPoll.questions.map((question) => {
                const stats = calculateStatistics(selectedPoll);
                const questionStats = stats[question.id];

                return (
                  <div key={question.id} className="border-b pb-6">
                    <h4 className="font-semibold mb-4">{question.question}</h4>

                    {/* Single/Multiple Choice Questions */}
                    {(question.type === "single" || question.type === "multiple") && questionStats?.stats ? (
                      <div className="space-y-3">
                        {questionStats.stats.map((stat: any) => (
                          <div key={stat.option} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{stat.option}</span>
                              <span className="font-semibold">
                                {stat.count} ({stat.percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${stat.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* Scale Questions */}
                    {question.type === "scale" && questionStats?.stats ? (
                      <div className="space-y-3">
                        {questionStats.stats.map((stat: any) => (
                          <div key={stat.level} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{"⭐".repeat(stat.level)}</span>
                              <span className="font-semibold">
                                {stat.count} ({stat.percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-yellow-500 h-2 rounded-full transition-all"
                                style={{ width: `${stat.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* Text Questions */}
                    {question.type === "text" && questionStats?.answers ? (
                      <Tabs defaultValue="list" className="w-full">
                        <TabsList>
                          <TabsTrigger value="list">Responses ({questionStats.totalResponses})</TabsTrigger>
                          <TabsTrigger value="wordcloud">Word Cloud</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="list" className="space-y-2">
                          <div className="max-h-80 overflow-y-auto space-y-2">
                            {questionStats.answers.slice(0, 10).map((answer: string, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 bg-gray-50 rounded-lg border text-sm"
                              >
                                <p className="text-foreground">{answer}</p>
                              </div>
                            ))}
                          </div>
                          
                          {questionStats.answers.length > 10 && (
                            <Button
                              variant="outline"
                              className="w-full mt-3"
                              onClick={() => {
                                setSelectedTextQuestion(question.question);
                                setSelectedTextAnswers(questionStats.answers);
                                setOpenTextDetailDialog(true);
                              }}
                            >
                              View All {questionStats.answers.length} Responses
                            </Button>
                          )}
                          
                          {questionStats.answers.length === 0 && (
                            <div className="p-8 text-center">
                              <p className="text-muted-foreground">No responses yet</p>
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="wordcloud">
                          <WordCloudComponent 
                            words={questionStats.answers} 
                            width={800} 
                            height={400} 
                          />
                        </TabsContent>
                      </Tabs>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button onClick={() => setOpenResultsDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* QR Code Dialog */}
      <Dialog open={openQRDialog} onOpenChange={setOpenQRDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Poll QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Share Link</label>
              <div className="flex gap-2">
                <Input value={selectedQRLink} readOnly className="flex-1 text-xs" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyLink(selectedQRLink)}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg">
              <QRCodeGenerator value={selectedQRLink} size={250} />
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Scan the QR code to access the questionnaire.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpenQRDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Text Answers Detail Dialog */}
      <Dialog open={openTextDetailDialog} onOpenChange={setOpenTextDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedTextQuestion}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              All {selectedTextAnswers.length} Responses
            </p>
          </DialogHeader>
          
          <Tabs defaultValue="list" className="flex-1 flex flex-col overflow-hidden">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="wordcloud">Word Cloud</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="flex-1 overflow-y-auto space-y-2 mt-4">
              {selectedTextAnswers.map((answer: string, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold text-muted-foreground min-w-[40px]">
                      #{idx + 1}
                    </span>
                    <p className="text-sm text-foreground flex-1">{answer}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="wordcloud" className="flex-1 flex items-center justify-center mt-4">
              <WordCloudComponent 
                words={selectedTextAnswers} 
                width={700} 
                height={500} 
              />
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button onClick={() => setOpenTextDetailDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Panel */}
      <AIAssistantPanel
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        context="Opinion Poll"
      />
    </>
  );
};

export default OpinionPoll;
