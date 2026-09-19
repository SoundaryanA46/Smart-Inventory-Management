package com.inv.man.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class ProductRequest {
    @NotBlank(message = "SKU is required")
    private String sku;

    @NotBlank(message = "Product name is required")
    private String name;

    private String description;
    private String category;
    private String unit;

    @NotNull(message = "Minimum stock is required")
    @Min(value = 0, message = "Minimum stock must be >= 0")
    private Double minimumStock;

    @Min(value = 0, message = "Unit price must be >= 0")
    private Double unitPrice;

    @Min(value = 0, message = "Cost price must be >= 0")
    private Double costPrice;

    private String supplier;
    private String location;

    // Getters and Setters
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Double getMinimumStock() { return minimumStock; }
    public void setMinimumStock(Double minimumStock) { this.minimumStock = minimumStock; }

    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }

    public Double getCostPrice() { return costPrice; }
    public void setCostPrice(Double costPrice) { this.costPrice = costPrice; }

    public String getSupplier() { return supplier; }
    public void setSupplier(String supplier) { this.supplier = supplier; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
}
