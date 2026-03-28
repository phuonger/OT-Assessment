/*
 * Design: Clinical Precision — Swiss Medical Design
 * Split layout: sidebar navigation + main content panel
 */
import { useAssessment } from '@/contexts/AssessmentContext';
import DomainSidebar from './DomainSidebar';
import AssessmentPanel from './AssessmentPanel';
import SummaryReport from './SummaryReport';
import { ClipboardList, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function AssessmentLayout() {
  const { state, dispatch } = useAssessment();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <div className="flex items-center gap-3">
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-14 left-0 z-40 w-72 bg-[#f8f7f4] border-r border-border p-4 overflow-y-auto
            transition-transform duration-200 ease-in-out
            lg:static lg:translate-x-0 lg:flex-shrink-0
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {state.currentStep === 'summary' ? (
            <SummaryReport />
          ) : (
            <AssessmentPanel />
          )}
        </main>
      </div>
    </div>
  );
}
