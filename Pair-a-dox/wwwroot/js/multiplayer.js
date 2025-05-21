const socket = io('https://pairadoxserver.azurewebsites.net', {
    transports: ['websocket']
});

// === Card Attributes ===
const counts = ['single', 'double', 'triple'];
const colors = ['pink', 'cyan', 'yellow'];
const shadings = ['solid', 'striped', 'empty'];
const shapes = ['cloud', 'heart', 'star'];

let deck = [];
let currentId = 1;

for (let shape of shapes) {
    for (let color of colors) {
        for (let count of counts) {
            for (let shading of shadings) {
                deck.push({ id: currentId++, count, color, shading, shape });
            }
        }
    }
}

deck = deck.sort(() => Math.random() - 0.5);

// === DOM and State ===
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
let currentColumns = 4;
let currentScale = 1;

// === Socket Events ===
socket.on('connect', () => console.log('Connected to server'));
socket.on('gameState', ({ cardsInPlay: newCardsInPlay, pointsByPlayer }) => {
    // Update local cardsInPlay with the authoritative server state
    cardsInPlay = newCardsInPlay;

    // Re-render the cards on the board from the updated cardsInPlay
    cardsContainer.innerHTML = '';
    cardsInPlay.forEach(renderCard);
    updateGridColumns();
    updateCardBoardLayout();

    // Update your local points from pointsByPlayer using your socket id
    if (pointsByPlayer && socket.id in pointsByPlayer) {
        points = pointsByPlayer[socket.id];
        updateScoreBoard();
    }

    // Clear selection since game state changed
    selectedCards = [];
    updateCardSelectionUI();
    exitDoxMode();
});
socket.on('setResult', ({ success, message }) => {
    console.log('setResult received:', success, message);
    if (success) {
        points++;
        replaceCards(selectedCards);
    } else {
        points--;
    }

    updateScoreBoard();
    selectedCards = [];
    updateCardSelectionUI();
    exitDoxMode();
    startAddCardsTimer();

    // Optional: show feedback
    console.log(message);
});

// === Initialization ===
document.addEventListener('DOMContentLoaded', () => {
    scoreBoard = document.getElementById('playerScore');
    renderInitialCards();
    startAddCardsTimer();
    updateScoreBoard();
});

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

function updateGridColumns() {
    const columns = cardsInPlay.length / 3;
    cardsContainer.style.gridTemplateColumns = `repeat(${columns}, minmax(100px, 150px))`;
}

function updateCardBoardLayout() {
    const cardsCount = cardsContainer.children.length;
    if (cardsCount <= 12) {
        currentColumns = 4; currentScale = 1;
    } else if (cardsCount <= 15) {
        currentColumns = 5; currentScale = 0.95;
    } else if (cardsCount <= 18) {
        currentColumns = 6; currentScale = 0.9;
    } else {
        currentColumns = Math.ceil(cardsCount / 3); currentScale = 0.85;
    }
    cardsContainer.style.gridTemplateColumns = `repeat(${currentColumns}, minmax(100px, 150px))`;
    cardsContainer.style.transform = `scaleY(${currentScale})`;
}

function getCardAttributes(cardElement) {
    const src = cardElement.querySelector('img').src;
    const parts = src.split('/').pop().replace('.jpg', '').split('-');
    return { count: parts[1], color: parts[2], shading: parts[3], shape: parts[4] };
}

function replaceCards(cards) {
    for (let card of cards) {
        const li = card;
        const index = [...cardsContainer.children].indexOf(li);
        if (cardsInPlay.length > 12) {
            cardsInPlay.splice(index, 1);
            li.remove();
        } else {
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

function activateAddCardsButton() {
    addCardsButton.classList.remove('inactive');
    addCardsButton.classList.add('active');
}

function deactivateAddCardsButton() {
    addCardsButton.classList.remove('active');
    addCardsButton.classList.add('inactive');
}

function startAddCardsTimer() {
    clearTimeout(addCardsTimeout);
    deactivateAddCardsButton();
    addCardsTimeout = setTimeout(activateAddCardsButton, 1000);
}

function addThreeCardsToBoard() {
    if (deck.length === 0) return;
    const cardsToAdd = deck.splice(0, 3);
    const currentChildren = Array.from(cardsContainer.children);
    const rowLength = cardsInPlay.length / 3;

    cardsToAdd.forEach((card, i) => {
        const insertIndex = (i + 1) * rowLength + i;
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
        updateScoreBoard();
    }, 10000);
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
    document.querySelectorAll('.card').forEach(el => el.classList.remove('selected'));
    selectedCards.forEach(card => card.classList.add('selected'));
}

function updateScoreBoard() {
    if (scoreBoard) scoreBoard.innerText = points.toString();
}

// === Event Listeners ===
cardsContainer.addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (!card || !isDoxMode) return;

    if (selectedCards.includes(card)) {
        selectedCards = selectedCards.filter(c => c !== card);
    } else if (selectedCards.length < 3) {
        selectedCards.push(card);
    }

    updateCardSelectionUI();

    if (selectedCards.length === 3) {
        const selectedIds = selectedCards.map(c => parseInt(c.dataset.cardId));
        socket.emit('selectCards', selectedIds);
    }
});

addCardsButton.addEventListener('click', () => {
    if (!addCardsButton.classList.contains('active')) return;
    addThreeCardsToBoard();
    deactivateAddCardsButton();
    startAddCardsTimer();
});

doxButton.addEventListener('click', enterDoxMode);
