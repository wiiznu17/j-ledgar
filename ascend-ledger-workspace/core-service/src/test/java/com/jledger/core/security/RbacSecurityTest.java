package com.jledger.core.security;

import com.jledger.core.controller.AccountController;
import com.jledger.core.controller.SystemController;
import com.jledger.core.controller.UserController;
import com.jledger.core.repository.AccountRepository;
import com.jledger.core.repository.AdminUserRepository;
import com.jledger.core.repository.IntegrationOutboxRepository;
import com.jledger.core.service.SystemService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({AccountController.class, SystemController.class, UserController.class})
@Import(com.jledger.core.config.SecurityConfig.class)
public class RbacSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AccountRepository accountRepository;

    @MockBean
    private AdminUserRepository userRepository;

    @MockBean
    private SystemService systemService;

    @MockBean
    private IntegrationOutboxRepository outboxRepository;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private PasswordEncoder passwordEncoder;

    // --- 1. Account Management ---

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void updateAccountStatus_AsSuperAdmin_ShouldReturnOk() throws Exception {
        UUID id = UUID.randomUUID();
        mockMvc.perform(put("/api/v1/accounts/" + id + "/status")
                        .contentType("application/json")
                        .content("{\"status\": \"FROZEN\"}"))
                .andExpect(status().isNotFound()); // NotFound because we didn't mock repository result, but 404 is not 403.
    }

    @Test
    @WithMockUser(roles = "SUPPORT_STAFF")
    void updateAccountStatus_AsSupportStaff_ShouldReturnForbidden() throws Exception {
        UUID id = UUID.randomUUID();
        mockMvc.perform(put("/api/v1/accounts/" + id + "/status")
                        .contentType("application/json")
                        .content("{\"status\": \"FROZEN\"}"))
                .andExpect(status().isForbidden());
    }

    // --- 2. Reconciliation ---

    @Test
    @WithMockUser(roles = "RECONCILER")
    void reconcile_AsReconciler_ShouldReturnOk() throws Exception {
        mockMvc.perform(post("/api/v1/system/reconcile"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void reconcile_AsSuperAdmin_ShouldReturnOk() throws Exception {
        mockMvc.perform(post("/api/v1/system/reconcile"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SUPPORT_STAFF")
    void reconcile_AsSupportStaff_ShouldReturnForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/system/reconcile"))
                .andExpect(status().isForbidden());
    }

    // --- 3. User Management ---

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void getAllUsers_AsSuperAdmin_ShouldReturnOk() throws Exception {
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "RECONCILER")
    void getAllUsers_AsReconciler_ShouldReturnForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isForbidden());
    }

    // --- 4. Anonymous Access ---

    @Test
    void listAccounts_Anonymous_ShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/accounts"))
                .andExpect(status().isUnauthorized());
    }
}
