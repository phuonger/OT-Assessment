/**
 * AI Enhance — rewrites raw clinical text into professional OT narrative style.
 *
 * Uses OpenRouter cloud API with free and paid model options.
 * The API key is stored in localStorage and configured via the Settings page.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Available cloud models — ordered by reliability for clinical writing.
 *  Free model IDs verified against OpenRouter /api/v1/models on 2026-04-08. */
export const AI_MODELS = [
  { id: 'openai/gpt-oss-120b:free', label: 'GPT-OSS 120B (Free)', description: 'Most reliable free model, recommended' },
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'Nemotron 3 Super 120B (Free)', description: 'Strong reasoning, completely free' },
  { id: 'minimax/minimax-m2.5:free', label: 'MiniMax M2.5 (Free)', description: 'Capable model, completely free' },
  { id: 'google/gemma-4-26b-a4b-it:free', label: 'Gemma 4 26B (Free)', description: 'Good quality, completely free' },
  { id: 'google/gemma-4-31b-it:free', label: 'Gemma 4 31B (Free)', description: 'High quality, may have rate limits' },
  { id: 'stepfun/step-3.5-flash:free', label: 'Step 3.5 Flash (Free)', description: 'Fast reasoning, may have rate limits' },
  { id: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku (Paid)', description: 'Best quality, requires credits (~$0.01/use)' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (Paid)', description: 'Good quality, requires credits (~$0.01/use)' },
] as const;

export type AiModelId = typeof AI_MODELS[number]['id'];

const STORAGE_KEY_API = 'ot-assessment-openrouter-key';
const STORAGE_KEY_MODEL = 'ot-assessment-ai-model';

/** Get the stored API key */
export function getApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_API) || '';
  } catch {
    return '';
  }
}

/** Save the API key */
export function setApiKey(key: string): void {
  try {
    if (key) {
      localStorage.setItem(STORAGE_KEY_API, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_API);
    }
  } catch {
    // localStorage not available
  }
}

/** Get the selected model */
export function getSelectedModel(): AiModelId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MODEL);
    if (stored && AI_MODELS.some(m => m.id === stored)) {
      return stored as AiModelId;
    }
  } catch {
    // fall through
  }
  return AI_MODELS[0].id;
}

/** Save the selected model */
export function setSelectedModel(modelId: AiModelId): void {
  try {
    localStorage.setItem(STORAGE_KEY_MODEL, modelId);
  } catch {
    // localStorage not available
  }
}

/** Check if AI is configured (has an API key) */
export function isAiConfigured(): boolean {
  return getApiKey().length > 0;
}

/** System prompt that instructs the LLM to behave as a clinical report writer */
const SYSTEM_PROMPT = `You are an expert pediatric occupational therapist writing clinical evaluation reports for early intervention (IFSP) programs. Your task is to rewrite the provided text into a professional, flowing clinical narrative.

RULES:
1. Preserve ALL factual content — scores, ratings, observations, and clinical findings must remain accurate.
2. Use the child's first name naturally throughout (never "the child" or "the patient").
3. Convert repetitive "[attribute] was [rating]" patterns into flowing paragraphs that group related findings.
4. Use professional OT clinical language: "demonstrates", "presents with", "emerging skills", "within functional limits", "continues to have difficulty with", etc.
5. Connect related observations logically (e.g., group all jaw findings, then lip findings, then tongue findings).
6. Where appropriate, add brief clinical context (e.g., "which impacts his ability to manage mixed textures").
7. Keep the same general structure and section — do not add new sections or remove content.
8. Do NOT add recommendations unless they were in the original text.
9. Do NOT add scores or data that were not in the original text.
10. Write in third person, past tense for observations, present tense for current abilities.
11. Output ONLY the rewritten text — no explanations, headers, or markdown formatting.
12. Keep the length similar to the original — do not significantly expand or reduce the content.`;

