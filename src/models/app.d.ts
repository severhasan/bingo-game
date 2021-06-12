
type GameStatus = 'not_started' | 'role_selection' | 'drawing_item' | 'computer_picked_item' | 'item_selected' | 'missed_selection' | 'game_starting' | 'game_finished';
type PlayerStatus = 'healthy' | 'stunned' | 'distorted';
type PlayerRole = 'pollyanna' | 'sinister' | 'lucky';
type PlayerCurseInfluence = 'global' | 'individual';
type PlayerCurseType = 'stun | distort';
type PlayerLuckType = 'change_next_round_item' | 'dodge_curse' | 'get_more_heal_points';

interface BingoTableProps {
    /** Grids will determine the number of grids a table has. This will make the game more customizable */
    playerCard: string[],
    selectedItems: string[],
    selectItem: (item: string) => void
}

interface StatusBarProps {
    // remainingRounds: number, // legacy
    status: GameStatus,
    /** name of the current movie drawn by the caller */
    movie: string,
    bingoCount: number,
    reset: () => void,
    /** since the duration of the rounds is now dynamic, we need to set it up every time (in seconds) */
    timeoutDuration: number,
    winner: string,
    playerName: string,
    /** When playing single player mode againt the computer, the player may not have an item on their card, and the computer might just pick the item. Then this will be used */
    goNextRound: () => void,
    uniqueSelection: boolean,
    uniqueCards: boolean,
    playerCardIncludesMovie: boolean,
    otherCardsIncludeMovie: boolean
}

type GameMode = 'demo' | 'single_player' | 'against_computer' | 'multiplayer';
interface GameComponentProps {
    gameMode: GameMode,
    playerCount: number,
    roomId?: string
}

interface GameSettings {
    /** multiple bingos could provide a longer & more dynamic game */
    multipleBingos: boolean,
    roles: boolean,
    /** unrelated items means that no player will be able to select the current item since the item does not exist on any card. This makes the game a bit more realistic.
    * Currently, we will not provide any option for how many unrelated items there should be in the stack since this option will not be really valuable for the gameplay.
    */
    unrelatedItems: boolean,
    // the time duration (in seconds) the players are allowed to select an item on their card
    timeoutDuration: number,
    /** the game can produce unique player cards. If this option is activated, then the multiple selection option should be automatically deactivated */
    uniqueCards: boolean,
    /** if thep player cards are not unique, then the players may or may not select the same item. The first player to select the item will be rewarded. */
    uniqueSelection: boolean,
    scoring: boolean,
    // if scoring system is activated, there is a potential that ((player * 5) - 1) rounds may pass before someone has a bingo. Limiting rounds might be helpful in this.
    maxRounds: number,
    /** if it single player mode, than we can choose how many computers there should be */
    botCount: number
}

interface PlayerHeal {
    round: number,
    score: number,
    type: 'friend' | 'self'
}
interface PlayerCurse {
    round: number,
    influence: 'global' | 'individual',
    type: PlayerCurseType,
}
interface PlayerLuck {
    round: number,
    type: PlayerLuckType,
    score: number
}

interface SettingsProps {
    gameMode: GameMode, 
    showDescription: boolean,
    settings: GameSettings,
    close?: () => void,
    setSettings: (newSettings: GameSettings) => void,
}

interface ScoreBoardProps {
    players?: ScoreBoardPlayer[],

}
interface ScoreBoardPlayer {
    /** matches holds the indices */
    matches: number[],
    name: string,
    bingos: number,
    score?: number
}


interface GamePlayer {
    matches: string[],
    card: string[],
    name: string,
}