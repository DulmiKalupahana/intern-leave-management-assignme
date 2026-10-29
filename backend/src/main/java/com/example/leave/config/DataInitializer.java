package com.example.leave.config;

import com.example.leave.entity.Account;
import com.example.leave.entity.Employee;
import com.example.leave.entity.Role;
import com.example.leave.repository.AccountRepository;
import com.example.leave.repository.EmployeeRepository;
import com.example.leave.security.PasswordHasher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds the first administrator so a fresh database can be used immediately.
 * Skipped in the test profile, where each test creates the accounts it needs.
 */
@Component
@Profile("!test")
public class DataInitializer implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final AccountRepository accountRepository;
    private final EmployeeRepository employeeRepository;
    private final String adminName;
    private final String adminEmail;
    private final String adminPassword;

    public DataInitializer(AccountRepository accountRepository,
                           EmployeeRepository employeeRepository,
                           @Value("${app.admin.name:Omibits Admin}") String adminName,
                           @Value("${app.admin.email:admin@omibits.com}") String adminEmail,
                           @Value("${app.admin.password:admin123}") String adminPassword) {
        this.accountRepository = accountRepository;
        this.employeeRepository = employeeRepository;
        this.adminName = adminName;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String email = adminEmail.trim().toLowerCase();
        if (accountRepository.findByEmail(email).isPresent()) {
            return;
        }

        Employee admin = employeeRepository.findByEmail(email).orElseGet(() -> {
            Employee employee = new Employee();
            employee.setName(adminName);
            employee.setEmail(email);
            employee.setDepartment("Administration");
            return employeeRepository.save(employee);
        });

        Account account = new Account();
        account.setEmployee(admin);
        account.setEmail(email);
        account.setPasswordHash(PasswordHasher.hash(adminPassword));
        account.setRole(Role.ADMIN);
        accountRepository.save(account);

        log.info("Created default administrator account {}. Set ADMIN_PASSWORD before deploying.", email);
    }
}
