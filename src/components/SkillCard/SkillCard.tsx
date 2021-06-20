// const getRoleSkills = () => {
//     switch(role) {
//         case 'pollyanna':
//             return <button className='btn stun-heal'>Heal ({skillPoints})</button>
//         case 'sinister':
//             return (
//                 <>
//                     <button className='btn stun-button'>Stun ({skillPoints})</button>
//                     <button className='btn stun-distort'>Distort ({skillPoints})</button>
//                 </>
//             );
//         default:
//             return null;
//     }
// }
import { useEffect, useState } from 'react';
import { PLAYER_ROLES } from '../../constants';
import classes from './SkillCard.module.css';

const SkillCard = ({role, players, skillPoints}: {role: PlayerRole, players: ScoreBoardPlayer[], skillPoints: number}) => {
    const [filteredPlayers, setFilteredPlayers] = useState([] as ScoreBoardPlayer[]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (role === 'lucky') {
            setFilteredPlayers(players.filter(p => p.role === 'sinister'));
        } else {
            setFilteredPlayers(players);
        }

        // console.log('players', players);

    }, [players]);

    const getSelfSkill = () => {
        switch (role) {
            case 'lucky':
                return <button className='btn utility-button' > SELECT NEXT ROUND'S MOVIE </button>
            case 'pollyanna':
                return <button className='btn heal-button' > HEAL SELF </button>
            case 'sinister':
                return <button className='btn distort-button'> USE GLOBAL CURSE </button>
        }
    }

    return (
        <div className={[classes.CardWrapper, open ? classes.Open : ''].join(' ')}>
            <div onClick={() => setOpen(!open)} className={classes.Toggle}>
                <img height='30' width='30' src="https://img.icons8.com/material/48/000000/battle.png" alt='skills' />
            </div>
            <div className={classes.Card}>
                <div className={classes.Header}>
                    <p>Role: {PLAYER_ROLES[role].displayName}</p>
                    <p>Skill Points: {skillPoints}</p>
                </div>

                <div className='flex space-between align-center mb-40'>
                    <p>Skill:</p>
                    <p>{getSelfSkill()}</p>
                </div>

                {
                    players.map((player, index) => (
                        <div key={'skill_card_player_' + index} className={classes.Player}>
                            <p>{player.name}</p>
                            <p>
                                {
                                    role === 'lucky' &&
                                    <button className='btn'>Set Trap</button>
                                }
                                {
                                    role === 'pollyanna' &&
                                    <button className='btn heal-button'>Support</button>
                                }
                                {
                                    role === 'sinister' &&
                                    <>
                                        <button className='btn stun-button'>Stun</button>
                                        <button className='btn distort-button'>Distort</button>
                                    </>
                                }
                            </p>
                            
                        </div>
                    ))
                }
                

            </div>
        </div>
    )
}
export default SkillCard;