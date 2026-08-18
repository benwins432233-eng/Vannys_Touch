/**
 * Frais de livraison affichés côté client.
 *
 * Ces valeurs ne servent qu'à *montrer* une estimation : le serveur recalcule
 * toujours le total à la création de la commande, et c'est lui qui fait foi.
 * Elles étaient recopiées dans le panier et dans le tunnel de commande, qui
 * pouvaient donc afficher deux montants différents.
 *
 * TODO (lot L6) : lire ces valeurs depuis `GET /settings` au lieu de les figer,
 * pour qu'un changement de tarif ne demande plus un redéploiement.
 */
export const FREE_SHIPPING_THRESHOLD = 50000;
export const SHIPPING_FEE = 2500;
