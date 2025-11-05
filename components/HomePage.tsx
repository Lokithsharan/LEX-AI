import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { User } from '../types';
import { EyeIcon, EyeSlashIcon } from './icons';

interface AuthFormProps {
    authMode: 'signin' | 'signup';
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    role: User['role'];
    setRole: (role: User['role']) => void;
    handleAuthAction: (e: React.FormEvent) => void;
    error: string;
    isLoading: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({
    authMode,
    email,
    setEmail,
    password,
    setPassword,
    role,
    setRole,
    handleAuthAction,
    error,
    isLoading
}) => {
    const [showPassword, setShowPassword] = useState(false);
    
    return (
     <form onSubmit={handleAuthAction}>
        <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <input 
                type="email" 
                id="email" 
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500" 
                placeholder="you@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
            />
        </div>
        <div className="mb-4 relative">
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <input 
                type={showPassword ? "text" : "password"}
                id="password" 
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
            />
            <button
                type="button"
                className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-sm leading-5 text-slate-400 hover:text-slate-200"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
            >
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
        </div>
         {authMode === 'signup' && (
            <div className="mb-6">
                <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">Your Role</label>
                <select
                    id="role"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                    value={role}
                    onChange={(e) => setRole(e.target.value as User['role'])}
                    disabled={isLoading}
                >
                    <option>Associate</option>
                    <option>Partner</option>
                    <option>Admin</option>
                </select>
            </div>
        )}
        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
        <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-slate-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-slate-900 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
            {isLoading ? 'Processing...' : (authMode === 'signin' ? 'Sign In' : 'Create Account')}
        </button>
    </form>
)};


export const HomePage: React.FC = () => {
    const { signin, signup } = useContext(AuthContext);
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<User['role']>('Associate');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (authMode === 'signin') {
                await signin(email, password);
            } else { // signup
                await signup(email, password, role);
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                 setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-800 text-slate-200 font-sans flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-white tracking-wider mb-2">
                    Welcome to LEX AI
                </h1>
                <p className="text-center text-slate-400 mb-8">
                    {authMode === 'signin' ? 'Sign in to continue to your dashboard.' : 'Create an account to get started.'}
                </p>

                <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-2xl backdrop-blur-sm">
                    <div className="flex border-b border-slate-700">
                        <button onClick={() => { setAuthMode('signin'); setError('')}} className={`flex-1 p-3 font-medium ${authMode === 'signin' ? 'bg-slate-700/50 text-yellow-400' : 'text-slate-400 hover:bg-slate-800/50'}`}>
                            Sign In
                        </button>
                        <button onClick={() => { setAuthMode('signup'); setError('')}} className={`flex-1 p-3 font-medium ${authMode === 'signup' ? 'bg-slate-700/50 text-yellow-400' : 'text-slate-400 hover:bg-slate-800/50'}`}>
                            Sign Up
                        </button>
                    </div>
                    <div className="p-8">
                        <AuthForm 
                            authMode={authMode}
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPassword={setPassword}
                            role={role}
                            setRole={setRole}
                            handleAuthAction={handleAuthAction}
                            error={error}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            </div>
             <footer className="text-center p-4 text-slate-500 text-sm absolute bottom-0">
                <p>© 2024 LEX AI. All rights reserved.</p>
            </footer>
        </div>
    );
};