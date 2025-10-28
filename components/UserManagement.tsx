import React, { useState } from 'react';
import { User } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';

interface UserManagementProps {
  users: User[];
  onAddUser: (name: string) => void;
  onDeleteUser: (userId: string) => void;
  involvedUserIds: Set<string>;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onDeleteUser, involvedUserIds }) => {
  const [newUserName, setNewUserName] = useState('');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      onAddUser(newUserName.trim());
      setNewUserName('');
    }
  };

  return (
    <div className="bg-surface rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl font-bold mb-4 text-on-surface">Manage Users</h2>
      <form onSubmit={handleAddUser} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={newUserName}
          onChange={(e) => setNewUserName(e.target.value)}
          placeholder="Add new user"
          className="flex-grow bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-primary focus:border-primary transition"
        />
        <button type="submit" className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2">
          <UserPlusIcon />
          <span>Add</span>
        </button>
      </form>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {users.length > 0 ? (
          users.map(user => {
            const isDeletable = !involvedUserIds.has(user.id);
            return (
              <div key={user.id} className="flex items-center justify-between bg-background/50 p-3 rounded-md">
                <span className="text-on-surface">{user.name}</span>
                <button 
                  onClick={() => onDeleteUser(user.id)} 
                  className="p-1 disabled:text-gray-600 disabled:cursor-not-allowed text-on-surface-secondary hover:text-danger transition-colors"
                  disabled={!isDeletable}
                  title={isDeletable ? "Delete user" : "Cannot delete user involved in expenses."}
                >
                  <TrashIcon />
                </button>
              </div>
            )
          })
        ) : (
          <p className="text-on-surface-secondary text-center py-4">Add users to get started.</p>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
