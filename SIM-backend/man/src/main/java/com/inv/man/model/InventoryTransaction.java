package com.inv.man.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Document(collection = "inventory_transactions")
@Data
@NoArgsConstructor
public class InventoryTransaction {
    @Id
    private String id;

    @Indexed
    private String productId;
    private String productName;
    private String productSku;

    private TransactionType type; // IN, OUT, ADJUSTMENT
    private Double quantity;
    private Double unitPrice;
    private Double totalValue;

    private String reference; // Invoice number, order number, etc.
    private String notes;
    private String performedBy; // User ID who performed the transaction

    private Date transactionDate;
    private Date createdAt;

    public enum TransactionType {
        IN,           // Stock in (purchase, return)
        OUT,          // Stock out (sale, damage, loss)
        ADJUSTMENT    // Manual adjustment
    }

    public InventoryTransaction(String productId, String productName, String productSku,
                                TransactionType type, Double quantity, Double unitPrice,
                                String reference, String notes, String performedBy) {
        this.productId = productId;
        this.productName = productName;
        this.productSku = productSku;
        this.type = type;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalValue = quantity * unitPrice;
        this.reference = reference;
        this.notes = notes;
        this.performedBy = performedBy;
        this.transactionDate = new Date();
        this.createdAt = new Date();
    }

    // Explicit getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getProductSku() { return productSku; }
    public void setProductSku(String productSku) { this.productSku = productSku; }

    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }

    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }

    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }

    public Double getTotalValue() { return totalValue; }
    public void setTotalValue(Double totalValue) { this.totalValue = totalValue; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public Date getTransactionDate() { return transactionDate; }
    public void setTransactionDate(Date transactionDate) { this.transactionDate = transactionDate; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}
