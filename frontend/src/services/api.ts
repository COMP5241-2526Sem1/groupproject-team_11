/**
 * API 服务层
 * 与后端通信的接口定义和请求方法
 */

// ==================== 配置 ====================
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// 导出不带 /api 后缀的基础URL,用于某些特殊场景(如文件上传)
export const BASE_URL = import.meta.env.VITE_BASE_URL || API_BASE_URL.replace(/\/api$/, '');

// 前端基础URL,用于生成分享链接
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

// ==================== Token 管理 ====================

/**
 * Token 存储 key
 */
const TOKEN_STORAGE_KEY = "auth_token";

/**
 * 获取存储的 Token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

/**
 * 设置 Token
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

/**
 * 清除 Token
 */
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

/**
 * 检查是否有 Token
 */
export const hasToken = (): boolean => {
  return !!getToken();
};

// ==================== 类型定义 ====================

/**
 * 仪表板统计数据
 */
export interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  assignmentCompletionRate: number;
  taskAccuracy: number;
}

/**
 * 活动类型
 */
export type ActivityType = "completed" | "started" | "achievement" | "submitted";

/**
 * 活动记录
 */
export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  courseCode: string;
  courseName: string;
  timestamp: string;
}

/**
 * API 响应包装
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * 用户信息
 */
export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}
// ==================== 工具函数 ====================

/**
 * 构建完整的 API URL
 */
const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  let url = `${API_BASE_URL}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  return url;
};

/**
 * 通用 fetch 请求
 */
const apiCall = async <T>(
  method: string,
  endpoint: string,
  options: {
    params?: Record<string, any>;
    body?: Record<string, any>;
    headers?: Record<string, string>;
    skipAuth?: boolean;  // 是否跳过自动添加 Token
  } = {}
): Promise<T> => {
  const url = buildUrl(endpoint, options.params);
  
  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  // 自动添加 Authorization Token（除非明确跳过）
  if (!options.skipAuth) {
    const token = getToken();
    if (token) {
      (fetchOptions.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  if (options.body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);

    // 处理 401 未授权错误
    if (response.status === 401) {
      clearToken();
      // 可以在这里触发跳转到登录页面
      console.error("Unauthorized: Token may be invalid or expired");
      throw new Error("Authentication required. Please log in again.");
    }

    // 处理 HTTP 错误
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    // 解析响应
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
};

// ==================== 仪表板 API ====================

/**
 * 获取仪表板统计数据
 * GET /dashboard/stats
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await apiCall<ApiResponse<DashboardStats>>(
      "GET",
      "/dashboard/stats"
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || "Failed to fetch dashboard stats");
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    // 返回默认数据作为备用
    return {
      totalStudents: 12345,
      totalCourses: 2,
      assignmentCompletionRate: 94,
      taskAccuracy: 70,
    };
  }
};

/**
 * 获取最近活动记录
 * GET /activities/recent?limit=8
 */
export const getRecentActivities = async (limit: number = 8): Promise<Activity[]> => {
  try {
    const response = await apiCall<ApiResponse<Activity[]>>("GET", "/activities/recent", {
      params: { limit },
    });

    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }

    throw new Error(response.error || "Failed to fetch activities");
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return []; // 返回空数组，使用默认数据
  }
};

// ==================== 学生 API ====================

/**
 * 学生数据接口
 */
export interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses: string[];
  createdAt?: string;
}

/**
 * 获取所有学生
 * GET /students
 */
export const getStudents = async (params?: PaginationParams): Promise<Student[]> => {
  try {
    const response = await apiCall<ApiResponse<Student[]>>("GET", "/students", {
      params,
    });

    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }

    throw new Error(response.error || "Failed to fetch students");
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
};

/**
 * 获取单个学生信息
 * GET /students/:id
 */
export const getStudent = async (studentId: string): Promise<Student | null> => {
  try {
    const response = await apiCall<ApiResponse<Student>>(
      "GET",
      `/students/${studentId}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching student ${studentId}:`, error);
    return null;
  }
};

/**
 * 创建学生
 * POST /students
 */
export const createStudent = async (data: Omit<Student, "id">): Promise<Student | null> => {
  try {
    const response = await apiCall<ApiResponse<Student>>("POST", "/students", {
      body: data,
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || "Failed to create student");
  } catch (error) {
    console.error("Error creating student:", error);
    return null;
  }
};

/**
 * 更新学生信息
 * PUT /students/:id
 */
export const updateStudent = async (
  studentId: string,
  data: Partial<Omit<Student, "id">>
): Promise<Student | null> => {
  try {
    const response = await apiCall<ApiResponse<Student>>(
      "PUT",
      `/students/${studentId}`,
      { body: data as Record<string, any> }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || "Failed to update student");
  } catch (error) {
    console.error(`Error updating student ${studentId}:`, error);
    return null;
  }
};

/**
 * 删除学生
 * DELETE /students/:id
 */
export const deleteStudent = async (studentId: string): Promise<boolean> => {
  try {
    const response = await apiCall<ApiResponse<null>>(
      "DELETE",
      `/students/${studentId}`
    );

    return response.success;
  } catch (error) {
    console.error(`Error deleting student ${studentId}:`, error);
    return false;
  }
};

// ==================== 课程 API ====================

/**
 * 课程数据接口
 */
export interface Course {
  id: string;
  code: string;
  title: string;
  status: "Open" | "Closed";
  schedule: string;
  students: string;
  time?: string;
  capacity?: string;
  description?: string;
  createdAt?: string;
}

/**
 * 获取所有课程
 * GET /courses
 */
export const getCourses = async (params?: PaginationParams): Promise<Course[]> => {
  try {
    const response = await apiCall<ApiResponse<Course[]>>("GET", "/courses", {
      params,
    });

    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }

    throw new Error(response.error || "Failed to fetch courses");
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
};

/**
 * 获取单个课程信息
 * GET /courses/:id
 */
export const getCourse = async (courseId: string): Promise<Course | null> => {
  try {
    const response = await apiCall<ApiResponse<Course>>(
      "GET",
      `/courses/${courseId}`
    );

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching course ${courseId}:`, error);
    return null;
  }
};

