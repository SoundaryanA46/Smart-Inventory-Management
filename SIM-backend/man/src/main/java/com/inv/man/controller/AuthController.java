package com.inv.man.controller;

import com.inv.man.dto.AuthRequest;
import com.inv.man.dto.AuthResponse;
import com.inv.man.dto.CheckResponse;
import com.inv.man.dto.MessageResponse;
import com.inv.man.dto.RegisterRequest;
import com.inv.man.model.User;
import com.inv.man.repository.UserRepository;
import com.inv.man.security.JwtUtils;
import com.inv.man.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@CrossOrigin(origins = {
                "https://smart-inventory-management-frontend.vercel.app",
                "https://smart-inventory-management-frontend-2indry9zv-waseel.onrender.com"
}, maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

        private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

        @Autowired
        AuthenticationManager authenticationManager;

        @Autowired
        UserRepository userRepository;

        @Autowired
        PasswordEncoder encoder;

        @Autowired
        JwtUtils jwtUtils;

        @PostMapping("/signin")
        public ResponseEntity<?> authenticateUser(@Valid @RequestBody AuthRequest loginRequest) {

                // To Validate input
                if (loginRequest == null ||
                                loginRequest.getUsername() == null ||
                                loginRequest.getUsername().trim().isEmpty()) {
                        return ResponseEntity.badRequest()
                                        .body(new MessageResponse("Error: Username is required!"));
                }

                if (loginRequest.getPassword() == null ||
                                loginRequest.getPassword().trim().isEmpty()) {
                        return ResponseEntity.badRequest()
                                        .body(new MessageResponse("Error: Password is required!"));
                }

                try {
                        logger.info("Attempting to authenticate user: {}", loginRequest.getUsername());
                        Authentication authentication = authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(
                                                        loginRequest.getUsername(),
                                                        loginRequest.getPassword()));

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        String jwt = jwtUtils.generateJwtToken(authentication);

                        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
                        logger.info("User authenticated successfully: {}", userDetails.getUsername());

                        AuthResponse authResponse = new AuthResponse(
                                        jwt,
                                        userDetails.getId(),
                                        userDetails.getUsername(),
                                        userDetails.getEmail(),
                                        userDetails.getAuthorities().stream()
                                                        .map(item -> item.getAuthority())
                                                        .collect(Collectors.toSet()));

                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_JSON);

                        return ResponseEntity.ok()
                                        .headers(headers)
                                        .body(authResponse);
                } catch (Exception e) {
                        logger.error("Authentication failed for user: {}", loginRequest.getUsername(), e);
                        return ResponseEntity.badRequest()
                                        .body(new MessageResponse("Error: Invalid username or password!"));
                }
        }

        @PostMapping("/signup")
        public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
                logger.info("Signup request received for username: {}",
                                signUpRequest != null ? signUpRequest.getUsername() : "null");

                if (signUpRequest == null) {
                        logger.error("Signup request is null");
                        return ResponseEntity.badRequest()
                                        .body(new MessageResponse("Error: Request body cannot be null!"));
                }

                // To Validate input
                if (signUpRequest.getUsername() == null ||
                                signUpRequest.getUsername().trim().length() < 3) {
                        return ResponseEntity.badRequest()
                                        .body(new MessageResponse("Error: Username must be at least 3 characters!"));
                }

                // Username must be alphanumeric + underscores only (prevent injection /
                // encoding attacks)
                if (!signUpRequest.getUsername().matches("^[a-zA-Z0-9_]+$")) {
                        return ResponseEntity.badRequest()
                                        .body(new MessageResponse(
                                                        "Error: Username can only contain letters, numbers, and underscores!"));
                }

                if (signUpRequest.getEmail() == null ||
                                !signUpRequest.getEmail().contains("@")) {
                        return ResponseEntity.badRequest()
                                        .body(new MessageResponse("Error: Invalid email address!"));
                }

                if (signUpRequest.getPassword() == null ||
                                signUpRequest.getPassword().length() < 6) {
                        return ResponseEntity.badRequest()
                                        .body(new MessageResponse("Error: Password must be at least 6 characters!"));
                }

                if (userRepository.existsByUsername(signUpRequest.getUsername())) {
                        return ResponseEntity.badRequest()
                                        .body(new MessageResponse("Error: Username is already taken!"));
                }

                if (userRepository.existsByEmail(signUpRequest.getEmail())) {
                        return ResponseEntity.badRequest()
                                        .body(new MessageResponse("Error: Email is already in use!"));
                }

                // To Handle nullable firstName and lastName
                String firstName = signUpRequest.getFirstName() != null ? signUpRequest.getFirstName() : "";
                String lastName = signUpRequest.getLastName() != null ? signUpRequest.getLastName() : "";

                // ToCreate new user
                try {
                        User user = new User(
                                        signUpRequest.getUsername(),
                                        signUpRequest.getEmail(),
                                        encoder.encode(signUpRequest.getPassword()));

                        user.setFirstName(firstName);
                        user.setLastName(lastName);

                        logger.info("Saving user to MongoDB: {}", user.getUsername());
                        User savedUser = userRepository.save(user);
                        logger.info("User saved successfully with ID: {}", savedUser.getId());

                        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
                } catch (Exception e) {
                        logger.error("Error saving user to MongoDB: ", e);
                        return ResponseEntity.status(500)
                                        .body(new MessageResponse("Error: Failed to register user. Please try again."));
                }
        }

        @GetMapping("/check-username/{username}")
        public ResponseEntity<?> checkUsername(@PathVariable String username) {
                if (username == null || username.trim().length() < 3) {
                        return ResponseEntity.badRequest()
                                        .body(new MessageResponse("Username must be at least 3 characters"));
                }
                boolean exists = userRepository.existsByUsername(username);
                return ResponseEntity.ok(new CheckResponse(exists));
        }

        @GetMapping("/check-email/{email}")
        public ResponseEntity<?> checkEmail(@PathVariable String email) {
                if (email == null || !email.contains("@")) {
                        return ResponseEntity.badRequest()
                                        .body(new MessageResponse("Invalid email format"));
                }
                boolean exists = userRepository.existsByEmail(email);
                return ResponseEntity.ok(new CheckResponse(exists));
        }
}