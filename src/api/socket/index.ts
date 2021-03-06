import {
    MOVIES,
    SOCKET_EVENTS,
    RANDOM_MOVIE_CHARACTERS,
    MAX_PLAYER_COUNT,
    FREE_BINGO_TEXT,
    DRAW_ITEM_TIMEOUT,
    COUNTDOWN_TIMEOUT,
    UNRELATED_ITEM_MULTIPLIER,
    MAX_SCORE,
    DEFAULT_GAME_SETTINGS,
    PLAYER_ROLES,
    POSSIBLE_BINGO_SCENARIOS
} from '../../constants';
import Bingo from '../../utils/Bingo';




export class Player {
    /** the items (numbers or movie names) the player has on their card */
    private card: string[] = [];
    /** the matched items in the card */
    private matches: string[] = [FREE_BINGO_TEXT];
    private socketId: string;
    private status: PlayerStatus = 'healthy';
    name: string;
    bingos: number = 0;
    game: Game;
    score = 0;
    isReady: boolean = false;
    isConnected: boolean = false;
    role: PlayerRole;
    skillPoints = 3;
    /** scores will keep the track of the scores for each round. Indices will indicate the round of the score */
    scores: number[] = [];
    scoreLogs: ScoreLogs = {};
    
    // role based props
    /** the skill can be used on one person per round */
    isSkillUsed: boolean = false;
    isGlobalSkillUsed: boolean = false;


    constructor(socketId: string, name: string, game?: Game) {
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
    getMatches() {
        return this.matches;
    }
    getMatchesIndices() {
        return this.matches.map(match => this.card.indexOf(match));
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

        const bingos = Bingo.getBingos(this.card, this.matches);
        const newBingo = bingos > this.bingos;

        if (this.game.settings.scoring) {
            const roundScore = Bingo.calculateScore(this.game.roundStartTime, this.game.settings.timeoutDuration);
            const newBingoScore = (bingos - this.bingos) * Bingo.bingoScore;
            const newScore = this.score + newBingoScore + roundScore;
            const newScoreLogs = { ...this.scoreLogs };
            newScoreLogs[match] = { isActive: true, points: roundScore };
            this.scoreLogs = newScoreLogs;
            this.score = newScore;
        } else {
            this.score = this.matches.length - 1;
        }
        this.bingos = bingos;
        this.game.io.to(this.socketId).emit(SOCKET_EVENTS.MATCH_UPDATE, { matches: this.matches, bingoCount: this.bingos, newBingo, scoreLogs: this.scoreLogs });
        this.game.io.to(this.game.getRoomId()).emit(SOCKET_EVENTS.PLAYER_UPDATE, { newBingos: this.game.newBingos, players: this.game.getPlayerScores() });
    }
    setReady() {
        this.isReady = true;
    }
    setConnected() {
        this.isConnected = true;
    }


    checkBingo(multiple: boolean) {
        const indices = this.matches.map(match => this.card.indexOf(match));
        let isBingo = false;
        let bingoCount = 0;
        for (const scenario of POSSIBLE_BINGO_SCENARIOS) {
            const matchingIndices = indices.filter(i => scenario.includes(i));
            if (scenario.length === matchingIndices.length) {
                if (multiple) {
                    bingoCount++;
                } else {
                    isBingo = true;
                    break;
                }
            }
        }
        if (multiple) {
            const isNewBingo = bingoCount > this.bingos;
            this.bingos = bingoCount;
            return isNewBingo;
        }
        if (isBingo) {
            this.bingos = 1;
        }
        return isBingo;
    }

    getSocketId() {
        return this.socketId;
    }

    // if selfheal is used before selecting an item, the player will be able to get more than MAX_SCORE. This is by the game design & player strategy.
    addScore(score: number, item?: string) {
        // this.scores.push(score);
        // this.score = this.scores.reduce((acc, score) => acc + score, 0);
        if (item) {
            this.scoreLogs[item].points += score;
        }
        this.score += score;
    }

    reset(card: string[]) {
        this.card = card;
        this.matches = [];
    }


    // role based methods
    healSelf(item: string) {
        const diff = MAX_SCORE - this.scoreLogs[item].points;
        if (diff === 0) {
            this.scoreLogs[item].points += MAX_SCORE;
            this.score += MAX_SCORE;
        } else {
            this.scoreLogs[item].points = MAX_SCORE;
            this.score += diff;
        }
        // const currentScore = this.scores[round];
        // const heal: PlayerHeal = { type: 'self', score: 0, round };

        // if (currentScore === undefined) {
        //     this.score += MAX_SCORE;
        //     heal.score = MAX_SCORE;
        // } else {
        //     this.score += MAX_SCORE - currentScore;
        //     heal.score = MAX_SCORE - currentScore;
        // }
        // // this.heals.push(heal);
        // this.skillPoints -= 1;
        // this.isSkillUsed = true;
    }

    cursePlayer(round: number, type: PlayerCurseType, influence: PlayerCurseInfluence) {
        if (this.isGlobalSkillUsed && influence === 'global') return;

        // this.curses.push({ round, type, influence });
    }
    useSkill() {
        this.isSkillUsed = true;
        this.skillPoints -= 1;
    }
    resetSkillUsed() {
        this.isSkillUsed = false;
    }
}

class Game extends Bingo {
    /** technically, there should be a limit to how many players can be in a game since the number of items (numbers/movies) will be limited in this version */
    private players: Player[] = [];
    /** room id of socket io where the players will be in */
    private roomId: string;
    /** the (number/movie) list where the items will be picked from on each round */
    private stack: string[];
    private creatorSocketId: string;
    tasks: GameTask[] = [];
    /** the io instance of the server */
    io: any;
    round = 0;
    winner: Player;
    status: GameStatus = 'not_started';
    currentItem: string;
    /** Lucky can decide the fate of the next round */
    nextRoundItem: string;
    /** Lucky can set traps for sinisters. Traps will contain the sinisters' socket id */
    traps: string[] = [];
    /** role types of players. Each player will have one role */
    playerRoles: PlayerRole[] = [];
    /** indices of selectedRoles */
    selectedRoles: number[] = [];
    /** id of timeout */
    countdown: NodeJS.Timeout;
    // game settings
    settings: GameSettings = DEFAULT_GAME_SETTINGS;
    isTesting: boolean = false;
    /** newBingos keep the new bingos (of the players with their index position in this.players) in the current round */
    newBingos: number[] = [];
    /** round start time in millisecons as in Date.now */
    roundStartTime = 0;

