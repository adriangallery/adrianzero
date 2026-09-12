import { useEffect, useState } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Sheet } from './Sheet';
import { WalletIcon } from './icons';

/**
 * Deep-link móvil, portado de cubistsouls-web `MobileWalletSheet.tsx`: en
 * iOS/Android sin wallet inyectada, el handoff WalletConnect Safari→wallet es
 * frágil. Abrir la propia página dentro del navegador de la wallet (universal
 * link) es un solo toque y el provider queda inyectado ahí.
 */
function detectMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPod|Windows Phone|BlackBerry|BB10|Mobi/i.test(ua)) return true;
  if (/iPad/i.test(ua)) return true;
  // iPadOS 13+ se identifica como "Macintosh" — solo el táctil lo delata.
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}

export function useIsMobileNoInjected(): boolean {
  const [value, setValue] = useState(false);
  useEffect(() => {
    const hasInjected = typeof window !== 'undefined' && Boolean((window as { ethereum?: unknown }).ethereum);
    setValue(detectMobile() && !hasInjected);
  }, []);
  return value;
}

interface DeepLink {
  id: string;
  name: string;
  sub: string;
  tint: string;
  url: string;
}

function dappLinks(): DeepLink[] {
  if (typeof location === 'undefined') return [];
  const hostPath = location.host + location.pathname + location.search;
  const full = `${location.protocol}//${hostPath}`;
  return [
    {
      id: 'metamask',
      name: 'MetaMask',
      sub: 'Abre esta página en MetaMask',
      tint: '#f6851b',
      url: `https://metamask.app.link/dapp/${hostPath}`,
    },
    {
      id: 'rainbow',
      name: 'Rainbow',
      sub: 'Abre esta página en Rainbow',
      tint: '#001e59',
      url: `https://rnbwapp.com/${hostPath}`,
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      sub: 'Abre esta página en Coinbase Wallet',
      tint: '#0052ff',
      url: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(full)}`,
    },
  ];
}

export interface WalletSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * En móvil sin wallet inyectada: hoja con MetaMask/Rainbow/Coinbase por deep
 * link + opción secundaria a WalletConnect (modal de RainbowKit). En
 * escritorio (o móvil con wallet inyectada, p.ej. dentro del propio navegador
 * de la wallet): delega directamente en RainbowKit, sin mostrar esta hoja.
 */
export function WalletSheet({ open, onOpenChange }: WalletSheetProps) {
  const isMobileNoInjected = useIsMobileNoInjected();
  const { openConnectModal } = useConnectModal();

  useEffect(() => {
    if (open && !isMobileNoInjected) {
      onOpenChange(false);
      openConnectModal?.();
    }
  }, [open, isMobileNoInjected, onOpenChange, openConnectModal]);

  if (!isMobileNoInjected) return null;

  const links = dappLinks();

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Conectar wallet">
      <p className="text-[13px] text-mute mb-3">
        Para una conexión fiable en el móvil, abre esta página dentro del navegador de tu wallet — un toque, sin QR.
      </p>
      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            onClick={() => setTimeout(() => onOpenChange(false), 400)}
            className="flex items-center gap-3 rounded-[var(--r-md)] border-2 border-line bg-bg px-3 py-3 hover:border-mute"
          >
            <span
              className="flex-none w-9 h-9 rounded-[var(--r-sm)] grid place-items-center text-sm font-bold text-white"
              style={{ background: link.tint }}
              aria-hidden="true"
            >
              {link.name[0]}
            </span>
            <span className="flex flex-col min-w-0">
              <span className="text-[14px] font-bold text-fg">{link.name}</span>
              <span className="text-[12px] text-mute truncate">{link.sub}</span>
            </span>
          </a>
        ))}
        <button
          type="button"
          onClick={() => {
            onOpenChange(false);
            openConnectModal?.();
          }}
          className="flex items-center justify-center gap-2 rounded-[var(--r-md)] px-3 py-3 text-[13px] text-mute hover:text-fg"
        >
          <WalletIcon size={16} />o usa WalletConnect (QR / otras wallets)
        </button>
      </div>
    </Sheet>
  );
}
