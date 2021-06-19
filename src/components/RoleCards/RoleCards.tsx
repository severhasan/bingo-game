import { PLAYER_ROLES } from '../../constants';
import { useState } from 'react';

const RoleCards = ({ role, selectedRoles, count, ready, selectCard, setReady, showRoleInfo }: { role: '' | PlayerRole, selectedRoles: number[], count: number, ready: boolean, selectCard: (index: number) => void, setReady: () => void, showRoleInfo: () => void, }) => {
    const [selectedCard, setSelectedCard] = useState(0);

    const handleCardSelect = (index: number) => {
        selectCard(index);
        setSelectedCard(index);
    }


    return (
        <div className='roles'>
            <div className='wrapper'>
                <h2>{!role ? 'Select Role' : 'Role Revealed'}</h2>
                <div className='role-cards'>
                    {
                        Array.from(Array(count).keys()).map((index) => (
                            <div
                                key={'role_card_' + index}
                                onClick={selectedCard >= 0 ? null : () => handleCardSelect(index)}
                                className={`role-card ${role && selectedCard !== index ? 'hide' : ''} ${role && selectedCard === index ? 'revealed' : ''} ${selectedRoles.includes(index) ? 'selected' : ''}`}
                            >
                                {
                                    role && selectedCard === index && <h3>Your role is {PLAYER_ROLES[role].displayName}</h3>
                                }
                                {
                                    !role &&
                                    'PICK ME'
                                }
                                <div className='show-info button mt-40'>
                                    <button onClick={showRoleInfo} className='btn'>Show Role Info</button>
                                </div>
                                {/* {
                                    selectedCard === index ?
                                    role ?
                                        role === 'pollyanna'
                                            ? pollyannaCard
                                            : role === 'lucky'
                                                ? luckyCard
                                                : sinisterCard
                                        : 'PICK ME'
                                        : 'PICK ME'
                                } */}
                            </div>
                        ))
                    }
                </div>

                {
                    role &&
                    <div className='mt-40'>
                        {
                        ready ?
                            <>
                            <p>Click ready to start the game.</p>
                            <button onClick={setReady} className='btn game-ready'>Ready</button>
                            </>
                            :
                            <p>You are ready to play. Waiting for the other players...</p>
                        }
                    </div>
                }

            </div>
        </div>
    )
}

export default RoleCards;