    constructor(io: any, roomId: string, creatorSocketId: string, settings: GameSettings) {
        super();
        this.roomId = roomId;
        this.io = io;
        this.creatorSocketId = creatorSocketId;
        this.settings = settings;
    }

    /** get creator id for validation */
    getCreatorId() {
        return this.creatorSocketId;
    }

    /** reset the game if the players want to play again */
    reset() {
        const shuffledStack = Game.shuffle(MOVIES);
        // this.stack = shuffledStack.slice(0);
        this.startGame();

        this.players.forEach(player => {
            player.reset(this.generateNewCard());
        });
    }

    generateNewCard() {
        const newCard = Game.shuffle([...this.stack]).slice(0, 24);
        newCard.splice(12, 0, FREE_BINGO_TEXT);
        return newCard;
    }

    getRoomId() {
        return this.roomId;
    }
    /** get the socket ids in a room */
    getRoom() {
        return this.io.of("/").adapter.rooms.get(this.roomId);
    }


    /** get player by their socket id */
    getPlayer(socketId: string) {
        const player = this.players.find(player => player.getSocketId() === socketId);
        return player;
    }
    /** get the list of player names */
    getPlayers() {
        return this.players.map(player => player.getName());
    }
    getPlayerScores(): ScoreBoardPlayer[] {
        return this.players.map(player => ({ bingos: player.bingos, role: player.role, matches: player.getMatchesIndices(), name: player.getName(), score: player.score }));
    }

    /** add new player to the game */
    addPlayer(socketId: string, name: string = '') {
        if (this.players.length >= MAX_PLAYER_COUNT) return;

        const possibleNames = [name, `${name} - 1`, `${name} - 2`, `${name} - 3`];
        const playersWithTheSameName = this.players.filter(player => possibleNames.includes(player.getName()));
        let playerName = name;
        if (playersWithTheSameName.length && playerName) {
            playerName += ` - ${playersWithTheSameName.length}`;
        }

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
        const player = this.getPlayer(playerSocketId);
        if (player) {
            player.setReady();
        }
    }
    setPlayerConnected(playerSocketId: string) {
        const player = this.getPlayer(playerSocketId);
        if (player) {
            player.setConnected();
        }
    }

    allPlayersReady() {
        return this.players.filter(player => player.isReady).length === this.players.length;
    }
    allPlayersConnected() {
        this.players.forEach(p => { console.log(p.getSocketId(), p.isConnected) });
        return this.players.filter(player => player.isConnected).length === this.players.length;
    }

