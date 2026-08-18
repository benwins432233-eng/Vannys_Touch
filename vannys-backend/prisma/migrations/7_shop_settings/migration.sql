-- L6 — Réglages de boutique en base
--
-- Les frais de livraison et le seuil de gratuité vivaient dans les variables
-- d'environnement de Render : changer un tarif demandait un redéploiement, et
-- le frontend en gardait sa propre copie en dur — les deux pouvaient afficher
-- des montants différents. Le nom, le téléphone, le WhatsApp, l'email et
-- l'adresse de la boutique étaient, eux, écrits en dur dans le pied de page.
--
-- La valeur est stockée en texte et convertie selon `type` : une table par
-- réglage serait ingérable, et un schéma figé imposerait une migration à chaque
-- nouveau paramètre.

CREATE TABLE `settings` (
  `key`        VARCHAR(60) NOT NULL,
  `value`      TEXT NOT NULL,
  `type`       ENUM('string','number','boolean','json') NOT NULL,
  `updated_at` TIMESTAMP NULL,
  PRIMARY KEY (`key`)
);

-- Valeurs initiales identiques à ce que la boutique servait jusqu'ici :
-- FREE_SHIPPING_THRESHOLD et SHIPPING_FEE de render.yaml, et les coordonnées
-- qui figuraient en dur dans le pied de page. Rien ne change le jour du
-- déploiement ; seule la façon de les modifier change.
INSERT INTO `settings` (`key`, `value`, `type`) VALUES
  ('shipping.fee',             '2500',                    'number'),
  ('shipping.freeThreshold',   '50000',                   'number'),
  ('shipping.message',         'Livraison à domicile dans tout le Bénin sous 24 à 72 heures.', 'string'),
  ('shop.name',                'Vannys Touch',            'string'),
  ('shop.phone',               '+229 01 41 19 66 51',     'string'),
  ('shop.whatsapp',            '2290141196651',           'string'),
  ('shop.email',               'vannystouch.shop@gmail.com', 'string'),
  ('shop.address',             'F82W+4P8, Abomey-Calavi, Bénin', 'string'),
  ('payment.methods',          '["CASH_ON_DELIVERY"]',    'json');
