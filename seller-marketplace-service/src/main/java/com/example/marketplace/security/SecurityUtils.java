package com.example.marketplace.security;

import com.example.marketplace.exception.MarketplaceException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new MarketplaceException("User not authenticated", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED_REQUEST");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
            return userDetails.getUsername();
        } else if (principal instanceof java.security.Principal p) {
            return p.getName();
        }
        return principal.toString();
    }
}
