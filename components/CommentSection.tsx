import React, { useState } from 'react';
import { Comment } from '../types';

interface CommentSectionProps {
  comments: Comment[];
  currentUserId: string | null;
  onAddComment: (text: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments, currentUserId, onAddComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && currentUserId) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-700">
      <h4 className="text-md font-semibold mb-2 text-on-surface">Comments</h4>
      <div className="space-y-3 max-h-48 overflow-y-auto pr-2 mb-4">
        {comments && comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="text-sm">
              <div className="bg-background p-2 rounded-lg break-words">
                <span className="font-bold text-primary">{comment.userName}: </span>
                <span>{comment.text}</span>
              </div>
              <p className="text-xs text-on-surface-secondary text-right mt-1 px-1">
                {new Date(comment.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p className="text-xs text-on-surface-secondary text-center py-2">No comments yet.</p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={currentUserId ? 'Add a comment...' : 'Select your user identity to comment'}
          className="flex-grow bg-background border border-gray-600 rounded-md px-3 py-2 text-on-surface focus:ring-primary focus:border-primary transition"
          disabled={!currentUserId}
        />
        <button 
          type="submit" 
          className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          disabled={!currentUserId || !newComment.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default CommentSection;