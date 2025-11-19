import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowUp, Plus, Trash2, Edit2, MessageSquare, Upload, FileText, Image, Loader } from "lucide-react";
import { API_BASE_URL } from "@/services/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: string[];
  timestamp?: string;
}

interface Topic {
  id: string;
  chatId?: string; // 后端返回的 chatId
  name: string;
  messages: Message[];
  conversationHistory?: any[]; // 后端返回的对话历史
  createdAt?: string;
  updatedAt?: string;
}

const AIAssistant = () => {
  // 用户ID - 可以从登录状态、localStorage 或其他地方获取
  const [uid] = useState<string>(() => {
    // 尝试从 localStorage 获取，如果没有则生成一个
    const savedUid = localStorage.getItem("user_id");
    if (savedUid) return savedUid;
    const newUid = Date.now().toString(); // 仅使用时间戳作为 UID
    localStorage.setItem("user_id", newUid);
    return newUid;
  });

  const [topics, setTopics] = useState<Topic[]>([
    {
      id: "1",
      name: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
  const [selectedTopicId, setSelectedTopicId] = useState("1");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); // 改为存储 File 对象
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTopic?.messages]);

  const handleNewTopic = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 创建新话题时调用后端新接口
      const response = await fetch(`${API_BASE_URL}/ass_topic/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: uid,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();

      // 创建新话题，使用后端返回的 chatId
      const newTopic: Topic = {
        id: Date.now().toString(),
        chatId: data.chat_id, // 保存后端返回的 chatId
        name: `New Chat ${topics.length + 1}`,
        messages: [
          {
            id: Date.now().toString(),
            role: "assistant",
            content: data.welcomeMessage || "Hello! How can I help you today?",
            timestamp: new Date().toISOString(),
          },
        ],
        conversationHistory: data.conversationHistory || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTopics([...topics, newTopic]);
      setSelectedTopicId(newTopic.id);
    } catch (err) {
      console.error("Error creating new topic:", err);
      setError(err instanceof Error ? err.message : "Failed to create new topic");

      // 如果 API 失败，仍然创建本地话题
      const newTopic: Topic = {
        id: Date.now().toString(),
        name: `New Chat ${topics.length + 1}`,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTopics([...topics, newTopic]);
      setSelectedTopicId(newTopic.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTopic = (id: string) => {
    if (topics.length === 1) {
      alert("Cannot delete the last topic");
      return;
    }
    const newTopics = topics.filter((t) => t.id !== id);
    setTopics(newTopics);
    if (selectedTopicId === id) {
      setSelectedTopicId(newTopics[0].id);
    }
  };

  const handleRenameTopic = (id: string, newName: string) => {
    if (newName.trim()) {
      setTopics(topics.map((t) => (t.id === id ? { ...t, name: newName } : t)));
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setError(null);
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    const currentMessage = message;
    setMessage("");

    // 更新 UI - 立即显示用户消息（使用函数式更新）
    setTopics((prevTopics) =>
      prevTopics.map((t) =>
        t.id === selectedTopicId
          ? {
              ...t,
              messages: [...t.messages, userMessage],
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );



    try {
      // 发送 JSON 数据到后端
      const response = await fetch(`${API_BASE_URL}/ai_ass/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: uid,
          message: currentMessage,
          chat_id: selectedTopic?.chatId || "", // 确保 chat_id 不为 undefined/null，如果没有则发送空字符串
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content || "Sorry, I couldn't generate a response.",
        timestamp: new Date().toISOString(),
      };


    // 更新 UI - 立即显示用户消息（使用函数式更新）
    setTopics((prevTopics) =>
      prevTopics.map((t) =>
          t.id === selectedTopicId
            ? {
                ...t,
                chatId: data.chatId || t.chatId, // 更新或保存 chatId
                messages: [...t.messages, assistantMessage],
                conversationHistory: data.conversationHistory || t.conversationHistory,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Failed to connect to AI service"}`,
        timestamp: new Date().toISOString(),
      };

      // 更新 UI - 显示 AI 回复（使用函数式更新）
      setTopics((prevTopics) =>
        prevTopics.map((t) =>
          t.id === selectedTopicId
            ? {
                ...t,
                messages: [...t.messages, errorMessage],
              }
            : t
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setUploadedFiles([...uploadedFiles, ...fileArray]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-white">
      {/* Left Sidebar - Topics Navigation */}
      <div className="w-64 border-r border-border bg-muted/20 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <Button onClick={handleNewTopic} className="w-full gap-2 rounded-lg" variant="default">
            <Plus className="h-4 w-4" />
            Start a New Topic
          </Button>
        </div>

        {/* Topics List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase px-2">Topics</p>
            {topics.map((topic) => (
              <div
                key={topic.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition ${
                  selectedTopicId === topic.id
                    ? "bg-white border border-border shadow-sm"
                    : "hover:bg-white/50"
                }`}
                onClick={() => {
                  setSelectedTopicId(topic.id);
                  setEditingId(null);
                }}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                {editingId === topic.id ? (
                  <Input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRenameTopic(topic.id, editingName)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameTopic(topic.id, editingName);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-6 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="flex-1 text-sm truncate">{topic.name}</span>
                )}

                {selectedTopicId === topic.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(topic.id);
                        setEditingName(topic.name);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTopic(topic.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        {selectedTopic && (
          <div className="h-14 border-b border-border bg-muted/10 flex items-center px-8 sticky top-0 z-10">
            <h2 className="text-lg font-semibold">{selectedTopic.name}</h2>
          </div>
        )}

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {selectedTopic && selectedTopic.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-bold mb-2">Hi! I'm your assistant.</p>
              <p className="text-muted-foreground mb-1">Let's get started!</p>
              <p className="text-muted-foreground">What would you like to create?</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedTopic?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex flex-col gap-1 max-w-2xl">
                    <div
                      className={`px-4 py-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-muted text-foreground rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-1">
                        {msg.attachments.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs"
                          >
                            <FileText className="h-3 w-3" />
                            <span>{file}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.timestamp && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Assistant is typing...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-center">
                  <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm">
                    {error}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-8">
          {/* Uploaded Files Preview */}
          {uploadedFiles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm"
                >
                  {file.type.startsWith('image/') ? (
                    <Image className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span className="truncate max-w-xs">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    onClick={() =>
                      setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
                    }
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* File Upload Buttons - Above Input */}
          <div className="mb-3 flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
              multiple
              className="hidden"
            />

            {/* Upload Images Button */}
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              title="Upload Images"
              onClick={() => {
                const input = fileInputRef.current;
                if (input) {
                  input.accept = "image/*";
                  input.click();
                }
              }}
            >
              <Image className="h-4 w-4" />
              Upload Image
            </Button>

            {/* Upload Documents Button */}
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              title="Upload Documents"
              onClick={() => {
                const input = fileInputRef.current;
                if (input) {
                  input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.csv";
                  input.click();
                }
              }}
            >
              <Upload className="h-4 w-4" />
              Upload File
            </Button>
          </div>

          {/* Input Box */}
          <div className="flex gap-3">
            <div className="flex-1 relative border border-border rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
              <Textarea
                placeholder="Type your message here... (Press Enter to send)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  // Enter to send
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading) {
                      handleSendMessage();
                    }
                  }
                }}
                disabled={isLoading}
                className="resize-none border-0 focus-visible:ring-0 p-4 disabled:opacity-50"
                rows={5}
              />

              {/* Send Button */}
              <Button
                size="icon"
                className="absolute bottom-4 right-4 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim()}
              >
                {isLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
