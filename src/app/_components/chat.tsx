import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { api } from "@/trpc/react";
import { IoSendSharp } from "react-icons/io5";
import { IoArrowBack } from "react-icons/io5";
import Loading from "./Loading";

const socket = io(
  process.env.NODE_ENV === "production"
    ? "https://detailed-ermina-filbert21-6e08fb9f.koyeb.app/"
    : "http://localhost:3000/",
);

interface ChatProps {
  friendId: string;
  onBack: () => void;
}

type Message = {
  id?: number;
  tempId?: number;
  createdAt: Date;
  updatedAt: Date | null;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  read?: boolean | null;
};

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  messageId: number | null | undefined;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onDelete: () => void;
  onUnsend: () => void;
}

const Chat: React.FC<ChatProps> = ({ friendId, onBack }) => {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [friendName, setFriendName] = useState<string>("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [conversationId, setConversationId] = useState<string>("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    messageId: null,
  });

  const handleContextMenu = (
    event: React.MouseEvent<HTMLDivElement>,
    message: Message,
  ) => {
    if (message.senderId === session?.user?.id) {
      event.preventDefault();
      const x = Math.min(event.clientX, window.innerWidth - 100);
      const y = Math.min(event.clientY, window.innerHeight - 100);

      setContextMenu({
        visible: true,
        x: x,
        y: y,
        messageId: message.id ?? null,
      });
    }
  };

  const handleContainerDoubleClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (event.target === messagesContainerRef.current) {
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  const handleMessageDoubleClick = (
    event: React.MouseEvent<HTMLDivElement>,
    message: Message,
  ) => {
    event.preventDefault();
    if (message.senderId !== session?.user?.id) {
      return; 
    }
  
    if (messagesContainerRef.current) {
      const rect = messagesContainerRef.current.getBoundingClientRect();
      const x = Math.min(event.clientX, rect.right - 100); 
      const y = Math.min(event.clientY, rect.bottom - 100);
      
      setContextMenu({
        visible: true,
        x,
        y,
        messageId: message.id,
      });
    } else {
      console.error('Message container ref is not yet available.');
    }
  };

  useEffect(() => {
    document.addEventListener("click", () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    });
    return () => {
      document.removeEventListener("click", () => {
        if (contextMenu.visible) {
          setContextMenu({ ...contextMenu, visible: false });
        }
      });
    };
  }, [contextMenu.visible]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!contextMenu.visible) return;
  
      let targetElement = event.target as Node | null;  
  
      do {
        if (targetElement && targetElement === document.getElementById('context-menu')) {
          return; 
        }
        targetElement = targetElement ? targetElement.parentNode : null;
      } while (targetElement);
      
      setContextMenu({ ...contextMenu, visible: false });
    };
  
    document.addEventListener("click", handleDocumentClick);
  
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [contextMenu.visible]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!contextMenu.visible) return;
  
      const contextMenuNode = document.getElementById("context-menu");
      if (contextMenuNode?.contains(event.target as Node)) {
        return;
      }
  
      setContextMenu({ ...contextMenu, visible: false });
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenu.visible]);
  
  
  const ContextMenu: React.FC<ContextMenuProps> = ({
    x,
    y,
    onUnsend,
    onDelete,
  }) => {
    const handleMenuClick = (event: React.MouseEvent<HTMLDivElement>, action: () => void) => {
      event.stopPropagation(); 
      action();
    };
    const style: React.CSSProperties = {
      top: y,
      left: x,
      position: "fixed",
      zIndex: 1000,
      backgroundColor: "#3F3F3F",
      borderRadius: "5px",
      padding: "8px",
      color: "white",
    };

    return (
      <div id="context-menu" style={style}>
        <div
          onClick={(e) => handleMenuClick(e, onUnsend)}
          style={{ cursor: "pointer", padding: "4px 8px" }}
        >
          Unsend
        </div>
        <div
          onClick={(e) => handleMenuClick(e, onDelete)}
          style={{ cursor: "pointer", padding: "4px 8px" }}
        >
          Delete
        </div>
      </div>
    );
  };

  const { mutate: updateMessagesAsRead } =
    api.chat.updateMessagesAsRead.useMutation();
  useEffect(() => {
    if (friendId && session?.user?.id) {
      updateMessagesAsRead(
        {
          userId: session.user.id,
          friendId: friendId,
        },
        {
          onSuccess: (response) => {
            console.log("Messages marked as read.");
            setMessages((prevMessages) =>
              prevMessages.map((msg) => ({
                ...msg,
                read: true,
              })),
            );
            void refetch();
          },
          onError: (error) => {
            console.error("Failed to mark messages as read:", error);
          },
        },
      );
    }
  }, [friendId, session?.user?.id, updateMessagesAsRead]);

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

  const { data: conversationData } = api.user.getConversationID.useQuery(
    {
      userId: session?.user?.id ?? "",
      friendId: friendId,
    },
    {
      enabled: !!session?.user?.id && !!friendId,
    },
  );
  useEffect(() => {
    if (conversationData) {
      setConversationId(conversationData?.conversationId);
    }
  }, [conversationData]);

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
        conversationId: string;
        messageId: number;
      }) => {
        console.log(`Received message: ${data.message} from ${data.senderID}`);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: data.messageId,
            createdAt: new Date(data.timestamp),
            updatedAt: null,
            content: data.message,
            senderId: data.senderID,
            receiverId: data.receiverID,
            conversationId: data.conversationId,
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
      const tempId = Date.now();
      const newMessage = {
        tempId,
        createdAt: new Date(),
        updatedAt: null,
        content: message,
        senderId: session.user.id,
        receiverId: friendId,
        conversationId,
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
          onSuccess: (data) => {
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.tempId === tempId ? { ...msg, id: data.id } : msg,
              ),
            );

            socket.emit("sendMessage", {
              senderID: session?.user.id,
              receiverID: friendId,
              senderAppID: senderAppID,
              receiverAppID: receiverAppID,
              message: message,
              conversationId,
              messageId: data.id,
            });
          },
          onError: () => {
            setMessages((prevMessages) =>
              prevMessages.filter((msg) => msg.tempId !== tempId),
            );
          },
        },
      );

      console.log(
        `Message sent: ${message} from ${session?.user.id} to ${friendId}`,
      );
      setMessage("");
    }
  };

  useEffect(() => {
    if (isMessagesSuccess && messagesData) {
      const processedMessages = messagesData.map((msg) => {
        if (msg.deletedByUserId === session?.user?.id) {
          return { ...msg, content: "[user deleted]" };
        }
        return msg;
      });
      setMessages(processedMessages);
    }
  }, [messagesData, isMessagesSuccess, session?.user?.id]);

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

  useEffect(() => {
    socket.on(
      "messageUnsent",
      (data: { messageId: number; conversationId: string }) => {
        console.log(
          `Processing unsent message at ${new Date().toISOString()} for ID: ${data.messageId} in conversation ${data.conversationId}`,
        );
        setMessages((prevMessages) => {
          const updatedMessages = prevMessages.filter((msg) => {
            return msg.id !== data.messageId;
          });
          console.log("Updated Messages:", updatedMessages);
          return updatedMessages;
        });
      },
    );

    return () => {
      socket.off("messageUnsent");
    };
  }, [socket]);

  const deleteMessageMutation = api.chat.deleteMessage.useMutation();
  const unsendMessageMutation = api.chat.unsendMessage.useMutation();

  const deleteMessage = (id: number) => {
    if (session?.user.id) {
      deleteMessageMutation.mutate(
        { messageId: id, userId: session?.user.id },
        {
          onSuccess: () => {
            setMessages((prevMessages) =>
              prevMessages.filter((msg) => msg.id !== id),
            );
          },
        },
      );
    }
  };

  const unsendMessage = (id: number) => {
    if (session?.user.id && friendData) {
      console.log(`Attempting to unsend message with ID: ${id}`);
      unsendMessageMutation.mutate(
        { messageId: id, userId: session?.user.id },
        {
          onSuccess: () => {
            setMessages((prevMessages) =>
              prevMessages.filter((msg) => msg.id !== id),
            );
            void refetch();
          },
        },
      );
      console.log("message id ", id);
      socket.emit("unsendMessage", {
        messageId: id,
        senderAppID: userData?.appID,
        receiverAppID: friendData.appID,
        conversationId,
      });
    }
  };

  if (isMessagesLoading) {
    return <Loading />;
  }
  if (isUserLoading) {
    return <Loading />;
  }
  if (isFriendLoading) return <Loading />;

  if (messagesError ?? friendError ?? userError)
    return (
      <div>
        Error:{" "}
        {messagesError?.message ?? friendError?.message ?? userError?.message}
      </div>
    );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="bg-transparent p-4 text-lg font-semibold text-white">
        <button onClick={onBack} className="pr-2">
          <IoArrowBack />
        </button>
        {friendName}
      </div>
      <div
        ref={messagesContainerRef}
        onDoubleClick={handleContainerDoubleClick}
        className="message-container chatMessages flex-1 overflow-y-auto p-4"
      >
        {messages
          .filter((msg) => msg.content !== "[user deleted]")
          .map((msg) => (
            <div
              key={msg.id}
              onContextMenu={(e) => handleContextMenu(e, msg)}
              onDoubleClick={(e) => handleMessageDoubleClick(e, msg)}
              className={`my-2 flex items-start message-content ${
                msg.senderId === session?.user?.id
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <>
                {msg.senderId !== session?.user?.id && (
                  <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-white">
                    {getAvatarInitials(friendName)}
                  </div>
                )}
                {msg.senderId !== session?.user?.id ? (
                  <div className="flex flex-row gap-2">
                    <div className="max-w-xs rounded-lg bg-[#555555] p-2 text-white">
                      <div>{msg.content}</div>
                    </div>
                    <div className="mt-1 self-end text-xs text-[#76776D]">
                      {format(new Date(msg.createdAt), "hh:mm a")}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-row items-end gap-2">
                    <div className="flex flex-col text-end">
                      {msg.senderId === session?.user?.id && msg.read && (
                        <div className="text-xs text-[#76776D]">Read</div>
                      )}
                      <div className="self-end text-xs text-[#76776D]">
                        {format(new Date(msg.createdAt), "hh:mm a")}
                      </div>
                    </div>
                    <div className="max-w-xs rounded-lg bg-[#86D97B] p-2 text-black">
                      <div>{msg.content}</div>
                    </div>
                  </div>
                )}
              </>
            </div>
          ))}
      </div>
      <div className="flex items-center border-t border-gray-600 p-4">
        <textarea
          className="chatMessages flex-1 resize-none bg-transparent p-2 text-white focus:outline-none"
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
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onDelete={() => {
            if (contextMenu.messageId != null) {
              deleteMessage(contextMenu.messageId);
              setContextMenu({ ...contextMenu, visible: false });
            }
          }}
          onUnsend={() => {
            if (contextMenu.messageId != null) {
              unsendMessage(contextMenu.messageId);
              setContextMenu({ ...contextMenu, visible: false });
            }
          }}
        />
      )}
    </div>
  );
};

export default Chat;
