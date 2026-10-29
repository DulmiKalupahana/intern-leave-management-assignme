package com.example.leave.controller;

import com.example.leave.dto.EmployeeRequest;
import com.example.leave.entity.Employee;
import com.example.leave.repository.EmployeeRepository;
import tools.jackson.databind.ObjectMapper;
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

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EmployeeControllerTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        employeeRepository.deleteAll();
    }

    @Test
    void createEmployee_valid_returns201() throws Exception {
        EmployeeRequest request = new EmployeeRequest("John Doe", "john@example.com", "Engineering", "password123");
        
        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("John Doe")))
                .andExpect(jsonPath("$.email", is("john@example.com")))
                .andExpect(jsonPath("$.department", is("Engineering")))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void createEmployee_invalidEmail_returns400WithFieldErrors() throws Exception {
        EmployeeRequest request = new EmployeeRequest("John Doe", "invalid-email", "IT", "password123");
        
        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Validation Failed")))
                .andExpect(jsonPath("$.fieldErrors.email").exists());
    }

    @Test
    void createEmployee_blankName_returns400() throws Exception {
        EmployeeRequest request = new EmployeeRequest("", "john@example.com", "IT", "password123");
        
        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists());
    }

    @Test
    void createEmployee_invalidDepartment_returns400WithFieldError() throws Exception {
        EmployeeRequest request = new EmployeeRequest("John Doe", "john@example.com", "IT", "password123");

        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.department").exists());
    }

    @Test
    void createEmployee_duplicateEmail_returns409() throws Exception {
        Employee employee = new Employee();
        employee.setName("Existing");
        employee.setEmail("john@example.com");
        employee.setDepartment("Human Resources");
        employeeRepository.save(employee);
        
        EmployeeRequest request = new EmployeeRequest("John Doe", "john@example.com", "Engineering", "password123");
        
        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.fieldErrors.email", is("Email already exists")));
    }

    @Test
    void getAllEmployees_returns200() throws Exception {
        Employee employee = new Employee();
        employee.setName("John Doe");
        employee.setEmail("john@example.com");
        employee.setDepartment("IT");
        employeeRepository.save(employee);
        
        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("John Doe")));
    }
}
