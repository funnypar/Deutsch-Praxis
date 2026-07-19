import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Heart, Bitcoin, Coins } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useLang } from '@/context/LangContext';

// ── Wallet data ───────────────────────────────────────────────────
const WALLETS = [
  {
    id: 'btc',
    label: 'Bitcoin',
    symbol: 'BTC',
    address: 'bc1qhem7fpt22htnv782hhyw7x2u5r364mvmegc2le',
    color: 'bg-orange-100 dark:bg-orange-900/30',
    ring: 'ring-orange-400',
    text: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500 to-amber-400',
    icon: '₿',
    qrFg: '#c2410c',
  },
  {
    id: 'usdt',
    label: 'Tether',
    symbol: 'USDT',
    address: '0x5d288cf647a96111444be0c73aea46ac107d7c52',
    color: 'bg-emerald-100 dark:bg-emerald-900/30',
    ring: 'ring-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500 to-teal-400',
    icon: '₮',
    qrFg: '#065f46',
  },
  {
    id: 'eth',
    label: 'Ethereum',
    symbol: 'ETH',
    address: '0x5d288cf647a96111444be0c73aea46ac107d7c52',
    color: 'bg-indigo-100 dark:bg-indigo-900/30',
    ring: 'ring-indigo-400',
    text: 'text-indigo-600 dark:text-indigo-400',
    gradient: 'from-indigo-500 to-violet-400',
    icon: 'Ξ',
    qrFg: '#3730a3',
  },
] as const;

type WalletId = typeof WALLETS[number]['id'];

// ── Copy button ───────────────────────────────────────────────────
function CopyButton({ text, accent }: { text: string; accent: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
        ${copied
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : `${accent} hover:opacity-80`
        }`}
    >
      {copied
        ? <><Check className="h-3.5 w-3.5" /> Copied!</>
        : <><Copy className="h-3.5 w-3.5" /> Copy</>
      }
    </button>
  );
}

// ── Main dialog ───────────────────────────────────────────────────
interface DonationDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function DonationDialog({ open, onOpenChange }: DonationDialogProps) {
  const [active, setActive] = useState<WalletId>('btc');
  const { lang } = useLang();

  const wallet = WALLETS.find((w) => w.id === active)!;

  const title   = lang === 'de' ? 'Projekt unterstützen' : 'Support the project';
  const subtitle = lang === 'de'
    ? 'Deine Spende hilft dabei, DeutschPraxis kostenlos zu halten. Wähle deine bevorzugte Kryptowährung.'
    : 'Your donation helps keep DeutschPraxis free. Choose your preferred cryptocurrency.';
  const scanLabel = lang === 'de' ? 'QR-Code scannen oder Adresse kopieren' : 'Scan QR code or copy the address';
  const networkNote = lang === 'de'
    ? 'Bitte sende nur auf das entsprechende Netzwerk.'
    : 'Send only on the correct network.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl gap-0">

        {/* ── Header band ─────────────────────────────────────── */}
        <div className={`bg-gradient-to-r ${wallet.gradient} p-6 text-white relative overflow-hidden`}>
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-4 -bottom-8 w-28 h-28 bg-black/10 rounded-full blur-2xl" />
          <DialogHeader className="relative z-10">
            <DialogTitle className="flex items-center gap-2.5 text-white text-xl font-bold">
              <Heart className="h-5 w-5 fill-white/80" />
              {title}
            </DialogTitle>
            <DialogDescription className="text-white/80 text-sm mt-1 leading-snug">
              {subtitle}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 flex flex-col gap-5 bg-card">

          {/* ── Currency tabs ──────────────────────────────────── */}
          <div className="flex gap-2">
            {WALLETS.map((w) => (
              <button
                key={w.id}
                onClick={() => setActive(w.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all duration-200 font-semibold text-sm
                  ${active === w.id
                    ? `${w.color} border-transparent ring-2 ${w.ring} ${w.text}`
                    : 'border-border text-muted-foreground hover:bg-secondary'
                  }`}
              >
                <span className="text-xl leading-none">{w.icon}</span>
                <span className="text-xs font-bold tracking-wide">{w.symbol}</span>
              </button>
            ))}
          </div>

          {/* ── QR code ────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
            <p className="text-xs text-muted-foreground text-center">{scanLabel}</p>

            <div className={`p-4 rounded-2xl ring-4 ring-offset-2 ring-offset-card ${wallet.ring}/40 bg-white`}>
              <QRCodeSVG
                value={wallet.address}
                size={180}
                fgColor={wallet.qrFg}
                bgColor="#ffffff"
                level="M"
              />
            </div>

            {/* ── Address pill ─────────────────────────────────── */}
            <div className="w-full flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
              <span className={`text-lg font-bold leading-none ${wallet.text}`}>{wallet.icon}</span>
              <span className="flex-1 text-xs font-mono text-muted-foreground break-all leading-relaxed">
                {wallet.address}
              </span>
              <CopyButton
                text={wallet.address}
                accent={`${wallet.color} ${wallet.text}`}
              />
            </div>

            {/* network note */}
            <p className="text-[11px] text-muted-foreground text-center">{networkNote}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
