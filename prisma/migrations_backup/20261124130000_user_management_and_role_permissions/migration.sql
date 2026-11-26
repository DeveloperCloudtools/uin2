ALTER TABLE `Users`
    ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE `UserPermissions`
    DROP FOREIGN KEY `UserPermissions_ibfk_1`,
    DROP FOREIGN KEY `UserPermissions_ibfk_2`;

RENAME TABLE `UserPermissions` TO `UserPermissionsLegacy`;

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

ALTER TABLE `UserPermissions`
    ADD CONSTRAINT `UserPermissions_ibfk_1`
        FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`)
        ON DELETE CASCADE ON UPDATE NO ACTION,
    ADD CONSTRAINT `UserPermissions_ibfk_2`
        FOREIGN KEY (`permission_id`) REFERENCES `Permissions`(`Id`)
        ON DELETE CASCADE ON UPDATE NO ACTION;

INSERT IGNORE INTO `Permissions` (`permission_key`, `name`, `module`, `description`)
VALUES
    ('users.view', 'Consultar utilizadores', 'users', 'Consultar utilizadores BO e FO.'),
    ('users.manage', 'Gerir utilizadores', 'users', 'Editar utilizadores BO e gerir permissões individuais.'),
    ('roles.view', 'Consultar roles', 'roles', 'Consultar roles e permissões associadas.'),
    ('roles.manage', 'Gerir roles', 'roles', 'Criar roles e definir permissões fixas.'),
    ('permissions.view', 'Consultar permissões', 'permissions', 'Consultar o catálogo de permissões.'),
    ('permissions.manage', 'Gerir permissões', 'permissions', 'Criar, alterar e eliminar permissões.'),
    ('areas.view', 'Consultar áreas', 'areas', 'Consultar áreas.'),
    ('areas.manage', 'Gerir áreas', 'areas', 'Criar, alterar e eliminar áreas.'),
    ('outlets.view', 'Consultar outlets', 'outlets', 'Consultar outlets.'),
    ('outlets.manage', 'Gerir outlets', 'outlets', 'Criar, alterar e eliminar outlets.'),
    ('schedules.view', 'Consultar horários', 'schedules', 'Consultar horários.'),
    ('schedules.manage', 'Gerir horários', 'schedules', 'Criar, alterar e eliminar horários.'),
    ('typologies.view', 'Consultar tipologias', 'typologies', 'Consultar tipologias.'),
    ('typologies.manage', 'Gerir tipologias', 'typologies', 'Criar, alterar e eliminar tipologias.'),
    ('accessPoints.view', 'Consultar pontos de acesso', 'accessPoints', 'Consultar pontos de acesso.'),
    ('accessPoints.manage', 'Gerir pontos de acesso', 'accessPoints', 'Criar, alterar e eliminar pontos de acesso.'),
    ('accessPointGroups.view', 'Consultar grupos de pontos', 'accessPointGroups', 'Consultar grupos de pontos de acesso.'),
    ('accessPointGroups.manage', 'Gerir grupos de pontos', 'accessPointGroups', 'Criar, alterar e eliminar grupos de pontos de acesso.'),
    ('accessPointSubGroups.view', 'Consultar subgrupos de pontos', 'accessPointSubGroups', 'Consultar subgrupos de pontos de acesso.'),
    ('accessPointSubGroups.manage', 'Gerir subgrupos de pontos', 'accessPointSubGroups', 'Criar, alterar e eliminar subgrupos de pontos de acesso.'),
    ('menus.view', 'Consultar menus', 'menus', 'Consultar menus.'),
    ('menus.manage', 'Gerir menus', 'menus', 'Criar, alterar e eliminar menus.'),
    ('submenus.view', 'Consultar submenus', 'submenus', 'Consultar submenus.'),
    ('submenus.manage', 'Gerir submenus', 'submenus', 'Criar, alterar e eliminar submenus.'),
    ('products.view', 'Consultar itens', 'products', 'Consultar itens.'),
    ('products.manage', 'Gerir itens', 'products', 'Criar, alterar e eliminar itens.'),
    ('productGroups.view', 'Consultar grupos de itens', 'productGroups', 'Consultar grupos de itens.'),
    ('productGroups.manage', 'Gerir grupos de itens', 'productGroups', 'Criar, alterar e eliminar grupos de itens.'),
    ('productFamilies.view', 'Consultar famílias de itens', 'productFamilies', 'Consultar famílias de itens.'),
    ('productFamilies.manage', 'Gerir famílias de itens', 'productFamilies', 'Criar, alterar e eliminar famílias de itens.'),
    ('productCategories.view', 'Consultar categorias de itens', 'productCategories', 'Consultar categorias de itens.'),
    ('productCategories.manage', 'Gerir categorias de itens', 'productCategories', 'Criar, alterar e eliminar categorias de itens.'),
    ('ivaRates.view', 'Consultar taxas de IVA', 'ivaRates', 'Consultar taxas de IVA.'),
    ('ivaRates.manage', 'Gerir taxas de IVA', 'ivaRates', 'Criar, alterar e eliminar taxas de IVA.'),
    ('preparation.view', 'Consultar preparações', 'preparation', 'Consultar preparações.'),
    ('preparation.manage', 'Gerir preparações', 'preparation', 'Criar, alterar e eliminar preparações.'),
    ('preparationGroups.view', 'Consultar grupos de preparação', 'preparationGroups', 'Consultar grupos de preparação.'),
    ('preparationGroups.manage', 'Gerir grupos de preparação', 'preparationGroups', 'Criar, alterar e eliminar grupos de preparação.'),
    ('languages.view', 'Consultar idiomas', 'languages', 'Consultar idiomas.'),
    ('languages.manage', 'Gerir idiomas', 'languages', 'Criar, alterar e eliminar idiomas.'),
    ('personalization.view', 'Consultar personalização', 'personalization', 'Consultar a personalização do site.'),
    ('personalization.manage', 'Gerir personalização', 'personalization', 'Alterar a personalização do site.'),
    ('settings.view', 'Consultar configurações', 'settings', 'Consultar configurações do sistema.'),
    ('settings.manage', 'Gerir configurações', 'settings', 'Alterar configurações do sistema.'),
    ('images.view', 'Consultar imagens', 'images', 'Consultar imagens armazenadas.'),
    ('images.manage', 'Gerir imagens', 'images', 'Carregar e eliminar imagens.'),
    ('orders.view', 'Consultar pedidos', 'orders', 'Consultar pedidos.'),
    ('orders.manage', 'Gerir pedidos', 'orders', 'Alterar pedidos.'),
    ('reservations.view', 'Consultar reservas', 'reservations', 'Consultar reservas.'),
    ('reservations.manage', 'Gerir reservas', 'reservations', 'Alterar reservas.'),
    ('serviceReservations.view', 'Consultar reservas de serviços', 'serviceReservations', 'Consultar reservas de serviços.'),
    ('serviceReservations.manage', 'Gerir reservas de serviços', 'serviceReservations', 'Alterar reservas de serviços.');
