package com.example.leave.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RejectLeaveRequest {
    @NotBlank(message = "Rejection reason is required")
    @Size(max = 500, message = "Rejection reason must not exceed 500 characters")
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
