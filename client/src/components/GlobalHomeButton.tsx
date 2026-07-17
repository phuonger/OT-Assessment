/**
 * GlobalHomeButton
 * 
 * A floating Home button visible across all pages of the app (except the profiles page itself).
 * Navigates back to the Client Profiles list.
 */

import { Home } from 'lucide-react';
import { useMultiAssessment } from '@/contexts/MultiAssessmentContext';

export default function GlobalHomeButton() {
  const { state, dispatch } = useMultiAssessment();

  // Don't show on the profiles page itself or the welcome/setup pages
  if (state.phase === 'profiles' || state.phase === 'welcome') return null;

  const handleGoHome = () => {
    dispatch({ type: 'GO_TO_PHASE', phase: 'profiles' });
  };

  return (
    <button
      onClick={handleGoHome}
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all duration-200 bg-white text-[#2C2C2C] border border-[#E5E1D8] hover:border-[#0D7377] hover:shadow-xl"
      title="Back to Client Profiles"
    >
      <Home className="w-4 h-4 text-[#0D7377]" />
      <span className="text-sm font-medium">Home</span>
    </button>
  );
}
