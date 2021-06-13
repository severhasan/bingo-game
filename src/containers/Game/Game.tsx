import ReactCanvasConfetti from 'react-canvas-confetti';
import BingoTable from '../../components/BingoTable/BingoTable';
import StatusBar from '../../components/StatusBar/StatusBar';
import socket from '../../utils/Socket'
import { useRouter } from 'next/router'
import Bingo from '../../utils/Bingo';
import ScoreBoard from '../ScoreBoard/ScoreBoard';
import Notification from '../../components/Notification/Notification';


import { FREE_BINGO_TEXT, SOCKET_EVENTS, COUNTDOWN_TIMEOUT, DEFAULT_GAME_SETTINGS } from '../../constants';
import { CSSProperties, useEffect, useState } from 'react';
import Settings from '../../components/Settings/Settings';

const MAX_ROUNDS = 48;
const COMPUTER_COUNTDOWN_TIME = 4000;
const DRAW_ITEM_TIME = 1500;
const PLAYER_AND_BOTS_HAVE_ITEM_COUNTDOWN_TIME = 10000;

const styles: CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0
}


let animationInstance = null;

const Game = ({ gameMode = 'single_player', playerCount = 1 }: GameComponentProps) => {
    const router = useRouter();

    const [status, setStatus] = useState('not_started' as GameStatus)
    const [stack, setStack] = useState([] as string[]);
    const [playerCard, setPlayerCard] = useState([] as string[]);
    const [currentItem, setCurrentItem] = useState('');
    const [matches, setMatches] = useState([FREE_BINGO_TEXT] as string[]); // matching items
    const [countDown, setCountDown] = useState(null);
    const [botCountDown, setBotCountDown] = useState(null);
    const [bingoCount, setBingoCount] = useState(0);
    const [timeoutDuration, setTimeoutDuration] = useState(COUNTDOWN_TIMEOUT);
    const [playerName, setPlayerName] = useState('player');
    const [players, setPlayers] = useState([] as GamePlayer[]); // bots in single player mode, all players in multiplayer mode
    const [winner, setWinner] = useState(''); // winners' names;
    const [isListening, setListening] = useState(false);
    const [settings, setSettings] = useState(DEFAULT_GAME_SETTINGS as GameSettings);
    const [notificationActive, setNotificationActive] = useState(false);
    const [score, setScore] = useState(0);
    const [scoreLogs, setScoreLogs] = useState({} as ScoreLogs) // will be only used in score mode
    const [roundStartTime, setRoundStartTime] = useState(0); // Date.now

    // find bettet ways to listen to the socket
    useEffect(() => {
        if (gameMode === 'multiplayer' && !isListening) {
            // listen to the server & update game status or players
            socket.on(SOCKET_EVENTS.STATUS_UPDATE, (data: { status: GameStatus, timeoutDuration: number, currentItem?: string, isGameStarting?: boolean, card?: string[], winner?: string, playerName: string }) => {
                if (gameMode === 'multiplayer') {
                    setStatus(data.status);

                    if (data.playerName) {
                        setPlayerName(data.playerName);
                    }
                    if (data.timeoutDuration) {
                        setTimeoutDuration(data.timeoutDuration);
                    }
                    if (data.status === 'item_selected') {
                        setCurrentItem(data.currentItem);
                    }
                    if (data.winner) {
                        setWinner(data.winner);
                        // if (data.winner === playerName) {
                        //     console.log('data.winner & playerName')
                        //     console.log(data.winner, playerName);
                        // }
                    }
                    if (data.isGameStarting) {
                        setPlayerCard(data.card);
                        setStack(data.card);
                    }
                }
            });
            socket.on(SOCKET_EVENTS.MATCH_UPDATE, (data: { matches: string[], bingoCount: number, newBingo: boolean }) => {
                setMatches(data.matches);
                if (data.newBingo) {
                    fire();
                }
                if (data.bingoCount > bingoCount) {
                    setBingoCount(data.bingoCount);
                }
            });

            if (status === 'game_starting') {
                // send info & receive game data (status, players, playerCount, cards etc...)
                // ...
                socket.emit(SOCKET_EVENTS.PLAYER_CONNECTED_TO_GAME);
            }
            setListening(true);
        }
        if (gameMode === 'single_player') {
            // proceed('game_starting');
            switch (status) {
                case 'game_starting':
                    // generate new game and set states
                    const { computerCards, playerCard: newPlayerCard, stack } = Bingo.generateNewGame(settings);

                    setStack(stack);
                    setPlayerCard(newPlayerCard);
                    const bots = computerCards.map((card, index) => ({ card, bingos: 0, matches: [FREE_BINGO_TEXT], name: `Computer ${index + 1}`, score: 0 })) as GamePlayer[];
                    setPlayers(bots);
                    setStatus('drawing_item');
                    setTimeoutDuration(settings.timeoutDuration);
                    break;
                case 'drawing_item':
                    setCurrentItem(''); // the user should not be able to choose after timeout is cleared
                    setTimeout(() => drawItem(), DRAW_ITEM_TIME);
                    break;
                case 'computer_picked_item':
                    setCurrentItem('');
                    break;
                case 'game_finished':
                    clearTimeout(countDown);
                    clearTimeout(botCountDown);
                    let bingoList = [];
                    let scoreList = [];
                    let bingoMax = bingoCount;
                    let maxScore = score;

                    const finalPlayerList = [{ name: 'You', card: playerCard, matches, score, bingos: bingoCount }, ...players];
                    finalPlayerList.forEach(player => {
                        // const playerBingos = Bingo.getBingos(player.card, player.matches);
                        if (player.bingos > bingoMax) bingoMax = player.bingos;
                        if (player.score > maxScore) maxScore = player.score;
                        bingoList.push(player.bingos);
                        scoreList.push(player.score);
                    });
                    let winners = bingoList.map((bingos, index) => bingos === bingoMax ? finalPlayerList[index].name : null).filter(playerName => !!playerName);
                    if (settings.scoring) winners = scoreList.map((s, index) => s === maxScore ? finalPlayerList[index].name : null).filter(playerName => !!playerName);

                    const winnerString = winners.length === 1 ? `${winners[0] === 'You' ? 'You are' : `${winners[0]} is`} the winner!` : winners.slice(0, winners.length - 1).join(', ') + ` and ${winners.slice(-1)[0]} are the winners!`
                    setWinner(winnerString);

                    if ((settings.scoring && maxScore === score) || (!settings.scoring && bingoMax === bingoCount)) {
                        celebrateWin();
                    }
                    break;
            }
        }

    }, [status]);

    const reset = () => {
        setStatus('not_started');
        setWinner('');
        setScoreLogs({});
        setScore(0);
        setBingoCount(0);
        setRoundStartTime(0);
        setCurrentItem('');
        setMatches([FREE_BINGO_TEXT]);
        setPlayers([] as GamePlayer[]);
        // setComputerMatches([]);
        // setRemainingRounds(MAX_ROUNDS);
        clearTimeout(countDown);

        // write the better resetting logic.
        if (gameMode === 'multiplayer') {
            router.push('/');
        }
    }

    const getBotsWithTheItem = (item: string): number[] => players.map((player, index) => player.card.includes(item) ? index : -1).filter(index => index >= 0);

    const selectItemForBots = (randomItem: string) => {
        const newPlayers = [...players];
        const indicesOfBotsWithItem = getBotsWithTheItem(randomItem);
        const botsHaveSelectedItem = players.filter(player => player.matches.includes(randomItem)).length >= 1;

        if (botsHaveSelectedItem) return;
        let isWinner = false;

        if (settings.uniqueSelection) {
            const randomIndex = Math.round(Math.random() * indicesOfBotsWithItem.length - 1);
            const randomPlayer = newPlayers[randomIndex];
            const newMatches = [...randomPlayer.matches, randomItem];

            // add score
            const playerBingos = Bingo.getBingos(randomPlayer.card, newMatches);
            let newScore = newMatches.length - 1;
            if (settings.scoring) {
                const newBingoScore = (playerBingos - randomPlayer.bingos) * Bingo.bingoScore;
                newScore = randomPlayer.score + Bingo.baseBotScore + newBingoScore;
            }
            newPlayers[randomIndex] = { ...randomPlayer, bingos: playerBingos, matches: newMatches, score: newScore };
            setPlayers(newPlayers);


            if (newMatches.length === 25 || (!settings.multipleBingos && playerBingos > 0)) {
                setStatus('game_finished');
            } else {
                setStatus('computer_picked_item');
            }
        } else {
            indicesOfBotsWithItem.forEach(idx => {
                const newMatches = [...newPlayers[idx].matches, randomItem];
                let newScore = newMatches.length - 1;
                const playerBingos = Bingo.getBingos(newPlayers[idx].card, newMatches);
                if (settings.scoring) {
                    const newBingoScore = (playerBingos - newPlayers[idx].bingos) * Bingo.bingoScore;
                    newScore = newPlayers[idx].score + Bingo.baseBotScore + newBingoScore;
                }
                newPlayers[idx] = { ...newPlayers[idx], matches: newMatches, bingos: playerBingos, score: newScore };

                if (newMatches.length === 25 || (!settings.multipleBingos && playerBingos > 0)) {
                    isWinner = true;
                }
            });
            setPlayers(newPlayers);

            if (!playerCard.includes(randomItem) && !isWinner) {
                setStatus('computer_picked_item');
            }
            if (isWinner) {
                setStatus('game_finished');
            }
        }
    }

    const drawItem = () => {
        if (!stack.length) return setStatus('game_finished');

        const { newStack, randomItem } = Bingo.pickRandomItem(stack);

        setStack(newStack);
        setCurrentItem(randomItem);
        setStatus('item_selected');
        const playerHasItem = playerCard.includes(randomItem);
        const indicesOfBotsWithItem = getBotsWithTheItem(randomItem);
        const botsHaveItem = indicesOfBotsWithItem.length > 0;

        if (playerHasItem) {
            // set the timeout for the player
            const cd = setTimeout(() => {
                // setStatus('drawing_item');
                setStatus('missed_selection');
            }, settings.timeoutDuration * 1000)
            setCountDown(cd);
        }
        if (botsHaveItem) {
            let to = PLAYER_AND_BOTS_HAVE_ITEM_COUNTDOWN_TIME;
            if (!playerHasItem) to = 20;
            // computers must select the current item (maybe even before the player can select);
            const bcd = setTimeout(() => {
                selectItemForBots(randomItem);
            }, to);
            setBotCountDown(bcd);
        }
        setRoundStartTime(Date.now());
    }

    const selectItem = (item: string) => {
        if (matches.includes(item)) return;
        if (item !== currentItem) return;

        if (gameMode === 'single_player') {
            clearTimeout(countDown);
            clearTimeout(botCountDown);

            // select items for bots if they have the current item on their card
            selectItemForBots(currentItem);

            const newMatches = [...matches, item];
            setMatches(newMatches);

            const bingos = checkBingos(newMatches);
            setBingoCount(bingos);

            let newScore = newMatches.length - 1;
            if (settings.scoring) {
                const points = Bingo.calculateScore(roundStartTime, settings.timeoutDuration);

                const newBingoScore = (bingos - bingoCount) * Bingo.bingoScore;
                newScore = score + points + newBingoScore;

                const newScoreLogs = { ...scoreLogs };
                newScoreLogs[currentItem] = { isActive: true, points };
                setScoreLogs(newScoreLogs);
            }
            setScore(newScore);

            if (newMatches.length === 25 || (!settings.multipleBingos && bingos > 0)) {
                return setStatus('game_finished');
            }
            setStatus('drawing_item');
            // check for bingos
        } else if (gameMode === 'multiplayer') {
            socket.emit(SOCKET_EVENTS.SELECT_ITEM, ({ item }));
        }
    }

    const goNextRound = () => {
        setStatus('drawing_item');
    }

    // all this code is to ensure that regardless of the grid size, we can check bingos, but apparently, bingo is played on 5x5 grids
    const checkBingos = (newSelectedMovies: string[]) => {
        const count = 5;
        const selectedMoviesIndice = newSelectedMovies.map(m => playerCard.indexOf(m));
        const possibleColumns = [];
        const possibleRows = [];
        const possibleDiagonal1 = [];
        const possibleDiagonal2 = [];
        let i = 0;
        let row = 0;
        let diagonal1 = 0;
        let diagonal2 = 0;
        while (i < count) {
            let col = i;
            let k = 0;
            let colArr = [];
            let rowArr = [];
            while (k < count) {
                colArr.push(col)
                rowArr.push(row)
                col += count;
                row++
                k++;
            }

            i++;
            row = i * count;

            diagonal2 += (count - 1);
            possibleColumns.push(colArr)
            possibleRows.push(rowArr)
            possibleDiagonal1.push(diagonal1);
            possibleDiagonal2.push(diagonal2);
            diagonal1 += count + 1;
        }

        let newBingoCount = 0;
        possibleColumns.forEach(cols => {
            const matchingIndice = selectedMoviesIndice.filter(i => cols.includes(i));
            if (matchingIndice.length === count) {
                newBingoCount++;
            }
        });
        possibleRows.forEach(rows => {
            const matchingIndice = selectedMoviesIndice.filter(i => rows.includes(i));
            if (matchingIndice.length === count) {
                newBingoCount++;
            }
        });
        [possibleDiagonal1, possibleDiagonal2].forEach(diagonals => {
            const matchingIndice = selectedMoviesIndice.filter(i => diagonals.includes(i));
            if (matchingIndice.length === count) {
                newBingoCount++;
            }
        });
        if (newBingoCount > bingoCount) {
            fire();
        }
        return newBingoCount;
    }

    const getInstance = (instance) => {
        animationInstance = instance;
    };

    const makeShot = async (particleRatio, opts) => {
        animationInstance && animationInstance({
            ...opts,
            origin: { y: 0.7 },
            particleCount: Math.floor(200 * particleRatio),
        });
    }

    const celebrateWin = () => {
        let i = 0;
        const interval = setInterval(() => {
            i++;
            fire();
            if (i === 4) clearInterval(interval);
        }, 1000)
    }

    const fire = () => {
        makeShot(0.25, {
            spread: 26,
            startVelocity: 55,
        });

        makeShot(0.2, {
            spread: 60,
        });

        makeShot(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8,
        });

        makeShot(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2,
        });

        makeShot(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    }

    const generateScoreBoardPlayerInfo = (): ScoreBoardPlayer[] => {
        const playerInfo = { name: 'You', score, bingos: Bingo.getBingos(playerCard, matches), matches: matches.map(match => playerCard.indexOf(match)) };
        return [
            playerInfo,
            ...players.map(player => ({
                score: player.score,
                name: player.name,
                bingos: player.bingos,
                matches: player.matches.map(match => player.card.indexOf(match)),
            }
            ))
        ]
    }


    return (
        <div>
            {/* <Notification content='hello world' subcontent='hello' active={notificationActive} setActive={setNotificationActive} /> */}

            {gameMode === 'single_player' && status !== 'not_started' && <ScoreBoard players={generateScoreBoardPlayerInfo()} />}

            {
                gameMode === 'single_player' && status === 'not_started' ?

                    <div className='single-player-create'>
                        <h1>Create New Single Player Game</h1>
                        <div className='my-40'>
                            <button onClick={() => setStatus('game_starting')} className='btn game-button'>Start</button>
                        </div>
                        <Settings
                            gameMode={gameMode}
                            showDescription={true}
                            setSettings={setSettings}
                            settings={settings}
                        />
                    </div>
                    :
                    <div className='game-screen'>
                        {
                            gameMode === 'demo' ?
                                <div>Placeholder - This section will be updated soon.</div>
                                :
                                <>
                                    <div className='mt-40'>
                                        <StatusBar
                                            playerName={playerName}
                                            winner={winner}
                                            reset={reset}
                                            status={status}
                                            movie={currentItem}
                                            bingoCount={bingoCount}
                                            timeoutDuration={timeoutDuration}
                                            goNextRound={goNextRound}
                                            playerCardIncludesMovie={playerCard.includes(currentItem)}
                                            otherCardsIncludeMovie={players.filter(player => player.card.includes(currentItem)).length >= 1}
                                            uniqueCards={settings.uniqueCards}
                                            uniqueSelection={settings.uniqueSelection}
                                        />
                                    </div>
                                    <div>
                                        <BingoTable
                                            playerCard={playerCard}
                                            selectedItems={matches}
                                            selectItem={selectItem}
                                            scoreLogs={scoreLogs}
                                        />
                                    </div>

                                    <ReactCanvasConfetti
                                        refConfetti={getInstance}
                                        style={styles}
                                    />
                                </>
                        }
                    </div>
            }

        </div>
    )
}

export default Game;