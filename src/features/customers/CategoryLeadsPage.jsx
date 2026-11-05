import React from 'react';
import { AllLeadsPage } from './AllLeadsPage';

/**
 * Neumorphic Soft UI Category Specific Lead Pages for Renuvia Recycling
 */
export function HotLeadsPage() {
  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 bg-background shadow-neu-flat-sm rounded-2xl flex flex-wrap items-center justify-between gap-3 text-red-500 font-body">
        <span className="font-display font-bold text-sm flex items-center gap-2">
          🔥 Priority Calling Queue:
        </span>
        <span className="text-xs text-muted">
          Hot leads have urgent disposal, bulk IT decommission, or compliance deadlines. Engage promptly to schedule site audits and finalize MOUs.
        </span>
      </div>
      <AllLeadsPage forcedCategory="Hot" />
    </div>
  );
}

export function WarmLeadsPage() {
  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 bg-background shadow-neu-flat-sm rounded-2xl flex flex-wrap items-center justify-between gap-3 text-amber-500 font-body">
        <span className="font-display font-bold text-sm flex items-center gap-2">
          ⚡ Evaluation Stage:
        </span>
        <span className="text-xs text-muted">
          Warm leads are reviewing ITAD proposals, evaluating scrap volume, or awaiting ESG certificates. Share quotes and schedule timely follow-ups.
        </span>
      </div>
      <AllLeadsPage forcedCategory="Warm" />
    </div>
  );
}

export function ColdLeadsPage() {
  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 bg-background shadow-neu-flat-sm rounded-2xl flex flex-wrap items-center justify-between gap-3 text-blue-500 font-body">
        <span className="font-display font-bold text-sm flex items-center gap-2">
          ❄️ Long-term Pipeline:
        </span>
        <span className="text-xs text-muted">
          Cold leads with future decommissioning cycles or delayed asset retirement. Maintain touchpoints for the next corporate refresh cycle.
        </span>
      </div>
      <AllLeadsPage forcedCategory="Cold" />
    </div>
  );
}
