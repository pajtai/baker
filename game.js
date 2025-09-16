
const config = {
    initialMoney: 10000,
    supplies: [
        { name: 'flour', unit: 'bags', quantity: 10, cost: 10 },
        { name: 'salt', unit: 'bags', quantity: 10, cost: 5 },
        { name: 'yeast', unit: 'packets', quantity: 20, cost: 1 },
        { name: 'paper bags', unit: 'bags', quantity: 100, cost: 0.1 },
    ],
    equipment: [
        { name: 'oven', quantity: 1, hoursUsed: 0 },
        { name: 'mixer', quantity: 1, hoursUsed: 0 },
    ]
};

let gameState;

function initGame() {
    const savedState = localStorage.getItem('bakerGameState');
    if (savedState) {
        gameState = JSON.parse(savedState);
    } else {
        gameState = {
            money: config.initialMoney,
            supplies: JSON.parse(JSON.stringify(config.supplies)),
            equipment: JSON.parse(JSON.stringify(config.equipment)),
            day: 1,
        };
    }
    saveGameState();
    renderState();
    logMessage("Welcome to Baker!");
    promptForDecisions();
}

function saveGameState() {
    localStorage.setItem('bakerGameState', JSON.stringify(gameState));
}

function renderState() {
    const stateContainer = document.getElementById('state');
    stateContainer.innerHTML = ``;
    stateContainer.innerHTML += `<p>Money: $${gameState.money.toFixed(2)}</p>`;
    stateContainer.innerHTML += `<h3>Supplies</h3>`;
    gameState.supplies.forEach(item => {
        stateContainer.innerHTML += `<p>${item.name}: ${item.quantity} ${item.unit}</p>`;
    });
    stateContainer.innerHTML += `<h3>Equipment</h3>`;
    gameState.equipment.forEach(item => {
        stateContainer.innerHTML += `<p>${item.name}: ${item.hoursUsed} hours used</p>`;
    });
}

function logMessage(message) {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML += `<p>${message}</p>`;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function promptForDecisions() {
    const decisionsContainer = document.getElementById('decisions');
    let formHTML = `<p>What would you like to get?</p>`;
    config.supplies.forEach(item => {
        formHTML += `
            <div>
                <label>${item.name} (${item.cost}/${item.unit})</label>
                <input type="number" id="buy-${item.name}" min="0" value="0">
            </div>
        `;
    });
    formHTML += `<button id="purchase-button">Purchase</button>`;
    decisionsContainer.innerHTML = formHTML;
    document.getElementById('purchase-button').addEventListener('click', buySupplies);
}

function buySupplies() {
    let totalCost = 0;
    const itemsToBuy = [];

    config.supplies.forEach(item => {
        const quantity = parseInt(document.getElementById(`buy-${item.name}`).value);
        if (quantity > 0) {
            totalCost += quantity * item.cost;
            itemsToBuy.push({ name: item.name, quantity: quantity });
        }
    });

    if (totalCost > gameState.money) {
        logMessage("You don't have enough money for this purchase.");
        return;
    }

    gameState.money -= totalCost;
    itemsToBuy.forEach(itemToBuy => {
        const supply = gameState.supplies.find(s => s.name === itemToBuy.name);
        supply.quantity += itemToBuy.quantity;
    });

    logMessage(`Purchased supplies for ${totalCost.toFixed(2)}.`);
    renderState();
    saveGameState();
    simulateWeek();
}

function simulateWeek() {
    for (let i = 0; i < 7; i++) {
        simulateDay();
    }
    promptForDecisions();
}

function simulateDay() {
    const customers = Math.floor(Math.random() * 20) + 10; // 10 to 30 customers
    const breadPrice = 5;

    const flour = gameState.supplies.find(s => s.name === 'flour');
    const salt = gameState.supplies.find(s => s.name === 'salt');
    const yeast = gameState.supplies.find(s => s.name === 'yeast');
    const paperBags = gameState.supplies.find(s => s.name === 'paper bags');

    const canBake = flour.quantity > 0 && salt.quantity > 0 && yeast.quantity > 0;

    if (canBake) {
        const maxBreadFromSupplies = Math.min(flour.quantity, salt.quantity, yeast.quantity) * 10;
        const potentialSales = customers;
        const breadSold = Math.min(maxBreadFromSupplies, potentialSales, paperBags.quantity);

        if (breadSold > 0) {
            const flourUsed = breadSold / 10;
            flour.quantity -= flourUsed;
            salt.quantity -= flourUsed;
            yeast.quantity -= flourUsed;
            paperBags.quantity -= breadSold;

            gameState.equipment.forEach(e => e.hoursUsed += 8);

            const earnings = breadSold * breadPrice;
            gameState.money += earnings;

            logMessage(`Day ${gameState.day}: ${customers} customers. Sold ${breadSold.toFixed(0)} loaves for ${earnings.toFixed(2)}.`);
        } else {
            let message = `Day ${gameState.day}: ${customers} customers. Sold 0 loaves.`;
            if (paperBags.quantity <= 0) {
                message += ` Missing: paper bags`;
            }
            logMessage(message);
        }
    } else {
        const missingSupplies = [];
        if (flour.quantity <= 0) missingSupplies.push('flour');
        if (salt.quantity <= 0) missingSupplies.push('salt');
        if (yeast.quantity <= 0) missingSupplies.push('yeast');
        logMessage(`Day ${gameState.day}: ${customers} customers. Sold 0 loaves. Not enough supplies to bake bread. Missing: ${missingSupplies.join(', ')}`);
    }

    gameState.day++;
    renderState();
    saveGameState();
}


window.onload = initGame;
