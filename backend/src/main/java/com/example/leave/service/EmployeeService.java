package com.example.leave.service;

import com.example.leave.dto.EmployeeRequest;
import com.example.leave.dto.EmployeeResponse;
import com.example.leave.entity.Account;
import com.example.leave.entity.Employee;
import com.example.leave.entity.Role;
import com.example.leave.exception.DuplicateEmailException;
import com.example.leave.repository.AccountRepository;
import com.example.leave.repository.EmployeeRepository;
import com.example.leave.security.PasswordHasher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final AccountRepository accountRepository;

    public EmployeeService(EmployeeRepository employeeRepository, AccountRepository accountRepository) {
        this.employeeRepository = employeeRepository;
        this.accountRepository = accountRepository;
    }

    /**
     * Creates the employee record and its login account in one transaction: an
     * employee without credentials could never sign in, so the two must not drift.
     */
    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (email != null && (employeeRepository.existsByEmail(email) || accountRepository.existsByEmail(email))) {
            throw new DuplicateEmailException("Email already exists");
        }

        Employee employee = new Employee();
        employee.setName(request.getName().trim());
        employee.setEmail(email);
        employee.setDepartment(request.getDepartment().trim());
        Employee savedEmployee = employeeRepository.save(employee);

        Account account = new Account();
        account.setEmployee(savedEmployee);
        account.setEmail(email);
        account.setPasswordHash(PasswordHasher.hash(request.getPassword()));
        account.setRole(Role.EMPLOYEE);
        accountRepository.save(account);

        return mapToResponse(savedEmployee);
    }

    /**
     * Administrator accounts are hidden: the directory lists the people an
     * administrator manages, not the administrator themselves.
     */
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees() {
        Set<Long> adminEmployeeIds = new HashSet<>(accountRepository.findEmployeeIdsByRole(Role.ADMIN));

        return employeeRepository.findAll().stream()
                .filter(employee -> !adminEmployeeIds.contains(employee.getId()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
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
