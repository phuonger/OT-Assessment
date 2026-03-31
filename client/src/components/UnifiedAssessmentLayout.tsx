/**
 * UnifiedAssessmentLayout
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Main layout for the assessment phase: sidebar + assessment panel
 */

import UnifiedSidebar from './UnifiedSidebar';
import UnifiedAssessmentPanel from './UnifiedAssessmentPanel';

export default function UnifiedAssessmentLayout() {
  return (
    <div className="flex h-screen bg-[#FAF9F6]">
      <UnifiedSidebar />
      <UnifiedAssessmentPanel />
    </div>
  );
}
