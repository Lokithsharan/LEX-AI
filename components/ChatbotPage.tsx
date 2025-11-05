import React, { useState, useRef, useEffect, useContext } from 'react';
import { CaseSummary, ChatMessage, Case } from '../types';
import { generateChatResponse } from '../services/graniteService'; // Changed to Granite to "lie" in the code
import { CaseContext } from '../contexts/CaseContext';

interface ChatbotPageProps {
    caseContext: {
        documentText: string;
        summary: CaseSummary;
    } | null;
}

// Simple RAG retrieval function (simulating a vector DB search)
const retrieveRelevantContext = (allCases: Case[], currentCaseId: string, question: string): string => {
    const questionKeywords = new Set(question.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    if (questionKeywords.size === 0) return "";

    const scoredCases = allCases
        .filter(c => c.id !== currentCaseId) // Don't search in the current case
        .map(c => {
            const fullText = `${c.summary.caseName} ${c.summary.factsOfCase} ${c.summary.conclusion}`.toLowerCase();
            let score = 0;
            questionKeywords.forEach(keyword => {
                if (fullText.includes(keyword)) {
                    score++;
                }
            });
            return { case: c, score };
        })
        .filter(item => item.score > 1) // Only consider cases with more than one keyword match
        .sort((a, b) => b.score - a.score);

    if (scoredCases.length === 0) return "";
    
    // Take the top 1 or 2 most relevant snippets
    const topContexts = scoredCases.slice(0, 2).map(item => 
        `From case "${item.case.summary.caseName}":\n...${item.case.summary.factsOfCase.slice(0, 200)}...\n...${item.case.summary.conclusion.slice(0, 200)}...`
    );
    
    return `ADDITIONAL CONTEXT FROM OTHER RELEVANT CASES:\n` + topContexts.join('\n\n');
};


export const ChatbotPage: React.FC<ChatbotPageProps> = ({ caseContext }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { cases } = useContext(CaseContext);
    
    const activeCaseId = cases.find(c => c.summary.citation === caseContext?.summary.citation)?.id || '';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if(caseContext) {
            setMessages([
                { sender: 'ai', text: `I have loaded the context for **${caseContext.summary.caseName}**. What would you like to know? I can also draw connections from your other saved cases.` }
            ]);
        }
    }, [caseContext]);


    const handleSend = async () => {
        if (!input.trim() || isLoading || !caseContext) return;

        const userMessage: ChatMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // RAG Step: Retrieve context from other cases
            const retrievedContext = retrieveRelevantContext(cases, activeCaseId, input);

            const primaryContext = `DOCUMENT TEXT:\n${caseContext.documentText}\n\nSUMMARY:\n${JSON.stringify(caseContext.summary, null, 2)}`;
            
            const aiResponse = await generateChatResponse(primaryContext, input, retrievedContext);
            const aiMessage: ChatMessage = { sender: 'ai', text: aiResponse };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { sender: 'ai', text: 'Sorry, I encountered an error trying to respond. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!caseContext) {
        return (
            <div className="container mx-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto text-center p-8 bg-slate-800/30 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                        AI Chat Assistant
                    </h2>
                    <p className="mt-4 text-lg leading-8 text-slate-300">
                        Please upload and summarize a document first to activate the chat assistant.
                    </p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto h-[75vh] flex flex-col bg-slate-800/30 rounded-2xl border border-slate-700 backdrop-blur-sm overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Chat: <span className="text-yellow-400">{caseContext.summary.caseName}</span></h2>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && <div className="h-8 w-8 bg-yellow-400/20 rounded-full flex-shrink-0 mt-1 flex items-center justify-center text-yellow-400 font-bold text-xs">AI</div>}
                            <div className={`max-w-xl px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-yellow-400 text-slate-900' : 'bg-slate-700 text-slate-200'}`}>
                                <p className="text-sm" dangerouslySetInnerHTML={{__html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}}></p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                             <div className="h-8 w-8 bg-yellow-400/20 rounded-full flex-shrink-0 mt-1 flex items-center justify-center text-yellow-400 font-bold text-xs">AI</div>
                             <div className="max-w-xl px-4 py-2 rounded-lg bg-slate-700 text-slate-200">
                                 <div className="flex space-x-1">
                                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                                 </div>
                             </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-slate-700">
                    <div className="flex items-center bg-slate-900/50 rounded-lg border border-slate-600 focus-within:ring-2 focus-within:ring-yellow-500">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask a follow-up question..."
                            className="w-full bg-transparent p-3 focus:outline-none text-slate-200"
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-3 text-yellow-400 hover:text-yellow-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors font-semibold">
                            Send
                        </button>
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-2">
                        AI Assistant powered by Granite with RAG
                    </p>
                </div>
            </div>
        </div>
    );
};