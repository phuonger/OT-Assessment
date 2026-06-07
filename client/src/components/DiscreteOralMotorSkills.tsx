/**
 * DiscreteOralMotorSkills Component
 * 
 * Renders the Discrete Oral Motor Skills section for the OT Feeding Assessment.
 * Questions are text-input (not numerically scored) and grouped by category:
 * Cheeks, Lips, Jaw, Tongue, and Palate (optional, enabled via button).
 * 
 * Data is persisted to localStorage keyed by child.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ORAL_MOTOR_QUESTIONS, ORAL_MOTOR_CATEGORIES, type OralMotorQuestion } from '@/lib/otFeedingData';
import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';

export interface OralMotorAnswers {
  [questionId: string]: string;
}

interface DiscreteOralMotorSkillsProps {
  storageKey: string; // e.g. childKey
  onChange?: (answers: OralMotorAnswers) => void;
}

const STORAGE_PREFIX = 'ot-feeding-oral-motor-';

export function DiscreteOralMotorSkills({ storageKey, onChange }: DiscreteOralMotorSkillsProps) {
  const fullKey = `${STORAGE_PREFIX}${storageKey}`;

  const [answers, setAnswers] = useState<OralMotorAnswers>(() => {
    try {
      const raw = localStorage.getItem(fullKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [palateEnabled, setPalateEnabled] = useState(() => {
    try {
      const raw = localStorage.getItem(`${fullKey}-palate-enabled`);
      return raw === 'true';
    } catch {
      return false;
    }
  });

  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Persist answers
  useEffect(() => {
    try {
      localStorage.setItem(fullKey, JSON.stringify(answers));
    } catch { /* localStorage full */ }
    onChange?.(answers);
  }, [answers, fullKey, onChange]);

  // Persist palate toggle
  useEffect(() => {
    try {
      localStorage.setItem(`${fullKey}-palate-enabled`, String(palateEnabled));
    } catch { /* */ }
  }, [palateEnabled, fullKey]);

  const updateAnswer = useCallback((questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const toggleCategory = useCallback((catId: string) => {
    setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  }, []);

  const getQuestionsForCategory = (catId: string): OralMotorQuestion[] => {
    return ORAL_MOTOR_QUESTIONS.filter(q => q.category === catId && (!q.optional || palateEnabled));
  };

  const filledCount = Object.values(answers).filter(v => v.trim().length > 0).length;
  const totalQuestions = ORAL_MOTOR_QUESTIONS.filter(q => !q.optional || palateEnabled).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Discrete Oral Motor Skills</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {filledCount}/{totalQuestions} fields completed
          </p>
        </div>
        <Button
          variant={palateEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPalateEnabled(!palateEnabled)}
          className="gap-1.5 text-xs"
        >
          {palateEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {palateEnabled ? 'Palate Enabled' : 'Enable Palate'}
        </Button>
      </div>

      {/* Categories */}
      {ORAL_MOTOR_CATEGORIES.map(cat => {
        // Skip palate if not enabled
        if (cat.id === 'palate' && !palateEnabled) return null;

        const questions = getQuestionsForCategory(cat.id);
        if (questions.length === 0) return null;

        const isCollapsed = collapsedCategories[cat.id];
        const catFilledCount = questions.filter(q => answers[q.id]?.trim()).length;

        return (
          <div key={cat.id} className="border border-slate-200 rounded-lg overflow-hidden">
            {/* Category header */}
            <button
              onClick={() => toggleCategory(cat.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                <span className="text-sm font-semibold text-slate-700">{cat.label}</span>
              </div>
              <span className="text-xs text-slate-400">{catFilledCount}/{questions.length}</span>
            </button>

            {/* Questions */}
            {!isCollapsed && (
              <div className="p-4 space-y-3">
                {questions.map(q => (
                  <div key={q.id}>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {q.label}
                    </label>
                    <Textarea
                      value={answers[q.id] || ''}
                      onChange={(e) => updateAnswer(q.id, e.target.value)}
                      placeholder="Enter observation..."
                      rows={2}
                      className="text-sm resize-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Helper to load oral motor answers from localStorage
 */
export function loadOralMotorAnswers(storageKey: string): OralMotorAnswers {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isPalateEnabled(storageKey: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${storageKey}-palate-enabled`) === 'true';
  } catch {
    return false;
  }
}
