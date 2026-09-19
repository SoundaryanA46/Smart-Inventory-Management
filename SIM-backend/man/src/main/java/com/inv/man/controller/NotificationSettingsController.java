package com.inv.man.controller;

import com.inv.man.model.NotificationSettings;
import com.inv.man.service.NotificationSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/notification-settings")
@CrossOrigin(
        origins = {
                "https://smart-inventory-management-frontend.vercel.app",
                "https://smart-inventory-management-frontend-2indry9zv-waseel.onrender.com"
        },
        maxAge = 3600
)
@PreAuthorize("hasRole('ADMIN')")
public class NotificationSettingsController {

    @Autowired
    private NotificationSettingsService service;

    @GetMapping
    public NotificationSettings getSettings() {
        return service.getSettings();
    }

    @PutMapping
    public NotificationSettings update(@RequestBody NotificationSettings settings) {
        return service.updateSettings(settings);
    }
}

