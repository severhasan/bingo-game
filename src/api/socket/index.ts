import { MOVIES, SOCKET_EVENTS, RANDOM_MOVIE_CHARACTERS } from '../../constants';

const MAX_PLAYER_COUNT = 10;
const FREE_BINGO_TEXT = 'FREE BINGO';
const DRAW_ITEM_TIMEOUT = 3000;
const COUNTDOWN_TIMEOUT = 15000;


// since game is played 5x5, don't want to bother with the algorithm where the grid size might be different
// these are the indices of items on the card
const possibleColumnBingos = [[0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24]];
const possibleRowBingos = [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24]];
const possibleDiogonalBingos = [[4, 8, 12, 16, 20], [0, 6, 12, 18, 24]];
const possibleBingoScenarios = [...possibleColumnBingos, ...possibleRowBingos, ...possibleDiogonalBingos];

class Player {
    /** the items (numbers or movie names) the player has on their card */
    private card: string[];
    /** the matched items in the card */
    private matches: string[];
    private socketId: string;
    private name: string;

    constructor(card: string[], socketId: string, name: string) {
        this.card = card;
        this.socketId = socketId;
        this.name = name;
    }

    getName() {
        return this.name;
    }

    addMatch(match: string) {
        this.matches.push(match);
    }

    checkBingo() {
        const indices = this.matches.map(match => this.card.indexOf(match));
        let isBingo = false;
        for (const scenario of possibleBingoScenarios) {
            const matchingIndices = indices.filter(i => scenario.includes(i));
            if (scenario.length === matchingIndices.length) {
                isBingo = true;
                break;
            }
        }
        return isBingo;
    }

    getSocketId() {
        return this.socketId;
    }

    reset(card: string[]) {
        this.card = card;
        this.matches = [];
    }
}

class Game {
    /** technically, there should be a limit to how many players can be in a game since the number of items (numbers/movies) will be limited in this version */
    private players: Player[] = [];
    /** room id of socket io where the players will be in */
    private roomId: string;
    /** the (number/movie) list where the items will be picked from on each round */
    private stack: string[];
    /** the io instance of the server */
    io: any;
    private creatorSocketId: string;
    winner: Player;
    status: GameStatus;
    currentItem: string;
    /** id of timeout */
    countdown: NodeJS.Timeout;
    timeoutDuration = COUNTDOWN_TIMEOUT;

    constructor(io: any, roomId: string, creatorSocketId: string, public stackSize: number, timeoutDuration = COUNTDOWN_TIMEOUT) {
        this.roomId = roomId;
        this.io = io;
        this.creatorSocketId = creatorSocketId;
        this.timeoutDuration = timeoutDuration;

        const shuffledStack = this.shuffle(MOVIES);
        this.stack = shuffledStack.slice(0, this.stackSize);
    }

    /** reset the game if the players want to play again */
    reset() {
        const shuffledStack = this.shuffle(MOVIES);
        this.stack = shuffledStack.slice(0, this.stackSize);
        this.startGame(this.creatorSocketId);

        this.players.forEach(player => {
            player.reset(this.generateNewCard());
        });
    }

    generateNewCard() {
        const newCard = this.shuffle([...this.stack]);
        newCard.splice(12, 0, FREE_BINGO_TEXT);
        return newCard;
    }

    /** get the socket ids in a room */
    getRoom() {
        return this.io.of("/").adapter.rooms.get(this.roomId);
    }


    /** get the list of player names */
    getPlayers() {
        return this.players.map(player => player.getName());
    }

    /** add new player to the game */
    addPlayer(socketId: string, name: string = '') {
        if (this.players.length >= MAX_PLAYER_COUNT) return;

        let playerName = name;
        if (!playerName) {
            // filter out the character list so that not two names will appear in the list
            const filteredCharacters = RANDOM_MOVIE_CHARACTERS.filter(name => !this.getPlayers().includes(name));
            playerName = filteredCharacters[Math.round(Math.random() * filteredCharacters.length)];
        }

        const newCard = this.generateNewCard();
        const newPlayer = new Player(newCard, socketId, playerName);
        this.players.push(newPlayer);

        return playerName;
    }

    /** remove the player from the game */
    removePlayer(socketId: string) {
        const playerIndex = this.players.findIndex(player => player.getSocketId() === socketId);
        if (playerIndex >= 0) {
            this.players.splice(playerIndex, 1);
        }
    }


