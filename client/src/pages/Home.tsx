import { AssessmentProvider, useAssessment } from '@/contexts/AssessmentContext';
import ChildInfoForm from '@/components/ChildInfoForm';
import AssessmentLayout from '@/components/AssessmentLayout';

function AssessmentFlow() {
  const { state } = useAssessment();

  if (!state.isStarted) {
    return <ChildInfoForm />;
  }

  return <AssessmentLayout />;
}

export default function Home() {
  return (
    <AssessmentProvider>
      <AssessmentFlow />
    </AssessmentProvider>
  );
}
