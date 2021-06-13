import Switch from './Switch';

const settingsOptions = [
    { title: 'Multiple Bingos', prop: 'multipleBingos', description: 'When Multiple Bingos is on, the players will continue playing until a player finishes all bingos in their card. Otherwise, the game will end when a player finds a bingo.' },
    { title: 'Scoring', prop: 'scoring', description: 'When Scoring is on, the game will keep the score of the players, and each round, players will be granted scores in accordance with their speed of finding the item on their card. Bingos will be rewarded with multiple amounts of points. Whe left off, the game will not keep player scores. When the multiple bingo option is disabled and scoring is enabled, the winner will be determined by the scores.' },
    { title: 'Unique Player Cards', prop: 'uniqueCards', description: 'When Unique Player Cards is on, every player will have a unique card. No item on their card will be the same. Otherwise, the players might potentially have the same items on their cards.' },
    { title: 'Unique Item Selection', prop: 'uniqueSelection', description: 'When Unique Player Cards is off, there are two possible scenarios: Firstly, multiple players can select the same item and will be able to proceed. Secondly, only the first player to click on the item will be able to proceed. This could add a bit more of a challenge to the game. When Unique Item Selection is on, only one (the first) player will be able to select the item. Otherwise, the players can select the item any time and will be scored & checked for bingos accordingly. ' },
    { title: 'Player Roles', prop: 'roles', description: 'Element of Surprise' },
    // { title: 'Add Extra Items', prop: 'unrelatedItems', description: 'Realistically speaking, when a caller draws an item, no player could potentially have the item on their card. This is only for goofy reasons, otherwise, this does not really serve a great purpose for the game.' }
    // { title: 'Max Rounds', prop: 'maxRounds', description: 'The maximum rounds in a game'},
]
const timeoutDurationOption = { title: 'Round Duration', prop: 'timeoutDuration', description: 'This determines how long a round will take. The shorter, the more challenging it is to select an item.' };
const botCountOption = { title: 'Bot Players', prop: 'botCount', description: 'If you don\'t have friends to play with, do not worry; we got you covered. You can set how many computer players there should be in your game. While we cannot guarantee the more computer players, the more fun, you will surely feel a bit more powerful when you win against 4 computer powered bots. :)' };

const comingSoon = ['roles', 'unrelatedItems'];

const Settings = ({ gameMode, showDescription, settings, setSettings, close }: SettingsProps) => {

    const toggle = (prop: string) => {
        const newSettings = { ...settings };
        newSettings[prop] = !newSettings[prop];

        if (prop === 'uniqueCards' && newSettings[prop]) {
            newSettings.uniqueSelection = false;
        }
        setSettings(newSettings);
    }

    const setRange = (prop: string, value: number) => {
        const newSettings = { ...settings };
        newSettings[prop] = value;
        setSettings(newSettings);
    }

    return (
        <div className='settings mb-40'>
            {
                close &&
                <div onClick={close} className='close'>X</div>
            }
            <div className=''>
                {
                    settingsOptions.map((opt, index) => (
                        <div key={'setting_opt_' + index} className={`${index > 0 && 'mt-20'} section flex space-between`}>
                            <div className='col1 mr-20'>
                                <p className='option'>{opt.title} {comingSoon.includes(opt.prop) ? '(Coming soon)' : ''}</p>
                                {
                                    showDescription &&
                                    <p className='description'> {opt.description} </p>
                                }
                            </div>
                            <div className='col2'>
                                <Switch disabled={comingSoon.includes(opt.prop) || (opt.prop === 'uniqueSelection' && settings.uniqueCards) ? true : false} active={settings[opt.prop]} toggle={() => toggle(opt.prop)} />
                            </div>
                        </div>
                    ))
                }

                <div className='flex space-between'>
                    <div>
                        <p className='option'>{timeoutDurationOption.title}</p>

                        {
                            showDescription &&
                            <p className='description'> {timeoutDurationOption.description} </p>
                        }

                    </div>
                    <div className='flex-column-center'>
                        <p>{settings.timeoutDuration} seconds</p>
                        <input className='range' min='1' max='60' type='range' onChange={e => setRange(timeoutDurationOption.prop, +e.target.value)} value={settings.timeoutDuration} />
                    </div>
                </div>

                {
                    gameMode === 'single_player' &&
                    <div className='flex space-between'>
                        <div>
                            <p className='option'>{botCountOption.title}</p>

                            {
                                showDescription &&
                                <p className='description'> {botCountOption.description} </p>
                            }

                        </div>
                        <div className='flex-column-center'>
                            <p>{settings.botCount} bots</p>
                            <input className='range' min='1' max='4' type='range' onChange={e => setRange(botCountOption.prop, +e.target.value)} value={settings.botCount} />
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}

export default Settings;