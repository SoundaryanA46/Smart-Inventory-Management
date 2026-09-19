package com.inv.man.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private int jwtExpirationMs;

    private Key key;

    // To Initialize key after properties are set
    private Key getKey() {
        if (key == null) {
            try {
                // To Use the secret as a plain text key
                byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
                if (keyBytes.length < 32) {
                    // To Pad or extend the key to meet minimum length requirements
                    byte[] padded = new byte[32];
                    System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
                    for (int i = keyBytes.length; i < 32; i++) {
                        padded[i] = (byte) i;
                    }
                    keyBytes = padded;
                }
                key = Keys.hmacShaKeyFor(keyBytes);
            } catch (Exception e) {
                throw new RuntimeException("Failed to initialize JWT key", e);
            }
        }
        return key;
    }

    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getKey())
                    .build()
                    .parseClaimsJws(authToken);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}