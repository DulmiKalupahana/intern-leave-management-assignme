package com.example.leave.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RejectLeaveRequest {
    public static final int MAX_REASON_LENGTH = 500;

    @NotBlank(message = "Rejection reason is required")
    @Size(max = MAX_REASON_LENGTH, message = "Rejection reason must not exceed 500 characters")
    private String rejectionReason;

    public RejectLeaveRequest() {
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}
