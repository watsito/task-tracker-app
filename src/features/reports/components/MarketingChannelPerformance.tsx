'use client';

const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  googleAds: 'Google Ads',
  metaAds: 'Meta Ads',
  tender: 'Tender',
  socialMedia: 'Social Media',
  linkedin: 'Linkedin',
  referral: 'Referral',
  inboundWa: 'WhatsApp',
  web: 'Web',
  ka: 'KA',
  mes: 'MES',
  community: 'Community',
  other: 'Other',
};

export default function MarketingChannelPerformance({
  channelBreakdown,
  totalLeads,
}: {
  channelBreakdown: Record<string, number>;
  totalLeads: number;
}) {
  const ordered = Object.entries(channelBreakdown).sort(([, a], [, b]) => b - a);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-slate-900/80">
      <div className="space-y-3">
        {ordered.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500">Belum ada data channel.</p>
        ) : (
          ordered.map(([channel, count]) => {
            const percent = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
            return (
              <div key={channel} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-xs text-gray-500 dark:text-slate-400">{CHANNEL_LABELS[channel] ?? channel}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-white/[0.06]">
                  <div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${percent}%` }} />
                </div>
                <span className="w-10 text-right text-xs font-semibold tabular-nums text-gray-700 dark:text-slate-300">{count}</span>
                <span className="w-10 text-right text-[11px] text-gray-400 dark:text-slate-500">{percent.toFixed(0)}%</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
