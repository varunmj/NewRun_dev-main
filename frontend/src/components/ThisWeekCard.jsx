import React from 'react';
import { MdChevronRight, MdChecklist, MdTimeline, MdBook, MdTrendingUp, MdHome, MdSell, MdSchool, MdWork, MdMoving, MdPeople } from "react-icons/md";

/**
 * props:
 *  university: "Northern Illinois University"
 *  playbooks: [{ id, title, description, successRate, icon, href }]
 *  onViewAll: () => void
 *  loading: boolean
 */
export default function PlaybookSpotlight({
  university,
  playbooks = [],
  onViewAll,
  loading = false,
}) {
  
  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-5">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <MdBook className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Playbook Spotlight</h3>
        </div>
        <p className="text-white/60 text-sm">
          Seasonal guides to help you succeed at {university}
        </p>
      </div>

      {/* Playbooks */}
      <div className="space-y-3">
        {playbooks.slice(0, 2).map((playbook) => (
          <PlaybookItem
            key={playbook.id}
            title={playbook.title}
            description={playbook.description}
            successRate={playbook.successRate}
            icon={playbook.icon}
            href={playbook.href}
          />
        ))}
        
        {playbooks.length === 0 && (
          <div className="text-center py-6">
            <MdBook className="w-8 h-8 text-white/30 mx-auto mb-2" />
            <p className="text-white/60 text-sm">No playbooks available right now</p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
        >
          View all playbooks <MdChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}

/* --- components --- */
function PlaybookItem({ title, description, successRate, icon: Icon, href }) {
  return (
    <a
      href={href}
      className="block p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white group-hover:text-white mb-1 line-clamp-1">
            {title}
          </h4>
          <p className="text-xs text-white/60 mb-2 line-clamp-2">
            {description}
          </p>
          <div className="flex items-center gap-2">
            <MdTrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">
              {successRate}% success rate
            </span>
          </div>
        </div>
        <MdChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors flex-shrink-0" />
      </div>
    </a>
  );
}
