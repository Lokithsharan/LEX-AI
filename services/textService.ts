export const extractTextFromTxt = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target && typeof event.target.result === 'string') {
                resolve(event.target.result);
            } else {
                reject(new Error('Failed to read the file content.'));
            }
        };
        reader.onerror = () => {
            reject(new Error('Error reading the file.'));
        };
        reader.readAsText(file);
    });
};
