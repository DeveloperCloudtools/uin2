-- CreateTable
CREATE TABLE `Permissions` (
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
CREATE TABLE `RolePermissions` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `permission_id`(`permission_id`),
    UNIQUE INDEX `UQ_RolePermission`(`role_id`, `permission_id`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserPermissions` (
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

-- AddForeignKey
ALTER TABLE `RolePermissions` ADD CONSTRAINT `RolePermissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `UsersBOType`(`userBOTypeID`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `RolePermissions` ADD CONSTRAINT `RolePermissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `Permissions`(`Id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `UserPermissions` ADD CONSTRAINT `UserPermissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `UsersBOType`(`userBOTypeID`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `UserPermissions` ADD CONSTRAINT `UserPermissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `Permissions`(`Id`) ON DELETE CASCADE ON UPDATE NO ACTION;
