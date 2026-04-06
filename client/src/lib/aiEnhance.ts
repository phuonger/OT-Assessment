/**
 * AI Enhance — rewrites raw clinical text into professional OT narrative style.
 *
 * Uses the OpenRouter API (OpenAI-compatible chat completions endpoint).
 * The API key is stored in localStorage and configured via the Settings page.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Available models — ordered by quality for clinical writing */
export const AI_MODELS = [
  { id: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku (Recommended)', description: 'Fast, high quality clinical writing' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', description: 'Good quality, very affordable' },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', description: 'Open source, good quality' },
  { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash', description: 'Fast and capable' },
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

/**
 * Call the OpenRouter API to rewrite clinical text.
 */
export async function enhanceWithAI(options: AiEnhanceOptions): Promise<AiEnhanceResult> {
  const { text, sectionContext, childName, signal } = options;

  if (!text || text.trim().length < 10) {
    return { success: false, error: 'Text is too short to enhance. Please add more content first.' };
  }

  if (!isOnline()) {
    return { success: false, error: 'No internet connection. AI Enhance requires an internet connection.' };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: 'OpenRouter API key not configured. Please add your API key in Settings → AI Settings.',
      needsSetup: true,
    };
  }

  const model = getSelectedModel();

  const userMessage = [
    sectionContext ? `Section: ${sectionContext}` : '',
    childName ? `Child's name: ${childName}` : '',
    '',
    'Text to rewrite:',
    text,
  ].filter(Boolean).join('\n');

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
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 2048,
        temperature: 0.4,
      }),
      signal,
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error('[AI Enhance] API error:', response.status, errBody);

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: 'Invalid API key. Please check your OpenRouter API key in Settings → AI Settings.',
          needsSetup: true,
        };
      }
      if (response.status === 402) {
        return { success: false, error: 'Insufficient credits on your OpenRouter account. Please add credits at openrouter.ai.' };
      }
      if (response.status === 429) {
        return { success: false, error: 'Rate limit reached. Please wait a moment and try again.' };
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
    console.error('[AI Enhance] Network error:', err);
    return { success: false, error: 'Could not reach the AI service. Please check your internet connection and try again.' };
  }
}