    generatePlayerRoles() {
        console.log('generating roles');
        this.status = 'role_selection';
        const playerRoles = [];
        let roles: PlayerRole[] = ['lucky', 'pollyanna', 'sinister'];
        let count = 0;
        while (count < this.players.length) {
            let randomRole: PlayerRole;
            if (roles.length === 0) {
                roles = ['lucky', 'pollyanna', 'sinister'];
            }
            if (roles.length === 1) {
                randomRole = roles[0];
                roles = [];
            } else {
                const randomIndex = (Math.round(Math.random() * (roles.length - 1)));
                randomRole = roles.splice(randomIndex, 1)[0];
            }
            playerRoles.push(randomRole);
            count++
        }
        this.playerRoles = playerRoles;
        this.io.to(this.roomId).emit(SOCKET_EVENTS.DISPLAY_ROLE_SELECTION, ({ playerCount: this.players.length }));
    }
    setPlayerRole(socketId: string, index: number) {
        console.log('setting Player role');
        this.selectedRoles.push(index);
        
        const player = this.getPlayer(socketId);
        const role = this.playerRoles[index];
        player.setRole(role);
        this.syncLobby();

        // const playerIndex = this.players.findIndex(player => player.getSocketId() === socketId);
        // const playerName = player.getName();

        // let Role = Player;
        // switch (role) {
        //     case 'lucky':
        //         Role = Lucky;
        //         break;
        //     case 'pollyanna':
        //         Role = Pollyanna;
        //         break;
        //     case 'sinister':
        //         Role = Sinister;
        //         break;
        // }

        // update creating new player logic so that we are not creating it for a second time here. :/
        // const newPlayer = new Role(socketId, playerName, this);
        // this.players.splice(playerIndex, 1, newPlayer);
    }


    /** Sync game server status with the client game status */
    syncLobby() {
        this.players.forEach((player) => {
            const data = {
                creatorId: this.getCreatorId(),
                players: this.getPlayers(),
                selectedRoles: this.selectedRoles,
                isPlayerReady: player.isReady,
                role: player.role,
            };
            this.io.to(player.getSocketId()).emit(SOCKET_EVENTS.SYNC_LOBBY, data);
        })
    }


    /** set status and start the game on client side */
    startGame() {
        console.log('game starting...');
        if (!['not_started', 'role_selection'].includes(this.status)) return;
        // handle the game stack, player cards and the items.
        const shuffledStack = Game.shuffle(MOVIES);
        let stack = [];

        // generate new cards for each player and set their cards in accordance witht he game settings
        for (let i = 0; i < this.players.length; i++) {
            let playerCard: string[];
            if (this.settings.uniqueCards) {
                playerCard = shuffledStack.slice((i * 24), (i + 1) * 24);
            } else {
                const newShuffle = Game.shuffle([...MOVIES]);
                playerCard = newShuffle.slice(0, 24);
            }
            // add free bingo
            playerCard.splice(12, 0, FREE_BINGO_TEXT);
            stack = [...stack, ...playerCard];
            this.players[i].setCard(playerCard);
        }

        // currently, we do not want the stack to have unrelated items, so...
        const stackSet = new Set(stack);
        stackSet.delete(FREE_BINGO_TEXT);
        this.stack = [...stackSet];

        if (this.isTesting) {
            this.stack = [...this.players[0].getCard().filter(item => item !== FREE_BINGO_TEXT), ...this.stack];
        }


        // start game & draw an item
        this.status = 'drawing_item';
        setTimeout(this.drawItem.bind(this), DRAW_ITEM_TIMEOUT * 1000);

        // send each player their card info
        this.players.forEach(player => {
            this.io.to(player.getSocketId()).emit(SOCKET_EVENTS.STATUS_UPDATE, { status: this.status, currentItem: this.currentItem, isGameStarting: true, card: player.getCard(), playerName: player.getName(), settings: this.settings, newBingos: this.newBingos, players: this.getPlayerScores() });
        })
    }

