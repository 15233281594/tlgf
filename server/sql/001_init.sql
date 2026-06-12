-- 初始化后端数据库结构，包含订单、管理员账号、管理员会话、后台菜单和审计日志表。
CREATE DATABASE IF NOT EXISTS `tlgf` DEFAULT CHARACTER SET utf8mb4;

USE `tlgf`;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(64) NOT NULL,
  `customer_name` VARCHAR(64) NULL,
  `contact_type` ENUM('wechat', 'qq', 'phone', 'other') NOT NULL DEFAULT 'wechat',
  `contact_value` VARCHAR(128) NULL,
  `service_type` VARCHAR(64) NOT NULL,
  `current_rank` VARCHAR(64) NULL,
  `target_rank` VARCHAR(64) NULL,
  `amount_cents` INT UNSIGNED NOT NULL DEFAULT 0,
  `payment_status` ENUM('pending', 'reviewing', 'paid', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  `payment_screenshot_key` VARCHAR(255) NULL,
  `note` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orders_order_no` (`order_no`),
  KEY `idx_orders_status_created_at` (`payment_status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `orders`
  MODIFY `order_no` VARCHAR(64) NOT NULL;

ALTER TABLE `orders`
  ADD COLUMN IF NOT EXISTS `customer_name` VARCHAR(64) NULL AFTER `order_no`;

ALTER TABLE `orders`
  ADD COLUMN IF NOT EXISTS `contact_type` ENUM('wechat', 'qq', 'phone', 'other') NOT NULL DEFAULT 'wechat' AFTER `customer_name`;

ALTER TABLE `orders`
  ADD COLUMN IF NOT EXISTS `contact_value` VARCHAR(128) NULL AFTER `contact_type`;

ALTER TABLE `orders`
  ADD COLUMN IF NOT EXISTS `service_type` VARCHAR(64) NOT NULL DEFAULT '代练服务' AFTER `contact_value`;

ALTER TABLE `orders`
  ADD COLUMN IF NOT EXISTS `current_rank` VARCHAR(64) NULL AFTER `service_type`;

ALTER TABLE `orders`
  ADD COLUMN IF NOT EXISTS `target_rank` VARCHAR(64) NULL AFTER `current_rank`;

ALTER TABLE `orders`
  ADD COLUMN IF NOT EXISTS `amount_cents` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `target_rank`;

ALTER TABLE `orders`
  ADD COLUMN IF NOT EXISTS `payment_status` ENUM('pending', 'reviewing', 'paid', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending' AFTER `amount_cents`;

ALTER TABLE `orders`
  ADD COLUMN IF NOT EXISTS `payment_screenshot_key` VARCHAR(255) NULL AFTER `payment_status`;

ALTER TABLE `orders`
  ADD COLUMN IF NOT EXISTS `note` TEXT NULL AFTER `payment_screenshot_key`;

UPDATE `orders`
SET `amount_cents` = CAST(ROUND(`amount` * 100) AS UNSIGNED)
WHERE `amount_cents` = 0 AND `amount` IS NOT NULL;

UPDATE `orders`
SET `payment_status` = CASE
  WHEN `status` IN ('pending', 'reviewing', 'paid', 'rejected', 'cancelled') THEN `status`
  ELSE 'pending'
END
WHERE `status` IS NOT NULL;

UPDATE `orders`
SET `note` = `remark`
WHERE (`note` IS NULL OR `note` = '') AND `remark` IS NOT NULL;

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(128) NOT NULL,
  `name` VARCHAR(64) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin', 'admin') NOT NULL DEFAULT 'admin',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_users_email` (`email`),
  KEY `idx_admin_users_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `admin_users`
  MODIFY `role` VARCHAR(64) NOT NULL DEFAULT 'admin';

CREATE TABLE IF NOT EXISTS `admin_roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_key` VARCHAR(64) NOT NULL,
  `name` VARCHAR(64) NOT NULL,
  `description` VARCHAR(255) NULL,
  `is_system` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_roles_key` (`role_key`),
  KEY `idx_admin_roles_active` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `admin_role_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_key` VARCHAR(64) NOT NULL,
  `permission_key` VARCHAR(64) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_role_permissions` (`role_key`, `permission_key`),
  KEY `idx_admin_role_permissions_permission` (`permission_key`),
  CONSTRAINT `fk_admin_role_permissions_role`
    FOREIGN KEY (`role_key`) REFERENCES `admin_roles` (`role_key`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `admin_roles`
  (`role_key`, `name`, `description`, `is_system`, `is_active`, `sort_order`)
VALUES
  ('super_admin', '超级管理员', '拥有后台全部模块、按钮和接口权限，适合站点负责人使用。', 1, 1, 10),
  ('admin', '运营管理员', '负责日常运营查看和基础订单跟进，默认不能管理权限和成员。', 0, 1, 20),
  ('finance', '财务', '负责支付审核、金额核对和财务相关操作。', 0, 1, 30),
  ('service', '客服', '负责订单跟进、客户沟通和履约处理。', 0, 1, 40)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `is_system` = VALUES(`is_system`),
  `is_active` = VALUES(`is_active`),
  `sort_order` = VALUES(`sort_order`);

INSERT IGNORE INTO `admin_role_permissions` (`role_key`, `permission_key`)
VALUES
  ('super_admin', '*'),
  ('admin', 'dashboard:view'),
  ('admin', 'order:read'),
  ('admin', 'client:read'),
  ('finance', 'dashboard:view'),
  ('finance', 'payment:review'),
  ('service', 'dashboard:view'),
  ('service', 'order:read'),
  ('service', 'order:manage');

CREATE TABLE IF NOT EXISTS `admin_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `ip_address` VARCHAR(64) NULL,
  `user_agent` VARCHAR(255) NULL,
  `expires_at` DATETIME NOT NULL,
  `revoked_at` DATETIME NULL,
  `last_seen_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_sessions_token_hash` (`token_hash`),
  KEY `idx_admin_sessions_user` (`admin_user_id`),
  KEY `idx_admin_sessions_expires` (`expires_at`),
  CONSTRAINT `fk_admin_sessions_user`
    FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `admin_menus` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `parent_id` BIGINT UNSIGNED NULL,
  `menu_key` VARCHAR(64) NOT NULL,
  `title` VARCHAR(64) NOT NULL,
  `menu_type` ENUM('domain', 'menu') NOT NULL DEFAULT 'menu',
  `icon` VARCHAR(64) NULL,
  `route_name` VARCHAR(64) NULL,
  `permission_key` VARCHAR(64) NULL,
  `group_title` VARCHAR(64) NULL,
  `badge` VARCHAR(32) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_visible` TINYINT(1) NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_menus_key` (`menu_key`),
  KEY `idx_admin_menus_parent_sort` (`parent_id`, `sort_order`),
  KEY `idx_admin_menus_permission` (`permission_key`),
  CONSTRAINT `fk_admin_menus_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `admin_menus` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `admin_menus`
  (`parent_id`, `menu_key`, `title`, `menu_type`, `icon`, `route_name`, `permission_key`, `group_title`, `badge`, `sort_order`, `is_visible`, `is_active`)
VALUES
  (NULL, 'operation', '运营中台', 'domain', 'LayoutDashboard', NULL, 'dashboard:view', NULL, NULL, 10, 1, 1),
  (NULL, 'permission', '权限中心', 'domain', 'ShieldCheck', NULL, 'permission:manage', NULL, NULL, 20, 1, 1),
  (NULL, 'client', '客户端', 'domain', 'MonitorSmartphone', NULL, 'client:read', NULL, NULL, 30, 1, 1),
  (NULL, 'finance', '交易财务', 'domain', 'CircleDollarSign', NULL, 'payment:review', NULL, NULL, 40, 1, 1)
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `menu_type` = VALUES(`menu_type`),
  `icon` = VALUES(`icon`),
  `route_name` = VALUES(`route_name`),
  `permission_key` = VALUES(`permission_key`),
  `group_title` = VALUES(`group_title`),
  `badge` = VALUES(`badge`),
  `sort_order` = VALUES(`sort_order`),
  `is_visible` = VALUES(`is_visible`),
  `is_active` = VALUES(`is_active`);

INSERT INTO `admin_menus`
  (`parent_id`, `menu_key`, `title`, `menu_type`, `icon`, `route_name`, `permission_key`, `group_title`, `badge`, `sort_order`, `is_visible`, `is_active`)
VALUES
  ((SELECT `id` FROM `admin_menus` WHERE `menu_key` = 'operation'), 'dashboard', '业务工作台', 'menu', 'Gauge', 'dashboard', 'dashboard:view', '核心业务', NULL, 10, 1, 1),
  ((SELECT `id` FROM `admin_menus` WHERE `menu_key` = 'operation'), 'orders', '订单履约', 'menu', 'FileText', 'orders', 'order:read', '核心业务', '18', 20, 1, 1),
  ((SELECT `id` FROM `admin_menus` WHERE `menu_key` = 'finance'), 'payment', '支付审核', 'menu', 'CircleDollarSign', 'payment', 'payment:review', '核心业务', '6', 10, 1, 1),
  ((SELECT `id` FROM `admin_menus` WHERE `menu_key` = 'client'), 'site-builder', '页面装修', 'menu', 'WandSparkles', 'site-builder', 'client:configure', '低代码配置', NULL, 10, 1, 1),
  ((SELECT `id` FROM `admin_menus` WHERE `menu_key` = 'client'), 'theme', '模板主题', 'menu', 'Palette', 'theme', 'client:configure', '低代码配置', NULL, 20, 1, 1),
  ((SELECT `id` FROM `admin_menus` WHERE `menu_key` = 'permission'), 'roles', '角色权限', 'menu', 'KeyRound', 'roles', 'permission:manage', '权限与协同', '优先', 10, 1, 1),
  ((SELECT `id` FROM `admin_menus` WHERE `menu_key` = 'permission'), 'members', '成员账号', 'menu', 'UsersRound', 'members', 'member:manage', '权限与协同', NULL, 20, 1, 1),
  ((SELECT `id` FROM `admin_menus` WHERE `menu_key` = 'permission'), 'menu-management', '菜单管理', 'menu', 'MenuSquare', 'menu-management', 'menu:manage', '权限与协同', NULL, 30, 1, 1),
  ((SELECT `id` FROM `admin_menus` WHERE `menu_key` = 'permission'), 'audit-logs', '审计日志', 'menu', 'ScrollText', 'audit-logs', 'audit:read', '权限与协同', NULL, 40, 1, 1)
ON DUPLICATE KEY UPDATE
  `parent_id` = VALUES(`parent_id`),
  `title` = VALUES(`title`),
  `menu_type` = VALUES(`menu_type`),
  `icon` = VALUES(`icon`),
  `route_name` = VALUES(`route_name`),
  `permission_key` = VALUES(`permission_key`),
  `group_title` = VALUES(`group_title`),
  `badge` = VALUES(`badge`),
  `sort_order` = VALUES(`sort_order`),
  `is_visible` = VALUES(`is_visible`),
  `is_active` = VALUES(`is_active`);

CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` BIGINT UNSIGNED NULL,
  `admin_email` VARCHAR(128) NULL,
  `admin_name` VARCHAR(64) NULL,
  `action` VARCHAR(64) NOT NULL,
  `target_type` VARCHAR(64) NULL,
  `target_id` VARCHAR(64) NULL,
  `target_label` VARCHAR(128) NULL,
  `detail` JSON NULL,
  `ip_address` VARCHAR(64) NULL,
  `user_agent` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_audit_logs_admin` (`admin_user_id`, `created_at`),
  KEY `idx_admin_audit_logs_action` (`action`, `created_at`),
  KEY `idx_admin_audit_logs_target` (`target_type`, `target_id`),
  CONSTRAINT `fk_admin_audit_logs_user`
    FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
