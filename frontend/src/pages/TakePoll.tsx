import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PollQuestion {
  id: string;
  question: string;
  type: "single" | "multiple" | "text" | "scale";
  options?: string[];
  required: boolean;
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
  responses: any[];
  responseCount: number;
}

const TakePoll = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<OpinionPoll | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: string]: string | string[] }>({});
  const [submitted, setSubmitted] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [respondentName, setRespondentName] = useState("");
  const [respondentId, setRespondentId] = useState("user_" + Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load poll from localStorage
  useEffect(() => {
    // TODO: 后端集成 - 将 localStorage.getItem 替换为后端 API 调用
    // 后端接口应该是: GET /api/polls/{pollId} - 根据问卷ID获取问卷详情
    const savedPolls = localStorage.getItem("opinion_polls");
    if (savedPolls) {
      try {
        const polls = JSON.parse(savedPolls);
        const foundPoll = polls.find((p: OpinionPoll) => p.id === pollId);
        
        if (foundPoll) {
          // Check if poll is open
          const now = Date.now();
          if (foundPoll.status === "closed") {
            setError("This poll is closed and no longer accepting responses");
          } else if (foundPoll.openTime > now) {
            setError("This poll has not opened yet");
          } else if (foundPoll.closeTime && foundPoll.closeTime < now) {
            setError("This poll has closed");
          } else {
            setPoll(foundPoll);
          }
        } else {
          setError("Poll not found");
        }
      } catch (err) {
        console.error("Error loading poll:", err);
        setError("Failed to load poll");
      }
    } else {
      setError("No polls found");
    }
    setLoading(false);
  }, [pollId]);

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleToggleOption = (questionId: string, option: string) => {
    const current = answers[questionId] as string[] || [];
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    handleAnswerChange(questionId, updated);
  };

  const validateAnswers = () => {
    for (const question of poll!.questions) {
      if (question.required) {
        const answer = answers[question.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0) || (typeof answer === "string" && answer.trim() === "")) {
          alert(`Question "${question.question}" is required`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateAnswers()) {
      return;
    }

    // TODO: 后端集成 - 将 localStorage.setItem 替换为后端 API 调用
    // 后端接口应该是: POST /api/polls/{pollId}/responses - 提交问卷回答
    // 请求体应包含: { respondentId, respondentName, answers, isAnonymous, submittedAt }

    // ===== 当前使用 localStorage (本地存储) - 用于测试 =====
    const savedPolls = JSON.parse(localStorage.getItem("opinion_polls") || "[]");
    const pollIndex = savedPolls.findIndex((p: OpinionPoll) => p.id === pollId);

    if (pollIndex >= 0) {
      const response = {
        id: `response_${Date.now()}`,
        respondentId,
        respondentName: isAnonymous ? "Anonymous" : respondentName,
        answers: poll!.questions.map((q) => ({
          questionId: q.id,
          answer: answers[q.id] || "",
        })),
        submittedAt: Date.now(),
        isAnonymous,
      };

      savedPolls[pollIndex].responses.push(response);
      savedPolls[pollIndex].responseCount = savedPolls[pollIndex].responses.length;
      localStorage.setItem("opinion_polls", JSON.stringify(savedPolls));
    }
    // ===== 以上代码需要替换为后端 API 调用 =====

    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading poll...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-muted-foreground mb-4">Poll not found</p>
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Card className="p-8 text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-muted-foreground mb-6">Your response has been submitted successfully.</p>
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="mb-4 hover:bg-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Card className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{poll.title}</h1>
            {poll.description && (
              <p className="text-muted-foreground text-lg">{poll.description}</p>
            )}
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="default">Open</Badge>
              <span className="text-sm text-muted-foreground">
                {poll.responseCount} responses
              </span>
            </div>
          </div>

          <div className="border-t pt-8 space-y-8">
            {/* Respondent info section */}
            {poll.allowAnonymous && (
              <div className="space-y-4 bg-gray-50 p-4 rounded">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                  <label htmlFor="anonymous" className="text-sm font-medium">
                    Submit anonymously
                  </label>
                </div>

                {!isAnonymous && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Name (optional)</label>
                    <input
                      type="text"
                      value={respondentName}
                      onChange={(e) => setRespondentName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Questions */}
            {poll.questions.map((question, qIndex) => (
              <div key={question.id} className="space-y-3 pb-6 border-b last:border-b-0">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-lg">{qIndex + 1}.</span>
                  <div className="flex-1">
                    <label className="text-lg font-semibold">
                      {question.question}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  </div>
                </div>

                {/* Single choice */}
                {question.type === "single" && question.options && (
                  <div className="ml-8 space-y-2">
                    {question.options.map((option) => (
                      <div key={option} className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`${question.id}_${option}`}
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`${question.id}_${option}`} className="text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {/* Multiple choice */}
                {question.type === "multiple" && question.options && (
                  <div className="ml-8 space-y-2">
                    {question.options.map((option) => (
                      <div key={option} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`${question.id}_${option}`}
                          checked={(answers[question.id] as string[])?.includes(option) || false}
                          onChange={() => handleToggleOption(question.id, option)}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`${question.id}_${option}`} className="text-sm">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {/* Text answer */}
                {question.type === "text" && (
                  <div className="ml-8">
                    <Textarea
                      placeholder="Enter your answer..."
                      value={(answers[question.id] as string) || ""}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {/* Scale 1-5 */}
                {question.type === "scale" && (
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>Not at all</span>
                      <span>Very much</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          onClick={() => handleAnswerChange(question.id, level.toString())}
                          className={`w-10 h-10 rounded-full font-semibold transition-all ${
                            answers[question.id] === level.toString()
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-8 pt-8 border-t">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              Submit Response
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TakePoll;
