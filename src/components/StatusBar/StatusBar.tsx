import { useState, useEffect } from 'react';

const StatusBar = ({ status, movie, uniqueSelection, uniqueCards, playerCardIncludesMovie, otherCardsIncludeMovie, winner, playerName, timeoutDuration, goNextRound, bingoCount, reset}: StatusBarProps) => {
    const [resetting, setResetting] = useState(false);

    let statusMessage = '';
    switch (status) {
        case 'game_starting':
            statusMessage = 'Game is about to start. Are you ready?';
            break;
        case 'game_finished':
            statusMessage = `Game has finished with ${bingoCount} bingos! ${winner}`;
            break;
        case 'drawing_item':
            statusMessage = 'Hold on! I am looking for a movie...';
            break;
        case 'item_selected':
            statusMessage = `Here is the movie:`;
            break;
        case 'computer_picked_item':
            if (uniqueCards || !playerCardIncludesMovie) {
                statusMessage = 'You do not seem to have the movie on your card. Life is too harsh; we know. Don\'t try to look at it on the bright side. You\'re basically losing. The computers have picked the movie!';
            } else {
                if (uniqueSelection && otherCardsIncludeMovie) {
                    statusMessage = 'The computers have picked the movie! You were kinda too slow. You\'ll do better next time. Don\'t worry.';
                } else {
                    statusMessage = 'The computers have picked the movie!';
                }
            }
            break;
        case 'missed_selection':
            if (otherCardsIncludeMovie) {
                statusMessage = 'The Computers have selected their items, but you missed your chance of selecting the item on your card. We wonder what prevented you from clicking on the item.';
            } else {
                statusMessage = 'You missed your chance of selecting the item on your card. We wonder what prevented you from clicking on the item.'
            }
            break;
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
                { (status === 'computer_picked_item' || status === 'missed_selection') && <div><button onClick={goNextRound} className='btn game-button'>Continue</button></div> }
            </div>
            <div>
                {
                    resetting &&
                    <div>
                        <p>Are you sure you want to reset the game?</p>
                        <button onClick={reset} className='btn game-button'>RESET</button>
                        <button onClick={() => setResetting(false)} className='ml-40 btn game-button'>CANCEL</button>
                    </div>
                }
                {
                    status === 'game_finished' && !resetting &&
                    <button onClick={() => setResetting(true)} className='btn game-button'>RESET</button>
                }
            </div>
            {
                status === 'item_selected' &&
                <div className='progress-bar'>
                    <div style={{animationDuration: `${timeoutDuration}s`}} className={`countdown ${status === 'item_selected' ? 'active' : ''}`}></div>
                </div>
            }
        </div>
    )
}

export default StatusBar;