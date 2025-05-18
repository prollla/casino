async function updateBalance() {
    const res = await fetch('/balance');
    const data = await res.json();
    document.getElementById('balance').textContent = data.balance.toFixed(2);
}

async function makeBet() {
    const amount = parseFloat(document.getElementById('betAmount').value);
    if (!amount) return;

    const res = await fetch('/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
    });

    const data = await res.json();
    document.getElementById('slots').textContent = data.slots.join('');
    document.getElementById('resultMsg').textContent =
        data.win_amount > 0 ? `🎉 Вы выиграли ${data.win_amount}` : '😢 Вы проиграли';

    updateBalance();
    updateBets();
}

async function deposit() {
    const amount = parseFloat(document.getElementById('depositAmount').value);
    if (!amount) return;

    await fetch('/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
    });

    updateBalance();
}

async function updateBets() {
    const res = await fetch('/bets');
    const bets = await res.json();
    const list = document.getElementById('betsList');
    list.innerHTML = '';

    bets.slice().reverse().forEach(bet => {
        const li = document.createElement('li');
        li.textContent = `#${bet.id} | ${bet.result} | Ставка: ${bet.amount} | Выигрыш: ${bet.win_amount}`;
        list.appendChild(li);
    });
}

window.onload = () => {
    updateBalance();
    updateBets();
}
