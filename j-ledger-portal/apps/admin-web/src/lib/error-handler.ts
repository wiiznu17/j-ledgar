import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { showError } from '@/lib/swal';

export function getErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred'): string {
  if (isRedirectError(error)) {
    throw error;
  }

  if (error instanceof ApiError) {
    return error.message || fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallbackMessage;
}

export function toastApiError(error: unknown, fallbackMessage = 'An unexpected error occurred') {
  if (isRedirectError(error)) {
    throw error;
  }

  if (error instanceof ApiError) {
    if (error.code === 'SYSTEM_VALIDATION_ERROR' && Array.isArray(error.details)) {
      // Display each validation error in individual toast alerts for clear UX
      error.details.forEach((detail: string) => {
        toast.error(detail);
      });
      return;
    }
    toast.error(error.message || fallbackMessage);
    return;
  }

  const message = getErrorMessage(error, fallbackMessage);
  toast.error(message);
}

export function showSwalApiError(error: unknown, fallbackMessage = 'An unexpected error occurred') {
  if (isRedirectError(error)) {
    throw error;
  }

  let title = 'Error';
  let text = fallbackMessage;

  if (error instanceof ApiError) {
    title = String(error.code || 'API Error');
    if (error.code === 'SYSTEM_VALIDATION_ERROR' && Array.isArray(error.details)) {
      text = error.details.join('\n');
    } else {
      text = error.message || fallbackMessage;
    }
  } else {
    text = getErrorMessage(error, fallbackMessage);
  }

  showError(title, text);
}
