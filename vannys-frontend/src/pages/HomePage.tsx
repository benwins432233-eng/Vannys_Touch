import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/use-products';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui';
import { formatPrice } from '@/utils';
import { useSettings } from '@/hooks/use-settings';

const FEATURES = [
  { icon: Truck, title: 'Livraison rapide', desc: 'Livraison à domicile dans tout le Bénin' },
  { icon: Shield, title: 'Paiement sécurisé', desc: 'Règlement à la livraison, sans risque' },
  { icon: RotateCcw, title: 'Retours faciles', desc: 'Satisfait ou remboursé sous 7 jours' },
  { icon: Star, title: 'Qualité garantie', desc: 'Produits soigneusement sélectionnés' },
];

const HERO_SLIDES = [
  {
    image: 'https://res.cloudinary.com/dggmjflpm/image/upload/v1781605678/photo-1550009158-9ebf69173e03_rbbeaa.jpg',
    title: 'Sublimez votre',
    highlight: 'style',
    subtitle: 'Découvrez des pièces uniques, élégantes et modernes. Livraison partout au Bénin.',
  },
  {
    image: 'https://res.cloudinary.com/dggmjflpm/image/upload/v1781605815/premium_vector-1682309458404-25b6bf0a64c6_af5p2k.png',
    title: 'Nouvelle',
    highlight: 'collection',
    subtitle: 'Des produits soigneusement sélectionnés pour vous offrir le meilleur.',
  },
  {
    image: 'https://res.cloudinary.com/dggmjflpm/image/upload/v1781605813/premium_photo-1769911313727-411e9b0d22f2_mga6jy.jpg',
    title: 'Élégance &',
    highlight: 'modernité',
    subtitle: 'Une sélection premium pour un lifestyle raffiné.',
  },
  {
    image: 'https://res.cloudinary.com/dggmjflpm/image/upload/v1781605811/premium_photo-1681488262364-8aeb1b6aac56_avrvmy.jpg',
    title: 'Votre destination',
    highlight: 'shopping',
    subtitle: 'Tout ce dont vous avez besoin, livré rapidement au Bénin.',
  },
  {
    image: 'https://res.cloudinary.com/dggmjflpm/image/upload/v1781605797/photo-1441986300917-64674bd600d8_arxpee.jpg',
    title: 'Qualité &',
    highlight: 'confiance',
    subtitle: 'Des produits authentiques pour une expérience d\'achat exceptionnelle.',
  },
];


export function HomePage() {
  const settings = useSettings();
  const { data: featured, isLoading: featuredLoading } = useProducts({ featured: true, limit: 8 });

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[600px] md:min-h-[700px] flex items-center">

        {/* Slides en arrière-plan */}
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[8000ms]"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            {/* Voile dégradé — assombrit la photo pour garder le texte lisible.
                Neutre par nature : il ne suit pas le thème, il couvre une image. */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/25" />
          </div>
        ))}

        {/* Contenu */}
        <div className="relative z-10 page-container py-20 md:py-28 w-full">
          <div className="max-w-xl">
            <span className="badge-gold text-xs mb-4 inline-block">Nouvelle collection</span>

            {HERO_SLIDES.map((slide, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  index === currentSlide
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-6 absolute pointer-events-none'
                }`}
              >
                {index === currentSlide && (
                  <>
                    <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                      {slide.title}{' '}
                      <span className="text-accent">{slide.highlight}</span>{' '}
                      {slide.title.includes('votre') ? 'avec Vannys Touch' : ''}
                    </h1>
                    <p className="text-lg text-white/85 mb-8 leading-relaxed">
                      {slide.subtitle}
                    </p>
                  </>
                )}
              </div>
            ))}

            <div className="flex gap-4 flex-wrap">
              <Link to="/products" className="btn-primary">
                Découvrir la boutique
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/products?featured=true"
                className="btn-outline border-white/60 text-white hover:bg-white hover:text-black"
              >
                Nos coups de cœur
              </Link>
            </div>
          </div>
        </div>

        {/* Points de navigation */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentSlide(index)}
              aria-label={`Afficher la diapositive ${index + 1} sur ${HERO_SLIDES.length}`}
              aria-current={index === currentSlide}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-8 bg-accent' : 'w-2 bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border">
        <div className="page-container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="p-2 rounded-lg shrink-0 bg-accent/15">
                  <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coups de cœur */}
      {(featuredLoading || (featured && featured.data.length > 0)) && (
        <section className="section">
          <div className="page-container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Nos coups de cœur</h2>
                <p className="text-muted-foreground mt-1">Sélection de nos meilleures pièces</p>
              </div>
              <Link
                to="/products"
                className="text-sm font-medium flex items-center gap-1 text-primary hover:underline"
              >
                Tout voir <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
            {featuredLoading ? (
              <div role="status" aria-busy="true">
                <span className="sr-only">Chargement de la sélection</span>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="aspect-[3/4]" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {featured?.data.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bandeau d'appel à l'action */}
      <section className="section bg-deep">
        <div className="page-container text-center">
          <h2 className="text-3xl font-bold text-deep-foreground mb-4">
            Livraison gratuite dès{' '}
            <span className="text-accent">
              {formatPrice(settings['shipping.freeThreshold'])}
            </span>
          </h2>
          <p className="text-deep-muted mb-8 max-w-md mx-auto">
            Commandez maintenant et recevez vos articles directement chez vous.
          </p>
          <Link to="/products" className="btn-primary">
            Faire mes achats
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
