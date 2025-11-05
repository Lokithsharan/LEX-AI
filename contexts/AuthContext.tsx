import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signin: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, role: User['role']) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    loading: true,
    signin: async () => {},
    signup: async () => {},
    logout: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for a logged-in user in localStorage on initial load
        try {
            const storedUser = localStorage.getItem('lex-ai-user');
            if (storedUser) {
                const user: User = JSON.parse(storedUser);
                setCurrentUser(user);
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('lex-ai-user');
        } finally {
            setLoading(false);
        }
    }, []);

    const signin = async (email: string, password: string): Promise<void> => {
        return new Promise((resolve, reject) => {
             // Simulate async API call
            setTimeout(() => {
                const trimmedEmail = email.trim();
                const users = JSON.parse(localStorage.getItem('lex-ai-users') || '{}');
                if (users[trimmedEmail] && users[trimmedEmail].password === password) {
                    const user = users[trimmedEmail].user;
                    setCurrentUser(user);
                    localStorage.setItem('lex-ai-user', JSON.stringify(user));
                    resolve();
                } else {
                    reject(new Error('Invalid email or password.'));
                }
            }, 500);
        });
    };

    const signup = async (email: string, password: string, role: User['role']): Promise<void> => {
        return new Promise((resolve, reject) => {
            // Simulate async API call
            setTimeout(() => {
                const trimmedEmail = email.trim();
                const users = JSON.parse(localStorage.getItem('lex-ai-users') || '{}');
                 if (users[trimmedEmail]) {
                    reject(new Error('An account with this email already exists.'));
                    return;
                }
                const newUser: User = {
                    id: `user-${Date.now()}`,
                    email: trimmedEmail,
                    role,
                };
                users[trimmedEmail] = { password, user: newUser };
                localStorage.setItem('lex-ai-users', JSON.stringify(users));
                setCurrentUser(newUser);
                localStorage.setItem('lex-ai-user', JSON.stringify(newUser));
                resolve();
            }, 500);
        });
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('lex-ai-user');
    };

    const value = {
        currentUser,
        loading,
        signin,
        signup,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};