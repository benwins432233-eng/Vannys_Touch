import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import { useProducts } from '@/hooks/use-products';
import { ProductCard } from '@/components/products/ProductCard';

const FEATURES = [
  { icon: Truck, title: 'Livraison rapide', desc: 'Livraison à domicile dans tout le Bénin' },
  { icon: Shield, title: 'Paiement sécurisé', desc: 'Règlement à la livraison, sans risque' },
  { icon: RotateCcw, title: 'Retours faciles', desc: 'Satisfait ou remboursé sous 7 jours' },
  { icon: Star, title: 'Qualité garantie', desc: 'Produits soigneusement sélectionnés' },
];

export function HomePage() {
  const { data: featured } = useProducts({ featured: true, limit: 8 });

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-stone-50 to-amber-50 overflow-hidden">
        <div className="page-container py-20 md:py-28">
          <div className="max-w-xl">
            <span className="badge-gold text-xs mb-4 inline-block">Nouvelle collection</span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Sublimez votre{' '}
              <span style={{ color: 'var(--color-gold)' }}>style</span> avec Vannys Touch
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Découvrez des pièces uniques, élégantes et modernes. Livraison partout au Bénin.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link to="/products" className="btn-primary">
                Découvrir la boutique
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/products?featured=true" className="btn-outline">
                Nos coups de cœur
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative shape */}
        <div
          className="absolute right-0 top-0 w-1/2 h-full hidden md:block opacity-20"
          style={{
            background: 'radial-gradient(circle at 70% 50%, #c8a96e 0%, transparent 70%)',
          }}
        />
      </section>

      {/* Features */}
      <section className="border-b border-gray-100">
        <div className="page-container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="p-2 rounded-lg shrink-0" style={{ background: '#fdf4e7' }}>
                  <Icon className="w-5 h-5" style={{ color: 'var(--color-gold)' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featured && featured.data.length > 0 && (
        <section className="section">
          <div className="page-container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Nos coups de cœur</h2>
                <p className="text-gray-500 mt-1">Sélection de nos meilleures pièces</p>
              </div>
              <Link
                to="/products"
                className="text-sm font-medium flex items-center gap-1 hover:underline"
                style={{ color: 'var(--color-gold)' }}
              >
                Tout voir <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {featured.data.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="section bg-gray-900">
        <div className="page-container text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Livraison gratuite dès{' '}
            <span style={{ color: '#c8a96e' }}>50 000 FCFA</span>
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
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
