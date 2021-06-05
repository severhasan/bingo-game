import { useState } from 'react';
import Switch from './Switch';

const initialSettings: GameSettings = {
    roles: false,
    maxRounds: 0,
    multipleBingos: false,
    scoring: false,
    timeoutDuration: 20,
    uniqueCards: false,
    uniqueSelection: false,
    unrelatedItems: false
};

const settingsOptions = [
    { title: 'Multiple Bingos', prop: 'multipleBingos', description: 'When Multiple Bingos is on, the players will continue playing until a player finishes all bingos in their card. Otherwise, the game will end when a player finds a bingo.' },
    { title: 'Scoring', prop: 'scoring', description: 'When Scoring is on, the game will keep the score of the players, and each round, players will be granted scores in accordance with their speed of finding the item on their card. Bingos will be rewarded with multiple amounts of points. Whe left off, the game will not keep player scores.' },
    { title: 'Unique Player Cards', prop: 'uniqueCards', description: 'When Unique Player Cards is on, every player will have a unique card. No item on their card will be the same. Otherwise, the players might potentially have the same items on their cards.' },
    { title: 'Unique Item Selection', prop: 'uniqueSelection', description: 'When Unique Player Cards is off, there are two possible scenarios: Firstly, multiple players can select the same item and will be able to proceed. Secondly, only the first player to click on the item will be able to proceed. This could add a bit more of a challenge to the game. When Unique Item Selection is on, only one (the first) player will be able to select the item. Otherwise, the players can select the item any time and will be scored & checked for bingos accordingly. ' },
    { title: 'Player Roles', prop: 'roles', description: 'Element of Surprise' },
    // { title: 'Max Rounds', prop: 'maxRounds', description: 'The maximum rounds in a game'},
    { title: 'Add Extra Items', prop: 'unrelatedItems', description: 'Realistically speaking, when a caller draws an item, no player could potentially have the item on their card. This is only for goofy reasons, otherwise, this does not really serve a great purpose for the game.' }
]
const timeoutDurationOption = { title: 'Round Duration', prop: 'timeoutDuration', description: 'This determines how long a round will take. The shorter, the more challenging it is to select an item.' };

const Settings = ({ showDescription }: { showDescription: boolean }) => {
    const [settings, setSettings] = useState(initialSettings);

    const toggle = (prop: string) => {
        console.log('prop', prop);
        const newSettings = { ...settings };
        newSettings[prop] = !newSettings[prop];
        setSettings(newSettings);
    }

    const setRange = (prop: string, value: number) => {
        console.log('range', value);
        const newSettings = { ...settings };
        newSettings[prop] = value;
        setSettings(newSettings);
    }

    return (
        <div className='settings mb-40'>
            <div className=''>
                {
                    settingsOptions.map((opt, index) => (
                        <div key={'setting_opt_' + index} className='flex space-between'>
                            <div className='mr-20'>
                                <p className='option'>{opt.title}</p>
                                {
                                    showDescription &&
                                    <p className='description'> {opt.description} </p>
                                }
                            </div>
                            <div className='flex-column'>
                                <Switch active={settings[opt.prop]} toggle={() => toggle(opt.prop)} />
                            </div>
                        </div>
                    ))
                }

                <div className='flex space-between'>
                    <div>
                        <p className='option'>{timeoutDurationOption.title}</p>
                        <p className='description'> {timeoutDurationOption.description} </p>
                    </div>
                    <div className='flex-column'>
                        <p>{settings.timeoutDuration} seconds</p>
                        <input min='10' max='60' type='range' onChange={e => setRange(timeoutDurationOption.prop, +e.target.value)} value={settings.timeoutDuration} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings;