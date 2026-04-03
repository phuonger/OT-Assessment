/**
 * generatePdf.ts
 *
 * Generates a formatted PDF from the clinical report by capturing the
 * rendered report DOM element and converting it to PDF using html2pdf.js.
 * Handles expanding collapsed sections, hiding UI controls, and restoring state.
 */

// @ts-ignore - html2pdf.js doesn't have types
import html2pdf from 'html2pdf.js';

export interface PdfExportOptions {
  filename: string;
  /** The DOM element containing the report content */
  element: HTMLElement;
  /** Callback to expand all sections before capture */
  onBeforeCapture?: () => void;
  /** Callback to restore sections after capture */
  onAfterCapture?: () => void;
}

export async function generatePdfReport(options: PdfExportOptions): Promise<void> {
  const { filename, element, onBeforeCapture, onAfterCapture } = options;

  // Expand all sections before capture
  if (onBeforeCapture) onBeforeCapture();

  // Small delay to let React re-render expanded sections
  await new Promise(resolve => setTimeout(resolve, 300));

  // Clone the element so we can modify it without affecting the live DOM
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove all print:hidden elements (Tailwind class with colon)
  // Tailwind 4 may compile the class differently, so check multiple patterns
  clone.querySelectorAll('.print\\:hidden, [class*="print:hidden"]').forEach(el => el.remove());

  // Remove all no-print elements (the Print All Checklists button, etc.)
  clone.querySelectorAll('.no-print, [class*="no-print"]').forEach(el => el.remove());

  // Remove all checklist guide components by their data attributes or distinctive classes
  // These are interactive-only components not meant for PDF output
  clone.querySelectorAll('[data-checklist-guide]').forEach(el => el.remove());

  // Remove any remaining elements with checklist-related patterns
  // (collapsible guides with radio buttons, checkboxes for clinical assessment)
  clone.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(el => {
    // Walk up to find the closest guide container and remove it
    // But only if it's inside a guide wrapper, not a regular form element
    const wrapper = el.closest('[class*="border-teal"], [class*="border-blue"], [class*="border-violet"], [class*="border-cyan"], [class*="border-amber"]');
    if (wrapper && wrapper.querySelector('input[type="radio"]')) {
      wrapper.remove();
    }
  });

  // Remove all buttons
  clone.querySelectorAll('button').forEach(btn => btn.remove());

  // Remove all remaining interactive inputs (selects, etc.)
  clone.querySelectorAll('select').forEach(el => el.remove());

  // Remove textareas — replace with their text content in a styled div
  clone.querySelectorAll('textarea').forEach(ta => {
    const div = document.createElement('div');
    div.style.whiteSpace = 'pre-wrap';
    div.style.fontFamily = 'Georgia, serif';
    div.style.fontSize = '11pt';
    div.style.lineHeight = '1.6';
    div.style.color = '#1e293b';
    div.textContent = (ta as HTMLTextAreaElement).value;
    ta.parentNode?.replaceChild(div, ta);
  });

  // Remove any empty containers left after stripping interactive elements
  clone.querySelectorAll('div:empty').forEach(el => {
    // Only remove if it has no meaningful styling (not a spacer/divider)
    if (!el.className.includes('border-') && !el.className.includes('bg-')) {
      el.remove();
    }
  });

  // Style the clone for PDF output
  clone.style.padding = '0';
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.borderRadius = '0';
  clone.style.background = 'white';

  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '8.5in';
  container.style.background = 'white';
  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    const opt = {
      margin: [0.5, 0.6, 0.5, 0.6] as [number, number, number, number],
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.92 },
      html2canvas: {
        scale: 1.5,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff',
        // Limit canvas size to prevent memory issues
        windowWidth: 816, // 8.5in * 96dpi
      },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'portrait' as const,
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    // Add a timeout to prevent infinite hangs
    const pdfPromise = html2pdf().set(opt).from(clone).save();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('PDF generation timed out after 60 seconds')), 60000)
    );

    await Promise.race([pdfPromise, timeoutPromise]);
  } finally {
    // Clean up
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    // Restore sections
    if (onAfterCapture) onAfterCapture();
  }
}
