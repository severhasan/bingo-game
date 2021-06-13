import { MOVIES, FREE_BINGO_TEXT, POSSIBLE_BINGO_SCENARIOS } from '../constants';

export default class Bingo {
    static maximumScore = 100;
    static minimumScore = 10;
    static baseBotScore = 70;
    static bingoScore = 200;
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

    /** calculates the score on time basis. Start and now should be given as Date.now in milliseconds & number. Max score is 100. Min score is 10. */
    static calculateScore(start: number, roundDuration: number) {
        const now = Date.now();
        if (start <= now - (roundDuration * 1000)) return 0;

        const secondsDiff = ((now - start) / 1000);
        const scoreDiffPerSecond = this.maximumScore / roundDuration;
        
        const score = Math.round(this.maximumScore - (scoreDiffPerSecond * secondsDiff));
        return score > this.minimumScore ? score : this.minimumScore;
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
        console.log('passes', bool1 && bool2);
        console.log('');
    })
}
// testGenerateCards();
const testCalculateScore = () => {
    const minScore = Bingo.minimumScore;
    const conditions = [
        { duration: 15, timeDiff: 1000, expectedResult: 93, validate: (result: number) => result === 93 }, // 6.66 pts per second
        { duration: 15, timeDiff: 3000, expectedResult: 80, validate: (result: number) => result === 80 },
        { duration: 15, timeDiff: 3200, expectedResult: 79, validate: (result: number) => result === 79 },
        { duration: 15, timeDiff: 5000, expectedResult: 67, validate: (result: number) => result === 67 },
        { duration: 15, timeDiff: 11800, expectedResult: 21, validate: (result: number) => result === 21 },
        { duration: 15, timeDiff: 14000, expectedResult: minScore, validate: (result: number) => result === minScore },
        { duration: 15, timeDiff: 14500, expectedResult: minScore, validate: (result: number) => result === minScore },
        { duration: 15, timeDiff: 15001, expectedResult: 0, validate: (result: number) => result === 0 }, 
        { duration: 15, timeDiff: 15000, expectedResult: 0, validate: (result: number) => result === 0 },

        // give break, pff
        { duration: -1, timeDiff: 0, expectedResult: 0, validate: (result: number) => null },

        {duration: 60, timeDiff: 1000, expectedResult: 98, validate: (result: number) => result === 98 }, // 1.6 pts per second
        {duration: 60, timeDiff: 3000, expectedResult: 95, validate: (result: number) => result === 95 },
        {duration: 60, timeDiff: 13200, expectedResult: 79, validate: (result: number) => result === 78 },
        {duration: 60, timeDiff: 29365, expectedResult: 51, validate: (result: number) => result === 51 },
        {duration: 60, timeDiff: 29665, expectedResult: 51, validate: (result: number) => result === 51 },
        {duration: 60, timeDiff: 30000, expectedResult: 50, validate: (result: number) => result === 50 },
        {duration: 60, timeDiff: 44800, expectedResult: 25, validate: (result: number) => result === 25 },
        {duration: 60, timeDiff: 56500, expectedResult: minScore, validate: (result: number) => result === minScore },
        {duration: 60, timeDiff: 59900, expectedResult: minScore, validate: (result: number) => result === minScore },
        {duration: 60, timeDiff: 60001, expectedResult: 0, validate: (result: number) => result === 0 },
    ]

    conditions.forEach((cond, idx) => {
        const score = Bingo.calculateScore(Date.now() - cond.timeDiff, cond.duration);
        if (cond.duration === -1) console.log('')
        else console.log('condition', idx + 1, 'expected result:', cond.expectedResult, 'result:', score, '| condition passes:', cond.validate(score));
    })

}