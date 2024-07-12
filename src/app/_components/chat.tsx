import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";
import { formatDistanceToNow, format } from "date-fns";
import { api } from "@/trpc/react";
import { IoSendSharp } from "react-icons/io5";
import { IoArrowBack } from "react-icons/io5";

const socket = io(
  process.env.NODE_ENV === "production"
    ? "https://detailed-ermina-filbert21-6e08fb9f.koyeb.app/"
    : "http://localhost:3000/",
);

interface ChatProps {
  friendId: string;
  onBack:() => void;
}

const Chat: React.FC<ChatProps> = ({ friendId, onBack }) => {
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
      const newMessage = {
        id: Date.now(),
        createdAt: new Date(),
        updatedAt: null,
        content: message,
        senderId: session.user.id,
        receiverId: friendId,
        conversationId: "temp-id",
      };

      setMessages((prevMessages) => [...prevMessages, newMessage]);

      const senderAppID = userData.appID;
      const receiverAppID = friendData.appID;

      sendMessageMutation.mutate(
        {
          senderId: session.user.id,
          receiverId: friendId,
          content: message,
        },
        {
          onSuccess: () => {
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === newMessage.id ? { ...msg } : msg,
              ),
            );
          },
          onError: () => {
            setMessages((prevMessages) =>
              prevMessages.filter((msg) => msg.id !== newMessage.id),
            );
          },
        },
      );

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

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const getAvatarInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "";
  };

  const adjustHeight = (target: HTMLTextAreaElement) => {
    target.style.height = "auto";
    const maxHeight = 120;
    if (target.scrollHeight > maxHeight) {
      target.style.height = `${maxHeight}px`;
      target.style.overflowY = "auto";
    } else {
      target.style.height = `${target.scrollHeight}px`;
      target.style.overflowY = "hidden";
    }
  };

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

  return (
    <div className="flex h-full flex-col w-full">
      <div className="bg-transparent p-4 text-lg font-semibold text-white">
      <button onClick={onBack} className="pr-2">
          <IoArrowBack />
        </button>
        {friendName}
      </div>
      <div
        ref={messagesContainerRef}
        className="chatMessages flex-1 overflow-y-auto p-4"
      >
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
                  ? "bg-[#86D97B] text-black"
                  : "bg-[#555555] text-white"
              }`}
            >
              <div>{msg.content}</div>
              <div className={`text-xs ${msg.senderId === session?.user?.id ? "text-gray-600" : "text-gray-200"}`}>
                {formatDistanceToNow(new Date(msg.createdAt), {
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center border-t border-gray-600 p-4">
        <textarea
          className="flex-1 resize-none bg-transparent p-2 text-white focus:outline-none chatMessages"
          placeholder="Enter a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onInput={(e) => adjustHeight(e.target as HTMLTextAreaElement)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          style={{ minHeight: "10px" }}
          rows={1}
        />
        <button className="pl-2 text-white" onClick={sendMessage}>
          <IoSendSharp />
        </button>
      </div>
    </div>
  );
};

export default Chat;
