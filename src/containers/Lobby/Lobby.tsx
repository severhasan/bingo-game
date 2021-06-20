import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import CreateGameInputs from '../../components/Forms/CreateGame';
import JoinGameInputs from '../../components/Forms/JoinGame';
import RoleCards from '../../components/RoleCards/RoleCards';
import RoleInfo from '../../components/RolesInfo/RolesInfo';
import Settings from '../../components/Settings/Settings';
import socket from '../../utils/Socket';
import { SOCKET_EVENTS, DEFAULT_GAME_SETTINGS } from '../../constants';



const Lobby = ({ creator }: { creator: boolean }) => {
    const router = useRouter();
    const ref = useRef() as any;

    const [roomId, setRoomId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [status, setStatus] = useState('' as 'created-new-game' | 'joined-a-game' | 'select_roles');
    const [players, setPlayers] = useState([] as string[]);
    const [message, setMessage] = useState('');
    const [isCreator, setCreator] = useState(!!creator);
    const [settings, setSettings] = useState(DEFAULT_GAME_SETTINGS);
    const [isCopied, setCopied] = useState(false);
    const [isSideBarOpen, setSideBarOpen] = useState(false);
    const [roleCardCount, setRoleCardCount] = useState(0);
    const [isRoleCardsActive, setRoleCardsActive] = useState(false);
    const [role, setRole] = useState('' as PlayerRole);
    const [selectedRoles, setSelectedRoles] = useState([] as number[]);
    const [isPlayerReady, setPlayerReady] = useState(false); // only when the role card mode is activated
    const [isRoleInfoOpen, setRoleInfoOpen] = useState(false);

    const handleSelectRoomId = () => {
        ref.current.select();
    }
    const handleCopyRoomId = () => {
        ref.current.select();
        document.execCommand('copy');
        setCopied(true);
    }

    const closeSideBar = () => {
        setSideBarOpen(false);
    }
    const openSideBar = () => {
        setSideBarOpen(true);
    }

    const displayRoleCards = (count: number) => {
        setRoleCardsActive(true);
        setRoleCardCount(count);
    }
    const selectRoleCard = (index: number) => {
        console.log('client selecting roel:', index);
        socket.emit(SOCKET_EVENTS.SELECT_ROLE, ({ index }));
    }

    const setReady = () => {
        socket.emit(SOCKET_EVENTS.PLAYER_READY);
    }

    useEffect(() => {
        // if (!roomId) {
        //     socket.send('create-game');
        // }

        socket.on(SOCKET_EVENTS.GAME_CREATED, (data: { playerName: string, roomId: string, settings: GameSettings }) => {
            setRoomId(data.roomId);
            // console.log('game-creatd', data);
            setStatus('created-new-game');
            setMessage('');
            setPlayers([data.playerName]);
            setCreator(true);
            setSettings(data.settings);
        });

        // SYNC_LOBBY info is sent to players individually
        socket.on(SOCKET_EVENTS.SYNC_LOBBY, (data: { players: string[], role: PlayerRole, creatorId: string, isPlayerReady: boolean, selectedRoles: number[] }) => {
            setPlayers(data.players);
            setMessage('');
            setPlayerReady(data.isPlayerReady);
            setSelectedRoles(data.selectedRoles);
            if (data.role) {
                setRole(data.role);
            }
            if (socket.id === data.creatorId) setCreator(true);
            else setCreator(false);
        });
        socket.on(SOCKET_EVENTS.LOBBY_JOINED, () => {
            // console.log('update joined');
            setStatus('joined-a-game');
            setMessage('');
        });
        socket.on(SOCKET_EVENTS.LOBBY_NOT_FOUND, () => {
            // console.log('lobby not found');
            setMessage('Lobby not found. Maybe you entered a wrong room ID?');
        });
        socket.on(SOCKET_EVENTS.LOBBY_FULL, () => {
            // console.log('lobby is full');
            setMessage('Lobby is full. You will not be able to join :(');
        });

        // playerCount is not really necessary, but just in case...
        socket.on(SOCKET_EVENTS.DISPLAY_ROLE_SELECTION, (data: { playerCount: number }) => {
            displayRoleCards(data.playerCount);
            setStatus('select_roles');
        });

        // this will trigger events to lead the players to game screen. Then the component/client will send "ready" message. When everyone is ready, the game will start.
        socket.on(SOCKET_EVENTS.START_GAME, (data: { roomId: string }) => {
            // console.log('starting', data.roomId);
            router.push(`/game/${data.roomId}`);
        });

        // remove socket listeners.
        return () => {
            // cannot remove it all somehow :/
            socket.off(SOCKET_EVENTS.SYNC_LOBBY, null);
            socket.off(SOCKET_EVENTS.LOBBY_JOINED, null);
            socket.off(SOCKET_EVENTS.LOBBY_NOT_FOUND, null);
            socket.off(SOCKET_EVENTS.LOBBY_FULL, null)
            socket.off(SOCKET_EVENTS.DISPLAY_ROLE_SELECTION, null)
            socket.off(SOCKET_EVENTS.START_GAME, null);
        };
    }, [])

    const joinLobby = (roomId: string) => {
        if (!roomId) {
            return setMessage('Please enter a valid room ID');
        }

        setRoomId(roomId);
        // console.log('trying to join', roomId);
        socket.emit(SOCKET_EVENTS.JOIN_LOBBY, ({ playerName: playerName.trim(), roomId }));
    }

    const createNewGame = (event) => {
        event.preventDefault();
        socket.emit(SOCKET_EVENTS.CREATE_NEW_GAME, { playerName: playerName.trim(), settings })
    }

    const startMultiplayerGame = () => {
        // console.log('sending event to start multiplayer game');
        socket.emit(SOCKET_EVENTS.START_GAME, { settings });
    }

    const showRoleInfo = () => {
        setRoleInfoOpen(true);
    }

    return (
        <div className='lobby mt-40'>
            <h1> {!status && creator ? 'CREATE NEW GAME' : !status && !creator ? 'JOIN GAME' : 'LOBBY'}</h1>

            {!creator && <p className='message main-color bold'>{message}</p>}

            { (!status && creator) && <CreateGameInputs settings={settings} playerName={playerName} setPlayerName={setPlayerName} setSettings={setSettings} createNewGame={createNewGame} />}
            { (!status && !creator) && <JoinGameInputs playerName={playerName} setPlayerName={setPlayerName} joinLobby={joinLobby} />}

            {
                status &&
                <div>
                    <div className='creator-action-button'>
                        {
                            isCreator && players.length >= 2 && <button onClick={startMultiplayerGame} className='btn game-button'>START GAME</button>
                        }
                    </div>


                    <div className='flex-center mt-40'>
                        <h2 className='flex-center room-title'>
                            <span className='mr-20'>
                                ROOM ID:
                            </span>
                            <input
                                className='input plain'
                                type='text'
                                readOnly
                                onClick={handleSelectRoomId}
                                ref={ref}
                                value={roomId}
                            />

                            <div onMouseLeave={() => setCopied(false)} className='icon ml-20'>
                                <img onClick={handleCopyRoomId} src='/static/copy-url.svg' alt='copy url' />
                                <span className='tooltip-container flex-center'><span className='legend-tooltip'>{isCopied ? 'Copied!' : 'Copy to clipboard'}</span></span>
                            </div>
                        </h2>

                        {
                            isCreator &&
                            <div onClick={openSideBar} className='ml-40 icon'>
                                <img src='/static/settings-icon.svg' alt='settings' />
                                <span className='tooltip-container flex-center'><span className='legend-tooltip'>Open Settings</span></span>
                            </div>
                            // <button
                            //     onClick={openSideBar}
                            //     className='ml-40 btn small game-button'
                            // >
                            // </button>
                        }

                    </div>
                    <p>Share this room ID with your friends (Max players: 5)</p>

                    <h3>Players in the Lobby</h3>
                    <div className='players'>
                        {
                            players.map((name, index) => <p key={'player_name_' + index}>{index + 1}. {name}</p>)
                        }
                    </div>
                </div>
            }

            {
                isCreator && status === 'created-new-game' &&
                <div className={`settings-sidebar ${isSideBarOpen ? 'open' : ''}`}>
                    <div className={`wrapper ${isSideBarOpen ? 'open' : ''}`}>
                        <div className='settings-container'>
                            <Settings gameMode={'multiplayer'} close={closeSideBar} settings={settings} setSettings={setSettings} showDescription={false} />
                        </div>
                    </div>
                </div>
            }

            {
                status === 'select_roles'
                &&
                <RoleCards
                    role={role}
                    ready={isPlayerReady}
                    selectedRoles={selectedRoles}
                    count={roleCardCount}
                    selectCard={selectRoleCard}
                    setReady={setReady}
                    showRoleInfo={showRoleInfo}
                />
            }

            <RoleInfo active={isRoleInfoOpen} close={() => setRoleInfoOpen(false)} />

        </div>
    )
}

export default Lobby;