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
import Toast from "./Toast";
import { ToastState } from "./Toast";

interface SidebarProps {
  refetch: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ refetch }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { data: session } = useSession();
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({
    isOpen: false,
    message: "",
    type: "error",
  });

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
      refetch();
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

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 flex w-full flex-row md:justify-start items-center justify-center bg-[#1F1F1F] md:relative md:h-screen md:w-16 md:flex-col text-white md:bg-[#1F1F1F]">
      <div className="flex flex-row md:flex-col md:space-y-6 space-x-6 md:space-x-0 md:items-start md:justify-start md:pt-4">
        <SidebarIcon icon={<ChatBubbleOvalLeftIcon className="h-6 w-6" />} />
        <SidebarIcon icon={<UserPlusIcon className="h-6 w-6" />} onClick={() => setIsPopupOpen(true)} />
        <SidebarIcon icon={<BellIcon className="h-6 w-6" />} />
        <SidebarIcon icon={<UserIcon className="h-6 w-6" />} />
      </div>
      <Popup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSubmit={handleAddFriend}
      />
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        closeToast={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
  
};

interface SidebarIconProps {
  icon: React.ReactNode;
  onClick?: () => void;
}

const SidebarIcon: React.FC<SidebarIconProps> = ({ icon, onClick }) => (
  <div
    className="mb-2 mt-2 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full hover:bg-gray-700"
    onClick={onClick}
  >
    {icon}
  </div>
);

export default Sidebar;
