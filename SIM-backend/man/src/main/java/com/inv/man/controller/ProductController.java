package com.inv.man.controller;

import com.inv.man.dto.MessageResponse;
import com.inv.man.dto.ProductRequest;
import com.inv.man.dto.StockAdjustmentRequest;
import com.inv.man.model.InventoryTransaction;
import com.inv.man.model.Product;
import com.inv.man.service.InventoryTransactionService;
import com.inv.man.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
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
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private InventoryTransactionService transactionService;

    @GetMapping
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMIN')")
    public ResponseEntity<?> getAllProducts() {
        try {
            List<Product> products = productService.getAllProducts();
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMIN')")
    public ResponseEntity<?> getProductById(@PathVariable String id) {
        try {
            return productService.getProductById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createProduct(@Valid @RequestBody ProductRequest request) {
        try {
            Product product = new Product(
                    request.getSku(),
                    request.getName(),
                    request.getDescription() != null ? request.getDescription() : "",
                    request.getCategory() != null ? request.getCategory() : "",
                    request.getUnit() != null ? request.getUnit() : "pcs",
                    request.getMinimumStock() != null ? request.getMinimumStock() : 0.0,
                    request.getUnitPrice() != null ? request.getUnitPrice() : 0.0,
                    request.getCostPrice() != null ? request.getCostPrice() : 0.0
            );
            product.setSupplier(request.getSupplier());
            product.setLocation(request.getLocation());
            product.setCurrentStock(0.0);

            Product savedProduct = productService.createProduct(product);

            // Create transaction record for product creation
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String performedBy = auth != null ? auth.getName() : "system";

            InventoryTransaction createTransaction = new InventoryTransaction(
                    savedProduct.getId(),
                    savedProduct.getName(),
                    savedProduct.getSku(),
                    InventoryTransaction.TransactionType.ADJUSTMENT,
                    0.0, // No quantity change on creation
                    savedProduct.getUnitPrice() != null ? savedProduct.getUnitPrice() : 0.0,
                    "PRODUCT_CREATED",
                    "Product created: " + savedProduct.getName(),
                    performedBy
            );
            transactionService.createTransactionWithoutStockUpdate(createTransaction);

            return ResponseEntity.ok(savedProduct);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateProduct(@PathVariable String id, @Valid @RequestBody ProductRequest request) {
        try {
            Product product = productService.getProductById(id)
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            product.setSku(request.getSku());
            product.setName(request.getName());
            product.setDescription(request.getDescription());
            product.setCategory(request.getCategory());
            product.setUnit(request.getUnit());
            product.setMinimumStock(request.getMinimumStock() != null ? request.getMinimumStock() : 0.0);
            product.setUnitPrice(request.getUnitPrice() != null ? request.getUnitPrice() : 0.0);
            product.setCostPrice(request.getCostPrice() != null ? request.getCostPrice() : 0.0);
            product.setSupplier(request.getSupplier());
            product.setLocation(request.getLocation());

            Product updatedProduct = productService.updateProduct(id, product);

            // Create transaction record for product update
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String performedBy = auth != null ? auth.getName() : "system";

            InventoryTransaction updateTransaction = new InventoryTransaction(
                    id,
                    updatedProduct.getName(),
                    updatedProduct.getSku(),
                    InventoryTransaction.TransactionType.ADJUSTMENT,
                    0.0, // No quantity change on update
                    updatedProduct.getUnitPrice() != null ? updatedProduct.getUnitPrice() : 0.0,
                    "PRODUCT_UPDATED",
                    "Product updated: " + updatedProduct.getName(),
                    performedBy
            );
            transactionService.createTransactionWithoutStockUpdate(updateTransaction);

            return ResponseEntity.ok(updatedProduct);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteProduct(@PathVariable String id) {
        try {
            Product product = productService.getProductById(id)
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            // Create transaction record for product deletion before deleting
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String performedBy = auth != null ? auth.getName() : "system";

            InventoryTransaction deleteTransaction = new InventoryTransaction(
                    id,
                    product.getName(),
                    product.getSku(),
                    InventoryTransaction.TransactionType.ADJUSTMENT,
                    0.0, // No quantity change on deletion
                    product.getUnitPrice() != null ? product.getUnitPrice() : 0.0,
                    "PRODUCT_DELETED",
                    "Product deleted: " + product.getName(),
                    performedBy
            );
            transactionService.createTransactionWithoutStockUpdate(deleteTransaction);

            productService.deleteProduct(id);
            return ResponseEntity.ok(new MessageResponse("Product deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/stock-adjustment")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMIN')")
    public ResponseEntity<?> adjustStock(@PathVariable String id, @Valid @RequestBody StockAdjustmentRequest request) {
        try {
            Product product = productService.getProductById(id)
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            // Validate quantity for OUT transactions
            if (request.getType() == InventoryTransaction.TransactionType.OUT &&
                    product.getCurrentStock() < request.getQuantity()) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Insufficient stock. Available: " + product.getCurrentStock()));
            }

            // Adjust stock based on transaction type
            Product updatedProduct;
            if (request.getType() == InventoryTransaction.TransactionType.IN) {
                // Stock IN: Add quantity
                updatedProduct = productService.adjustStock(id, request.getQuantity(), true);
            } else if (request.getType() == InventoryTransaction.TransactionType.OUT) {
                // Stock OUT: Subtract quantity
                updatedProduct = productService.adjustStock(id, request.getQuantity(), false);
            } else {
                // ADJUSTMENT: Set stock to specific value (quantity represents the new stock level)
                // For adjustment, we calculate the difference and apply it
                Double difference = request.getQuantity() - product.getCurrentStock();
                if (difference > 0) {
                    updatedProduct = productService.adjustStock(id, difference, true);
                } else if (difference < 0) {
                    updatedProduct = productService.adjustStock(id, Math.abs(difference), false);
                } else {
                    // No change needed
                    updatedProduct = product;
                }
            }

            // Create transaction record
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String performedBy = auth != null ? auth.getName() : "system";

            // Use product's unit price if request unitPrice is null or 0
            Double transactionUnitPrice = request.getUnitPrice();
            if (transactionUnitPrice == null || transactionUnitPrice == 0) {
                transactionUnitPrice = product.getUnitPrice() != null ? product.getUnitPrice() : 0.0;
            }

            InventoryTransaction transaction = new InventoryTransaction(
                    id,
                    updatedProduct.getName(),
                    updatedProduct.getSku(),
                    request.getType(),
                    request.getQuantity(),
                    transactionUnitPrice,
                    request.getReference(),
                    request.getNotes(),
                    performedBy
            );

            // CRITICAL: Use createTransactionWithoutStockUpdate since stock is already adjusted above
            // DO NOT use createTransaction() here as it would adjust stock again (causing double adjustment)
            transactionService.createTransactionWithoutStockUpdate(transaction);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Stock adjusted successfully");
            response.put("product", updatedProduct);
            response.put("transaction", transaction);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
}
