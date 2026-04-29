// Exchange rates (base USD)
const rates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  RWF: 1300
};

// Populate currency dropdowns
function populateCurrencies() {
  const selects = document.querySelectorAll('.currency-select');
  const currencies = Object.keys(rates);
  
  selects.forEach(select => {
    if(select) {
      select.innerHTML = currencies.map(curr => 
        `<option value="${curr}">${curr} - ${getCurrencyName(curr)}</option>`
      ).join('');
    }
  });
}

function getCurrencyName(code) {
  const names = { USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', RWF: 'Rwandan Franc' };
  return names[code];
}

// Convert function
function convert(amount, from, to) {
  if(isNaN(amount) || amount <= 0) return null;
  return (amount / rates[from]) * rates[to];
}

// Save to localStorage
function saveToHistory(from, to, amount, result) {
  const history = JSON.parse(localStorage.getItem('conversionHistory')) || [];
  const entry = {
    id: Date.now(),
    from, to, amount, result,
    timestamp: new Date().toLocaleString()
  };
  history.unshift(entry);
  localStorage.setItem('conversionHistory', JSON.stringify(history.slice(0, 50)));
}

// Get history
function getHistory() {
  return JSON.parse(localStorage.getItem('conversionHistory')) || [];
}

// Display history on history.html
function displayHistory() {
  const historyList = document.getElementById('historyList');
  if(!historyList) return;
  
  let history = getHistory();
  const filter = document.getElementById('historyFilter')?.value || 'all';
  
  if(filter !== 'all') {
    history = history.filter(h => h.from === filter || h.to === filter);
  }
  
  if(history.length === 0) {
    historyList.innerHTML = '<li>No conversion history yet</li>';
    return;
  }
  
  historyList.innerHTML = history.map(h => `
    <li>
      <span>${h.amount} ${h.from} = ${h.result.toFixed(2)} ${h.to}</span>
      <small>${h.timestamp}</small>
    </li>
  `).join('');
}

// Clear history
function clearHistory() {
  localStorage.removeItem('conversionHistory');
  displayHistory();
}

// Theme toggle with localStorage
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if(savedTheme === 'dark') {
    document.body.classList.add('dark');
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Quick Converter (Homepage)
function initQuickConverter() {
  const quickConvertBtn = document.getElementById('quickConvertBtn');
  if(quickConvertBtn) {
    quickConvertBtn.addEventListener('click', () => {
      const amount = parseFloat(document.getElementById('quickAmount').value);
      const from = document.getElementById('quickFrom').value;
      const to = document.getElementById('quickTo').value;
      const result = convert(amount, from, to);
      
      if(result === null) {
        document.getElementById('quickResult').innerHTML = '❌ Invalid amount';
        return;
      }
      
      document.getElementById('quickResult').innerHTML = 
        `${amount} ${from} = ${result.toFixed(2)} ${to}`;
      saveToHistory(from, to, amount, result);
    });
  }
  
  const quickSwap = document.getElementById('quickSwapBtn');
  if(quickSwap) {
    quickSwap.addEventListener('click', () => {
      const from = document.getElementById('quickFrom');
      const to = document.getElementById('quickTo');
      [from.value, to.value] = [to.value, from.value];
    });
  }
}

// Full Converter Page
function initFullConverter() {
  const convertBtn = document.getElementById('fullConvertBtn');
  if(!convertBtn) return;
  
  // Show loading spinner
  const spinner = document.getElementById('loadingSpinner');
  
  convertBtn.addEventListener('click', async () => {
    spinner.classList.remove('hidden');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const amount = parseFloat(document.getElementById('fullAmount').value);
    const from = document.getElementById('fullFrom').value;
    const to = document.getElementById('fullTo').value;
    const result = convert(amount, from, to);
    
    spinner.classList.add('hidden');
    
    if(result === null) {
      alert('Please enter a valid amount');
      return;
    }
    
    const rate = (result / amount).toFixed(4);
    document.getElementById('fullResult').innerHTML = `
      <div class="converted-amount">${result.toFixed(2)} ${to}</div>
      <div class="exchange-rate">1 ${from} = ${rate} ${to}</div>
      <div class="timestamp">Last updated: ${new Date().toLocaleString()}</div>
    `;
    
    saveToHistory(from, to, amount, result);
  });
  
  const swapBtn = document.getElementById('fullSwapBtn');
  if(swapBtn) {
    swapBtn.addEventListener('click', () => {
      const from = document.getElementById('fullFrom');
      const to = document.getElementById('fullTo');
      [from.value, to.value] = [to.value, from.value];
    });
  }
}

// Currency Details Page with Chart.js
function initDetailsPage() {
  const currencySelect = document.getElementById('detailCurrency');
  if(!currencySelect) return;
  
  function updateDetails() {
    const currency = currencySelect.value;
    const names = { USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', RWF: 'Rwandan Franc' };
    const symbols = { USD: '$', EUR: '€', GBP: '£', RWF: 'FRw' };
    
    document.getElementById('currencyName').innerText = names[currency];
    document.querySelector('.currency-info p:first-of-type').innerHTML = `<strong>Symbol:</strong> ${symbols[currency]}`;
    
    // Comparison table
    const table = document.getElementById('comparisonTable');
    const otherCurrencies = Object.keys(rates).filter(c => c !== currency);
    table.innerHTML = `
      <tr><th>Currency</th><th>Rate (1 ${currency})</th></tr>
      ${otherCurrencies.map(c => `
        <tr><td>${c}</td><td>${(rates[c] / rates[currency]).toFixed(4)}</td></tr>
      `).join('')}
    `;
    
    // Historical mock data
    const historical = document.getElementById('historicalList');
    const mockHistory = [
      `Jan 2025: 1 ${currency} = ${(rates['USD']/rates[currency]).toFixed(2)} USD`,
      `Feb 2025: 1 ${currency} = ${(rates['EUR']/rates[currency]).toFixed(2)} EUR`,
      `Mar 2025: 1 ${currency} = ${(rates['GBP']/rates[currency]).toFixed(2)} GBP`
    ];
    historical.innerHTML = mockHistory.map(h => `<li>${h}</li>`).join('');
    
    // Chart
    const ctx = document.getElementById('rateChart')?.getContext('2d');
    if(ctx && window.rateChart) window.rateChart.destroy();
    if(ctx) {
      window.rateChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [{
            label: `${currency} Trend`,
            data: [1, 1.02, 0.98, 1.01].map(v => v * rates[currency]),
            borderColor: '#3b82f6'
          }]
        }
      });
    }
  }
  
  currencySelect.addEventListener('change', updateDetails);
  updateDetails();
}

