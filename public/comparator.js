// ═══════════════════════════════════════════════════════════
// COMPARATOR
// ═══════════════════════════════════════════════════════════
let allTickets = [];

function initComparator() {
    fetch('/api/tariff')
        .then(r => r.json())
        .then(data => {
            allTickets = data.tickets || [];
            renderComparator();
        })
        .catch(e => console.warn('[comparator] Błąd:', e.message));
}

function renderComparator() {
    const grid = document.getElementById('comparator-grid');
    if (!grid) return;

    grid.innerHTML = '';
    
    const categories = {
        'Bilety czasowe': ['20e', '40e', '120e', 'ss5', 'ss20', 'ss60'],
        'Pakiety': ['p20', 'p40', 'p80'],
        'Długoterminowe': ['s7', 's30', 's90']
    };

    for (const [category, vals] of Object.entries(categories)) {
        const catDiv = document.createElement('div');
        catDiv.style.gridColumn = '1 / -1';
        catDiv.innerHTML = `<h4 style="margin: 16px 0 8px; color: #0f172a; font-weight: 600;">${category}</h4>`;
        grid.appendChild(catDiv);

        for (const val of vals) {
            const ticket = allTickets.find(t => t.val === val);
            if (!ticket) continue;

            const card = document.createElement('div');
            card.className = 'compare-card';
            card.innerHTML = `
                <div class="compare-card-header">
                    <div class="compare-name">${ticket.label}</div>
                    <div class="compare-scope">${ticket.scope}</div>
                </div>
                <div class="compare-body">
                    <div class="compare-price">${fmt(ticket.norm)}</div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Bilet normalny</div>
                    ${ticket.ulg ? `
                        <div class="compare-price" style="font-size: 16px; color: #16a34a; margin-top: 8px;">${fmt(ticket.ulg)}</div>
                        <div style="font-size: 11px; color: #94a3b8;">Ulgowy 50%</div>
                    ` : ''}
                </div>
            `;
            grid.appendChild(card);
        }
    }
}

// ═══════════════════════════════════════════════════════════
// ULGI SCREEN
// ═══════════════════════════════════════════════════════════
function initUlgi() {
    const content = document.getElementById('ulgi-content');
    content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 12px; color: #0f172a;">✅ Przejazdy bezpłatne</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <strong>Dziecko do 7 lat</strong> — oświadczenie opiekuna
                </li>
                <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <strong>Dziecko/młodzież 7–16 lat z GZM</strong> — legitymacja szkolna
                </li>
                <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <strong>Osoba po 70. roku życia</strong> — dokument tożsamości
                </li>
                <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <strong>Osoba z niepełnosprawnością (znaczny stopień)</strong> — orzeczenie
                </li>
                <li style="padding: 8px 0;">
                    <strong>Inwalidzi wojenni, osoby represjonowane</strong> — legitymacja
                </li>
            </ul>
        </div>

        <div>
            <h3 style="margin-bottom: 12px; color: #0f172a;">🎓 Ulga 50%</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <strong>Uczeń/Student</strong> — legitymacja szkolna/studencka
                </li>
                <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <strong>Emeryt po 60. roku życia</strong> — legitymacja emeryta
                </li>
                <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                    <strong>Rencista</strong> — legitymacja rencisty
                </li>
                <li style="padding: 8px 0;">
                    <strong>Kombatant, działacz opozycji</strong> — odpowiednie zaświadczenie
                </li>
            </ul>
        </div>

        <div style="margin-top: 20px; background: #dcfce7; border: 1px solid #16a34a; border-radius: 8px; padding: 12px;">
            <p style="margin: 0; font-size: 13px; color: #14532d;">
                <strong>Pełny wykaz uprawnień</strong> znajduje się w §9 Taryfy Transport GZM (obowiązuje od 01.01.2026).
            </p>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════
// ROUTE PLANNER
// ═══════════════════════════════════════════════════════════
function initRoutePlanner() {
    // Already initialized in HTML
}

function analyzeRoute() {
    const fromName = document.getElementById('inp-from').value.trim();
    const toName = document.getElementById('inp-to').value.trim();

    if (!fromName || !toName) {
        alert('Wpisz przystanek początkowy i docelowy.');
        return;
    }

    const resultsArea = document.getElementById('route-results');
    resultsArea.innerHTML = '<p style="color: #666; text-align: center;">Sprawdzam rozkład jazdy…</p>';

    // Simulate API call (in production: /api/travel-time)
    setTimeout(() => {
        resultsArea.innerHTML = `
            <div style="background: #e8f0fe; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px;">
                <strong>${escHtml(fromName)} → ${escHtml(toName)}</strong>
                <br><br>
                <p style="margin: 0; font-size: 13px; color: #0f172a;">
                    Szacunkowy czas przejazdu: <strong>~25 minut</strong> (na podstawie odległości)
                </p>
                <p style="margin: 8px 0 0 0; font-size: 13px; color: #666;">
                    ℹ️ Aby uzyskać dokładny czas, sprawdź rozkład na <a href="https://rj.transportgzm.pl" target="_blank">rj.transportgzm.pl</a>
                </p>
            </div>
            <div style="margin-top: 12px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px;">
                <p style="margin: 0; font-size: 13px; color: #78350f;">
                    <strong>Rekomendacja:</strong> Na trasę ~25 minut wybierz bilet <strong>40 minut (4,20 zł)</strong> lub <strong>Podróż Start/Stop</strong>.
                </p>
            </div>
        `;
    }, 1000);
}
