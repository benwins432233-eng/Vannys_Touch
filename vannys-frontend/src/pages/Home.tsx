import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  ShoppingBag, 
  Truck, 
  Shield, 
  RefreshCw, 
  Headphones,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import type { Product } from '@/types';

// Hero Section
function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
      title: 'Votre Style.\nVotre Tech.\nVotre Touch.',
      subtitle: 'Découvrez l\'excellence dans chaque détail. Des produits qui allient innovation et élégance.',
    },
    {
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&auto=format&fit=crop&q=80',
      title: 'Nouvelle\nCollection\nMode 2026',
      subtitle: 'Des vêtements tendance pour exprimer votre personnalité unique.',
    },
    {
      image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1600&auto=format&fit=crop&q=80',
      title: 'Technologie\nde Pointe',
      subtitle: 'Les derniers gadgets et appareils électroniques pour simplifier votre vie.',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative h-screen min-h-[700px] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center transform scale-105"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>
      ))}

      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20">
          <div className="max-w-2xl">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  index === currentSlide 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-10 absolute'
                }`}
              >
                {index === currentSlide && (
                  <>
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight whitespace-pre-line">
                      {slide.title}
                    </h1>
                    <p className="text-xl text-white/90 mb-8">{slide.subtitle}</p>
                    <div className="flex flex-wrap gap-4">
                      <Link to="/shop" className="btn-primary text-lg">
                        <ShoppingBag className="w-5 h-5" />
                        <span>Explorer la boutique</span>
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                      <Link
                        to="/shop"
                        className="btn-secondary text-lg bg-white/10 border-white/30 text-white hover:bg-white hover:text-gray-900"
                      >
                        <span>Découvrir</span>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            ))}

            <div className="flex gap-8 mt-16">
              <div className="text-center">
                <span className="block text-4xl font-bold text-white">500+</span>
                <span className="text-white/70">Produits</span>
              </div>
              <div className="text-center">
                <span className="block text-4xl font-bold text-white">98%</span>
                <span className="text-white/70">Satisfaction</span>
              </div>
              <div className="text-center">
                <span className="block text-4xl font-bold text-white">24/7</span>
                <span className="text-white/70">Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  );
}

// Featured Products Section
function FeaturedProducts() {
  const { addToCart } = useCart();
  const { products, loading } = useProducts({ per_page: 6 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -320 : 320,
        behavior: 'smooth'
      });
    }
  };

  const getProductImage = (product: Product) => {
    return product.images?.[0]?.url ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
  };

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="min-w-[300px] h-96 bg-gray-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meilleures Ventes</h2>
            <p className="text-gray-600 text-lg">Découvrez nos produits les plus populaires</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => scroll('left')}
              className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-500 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-500 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product, index) => (
            <div
              key={product.id}
              className="min-w-[300px] max-w-[300px] snap-start"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="card card-hover group">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {product.badge && (
                    <span className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
                      {product.badge}
                    </span>
                  )}
                  {product.original_price && (
                    <span className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                      -{Math.round((1 - Number(product.price) / Number(product.original_price)) * 100)}%
                    </span>
                  )}
                  <button
                    onClick={() => addToCart(product)}
                    className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-blue-600 hover:text-white"
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5">
                  <span className="text-sm text-blue-600 font-medium">
                    {product.category?.name ?? ''}
                  </span>
                  <h3 className="font-semibold text-gray-900 mt-1 mb-2 line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(Number(product.rating ?? 0))
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900">
                      {Number(product.price).toLocaleString()} FCFA
                    </span>
                    {product.original_price && (
                      <span className="text-sm text-gray-400 line-through">
                        {Number(product.original_price).toLocaleString()} FCFA
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/shop" className="btn-primary">
            <span>Voir tous les produits</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Categories Section
function CategoriesSection() {
  const { categories, loading } = useCategories();

  if (loading || categories.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Catégories Populaires</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Explorez nos collections par catégories et trouvez exactement ce que vous cherchez
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.slice(0, 2).map((category, index) => (
            <Link
              key={category.id}
              to={`/shop?category=${category.slug}`}
              className="group relative h-80 rounded-3xl overflow-hidden"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div 
                className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                style={{ 
                  background: `linear-gradient(135deg, ${category.color}20, ${category.color}40)` 
                }}
              />
              <div className="relative h-full flex flex-col justify-center p-10">
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon === 'laptop' && '💻'}
                  {category.icon === 'tshirt' && '👕'}
                  {category.icon === 'spa' && '✨'}
                  {category.icon === 'home' && '🏠'}
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">{category.name}</h3>
                <p className="text-gray-600 mb-4 max-w-sm">{category.description}</p>
                <div className="flex items-center gap-2 text-blue-600 font-semibold">
                  <span>{category.active_products_count ?? 0} produits</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                </div>
              </div>
              <div 
                className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full opacity-20 transition-transform duration-700 group-hover:scale-150"
                style={{ backgroundColor: category.color }}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Features Section
function Features() {
  const features = [
    { icon: Truck, title: 'Livraison Rapide', description: 'Expédition en 24-48h sur toute commande', color: 'from-blue-500 to-blue-600' },
    { icon: Shield, title: 'Paiement Sécurisé', description: 'Transactions 100% sécurisées', color: 'from-green-500 to-green-600' },
    { icon: RefreshCw, title: 'Retours Faciles', description: '30 jours pour changer d\'avis', color: 'from-purple-500 to-purple-600' },
    { icon: Headphones, title: 'Support 24/7', description: 'Assistance client toujours disponible', color: 'from-pink-500 to-pink-600' },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="text-center p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-500"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-lg`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-xl text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="animate-fadeIn">
      <Hero />
      <FeaturedProducts />
      <CategoriesSection />
      <Features />
    </div>
  );
}
