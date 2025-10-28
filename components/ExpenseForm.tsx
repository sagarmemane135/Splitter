import React, { useState, useEffect, useMemo } from 'react';
import { User, Expense, SplitType, Participant, Payer } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ExpenseFormProps {
  users: User[];
  onSave: (expense: Omit<Expense, 'id' | 'comments'>) => void;
  editingExpense: Expense | null;
  onCancelEdit: () => void;
  currentUserId: string | null;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ users, onSave, editingExpense, onCancelEdit, currentUserId }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [payers, setPayers] = useState<Array<{userId: string; amount: number | ''}>>([]);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [participants, setParticipants] = useState<string[]>([]);
  const [customShares, setCustomShares] = useState<Record<string, number | ''>>({});
  const [error, setError] = useState<string | null>(null);
  
  const isEditing = !!editingExpense;

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setSplitType('equal');
    setParticipants([]);
    setCustomShares({});
    setError(null);
    if (users.length > 0) {
      setPayers([{ userId: currentUserId || users[0].id, amount: '' }]);
    } else {
      setPayers([]);
    }
  };
  
  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmount(editingExpense.amount);
      setPayers(editingExpense.payers.map(p => ({ ...p })));
      setSplitType(editingExpense.splitType);
      const participantIds = editingExpense.participants.map(p => p.userId);
      setParticipants(participantIds);
      
      const shares: Record<string, number> = {};
      editingExpense.participants.forEach(p => {
        shares[p.userId] = p.share;
      });
      setCustomShares(shares);

    } else {
      resetForm();
    }
  }, [editingExpense, users, currentUserId]);

  useEffect(() => {
    if (payers.length === 1 && amount) {
      setPayers([{ ...payers[0], amount: amount }]);
    }
  }, [amount, payers.length]);


  const handleParticipantToggle = (userId: string) => {
    setParticipants(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };
  
  const handleSelectAllParticipants = () => {
    if (participants.length === users.length) {
      setParticipants([]);
    } else {
      setParticipants(users.map(u => u.id));
    }
  };

  const handlePayerChange = (index: number, field: 'userId' | 'amount', value: string | number) => {
    const newPayers = [...payers];
    newPayers[index] = { ...newPayers[index], [field]: value };
    setPayers(newPayers);
  };

  const addPayer = () => {
    const availableUser = users.find(u => !payers.some(p => p.userId === u.id));
    setPayers([...payers, { userId: availableUser?.id || '', amount: '' }]);
  };

  const removePayer = (index: number) => {
    setPayers(payers.filter((_, i) => i !== index));
  };
  
  const payersSum = useMemo(() => {
    return payers.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payers]);

  const validateAndSave = () => {
    if (!title || !amount || participants.length === 0 || payers.length === 0 || payers.some(p => !p.userId || p.amount === '')) {
      setError('Please fill all required fields, including payer information.');
      return;
    }
    
    if (Math.abs(payersSum - amount) > 0.01) {
      setError(`Payer amounts must sum to the total amount of ₹${amount}. Current sum is ₹${payersSum.toFixed(2)}.`);
      return;
    }

    let expenseParticipants: Participant[] = [];

    if (splitType === 'equal') {
      const share = amount / participants.length;
      expenseParticipants = participants.map(userId => ({ userId, share }));
    } else {
      const totalCustomShare = participants.reduce((sum, userId) => sum + (Number(customShares[userId]) || 0), 0);
      
      if (splitType === 'amount' && Math.abs(totalCustomShare - amount) > 0.01) {
        setError(`Custom amounts must sum to ₹${amount}. Current sum is ₹${totalCustomShare.toFixed(2)}.`);
        return;
      }
      if (splitType === 'percentage' && Math.abs(totalCustomShare - 100) > 0.01) {
        setError(`Percentages must sum to 100%. Current sum is ${totalCustomShare.toFixed(2)}%.`);
        return;
      }
      expenseParticipants = participants.map(userId => ({ userId, share: Number(customShares[userId]) || 0 }));
    }

    setError(null);
    onSave({
      title,
      amount,
      payers: payers.map(p => ({ userId: p.userId, amount: Number(p.amount) })),
      participants: expenseParticipants,
      splitType,
      date: new Date().toISOString(),
    });
    if (!isEditing) {
        resetForm();
    }
  };

  const customShareSum = useMemo(() => {
    return participants.reduce((sum, userId) => sum + (Number(customShares[userId]) || 0), 0);
  }, [customShares, participants]);
  
  if (users.length === 0 && !isEditing) {
    return (
      <div className="bg-surface rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-xl font-bold mb-4 text-on-surface">Add Expense</h2>
        <p className="text-on-surface-secondary">Please add at least one user to create an expense.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl font-bold mb-4 text-on-surface">{isEditing ? 'Edit Expense' : 'Add Expense'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Expense Title" value={title} onChange={e => setTitle(e.target.value)} className="md:col-span-2 bg-background border border-gray-600 rounded-md px-3 py-2" />
        <input type="number" placeholder="Total Amount" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} className="md:col-span-2 bg-background border border-gray-600 rounded-md px-3 py-2" />
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">Paid By</h3>
        <div className="space-y-2">
            {payers.map((payer, index) => (
                <div key={index} className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                    <select value={payer.userId} onChange={e => handlePayerChange(index, 'userId', e.target.value)} className="flex-grow bg-background border border-gray-600 rounded-md px-3 py-2 w-full sm:w-auto">
                        <option value="">Select User</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <input type="number" placeholder="Amount" value={payer.amount} onChange={e => handlePayerChange(index, 'amount', e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full sm:w-32 bg-background border border-gray-600 rounded-md px-3 py-2" />
                    {payers.length > 1 && (
                        <button onClick={() => removePayer(index)} className="text-on-surface-secondary hover:text-danger p-2 transition-colors">
                            <TrashIcon />
                        </button>
                    )}
                </div>
            ))}
        </div>
        {users.length > payers.length && (
            <button onClick={addPayer} className="text-sm text-primary hover:underline mt-2">
                + Add another payer
            </button>
        )}
        <div className={`text-right text-sm mt-1 ${Math.abs(payersSum - Number(amount)) > 0.01 ? 'text-danger' : 'text-on-surface-secondary'}`}>
            Total Paid: ₹{payersSum.toFixed(2)} / ₹{Number(amount || 0).toFixed(2)}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">Split amongst</h3>
        <div className="flex items-center gap-2 mb-2">
            <button onClick={handleSelectAllParticipants} className="text-sm text-primary hover:underline">
                {participants.length === users.length ? 'Deselect All' : 'Select All'}
            </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {users.map(user => (
            <button key={user.id} onClick={() => handleParticipantToggle(user.id)} className={`px-3 py-1 rounded-full text-sm transition-colors ${participants.includes(user.id) ? 'bg-primary text-white' : 'bg-background hover:bg-gray-700'}`}>
              {user.name}
            </button>
          ))}
        </div>
      </div>
      
      {participants.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Split method</h3>
          <div className="flex gap-2 sm:gap-4 mb-4">
            {(['equal', 'amount', 'percentage'] as SplitType[]).map(type => (
              <button key={type} onClick={() => setSplitType(type)} className={`px-3 py-1 rounded-md text-sm capitalize transition-colors ${splitType === type ? 'bg-primary text-white' : 'bg-background hover:bg-gray-700'}`}>
                {type}
              </button>
            ))}
          </div>
          
          {splitType !== 'equal' && (
            <div className="space-y-2">
              {participants.map(userId => {
                const user = users.find(u => u.id === userId);
                return (
                  <div key={userId} className="flex items-center gap-2">
                    <label className="w-24 truncate">{user?.name}</label>
                    <input
                      type="number"
                      value={customShares[userId] || ''}
                      onChange={e => setCustomShares({...customShares, [userId]: e.target.value === '' ? '' : parseFloat(e.target.value)})}
                      className="flex-grow bg-background border border-gray-600 rounded-md px-2 py-1"
                      placeholder={splitType === 'amount' ? 'Amount' : 'Percentage %'}
                    />
                  </div>
                );
              })}
              <div className="text-right text-sm text-on-surface-secondary">
                Total: {customShareSum.toFixed(2)} {splitType === 'percentage' ? '%' : ''}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-danger text-sm mt-4">{error}</p>}
      
      <div className="mt-6 flex gap-4">
        <button onClick={validateAndSave} className="bg-secondary hover:opacity-80 text-white font-bold py-2 px-4 rounded-md flex-grow flex items-center justify-center gap-2 transition">
            <PlusIcon /> {isEditing ? 'Save Changes' : 'Add Expense'}
        </button>
        {isEditing && (
            <button onClick={onCancelEdit} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition">
                Cancel
            </button>
        )}
      </div>
    </div>
  );
};

export default ExpenseForm;