/// <reference path="./models/app.d.ts" />

import express from 'express';
import next from 'next';
import helmet from 'helmet';
import socketHandler from './api/socket';


const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();


// configure server
app.use(express.json());
app.use(express.static('public'));
// server.use(helmet());


// connect socket io
const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on("connection", (socket) => socketHandler(socket, io));

// prepare nextjs
nextApp.prepare().then(() => {
  app.all('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`)
  })
});