import { useState, useEffect } from 'react';
import socket from '../../utils/Socket';


const Lobby = () => {

    useEffect(() => {

        socket.send('Hello world!');
        return () => { socket.disconnect() };
    }, [])

    return (
        <div>
            hello
        </div>
    )
}

export default Lobby;