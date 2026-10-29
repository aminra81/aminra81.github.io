import { getDocument, GlobalWorkerOptions } from '/assets/vendor/pdfjs/pdf.mjs';

GlobalWorkerOptions.workerSrc = '/assets/vendor/pdfjs/pdf.worker.mjs';
const viewer = document.getElementById('cv-document');

try {
  const pdf = await getDocument({ url: '/assets/cv.pdf' }).promise;
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    canvas.setAttribute('aria-hidden', 'true');
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

    const sheet = document.createElement('article');
    sheet.className = 'pdf-page';
    sheet.setAttribute('aria-label', `CV page ${number} of ${pdf.numPages}`);
    const accessibleText = document.createElement('p');
    accessibleText.className = 'sr-only';
    const text = await page.getTextContent();
    accessibleText.textContent = text.items.map(item => item.str || '').join(' ');
    sheet.append(canvas, accessibleText);
    viewer.append(sheet);
  }
  viewer.setAttribute('aria-busy', 'false');
} catch (error) {
  console.error('Unable to render the inline CV:', error);
  const frame = document.createElement('iframe');
  frame.className = 'pdf-viewer';
  frame.src = '/assets/cv.pdf#view=FitH';
  frame.title = 'Mohammad Amin Raeisi curriculum vitae';
  viewer.replaceChildren(frame);
  viewer.setAttribute('aria-busy', 'false');
}
