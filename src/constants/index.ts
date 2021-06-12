// GAME SETTINGS
export const FREE_BINGO_TEXT = 'MOVIES BINGO';
export const MAX_PLAYER_COUNT = 10;
export const DRAW_ITEM_TIMEOUT = 3; // in seconds
export const COUNTDOWN_TIMEOUT = 15; // in secons
export const UNRELATED_ITEM_MULTIPLIER = 2;
export const MAX_SCORE = 100;
export const DEFAULT_GAME_SETTINGS: GameSettings = {
    multipleBingos: false,
    roles: false,
    unrelatedItems: false,
    timeoutDuration: COUNTDOWN_TIMEOUT,
    uniqueCards: false,
    uniqueSelection: false,
    scoring: false,
    maxRounds: 250,
    botCount: 3
}
// since game is played 5x5, don't want to bother with the algorithm where the grid size might be different
// these are the indices of items on the card
const possibleColumnBingos = [[0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24]];
const possibleRowBingos = [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24]];
const possibleDiogonalBingos = [[4, 8, 12, 16, 20], [0, 6, 12, 18, 24]];
export const POSSIBLE_BINGO_SCENARIOS = [...possibleColumnBingos, ...possibleRowBingos, ...possibleDiogonalBingos];

// received from imdb.com, top 100
export const MOVIES = [
    "The Shawshank Redemption", "The Godfather", "The Godfather: Part II", "The Dark Knight", "12 Angry Men", "Schindler's List", "The Lord of the Rings: The Return of the King", "Pulp Fiction", "The Good, the Bad and the Ugly", "The Lord of the Rings: The Fellowship of the Ring", "Fight Club", "Forrest Gump", "Inception", "The Lord of the Rings: The Two Towers", "Star Wars: Episode V - The Empire Strikes Back", "The Matrix", "Goodfellas", "One Flew Over the Cuckoo's Nest", "Seven Samurai", "Seven", "The Silence of the Lambs", "City of God", "It's a Wonderful Life", "Life Is Beautiful", "Star Wars: Episode IV - A New Hope", "Saving Private Ryan", "Spirited Away", "The Green Mile", "Interstellar", "Parasite", "Leon", "Harakiri", "The Usual Suspects", "The Pianist", "Back to the Future", "Terminator 2: Judgment Day", "Modern Times", "Psycho", "The Lion King", "American History X", "City Lights", "Gladiator", "Whiplash", "The Departed", "Grave of the Fireflies", "Untouchable", "The Prestige", "Casablanca", "Once Upon a Time in the West", "Rear Window", "Cinema Paradiso", "Alien", "Apocalypse Now", "Memento", "Raiders of the Lost Ark", "The Great Dictator", "The Lives of Others", "Django Unchained", "Paths of Glory", "Sunset Blvd.", "WALL·E", "The Shining", "Witness for the Prosecution", "Avengers: Infinity War", "Joker", "Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb", "Spider-Man: Into the Spider-Verse", "Princess Mononoke", "Oldboy", "Hamilton", "Pather Panchali", "Once Upon a Time in America", "Your Name.", "The Dark Knight Rises", "Aliens", "Coco", "Das Boot", "Capernaum", "High and Low", "Avengers: Endgame", "American Beauty", "Toy Story", "Braveheart", "Amadeus", "3 Idiots", "Inglourious Basterds", "Good Will Hunting", "Star Wars: Return of the Jedi", "2001: A Space Odyssey", "Reservoir Dogs", "M", "Like Stars on Earth", "Citizen Kane", "Vertigo", "Requiem for a Dream", "The Hunt", "Singin' in the Rain", "North by Northwest", "Eternal Sunshine of the Spotless Mind", "Come and See",
    "Bicycle Thieves", "Ikiru", "Lawrence of Arabia", "The Kid", "The Father", "Full Metal Jacket", "Dangal", "A Clockwork Orange", "Taxi Driver", "Metropolis", "The Sting", "Double Indemnity", "1917", "Amélie", "The Apartment", "A Separation", "Snatch", "Incendies", "Scarface", "Toy Story 3", "To Kill a Mockingbird", "For a Few Dollars More", "Up", "Indiana Jones and the Last Crusade", "L.A. Confidential", "Rashomon", "Heat", "Yojimbo", "Die Hard", "Ran", "Monty Python and the Holy Grail", "Green Book", "Downfall", "Batman Begins", "Some Like It Hot", "All About Eve", "Unforgiven", "Children of Heaven", "Howl's Moving Castle", "The Great Escape", "The Wolf of Wall Street", "Judgment at Nuremberg", "Casino", "Pan's Labyrinth", "The Treasure of the Sierra Madre", "A Beautiful Mind", "There Will Be Blood", "The Secret in Their Eyes", "Raging Bull", "My Neighbour Totoro", "Chinatown", "Lock, Stock and Two Smoking Barrels", "The Gold Rush", "Three Billboards Outside Ebbing, Missouri", "Dial M for Murder", "No Country for Old Men", "The Seventh Seal", "Shutter Island", "The Elephant Man", "The Thing", "The Sixth Sense", "Inside Out", "V for Vendetta", "Klaus", "The Third Man", "Blade Runner", "The Bridge on the River Kwai", "Trainspotting", "Wild Strawberries", "My Father and My Son", "Warrior", "The Truman Show", "Jurassic Park", "Fargo", "Finding Nemo", "Memories of Murder", "Gone with the Wind", "Tokyo Story", "Kill Bill: Vol. 1", "On the Waterfront", "Stalker", "The General", "The Deer Hunter", "Wild Tales", "Gran Torino", "Sherlock Jr.", "Room", "The Grand Budapest Hotel", "Mary and Max", "Persona", "Before Sunrise", "In the Name of the Father", "Mr. Smith Goes to Washington", "Prisoners", "Gone Girl", "To Be or Not to Be", "Catch Me If You Can", "Hacksaw Ridge", "Barry Lyndon", "The Big Lebowski",
    "Andhadhun", "12 Years a Slave", "Le Mans '66", "The Passion of Joan of Arc", "How to Train Your Dragon", "Mad Max: Fury Road", "The Wages of Fear", "Ben-Hur", "Million Dollar Baby", "Network", "Dead Poets Society", "Stand by Me", "Harry Potter and the Deathly Hallows: Part 2", "Autumn Sonata", "Cool Hand Luke", "The 400 Blows", "The Handmaiden", "The Bandit", "Drishyam 2", "Logan", "Platoon", "Hachi: A Dog's Tale", "La Haine", "Monty Python's Life of Brian", "Spotlight", "Hotel Rwanda", "Into the Wild", "Rush", "Rebecca", "Monsters, Inc.", "Andrei Rublev", "Amores Perros", "Raatchasan", "Rocky", "In the Mood for Love", "Nausicaä of the Valley of the Wind", "It Happened One Night", "Gangs of Wasseypur", "A Silent Voice", "The Battle of Algiers", "Rififi", "Soul", "Before Sunset", "Fanny and Alexander", "The Princess Bride", "Three Colours: Red", "Sunrise: A Song of Two Humans", "Neon Genesis Evangelion: The End of Evangelion", "Drishyam", "The Man Who Shot Liberty Valance"
];


