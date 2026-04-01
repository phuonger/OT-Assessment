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
  await new Promise(resolve => setTimeout(resolve, 200));

  // Clone the element so we can modify it without affecting the live DOM
  const clone = element.cloneNode(true) as HTMLElement;

  // Remove all print:hidden and interactive elements from the clone
  clone.querySelectorAll('.print\\:hidden, [class*="print:hidden"]').forEach(el => el.remove());
  // Remove edit buttons, toggle buttons
  clone.querySelectorAll('button').forEach(btn => {
    const text = btn.textContent?.trim().toLowerCase() || '';
    if (['edit', 'done', 'show', 'hide', 'insert template'].some(t => text.includes(t))) {
      btn.remove();
    }
  });
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
      margin: [0.5, 0.6, 0.5, 0.6] as [number, number, number, number], // top, right, bottom, left in inches
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'portrait' as const,
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    await html2pdf().set(opt).from(clone).save();
  } finally {
    // Clean up
    document.body.removeChild(container);
    // Restore sections
    if (onAfterCapture) onAfterCapture();
  }
}
