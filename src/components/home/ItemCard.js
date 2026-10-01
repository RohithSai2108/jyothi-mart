'use client';
import { useState, useMemo, memo } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { Plus, Minus, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import VariantSelectModal from '@/components/home/VariantSelectModal';

function ItemCard({ item, className }) {
  const { addItem, removeItem, getItemQty } = useCart();
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasVariants = Array.isArray(item.variants) && item.variants.length > 0;
  
  const isOutOfStock = useMemo(() => {
    if (typeof item.stock === 'number') return item.stock <= 0;
    if (item.stock && typeof item.stock === 'object') {
      const full = typeof item.stock.quantity === 'number' ? item.stock.quantity : 0;
      const loose = typeof item.stock.looseQuantity === 'number' ? item.stock.looseQuantity : 0;
      return (full <= 0 && loose <= 0);
    }
    return false;
  }, [item.stock]);

  const displayName = useMemo(() => {
    let name = item.displayName || item.name || '';
    // Strip raw pricing suffixes e.g. " 160/-", " 10/-", " 5/-"
    name = name.replace(/\s*\b\d+\/-\s*/g, ' ');
    // Clean typos like 'cofee' -> 'Coffee'
    name = name.replace(/\bcofee\b/gi, 'Coffee');
    if (/^gemini\b/i.test(name) && !/tea/i.test(name)) {
      name = name.replace(/^gemini/i, 'Gemini Tea');
    }
    return name.replace(/\s+/g, ' ').trim() || item.name;
  }, [item.displayName, item.name]);

  const numMrp = Number(item.mrp) || 0;
  const numPrice = Number(item.retailPrice) || 0;
  const hasDiscount = numMrp > 0 && numPrice > 0 && numMrp > numPrice;
  const discountPercent = hasDiscount ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0;

  // Options count for Blinkit-style button (single base unit + variant pack sizes)
  const hasSingleVariant = item.variants?.some((v) => Number(v.qty) === 1);
  const optionsCount = hasSingleVariant
    ? (item.variants?.length || 0)
    : (item.variants?.length || 0) + 1;

  // Format unit / pack size display below title (e.g. "500 g", "1 kg", "1 ltr")
  const unitDisplay = useMemo(() => {
    if (item.displayUnit) return item.displayUnit;
    const nameToScan = item.displayName || item.originalName || item.name || '';
    if (/\b1\/2\s*kg\b/i.test(nameToScan)) return '500 g';
    if (/\b1\/4\s*kg\b/i.test(nameToScan)) return '250 g';
    if (/\b3\/4\s*kg\b/i.test(nameToScan)) return '750 g';
    const match = nameToScan.match(/(\d+(?:\.\d+)?)\s*(ltr|l|kg|gm|gr|g|ml)/i);
    if (match) {
      let u = match[2].toLowerCase();
      if (u === 'l') u = 'ltr';
      if (u === 'gm' || u === 'gr') u = 'g';
      return `${match[1]} ${u}`;
    }
    if (item.baseUnit && item.baseUnit !== 'pcs' && item.baseUnit !== 'unit') {
      const suffix =
        item.unitType && item.unitType.toLowerCase() !== item.baseUnit.toLowerCase()
          ? `/${item.unitType}`
          : '';
      return `${item.baseQty || 1} ${item.baseUnit}${suffix}`;
    }
    const baseU = item.unitType || 'unit';
    return /^\d+/.test(baseU) ? baseU : `${item.baseQty || 1} ${baseU}`;
  }, [item.displayUnit, item.displayName, item.originalName, item.name, item.baseUnit, item.unitType, item.baseQty]);

  // If item has variants, total quantity across all variants of this product
  const totalQty = getItemQty(item._id);

  const handleAddClick = () => {
    if (isOutOfStock) return;
    if (hasVariants) {
      setVariantModalOpen(true);
    } else {
      addItem(item);
    }
  };

  return (
    <>
      <div
        className={cn(
          'bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col h-full relative p-3 group',
          className ? className : 'w-40 min-w-[160px] max-w-[160px]'
        )}
      >
        {/* Discount Badge on Corner */}
        {hasDiscount && (
          <span className="absolute top-2 left-2 z-10 bg-[#0C831F] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
            {discountPercent}% OFF
          </span>
        )}

        {/* Product Image */}
        <div
          onClick={hasVariants ? () => setVariantModalOpen(true) : undefined}
          className={cn(
            'w-full h-28 bg-gray-50 rounded-xl flex items-center justify-center mb-2.5 overflow-hidden border border-gray-100 relative',
            hasVariants ? 'cursor-pointer' : ''
          )}
        >
          {!imgError && item.images?.[0] ? (
            <img
              src={item.images[0]}
              alt={displayName}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
              className={cn(
                'w-full h-full object-contain mix-blend-multiply p-1 group-hover:scale-105 transition duration-200',
                isOutOfStock ? 'opacity-40 grayscale' : ''
              )}
            />
          ) : (
            <div
              className={cn(
                'w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50',
                isOutOfStock ? 'opacity-40 grayscale' : ''
              )}
            >
              <Package className="w-8 h-8 text-gray-300 mb-1" />
              <span className="text-[10px] text-gray-400 font-semibold px-2 text-center line-clamp-1">
                {displayName}
              </span>
            </div>
          )}

          {/* Out of Stock Overlay Ribbon */}
          {isOutOfStock && (
            <div className="absolute inset-x-0 bottom-0 bg-gray-900/80 backdrop-blur-2xs py-0.5 text-center">
              <span className="text-[9px] font-black uppercase tracking-wider text-white">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col">
          <h3
            onClick={hasVariants ? () => setVariantModalOpen(true) : undefined}
            className={cn(
              'text-xs font-bold text-gray-900 line-clamp-2 leading-tight min-h-[32px]',
              hasVariants ? 'cursor-pointer hover:text-[#0C831F]' : ''
            )}
            title={displayName}
          >
            {displayName}
          </h3>

          {/* Unit / Pack Size: Always display size (e.g. 85 g, 15 kg/tin) */}
          <div className="mt-1">
            <span className="text-[11px] text-gray-500 font-medium line-clamp-1">
              {unitDisplay}
            </span>
          </div>

          {/* Pricing & Add Button Row */}
          <div className="mt-auto pt-3 flex items-center justify-between gap-1">
            <div className="flex flex-col">
              <span className="font-black text-sm text-gray-900 leading-tight">
                {formatPrice(numPrice)}
              </span>
              {hasDiscount && (
                <del className="text-[10px] text-gray-400 font-semibold leading-tight">
                  {formatPrice(numMrp)}
                </del>
              )}
            </div>

            {/* If Item Has Variants: Blinkit Style Dual ADD Button */}
            {hasVariants ? (
              <button
                type="button"
                onClick={handleAddClick}
                disabled={isOutOfStock}
                className={cn(
                  'min-w-[68px] sm:min-w-[74px] rounded-xl border transition shadow-2xs active:scale-95 cursor-pointer overflow-hidden flex flex-col items-center justify-center p-0',
                  totalQty > 0
                    ? 'bg-[#0C831F] border-[#0C831F] text-white'
                    : isOutOfStock
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white border-[#0C831F] text-[#0C831F] hover:bg-green-50/50'
                )}
              >
                <span className="font-black text-xs py-1 px-3">
                  {isOutOfStock ? 'OUT' : totalQty > 0 ? `${totalQty} in cart` : 'ADD'}
                </span>
                <span
                  className={cn(
                    'w-full text-center font-bold text-[9px] py-0.5 px-1 leading-tight tracking-tight border-t',
                    totalQty > 0
                      ? 'bg-green-800 text-white border-green-700'
                      : 'bg-emerald-50 text-[#0C831F] border-emerald-100'
                  )}
                >
                  {optionsCount} options
                </span>
              </button>
            ) : (
              /* Single Variant: Standard Counter */
              totalQty === 0 ? (
                <button
                  type="button"
                  onClick={handleAddClick}
                  disabled={isOutOfStock}
                  className={cn(
                    'text-xs font-extrabold px-4 py-1.5 rounded-xl border transition shadow-2xs active:scale-95 cursor-pointer',
                    isOutOfStock
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-green-50 text-[#0C831F] border-[#0C831F] hover:bg-green-100'
                  )}
                >
                  {isOutOfStock ? 'OUT' : 'ADD'}
                </button>
              ) : (
                <div className="flex items-center bg-[#0C831F] rounded-xl text-white text-xs font-bold h-7 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => removeItem(item._id)}
                    className="px-2 h-full flex items-center hover:bg-green-800 rounded-l-xl transition cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-1.5 font-extrabold text-xs">{totalQty}</span>
                  <button
                    type="button"
                    onClick={() => addItem(item)}
                    className="px-2 h-full flex items-center hover:bg-green-800 rounded-r-xl transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Blinkit-Style Pack Selection Modal */}
      {hasVariants && (
        <VariantSelectModal
          item={item}
          isOpen={variantModalOpen}
          onClose={() => setVariantModalOpen(false)}
        />
      )}
    </>
  );
}

export default memo(ItemCard);
