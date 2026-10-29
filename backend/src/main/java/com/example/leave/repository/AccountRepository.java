package com.example.leave.repository;

import com.example.leave.entity.Account;
import com.example.leave.entity.Role;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    @EntityGraph(attributePaths = "employee")
    Optional<Account> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmployeeId(Long employeeId);

    @Query("SELECT a.employee.id FROM Account a WHERE a.role = :role")
    List<Long> findEmployeeIdsByRole(@Param("role") Role role);
}
