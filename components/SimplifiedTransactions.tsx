import React from 'react';
import { Transaction } from '../types';

interface SimplifiedTransactionsProps {
  transactions: Transaction[];
}

const SimplifiedTransactions: React.FC<SimplifiedTransactionsProps> = ({ transactions }) => {
  return (
    <div className="bg-surface rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl font-bold mb-4 text-on-surface">Simplified Debts</h2>
      <div className="space-y-3">
        {transactions.length > 0 ? (
          transactions.map((t, index) => (
            <div key={index} className="flex items-center justify-between bg-background/50 p-2 sm:p-3 rounded-md text-center">
              <span className="font-medium text-red-400 w-1/3 text-left text-sm sm:text-base">{t.from.name}</span>
              <div className="flex flex-col items-center w-1/3">
                <span className="text-xs text-on-surface-secondary">pays</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary">
                    <path d="M4 12H20M20 12L14 6M20 12L14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-bold text-on-surface text-sm sm:text-base">₹{t.amount.toFixed(2)}</span>
              </div>
              <span className="font-medium text-green-400 w-1/3 text-right text-sm sm:text-base">{t.to.name}</span>
            </div>
          ))
        ) : (
          <p className="text-on-surface-secondary text-center py-4">All debts are settled!</p>
        )}
      </div>
    </div>
  );
};

export default SimplifiedTransactions;