package com.jledger.finance.exception;

public class ConcurrentOperationException extends RuntimeException {

    public ConcurrentOperationException(String message) {
        super(message);
    }

    public ConcurrentOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
