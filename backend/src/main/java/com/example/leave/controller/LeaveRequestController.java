package com.example.leave.controller;

import com.example.leave.dto.LeaveRequestCreateRequest;
import com.example.leave.dto.LeaveRequestResponse;
import com.example.leave.dto.RejectLeaveRequest;
import com.example.leave.entity.Role;
import com.example.leave.security.AdminOnly;
import com.example.leave.security.AuthInterceptor;
import com.example.leave.security.AuthSession;
import com.example.leave.service.LeaveRequestService;
import jakarta.servlet.http.HttpServletRequest;
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
    public ResponseEntity<LeaveRequestResponse> createLeaveRequest(@Valid @RequestBody LeaveRequestCreateRequest request,
                                                                   HttpServletRequest httpRequest) {
        AuthSession session = currentSession(httpRequest);
        if (session != null && session.role() == Role.EMPLOYEE) {
            // Employees can only submit leave for themselves, whatever the body says.
            request.setEmployeeId(session.employeeId());
        }

        LeaveRequestResponse response = leaveRequestService.createLeaveRequest(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Administrators see every request; employees only ever see their own.
     */
    @GetMapping
    public ResponseEntity<List<LeaveRequestResponse>> getAllLeaveRequests(HttpServletRequest httpRequest) {
        AuthSession session = currentSession(httpRequest);

        if (session != null && session.role() == Role.EMPLOYEE) {
            return new ResponseEntity<>(
                    leaveRequestService.getLeaveRequestsForEmployee(session.employeeId()),
                    HttpStatus.OK);
        }

        return new ResponseEntity<>(leaveRequestService.getAllLeaveRequests(), HttpStatus.OK);
    }

    @AdminOnly
    @PatchMapping("/{id}/approve")
    public ResponseEntity<LeaveRequestResponse> approveLeaveRequest(@PathVariable Long id) {
        LeaveRequestResponse response = leaveRequestService.approveLeaveRequest(id);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @AdminOnly
    @PatchMapping("/{id}/reject")
    public ResponseEntity<LeaveRequestResponse> rejectLeaveRequest(@PathVariable Long id,
                                                                   @Valid @RequestBody RejectLeaveRequest request) {
        LeaveRequestResponse response = leaveRequestService.rejectLeaveRequest(id, request.getRejectionReason());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    private AuthSession currentSession(HttpServletRequest request) {
        return (AuthSession) request.getAttribute(AuthInterceptor.SESSION_ATTRIBUTE);
    }
}
