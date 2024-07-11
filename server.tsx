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
  
    socket.on("sendMessage", (data: { senderID: string; receiverID: string; senderAppID: string; receiverAppID: string; message: string }) => {
      console.log(`Message from ${data.senderID} to ${data.receiverID}: "${data.message}"`);
  
      io.to(data.receiverAppID).emit("receiveMessage", {
        message: data.message,
        senderID: data.senderID,
        receiverID: data.receiverID,
        timestamp: new Date(),
      });
  
      console.log(`Message emitted to rooms with appID: ${data.receiverAppID}`);
    });
  
    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
  

  server.listen(3000, (err?: any) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
