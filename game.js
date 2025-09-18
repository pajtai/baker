
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
    const defaultState = {
        money: config.initialMoney,
        supplies: JSON.parse(JSON.stringify(config.supplies)),
        equipment: JSON.parse(JSON.stringify(config.equipment)),
        day: 1,
        debt: 0,
    };
    let savedState = localStorage.getItem('bakerGameState');

    savedState = savedState ? JSON.parse(savedState) : {};

    gameState = Object.assign({}, defaultState, savedState);

    saveGameState();
    renderState();
    logMessage("Welcome to Baker!");
    promptForCategory();
}

function saveGameState() {
    localStorage.setItem('bakerGameState', JSON.stringify(gameState));
}

function renderState() {
    const stateContainer = document.getElementById('state');
    stateContainer.innerHTML = ``;
    stateContainer.innerHTML += `<p>Money: ${gameState.money.toFixed(2)}</p>`;
    stateContainer.innerHTML += `<p>Debt: ${gameState.debt.toFixed(2)}</p>`;
    stateContainer.innerHTML += `<h3>Supplies</h3>`;
    gameState.supplies.forEach(item => {
        stateContainer.innerHTML += `<p>${item.name}: ${Math.ceil(item.quantity)} ${item.unit}</p>`;
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

function promptForCategory() {
    const decisionsContainer = document.getElementById('decisions');
    let formHTML = `<p>What would you like to get?</p>`;
    formHTML += `
        <div>
            <input type="radio" id="cat-supplies" name="category" value="supplies">
            <label for="cat-supplies">Supplies</label>
        </div>
        <div>
            <input type="radio" id="cat-employees" name="category" value="employees">
            <label for="cat-employees">Employees</label>
        </div>
        <div>
            <input type="radio" id="cat-bakeries" name="category" value="bakeries">
            <label for="cat-bakeries">Bakeries</label>
        </div>
        <div>
            <input type="radio" id="cat-loan" name="category" value="loan">
            <label for="cat-loan">Loan</label>
        </div>
        <div>
            <input type="radio" id="cat-nothing" name="category" value="nothing">
            <label for="cat-nothing">Nothing</label>
        </div>
    `;
    decisionsContainer.innerHTML = formHTML;
    document.querySelectorAll('input[name="category"]').forEach(radio => {
        radio.addEventListener('change', handleCategoryChoice);
    });
}

function handleCategoryChoice() {
    const selectedCategory = document.querySelector('input[name="category"]:checked').value;
    switch (selectedCategory) {
        case 'supplies':
            promptForSupplies();
            break;
        case 'employees':
        case 'bakeries':
            handleWIP();
            break;
        case 'loan':
            promptForLoan();
            break;
        case 'nothing':
            simulateWeek();
            break;
    }
}

function handleWIP() {
    logMessage("This feature is a work in progress.");
    setTimeout(promptForCategory, 2000);
}

function promptForLoan() {
    const decisionsContainer = document.getElementById('decisions');
    const maxLoan = gameState.money * 2;
    let formHTML = `
        <p>You can borrow up to ${maxLoan.toFixed(2)}.</p>
        <p>The loan will have a 10% interest rate, with a weekly payment of 2% of the original loan amount.</p>
        <div>
            <label>Loan Amount:</label>
            <input type="number" id="loan-amount" min="0" max="${maxLoan}" value="0">
        </div>
        <button id="get-loan-button">Get Loan</button>
        <button id="cancel-loan-button">Cancel</button>
    `;
    decisionsContainer.innerHTML = formHTML;
    document.getElementById('get-loan-button').addEventListener('click', getLoan);
    document.getElementById('cancel-loan-button').addEventListener('click', promptForCategory);
}

function getLoan() {
    const loanAmount = parseInt(document.getElementById('loan-amount').value);
    if (loanAmount > 0 && loanAmount <= gameState.money * 2) {
        gameState.money += loanAmount;
        gameState.debt += loanAmount * 1.1; // 10% interest
        logMessage(`You have taken out a loan of ${loanAmount.toFixed(2)}.`);
        renderState();
        saveGameState();
        simulateWeek();
    } else {
        logMessage("Invalid loan amount.");
    }
}

function promptForSupplies() {
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
    formHTML += `<button id="cancel-button">Cancel</button>`;
    decisionsContainer.innerHTML = formHTML;
    document.getElementById('purchase-button').addEventListener('click', buySupplies);
    document.getElementById('cancel-button').addEventListener('click', promptForCategory);
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
    if (gameState.debt > 0) {
        const weeklyPayment = gameState.debt * 0.02;
        if (gameState.money >= weeklyPayment) {
            gameState.money -= weeklyPayment;
            gameState.debt -= weeklyPayment;
            logMessage(`Paid ${weeklyPayment.toFixed(2)} towards your loan.`);
        } else {
            logMessage("You don't have enough money to make your loan payment.");
        }
    }

    for (let i = 0; i < 7; i++) {
        simulateDay();
    }
    promptForCategory();
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