/**
 * 创建课程
 * POST /courses
 */
export const createCourse = async (data: Omit<Course, "id">): Promise<Course | null> => {
  try {
    const response = await apiCall<ApiResponse<Course>>("POST", "/courses", {
      body: data,
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || "Failed to create course");
  } catch (error) {
    console.error("Error creating course:", error);
    return null;
  }
};

/**
 * 更新课程信息
 * PUT /courses/:id
 */
export const updateCourse = async (
  courseId: string,
  data: Partial<Omit<Course, "id">>
): Promise<Course | null> => {
  try {
    const response = await apiCall<ApiResponse<Course>>(
      "PUT",
      `/courses/${courseId}`,
      { body: data as Record<string, any> }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || "Failed to update course");
  } catch (error) {
    console.error(`Error updating course ${courseId}:`, error);
    return null;
  }
};

/**
 * 删除课程
 * DELETE /courses/:id
 */
export const deleteCourse = async (courseId: string): Promise<boolean> => {
  try {
    const response = await apiCall<ApiResponse<null>>(
      "DELETE",
      `/courses/${courseId}`
    );

    return response.success;
  } catch (error) {
    console.error(`Error deleting course ${courseId}:`, error);
    return false;
  }
};

/**
 * 搜索课程
 * GET /courses/search?q=query
 */
export const searchCourses = async (query: string): Promise<Course[]> => {
  try {
    const response = await apiCall<ApiResponse<Course[]>>(
      "GET",
      "/courses/search",
      { params: { q: query } }
    );

    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  } catch (error) {
    console.error("Error searching courses:", error);
    return [];
  }
};

// ==================== 活动 API ====================

/**
 * 获取所有活动
 * GET /activities
 */
export const getActivities = async (params?: PaginationParams): Promise<Activity[]> => {
  try {
    const response = await apiCall<ApiResponse<Activity[]>>("GET", "/activities", {
      params,
    });

    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }

    throw new Error(response.error || "Failed to fetch activities");
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
};

/**
 * 创建活动记录
 * POST /activities
 */
export const createActivity = async (
  data: Omit<Activity, "id">
): Promise<Activity | null> => {
  try {
    const response = await apiCall<ApiResponse<Activity>>("POST", "/activities", {
      body: data,
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || "Failed to create activity");
  } catch (error) {
    console.error("Error creating activity:", error);
    return null;
  }
};

// ==================== 用户 API ====================

/**
 * 获取当前用户信息
 * GET /api/user/profile
 * 前端接口已预留，等待后端实现
 */
export const getUserProfile = async (): Promise<UserInfo> => {
  // 暂时返回默认数据，等待后端接口实现
  // TODO: 后端实现后取消注释下面的代码
  /*
  try {
    const response = await apiCall<ApiResponse<UserInfo>>("GET", "/user/profile");

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error || "Failed to fetch user profile");
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
  */
  
  // 返回默认用户数据
  return {
    id: "user_123",
    name: "Guest User",
    email: "guest@example.com",
    role: "teacher",
  };
};

/**
 * 用户登出
 * POST /api/user/logout
 * 前端接口已预留，等待后端实现
 */
export const userLogout = async (): Promise<boolean> => {
  // 暂时直接返回成功，等待后端接口实现
  // TODO: 后端实现后取消注释下面的代码
  /*
  try {
    const response = await apiCall<ApiResponse<null>>("POST", "/user/logout");
    return response.success;
  } catch (error) {
    console.error("Error logging out:", error);
    return false;
  }
  */
  
  return true;
};
// ==================== 导出所有公共接口 ====================

export default {
  // Dashboard
  getDashboardStats,
  getRecentActivities,

  // Students
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,

  // Courses
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  searchCourses,

  // Activities
  getActivities,
  createActivity,
  // User
  getUserProfile,
  userLogout,
};
