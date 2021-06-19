import classes from './RuleInfo.module.css';

const RolesInfo = ({ active, close }) => {

    return (
        <div className={[classes.RoleInfoWrapper, active ? classes.Active : ''].join(' ')}>
            <div className={classes.Content}>
                <div onClick={close} className={classes.Close}>X</div>
                <div className={classes.Role}>
                    <div className={classes.Title}>
                        <h2>Pollyanna</h2>
                        <img src="https://img.icons8.com/material/24/ffffff/rod-of-asclepius.png" alt='pollyanna' />
                    </div>

                    <div>
                        <ul>
                            <li>You have 5 skill points.</li>
                            <li>You have 25% chance of dodging curses.</li>
                            <li>You can lift the curse of the sinisters.</li>
                            <ol>
                                <li>When scoring is enabled, your skills will get you the full score.</li>
                                <li>When scoring is enabled, if lift a friend's curse, you will also get their score added to your score.</li>
                            </ol>
                        </ul>
                        <p>All is well,</p>
                    </div>
                </div>

                <div className={classes.Role}>
                    <div className={classes.Title}>
                        <h2>Sinister</h2>
                        <img src="https://img.icons8.com/android/24/ffffff/evil.png" alt='sinister' />
                    </div>
                    <div>
                        <ul>
                            <li>You have 4 individual and 1 global skill points.</li>
                            <ol>
                                <li>Distort: This will distort your opponents vision.</li>
                                <li>Stun: This will render the items unselectable for 2/3 of the round duration.</li>
                                <li>Global: Stun or Distort by chance, which will affect all other players in the game.</li>
                            </ol>
                            <li>You can use your skills before or during the round.</li>
                            <li>When scoring is enabled, your opponents will lose points.</li>
                        </ul>
                        <p>Go and ruin your opponents' game!</p>
                    </div>
                </div>

                <div className={classes.Role}>
                    <div className={classes.Title}>
                        <h2>Lucky</h2>
                        <img src="https://img.icons8.com/android/50/ffffff/clover.png" alt='clover' />
                    </div>
                    <ul>
                        <li>You have passive and active skills and 5 skill points to use.</li>
                        <li>Passives:
                            <ol>
                                <li>You may dodge a cursing by 50% chance.</li>
                                <li>If you are cursed and a friend lifts your curse in scoring mode, you may potentially get more than the full score.</li>
                            </ol>
                        </li>
                        <li>
                            Actives:
                            <ol>
                                <li>Before the round starts, you can select an item and determine what the next item will be for the next round. You also get the full score if scoring is enabled.</li>
                                <li>Before the round starts, you can use your skill to use sinister's plans against themselves. The players will not be cursed, but the curse will effect the sinister themselves.</li>
                            </ol>
                        </li>
                    </ul>
                    <p>Good luck,</p>
                </div>
            </div>
        </div>
    )
}

export default RolesInfo;