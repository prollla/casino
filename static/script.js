document.addEventListener('DOMContentLoaded', () => {
    const spinSound = new Audio('/static/sounds/spin.mp3');
    const jackpotSound = new Audio('/static/sounds/jackpot.mp3')
    fetchBalance();
    fetchBets();

    const betForm = document.getElementById('bet-form');
    const depositForm = document.getElementById('deposit-form');

    betForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        spinSound.currentTime = 0; // сброс позиции
        spinSound.play().catch(e => console.log("Audio play failed:", e));
        const amount = parseFloat(document.getElementById('bet-amount').value);
        if (amount <= 0) return;

        const response = await fetch('/bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.detail);
            return;
        }

        const slotEl = document.getElementById('slot-result');
        const jackpotEl = document.getElementById('jackpot-alert');
        const jackpotWinEl = document.getElementById('jackpot-win');

        slotEl.innerText = data.slots.join("");
        const isJackpot = data.slots.every(s => s === data.slots[0]);

        if (isJackpot) {
            jackpotSound.currentTime = 0; // сброс позиции
            jackpotSound.play().catch(e => console.log("Audio play failed:", e));
            slotEl.classList.add('jackpot-glow');
            jackpotWinEl.textContent = '$0';
            jackpotEl.style.display = 'block';

            animateJackpotWin(jackpotWinEl, data.win_amount);
            setTimeout(() => {
                jackpotEl.style.display = 'none';
                slotEl.classList.remove('jackpot-glow');
            }, 4000);
        }

        fetchBalance();
        fetchBets();
    });
});

async function fetchBalance() {
    const response = await fetch('/balance');
    const data = await response.json();
    document.getElementById('balance').innerText = `Balance: $${data.balance.toFixed(2)}`;
}

async function fetchBets() {
    const response = await fetch('/bets');
    const data = await response.json();
    const history = document.getElementById('bet-history');
    history.innerHTML = '';

    data.slice().reverse().forEach(bet => {
        const item = document.createElement('li');
        item.className = 'list-group-item';
        item.textContent = `${bet.result} — Bet: $${bet.amount}, Win: $${bet.win_amount}`;
        history.appendChild(item);
    });
}

function animateJackpotWin(element, target) {
    let start = 0;
    const duration = 1500; // ms
    const steps = 30;
    const increment = target / steps;
    const interval = duration / steps;

    const counter = setInterval(() => {
        start += increment;
        if (start >= target) {
            start = target;
            clearInterval(counter);
        }
        element.textContent = `$${start.toFixed(2)}`;
    }, interval);
}
