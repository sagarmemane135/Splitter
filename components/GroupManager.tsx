import React, { useState } from 'react';
import { Group } from '../types';
import { TrashIcon } from './icons/TrashIcon';

interface GroupManagerProps {
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onAddGroup: (name: string) => void;
  onDeleteGroup: (groupId: string) => void;
}

const GroupManager: React.FC<GroupManagerProps> = ({ groups, activeGroupId, onSelectGroup, onAddGroup, onDeleteGroup }) => {
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
      <form onSubmit={handleAddGroup} className="flex flex-grow items-center gap-2">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="New group name"
          className="flex-grow w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-primary focus:border-primary transition"
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
    <div className="flex items-center gap-1.5 sm:gap-2">
      <select
        value={activeGroupId || ''}
        onChange={handleSelectChange}
        className="w-28 sm:w-auto sm:min-w-[180px] bg-background border border-gray-600 rounded-md px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-on-surface focus:ring-primary focus:border-primary transition"
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
       <button
          onClick={() => activeGroupId && onDeleteGroup(activeGroupId)}
          disabled={!activeGroupId || groups.length === 0}
          className="p-1.5 sm:p-2.5 bg-background border border-gray-600 rounded-md text-on-surface-secondary hover:text-danger hover:border-danger transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete selected group"
        >
          <TrashIcon />
        </button>
    </div>
  );
};

export default GroupManager;