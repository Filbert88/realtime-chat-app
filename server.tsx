import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server, Socket } from "socket.io";

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("A user connected");

    socket.on("joinRoom", (appID: string) => {
      socket.join(appID);
      console.log(`User with appID ${appID} joined their room`);
    });

    socket.on(
      "sendMessage",
      (data: {
        senderID: string;
        receiverID: string;
        senderAppID: string;
        receiverAppID: string;
        message: string;
        conversationId: string;
        messageId: number;
      }) => {
        console.log(
          `Message from ${data.senderID} to ${data.receiverID}: "${data.message}"`,
        );

        io.to(data.receiverAppID).emit("receiveMessage", {
          message: data.message,
          senderID: data.senderID,
          receiverID: data.receiverID,
          timestamp: new Date(),
          conversationId: data.conversationId,
          messageId: data.messageId,
        });

        console.log(
          `Message emitted to rooms with appID: ${data.receiverAppID}`,
        );
      },
    );

    socket.on(
      "deleteMessage",
      (data: { messageId: number; receiverAppID: string }) => {
        console.log(`Deleting message with ID: ${data.messageId}`);
        io.to(data.receiverAppID).emit("messageDeleted", {
          messageId: data.messageId,
        });
      },
    );

    socket.on(
      "updateUnreadCount",
      (data: { friendId: string; unreadCount: number }) => {
        console.log("id: ", data.friendId);
        console.log("unreadcount: ", data.unreadCount);
        io.to(data.friendId).emit("updateFriendUnread", {
          userId: data.friendId,  
          unreadCount: data.unreadCount  
        });
      },
    );

    socket.on(
      "unsendMessage",
      (data: {
        messageId: number;
        senderAppID: string;
        receiverAppID: string;
        conversationId: string;
      }) => {
        console.log(
          `Received unsendMessage at ${new Date().toISOString()} for ID: ${data.messageId}`,
        );
        io.to(data.senderAppID).emit("messageUnsent", {
          messageId: data.messageId,
          conversationId: data.conversationId,
        });
        if (data.senderAppID !== data.receiverAppID) {
          console.log("halo");
          io.to(data.receiverAppID).emit("messageUnsent", {
            messageId: data.messageId,
            conversationId: data.conversationId,
          });
        }
        console.log(
          `Message unsending to rooms with appID: ${data.receiverAppID} and ${data.senderAppID}`,
        );
      },
    );

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  server.listen(3000, (err?: any) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