    drawItem() {
        // console.log('drawing item', this.stack.length);
        if (!this.stack.length) return this.endGame();

        this.newBingos = [];

        // technically, no need for randomness since it was already shuffled in the first place, and the player cards do not match the movile list, but yeah, why not...
        const newMovies = [...this.stack];
        const randomIndex = this.isTesting ? 0 : Math.round(Math.random() * (this.stack.length - 1));
        const randomItem = newMovies[randomIndex];

        this.stack.splice(randomIndex, 1);
        this.currentItem = randomItem;
        this.status = 'item_selected';

        // console.log('countdown', this.settings.timeoutDuration * 1000);
        this.countdown = setTimeout(this.goNextRound.bind(this), this.settings.timeoutDuration * 1000);
        if (this.settings.scoring) {
            this.roundStartTime = Date.now();
        }

        // send the item drawn to the players in the room
        this.io.to(this.roomId).emit(SOCKET_EVENTS.STATUS_UPDATE, { status: this.status, currentItem: this.currentItem, newBingos: this.newBingos, players: this.getPlayerScores() });
    }

    matchItem(match: string, socketId: string) {
        // console.log('matchitem', match, socketId);
        if (this.currentItem !== match || this.status !== 'item_selected') return;

        const player = this.getPlayer(socketId);
        player.addMatch(match);

        if (this.checkWinner()) {
            return this.endGame();
        }

        if (this.settings.uniqueSelection) {
            return this.goNextRound();
        }

        const isAllChecked = this.checkAllRoundMatches(match);
        if (!this.settings.uniqueSelection && isAllChecked) {
            return this.goNextRound();
        }
    }
    checkWinner() {
        let winner: Player;
        if (this.settings.scoring) {
            let gameEnded = false;
            if (this.settings.multipleBingos) {
                gameEnded = this.players.filter(player => player.getMatches().length === 25).length > 0;
            } else {
                gameEnded = this.players.filter(player => player.bingos === 1).length > 0;
            }

            if (gameEnded) {
                let maxScore = 0;
                this.players.forEach((player) => {
                    if (player.score > maxScore) {
                        maxScore = player.score;
                        winner = player;
                    }
                });
            }
        } else {
            for (const player of this.players) {
                if (!this.settings.multipleBingos && player.bingos) {
                    winner = player;
                    break;
                }

                if (player.getMatches().length === 25) {
                    winner = player;
                    break;
                }
            }
        }
        this.winner = winner;
        return winner;
    }
    checkAllRoundMatches(item: string) {
        let isAllChecked = true;
        for (const player of this.players) {
            if (player.getCard().includes(item) && !player.getMatches().includes(item)) {
                isAllChecked = false;
                break;
            }
        }
        return isAllChecked;
    }

    // add maxRound logic...
    goNextRound() {
        // if (this.round >= this.settingsMaxRounds) ...
        if (!this.stack.length) return this.endGame();
        this.currentItem = '';
        this.round++;
        clearTimeout(this.countdown);

        this.status = 'drawing_item';
        this.countdown = setTimeout(this.drawItem.bind(this), DRAW_ITEM_TIMEOUT * 1000);

        // send the current status of the game to the sockets in the client side
        // ...
        this.io.to(this.roomId).emit(SOCKET_EVENTS.STATUS_UPDATE, { status: this.status });
    }

