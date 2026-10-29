package com.example.leave.service;

import com.example.leave.dto.EmployeeRequest;
import com.example.leave.dto.EmployeeResponse;
import com.example.leave.entity.Employee;
import com.example.leave.exception.DuplicateEmailException;
import com.example.leave.repository.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeService employeeService;

    @Test
    void createEmployee_validEmployee_succeeds() {
        EmployeeRequest request = new EmployeeRequest("John Doe", "JOHN@EXAMPLE.COM", "IT");
        Employee savedEmployee = new Employee(1L, "John Doe", "john@example.com", "IT", LocalDateTime.now());
        
        when(employeeRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(employeeRepository.save(any(Employee.class))).thenReturn(savedEmployee);
        
        EmployeeResponse response = employeeService.createEmployee(request);
        
        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("John Doe", response.getName());
        assertEquals("john@example.com", response.getEmail());
        assertEquals("IT", response.getDepartment());
        verify(employeeRepository, times(1)).existsByEmail("john@example.com");
        verify(employeeRepository, times(1)).save(any(Employee.class));
    }

    @Test
    void createEmployee_duplicateEmail_throwsDuplicateEmailException() {
        EmployeeRequest request = new EmployeeRequest("John Doe", "john@example.com", "IT");
        
        when(employeeRepository.existsByEmail("john@example.com")).thenReturn(true);
        
        assertThrows(DuplicateEmailException.class, () -> employeeService.createEmployee(request));
        verify(employeeRepository, times(1)).existsByEmail("john@example.com");
        verify(employeeRepository, never()).save(any(Employee.class));
    }

    @Test
    void getAllEmployees_returnsList() {
        Employee emp1 = new Employee(1L, "John Doe", "john@example.com", "IT", LocalDateTime.now());
        Employee emp2 = new Employee(2L, "Jane Doe", "jane@example.com", "HR", LocalDateTime.now());
        List<Employee> employees = Arrays.asList(emp1, emp2);
        
        when(employeeRepository.findAll()).thenReturn(employees);
        
        List<EmployeeResponse> responses = employeeService.getAllEmployees();
        
        assertNotNull(responses);
        assertEquals(2, responses.size());
        assertEquals("John Doe", responses.get(0).getName());
        assertEquals("Jane Doe", responses.get(1).getName());
        verify(employeeRepository, times(1)).findAll();
    }
}
