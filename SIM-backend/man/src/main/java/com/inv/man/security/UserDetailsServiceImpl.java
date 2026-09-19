package com.inv.man.security;

import com.inv.man.model.User;
import com.inv.man.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        // To Ensure user has at least ROLE_USER if roles are empty
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            user.getRoles().add("ROLE_USER");
        }

        return UserDetailsImpl.build(user);
    }
}