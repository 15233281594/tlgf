CREATE DATABASE IF NOT EXISTS `tlgf` DEFAULT CHARACTER SET utf8mb4;

USE `tlgf`;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(32) NOT NULL,
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