    /** set status and start the game on client side */
    startGame(creatorSocketId: string) {
        if (this.creatorSocketId !== creatorSocketId) return;
        this.status = 'drawing_item';
        setTimeout(this.drawItem, DRAW_ITEM_TIMEOUT);
    }

    drawItem() {
        if (!this.stack.length) return this.endGame();

        // technically, no need for randomness since it was already shuffled in the first place, and the player cards do not match the movile list, but yeah, why not...
        const newMovies = [...this.stack];
        const randomIndex = Math.round(Math.random() * (this.stack.length - 1));
        const randomItem = newMovies[randomIndex];

        this.stack.splice(randomIndex, 1);
        this.currentItem = randomItem;
        this.status = 'item_selected';

        setTimeout(this.goNextRound, this.timeoutDuration);

        // send the item drawn to the players in the room
        // ...
    }

    matchItem(match: string, socketId: string) {
        if (this.currentItem !== match) return;

        const player = this.players.find(player => player.getSocketId() === socketId);
        player.addMatch(match);
        if (player.checkBingo()) {
            this.winner = player;
            return this.endGame();
        }
        this.goNextRound();
    }

    goNextRound() {
        this.currentItem = '';
        clearTimeout(this.countdown);

        if (!this.stack.length) return this.endGame();
        this.status = 'drawing_item';


        this.countdown = setTimeout(this.drawItem, DRAW_ITEM_TIMEOUT);

        // send the current status of the game to the sockets in the client side
        // ...
    }

    endGame() {
        // end game & announce the winner
    }


    /** shuffle the items in the stack - thank you stackoverflow */
    shuffle(arr: string[]) {
        let currentIndex = arr.length, temporaryValue: string, randomIndex: number;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = arr[currentIndex];
            arr[currentIndex] = arr[randomIndex];
            arr[randomIndex] = temporaryValue;
        }
        return arr;
    }
}

// const newGame = new Game({}, 'some_id', 'id', 50);
// newGame.addPlayer('player1');
// newGame.addPlayer('player2');

// console.log('movies', newGame.stack);
// console.log('p1', newGame.players[0].card)
// console.log('p2', newGame.players[1].card)



// games' keys are roomIds
const games: { [key: string]: Game } = {};

const socketHandler = (socket: any, io: any) => {
    // const rooms = io.of("/").adapter.rooms;

    // create new game
    socket.on(SOCKET_EVENTS.CREATE_NEW_GAME, (data: { playerName: string, stackSize: number }) => {
        console.log(data.playerName);

        // create game & players, send back the status & message
        const roomId = Date.now().toString(32) + (Math.random() * 1000000).toString(32);
        console.log('room ID', roomId);
        const newGame = new Game(io, roomId, socket.id, data.stackSize ?? 50);
        const playerName = newGame.addPlayer(socket.id, data.playerName);

        socket.roomId = roomId;
        socket.join(roomId);

        io.to(roomId).emit(SOCKET_EVENTS.GAME_CREATED, { playerName, roomId });

        games[roomId] = newGame;
    });


    // add another player into lobby
    socket.on(SOCKET_EVENTS.JOIN_LOBBY, (data: { playerName: string, roomId: string }) => {
        const game = games[data.roomId];
        if (!game) {
            io.to(socket.id).emit(SOCKET_EVENTS.LOBBY_NOT_FOUND);
            return;
        }
        socket.join(data.roomId);
        socket.roomId = data.roomId;
        if (game.getPlayers().length < MAX_PLAYER_COUNT) {
            game.addPlayer(socket.id, data.playerName);
            const players = game.getPlayers();
    
            io.to(socket.id).emit(SOCKET_EVENTS.LOBBY_JOINED);
            io.to(data.roomId).emit(SOCKET_EVENTS.SYNC_LOBBY, ({ players }));
            return;
        }
        io.to(socket.id).emit(SOCKET_EVENTS.LOBBY_FULL);
    });


    // disconnect the socket
    socket.on("disconnect", () => {
        console.log(socket.id, 'disconnected');

        const game = games[socket.roomId];
        
        // remove the disconnected player from the game
        if (game) {
            game.removePlayer(socket.id);
            io.to(socket.roomId).emit(SOCKET_EVENTS.SYNC_LOBBY, {players: game.getPlayers()});
            
            // if everyone has disconnected, delete the game instance
            if (!game.getPlayers().length) {
                // console.log('games', games);
                console.log('everyone disconnected, disbanding the game');
                delete games[socket.roomId];
            }
        }

    });
}


export default socketHandler;