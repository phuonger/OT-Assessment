/**
 * Local LLM Service — runs Qwen2.5-3B-Instruct via wllama (WebAssembly llama.cpp)
 *
 * This provides completely offline, unlimited AI inference in the browser/Electron renderer.
 * The model is downloaded on-demand (~1.93GB) and cached in the browser's storage.
 * No API key required. No rate limits. Works offline after initial download.
 */

// Import from the pre-built ESM directory to avoid TypeScript source compilation issues
// @ts-ignore - importing from esm subdirectory
import { Wllama, LoggerWithoutDebug } from '@wllama/wllama/esm/index.js';
import type { WllamaChatMessage } from '@wllama/wllama/esm/wllama';

// ─── Model Configuration ─────────────────────────────────────────────────────

/** HuggingFace model coordinates */
const MODEL_HF_REPO = 'Qwen/Qwen2.5-3B-Instruct-GGUF';
const MODEL_HF_FILE = 'qwen2.5-3b-instruct-q4_k_m.gguf';

/** Human-readable model info */
export const LOCAL_MODEL_INFO = {
  name: 'Qwen2.5-3B-Instruct',
  quantization: 'Q4_K_M',
  sizeGB: 1.93,
  sizeBytes: 2_072_887_296,
  description: 'High-quality 3B parameter model optimized for instruction following. Excellent for clinical text rewriting.',
};

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const STORAGE_KEY_LOCAL_AI_ENABLED = 'ot-assessment-local-ai-enabled';
const STORAGE_KEY_LOCAL_AI_DOWNLOADED = 'ot-assessment-local-ai-downloaded';

// ─── Singleton State ──────────────────────────────────────────────────────────

let wllamaInstance: any = null;
let isModelLoaded = false;
let isDownloading = false;
let isLoading = false;
let downloadProgress = 0;
let loadProgress = 0;
let lastError: string | null = null;

/** Event listeners for state changes */
type StateListener = () => void;
const listeners = new Set<StateListener>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export function subscribeToLocalLLMState(listener: StateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ─── State Getters ────────────────────────────────────────────────────────────

export function getLocalLLMState() {
  return {
    isModelLoaded,
    isDownloading,
    isLoading,
    downloadProgress,
    loadProgress,
    lastError,
    isModelDownloaded: isLocalModelDownloaded(),
    isLocalAIEnabled: isLocalAIEnabled(),
  };
}

export function isLocalAIEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_LOCAL_AI_ENABLED) === 'true';
  } catch {
    return false;
  }
}

export function setLocalAIEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_AI_ENABLED, String(enabled));
  } catch { /* ignore */ }
  notifyListeners();
}

export function isLocalModelDownloaded(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_LOCAL_AI_DOWNLOADED) === 'true';
  } catch {
    return false;
  }
}

function markModelDownloaded(downloaded: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOCAL_AI_DOWNLOADED, String(downloaded));
  } catch { /* ignore */ }
}

/** Check if the local model is ready for inference */
export function isLocalModelReady(): boolean {
  return isModelLoaded && wllamaInstance !== null && isLocalAIEnabled();
}

// ─── WASM Config ──────────────────────────────────────────────────────────────

/** Use CDN-hosted WASM files to avoid bundling them */
function getWasmPaths() {
  return {
    'single-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/single-thread/wllama.wasm',
    'multi-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/multi-thread/wllama.wasm',
  };
}

// ─── Download & Load ──────────────────────────────────────────────────────────

/**
 * Download the model from HuggingFace and load it into memory.
 * Progress is reported via the state subscription system.
 */
export async function downloadAndLoadModel(
  onProgress?: (phase: 'download' | 'load', progress: number) => void
): Promise<{ success: boolean; error?: string }> {
  if (isDownloading || isLoading) {
    return { success: false, error: 'Already downloading or loading.' };
  }

  lastError = null;
  notifyListeners();

  try {
    // Create wllama instance if needed
    if (!wllamaInstance) {
      wllamaInstance = new Wllama(getWasmPaths(), {
        logger: LoggerWithoutDebug,
        allowOffline: true,
      });
    }

    // Download and load the model
    isDownloading = true;
    downloadProgress = 0;
    notifyListeners();

    console.log('[LocalLLM] Starting model download from HuggingFace...');

    await wllamaInstance.loadModelFromHF(MODEL_HF_REPO, MODEL_HF_FILE, {
      n_threads: 1, // Force single-thread for maximum compatibility
      n_ctx: 2048,
      n_batch: 128,
      progressCallback: ({ loaded, total }: { loaded: number; total: number }) => {
        const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
        downloadProgress = pct;
        onProgress?.('download', pct);
        notifyListeners();
      },
    });

    isDownloading = false;
    downloadProgress = 100;
    isModelLoaded = true;
    markModelDownloaded(true);
    setLocalAIEnabled(true);
    notifyListeners();

    console.log('[LocalLLM] Model loaded successfully!');
    return { success: true };
  } catch (err: any) {
    console.error('[LocalLLM] Download/load error:', err);
    isDownloading = false;
    isLoading = false;
    downloadProgress = 0;
    loadProgress = 0;
    lastError = err?.message || 'Failed to download model';
    notifyListeners();
    return { success: false, error: lastError || undefined };
  }
}

