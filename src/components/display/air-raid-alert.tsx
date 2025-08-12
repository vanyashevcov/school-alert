
'use client';

import { Siren, ShieldCheck } from 'lucide-react';
import type { AirRaidAlertOutput } from '@/app/page';
import { cn } from '@/lib/utils';

export default function AirRaidAlert({ alertState }: { alertState: AirRaidAlertOutput | null }) {
  if (!alertState) {
    return null; // Don't render anything until check is complete
  }

  return (
    <div
      className={cn(
        'p-4 rounded-lg flex items-center gap-3 transition-all duration-500',
        alertState.shouldAlert
          ? 'bg-red-600/90 text-white animate-pulse'
          : 'bg-black/20 text-white'
      )}
    >
      {alertState.shouldAlert ? (
        <Siren className="h-8 w-8" />
      ) : (
        <ShieldCheck className="h-8 w-8 text-green-400" />
      )}
      <div className="text-right">
        <h2 className="text-xl font-bold">
            {alertState.shouldAlert ? 'Повітряна тривога' : 'Безпечно'}
        </h2>
        <p className="text-sm opacity-90">
            {alertState.shouldAlert ? alertState.reason : 'м. Полтава'}
        </p>
      </div>
    </div>
  );
}
