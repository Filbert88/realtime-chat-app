import React, { useEffect, useState } from 'react';
import { api } from '@/trpc/react';
import { useSession } from 'next-auth/react';
import { UserPlusIcon } from '@heroicons/react/24/outline';

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

const FriendsList: React.FC<FriendsListProps> = ({ onSelectFriend, onAddFriendClick }) => {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data, error: queryError, isLoading } = api.chat.getFriendsAndConversations.useQuery(
    { userId: session?.user?.id ?? '' },
    {
      enabled: !!session?.user?.id,
    }
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

  if (isLoading || loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="h-full">
      <h2 className="text-lg font-semibold p-4 text-white">Friends & Conversations</h2>
      {friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-white">
          <p>No friends yet</p>
          <button className="mt-4 p-2 bg-blue-500 text-white rounded-lg flex items-center" onClick={onAddFriendClick}>
            <UserPlusIcon className="mr-2 h-6 w-6" /> Add Friend
          </button>
        </div>
      ) : (
        <ul className="list-none p-0">
          {friends.map((friend) => (
            <li
              key={friend.id}
              className="p-4 cursor-pointer hover:bg-gray-400 bg-gray-800 text-white"
              onClick={() => onSelectFriend(friend.id)}
            >
              {friend.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendsList;
