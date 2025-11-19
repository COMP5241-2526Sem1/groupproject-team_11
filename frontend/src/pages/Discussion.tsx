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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MessageSquare, ThumbsUp, X, Reply } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/services/api";


type UserRole = "student" | "teacher" | "admin";

// Global token definition - replace with actual token from login
const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiIyNTA0MDc1OEciLCJ1c2VyX25hbWUiOiJUZXN0IFVzZXIiLCJyb2xlIjoidGVhY2hlciIsImV4cCI6MjEyMzMyNTY2OH0.6ZNz0Ym4WaXVWgfO7riGh16fpXhKOOWJzFRX0zX8sBY";

interface DiscussionReply {
  id: string;
  authorName: string;
  authorId: string;
  userRole: UserRole;
  isAnonymous: boolean;
  content: string;
  createdAt: number;
  likes: number;
  likedBy: string[];
}

interface DiscussionPost {
  id: string;
  authorName: string;
  authorId: string;
  userRole: UserRole;
  isAnonymous: boolean;
  type: "public" | "question";
  title: string;
  content: string;
  createdAt: number;
  likes: number;
  likedBy: string[];
  replies: DiscussionReply[];
}

interface DiscussionState {
  publicDiscussions: DiscussionPost[];
  questions: DiscussionPost[];
}

