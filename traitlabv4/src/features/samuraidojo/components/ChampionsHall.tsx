import {Trophy, Medal, Award} from 'lucide-react';
import {useChampions} from '../hooks/useDojoContract';

interface ChampionsHallProps {
    budokaiIds: number[]; // e.g., [1, 2, 3]
}

function getSamuraiImageUrl(tokenId: number): string {
    return `https://adrianlab.vercel.app/api/render/${tokenId}.png`;
}

export function ChampionsHall({budokaiIds}: ChampionsHallProps) {
    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="mb-5 text-center">
                <h2 className="text-lg font-bold tracking-[0.3em] uppercase text-yellow-400">
                    Hall of Champions
                </h2>
                <p className="mt-1 text-[9px] tracking-wider text-zinc-600">
                    Podium winners of each resolved Budokai
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {budokaiIds.map((id) => (
                    <BudokaiRecap key={id} budokaiId={id} />
                ))}
            </div>
        </div>
    );
}

function BudokaiRecap({budokaiId}: {budokaiId: number}) {
    const {champions} = useChampions(budokaiId);
    const unresolved = !champions || champions.champion === 0;

    return (
        <div className="rounded border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">
                    Budokai {budokaiId}
                </span>
                {unresolved ? (
                    <span className="text-[8px] uppercase text-zinc-600">Pending</span>
                ) : (
                    <span className="text-[8px] uppercase text-green-400">Resolved</span>
                )}
            </div>

            {unresolved ? (
                <div className="flex h-24 items-center justify-center text-[10px] text-zinc-700">
                    Awaiting resolution
                </div>
            ) : (
                <div className="space-y-2">
                    <PodiumRow rank="1st" tokenId={champions!.champion} color="text-yellow-400" icon={<Trophy className="h-3 w-3" />} />
                    <PodiumRow rank="2nd" tokenId={champions!.runnerUp} color="text-zinc-300" icon={<Medal className="h-3 w-3" />} />
                    <PodiumRow rank="3rd-4th" tokenId={champions!.semifinalists[0]} color="text-orange-400" icon={<Award className="h-3 w-3" />} />
                    <PodiumRow rank="3rd-4th" tokenId={champions!.semifinalists[1]} color="text-orange-400" icon={<Award className="h-3 w-3" />} />
                </div>
            )}
        </div>
    );
}

function PodiumRow({rank, tokenId, color, icon}: {rank: string; tokenId: number; color: string; icon: React.ReactNode}) {
    if (!tokenId) return null;
    return (
        <div className="flex items-center gap-3">
            <img
                src={getSamuraiImageUrl(tokenId)}
                alt={`#${tokenId}`}
                className="h-8 w-8 rounded"
                style={{imageRendering: 'pixelated'}}
            />
            <div className={`flex items-center gap-1 text-[10px] ${color}`}>
                {icon}
                <span className="font-mono uppercase tracking-wider">{rank}</span>
            </div>
            <span className="ml-auto font-mono text-[10px] text-zinc-400">#{tokenId}</span>
        </div>
    );
}
