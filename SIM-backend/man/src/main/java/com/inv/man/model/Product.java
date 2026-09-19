package com.inv.man.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Document(collection = "products")
@Data
@NoArgsConstructor
public class Product {
    @Id
    private String id;

    @Indexed(unique = true)
    private String sku; // Stock Keeping Unit

    private String name;
    private String description;
    private String category;
    private String unit; // e.g., "pcs", "kg", "liters"

    private int reorderLevel;
    private boolean lowStockAlertSent = false;

    private Double currentStock = 0.0;
    private Double minimumStock = 0.0; // Threshold for low-stock alerts
    private Double maximumStock = 0.0;

    private Double unitPrice = 0.0;
    private Double costPrice = 0.0;

    private String supplier;
    private String location; // Warehouse location

    private boolean active = true;

    private Date createdAt;
    private Date updatedAt;

    public Product(String sku, String name, String description, String category, String unit,
            Double minimumStock, Double unitPrice, Double costPrice) {
        this.sku = sku;
        this.name = name;
        this.description = description;
        this.category = category;
        this.unit = unit;
        this.minimumStock = minimumStock;
        this.unitPrice = unitPrice;
        this.costPrice = costPrice;
        this.currentStock = 0.0;
        this.active = true;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Explicit getters and setters (Lombok may not be generating them reliably)
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Double getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(Double currentStock) {
        this.currentStock = currentStock;
    }

    public Double getMinimumStock() {
        return minimumStock;
    }

    public void setMinimumStock(Double minimumStock) {
        this.minimumStock = minimumStock;
    }

    public Double getMaximumStock() {
        return maximumStock;
    }

    public void setMaximumStock(Double maximumStock) {
        this.maximumStock = maximumStock;
    }

    public Double getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(Double unitPrice) {
        this.unitPrice = unitPrice;
    }

    public Double getCostPrice() {
        return costPrice;
    }

    public void setCostPrice(Double costPrice) {
        this.costPrice = costPrice;
    }

    public String getSupplier() {
        return supplier;
    }

    public void setSupplier(String supplier) {
        this.supplier = supplier;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isLowStockAlertSent() {
        return lowStockAlertSent;
    }

    public void setLowStockAlertSent(boolean lowStockAlertSent) {
        this.lowStockAlertSent = lowStockAlertSent;
    }

    public int getReorderLevel() {
        return reorderLevel;
    }

    public void setReorderLevel(int reorderLevel) {
        this.reorderLevel = reorderLevel;
    }
}
