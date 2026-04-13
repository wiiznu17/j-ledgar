package com.jledger.core.dto;

import com.jledger.core.domain.Role;
import lombok.Data;

@Data
public class UserCreateRequest {
    private String email;
    private String password;
    private Role role;
}
