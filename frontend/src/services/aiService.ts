/**
 * AI 助手服务层
 * 与后端 AI API 通信
 */

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: string[];
  timestamp?: string;
}

export interface ChatRequest {
  topicId: string;
  message: string;
  attachments?: string[];
  conversationHistory?: Message[];
}

export interface ChatResponse {
  id?: string;
  content: string;
  reply?: string;
  status?: string;
  error?: string;
}

import { API_BASE_URL } from './api';

const AI_API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/api/ai` : "http://49.232.227.144:5000/api/ai";

/**
 * 发送消息到 AI 并获取回复
 * POST /api/ai/chat
 */
export const sendChatMessage = async (request: ChatRequest): Promise<ChatResponse> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 如果需要认证，添加 token
        // "Authorization": `Bearer ${getToken()}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};

/**
 * 获取对话历史
 * GET /api/ai/conversations/:topicId
 */
export const getConversationHistory = async (topicId: string): Promise<Message[]> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/conversations/${topicId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    return [];
  }
};

/**
 * 保存对话
 * POST /api/ai/conversations
 */
export const saveConversation = async (topicId: string, messages: Message[]): Promise<boolean> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topicId,
        messages,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error saving conversation:", error);
    return false;
  }
};

/**
 * 清除对话历史
 * DELETE /api/ai/conversations/:topicId
 */
export const clearConversationHistory = async (topicId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/conversations/${topicId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Error clearing conversation:", error);
    return false;
  }
};

/**
 * 上传文件到 AI 服务
 * POST /api/ai/upload
 */
export const uploadFileToAI = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${AI_API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data.fileId || data.filename || "";
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export default {
  sendChatMessage,
  getConversationHistory,
  saveConversation,
  clearConversationHistory,
  uploadFileToAI,
};
