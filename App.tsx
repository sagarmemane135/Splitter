import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { User, Expense, Group, Comment, CollabPayload } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { calculateBalances, simplifyDebts } from './utils/debtSimplifier';
import { useCollaboration } from './hooks/useCollaboration';

import UserManagement from './components/UserManagement';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import BalanceSummary from './components/BalanceSummary';
import SimplifiedTransactions from './components/SimplifiedTransactions';
import GroupManager from './components/GroupManager';
import CollaborationManager from './components/CollaborationManager';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { ShareIcon } from './components/icons/ShareIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import PDFReport from './components/PDFReport';

// Extend window interface for jsPDF and html2canvas
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

const App: React.FC = () => {
  const [groups, setGroups] = useLocalStorage<Group[]>('expense_groups', []);
  const [activeGroupId, setActiveGroupId] = useLocalStorage<string | null>('active_group_id', null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const pdfReportRef = useRef<HTMLDivElement>(null);
  
  const activeGroup = useMemo(() => groups.find(g => g.id === activeGroupId), [groups, activeGroupId]);

  const updateAndBroadcastGroup = useCallback((updatedGroup: Group) => {
    setGroups(prevGroups => prevGroups.map(g => g.id === updatedGroup.id ? updatedGroup : g));

    if (connections.length > 0) {
      const payload: CollabPayload = { type: 'GROUP_UPDATE', group: updatedGroup };
      broadcast(payload);
    }
  }, [setGroups]); // connections and broadcast are stable refs from the hook


  const handleDataReceived = useCallback((message: CollabPayload, conn?: any) => {
    switch (message.type) {
      case 'GROUP_UPDATE':
        setGroups(prevGroups => prevGroups.map(g => g.id === message.group.id ? message.group : g));
        break;

      case 'GROUP_SYNC': {
        const receivedGroup = message.group;
        setGroups(prevGroups => {
          const groupExists = prevGroups.some(g => g.id === receivedGroup.id);
          if (groupExists) {
            return prevGroups.map(g => g.id === receivedGroup.id ? receivedGroup : g);
          } else {
            return [...prevGroups, receivedGroup];
          }
        });
        setActiveGroupId(receivedGroup.id);
        setCurrentUserId(message.assignedUser.id);
        setShowCollabModal(false); // Close modal on successful sync
        break;
      }

      case 'JOIN_REQUEST': {
        const currentActiveGroup = groups.find(g => g.id === activeGroupId);
        if (!currentActiveGroup || !conn) return;

        let userToAssign: User | undefined = currentActiveGroup.users.find(u => u.name.toLowerCase() === message.name.toLowerCase());
        let updatedGroup = currentActiveGroup;

        // If user doesn't exist, create them
        if (!userToAssign) {
          userToAssign = { id: Date.now().toString(), name: message.name };
          updatedGroup = { ...currentActiveGroup, users: [...currentActiveGroup.users, userToAssign] };
          // Update host's state and broadcast to existing peers
          updateAndBroadcastGroup(updatedGroup);
        }

        // Send a group state sync back to the new peer
        const syncPayload: CollabPayload = {
          type: 'GROUP_SYNC',
          group: updatedGroup,
          assignedUser: userToAssign,
        };
        conn.send(JSON.stringify(syncPayload));
        break;
      }
      
      case 'ADD_COMMENT': {
        setGroups(prevGroups => prevGroups.map(group => {
            if (group.id !== message.groupId) return group;
            
            return {
                ...group,
                expenses: group.expenses.map(expense => {
                    if (expense.id !== message.expenseId) return expense;

                    return {
                        ...expense,
                        comments: [...(expense.comments || []), message.comment]
                    };
                })
            };
        }));
        break;
      }
    }
  }, [groups, setGroups, activeGroupId, setActiveGroupId, setCurrentUserId, updateAndBroadcastGroup]);
  
  const { peerId, connections, connectToPeer, broadcast } = useCollaboration(handleDataReceived);


  const handleJoinSession = (remotePeerId: string, name: string) => {
    connectToPeer(remotePeerId, name);
  };


  useEffect(() => {
    if (activeGroupId && !groups.some(g => g.id === activeGroupId)) {
      setActiveGroupId(groups.length > 0 ? groups[0].id : null);
    } else if (!activeGroupId && groups.length > 0) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId, setActiveGroupId]);


  const users = activeGroup?.users || [];
  const expenses = activeGroup?.expenses || [];

  useEffect(() => {
    const activeUserExists = users.some(u => u.id === currentUserId);
    if (!currentUserId || !activeUserExists) {
      setCurrentUserId(users.length > 0 ? users[0].id : null);
    }
  }, [users, currentUserId]);


  const balances = useMemo(() => calculateBalances(users, expenses), [users, expenses]);
  const simplifiedTransactions = useMemo(() => simplifyDebts(balances), [balances]);

  const handleAddGroup = (name: string) => {
    const newGroup: Group = { id: Date.now().toString(), name, users: [], expenses: [] };
    const newGroups = [...groups, newGroup];
    setGroups(newGroups);
    setActiveGroupId(newGroup.id);
  };

  const handleAddUser = (name: string) => {
    if (!activeGroup) return;
    if (name && !users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
      const newUser: User = { id: Date.now().toString(), name };
      const updatedGroup = { ...activeGroup, users: [...activeGroup.users, newUser] };
      updateAndBroadcastGroup(updatedGroup);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (!activeGroup) return;
    const updatedExpenses = activeGroup.expenses
      .map(expense => {
        if (expense.payers.some(p => p.userId === userId)) return null;
        const newParticipants = expense.participants.filter(p => p.userId !== userId);
        if (newParticipants.length === 0) return null;
        return { ...expense, participants: newParticipants };
      })
      .filter((e): e is Expense => e !== null);
    
    const updatedGroup = {
      ...activeGroup,
      users: activeGroup.users.filter(u => u.id !== userId),
      expenses: updatedExpenses,
    };
    updateAndBroadcastGroup(updatedGroup);
  };

  const handleSaveExpense = (expenseData: Omit<Expense, 'id' | 'comments'>) => {
    if (!activeGroup) return;
    let newExpenses: Expense[];
    if (editingExpense) {
      newExpenses = activeGroup.expenses.map(e =>
        e.id === editingExpense.id ? { ...e, ...expenseData } : e
      );
      setEditingExpense(null);
    } else {
      newExpenses = [...activeGroup.expenses, { ...expenseData, id: Date.now().toString(), comments: [] }];
    }
    const updatedGroup = { ...activeGroup, expenses: newExpenses };
    updateAndBroadcastGroup(updatedGroup);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelEdit = useCallback(() => {
    setEditingExpense(null);
  }, []);

  const handleDeleteExpense = (expenseId: string) => {
    if (!activeGroup) return;
    const updatedGroup = {
      ...activeGroup,
      expenses: activeGroup.expenses.filter(e => e.id !== expenseId),
    };
    updateAndBroadcastGroup(updatedGroup);
    if (editingExpense?.id === expenseId) {
      setEditingExpense(null);
    }
  };

  const handleAddComment = (expenseId: string, text: string) => {
    if (!activeGroup || !currentUserId) return;
    const currentUser = users.find(u => u.id === currentUserId);
    if (!currentUser) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      userId: currentUserId,
      userName: currentUser.name,
      text,
      timestamp: new Date().toISOString()
    };
    
    // Update local state immediately
    setGroups(prevGroups => prevGroups.map(group => 
      group.id === activeGroup.id
        ? {
            ...group,
            expenses: group.expenses.map(expense => 
              expense.id === expenseId
                ? { ...expense, comments: [...(expense.comments || []), newComment] }
                : expense
            )
          }
        : group
    ));

    // Broadcast only the new comment for efficiency
    if (connections.length > 0) {
      const payload: CollabPayload = { 
        type: 'ADD_COMMENT', 
        groupId: activeGroup.id,
        expenseId, 
        comment: newComment 
      };
      broadcast(payload);
    }
  };


  const resetData = () => {
    if (window.confirm('Are you sure you want to delete ALL groups and data? This cannot be undone.')) {
      window.localStorage.removeItem('expense_groups');
      window.localStorage.removeItem('active_group_id');
      window.location.reload();
    }
  };
  
  const handleDownloadPdf = async () => {
    if (!activeGroup || !pdfReportRef.current) return;
    if (!window.jspdf || !window.html2canvas) {
        alert('PDF generation library is not loaded yet. Please try again in a moment.');
        return;
    }
    const { jsPDF } = window.jspdf;
    const downloadButton = document.getElementById('pdf-download-btn');
    const originalButtonContent = downloadButton ? downloadButton.innerHTML : '';
    if (downloadButton) {
        downloadButton.innerHTML = 'Generating...';
        downloadButton.setAttribute('disabled', 'true');
    }
    try {
        const canvas = await window.html2canvas(pdfReportRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        let imgHeightOnPdf = pdfWidth / ratio;
        let heightLeft = imgHeightOnPdf;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
        heightLeft -= pdfHeight;
        while (heightLeft > 0) {
            position -= pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
            heightLeft -= pdfHeight;
        }
        pdf.save(`Splitter-Report-${activeGroup.name.replace(/\s/g, '_')}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Sorry, there was an error generating the PDF.");
    } finally {
        if (downloadButton && originalButtonContent) {
            downloadButton.innerHTML = originalButtonContent;
            if(!activeGroup) {
               downloadButton.setAttribute('disabled', 'true');
            } else {
               downloadButton.removeAttribute('disabled');
            }
        }
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="bg-surface/50 backdrop-blur-sm sticky top-0 z-10 shadow-md">
        <div className="container mx-auto px-2 sm:px-4 lg:px-8 py-4 flex flex-wrap justify-between items-center gap-x-4 gap-y-3">
          <h1 className="text-xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary whitespace-nowrap">
            Splitter
          </h1>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto flex-grow sm:flex-grow-0">
            <GroupManager
              groups={groups}
              activeGroupId={activeGroupId}
              onAddGroup={handleAddGroup}
              onSelectGroup={setActiveGroupId}
            />
            
            {activeGroup && users.length > 0 && (
              <select
                value={currentUserId || ''}
                onChange={e => setCurrentUserId(e.target.value)}
                className="bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface text-sm focus:ring-primary focus:border-primary transition max-w-[120px] sm:max-w-[150px]"
                aria-label="Select your user identity"
              >
                <option value="" disabled>Select Identity</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            )}
            
            <button
              onClick={() => setShowCollabModal(true)}
              className="relative flex items-center justify-center p-2 sm:px-3 sm:gap-2 text-sm font-medium text-white bg-secondary/80 hover:bg-secondary rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-secondary"
              title="Collaborate with others"
            >
              <ShareIcon />
              <span className="hidden sm:inline">Collaborate</span>
              {connections.length > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {connections.length}
                </span>
              )}
            </button>

            <button
              id="pdf-download-btn"
              onClick={handleDownloadPdf}
              disabled={!activeGroup}
              className="flex items-center justify-center p-2 sm:px-3 sm:gap-2 text-sm font-medium text-white bg-primary hover:bg-primary-focus rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary whitespace-nowrap disabled:bg-gray-600 disabled:cursor-not-allowed"
              title="Download report as PDF"
            >
              <DownloadIcon />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={resetData}
              className="flex items-center justify-center p-2 sm:px-3 sm:gap-2 text-sm font-medium text-white bg-danger/80 hover:bg-danger rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-danger whitespace-nowrap"
              title="Reset All Data"
            >
              <TrashIcon />
              <span className="hidden sm:inline">Reset All</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {!activeGroup ? (
          <div className="text-center py-20 bg-surface rounded-lg shadow-lg">
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface mb-2">Welcome to Splitter!</h2>
            <p className="text-on-surface-secondary">Create a group or collaborate with a friend to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <ExpenseForm
                users={users}
                onSave={handleSaveExpense}
                editingExpense={editingExpense}
                onCancelEdit={handleCancelEdit}
                currentUserId={currentUserId}
                key={`${activeGroupId}-${editingExpense?.id || 'new'}`}
              />
              <ExpenseList
                expenses={expenses}
                users={users}
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
                onAddComment={handleAddComment}
                currentUserId={currentUserId}
              />
            </div>
            <div className="space-y-8">
              <UserManagement
                users={users}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
              />
              <BalanceSummary balances={balances} />
              <SimplifiedTransactions transactions={simplifiedTransactions} />
            </div>
          </div>
        )}
      </main>
      
      {showCollabModal && (
        <CollaborationManager
          peerId={peerId}
          connections={connections}
          onJoinSession={handleJoinSession}
          onClose={() => setShowCollabModal(false)}
          activeGroupName={activeGroup?.name || null}
        />
      )}

      <div className="absolute -top-[9999px] -left-[9999px]" aria-hidden="true">
          {activeGroup && (
          <PDFReport 
              ref={pdfReportRef} 
              group={activeGroup} 
              balances={balances} 
              transactions={simplifiedTransactions} 
          />
          )}
      </div>
    </div>
  );
};

export default App;