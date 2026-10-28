package com.example.leave.controller;

import com.example.leave.dto.LeaveRequestCreateRequest;
import com.example.leave.entity.Employee;
import com.example.leave.entity.LeaveType;
import com.example.leave.repository.EmployeeRepository;
import com.example.leave.repository.LeaveRequestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class LeaveRequestControllerTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;
    private Employee employee;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        leaveRequestRepository.deleteAll();
        employeeRepository.deleteAll();
        employee = new Employee();
        employee.setName("John Doe");
        employee.setEmail("john@example.com");
        employee.setDepartment("IT");
        employee = employeeRepository.save(employee);
    }

    @Test
    void createLeaveRequest_valid_returns201WithPendingStatus() throws Exception {
        LeaveRequestCreateRequest request = new LeaveRequestCreateRequest();
        request.setEmployeeId(employee.getId());
        request.setLeaveType(LeaveType.ANNUAL);
        request.setStartDate(LocalDate.of(2026, 10, 1));
        request.setEndDate(LocalDate.of(2026, 10, 5));
        request.setReason("Vacation");

        mockMvc.perform(post("/api/leaves")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.employeeId", is(employee.getId().intValue())));
    }

    @Test
    void createLeaveRequest_endBeforeStart_returns400WithFieldErrors() throws Exception {
        LeaveRequestCreateRequest request = new LeaveRequestCreateRequest();
        request.setEmployeeId(employee.getId());
        request.setLeaveType(LeaveType.ANNUAL);
        request.setStartDate(LocalDate.of(2026, 10, 5));
        request.setEndDate(LocalDate.of(2026, 10, 1));
        request.setReason("Vacation");

        mockMvc.perform(post("/api/leaves")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.endDate").exists());
    }

    @Test
    void createLeaveRequest_missingFields_returns400() throws Exception {
        LeaveRequestCreateRequest request = new LeaveRequestCreateRequest();
        request.setEmployeeId(employee.getId());

        mockMvc.perform(post("/api/leaves")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createLeaveRequest_invalidLeaveType_returns400() throws Exception {
        String json = "{\"employeeId\":" + employee.getId() + ",\"leaveType\":\"INVALID\",\"startDate\":\"2026-10-01\",\"endDate\":\"2026-10-05\",\"reason\":\"Vacation\"}";

        mockMvc.perform(post("/api/leaves")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createLeaveRequest_unknownEmployeeId_returns404() throws Exception {
        LeaveRequestCreateRequest request = new LeaveRequestCreateRequest();
        request.setEmployeeId(9999L);
        request.setLeaveType(LeaveType.ANNUAL);
        request.setStartDate(LocalDate.of(2026, 10, 1));
        request.setEndDate(LocalDate.of(2026, 10, 5));
        request.setReason("Vacation");

        mockMvc.perform(post("/api/leaves")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void createLeaveRequest_overlappingDates_returns409() throws Exception {
        LeaveRequestCreateRequest request1 = new LeaveRequestCreateRequest();
        request1.setEmployeeId(employee.getId());
        request1.setLeaveType(LeaveType.ANNUAL);
        request1.setStartDate(LocalDate.of(2026, 10, 1));
        request1.setEndDate(LocalDate.of(2026, 10, 5));
        request1.setReason("Vacation");

        mockMvc.perform(post("/api/leaves")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        LeaveRequestCreateRequest request2 = new LeaveRequestCreateRequest();
        request2.setEmployeeId(employee.getId());
        request2.setLeaveType(LeaveType.CASUAL);
        request2.setStartDate(LocalDate.of(2026, 10, 3));
        request2.setEndDate(LocalDate.of(2026, 10, 7));
        request2.setReason("Personal");

        mockMvc.perform(post("/api/leaves")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isConflict());
    }

    @Test
    void getAllLeaveRequests_returns200() throws Exception {
        LeaveRequestCreateRequest request = new LeaveRequestCreateRequest();
        request.setEmployeeId(employee.getId());
        request.setLeaveType(LeaveType.ANNUAL);
        request.setStartDate(LocalDate.of(2026, 10, 1));
        request.setEndDate(LocalDate.of(2026, 10, 5));
        request.setReason("Vacation");

        mockMvc.perform(post("/api/leaves")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/leaves"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }
}
