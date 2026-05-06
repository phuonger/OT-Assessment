/**
 * Home Page — Multi-Assessment Flow
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Routes between welcome, profiles, profileView, dashboard, setup, assessment, summary, report, history, and backup phases.
 */

import { MultiAssessmentProvider, useMultiAssessment } from '@/contexts/MultiAssessmentContext';
import WelcomePage from '@/components/WelcomePage';
import ClientProfiles from '@/components/ClientProfiles';
import ClientProfileView from '@/components/ClientProfileView';
import Dashboard from '@/components/Dashboard';
import AllAssessments from '@/components/AllAssessments';
import MultiStepSetup from '@/components/MultiStepSetup';
import UnifiedAssessmentLayout from '@/components/UnifiedAssessmentLayout';
import UnifiedSummaryReport from '@/components/UnifiedSummaryReport';
import ClinicalReportEditor from '@/components/ClinicalReportEditor';
import AssessmentHistory from '@/components/AssessmentHistory';
import DataBackupRestore from '@/components/DataBackupRestore';
import SettingsPreferences from '@/components/SettingsPreferences';
import { touchProfile, type ClientProfile } from '@/lib/clientProfileStorage';
import { type SavedMultiSession } from '@/lib/multiSessionStorage';

function AssessmentFlow() {
  const { state, dispatch } = useMultiAssessment();

  switch (state.phase) {
    case 'welcome':
      return <WelcomePage />;

    case 'profiles':
      return (
        <ClientProfiles
          onSelectProfile={(profile: ClientProfile) => {
            touchProfile(profile.id);
            dispatch({ type: 'GO_TO_PHASE', phase: 'profileView' });
            // Store profile ID in state for downstream use
            dispatch({ type: 'SET_CHILD_INFO', payload: {
              ...state.childInfo,
              firstName: profile.firstName,
              lastName: profile.lastName,
              dob: profile.dob,
              gender: profile.gender,
              premature: profile.prematureWeeks > 0,
              weeksPremature: profile.prematureWeeks,
              reasonForReferral: state.childInfo.reasonForReferral,
            }});
            // Store active profile ID
            dispatch({ type: 'LOAD_STATE', payload: { ...state, phase: 'profileView', activeProfileId: profile.id, childInfo: {
              ...state.childInfo,
              firstName: profile.firstName,
              lastName: profile.lastName,
              dob: profile.dob,
              gender: profile.gender,
              premature: profile.prematureWeeks > 0,
              weeksPremature: profile.prematureWeeks,
              reasonForReferral: state.childInfo.reasonForReferral,
            }}});
          }}
          onOpenSettings={() => dispatch({ type: 'GO_TO_PHASE', phase: 'settings' })}
          onOpenAllAssessments={() => dispatch({ type: 'GO_TO_PHASE', phase: 'allAssessments' })}
          onStartWithoutProfile={() => dispatch({ type: 'GO_TO_PHASE', phase: 'dashboard' })}
        />
      );

    case 'profileView':
      return (
        <ClientProfileView
          profileId={state.activeProfileId || ''}
          onBack={() => dispatch({ type: 'GO_TO_PHASE', phase: 'profiles' })}
          onStartAssessment={(profile: ClientProfile) => {
            // Pre-fill child info from profile
            dispatch({ type: 'SET_CHILD_INFO', payload: {
              firstName: profile.firstName,
              lastName: profile.lastName,
              dob: profile.dob,
              gender: profile.gender,
              premature: profile.prematureWeeks > 0,
              weeksPremature: profile.prematureWeeks,
              reasonForReferral: '',
              testDate: state.childInfo.testDate,
            }});
            dispatch({ type: 'GO_TO_PHASE', phase: 'examinerInfo' });
          }}
          onLoadAssessment={(session: SavedMultiSession) => {
            // Load the session state
            const loadedState = session.stateSnapshot;
            const targetPhase = session.status === 'completed' ? 'summary' : 'assessment';
            dispatch({ type: 'LOAD_STATE', payload: { ...loadedState, phase: targetPhase, activeProfileId: state.activeProfileId } });
          }}
        />
      );

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
            // Go back to wherever the user came from — profiles if no assessment, summary if mid-assessment
            const hasAssessment = Object.keys(state.formStates).length > 0;
            dispatch({ type: 'GO_TO_PHASE', phase: hasAssessment ? 'summary' : 'profiles' });
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
