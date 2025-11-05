import React, { useState, useContext } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { DashboardPage } from './components/DashboardPage';
import { UploadPage } from './components/UploadPage';
import { ChatbotPage } from './components/ChatbotPage';
import { CaseSummary, Case } from './types';
import { AuthContext } from './contexts/AuthContext';
import { CaseContext } from './contexts/CaseContext';
import { Loader } from './components/Loader';

export interface CaseContextType {
    documentText: string;
    summary: CaseSummary;
}

const App: React.FC = () => {
    const { currentUser, logout, loading: authLoading } = useContext(AuthContext);
    const { cases, addCase } = useContext(CaseContext);
    
    const [page, setPage] = useState<'dashboard' | 'upload' | 'chatbot'>('dashboard');
    const [activeCaseContext, setActiveCaseContext] = useState<CaseContextType | null>(null);

    const handleSummaryGenerated = (documentName: string, documentText: string, summary: CaseSummary) => {
        const newCase = addCase(documentName, documentText, summary);
        if(newCase) {
            setActiveCaseContext({ documentText, summary });
        }
    };
    
    const handleSelectCase = (selectedCase: Case) => {
        setActiveCaseContext({ documentText: selectedCase.documentText, summary: selectedCase.summary });
        // For a seamless UX, let's switch to the chatbot page automatically when an old case is selected
        setPage('chatbot');
    }

    const handleLogout = () => {
        logout();
        setActiveCaseContext(null);
        setPage('dashboard');
    }
    
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-800 flex justify-center items-center">
                <Loader message="Authenticating..." />
            </div>
        );
    }
    
    if (!currentUser) {
        return <HomePage />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-800 text-slate-200 font-sans">
            <Header page={page} setPage={setPage} onLogout={handleLogout} currentUser={currentUser} />
            <main>
                {page === 'dashboard' && <DashboardPage onSelectCase={handleSelectCase} setPage={setPage} />}
                {page === 'upload' && <UploadPage onSummaryGenerated={handleSummaryGenerated} setPage={setPage}/>}
                {page === 'chatbot' && <ChatbotPage caseContext={activeCaseContext} />}
            </main>
            <footer className="text-center p-4 text-slate-500 text-sm">
                <p>© 2024 LEX AI. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default App;