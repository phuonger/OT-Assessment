/*
 * Design: Clinical Precision — Swiss Medical Design
 * Split layout: sticky sidebar navigation + main content panel
 * Includes start point adjustment control in the header
 */
import { useAssessment } from '@/contexts/AssessmentContext';
import { AGE_RANGES } from '@/lib/assessmentData';
import DomainSidebar from './DomainSidebar';
import AssessmentPanel from './AssessmentPanel';
import SummaryReport from './SummaryReport';
import { ClipboardList, Menu, X, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface AssessmentLayoutProps {
  onViewSessions?: () => void;
}

export default function AssessmentLayout({ onViewSessions }: AssessmentLayoutProps) {
  const { state, dispatch } = useAssessment();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showStartAdjust, setShowStartAdjust] = useState(false);

  const handleAdjustStartPoint = (letter: string) => {
    dispatch({ type: 'ADJUST_START_POINT', payload: { startPointLetter: letter } });
    setShowStartAdjust(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top header */}
      <header className="border-b border-border bg-white/90 backdrop-blur-sm sticky top-0 z-50 print:hidden">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0D7377] flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Bayley-4 Assessment
                </h1>
                <p className="text-[10px] text-muted-foreground">
                  {state.childInfo.firstName} {state.childInfo.lastName}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Start Point Adjustment */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setShowStartAdjust(!showStartAdjust)}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Start Point:</span>
                <span className="font-bold text-[#0D7377]">{state.childInfo.startPointLetter}</span>
              </Button>

              {showStartAdjust && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowStartAdjust(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white rounded-xl border border-border shadow-xl p-4">
                    <div className="mb-3">
                      <h4 className="text-sm font-bold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        Adjust Start Point
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Change the start point to move earlier or later in the assessment.
                        Pre-scores will be recalculated automatically.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto">
                      {AGE_RANGES.map(range => {
                        const isActive = range.startPoint === state.childInfo.startPointLetter;
                        return (
                          <button
                            key={range.startPoint}
                            onClick={() => handleAdjustStartPoint(range.startPoint)}
                            className={`
                              px-2 py-2 rounded-lg text-xs text-left transition-all border
                              ${isActive
                                ? 'bg-[#0D7377] text-white border-[#0D7377] font-bold'
                                : 'bg-white border-border hover:border-[#0D7377]/30 hover:bg-[#0D7377]/5'
                              }
                            `}
                          >
                            <span className="font-bold block">{range.startPoint}</span>
                            <span className={`text-[9px] leading-tight block mt-0.5 ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                              {range.label.replace(/ days/g, 'd').replace(/ months/g, 'mo').replace(/ month/g, 'mo')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => dispatch({ type: 'SET_STEP', payload: 'info' })}
            >
              Edit Info
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar — sticky on desktop */}
        <aside
          className={`
            fixed inset-y-14 left-0 z-40 w-72 bg-[#f8f7f4] border-r border-border p-4 overflow-y-auto
            transition-transform duration-200 ease-in-out
            lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 lg:flex-shrink-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            print:hidden
          `}
        >
          <DomainSidebar />
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-6">
          {state.currentStep === 'summary' ? (
            <SummaryReport onViewSessions={onViewSessions} />
          ) : (
            <AssessmentPanel />
          )}
        </main>
      </div>
    </div>
  );
}
