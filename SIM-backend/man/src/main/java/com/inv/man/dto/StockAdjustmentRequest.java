package com.inv.man.dto;

import com.inv.man.model.InventoryTransaction.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

public class StockAdjustmentRequest {
    // Note: productId is not needed here as it comes from the URL path variable

    @NotNull(message = "Transaction type is required")
    private TransactionType type;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity must be >= 0")
    private Double quantity;

    @Min(value = 0, message = "Unit price must be >= 0")
    private Double unitPrice;

    private String reference;
    private String notes;

    // Getters and Setters
    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }

    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }

    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
