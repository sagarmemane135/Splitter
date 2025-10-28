import { User, Expense, Balance, Transaction } from '../types';

/**
 * Calculates the net balance for each user.
 * @param users - Array of all users.
 * @param expenses - Array of all expenses.
 * @returns An array of Balance objects.
 */
export const calculateBalances = (users: User[], expenses: Expense[]): Balance[] => {
  if (!users.length) return [];

  const balanceMap = new Map<string, number>();
  users.forEach(user => balanceMap.set(user.id, 0));

  expenses.forEach(expense => {
    const totalAmount = expense.amount;
    const participants = expense.participants;

    // Credit the payers
    expense.payers.forEach(payer => {
      balanceMap.set(payer.userId, (balanceMap.get(payer.userId) || 0) + payer.amount);
    });

    let totalShares = 0;
    switch (expense.splitType) {
      case 'equal':
        const share = totalAmount / participants.length;
        participants.forEach(p => {
          balanceMap.set(p.userId, (balanceMap.get(p.userId) || 0) - share);
        });
        break;
      case 'amount':
        participants.forEach(p => {
          balanceMap.set(p.userId, (balanceMap.get(p.userId) || 0) - p.share);
        });
        break;
      case 'percentage':
        participants.forEach(p => {
          const shareAmount = (totalAmount * p.share) / 100;
          balanceMap.set(p.userId, (balanceMap.get(p.userId) || 0) - shareAmount);
        });
        break;
    }
  });

  return users.map(user => ({
    user,
    amount: balanceMap.get(user.id) || 0,
  })).sort((a,b) => b.amount - a.amount);
};

/**
 * Simplifies debts using a greedy algorithm to minimize transactions.
 * @param balances - Array of user balances.
 * @returns An array of simplified Transaction objects.
 */
export const simplifyDebts = (balances: Balance[]): Transaction[] => {
  const transactions: Transaction[] = [];
  const debtors = balances.filter(b => b.amount < 0).map(b => ({ ...b, amount: -b.amount }));
  const creditors = balances.filter(b => b.amount > 0).map(b => ({ ...b }));

  // Use a copy for manipulation
  let debtorsCopy = debtors.map(d => ({ ...d }));
  let creditorsCopy = creditors.map(c => ({ ...c }));

  while (debtorsCopy.length > 0 && creditorsCopy.length > 0) {
    debtorsCopy.sort((a, b) => b.amount - a.amount);
    creditorsCopy.sort((a, b) => b.amount - a.amount);

    const debtor = debtorsCopy[0];
    const creditor = creditorsCopy[0];
    
    const amountToSettle = Math.min(debtor.amount, creditor.amount);

    transactions.push({
      from: debtor.user,
      to: creditor.user,
      amount: amountToSettle,
    });

    debtor.amount -= amountToSettle;
    creditor.amount -= amountToSettle;

    // Use a small epsilon for floating point comparisons
    const epsilon = 0.01;

    if (debtor.amount < epsilon) {
      debtorsCopy.shift();
    }
    if (creditor.amount < epsilon) {
      creditorsCopy.shift();
    }
  }

  return transactions;
};
