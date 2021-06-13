import Game from '../containers/Game/Game';
import Link from 'next/link';



const Page = () => {

    return (
        <div className='index'>
            <div className='wrapper'>
                <div className='game-modes' >
                    <div className='card game-mode'>
                        <h2>Single Player</h2>

                        <p>You can play against the computer on 1v1!</p>
                        <div className='buttons'>
                            <Link href='/single-player'><a><button className='btn game-button'>Play</button></a></Link>
                        </div>
                    </div>
                    <div className='mt-40 card game-mode'>
                        <h2>Multiplayer</h2>

                        <p>Multiplayer modes enables you to play with friends online. On top of that, you can configure your game into different settings and have a more dynamic game experience!</p>
                        <div className='buttons'>
                            <Link href='/game/create'><a><button className='btn game-button'>Create</button></a></Link>
                            <Link href='/game/join'><a><button className='ml-20 btn game-button'>Join</button></a></Link>
                        </div>
                    </div>
                </div>
                <div className='demo'>
                    {/* <div className='game-container'>
                        <Game gameMode='demo' playerCount={1} />
                    </div> */}
                </div>
            </div>
            <div className='footer'>
                <div className='page'>
                    <div className='main-container'>
                        <div className='content'>
                            <div>June, 2021</div>
                            <div>Sensory Minds Demo</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Page;


const legacyPage = () => {
    return (
        <div className='game-start-container'>
            <h1>Welcome to Bingo Game!</h1>
            <div className='buttons'>
                <button className='btn btn-primary'>
                    <Link href='/single-player'><a>Play Single Player</a></Link>
                </button>
                <button className='btn btn-primary'>
                    <Link href='/single-player'><a>Play Agaist Computer</a></Link>
                </button>
                <button className='btn btn-primary'>
                    <Link href='/lobby'><a>Play with a Friend</a></Link>
                </button>
            </div>

            <div className='bingo-rules'>
                <h2>Game Rules</h2>
                <ol className='text-left mt-10'>
                    <li>Click on the movie that appears at the top of the screen</li>
                    <li>Complete a row, column, or diagonal</li>
                    <li>Do not forget about the time limit of 15 seconds for each round!</li>
                </ol>
            </div>

        </div>
    )
}