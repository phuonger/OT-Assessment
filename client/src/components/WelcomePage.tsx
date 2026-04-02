/**
 * WelcomePage
 * 
 * Design: Clinical Precision — Swiss Medical Design
 * Landing page shown when the app first opens.
 * Features branding, version info, and a "Get Started" button.
 */

import { useMultiAssessment } from '@/contexts/MultiAssessmentContext';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
  const { dispatch } = useMultiAssessment();

  const handleGetStarted = () => {
    dispatch({ type: 'GO_TO_PHASE', phase: 'dashboard' });
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

        {/* Version */}
        <p className="text-[#BEBEBE] text-[10px] mt-8">
          v1.4.8
        </p>
      </div>
    </div>
  );
}
