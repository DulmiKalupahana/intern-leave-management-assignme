package com.example.leave.exception;

public class OverlappingLeaveException extends RuntimeException {
    public OverlappingLeaveException(String message) {
        super(message);
    }
}
