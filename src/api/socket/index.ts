import { MOVIES, SOCKET_EVENTS, RANDOM_MOVIE_CHARACTERS, PLAYER_ROLES } from '../../constants';

const MAX_PLAYER_COUNT = 10;
const FREE_BINGO_TEXT = 'FREE BINGO';
const DRAW_ITEM_TIMEOUT = 3000;
const COUNTDOWN_TIMEOUT = 15000;
const UNRELATED_ITEM_MULTIPLIER = 2;
const MAX_SCORE = 100;
const DEFAULT_GAME_SETTINGS: GameSettings = {
    multipleBingos: false,
    roles: false,
    unrelatedItems: false,
    timeoutDuration: COUNTDOWN_TIMEOUT,
    uniqueCards: false,
    uniqueSelection: false,
    scoring: false,
    maxRounds: 0
}


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
    private matches: string[] = [];
    private socketId: string;
    private name: string;
    private status: PlayerStatus = 'healthy';
    game: Game;
    score = 0;
    isReady: boolean = false;
    role: PlayerRole;
    skillPoints = 3;
    /** scores will keep the track of the scores for each round. Indices will indicate the round of the score */
    scores: number[] = [];

    constructor(socketId: string, name: string, game: Game) {
        this.socketId = socketId;
        this.name = name;
        this.game = game;
    }

    getName() {
        return this.name;
    }
    getCard() {
        return this.card;
    }
    getStatus() {
        return this.status;
    }

    setCard(card: string[]) {
        this.card = card;
    }
    setStatus(status: PlayerStatus) {
        this.status = status;
    }
    setRole(role: PlayerRole) {
        this.role = role;
    }

    addMatch(match: string) {
        this.matches.push(match);
    }
    setReady() {
        this.isReady = true;
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

    // if selfheal is used before selecting an item, the player will be able to get more than MAX_SCORE. This is by the game design & player strategy.
    addScore(score: number) {
        this.scores.push(score);
        this.score = this.scores.reduce((acc, score) => acc + score, 0);
    }

    reset(card: string[]) {
        this.card = card;
        this.matches = [];
    }
}

class Healer extends Player {
    private heals: PlayerHeal[] = [];

    constructor(socketId: string, name: string, game: Game) {
        super(socketId, name, game);
    }

    healSelf(round: number) {
        const currentScore = this.scores[round];
        const heal: PlayerHeal = { type: 'self', score: 0, round };

        if (currentScore === undefined) {
            this.score += MAX_SCORE;
            heal.score = MAX_SCORE;
        } else {
            this.score += MAX_SCORE - currentScore;
            heal.score = MAX_SCORE - currentScore;
        }
        this.heals.push(heal);
        this.skillPoints -= 1;
    }
    supportFriend(round: number, friendsScore: number) {
        this.score += friendsScore;
        this.heals.push({ round, score: friendsScore, type: 'friend' });
    }
}
class Sinister extends Player {
    private curses: PlayerCurse[] = [];
    isGlobalSkillUsed: boolean = false;

    addCurse(round: number, type: PlayerCurseType, influence: PlayerCurseInfluence) {
        if (this.isGlobalSkillUsed && influence === 'global') return;

        this.curses.push({ round, type, influence });
    }
}
class Lucky extends Player {
    private lucks: PlayerLuck[] = [];

    // additional score may be added on heal :)
    addLuck(round: number, type: PlayerLuckType, score = 0) {
        this.lucks.push({ type, round, score });
    }
}

class Game {
    /** technically, there should be a limit to how many players can be in a game since the number of items (numbers/movies) will be limited in this version */
    private players: Player[] = [];
    /** room id of socket io where the players will be in */
    private roomId: string;
    /** the (number/movie) list where the items will be picked from on each round */
    private stack: string[];
    private creatorSocketId: string;
    /** the io instance of the server */
    io: any;
    round = 0;
    winner: Player;
    status: GameStatus = 'not_started';
    currentItem: string;
    /** id of timeout */
    countdown: NodeJS.Timeout;
    // game settings
    settings: GameSettings = DEFAULT_GAME_SETTINGS;

    constructor(io: any, roomId: string, creatorSocketId: string) {
        this.roomId = roomId;
        this.io = io;
        this.creatorSocketId = creatorSocketId;
    }

    /** get creator id for validation */
    getCreatorId() {
        return this.creatorSocketId;
    }

    /** reset the game if the players want to play again */
    reset() {
        const shuffledStack = this.shuffle(MOVIES);
        this.stack = shuffledStack.slice(0);
        this.startGame();

        this.players.forEach(player => {
            player.reset(this.generateNewCard());
        });
    }

