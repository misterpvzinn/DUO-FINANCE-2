import * as pdfjsLib from 'pdfjs-dist';

// Configure worker using unpkg or cdn fallback if needed
if (typeof window !== 'undefined' && 'GlobalWorkerOptions' in pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export async function extractTextFromPdf(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items by roughly their vertical line (y coordinate)
    const items = textContent.items as Array<{ str: string; transform: number[] }>;
    let lastY: number | null = null;
    let currentLine = '';

    for (const item of items) {
      if ('str' in item) {
        const y = Math.round(item.transform[5]);
        if (lastY === null || Math.abs(y - lastY) < 5) {
          currentLine += (currentLine ? ' ' : '') + item.str;
        } else {
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }
          currentLine = item.str;
        }
        lastY = y;
      }
    }
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
  }

  return lines;
}
