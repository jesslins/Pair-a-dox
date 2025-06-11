namespace Pair_a_dox.wwwroot.js
{

    // ========== AI Difficulty Setup ==========
    // Difficulty options
    const AI_DIFFICULTY = {
        NONE: 'none',
        EASY: 'easy',
        MEDIUM: 'medium',
        HARD: 'hard'
    };

    // Current difficulty (default is NONE)
    let currentAIDifficulty = AI_DIFFICULTY.NONE;

    // AI Score
    let aiPoints = 0;
    let aiScoreBoard;

    // ========== Helper: Get All Valid Sets ==========
    // Returns all valid sets currently in play
    function getValidSetsInPlay() {
        const allCards = Array.from(cardsContainer.children);
        const validSets = [];

        for (let i = 0; i < allCards.length - 2; i++) {
            for (let j = i + 1; j < allCards.length - 1; j++) {
                for (let k = j + 1; k < allCards.length; k++) {
                    const trio = [allCards[i], allCards[j], allCards[k]];
                    if (isValidSet(trio)) validSets.push(trio);
                }
            }
        }
        return validSets;
    }

    // ========== AI Move Simulation ==========
    // AI attempts to find and play a valid set based on difficulty
    function aiMakeMove() {
        const sets = getValidSetsInPlay();
        if (sets.length === 0) {
            console.log('[AI] No valid sets on board.');
            return;
        }

        let selectedSet;
        let delay;
        let chanceToPlay;

        // Behavior by difficulty
        switch (currentAIDifficulty) {
            case AI_DIFFICULTY.EASY:
                delay = getRandomInt(6000, 9000); // 6–9 sec
                chanceToPlay = 0.4;
                break;
            case AI_DIFFICULTY.MEDIUM:
                delay = getRandomInt(4000, 6000); // 4–6 sec
                chanceToPlay = 0.75;
                break;
            case AI_DIFFICULTY.HARD:
                delay = getRandomInt(1500, 3000); // 1.5–3 sec
                chanceToPlay = 1.0;
                break;
            default:
                return; // Do nothing if NONE
        }

        // AI decision delay
        setTimeout(() => {
            if (Math.random() <= chanceToPlay) {
                selectedSet = sets[Math.floor(Math.random() * sets.length)];
                console.log(`[AI - ${currentAIDifficulty}] Found a set!`);
                replaceCards(selectedSet);
                aiPoints++;
                updateScoreBoard();
            } else {
                console.log(`[AI - ${currentAIDifficulty}] Missed the chance.`);
            }
        }, delay);
    }

    // ========== AI Loop ==========
    // AI checks and acts every 8 seconds
    function startAIAutoPlay() {
        setInterval(() => {
            if (currentAIDifficulty !== AI_DIFFICULTY.NONE) {
                aiMakeMove();
            }
        }, 8000);
    }

    // ========== Handle Difficulty Changes ==========
    // Called when player selects a new AI difficulty
    function onDifficultyChange(newDifficulty) {
        currentAIDifficulty = newDifficulty;
        updateAIScoreboardVisibility();
        resetGame();

        if (newDifficulty === AI_DIFFICULTY.NONE) {
            renderInitialCards();
            startAddCardsTimer();
        } else {
            console.log(`AI mode started: ${newDifficulty}`);
            renderInitialCards();
            startAIAutoPlay();
        }

        updateScoreBoard();
    }

    // ========== Reset Game State ==========
    function resetGame() {
        // Reset deck and state
        deck = [];
        currentId = 1;

        for (let shape of shapes) {
            for (let color of colors) {
                for (let count of counts) {
                    for (let shading of shadings) {
                        deck.push({
                            id: currentId++,
                            count,
                            color,
                            shading,
                            shape
                        });
                    }
                }
            }
        }

        deck = deck.sort(() => Math.random() - 0.5);

        cardsInPlay = [];
        selectedCards = [];
        points = 0;
        aiPoints = 0;
        isDoxMode = false;

        cardsContainer.innerHTML = '';
        clearTimeout(addCardsTimeout);
        clearTimeout(doxTimeout);
    }

    // ========== Scoreboard Update ==========
    function updateScoreBoard() {
        if (scoreBoard) scoreBoard.innerText = points.toString();
        if (aiScoreBoard) aiScoreBoard.innerText = aiPoints.toString();
    }

    // ========== Scoreboard Visibility ==========
    function updateAIScoreboardVisibility() {
        const container = document.getElementById('aiScoreContainer');
        if (currentAIDifficulty === AI_DIFFICULTY.NONE) {
            container.style.display = 'none';
        } else {
            container.style.display = 'block';
        }
    }

    // ========== Utility ==========
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // ========== Event Listener for Difficulty Change ==========
    document.getElementById('aiDifficulty').addEventListener('change', (e) => {
        onDifficultyChange(e.target.value);
    });


    // ========== Initial Setup ==========
    //document.addEventListener('DOMContentLoaded', () => {
    //    aiScoreBoard = document.getElementById('aiScore');
    //    onDifficultyChange(currentAIDifficulty); // Trigger based on default
    //});

}
