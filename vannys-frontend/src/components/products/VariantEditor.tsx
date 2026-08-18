import { useState } from 'react';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { Badge, Button, IconButton, InputField } from '@/components/ui';
import { cn } from '@/utils';

export interface VariantDraft {
  size: string;
  color: string;
  stock: number;
  isActive: boolean;
}

interface VariantEditorProps {
  value: VariantDraft[];
  onChange: (next: VariantDraft[]) => void;
  /** Seuil du produit : sert à signaler les déclinaisons en stock faible. */
  lowStockThreshold: number;
}

const emptyDraft = (): VariantDraft => ({ size: '', color: '', stock: 0, isActive: true });

const keyOf = (v: VariantDraft) => `${v.size.trim()}::${v.color.trim()}`;

/** Découpe « S, M, L » en ['S','M','L'] ; une liste vide vaut « pas de déclinaison ». */
const parseList = (raw: string): string[] =>
  [...new Set(raw.split(',').map((v) => v.trim()).filter(Boolean))];

/**
 * Éditeur de déclinaisons vendables : une ligne = une combinaison
 * taille × couleur, avec son stock propre.
 *
 * Le générateur ne remplace jamais un stock déjà saisi : il ajoute les
 * combinaisons manquantes et laisse les autres intactes.
 */
export function VariantEditor({ value, onChange, lowStockThreshold }: VariantEditorProps) {
  const [colorsInput, setColorsInput] = useState('');
  const [sizesInput, setSizesInput] = useState('');

  const update = (index: number, patch: Partial<VariantDraft>) =>
    onChange(value.map((v, i) => (i === index ? { ...v, ...patch } : v)));

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));

  const generate = () => {
    const colors = parseList(colorsInput);
    const sizes = parseList(sizesInput);
    if (!colors.length && !sizes.length) return;

    const combinations: VariantDraft[] =
      colors.length && sizes.length
        ? colors.flatMap((color) => sizes.map((size) => ({ ...emptyDraft(), color, size })))
        : colors.length
          ? colors.map((color) => ({ ...emptyDraft(), color }))
          : sizes.map((size) => ({ ...emptyDraft(), size }));

    const existing = new Set(value.map(keyOf));
    onChange([...value, ...combinations.filter((c) => !existing.has(keyOf(c)))]);
    setColorsInput('');
    setSizesInput('');
  };

  const duplicates = new Set(
    value.map(keyOf).filter((k, i, all) => all.indexOf(k) !== i),
  );

  const total = value
    .filter((v) => v.isActive)
    .reduce((sum, v) => sum + (Number.isFinite(v.stock) ? v.stock : 0), 0);

  return (
    <fieldset className="space-y-3">
      <legend className="block text-sm font-medium text-foreground mb-1.5">
        Déclinaisons et stock
      </legend>

      {/* Générateur */}
      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end p-3 rounded-token bg-muted">
        <InputField
          label="Couleurs"
          hint="Séparées par des virgules."
          placeholder="Rouge, Bleu"
          value={colorsInput}
          onChange={(e) => setColorsInput(e.target.value)}
        />
        <InputField
          label="Tailles"
          hint="Séparées par des virgules."
          placeholder="S, M, L"
          value={sizesInput}
          onChange={(e) => setSizesInput(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={generate}
          leftIcon={<Wand2 className="w-4 h-4" aria-hidden="true" />}
        >
          Générer
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune déclinaison. Ajoutez-en une, ou laissez la liste vide pour un produit qui ne se
          décline pas — une déclinaison unique portera alors son stock.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Déclinaisons vendables du produit</caption>
            <thead>
              <tr>
                {['Taille', 'Couleur', 'Stock', 'En vente', ''].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.map((variant, index) => {
                const duplicated = duplicates.has(keyOf(variant));
                const low = variant.isActive && variant.stock > 0 && variant.stock <= lowStockThreshold;

                return (
                  <tr key={index} className={cn(duplicated && 'bg-destructive/10')}>
                    <td className="px-2 py-1.5">
                      <input
                        aria-label={`Taille de la déclinaison ${index + 1}`}
                        className="input py-1.5 w-24"
                        value={variant.size}
                        onChange={(e) => update(index, { size: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        aria-label={`Couleur de la déclinaison ${index + 1}`}
                        className="input py-1.5 w-28"
                        value={variant.color}
                        onChange={(e) => update(index, { color: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          aria-label={`Stock de la déclinaison ${index + 1}`}
                          className="input py-1.5 w-20"
                          value={variant.stock}
                          onChange={(e) =>
                            update(index, { stock: Math.max(0, Number(e.target.value) || 0) })
                          }
                        />
                        {low && <Badge tone="warning">Faible</Badge>}
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="checkbox"
                        aria-label={`Mettre en vente la déclinaison ${index + 1}`}
                        checked={variant.isActive}
                        onChange={(e) => update(index, { isActive: e.target.checked })}
                        className="rounded border-input accent-[hsl(var(--primary))]"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <IconButton
                        label={`Retirer la déclinaison ${index + 1}`}
                        tone="destructive"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => removeAt(index)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange([...value, emptyDraft()])}
          leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
        >
          Ajouter une déclinaison
        </Button>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Stock total en vente : <span className="font-semibold text-foreground">{total}</span>
        </p>
      </div>

      {duplicates.size > 0 && (
        <p className="text-xs text-destructive" role="alert">
          Deux déclinaisons portent la même taille et la même couleur : seule la dernière serait
          conservée.
        </p>
      )}
    </fieldset>
  );
}
