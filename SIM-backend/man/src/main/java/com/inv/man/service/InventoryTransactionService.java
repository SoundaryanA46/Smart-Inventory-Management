package com.inv.man.service;

import com.inv.man.model.InventoryTransaction;
import com.inv.man.model.Product;
import com.inv.man.repository.InventoryTransactionRepository;
import com.inv.man.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InventoryTransactionService {
    @Autowired
    private EmailService emailService;

    @Autowired
    private InventoryTransactionRepository transactionRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductService productService;

    @Transactional
    public InventoryTransaction createTransaction(InventoryTransaction transaction) {
        // Update product stock
        Product product = productRepository.findById(transaction.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        boolean isIn = transaction.getType() == InventoryTransaction.TransactionType.IN;
        productService.adjustStock(transaction.getProductId(), transaction.getQuantity(), isIn);

        // Set product details
        transaction.setProductName(product.getName());
        transaction.setProductSku(product.getSku());

        return transactionRepository.save(transaction);
    }

    public List<InventoryTransaction> getAllTransactions() {
        return transactionRepository.findAllByOrderByTransactionDateDesc();
    }

    public List<InventoryTransaction> getTransactionsByProductSku(String productSku) {
        return transactionRepository.findByProductSku(productSku);
    }

    public List<InventoryTransaction> getTransactionsByProductSkuAndDateRange(String productSku, Date startDate, Date endDate) {
        return transactionRepository.findByProductSkuAndTransactionDateBetween(productSku, startDate, endDate);
    }

    public Optional<InventoryTransaction> getTransactionById(String id) {
        return transactionRepository.findById(id);
    }

    public List<InventoryTransaction> getTransactionsByProduct(String productId) {
        return transactionRepository.findByProductId(productId);
    }

    public List<InventoryTransaction> getTransactionsByType(InventoryTransaction.TransactionType type) {
        return transactionRepository.findByType(type);
    }

    public List<InventoryTransaction> getTransactionsByDateRange(Date startDate, Date endDate) {
        return transactionRepository.findByTransactionDateBetween(startDate, endDate);
    }

    public List<InventoryTransaction> getTransactionsByProductAndDateRange(String productId, Date startDate, Date endDate) {
        return transactionRepository.findByProductIdAndTransactionDateBetween(productId, startDate, endDate);
    }

    public List<InventoryTransaction> getTransactionsByFilters(
            String productSku,
            InventoryTransaction.TransactionType type,
            Date startDate,
            Date endDate,
            String performedBy
    ) {
        List<InventoryTransaction> list;
        if (productSku != null && type != null && startDate != null && endDate != null) {
            list = transactionRepository.findByProductSkuAndTypeAndTransactionDateBetween(
                    productSku, type, startDate, endDate);
        } else if (productSku != null && type != null) {
            list = transactionRepository.findByProductSkuAndType(productSku, type);
        } else if (productSku != null && startDate != null && endDate != null) {
            list = transactionRepository.findByProductSkuAndTransactionDateBetween(productSku, startDate, endDate);
        } else if (type != null && startDate != null && endDate != null) {
            list = transactionRepository.findByTypeAndTransactionDateBetween(type, startDate, endDate);
        } else if (productSku != null) {
            list = transactionRepository.findByProductSku(productSku);
        } else if (type != null) {
            list = transactionRepository.findByType(type);
        } else if (startDate != null && endDate != null) {
            list = transactionRepository.findByTransactionDateBetween(startDate, endDate);
        } else {
            list = transactionRepository.findAllByOrderByTransactionDateDesc();
        }

        if (performedBy != null && !performedBy.trim().isEmpty()) {
            return list.stream()
                    .filter(tx -> performedBy.equals(tx.getPerformedBy()))
                    .collect(Collectors.toList());
        }

        return list;
    }

    @Transactional
    public InventoryTransaction createTransactionWithoutStockUpdate(InventoryTransaction transaction) {
        // This method creates a transaction record without updating product stock
        // Used for product lifecycle events (create, update, delete)
        Product product = productRepository.findById(transaction.getProductId())
                .orElse(null);

        if (product != null) {
            transaction.setProductName(product.getName());
            transaction.setProductSku(product.getSku());
        }

        // Save transaction only - NO stock adjustment
        return transactionRepository.save(transaction);
    }
}