-- L1 — Stocks et variantes réelles
--
-- Avant : `product_variants` listait des ATTRIBUTS (une ligne « couleur = Rouge »,
-- une ligne « taille = M »), sans stock. Rien n'empêchait de vendre dix fois le
-- dernier article, et la disponibilité tenait dans un booléen `products.in_stock`
-- saisi à la main.
--
-- Après : une ligne = une COMBINAISON vendable (taille × couleur) qui porte son
-- propre stock. La disponibilité d'un produit se déduit de la somme des stocks ;
-- `products.in_stock` disparaît, deux sources de vérité finissant toujours par
-- diverger.
--
-- REPRISE DES DONNÉES — hypothèse à connaître : l'ancien modèle ne stockait
-- aucune quantité. Les combinaisons créées reçoivent donc 10 unités si le produit
-- était marqué en stock, 0 sinon. Ce chiffre est arbitraire : il préserve la
-- disponibilité affichée en production, mais un inventaire réel doit être saisi
-- dans l'administration après la migration.
--
-- Les anciennes lignes sont conservées dans `product_variants_legacy`, à
-- supprimer une fois l'inventaire vérifié.

-- ── 1. Référence produit lisible et seuil de stock faible ────────────────────

ALTER TABLE `products` ADD COLUMN `low_stock_threshold` SMALLINT UNSIGNED NOT NULL DEFAULT 3;
ALTER TABLE `products` ADD COLUMN `reference` VARCHAR(30) NULL;

UPDATE `products` SET `reference` = CONCAT('PRD-', LPAD(`id`, 5, '0')) WHERE `reference` IS NULL;

ALTER TABLE `products` MODIFY COLUMN `reference` VARCHAR(30) NOT NULL;
CREATE UNIQUE INDEX `products_reference_unique` ON `products`(`reference`);

-- ── 2. Sauvegarde des anciennes variantes ────────────────────────────────────

CREATE TABLE `product_variants_legacy` (
  `id`         BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `type`       VARCHAR(10) NOT NULL,
  `value`      VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `product_variants_legacy_product_id_index` (`product_id`)
);

INSERT INTO `product_variants_legacy` (`id`, `product_id`, `type`, `value`)
SELECT `id`, `product_id`, `type`, `value` FROM `product_variants`;

-- ── 3. Nouvelles colonnes de variante ────────────────────────────────────────

ALTER TABLE `product_variants` ADD COLUMN `size` VARCHAR(50) NULL;
ALTER TABLE `product_variants` ADD COLUMN `color` VARCHAR(50) NULL;
ALTER TABLE `product_variants` ADD COLUMN `stock` INT UNSIGNED NOT NULL DEFAULT 0;
ALTER TABLE `product_variants` ADD COLUMN `sku` VARCHAR(60) NULL;
ALTER TABLE `product_variants` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE `product_variants` ADD COLUMN `updated_at` TIMESTAMP NULL;

-- Les anciennes lignes sont remplacées par des combinaisons : on vide la table
-- avant de retirer `type` et `value`, qui sont NOT NULL et sans valeur par défaut.
DELETE FROM `product_variants`;

ALTER TABLE `product_variants` DROP COLUMN `type`;
ALTER TABLE `product_variants` DROP COLUMN `value`;

-- ── 4. Reconstruction des combinaisons vendables ─────────────────────────────

-- 4a. Produits déclinés en couleurs ET en tailles → produit cartésien.
INSERT INTO `product_variants` (`product_id`, `color`, `size`, `stock`, `is_active`, `created_at`)
SELECT c.`product_id`, c.`value`, s.`value`,
       CASE WHEN p.`in_stock` = 1 THEN 10 ELSE 0 END, 1, NOW()
FROM (SELECT DISTINCT `product_id`, `value` FROM `product_variants_legacy` WHERE `type` = 'color') c
JOIN (SELECT DISTINCT `product_id`, `value` FROM `product_variants_legacy` WHERE `type` = 'size') s
  ON s.`product_id` = c.`product_id`
JOIN `products` p ON p.`id` = c.`product_id`;

-- 4b. Produits déclinés en couleurs seulement.
INSERT INTO `product_variants` (`product_id`, `color`, `size`, `stock`, `is_active`, `created_at`)
SELECT DISTINCT c.`product_id`, c.`value`, NULL,
       CASE WHEN p.`in_stock` = 1 THEN 10 ELSE 0 END, 1, NOW()
FROM `product_variants_legacy` c
JOIN `products` p ON p.`id` = c.`product_id`
WHERE c.`type` = 'color'
  AND NOT EXISTS (
    SELECT 1 FROM `product_variants_legacy` s
    WHERE s.`product_id` = c.`product_id` AND s.`type` = 'size'
  );

-- 4c. Produits déclinés en tailles seulement.
INSERT INTO `product_variants` (`product_id`, `color`, `size`, `stock`, `is_active`, `created_at`)
SELECT DISTINCT s.`product_id`, NULL, s.`value`,
       CASE WHEN p.`in_stock` = 1 THEN 10 ELSE 0 END, 1, NOW()
FROM `product_variants_legacy` s
JOIN `products` p ON p.`id` = s.`product_id`
WHERE s.`type` = 'size'
  AND NOT EXISTS (
    SELECT 1 FROM `product_variants_legacy` c
    WHERE c.`product_id` = s.`product_id` AND c.`type` = 'color'
  );

-- 4d. Produits sans aucune déclinaison : une variante unique porte leur stock.
--     Sans elle, ces produits deviendraient invendables du jour au lendemain.
INSERT INTO `product_variants` (`product_id`, `color`, `size`, `stock`, `is_active`, `created_at`)
SELECT p.`id`, NULL, NULL,
       CASE WHEN p.`in_stock` = 1 THEN 10 ELSE 0 END, 1, NOW()
FROM `products` p
WHERE NOT EXISTS (
  SELECT 1 FROM `product_variants_legacy` l WHERE l.`product_id` = p.`id`
);

-- ── 5. Contraintes d'unicité ─────────────────────────────────────────────────

CREATE UNIQUE INDEX `product_variants_product_size_color_unique`
  ON `product_variants`(`product_id`, `size`, `color`);
CREATE UNIQUE INDEX `product_variants_sku_unique` ON `product_variants`(`sku`);

-- ── 6. Fin des deux sources de vérité ────────────────────────────────────────
-- `in_stock` a servi à initialiser les stocks ci-dessus ; l'API le recalcule
-- désormais à partir des variantes et continue de l'exposer aux clients.

ALTER TABLE `products` DROP COLUMN `in_stock`;
