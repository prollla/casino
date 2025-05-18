async function updateBalance() {
  const res = await fetch('/balance');
  const data = await res.json();
  document.getElementById('balance').innerText = `Balance: $${data.balance.toFixed(2)}`;
}

    depositForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        if (amount <= 0) return;

        const response = await fetch('/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });

        const data = await response.json();
        if (!response.ok) {
            alert(data.detail);
            return;
        }

        fetchBalance();
        const modal = bootstrap.Modal.getInstance(document.getElementById('depositModal'));
        modal.hide();
        depositForm.reset();
    });