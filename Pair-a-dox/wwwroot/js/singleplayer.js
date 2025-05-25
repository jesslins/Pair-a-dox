// ========== 1. Card Attributes ==========
const counts = ['single', 'double', 'triple'];
const colors = ['pink', 'cyan', 'yellow'];
const shadings = ['solid', 'striped', 'empty'];
const shapes = ['cloud', 'heart', 'star'];

let deck = [];
let currentId = 1;

// Build full deck (81 unique cards)
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

// Shuffle the deck
deck = deck.sort(() => Math.random() - 0.5);

// ========== 2. DOM and State ==========
const cardsContainer = document.getElementById('cards');
const addCardsButton = document.getElementById('addCards');
const doxButton = document.querySelector('#dox.button');

let cardsInPlay = [];
let selectedCards = [];
let isDoxMode = false;
let addCardsTimeout = null;
let doxTimeout = null;
let points = 0;
let scoreBoard;
let currentColumns = 4; // initial 3x4 layout (4 columns)
let currentScale = 1;   // initial vertical scale


// ========== 3. Render Initial 12 Cards ==========
function renderInitialCards() {
    cardsInPlay = deck.splice(0, 12);
    cardsContainer.innerHTML = '';
    cardsInPlay.forEach(renderCard);
    updateGridColumns();
}



function renderCard(card) {
    const li = document.createElement('li');
    li.className = 'card';
    li.dataset.cardId = card.id;
    li.innerHTML = `<img src="/img/cards/${card.id}-${card.count}-${card.color}-${card.shading}-${card.shape}.jpg" />`;
    cardsContainer.appendChild(li);
}

// ========== 4. Utility: Parse Attributes ==========
function getCardAttributes(cardElement) {
    const src = cardElement.querySelector('img').src;
    const filename = src.split('/').pop().replace('.jpg', '');
    const parts = filename.split('-');
    return {
        count: parts[1],
        color: parts[2],
        shading: parts[3],
        shape: parts[4]
    };
}

function isValidAttribute(a, b, c) {
    return (a === b && b === c) || (a !== b && a !== c && b !== c);
}

function isValidSet(cards) {
    const attrs = cards.map(getCardAttributes);
    return ['count', 'color', 'shading', 'shape'].every(attr =>
        isValidAttribute(attrs[0][attr], attrs[1][attr], attrs[2][attr])
    );
}

// ========== 5. Replace Found Set ==========
function replaceCards(selectedCards) {
    for (let card of selectedCards) {
        const li = card;
        const index = [...cardsContainer.children].indexOf(li);

        // If we're above 12 cards, just remove selected cards
        if (cardsInPlay.length > 12) {
            cardsInPlay.splice(index, 1);
            li.remove();

        } else {
            // Otherwise, do normal replacement
            const newCard = deck.shift();
            if (newCard) {
                cardsInPlay[index] = newCard;
                li.dataset.cardId = newCard.id;
                li.innerHTML = `<img src="/img/cards/${newCard.id}-${newCard.count}-${newCard.color}-${newCard.shading}-${newCard.shape}.jpg" />`;
                li.classList.remove('selected');
            } else {
                cardsInPlay.splice(index, 1);
                li.remove();
            }
        }
    }
    updateCardBoardLayout();
}


// ========== 6. Add Cards Logic ==========
function activateAddCardsButton() {
    addCardsButton.classList.remove('inactive');
    addCardsButton.classList.add('active');
}

function deactivateAddCardsButton() {
    addCardsButton.classList.remove('active');
    addCardsButton.classList.add('inactive');
}

function startAddCardsTimer() {
    const cardsCount = cardsContainer.children.length;
    clearTimeout(addCardsTimeout);
    deactivateAddCardsButton();
    if (cardsCount < 21) {
        addCardsTimeout = setTimeout(() => {
            activateAddCardsButton();
        }, 1000); // 1 minute
    }
}

