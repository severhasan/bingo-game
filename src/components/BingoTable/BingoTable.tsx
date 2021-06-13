import { useEffect, useState } from 'react';
import { FREE_BINGO_TEXT } from '../../constants';
// helper function for grids & items
const generateGridsWithRows = (arr: string[], step: number): string[][] => {
    const slices = [];
    let index = 0;
    let currentStep = step;
    while (arr.length && currentStep && currentStep <= arr.length) {
        console.log('currentStep', currentStep, arr.length);
        slices.push(arr.slice(index, currentStep));
        index += step;
        currentStep += step;
    }
    return slices;
}

const BingoTable = ({ scoreLogs, playerCard, selectedItems, selectItem }: BingoTableProps) => {
    const gridItemCount = Math.sqrt(playerCard.length);
    const freeCardIndex = (playerCard.length - 1) / 2;

    return (
        <div className='bingo-wrapper'>
            <div style={{ gridTemplateColumns: `${playerCard.slice(0, gridItemCount).map(i => '1fr').join(' ')}` }} className='bingo-table'>
                {
                    playerCard.map((movie, index) => (
                        <div
                            key={'bingo_table_item_' + index}
                            onClick={() => selectItem(movie)}
                            className={`item ${selectedItems.includes(movie) && movie !== FREE_BINGO_TEXT ? 'selected-item' : ''} ${index === freeCardIndex ? 'free-card' : ''}`}
                        >
                            {
                                scoreLogs[movie] ?
                                    <>
                                        <div className='score score-anim'>
                                            <div className='delayed-fadeout'>
                                                <span className='points grow'>+{scoreLogs[movie].points}</span>
                                            </div>
                                        </div>
                                        <div className='mini-score'>
                                            <span className='points'>{scoreLogs[movie].points} pts.</span>
                                        </div>
                                    </>
                                    : null
                            }
                            {movie}
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default BingoTable;