// https://www.empireonline.com/movies/features/100-greatest-movie-characters/
export const RANDOM_MOVIE_CHARACTERS = [
    "Edna Mode", "Randle McMurphy", "Optimus Prime", "Norman Bates", "The Minions", "Maximus", "Legolas", "Wednesday Addams", "Inspector Clouseau", "Inigo Montoya", "Hal", "Groot", "Gromit", "Ethan Hunt", "Red", "Walker", "Corporal Hicks", "Bane", "Woody", "Withnail", "V", "Roy Batty", "Martin Blank", "Samwise Gamgee", "Private William Hudson", "Lisbeth Salander", "Frank Drebin", "Donnie Darko", "Captain Kirk", "Star-Lord", "Tony Montana", "Marge Gunderson", "Neo", "Harry Potter", "Gollum / Sméagol", "Hans Landa", "George Bailey", "Wolverine", "E.T.", "Bilbo Baggins", "Dr. King Schultz", "Ace Ventura", "Sarah Connor", "Katniss Everdeen", "Jack Burton", "Axel Foley", "Amélie Poulain", "Vito Corleone", "Shaun Riley", "Obi-Wan Kenobi", "Luke Skywalker", "Harry Callahan", "Lester Burnham", "Rick Deckard", "Captain America", "Tommy DeVito", "Anton Chigurh", "Amy Dunne", "Lou Bloom", "Keyser Söze", "Ferris Bueller", "Driver", "Yoda", "Walter Sobchak", "Rocky Balboa", "Atticus Finch", "Captain Mal Reynolds", "The Man With No Name", "Jules Winnfield", "Peter Venkman", "Gandalf", "Snake Plissken", "The Terminator (T-800)", "Forrest Gump", "Patrick Bateman", "Ash", "Daniel Plainview", "The Bride", "Travis Bickle", "Hannibal Lecter", "Doc Brown", "Loki", "Rick Blaine", "M. Gustave", "Ron Burgundy", "Aragorn", "Captain Jack Sparrow", "Iron Man", "Marty McFly", "Michael Corleone", "The Dude", "Darth Vader", "Tyler Durden", "John McClane", "The Joker", "Ellen Ripley", "Batman", "Han Solo", "James Bond", "Indiana Jones"
]

export const SOCKET_EVENTS = {
    GAME_CREATED: 'game-created',
    CREATE_NEW_GAME: 'create_new_game',
    SYNC_LOBBY: 'sync_lobby',
    JOIN_LOBBY: 'join_lobby',
    LOBBY_NOT_FOUND: 'lobby_not_found',
    LOBBY_JOINED: 'lobby_joined',
    LOBBY_FULL: 'lobby_full',
    START_GAME: 'start_game',
    STATUS_UPDATE: 'status_update',
    MATCH_UPDATE: 'match_update',
    SELECT_ITEM: 'select_item',
    DISPLAY_ROLE_SELECTION: 'display_role_selection',
    SELECT_ROLE: 'select_role',
    REVEAL_ROLE: 'reveal_role',
    PLAYER_CONNECTED_TO_GAME: 'player_connected_to_game',
    PLAYER_READY: 'ready player one',
}


export const PLAYER_ROLES: { [key: string]: { type: PlayerRole, displayName: string } } = {
    pollyanna: { type: 'pollyanna', displayName: 'Pollyanna' },
    sinister: { type: 'sinister', displayName: 'Sinister' },
    lucky: { type: 'lucky', displayName: 'Lucky' }
}