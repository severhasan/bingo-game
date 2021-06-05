import { useState } from 'react';
import { RANDOM_MOVIE_CHARACTERS } from '../../constants';


const JoinGame = ({ joinLobby }: { joinLobby: (roomId) => void }) => {
    const [playerName, setPlayerName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [isRoomIdInvalid, setRoomIdInvalid] = useState(false);
    const [randomPlayerName, setRandomPlayerName] = useState(RANDOM_MOVIE_CHARACTERS[Math.round((Math.random() * 100))]);

    const join = (event) => {
        event.preventDefault();
        if (!roomId) {
            setRoomIdInvalid(true);
        }
        joinLobby(roomId);
    }

    const handleRoomId = (roomId: string) => {
        setRoomId(roomId);
        if (isRoomIdInvalid) setRoomIdInvalid(false);
    }

    return (
        <div className='join-game-inputs'>
            <form onSubmit={null}>
                <div className='flex-column'>
                    <label htmlFor='room-id'>Room ID</label>
                    <input className={isRoomIdInvalid ? 'invalid' : ''} id='room-id' name='room-id' type='text' onChange={(e) => handleRoomId(e.target.value)} value={roomId} />
                    <label className='mt-20' htmlFor='player-name'>Player Name</label>
                    <input
                        placeholder={randomPlayerName}
                        id='player-name'
                        name='player-name'
                        type='text'
                        onChange={(e) => setPlayerName(e.target.value)}
                        value={playerName}
                    />
                    <p className='note'>Hint: If you leave player name empty, the game will generate a random name for you.</p>

                    <button onClick={join} className='btn game-button mt-20'>Enter Game</button>
                </div>
            </form>
        </div>
    )
}

export default JoinGame;