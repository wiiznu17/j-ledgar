package com.jledger.core.config;

import com.jledger.core.domain.AdminUser;
import com.jledger.core.domain.Role;
import com.jledger.core.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AdminUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            AdminUser admin = AdminUser.builder()
                    .email("admin@jledger.io")
                    .passwordHash(passwordEncoder.encode("password123"))
                    .role(Role.SUPER_ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("Default Super Admin created: admin@jledger.io / password123");
        }
    }
}
