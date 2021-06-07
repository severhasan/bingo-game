import { useState, useEffect } from 'react';

const StatusBar = ({ status, movie, uniqueSelection, uniqueCards, bothCardsIncludeMovie, winner, playerName, timeoutDuration, remainingRounds, goNextRound, bingoCount, reset}: StatusBarProps) => {
    // const [progressDuration, setProgressDuration] = useState(0);

    // useEffect(() => {
    //     setProgressDuration(timeoutDuration);
    // }, [timeoutDuration])

    let statusMessage = '';
    switch (status) {
        case 'game_starting':
            statusMessage = 'Game is about to start. Are you ready?';
            break;
        case 'game_finished':
            statusMessage = `Game has finished with ${bingoCount} bingos! ${playerName === winner ? 'You are' : `${winner} is`} the winner!`;
            break;
        case 'drawing_item':
            statusMessage = 'Hold on! I am looking for a movie...';
            break;
        case 'item_selected':
            statusMessage = `Here is the movie:`;
            break;
        case 'computer_picked_item':
            if (uniqueCards || !bothCardsIncludeMovie) {
                statusMessage = 'You do not seem to have the movie on your card. Life is too harsh; we know. Don\'t try to look at it on the bright side. You\'re basically losing. The computer has picked the movie!';
            } else {
                if (uniqueSelection && bothCardsIncludeMovie) {
                    statusMessage = 'The computer has picked the movie! You were kinda too slow. You\'ll do better next time. Don\'t worry.';
                } else {
                    statusMessage = 'The computer has picked the movie!';
                }
            }
    }

    return (
        <div className='game-status-bar'>
            {/* <div className='stats'>
                <p>Remaining Rounds: {remainingRounds}</p>
                <p>Bingos: {bingoCount}</p>
            </div> */}
            <div>
                <p className='status-message'>{statusMessage}</p>
                {status === 'item_selected' && <p className='current-movie'>{movie}</p>}
                { status === 'computer_picked_item' && ((uniqueSelection && bothCardsIncludeMovie) || (uniqueCards || !bothCardsIncludeMovie)) && <div><button onClick={goNextRound} className='btn game-button'>Continue</button></div> }
            </div>
            <div>
                {
                    status === 'game_finished' &&
                    <button onClick={reset} className='btn game-button'>RESET</button>
                }
            </div>
            {
                status === 'item_selected' &&
                <div className='progress-bar'>
                    <div style={{animationDuration: `${timeoutDuration}ms`}} className={`countdown ${status === 'item_selected' ? 'active' : ''}`}></div>
                </div>
            }
        </div>
    )
}

export default StatusBar;