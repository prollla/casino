document.addEventListener('DOMContentLoaded', () => {
  const startForm = document.getElementById('start-form');
  const minesGrid = document.getElementById('mines-grid');
  const cashoutBtn = document.getElementById('cashout');
  const winAmount = document.getElementById('win-amount');
  const betInput = document.getElementById('mines-amount');

  let gameStarted = false;
  let revealedCells = [];

  async function fetchBalance() {
    const res = await fetch('/balance');
    const data = await res.json();
    updateBalanceDisplay(data.balance);
  }

  function updateBalanceDisplay(balance) {
    const balanceElement = document.getElementById('balance');
    if (balanceElement) {
      balanceElement.textContent = `Balance: $${balance.toFixed(2)}`;
    }
  }

  async function startMinesGame(betAmount) {
    const res = await fetch('/mines/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: betAmount })
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || 'Error starting game');
      return null;
    }

    return await res.json();
  }

  async function selectCellOnServer(index) {
    const res = await fetch('/mines/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index })
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || 'Error selecting cell');
      return null;
    }
    return await res.json();
  }

  async function cashoutOnServer() {
    const res = await fetch('/mines/cashout', {
      method: 'POST'
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || 'Error cashing out');
      return null;
    }

    return await res.json();
  }

  startForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bet = parseFloat(betInput.value);
    if (isNaN(bet) || bet <= 0) {
      alert('Enter a valid bet amount!');
      return;
    }

    const result = await startMinesGame(bet);
    if (result) {
      revealedCells = [];
      startGame(result);
      fetchBalance();
    }
  });

  function startGame(gameData) {
    gameStarted = true;
    minesGrid.innerHTML = '';
    cashoutBtn.classList.remove('d-none');
    winAmount.textContent = '';

    for (let i = 0; i < 25; i++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.index = i;

      cell.addEventListener('click', async () => {
        if (!cell.classList.contains('revealed') && gameStarted) {
          const data = await selectCellOnServer(i);
          if (!data) return;

          if (data.game_over) {
            cell.textContent = '💣';
            cell.classList.add('mine', 'revealed');
            gameOver();
          } else {
            cell.textContent = '💎';
            cell.classList.add('revealed');
            revealedCells.push(i);
            winAmount.textContent = `Potential win: $${data.win_amount.toFixed(2)}`;
          }
        }
      });

      minesGrid.appendChild(cell);
    }
  }

  function gameOver() {
    gameStarted = false;
    alert('💥 You hit a mine!');
    cashoutBtn.classList.add('d-none');
    fetchBalance();
  }

  cashoutBtn.addEventListener('click', async () => {
    if (!gameStarted) return;

    const result = await cashoutOnServer();
    if (result) {
      winAmount.textContent = `You cashed out! 💰 +$${result.win_amount.toFixed(2)}`;
      gameStarted = false;
      cashoutBtn.classList.add('d-none');
      fetchBalance();
    }
  });

  fetchBalance();
});

