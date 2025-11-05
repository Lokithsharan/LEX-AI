import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { SummaryDisplay } from './SummaryDisplay';
import { Loader } from './Loader';
import { extractTextFromPDF } from '../services/pdfService';
import { extractTextFromTxt } from '../services/textService';
import { extractTextFromImage } from '../services/ocrService';
import { generateSummary, SummaryType } from '../services/geminiService';
import { CaseSummary } from '../types';

interface UploadPageProps {
  onSummaryGenerated: (documentName: string, documentText: string, summary: CaseSummary) => void;
  setPage: (page: 'chatbot') => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onSummaryGenerated, setPage }) => {
  const [summary, setSummary] = useState<CaseSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [summaryType, setSummaryType] = useState<SummaryType>('Detailed');
  const [originalText, setOriginalText] = useState<string>('');


  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setSummary(null);
    setOriginalText('');

    try {
      setLoadingMessage('Processing Document & Extracting Text...');
      let documentText = '';
      if (file.type === 'application/pdf') {
        documentText = await extractTextFromPDF(file);
      } else if (file.type === 'text/plain') {
        documentText = await extractTextFromTxt(file);
      } else if (file.type.startsWith('image/')) {
        setLoadingMessage('Performing OCR on image...');
        documentText = await extractTextFromImage(file, (progress) => {
            setLoadingMessage(`Performing OCR... (${Math.round(progress * 100)}%)`);
        });
      }
      else {
        throw new Error('Unsupported file type. Please upload a PDF, TXT, or image file.');
      }
      
      setOriginalText(documentText);

      if (!documentText.trim()) {
        throw new Error('Could not extract any text from the document. The file might be empty, corrupted, or contain no readable text.');
      }

      setLoadingMessage(`Generating ${summaryType} AI summary...`);
      const generatedSummary = await generateSummary(documentText, summaryType);
      setSummary(generatedSummary);
      onSummaryGenerated(file.name, documentText, generatedSummary);

    } catch (err) {
      if (err instanceof Error) {
        setError(`An error occurred: ${err.message}`);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleReset = () => {
    setSummary(null);
    setError(null);
    setIsLoading(false);
    setOriginalText('');
  };

  const handleAskFollowUp = () => {
    setPage('chatbot');
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
            {isLoading ? (
                <Loader message={loadingMessage} />
            ) : error ? (
                <div className="text-center">
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative" role="alert">
                        <strong className="font-bold">Error! </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                    <button
                        onClick={handleReset}
                        className="mt-6 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-slate-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-slate-900 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : summary ? (
                <SummaryDisplay summary={summary} onReset={handleReset} onAskFollowUp={handleAskFollowUp} />
            ) : (
                <div className="text-center p-8 bg-slate-800/30 rounded-2xl border border-slate-700 backdrop-blur-sm animate-fade-in">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-2">
                        AI-Powered Case Summarization
                    </h2>
                    <p className="mt-4 text-lg leading-8 text-slate-300">
                        Upload a legal document (PDF, TXT, or Image) to get a structured, AI-generated summary.
                    </p>
                    <div className="mt-8">
                       <div className="flex justify-center items-center space-x-4 mb-6">
                          {(['Concise', 'Detailed', 'Executive'] as SummaryType[]).map((type) => (
                            <button
                              key={type}
                              onClick={() => setSummaryType(type)}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                summaryType === type
                                  ? 'bg-yellow-400 text-slate-900'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              }`}
                            >
                              {type} Summary
                            </button>
                          ))}
                        </div>
                        <FileUpload onFileSelect={handleFileProcess} />
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};