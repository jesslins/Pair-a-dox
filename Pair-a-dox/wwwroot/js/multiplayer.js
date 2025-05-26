let playerName = '';

promptForName();

const socket = io('https://pairadoxserver.azurewebsites.net', {
    transports: ['websocket'],
    auth: {
        playerName,
    }
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
const addCardsVoteModal = document.getElementById('addCardsVoteModal');
const voteYesBtn = document.getElementById('voteYes');
const voteNoBtn = document.getElementById('voteNo');
const voteCancelBtn = document.getElementById('voteCancel');
const voteStatus = document.getElementById('voteStatus');
const playerScores = {} // { socketId: scoreSpanElement }
let cardsInPlay = [];
let selectedCards = [];
let isDoxMode = false;
let addCardsTimeout = null;
let doxTimeout = null;
let points = 0;
let scoreBoard;
let currentColumns = 4;
let currentScale = 1;
let socketIdReady = false;
let pendingGameState = null;
let hasVoted = false;
let isVoteOngoing = false;
let playerNames = {};


// === Socket Events ===
socket.on('connect', () => {
    console.log('Connected to server');
    socketIdReady = true;

    if (pendingGameState) {
        handleGameState(pendingGameState);
        pendingGameState = null;
    }
});
socket.on('gameState', (data) => {
    if (!socketIdReady) {
        pendingGameState = data;
        return;
    }

    playerNames = data.playerNames || {};

    handleGameState(data);

    if (data.canAddCards) {
        activateAddCardsButton();
    } else {
        deactivateAddCardsButton();
    }
});
socket.on('setResult', ({ success, message }) => {
    console.log('setResult received:', success, message);
    if (success) {
        replaceCards(selectedCards);
    }

    selectedCards = [];
    updateCardSelectionUI();
    exitDoxMode();
    startAddCardsTimer();

    // Optional: show feedback
    console.log(message);
});
socket.on('addCardsRequestEnabled', () => {
    activateAddCardsButton();
});
socket.on('addCardsRequestDisabled', () => {
    deactivateAddCardsButton();
});
socket.on('addCardsVoteUpdate', ({ votesCount, totalPlayers }) => {
    voteStatus.textContent = `Votes: YES ${votesCount.yes} / NO ${votesCount.no} (Total players: ${totalPlayers})`;
});
socket.on('addCardsVoteStarted', () => {
    isVoteOngoing = true;
    deactivateAddCardsButton();
    addCardsVoteModal.style.display = 'flex';
});

socket.on('addCardsApproved', () => {
    isVoteOngoing = false;
    hasVoted = false;
    addCardsVoteModal.style.display = 'none';
});

socket.on('addCardsRejected', () => {
    isVoteOngoing = false;
    hasVoted = false;
    addCardsVoteModal.style.display = 'none';
});

// === Initialization ===
document.addEventListener('DOMContentLoaded', () => {
    scoreBoard = document.getElementById('playerScore');
    renderInitialCards();
    startAddCardsTimer();
    updateScoreBoard();
});

function promptForName() {
    playerName = prompt("Enter your display name:", "Player");
    if (!playerName || playerName.trim() === '') {
        playerName = "Player";
    }
    playerName = playerName.trim();
}

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
    cardsContainer.style.gridTemplateColumns = `repeat(${ columns }, minmax(100px, 150px))`;
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
    cardsContainer.style.gridTemplateColumns = `repeat(${ currentColumns }, minmax(100px, 150px))`;

    // Apply vertical scale
    cardsContainer.style.transform = `scale(${ currentScale })`;
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

function updateOrAddOpponentScore(socketId, score) {
    if (!playerScores[socketId]) {
        const scoreboard = document.getElementById('scoreboard');
        const container = document.createElement('div');
        container.className = 'score-container';

        // Use player name if exists, fallback to "Opponent #"
        const name = playerNames[socketId] || `Opponent ${Object.keys(playerScores).length + 1}`;

        container.innerHTML = `${name} Score: <span class="score" id="score-${socketId}">0</span>`;

        scoreboard.appendChild(container);
        playerScores[socketId] = container.querySelector('span');
    }

    playerScores[socketId].innerText = score;
}

function handleGameState({ cardsInPlay: newCardsInPlay, pointsByPlayer }) {
    console.log('Handling game state update', newCardsInPlay, pointsByPlayer);
    cardsInPlay = newCardsInPlay;
    cardsContainer.innerHTML = '';
    cardsInPlay.forEach(renderCard);
    updateGridColumns();
    updateCardBoardLayout();

    Object.entries(pointsByPlayer).forEach(([socketId, score]) => {
        if (socketId === socket.id) {
            points = score;
            updateScoreBoard();
        } else {
            updateOrAddOpponentScore(socketId, score);
        }
    });

    for (const socketId of Object.keys(playerScores)) {
        if (!(socketId in pointsByPlayer)) {
            const container = playerScores[socketId].parentElement;
            container.remove();
            delete playerScores[socketId];
        }
    }

    selectedCards = [];
    updateCardSelectionUI();
    exitDoxMode();
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
    if (!addCardsButton.classList.contains('active') || isVoteOngoing) return;
    socket.emit('requestAddCardsVote');
});

doxButton.addEventListener('click', enterDoxMode);

voteYesBtn.addEventListener('click', () => {
    if (hasVoted) return;
    socket.emit('submitAddCardsVote', { vote: 'yes' });
    voteStatus.textContent = 'You voted YES. Waiting for others...';
    hasVoted = true;
});

voteNoBtn.addEventListener('click', () => {
    if (hasVoted) return;
    socket.emit('submitAddCardsVote', { vote: 'no' });
    voteStatus.textContent = 'You voted NO. Waiting for others...';
    hasVoted = true;
});