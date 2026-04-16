// ═══════════════════════════════════════════════════════════
// GTFS DATA & STOPS
// ═══════════════════════════════════════════════════════════
let gtfsStops = [];
let gtfsLoaded = false;

function loadGtfs() {
    fetch('/api/stops')
        .then(r => r.json())
        .then(data => {
            gtfsStops = data || [];
            gtfsLoaded = true;
            console.log(`[GTFS] Załadowano ${gtfsStops.length} przystanków`);
        })
        .catch(e => console.warn('[GTFS] Błąd:', e.message));
}

function searchStops(q, max = 8) {
    if (!q || q.length < 2) return [];
    const ql = q.toLowerCase();
    let results = gtfsStops.filter(s => s.name.toLowerCase().includes(ql));
    results.sort((a, b) => {
        const aStart = a.name.toLowerCase().startsWith(ql) ? 0 : 1;
        const bStart = b.name.toLowerCase().startsWith(ql) ? 0 : 1;
        return aStart - bStart;
    });
    return results.slice(0, max);
}

// ═══════════════════════════════════════════════════════════
// AUTOCOMPLETE
// ═══════════════════════════════════════════════════════════
const acState = { from: { val: null, idx: -1 }, to: { val: null, idx: -1 } };

function onAcInput(side) {
    const inp = document.getElementById(`inp-${side}`);
    const dd = document.getElementById(`ac-${side}`);
    const q = inp.value;

    if (!q || q.length < 2 || !gtfsLoaded) {
        dd.style.display = 'none';
        return;
    }

    const results = searchStops(q, 8);
    if (!results.length) {
        dd.innerHTML = '<div class="ac-empty">Brak wyników</div>';
        dd.style.display = 'block';
        return;
    }

    dd.innerHTML = results.map(s => `
        <div class="ac-item" data-stop="${s.name}" data-side="${side}">
            <span style="font-size: 13px;">📍</span>
            <div class="ac-stop-name">${s.name}</div>
        </div>
    `).join('');
    dd.style.display = 'block';
}

function onAcKey(e, side) {
    const dd = document.getElementById(`ac-${side}`);
    if (dd.style.display === 'none') return;

    const items = dd.querySelectorAll('.ac-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        acState[side].idx = Math.min(acState[side].idx + 1, items.length - 1);
        items.forEach((el, i) => el.classList.toggle('active', i === acState[side].idx));
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        acState[side].idx = Math.max(acState[side].idx - 1, 0);
        items.forEach((el, i) => el.classList.toggle('active', i === acState[side].idx));
    } else if (e.key === 'Enter' && acState[side].idx >= 0) {
        items[acState[side].idx].click();
    } else if (e.key === 'Escape') {
        dd.style.display = 'none';
    }
}

function selectStop(side, name) {
    document.getElementById(`inp-${side}`).value = name;
    document.getElementById(`ac-${side}`).style.display = 'none';
    acState[side].val = name;
}

document.addEventListener('click', e => {
    const acItem = e.target.closest('.ac-item');
    if (acItem) {
        const side = acItem.dataset.side;
        const name = acItem.dataset.stop;
        selectStop(side, name);
        return;
    }

    ['from', 'to'].forEach(s => {
        const dd = document.getElementById(`ac-${s}`);
        if (dd && !dd.contains(e.target) && e.target.id !== `inp-${s}`) {
            dd.style.display = 'none';
        }
    });
});

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const screen = document.getElementById(`screen-${screenName}`);
    if (screen) {
        screen.classList.add('active');
        screen.style.display = 'block';
    }
}

function startMode(mode) {
    showScreen(mode);
    if (mode === 'wizard') initWizard();
    else if (mode === 'comparator') initComparator();
    else if (mode === 'route') initRoutePlanner();
}

function showUlgi() {
    showScreen('ulgi');
    initUlgi();
}

// ═══════════════════════════════════════════════════════════
// FORMAT & UTILITIES
// ═══════════════════════════════════════════════════════════
function fmt(n) {
    return n.toFixed(2).replace('.', ',') + ' zł';
}

function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    loadGtfs();
    showScreen('welcome');
});
