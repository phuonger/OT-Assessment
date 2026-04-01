/**
 * Home Page — Multi-Assessment Flow
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Routes between setup, assessment, summary, report, and history phases.
 */

import { MultiAssessmentProvider, useMultiAssessment } from '@/contexts/MultiAssessmentContext';
import MultiStepSetup from '@/components/MultiStepSetup';
import UnifiedAssessmentLayout from '@/components/UnifiedAssessmentLayout';
import UnifiedSummaryReport from '@/components/UnifiedSummaryReport';
import ClinicalReportEditor from '@/components/ClinicalReportEditor';
import AssessmentHistory from '@/components/AssessmentHistory';

function AssessmentFlow() {
  const { state, dispatch } = useMultiAssessment();

  switch (state.phase) {
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
    default:
      return <MultiStepSetup />;
  }
}

export default function Home() {
  return (
    <MultiAssessmentProvider>
      <AssessmentFlow />
    </MultiAssessmentProvider>
  );
}
