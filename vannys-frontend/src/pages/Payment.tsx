import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Check, Loader2, Shield,
  Smartphone, AlertCircle, CreditCard, Clock,
  MapPin, User, Phone, ChevronRight
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { ordersService } from '@/api/services';
import { ApiException } from '@/api/client';
import { toast } from 'sonner';

// ── Logos SVG opérateurs ────────────────────────────────────────
const MtnLogo = () => (
  <svg viewBox="0 0 80 40" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="40" rx="8" fill="#FFCC00"/>
    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
      fontFamily="Arial Black, sans-serif" fontWeight="900"
      fontSize="18" fill="#1a1a1a" letterSpacing="1">MTN</text>
  </svg>
);
const MoovLogo = () => (
  <svg viewBox="0 0 80 40" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="40" rx="8" fill="#0055A5"/>
    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
      fontFamily="Arial Black, sans-serif" fontWeight="900"
      fontSize="16" fill="#ffffff" letterSpacing="1">MOOV</text>
  </svg>
);
const CeltiisLogo = () => (
  <svg viewBox="0 0 80 40" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="40" rx="8" fill="#1B3A6B"/>
    <text x="50%" y="38%" dominantBaseline="middle" textAnchor="middle"
      fontFamily="Arial Black, sans-serif" fontWeight="900"
      fontSize="13" fill="#7DC52E" letterSpacing="1">celtiis</text>
    <text x="50%" y="72%" dominantBaseline="middle" textAnchor="middle"
      fontFamily="Arial, sans-serif" fontWeight="600"
      fontSize="9" fill="#ffffff" letterSpacing="2">Cash</text>
  </svg>
);

const OPERATORS = [
  { id: 'MTN'     as const, label: 'MTN MoMo',    border: 'border-yellow-400', ring: 'ring-yellow-400/20', Logo: MtnLogo     },
  { id: 'MOOV'   as const, label: 'Moov Money',  border: 'border-blue-600',   ring: 'ring-blue-600/20',   Logo: MoovLogo    },
  { id: 'CELTIIS' as const, label: 'Celtiis Cash', border: 'border-blue-900', ring: 'ring-blue-900/20', Logo: CeltiisLogo },
];
type OperatorId = typeof OPERATORS[number]['id'];

const CITIES = ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Djougou', 'Bohicon', 'Kandi', 'Lokossa', 'Ouidah', 'Natitingou', 'Autre'];

interface DeliveryForm {
  full_name: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  landmark: string;
}

