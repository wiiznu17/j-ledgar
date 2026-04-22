import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';

/**
 * Ledger API Client
 * Communicates with j-ledger-core for double-entry ledger operations
 *
 * Features:
 * - HTTP client for P2P transfer execution
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern (failure threshold)
 * - Distributed tracing (trace ID)
 * - Comprehensive error handling
 */
@Injectable()
export class LedgerClient {
  private readonly logger = new Logger(LedgerClient.name);
  private readonly ledgerApiUrl: string;
  private readonly maxRetries = 3;
  private readonly baseBackoffMs = 500;
  private circuitBreakerOpen = false;
  private failureCount = 0;
  private readonly failureThreshold = 5;
  private readonly circuitBreakerResetMs = 60000; // 1 minute

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.ledgerApiUrl = this.configService.get('LEDGER_API_URL', 'http://j-ledger-core:8080');
  }

  /**
   * Execute P2P transfer via j-ledger-core
   * Implements retry logic with exponential backoff
   *
   * @param idempotencyKey - Unique key to prevent duplicate transfers
   * @param fromAccountId - Source account UUID
   * @param toAccountId - Destination account UUID
   * @param amount - Transfer amount in satoshi (100 = 1 THB)
   * @param traceId - Distributed tracing ID
   * @returns Transfer response with ledger transaction ID
   * @throws InternalServerErrorException on all failures after retries
   */
  async executeP2pTransfer(
    idempotencyKey: string,
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    traceId: string,
  ): Promise<P2pTransferResponse> {
    if (this.circuitBreakerOpen) {
      throw new InternalServerErrorException(
        'Ledger service temporarily unavailable. Please try again later.',
      );
    }

    const request: P2pTransferRequest = {
      idempotencyKey,
      fromAccountId,
      toAccountId,
      amount,
      currency: 'THB',
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.debug(`P2P transfer attempt ${attempt}/${this.maxRetries}: ${idempotencyKey}`, {
          traceId,
          fromAccountId,
          toAccountId,
          amount,
        });

        const response: AxiosResponse<P2pTransferResponse> = await firstValueFrom(
          (this.httpService.post<P2pTransferResponse>(
            `${this.ledgerApiUrl}/api/v1/transactions/p2p-transfer`,
            request,
            {
              headers: {
                'X-Idempotency-Key': idempotencyKey,
                'X-Trace-ID': traceId,
                'Content-Type': 'application/json',
              },
              timeout: 10000, // 10 second timeout
            },
          ) as any),
        );

        // Reset circuit breaker on success
        this.failureCount = 0;
        this.circuitBreakerOpen = false;

        this.logger.debug(`P2P transfer successful: ${idempotencyKey}`, {
          traceId,
          transactionId: response.data.id,
        });

        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<any>;
        const statusCode = axiosError.response?.status;
        const errorData = axiosError.response?.data as any;

        this.logger.warn(
          `P2P transfer attempt ${attempt} failed (status: ${statusCode}): ${idempotencyKey}`,
          {
            traceId,
            error: errorData?.message || axiosError.message,
            attempt,
          },
        );

        // 4xx errors (except 408, 429) are not retryable
        if (statusCode && statusCode >= 400 && statusCode < 500) {
          if (statusCode !== 408 && statusCode !== 429) {
            throw this.mapLedgerError(axiosError, idempotencyKey, traceId);
          }
        }

        // Last attempt failed
        if (attempt === this.maxRetries) {
          this.failureCount++;
          if (this.failureCount >= this.failureThreshold) {
            this.circuitBreakerOpen = true;
            this.logger.error(`Circuit breaker opened for ledger service`, {
              traceId,
              failureCount: this.failureCount,
            });
            // Reset circuit breaker after 1 minute
            setTimeout(() => {
              this.failureCount = 0;
              this.circuitBreakerOpen = false;
              this.logger.log('Circuit breaker reset for ledger service');
            }, this.circuitBreakerResetMs);
          }

          throw this.mapLedgerError(axiosError, idempotencyKey, traceId);
        }

        // Exponential backoff
        const backoffMs = this.baseBackoffMs * Math.pow(2, attempt - 1);
        await this.sleep(backoffMs);
      }
    }

    // This should never be reached due to the throw in the loop
    throw new InternalServerErrorException('Unexpected error during P2P transfer');
  }

  /**
   * Get transfer status from ledger
   * @param transactionId - Transaction ID from ledger
   * @param traceId - Distributed tracing ID
   * @returns Transfer status and details
   */
  async getTransferStatus(transactionId: string, traceId: string): Promise<TransferStatusResponse> {
    try {
      const response: AxiosResponse<TransferStatusResponse> = await firstValueFrom(
        (this.httpService.get<TransferStatusResponse>(
          `${this.ledgerApiUrl}/api/v1/transactions/${transactionId}`,
          {
            headers: {
              'X-Trace-ID': traceId,
            },
            timeout: 5000,
          },
        ) as any),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get transfer status: ${transactionId}`, {
        traceId,
        error: (error as Error).message,
      });

      throw new InternalServerErrorException('Failed to retrieve transfer status');
    }
  }

  /**
   * Health check for ledger service
   * @returns Health status
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response: AxiosResponse<HealthCheckResponse> = await firstValueFrom(
        (this.httpService.get<HealthCheckResponse>(`${this.ledgerApiUrl}/api/v1/health`, {
          timeout: 5000,
        }) as any),
      );

      return response.data;
    } catch (error) {
      return {
        status: 'DOWN',
        message: 'Ledger service is unavailable',
      };
    }
  }

  /**
   * Map ledger API errors to application errors
   * @private
   */
  private mapLedgerError(error: AxiosError<any>, idempotencyKey: string, traceId: string): Error {
    const statusCode = error.response?.status;
    const errorData = error.response?.data as any;

    this.logger.error(`Ledger API error: ${statusCode}`, {
      traceId,
      idempotencyKey,
      message: errorData?.message,
      code: errorData?.code,
    });

    // Map specific error codes
    const errorCode = errorData?.code;
    switch (errorCode) {
      case 'INSUFFICIENT_FUNDS':
        return new InternalServerErrorException({
          code: 'INSUFFICIENT_FUNDS',
          message: 'Insufficient balance for transfer',
        });

      case 'ACCOUNT_NOT_FOUND':
        return new InternalServerErrorException({
          code: 'INVALID_RECIPIENT',
          message: 'Recipient account not found',
        });

      case 'CONCURRENT_MODIFICATION':
        return new InternalServerErrorException({
          code: 'CONCURRENT_TRANSFER',
          message: 'Transfer in progress. Please try again in a few moments.',
        });

      case 'DUPLICATE_TRANSFER':
        // This is expected for idempotency - return success
        return new InternalServerErrorException({
          code: 'DUPLICATE_TRANSFER',
          message: 'Duplicate transfer detected (idempotency)',
        });

      default:
        return new InternalServerErrorException({
          code: 'LEDGER_ERROR',
          message: errorData?.message || 'Ledger service error',
          details: statusCode === 500 ? undefined : errorData,
        });
    }
  }

  /**
   * Sleep utility for backoff
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// DTO Interfaces

export interface P2pTransferRequest {
  idempotencyKey: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
}

export interface P2pTransferResponse {
  id: string; // Transaction ID
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  idempotencyKey: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  ledgerEntries: LedgerEntry[];
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  createdAt: string;
}

export interface TransferStatusResponse {
  id: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  amount: number;
  currency: string;
  fromAccountId: string;
  toAccountId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheckResponse {
  status: 'UP' | 'DOWN';
  message?: string;
}
