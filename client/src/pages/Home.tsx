/**
 * Home Page — Multi-Assessment Flow
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Routes between welcome, dashboard, setup, assessment, summary, report, history, and backup phases.
 */

import { MultiAssessmentProvider, useMultiAssessment } from '@/contexts/MultiAssessmentContext';
import WelcomePage from '@/components/WelcomePage';
import Dashboard from '@/components/Dashboard';
import AllAssessments from '@/components/AllAssessments';
import MultiStepSetup from '@/components/MultiStepSetup';
import UnifiedAssessmentLayout from '@/components/UnifiedAssessmentLayout';
import UnifiedSummaryReport from '@/components/UnifiedSummaryReport';
import ClinicalReportEditor from '@/components/ClinicalReportEditor';
import AssessmentHistory from '@/components/AssessmentHistory';
import DataBackupRestore from '@/components/DataBackupRestore';
import SettingsPreferences from '@/components/SettingsPreferences';

function AssessmentFlow() {
  const { state, dispatch } = useMultiAssessment();

  switch (state.phase) {
    case 'welcome':
      return <WelcomePage />;
    case 'dashboard':
      return <Dashboard />;
    case 'allAssessments':
      return <AllAssessments />;
    case 'childInfo':
    case 'examinerInfo':
    case 'formSelection':
      return <MultiStepSetup />;
    case 'assessment':
      return <UnifiedAssessmentLayout />;
    case 'summary':
      return <UnifiedSummaryReport />;
    case 'report':
      return <ClinicalReportEditor />;
    case 'history':
      return (
        <AssessmentHistory
          onBack={() => dispatch({ type: 'GO_TO_PHASE', phase: 'summary' })}
        />
      );
    case 'backup':
      return (
        <DataBackupRestore
          onBack={() => dispatch({ type: 'GO_TO_PHASE', phase: 'dashboard' })}
        />
      );
    case 'settings':
      return (
        <SettingsPreferences
          onBack={() => {
            // Go back to wherever the user came from — summary if mid-assessment, dashboard if at start
            const hasAssessment = Object.keys(state.formStates).length > 0;
            dispatch({ type: 'GO_TO_PHASE', phase: hasAssessment ? 'summary' : 'dashboard' });
          }}
        />
      );
    default:
      return <WelcomePage />;
  }
}

export default function Home() {
  return (
    <MultiAssessmentProvider>
      <AssessmentFlow />
    </MultiAssessmentProvider>
  );
}