export default function Payment() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();

  const [step, setStep]                   = useState(1); // 1=livraison, 2=paiement, 3=succès
  const [paymentMethod, setPaymentMethod] = useState<OperatorId>('MTN');
  const [phoneNumber, setPhoneNumber]     = useState(user?.phone || '');
  const [isProcessing, setIsProcessing]   = useState(false);
  const [orderReference, setOrderReference] = useState('');

  const [delivery, setDelivery] = useState<DeliveryForm>({
    full_name: `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim(),
    phone:     user?.phone || '',
    city:      '',
    district:  '',
    address:   '',
    landmark:  '',
  });

  const shipping   = totalPrice > 50000 ? 0 : 2500;
  const finalTotal = totalPrice + shipping;
  const selectedOp = OPERATORS.find(o => o.id === paymentMethod)!;

  const setField = (field: keyof DeliveryForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDelivery(prev => ({ ...prev, [field]: e.target.value }));

  const validateDelivery = () => {
    if (!delivery.full_name.trim()) { toast.error('Veuillez entrer le nom du destinataire'); return false; }
    if (!delivery.phone.trim())     { toast.error('Veuillez entrer un téléphone de livraison'); return false; }
    if (!delivery.city)             { toast.error('Veuillez sélectionner une ville'); return false; }
    if (!delivery.district.trim())  { toast.error('Veuillez entrer le quartier'); return false; }
    if (!delivery.address.trim())   { toast.error('Veuillez entrer l\'adresse précise'); return false; }
    return true;
  };

  const validatePhone = (phone: string) => /^(\+229|229)?[0-9]{8,9}$/.test(phone.replace(/\s/g, ''));

  const handleConfirm = async () => {
    if (!validatePhone(phoneNumber)) {
      toast.error('Veuillez entrer un numéro de téléphone valide');
      return;
    }
    if (items.length === 0) { toast.error('Votre panier est vide'); navigate('/cart'); return; }

    setIsProcessing(true);
    try {
      const order = await ordersService.create({
        payment_method:      paymentMethod,
        phone_number:        phoneNumber.replace(/\s/g, ''),
        delivery_full_name:  delivery.full_name,
        delivery_phone:      delivery.phone.replace(/\s/g, ''),
        delivery_city:       delivery.city,
        delivery_district:   delivery.district,
        delivery_address:    delivery.address,
        delivery_landmark:   delivery.landmark || undefined,
        items: items.map(i => ({
          product_id: i.product.id,
          quantity:   i.quantity,
          color:      i.selected_color,
          size:       i.selected_size,
        })),
      });

      setOrderReference(order.reference);
      setStep(3);
      toast.success('Commande enregistrée !');
      setTimeout(() => clearCart(), 1000);
    } catch (err) {
      toast.error(err instanceof ApiException ? err.message : 'Erreur. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Étape 3 : Succès ───────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16 animate-fadeIn">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-3xl p-8 md:p-12 text-center shadow-sm">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Commande confirmée !</h1>
            <p className="text-gray-600 mb-8">
              Votre commande a été enregistrée. Notre équipe vous contactera sur{' '}
              <strong>{phoneNumber}</strong> pour finaliser le paiement {selectedOp.label}.
            </p>

            <div className="bg-gray-50 rounded-2xl p-6 mb-4 text-left space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Numéro de commande</span>
                <span className="font-mono font-bold text-blue-600">{orderReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Méthode de paiement</span>
                <div className="w-16 h-8"><selectedOp.Logo /></div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Montant total</span>
                <span className="font-semibold">{finalTotal.toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Récap livraison */}
            <div className="bg-green-50 rounded-2xl p-6 mb-8 text-left space-y-2 text-sm">
              <p className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Adresse de livraison
              </p>
              <p className="text-gray-700 font-medium">{delivery.full_name}</p>
              <p className="text-gray-600">{delivery.phone}</p>
              <p className="text-gray-600">{delivery.address}, {delivery.district}, {delivery.city}</p>
              {delivery.landmark && <p className="text-gray-500 italic">Repère : {delivery.landmark}</p>}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => navigate('/shop')} className="flex-1 btn-primary justify-center">
                Continuer mes achats
              </button>
              <button onClick={() => navigate('/')} className="flex-1 btn-secondary justify-center">
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm";

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 animate-fadeIn">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => step === 2 ? setStep(1) : navigate('/cart')}
            className="p-2 rounded-xl hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {step === 1 ? 'Livraison' : 'Paiement'}
            </h1>
            <p className="text-gray-600">
              {step === 1 ? 'Où souhaitez-vous être livré ?' : 'Finalisez votre commande'}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          {[
            { icon: MapPin,     label: 'Livraison', s: 1 },
            { icon: CreditCard, label: 'Paiement',  s: 2 },
            { icon: Check,      label: 'Terminé',   s: 3 },
          ].map(({ icon: Icon, label, s }, i) => (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className="w-10 h-px bg-gray-200 mx-1" />}
              <div className={`flex items-center gap-2 ${step >= s ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-medium hidden sm:block text-sm">{label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">

            {/* ── ÉTAPE 1 : Livraison ── */}
            {step === 1 && (
              <>
                <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" /> Destinataire
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                    <input value={delivery.full_name} onChange={setField('full_name')}
                      placeholder="Prénom et Nom" className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone de livraison *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="tel" value={delivery.phone} onChange={setField('phone')}
                        placeholder="+229 97 00 00 00" className={`${inputClass} pl-10`} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-500" /> Adresse de livraison
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                    <select value={delivery.city} onChange={setField('city')} className={inputClass}>
                      <option value="">Sélectionner une ville</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quartier / Arrondissement *</label>
                    <input value={delivery.district} onChange={setField('district')}
                      placeholder="Ex: Cadjehoun, Fidjrossè, Akpakpa..." className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse précise *</label>
                    <textarea value={delivery.address} onChange={setField('address')}
                      placeholder="Ex: Rue des Cocotiers, maison bleue en face de la pharmacie..."
                      rows={3}
                      className={`${inputClass} resize-none`} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Point de repère <span className="text-gray-400">(optionnel)</span>
                    </label>
                    <input value={delivery.landmark} onChange={setField('landmark')}
                      placeholder="Ex: à côté du marché Dantokpa, derrière l'église..."
                      className={inputClass} />
                  </div>
                </div>

                <button onClick={() => { if (validateDelivery()) setStep(2); }}
                  className="w-full btn-primary justify-center text-lg py-5">
                  Continuer vers le paiement <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* ── ÉTAPE 2 : Paiement ── */}
            {step === 2 && (
              <>
                {/* Récap livraison */}
                <div className="bg-green-50 rounded-2xl p-4 flex items-start gap-3 border border-green-200">
                  <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-green-800">{delivery.full_name} · {delivery.phone}</p>
                    <p className="text-green-700">{delivery.address}, {delivery.district}, {delivery.city}</p>
                    {delivery.landmark && <p className="text-green-600 italic">{delivery.landmark}</p>}
                  </div>
                  <button onClick={() => setStep(1)} className="text-xs text-green-700 underline flex-shrink-0">
                    Modifier
                  </button>
                </div>

                {/* Opérateurs */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Moyen de paiement</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {OPERATORS.map(({ id, label, border, ring, Logo }) => (
                      <button key={id} onClick={() => setPaymentMethod(id)}
                        className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                          paymentMethod === id
                            ? `${border} ring-4 ${ring} bg-gray-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        {paymentMethod === id && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="w-20 h-10"><Logo /></div>
                        <p className="text-center text-xs font-semibold text-gray-700">{label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Numéro */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Numéro {selectedOp.label}
                  </h2>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="tel" value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+229 97 00 00 00"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-lg"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Numéro associé à votre compte {selectedOp.label}
                  </p>
                </div>

                {/* Sécurité */}
                <div className="bg-green-50 rounded-2xl p-6 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">Commande sécurisée</h3>
                    <p className="text-green-700 text-sm">
                      Notre équipe vous contactera pour finaliser le paiement via {selectedOp.label}.
                    </p>
                  </div>
                </div>

                <button onClick={handleConfirm}
                  disabled={isProcessing || !phoneNumber}
                  className="w-full btn-primary justify-center text-lg py-5 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isProcessing
                    ? <><Loader2 className="w-6 h-6 animate-spin" /><span>Enregistrement...</span></>
                    : <><span>Confirmer — {finalTotal.toLocaleString()} FCFA</span><Check className="w-6 h-6" /></>
                  }
                </button>
              </>
            )}
          </div>

          {/* Récap droite */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Récapitulatif</h2>
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.selected_color}-${item.selected_size}`} className="flex gap-4">
                    <img src={item.product.images?.[0]?.url ?? '/placeholder.jpg'}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 line-clamp-1">{item.product.name}</h4>
                      <p className="text-sm text-gray-500">
                        Qté: {item.quantity}
                        {item.selected_color && ` · ${item.selected_color}`}
                        {item.selected_size  && ` · ${item.selected_size}`}
                      </p>
                      <p className="font-medium text-gray-900">
                        {(Number(item.product.price) * item.quantity).toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-px bg-gray-200 mb-4" />
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total</span><span>{totalPrice.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Livraison</span>
                  <span>{shipping === 0 ? 'Gratuite' : `${shipping.toLocaleString()} FCFA`}</span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span><span>{finalTotal.toLocaleString()} FCFA</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl mb-4">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900">Livraison estimée</p>
                  <p className="text-sm text-blue-700">2-4 jours ouvrables</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                {OPERATORS.map(({ id, Logo }) => (
                  <div key={id} className="w-14 h-7 opacity-60 hover:opacity-100 transition-opacity">
                    <Logo />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
