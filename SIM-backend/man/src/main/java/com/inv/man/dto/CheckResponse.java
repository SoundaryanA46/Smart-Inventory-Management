package com.inv.man.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class CheckResponse {
    private boolean exists;
    
    public CheckResponse(boolean exists) {
        this.exists = exists;
    }
}