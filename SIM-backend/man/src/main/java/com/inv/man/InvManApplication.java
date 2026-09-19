package com.inv.man;

import com.inv.man.model.User;
import com.inv.man.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Date;

@SpringBootApplication
@EnableMongoRepositories
public class InvManApplication implements CommandLineRunner {

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	public static void main(String[] args) {
		SpringApplication.run(InvManApplication.class, args);
	}

	@Override
	public void run(String... args) {
		// Bootstrap admin user if it doesn't exist
		if (!userRepository.existsByUsername("admin")) {
			User admin = new User();
			admin.setUsername("admin");
			admin.setEmail("admin@inventory.com");
			admin.setPassword(passwordEncoder.encode("admin123"));
			admin.setFirstName("Admin");
			admin.setLastName("User");
			admin.getRoles().clear();
			admin.getRoles().add("ROLE_ADMIN");
			admin.setEnabled(true);
			admin.setCreatedAt(new Date());
			admin.setUpdatedAt(new Date());
			userRepository.save(admin);
			System.out.println("Admin user created: username=admin, password=admin123");
		}
	}
}