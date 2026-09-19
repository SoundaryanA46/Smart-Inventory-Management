package com.inv.man.controller;

import com.inv.man.dto.MessageResponse;
import com.inv.man.dto.RegisterRequest;
import com.inv.man.model.User;
import com.inv.man.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.*;

@CrossOrigin(origins = {
        "https://smart-inventory-management-frontend.vercel.app",
        "https://smart-inventory-management-frontend-2indry9zv-waseel.onrender.com"
}, maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserManagementController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            // Remove passwords from response
            users.forEach(user -> user.setPassword(null));
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        try {
            return userRepository.findById(id)
                    .map(user -> {
                        user.setPassword(null);
                        return ResponseEntity.ok(user);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody RegisterRequest request) {
        try {
            if (userRepository.existsByUsername(request.getUsername())) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Username is already taken!"));
            }

            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Email is already in use!"));
            }

            User user = new User(
                    request.getUsername(),
                    request.getEmail(),
                    encoder.encode(request.getPassword()));

            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            // New users created by admin default to EMPLOYEE role
            user.getRoles().clear();
            user.getRoles().add("ROLE_EMPLOYEE");

            User savedUser = userRepository.save(user);
            savedUser.setPassword(null);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRole(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String role = request.get("role");
            if (role == null || (!role.equals("ROLE_ADMIN") && !role.equals("ROLE_EMPLOYEE"))) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Invalid role. Must be ROLE_ADMIN or ROLE_EMPLOYEE"));
            }

            user.getRoles().clear();
            user.getRoles().add(role);
            user.setUpdatedAt(new Date());

            User updatedUser = userRepository.save(user);
            updatedUser.setPassword(null);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            // Prevent admin from deleting their own account
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String currentUsername = auth != null ? auth.getName() : null;

            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getUsername().equals(currentUsername)) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: You cannot delete your own account"));
            }

            userRepository.delete(user);
            return ResponseEntity.ok(new MessageResponse("User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
}