    endGame() {
        // end game & announce the winner
        console.log('ending game');
        this.status = 'game_finished';
        this.io.to(this.roomId).emit(SOCKET_EVENTS.STATUS_UPDATE, { status: this.status, players: this.getPlayerScores(), winner: this.winner && `${this.winner.getName()} is the winner.` });
        // this.players.forEach(player => {
        //     this.io.to(player.getSocketId()).emit(SOCKET_EVENTS.STATUS_UPDATE, { status: this.status, winner: this.winner.getName() });
        // });
        this.stack = [];
        this.players = [];
        clearTimeout(this.countdown);
        this.countdown = null;
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

    // FOR TESTING PURPOSES
    setTesting() {
        this.isTesting = true;
    }

    // role based methods
    useSkill(socket1: string, socket2: string, skill: PlayerSkill, selectedItem: string) {
        // this.score += friendsScore;
        // this.heals.push({ round, score: friendsScore, type: 'friend' });
        const player = this.players.find(player => player.getSocketId() === socket1);
        if (!player) return;

        if (player.skillPoints <= 0 || !['drawing_item', 'item_selected'].includes(this.status)) {
            return;
        }

        let targetPlayer: Player;
        if (socket2) {
            targetPlayer = this.players.find(player => player.getSocketId() === socket2);
        }
        
        switch (skill) {
            case 'stun':
            case 'distort':
            case 'global_curse':
                if (this.status === 'drawing_item') {
                    this.tasks.push({player: socket1, target: socket2, skill });
                }
                break;
            case 'heal_self':
                if (this.status === 'item_selected' && player.scoreLogs[this.currentItem]) {
                    player.healSelf(this.currentItem);
                } else {
                    this.tasks.push({player: socket1, target: socket2, skill });
                }
                break;
            case 'heal_player':
                if (this.status === 'item_selected' && targetPlayer.scoreLogs[this.currentItem]) {
                    targetPlayer.healSelf(this.currentItem);
                    player.addScore(targetPlayer.scoreLogs[this.currentItem].points);
                } else {
                    this.tasks.push({player: socket1, target: socket2, skill });
                }
                break;
            case 'select_next_round_item':
                this.nextRoundItem = selectedItem;
                break;
            case 'set_trap':
                this.traps.push(socket2);
                break;
        }
        player.useSkill();
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
    socket.on(SOCKET_EVENTS.CREATE_NEW_GAME, (data: { playerName: string, settings: GameSettings }) => {
        console.log(data.playerName);

        // create game & players, send back the status & message
        const roomId = Date.now().toString(32); // + (Math.random() * 1000000).toString(32);
        console.log('room ID', roomId);

        // conver seconeds into milliseconds before setting the settings
        const settings = { ...data.settings };
        const newGame = new Game(io, roomId, socket.id, settings);
        const playerName = newGame.addPlayer(socket.id, data.playerName.trim());

        socket.roomId = roomId;
        socket.join(roomId);

        io.to(roomId).emit(SOCKET_EVENTS.GAME_CREATED, { playerName, roomId, settings: data.settings });

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
            game.syncLobby();
            return;
        }
        io.to(socket.id).emit(SOCKET_EVENTS.LOBBY_FULL);
    });

    // triggers the events to start the game on the backend, starting the game will still require the connection (playerReady status) of all players on the game: '/game/roomId'
    socket.on(SOCKET_EVENTS.START_GAME, (data: { settings: GameSettings }) => {
        // console.log('received event to start multiplayer game');
        // console.log('roomid:', socket.roomId);
        const game = games[socket.roomId];
        if (socket.id !== game.getCreatorId()) return;

        // set player roles & send clients their roles
        if (game.settings.roles) {
            game.generatePlayerRoles()
        } else {
            // the settings might have been changd in the lobby
            const newSettings: GameSettings = { ...data.settings };
            game.setSettings(newSettings);
            io.to(socket.roomId).emit(SOCKET_EVENTS.START_GAME, ({ roomId: socket.roomId }));
        }
    });

    // player ready will only be used for when roles are enabled
    socket.on(SOCKET_EVENTS.PLAYER_READY, () => {
        // console.log(socket.id, 'is ready');
        const game = games[socket.roomId];
        if (game && game.settings.roles) {
            game.setPlayerReady(socket.id);
            game.syncLobby();

            if (game.allPlayersReady()) {
                // game.startGame();
                // this will start game on front-end, and when everyone connects, the game will start.
                io.to(socket.roomId).emit(SOCKET_EVENTS.START_GAME, ({ roomId: socket.roomId }));
            }
        }
    });
    // player will be directed to game/game_id page & when everyone has connected, game should start
    socket.on(SOCKET_EVENTS.PLAYER_CONNECTED_TO_GAME, () => {
        console.log(socket.id, 'has connected');
        const game = games[socket.roomId];
        if (game) {
            game.setPlayerConnected(socket.id);

            if (game.allPlayersConnected()) {
                // game.setTesting();
                game.startGame();
            }
        }
    });

    socket.on(SOCKET_EVENTS.SELECT_ITEM, (data: { item: string }) => {
        const game = games[socket.roomId];
        // console.log('select item server', data);
        if (game) {
            game.matchItem(data.item, socket.id);
        }
    });

    socket.on(SOCKET_EVENTS.SELECT_ROLE, (data: { index: number }) => {
        console.log('in select_role?');
        const game = games[socket.roomId];
        if (!game) return;

        game.setPlayerRole(socket.id, data.index);
    })

    // disconnect the socket
    socket.on("disconnect", () => {
        console.log(socket.id, 'disconnected');

        const game = games[socket.roomId];

        // remove the disconnected player from the game
        if (game) {
            game.removePlayer(socket.id);
            if (game.getPlayers().length === 1 && game.status !== 'not_started') {
                console.log('everyone disconnected, ending the game');
                game.endGame();
            }

            // if everyone has disconnected, delete the game instance
            if (!game.getPlayers().length) {
                // console.log('games', games);
                game.endGame();
                console.log('everyone disconnected, disbanding the game');
                delete games[socket.roomId];
            }

            game.syncLobby();
        }

    });
}


export default socketHandler;