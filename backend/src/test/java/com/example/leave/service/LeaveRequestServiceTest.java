package com.example.leave.service;

import com.example.leave.dto.LeaveRequestCreateRequest;
import com.example.leave.dto.LeaveRequestResponse;
import com.example.leave.entity.Employee;
import com.example.leave.entity.LeaveRequest;
import com.example.leave.entity.LeaveStatus;
import com.example.leave.entity.LeaveType;
import com.example.leave.exception.InvalidDateRangeException;
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
}
