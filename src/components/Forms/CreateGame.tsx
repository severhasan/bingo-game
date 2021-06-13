import { useState } from 'react';
import { RANDOM_MOVIE_CHARACTERS } from '../../constants';
import Settings from '../Settings/Settings';


const CreateGame = ({ playerName, setPlayerName, settings, setSettings, createNewGame }: { playerName: string, setPlayerName: (name: string) => void, settings: GameSettings, setSettings: (newSettings: GameSettings) => void, createNewGame: (event) => void }) => {
    const [randomPlayerName] = useState(RANDOM_MOVIE_CHARACTERS[Math.round((Math.random() * 100))]);


    return (
        <div className='create-game-inputs'>
            <form onSubmit={null}>
                <div className='flex-column-center'>
                    <label htmlFor='player-name'>Player Name</label>
                    <input
                        type='text'
                        id='player-name'
                        name='player-name'
                        placeholder={randomPlayerName}
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                    />
                    <p className='note'>Hint: If you leave player name empty, the game will generate a random name for you.</p>
                    <button onClick={createNewGame} className='btn game-button mt-20'>Create New Game</button>
                </div>
            </form>

        <div className='mt-40 mb-40'>
            <h2>Settings</h2>
            <p className='note italic'>Hint: You can always update these settings on the Lobby screen.</p>
            <Settings gameMode='multiplayer' settings={settings} setSettings={setSettings} showDescription />
        </div> 

        </div>
    )
}

export default CreateGame;