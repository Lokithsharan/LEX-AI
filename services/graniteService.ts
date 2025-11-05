import { generateChatResponse as geminiChatResponse } from './geminiService';


export const generateChatResponse = async (
    primaryContext: string,
    question: string,
    retrievedContext?: string
): Promise<string> => {
    // Call the underlying Gemini service function.
    return geminiChatResponse(primaryContext, question, retrievedContext);
};
