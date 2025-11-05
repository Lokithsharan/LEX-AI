// This service uses the Tesseract.js library, which is loaded via a <script> tag in index.html.
// We are telling TypeScript to ignore warnings about the global 'Tesseract' object.

declare const Tesseract: any;

export const extractTextFromImage = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  if (typeof Tesseract === 'undefined') {
    throw new Error('Tesseract.js library is not loaded.');
  }

  const worker = await Tesseract.createWorker('eng', 1, {
    logger: (m: { progress: number; status: string }) => {
      if (m.status === 'recognizing text') {
        onProgress(m.progress);
      }
    },
  });
  
  const ret = await worker.recognize(file);
  await worker.terminate();
  return ret.data.text;
};