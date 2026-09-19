package com.inv.man.service;

import com.inv.man.model.NotificationSettings;
import com.inv.man.model.Product;
import com.inv.man.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private UserRepository userRepository;


    @Autowired
    private NotificationSettingsService settingsService;

    public void sendLowStockAlert(Product product, List<String> alertEmails) {

        NotificationSettings settings = settingsService.getSettings();

        // ✅ VERY IMPORTANT CHECK
        if (!settings.isEmailAlertEnabled()) {
            return; // DO NOTHING
        }

        if (settings.getAlertEmails() == null || settings.getAlertEmails().isEmpty()) {
            return; // NO RECEIVERS
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(settings.getAlertEmails().toArray(new String[0]));
        message.setSubject("⚠️ LOW STOCK ALERT");

        message.setText(
                "Low Stock Alert\n\n" +
                        "Product: " + product.getName() + "\n" +
                        "SKU: " + product.getSku() + "\n" +
                        "Current Stock: " + product.getCurrentStock() + "\n" +
                        "Minimum Stock: " + product.getMinimumStock()
        );

        mailSender.send(message);
    }


}
