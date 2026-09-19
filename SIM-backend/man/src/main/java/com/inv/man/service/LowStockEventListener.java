package com.inv.man.service;

import com.inv.man.model.NotificationSettings;
import com.inv.man.model.Product;
import com.inv.man.repository.ProductRepository;
import com.inv.man.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

import java.util.List;

@Component
public class LowStockEventListener {

    @Autowired
    private NotificationSettingsService settingsService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ProductRepository productRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleLowStock(LowStockEvent event) {
        Product product = event.getProduct();
        NotificationSettings settings = settingsService.getSettings();

        if (!settings.isEmailAlertEnabled()) return;

        List<String> alertEmails = settings.getAlertEmails();
        if (alertEmails == null || alertEmails.isEmpty()) return;

        if (product.getCurrentStock() <= product.getMinimumStock() && !product.isLowStockAlertSent()) {
            // Send email
            emailService.sendLowStockAlert(product, alertEmails);

            // Mark alert as sent
            product.setLowStockAlertSent(true);
            productRepository.save(product);
        }
    }
}
