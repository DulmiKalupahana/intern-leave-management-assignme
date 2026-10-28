package com.example.leave.controller;

import com.example.leave.dto.LeaveRequestCreateRequest;
import com.example.leave.dto.LeaveRequestResponse;
import com.example.leave.service.LeaveRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
public class LeaveRequestController {
    private final LeaveRequestService leaveRequestService;

    public LeaveRequestController(LeaveRequestService leaveRequestService) {
        this.leaveRequestService = leaveRequestService;
    }

    @PostMapping
    public ResponseEntity<LeaveRequestResponse> createLeaveRequest(@Valid @RequestBody LeaveRequestCreateRequest request) {
        LeaveRequestResponse response = leaveRequestService.createLeaveRequest(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<LeaveRequestResponse>> getAllLeaveRequests() {
        List<LeaveRequestResponse> responses = leaveRequestService.getAllLeaveRequests();
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }
}
