import React, { useState } from 'react';
import { Group } from '../types';

interface GroupManagerProps {
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onAddGroup: (name: string) => void;
}

const GroupManager: React.FC<GroupManagerProps> = ({ groups, activeGroupId, onSelectGroup, onAddGroup }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === 'add_new') {
      setIsAdding(true);
    } else {
      onSelectGroup(value);
      setIsAdding(false);
    }
  };

  const handleAddGroup = (event: React.FormEvent) => {
    event.preventDefault();
    if (newGroupName.trim()) {
      onAddGroup(newGroupName.trim());
      setNewGroupName('');
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <form onSubmit={handleAddGroup} className="flex-grow flex justify-center items-center gap-2">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="New group name ('Trip to Goa')"
          className="w-full max-w-xs bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-primary focus:border-primary transition"
          autoFocus
        />
        <button type="submit" className="px-3 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-focus rounded-md transition-colors">
          Create
        </button>
        <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-2 text-sm font-medium text-on-surface bg-gray-600 hover:bg-gray-700 rounded-md transition-colors">
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="flex-grow flex justify-center">
      <select
        value={activeGroupId || ''}
        onChange={handleSelectChange}
        className="w-full max-w-xs bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-primary focus:border-primary transition"
        aria-label="Select Expense Group"
      >
        {groups.length === 0 && <option value="" disabled>No groups yet</option>}
        {groups.map(group => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
        <option value="add_new" className="font-bold text-secondary">
          + Create New Group
        </option>
      </select>
    </div>
  );
};

export default GroupManager;