const Discussion = () => {

  const [activeTab, setActiveTab] = useState<"public" | "question">("public");
  const [discussions, setDiscussions] = useState<DiscussionState>({
    publicDiscussions: [],
    questions: [],
  });
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", isAnonymous: false });
  const [selectedPost, setSelectedPost] = useState<DiscussionPost | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  
  // TODO: Backend integration - replace these with actual user data from authentication
  // Backend API should be: GET /api/auth/current-user - get current logged-in user info
  // User object should contain: { userId, userName, userRole: "student" | "teacher" | "admin" }
  const [currentUserId] = useState("user_123");
  const [currentUserName] = useState("John");
  const [currentUserRole] = useState<UserRole>("teacher"); // Default to teacher as per requirement

  // Load discussions from backend API
  useEffect(() => {
    const loadDiscussions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/discussions`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          // Helper function to normalize timestamp
          const normalizeTimestamp = (timestamp: any): number => {
            if (typeof timestamp === "number") {
              // If already a number, check if it's in seconds (< 10 billion) or milliseconds
              return timestamp < 10000000000 ? timestamp * 1000 : timestamp;
            }
            if (typeof timestamp === "string") {
              // Parse ISO 8601 string or other date formats
              const parsed = new Date(timestamp).getTime();
              return isNaN(parsed) ? Date.now() : parsed;
            }
            // Fallback to current time
            return Date.now();
          };

          // Helper function to normalize post data from backend
          const normalizePost = (post: any): DiscussionPost => ({
            id: post.id,
            authorName: post.authorName,
            authorId: post.authorId,
            userRole: post.userRole || "student",
            isAnonymous: post.isAnonymous || false,
            type: post.type,
            title: post.title,
            content: post.content,
            createdAt: normalizeTimestamp(post.createdAt),
            likes: post.likes || 0,
            likedBy: post.likedBy || [],
            replies: (post.replies || []).map((reply: any) => ({
              id: reply.id,
              authorName: reply.authorName,
              authorId: reply.authorId,
              userRole: reply.userRole || "student",
              isAnonymous: reply.isAnonymous || false,
              content: reply.content,
              createdAt: normalizeTimestamp(reply.createdAt),
              likes: reply.likes || 0,
              likedBy: reply.likedBy || [],
            })),
          });

          // Separate posts by type correctly
          const allPosts = [...(data.publicDiscussions || []), ...(data.questions || [])];
          const publicPosts = allPosts.filter((post: any) => post.type === "public").map(normalizePost);
          const questionPosts = allPosts.filter((post: any) => post.type === "question").map(normalizePost);

          setDiscussions({
            publicDiscussions: publicPosts,
            questions: questionPosts,
          });
        }
      } catch (error) {
        console.error("Error loading discussions:", error);
        // 如果后端请求失败，保持空列表
      }
    };

    loadDiscussions();
  }, []);

  // No longer need to sync to localStorage - data is managed by backend

  // Get current tab's discussions
  const getCurrentDiscussions = () => {
    const typeMap = {
      public: discussions.publicDiscussions,
      question: discussions.questions,
    };
    return typeMap[activeTab];
  };

  // Publish new discussion
  const handlePublishPost = async () => {
    // Check permissions for "question" tab - only students can create
    if (activeTab === "question" && currentUserRole !== "student") {
      alert("Only students can create discussions in the Student Questions section. Teachers can only reply.");
      return;
    }

    if (!newPost.title || !newPost.content) {
      alert("Title and content cannot be empty");
      return;
    }

    const postData = {
      type: activeTab,
      title: newPost.title,
      content: newPost.content,
      isAnonymous: newPost.isAnonymous,
      authorId: currentUserId,
      authorName: newPost.isAnonymous ? "Anonymous" : currentUserName,
      userRole: currentUserRole,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/discussions/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.post) {
        // 添加到本地状态
        const newDiscussionPost: DiscussionPost = {
          id: data.post.id,
          authorName: data.post.authorName,
          authorId: data.post.authorId,
          userRole: data.post.userRole,
          isAnonymous: data.post.isAnonymous,
          type: data.post.type,
          title: data.post.title,
          content: data.post.content,
          createdAt: data.post.createdAt,
          likes: data.post.likes || 0,
          likedBy: data.post.likedBy || [],
          replies: data.post.replies || [],
        };

        setDiscussions((prev) => {
          const typeMap = {
            public: "publicDiscussions",
            question: "questions",
          };
          const key = typeMap[activeTab] as keyof DiscussionState;
          return {
            ...prev,
            [key]: [...prev[key], newDiscussionPost],
          };
        });

        setNewPost({ title: "", content: "", isAnonymous: false });
        setOpenNewDialog(false);
        alert(data.message || "Discussion posted successfully!");
      } else {
        alert("Failed to post discussion. Please try again later.");
      }
    } catch (error) {
      console.error("Error posting discussion:", error);
      alert("Failed to post discussion. Please try again later.");
    }
  };

  // Like post
  const handleLikePost = async (postId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/discussions/${postId}/like`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // 更新本地状态
        setDiscussions((prev) => {
          const typeMap = {
            public: "publicDiscussions",
            question: "questions",
          };
          const key = typeMap[activeTab] as keyof DiscussionState;
          const updatedPosts = prev[key].map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                likes: data.likes,
                likedBy: data.likedBy,
              };
            }
            return post;
          });
          return { ...prev, [key]: updatedPosts };
        });
      }
    } catch (error) {
      console.error("Error liking post:", error);
      alert("Failed to like/unlike post. Please try again later.");
    }
  };

  // Add reply
  const handleAddReply = async (postId: string) => {
    if (!replyContent.trim()) {
      alert("Reply content cannot be empty");
      return;
    }

    const replyData = {
      content: replyContent,
      isAnonymous: false,
      authorId: currentUserId,
      authorName: currentUserName,
      userRole: currentUserRole,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/discussions/${postId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(replyData),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.reply) {
        const newReply: DiscussionReply = {
          id: data.reply.id,
          authorName: data.reply.authorName,
          authorId: data.reply.authorId,
          userRole: data.reply.userRole,
          isAnonymous: data.reply.isAnonymous,
          content: data.reply.content,
          createdAt: data.reply.createdAt,
          likes: data.reply.likes || 0,
          likedBy: data.reply.likedBy || [],
        };

        setDiscussions((prev) => {
          const typeMap = {
            public: "publicDiscussions",
            question: "questions",
          };
          const key = typeMap[activeTab] as keyof DiscussionState;
          const updatedPosts = prev[key].map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                replies: [...post.replies, newReply],
              };
            }
            return post;
          });
          return { ...prev, [key]: updatedPosts };
        });

        setReplyContent("");
        if (selectedPost) {
          setSelectedPost({
            ...selectedPost,
            replies: [...selectedPost.replies, newReply],
          });
        }
      } else {
        alert("Failed to post reply. Please try again later.");
      }
    } catch (error) {
      console.error("Error posting reply:", error);
      alert("Failed to post reply. Please try again later.");
    }
  };

  // Like reply
  const handleLikeReply = async (postId: string, replyId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/discussions/${postId}/replies/${replyId}/like`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: currentUserId }),
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // 更新本地状态
        setDiscussions((prev) => {
          const typeMap = {
            public: "publicDiscussions",
            question: "questions",
          };
          const key = typeMap[activeTab] as keyof DiscussionState;
          const updatedPosts = prev[key].map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                replies: post.replies.map((reply) => {
                  if (reply.id === replyId) {
                    return {
                      ...reply,
                      likes: data.likes,
                      likedBy: data.likedBy,
                    };
                  }
                  return reply;
                }),
              };
            }
            return post;
          });
          return { ...prev, [key]: updatedPosts };
        });
        
        // Update selected post if it's open
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost({
            ...selectedPost,
            replies: selectedPost.replies.map((reply) => {
              if (reply.id === replyId) {
                return {
                  ...reply,
                  likes: data.likes,
                  likedBy: data.likedBy,
                };
              }
              return reply;
            }),
          });
        }
      }
    } catch (error) {
      console.error("Error liking reply:", error);
      alert("Failed to like/unlike reply. Please try again later.");
    }
  };

  // Format time
  const formatTime = (timestamp: number) => {
    // Validate timestamp
    if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
      return "recently";
    }

    const now = Date.now();
    const diff = now - timestamp;
    
    // Handle invalid or future timestamps
    if (diff < 0) {
      return "just now";
    }

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  };

  // Toggle post expand/collapse
  const togglePostExpand = (postId: string) => {
    setExpandedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Toggle reply expand/collapse
  const toggleReplyExpand = (replyId: string) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(replyId)) {
        newSet.delete(replyId);
      } else {
        newSet.add(replyId);
      }
      return newSet;
    });
  };

  // Get role badge display
  const getRoleBadge = (role: UserRole) => {
    const roleConfig: Record<UserRole, { label: string; bgColor: string; textColor: string }> = {
      teacher: { label: "Teacher", bgColor: "bg-yellow-500", textColor: "text-white" },
      admin: { label: "Admin", bgColor: "bg-red-500", textColor: "text-white" },
      student: { label: "Student", bgColor: "bg-blue-500", textColor: "text-white" },
    };
    return roleConfig[role];
  };

  const currentDiscussions = getCurrentDiscussions();

  const tabConfig = {
    public: { label: "Public Discussion", color: "bg-green-100", textColor: "text-green-600" },
    question: { label: "Student Questions", color: "bg-blue-100", textColor: "text-blue-600" },
  };

  // Determine if current user can create discussions in current tab
  const canCreateDiscussion = activeTab === "public" || (activeTab === "question" && currentUserRole === "student");

  return (
    <div className="p-8 flex justify-center">
      <div className="w-full max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <h2 className="text-2xl font-bold">Discussion</h2>
          </div>
          {canCreateDiscussion && (
            <Button onClick={() => setOpenNewDialog(true)} className="gap-2">
              Post New Discussion
            </Button>
          )}
        </div>

      {/* Tab navigation */}
      <div className="flex gap-2 mb-6">
        {(["public", "question"] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            onClick={() => setActiveTab(tab)}
          >
            {tabConfig[tab].label}
          </Button>
        ))}
      </div>

      {/* Discussion list */}
      <div className="space-y-4">
        {currentDiscussions.length > 0 ? (
          currentDiscussions.map((post) => (
            <Card key={post.id} className="p-6 hover:shadow-lg transition-shadow">
              {/* Discussion header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold">
                      {post.authorName}
                      {post.isAnonymous && " (Anonymous)"}
                    </span>
                    {!post.isAnonymous && (
                      <Badge className={cn(getRoleBadge(post.userRole).bgColor, getRoleBadge(post.userRole).textColor)}>
                        {getRoleBadge(post.userRole).label}
                      </Badge>
                    )}
                    <Badge variant="outline" className={tabConfig[post.type].color}>
                      {tabConfig[post.type].label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{formatTime(post.createdAt)}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                  <div className="relative">
                    <p 
                      className={cn(
                        "text-gray-700 whitespace-pre-wrap break-words",
                        !expandedPosts.has(post.id) && "line-clamp-3"
                      )}
                    >
                      {post.content}
                    </p>
                    {(post.content.split('\n').length > 3 || post.content.length > 429) && (
                      <button
                        onClick={() => togglePostExpand(post.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm mt-1 font-medium"
                      >
                        {expandedPosts.has(post.id) ? "Collapse" : "Expand"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 mt-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLikePost(post.id)}
                  className={cn(
                    "flex items-center gap-2",
                    post.likedBy.includes(currentUserId) && "text-red-500"
                  )}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{post.likes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPost(post)}
                  className="flex items-center gap-2"
                >
                  <Reply className="h-4 w-4" />
                  Reply ({post.replies.length})
                </Button>
              </div>

              {/* Replies list */}
              {post.replies.length > 0 && (
                <div className="mt-4 pl-6 border-l-2 border-gray-200 space-y-3">
                  {post.replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {reply.authorName}
                            {reply.isAnonymous && " (Anonymous)"}
                          </span>
                          {!reply.isAnonymous && (
                            <Badge className={cn(getRoleBadge(reply.userRole).bgColor, getRoleBadge(reply.userRole).textColor, "text-xs")}>
                              {getRoleBadge(reply.userRole).label}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(reply.createdAt)}
                        </span>
                      </div>
                      <div className="relative">
                        <p 
                          className={cn(
                            "text-sm text-gray-700 whitespace-pre-wrap break-words mb-2",
                            !expandedReplies.has(reply.id) && "line-clamp-3"
                          )}
                        >
                          {reply.content}
                        </p>
                        {(reply.content.split('\n').length > 3 || reply.content.length > 300) && (
                          <button
                            onClick={() => toggleReplyExpand(reply.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium mb-2"
                          >
                            {expandedReplies.has(reply.id) ? "Collapse" : "Expand"}
                          </button>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeReply(post.id, reply.id)}
                        className={cn(
                          "flex items-center gap-2 text-xs",
                          reply.likedBy.includes(currentUserId) && "text-red-500"
                        )}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span>{reply.likes}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No discussions yet. Be the first to post one!</p>
          </Card>
        )}
      </div>

      {/* Post new discussion dialog */}
      <Dialog open={openNewDialog} onOpenChange={setOpenNewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post New Discussion - {tabConfig[activeTab].label}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                placeholder="Enter discussion title"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <Textarea
                placeholder="Enter discussion content"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={6}
              />
            </div>

            {activeTab === "public" && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={newPost.isAnonymous}
                  onChange={(e) => setNewPost({ ...newPost, isAnonymous: e.target.checked })}
                />
                <label htmlFor="anonymous" className="text-sm font-medium">
                  Post anonymously (show student ID instead of name)
                </label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublishPost}>Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply dialog */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reply to Discussion</DialogTitle>
            </DialogHeader>

            <div className="bg-gray-50 p-4 rounded mb-4">
              <h3 className="font-semibold mb-2">{selectedPost.title}</h3>
              <div className="relative">
                <p 
                  className={cn(
                    "text-sm text-gray-700 whitespace-pre-wrap break-words",
                    !expandedPosts.has(`dialog-${selectedPost.id}`) && "line-clamp-3"
                  )}
                >
                  {selectedPost.content}
                </p>
                {(selectedPost.content.split('\n').length > 3 || selectedPost.content.length > 400) && (
                  <button
                    onClick={() => togglePostExpand(`dialog-${selectedPost.id}`)}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1"
                  >
                    {expandedPosts.has(`dialog-${selectedPost.id}`) ? "Collapse" : "Expand"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span>{selectedPost.authorName}</span>
                <span>{formatTime(selectedPost.createdAt)}</span>
                <span>👍 {selectedPost.likes}</span>
              </div>
            </div>

            {/* Existing replies */}
            {selectedPost.replies.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                <h4 className="font-semibold text-sm">Replies ({selectedPost.replies.length})</h4>
                {selectedPost.replies.map((reply) => (
                  <div key={reply.id} className="bg-gray-50 p-3 rounded text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {reply.authorName}
                          {reply.isAnonymous && " (Anonymous)"}
                        </span>
                        {!reply.isAnonymous && (
                          <Badge className={cn(getRoleBadge(reply.userRole).bgColor, getRoleBadge(reply.userRole).textColor, "text-xs")}>
                            {getRoleBadge(reply.userRole).label}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(reply.createdAt)}
                      </span>
                    </div>
                    <div className="relative">
                      <p 
                        className={cn(
                          "text-gray-700 whitespace-pre-wrap break-words mb-2",
                          !expandedReplies.has(`dialog-${reply.id}`) && "line-clamp-3"
                        )}
                      >
                        {reply.content}
                      </p>
                      {(reply.content.split('\n').length > 3 || reply.content.length > 300) && (
                        <button
                          onClick={() => toggleReplyExpand(`dialog-${reply.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium mb-2"
                        >
                          {expandedReplies.has(`dialog-${reply.id}`) ? "Collapse" : "Expand"}
                        </button>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikeReply(selectedPost.id, reply.id)}
                      className={cn(
                        "flex items-center gap-2 text-xs",
                        reply.likedBy.includes(currentUserId) && "text-red-500"
                      )}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span>{reply.likes}</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Input reply */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-2">Your Reply</label>
              <Textarea
                placeholder="Enter your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPost(null)}>
                Close
              </Button>
              <Button onClick={() => handleAddReply(selectedPost.id)}>Send Reply</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </div>
  );
};

export default Discussion;
