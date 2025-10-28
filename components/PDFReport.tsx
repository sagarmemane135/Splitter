import React from 'react';
import { Group, Balance, Transaction } from '../types';

interface PDFReportProps {
  group: Group;
  balances: Balance[];
  transactions: Transaction[];
}

const PDFReport = React.forwardRef<HTMLDivElement, PDFReportProps>(({ group, balances, transactions }, ref) => {
    const getUserName = (userId: string) => group.users.find(u => u.id === userId)?.name || 'Unknown';

    const sortedExpenses = [...group.expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const getExpenseDateRange = () => {
        if (sortedExpenses.length === 0) return 'N/A';
        const firstDate = new Date(sortedExpenses[0].date).toLocaleDateString();
        if (sortedExpenses.length === 1) return firstDate;
        const lastDate = new Date(sortedExpenses[sortedExpenses.length - 1].date).toLocaleDateString();
        return `${firstDate} to ${lastDate}`;
    };

    const getTotalSpent = () => {
        return group.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    };
    
    const totalSpent = getTotalSpent();
    const dateRange = getExpenseDateRange();

    const SummaryCard: React.FC<{ title: string; value: string | number; className?: string }> = ({ title, value, className }) => (
        <div className={`bg-gray-100 p-4 rounded-lg shadow ${className}`}>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xl font-bold text-primary">{value}</p>
        </div>
    );

    return (
        <div ref={ref} className="bg-white text-gray-800 p-10 font-sans" style={{ width: '800px' }}>
            <header className="flex justify-between items-center pb-4 border-b-2 border-primary">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500">Splitter</h1>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-gray-700">Expense Report</h2>
                    <p className="text-lg text-gray-500">{group.name}</p>
                </div>
            </header>

            <section className="my-8 grid grid-cols-4 gap-4 text-center">
                <SummaryCard title="Total Spent" value={`₹${totalSpent.toFixed(2)}`} />
                <SummaryCard title="Total Expenses" value={group.expenses.length} />
                <SummaryCard title="Group Members" value={group.users.length} />
                <SummaryCard title="Date Range" value={dateRange} className="col-span-4 sm:col-span-1" />
            </section>

            <section className="grid grid-cols-2 gap-8 my-8 break-inside-avoid">
                <div>
                    <h3 className="text-xl font-bold mb-4 text-gray-700 border-b border-gray-300 pb-2">Final Balances</h3>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left font-semibold p-2">Member</th>
                                <th className="text-right font-semibold p-2">Net Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {balances.length > 0 ? balances.map(({ user, amount }) => (
                                <tr key={user.id} className="border-b border-gray-100">
                                    <td className="p-2">{user.name}</td>
                                    <td className={`p-2 text-right font-medium ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {amount >= 0 ? `Gets back ₹${amount.toFixed(2)}` : `Owes ₹${Math.abs(amount).toFixed(2)}`}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={2} className="text-center p-4 text-gray-500">No balances.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div>
                    <h3 className="text-xl font-bold mb-4 text-gray-700 border-b border-gray-300 pb-2">Settlement Plan</h3>
                    <div className="space-y-2">
                        {transactions.length > 0 ? transactions.map((t, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm">
                                <span className="font-medium text-red-600 w-2/5 truncate">{t.from.name}</span>
                                <div className="flex items-center justify-center w-1/5 text-gray-500">
                                    <span className="font-bold text-gray-700 mx-1">₹{t.amount.toFixed(2)}</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary"><path d="M4 12H20M20 12L14 6M20 12L14 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                                <span className="font-medium text-green-600 w-2/5 truncate text-right">{t.to.name}</span>
                            </div>
                        )) : (
                            <p className="text-center p-4 text-gray-500">All debts are settled!</p>
                        )}
                    </div>
                </div>
            </section>

            <section className="my-8 break-after-page">
                <h3 className="text-xl font-bold mb-4 text-gray-700 border-b border-gray-300 pb-2">Expense Breakdown</h3>
                <div className="space-y-4">
                    {sortedExpenses.length > 0 ? sortedExpenses.map(expense => (
                        <div key={expense.id} className="p-4 border border-gray-200 rounded-lg break-inside-avoid">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-bold text-lg text-primary">{expense.title}</p>
                                    <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
                                </div>
                                <p className="font-bold text-xl text-gray-800">₹{expense.amount.toFixed(2)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <h4 className="font-semibold mb-1 border-b border-gray-200 pb-1">Paid By</h4>
                                    <ul className="space-y-1">
                                        {expense.payers.map(payer => (
                                            <li key={payer.userId} className="flex justify-between">
                                                <span>{getUserName(payer.userId)}</span>
                                                <span className="font-medium">₹{payer.amount.toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-1 border-b border-gray-200 pb-1">Split Among ({expense.splitType})</h4>
                                    <ul className="space-y-1">
                                        {expense.participants.map(p => {
                                            let shareText = '';
                                            if (expense.splitType === 'equal') {
                                                shareText = `₹${(expense.amount / expense.participants.length).toFixed(2)}`;
                                            } else if (expense.splitType === 'amount') {
                                                shareText = `₹${p.share.toFixed(2)}`;
                                            } else if (expense.splitType === 'percentage') {
                                                shareText = `₹${((expense.amount * p.share) / 100).toFixed(2)} (${p.share}%)`;
                                            }
                                            return (
                                                <li key={p.userId} className="flex justify-between">
                                                    <span>{getUserName(p.userId)}</span>
                                                    <span className="font-medium">{shareText}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center p-4 text-gray-500">No expenses recorded.</p>
                    )}
                </div>
            </section>

            <footer className="text-center mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500">
                <p>Report generated by Splitter on {new Date().toLocaleString()}</p>
            </footer>
        </div>
    );
});

export default PDFReport;