function updateCardBoardLayout() {
    const cardsContainer = document.getElementById('cards');
    const mainLayout = document.getElementById('main-layout');
    const cardsCount = cardsContainer.children.length;

    // Set columns count based on cards count and currentColumns
    // You can customize these thresholds
    if (cardsCount <= 12) {
        currentColumns = 4;   // 3 rows x 4 columns
        currentScale = 1;
        mainLayout.style.gridTemplateColumns = '28% 72%';
    } else if (cardsCount <= 15) {
        currentColumns = 5;   // 3 rows x 5 columns
        currentScale = 0.97;
        mainLayout.style.gridTemplateColumns = '19% 81%';
    } else if (cardsCount <= 18) {
        currentColumns = 6;   // 3 rows x 6 columns
        currentScale = 0.94;
        mainLayout.style.gridTemplateColumns = '19% 81%';
    } else {
        currentColumns = Math.ceil(cardsCount / 3); // general fallback
        currentScale = 0.91;
        mainLayout.style.gridTemplateColumns = '19% 81%';
    }

    // Apply CSS grid columns
    cardsContainer.style.gridTemplateColumns = `repeat(${currentColumns}, minmax(100px, 150px))`;

    // Apply vertical scale
    cardsContainer.style.transform = `scale(${currentScale})`;
}



function updateGridColumns() {
    const columns = cardsInPlay.length / 3;
    cardsContainer.style.gridTemplateColumns = `repeat(${columns}, minmax(100px, 150px))`;
}

function addThreeCardsToBoard() {
    if (deck.length === 0) return;
    const cardsToAdd = deck.splice(0, 3);

    const currentChildren = Array.from(cardsContainer.children);
    const columns = currentColumns; // use the actual current column count
    const rows = Math.ceil(cardsInPlay.length / columns);

    cardsToAdd.forEach((card, i) => {
        const row = i;
        const insertIndex = Math.min((row + 1) * columns + i, currentChildren.length);

        cardsInPlay.splice(insertIndex, 0, card);

        const cardEl = document.createElement('li');
        cardEl.className = 'card';
        cardEl.dataset.cardId = card.id;
        cardEl.innerHTML = `<img src="/img/cards/${card.id}-${card.count}-${card.color}-${card.shading}-${card.shape}.jpg" />`;

        if (insertIndex >= currentChildren.length) {
            cardsContainer.appendChild(cardEl);
        } else {
            cardsContainer.insertBefore(cardEl, currentChildren[insertIndex]);
        }
    });

    updateCardBoardLayout();
    updateGridColumns();
}





// ========== 7. Dox Mode ==========
function enterDoxMode() {
    if (isDoxMode) return;

    isDoxMode = true;
    selectedCards = [];
    updateCardSelectionUI();
    doxButton.classList.add('inactive');
    doxButton.classList.remove('active');

    clearTimeout(doxTimeout);
    doxTimeout = setTimeout(() => {
        exitDoxMode();
        points--;
        updateScoreBoard()
    }, 10000); // 10 seconds max dox window
}

function exitDoxMode() {
    isDoxMode = false;
    selectedCards = [];
    updateCardSelectionUI();
    doxButton.classList.remove('inactive');
    doxButton.classList.add('active');
    clearTimeout(doxTimeout);
}

function updateCardSelectionUI() {
    document.querySelectorAll('.card').forEach(cardEl => {
        cardEl.classList.remove('selected');
    });

    selectedCards.forEach(card => {
        card.classList.add('selected');
    });
}

// ========== 8. Score Updating ===========
function updateScoreBoard() {
    console.log('updating score to ', points);
    if (scoreBoard) {
        scoreBoard.innerText = points.toString();
    }
}

// ========== 8. Event Listeners ==========
cardsContainer.addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (!card || !isDoxMode) return;

    if (selectedCards.includes(card)) {
        selectedCards = selectedCards.filter(c => c !== card);
    } else {
        if (selectedCards.length < 3) {
            selectedCards.push(card);
        }
    }

    updateCardSelectionUI();

    if (selectedCards.length === 3) {
        if (isValidSet(selectedCards)) {
            points++;
            updateScoreBoard();
            replaceCards(selectedCards);
            exitDoxMode();
            startAddCardsTimer();
        } else {
            points--;
            updateScoreBoard();
            selectedCards = [];
            updateCardSelectionUI();
            exitDoxMode();
            startAddCardsTimer();
        }
    }
});

addCardsButton.addEventListener('click', () => {
    if (!addCardsButton.classList.contains('active')) return;
    addThreeCardsToBoard();
    deactivateAddCardsButton();
    startAddCardsTimer();
});

doxButton.addEventListener('click', () => {
    enterDoxMode();
});

// ========== 9. Start the Game ==========
document.addEventListener('DOMContentLoaded', () => {
    scoreBoard = document.getElementById('playerScore');

    renderInitialCards();
    startAddCardsTimer();
    updateScoreBoard();
});