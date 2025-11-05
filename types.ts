export interface User {
  id: string;
  email: string;
  role: 'Associate' | 'Partner' | 'Admin';
}

export interface CaseSummary {
  caseName: string;
  parties: string[];
  factsOfCase: string;
  legalIssues: string[];
  judgmentAndReasoning: string;
  suggestedPrecedents: string[];
  conclusion: string;
  citation: string;
  jurisdiction: string;
}

export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

export interface Case {
    id: string;
    userId: string;
    documentName: string;
    documentText: string;
    summary: CaseSummary;
    createdAt: string;
}