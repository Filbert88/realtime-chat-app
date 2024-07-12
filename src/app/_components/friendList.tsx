import React, { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { UserPlusIcon } from "@heroicons/react/24/outline";

interface Friend {
  id: string;
  name: string;
  email: string;
  appID: string | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    data,
    error: queryError,
    isLoading,
  } = api.chat.getFriendsAndConversations.useQuery(
    { userId: session?.user?.id ?? "" },
    {
      enabled: !!session?.user?.id,
    },
  );

  useEffect(() => {
    if (data) {
      setFriends(data);
      setLoading(false);
    } else if (queryError) {
      setError(queryError.message);
      setLoading(false);
    }
  }, [data, queryError]);

  const getAvatarInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "";
  };

  if (isLoading || loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="h-full">
      <h2 className="p-4 text-lg font-semibold text-white">
        Friends & Conversations
      </h2>
      {friends.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-white">
          <p>No friends yet</p>
          <button
            className="mt-4 flex items-center rounded-lg bg-blue-500 p-2 text-white"
            onClick={onAddFriendClick}
          >
            <UserPlusIcon className="mr-2 h-6 w-6" /> Add Friend
          </button>
        </div>
      ) : (
        <ul className="list-none p-0">
          {friends.map((friend) => (
            <li
              key={friend.id}
              className="flex cursor-pointer items-center p-4 text-white hover:bg-gray-400"
              onClick={() => onSelectFriend(friend.id)}
            >
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-500 text-white">
                {getAvatarInitials(friend.name)}
              </div>
              {friend.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendsList;
