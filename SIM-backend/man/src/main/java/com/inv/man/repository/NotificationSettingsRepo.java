package com.inv.man.repository;

import com.inv.man.model.NotificationSettings;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationSettingsRepo
        extends MongoRepository<NotificationSettings, String> {
}

