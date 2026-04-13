package com.jledger.core.controller;

import com.jledger.core.domain.AdminUser;
import com.jledger.core.dto.UserCreateRequest;
import com.jledger.core.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class UserController {

    private final AdminUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public List<AdminUser> getAllUsers() {
        return userRepository.findAll();
    }

    @PostMapping
    public AdminUser createUser(@RequestBody UserCreateRequest request) {
        AdminUser user = AdminUser.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();
        return userRepository.save(user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
