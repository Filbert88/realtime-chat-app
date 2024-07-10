import React, { useState } from 'react';

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (friendId: string) => void;
}

const Popup: React.FC<PopupProps> = ({ isOpen, onClose, onSubmit }) => {
  const [friendId, setFriendId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(friendId);
    setFriendId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#141414] p-4 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Add Friend</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="w-full p-2 mb-4 border rounded-lg text-black"
            placeholder="Enter friend ID"
            value={friendId}
            onChange={(e) => setFriendId(e.target.value)}
            required
          />
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-4 py-2 bg-red rounded-lg"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Popup;
