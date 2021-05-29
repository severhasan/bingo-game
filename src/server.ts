import express from 'express';
import next from 'next';


const server = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();


server.use(express.json());
server.use(express.static('public'));

app.prepare().then(() => {
    server.all('*', (req, res) => {
        return handle(req, res)
    })

    server.listen(PORT, () => {
        console.log(`> Ready on http://localhost:${PORT}`)
    })
});