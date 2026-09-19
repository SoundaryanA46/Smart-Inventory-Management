package com.inv.man.controller;


import com.inv.man.service.MLAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/ml-analysis")
@CrossOrigin(origins = {
        "https://smart-inventory-management-frontend.vercel.app",
        "https://smart-inventory-management-frontend-2indry9zv-waseel.onrender.com"
})
public class MLAnalysisController {
    
    @Autowired
    private MLAnalysisService mlAnalysisService;
    
    @GetMapping("/generate-report")
    public ResponseEntity<Map<String, Object>> generateReport(
            @RequestParam(defaultValue = "90") int lookbackDays) {
        try {
            Map<String, Object> report = mlAnalysisService.generateSmartReport(lookbackDays);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Failed to generate report: " + e.getMessage())
            );
        }
    }
    
    @GetMapping("/forecast/{productId}")
    public ResponseEntity<Map<String, Object>> forecastDemand(
            @PathVariable String productId,
            @RequestParam(defaultValue = "30") int forecastDays) {
        try {
            Map<String, Object> forecast = mlAnalysisService.forecastDemand(productId, forecastDays);
            return ResponseEntity.ok(forecast);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Forecast failed: " + e.getMessage())
            );
        }
    }
    
    @GetMapping("/reorder-analysis")
    public ResponseEntity<Map<String, Object>> getReorderAnalysis() {
        try {
            Map<String, Object> analysis = mlAnalysisService.calculateReorderPoints();
            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                Map.of("error", "Analysis failed: " + e.getMessage())
            );
        }
    }
    
    @GetMapping("/abc-analysis")
    public ResponseEntity<Map<String, Object>> getABCAnalysis() {
        try {
            Map<String, Object> analysis = mlAnalysisService.performABCAnalysis();
            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                Map.of("error", "ABC analysis failed: " + e.getMessage())
            );
        }
    }
    
    @GetMapping("/visualizations/{chartType}")
    public ResponseEntity<String> getVisualization(
            @PathVariable String chartType,
            @RequestParam(required = false) String productId) {
        try {
            String chartJson = mlAnalysisService.generateVisualization(chartType, productId);
            return ResponseEntity.ok()
                    .header("Content-Type", "application/json")
                    .body(chartJson);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                "{\"error\": \"Failed to generate visualization: " + e.getMessage() + "\"}"
            );
        }
    }
}