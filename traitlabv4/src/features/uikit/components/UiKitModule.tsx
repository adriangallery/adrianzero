/**
 * /ui-kit — página oculta (sin entrada en nav) para revisar el sistema de
 * diseño F3 (D11, 12-sep-2026): todos los componentes de src/ui/ con sus
 * variantes/estados, y los tokens (swatches, tipografía, espaciados).
 * Es lo que Adrián revisa antes de mergear feat/az-f3-design-system.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Button,
  Chip,
  Card,
  Badge,
  Skeleton,
  Sheet,
  TabBar,
  ActionBar,
  WalletSheet,
} from '@/ui';
import type { BadgeTone } from '@/ui';
import { WalletIcon } from '@/ui/icons';
import { useNotifications } from '@/hooks/useNotifications';

// Placeholder deliberadamente NO válido como hash real (no hex) — solo para
// ilustrar el enlace "View on BaseScan" del Toast en esta página de revisión.
const DEMO_TX_HASH_PLACEHOLDER = '0x-demo-tx-hash-para-preview-en-ui-kit';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-[13px] text-acc">{title}</h2>
      {children}
    </section>
  );
}

const COLOR_TOKENS: { name: string; varName: string }[] = [
  { name: 'bg', varName: '--bg' },
  { name: 'panel', varName: '--panel' },
  { name: 'line', varName: '--line' },
  { name: 'fg', varName: '--fg' },
  { name: 'mute', varName: '--mute' },
  { name: 'acc', varName: '--acc' },
  { name: 'acc-fg', varName: '--acc-fg' },
  { name: 'acc2', varName: '--acc2' },
  { name: 'warn', varName: '--warn' },
  { name: 'bad', varName: '--bad' },
  { name: 'ok', varName: '--ok' },
];

const SPACING_TOKENS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'];
const BADGE_TONES: BadgeTone[] = ['ok', 'warn', 'bad', 'mute', 'acc'];

export function UiKitModule() {
  const [chipSelected, setChipSelected] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);
  const notify = useNotifications();

  return (
    <div className="flex flex-col gap-10 px-4 py-8 max-w-3xl mx-auto text-fg bg-bg">
      <header>
        <h1 className="font-display text-[18px] text-acc mb-2">UI KIT — F3</h1>
        <p className="text-[13px] text-mute max-w-prose">
          Sistema de diseño del rediseño mobile-first (D11, 12-sep-2026). Ruta oculta, sin entrada
          en la navegación — solo para revisión.
        </p>
      </header>

      <Section title="Tokens · color">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {COLOR_TOKENS.map((t) => (
            <div key={t.name} className="flex items-center gap-3 rounded-[var(--r-md)] border-2 border-line p-2.5">
              <span
                className="flex-none w-9 h-9 rounded-[var(--r-sm)] border-2 border-line"
                style={{ background: `var(${t.varName})` }}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <div className="text-[13px] font-bold truncate">{t.name}</div>
                <div className="text-[11px] text-mute truncate">{t.varName}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tokens · espaciado (base-4)">
        <div className="flex flex-col gap-1.5">
          {SPACING_TOKENS.map((s) => (
            <div key={s} className="flex items-center gap-3">
              <span className="w-8 text-[11px] text-mute flex-none">{s}</span>
              <span className="h-3 bg-acc/70 rounded-sm" style={{ width: `var(--${s})` }} />
              <span className="text-[11px] text-mute">var(--{s})</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tokens · radios">
        <div className="flex gap-4">
          <div className="w-16 h-16 border-2 border-acc grid place-items-center text-[10px] text-mute rounded-[var(--r-sm)]">
            r-sm 8
          </div>
          <div className="w-16 h-16 border-2 border-acc grid place-items-center text-[10px] text-mute rounded-[var(--r-md)]">
            r-md 10
          </div>
          <div className="w-16 h-16 border-2 border-acc grid place-items-center text-[10px] text-mute rounded-[var(--r-lg)]">
            r-lg 14
          </div>
        </div>
      </Section>

      <Section title="Tipografía">
        <div className="flex flex-col gap-2">
          <div className="font-display text-acc" style={{ fontSize: 'var(--fs-h1)' }}>
            Press Start 2P · h1
          </div>
          <div className="font-display text-fg" style={{ fontSize: 'var(--fs-h2)' }}>
            Press Start 2P · h2
          </div>
          <div style={{ fontSize: 'var(--fs-body)' }}>Space Grotesk · body — texto normal de la app.</div>
          <div className="text-mute" style={{ fontSize: 'var(--fs-small)' }}>
            Space Grotesk · small — metadatos, ayudas, contadores.
          </div>
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary md</Button>
          <Button variant="secondary">Secondary md</Button>
          <Button variant="ghost">Ghost md</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg">
            Primary lg
          </Button>
          <Button variant="primary" size="lg" loading>
            Cargando
          </Button>
          <Button variant="primary" size="lg" disabled>
            Deshabilitado
          </Button>
        </div>
        <Button variant="primary" size="lg" full trailing="1 firma · Base">
          Aplicar 2 cambios
        </Button>
      </Section>

      <Section title="Chip">
        <div className="flex flex-wrap gap-2">
          {['Pelo', 'Ojos', 'Boca', 'Top'].map((label, i) => (
            <Chip key={label} selected={chipSelected === i} count={12 - i * 3} onClick={() => setChipSelected(i)}>
              {label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Card">
        <Card className="p-4">
          <p className="text-sm">Panel base: borde 2px, radio 14, fondo panel.</p>
        </Card>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap gap-2">
          {BADGE_TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Skeleton">
        <div className="flex flex-col gap-2 max-w-xs">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Section>

      <Section title="Sheet">
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>
          Abrir hoja
        </Button>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="Ejemplo de hoja">
          <p className="text-sm text-mute py-2">
            Asa, overlay, cierre por overlay/Escape, aria-modal, bloqueo de scroll y animación CSS
            de 200ms. Respeta el safe-area inferior.
          </p>
          <Button variant="primary" full onClick={() => setSheetOpen(false)}>
            Cerrar
          </Button>
        </Sheet>
      </Section>

      <Section title="Toast">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => notify.success('Cambios aplicados', 'Los traits se aplicaron correctamente.')}>
            Success
          </Button>
          <Button variant="secondary" onClick={() => notify.error('Error', 'La transacción fue rechazada.')}>
            Error
          </Button>
          <Button variant="secondary" onClick={() => notify.warning('Aviso', 'Este trait solo aplica a Gen 2.')}>
            Warning
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              notify.success('Tx confirmada', 'applyTraitMultiple confirmada en Base.', true, DEMO_TX_HASH_PLACEHOLDER)
            }
          >
            Con enlace a BaseScan
          </Button>
        </div>
      </Section>

      <Section title="TabBar (embedded)">
        <div className="border-2 border-line rounded-[var(--r-lg)] overflow-hidden max-w-sm">
          <TabBar embedded />
        </div>
      </Section>

      <Section title="ActionBar (embedded)">
        <div className="relative border-2 border-line rounded-[var(--r-lg)] h-28 max-w-sm bg-panel overflow-hidden">
          <ActionBar
            className="static bottom-auto"
            secondary={<WalletIcon size={20} />}
            primary={
              <Button variant="primary" size="lg" full trailing="1 firma · Base">
                Aplicar 2 cambios
              </Button>
            }
          />
        </div>
      </Section>

      <Section title="WalletSheet">
        <p className="text-[13px] text-mute max-w-prose">
          En móvil sin wallet inyectada: MetaMask/Rainbow/Coinbase por deep link. En escritorio (o
          móvil con wallet inyectada) delega directamente en el modal de RainbowKit — no hay nada
          que ver aquí en ese caso.
        </p>
        <Button variant="secondary" onClick={() => setWalletSheetOpen(true)}>
          Abrir WalletSheet
        </Button>
        <WalletSheet open={walletSheetOpen} onOpenChange={setWalletSheetOpen} />
      </Section>
    </div>
  );
}
