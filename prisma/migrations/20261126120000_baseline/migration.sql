-- CreateTable
CREATE TABLE IF NOT EXISTS `AccessPointGroups` (
    `access_point_group_id` INTEGER NOT NULL AUTO_INCREMENT,
    `access_point_group_name` VARCHAR(150) NULL,
    `schedule_id` INTEGER NULL,
    `max_capacity` INTEGER NULL,
    `allows_reservations` BOOLEAN NOT NULL DEFAULT false,
    `outlet_id` INTEGER NULL,

    PRIMARY KEY (`access_point_group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `AccessPoints` (
    `access_point_id` INTEGER NOT NULL AUTO_INCREMENT,
    `access_point_sub_group_id` INTEGER NULL,
    `access_point_name` VARCHAR(150) NULL,
    `products` JSON NULL,
    `product_cat` JSON NULL,
    `activities` JSON NULL,
    `active` BOOLEAN NULL DEFAULT true,
    `outlet_id` INTEGER NULL,
    `access_point_group_id` INTEGER NULL,
    `typology_id` INTEGER NULL,
    `prevent_combination` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`access_point_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `EmailSettings` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `reply_email` VARCHAR(255) NOT NULL,
    `reply_password` VARCHAR(255) NOT NULL,
    `sending_server` VARCHAR(255) NOT NULL,
    `sending_port` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `EmailTemplates` (
    `email_template_id` INTEGER NOT NULL AUTO_INCREMENT,
    `email_title1` VARCHAR(255) NULL,
    `email_title2` VARCHAR(255) NULL,
    `email_title3` VARCHAR(255) NULL,
    `email_title4` VARCHAR(255) NULL,
    `email_title5` VARCHAR(255) NULL,
    `email_body1` TEXT NULL,
    `email_body2` TEXT NULL,
    `email_body3` TEXT NULL,
    `email_body4` TEXT NULL,
    `email_body5` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` INTEGER NULL,
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_by` INTEGER NULL,

    PRIMARY KEY (`email_template_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `FormTemplates` (
    `form_id` INTEGER NOT NULL AUTO_INCREMENT,
    `form_type` TINYINT NULL,
    `fields1` JSON NULL,
    `fields2` JSON NULL,
    `fields3` JSON NULL,
    `fields4` JSON NULL,
    `fields5` JSON NULL,
    `available_activities` JSON NULL,
    `available_products` JSON NULL,
    `available_product_cats` JSON NULL,

    PRIMARY KEY (`form_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `GroupUsers` (
    `user_group_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `perms` JSON NULL,

    PRIMARY KEY (`user_group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Languages` (
    `lang_id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang_name` VARCHAR(50) NOT NULL,
    `lang_order` INTEGER NULL,
    `lang_identifier` VARCHAR(2) NULL,

    PRIMARY KEY (`lang_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Personalize` (
    `personalize_id` INTEGER NOT NULL AUTO_INCREMENT,
    `page_model` INTEGER NULL,
    `primary_color` VARCHAR(50) NULL,
    `secondary_color` VARCHAR(50) NULL,
    `background_color` VARCHAR(50) NULL,
    `foreground_color` VARCHAR(50) NULL,
    `card_colors` JSON NULL,
    `background_image` VARCHAR(255) NULL,
    `logo` VARCHAR(255) NULL,
    `bar_text` VARCHAR(255) NULL,
    `bar_text_details` VARCHAR(255) NULL,
    `icon_color` VARCHAR(50) NULL,
    `card_text_font` VARCHAR(45) NULL,
    `card_text_color` VARCHAR(45) NULL,
    `card_text_size` VARCHAR(45) NULL,

    PRIMARY KEY (`personalize_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Preparation` (
    `preparation_id` INTEGER NOT NULL AUTO_INCREMENT,
    `preparation_group_id` INTEGER NULL,
    `preparation_name1` VARCHAR(150) NULL,
    `preparation_name2` VARCHAR(150) NULL,
    `preparation_name3` VARCHAR(150) NULL,
    `preparation_name4` VARCHAR(150) NULL,
    `preparation_name5` VARCHAR(150) NULL,

    PRIMARY KEY (`preparation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `PreparationGroups` (
    `preparation_group_id` INTEGER NOT NULL AUTO_INCREMENT,
    `preparation_group_name` VARCHAR(150) NULL,

    PRIMARY KEY (`preparation_group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `last_login` DATETIME(0) NULL,
    `password` VARCHAR(255) NOT NULL,
    `type` TINYINT NULL,
    `user_type_id` INTEGER NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `expired_at` DATE NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Users_FO` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NULL,
    `access_code` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `access_code_expiration` DATETIME(0) NULL,
    `password` VARCHAR(255) NULL,
    `session_token` VARCHAR(255) NULL,
    `session_expires_at` DATETIME(0) NULL,
    `account_duration` INTEGER NOT NULL DEFAULT 172800,
    `user_type_id` INTEGER NULL,

    UNIQUE INDEX `uq_users_email`(`email`),
    UNIQUE INDEX `uq_users_access_code`(`access_code`),
    UNIQUE INDEX `session_token`(`session_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `chatbotsStay` (
    `propertyID` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `provider` TEXT NULL,
    `hijiffyToken` TEXT NULL,
    `hijiffyCampaign` TEXT NULL,
    `staychatToken` TEXT NULL,
    `staychatPhoneID` TEXT NULL,
    `staychatWebhook` VARCHAR(150) NULL,

    PRIMARY KEY (`propertyID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `myStayDetails` (
    `recordID` INTEGER NOT NULL AUTO_INCREMENT,
    `requestDate` DATETIME(0) NOT NULL,
    `propertyTag` VARCHAR(255) NOT NULL,
    `protelMpeHotel` VARCHAR(255) NOT NULL,
    `protelReservationID` VARCHAR(255) NOT NULL,
    `protelRoomID` VARCHAR(255) NOT NULL,
    `protelGuestID` VARCHAR(255) NOT NULL,
    `protelGuestEmail` VARCHAR(255) NULL,
    `protelGuestPhone` VARCHAR(32) NULL,
    `protelValidFrom` DATETIME(0) NOT NULL,
    `protelValidUntil` DATETIME(0) NOT NULL,
    `control` VARCHAR(1) NOT NULL,
    `reponseToken` VARCHAR(255) NULL,
    `reponseURL` VARCHAR(255) NULL,
    `protelBookingID` VARCHAR(255) NOT NULL,
    `protelRoomTypeID` VARCHAR(255) NOT NULL,
    `responseDate` DATETIME(0) NULL,
    `vatNo` VARCHAR(255) NULL,
    `child` INTEGER NOT NULL DEFAULT 0,
    `adult` INTEGER NOT NULL DEFAULT 1,
    `country` VARCHAR(255) NOT NULL,
    `city` VARCHAR(255) NOT NULL,
    `postalCode` VARCHAR(20) NULL,
    `nationality` VARCHAR(255) NOT NULL,
    `birthCountry` VARCHAR(255) NOT NULL,
    `birthDate` DATETIME(0) NOT NULL,
    `identificationDocument` VARCHAR(255) NOT NULL,
    `documentIssueDate` DATETIME(0) NOT NULL,
    `documentExpirationDate` DATETIME(0) NOT NULL,
    `Resend` VARCHAR(1) NOT NULL,
    `ResendDate` DATETIME(0) NOT NULL,
    `protelSalutation` VARCHAR(50) NULL,
    `protelGuestFirstName` VARCHAR(255) NULL,
    `protelGuestLastName` VARCHAR(255) NULL,
    `protelCountryID` INTEGER NULL,
    `protelAddress` VARCHAR(255) NULL,
    `protelGuestMobilePhone` VARCHAR(32) NULL,
    `protelDocType` VARCHAR(100) NULL,
    `protelProfileType` VARCHAR(100) NULL,
    `preCheckinControl` VARCHAR(1) NOT NULL DEFAULT 'N',
    `checkinControl` VARCHAR(1) NOT NULL DEFAULT 'N',

    PRIMARY KEY (`recordID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `schedules` (
    `schedule_id` INTEGER NOT NULL AUTO_INCREMENT,
    `schedule_json` JSON NOT NULL,
    `slotDuration` INTEGER NOT NULL DEFAULT 30,
    `exceptions` JSON NULL,

    PRIMARY KEY (`schedule_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Areas` (
    `area_id` INTEGER NOT NULL AUTO_INCREMENT,
    `area_name1` VARCHAR(150) NULL,
    `area_name2` VARCHAR(150) NULL,
    `area_name3` VARCHAR(150) NULL,
    `area_name4` VARCHAR(150) NULL,
    `area_name5` VARCHAR(150) NULL,
    `visible` BOOLEAN NULL DEFAULT true,
    `area_icon` VARCHAR(255) NULL,
    `area_card_background` VARCHAR(255) NULL,

    PRIMARY KEY (`area_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Menus` (
    `menu_id` INTEGER NOT NULL AUTO_INCREMENT,
    `outlet_id` INTEGER NULL,
    `menu_name1` VARCHAR(150) NULL,
    `menu_name2` VARCHAR(150) NULL,
    `menu_name3` VARCHAR(150) NULL,
    `menu_name4` VARCHAR(150) NULL,
    `menu_name5` VARCHAR(150) NULL,
    `visible` BOOLEAN NULL DEFAULT true,
    `menu_icon` VARCHAR(255) NULL,
    `menu_card_background` VARCHAR(255) NULL,
    `has_submenus` BOOLEAN NULL DEFAULT true,

    INDEX `outlet_id`(`outlet_id`),
    PRIMARY KEY (`menu_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Outlets` (
    `outlet_id` INTEGER NOT NULL AUTO_INCREMENT,
    `area_id` INTEGER NULL,
    `outlet_name1` VARCHAR(150) NULL,
    `outlet_name2` VARCHAR(150) NULL,
    `outlet_name3` VARCHAR(150) NULL,
    `outlet_name4` VARCHAR(150) NULL,
    `outlet_name5` VARCHAR(150) NULL,
    `visible` BOOLEAN NULL DEFAULT true,
    `outlet_icon` VARCHAR(255) NULL,
    `outlet_card_background` VARCHAR(255) NULL,
    `reservation` INTEGER NULL,
    `order` INTEGER NULL,
    `schedule_id` INTEGER NULL,
    `schedule_visible` BOOLEAN NOT NULL DEFAULT false,
    `schedule_visible_part` INTEGER NULL DEFAULT 2,
    `access_points` BOOLEAN NOT NULL DEFAULT false,
    `associate_schedule` BOOLEAN NOT NULL DEFAULT false,
    `instant_order` BOOLEAN NOT NULL DEFAULT false,
    `service_reservation` BOOLEAN NOT NULL DEFAULT false,
    `takeaway_order` BOOLEAN NOT NULL DEFAULT false,
    `reservation_item_id` INTEGER NULL,
    `combine_tables` BOOLEAN NOT NULL DEFAULT false,

    INDEX `area_id`(`area_id`),
    PRIMARY KEY (`outlet_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Submenus` (
    `submenu_id` INTEGER NOT NULL AUTO_INCREMENT,
    `menu_id` INTEGER NULL,
    `submenu_name1` VARCHAR(150) NULL,
    `submenu_name2` VARCHAR(150) NULL,
    `submenu_name3` VARCHAR(150) NULL,
    `submenu_name4` VARCHAR(150) NULL,
    `submenu_name5` VARCHAR(150) NULL,
    `visible` BOOLEAN NULL DEFAULT true,
    `submenu_icon` VARCHAR(255) NULL,
    `submenu_card_background` VARCHAR(255) NULL,

    INDEX `menu_id`(`menu_id`),
    PRIMARY KEY (`submenu_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `MenuSubmenuContent` (
    `content_id` INTEGER NOT NULL AUTO_INCREMENT,
    `menu_id` INTEGER NULL,
    `submenu_id` INTEGER NULL,
    `content` JSON NOT NULL,
    `banner_url` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` INTEGER NOT NULL,
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_by` INTEGER NULL,

    PRIMARY KEY (`content_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `ItemFamily` (
    `item_family_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_group_id` INTEGER NULL,
    `item_family_name` VARCHAR(150) NULL,

    PRIMARY KEY (`item_family_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `ItemGroup` (
    `item_group_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_group_name` VARCHAR(150) NULL,

    PRIMARY KEY (`item_group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `ItemSubFamily` (
    `item_subfamily_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_family_id` INTEGER NULL,
    `category_name1` VARCHAR(150) NULL,
    `category_name2` VARCHAR(150) NULL,
    `category_name3` VARCHAR(150) NULL,
    `category_name4` VARCHAR(150) NULL,
    `category_name5` VARCHAR(150) NULL,

    PRIMARY KEY (`item_subfamily_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Items` (
    `item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_cat_id` INTEGER NULL,
    `item_name1` VARCHAR(150) NULL,
    `item_name2` VARCHAR(150) NULL,
    `item_name3` VARCHAR(150) NULL,
    `item_name4` VARCHAR(150) NULL,
    `item_name5` VARCHAR(150) NULL,
    `item_description1` VARCHAR(150) NULL,
    `item_description2` VARCHAR(150) NULL,
    `item_description3` VARCHAR(150) NULL,
    `item_description4` VARCHAR(150) NULL,
    `item_description5` VARCHAR(150) NULL,
    `item_image_url` VARCHAR(150) NULL,
    `item_type` VARCHAR(45) NULL,
    `item_price` VARCHAR(45) NULL,
    `reservation` VARCHAR(1) NULL,
    `checkin` VARCHAR(1) NULL,
    `room` VARCHAR(1) NULL,
    `instantOrder` VARCHAR(1) NULL,
    `sendStaychat` VARCHAR(1) NULL,
    `staychatWebhook` VARCHAR(255) NULL,
    `visiblePrice` VARCHAR(1) NULL,
    `allowReservations` VARCHAR(1) NULL,
    `scheduleID` VARCHAR(1) NULL,
    `preparation` JSON NULL,
    `item_vat` VARCHAR(45) NULL,
    `item_duration` INTEGER NULL,
    `takeaway_order` BOOLEAN NOT NULL DEFAULT false,
    `cart` BOOLEAN NOT NULL DEFAULT false,
    `order` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `OutletReservationItems` (
    `outlet_reservation_item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `outlet_id` INTEGER NOT NULL,
    `item_id` INTEGER NOT NULL,
    `shift_index` INTEGER NOT NULL,

    INDEX `idx_outlet_reservation_items_outlet_id`(`outlet_id`),
    INDEX `idx_outlet_reservation_items_item_id`(`item_id`),
    PRIMARY KEY (`outlet_reservation_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `availability` (
    `availability_id` BIGINT NOT NULL AUTO_INCREMENT,
    `typology_id` BIGINT NOT NULL,
    `availability_date` DATE NOT NULL,
    `start_time` TIME(0) NOT NULL,
    `end_time` TIME(0) NOT NULL,
    `total_capacity` INTEGER NOT NULL,
    `available_capacity` INTEGER NOT NULL,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `room_id` INTEGER NOT NULL DEFAULT 0,
    `refText` VARCHAR(255) NULL,
    `updatedBy` VARCHAR(100) NULL,

    INDEX `idx_availability_date_typology`(`availability_date`, `typology_id`),
    UNIQUE INDEX `uq_availability_typology_date_start_room`(`typology_id`, `availability_date`, `start_time`, `room_id`),
    PRIMARY KEY (`availability_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `typologies` (
    `typology_id` BIGINT NOT NULL AUTO_INCREMENT,
    `outlet_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `seats` INTEGER NULL,

    UNIQUE INDEX `uq_typologies_outlet_name`(`outlet_id`, `name`),
    PRIMARY KEY (`typology_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `OutletItems` (
    `outlet_item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_id` INTEGER NOT NULL,
    `outlet_id` INTEGER NOT NULL,
    `item_name1` VARCHAR(150) NULL,
    `item_name2` VARCHAR(150) NULL,
    `item_name3` VARCHAR(150) NULL,
    `item_name4` VARCHAR(150) NULL,
    `item_name5` VARCHAR(150) NULL,
    `item_description1` VARCHAR(150) NULL,
    `item_description2` VARCHAR(150) NULL,
    `item_description3` VARCHAR(150) NULL,
    `item_description4` VARCHAR(150) NULL,
    `item_description5` VARCHAR(150) NULL,
    `item_image_url` VARCHAR(150) NULL,
    `item_type` VARCHAR(45) NULL,
    `item_price` DECIMAL(10, 2) NULL,
    `reservation` VARCHAR(1) NULL,
    `checkin` VARCHAR(1) NULL,
    `room` VARCHAR(1) NULL,
    `instantOrder` VARCHAR(1) NULL,
    `sendStaychat` VARCHAR(1) NULL,
    `staychatWebhook` VARCHAR(255) NULL,
    `visiblePrice` VARCHAR(1) NULL,
    `allowReservations` VARCHAR(1) NULL,
    `scheduleID` VARCHAR(1) NULL,
    `preparation` JSON NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `item_vat` VARCHAR(45) NULL,
    `item_duration` INTEGER NULL,
    `schedule_id` INTEGER NULL,
    `shift_index` INTEGER NULL,
    `is_reservation_item` BOOLEAN NOT NULL DEFAULT false,
    `cart` BOOLEAN NOT NULL DEFAULT false,
    `takeaway_order` BOOLEAN NOT NULL DEFAULT false,
    `order` BOOLEAN NOT NULL DEFAULT false,
    `product_accept` BOOLEAN NULL DEFAULT false,
    `product_accept_campaign_id` INTEGER NULL,
    `product_in_progress` BOOLEAN NULL DEFAULT false,
    `product_in_progress_campaign_id` INTEGER NULL,
    `product_completed` BOOLEAN NULL DEFAULT false,
    `product_completed_campaign_id` INTEGER NULL,
    `product_cancelled` BOOLEAN NULL DEFAULT false,
    `product_cancelled_campaign_id` INTEGER NULL,
    `service_confirmed` BOOLEAN NULL DEFAULT false,
    `service_confirmed_campaign_id` INTEGER NULL,
    `service_modified` BOOLEAN NULL DEFAULT false,
    `service_modified_campaign_id` INTEGER NULL,
    `service_cancelled` BOOLEAN NULL DEFAULT false,
    `service_cancelled_campaign_id` INTEGER NULL,
    `reservation_confirmed` BOOLEAN NULL DEFAULT false,
    `reservation_confirmed_campaign_id` INTEGER NULL,
    `reservation_cancelled` BOOLEAN NULL DEFAULT false,
    `reservation_cancelled_campaign_id` INTEGER NULL,

    INDEX `idx_outlet_items_item_id`(`item_id`),
    INDEX `idx_outlet_items_outlet_id`(`outlet_id`),
    PRIMARY KEY (`outlet_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `notifications` (
    `notification_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user_created`(`user_id`, `created_at` DESC),
    INDEX `idx_user_unread`(`user_id`, `is_read`),
    PRIMARY KEY (`notification_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `OrderStatus` (
    `order_status_id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_status_name` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`order_status_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Orders` (
    `order_id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_name` VARCHAR(150) NULL,
    `customer_name` VARCHAR(150) NULL,
    `order_status` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_by` VARCHAR(150) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `price` DECIMAL(10, 2) NULL,
    `outlet_id` INTEGER NULL,
    `menu_id` INTEGER NULL,
    `submenu_id` INTEGER NULL,

    INDEX `idx_order_status`(`order_status`),
    PRIMARY KEY (`order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Reservations` (
    `reservation_id` INTEGER NOT NULL AUTO_INCREMENT,
    `outlet_id` INTEGER NOT NULL,
    `outlet_item_id` INTEGER NOT NULL,
    `pax_size` INTEGER NOT NULL,
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
    `typology_id` BIGINT NULL,

    INDEX `idx_reservations_outlet_item`(`outlet_item_id`),
    INDEX `idx_reservations_outlet_start`(`outlet_id`, `start_at`),
    INDEX `idx_reservations_outlet_status_interval`(`outlet_id`, `status`, `start_at`, `end_at`),
    INDEX `idx_reservations_typology`(`typology_id`),
    PRIMARY KEY (`reservation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `ReservationsServices` (
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

    INDEX `idx_reservations_services_outlet_item`(`outlet_item_id`),
    INDEX `idx_reservations_services_outlet_start`(`outlet_id`, `start_at`),
    INDEX `idx_reservations_services_outlet_status_start`(`outlet_id`, `status`, `start_at`),
    PRIMARY KEY (`reservation_service_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `IvaRates` (
    `iva_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `rate` DECIMAL(5, 2) NOT NULL,
    `country_code` VARCHAR(2) NULL DEFAULT 'PT',

    PRIMARY KEY (`iva_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `ReservationTableAllocations` (
    `reservation_table_allocation_id` INTEGER NOT NULL AUTO_INCREMENT,
    `reservation_id` INTEGER NOT NULL,
    `typology_id` BIGINT NOT NULL,
    `room_id` INTEGER NOT NULL DEFAULT 0,
    `table_count` INTEGER NOT NULL,

    INDEX `idx_reservation_table_allocations_reservation`(`reservation_id`),
    INDEX `idx_reservation_table_allocations_typology`(`typology_id`),
    PRIMARY KEY (`reservation_table_allocation_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `StaychatCampaigns` (
    `staychat_campaign_id` INTEGER NOT NULL AUTO_INCREMENT,
    `campaign_name` VARCHAR(200) NULL,
    `campaign_id` VARCHAR(200) NULL,
    `createdAt` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`staychat_campaign_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `UsersBOType` (
    `userBOTypeID` INTEGER NOT NULL AUTO_INCREMENT,
    `userName` VARCHAR(100) NULL,
    `userDesc` VARCHAR(255) NULL,

    PRIMARY KEY (`userBOTypeID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `UsersFOType` (
    `userBOTypeID` INTEGER NOT NULL AUTO_INCREMENT,
    `userName` VARCHAR(100) NULL,
    `userDesc` VARCHAR(255) NULL,

    PRIMARY KEY (`userBOTypeID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Permissions` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `permission_key` VARCHAR(150) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `module` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `permission_key`(`permission_key`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `RolePermissions` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `permission_id`(`permission_id`),
    UNIQUE INDEX `UQ_RolePermission`(`role_id`, `permission_id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `UserPermissions` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,
    `effect` ENUM('ALLOW', 'DENY') NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `permission_id`(`permission_id`),
    UNIQUE INDEX `UQ_UserPermission`(`user_id`, `permission_id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `GuestsCheckinsReservations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reservation_number` VARCHAR(100) NOT NULL,
    `room_number` VARCHAR(50) NULL,
    `checkin_date` DATETIME(0) NULL,
    `checkout_date` DATETIME(0) NULL,
    `reservation_adults` INTEGER NULL,
    `reservation_childs` INTEGER NULL,
    `reservation_status` VARCHAR(100) NULL,
    `guest_id` INTEGER NULL,
    `guest_type` ENUM('titular', 'acompanhante') NOT NULL DEFAULT 'titular',
    `guest_name` VARCHAR(150) NULL,
    `guest_surname` VARCHAR(150) NULL,
    `birth_date` DATETIME(0) NULL,
    `gender` VARCHAR(10) NULL,
    `nationality` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `email` VARCHAR(255) NULL,
    `phone_number` VARCHAR(50) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_guest_id` (`guest_id`),
    INDEX `idx_reservation_number` (`reservation_number`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Menus` ADD CONSTRAINT `Menus_ibfk_1` FOREIGN KEY (`outlet_id`) REFERENCES `Outlets`(`outlet_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Outlets` ADD CONSTRAINT `Outlets_ibfk_1` FOREIGN KEY (`area_id`) REFERENCES `Areas`(`area_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Submenus` ADD CONSTRAINT `Submenus_ibfk_1` FOREIGN KEY (`menu_id`) REFERENCES `Menus`(`menu_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `OutletReservationItems` ADD CONSTRAINT `fk_outlet_reservation_items_item` FOREIGN KEY (`item_id`) REFERENCES `Items`(`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OutletReservationItems` ADD CONSTRAINT `fk_outlet_reservation_items_outlet` FOREIGN KEY (`outlet_id`) REFERENCES `Outlets`(`outlet_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `availability` ADD CONSTRAINT `fk_availability_typologies` FOREIGN KEY (`typology_id`) REFERENCES `typologies`(`typology_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `typologies` ADD CONSTRAINT `fk_typologies_outlets` FOREIGN KEY (`outlet_id`) REFERENCES `Outlets`(`outlet_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `OutletItems` ADD CONSTRAINT `fk_outlet_items_item` FOREIGN KEY (`item_id`) REFERENCES `Items`(`item_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Orders` ADD CONSTRAINT `fk_orders_order_status` FOREIGN KEY (`order_status`) REFERENCES `OrderStatus`(`order_status_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservations` ADD CONSTRAINT `fk_reservations_outlet_items` FOREIGN KEY (`outlet_item_id`) REFERENCES `OutletItems`(`outlet_item_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Reservations` ADD CONSTRAINT `fk_reservations_outlets` FOREIGN KEY (`outlet_id`) REFERENCES `Outlets`(`outlet_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Reservations` ADD CONSTRAINT `fk_reservations_typologies` FOREIGN KEY (`typology_id`) REFERENCES `typologies`(`typology_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ReservationsServices` ADD CONSTRAINT `fk_reservations_services_outlet_items` FOREIGN KEY (`outlet_item_id`) REFERENCES `OutletItems`(`outlet_item_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ReservationsServices` ADD CONSTRAINT `fk_reservations_services_outlets` FOREIGN KEY (`outlet_id`) REFERENCES `Outlets`(`outlet_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ReservationTableAllocations` ADD CONSTRAINT `fk_reservation_table_allocations_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `Reservations`(`reservation_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ReservationTableAllocations` ADD CONSTRAINT `fk_reservation_table_allocations_typology` FOREIGN KEY (`typology_id`) REFERENCES `typologies`(`typology_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `RolePermissions` ADD CONSTRAINT `RolePermissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `UsersBOType`(`userBOTypeID`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `RolePermissions` ADD CONSTRAINT `RolePermissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `Permissions`(`Id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `UserPermissions` ADD CONSTRAINT `UserPermissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `UserPermissions` ADD CONSTRAINT `UserPermissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `Permissions`(`Id`) ON DELETE CASCADE ON UPDATE NO ACTION;

