import Game from '../containers/Game/Game';
import Link from 'next/link';

const Page = () => (
    <div>
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
    </div>
)

export default Page;