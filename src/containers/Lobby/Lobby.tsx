import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import socket from '../../utils/Socket';
import { SOCKET_EVENTS, RANDOM_MOVIE_CHARACTERS } from '../../constants';



const Lobby = () => {
    const router = useRouter();

    const [roomId, setRoomId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [status, setStatus] = useState('' as 'created-new-game' | 'joined-a-game');
    const [players, setPlayers] = useState([] as string[]);
    const [message, setMessage] = useState('');
    const [randomName, setRandomName] = useState('');
    const [isCreator, setCreator] = useState(false);


    useEffect(() => {
        if (!randomName) setRandomName(RANDOM_MOVIE_CHARACTERS[Math.round((Math.random() * 100))]);
        // if (!roomId) {
        //     socket.send('create-game');
        // }

        socket.on(SOCKET_EVENTS.GAME_CREATED, (data) => {
            setRoomId(data.roomId);
            console.log('game-creatd', data);
            setStatus('created-new-game');
            setMessage('');
            setPlayers([data.playerName]);
            setCreator(true);
        });

        socket.on(SOCKET_EVENTS.SYNC_LOBBY, (data: { players: string[], creatorId: string }) => {
            console.log('update lobby:', data);
            setPlayers(data.players);
            setMessage('');
            if (socket.id === data.creatorId) setCreator(true);
            else setCreator(false);
        });
        socket.on(SOCKET_EVENTS.LOBBY_JOINED, () => {
            console.log('update joined');
            setStatus('joined-a-game');
            setMessage('');
        });
        socket.on(SOCKET_EVENTS.LOBBY_NOT_FOUND, () => {
            console.log('lobby not found');
            setMessage('Lobby not found. Maybe you entered a wrong id?');
        });
        socket.on(SOCKET_EVENTS.LOBBY_FULL, () => {
            console.log('lobby is full');
            setMessage('Lobby is full. You will not be able to join :(');
        });

        // this will trigger events to lead the players to game screen. Then the component/client will send "ready" message. When everyone is ready, the game will start.
        socket.on(SOCKET_EVENTS.START_GAME, (data: {roomId: string}) => {
            console.log('starting', data.roomId);
            router.push(`game/${data.roomId}`);
        });

        // return () => { socket.disconnect() };
    }, [socket])

    const joinLobby = (e) => {
        e.preventDefault();
        console.log('trying to join', roomId);
        socket.emit(SOCKET_EVENTS.JOIN_LOBBY, ({ playerName: playerName.trim(), roomId }));
    }

    const createNewGame = (e) => {
        e.preventDefault();
        socket.emit(SOCKET_EVENTS.CREATE_NEW_GAME, { playerName: playerName.trim() })
    }

    const startMultiplayerGame = () => {
        console.log('sending event to start multiplayer game');
        socket.emit(SOCKET_EVENTS.START_GAME);
    }

    return (
        <div className='lobby'>
            <h1 className='mb-40'>LOBBY</h1>

            {
                message && <p>{message}</p>
            }

            {
                !status &&
                <div>
                    <div className='mb-40'>
                        <h2>Create New Game</h2>
                        <form onSubmit={null}>
                            <div className='flex-column'>
                                <label htmlFor='player-name'>Enter your name</label>
                                <input
                                    placeholder={randomName}
                                    id='player-name'
                                    name='player-name'
                                    type='text'
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    value={playerName}
                                />
                                <button onClick={createNewGame} className='btn btn-primary mt-20'>Create New Game</button>
                            </div>
                        </form>

                    </div>
                    <div className='mt-40 mb-40'>
                        <h3>OR</h3>
                    </div>
                    <div className='mt-40'>
                        <h2>Enter Game</h2>
                        <form onSubmit={null}>
                            <div className='flex-column'>
                                <label htmlFor='room-id'>Type Room ID</label>
                                <input id='room-id' name='room-id' type='text' onChange={(e) => setRoomId(e.target.value)} value={roomId} />
                                <label className='mt-20' htmlFor='player-name'>Enter your name</label>
                                <input
                                    placeholder={randomName}
                                    id='player-name'
                                    name='player-name'
                                    type='text'
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    value={playerName}
                                />

                                <button onClick={joinLobby} className='btn btn-primary mt-20'>Enter Game</button>
                            </div>
                        </form>
                    </div>
                </div>
            }
            {
                status &&
                <div>
                    {
                        isCreator && players.length >= 2 && <button onClick={startMultiplayerGame} className='btn btn-primary'>START GAME</button>
                    }


                    <h4 className='mt-40'> ROOM ID: {roomId} </h4>
                    <p>Share this room ID with your friends (Max players: 10)</p>
                    <div className='players'>
                        {
                            players.map((name, index) => <p key={'player_name_' + index}>{index + 1}. {name}</p>)
                        }
                    </div>
                </div>
            }
        </div>
    )
}

export default Lobby;