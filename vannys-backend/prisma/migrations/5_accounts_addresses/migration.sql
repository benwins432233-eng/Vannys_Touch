-- L4 — Comptes vérifiés, mot de passe oublié, carnet d'adresses
--
-- Rien ne prouvait qu'une adresse email existait : une faute de frappe à
-- l'inscription et la cliente ne recevait jamais sa confirmation de commande,
-- sans que personne s'en aperçoive. Et une cliente ayant perdu son mot de passe
-- n'avait aucun recours : la seule route de réinitialisation exigeait d'être
-- déjà connectée.
--
-- L'adresse de livraison, elle, était ressaisie intégralement à chaque commande.

-- ── 1. Jetons de compte ──────────────────────────────────────────────────────
--
-- Seule l'EMPREINTE du jeton est stockée. Une fuite de la base ne donne accès à
-- aucun compte : on ne peut pas remonter du hachage au jeton envoyé par email.

CREATE TABLE `account_tokens` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `type`       ENUM('email_verification','password_reset') NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `used_at`    TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `account_tokens_token_hash_unique` (`token_hash`),
  INDEX `account_tokens_user_id_type_index` (`user_id`, `type`),
  INDEX `account_tokens_expires_at_index` (`expires_at`),
  CONSTRAINT `account_tokens_user_id_foreign` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);

-- ── 2. Carnet d'adresses ─────────────────────────────────────────────────────

CREATE TABLE `addresses` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `label`      VARCHAR(50) NOT NULL,
  `full_name`  VARCHAR(100) NOT NULL,
  `phone`      VARCHAR(30) NOT NULL,
  `city`       VARCHAR(100) NOT NULL,
  `district`   VARCHAR(100) NOT NULL,
  `address`    TEXT NOT NULL,
  `landmark`   VARCHAR(255) NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  INDEX `addresses_user_id_index` (`user_id`),
  CONSTRAINT `addresses_user_id_foreign` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);

-- ── 3. Comptes existants considérés comme vérifiés ───────────────────────────
--
-- DÉCISION À CONNAÎTRE : la commande exige désormais un email vérifié. Les
-- comptes créés avant l'existence de la vérification n'ont jamais eu l'occasion
-- de la faire ; les laisser non vérifiés empêcherait toutes les clientes
-- actuelles de commander du jour au lendemain.
--
-- Ils sont donc marqués comme vérifiés à leur date d'inscription. Cela ne prouve
-- pas que leurs adresses sont valides — l'administration peut retirer la
-- vérification d'un compte au cas par cas si un email revient en erreur.
-- La vérification s'applique pleinement aux comptes créés à partir de maintenant.

UPDATE `users`
   SET `email_verified_at` = COALESCE(`created_at`, NOW())
 WHERE `email_verified_at` IS NULL;
