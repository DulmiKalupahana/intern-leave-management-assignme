package com.example.leave.service;

import com.example.leave.dto.LeaveRequestCreateRequest;
import com.example.leave.dto.LeaveRequestResponse;
import com.example.leave.entity.Employee;
import com.example.leave.entity.LeaveRequest;
import com.example.leave.entity.LeaveStatus;
import com.example.leave.entity.LeaveType;
import com.example.leave.exception.InvalidDateRangeException;
import com.example.leave.exception.InvalidRejectionReasonException;
import com.example.leave.exception.InvalidStatusTransitionException;
import com.example.leave.exception.OverlappingLeaveException;
import com.example.leave.exception.ResourceNotFoundException;
import com.example.leave.repository.EmployeeRepository;
import com.example.leave.repository.LeaveRequestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaveRequestServiceTest {

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private LeaveRequestService leaveRequestService;

    @Test
    void createLeaveRequest_validRequest_savedWithPendingStatus() {
        LeaveRequestCreateRequest request = new LeaveRequestCreateRequest();
        request.setEmployeeId(1L);
        request.setLeaveType(LeaveType.ANNUAL);
        request.setStartDate(LocalDate.of(2026, 10, 1));
        request.setEndDate(LocalDate.of(2026, 10, 5));
        request.setReason("Vacation");

        Employee employee = new Employee(1L, "John Doe", "john@example.com", "IT", LocalDateTime.now());
        LeaveRequest saved = new LeaveRequest();
        saved.setId(10L);
        saved.setEmployee(employee);
        saved.setLeaveType(LeaveType.ANNUAL);
        saved.setStartDate(LocalDate.of(2026, 10, 1));
        saved.setEndDate(LocalDate.of(2026, 10, 5));
        saved.setReason("Vacation");
        saved.setStatus(LeaveStatus.PENDING);
        saved.setCreatedAt(LocalDateTime.now());

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(leaveRequestRepository.existsOverlap(eq(1L), any(), any(), any())).thenReturn(false);
        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenReturn(saved);

        LeaveRequestResponse response = leaveRequestService.createLeaveRequest(request);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals(1L, response.getEmployeeId());
        assertEquals("John Doe", response.getEmployeeName());
        assertEquals(LeaveStatus.PENDING, response.getStatus());
        verify(leaveRequestRepository, times(1)).save(any(LeaveRequest.class));
    }

    @Test
    void createLeaveRequest_endDateBeforeStartDate_throwsInvalidDateRangeException() {
        LeaveRequestCreateRequest request = new LeaveRequestCreateRequest();
        request.setEmployeeId(1L);
        request.setLeaveType(LeaveType.ANNUAL);
        request.setStartDate(LocalDate.of(2026, 10, 5));
        request.setEndDate(LocalDate.of(2026, 10, 1));
        request.setReason("Vacation");

        Employee employee = new Employee(1L, "John Doe", "john@example.com", "IT", LocalDateTime.now());
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        assertThrows(InvalidDateRangeException.class, () -> leaveRequestService.createLeaveRequest(request));
        verify(leaveRequestRepository, never()).save(any(LeaveRequest.class));
    }

    @Test
    void createLeaveRequest_employeeNotFound_throwsResourceNotFoundException() {
        LeaveRequestCreateRequest request = new LeaveRequestCreateRequest();
        request.setEmployeeId(99L);
        request.setLeaveType(LeaveType.ANNUAL);
        request.setStartDate(LocalDate.of(2026, 10, 1));
        request.setEndDate(LocalDate.of(2026, 10, 5));
        request.setReason("Vacation");

        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> leaveRequestService.createLeaveRequest(request));
        verify(leaveRequestRepository, never()).save(any(LeaveRequest.class));
    }

    @Test
    void createLeaveRequest_overlappingLeave_throwsOverlappingLeaveException() {
        LeaveRequestCreateRequest request = new LeaveRequestCreateRequest();
        request.setEmployeeId(1L);
        request.setLeaveType(LeaveType.ANNUAL);
        request.setStartDate(LocalDate.of(2026, 10, 1));
        request.setEndDate(LocalDate.of(2026, 10, 5));
        request.setReason("Vacation");

        Employee employee = new Employee(1L, "John Doe", "john@example.com", "IT", LocalDateTime.now());
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(leaveRequestRepository.existsOverlap(eq(1L), any(), any(), any())).thenReturn(true);

        assertThrows(OverlappingLeaveException.class, () -> leaveRequestService.createLeaveRequest(request));
        verify(leaveRequestRepository, never()).save(any(LeaveRequest.class));
    }

    @Test
    void createLeaveRequest_singleDayLeave_allowed() {
        LeaveRequestCreateRequest request = new LeaveRequestCreateRequest();
        request.setEmployeeId(1L);
        request.setLeaveType(LeaveType.CASUAL);
        request.setStartDate(LocalDate.of(2026, 10, 1));
        request.setEndDate(LocalDate.of(2026, 10, 1));
        request.setReason("Personal");

        Employee employee = new Employee(1L, "John Doe", "john@example.com", "IT", LocalDateTime.now());
        LeaveRequest saved = new LeaveRequest();
        saved.setId(5L);
        saved.setEmployee(employee);
        saved.setLeaveType(LeaveType.CASUAL);
        saved.setStartDate(LocalDate.of(2026, 10, 1));
        saved.setEndDate(LocalDate.of(2026, 10, 1));
        saved.setReason("Personal");
        saved.setStatus(LeaveStatus.PENDING);
        saved.setCreatedAt(LocalDateTime.now());

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(leaveRequestRepository.existsOverlap(eq(1L), any(), any(), any())).thenReturn(false);
        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenReturn(saved);

        LeaveRequestResponse response = leaveRequestService.createLeaveRequest(request);
        assertNotNull(response);
        assertEquals(LeaveStatus.PENDING, response.getStatus());
    }

    @Test
    void getAllLeaveRequests_returnsList() {
        Employee employee = new Employee(1L, "John Doe", "john@example.com", "IT", LocalDateTime.now());
        LeaveRequest lr1 = new LeaveRequest();
        lr1.setId(1L);
        lr1.setEmployee(employee);
        lr1.setLeaveType(LeaveType.ANNUAL);
        lr1.setStartDate(LocalDate.of(2026, 10, 1));
        lr1.setEndDate(LocalDate.of(2026, 10, 5));
        lr1.setReason("Vacation");
        lr1.setStatus(LeaveStatus.PENDING);
        lr1.setCreatedAt(LocalDateTime.now());

        when(leaveRequestRepository.findAllByOrderByCreatedAtDesc()).thenReturn(Arrays.asList(lr1));

        List<LeaveRequestResponse> responses = leaveRequestService.getAllLeaveRequests();
        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("John Doe", responses.get(0).getEmployeeName());
    }

    @Test
    void approveLeaveRequest_pending_setsApproved() {
        LeaveRequest leaveRequest = leaveRequestWithStatus(LeaveStatus.PENDING);
        when(leaveRequestRepository.findById(10L)).thenReturn(Optional.of(leaveRequest));
        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LeaveRequestResponse response = leaveRequestService.approveLeaveRequest(10L);

        assertEquals(LeaveStatus.APPROVED, response.getStatus());
        assertNull(response.getRejectionReason());
        verify(leaveRequestRepository, times(1)).save(leaveRequest);
    }

    @Test
    void approveLeaveRequest_alreadyApproved_throwsInvalidStatusTransitionException() {
        LeaveRequest leaveRequest = leaveRequestWithStatus(LeaveStatus.APPROVED);
        when(leaveRequestRepository.findById(10L)).thenReturn(Optional.of(leaveRequest));

        assertThrows(InvalidStatusTransitionException.class,
                () -> leaveRequestService.approveLeaveRequest(10L));
        verify(leaveRequestRepository, never()).save(any(LeaveRequest.class));
    }

    @Test
    void approveLeaveRequest_alreadyRejected_throwsInvalidStatusTransitionException() {
        LeaveRequest leaveRequest = leaveRequestWithStatus(LeaveStatus.REJECTED);
        when(leaveRequestRepository.findById(10L)).thenReturn(Optional.of(leaveRequest));

        assertThrows(InvalidStatusTransitionException.class,
                () -> leaveRequestService.approveLeaveRequest(10L));
        verify(leaveRequestRepository, never()).save(any(LeaveRequest.class));
    }

    @Test
    void rejectLeaveRequest_pending_savesRejectedWithReason() {
        LeaveRequest leaveRequest = leaveRequestWithStatus(LeaveStatus.PENDING);
        when(leaveRequestRepository.findById(10L)).thenReturn(Optional.of(leaveRequest));
        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LeaveRequestResponse response = leaveRequestService.rejectLeaveRequest(10L, "  Too busy  ");

        assertEquals(LeaveStatus.REJECTED, response.getStatus());
        assertEquals("Too busy", response.getRejectionReason());
        assertEquals("Too busy", leaveRequest.getRejectionReason());
        verify(leaveRequestRepository, times(1)).save(leaveRequest);
    }

    @Test
    void rejectLeaveRequest_blankReason_throwsInvalidRejectionReasonException() {
        LeaveRequest leaveRequest = leaveRequestWithStatus(LeaveStatus.PENDING);
        when(leaveRequestRepository.findById(10L)).thenReturn(Optional.of(leaveRequest));

        assertThrows(InvalidRejectionReasonException.class,
                () -> leaveRequestService.rejectLeaveRequest(10L, "   "));
        verify(leaveRequestRepository, never()).save(any(LeaveRequest.class));
    }

    @Test
    void rejectLeaveRequest_nullReason_throwsInvalidRejectionReasonException() {
        LeaveRequest leaveRequest = leaveRequestWithStatus(LeaveStatus.PENDING);
        when(leaveRequestRepository.findById(10L)).thenReturn(Optional.of(leaveRequest));

        assertThrows(InvalidRejectionReasonException.class,
                () -> leaveRequestService.rejectLeaveRequest(10L, null));
        verify(leaveRequestRepository, never()).save(any(LeaveRequest.class));
    }

    @Test
    void rejectLeaveRequest_alreadyApproved_throwsInvalidStatusTransitionException() {
        LeaveRequest leaveRequest = leaveRequestWithStatus(LeaveStatus.APPROVED);
        when(leaveRequestRepository.findById(10L)).thenReturn(Optional.of(leaveRequest));

        assertThrows(InvalidStatusTransitionException.class,
                () -> leaveRequestService.rejectLeaveRequest(10L, "Too busy"));
        verify(leaveRequestRepository, never()).save(any(LeaveRequest.class));
    }

    @Test
    void approveLeaveRequest_notFound_throwsResourceNotFoundException() {
        when(leaveRequestRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> leaveRequestService.approveLeaveRequest(99L));
        verify(leaveRequestRepository, never()).save(any(LeaveRequest.class));
    }

    @Test
    void rejectLeaveRequest_notFound_throwsResourceNotFoundException() {
        when(leaveRequestRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> leaveRequestService.rejectLeaveRequest(99L, "Too busy"));
        verify(leaveRequestRepository, never()).save(any(LeaveRequest.class));
    }

    @Test
    void rejectLeaveRequest_notFoundWithBlankReason_throwsResourceNotFoundExceptionFirst() {
        when(leaveRequestRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> leaveRequestService.rejectLeaveRequest(99L, " "));
        verify(leaveRequestRepository, never()).save(any(LeaveRequest.class));
    }

    private LeaveRequest leaveRequestWithStatus(LeaveStatus status) {
        Employee employee = new Employee(1L, "John Doe", "john@example.com", "IT", LocalDateTime.now());
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setId(10L);
        leaveRequest.setEmployee(employee);
        leaveRequest.setLeaveType(LeaveType.ANNUAL);
        leaveRequest.setStartDate(LocalDate.of(2026, 10, 1));
        leaveRequest.setEndDate(LocalDate.of(2026, 10, 5));
        leaveRequest.setReason("Vacation");
        leaveRequest.setStatus(status);
        leaveRequest.setCreatedAt(LocalDateTime.now());
        return leaveRequest;
    }
}
