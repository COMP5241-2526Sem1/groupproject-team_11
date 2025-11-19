/**
 * URL 配置工具
 * 统一管理所有URL生成逻辑
 */

import { API_BASE_URL, BASE_URL, FRONTEND_URL } from './api';

/**
 * 获取完整的 API URL
 * @param endpoint API 端点路径
 * @returns 完整的 API URL
 */
export const getApiUrl = (endpoint: string): string => {
  // 如果 endpoint 已经包含 /api，直接使用 BASE_URL
  if (endpoint.startsWith('/api/')) {
    return `${BASE_URL}${endpoint}`;
  }
  // 否则使用 API_BASE_URL
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
};

/**
 * 获取后端基础 URL（用于文件上传等）
 * @param path 路径
 * @returns 完整的 URL
 */
export const getBaseUrl = (path: string = ''): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

/**
 * 获取分享链接 URL
 * @param path 路径
 * @returns 完整的分享链接 URL
 */
export const getShareUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${FRONTEND_URL}${cleanPath}`;
};

/**
 * 构建完整的 API 请求配置
 * @param endpoint API 端点
 * @param token 认证令牌
 * @returns fetch 请求配置
 */
export const buildFetchConfig = (
  method: string = 'GET',
  token?: string,
  body?: any
): RequestInit => {
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  return config;
};

export default {
  getApiUrl,
  getBaseUrl,
  getShareUrl,
  buildFetchConfig,
  API_BASE_URL,
  BASE_URL,
  FRONTEND_URL,
};
