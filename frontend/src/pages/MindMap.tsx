import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { AIAssistantPanel } from "@/components/AIAssistantPanel";
import html2canvas from "html2canvas";
import { API_BASE_URL } from "@/services/api";

// 声明全局变量，告诉 TypeScript window.markmapViewer 是存在的（后面动态加载）
declare global {
  interface Window {
    markmapViewer?: (container: HTMLElement, markdown: string) => void;
  }
}

const MindMap = () => {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [draftName, setDraftName] = useState("Untitled MindMap");
  const [markdownCode, setMarkdownCode] = useState(`# Title
## Topic 1
### Subtopic1
#### Details
### Subtopic2
#### Details
## Topic 2
### Subtopic
#### Details`);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);

  const markmapContainerRef = useRef<HTMLDivElement>(null);
  const presentationContainerRef = useRef<HTMLDivElement>(null);

  // 初始化数据 - 只有在编辑模式下且有 id 时才加载思维导图，创建模式使用默认模板
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const activityId = params.get("id");
    const mode = params.get("mode");

    // 只有当 mode 不是 create 且有 id 时，才调用 GET 请求加载思维导图
    if (activityId && mode !== "create") {
      const loadActivity = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/mind-maps/${activityId}`);
          if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
          }
          const data = await response.json();
          
          if (data.success && data.activity) {
            setDraftName(data.activity.title || "Untitled MindMap");
            setMarkdownCode(data.activity.markdownCode || "");
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

  // ✅ 加载 Markmap 库（只加载一次）
  useEffect(() => {
    const loadLibraries = async () => {
      // 检查是否已加载
      if ((window as any).markmap) {
        console.log("[MindMap] 库已加载");
        setIsLibraryLoaded(true);
        return;
      }

      console.log("[MindMap] 开始加载库...");

      try {
        // 按顺序加载脚本
        const scripts = [
          "https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js",
          "https://cdn.jsdelivr.net/npm/markmap-view@0.15.4/dist/browser/index.js",
        ];

        for (const src of scripts) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => {
              console.log(`[MindMap] 加载成功: ${src}`);
              resolve();
            };
            script.onerror = () => {
              console.error(`[MindMap] 加载失败: ${src}`);
              reject(new Error(`Failed to load ${src}`));
            };
            document.head.appendChild(script);
          });
        }

        // 加载 CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/markmap-view@0.15.4/dist/style.css";
        document.head.appendChild(link);

        console.log("[MindMap] 所有库加载完成");
        setIsLibraryLoaded(true);
      } catch (err) {
        console.error("[MindMap] 库加载失败:", err);
      }
    };

    loadLibraries();
  }, []);

  // ✅ 当库加载完成或代码改变时渲染
  useEffect(() => {
    if (isLibraryLoaded) {
      console.log("[MindMap] 触发渲染");
      renderMarkmap();
    }
  }, [isLibraryLoaded, markdownCode, isPresentationMode]);

  // ✅ 渲染函数：使用 Markmap 库渲染
  const renderMarkmap = () => {
    const container = isPresentationMode ? presentationContainerRef.current : markmapContainerRef.current;
    if (!container) {
      console.warn("[MindMap] 容器未找到");
      return;
    }

    console.log("[MindMap] 开始渲染, container:", container);

    // 清空容器
    container.innerHTML = "";

    try {
      // 检查全局 markmap 对象
      const markmapLib = (window as any).markmap;
      console.log("[MindMap] window.markmap:", markmapLib);

      if (!markmapLib || !markmapLib.Markmap) {
        console.error("[MindMap] Markmap 库未找到");
        container.innerHTML = `<p style="color: red; padding: 20px;">❌ Markmap 库未加载。请刷新页面重试。</p>`;
        return;
      }

      console.log("[MindMap] 正在渲染 markdown:", markdownCode);

      // 创建 SVG 容器
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.style.width = "100%";
      svg.style.height = "600px";
      container.appendChild(svg);

      // 使用 Markmap 渲染
      const { Markmap } = markmapLib;
      const mm = Markmap.create(svg, null);
      
      // 转换 markdown 为数据
      const lines = markdownCode.split('\n').filter(line => line.trim());
      const root: any = { content: 'Root', children: [] };
      const stack: any[] = [{ level: 0, node: root }];

      for (const line of lines) {
        const match = line.match(/^(#+)\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const content = match[2];
          const node = { content, children: [] };

          while (stack.length > 0 && stack[stack.length - 1].level >= level) {
            stack.pop();
          }

          if (stack.length > 0) {
            stack[stack.length - 1].node.children.push(node);
          }

          stack.push({ level, node });
        }
      }
      // 如果只有一个一级标题，直接使用它作为根节点
      if (root.children.length === 1 && root.children[0].content) {
        const firstChild = root.children[0];
        root.content = firstChild.content;
        root.children = firstChild.children;
      }
      console.log("[MindMap] 数据结构:", root);
      
      // 设置数据并渲染
      mm.setData(root);
      mm.fit();

      console.log("[MindMap] 渲染完成");
    } catch (err) {
      console.error("[MindMap] 渲染失败:", err);
      container.innerHTML = `<p style="color: red; padding: 20px;">❌ 渲染失败: ${String(err)}</p>`;
    }
  };

  const handleSave = async () => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const existingId = params.get("id");
    
    // 如果 mode=create，使用 POST 创建新思维导图；否则使用 PUT 更新
    const isCreating = mode === "create";

    const activityData = {
      title: draftName,
      type: "Mind Map",
      activityType: "mind-map",
      thumbnail: draftName,
      markdownCode: markdownCode,
    };

    try {
      const url = isCreating
        ? `${API_BASE_URL}/mind-maps/create`
        : `${API_BASE_URL}/mind-maps/update/${existingId}`;
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
        alert(isCreating ? "Activity created successfully!" : "Activity updated successfully!");
        
        // 添加到本地 activityLog
        try {
          const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
          const newLog = {
            type: isCreating ? "created" : "edited",
            title: `${isCreating ? "Created" : "Updated"}: ${draftName}`,
            description: `Mind Map - ${draftName}`,
            timestamp: Date.now(),
            activityId: data.activity.id,
          };
          activityLog.push(newLog);
          localStorage.setItem("activityLog", JSON.stringify(activityLog));
        } catch (logError) {
          console.error("Error saving to activity log:", logError);
        }
        
        // 如果是创建模式，重定向到新创建的思维导图（不带 mode 参数）
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

  const handleExportPNG = async () => {
    // 导出当前显示的ref（编辑或展示模式）
    const element = isPresentationMode ? presentationContainerRef.current : markmapContainerRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { backgroundColor: "#fff" });
      const imgData = canvas.toDataURL("image/png");

      // 创建一个下载链接
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `${draftName || "markmap-diagram"}.png`;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed, please try again");
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
              <Link to="/activities">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              {!isAIOpen && <h2 className="text-xl font-bold">Mind Map</h2>}
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
              <Button variant="outline" onClick={handleExportPNG}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            {/* Left: Markdown Editor */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-6 flex flex-col bg-white h-[calc(100vh-180px)]">
                <div className="flex-1 flex flex-col">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Markdown Code
                  </label>
                  <textarea
                    value={markdownCode}
                    onChange={(e) => setMarkdownCode(e.target.value)}
                    placeholder="Enter Markdown code..."
                    className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-white resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono"
                    spellCheck="false"
                  />
                  <div className="mt-4 p-3 bg-blue-50 rounded-md text-xs text-blue-700">
                    <p className="font-semibold mb-1">
                      💡 Markdown Syntax Tips:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-left">
                      <li># Title (Root)</li>
                      <li>## Topic 1 (Level 1)</li>
                      <li>### Subtopic (Level 2)</li>
                      <li>#### Details (Level 3)</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Preview */}
            <Card className="lg:col-span-4 p-8 flex flex-col bg-white min-h-[calc(100vh-180px)] overflow-hidden">
              <div className="flex-1 flex items-center justify-center bg-gray-50 rounded">
                <div
                  ref={markmapContainerRef}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    minHeight: "400px",
                    width: "100%",
                    backgroundColor: "#fff",
                    padding: "20px",
                  }}
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Presentation Mode */}
      {isPresentationMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex-1 overflow-auto flex items-center justify-center p-8">
            <div
              ref={presentationContainerRef}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                minHeight: "400px",
                width: "100%",
                backgroundColor: "#fff",
                padding: "20px",
                maxHeight: "90vh",
              }}
            />
          </div>

          <div className="w-full px-8 py-6 text-center text-muted-foreground text-sm border-t border-border bg-white flex-shrink-0">
            <p>Press ESC to exit • Click Export to download</p>
          </div>

          <div className="fixed top-8 right-8 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPNG}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPresentationMode(false)}
            >
              Exit
            </Button>
          </div>
        </div>
      )}

      {/* Keyboard control for presentation mode */}
      <KeyboardShortcuts
        isPresentationMode={isPresentationMode}
        onExit={() => setIsPresentationMode(false)}
      />

      {/* AI Assistant Panel */}
      <AIAssistantPanel
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        context="Mind Map"
        customPrompt={`Please generate a Markdown-format mind map about {content}, following these strict rules:
- The number of \`#\` directly corresponds to the hierarchy level:
  - Level 1 (Root node): Use 1 \`#\`
  - Level 2 (Main topic node): Use 2 \`#\`
  - Level 3 (Subcontent node): Use 3 \`#\`
  - (Continue this logic for deeper levels: e.g., Level 4 = 4 \`#\`, etc.)
- Each level represents a hierarchical node of the mind map
- You can add multiple headings at each level as needed
- Use standard Markdown heading syntax (only \`#\` + space + content)
- All content must be written in English

Example (matches the format in the image):
# Mind Map
## Topic 1
### Content 1-1
### Content 1-2
## Topic 2
### Content 2-1
### Content 2-2`}
      />
    </>
  );
};

// Keyboard shortcuts component
const KeyboardShortcuts = ({
  isPresentationMode,
  onExit,
}: {
  isPresentationMode: boolean;
  onExit: () => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPresentationMode && e.key === "Escape") {
        onExit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPresentationMode, onExit]);

  return null;
};

export default MindMap;
