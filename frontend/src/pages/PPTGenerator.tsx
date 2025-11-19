import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Play, Save, Download, Plus, Trash2, X } from "lucide-react";
import Marpit from "@marp-team/marpit";
import html2canvas from "html2canvas";
import { AIAssistantPanel } from "@/components/AIAssistantPanel";

interface Slide {
  id: number;
  content: string;
}

const PPTGenerator = () => {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [draftName, setDraftName] = useState("Untitled Presentation");
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 1,
      content: `---
marp: true
---

# 欢迎使用 PPT Generator

> 使用 Markdown 创建精美的演示文稿`,
    },
    {
      id: 2,
      content: `---

## 功能特性

- 📝 Markdown 格式编辑
- 🎨 自动样式化
- 🖥️ 实时预览
- 📊 支持多种内容`,
    },
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentPresentationIndex, setCurrentPresentationIndex] = useState(0);
  const editPreviewRef = useRef<HTMLDivElement>(null);
  const presentationRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<number | null>(null);

  // 初始化数据 - 如果是编辑模式，从 localStorage 加载已保存的活动数据
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const activityId = params.get("id");
    const mode = params.get("mode");

    if (mode === "edit" && activityId) {
      const activities = JSON.parse(localStorage.getItem("activities") || "[]");
      const activity = activities.find((a: any) => a.id === activityId);

      if (activity && activity.slides) {
        setDraftName(activity.title || "Untitled Presentation");
        setSlides(activity.slides || []);
      }
    }
  }, []);

  // 渲染编辑模式下的幻灯片预览
  useEffect(() => {
    renderEditPreview();
  }, [slides, currentSlideIndex]);

  // 渲染演示模式下的幻灯片
  useEffect(() => {
    if (isPresentationMode) {
      renderPresentationSlides();
    }
  }, [slides, currentPresentationIndex, isPresentationMode]);

  const renderEditPreview = async () => {
    if (!editPreviewRef.current) return;

    try {
      const fullMarkdown = slides.map((slide) => slide.content).join("\n");
      const marp = new (Marpit as any)({ html: true });
      const { html } = marp.render(fullMarkdown);

      editPreviewRef.current.innerHTML = html;

      // 添加样式表
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/@marp-team/marp-core/dist/css/marp-core.css";

      if (!document.head.querySelector('link[href*="marp-core"]')) {
        document.head.appendChild(link);
      }

      // 只显示当前幻灯片
      const slideElements = editPreviewRef.current.querySelectorAll("section");
      slideElements.forEach((element, index) => {
        (element as HTMLElement).style.display =
          index === currentSlideIndex ? "block" : "none";
      });
    } catch (error) {
      console.error("Marpit 渲染失败：", error);
      if (editPreviewRef.current) {
        editPreviewRef.current.innerHTML =
          '<div style="color: red; padding: 20px;">Marp 代码有误，请检查语法</div>';
      }
    }
  };

  const renderPresentationSlides = async () => {
    if (!presentationRef.current) return;

    try {
      const fullMarkdown = slides.map((slide) => slide.content).join("\n");
      const marp = new (Marpit as any)({ html: true });
      const { html } = marp.render(fullMarkdown);

      presentationRef.current.innerHTML = html;

      // 添加样式表
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/@marp-team/marp-core/dist/css/marp-core.css";

      if (!document.head.querySelector('link[href*="marp-core"]')) {
        document.head.appendChild(link);
      }

      // 只显示当前幻灯片
      const slideElements = presentationRef.current.querySelectorAll("section");
      slideElements.forEach((element, index) => {
        (element as HTMLElement).style.display =
          index === currentPresentationIndex ? "block" : "none";
      });
    } catch (error) {
      console.error("Marpit 渲染失败：", error);
      if (presentationRef.current) {
        presentationRef.current.innerHTML =
          '<div style="color: red; padding: 20px;">Marp 代码有误，请检查语法</div>';
      }
    }
  };

  const handleUpdateSlide = (index: number, content: string) => {
    const newSlides = [...slides];
    newSlides[index].content = content;
    setSlides(newSlides);
  };

  const handleAddSlide = () => {
    const newId =
      slides.length > 0 ? Math.max(...slides.map((s) => s.id)) + 1 : 1;
    setSlides([
      ...slides,
      {
        id: newId,
        content: `---

## 新幻灯片

在此添加内容`,
      },
    ]);
    setCurrentSlideIndex(slides.length);
  };

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) {
      alert("至少需要保留一个幻灯片");
      return;
    }
    setSlideToDelete(index);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteSlide = () => {
    if (slideToDelete !== null) {
      const newSlides = slides.filter((_, index) => index !== slideToDelete);
      setSlides(newSlides);
      if (currentSlideIndex >= newSlides.length) {
        setCurrentSlideIndex(Math.max(0, newSlides.length - 1));
      }
      setDeleteConfirmOpen(false);
      setSlideToDelete(null);
    }
  };

  const handleSave = () => {
    const activities = JSON.parse(localStorage.getItem("activities") || "[]");
    const params = new URLSearchParams(window.location.search);
    const activityId =
      params.get("id") || `activity_${Date.now()}`;

    const activityIndex = activities.findIndex(
      (a: any) => a.id === activityId
    );

    const newActivity = {
      id: activityId,
      title: draftName,
      type: "PPT Generator",
      activityType: "ppt-generator",
      edited: Date.now(),
      thumbnail: draftName,
      slides: slides,
    };

    if (activityIndex >= 0) {
      activities[activityIndex] = newActivity;
    } else {
      activities.push(newActivity);
    }

    localStorage.setItem("activities", JSON.stringify(activities));
    alert("演示文稿已保存！");
  };

  const handleExportPNG = async () => {
    if (!editPreviewRef.current) {
      alert("No slides to export");
      return;
    }

    try {
      const slideElements = editPreviewRef.current.querySelectorAll("section");
      
      if (slideElements.length === 0) {
        alert("No slides found to export");
        return;
      }

      for (let i = 0; i < slideElements.length; i++) {
        // 显示指定的幻灯片
        slideElements.forEach((element, index) => {
          (element as HTMLElement).style.display =
            index === i ? "block" : "none";
        });

        // 延迟一下，让 DOM 更新
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 导出为 PNG
        const canvas = await html2canvas(editPreviewRef.current, {
          backgroundColor: "#ffffff",
          scale: 2,
          logging: false,
          useCORS: true,
        });

        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `${draftName || "slide"}_${i + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // 恢复显示当前幻灯片
      slideElements.forEach((element, index) => {
        (element as HTMLElement).style.display =
          index === currentSlideIndex ? "block" : "none";
      });

      alert(`Successfully exported ${slideElements.length} slides!`);
    } catch (err) {
      console.error("导出失败：", err);
      alert("导出失败，请重试");
    }
  };

  return (
    <>
      {!isPresentationMode && (
        <div
          className={`p-8 transition-all duration-300 ${
            isAIOpen ? "pr-[416px]" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-amber-500" />
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Presentation Title"
                className="text-xl font-bold w-96"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPresentationMode(true)}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Present
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPNG}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAIOpen(!isAIOpen)}
              >
                <span className="text-2xl">✨</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4">
            {/* 左侧幻灯片列表 */}
            <div className="col-span-1 border-r pr-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="space-y-2">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`p-2 border rounded cursor-pointer transition-all hover:shadow-md relative group ${
                      index === currentSlideIndex
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                    onClick={() => setCurrentSlideIndex(index)}
                  >
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      Slide {index + 1}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-3">
                      {slide.content.replace(/---|\#|>/g, "").substring(0, 50)}
                    </div>

                    {/* 删除按钮 */}
                    {slides.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlide(index);
                        }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4 text-red-500 hover:text-red-700" />
                      </button>
                    )}
                  </div>
                ))}

                {/* 添加幻灯片按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSlide}
                  className="w-full gap-2 mt-4"
                >
                  <Plus className="h-4 w-4" />
                  Add Slide
                </Button>
              </div>
            </div>

            {/* 中间编辑区域 */}
            <div className="col-span-2 border-r pr-4 flex flex-col">
              <div className="flex-1 flex flex-col overflow-hidden">
                <label className="text-sm font-medium mb-2">编辑内容</label>
                <textarea
                  value={slides[currentSlideIndex]?.content || ""}
                  onChange={(e) =>
                    handleUpdateSlide(currentSlideIndex, e.target.value)
                  }
                  className="flex-1 p-3 border rounded font-mono text-sm resize-none overflow-y-auto"
                  placeholder="输入 Markdown 内容..."
                />
                <div className="text-xs text-gray-500 mt-2">
                  提示：使用 --- 分隔幻灯片
                </div>
              </div>
            </div>

            {/* 右侧预览区域 */}
            <div className="col-span-3 border-l pl-4 flex flex-col overflow-hidden">
              <label className="text-sm font-medium mb-2">预览</label>
              <Card className="flex-1 overflow-hidden flex flex-col bg-white">
                <div
                  ref={editPreviewRef}
                  className="flex-1 overflow-auto flex items-center justify-center bg-gray-50"
                  style={{ minHeight: "500px" }}
                />
              </Card>

              {/* 幻灯片导航 */}
              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                <span>
                  Slide {currentSlideIndex + 1} / {slides.length}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
                    }
                    disabled={currentSlideIndex === 0}
                  >
                    ← Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentSlideIndex(
                        Math.min(slides.length - 1, currentSlideIndex + 1)
                      )
                    }
                    disabled={currentSlideIndex === slides.length - 1}
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 演示模式 */}
      {isPresentationMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-white">
            <div
              ref={presentationRef}
              className="w-full h-full flex items-center justify-center"
              style={{ maxHeight: "90vh" }}
            />
          </div>

          <div className="w-full px-8 py-6 text-center text-gray-600 text-sm border-t border-gray-200 bg-white flex-shrink-0">
            <p>
              Press ESC to exit • Arrow Keys to navigate • Slide{" "}
              {currentPresentationIndex + 1} / {slides.length}
            </p>
          </div>

          <div className="fixed top-8 right-8 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPresentationMode(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Exit
            </Button>
          </div>

          {/* 导航按钮 */}
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
            <Button
              variant="outline"
              onClick={() =>
                setCurrentPresentationIndex(
                  Math.max(0, currentPresentationIndex - 1)
                )
              }
              disabled={currentPresentationIndex === 0}
            >
              ← Previous
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentPresentationIndex(
                  Math.min(slides.length - 1, currentPresentationIndex + 1)
                )
              }
              disabled={currentPresentationIndex === slides.length - 1}
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Slide</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this slide? This action cannot be
            undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={confirmDeleteSlide}>
                Delete
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* 键盘快捷键 */}
      <PresentationKeyboardShortcuts
        isPresentationMode={isPresentationMode}
        onExit={() => setIsPresentationMode(false)}
        onNext={() =>
          isPresentationMode &&
          setCurrentPresentationIndex(
            Math.min(slides.length - 1, currentPresentationIndex + 1)
          )
        }
        onPrev={() =>
          isPresentationMode &&
          setCurrentPresentationIndex(Math.max(0, currentPresentationIndex - 1))
        }
      />

      {/* AI 助手面板 */}
      <AIAssistantPanel
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        context="PPT Generator"
      />
    </>
  );
};

// 键盘快捷键组件
const PresentationKeyboardShortcuts = ({
  isPresentationMode,
  onExit,
  onNext,
  onPrev,
}: {
  isPresentationMode: boolean;
  onExit: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPresentationMode) return;

      if (e.key === "Escape") {
        onExit();
      } else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        onNext?.();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrev?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPresentationMode, onExit, onNext, onPrev]);

  return null;
};

export default PPTGenerator;