export interface AiEnhanceOptions {
  /** The raw text to rewrite */
  text: string;
  /** The section label/context (e.g., "Oral Motor Coordination", "Feeding Behaviors") */
  sectionContext?: string;
  /** Child's first name for the prompt */
  childName?: string;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

export interface AiEnhanceResult {
  success: boolean;
  enhanced?: string;
  error?: string;
  needsSetup?: boolean;
}

/**
 * Check if the device appears to be online.
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/** System prompt for generating clinical recommendations from assessment findings */
const RECOMMENDATIONS_SYSTEM_PROMPT = `You are an expert pediatric occupational therapist writing clinical recommendations for early intervention (IFSP) evaluation reports. Based on the assessment findings provided, generate professional, specific, and actionable recommendations.

RULES:
1. Use the child's first name naturally throughout.
2. Begin with a brief summary sentence about the child (age, gender, reason for referral).
3. Reference specific assessment findings (scores, age equivalences, delays) to justify each recommendation.
4. Include the quarter-delay calculation when provided (e.g., "A ¼ delay would be considered X months").
5. Structure recommendations as numbered items.
6. Common recommendation categories for early intervention OT:
   - Occupational therapy services (specify areas: fine motor, feeding, sensory processing, self-care)
   - Speech and language pathology referral (if communication delays noted)
   - Physical therapy referral (if gross motor delays noted)
   - Feeding therapy (if oral motor or feeding concerns)
   - Sensory integration therapy (if sensory processing concerns)
   - Parent/caregiver education and home program
   - Re-evaluation timeline
7. Include the standard IFSP language: "It is recommended that the IFSP team consider the following, however, regional center to make the final determination of eligibility and services."
8. Be specific about WHICH skills need to be addressed based on the findings.
9. Use professional clinical language.
10. Output ONLY the recommendations text — no explanations, headers, or markdown formatting.
11. Keep recommendations concise but thorough — typically 1-2 paragraphs of context followed by 3-6 numbered recommendations.`;

export interface GenerateRecommendationsOptions {
  /** Child's full name */
  childName: string;
  /** Child's first name */
  firstName: string;
  /** Chronological age string (e.g., "18 months") */
  chronAge: string;
  /** Gender */
  gender: string;
  /** Template type */
  template: string;
  /** Domain scores with age equivalences */
  domainFindings: string;
  /** Summary of all report sections (narrative text from the report) */
  reportSummary: string;
  /** Quarter delay in months */
  quarterDelay?: number;
  /** Existing recommendations to enhance (if any) */
  existingRecommendations?: string;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

// ─── Cloud API helper ─────────────────────────────────────────────────────────

async function callCloudAPI(
  systemPrompt: string,
  userMessage: string,
  options: { signal?: AbortSignal; maxTokens?: number; temperature?: number }
): Promise<AiEnhanceResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: 'OpenRouter API key not configured. Go to Settings → AI Settings to add your API key.',
      needsSetup: true,
    };
  }

  if (!isOnline()) {
    return { success: false, error: 'No internet connection. AI Enhance requires an internet connection.' };
  }

  const model = getSelectedModel();

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://ot-assessment.app',
        'X-Title': 'OT Developmental Assessment Suite',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: options.maxTokens ?? 2048,
        temperature: options.temperature ?? 0.4,
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error('[AI] API error:', response.status, errBody);

      if (response.status === 401 || response.status === 403) {
        return { success: false, error: 'Invalid API key. Please check your OpenRouter API key in Settings.', needsSetup: true };
      }
      if (response.status === 402) {
        return { success: false, error: 'Insufficient credits for this model. Switch to a free model in Settings → AI Settings.' };
      }
      if (response.status === 429) {
        return { success: false, error: 'Rate limit reached. Please wait a moment and try again, or switch to a different free model.' };
      }
      return { success: false, error: `AI service error (${response.status}). Please try again later.` };
    }

    const data = await response.json();
    const enhanced = data?.choices?.[0]?.message?.content?.trim();

    if (!enhanced) {
      return { success: false, error: 'AI returned an empty response. Please try again.' };
    }

    return { success: true, enhanced };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { success: false, error: 'AI enhancement was cancelled.' };
    }
    console.error('[AI] Network error:', err);
    return { success: false, error: 'Could not reach the AI service. Please check your internet connection.' };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate clinical recommendations based on assessment findings.
 */
export async function generateRecommendations(options: GenerateRecommendationsOptions): Promise<AiEnhanceResult> {
  const {
    childName, firstName, chronAge, gender, template,
    domainFindings, reportSummary, quarterDelay,
    existingRecommendations, signal,
  } = options;

  const userParts: string[] = [
    `Child: ${childName}`,
    `First name: ${firstName}`,
    `Age: ${chronAge}`,
    `Gender: ${gender}`,
    `Assessment type: ${template}`,
  ];

  if (quarterDelay && quarterDelay > 0) {
    userParts.push(`Quarter delay threshold: ${quarterDelay} months`);
  }

  if (domainFindings) {
    userParts.push('', 'Assessment Scores and Findings:', domainFindings);
  }

  if (reportSummary) {
    userParts.push('', 'Report Narrative Summary:', reportSummary);
  }

  if (existingRecommendations) {
    userParts.push('', 'Current recommendations (enhance and improve these):', existingRecommendations);
  } else {
    userParts.push('', 'Please generate comprehensive clinical recommendations based on the above findings.');
  }

  const userMessage = userParts.join('\n');

  if (!isAiConfigured()) {
    return {
      success: false,
      error: 'OpenRouter API key not configured. Go to Settings → AI Settings to add your API key.',
      needsSetup: true,
    };
  }

  return callCloudAPI(RECOMMENDATIONS_SYSTEM_PROMPT, userMessage, {
    signal, maxTokens: 2048, temperature: 0.5,
  });
}

/**
 * Enhance clinical text using AI.
 */
export async function enhanceWithAI(options: AiEnhanceOptions): Promise<AiEnhanceResult> {
  const { text, sectionContext, childName, signal } = options;

  if (!text || text.trim().length < 10) {
    return { success: false, error: 'Text is too short to enhance. Please add more content first.' };
  }

  const userMessage = [
    sectionContext ? `Section: ${sectionContext}` : '',
    childName ? `Child's name: ${childName}` : '',
    '',
    'Text to rewrite:',
    text,
  ].filter(Boolean).join('\n');

  if (!isAiConfigured()) {
    return {
      success: false,
      error: 'OpenRouter API key not configured. Go to Settings → AI Settings to add your API key.',
      needsSetup: true,
    };
  }

  return callCloudAPI(SYSTEM_PROMPT, userMessage, {
    signal, maxTokens: 2048, temperature: 0.4,
  });
}
