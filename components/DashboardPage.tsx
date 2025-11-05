import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { Case } from '../types';
import { CaseContext } from '../contexts/CaseContext';
import { AuthContext } from '../contexts/AuthContext';
import { NewSummaryIcon, SearchIcon } from './icons';
import { Search } from 'lucide-react';
import { searchIndianKanoon, searchECourts, KanoonResult, EcourtsResult } from '../services/legalSearchService';
import { SearchResultsModal } from './SearchResultsModal';
import { Loader } from './Loader';


declare const Chart: any;

interface DashboardPageProps {
    onSelectCase: (selectedCase: Case) => void;
    setPage: (page: 'upload') => void;
}

const StatCard: React.FC<{ title: string, value: string | number, subtext: string }> = ({ title, value, subtext }) => (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <p className="text-3xl font-semibold text-white mt-1">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{subtext}</p>
    </div>
);

const LegalUpdateItem: React.FC<{ title: string, source: string, time: string }> = ({ title, source, time }) => (
    <div className="py-3">
        <p className="text-slate-200 font-medium text-sm">{title}</p>
        <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
            <span>{source}</span>
            <span>{time}</span>
        </div>
    </div>
);

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectCase, setPage }) => {
    const { currentUser } = useContext(AuthContext);
    const { cases } = useContext(CaseContext);
    const [selectedCaseForNetwork, setSelectedCaseForNetwork] = useState<Case | null>(null);
    const [kanoonQuery, setKanoonQuery] = useState('');
    const [cnrNumber, setCnrNumber] = useState('');

    const [searchState, setSearchState] = useState<{
        isOpen: boolean;
        title: string;
        isLoading: boolean;
        loadingMessage: string;
        error: string | null;
        kanoonResults: KanoonResult[] | null;
        ecourtsResult: EcourtsResult | null;
    }>({
        isOpen: false,
        title: '',
        isLoading: false,
        loadingMessage: '',
        error: null,
        kanoonResults: null,
        ecourtsResult: null,
    });


    const jurisdictionChartRef = useRef<HTMLCanvasElement>(null);
    const jurisdictionChartInstanceRef = useRef<any>(null);

    const dashboardStats = useMemo(() => {
        const jurisdictions = new Set(cases.map(c => c.summary.jurisdiction));
        return {
            totalCases: cases.length,
            jurisdictionCount: jurisdictions.size,
        };
    }, [cases]);
    
    useEffect(() => {
        if (cases.length > 0 && jurisdictionChartRef.current) {
            const jurisdictionData = cases.reduce((acc, currentCase) => {
                const jur = currentCase.summary.jurisdiction || 'Unknown';
                acc[jur] = (acc[jur] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const chartLabels = Object.keys(jurisdictionData);
            const chartData = Object.values(jurisdictionData);

            if (jurisdictionChartInstanceRef.current) {
                jurisdictionChartInstanceRef.current.destroy();
            }

            const ctx = jurisdictionChartRef.current.getContext('2d');
            jurisdictionChartInstanceRef.current = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'Cases by Jurisdiction',
                        data: chartData,
                        backgroundColor: [
                            'rgba(250, 204, 21, 0.7)',
                            'rgba(59, 130, 246, 0.7)',
                            'rgba(168, 85, 247, 0.7)',
                            'rgba(236, 72, 153, 0.7)',
                            'rgba(34, 197, 94, 0.7)',
                        ],
                        borderColor: '#1e293b',
                        borderWidth: 2,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#94a3b8',
                                boxWidth: 12,
                                padding: 15,
                            }
                        }
                    }
                }
            });
        }
         return () => {
            if (jurisdictionChartInstanceRef.current) {
                jurisdictionChartInstanceRef.current.destroy();
            }
        };
    }, [cases]);
    
    const relatedCases = useMemo(() => {
        if (!selectedCaseForNetwork) return [];
        const currentPrecedents = new Set(selectedCaseForNetwork.summary.suggestedPrecedents);
        return cases.filter(c => 
            c.id !== selectedCaseForNetwork.id &&
            c.summary.suggestedPrecedents.some(p => currentPrecedents.has(p))
        );
    }, [selectedCaseForNetwork, cases]);
    
    const handleKanoonSearch = async () => {
        if (!kanoonQuery.trim()) return;
        setSearchState({ 
            isOpen: true, 
            title: `Indian Kanoon Results for "${kanoonQuery}"`, 
            isLoading: true, 
            loadingMessage: 'Searching Indian Kanoon...',
            error: null, 
            kanoonResults: null,
            ecourtsResult: null 
        });
        try {
            const results = await searchIndianKanoon(kanoonQuery);
            setSearchState(prev => ({ ...prev, isLoading: false, kanoonResults: results }));
        } catch (err) {
            setSearchState(prev => ({ ...prev, isLoading: false, error: (err as Error).message }));
        }
    };

    const handleCnrSearch = async () => {
        if (!cnrNumber.trim()) return;
        setSearchState({ 
            isOpen: true, 
            title: `eCourts Status for CNR: ${cnrNumber}`, 
            isLoading: true, 
            loadingMessage: 'Fetching live eCourts data... This may take a moment.',
            error: null, 
            kanoonResults: null,
            ecourtsResult: null 
        });
        try {
            const result = await searchECourts(cnrNumber);
            setSearchState(prev => ({ ...prev, isLoading: false, ecourtsResult: result }));
        } catch (err) {
            setSearchState(prev => ({ ...prev, isLoading: false, error: (err as Error).message }));
        }
    };
    
    const closeModal = () => setSearchState(prev => ({ ...prev, isOpen: false }));

    const renderModalContent = () => {
        if (searchState.isLoading) {
            return <Loader message={searchState.loadingMessage} />;
        }
        if (searchState.error) {
            return (
                <div className="text-center text-red-400 bg-red-900/30 p-4 rounded-md">
                    <p className="font-semibold">An Error Occurred</p>
                    <p>{searchState.error}</p>
                </div>
            );
        }
        if (searchState.kanoonResults) {
             if (searchState.kanoonResults.length === 0) {
                return (
                    <div className="text-center text-slate-400">
                        <p>No relevant cases found for your query.</p>
                    </div>
                );
            }
            return (
                <div className="space-y-4">
                    {searchState.kanoonResults.map((result, index) => (
                        <div key={index} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-sm">
                            <h4 className="text-lg font-semibold text-yellow-400 mb-2">
                                {result.caseName}
                            </h4>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-slate-300">
                                <div className="flex flex-col"><dt className="font-semibold text-slate-400">Court:</dt><dd>{result.court}</dd></div>
                                <div className="flex flex-col"><dt className="font-semibold text-slate-400">Date of Judgment:</dt><dd>{result.date}</dd></div>
                            </dl>
                            <div className="mt-3">
                                <p className="font-semibold text-slate-400">Main Issue:</p>
                                <p className="text-slate-300">{result.issue}</p>
                            </div>
                             <div className="mt-3">
                                <p className="font-semibold text-slate-400">Summary:</p>
                                <p className="text-slate-300 leading-relaxed">{result.summary}</p>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        if (searchState.ecourtsResult) {
            const { caseType, caseStatus, firstHearing, nextHearing, courtNumber, judge, source } = searchState.ecourtsResult;
            return (
                 <div className="text-slate-300 text-sm">
                    <div className="flex justify-end mb-4 -mt-2">
                        {source === 'cache' ? (
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-900 text-green-300 border border-green-700">Fast-Access Cache</span>
                        ) : (
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-sky-900 text-sky-300 border border-sky-700">Live Network</span>
                        )}
                    </div>
                   <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                       <div className="p-3 bg-slate-900/50 rounded-md"><dt className="font-semibold text-slate-400">Case Type</dt><dd className="text-white mt-1">{caseType}</dd></div>
                       <div className="p-3 bg-slate-900/50 rounded-md"><dt className="font-semibold text-slate-400">Case Status</dt><dd className="text-yellow-400 mt-1">{caseStatus}</dd></div>
                       <div className="p-3 bg-slate-900/50 rounded-md"><dt className="font-semibold text-slate-400">First Hearing</dt><dd className="mt-1">{firstHearing}</dd></div>
                       <div className="p-3 bg-slate-900/50 rounded-md"><dt className="font-semibold text-slate-400">Next Hearing</dt><dd className="mt-1">{nextHearing}</dd></div>
                       <div className="p-3 bg-slate-900/50 rounded-md"><dt className="font-semibold text-slate-400">Court</dt><dd className="mt-1">{courtNumber}</dd></div>
                       <div className="p-3 bg-slate-900/50 rounded-md"><dt className="font-semibold text-slate-400">Presiding Judge</dt><dd className="mt-1">{judge}</dd></div>
                   </dl>
                </div>
            );
        }
        return null;
    };


    return (
        <>
            <div className="container mx-auto p-4 md:p-8 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                     <div>
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Dashboard
                        </h2>
                        <p className="mt-2 text-lg text-slate-400">
                            Welcome back, {currentUser?.role}! Here's your mission control.
                        </p>
                    </div>
                    <button
                        onClick={() => setPage('upload')}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-slate-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-slate-900 transition-colors"
                    >
                        <NewSummaryIcon />
                        New Summary
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <StatCard title="Total Cases" value={dashboardStats.totalCases} subtext="Summaries generated" />
                    <StatCard title="Jurisdictions" value={dashboardStats.jurisdictionCount} subtext="Unique legal areas" />
                    <div className="lg:col-span-2 bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-base font-semibold text-white mb-2">Real-time Legal Updates</h3>
                        <div className="divide-y divide-slate-700/50">
                            <LegalUpdateItem title="SCOTUS grants certiorari in major tech antitrust case." source="SCOTUSblog" time="2h ago" />
                            <LegalUpdateItem title="New filing in Delaware Chancery Court challenges merger." source="CourtListener" time="5h ago" />
                             <LegalUpdateItem title="9th Circuit rules on copyright fair use for AI training." source="Reuters Legal" time="8h ago" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                            <h3 className="text-base font-semibold text-white mb-4">Recent Cases</h3>
                            <div className="max-h-96 overflow-y-auto pr-2 -mr-2">
                                 {cases.length > 0 ? (
                                    <div className="divide-y divide-slate-700/50">
                                        {cases.map((c) => (
                                            <div key={c.id} onClick={() => onSelectCase(c)} className="flex justify-between items-center py-3 group hover:bg-slate-800/50 -mx-6 px-6 cursor-pointer transition-colors rounded-md">
                                                <div>
                                                    <p className="font-medium text-slate-200 group-hover:text-yellow-400 transition-colors text-sm">{c.summary.caseName}</p>
                                                    <p className="text-xs text-slate-400">
                                                        <span className="font-mono">{c.summary.jurisdiction}</span>
                                                    </p>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedCaseForNetwork(c); }} className="text-xs font-semibold text-slate-400 hover:text-yellow-400 transition-colors">
                                                    Analyze Network
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-slate-400 py-8 text-sm">No cases summarized yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                                <h3 className="text-base font-semibold text-white mb-2">Indian Kanoon Search</h3>
                                <p className="text-sm text-slate-400 mb-4">Find similar cases or research legal topics on Indian Kanoon.</p>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={kanoonQuery}
                                        onChange={(e) => setKanoonQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleKanoonSearch()}
                                        placeholder="e.g., 'intellectual property'"
                                        className="w-full bg-slate-900/50 border border-slate-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 px-3 py-2 text-sm text-slate-200"
                                    />
                                    <button
                                        onClick={handleKanoonSearch}
                                        disabled={!kanoonQuery.trim()}
                                        className="inline-flex items-center justify-center p-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-slate-900 bg-yellow-400 hover:bg-yellow-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                                        title="Search on Indian Kanoon"
                                    >
                                        <SearchIcon />
                                    </button>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                                <h3 className="text-base font-semibold text-white mb-2">eCourts Case Status</h3>
                                <p className="text-sm text-slate-400 mb-4">Enter a CNR number to get the latest status from the eCourts service.</p>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={cnrNumber}
                                        onChange={(e) => setCnrNumber(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCnrSearch()}
                                        placeholder="Enter CNR Number"
                                        className="w-full bg-slate-900/50 border border-slate-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 px-3 py-2 text-sm text-slate-200"
                                    />
                                    <button
                                        onClick={handleCnrSearch}
                                        disabled={!cnrNumber.trim()}
                                        className="inline-flex items-center justify-center p-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-slate-900 bg-yellow-400 hover:bg-yellow-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                                        title="Check Status on eCourts"
                                    >
                                        <SearchIcon />
                                    </button>
                                </div>
                            </div>
                        </div>

                         <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                            <h3 className="text-base font-semibold text-white mb-2">Advanced Analysis: Case Network</h3>
                            {selectedCaseForNetwork ? (
                                <div>
                                    <p className="text-sm text-slate-400 mb-4">Showing cases related to <span className="font-bold text-yellow-400">{selectedCaseForNetwork.summary.caseName}</span> by shared precedents:</p>
                                    {relatedCases.length > 0 ? (
                                        <div className="divide-y divide-slate-700/50">
                                            {relatedCases.map(rc => (
                                                <div key={rc.id} onClick={() => onSelectCase(rc)} className="py-2 group cursor-pointer">
                                                    <p className="text-sm font-medium text-slate-300 group-hover:text-yellow-400">{rc.summary.caseName}</p>
                                                    <p className="text-xs text-slate-500 font-mono">{rc.summary.citation}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 text-center py-4">No other cases with shared precedents found in your library.</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-4">Select 'Analyze Network' on a case to see its connections.</p>
                            )}
                        </div>

                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                         <h3 className="text-base font-semibold text-white mb-4">Jurisdiction Distribution</h3>
                         <div className="h-80">
                             {cases.length > 0 ? <canvas ref={jurisdictionChartRef}></canvas> : <p className="text-center text-slate-400 pt-16 text-sm">No data to display.</p>}
                         </div>
                    </div>
                </div>
            </div>
            <SearchResultsModal 
                isOpen={searchState.isOpen}
                onClose={closeModal}
                title={searchState.title}
            >
                {renderModalContent()}
            </SearchResultsModal>
        </>
    );
};