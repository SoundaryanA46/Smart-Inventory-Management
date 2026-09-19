package com.inv.man.controller;

import com.inv.man.model.InventoryTransaction;
import com.inv.man.service.InventoryTransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.Date;
import java.util.List;

@CrossOrigin(
        origins = {
                "https://smart-inventory-management-frontend.vercel.app",
                "https://smart-inventory-management-frontend-2indry9zv-waseel.onrender.com"
        },
        maxAge = 3600
)
@RestController
@RequestMapping("/api/transactions")
public class InventoryTransactionController {

    @Autowired
    private InventoryTransactionService transactionService;

    @GetMapping
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMIN')")
    public ResponseEntity<?> getAllTransactions(
            @RequestParam(required = false) String productSku,
            @RequestParam(required = false) InventoryTransaction.TransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Date startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Date endDate,
            @RequestParam(required = false) String performedBy) {

        try {
            // Get current user from security context
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String currentUserId = auth.getName(); // Returns subject (user ID) from JWT
            boolean isAdmin = hasAdminRole(auth.getAuthorities());

            // If user is NOT admin, force performedBy to be their own ID (cannot see others' transactions)
            if (!isAdmin) {
                performedBy = currentUserId;
            }
            // If user IS admin, use the provided performedBy (null = see all, or specific ID)

            List<InventoryTransaction> transactions = transactionService.getTransactionsByFilters(
                    productSku, type, startDate, endDate, performedBy
            );

            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new com.inv.man.dto.MessageResponse("Error: " + e.getMessage()));
        }
    }

    /**
     * Check if the user has ADMIN role
     */
    private boolean hasAdminRole(Collection<? extends GrantedAuthority> authorities) {
        return authorities.stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN") || auth.getAuthority().contains("ADMIN"));
    }
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMIN')")
    public ResponseEntity<?> getTransactionById(@PathVariable String id) {
        try {
            return transactionService.getTransactionById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new com.inv.man.dto.MessageResponse("Error: " + e.getMessage()));
        }
    }
    @GetMapping("/sku/{productSku}")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMIN')")
    public ResponseEntity<?> getTransactionBySku(@PathVariable String productSku) {
        try {
            // Assuming SKU is unique per transaction. If multiple transactions per SKU, use List.
            List<InventoryTransaction> transactions = transactionService.getTransactionsByProductSku(productSku);
            if (transactions.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new com.inv.man.dto.MessageResponse("Error: " + e.getMessage()));
        }
    }
    @GetMapping("/product/{productId}")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMIN')")
    public ResponseEntity<?> getTransactionsByProduct(@PathVariable String productId) {
        try {
            List<InventoryTransaction> transactions = transactionService.getTransactionsByProduct(productId);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new com.inv.man.dto.MessageResponse("Error: " + e.getMessage()));
        }
    }
}
