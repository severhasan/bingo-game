import { MOVIES, FREE_BINGO_TEXT, POSSIBLE_BINGO_SCENARIOS } from '../constants';

export default class Bingo {
    static generateNewGame() {
        const shuffledStack = this.shuffle([...MOVIES]);

        const playerCard = shuffledStack.slice(0, 24);
        const computerCard = shuffledStack.slice(24, 48);
        const stack = this.shuffle([...computerCard, ...playerCard]);

        playerCard.splice(12, 0, FREE_BINGO_TEXT);
        computerCard.splice(12, 0, FREE_BINGO_TEXT);
        return { stack, playerCard, computerCard };
    }

    static pickRandomItem(stack: string[]) {
        let randomItem = stack[0];
        let randomIndex = 0;
        const newStack = [...stack];
        if (newStack.length > 1) {
            randomIndex = Math.round(Math.random() * (stack.length - 1));
        }
        randomItem = newStack.splice(randomIndex, 1)[0];
        return { newStack, randomItem };
    }


    /** takes player card and item matches, looks for matching indices and calculates the bingo count */
    static getBingos(card: string[], matches: string[]) {
        let bingos = 0;
        const indices = matches.map(match => card.indexOf(match));
        for (const scenario of POSSIBLE_BINGO_SCENARIOS) {
            const matchingIndices = indices.filter(i => scenario.includes(i));
            if (scenario.length === matchingIndices.length) {
                bingos++;
            }
        }
        return bingos;
    }

    /** shuffle the items in the stack - thank you stackoverflow */
    static shuffle(arr: string[]) {
        let currentIndex = arr.length, temporaryValue: string, randomIndex: number;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = arr[currentIndex];
            arr[currentIndex] = arr[randomIndex];
            arr[randomIndex] = temporaryValue;
        }
        return arr;
    }
}