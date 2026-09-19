package com.inv.man.repository;

import com.inv.man.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    Optional<Product> findBySku(String sku);
    List<Product> findByActiveTrue();
    List<Product> findByCategory(String category);
    List<Product> findByCurrentStockLessThanEqual(Double threshold);
    Boolean existsBySku(String sku);
}