// Settings page
function initSettings() {
  const defaultCurrency = document.getElementById('defaultCurrency');
  if(defaultCurrency) {
    const saved = localStorage.getItem('defaultCurrency');
    if(saved) defaultCurrency.value = saved;
    defaultCurrency.addEventListener('change', () => {
      localStorage.setItem('defaultCurrency', defaultCurrency.value);
    });
  }
  
  const langSelect = document.getElementById('language');
  if(langSelect) {
    const savedLang = localStorage.getItem('language');
    if(savedLang) langSelect.value = savedLang;
    langSelect.addEventListener('change', () => {
      localStorage.setItem('language', langSelect.value);
      alert('Language changed (translation not fully implemented)');
    });
  }
  
  const themeBtn = document.getElementById('settingsThemeToggle');
  if(themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  populateCurrencies();
  initTheme();
  initQuickConverter();
  initFullConverter();
  initDetailsPage();
  displayHistory();
  initSettings();
  
  // Global theme toggle buttons
  document.querySelectorAll('#themeToggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
  
  const clearBtn = document.getElementById('clearHistoryBtn');
  if(clearBtn) {
    clearBtn.addEventListener('click', clearHistory);
  }
  
  const filter = document.getElementById('historyFilter');
  if(filter) {
    filter.addEventListener('change', displayHistory);
  }
});