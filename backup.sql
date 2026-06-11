-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: interchange.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tag',
  `description` text COLLATE utf8mb4_unicode_ci,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#2196F3',
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` smallint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_unique` (`slug`),
  KEY `categories_slug_index` (`slug`),
  KEY `categories_is_active_index` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=162 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Électronique','electronics','laptop',NULL,'#2196F3',NULL,1,1,'2026-03-06 12:06:06','2026-03-09 19:14:40'),(2,'Mode','fashion','tshirt',NULL,'#673AB7',NULL,1,2,'2026-03-06 12:06:06','2026-03-09 19:14:40'),(3,'Beauté','beauty','spa',NULL,'#FF4081',NULL,1,3,'2026-03-06 12:06:06','2026-03-09 19:14:40'),(4,'Maison','home','home',NULL,'#4CAF50',NULL,1,4,'2026-03-06 12:06:06','2026-03-09 19:14:40');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'2026_01_01_000001_create_categories_table',1),(2,'2026_01_01_000002_create_products_table',1),(3,'2026_01_01_000003_create_product_images_table',1),(4,'2026_01_01_000004_create_product_variants_table',1),(5,'2026_01_01_000005_create_users_table',1),(6,'2026_01_01_000006_create_orders_table',1),(7,'2026_01_01_000007_create_order_items_table',1),(8,'2026_01_01_000008_create_reviews_table',1),(9,'2026_03_01_121106_create_personal_access_tokens_table',1),(10,'2026_03_01_124842_create_sessions_table',1),(11,'2026_03_07_205411_create_payments_table',2),(12,'2026_03_07_214412_add_delivery_fields_to_orders',3);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `quantity` int unsigned NOT NULL DEFAULT '1',
  `subtotal` decimal(12,2) NOT NULL,
  `variant_color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `variant_size` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_index` (`order_id`),
  KEY `order_items_product_id_index` (`product_id`),
  CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `reference` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','processing','delivered','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `payment_method` enum('MTN','MOOV','ORANGE','CELTIIS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_full_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_address` text COLLATE utf8mb4_unicode_ci,
  `delivery_landmark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `shipping_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL,
  `total_amount` decimal(12,2) DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `payment_ref` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('unpaid','pending','paid','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `tracking_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_reference_unique` (`reference`),
  KEY `orders_user_id_index` (`user_id`),
  KEY `orders_status_index` (`status`),
  KEY `orders_reference_index` (`reference`),
  KEY `orders_created_at_index` (`created_at`),
  CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `payment_ref` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `talypay_ref` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_mode` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','paid','failed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `phone_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `talypay_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_payment_ref_unique` (`payment_ref`),
  KEY `payments_order_id_foreign` (`order_id`),
  CONSTRAINT `payments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (9,'App\\Models\\User',5,'auth_token','314983aa1cdda56d5dfea20b76e691e0c229f3a2e1eaaaef677ce1f5ca7aec25','[\"*\"]','2026-03-07 00:14:33',NULL,'2026-03-06 20:19:49','2026-03-07 00:14:33'),(17,'App\\Models\\User',1,'auth_token','697f172f25b5997dbc12d9c36794c738d50f8bd0c2d3eb061e0a351294a24b9f','[\"*\"]','2026-03-07 12:31:43',NULL,'2026-03-07 12:25:19','2026-03-07 12:31:43'),(19,'App\\Models\\User',1,'auth_token','be0da872d4ff0407ea7cae00f88b2f2ac58c96ea3bf04f084f3bfa4d2797315b','[\"*\"]','2026-03-07 21:33:30',NULL,'2026-03-07 12:32:15','2026-03-07 21:33:30'),(25,'App\\Models\\User',29,'auth_token','f37b65794cb84f1077f5a12df4160a3c70cdd25057454adf8795f5051e05e70e','[\"*\"]','2026-03-07 21:05:05',NULL,'2026-03-07 21:04:08','2026-03-07 21:05:05'),(27,'App\\Models\\User',1,'auth_token','b9e0b0e3f4d2720133e6d9218a034fa8ea5023c23d3e6a097346feba102a6396','[\"*\"]','2026-03-07 21:26:30',NULL,'2026-03-07 21:26:18','2026-03-07 21:26:30'),(31,'App\\Models\\User',29,'auth_token','d08543a3a6f96371f3756f21067c52aaf2efcd30915773485303cc1bdf10aa95','[\"*\"]','2026-03-07 23:44:46',NULL,'2026-03-07 23:28:23','2026-03-07 23:44:46'),(32,'App\\Models\\User',29,'auth_token','c1d1b5bf62cd8ef98b04268fb048c9a1623bcf3af6f5a7f9afca478effa3d5a9','[\"*\"]',NULL,NULL,'2026-03-07 23:44:46','2026-03-07 23:44:46'),(34,'App\\Models\\User',1,'auth_token','d28d8954976425262a8307a0cf263c67fbec83f27e91afebec7e93db70cdbbbf','[\"*\"]','2026-03-07 23:48:44',NULL,'2026-03-07 23:47:33','2026-03-07 23:48:44'),(35,'App\\Models\\User',1,'auth_token','0b937e2d61de3c5293e292dce2b9c51cd221b594f07edb8287e1a47a1a097078','[\"*\"]','2026-03-08 09:08:38',NULL,'2026-03-08 00:02:16','2026-03-08 09:08:38'),(36,'App\\Models\\User',1,'auth_token','fa763ef53b7d58c41c8d38f4a2638bd9496b3e5d930d4194cd895577c9d59c23','[\"*\"]','2026-03-08 00:11:26',NULL,'2026-03-08 00:03:03','2026-03-08 00:11:26'),(38,'App\\Models\\User',36,'auth_token','342db26caddb784fb5e8778f5a3985d5907b344e45f929206cc36ab6dba65769','[\"*\"]','2026-03-09 18:50:09',NULL,'2026-03-09 18:48:30','2026-03-09 18:50:09'),(40,'App\\Models\\User',1,'auth_token','d8019909620c5c92fc03e7f4732c012d30dcb15664905a729dc531074e1d0963','[\"*\"]','2026-03-09 19:23:16',NULL,'2026-03-09 19:17:47','2026-03-09 19:23:16'),(43,'App\\Models\\User',1,'auth_token','48a3bd000905f3daabd0938bc94f87a56a1a649be90fab4e46e91a7b411b1bfa','[\"*\"]','2026-03-09 19:22:36',NULL,'2026-03-09 19:21:56','2026-03-09 19:22:36'),(44,'App\\Models\\User',1,'auth_token','b66f7e07544354a7130533e73033560ca7695836b1eea0333c907847a5a064ed','[\"*\"]','2026-03-09 19:28:26',NULL,'2026-03-09 19:22:37','2026-03-09 19:28:26'),(45,'App\\Models\\User',1,'auth_token','cfd269a62e31043a8eff7d67b9ca5bd0c607a9795a107f2dbb9176a38e534bf5','[\"*\"]',NULL,NULL,'2026-03-09 19:26:59','2026-03-09 19:26:59'),(48,'App\\Models\\User',1,'auth_token','b954a142d4fae617d3784f846bc282a8e1f4fba265212be9a8297cd2a5d2472a','[\"*\"]','2026-03-09 19:37:16',NULL,'2026-03-09 19:33:23','2026-03-09 19:37:16'),(49,'App\\Models\\User',1,'auth_token','45e1a191a218569ca761239259c4a9e0ff4d2feda7bab0cbd4779e92884ace1d','[\"*\"]','2026-03-09 19:38:16',NULL,'2026-03-09 19:37:16','2026-03-09 19:38:16'),(55,'App\\Models\\User',1,'auth_token','75b237835f7d07625005d6218a28de6634326dc6ba1068ffd1ae9d8f40abbbe4','[\"*\"]','2026-03-15 08:00:38',NULL,'2026-03-14 19:11:32','2026-03-15 08:00:38'),(56,'App\\Models\\User',1,'auth_token','16759036fd24faa5bc0ea176371e7ce73f236cf573454312d4488cf3e791d689','[\"*\"]','2026-03-24 14:22:21',NULL,'2026-03-24 13:34:09','2026-03-24 14:22:21');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `cloudinary_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url_thumbnail` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url_medium` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alt_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` smallint NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_images_product_id_foreign` (`product_id`),
  CONSTRAINT `product_images_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (17,16,'vannys-touch/products/srnlxbrxawzmxs0ia00e','https://res.cloudinary.com/dggmjflpm/image/upload/v1773433912/vannys-touch/products/srnlxbrxawzmxs0ia00e.jpg','https://res.cloudinary.com/dggmjflpm/image/upload/w_300,h_300,c_fill/v1/vannys-touch/products/srnlxbrxawzmxs0ia00e?_a=BAAE6HDQ','https://res.cloudinary.com/dggmjflpm/image/upload/w_600,h_600,c_fill/v1/vannys-touch/products/srnlxbrxawzmxs0ia00e?_a=BAAE6HDQ',NULL,1,0,'2026-03-13 20:31:53'),(18,17,'vannys-touch/products/d1cgagnixqerei0mgkye','https://res.cloudinary.com/dggmjflpm/image/upload/v1773515988/vannys-touch/products/d1cgagnixqerei0mgkye.jpg','https://res.cloudinary.com/dggmjflpm/image/upload/w_300,h_300,c_fill/v1/vannys-touch/products/d1cgagnixqerei0mgkye?_a=BAAE6HDQ','https://res.cloudinary.com/dggmjflpm/image/upload/w_600,h_600,c_fill/v1/vannys-touch/products/d1cgagnixqerei0mgkye?_a=BAAE6HDQ',NULL,1,0,'2026-03-14 19:19:49'),(19,18,'vannys-touch/products/mlra8g80nqcnm2ogyrhf','https://res.cloudinary.com/dggmjflpm/image/upload/v1773516045/vannys-touch/products/mlra8g80nqcnm2ogyrhf.jpg','https://res.cloudinary.com/dggmjflpm/image/upload/w_300,h_300,c_fill/v1/vannys-touch/products/mlra8g80nqcnm2ogyrhf?_a=BAAE6HDQ','https://res.cloudinary.com/dggmjflpm/image/upload/w_600,h_600,c_fill/v1/vannys-touch/products/mlra8g80nqcnm2ogyrhf?_a=BAAE6HDQ',NULL,1,0,'2026-03-14 19:20:46'),(20,19,'vannys-touch/products/ozwimkzybyfbj5tklqnz','https://res.cloudinary.com/dggmjflpm/image/upload/v1773516901/vannys-touch/products/ozwimkzybyfbj5tklqnz.jpg','https://res.cloudinary.com/dggmjflpm/image/upload/w_300,h_300,c_fill/v1/vannys-touch/products/ozwimkzybyfbj5tklqnz?_a=BAAE6HDQ','https://res.cloudinary.com/dggmjflpm/image/upload/w_600,h_600,c_fill/v1/vannys-touch/products/ozwimkzybyfbj5tklqnz?_a=BAAE6HDQ',NULL,1,0,'2026-03-14 19:35:02'),(21,20,'vannys-touch/products/pm1wputfuqrdcczrg9wh','https://res.cloudinary.com/dggmjflpm/image/upload/v1773517037/vannys-touch/products/pm1wputfuqrdcczrg9wh.jpg','https://res.cloudinary.com/dggmjflpm/image/upload/w_300,h_300,c_fill/v1/vannys-touch/products/pm1wputfuqrdcczrg9wh?_a=BAAE6HDQ','https://res.cloudinary.com/dggmjflpm/image/upload/w_600,h_600,c_fill/v1/vannys-touch/products/pm1wputfuqrdcczrg9wh?_a=BAAE6HDQ',NULL,1,0,'2026-03-14 19:37:18'),(22,21,'vannys-touch/products/eefuixbj2wthhomf3jgc','https://res.cloudinary.com/dggmjflpm/image/upload/v1773517193/vannys-touch/products/eefuixbj2wthhomf3jgc.jpg','https://res.cloudinary.com/dggmjflpm/image/upload/w_300,h_300,c_fill/v1/vannys-touch/products/eefuixbj2wthhomf3jgc?_a=BAAE6HDQ','https://res.cloudinary.com/dggmjflpm/image/upload/w_600,h_600,c_fill/v1/vannys-touch/products/eefuixbj2wthhomf3jgc?_a=BAAE6HDQ',NULL,1,0,'2026-03-14 19:39:54'),(23,22,'vannys-touch/products/lojvdt7yyfjpgyhwkgxn','https://res.cloudinary.com/dggmjflpm/image/upload/v1773517663/vannys-touch/products/lojvdt7yyfjpgyhwkgxn.jpg','https://res.cloudinary.com/dggmjflpm/image/upload/w_300,h_300,c_fill/v1/vannys-touch/products/lojvdt7yyfjpgyhwkgxn?_a=BAAE6HDQ','https://res.cloudinary.com/dggmjflpm/image/upload/w_600,h_600,c_fill/v1/vannys-touch/products/lojvdt7yyfjpgyhwkgxn?_a=BAAE6HDQ',NULL,1,0,'2026-03-14 19:47:44'),(24,23,'vannys-touch/products/w3al1mh73spisgvajpqf','https://res.cloudinary.com/dggmjflpm/image/upload/v1773518062/vannys-touch/products/w3al1mh73spisgvajpqf.jpg','https://res.cloudinary.com/dggmjflpm/image/upload/w_300,h_300,c_fill/v1/vannys-touch/products/w3al1mh73spisgvajpqf?_a=BAAE6HDQ','https://res.cloudinary.com/dggmjflpm/image/upload/w_600,h_600,c_fill/v1/vannys-touch/products/w3al1mh73spisgvajpqf?_a=BAAE6HDQ',NULL,1,0,'2026-03-14 19:54:23'),(25,24,'vannys-touch/products/oxicdhghtp2gbnvsymfo','https://res.cloudinary.com/dggmjflpm/image/upload/v1773518094/vannys-touch/products/oxicdhghtp2gbnvsymfo.jpg','https://res.cloudinary.com/dggmjflpm/image/upload/w_300,h_300,c_fill/v1/vannys-touch/products/oxicdhghtp2gbnvsymfo?_a=BAAE6HDQ','https://res.cloudinary.com/dggmjflpm/image/upload/w_600,h_600,c_fill/v1/vannys-touch/products/oxicdhghtp2gbnvsymfo?_a=BAAE6HDQ',NULL,1,0,'2026-03-14 19:54:55'),(26,25,'vannys-touch/products/kyumbgegdcbfvjliaobl','https://res.cloudinary.com/dggmjflpm/image/upload/v1773518236/vannys-touch/products/kyumbgegdcbfvjliaobl.jpg','https://res.cloudinary.com/dggmjflpm/image/upload/w_300,h_300,c_fill/v1/vannys-touch/products/kyumbgegdcbfvjliaobl?_a=BAAE6HDQ','https://res.cloudinary.com/dggmjflpm/image/upload/w_600,h_600,c_fill/v1/vannys-touch/products/kyumbgegdcbfvjliaobl?_a=BAAE6HDQ',NULL,1,0,'2026-03-14 19:57:17'),(27,26,'vannys-touch/products/z27d3kfs2vanozsnw7ou','https://res.cloudinary.com/dggmjflpm/image/upload/v1773522388/vannys-touch/products/z27d3kfs2vanozsnw7ou.jpg','https://res.cloudinary.com/dggmjflpm/image/upload/w_300,h_300,c_fill/v1/vannys-touch/products/z27d3kfs2vanozsnw7ou?_a=BAAE6HDQ','https://res.cloudinary.com/dggmjflpm/image/upload/w_600,h_600,c_fill/v1/vannys-touch/products/z27d3kfs2vanozsnw7ou?_a=BAAE6HDQ',NULL,1,0,'2026-03-14 21:06:29'),(29,28,'vannys-touch/products/vugzn90zr5dzg6pwxlbe','https://res.cloudinary.com/dggmjflpm/image/upload/v1773522653/vannys-touch/products/vugzn90zr5dzg6pwxlbe.jpg','https://res.cloudinary.com/dggmjflpm/image/upload/w_300,h_300,c_fill/v1/vannys-touch/products/vugzn90zr5dzg6pwxlbe?_a=BAAE6HDQ','https://res.cloudinary.com/dggmjflpm/image/upload/w_600,h_600,c_fill/v1/vannys-touch/products/vugzn90zr5dzg6pwxlbe?_a=BAAE6HDQ',NULL,1,0,'2026-03-14 21:10:54');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `type` enum('color','size') COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_variants_product_id_index` (`product_id`),
  CONSTRAINT `product_variants_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (2,17,'color','Noir','2026-03-14 19:19:49'),(3,18,'color','Noir','2026-03-14 19:20:46');
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(12,2) NOT NULL,
  `original_price` decimal(12,2) DEFAULT NULL,
  `badge` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` decimal(2,1) NOT NULL DEFAULT '0.0',
  `reviews_count` int unsigned NOT NULL DEFAULT '0',
  `in_stock` tinyint(1) NOT NULL DEFAULT '1',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` smallint NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_slug_unique` (`slug`),
  KEY `products_category_id_index` (`category_id`),
  KEY `products_slug_index` (`slug`),
  KEY `products_is_featured_index` (`is_featured`),
  KEY `products_is_active_index` (`is_active`),
  KEY `products_price_index` (`price`),
  CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (16,1,'Montre connectée','montre-connectee-6zMQbi','Une montre technologique idéale pour adeptes de la Tech',3500.00,5500.00,NULL,0.0,0,1,0,1,0,'2026-03-13 20:31:51','2026-03-13 20:31:51'),(17,1,'Lampe E-SMARTER','lampe-e-smarter-Tbkzki','Lampe torche rechargeable de la marque E-SMARTER, de forme allongée avec un bouton orange. Elle possède un éclairage frontal puissant et une lumière LED sur le côté pour éclairer une zone plus large. La tête de la lampe permet de régler le faisceau (zoom) pour voir plus loin ou plus près. Elle se recharge par USB et peut être accrochée grâce à un crochet, ce qui la rend pratique pour le camping, les réparations ou les coupures d’électricité. 🔦',2000.00,4000.00,'Nouveau',0.0,0,1,0,1,0,'2026-03-14 19:19:48','2026-03-14 19:19:48'),(18,1,'Lampe E-SMARTER','lampe-e-smarter-mWscEW','Lampe torche rechargeable de la marque E-SMARTER, de forme allongée avec un bouton orange. Elle possède un éclairage frontal puissant et une lumière LED sur le côté pour éclairer une zone plus large. La tête de la lampe permet de régler le faisceau (zoom) pour voir plus loin ou plus près. Elle se recharge par USB et peut être accrochée grâce à un crochet, ce qui la rend pratique pour le camping, les réparations ou les coupures d’électricité. 🔦',2000.00,4000.00,'Nouveau',0.0,0,1,0,1,0,'2026-03-14 19:20:45','2026-03-14 19:20:45'),(19,1,'Mini diffuseur','mini-diffuseur-fLaCwG','Petit appareil portable conçu pour diffuser des parfums ou des huiles essentielles dans l’air afin de créer une ambiance agréable. \r\n Idéal pour les petits espaces comme une chambre, un bureau ou une voiture.',3500.00,5000.00,NULL,0.0,0,1,0,1,0,'2026-03-14 19:35:00','2026-03-14 19:35:00'),(20,1,'Mini ventilo','mini-ventilo-81avr2','Mini ventilo très pratique et facile à transporter',2500.00,3000.00,NULL,0.0,0,1,0,1,0,'2026-03-14 19:37:17','2026-03-14 19:37:17'),(21,1,'Bouteille d\'eau en acier','bouteille-deau-en-acier-VcqsCY','Bouteille en acier permettant de contenir de l\'eau ou tt autres liquides',4000.00,5000.00,NULL,0.0,0,1,0,1,0,'2026-03-14 19:39:52','2026-03-14 19:39:52'),(22,3,'Coffret montre ,bracelet, chouchou','coffret-montre-bracelet-chouchou-zMfsX7',NULL,5000.00,NULL,NULL,0.0,0,1,0,1,0,'2026-03-14 19:47:42','2026-03-14 19:47:42'),(23,1,'Diffuseur de senteur','diffuseur-de-senteur-sFx7PR','Petit appareil utilisé pour répandre un parfum agréable dans l’air d’une pièce. Humidifie légèrement l’air et améliore le confort respiratoire, tout en apportant une touche décorative à la pièce.',5000.00,NULL,NULL,0.0,0,1,0,1,0,'2026-03-14 19:54:21','2026-03-14 19:54:21'),(24,1,'Diffuseur de senteur','diffuseur-de-senteur-jWvMWp','Petit appareil utilisé pour répandre un parfum agréable dans l’air d’une pièce. Humidifie légèrement l’air et améliore le confort respiratoire, tout en apportant une touche décorative à la pièce.',5000.00,NULL,NULL,0.0,0,1,0,1,0,'2026-03-14 19:54:53','2026-03-14 19:54:53'),(25,1,'Pose téléphone en fer','pose-telephone-en-fer-CSqMCZ',NULL,1500.00,2000.00,NULL,0.0,0,1,0,1,0,'2026-03-14 19:57:15','2026-03-14 19:57:15'),(26,1,'Vibrateur .G','vibrateur-g-Toy4Al','Appareil pour massage',5000.00,7000.00,NULL,0.0,0,1,0,1,0,'2026-03-14 21:06:27','2026-03-14 21:06:27'),(28,1,'Fer à lisser 2 en 1','fer-a-lisser-2-en-1-SBIoHj',NULL,6000.00,10000.00,NULL,0.0,0,1,0,1,0,'2026-03-14 21:10:52','2026-03-14 21:10:52');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `is_visible` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reviews_user_id_product_id_unique` (`user_id`,`product_id`),
  KEY `reviews_product_id_index` (`product_id`),
  KEY `reviews_rating_index` (`rating`),
  CONSTRAINT `reviews_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_email_index` (`email`),
  KEY `users_role_index` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','Vanny','admin@vannystouch.com','2026-03-06 12:06:06','$2y$12$cwVfSNNKC2cr5mmIdyLJlOYUd0PuKHc/tlvNpETBYyTIpn5Id4zE2','+237 670000000','admin',NULL,1,NULL,'2026-03-06 12:06:06','2026-03-09 19:14:40');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'railway'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11  0:26:02
