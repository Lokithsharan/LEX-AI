import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { Case, CaseSummary, User } from '../types';
import { AuthContext } from './AuthContext';

interface CaseContextType {
    cases: Case[];
    addCase: (documentName: string, documentText: string, summary: CaseSummary) => Case | null;
    deleteCase: (caseId: string) => void;
}

export const CaseContext = createContext<CaseContextType>({
    cases: [],
    addCase: () => null,
    deleteCase: () => {},
});

export const CaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useContext(AuthContext);
    const [cases, setCases] = useState<Case[]>([]);

    // Load cases from localStorage when the user logs in
    useEffect(() => {
        if (currentUser) {
            const storedCases = localStorage.getItem(`lex-ai-cases-${currentUser.id}`);
            if (storedCases) {
                try {
                    setCases(JSON.parse(storedCases));
                } catch (error) {
                    console.error("Failed to parse cases from localStorage", error);
                    setCases([]);
                }
            } else {
                setCases([]);
            }
        } else {
            // Clear cases when user logs out
            setCases([]);
        }
    }, [currentUser]);

    // Persist cases to localStorage whenever they change
    useEffect(() => {
        if (currentUser && cases) {
            localStorage.setItem(`lex-ai-cases-${currentUser.id}`, JSON.stringify(cases));
        }
    }, [cases, currentUser]);

    const addCase = (documentName: string, documentText: string, summary: CaseSummary): Case | null => {
        if (!currentUser) return null;

        const newCase: Case = {
            id: `case-${Date.now()}`,
            userId: currentUser.id,
            documentName,
            documentText,
            summary,
            createdAt: new Date().toISOString(),
        };

        setCases(prevCases => [newCase, ...prevCases]);
        return newCase;
    };

    const deleteCase = (caseId: string) => {
        setCases(prevCases => prevCases.filter(c => c.id !== caseId));
    };

    const value = {
        cases,
        addCase,
        deleteCase,
    };

    return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
};
