/**
 * SyncStatusIndicator
 * 
 * A small cloud icon in the header that shows Google Drive sync status at a glance.
 * Green = synced recently, Yellow = pending/not synced in a while, Red = error/disconnected.
 * Clicking it navigates to Settings.
 */

import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { loadSyncConfig, getSyncStatus, type SyncStatus } from '@/lib/googleDriveSync';

interface SyncStatusIndicatorProps {
  onClick?: () => void;
}

export default function SyncStatusIndicator({ onClick }: SyncStatusIndicatorProps) {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus);
  const [config] = useState(() => loadSyncConfig());

  useEffect(() => {
    // Refresh status every 30 seconds
    const interval = setInterval(() => {
      setStatus(getSyncStatus());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Don't show if not connected
  if (!config.connected) {
    return (
      <button
        onClick={onClick}
        className="relative p-1.5 rounded-lg hover:bg-[#F0EDE8] transition-colors group"
        title="Google Drive: Not connected"
      >
        <CloudOff className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
      </button>
    );
  }

  // Determine color based on status
  let colorClass = 'text-emerald-500'; // green = synced recently
  let dotColor = 'bg-emerald-500';
  let tooltip = 'Synced';

  if (status.needsReminder) {
    colorClass = 'text-amber-500';
    dotColor = 'bg-amber-500';
    tooltip = 'Sync needed — last sync was over a week ago';
  } else if (status.lastSyncAt) {
    const hoursSince = (Date.now() - new Date(status.lastSyncAt).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 2) {
      colorClass = 'text-emerald-500';
      dotColor = 'bg-emerald-500';
      tooltip = `Synced ${formatTimeAgo(status.lastSyncAt)}`;
    } else if (hoursSince < 24) {
      colorClass = 'text-emerald-400';
      dotColor = 'bg-emerald-400';
      tooltip = `Synced ${formatTimeAgo(status.lastSyncAt)}`;
    } else {
      colorClass = 'text-amber-500';
      dotColor = 'bg-amber-500';
      tooltip = `Last synced ${formatTimeAgo(status.lastSyncAt)}`;
    }
  } else {
    colorClass = 'text-slate-400';
    dotColor = 'bg-slate-400';
    tooltip = 'Connected, never synced';
  }

  return (
    <button
      onClick={onClick}
      className="relative p-1.5 rounded-lg hover:bg-[#F0EDE8] transition-colors group"
      title={tooltip}
    >
      <Cloud className={`w-4 h-4 ${colorClass} group-hover:scale-110 transition-transform`} />
      {/* Status dot */}
      <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${dotColor} ring-2 ring-white`} />
    </button>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
