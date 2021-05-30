
type GameStatus = 'not_started' | 'drawing_item' | 'item_selected' | 'game_starting' | 'game_finished';

interface BingoTableProps {
    /** Grids will determine the number of grids a table has. This will make the game more customizable */
    playerCard: string[],
    selectedItems: string[],
    selectItem: (item: string) => void
}

interface StatusBarProps {
    remainingRounds: number,
    status: GameStatus,
    /** name of the current movie drawn by the caller */
    movie: string,
    bingoCount: number,
    reset: () => void,
}

type GameMode = 'single_player' | 'against_computer' | 'multiplayer';
interface GameComponentProps {
    gameMode: GameMode,
    playerCount: number
}