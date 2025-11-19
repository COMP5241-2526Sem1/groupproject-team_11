import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Plus, X, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GradeAnalysis } from "@/components/GradeAnalysis";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/services/api";

type TabType = "content" | "assignment" | "quiz" | "video" | "learning-situation" | "ai-assistant";

interface Course {
  id: string;
  code: string;
  title: string;
  status: "Open" | "Closed";
  schedule: string;
  students: string;
  time?: string;
  capacity?: string;
}

interface ContentItem {
  id: string;
  title: string;
  content: string;
  file?: string;
}

const CourseDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>("content");
  const [learningSubTab, setLearningSubTab] = useState<"assignment" | "quiz">("assignment");
  const [selectedItemForGrades, setSelectedItemForGrades] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [dialogType, setDialogType] = useState<"content" | "assignment" | "quiz">("content");
  const [newItem, setNewItem] = useState({ title: "", content: "", file: "" });
  const [uploadedFile, setUploadedFile] = useState<ContentItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
  const [items, setItems] = useState<{ [key: string]: ContentItem[] }>({
    content: [],
    assignment: [],
    quiz: [],
  });

  // Load course from localStorage
  useEffect(() => {
    if (id) {
      const savedCourses = localStorage.getItem("courses");
      if (savedCourses) {
        try {
          const courses = JSON.parse(savedCourses);
          const foundCourse = courses.find((c: Course) => c.id === id);
          setCourse(foundCourse || null);
        } catch (error) {
          console.error("Error loading course:", error);
        }
      }
    }
  }, [id]);

  // Load items from localStorage
  useEffect(() => {
    if (id) {
      // TODO: 后端集成 - 将以下 localStorage 调用替换为后端 API
      // 后端接口: GET /api/courses/{courseId}/content
      // 返回: { content: ContentItem[], assignment: ContentItem[], quiz: ContentItem[] }
      const savedItems = localStorage.getItem(`course_${id}_items`);
      if (savedItems) {
        try {
          setItems(JSON.parse(savedItems));
        } catch (error) {
          console.error("Error loading items:", error);
        }
      }
    }
  }, [id]);

  // Save items to localStorage whenever they change
  useEffect(() => {
    if (id) {
      // TODO: 后端集成 - 将以下 localStorage.setItem 替换为后端 API
      // 后端接口: POST/PUT /api/courses/{courseId}/content
      // 请求体: { content: ContentItem[], assignment: ContentItem[], quiz: ContentItem[] }
      localStorage.setItem(`course_${id}_items`, JSON.stringify(items));
    }
  }, [items, id]);

  const openDialogForTab = (tab: "content" | "assignment" | "quiz") => {
    setDialogType(tab);
    setNewItem({ title: "", content: "", file: "" });
    setUploadedFile(null);
    setOpenAddDialog(true);
  };

  const handleAddItem = () => {
    let itemToAdd: ContentItem;

    // 情况1：用户上传了文件
    if (uploadedFile) {
      itemToAdd = uploadedFile;
    }
    // 情况2：用户手动填写了表单
    else if (newItem.title.trim()) {
      itemToAdd = {
        id: `${dialogType}_${Date.now()}`,
        title: newItem.title,
        content: newItem.content,
        file: newItem.file,
      };
    } else {
      // 两者都没有，不执行任何操作
      return;
    }

    // 添加到列表
    setItems({
      ...items,
      [dialogType]: [...items[dialogType], itemToAdd],
    });
    
    // 记录活动日志
    const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
    const activityTypeNames = {
      content: "Content",
      assignment: "Assignment",
      quiz: "Quiz"
    };
    const activityTypeName = activityTypeNames[dialogType];
    
    activityLog.push({
      type: "created",
      title: `Created: ${itemToAdd.title}`,
      description: `${activityTypeName} added to ${course?.code || "course"}`,
      timestamp: Date.now(),
      activityId: itemToAdd.id
    });
    localStorage.setItem("activityLog", JSON.stringify(activityLog));
    
    // 清空状态并关闭对话框
    setNewItem({ title: "", content: "", file: "" });
    setUploadedFile(null);
    setOpenAddDialog(false);
  };

  const handleDeleteItem = (item: ContentItem, type: "content" | "assignment" | "quiz") => {
    setItemToDelete(item);
    setDialogType(type);
    setOpenDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      // 如果有文件，先尝试删除后端文件
      if (itemToDelete.file) {
        try {
          const filename = itemToDelete.file.split(/[/\\]/).pop() || itemToDelete.file;
          await handleDeleteFile(filename);
          console.log(`File "${filename}" deleted from server`);
        } catch (error) {
          console.error("Failed to delete file from server:", error);
          // 即使后端删除失败，仍然继续删除前端记录
          // 用户可以选择是否继续
          const confirmAnyway = confirm(
            `Failed to delete file from server: ${error instanceof Error ? error.message : String(error)}\n\nDo you still want to remove it from the list?`
          );
          if (!confirmAnyway) {
            setOpenDeleteConfirm(false);
            return;
          }
        }
      }

      // 从前端列表中删除
      setItems({
        ...items,
        [dialogType]: items[dialogType].filter((item) => item.id !== itemToDelete.id),
      });
      
      // Log delete activity
      const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");
      const activityTypeNames = {
        content: "Content",
        assignment: "Assignment",
        quiz: "Quiz"
      };
      const activityTypeName = activityTypeNames[dialogType];
      
      activityLog.push({
        type: "edited",
        title: `Deleted: ${itemToDelete.title}`,
        description: `${activityTypeName} removed from ${course?.code || "course"}`,
        timestamp: Date.now(),
        activityId: itemToDelete.id
      });
      localStorage.setItem("activityLog", JSON.stringify(activityLog));
      
      setOpenDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const handleViewDetail = (item: ContentItem) => {
    setSelectedItem(item);
    setOpenDetailDialog(true);
  };

  const handleDeleteFile = async (filename: string) => {
    try {
      console.log("Deleting file from server:", filename);
      
      // 调用后端删除接口
      const response = await fetch(`${API_BASE_URL}/delete/${filename}`, {
        method: "DELETE",
      });

      console.log("Delete response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Delete error response:", errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(`Delete failed: ${errorJson.error || errorJson.message || response.statusText}`);
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message.includes("Delete failed")) {
            throw parseError;
          }
          throw new Error(`Delete failed: ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log("Delete response:", data);
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      // 不显示 alert，让调用方处理错误
      throw error;
    }
  };

  const handleDownloadFile = async (filename: string) => {
    try {
      console.log("Downloading file:", filename);
      
      // 调用后端下载接口
      const response = await fetch(`${API_BASE_URL}/download/${filename}`, {
        method: "GET",
      });

      console.log("Download response status:", response.status);

      if (!response.ok) {
        // 尝试获取详细错误信息
        const errorText = await response.text();
        console.error("Download error response:", errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          const errorMsg = errorJson.error || errorJson.message || response.statusText;
          
          // 检查是否是路径错误
          if (errorMsg.includes("找不到指定的路径") || errorMsg.includes("WinError 3")) {
            throw new Error("Backend configuration error: File path issue. Please check backend upload directory settings.");
          }
          
          throw new Error(`Download failed: ${errorMsg}`);
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message.includes("Backend configuration")) {
            throw parseError;
          }
          throw new Error(`Download failed: ${response.statusText} - ${errorText}`);
        }
      }

      // 获取文件 blob
      const blob = await response.blob();
      console.log("Blob size:", blob.size, "bytes");
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`File "${filename}" downloaded successfully`);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert(`Failed to download file: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleUploadFile = async (file: File, tab: "content" | "assignment" | "quiz") => {
    const formData = new FormData();
    formData.append("file", file);

    // 修改 URL 调用方式，直接分开调用
    // 注意：需要确保后端服务已启动，默认端口为 5000
    const apiEndpoints = {
      content: `${API_BASE_URL}/upload/content`,
      assignment: `${API_BASE_URL}/upload/assignment`,
      quiz: `${API_BASE_URL}/upload/quiz`,
    };

    console.log("Uploading file:", file.name, "to", apiEndpoints[tab]);

    try {
      const response = await fetch(apiEndpoints[tab], {
        method: "POST",
        body: formData,
        // 不要手动设置 Content-Type，让浏览器自动设置 multipart/form-data
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        // 尝试获取详细的错误信息
        const errorText = await response.text();
        console.error("Error response:", errorText);
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(`API Error: ${errorJson.error || response.statusText}`);
        } catch {
          throw new Error(`API Error: ${response.statusText} - ${errorText}`);
        }
      }

      const data = await response.json();
      console.log("Upload response:", data);

      // 修改前端以处理后端返回的文件上传响应
      // 后端返回格式：{ filename, message, saved_path }，没有 success 字段
      if (data.filename && data.saved_path) {
        const newItem: ContentItem = {
          id: `${tab}_${Date.now()}`,
          title: data.filename,
          content: "",
          // 只保存文件名，不保存完整路径，避免下载时路径问题
          file: data.filename,
        };

        // 暂存上传的文件信息，不立即添加到列表
        setUploadedFile(newItem);
        alert(`File "${data.filename}" uploaded successfully! Click "Add" to confirm or "Cancel" to discard.`);
      } else {
        alert(`File upload failed: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again later.");
    }
  };

  const handleUploadGrades = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload_grades`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error uploading grades:", errorText);
        alert("Failed to upload grades. Please try again.");
        return;
      }

      const data = await response.json();
      console.log("Upload grades response:", data);

      if (data.quiz_anal_id) {
        localStorage.setItem("quiz_anal_id", data.quiz_anal_id);
        alert(`Grades uploaded successfully! Analysis ID: ${data.quiz_anal_id}`);
      } else {
        alert("Grades uploaded, but no analysis ID returned.");
      }
    } catch (error) {
      console.error("Error uploading grades:", error);
      alert("Failed to upload grades. Please try again.");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "content":
        return (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
                <Input
                  placeholder="Search Uploaded Content"
                  className="pl-10 border-primary text-primary placeholder:text-primary"
                />
              </div>
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => openDialogForTab("content")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Content
              </Button>
            </div>

            {items.content.length === 0 ? (
              <Card className="p-6">
                <p className="text-muted-foreground text-center">No content uploaded yet</p>
              </Card>
            ) : (
              items.content.map((item) => (
                <Card 
                  key={item.id} 
                  className="p-6 relative group cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleViewDetail(item)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item, "content");
                    }}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </button>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  {item.content && <p className="text-muted-foreground mb-2 line-clamp-2">{item.content}</p>}
                  {item.file && (
                    <p className="text-sm text-primary">📎 {item.file}</p>
                  )}
                </Card>
              ))
            )}
          </div>
        );

      case "assignment":
        return (
          <div className="space-y-6">
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => openDialogForTab("assignment")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Assignment
              </Button>
            </div>

            {items.assignment.length === 0 ? (
              <Card className="p-6">
                <p className="text-muted-foreground text-center">No assignments created yet</p>
              </Card>
            ) : (
              items.assignment.map((item) => (
                <Card 
                  key={item.id} 
                  className="p-6 relative group cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleViewDetail(item)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item, "assignment");
                    }}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </button>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  {item.content && <p className="text-muted-foreground mb-2 line-clamp-2">{item.content}</p>}
                  {item.file && (
                    <p className="text-sm text-primary">📎 {item.file}</p>
                  )}
                </Card>
              ))
            )}
          </div>
        );

      case "quiz":
        return (
          <div className="space-y-6">
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => openDialogForTab("quiz")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Quiz
              </Button>
            </div>

            {items.quiz.length === 0 ? (
              <Card className="p-6">
                <p className="text-muted-foreground text-center">No quizzes created yet</p>
              </Card>
            ) : (
              items.quiz.map((item) => (
                <Card 
                  key={item.id} 
                  className="p-6 relative group cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleViewDetail(item)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item, "quiz");
                    }}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </button>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  {item.content && <p className="text-muted-foreground mb-2 line-clamp-2">{item.content}</p>}
                  {item.file && (
                    <p className="text-sm text-primary">📎 {item.file}</p>
                  )}
                </Card>
              ))
            )}
          </div>
        );

      case "video":
        return (
          <div className="space-y-6">
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => navigate("/course-replay")}
            >
              View Course Replay
            </Button>
          </div>
        );

      case "learning-situation":
        return (
          <div className="space-y-6">
            {/* Type Selection: Assignment or Quiz */}
            <div className="flex gap-4 mb-6">
              <Button
                variant={learningSubTab === "assignment" ? "default" : "outline"}
                className={cn(
                  learningSubTab === "assignment" 
                    ? "bg-primary/20 text-primary border-primary" 
                    : "border-primary text-foreground hover:bg-primary hover:text-primary-foreground"
                )}
                onClick={() => {
                  setLearningSubTab("assignment");
                  setSelectedItemForGrades(null);
                }}
              >
                Assignment Grades
              </Button>
              <Button
                variant={learningSubTab === "quiz" ? "default" : "outline"}
                className={cn(
                  learningSubTab === "quiz" 
                    ? "bg-primary/20 text-primary border-primary" 
                    : "border-primary text-foreground hover:bg-primary hover:text-primary-foreground"
                )}
                onClick={() => {
                  setLearningSubTab("quiz");
                  setSelectedItemForGrades(null);
                }}
              >
                Quiz Grades
              </Button>
            </div>

            {/* Item Selection */}
            {!selectedItemForGrades && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Select {learningSubTab === "assignment" ? "an Assignment" : "a Quiz"}
                </h3>
                <div className="space-y-4">
                  {items[learningSubTab].length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No {learningSubTab === "assignment" ? "assignments" : "quizzes"} created yet.
                      Please add {learningSubTab === "assignment" ? "an assignment" : "a quiz"} first.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {items[learningSubTab].map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedItemForGrades(item.id)}
                        >
                          <div>
                            <h4 className="font-semibold">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Click to view and upload grades
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            View →
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Grade Analysis Component */}
            {selectedItemForGrades && (
              <div>
                <Button
                  variant="ghost"
                  className="mb-4"
                  onClick={() => setSelectedItemForGrades(null)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to {learningSubTab === "assignment" ? "Assignments" : "Quizzes"}
                </Button>
                <GradeAnalysis
                  itemTitle={
                    items[learningSubTab].find((item) => item.id === selectedItemForGrades)?.title || ""
                  }
                  itemType={learningSubTab}
                />
              </div>
            )}
          </div>
        );

      case "ai-assistant":
        navigate("/ai-assistant");
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar */}
      <aside className="w-48 bg-muted/30 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-foreground"
            onClick={() => navigate("/courses")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <nav className="flex-1 py-2">
          {[
            { id: "content", label: "Content" },
            { id: "assignment", label: "Assignment" },
            { id: "quiz", label: "Quiz" },
            { id: "learning-situation", label: "Learning situation" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={cn(
                "w-full text-left px-4 py-3 text-sm font-medium transition-colors",
                activeTab === item.id
                  ? "bg-background border-l-4 border-foreground"
                  : "hover:bg-muted/50"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {course ? `${course.code} - ${course.title}` : "Software Engineering and Development"}
          </h1>
          {course && (
            <p className="text-sm text-muted-foreground mt-2">
              Schedule: {course.schedule} | Students: {course.students}
              {course.time && ` | Time: ${course.time}`}
            </p>
          )}
        </div>
        {renderContent()}
      </main>

      {/* Add Item Dialog */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add New{" "}
              {dialogType === "content"
                ? "Content"
                : dialogType === "assignment"
                ? "Assignment"
                : "Quiz"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 显示已上传文件的信息 */}
            {uploadedFile && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-medium text-green-800">✓ File uploaded successfully!</p>
                <p className="text-sm text-green-600 mt-1">📎 {uploadedFile.title}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Click "Add" to confirm, or upload another file to replace it.
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Upload File</label>
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUploadFile(file, dialogType);
                    // 清空input值,允许重复上传相同文件
                    e.target.value = '';
                  }
                }}
                className="mt-2 w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a file, or fill in the form below to add content manually
              </p>
            </div>

            {/* 手动填写表单 - 上传文件后禁用 */}
            <div className="space-y-4 pt-2 border-t">
              <div>
                <label className="text-sm font-medium">Title (Manual Entry)</label>
                <Input
                  placeholder="Enter title..."
                  value={newItem.title}
                  onChange={(e) =>
                    setNewItem({ ...newItem, title: e.target.value })
                  }
                  disabled={!!uploadedFile}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <textarea
                  placeholder="Enter content..."
                  value={newItem.content}
                  onChange={(e) =>
                    setNewItem({ ...newItem, content: e.target.value })
                  }
                  disabled={!!uploadedFile}
                  className="mt-2 w-full px-3 py-2 border border-input rounded-md resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={4}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setOpenAddDialog(false);
              setUploadedFile(null);
              setNewItem({ title: "", content: "", file: "" });
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddItem} 
              disabled={!uploadedFile && !newItem.title.trim()}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={openDetailDialog} onOpenChange={setOpenDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogDescription>
              View detailed information and files
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Content</label>
              <div className="mt-2 p-4 bg-muted rounded-md max-h-64 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{selectedItem?.content || "No content"}</p>
              </div>
            </div>
            {selectedItem?.file && (
              <div>
                <label className="text-sm font-medium">Attached File</label>
                <div className="mt-2 p-4 bg-muted rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>📎</span>
                    <span className="text-sm">{selectedItem.file}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // 从文件路径中提取文件名
                      const filename = selectedItem.file.split(/[/\\]/).pop() || selectedItem.file;
                      handleDownloadFile(filename);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setOpenDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Item</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <span className="font-semibold text-foreground">"{itemToDelete?.title}"</span>? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseDetail;
