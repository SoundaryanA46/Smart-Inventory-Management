package com.inv.man.service;

import com.inv.man.model.NotificationSettings;
import com.inv.man.repository.NotificationSettingsRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;


@Service
public class NotificationSettingsService {

    @Autowired
    private NotificationSettingsRepo repository;

    public NotificationSettings getSettings() {
        return repository.findAll()
                .stream()
                .findFirst()
                .orElse(new NotificationSettings(null, false, new ArrayList<>()));
    }

    public NotificationSettings updateSettings(NotificationSettings newSettings) {
        // Get existing settings
        NotificationSettings existing = repository.findAll()
                .stream()
                .findFirst()
                .orElse(new NotificationSettings(null, false, new ArrayList<>()));

        // Append new emails, avoid duplicates
        if (existing.getAlertEmails() == null) {
            existing.setAlertEmails(new ArrayList<>());
        }

        if (newSettings.getAlertEmails() != null) {
            for (String email : newSettings.getAlertEmails()) {
                if (!existing.getAlertEmails().contains(email)) {
                    existing.getAlertEmails().add(email);
                }
            }
        }


        // Update email alert flag
        existing.setEmailAlertEnabled(newSettings.isEmailAlertEnabled());

        // Save updated settings
        return repository.save(existing);
    }
}


