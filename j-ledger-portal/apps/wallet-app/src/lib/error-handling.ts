/**
 * Error handling and recovery utilities
 */

export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'INVALID_QR'
  | 'INVALID_RECIPIENT'
  | 'INVALID_AMOUNT'
  | 'BIOMETRIC_FAILED'
  | 'PIN_FAILED'
  | 'TRANSFER_FAILED'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface TransferError {
  code: ErrorCode;
  message: string;
  details?: string;
  recoveryAction?: 'RETRY' | 'EDIT' | 'FALLBACK' | 'CANCEL';
}

export interface TransactionLog {
  id: string;
  timestamp: number;
  type: 'QR_SCAN' | 'QR_VALIDATION' | 'BIOMETRIC_AUTH' | 'PIN_AUTH' | 'TRANSFER';
  status: 'SUCCESS' | 'FAILURE';
  recipient?: string;
  amount?: string;
  error?: TransferError;
  userId?: string;
  details?: Record<string, any>;
}

// In-memory transaction logs
let transactionLogs: TransactionLog[] = [];

/**
 * Log transaction event for audit trail
 */
export const logTransaction = (log: TransactionLog): void => {
  // Add unique ID if not provided
  const entry = {
    ...log,
    id: log.id || `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  // Keep last 500 logs
  transactionLogs = [entry, ...transactionLogs].slice(0, 500);
  console.log('[Transaction Log]', entry);
};

/**
 * Get transaction logs
 */
export const getTransactionLogs = (): TransactionLog[] => {
  return transactionLogs;
};

/**
 * Clear transaction logs
 */
export const clearTransactionLogs = (): void => {
  transactionLogs = [];
};

/**
 * Map error codes to user-friendly messages and recovery actions
 */
export const getErrorInfo = (
  error: TransferError,
): {
  title: string;
  message: string;
  actionLabel: string;
} => {
  const errorMap: Record<ErrorCode, { title: string; message: string; actionLabel: string }> = {
    NETWORK_ERROR: {
      title: 'Connection Problem',
      message:
        'Unable to connect to the server. Please check your internet connection and try again.',
      actionLabel: 'Retry',
    },
    INVALID_QR: {
      title: 'Invalid QR Code',
      message:
        'This QR code could not be read. Please try scanning another code or enter the recipient manually.',
      actionLabel: 'Back to Scan',
    },
    INVALID_RECIPIENT: {
      title: 'Invalid Recipient',
      message:
        'The recipient information from the QR code is invalid. Please verify and try again.',
      actionLabel: 'Edit Recipient',
    },
    INVALID_AMOUNT: {
      title: 'Invalid Amount',
      message: 'The amount specified is invalid. Please enter a valid amount and try again.',
      actionLabel: 'Edit Amount',
    },
    BIOMETRIC_FAILED: {
      title: 'Authentication Failed',
      message: 'Biometric authentication failed. Please try again or use PIN instead.',
      actionLabel: 'Try Again',
    },
    PIN_FAILED: {
      title: 'Invalid PIN',
      message: 'The PIN you entered is incorrect. Please try again.',
      actionLabel: 'Try Again',
    },
    TRANSFER_FAILED: {
      title: 'Transfer Failed',
      message: 'The transfer could not be completed. Please verify the details and try again.',
      actionLabel: 'Retry Transfer',
    },
    SERVER_ERROR: {
      title: 'Server Error',
      message: 'The server encountered an error. Please try again in a few moments.',
      actionLabel: 'Retry',
    },
    TIMEOUT: {
      title: 'Request Timeout',
      message: 'The request took too long. Please check your connection and try again.',
      actionLabel: 'Retry',
    },
    UNKNOWN: {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred. Please try again.',
      actionLabel: 'Try Again',
    },
  };

  return errorMap[error.code] || errorMap.UNKNOWN;
};

/**
 * Determine recovery path based on error
 */
export const getRecoveryPath = (error: TransferError): 'back' | 'edit' | 'retry' | 'home' => {
  switch (error.code) {
    case 'INVALID_QR':
    case 'INVALID_RECIPIENT':
      return 'back';
    case 'INVALID_AMOUNT':
      return 'edit';
    case 'BIOMETRIC_FAILED':
    case 'PIN_FAILED':
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
    case 'TRANSFER_FAILED':
      return 'retry';
    default:
      return 'home';
  }
};

/**
 * Parse backend error response
 */
export const parseBackendError = (error: any): TransferError => {
  if (!error) {
    return {
      code: 'UNKNOWN',
      message: 'An unexpected error occurred',
    };
  }

  // Handle axios error response
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 400) {
      return {
        code: 'INVALID_QR',
        message: data.message || 'Invalid request',
        details: data.details,
      };
    } else if (status === 401) {
      return {
        code: 'BIOMETRIC_FAILED',
        message: 'Authentication required',
      };
    } else if (status === 404) {
      return {
        code: 'INVALID_RECIPIENT',
        message: 'Recipient not found',
      };
    } else if (status === 422) {
      return {
        code: 'INVALID_AMOUNT',
        message: 'Invalid transfer amount',
        details: data.message,
      };
    } else if (status >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: 'Server error. Please try again later.',
      };
    }
  }

  // Handle timeout
  if (error.code === 'ECONNABORTED') {
    return {
      code: 'TIMEOUT',
      message: 'Request timeout. Please try again.',
    };
  }

  // Handle network error
  if (error.message === 'Network Error' || !error.response) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network connection error. Please check your connection.',
    };
  }

  return {
    code: 'UNKNOWN',
    message: error.message || 'An unexpected error occurred',
  };
};
