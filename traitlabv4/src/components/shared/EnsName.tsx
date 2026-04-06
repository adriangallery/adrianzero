import { useEnsName } from '@/hooks/useEnsName';

function short(addr: string): string {
  if (!addr || addr.length < 10) return addr || '?';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

interface EnsNameProps {
  address: string;
  className?: string;
}

export function EnsName({ address, className }: EnsNameProps) {
  const { ensName } = useEnsName(address);

  if (ensName) {
    return <span className={className ?? 'text-emerald-400'}>{ensName}</span>;
  }

  return <>{short(address)}</>;
}
