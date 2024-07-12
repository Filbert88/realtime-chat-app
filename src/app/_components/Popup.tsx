import React, { useState } from 'react';
import { IoMdClose } from 'react-icons/io'; // Importing a close icon from react-icons

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (friendId: string) => void;
  onCancel: () => void;
}

const Popup: React.FC<PopupProps> = ({ isOpen, onClose, onSubmit, onCancel }) => {
  const [friendId, setFriendId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(friendId);
    setFriendId('');
    onClose();
  };

  const handleCancel = () => {
    onCancel(); 
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[#343536] p-6 rounded-lg shadow-lg w-11/12 max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-center">Add Friend</h2>
          <IoMdClose className="text-xl cursor-pointer" onClick={handleCancel} />
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="w-full p-2 mb-4 rounded-lg text-white bg-[#4A4A4A] focus:outline-none"
            placeholder="Enter friend ID"
            value={friendId}
            onChange={(e) => setFriendId(e.target.value)}
            required
          />
          <div className="flex justify-center">
            <button
              type="submit"
              className="px-4 py-2 bg-[#1F1F1F] text-white rounded-lg"
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
