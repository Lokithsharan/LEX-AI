import { GoogleGenAI, Type } from "@google/genai";
import { CaseSummary } from '../types';
import { GEMINI_API_KEY } from '../env';

if (!GEMINI_API_KEY) {
    throw new Error("API_KEY not found. Please add it to the env.ts file.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export type SummaryType = 'Concise' | 'Detailed' | 'Executive';

const summarySchema = {
  type: Type.OBJECT,
  properties: {
    caseName: { type: Type.STRING, description: "The full name of the case." },
    citation: { type: Type.STRING, description: "The legal citation for the case." },
    jurisdiction: { type: Type.STRING, description: "The specific jurisdiction (e.g., 'U.S. Supreme Court', 'California Court of Appeal', 'Southern District of New York')." },
    parties: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the primary parties involved." },
    factsOfCase: { type: Type.STRING, description: "A summary of the facts of the case." },
    legalIssues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The main legal questions addressed." },
    judgmentAndReasoning: { type: Type.STRING, description: "The court's final decision and the reasoning behind it." },
    suggestedPrecedents: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Relevant prior cases or legal precedents mentioned or suggested." },
    conclusion: { type: Type.STRING, description: "The final conclusion of the summary." },
  },
  required: ["caseName", "citation", "jurisdiction", "parties", "factsOfCase", "legalIssues", "judgmentAndReasoning", "suggestedPrecedents", "conclusion"]
};

export const generateSummary = async (documentText: string, summaryType: SummaryType): Promise<CaseSummary> => {
    
    const promptDetails = {
        'Concise': 'a brief, high-level summary suitable for a quick overview.',
        'Detailed': 'a comprehensive, in-depth summary covering all aspects of the case.',
        'Executive': 'a summary focused on the business implications and key outcomes for stakeholders.'
    };

    const systemInstruction = `You are an expert legal assistant AI. Your task is to extract key information from the provided text and structure it into a JSON format. You must return ONLY a valid JSON object that strictly adheres to the schema provided. Do not include markdown, comments, or any text outside the JSON object.`;
    const prompt = `Based on the following legal document text, please provide a structured, ${promptDetails[summaryType]}\n\n---\n\n${documentText}`;

    let responseText = '';
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: summarySchema,
            }
        });

        responseText = response.text;

        // Safely handle parsing and typing
        const summaryData = JSON.parse(responseText);

        // Fix: Convert safely to CaseSummary type
        const caseSummary: CaseSummary = {
            caseName: summaryData.caseName ?? '',
            citation: summaryData.citation ?? '',
            jurisdiction: summaryData.jurisdiction ?? '',
            parties: summaryData.parties ?? [],
            factsOfCase: summaryData.factsOfCase ?? '',
            legalIssues: summaryData.legalIssues ?? [],
            judgmentAndReasoning: summaryData.judgmentAndReasoning ?? '',
            suggestedPrecedents: summaryData.suggestedPrecedents ?? [],
            conclusion: summaryData.conclusion ?? '',
        };

        return caseSummary;

    } catch (error) {
        console.error("Error generating summary with Gemini:", error);
        if (responseText) {
            console.error("AI Response that caused the error:\n---\n", responseText, "\n---");
        }
        throw new Error("Failed to generate AI summary. The model may have been unable to process the document text.");
    }
};

export const generateChatResponse = async (primaryContext: string, question: string, retrievedContext?: string): Promise<string> => {
    const systemInstruction = "You are a helpful legal AI assistant. Your role is to answer questions based on the provided context. First, use the 'Primary Document Context'. If it's insufficient, use the 'Additional Retrieved Context' from other documents to provide a more comprehensive answer. If the answer cannot be found in any of the provided text, state that clearly. Be concise and direct.";
    
    let prompt = `PRIMARY DOCUMENT CONTEXT:\n---\n${primaryContext}\n---\n\n`;

    if (retrievedContext && retrievedContext.trim() !== '') {
        prompt += `ADDITIONAL RETRIEVED CONTEXT FROM OTHER CASES:\n---\n${retrievedContext}\n---\n\n`;
    }

    prompt += `Based on all the context provided, please answer the following question.\nQUESTION: ${question}`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
            }
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Error generating chat response with Gemini:", error);
        throw new Error("Failed to get a response from the AI assistant.");
    }
};
