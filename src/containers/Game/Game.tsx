import ReactCanvasConfetti from 'react-canvas-confetti';
import BingoTable from '../../components/BingoTable/BingoTable';
import StatusBar from '../../components/StatusBar/StatusBar';
// import CSS from 'csstype';


import { MOVIES, FREE_BINGO_TEXT } from '../../constants';
import { CSSProperties, useEffect, useState } from 'react';

const MAX_ROUNDS = 20;
const COUNTDOWN_TIME = 15000;
const DRAW_ITEM_TIME = 3000;

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
    const [status, setStatus] = useState('not_started' as GameStatus)
    const [movies, setMovies] = useState([] as string[]);
    const [playerCard, setPlayerCard] = useState([] as string[]);
    const [selectedMovie, setSelectedMovie] = useState('');
    const [selectedMovies, setSeletedMovies] = useState([FREE_BINGO_TEXT] as string[]);
    const [countDown, setCountDown] = useState({} as any);
    const [bingoCount, setBingoCount] = useState(0);
    const [remainingRounds, setRemainingRounds] = useState(MAX_ROUNDS);


    const reset = () => {
        setStatus('game_starting');
        setSeletedMovies([FREE_BINGO_TEXT]);
        clearTimeout(countDown);
        setBingoCount(0);
        setSelectedMovie('');
        setRemainingRounds(MAX_ROUNDS);
    }

    const drawItem = () => {
        // const moviesLeft = playerCard.filter(movie => ![selectedMovies, FREE_BINGO_TEXT].includes(movie));
        if (!movies.length) return;

        let randomItem = movies[0];
        let randomIndex = 0;
        const newMovies = [...movies];
        if (newMovies.length > 1) {
            randomIndex = Math.round(Math.random() * (movies.length - 1));
        }
        randomItem = newMovies.splice(randomIndex, 1)[0];

        setMovies(newMovies);

        setSelectedMovie(randomItem);
        setStatus('card_selected');
        if (movies.length - selectedMovies.length > 0) {
            const cd = setTimeout(() => {
                setStatus('drawing_item');
            }, COUNTDOWN_TIME)
            setCountDown(cd);
        }
        setRemainingRounds(remainingRounds - 1);
    }

    useEffect(() => {
        switch (status) {
            case 'game_starting':
                // this will ensure that the game is winnable by either side as slong as maximum rounds are kept are optimal
                const itemCount = gameMode === 'single_player' ? 24 : playerCount * 24;

                // shuffle movies so that it will not recieve the same items every round
                const newMovies = shuffleList([...MOVIES]);
                const movieList = newMovies.slice(0, itemCount);

                const shuffledList = shuffleList([...movieList]);
                const playerCard = shuffleList([...shuffledList.slice(0, 24)]);
                playerCard.splice(12, 0, FREE_BINGO_TEXT);

                setMovies(shuffledList);
                setPlayerCard(playerCard);
                setStatus('drawing_item');
                break;

            case 'drawing_item':
                setSelectedMovie(''); // the user should not be able to choose after timeout is cleared
                setTimeout(drawItem, DRAW_ITEM_TIME);
                break;
        }
    }, [status]);

    const selectItem = (movie: string) => {
        if (selectedMovies.includes(movie)) return;
        if (movie !== selectedMovie) return;

        clearTimeout(countDown);
        const newSelectedMovies = [...selectedMovies, movie];
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
        <div>
            {
                status === 'not_started' &&
                <div className='game-start-container'>
                    <h1>Welcome to Bingo Game!</h1>
                    <button onClick={() => setStatus('game_starting')} className='btn btn-primary'>
                        Start New Game
                    </button>

                    <div className='bingo-rules'>
                        <h2>Game Rules</h2>
                        <ol className='text-left mt-10'>
                            <li>Click on the movie that appears at the top of the screen</li>
                            <li>Complete a row, column, or diagonal</li>
                            <li>Do not forget about the time limit of 15 seconds for each round!</li>
                        </ol>
                    </div>

                </div>
            }
            {
                status !== 'not_started' &&
                <>
                    <div className='mt-40'>
                        <StatusBar
                            reset={reset}
                            remainingRounds={remainingRounds}
                            status={status}
                            movie={selectedMovie}
                            bingoCount={bingoCount}
                        />
                    </div>
                    <div>
                        <BingoTable
                            playerCard={playerCard}
                            selectedItems={selectedMovies}
                            selectItem={selectItem}
                        />
                    </div>
                </>
            }

            <ReactCanvasConfetti
                refConfetti={getInstance}
                style={styles}
            />
        </div>
    )
}

export default Game;