// This service uses the pdf.js library, which is loaded via a <script> tag in index.html.
// We are telling TypeScript to ignore warnings about the global 'pdfjsLib' object.

// @ts-ignore
if (typeof pdfjsLib !== 'undefined') {
    // @ts-ignore
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}


export const extractTextFromPDF = async (file: File): Promise<string> => {
    // @ts-ignore
    if (typeof pdfjsLib === 'undefined') {
        throw new Error('pdf.js library is not loaded.');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const numPages = pdf.numPages;
    let fullText = '';

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: { str: string }) => item.str).join(' ');
        fullText += pageText + '\n\n';
    }

    return fullText;
};
