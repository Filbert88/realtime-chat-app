"use client"
import React, { useState, useCallback, useEffect } from 'react';
import Chat from '../_components/chat';
import FriendsList from '../_components/friendList';
import Sidebar from '../_components/sidebar';
import Popup from '../_components/Popup';
import { useSession } from 'next-auth/react';
import { api } from '@/trpc/react';
import Loading from '../_components/Loading';
import { redirect } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

const ChatPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [allDataLoading, setAllDataLoading] = useState(true); 
  const [activeIcon, setActiveIcon] = useState<string>('messages');

  const updateMedia = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const { data: user, isLoading: userLoading } = api.user.getUser.useQuery(
    { id: session?.user?.id ?? "" },
    {
      enabled: !!session?.user?.id,
    },
  );

  useEffect(() => {
    if (sessionStatus === 'loading' || userLoading) {
      setAllDataLoading(true);
    } else if (sessionStatus === 'unauthenticated') {
      redirect('/signin');
    } else if (session && !user?.appID) {
      redirect('/createID');
    } else {
      setAllDataLoading(false);
    }
  }, [session, user?.appID, sessionStatus, userLoading]);
  
  useEffect(() => {
    updateMedia();
    window.addEventListener('resize', updateMedia);
    return () => {
      window.removeEventListener('resize', updateMedia);
    };
  }, []);

  const { data: conversations, refetch } = api.chat.getFriendsAndConversations.useQuery(
    { userId: session?.user?.id ?? '' },
    {
      enabled: !!session?.user?.id,
    },
  );

  const onAddFriendClick = useCallback(() => {
    console.log("Refetching data...");
    setIsPopupOpen(true); 
    refetch();
  }, [setIsPopupOpen, refetch]);

  const addFriendMutation = api.friend.addFriend.useMutation({
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      toast({
        title: "Successfully added friend",
      });
      setLoading(false);
      void refetch();
    },
    onError: () => {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "An error occurred",
      });
    },
  });

  const handleAddFriend = useCallback(
    async (friendAppID: string) => {
      const userId = session?.user?.id;
      if (!userId) {
        toast({
          variant: "destructive",
          title: "User not authenticated",
        });
        console.error('User not authenticated');
        return;
      }
      try {
        addFriendMutation.mutate({ userId, friendAppID });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error adding friend",
        });
        console.error('Error adding friend:', error);
      }
    },
    [addFriendMutation, session?.user?.id],
  );

  const handleSelectFriend = (friendId: string) => {
    setSelectedFriend(friendId);
    if (isMobile) setShowChat(true); 
  };
  const handleBackToFriends = () => {
    setShowChat(false);
  };

  const handleCancelPopup = () => {
    setActiveIcon('messages'); 
    setIsPopupOpen(false);
  };

  if (allDataLoading) {
    return <Loading />;
  }

  return (
    <div className={`flex h-screen bg-[#2D2E30] w-full pb-[4rem] md:pb-0`}>
      <Sidebar refetch={refetch}  activeIcon={activeIcon} setActiveIcon={setActiveIcon} />
      <div className={`w-full flex-1 ${showChat && isMobile ? 'hidden' : 'md:w-1/3'} overflow-y-auto chatMessages border-r border-gray-600`}>
        <FriendsList
          onSelectFriend={handleSelectFriend}
          onAddFriendClick={onAddFriendClick}
        />
      </div>
      <div className={`${showChat || !isMobile ? 'block w-full' : 'hidden'} md:block md:w-2/3`}>
        {selectedFriend && (
          <Chat friendId={selectedFriend} onBack={handleBackToFriends} />
        )}
      </div>
      <Popup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSubmit={handleAddFriend}
        onCancel={handleCancelPopup}
      />
    </div>
  );
};

export default ChatPage;
