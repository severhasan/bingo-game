import ReactCanvasConfetti from 'react-canvas-confetti';
import BingoTable from '../../components/BingoTable/BingoTable';
import StatusBar from '../../components/StatusBar/StatusBar';
import socket from '../../utils/Socket'
import { useRouter } from 'next/router'


import { MOVIES, FREE_BINGO_TEXT, SOCKET_EVENTS } from '../../constants';
import { CSSProperties, useEffect, useState } from 'react';

const MAX_ROUNDS = 48;
const COUNTDOWN_TIME = 1000;
const DRAW_ITEM_TIME = 200;

const styles: CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0
}

// helper function to randomize the items
const shuffleList = (arr: string[]) => {
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

let animationInstance = null;

const Game = ({ gameMode = 'single_player', playerCount = 1 }: GameComponentProps) => {
    const router = useRouter();

    const [status, setStatus] = useState('game_starting' as GameStatus)
    const [movies, setMovies] = useState([] as string[]);
    const [playerCard, setPlayerCard] = useState([] as string[]);
    const [currentItem, setCurrentItem] = useState('');
    const [selectedMovies, setSeletedMovies] = useState([FREE_BINGO_TEXT] as string[]);
    const [countDown, setCountDown] = useState({} as any);
    const [bingoCount, setBingoCount] = useState(0);
    const [remainingRounds, setRemainingRounds] = useState(MAX_ROUNDS);
    const [timeoutDuration, setTimeoutDuration] = useState(0);
    const [playerName, setPlayerName] = useState('');
    const [players, setPlayers] = useState([]);
    const [winner, setWinner] = useState('');


    const reset = () => {
        setStatus('game_starting');
        setSeletedMovies([FREE_BINGO_TEXT]);
        clearTimeout(countDown);
        setBingoCount(0);
        setCurrentItem('');
        setRemainingRounds(MAX_ROUNDS);

        // write the better resetting logic.
        if (gameMode === 'multiplayer') {
            router.push('/');
        }
    }

    const drawItem = (movieList: string[] = []) => {
        // const moviesLeft = playerCard.filter(movie => ![selectedMovies, FREE_BINGO_TEXT].includes(movie));
        console.log('movies', movies, movieList);
        if (!movies.length && !movieList.length) return;

        let randomItem = movies[0];
        let randomIndex = 0;
        const newMovies = movies.length ? [...movies] : [...movieList];
        if (newMovies.length > 1) {
            randomIndex = Math.round(Math.random() * (movies.length - 1));
        }
        randomItem = newMovies.splice(randomIndex, 1)[0];

        setMovies(newMovies);

        setCurrentItem(randomItem);
        setStatus('item_selected');
        if (movies.length - selectedMovies.length > 0) {
            const cd = setTimeout(() => {
                setStatus('drawing_item');
                proceed('drawing_item');
            }, COUNTDOWN_TIME)
            setCountDown(cd);
        }
        setRemainingRounds(remainingRounds - 1);
        // proceed('item_selected');
    }

    const proceed = (newStatus) => {
        switch (newStatus) {
            case 'game_starting':
                // this will ensure that the game is winnable by either side as slong as maximum rounds are kept are optimal
                // const itemCount = gameMode === 'single_player' ? 24 : playerCount * 24;
                const itemCount = 48;

                // shuffle movies so that it will not recieve the same items every round
                const newMovies = shuffleList([...MOVIES]);
                const movieList = newMovies.slice(0, itemCount);

                const shuffledList = shuffleList([...movieList]);
                const playerCard = shuffleList([...shuffledList.slice(0, 24)]);
                playerCard.splice(12, 0, FREE_BINGO_TEXT);

                setMovies(shuffledList);
                setPlayerCard(playerCard);
                proceed('drawing_item')
                setStatus('drawing_item');
                break;

            case 'drawing_item':
                setCurrentItem(''); // the user should not be able to choose after timeout is cleared
                const movieArr = shuffleList([...MOVIES]);
                setTimeout(() => drawItem(movieArr), DRAW_ITEM_TIME);
                break;
        }
    }

    useEffect(() => {
        if (gameMode === 'multiplayer') {
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
                        console.log('winner', data.winner);
                        setWinner(data.winner);
                        if (data.winner === playerName) {
                            console.log('data.winner & playerName')
                            console.log(data.winner, playerName);
                        }
                    }
                    if (data.isGameStarting) {
                        setPlayerCard(data.card);
                        setMovies(data.card);
                    }
                }
            });
            socket.on(SOCKET_EVENTS.MATCH_UPDATE, (data: { matches: string[], bingoCount: number, newBingo: boolean }) => {
                setSeletedMovies(data.matches);
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
        }
        if (gameMode === 'single_player') {
            proceed('game_starting');
        }

    }, []);

    const selectItem = (item: string) => {
        if (selectedMovies.includes(item)) return;
        if (item !== currentItem) return;

        if (gameMode === 'single_player') {
            clearTimeout(countDown);
            const newSelectedMovies = [...selectedMovies, item];
            setSeletedMovies(newSelectedMovies);

            // do not let get all of the items
            if (remainingRounds <= 0) {
                // console.log('newSelectedMovies', newSelectedMovies.length)
                return setStatus('game_finished');
            }

            if (movies.length > 0) {
                setStatus('drawing_item');
            } else {
                setStatus('game_finished');
            }

            // check for bingos
            checkBingos(newSelectedMovies);
        } else if (gameMode === 'multiplayer') {
            console.log('sending selectitem', item);
            socket.emit(SOCKET_EVENTS.SELECT_ITEM, ({ item }));
        }
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
        // console.log('bingoCount', newBingoCount);
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
                    />
                </div>
                <div>
                    <BingoTable
                        playerCard={playerCard}
                        selectedItems={selectedMovies}
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