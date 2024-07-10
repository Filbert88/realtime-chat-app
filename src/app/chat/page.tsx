"use client";
import React, { useState } from 'react';
import Chat from '../_components/chat';
import FriendsList from '../_components/friendList';
import Sidebar from '../_components/sidebar';
import Popup from '../_components/Popup';
import { useSession } from 'next-auth/react';
import { api } from "@/trpc/react";
import Loading from '../_components/Loading';
import Toast from '../_components/Toast';
import { ToastState } from '../_components/Toast';

const ChatPage: React.FC = () => {
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { data: session } = useSession();
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    type: "error",
  });

  const { data: conversations, refetch } = api.chat.getFriendsAndConversations.useQuery(
    { userId: session?.user?.id ?? '' },
    {
      enabled: !!session?.user?.id,
    }
  );

  const addFriendMutation = api.friend.addFriend.useMutation({
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      setToast({
        isOpen: true,
        message: "Successfully added friend",
        type: "success",
      });
      setLoading(false);
      void refetch();
    },
    onError: () => {
      setLoading(false);
      setToast({ isOpen: true, message: "An error occurred", type: "error" });
    },
  });

  const handleAddFriend = async (friendAppID: string) => {
    const userId = session?.user?.id;
    console.log("user id: ", userId);
    if (!userId) {
      console.error("User not authenticated");
      return;
    }

    try {
      addFriendMutation.mutate({ userId, friendAppID });
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };

  return (
    <div className="flex h-screen bg-[#2D2E30]">
      <Sidebar refetch={refetch} />
      <div className="w-1/3 border-r border-gray-600 overflow-y-auto items-center">
        <FriendsList onSelectFriend={setSelectedFriend} onAddFriendClick={() => setIsPopupOpen(true)} />
      </div>
      <div className="w-2/3 p-4">
        {selectedFriend ? (
          <Chat friendId={selectedFriend} />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            Select a friend or conversation to start chatting
          </div>
        )}
      </div>
      <Popup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} onSubmit={handleAddFriend} />
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        closeToast={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
};

export default ChatPage;
