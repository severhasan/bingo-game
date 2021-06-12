import { useState } from 'react';
import ComputerCard from '../../components/ComputerCard/ComputerCard';
import classes from './ScoreBoard.module.css';

const ScoreBoard = ({players}: ScoreBoardProps) => {
    const [open, setOpen] = useState(true);

    return (
        <div className={[classes.ScoreBoard, open ? classes.Open : classes.Close].join(' ')}>
            <div onClick={() => setOpen(true)} className={classes.OpenButton}><img src='/static/scoreboard.svg' alt='scoreboard image' /></div>
            <div className={classes.Container}>
                <div className={classes.Title}>
                    <div onClick={() => setOpen(false)} className={classes.CloseButton}>X</div>
                    <h2>Score Board</h2>
                </div>
                <div className={classes.Content}>
                    {
                        players.map((player, index) => (
                            <div key={'player_score_card_' + index} className={classes.PlayerCard}>
                                <div className='text-center'>
                                    <h3>{player.name}</h3>
                                </div>
                                <div className='flex space-between'>
                                    <div className={classes.Col}>
                                        <h4 className='text-center'>Board</h4>
                                        <ComputerCard matchIndices={player.matches} />
                                    </div>
                                    <div className={classes.Col2}>
                                        <h4 className='text-center'>Info</h4>
                                        <div className='flex-column space-between h-100'>
                                            <div className='flex'><p>Bingos</p><p className={classes.ReferenceDots}></p><p>{player.bingos}</p></div>
                                            <div className='flex'><p>Matches</p><p className={classes.ReferenceDots}></p><p>{player.matches.length - 1}</p></div>
                                            <div className='flex'><p>Score</p><p className={classes.ReferenceDots}></p><p>{player.score ?? player.matches.length - 1}</p></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}

export default ScoreBoard;