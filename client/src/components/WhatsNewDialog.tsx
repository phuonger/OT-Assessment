/**
 * WhatsNewDialog Component
 * 
 * Design: Clinical Precision / Swiss Medical
 * Shows a "What's New" changelog popup after app updates.
 * Automatically appears when the app version changes from what was last seen.
 * Can also be opened manually from Settings.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Calendar, Zap, Bug, Star } from 'lucide-react';

const LAST_SEEN_VERSION_KEY = 'bayley4-last-seen-version';

export interface ChangelogEntry {
  version: string;
  date: string;
  highlights: Array<{
    type: 'feature' | 'improvement' | 'fix';
    text: string;
  }>;
}

// Changelog data — add new entries at the top
const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.16.0',
    date: '2026-07-14',
    highlights: [
      { type: 'feature', text: 'Alphabet quick-jump sidebar — tap a letter to jump directly to that section in the client list' },
      { type: 'feature', text: 'Archive/Inactive toggle — mark clients as archived to keep your active list clean' },
      { type: 'feature', text: 'Profile photo upload — add a photo to each client for quick visual recognition' },
      { type: 'improvement', text: 'Client list now shows letter group dividers when sorted A-Z' },
    ],
  },
  {
    version: '1.15.1',
    date: '2026-07-14',
    highlights: [
      { type: 'fix', text: 'Fixed Google Drive creating duplicate "otassess" folders on reconnect' },
      { type: 'improvement', text: 'Drive sync now verifies and reuses existing folder instead of creating new ones' },
    ],
  },
  {
    version: '1.15.0',
    date: '2026-07-14',
    highlights: [
      { type: 'feature', text: 'Attendance Monthly Calendar — visual overview of all sessions with day-by-day navigation' },
      { type: 'feature', text: 'What\'s New popup — see what changed after each update' },
      { type: 'improvement', text: 'Google Drive OAuth now connects automatically — no more copying codes' },
    ],
  },
  {
    version: '1.14.4',
    date: '2026-07-13',
    highlights: [
      { type: 'improvement', text: 'Google Drive OAuth opens system browser for sign-in' },
      { type: 'fix', text: 'Fixed OAuth redirect URI for desktop app' },
    ],
  },
  {
    version: '1.14.3',
    date: '2026-07-12',
    highlights: [
      { type: 'feature', text: 'Sync conflict resolution dialog with side-by-side comparison' },
      { type: 'feature', text: 'Notification badge on sync icon for unsynced changes' },
      { type: 'improvement', text: 'Automatic dirty-tracking for all localStorage changes' },
    ],
  },
  {
    version: '1.14.0',
    date: '2026-07-10',
    highlights: [
      { type: 'feature', text: 'Google Drive Sync — auto-sync on open/close/hourly, manual sync, restore from Drive' },
      { type: 'feature', text: 'Export All Attendance as single DOCX' },
      { type: 'feature', text: 'Reset Setup wizard option in Settings' },
    ],
  },
  {
    version: '1.13.2',
    date: '2026-07-08',
    highlights: [
      { type: 'feature', text: 'Company Setup first-run wizard (3-step onboarding)' },
      { type: 'feature', text: 'Attendance summary stats per pay period' },
      { type: 'improvement', text: 'Print-friendly attendance form with company branding' },
    ],
  },
  {
    version: '1.13.0',
    date: '2026-07-06',
    highlights: [
      { type: 'feature', text: 'Full Attendance feature — form, signatures, history, DOCX export' },
      { type: 'feature', text: 'Batch attendance export per pay period' },
      { type: 'improvement', text: 'Auto-fill Type/Frequency from last entry' },
    ],
  },
  {
    version: '1.12.6',
    date: '2026-07-01',
    highlights: [
      { type: 'feature', text: 'Birth History fields in Client Profile' },
      { type: 'feature', text: 'OT Feeding Assessment Form with Discrete Oral Motor Skills' },
      { type: 'improvement', text: 'AI Enhance/Generate available on all report sections' },
    ],
  },
];

function getTypeIcon(type: 'feature' | 'improvement' | 'fix') {
  switch (type) {
    case 'feature': return <Star className="w-3.5 h-3.5 text-[#0D7377]" />;
    case 'improvement': return <Zap className="w-3.5 h-3.5 text-amber-500" />;
    case 'fix': return <Bug className="w-3.5 h-3.5 text-blue-500" />;
  }
}

function getTypeLabel(type: 'feature' | 'improvement' | 'fix') {
  switch (type) {
    case 'feature': return 'New';
    case 'improvement': return 'Improved';
    case 'fix': return 'Fixed';
  }
}

function getTypeBadgeClass(type: 'feature' | 'improvement' | 'fix') {
  switch (type) {
    case 'feature': return 'bg-[#0D7377]/10 text-[#0D7377]';
    case 'improvement': return 'bg-amber-50 text-amber-700';
    case 'fix': return 'bg-blue-50 text-blue-700';
  }
}

interface WhatsNewDialogProps {
  currentVersion: string;
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function WhatsNewDialog({ currentVersion, forceOpen, onClose }: WhatsNewDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      return;
    }

    // Check if version changed since last seen
    const lastSeen = localStorage.getItem(LAST_SEEN_VERSION_KEY);
    if (!lastSeen || lastSeen !== currentVersion) {
      // Show the dialog after a short delay so the app loads first
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentVersion, forceOpen]);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(LAST_SEEN_VERSION_KEY, currentVersion);
    onClose?.();
  };

  if (!open) return null;

  // Show entries from current version and a few previous ones
  const entriesToShow = CHANGELOG.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-[#0D7377] to-[#0a5c5f] px-6 py-5 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">What's New</h2>
              <p className="text-sm text-white/80">Version {currentVersion}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-140px)] px-6 py-4">
          <div className="space-y-6">
            {entriesToShow.map((entry, idx) => (
              <div key={entry.version}>
                {/* Version Header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-[#2C2C2C]">v{entry.version}</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatChangelogDate(entry.date)}
                  </span>
                  {idx === 0 && (
                    <span className="text-[10px] font-bold uppercase bg-[#0D7377] text-white px-1.5 py-0.5 rounded">
                      Latest
                    </span>
                  )}
                </div>

                {/* Changes */}
                <div className="space-y-2 pl-1">
                  {entry.highlights.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${getTypeBadgeClass(item.type)}`}>
                        {getTypeIcon(item.type)}
                        {getTypeLabel(item.type)}
                      </span>
                      <span className="text-sm text-[#2C2C2C] leading-snug flex-1">{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* Divider between versions */}
                {idx < entriesToShow.length - 1 && (
                  <div className="border-b border-[#E5E1D8] mt-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#E5E1D8] px-6 py-3 flex justify-end">
          <Button
            onClick={handleClose}
            className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white px-6"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatChangelogDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/** Export for use in Settings to manually open */
export function getChangelog(): ChangelogEntry[] {
  return CHANGELOG;
}

export function markVersionSeen(version: string): void {
  localStorage.setItem(LAST_SEEN_VERSION_KEY, version);
}
