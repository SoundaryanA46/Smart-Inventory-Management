package com.inv.man.repository;

import com.inv.man.model.InventoryTransaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Date;
import java.util.List;

@Repository
public interface InventoryTransactionRepository extends MongoRepository<InventoryTransaction, String> {
    List<InventoryTransaction> findByProductId(String productId);
    List<InventoryTransaction> findByProductSku(String productSku);
    List<InventoryTransaction> findByProductSkuAndTransactionDateBetween(String productSku, Date start, Date end);
    List<InventoryTransaction> findByType(InventoryTransaction.TransactionType type);
    List<InventoryTransaction> findByTransactionDateBetween(Date startDate, Date endDate);
    List<InventoryTransaction> findByProductIdAndTransactionDateBetween(String productId, Date startDate, Date endDate);
    List<InventoryTransaction> findAllByOrderByTransactionDateDesc();

    List<InventoryTransaction> findByProductSkuAndTypeAndTransactionDateBetween(
            String productSku,
            InventoryTransaction.TransactionType type,
            Date start,
            Date end
    );

    List<InventoryTransaction> findByProductSkuAndType(String productSku, InventoryTransaction.TransactionType type);

    List<InventoryTransaction> findByTypeAndTransactionDateBetween(InventoryTransaction.TransactionType type, Date startDate, Date endDate);
}
