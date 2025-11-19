/**
 * 活动服务
 * 处理活动相关的 API 调用和数据管理
 */

import { API_BASE_URL, ApiResponse } from "./api";

// ==================== 类型定义 ====================

/**
 * 活动数据接口
 */
export interface ActivityData {
  id: string;
  title: string;
  activityType: string;
  thumbnail?: string;
  edited: number | string;
  [key: string]: any;
}

// ==================== API 调用 ====================

/**
 * 获取所有活动
 * GET /activities
 */
export const getActivities = async (): Promise<ApiResponse<ActivityData[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/activities`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error("Error fetching activities:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch activities",
    };
  }
};

/**
 * 获取单个活动
 * GET /activities/:id
 */
export const getActivity = async (activityId: string): Promise<ApiResponse<ActivityData>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/activities/${activityId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error(`Error fetching activity ${activityId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch activity",
    };
  }
};

/**
 * 创建活动
 * POST /activities
 */
export const createActivity = async (
  activityData: Omit<ActivityData, "id">
): Promise<ApiResponse<ActivityData>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(activityData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error("Error creating activity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create activity",
    };
  }
};

/**
 * 更新活动
 * PUT /activities/:id
 */
export const updateActivity = async (
  activityId: string,
  activityData: Partial<ActivityData>
): Promise<ApiResponse<ActivityData>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(activityData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error(`Error updating activity ${activityId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update activity",
    };
  }
};

/**
 * 删除活动
 * DELETE /activities/:id
 */
export const deleteActivity = async (activityId: string): Promise<ApiResponse<null>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/activities/${activityId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error(`Error deleting activity ${activityId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete activity",
    };
  }
};

// ==================== 导出 ====================

export default {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
};
