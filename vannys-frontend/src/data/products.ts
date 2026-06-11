import type { Product, Category, User, Order } from '@/types';

export const categories: Category[] = [
  {
    id: '1',
    name: 'Électronique',
    slug: 'electronics',
    icon: 'laptop',
    description: 'Gadgets et appareils électroniques de dernière génération',
    productCount: 300,
    color: '#2196F3'
  },
  {
    id: '2',
    name: 'Mode',
    slug: 'fashion',
    icon: 'tshirt',
    description: 'Vêtements tendance pour homme, femme et enfant',
    productCount: 250,
    color: '#673AB7'
  },
  {
    id: '3',
    name: 'Beauté',
    slug: 'beauty',
    icon: 'spa',
    description: 'Produits de beauté et soins personnels',
    productCount: 150,
    color: '#FF4081'
  },
  {
    id: '4',
    name: 'Maison',
    slug: 'home',
    icon: 'home',
    description: 'Décoration et accessoires pour la maison',
    productCount: 180,
    color: '#4CAF50'
  }
];

export const products: Product[] = [
  // Electronics
  {
    id: '1',
    name: 'Casque Bluetooth Pro',
    description: 'Casque sans fil avec réduction de bruit active et autonomie de 30h',
    price: 45000,
    originalPrice: 55000,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
    category: 'electronics',
    subcategory: 'audio',
    rating: 4.8,
    reviews: 128,
    inStock: true,
    featured: true,
    badge: 'Promo',
    colors: ['Noir', 'Blanc', 'Bleu']
  },
  {
    id: '2',
    name: 'Montre Connectée Elite',
    description: 'Montre intelligente avec suivi de santé et notifications',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
    category: 'electronics',
    subcategory: 'wearables',
    rating: 4.6,
    reviews: 89,
    inStock: true,
    featured: true,
    colors: ['Noir', 'Argent', 'Or']
  },
  {
    id: '3',
    name: 'Enceinte Portable 360°',
    description: 'Enceinte waterproof avec son immersif à 360 degrés',
    price: 25000,
    originalPrice: 30000,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=60',
    category: 'electronics',
    subcategory: 'audio',
    rating: 4.5,
    reviews: 67,
    inStock: true,
    badge: '-17%',
    colors: ['Noir', 'Rouge', 'Bleu']
  },
  {
    id: '4',
    name: 'Batterie Externe 20000mAh',
    description: 'Powerbank ultra-capacité avec charge rapide',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&auto=format&fit=crop&q=60',
    category: 'electronics',
    subcategory: 'accessories',
    rating: 4.7,
    reviews: 234,
    inStock: true,
    colors: ['Noir', 'Blanc']
  },
  {
    id: '5',
    name: 'Écouteurs Sans Fil Air',
    description: 'Écouteurs True Wireless avec étui de charge',
    price: 20000,
    originalPrice: 25000,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60',
    category: 'electronics',
    subcategory: 'audio',
    rating: 4.4,
    reviews: 156,
    inStock: true,
    featured: true,
    badge: 'Best-seller',
    colors: ['Blanc', 'Noir']
  },
  {
    id: '6',
    name: 'Tablette Tactile 10"',
    description: 'Tablette performante pour le travail et le divertissement',
    price: 120000,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60',
    category: 'electronics',
    subcategory: 'tablets',
    rating: 4.3,
    reviews: 45,
    inStock: true,
    colors: ['Gris', 'Argent']
  },
  // Fashion
  {
    id: '7',
    name: 'Robe Élégante Fleurie',
    description: 'Robe longue en soie avec motif floral',
    price: 35000,
    originalPrice: 45000,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60',
    category: 'fashion',
    subcategory: 'femme',
    rating: 4.7,
    reviews: 89,
    inStock: true,
    featured: true,
    badge: 'Nouveau',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Rouge', 'Bleu', 'Noir']
  },
  {
    id: '8',
    name: 'Chemise Premium Homme',
    description: 'Chemise en coton égyptien de haute qualité',
    price: 18000,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=60',
    category: 'fashion',
    subcategory: 'homme',
    rating: 4.5,
    reviews: 134,
    inStock: true,
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Blanc', 'Bleu', 'Gris']
  },
  {
    id: '9',
    name: 'Sneakers Urban Style',
    description: 'Baskets tendance pour un look urbain',
    price: 28000,
    originalPrice: 35000,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60',
    category: 'fashion',
    subcategory: 'chaussures',
    rating: 4.8,
    reviews: 201,
    inStock: true,
    featured: true,
    badge: 'Top vente',
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Rouge', 'Noir', 'Blanc']
  },
  {
    id: '10',
    name: 'Veste en Cuir',
    description: 'Veste en cuir véritable style motard',
    price: 75000,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60',
    category: 'fashion',
    subcategory: 'homme',
    rating: 4.6,
    reviews: 56,
    inStock: true,
    sizes: ['M', 'L', 'XL'],
    colors: ['Noir', 'Marron']
  },
  {
    id: '11',
    name: 'Sac à Main Luxe',
    description: 'Sac à main en cuir avec finitions premium',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60',
    category: 'fashion',
    subcategory: 'accessoires',
    rating: 4.9,
    reviews: 78,
    inStock: true,
    featured: true,
    colors: ['Noir', 'Rouge', 'Beige']
  },
  {
    id: '12',
    name: 'T-Shirt Basique',
    description: 'T-shirt en coton bio confortable',
    price: 8000,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&auto=format&fit=crop&q=60',
    category: 'fashion',
    subcategory: 'homme',
    rating: 4.3,
    reviews: 312,
    inStock: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Blanc', 'Noir', 'Gris', 'Bleu']
  },
  // Beauty
  {
    id: '13',
    name: 'Coffret Soins Visage',
    description: 'Ensemble complet de soins pour le visage',
    price: 25000,
    originalPrice: 32000,
    image: 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b15?w=500&auto=format&fit=crop&q=60',
    category: 'beauty',
    subcategory: 'skincare',
    rating: 4.7,
    reviews: 145,
    inStock: true,
    badge: 'Coffret'
  },
  {
    id: '14',
    name: 'Parfum Élégance',
    description: 'Eau de parfum aux notes florales et boisées',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&auto=format&fit=crop&q=60',
    category: 'beauty',
    subcategory: 'parfum',
    rating: 4.8,
    reviews: 89,
    inStock: true,
    featured: true
  },
  {
    id: '15',
    name: 'Set Maquillage Pro',
    description: 'Palette complète de maquillage professionnel',
    price: 30000,
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=60',
    category: 'beauty',
    subcategory: 'makeup',
    rating: 4.5,
    reviews: 67,
    inStock: true
  },
  // Home
  {
    id: '16',
    name: 'Lampe Design Minimaliste',
    description: 'Lampe de table au design moderne et épuré',
    price: 22000,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60',
    category: 'home',
    subcategory: 'lighting',
    rating: 4.6,
    reviews: 43,
    inStock: true,
    featured: true,
    colors: ['Noir', 'Blanc', 'Or']
  },
  {
    id: '17',
    name: 'Vase Céramique Artisanal',
    description: 'Vase fait main en céramique',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500&auto=format&fit=crop&q=60',
    category: 'home',
    subcategory: 'decoration',
    rating: 4.4,
    reviews: 28,
    inStock: true,
    colors: ['Blanc', 'Gris', 'Terracotta']
  },
  {
    id: '18',
    name: 'Coussin Décoratif',
    description: 'Coussin en velours avec housse amovible',
    price: 8000,
    originalPrice: 12000,
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&auto=format&fit=crop&q=60',
    category: 'home',
    subcategory: 'textile',
    rating: 4.3,
    reviews: 156,
    inStock: true,
    badge: '-33%',
    colors: ['Bleu', 'Rose', 'Vert', 'Jaune']
  }
];

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@vannystouch.com',
    firstName: 'Admin',
    lastName: 'Vanny',
    phone: '+237 670000000',
    role: 'admin'
  },
  {
    id: '2',
    email: 'user@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '+237 671234567',
    role: 'user'
  }
];

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    userId: '2',
    items: [
      { ...products[0], quantity: 1 },
      { ...products[7], quantity: 2 }
    ],
    total: 81000,
    status: 'completed',
    paymentMethod: 'MTN',
    phoneNumber: '+237671234567',
    createdAt: new Date('2026-02-20'),
    updatedAt: new Date('2026-02-20')
  },
  {
    id: 'ORD-002',
    userId: '2',
    items: [
      { ...products[4], quantity: 1 }
    ],
    total: 20000,
    status: 'processing',
    paymentMethod: 'MOOV',
    phoneNumber: '+237671234567',
    createdAt: new Date('2026-02-22'),
    updatedAt: new Date('2026-02-22')
  }
];
