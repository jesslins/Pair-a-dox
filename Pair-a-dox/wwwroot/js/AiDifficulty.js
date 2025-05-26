// Define difficulty levels for AI
const AI_DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
};

// Default difficulty level
let currentAIDifficulty = AI_DIFFICULTY.EASY;
// Returns an array of all valid sets currently on the board
function getValidSetsInPlay() {
    const allCards = Array.from(cardsContainer.children);
    const validSets = [];

    // Loop through every combination of 3 cards
    for (let i = 0; i < allCards.length - 2; i++) {
        for (let j = i + 1; j < allCards.length - 1; j++) {
            for (let k = j + 1; k < allCards.length; k++) {
                const trio = [allCards[i], allCards[j], allCards[k]];
                if (isValidSet(trio)) {
                    validSets.push(trio); // Save valid set
                }
            }
        }
    }

    return validSets;
}
// The AI tries to find and play a set based on difficulty
function aiMakeMove() {
    const sets = getValidSetsInPlay();

    if (sets.length === 0) {
        console.log('[AI] No valid sets available.');
        return;
    }

    let selectedSet;
    let delay;
    let chanceToPlay;

    // Configure AI behavior by difficulty
    switch (currentAIDifficulty) {
        case AI_DIFFICULTY.EASY:
            delay = getRandomInt(6000, 9000);       // Reacts slowly (6–9 sec)
            chanceToPlay = 0.4;                     // 40% chance to play
            break;

        case AI_DIFFICULTY.MEDIUM:
            delay = getRandomInt(4000, 6000);       // Reacts moderately (4–6 sec)
            chanceToPlay = 0.75;                    // 75% chance to play
            break;

        case AI_DIFFICULTY.HARD:
            delay = getRandomInt(1500, 3000);       // Reacts quickly (1.5–3 sec)
            chanceToPlay = 1.0;                     // Always plays if a set is available
            break;
    }

    // Delay AI decision to simulate human reaction time
    setTimeout(() => {
        if (Math.random() <= chanceToPlay) {
            // Choose a random valid set
            selectedSet = sets[Math.floor(Math.random() * sets.length)];
            console.log(`[AI - ${currentAIDifficulty}] Played a set.`);
            replaceCards(selectedSet);
        } else {
            console.log(`[AI - ${currentAIDifficulty}] Missed the opportunity.`);
        }
    }, delay);
}
// Runs the AI every few seconds to simulate continuous play
function startAIAutoPlay() {
    setInterval(() => {
        aiMakeMove(); // Try to find and play a set
    }, 8000); // AI checks the board every 8 seconds
}
//** BACK TO JS **

    // Update difficulty level when user selects a new one
    document.getElementById('aiDifficulty').addEventListener('change', (e) => {
        currentAIDifficulty = e.target.value;
    });
// Returns a random integer between min and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// Run setup and start AI when page is ready
document.addEventListener('DOMContentLoaded', () => {
    scoreBoard = document.getElementById('playerScore');
    renderInitialCards();
    startAddCardsTimer();
    updateScoreBoard();
    startAIAutoPlay(); // Start the AI loop
});