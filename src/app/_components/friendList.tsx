import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Loading from "./Loading";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import {
  UserPlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface Friend {
  id: string;
  name: string;
  email: string;
  appID: string | null;
  image: string | null;
  unreadCount: number;
}

interface FriendsListProps {
  onSelectFriend: (friendId: string) => void;
  onAddFriendClick: () => void;
}

const FriendsList: React.FC<FriendsListProps> = ({
  onSelectFriend,
  onAddFriendClick,
}) => {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data,
    error: queryError,
    isLoading,
    refetch,
  } = api.chat.getFriendsAndConversations.useQuery(
    { userId: session?.user?.id ?? "" },
    {
      enabled: !!session?.user?.id,
    },
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      void refetch();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [refetch]);

  useEffect(() => {
    if (data) {
      console.log("data friends", data);
      setFriends(data);
      setFilteredFriends(data);
      setLoading(false);
      // void refetch();
    } else if (queryError) {
      setError(queryError.message);
      setLoading(false);
    }
  }, [data, queryError]);

  useEffect(() => {
    const results = friends.filter((friend) =>
      friend.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredFriends(results);
  }, [searchTerm, friends]);

  const getAvatarInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "";
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  if (isLoading || loading) return <Loading />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="h-full">
      <div className="chatMessages px-4 pb-2 pt-4">
        <div className="flex items-center rounded-lg bg-[#4A4A4A] p-2">
          <MagnifyingGlassIcon className="ml-3 mr-2 h-5 w-5 text-white" />
          <input
            type="text"
            placeholder="Search for chats"
            className="w-full bg-[#4A4A4A] p-2 text-white focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <XMarkIcon
              className="mr-3 h-5 w-5 cursor-pointer text-white"
              onClick={handleClearSearch}
            />
          )}
        </div>
      </div>
      {filteredFriends.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-white">
          <p>No friends found</p>
          <button
            className="mt-4 flex items-center rounded-lg bg-blue-500 p-2 text-white"
            onClick={onAddFriendClick}
          >
            <UserPlusIcon className="mr-2 h-6 w-6" /> Add Friend
          </button>
        </div>
      ) : (
        <ul className="list-none p-0">
          {filteredFriends.map((friend) => (
            <li
              key={friend.id}
              className="flex cursor-pointer items-center p-4 text-white hover:bg-[#343536]"
              onClick={() => onSelectFriend(friend.id)}
            >
              {friend.image ? (
                <img
                  src={friend.image}
                  alt={`${friend.name}'s avatar`}
                  className="mr-4 h-12 w-12 rounded-full"
                />
              ) : (
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-500 text-white">
                  {getAvatarInitials(friend.name)}
                </div>
              )}
              <div className="flex-grow">{friend.name}</div>
              {friend.unreadCount > 0 && (
                <span className="bg-[#44AD53] ml-4 rounded-full px-2 py-1 text-xs font-bold text-white">
                  {friend.unreadCount}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendsList;
