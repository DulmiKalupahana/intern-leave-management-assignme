package com.example.leave.exception;

import com.example.leave.entity.LeaveStatus;

public class InvalidStatusTransitionException extends RuntimeException {

    public InvalidStatusTransitionException(String message) {
        super(message);
    }

    public InvalidStatusTransitionException(LeaveStatus currentStatus) {
        super("Only PENDING requests can be approved or rejected. Current status: " + currentStatus);
    }
}
