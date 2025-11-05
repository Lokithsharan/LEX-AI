import React, { useState } from 'react';
import { CaseSummary } from '../types';

interface SummaryDisplayProps {
  summary: CaseSummary;
  onReset: () => void;
  onAskFollowUp: () => void;
}

const SummarySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-yellow-400 border-b-2 border-yellow-400/30 pb-2 mb-3">{title}</h3>
    <div className="text-slate-300 leading-relaxed">{children}</div>
  </div>
);

export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary, onReset, onAskFollowUp }) => {
    const [copied, setCopied] = useState(false);

    const formatSummaryForCopy = () => {
        return `
CASE SUMMARY
---------------------------------

Case Name: ${summary.caseName}
Citation: ${summary.citation}

Parties:
- ${summary.parties.join('\n- ')}

Facts of the Case:
${summary.factsOfCase}

Legal Issues:
- ${summary.legalIssues.join('\n- ')}

Judgment & Reasoning:
${summary.judgmentAndReasoning}

Suggested Precedents:
- ${summary.suggestedPrecedents.join('\n- ')}

Conclusion:
${summary.conclusion}
        `.trim();
    }


    const handleCopy = () => {
        const textToCopy = formatSummaryForCopy();
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const handleExport = () => {
        const textToExport = formatSummaryForCopy();
        const blob = new Blob([textToExport], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${summary.caseName.replace(/ /g, '_')}_Summary.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 md:p-8 animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <div>
            <h2 className="text-2xl font-bold text-white">{summary.caseName}</h2>
            <p className="text-md text-slate-400">{summary.citation}</p>
        </div>
        <div className="flex items-center space-x-2">
            <button
              onClick={onAskFollowUp}
              className="flex items-center px-4 py-2 rounded-md bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
              title="Ask Follow-up Questions"
            >
              Ask AI
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors text-sm"
              title="Export as .txt"
            >
              Export
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors text-sm w-20 text-center"
              title={copied ? 'Copied!' : 'Copy to Clipboard'}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors text-sm"
              title="Summarize Another Document"
            >
              Reset
            </button>
        </div>
      </div>
      
      <div className="mt-6">
        <SummarySection title="Parties Involved">
          <ul className="list-disc list-inside">
            {summary.parties.map((party, index) => (
              <li key={index}>{party}</li>
            ))}
          </ul>
        </SummarySection>

        <SummarySection title="Facts of the Case">
          <p>{summary.factsOfCase}</p>
        </SummarySection>

        <SummarySection title="Legal Issues">
          <ul className="list-decimal list-inside">
             {summary.legalIssues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </SummarySection>
        
        <SummarySection title="Judgment & Reasoning">
            <p>{summary.judgmentAndReasoning}</p>
        </SummarySection>

        <SummarySection title="Suggested Precedents">
            <ul className="list-disc list-inside">
                {summary.suggestedPrecedents.map((precedent, index) => (
                    <li key={index}>{precedent}</li>
                ))}
            </ul>
        </SummarySection>

        <SummarySection title="Conclusion">
          <p>{summary.conclusion}</p>
        </SummarySection>
      </div>
    </div>
  );
};