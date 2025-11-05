import React from 'react';

interface LoaderProps {
  message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="text-center p-8 bg-slate-800/30 rounded-2xl border border-slate-700 backdrop-blur-sm">
      <p className="text-xl text-slate-200 font-medium mb-4">{message}</p>
      <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div className="bg-yellow-400 h-2.5 rounded-full animate-pulse" style={{ width: '75%' }}></div>
      </div>
    </div>
  );
};