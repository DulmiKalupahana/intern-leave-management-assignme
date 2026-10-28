package com.example.leave.controller;

import com.example.leave.entity.Employee;
import com.example.leave.entity.LeaveRequest;
import com.example.leave.entity.LeaveStatus;
import com.example.leave.entity.LeaveType;
import com.example.leave.repository.EmployeeRepository;
import com.example.leave.repository.LeaveRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AdminApprovalControllerTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    private MockMvc mockMvc;
    private LeaveRequest leaveRequest;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        leaveRequestRepository.deleteAll();
        employeeRepository.deleteAll();

        Employee employee = new Employee();
        employee.setName("John Doe");
        employee.setEmail("john@example.com");
        employee.setDepartment("IT");
        employee = employeeRepository.save(employee);

        LeaveRequest request = new LeaveRequest();
        request.setEmployee(employee);
        request.setLeaveType(LeaveType.ANNUAL);
        request.setStartDate(LocalDate.of(2026, 10, 1));
        request.setEndDate(LocalDate.of(2026, 10, 5));
        request.setReason("Vacation");
        request.setStatus(LeaveStatus.PENDING);
        leaveRequest = leaveRequestRepository.save(request);
    }

    @Test
    void approveLeaveRequest_pending_returns200WithApprovedStatus() throws Exception {
        mockMvc.perform(patch("/api/leaves/{id}/approve", leaveRequest.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(leaveRequest.getId().intValue())))
                .andExpect(jsonPath("$.status", is("APPROVED")))
                .andExpect(jsonPath("$.employeeName", is("John Doe")))
                .andExpect(jsonPath("$.rejectionReason").doesNotExist());
    }

    @Test
    void approveLeaveRequest_alreadyApproved_returns409() throws Exception {
        mockMvc.perform(patch("/api/leaves/{id}/approve", leaveRequest.getId()))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/leaves/{id}/approve", leaveRequest.getId()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", is("Conflict")))
                .andExpect(jsonPath("$.status", is(409)));
    }

    @Test
    void rejectLeaveRequest_withReason_returns200WithRejectedStatusAndReason() throws Exception {
        mockMvc.perform(patch("/api/leaves/{id}/reject", leaveRequest.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rejectionReason\":\"Too busy\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("REJECTED")))
                .andExpect(jsonPath("$.rejectionReason", is("Too busy")));
    }

    @Test
    void rejectLeaveRequest_blankReason_returns400WithFieldError() throws Exception {
        mockMvc.perform(patch("/api/leaves/{id}/reject", leaveRequest.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rejectionReason\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.rejectionReason").exists());
    }

    @Test
    void rejectLeaveRequest_noBody_returns400() throws Exception {
        mockMvc.perform(patch("/api/leaves/{id}/reject", leaveRequest.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.rejectionReason").exists());
    }

    @Test
    void rejectLeaveRequest_afterApprove_returns409() throws Exception {
        mockMvc.perform(patch("/api/leaves/{id}/approve", leaveRequest.getId()))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/leaves/{id}/reject", leaveRequest.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rejectionReason\":\"Too busy\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void approveLeaveRequest_unknownId_returns404() throws Exception {
        mockMvc.perform(patch("/api/leaves/{id}/approve", 9999L))
                .andExpect(status().isNotFound());
    }
}
