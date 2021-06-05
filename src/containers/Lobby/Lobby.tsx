import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import socket from '../../utils/Socket';
import { SOCKET_EVENTS } from '../../constants';
import CreateGameInputs from '../../components/Forms/CreateGame';
import JoinGameInputs from '../../components/Forms/JoinGame';



const Lobby = ({ creator }: { creator: boolean }) => {
    const router = useRouter();

    const [roomId, setRoomId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [status, setStatus] = useState('' as 'created-new-game' | 'joined-a-game');
    const [players, setPlayers] = useState([] as string[]);
    const [message, setMessage] = useState('');
    const [isCreator, setCreator] = useState(!!creator);

    useEffect(() => {
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
            setMessage('Lobby not found. Maybe you entered a wrong room ID?');
        });
        socket.on(SOCKET_EVENTS.LOBBY_FULL, () => {
            console.log('lobby is full');
            setMessage('Lobby is full. You will not be able to join :(');
        });

        // this will trigger events to lead the players to game screen. Then the component/client will send "ready" message. When everyone is ready, the game will start.
        socket.on(SOCKET_EVENTS.START_GAME, (data: { roomId: string }) => {
            console.log('starting', data.roomId);
            router.push(`game/${data.roomId}`);
        });

        // return () => { socket.disconnect() };
    }, [socket])

    const joinLobby = (roomId: string) => {
        if (!roomId) {
            return setMessage('Please enter a valid room ID');
        }

        setRoomId(roomId);
        console.log('trying to join', roomId);
        socket.emit(SOCKET_EVENTS.JOIN_LOBBY, ({ playerName: playerName.trim(), roomId }));
    }

    const createNewGame = (event) => {
        event.preventDefault();
        socket.emit(SOCKET_EVENTS.CREATE_NEW_GAME, { playerName: playerName.trim() })
    }

    const startMultiplayerGame = () => {
        console.log('sending event to start multiplayer game');
        socket.emit(SOCKET_EVENTS.START_GAME);
    }

    return (
        <div className='lobby mt-40'>
            <h1> {!status && creator ? 'CREATE NEW GAME' : !status && !creator ? 'JOIN GAME' : 'LOBBY'}</h1>

            {!creator && <p className='message main-color bold'>{message}</p> }
            

            { (!status && creator) && <CreateGameInputs createNewGame={createNewGame} /> }
            { (!status && !creator) && <JoinGameInputs joinLobby={joinLobby} /> }

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