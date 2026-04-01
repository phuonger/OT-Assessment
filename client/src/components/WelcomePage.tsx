/**
 * WelcomePage
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Landing page shown when the app first opens.
 * Features branding, version info, and a "Get Started" button.
 * Also shows recent assessments for quick resume.
 */

import { useMultiAssessment } from '@/contexts/MultiAssessmentContext';
import { ClipboardCheck, ArrowRight, Clock, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

interface RecentSession {
  id: string;
  childName: string;
  testDate: string;
  forms: string[];
  status: string;
  savedAt: string;
}

function getRecentSessions(): RecentSession[] {
  try {
    const raw = localStorage.getItem('bayley4-multi-sessions');
    if (!raw) return [];
    const sessions = JSON.parse(raw);
    if (!Array.isArray(sessions)) return [];
    return sessions
      .sort((a: any, b: any) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      .slice(0, 5)
      .map((s: any) => ({
        id: s.id,
        childName: `${s.state?.childInfo?.firstName || ''} ${s.state?.childInfo?.lastName || ''}`.trim() || 'Unknown',
        testDate: s.state?.childInfo?.testDate || '',
        forms: s.state?.formSelections?.map((f: any) => f.formId) || [],
        status: s.status || 'unknown',
        savedAt: s.savedAt || '',
      }));
  } catch {
    return [];
  }
}

export default function WelcomePage() {
  const { dispatch } = useMultiAssessment();
  const recentSessions = useMemo(() => getRecentSessions(), []);

  const handleGetStarted = () => {
    dispatch({ type: 'GO_TO_PHASE', phase: 'childInfo' });
  };

  const handleResumeSession = (session: RecentSession) => {
    try {
      const raw = localStorage.getItem('bayley4-multi-sessions');
      if (!raw) return;
      const sessions = JSON.parse(raw);
      const found = sessions.find((s: any) => s.id === session.id);
      if (found?.state) {
        dispatch({ type: 'LOAD_STATE', payload: { ...found.state, timerRunning: false } });
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: '#faf8f5' }}>
      <div className="text-center max-w-2xl mx-4">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-[#0D7377]/10 flex items-center justify-center">
            <ClipboardCheck className="w-10 h-10 text-[#0D7377]" />
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-3xl font-bold text-[#2C2825] mb-3"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Developmental Assessment Suite
        </h1>

        {/* Subtitle */}
        <p className="text-[#6B6B6B] mb-2 text-sm">
          Multi-form assessment administration and scoring tool
        </p>
        <p className="text-[#8B8B8B] mb-8 text-xs leading-relaxed max-w-sm mx-auto">
          Supporting Bayley-4, DAYC-2, REEL-3, Sensory Profile 2, and more.
          All data is stored locally on your device.
        </p>

        {/* CTA Button */}
        <Button
          onClick={handleGetStarted}
          className="bg-[#0D7377] hover:bg-[#0a5c5f] text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Get Started
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        {/* Settings link */}
        <div className="mt-4">
          <button
            onClick={() => dispatch({ type: 'GO_TO_PHASE', phase: 'settings' })}
            className="text-xs text-[#8B8B8B] hover:text-[#0D7377] transition-colors inline-flex items-center gap-1"
          >
            <Settings className="w-3 h-3" />
            Settings & Preferences
          </button>
        </div>

        {/* Recent Assessments */}
        {recentSessions.length > 0 && (
          <div className="mt-10 text-left">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B8B8B] mb-3 text-center">
              Recent Assessments
            </h3>
            <div className="space-y-2">
              {recentSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => handleResumeSession(session)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-[#E5E1D8] hover:border-[#0D7377]/40 hover:bg-[#0D7377]/5 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0D7377]/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-[#0D7377]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2C2825] truncate group-hover:text-[#0D7377] transition-colors">
                      {session.childName}
                    </p>
                    <p className="text-xs text-[#8B8B8B]">
                      {session.testDate && new Date(session.testDate).toLocaleDateString()} • {session.forms.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#BEBEBE]">
                    <Clock className="w-3 h-3" />
                    {session.savedAt && new Date(session.savedAt).toLocaleDateString()}
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#BEBEBE] group-hover:text-[#0D7377] transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Version */}
        <p className="text-[#BEBEBE] text-[10px] mt-8">
          v1.4.0
        </p>
      </div>
    </div>
  );
}
