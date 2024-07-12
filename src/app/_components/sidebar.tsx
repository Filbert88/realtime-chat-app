import React, { useState } from "react";
import {
  ChatBubbleOvalLeftIcon,
  UserPlusIcon,
  BellIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Popup from "./Popup";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import Loading from "./Loading";
import { useToast } from "@/components/ui/use-toast";

interface SidebarProps {
  refetch: () => void;
  activeIcon: string;
  setActiveIcon: (iconName: string) => void; 
}

const Sidebar: React.FC<SidebarProps> = ({ refetch, activeIcon, setActiveIcon }) => {
  const { toast } = useToast();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { data: session } = useSession();
  const [loading, setLoading] = useState<boolean>(false);

  const addFriendMutation = api.friend.addFriend.useMutation({
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      toast({
        title: "Successfully added friend",
      });
      setLoading(false);
      refetch();
    },
    onError: () => {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "An error occurred",
      });
    },
  });

  const handleIconClick = (iconName: string) => {
    setIsPopupOpen(iconName === 'addFriend');
    setActiveIcon(iconName);
  };

  const handleAddFriend = async (friendAppID: string) => {
    const userId = session?.user?.id;
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

  const handleCancel = () => {
    setActiveIcon('messages');
    setIsPopupOpen(false);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 flex w-full flex-row md:justify-start items-center justify-center bg-[#1F1F1F] md:relative md:h-screen md:w-16 md:flex-col text-white md:bg-[#1F1F1F]">
      <div className="flex flex-row md:flex-col md:space-y-6 space-x-6 md:space-x-0 md:items-start md:justify-start md:pt-4">
        <SidebarIcon icon={<ChatBubbleOvalLeftIcon className="h-6 w-6" />} onClick={() => handleIconClick('messages')} active={activeIcon === 'messages'} />
        <SidebarIcon icon={<UserPlusIcon className="h-6 w-6" />} onClick={() => handleIconClick('addFriend')} active={activeIcon === 'addFriend'} />
        <SidebarIcon icon={<BellIcon className="h-6 w-6" />} onClick={() => handleIconClick('notifications')} active={activeIcon === 'notifications'} />
        <SidebarIcon icon={<UserIcon className="h-6 w-6" />} onClick={() => handleIconClick('profile')} active={activeIcon === 'profile'} />
      </div>
      <Popup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSubmit={handleAddFriend}
        onCancel={handleCancel}
      />
    </div>
  );
};

interface SidebarIconProps {
  icon: React.ReactNode;
  onClick?: () => void;
  active: boolean;
}

const SidebarIcon: React.FC<SidebarIconProps> = ({ icon, onClick, active }) => (
  <div
    className={`mb-2 mt-2 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full ${active ? 'bg-white text-[#1F1F1F]' : 'hover:bg-gray-700 text-white'}`}
    onClick={onClick}
  >
    {icon}
  </div>
);

export default Sidebar;
