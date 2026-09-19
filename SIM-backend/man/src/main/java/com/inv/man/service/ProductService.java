package com.inv.man.service;

import com.inv.man.model.Product;
import com.inv.man.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    @Autowired
    private EmailService emailService;
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findByActiveTrue();
    }

    public Optional<Product> getProductById(String id) {
        return productRepository.findById(id);
    }

    public Optional<Product> getProductBySku(String sku) {
        return productRepository.findBySku(sku);
    }

    public Product createProduct(Product product) {
        if (productRepository.existsBySku(product.getSku())) {
            throw new RuntimeException("Product with SKU " + product.getSku() + " already exists");
        }
        product.setCreatedAt(new java.util.Date());
        product.setUpdatedAt(new java.util.Date());
        return productRepository.save(product);
    }

    public Product updateProduct(String id, Product productDetails) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        // Check SKU uniqueness if changed
        if (!product.getSku().equals(productDetails.getSku()) &&
                productRepository.existsBySku(productDetails.getSku())) {
            throw new RuntimeException("Product with SKU " + productDetails.getSku() + " already exists");
        }

        product.setSku(productDetails.getSku());
        product.setName(productDetails.getName());
        product.setDescription(productDetails.getDescription());
        product.setCategory(productDetails.getCategory());
        product.setUnit(productDetails.getUnit());
        product.setMinimumStock(productDetails.getMinimumStock());
        product.setMaximumStock(productDetails.getMaximumStock());
        product.setUnitPrice(productDetails.getUnitPrice());
        product.setCostPrice(productDetails.getCostPrice());
        product.setSupplier(productDetails.getSupplier());
        product.setLocation(productDetails.getLocation());
        product.setUpdatedAt(new java.util.Date());

        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        product.setActive(false);
        product.setUpdatedAt(new java.util.Date());
        productRepository.save(product);
    }

    @Transactional
    public Product adjustStock(String productId, Double quantity, boolean isIn) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        if (isIn) {
            product.setCurrentStock(product.getCurrentStock() + quantity);
        } else {
            if (product.getCurrentStock() < quantity) {
                throw new RuntimeException("Insufficient stock. Available: " + product.getCurrentStock());
            }
            product.setCurrentStock(product.getCurrentStock() - quantity);
        }

        product.setUpdatedAt(new java.util.Date());

        // ✅ SAVE FIRST
        Product savedProduct = productRepository.save(product);

        // 🔔 PUBLISH EVENT (NO EMAIL HERE)
        if (savedProduct.getCurrentStock() <= savedProduct.getMinimumStock()) {
            eventPublisher.publishEvent(new LowStockEvent(savedProduct));
        }

        // 🔄 RESET FLAG WHEN STOCK RECOVERS
        if (savedProduct.getCurrentStock() > savedProduct.getMinimumStock()
                && savedProduct.isLowStockAlertSent()) {

            savedProduct.setLowStockAlertSent(false);
            productRepository.save(savedProduct);
        }

        return savedProduct;
    }

    public List<Product> getLowStockProducts() {
        List<Product> allProducts = productRepository.findByActiveTrue();
        return allProducts.stream()
                .filter(p -> p.getCurrentStock() <= p.getMinimumStock())
                .toList();
    }
}
