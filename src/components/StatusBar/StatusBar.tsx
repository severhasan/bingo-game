import { useState, useEffect } from 'react';

const StatusBar = ({ status, movie, remainingRounds, bingoCount, reset}: StatusBarProps) => {

    let statusMessage = '';
    switch (status) {
        case 'game_starting':
            statusMessage = 'Game is about to start. Are you ready?';
            break;
        case 'game_finished':
            statusMessage = `Game has finished with ${bingoCount} bingos! The caller has no more movies left in their pouch. :/`;
            break;
        case 'drawing_item':
            statusMessage = 'Hold on! I am looking for a movie...';
            break;
        case 'item_selected':
            statusMessage = `Here is the movie:`;
            break;
    }

    return (
        <div className='game-status-bar'>
            <div className='stats'>
                <p>Remaining Rounds: {remainingRounds}</p>
                <p>Bingos: {bingoCount}</p>
            </div>
            <div>
                <p className='status-message'>{statusMessage}</p>
                {status === 'item_selected' && <p className='current-movie'>{movie}</p>}
            </div>
            <div>
                {
                    status === 'game_finished' &&
                    <button onClick={reset} className='btn btn-success'>RESET</button>
                }
            </div>
            {
                status === 'item_selected' &&
                <div className='progress-bar'>
                    <div className={`countdown ${status === 'item_selected' ? 'active' : ''}`}></div>
                </div>
            }
        </div>
    )
}

export default StatusBar;