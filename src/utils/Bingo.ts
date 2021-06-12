import { MOVIES, FREE_BINGO_TEXT, POSSIBLE_BINGO_SCENARIOS } from '../constants';

export default class Bingo {
    static generateCards(uniqueCards: boolean, playerCount: number): ({ cards: string[][], stack: string[] }) {
        if (playerCount > 10 || playerCount <= 0) {
            return { stack: [], cards: [] };
        }
        const cards: string[][] = [];
        let count = 0;
        let shuffledStack = this.shuffle([...MOVIES]);
        while (count < playerCount) {
            let newCard: string[];
            if (uniqueCards) {
                newCard = shuffledStack.slice(count * 24, (count + 1) * 24);
            } else {
                shuffledStack = this.shuffle([...MOVIES]);
                newCard = shuffledStack.slice(0, 24);
            }
            newCard.splice(12, 0, FREE_BINGO_TEXT);
            cards.push(newCard);
            count++;
        }
        const stackSet = new Set([...cards.flat()]);
        stackSet.delete(FREE_BINGO_TEXT);
        const stack = [...stackSet];
        return { cards, stack };
    }
    static generateNewGame(settings: GameSettings) {
        const { cards, stack } = this.generateCards(settings.uniqueCards, settings.botCount + 1); // bot count + player

        const playerCard = cards[0];
        const computerCards = cards.slice(1,);
        return { stack, playerCard, computerCards };
        // return { stack: [...playerCard.slice(0, 5), ...stack], playerCard, computerCards }; // test player win;
    }

    static pickRandomItem(stack: string[]) {
        let randomItem = stack[0];
        let randomIndex = 0;
        const newStack = [...stack];
        if (newStack.length > 1) {
            randomIndex = Math.round(Math.random() * (stack.length - 1));
        }
        randomItem = newStack.splice(randomIndex, 1)[0];
        // randomItem = newStack.splice(0, 1)[0]; // for testing purposes
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


// test when generateCards function changes
const testGenerateCards = () => {
    const conditions = [
        { title: 'player count > 10', stackSize: 0, cardSize: 0, playerCount: 11, uniqueCards: true },
        { title: 'player count <= 0', stackSize: 0, cardSize: 0, playerCount: -1, uniqueCards: true },
        { title: 'player count === 1 && uniqueCards', stackSize: 24, cardSize: 1, playerCount: 1, uniqueCards: true },
        { title: 'player count === 2 && uniqueCards', stackSize: 48, cardSize: 2, playerCount: 2, uniqueCards: true },
        { title: 'player count === 5 && uniqueCards', stackSize: 120, cardSize: 5, playerCount: 5, uniqueCards: true },
        { title: 'player count === 1 && !uniqueCards', stackSize: 24, cardSize: 1, playerCount: 1, uniqueCards: false },
        { title: 'player count === 2 && !uniqueCards', stackSize: 48, cardSize: 2, playerCount: 2, uniqueCards: false },
        { title: 'player count === 5 && !uniqueCards', stackSize: 120, cardSize: 5, playerCount: 5, uniqueCards: false },
    ]

    conditions.forEach((condition, index) => {
        const { cards, stack } = Bingo.generateCards(condition.uniqueCards, condition.playerCount);
        const stackSet = new Set(stack);
        console.log(condition.title)
        const bool1 = condition.cardSize === cards.length;
        const bool2 = condition.uniqueCards ? stackSet.size === condition.stackSize : stackSet.size <= condition.stackSize;
        console.log('expectedResult:', 'stakSize:', condition.stackSize, 'cardSize:', condition.cardSize, '| results: stackSize: ', stackSet.size, 'cardSize', cards.length);
        console.log('passes', bool1 && bool2 );
        console.log('');
    })
}
// testGenerateCards();