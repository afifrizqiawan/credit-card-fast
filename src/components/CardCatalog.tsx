import React from 'react';
import { CreditCard, Shield, Gift, Landmark, Check } from 'lucide-react';

export interface CardType {
  name: string;
  minIncome: number;
  limitStr: string;
  perks: string[];
  gradient: string;
  colorHex: string;
}

export const AVAILABLE_CARDS: CardType[] = [
  {
    name: 'Visa Gold Card',
    minIncome: 5000000,
    limitStr: 'Rp 5 Juta - Rp 15 Juta',
    perks: ['Cashback belanja supermarket 5%', 'Bebas iuran tahunan pertama', 'Cicilan ringan tenor up to 12 bulan'],
    gradient: 'from-amber-400 via-yellow-500 to-amber-600',
    colorHex: '#eab308'
  },
  {
    name: 'Mastercard Platinum Card',
    minIncome: 15000000,
    limitStr: 'Rp 15 Juta - Rp 50 Juta',
    perks: ['Double Reward Points khusus akhir pekan', 'Diskon up to 50% kuliner pilihan', 'Cicilan 0% gadget & gadget protection'],
    gradient: 'from-slate-400 via-gray-300 to-slate-500',
    colorHex: '#94a3b8'
  },
  {
    name: 'Visa Signature Card',
    minIncome: 30000000,
    limitStr: 'Rp 50 Juta - Rp 150 Juta',
    perks: ['Akses gratis Airport Lounge domestik', 'Complimentary Green Fee lapangan golf pilihan', 'Kurs valuta asing super kompetitif'],
    gradient: 'from-blue-700 via-indigo-800 to-sky-900',
    colorHex: '#1d4ed8'
  },
  {
    name: 'World Elite Mastercard',
    minIncome: 100000000,
    limitStr: 'Mulai dari Rp 500 Juta',
    perks: ['Prioritas Akses Global Airport Lounge VIP (Priority Pass)', 'Akumulasi AirMiles tercepat (Garuda & SQ)', 'Layanan Personal Concierge 24/7 sedunia'],
    gradient: 'from-neutral-900 via-zinc-800 to-neutral-950 border border-amber-500/30',
    colorHex: '#171717'
  }
];

interface CardCatalogProps {
  selectedCard: string;
  onSelectCard: (cardName: string) => void;
}

export const CardCatalog: React.FC<CardCatalogProps> = ({ selectedCard, onSelectCard }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          Katalog & Persyaratan Kartu Kredit
        </h3>
        <span className="text-xs text-gray-400">Pilih salah satu kartu</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AVAILABLE_CARDS.map((card) => {
          const isSelected = selectedCard === card.name;
          return (
            <div
              key={card.name}
              id={`card-select-${card.name.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => onSelectCard(card.name)}
              className={`relative cursor-pointer rounded-2xl p-5 border text-left transition-all duration-300 transform md:hover:scale-[1.01] flex flex-col justify-between overflow-hidden shadow-sm ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-600/10 bg-blue-50/20'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-2xl pointer-events-none" />

              <div>
                {/* Simulated Plastic Card Layout */}
                <div className={`p-4 rounded-xl bg-gradient-to-r ${card.gradient} text-white shadow-md relative overflow-hidden aspect-[1.58/1] mb-4`}>
                  {/* Card Chip */}
                  <div className="w-8 h-6 bg-yellow-200/80 rounded-md border border-yellow-300/60 mb-2 relative flex items-center justify-center">
                    <div className="w-4 h-4 border border-yellow-600/30 rounded" />
                  </div>
                  
                  <div className="absolute top-4 right-4 text-xs font-semibold tracking-widest opacity-80">
                    BANK EVENT
                  </div>

                  <div className="mt-4">
                    <span className="text-sm font-medium tracking-wide drop-shadow-sm">{card.name}</span>
                  </div>

                  <div className="absolute bottom-4 left-4 text-[10px] font-mono tracking-widest leading-none text-white/70">
                    ••••  ••••  ••••  2026
                  </div>
                  
                  <div className="absolute bottom-4 right-4 text-[11px] font-bold text-white tracking-widest">
                    ON THE SPOT
                  </div>
                  
                  {isSelected && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center transition-all">
                      <div className="bg-white text-blue-900 rounded-full p-2 shadow-lg scale-110 flex items-center justify-center animate-bounce">
                        <Check className="w-5 h-5 font-extrabold" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-base font-bold text-gray-900">{card.name}</h4>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                    Min. Gaji Rp {(card.minIncome / 1000000).toFixed(0)} Jt
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                  <Landmark className="w-3 h-3 text-gray-400" />
                  Batas Kredit: <b className="text-gray-800 font-medium">{card.limitStr}</b>
                </p>

                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  {card.perks.map((perk, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                      <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                id={`btn-select-${card.name.replace(/\s+/g, '-').toLowerCase()}`}
                className={`mt-4 w-full py-2 px-4 rounded-xl text-xs font-bold transition-all text-center ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSelected ? 'Kartu Terpilih' : 'Pilih Jenis Kartu'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
