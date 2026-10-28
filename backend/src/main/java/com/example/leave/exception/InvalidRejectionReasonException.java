package com.example.leave.exception;

public class InvalidRejectionReasonException extends IllegalArgumentException {

    public InvalidRejectionReasonException(String message) {
        super(message);
    }
}