    generateNewCard() {
        const newCard = this.shuffle([...this.stack]).slice(0, 24);
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

        const newPlayer = new Player(socketId, playerName, this);
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

    setPlayerReady(playerSocketId: string) {
        const player = this.players.find((player) => player.getSocketId() === playerSocketId)
        if (player) {
            player.setReady();
        }
    }

    allPlayersReady() {
        return this.players.filter(player => player.isReady).length === this.players.length;
    }


    /** set status and start the game on client side */
    startGame() {
        // handle the game stack, player cards and the items.
        const shuffledStack = this.shuffle(MOVIES);
        this.stack = shuffledStack.slice(0);
        // this.stack = shuffledStack.slice(0, this.stackSize);

        // generate new cards for each player and set their cards in accordance witht he game settings
        // ...
        const newCard = this.generateNewCard();

        // start game & draw an item
        this.status = 'drawing_item';
        setTimeout(this.drawItem.bind(this), DRAW_ITEM_TIMEOUT);

        // send each player their card info
        this.players.forEach(player => {
            this.io.to(player.getSocketId()).emit(SOCKET_EVENTS.STATUS_UPDATE, { status: this.status, currentItem: this.currentItem, isGameStarting: true, card: player.getCard() });
        })
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

        setTimeout(this.goNextRound.bind(this), this.settings.timeoutDuration);

        // send the item drawn to the players in the room
        // ...
        this.io.to(this.roomId).emit(SOCKET_EVENTS.STATUS_UPDATE, { status: this.status, currentItem: this.currentItem });
    }

    matchItem(match: string, socketId: string) {
        console.log('matchitem', match, socketId);
        if (this.currentItem !== match || this.status !== 'item_selected') return;

        const player = this.players.find(player => player.getSocketId() === socketId);
        player.addMatch(match);
        if (player.checkBingo()) {
            this.winner = player;
            return this.endGame();
        }
        this.goNextRound();
    }

    goNextRound() {
        if (this.round >= this.settings.maxRounds || !this.stack.length) {
            return this.endGame();
        }
        this.currentItem = '';
        this.round++;
        clearTimeout(this.countdown);


        this.status = 'drawing_item';


        this.countdown = setTimeout(this.drawItem.bind(this), DRAW_ITEM_TIMEOUT);

        // send the current status of the game to the sockets in the client side
        // ...
        this.io.to(this.roomId).emit(SOCKET_EVENTS.STATUS_UPDATE, { status: this.status });
    }

    endGame() {
        // end game & announce the winner
    }


    // settings related methods
    setSettings(settings: GameSettings) {
        this.settings = settings;
    }
    setMultipleBingos(value: boolean) {
        if (this.status !== 'not_started') return;
        this.settings.multipleBingos = value;
    }
    setRoles(value: boolean) {
        this.settings.roles = value;
    }
    setTimeoutDuration(value: number) {
        this.settings.timeoutDuration = value;
    }
    setUnrelatedItems(value: boolean) {
        this.settings.unrelatedItems = value;
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

    // handle the event sent with socket.send()
    socket.on('message', (data) => {
        console.log('message-hello', data);
    })

    // create new game
    socket.on(SOCKET_EVENTS.CREATE_NEW_GAME, (data: { playerName: string, stackSize: number }) => {
        console.log(data.playerName);

        // create game & players, send back the status & message
        const roomId = Date.now().toString(32) + (Math.random() * 1000000).toString(32);
        console.log('room ID', roomId);
        const newGame = new Game(io, roomId, socket.id);
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
            io.to(data.roomId).emit(SOCKET_EVENTS.SYNC_LOBBY, ({ players, creatorId: game.getCreatorId() }));
            return;
        }
        io.to(socket.id).emit(SOCKET_EVENTS.LOBBY_FULL);
    });

    // triggers the events to start the game on the backend, starting the game will still require the connection (playerReady status) of all players on the game: '/game/roomId'
    socket.on(SOCKET_EVENTS.START_GAME, () => {
        console.log('received event to start multiplayer game');
        console.log('roomid:', socket.roomId);
        const game = games[socket.roomId];
        if (socket.id !== game.getCreatorId()) return;

        io.to(socket.roomId).emit(SOCKET_EVENTS.START_GAME, ({ roomId: socket.roomId }));
    });

    socket.on(SOCKET_EVENTS.PLAYER_READY, () => {
        console.log(socket.id, 'is ready');
        const game = games[socket.roomId];
        if (game) {
            game.setPlayerReady(socket.id);

            if (game.allPlayersReady()) {
                game.startGame();
            }
        }
    });

    socket.on(SOCKET_EVENTS.SELECT_ITEM, (data: { item: string }) => {
        const game = games[socket.roomId];
        console.log('select item server', data);
        if (game) {
            game.matchItem(data.item, socket.id);
        }
    });

    // disconnect the socket
    socket.on("disconnect", () => {
        console.log(socket.id, 'disconnected');

        const game = games[socket.roomId];

        // remove the disconnected player from the game
        if (game) {
            game.removePlayer(socket.id);
            io.to(socket.roomId).emit(SOCKET_EVENTS.SYNC_LOBBY, { players: game.getPlayers() });

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