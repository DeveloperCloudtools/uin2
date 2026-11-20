CREATE TABLE `ReservationsServices` (
    `reservation_service_id` INTEGER NOT NULL AUTO_INCREMENT,
    `outlet_id` INTEGER NOT NULL,
    `outlet_item_id` INTEGER NOT NULL,
    `start_at` DATETIME(0) NOT NULL,
    `end_at` DATETIME(0) NOT NULL,
    `duration_minutes` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    `source` VARCHAR(20) NOT NULL DEFAULT 'online',
    `customer_name` VARCHAR(150) NULL,
    `customer_surname` VARCHAR(150) NULL,
    `customer_email` VARCHAR(255) NULL,
    `customer_phone` VARCHAR(30) NULL,
    `customer_country` VARCHAR(30) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_by` VARCHAR(150) NULL,

    INDEX `idx_reservations_services_outlet_item` (`outlet_item_id`),
    INDEX `idx_reservations_services_outlet_start` (`outlet_id`, `start_at`),
    INDEX `idx_reservations_services_outlet_status_start` (`outlet_id`, `status`, `start_at`),
    PRIMARY KEY (`reservation_service_id`),
    CONSTRAINT `fk_reservations_services_outlet_items`
        FOREIGN KEY (`outlet_item_id`) REFERENCES `OutletItems` (`outlet_item_id`)
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT `fk_reservations_services_outlets`
        FOREIGN KEY (`outlet_id`) REFERENCES `Outlets` (`outlet_id`)
        ON DELETE NO ACTION ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
