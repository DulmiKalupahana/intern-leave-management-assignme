package com.example.leave.service;

import com.example.leave.dto.EmployeeRequest;
import com.example.leave.dto.EmployeeResponse;
import com.example.leave.entity.Employee;
import com.example.leave.exception.DuplicateEmailException;
import com.example.leave.exception.ResourceNotFoundException;
import com.example.leave.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {
    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    public EmployeeResponse createEmployee(EmployeeRequest request) {
        String email = request.getEmail();
        if (email != null) {
            email = email.trim().toLowerCase();
        } else {
            email = null;
        }

        if (email != null && employeeRepository.existsByEmail(email)) {
            throw new DuplicateEmailException("Email already exists");
        }

        Employee employee = new Employee();
        employee.setName(request.getName());
        employee.setEmail(email);
        employee.setDepartment(request.getDepartment());

        Employee savedEmployee = employeeRepository.save(employee);
        return mapToResponse(savedEmployee);
    }

    public List<EmployeeResponse> getAllEmployees() {
        return employeeRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    private EmployeeResponse mapToResponse(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getName(),
                employee.getEmail(),
                employee.getDepartment(),
                employee.getCreatedAt()
        );
    }
}
