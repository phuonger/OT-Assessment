/**
 * Home Page — Multi-Assessment Flow
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Routes between setup, assessment, and summary phases.
 */

import { MultiAssessmentProvider, useMultiAssessment } from '@/contexts/MultiAssessmentContext';
import MultiStepSetup from '@/components/MultiStepSetup';
import UnifiedAssessmentLayout from '@/components/UnifiedAssessmentLayout';
import UnifiedSummaryReport from '@/components/UnifiedSummaryReport';
import ClinicalReportEditor from '@/components/ClinicalReportEditor';

function AssessmentFlow() {
  const { state } = useMultiAssessment();

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
