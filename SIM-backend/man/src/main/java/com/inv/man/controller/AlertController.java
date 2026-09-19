package com.inv.man.controller;

import com.inv.man.model.Product;
import com.inv.man.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(
        origins = {
                "https://smart-inventory-management-frontend.vercel.app",
                "https://smart-inventory-management-frontend-2indry9zv-waseel.onrender.com"
        },
        maxAge = 3600
)
@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private ProductService productService;

    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMIN')")
    public ResponseEntity<?> getLowStockProducts() {
        try {
            List<Product> lowStockProducts = productService.getLowStockProducts();
            
            Map<String, Object> response = new HashMap<>();
            response.put("count", lowStockProducts.size());
            response.put("products", lowStockProducts);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new com.inv.man.dto.MessageResponse("Error: " + e.getMessage()));
        }
    }
}
