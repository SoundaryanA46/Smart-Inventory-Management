package com.inv.man.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notification_settings")
public class NotificationSettings {

    @Id
    private String id;

    private boolean emailAlertEnabled;

    private List<String> alertEmails;

    // Explicit getters/setters — Lombok @Data fails on JDK 25
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public boolean isEmailAlertEnabled() {
        return emailAlertEnabled;
    }

    public void setEmailAlertEnabled(boolean emailAlertEnabled) {
        this.emailAlertEnabled = emailAlertEnabled;
    }

    public List<String> getAlertEmails() {
        return alertEmails;
    }

    public void setAlertEmails(List<String> alertEmails) {
        this.alertEmails = alertEmails;
    }
}
