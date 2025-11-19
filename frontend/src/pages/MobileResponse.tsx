import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { API_BASE_URL } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

interface Question {
  id: number | string;
  text: string;
  type: string;
  options?: string[];
  scaleOptions?: { id: number; label: string; value: number }[];
}

interface Activity {
  id: string;
  title: string;
  type: string;
  activityType: string;
  questions?: Question[];
  slides?: Question[];
}

const MobileResponse = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  const [studentName, setStudentName] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 从后端 API 获取活动数据 - 根据活动类型调用不同的接口
    const loadActivity = async () => {
      if (!activityId) {
        setIsLoading(false);
        return;
      }

      try {
        // 尝试从不同的API端点加载活动
        let data = null;
        let activityType = '';

        // 1. 尝试加载 Quiz
        try {
          const response = await fetch(`${API_BASE_URL}/classroom_quiz/${activityId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (response.ok) {
            data = await response.json();
            activityType = 'quiz';
          }
        } catch (error) {
          console.log('Not a quiz');
        }

        // 2. 尝试加载 Opinion Poll
        if (!data) {
          try {
            const response = await fetch(`${API_BASE_URL}/studentpoll/${activityId}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.poll) {
                data = result.poll;
                activityType = 'opinion-poll';
              }
            }
          } catch (error) {
            console.log('Not an opinion poll');
          }
        }

        // 3. 尝试加载 Open Question
        if (!data) {
          try {
            const response = await fetch(`${API_BASE_URL}/open-questions/${activityId}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.activity) {
                data = result.activity;
                activityType = 'open-question';
              }
            }
          } catch (error) {
            console.log('Not an open question');
          }
        }

        // 4. 尝试加载 Scales Question
        if (!data) {
          try {
            const response = await fetch(`${API_BASE_URL}/scales-questions/${activityId}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.activity) {
                data = result.activity;
                activityType = 'scales-question';
              }
            }
          } catch (error) {
            console.log('Not a scales question');
          }
        }

        if (data) {
          // 根据活动类型格式化数据
          let formattedActivity: Activity;

          if (activityType === 'quiz') {
            formattedActivity = {
              id: data.activity_id || activityId,
              title: data.title || 'Untitled Quiz',
              type: data.type || 'quiz',
              activityType: 'quiz',
              questions: data.questions?.map((q: any) => ({
                id: q.id,
                text: q.text,
                type: q.type,
                options: q.options,
                scaleOptions: q.scaleOptions,
              })) || [],
            };
          } else if (activityType === 'opinion-poll') {
            formattedActivity = {
              id: data.id || activityId,
              title: data.title || 'Untitled Poll',
              type: 'Opinion Poll',
              activityType: 'opinion-poll',
              questions: data.questions?.map((q: any) => ({
                id: q.id,
                text: q.question,
                type: q.type,
                options: q.options,
              })) || [],
            };
          } else if (activityType === 'open-question') {
            formattedActivity = {
              id: data.id || activityId,
              title: data.title || 'Untitled Question',
              type: 'Open-ended Question',
              activityType: 'open-question',
              slides: data.slides?.map((s: any) => ({
                id: s.id,
                text: s.text,
                type: 'open-question',
              })) || [],
            };
          } else if (activityType === 'scales-question') {
            formattedActivity = {
              id: data.id || activityId,
              title: data.title || 'Untitled Scale',
              type: 'Scales Question',
              activityType: 'scales-question',
              slides: data.slides?.map((s: any) => ({
                id: s.id,
                text: s.text,
                type: 'scales-question',
                scaleOptions: s.scaleOptions || [
                  { id: 1, label: "Strongly Disagree", value: 1 },
                  { id: 2, label: "Disagree", value: 2 },
                  { id: 3, label: "Neutral", value: 3 },
                  { id: 4, label: "Agree", value: 4 },
                  { id: 5, label: "Strongly Agree", value: 5 },
                ],
              })) || [],
            };
          } else {
            console.error('Unknown activity type');
            setIsLoading(false);
            return;
          }

          setActivity(formattedActivity);
        } else {
          console.error('Failed to load activity from any endpoint');
        }
      } catch (error) {
        console.error('Error loading activity:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivity();
  }, [activityId]);

  const questions = activity?.questions || activity?.slides || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerChange = (questionId: string | number, answer: any) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // 提交用户回答到后端 - 根据活动类型调用不同的API

    if (!studentName.trim()) {
      alert("Please enter your name");
      return;
    }

    if (!activity) {
      alert("Activity not found");
      return;
    }

    try {
      let response;

      if (activity.activityType === 'quiz') {
        // Quiz submission: POST /api/classroom_quiz/{activityId}/responses
        const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => {
          const question = activity.questions?.find(q => q.id === parseInt(questionId));
          
          let backendQuestionType = "ShortAnswer";
          const frontendType = question?.type || "";
          
          if (frontendType === "truefalse" || frontendType === "true-false") {
            backendQuestionType = "True/False";
          } else if (frontendType === "multiplechoice" || frontendType === "multiple-choice") {
            backendQuestionType = "MultipleChoice";
          } else if (frontendType === "shortanswer" || frontendType === "short-answer" || frontendType === "open-question") {
            backendQuestionType = "ShortAnswer";
          }
          
          return {
            question_id: parseInt(questionId),
            answer: answer,
            question_type: backendQuestionType,
          };
        });

        response = await fetch(`${API_BASE_URL}/classroom_quiz/${activityId}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quiz_id: activityId,
            studentName: studentName.trim(),
            answers: formattedAnswers,
            submittedAt: Math.floor(Date.now() / 1000),
          }),
        });
      } else if (activity.activityType === 'opinion-poll') {
        // Opinion Poll submission: POST /api/polls/{activityId}/responses
        const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
          questionId: questionId,
          answer: answer,
        }));

        response = await fetch(`${API_BASE_URL}/polls/${activityId}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            respondentId: `student_${Date.now()}`,
            respondentName: studentName.trim(),
            answers: formattedAnswers,
            submittedAt: Date.now(),
            isAnonymous: false,
          }),
        });
      } else if (activity.activityType === 'open-question') {
        // Open Question submission: POST /api/open-questions/{activityId}/responses
        const formattedAnswers = Object.entries(answers).map(([slideId, answer]) => ({
          slideId: parseInt(slideId),
          answer: answer,
        }));

        response = await fetch(`${API_BASE_URL}/open-questions/${activityId}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: studentName.trim(),
            answers: formattedAnswers,
            submittedAt: Date.now(),
          }),
        });
      } else if (activity.activityType === 'scales-question') {
        // Scales Question submission: POST /api/scales-questions/{activityId}/responses
        const formattedAnswers = Object.entries(answers).map(([slideId, answer]) => ({
          slideId: parseInt(slideId),
          value: answer,
        }));

        response = await fetch(`${API_BASE_URL}/scales-questions/${activityId}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: studentName.trim(),
            answers: formattedAnswers,
            submittedAt: Date.now(),
          }),
        });
      } else {
        throw new Error('Unknown activity type');
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
      } else {
        alert('Failed to submit response. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response. Please try again later.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold text-destructive">Activity not found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please check the link and try again.
          </p>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">提交成功！</h2>
          <p className="text-muted-foreground">
            感谢您的参与，您的回答已成功提交。
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <Card className="p-6 mb-4">
          <h1 className="text-2xl font-bold mb-2">{activity.title}</h1>
          <p className="text-sm text-muted-foreground">
            {activity.type}
          </p>
          
          {/* Student Name Input */}
          <div className="mt-4">
            <Label htmlFor="studentName" className="text-sm font-medium">
              Your Name *
            </Label>
            <Input
              id="studentName"
              name="studentName"
              placeholder="Enter your name..."
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="mt-2"
              required
            />
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </Card>

        {/* Question */}
        {currentQuestion && (
          <Card className="p-6 mb-4">
            <h2 className="text-xl font-semibold mb-6">
              {currentQuestion.text || `Question ${currentQuestionIndex + 1}`}
            </h2>

            {/* Short Answer / Open-ended / Text */}
            {(currentQuestion.type === "shortanswer" || 
              currentQuestion.type === "short-answer" || 
              currentQuestion.type === "open-question" ||
              currentQuestion.type === "text" ||
              activity.activityType === "open-question") && (
              <Textarea
                id={`question-${currentQuestion.id}`}
                name={`question-${currentQuestion.id}`}
                placeholder="Enter your answer..."
                value={answers[currentQuestion.id] || ""}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, e.target.value)
                }
                rows={5}
                className="w-full"
              />
            )}

            {/* Multiple Choice (single answer) */}
            {(currentQuestion.type === "multiplechoice" || 
              currentQuestion.type === "multiple-choice" ||
              currentQuestion.type === "single") && (
              <RadioGroup
                value={answers[currentQuestion.id]?.toString() || ""}
                onValueChange={(value) =>
                  handleAnswerChange(currentQuestion.id, parseInt(value))
                }
              >
                <div className="space-y-3">
                  {(currentQuestion.options || []).map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {/* Multiple Choice (multiple answers) - for Opinion Poll */}
            {currentQuestion.type === "multiple" && (
              <div className="space-y-3">
                {(currentQuestion.options || []).map((option, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={`option-${index}`}
                      checked={(answers[currentQuestion.id] || []).includes(index)}
                      onChange={(e) => {
                        const currentAnswers = answers[currentQuestion.id] || [];
                        if (e.target.checked) {
                          handleAnswerChange(currentQuestion.id, [...currentAnswers, index]);
                        } else {
                          handleAnswerChange(currentQuestion.id, currentAnswers.filter((i: number) => i !== index));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {/* True/False */}
            {(currentQuestion.type === "truefalse" || currentQuestion.type === "true-false") && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true" className="flex-1 cursor-pointer">✓ True</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false" className="flex-1 cursor-pointer">✗ False</Label>
                  </div>
                </div>
              </RadioGroup>
            )}

            {/* Scales Question */}
            {(currentQuestion.type === "scales-question" || 
              currentQuestion.type === "scale" ||
              activity.activityType === "scales-question") && (
              <div className="space-y-3">
                {(currentQuestion.scaleOptions || [
                  { id: 1, label: "1", value: 1 },
                  { id: 2, label: "2", value: 2 },
                  { id: 3, label: "3", value: 3 },
                  { id: 4, label: "4", value: 4 },
                  { id: 5, label: "5", value: 5 },
                ]).map((option) => (
                  <Button
                    key={option.id}
                    variant={answers[currentQuestion.id] === option.value ? "default" : "outline"}
                    className="w-full justify-start h-auto py-4"
                    onClick={() => handleAnswerChange(currentQuestion.id, option.value)}
                  >
                    <span className="font-bold mr-3">{option.value}</span>
                    <span>{option.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex-1"
          >
            Previous
          </Button>
          {currentQuestionIndex < questions.length - 1 ? (
            <Button onClick={handleNext} className="flex-1">
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileResponse;
