-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified_at` TIMESTAMP(0) NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    `avatar_url` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `remember_token` VARCHAR(100) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `refreshToken` VARCHAR(255) NULL,

    UNIQUE INDEX `users_email_unique`(`email`),
    INDEX `users_email_index`(`email`),
    INDEX `users_role_index`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(50) NOT NULL DEFAULT 'tag',
    `description` TEXT NULL,
    `color` VARCHAR(7) NOT NULL DEFAULT '#2196F3',
    `image_url` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` SMALLINT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `categories_slug_unique`(`slug`),
    INDEX `categories_is_active_index`(`is_active`),
    INDEX `categories_slug_index`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `original_price` DECIMAL(12, 2) NULL,
    `badge` VARCHAR(50) NULL,
    `rating` DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
    `reviews_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `in_stock` BOOLEAN NOT NULL DEFAULT true,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` SMALLINT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `products_slug_unique`(`slug`),
    INDEX `products_category_id_index`(`category_id`),
    INDEX `products_is_active_index`(`is_active`),
    INDEX `products_is_featured_index`(`is_featured`),
    INDEX `products_price_index`(`price`),
    INDEX `products_slug_index`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_images` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `cloudinary_id` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `url_thumbnail` VARCHAR(500) NULL,
    `url_medium` VARCHAR(500) NULL,
    `alt_text` VARCHAR(255) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` SMALLINT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `product_images_product_id_foreign`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_variants` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `type` ENUM('color', 'size') NOT NULL,
    `value` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `product_variants_product_id_index`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `reference` VARCHAR(30) NOT NULL,
    `status` ENUM('pending', 'processing', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    `payment_method` ENUM('MTN', 'MOOV', 'ORANGE', 'CELTIIS') NOT NULL,
    `phone_number` VARCHAR(30) NOT NULL,
    `delivery_full_name` VARCHAR(100) NULL,
    `delivery_phone` VARCHAR(30) NULL,
    `delivery_city` VARCHAR(100) NULL,
    `delivery_district` VARCHAR(100) NULL,
    `delivery_address` TEXT NULL,
    `delivery_landmark` VARCHAR(255) NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `shipping_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(12, 2) NOT NULL,
    `total_amount` DECIMAL(12, 2) NULL,
    `notes` TEXT NULL,
    `payment_ref` VARCHAR(255) NULL,
    `payment_status` ENUM('unpaid', 'pending', 'paid', 'failed') NOT NULL DEFAULT 'unpaid',
    `tracking_number` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `orders_reference_unique`(`reference`),
    INDEX `orders_created_at_index`(`created_at`),
    INDEX `orders_reference_index`(`reference`),
    INDEX `orders_status_index`(`status`),
    INDEX `orders_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `product_image_url` VARCHAR(500) NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `quantity` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `variant_color` VARCHAR(50) NULL,
    `variant_size` VARCHAR(50) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `order_items_order_id_index`(`order_id`),
    INDEX `order_items_product_id_index`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `rating` TINYINT UNSIGNED NOT NULL,
    `comment` TEXT NULL,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `reviews_product_id_index`(`product_id`),
    INDEX `reviews_rating_index`(`rating`),
    UNIQUE INDEX `reviews_user_id_product_id_unique`(`user_id`, `product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `migrations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `migration` VARCHAR(255) NOT NULL,
    `batch` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `payment_ref` VARCHAR(255) NOT NULL,
    `talypay_ref` VARCHAR(255) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_method` VARCHAR(255) NOT NULL,
    `payment_mode` VARCHAR(255) NOT NULL,
    `status` ENUM('pending', 'paid', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    `phone_number` VARCHAR(255) NOT NULL,
    `talypay_data` JSON NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `payments_payment_ref_unique`(`payment_ref`),
    INDEX `payments_order_id_foreign`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `personal_access_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tokenable_type` VARCHAR(255) NOT NULL,
    `tokenable_id` BIGINT UNSIGNED NOT NULL,
    `name` TEXT NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `abilities` TEXT NULL,
    `last_used_at` TIMESTAMP(0) NULL,
    `expires_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `personal_access_tokens_token_unique`(`token`),
    INDEX `personal_access_tokens_expires_at_index`(`expires_at`),
    INDEX `personal_access_tokens_tokenable_type_tokenable_id_index`(`tokenable_type`, `tokenable_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `payload` LONGTEXT NOT NULL,
    `last_activity` INTEGER NOT NULL,

    INDEX `sessions_last_activity_index`(`last_activity`),
    INDEX `sessions_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

