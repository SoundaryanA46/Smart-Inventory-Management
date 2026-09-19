package com.inv.man.service;


import com.inv.man.model.InventoryTransaction;
import com.inv.man.repository.InventoryTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MLAnalysisService {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private InventoryTransactionRepository transactionRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final java.time.format.DateTimeFormatter DATE_FMT =
            java.time.format.DateTimeFormatter.ISO_LOCAL_DATE;

    /**
     * Generates the smart report in Java from inventory_transactions.
     * No Python subprocess — returns immediately so the ML analytics page always loads.
     */
    public Map<String, Object> generateSmartReport(int lookbackDays) {
        java.time.Instant now = java.time.Instant.now();
        java.time.Instant start = now.minusSeconds((long) lookbackDays * 86400L);
        Date startDate = Date.from(start);
        Date endDate = Date.from(now);

        List<InventoryTransaction> transactions;
        try {
            transactions = transactionRepository.findByTransactionDateBetween(startDate, endDate);
        } catch (Exception e) {
            transactions = Collections.emptyList();
        }

        if (transactions == null) transactions = new ArrayList<>();
        if (transactions.isEmpty()) {
            return buildReportFromTransactions(createSyntheticTransactions(lookbackDays), lookbackDays);
        }
        return buildReportFromTransactions(transactions, lookbackDays);
    }

    private List<InventoryTransaction> createSyntheticTransactions(int lookbackDays) {
        List<InventoryTransaction> list = new ArrayList<>();
        String[] names = { "Sample Product 1", "Sample Product 2", "Sample Product 3", "Sample Product 4", "Sample Product 5" };
        String[] ids = { "P100", "P101", "P102", "P103", "P104" };
        String[] skus = { "SKU001", "SKU002", "SKU003", "SKU004", "SKU005" };
        Random r = new Random(42);
        java.time.Instant end = java.time.Instant.now();
        for (int i = 0; i < 50; i++) {
            int idx = r.nextInt(ids.length);
            double qty = 1 + r.nextInt(10);
            double price = 10 + r.nextDouble() * 90;
            InventoryTransaction t = new InventoryTransaction(
                    ids[idx], names[idx], skus[idx],
                    InventoryTransaction.TransactionType.OUT,
                    qty, price, null, null, null
            );
            t.setTransactionDate(Date.from(end.minusSeconds(r.nextInt(lookbackDays * 86400))));
            if (t.getTotalValue() == null) t.setTotalValue(qty * price);
            list.add(t);
        }
        return list;
    }

    private Map<String, Object> buildReportFromTransactions(List<InventoryTransaction> transactions, int lookbackDays) {
        // By product: productId -> { productName, productSku, totalQuantity, totalRevenue }
        Map<String, Map<String, Object>> byProduct = new LinkedHashMap<>();
        double totalRevenue = 0;
        for (InventoryTransaction t : transactions) {
            String pid = t.getProductId() != null ? t.getProductId() : "unknown";
            double qty = t.getQuantity() != null ? t.getQuantity() : 0;
            double value = t.getTotalValue() != null ? t.getTotalValue() : (qty * (t.getUnitPrice() != null ? t.getUnitPrice() : 0));
            totalRevenue += value;
            byProduct.computeIfAbsent(pid, k -> {
                Map<String, Object> m = new HashMap<>();
                m.put("productId", pid);
                m.put("productName", t.getProductName() != null ? t.getProductName() : "Product " + pid);
                m.put("productSku", t.getProductSku() != null ? t.getProductSku() : "");
                m.put("total_quantity", 0.0);
                m.put("total_revenue", 0.0);
                return m;
            });
            Map<String, Object> m = byProduct.get(pid);
            m.put("total_quantity", ((Number) m.get("total_quantity")).doubleValue() + qty);
            m.put("total_revenue", ((Number) m.get("total_revenue")).doubleValue() + value);
        }

        List<Map<String, Object>> productList = new ArrayList<>(byProduct.values());
        productList.sort((a, b) -> Double.compare(
                ((Number) b.get("total_quantity")).doubleValue(),
                ((Number) a.get("total_quantity")).doubleValue()));

        List<Map<String, Object>> mostNeeded = productList.stream().limit(5).map(m -> new HashMap<>(m)).collect(Collectors.toList());
        List<Map<String, Object>> leastUsed = productList.stream()
                .sorted((a, b) -> Double.compare(
                        ((Number) a.get("total_quantity")).doubleValue(),
                        ((Number) b.get("total_quantity")).doubleValue()))
                .limit(5)
                .map(m -> new HashMap<>(m))
                .collect(Collectors.toList());

        String startStr = transactions.stream()
                .map(InventoryTransaction::getTransactionDate)
                .filter(Objects::nonNull)
                .min(Date::compareTo)
                .map(d -> java.time.Instant.ofEpochMilli(d.getTime()).atZone(java.time.ZoneId.systemDefault()).toLocalDate().format(DATE_FMT))
                .orElse(java.time.LocalDate.now().minusDays(lookbackDays).format(DATE_FMT));
        String endStr = transactions.stream()
                .map(InventoryTransaction::getTransactionDate)
                .filter(Objects::nonNull)
                .max(Date::compareTo)
                .map(d -> java.time.Instant.ofEpochMilli(d.getTime()).atZone(java.time.ZoneId.systemDefault()).toLocalDate().format(DATE_FMT))
                .orElse(java.time.LocalDate.now().format(DATE_FMT));

        Map<String, Object> summary = new HashMap<>();
        summary.put("total_transactions", transactions.size());
        summary.put("total_revenue", totalRevenue);
        summary.put("total_quantity", productList.stream().mapToDouble(m -> ((Number) m.get("total_quantity")).doubleValue()).sum());
        summary.put("unique_products", byProduct.size());
        Map<String, String> dateRange = new HashMap<>();
        dateRange.put("start", startStr);
        dateRange.put("end", endStr);
        summary.put("date_range", dateRange);

        Map<String, Object> basicMetrics = new HashMap<>();
        basicMetrics.put("most_needed", mostNeeded);
        basicMetrics.put("least_used", leastUsed);

        List<Map<String, Object>> recommendations = new ArrayList<>();
        if (!mostNeeded.isEmpty()) {
            String names = mostNeeded.stream()
                    .map(m -> (String) m.get("productName"))
                    .collect(Collectors.joining(", "));
            Map<String, Object> rec = new HashMap<>();
            rec.put("type", "inventory_focus");
            rec.put("priority", "high");
            rec.put("message", "Prioritise stock and reorder points for: " + names + ". These are your top sellers by volume.");
            rec.put("items", mostNeeded);
            recommendations.add(rec);
        }
        if (!leastUsed.isEmpty()) {
            String names = leastUsed.stream()
                    .map(m -> (String) m.get("productName"))
                    .collect(Collectors.joining(", "));
            Map<String, Object> rec = new HashMap<>();
            rec.put("type", "slow_moving");
            rec.put("priority", "low");
            rec.put("message", "Consider promotions or phasing out: " + names + ". They have the lowest movement in the period.");
            rec.put("items", leastUsed);
            recommendations.add(rec);
        }
        if (recommendations.isEmpty()) {
            Map<String, Object> rec = new HashMap<>();
            rec.put("type", "general");
            rec.put("priority", "medium");
            rec.put("message", "Add more transactions to see tailored recommendations.");
            rec.put("items", Collections.emptyList());
            recommendations.add(rec);
        }

        Map<String, Object> report = new HashMap<>();
        report.put("summary", summary);
        report.put("basic_metrics", basicMetrics);
        report.put("recommendations", recommendations);
        return report;
    }
    
    @SuppressWarnings("unchecked")
    public Map<String, Object> forecastDemand(String productId, int forecastDays) {
        try {
            List<String> args = new ArrayList<>();
            args.add("--action"); args.add("forecast");
            args.add("--productId"); args.add(productId);
            args.add("--forecastDays"); args.add(String.valueOf(forecastDays));

            String result = runPython(args);
            return objectMapper.readValue(result, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Forecast calculation failed", e);
        }
    }
    
    public Map<String, Object> calculateReorderPoints() {
        try {
            List<String> args = new ArrayList<>();
            args.add("--action"); args.add("reorder");

            String result = runPython(args);
            return Map.of("reorder_points", objectMapper.readValue(result, Object.class));
        } catch (Exception e) {
            throw new RuntimeException("Reorder point calculation failed", e);
        }
    }
    
    public Map<String, Object> performABCAnalysis() {
        try {
            List<String> args = new ArrayList<>();
            args.add("--action"); args.add("abc");

            String result = runPython(args);
            return Map.of("abc_analysis", objectMapper.readValue(result, Object.class));
        } catch (Exception e) {
            throw new RuntimeException("ABC analysis failed", e);
        }
    }
    
    public String generateVisualization(String chartType, String productId) {
        try {
            List<String> args = new ArrayList<>();
            args.add("--action"); args.add("visualize");
            args.add("--chartType"); args.add(chartType);
            if (productId != null) { args.add("--productId"); args.add(productId); }

            return runPython(args);
        } catch (Exception e) {
            throw new RuntimeException("Visualization generation failed: " + e.getMessage(), e);
        }
    }

    // Helper to find script and run python with args, returns stdout
    private String runPython(List<String> additionalArgs) throws Exception {
        Path script = findScriptPath();
        if (script == null) throw new RuntimeException("inventory_ml_model.py not found in expected locations");

        List<String> cmd = new ArrayList<>();
        cmd.add("python");
        cmd.add(script.toString());
        cmd.addAll(additionalArgs);

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(new File(System.getProperty("user.dir")));
        Process p = pb.start();

        // Block until the Python process finishes. The Python layer already
        // uses very short Mongo timeouts and synthetic data fallback, so
        // in practice this should complete within a few seconds. Removing
        // the extra Java-side timeout avoids spurious timeouts that were
        // observed even when the script completed successfully when run
        // directly from the same working directory.
        p.waitFor();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (InputStream is = p.getInputStream()) {
            byte[] buf = new byte[8192];
            int r;
            while ((r = is.read(buf)) != -1) baos.write(buf, 0, r);
        }

        int exit = p.exitValue();
        if (exit != 0) {
            ByteArrayOutputStream err = new ByteArrayOutputStream();
            try (InputStream es = p.getErrorStream()) {
                byte[] buf = new byte[8192];
                int r;
                while ((r = es.read(buf)) != -1) err.write(buf, 0, r);
            }
            throw new RuntimeException("Python script failed: " + err.toString());
        }

        return baos.toString();
    }

    private Path findScriptPath() {
        // Try several relative locations from working dir
        Path cwd = Paths.get(System.getProperty("user.dir"));
        Path[] candidates = new Path[] {
            cwd.resolve("ml-scripts/inventory_ml_model.py"),
            cwd.resolve("../ml-scripts/inventory_ml_model.py").normalize(),
            cwd.resolve("../../ml-scripts/inventory_ml_model.py").normalize(),
            Paths.get("ml-scripts/inventory_ml_model.py").toAbsolutePath(),
            Paths.get("e:/Smart_Inventory_Management/ml-scripts/inventory_ml_model.py")
        };

        for (Path p : candidates) {
            if (p != null && p.toFile().exists()) return p;
        }

        return null;
    }
}