document.addEventListener('DOMContentLoaded', function () {
  const depositForm = document.getElementById('deposit-form');
  const depositAmountInput = document.getElementById('deposit-amount');
  const balanceDisplay = document.getElementById('balance');

  async function updateBalance() {
    const res = await fetch('/balance');
    const data = await res.json();
    balanceDisplay.textContent = `Balance: $${data.balance.toFixed(2)}`;
  }

  depositForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmountInput.value);
    if (isNaN(amount) || amount <= 0) return;

    await fetch('/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });

    depositAmountInput.value = '';
    const modal = bootstrap.Modal.getInstance(document.getElementById('depositModal'));
    modal.hide();
    updateBalance();
  });

  updateBalance();
});
