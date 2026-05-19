'use server';

import { revalidatePath } from 'next/cache';
import { apiClient } from '@/lib/api-client';

export async function getSystemSettings() {
  try {
    const response = await apiClient.get<any>('/api/admin/system/settings');
    console.log('System Settings: ', response);
    return response;
  } catch (error) {
    console.error('Failed to fetch system settings:', error);
    throw error;
  }
}

export async function updateSystemSettings(settings: any) {
  try {
    const response = await apiClient.put<any>(
      '/api/admin/system/settings',
      settings,
    );
    revalidatePath('/system/settings');
    revalidatePath('/dashboard');
    return response;
  } catch (error) {
    console.error('Failed to update system settings:', error);
    throw error;
  }
}

export async function getFeeConfiguration() {
  try {
    return await apiClient.get<any>('/api/admin/system/fees');
  } catch (error) {
    console.error('Failed to fetch fee configuration:', error);
    throw error;
  }
}
