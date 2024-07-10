import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server, Socket } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);

  io.on('connection', (socket: Socket) => {
    console.log('A user connected');

    socket.on('joinRoom', (appID: string) => {
      socket.join(appID);
      console.log(`User joined room: ${appID}`);
    });

    socket.on('sendMessage', (data: { appID: string; message: string }) => {
      io.to(data.appID).emit('receiveMessage', data.message);
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });

  server.listen(4000, (err?: any) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:4000');
  });
});
