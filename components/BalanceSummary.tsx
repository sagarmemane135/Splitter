import React from 'react';
import { Balance } from '../types';

interface BalanceSummaryProps {
  balances: Balance[];
}

const BalanceSummary: React.FC<BalanceSummaryProps> = ({ balances }) => {
  return (
    <div className="bg-surface rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl font-bold mb-4 text-on-surface">Balances</h2>
      <div className="space-y-2">
        {balances.length > 0 ? (
          balances.map(({ user, amount }) => (
            <div key={user.id} className="flex justify-between items-center bg-background/50 p-2 sm:p-3 rounded-md">
              <span className="font-medium text-on-surface text-sm sm:text-base">{user.name}</span>
              <span className={`font-bold text-sm sm:text-base text-right ${amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {amount >= 0 ? `Gets back ₹${amount.toFixed(2)}` : `Owes ₹${Math.abs(amount).toFixed(2)}`}
              </span>
            </div>
          ))
        ) : (
          <p className="text-on-surface-secondary text-center py-4">No balances to show.</p>
        )}
      </div>
    </div>
  );
};

export default BalanceSummary;