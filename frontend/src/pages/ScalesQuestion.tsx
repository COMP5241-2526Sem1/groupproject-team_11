import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Plus, X, Share2, BarChart } from "lucide-react";
import { Link } from "react-router-dom";
import { AIAssistantPanel } from "@/components/AIAssistantPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { ResultViewer } from "@/components/ResultViewer";
import { API_BASE_URL, FRONTEND_URL } from "@/services/api";

interface ScaleOption {
  id: number;
  label: string;
  value: number;
}

interface Slide {
  id: number;
  text: string;
  scaleOptions: ScaleOption[];
  scaleMin?: number;
  scaleMax?: number;
}

const ScalesQuestion = () => {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [draftName, setDraftName] = useState("Untitled Scale");
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 1,
      text: "",
      scaleOptions: [
        { id: 1, label: "Strongly Disagree", value: 1 },
        { id: 2, label: "Disagree", value: 2 },
        { id: 3, label: "Neutral", value: 3 },
        { id: 4, label: "Agree", value: 4 },
        { id: 5, label: "Strongly Agree", value: 5 },
      ],
      scaleMin: 1,
      scaleMax: 5,
    },
  ]);
  const [currentSlideId, setCurrentSlideId] = useState(1);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentPresentationIndex, setCurrentPresentationIndex] = useState(0);
  const [selectedPresentationAnswer, setSelectedPresentationAnswer] = useState<number | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [activityId, setActivityId] = useState("");

  // 初始化数据 - 只有在编辑模式下且有 id 时才加载，创建模式使用默认模板
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const mode = params.get("mode");

    // 只有当 mode 不是 create 且有 id 时，才调用 GET 请求加载活动
    if (id && mode !== "create") {
      setActivityId(id);
      
      const loadActivity = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/scales-questions/${id}`);
          if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
          }
          const data = await response.json();
          
          if (data.success && data.activity) {
            setDraftName(data.activity.title || "Untitled Scale");
            setSlides(
              data.activity.slides || [
                {
                  id: 1,
                  text: "",
                  scaleOptions: [
                    { id: 1, label: "Strongly Disagree", value: 1 },
                    { id: 2, label: "Disagree", value: 2 },
                    { id: 3, label: "Neutral", value: 3 },
                    { id: 4, label: "Agree", value: 4 },
                    { id: 5, label: "Strongly Agree", value: 5 },
                  ],
                  scaleMin: 1,
                  scaleMax: 5,
                },
              ]
            );
            setCurrentSlideId(data.activity.slides?.[0]?.id || 1);
          }
        } catch (error) {
          console.error("Error loading activity:", error);
          alert("Failed to load activity. Please try again later.");
        }
      };
      
      loadActivity();
    }
    // mode=create 或没有 id 时，直接使用 state 中定义的默认模板，不调用 GET 请求
  }, []);

  // 获取当前幻灯片
  const currentSlide = slides.find((s) => s.id === currentSlideId) || slides[0];

  // 添加新幻灯片
  const addSlide = () => {
    const newId = Math.max(...slides.map((s) => s.id), 0) + 1;
    const newSlide: Slide = {
      id: newId,
      text: "",
      scaleOptions: [
        { id: 1, label: "Strongly Disagree", value: 1 },
        { id: 2, label: "Disagree", value: 2 },
        { id: 3, label: "Neutral", value: 3 },
        { id: 4, label: "Agree", value: 4 },
        { id: 5, label: "Strongly Agree", value: 5 },
      ],
      scaleMin: 1,
      scaleMax: 5,
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideId(newId);
  };

  // 更新幻灯片文本
  const updateSlideText = (text: string) => {
    setSlides(
      slides.map((s) => (s.id === currentSlideId ? { ...s, text } : s))
    );
  };

  // 更新 scale 选项标签
  const updateScaleOptionLabel = (optionIndex: number, label: string) => {
    setSlides(
      slides.map((s) => {
        if (s.id === currentSlideId) {
          const newOptions = [...s.scaleOptions];
          newOptions[optionIndex] = { ...newOptions[optionIndex], label };
          return { ...s, scaleOptions: newOptions };
        }
        return s;
      })
    );
  };

  // 删除幻灯片
  const deleteSlide = (id: number) => {
    if (slides.length === 1) return;
    const newSlides = slides.filter((s) => s.id !== id);
    setSlides(newSlides);
    if (currentSlideId === id) {
      setCurrentSlideId(newSlides[0].id);
    }
  };

  // 演示模式键盘控制
  useEffect(() => {
    if (!isPresentationMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPresentationMode(false);
        setCurrentPresentationIndex(0);
      } else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (currentPresentationIndex < slides.length - 1) {
          setCurrentPresentationIndex(currentPresentationIndex + 1);
        } else {
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
  }, [isPresentationMode, currentPresentationIndex, slides.length]);

  const handleSave = async () => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const existingId = params.get("id");
    
    // 如果 mode=create，使用 POST 创建新活动；否则使用 PUT 更新
    const isCreating = mode === "create";

    const activityData = {
      title: draftName,
      type: "Scales Question",
      activityType: "scales-question",
      thumbnail: slides[0]?.text || "Untitled Scale",
      slides: slides,
    };

    try {
      const url = isCreating
        ? `${API_BASE_URL}/scales-questions/create`
        : `${API_BASE_URL}/scales-questions/update/${existingId}`;
      const method = isCreating ? "POST" : "PUT";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activityData),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.activity) {
        setActivityId(data.activity.id);
        alert(isCreating ? "Activity created successfully!" : "Activity updated successfully!");
        
        // 添加到本地 activityLog
        try {
          const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
          const newLog = {
            type: isCreating ? "created" : "edited",
            title: `${isCreating ? "Created" : "Updated"}: ${draftName}`,
            description: `Scales Question - ${draftName}`,
            timestamp: Date.now(),
            activityId: data.activity.id,
          };
          activityLog.push(newLog);
          localStorage.setItem("activityLog", JSON.stringify(activityLog));
        } catch (logError) {
          console.error("Error saving to activity log:", logError);
        }
        
        // 如果是创建模式，重定向到新创建的活动（不带 mode 参数）
        if (isCreating) {
          const newUrl = `${window.location.pathname}?id=${data.activity.id}`;
          window.history.pushState({}, "", newUrl);
          // 重新加载页面以获取新创建的数据
          window.location.href = newUrl;
        }
      }
    } catch (error) {
      console.error("Error saving activity:", error);
      alert("Failed to save activity. Please try again later.");
    }
  };

  const handleShare = async () => {
    if (!activityId) {
      alert("Please save the question first");
      return;
    }
    
    // 直接生成前端移动响应页面链接,不需要调用后端
    const frontendUrl = FRONTEND_URL;
    const link = `${frontendUrl}/response/${activityId}`;
    setShareLink(link);
    setShareDialogOpen(true);
    
    // 添加到本地 activityLog
    try {
      const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
      const newLog = {
        type: "shared",
        title: `Shared: ${draftName}`,
        description: `Scales Question - Link: ${link}`,
        timestamp: Date.now(),
        activityId: activityId,
      };
      activityLog.push(newLog);
      localStorage.setItem("activityLog", JSON.stringify(activityLog));
    } catch (logError) {
      console.error("Error saving to activity log:", logError);
    }
  };

  const handleViewResults = () => {
    // TODO: 后端集成 - GET /api/activities/{activityId}/results
    
    if (!activityId) {
      alert("Please save the question first");
      return;
    }
    
    setShowResults(true);
  };

  return (
    <>
      <div
        className={`p-8 transition-all duration-300 ${isAIOpen ? "pr-[416px]" : ""}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/activities">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            {!isAIOpen && <h2 className="text-xl font-bold">Scales Question</h2>}
          </div>
          <div className="flex items-center gap-6 px-6 py-3 bg-white rounded-lg border">
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Enter draft name..."
              className="text-sm border-0 focus-visible:ring-0 px-0 w-64"
            />

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
            <Button
              variant="outline"
              onClick={() => setIsPresentationMode(true)}
            >
              Present
            </Button>
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
            {slides.map((slide, index) => (
              <div key={slide.id} className="relative group">
                <Card
                  className={`p-0 cursor-pointer transition-all overflow-hidden ${
                    currentSlideId === slide.id
                      ? `border-2 border-primary`
                      : `hover:shadow-md`
                  }`}
                  onClick={() => setCurrentSlideId(slide.id)}
                >
                  {/* Thumbnail container - Smaller */}
                  <div className="aspect-video bg-orange-50 border-l-4 border-orange-200 flex flex-col p-2 relative">
                    {/* Question number */}
                    <div className="absolute top-1 left-1">
                      <span className="text-xs font-bold text-orange-700">
                        Q{index + 1}
                      </span>
                    </div>

                    {/* Delete button */}
                    {slides.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSlide(slide.id);
                        }}
                        className="absolute top-1 right-1 w-4 h-4 bg-destructive/10 hover:bg-destructive/20 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="h-2 w-2 text-destructive" />
                      </button>
                    )}

                    {/* Thumbnail content */}
                    <div className="flex-1 flex flex-col justify-center items-center px-1">
                      <p className="text-[10px] text-center line-clamp-2 leading-tight font-medium">
                        {slide.text || "Edit"}
                      </p>
                    </div>

                    {/* Type label */}
                    <div className="flex justify-end pt-1">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-50 text-orange-700">
                        Scale
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            ))}

            {/* Add button */}
            <Button
              variant="outline"
              onClick={addSlide}
              size="sm"
              className="w-full h-10 border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all gap-1 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </div>

          {/* Right: Main Preview (Large) */}
          <Card className="lg:col-span-5 p-8 flex flex-col bg-white min-h-[calc(100vh-180px)] overflow-y-auto">
            <div className="flex flex-col items-center justify-center">
              {/* Question type label */}
              <div className="mb-6 px-4 py-2 rounded-full text-sm font-medium bg-orange-50 text-orange-700">
                Scales Question
              </div>

              {currentSlide.text ? (
                <h3 className="text-3xl font-medium text-center max-w-3xl mb-8 whitespace-pre-wrap break-words">
                  {currentSlide.text}
                </h3>
              ) : (
                <div className="text-center space-y-4 mb-8">
                  <div className="text-6xl text-muted-foreground/20">📊</div>
                  <p className="text-muted-foreground">
                    Click below to enter question
                  </p>
                </div>
              )}

              {/* Scale options display */}
              <div className="w-full max-w-4xl space-y-4">
                <h4 className="font-semibold text-sm text-foreground text-center">
                  Scale Options
                </h4>
                <div className="space-y-3">
                  {currentSlide.scaleOptions.map((option, index) => (
                    <div
                      key={option.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
                    >
                      <span className="font-semibold text-muted-foreground flex-shrink-0 w-8">
                        {option.value}
                      </span>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) =>
                            updateScaleOptionLabel(index, e.target.value)
                          }
                          placeholder={`Option ${option.value}`}
                          className="text-sm w-full px-3 py-2 border border-input rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom edit area */}
            <div className="mt-6 pt-6 border-t space-y-3 flex-shrink-0">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Question Content
                </label>
                <textarea
                  value={currentSlide.text}
                  onChange={(e) => {
                    updateSlideText(e.target.value);
                    // Auto-resize textarea
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height = Math.min(
                      e.currentTarget.scrollHeight,
                      200
                    ) + "px";
                  }}
                  onInput={(e) => {
                    // Auto-resize on input
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height = Math.min(
                      e.currentTarget.scrollHeight,
                      200
                    ) + "px";
                  }}
                  placeholder="Enter question content..."
                  className="w-full px-3 py-2 mt-2 text-base border border-input rounded-md bg-white resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  rows={1}
                  style={{ minHeight: "44px", overflow: "hidden" }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Presentation Mode */}
      {isPresentationMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Scrollable content area - includes everything */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1 flex flex-col justify-center items-center px-8 py-8">
              {/* Question type badge */}
              <div className="px-4 py-2 rounded-full text-sm font-medium mb-8 bg-orange-50 text-orange-700">
                Scales Question
              </div>

              {/* Question text */}
              <h1 className="text-6xl font-bold text-foreground text-center max-w-4xl leading-tight mb-8 whitespace-pre-wrap break-words">
                {slides[currentPresentationIndex]?.text ||
                  `Question ${currentPresentationIndex + 1}`}
              </h1>

              {/* Scale options horizontal layout */}
              <div className="w-full max-w-4xl mb-8">
                <div className="flex gap-2 justify-center flex-wrap">
                  {slides[currentPresentationIndex]?.scaleOptions.map(
                    (option) => (
                      <Button
                        key={option.id}
                        className="flex-1 min-w-20 px-3 py-6 text-lg font-semibold flex flex-col items-center justify-center h-auto min-h-16"
                        variant={
                          selectedPresentationAnswer === option.value
                            ? "default"
                            : "outline"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPresentationAnswer(option.value);
                        }}
                      >
                        <span className="block font-bold">{option.value}</span>
                        <span className="block text-xs mt-1">
                          {option.label}
                        </span>
                      </Button>
                    )
                  )}
                </div>
              </div>

              {/* Navigation hint */}
              <div className="text-muted-foreground text-lg mt-8">
                {currentPresentationIndex + 1} / {slides.length}
              </div>
            </div>
          </div>

          {/* Bottom controls text - fixed */}
          <div className="w-full px-8 py-6 text-center text-muted-foreground text-sm border-t border-border bg-white flex-shrink-0">
            <p>
              Click or press Right Arrow / Space to continue • Press ESC to exit
            </p>
          </div>

          {/* Click area for next slide */}
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => {
              setSelectedPresentationAnswer(null);
              if (currentPresentationIndex < slides.length - 1) {
                setCurrentPresentationIndex(currentPresentationIndex + 1);
              } else {
                setIsPresentationMode(false);
                setCurrentPresentationIndex(0);
              }
            }}
            style={{ zIndex: -1 }}
          ></div>
        </div>
      )}

      {/* Results Viewer */}
      {showResults && activityId && (
        <ResultViewer
          activityId={activityId}
          activity={{
            id: activityId,
            title: draftName,
            type: "Scales Question",
            activityType: "scales-question",
            slides: slides,
          }}
          onClose={() => setShowResults(false)}
        />
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Share Link</label>
              <div className="flex gap-2 mt-2">
                <Input value={shareLink} readOnly className="flex-1" />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    alert("Link copied!");
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div className="text-center">
              <label className="text-sm font-medium">QR Code</label>
              <div className="flex justify-center mt-2">
                <QRCodeGenerator value={shareLink} size={200} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Scan to access question
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Assistant Panel */}
      <AIAssistantPanel
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        context="Scales Question"
      />
    </>
  );
};

export default ScalesQuestion;