/**
 * Load an already-downloaded model from cache.
 * This is much faster than downloading since it reads from cache.
 */
export async function loadCachedModel(): Promise<{ success: boolean; error?: string }> {
  if (isModelLoaded && wllamaInstance) {
    return { success: true };
  }

  if (isLoading || isDownloading) {
    return { success: false, error: 'Already loading.' };
  }

  if (!isLocalModelDownloaded()) {
    return { success: false, error: 'Model not downloaded yet.' };
  }

  lastError = null;
  isLoading = true;
  loadProgress = 0;
  notifyListeners();

  try {
    if (!wllamaInstance) {
      wllamaInstance = new Wllama(getWasmPaths(), {
        logger: LoggerWithoutDebug,
        allowOffline: true,
      });
    }

    console.log('[LocalLLM] Loading cached model...');

    await wllamaInstance.loadModelFromHF(MODEL_HF_REPO, MODEL_HF_FILE, {
      n_threads: 1,
      n_ctx: 2048,
      n_batch: 128,
      progressCallback: ({ loaded, total }: { loaded: number; total: number }) => {
        const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
        loadProgress = pct;
        notifyListeners();
      },
    });

    isLoading = false;
    loadProgress = 100;
    isModelLoaded = true;
    notifyListeners();

    console.log('[LocalLLM] Cached model loaded successfully!');
    return { success: true };
  } catch (err: any) {
    console.error('[LocalLLM] Cache load error:', err);
    isLoading = false;
    loadProgress = 0;
    lastError = err?.message || 'Failed to load cached model';
    // Model might have been evicted from cache
    markModelDownloaded(false);
    notifyListeners();
    return { success: false, error: lastError || undefined };
  }
}

/**
 * Unload the model from memory (but keep it in cache).
 */
export async function unloadModel(): Promise<void> {
  if (wllamaInstance) {
    try {
      await wllamaInstance.exit();
    } catch { /* ignore */ }
    wllamaInstance = null;
  }
  isModelLoaded = false;
  isDownloading = false;
  isLoading = false;
  downloadProgress = 0;
  loadProgress = 0;
  lastError = null;
  notifyListeners();
}

/**
 * Delete the cached model and free all resources.
 */
export async function deleteModel(): Promise<void> {
  await unloadModel();
  markModelDownloaded(false);
  setLocalAIEnabled(false);

  // Try to clear the wllama cache
  try {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      if (name.includes('wllama') || name.includes('llama')) {
        await caches.delete(name);
      }
    }
  } catch { /* ignore */ }

  // Also try clearing IndexedDB stores used by wllama
  try {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name && (db.name.includes('wllama') || db.name.includes('llama'))) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  } catch { /* ignore */ }

  notifyListeners();
}

// ─── Inference ────────────────────────────────────────────────────────────────

export interface LocalCompletionOptions {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

/**
 * Run a chat completion using the local model.
 * Uses wllama's built-in createChatCompletion which handles chat templates.
 */
export async function localChatCompletion(options: LocalCompletionOptions): Promise<{
  success: boolean;
  text?: string;
  error?: string;
}> {
  const { systemPrompt, userMessage, maxTokens = 2048, temperature = 0.4, signal } = options;

  if (!wllamaInstance || !isModelLoaded) {
    return { success: false, error: 'Local model not loaded.' };
  }

  if (signal?.aborted) {
    return { success: false, error: 'Cancelled.' };
  }

  try {
    const messages: WllamaChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    console.log('[LocalLLM] Starting chat completion...');

    const result = await wllamaInstance.createChatCompletion(messages, {
      nPredict: maxTokens,
      sampling: {
        temp: temperature,
        top_k: 40,
        top_p: 0.9,
        penalty_repeat: 1.1,
      },
      abortSignal: signal,
    });

    const text = typeof result === 'string' ? result.trim() : '';

    if (!text) {
      return { success: false, error: 'Model returned empty response.' };
    }

    console.log('[LocalLLM] Completion done, length:', text.length);
    return { success: true, text };
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.message?.includes('abort')) {
      return { success: false, error: 'Cancelled.' };
    }
    console.error('[LocalLLM] Completion error:', err);
    return { success: false, error: err?.message || 'Local inference failed.' };
  }
}
