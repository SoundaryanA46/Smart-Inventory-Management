package com.inv.man.service;
import com.inv.man.model.Product;

public class LowStockEvent {

    private final Product product;

    public LowStockEvent(Product product) {
        this.product = product;
    }

    public Product getProduct() {
        return product;
    }
}
