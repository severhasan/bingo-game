import { MOVIES } from '../../constants';

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

    constructor(card: string[], socketId: string) {
        this.card = card;
        this.socketId = socketId;
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
    private creatorId: string;
    winner: Player;
    status: GameStatus;
    currentItem: string;
    /** id of timeout */
    countdown: NodeJS.Timeout;

    constructor(io: any, roomId: string, creatorId: string, public stackSize: number) {
        this.roomId = roomId;
        this.io = io;
        this.creatorId = creatorId;

        const shuffledStack = this.shuffle(MOVIES);
        this.stack = shuffledStack.slice(0, this.stackSize);
    }

    /** reset the game if the players want to play again */
    reset() {
        const shuffledStack = this.shuffle(MOVIES);
        this.stack = shuffledStack.slice(0, this.stackSize);
        this.startGame();

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

    /** add new player to the game */
    addPlayer(socketId: string) {
        if (this.players.length >= MAX_PLAYER_COUNT) return;

        const newCard = this.generateNewCard();
        const newPlayer = new Player(newCard, socketId);
        this.players.push(newPlayer);

        // send the players' info to the sockets
        // ...
    }


    /** set status and start the game on client side */
    startGame() {
        this.status = 'drawing_item';
        setTimeout(this.drawItem, DRAW_ITEM_TIMEOUT);

        // send sockets the status & message
        // ...
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

        setTimeout(this.goNextRound, COUNTDOWN_TIMEOUT);

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



const games: { [key: string]: Game } = {};

const socketHandler = (socket: any, io: any) => {
    // either with send()
    socket.send("Hello!");

    socket.join('room1');
    // socket.gameRoom = 'room1';
    // console.log('socket', socket.rooms);
    // console.log('socket', socket.gameRoom);

    const rooms = io.of("/").adapter.rooms;
    // console.log('rooms:', rooms.get('room1'));

    io.to('room1').emit("greetings", "Hey!", { roomSize: rooms.get('room1').size, "ms": "jane" }, Buffer.from([4, 3, 3, 1]))

    // or with emit() and custom event names
    // socket.emit("greetings", "Hey!", { "ms": "jane" }, Buffer.from([4, 3, 3, 1]));

    // handle the event sent with socket.send()
    socket.on("message", (data) => {
        console.log(data);
    });

    // handle the event sent with socket.emit()
    socket.on("salutations", (elem1, elem2, elem3) => {
        console.log(elem1, elem2, elem3);
    });

    socket.on("disconnect", () => {
        console.log(socket.id, 'disconnected');
        
        // remove the game from the games if all users have disconnected
        // ...
    });
}


export default socketHandler;