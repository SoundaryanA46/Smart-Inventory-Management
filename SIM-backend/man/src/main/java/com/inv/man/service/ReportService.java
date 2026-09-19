package com.inv.man.service;

import com.inv.man.model.InventoryTransaction;
import com.inv.man.model.Product;
import com.inv.man.repository.InventoryTransactionRepository;
import com.inv.man.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;

@Service
public class ReportService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryTransactionRepository transactionRepository;

    public String generateProductsCSV() {
        List<Product> products = productRepository.findByActiveTrue();
        StringBuilder csv = new StringBuilder();
        
        // Header
        csv.append("SKU,Name,Category,Current Stock,Minimum Stock,Unit,Unit Price,Cost Price,Supplier,Location,Status\n");
        
        // Data rows
        for (Product p : products) {
            csv.append(escapeCSV(p.getSku())).append(",");
            csv.append(escapeCSV(p.getName())).append(",");
            csv.append(escapeCSV(p.getCategory())).append(",");
            csv.append(p.getCurrentStock()).append(",");
            csv.append(p.getMinimumStock()).append(",");
            csv.append(escapeCSV(p.getUnit())).append(",");
            csv.append(p.getUnitPrice()).append(",");
            csv.append(p.getCostPrice()).append(",");
            csv.append(escapeCSV(p.getSupplier())).append(",");
            csv.append(escapeCSV(p.getLocation())).append(",");
            // Add status (Low Stock if currentStock <= minimumStock)
            String status = p.getCurrentStock() <= p.getMinimumStock() ? "LOW STOCK" : "OK";
            csv.append(status).append("\n");
        }
        
        // Add low-stock summary section
        List<Product> lowStockProducts = products.stream()
                .filter(p -> p.getCurrentStock() <= p.getMinimumStock())
                .toList();
        
        if (!lowStockProducts.isEmpty()) {
            csv.append("\n--- LOW STOCK ITEMS ---\n");
            csv.append("SKU,Name,Current Stock,Minimum Stock,Unit,Status\n");
            for (Product p : lowStockProducts) {
                csv.append(escapeCSV(p.getSku())).append(",");
                csv.append(escapeCSV(p.getName())).append(",");
                csv.append(p.getCurrentStock()).append(",");
                csv.append(p.getMinimumStock()).append(",");
                csv.append(escapeCSV(p.getUnit())).append(",");
                csv.append("LOW STOCK").append("\n");
            }
        }
        
        return csv.toString();
    }

    public byte[] generateProductsPDF() throws IOException {
        List<Product> products = productRepository.findByActiveTrue();
        List<Product> lowStockProducts = products.stream()
                .filter(p -> p.getCurrentStock() <= p.getMinimumStock())
                .toList();
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Title
        document.add(new Paragraph("Products Report")
                .setFontSize(18)
                .setBold()
                .setMarginBottom(10));
        document.add(new Paragraph("Generated on: " + new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()))
                .setFontSize(10)
                .setMarginBottom(5));
        document.add(new Paragraph("Total Products: " + products.size() + " | Low Stock Items: " + lowStockProducts.size())
                .setFontSize(10)
                .setMarginBottom(20));

        // Main Products Table
        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 2, 1.5f, 1, 1, 1, 1, 1, 0.8f}))
                .useAllAvailableWidth();

        // Header
        table.addHeaderCell("SKU");
        table.addHeaderCell("Name");
        table.addHeaderCell("Category");
        table.addHeaderCell("Stock");
        table.addHeaderCell("Min Stock");
        table.addHeaderCell("Unit");
        table.addHeaderCell("Unit Price");
        table.addHeaderCell("Location");
        table.addHeaderCell("Status");

        // Data rows
        for (Product p : products) {
            table.addCell(p.getSku() != null ? p.getSku() : "");
            table.addCell(p.getName() != null ? p.getName() : "");
            table.addCell(p.getCategory() != null ? p.getCategory() : "");
            table.addCell(String.valueOf(p.getCurrentStock()));
            table.addCell(String.valueOf(p.getMinimumStock()));
            table.addCell(p.getUnit() != null ? p.getUnit() : "");
            table.addCell(String.valueOf(p.getUnitPrice()));
            table.addCell(p.getLocation() != null ? p.getLocation() : "");
            String status = p.getCurrentStock() <= p.getMinimumStock() ? "LOW" : "OK";
            table.addCell(status);
        }

        document.add(table);
        
        // Add Low Stock Items Section
        if (!lowStockProducts.isEmpty()) {
            document.add(new Paragraph("\nLow Stock Items")
                    .setFontSize(14)
                    .setBold()
                    .setMarginTop(20)
                    .setMarginBottom(10));
            
            Table lowStockTable = new Table(UnitValue.createPercentArray(new float[]{1, 2, 1, 1, 1}))
                    .useAllAvailableWidth();
            
            lowStockTable.addHeaderCell("SKU");
            lowStockTable.addHeaderCell("Name");
            lowStockTable.addHeaderCell("Current Stock");
            lowStockTable.addHeaderCell("Minimum Stock");
            lowStockTable.addHeaderCell("Unit");
            
            for (Product p : lowStockProducts) {
                lowStockTable.addCell(p.getSku() != null ? p.getSku() : "");
                lowStockTable.addCell(p.getName() != null ? p.getName() : "");
                lowStockTable.addCell(String.valueOf(p.getCurrentStock()));
                lowStockTable.addCell(String.valueOf(p.getMinimumStock()));
                lowStockTable.addCell(p.getUnit() != null ? p.getUnit() : "");
            }
            
            document.add(lowStockTable);
        }
        
        document.close();

        return baos.toByteArray();
    }

    public String generateTransactionsCSV(Date startDate, Date endDate) {
        List<InventoryTransaction> transactions;
        if (startDate != null && endDate != null) {
            transactions = transactionRepository.findByTransactionDateBetween(startDate, endDate);
        } else {
            transactions = transactionRepository.findAllByOrderByTransactionDateDesc();
        }

        StringBuilder csv = new StringBuilder();
        
        // Header
        csv.append("Date,Product SKU,Product Name,Type,Quantity,Unit Price,Total Value,Reference,Notes,Performed By\n");
        
        // Data rows
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        for (InventoryTransaction t : transactions) {
            csv.append(sdf.format(t.getTransactionDate())).append(",");
            csv.append(escapeCSV(t.getProductSku())).append(",");
            csv.append(escapeCSV(t.getProductName())).append(",");
            csv.append(t.getType()).append(",");
            csv.append(t.getQuantity()).append(",");
            csv.append(t.getUnitPrice()).append(",");
            csv.append(t.getTotalValue()).append(",");
            csv.append(escapeCSV(t.getReference())).append(",");
            csv.append(escapeCSV(t.getNotes())).append(",");
            csv.append(escapeCSV(t.getPerformedBy())).append("\n");
        }
        
        return csv.toString();
    }

    public byte[] generateTransactionsPDF(Date startDate, Date endDate) throws IOException {
        List<InventoryTransaction> transactions;
        if (startDate != null && endDate != null) {
            transactions = transactionRepository.findByTransactionDateBetween(startDate, endDate);
        } else {
            transactions = transactionRepository.findAllByOrderByTransactionDateDesc();
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Title
        document.add(new Paragraph("Transaction History Report")
                .setFontSize(18)
                .setBold()
                .setMarginBottom(10));
        
        String dateRange = "";
        if (startDate != null && endDate != null) {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            dateRange = "Period: " + sdf.format(startDate) + " to " + sdf.format(endDate);
        }
        document.add(new Paragraph(dateRange).setFontSize(10).setMarginBottom(5));
        document.add(new Paragraph("Generated on: " + new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()))
                .setFontSize(10)
                .setMarginBottom(20));

        // Table
        Table table = new Table(UnitValue.createPercentArray(new float[]{1.5f, 1.5f, 2, 0.8f, 0.8f, 1, 1, 1.5f}))
                .useAllAvailableWidth();

        // Header
        table.addHeaderCell("Date");
        table.addHeaderCell("SKU");
        table.addHeaderCell("Product");
        table.addHeaderCell("Type");
        table.addHeaderCell("Qty");
        table.addHeaderCell("Unit Price");
        table.addHeaderCell("Total");
        table.addHeaderCell("Reference");

        // Data rows
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm");
        for (InventoryTransaction t : transactions) {
            table.addCell(sdf.format(t.getTransactionDate()));
            table.addCell(t.getProductSku() != null ? t.getProductSku() : "");
            table.addCell(t.getProductName() != null ? t.getProductName() : "");
            table.addCell(t.getType().toString());
            table.addCell(String.valueOf(t.getQuantity()));
            table.addCell(String.valueOf(t.getUnitPrice()));
            table.addCell(String.valueOf(t.getTotalValue()));
            table.addCell(t.getReference() != null ? t.getReference() : "");
        }

        document.add(table);
        document.close();

        return baos.toByteArray();
    }

    private String escapeCSV(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
