import { PLAYER_ROLES } from '../../constants';
import { useState } from 'react';

const RoleCards = ({ role, selectedRoles, count, selectCard, setReady }: { role: PlayerRole, selectedRoles: number[], count: number, selectCard: (index: number) => void, setReady: () => void }) => {
    const [selectedCard, setSelectedCard] = useState(0);

    const handleCardSelect = (index: number) => {
        selectCard(index);
        setSelectedCard(index);
    }

    const pollyannaCard = (
        <>
            <ul>
                <li>You have 3 skill points.</li>
                <li>You have 25% chance of dodging curses.</li>
                <li>You can lift the curse of the sinisters.</li>
                <li>When scoring is enabled, your skills will get you the full score.</li>
                <li>When scoring is enabled, if lift a friend's curse, you will also get their score added to your score.</li>
            </ul>
            <p>All is well,</p>
        </>
    )

    const sinisterCard = (
        <>
            <ul>
                <li>You have 2 individual and 1 global skill points.</li>
                <ol>
                    <li>Distort: This will distort your opponents vision.</li>
                    <li>Stun: This will render the items unselectable.</li>
                    <li>Global: Stun or Distort by chance, which will affect all other players in the game.</li>
                </ol>
                <li>You can use your skills before or during the round.</li>
                <li>When scoring is enabled, your opponents will lose points.</li>
            </ul>
            <p>Go and ruin your opponents' game!</p>
        </>
    )

    const luckyCard = (
        <>
            <ul>
                <li>You have passive and active skills and 2 skill points to use.</li>
                <li>Passives:
                <ol>
                        <li>You may dodge a cursing by 50% chance.</li>
                        <li>If you are cursed and a friend lifts your curse and scoring is enabled, you may potentially get more than the full score.</li>
                    </ol>
                </li>
                <li>
                    Actives:
                <ol>
                        <li>Before the round starts, you can select an item and determine what the next item will be for the next round. You also get the full score if scoring is enabled.</li>
                    </ol>
                </li>
            </ul>
            <p>Good luck,</p>
        </>
    )


    return (
        <div className='roles'>
            <div className='wrapper'>
                <h2>{!role ? 'Select Role' : 'Role Revealed'}</h2>
                <div className='role-cards'>
                    {
                        Array.from(Array(count).keys()).map((index) => (
                            <div
                                key={'role_card_' + index}
                                onClick={() => handleCardSelect(index)}
                                className={`role-card ${role && selectedCard !== index ? 'hide' : ''} ${role && selectedCard === index ? 'revealed' : ''} ${selectedRoles.includes(index) ? 'selected' : ''}`}
                            >
                                {
                                    role && selectedCard === index && <h3>Your role is {PLAYER_ROLES[role].displayName}</h3>
                                }
                                {
                                    selectedCard === index ?
                                    role ?
                                        role === 'pollyanna'
                                            ? pollyannaCard
                                            : role === 'lucky'
                                                ? luckyCard
                                                : sinisterCard
                                        : 'PICK ME'
                                        : 'PICK ME'
                                }
                            </div>
                        ))
                    }
                </div>

                {
                    role &&
                    <div className='mt-40'>
                        <button onClick={setReady} className='btn'>Ready</button>
                    </div>
                }

            </div>
        </div>
    )
}

export default RoleCards;