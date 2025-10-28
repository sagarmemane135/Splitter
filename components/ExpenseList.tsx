import React, { useState } from 'react';
import { Expense, User, Payer } from '../types';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import CommentSection from './CommentSection';

interface ExpenseListProps {
  expenses: Expense[];
  users: User[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  onAddComment: (expenseId: string, text: string) => void;
  currentUserId: string | null;
  isPdf?: boolean;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, users, onEdit, onDelete, onAddComment, currentUserId, isPdf = false }) => {
  const [visibleComments, setVisibleComments] = useState<Record<string, boolean>>({});

  const toggleComments = (expenseId: string) => {
    setVisibleComments(prev => ({ ...prev, [expenseId]: !prev[expenseId] }));
  };

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown User';

  const getPayersString = (payers: Payer[]) => {
    if (!payers || payers.length === 0) return 'Paid by Unknown';
    if (payers.length === 1) {
      return `Paid by ${getUserName(payers[0].userId)}`;
    }
    const payerNames = payers.map(p => `${getUserName(p.userId)} (₹${p.amount.toFixed(2)})`).join(', ');
    return `Paid by ${payerNames}`;
  };

  return (
    <div className="bg-surface rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl font-bold mb-4 text-on-surface">Expenses</h2>
      <div className="space-y-4">
        {expenses.length > 0 ? (
          [...expenses].reverse().map(expense => (
            <div key={expense.id} className="bg-background/50 p-3 sm:p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-base sm:text-lg text-on-surface">{expense.title}</p>
                  <p className="text-sm text-on-surface-secondary">
                    {getPayersString(expense.payers)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-bold text-base sm:text-lg text-secondary">₹{expense.amount.toFixed(2)}</p>
                  <p className="text-xs text-on-surface-secondary">
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-sm text-on-surface-secondary mt-2">
                Split {expense.splitType} among {expense.participants.length} people.
              </div>
              {!isPdf && (
                <>
                  <div className="flex justify-end gap-1 sm:gap-2 mt-2">
                    <button onClick={() => toggleComments(expense.id)} className="flex items-center gap-1.5 p-2 text-sm text-on-surface-secondary hover:text-primary transition-colors">
                      <ChatBubbleIcon /> <span className="hidden sm:inline">Comments</span> ({expense.comments?.length || 0})
                    </button>
                    <button onClick={() => onEdit(expense)} className="p-2 text-on-surface-secondary hover:text-primary transition-colors" title="Edit Expense"><EditIcon /></button>
                    <button onClick={() => onDelete(expense.id)} className="p-2 text-on-surface-secondary hover:text-danger transition-colors" title="Delete Expense"><TrashIcon /></button>
                  </div>
                  {visibleComments[expense.id] && (
                    <CommentSection
                      comments={expense.comments || []}
                      currentUserId={currentUserId}
                      onAddComment={(text) => onAddComment(expense.id, text)}
                    />
                  )}
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-on-surface-secondary text-center py-4">No expenses added yet.</p>
        )}
      </div>
    </div>
  );
};

export default ExpenseList;