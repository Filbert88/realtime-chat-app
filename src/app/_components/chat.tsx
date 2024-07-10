import React, { useState, useEffect } from 'react';
import { api } from '@/trpc/react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';

interface ChatProps {
  friendId: string;
}

const Chat: React.FC<ChatProps> = ({ friendId }) => {
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<
    { id: number; createdAt: Date; updatedAt: Date | null; content: string; senderId: string; receiverId: string; conversationId: string; }[]
  >([]);
  const [friendName, setFriendName] = useState<string>('');

  const { data: messagesData, isSuccess: isMessagesSuccess, isLoading: isMessagesLoading, error: messagesError, refetch } = api.chat.getMessages.useQuery(
    { senderId: session?.user?.id ?? '', receiverId: friendId },
    {
      enabled: !!session?.user?.id,
    }
  );

  const sendMessageMutation = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      refetch(); 
    },
  });

  const sendMessage = () => {
    if (message.trim() && session?.user?.id) {
      sendMessageMutation.mutate({
        senderId: session.user.id,
        receiverId: friendId,
        content: message,
      });
      setMessage('');
    }
  };

  useEffect(() => {
    if (isMessagesSuccess && messagesData) {
      setMessages(messagesData);
    }
  }, [messagesData, isMessagesSuccess]);

  const { data: friendData, isLoading: isFriendLoading, error: friendError } = api.user.getUser.useQuery({ id: friendId });

  useEffect(() => {
    if (friendData?.name) {
      setFriendName(friendData.name);
    }
  }, [friendData]);

  if (isMessagesLoading || isFriendLoading) return <div>Loading...</div>;
  if (messagesError || friendError) return <div>Error: {messagesError?.message ?? friendError?.message}</div>;

  const getAvatarInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-gray-800 text-white text-lg font-semibold">
        {friendName}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start my-2 ${
              msg.senderId === session?.user?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.senderId !== session?.user?.id && (
              <div className="w-8 h-8 bg-gray-500 text-white flex items-center justify-center rounded-full mr-2">
                {getAvatarInitials(friendName)}
              </div>
            )}
            <div
              className={`max-w-xs p-2 rounded-lg ${
                msg.senderId === session?.user?.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
              }`}
            >
              <div>{msg.content}</div>
              <div className="text-xs text-gray-600">
                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-gray-700 flex items-center">
        <input
          type="text"
          className="flex-1 p-2 border border-gray-300 rounded-l"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          className="p-2 bg-blue-500 text-white rounded-r"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
