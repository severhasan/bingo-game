import ReactCanvasConfetti from 'react-canvas-confetti';
import BingoTable from '../../components/BingoTable/BingoTable';
import StatusBar from '../../components/StatusBar/StatusBar';
import socket from '../../utils/Socket'
import { useRouter } from 'next/router'
import Bingo from '../../utils/Bingo';


import { FREE_BINGO_TEXT, SOCKET_EVENTS, COUNTDOWN_TIMEOUT } from '../../constants';
import { CSSProperties, useEffect, useState } from 'react';

const MAX_ROUNDS = 48;
const COUNTDOWN_TIME = 20000;
const COMPUTER_COUNTDOWN_TIME = 5000;
const DRAW_ITEM_TIME = 3000;

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

    const [status, setStatus] = useState('game_starting' as GameStatus)
    const [stack, setStack] = useState([] as string[]);
    const [playerCard, setPlayerCard] = useState([] as string[]);
    const [currentItem, setCurrentItem] = useState('');
    const [matches, setMatches] = useState([FREE_BINGO_TEXT] as string[]); // matching items
    const [countDown, setCountDown] = useState(null);
    const [bingoCount, setBingoCount] = useState(0);
    const [remainingRounds, setRemainingRounds] = useState(MAX_ROUNDS);
    const [timeoutDuration, setTimeoutDuration] = useState(COUNTDOWN_TIMEOUT);
    const [playerName, setPlayerName] = useState('player');
    const [players, setPlayers] = useState([]); // for multiplayer
    const [winner, setWinner] = useState('');
    const [isListening, setListening] = useState(false);

    const [computerCard, setComputerCard] = useState([] as string[]);
    const [computerMatches, setComputerMatches] = useState([FREE_BINGO_TEXT] as string[])

    // single player settings
    const [uniqueSelection, setUniqueSelection] = useState(false);
    const [uniqueCards, setUniqueCards] = useState(true);


    const reset = () => {
        setStatus('game_starting');
        setMatches([FREE_BINGO_TEXT]);
        clearTimeout(countDown);
        setBingoCount(0);
        setCurrentItem('');
        setRemainingRounds(MAX_ROUNDS);

        // write the better resetting logic.
        if (gameMode === 'multiplayer') {
            router.push('/');
        }
    }

    const drawItem = () => {
        // console.log('stack', stack.length);
        if (!stack.length) return setStatus('game_finished');
        
        const { newStack, randomItem } = Bingo.pickRandomItem(stack);
        
        setStack(newStack);
        setCurrentItem(randomItem);
        setStatus('item_selected');
        if (playerCard.includes(randomItem)) {
            const cd = setTimeout(() => {
                setStatus('drawing_item');
            }, COUNTDOWN_TIME)
            setCountDown(cd);
        } else {
            const cd = setTimeout(() => {
                setComputerMatches([...computerMatches, randomItem]);
                if (computerMatches.length === 24) {
                    setWinner('Computer');
                    setStatus('game_finished');
                } else {
                    setStatus('computer_picked_item');
                }
            }, COUNTDOWN_TIME / 2 > 5 ? 5000 : COUNTDOWN_TIME / 2);
            setCountDown(cd)
        }
        setRemainingRounds(remainingRounds - 1);
    }

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
            switch(status) {
                case 'game_starting':
                    // generate new game and set states
                    const { computerCard, playerCard, stack } = Bingo.generateNewGame();
    
                    setStack(stack);
                    setPlayerCard(playerCard);
                    setComputerCard(computerCard);
                    setStatus('drawing_item');
                    break;
                case 'drawing_item':
                    setCurrentItem(''); // the user should not be able to choose after timeout is cleared
                    setTimeout(() => drawItem(), DRAW_ITEM_TIME);
                    break;
                case 'computer_picked_item':
                    setCurrentItem('');
            }
        }

    }, [status]);

    const selectItem = (item: string) => {
        if (matches.includes(item)) return;
        if (item !== currentItem) return;

        if (gameMode === 'single_player') {
            clearTimeout(countDown);
            const newMatches = [...matches, item];
            setMatches(newMatches);

            // do not let get all of the items if there is a remaining rounds is on
            // if (remainingRounds <= 0) {
            //     // console.log('newSelectedMovies', newSelectedMovies.length)
            //     return setStatus('game_finished');
            // }

            checkBingos(newMatches);
            if (newMatches.length === 25) {
                setWinner('player');
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
        setBingoCount(newBingoCount);
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


    return (
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
                        remainingRounds={remainingRounds}
                        status={status}
                        movie={currentItem}
                        bingoCount={bingoCount}
                        timeoutDuration={timeoutDuration}
                        goNextRound={goNextRound}
                        bothCardsIncludeMovie={playerCard.includes(currentItem) && computerCard.includes(currentItem)}
                        uniqueCards={uniqueCards}
                        uniqueSelection={uniqueSelection}
                    />
                </div>
                <div>
                    <BingoTable
                        playerCard={playerCard}
                        selectedItems={matches}
                        selectItem={selectItem}
                    />
                </div>

                <ReactCanvasConfetti
                    refConfetti={getInstance}
                    style={styles}
                />
                </>
            }
        </div>
    )
}

export default Game;