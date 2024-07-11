import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/trpc/react";

const socket = io("https://realtime-chat-app-ez.vercel.app/");

interface ChatProps {
  friendId: string;
}

const Chat: React.FC<ChatProps> = ({ friendId }) => {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    {
      id: number;
      createdAt: Date;
      updatedAt: Date | null;
      content: string;
      senderId: string;
      receiverId: string;
      conversationId: string;
    }[]
  >([]);
  const [friendName, setFriendName] = useState<string>("");
  const [userAppID, setUserAppID] = useState<string | null>(null);

  const {
    data: messagesData,
    isSuccess: isMessagesSuccess,
    isLoading: isMessagesLoading,
    error: messagesError,
    refetch,
  } = api.chat.getMessages.useQuery(
    { senderId: session?.user?.id ?? "", receiverId: friendId },
    {
      enabled: !!session?.user?.id,
    },
  );

  const sendMessageMutation = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const {
    data: friendData,
    isLoading: isFriendLoading,
    error: friendError,
  } = api.user.getUser.useQuery({ id: friendId });

  useEffect(() => {
    if (friendData?.name) {
      setFriendName(friendData.name);
    }
  }, [friendData]);

  const {
    data: userData,
    isLoading: isUserLoading,
    error: userError,
  } = api.user.getUser.useQuery(
    { id: session?.user?.id ?? "" },
    {
      enabled: !!session?.user?.id,
    },
  );

  useEffect(() => {
    if (userData?.appID) {
      socket.emit("setup", userData.appID);
    }
  }, [userData?.appID]);

  useEffect(() => {
    if (userData?.appID) {
      setUserAppID(userData.appID);
      socket.emit("joinRoom", userData.appID);
      console.log(`Joining room: ${userData.appID}`);
    }

    socket.on(
      "receiveMessage",
      (data: {
        message: string;
        senderID: string;
        receiverID: string;
        timestamp: Date;
      }) => {
        console.log(`Received message: ${data.message} from ${data.senderID}`);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: prevMessages.length + 1,
            createdAt: new Date(data.timestamp),
            updatedAt: null,
            content: data.message,
            senderId: data.senderID,
            receiverId: data.receiverID,
            conversationId: "temp-id",
          },
        ]);
      },
    );

    return () => {
      socket.off("receiveMessage");
    };
  }, [friendId, userData?.appID, session?.user?.id]);

  const sendMessage = () => {
    if (message.trim() && userData && friendData && session) {
      const senderAppID = userData.appID;
      const receiverAppID = friendData.appID;

      sendMessageMutation.mutate({
        senderId: session.user.id,
        receiverId: friendId,
        content: message,
      });

      socket.emit("sendMessage", {
        senderID: session?.user.id,
        receiverID: friendId,
        senderAppID: senderAppID,
        receiverAppID: receiverAppID,
        message: message,
      });

      console.log(
        `Message sent: ${message} from ${session?.user.id} to ${friendId}`,
      );
      setMessage("");
    }
  };

  useEffect(() => {
    if (isMessagesSuccess && messagesData) {
      setMessages(messagesData);
    }
  }, [messagesData, isMessagesSuccess]);

  if (isMessagesLoading) {
    return <div>Loading...</div>;
  }
  if (isUserLoading) {
    return <div>Loading...</div>;
  }
  if (isFriendLoading) return <div>Loading...</div>;

  if (messagesError ?? friendError ?? userError)
    return (
      <div>
        Error:{" "}
        {messagesError?.message ?? friendError?.message ?? userError?.message}
      </div>
    );

  const getAvatarInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "";
  };

  return (
    <div className="flex h-full flex-col">
      <div className="bg-gray-800 p-4 text-lg font-semibold text-white">
        {friendName}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`my-2 flex items-start ${
              msg.senderId === session?.user?.id
                ? "justify-end"
                : "justify-start"
            }`}
          >
            {msg.senderId !== session?.user?.id && (
              <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-white">
                {getAvatarInitials(friendName)}
              </div>
            )}
            <div
              className={`max-w-xs rounded-lg p-2 ${
                msg.senderId === session?.user?.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              <div>{msg.content}</div>
              <div className="text-xs text-gray-600">
                {formatDistanceToNow(new Date(msg.createdAt), {
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center bg-gray-700 p-4">
        <input
          type="text"
          className="flex-1 rounded-l border border-gray-300 p-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          className="rounded-r bg-blue-500 p-2 text-white"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
