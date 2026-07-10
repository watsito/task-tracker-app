'use client';

import { OdooProject } from '../types/task';

interface OdooProjectCardProps {
  project: OdooProject;
}

function getAvatarColor(ownerId: number | null): string {
  const colors = [
    'from-indigo-500 to-purple-600',
    'from-sky-500 to-cyan-600',
    'from-rose-500 to-pink-600',
    'from-emerald-500 to-teal-600',
  ];

  if (!ownerId) return colors[0];

  return colors[ownerId % colors.length];
}

function formatDateRange(dateStart: string | null, dateEnd: string | null) {
  const format = (value: string) =>
    new Date(value).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });

  if (dateStart && dateEnd) {
    return `${format(dateStart)} → ${format(dateEnd)}`;
  }

  if (dateStart) {
    return `Mulai ${format(dateStart)}`;
  }

  if (dateEnd) {
    return `Deadline ${format(dateEnd)}`;
  }

  return null;
}

export default function OdooProjectCard({ project }: OdooProjectCardProps) {
  const dateRange = formatDateRange(project.dateStart, project.dateEnd);

  return (
    <article
      id={`odoo-project-card-${project.id}`}
      className="group relative flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md dark:border-white/[0.07] dark:bg-slate-800/60 dark:backdrop-blur-sm dark:hover:border-white/[0.14] dark:hover:bg-slate-800/80 dark:hover:shadow-lg dark:hover:shadow-black/30 dark:hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {project.isFavorite && <span className="text-amber-500">★</span>}
          <h3 className="text-sm font-semibold leading-snug text-gray-900 dark:text-slate-100">
            {project.name}
          </h3>
        </div>
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white ${getAvatarColor(project.ownerId)}`}
          title={project.ownerName ?? 'Unassigned'}
        >
          {project.ownerInitials}
        </div>
      </div>

      {project.tagNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.tagNames.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300"
            >
              {tag}
            </span>
          ))}
          {project.tagNames.length > 3 && (
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400">
              +{project.tagNames.length - 3}
            </span>
          )}
        </div>
      )}

      {dateRange && (
        <div className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          {dateRange}
        </div>
      )}

      <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-3 text-xs dark:border-white/[0.06]">
        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
          <span className="font-semibold text-gray-800 dark:text-slate-200">{project.taskCount}</span>
          <span>Tasks</span>
        </div>
        <div className="text-right text-[11px] text-gray-500 dark:text-slate-400">
          {project.ownerName ?? 'Unassigned'}
        </div>
      </div>
    </article>
  );
}
