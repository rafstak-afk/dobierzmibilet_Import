// ═══════════════════════════════════════════════════════════
// WIZARD STATE
// ═══════════════════════════════════════════════════════════
const WZ = {
    type: null,
    discount: 'normalny',
    variant: null
};

const VARIANTS = {
    jednorazowy: [
        { val: '20e', label: '20 minut (elektroniczny)', desc: 'Przesiadki OK', norm: 4.20, ulg: 2.10, scope: '20 min od zakupu, cała sieć', info: 'Kupujesz w aplikacji Transport GZM lub w kasowniku w pojeździe.' },
        { val: '40e', label: '40 minut (elektroniczny)', desc: 'Przesiadki OK', norm: 5.20, ulg: 2.60, scope: '40 min od zakupu, cała sieć', info: 'Kupujesz w aplikacji Transport GZM lub w kasowniku w pojeździe.' },
        { val: '120e', label: '120 minut (elektroniczny)', desc: 'Przesiadki OK', norm: 6.60, ulg: 3.30, scope: '120 min od zakupu, cała sieć', info: 'Kupujesz w aplikacji Transport GZM lub w kasowniku w pojeździe.' },
    ],
    'start-stop': [
        { val: 'ss5', label: 'do 5 min', norm: 2.10, ulg: 1.05, scope: 'Taryfa czasowa Start/Stop', info: 'Czas liczony wg rozkładu jazdy, nie rzeczywistego przejazdu.' },
        { val: 'ss20', label: '15–20 min', norm: 4.20, ulg: 2.10, scope: 'Taryfa czasowa Start/Stop', info: 'Czas liczony wg rozkładu jazdy, nie rzeczywistego przejazdu.' },
        { val: 'ss60', label: '40–60 min', norm: 5.70, ulg: 2.85, scope: 'Taryfa czasowa Start/Stop', info: 'Czas liczony wg rozkładu jazdy, nie rzeczywistego przejazdu.' },
    ],
    pakietowy: [
        { val: 'p20', label: 'Pakiet 20 przejazdów', desc: '3,00 zł/przejazd · 180 dni', norm: 60, ulg: 30, scope: '20 przejazdów, cała sieć, 180 dni', info: 'Każdy przejazd rejestruj w kasowniku lub w aplikacji.' },
        { val: 'p40', label: 'Pakiet 40 przejazdów', desc: '2,75 zł/przejazd · 180 dni', norm: 110, ulg: 55, scope: '40 przejazdów, cała sieć, 180 dni', info: 'Każdy przejazd rejestruj w kasowniku lub w aplikacji.' },
        { val: 'p80', label: 'Pakiet 80 przejazdów', desc: '2,50 zł/przejazd · 180 dni', norm: 200, ulg: 100, scope: '80 przejazdów, cała sieć, 180 dni', info: 'Każdy przejazd rejestruj w kasowniku lub w aplikacji.' },
    ],
    dlugookresowy: [
        { val: 's7', label: 'Sieć 7 imienny', desc: 'Cała sieć, 7 dni', norm: 60, ulg: 30, scope: 'Cała sieć, 7 dni', info: 'Bilet elektroniczny, imienny — kup przez portal transportgzm.pl.' },
        { val: 's30', label: 'Sieć 30', desc: 'Cała sieć, 30 dni', norm: 249, ulg: 124.50, scope: 'Cała sieć, 30 dni', info: 'Bilet elektroniczny, imienny — niedostępny w kasowniku w pojeździe.' },
        { val: 's90', label: 'Sieć 90', desc: 'Cała sieć, 90 dni', norm: 460, ulg: 230, scope: 'Cała sieć, 90 dni', info: 'Bilet elektroniczny, imienny — niedostępny w kasowniku w pojeździe.' },
    ]
};

// ═══════════════════════════════════════════════════════════
// WIZARD FUNCTIONS
// ═══════════════════════════════════════════════════════════
function initWizard() {
    const content = document.getElementById('wizard-content');
    content.innerHTML = `
        <div id="wz-step-1">
            <h3>Krok 1 z 3: Jaki typ biletu?</h3>
            <div class="options-grid col2">
                <button class="option-card" onclick="selectType('jednorazowy', this)">
                    <span class="oc-icon">⏱️</span>
                    <div class="oc-title">20/40/120 minut</div>
                    <div class="oc-desc">Bilety czasowe z przesiadkami</div>
                    <div class="oc-price">od 4,20 zł</div>
                </button>
                <button class="option-card" onclick="selectType('start-stop', this)">
                    <span class="oc-icon">📍</span>
                    <div class="oc-title">Podróż Start/Stop</div>
                    <div class="oc-desc">Opłata wg czasu z rozkładu</div>
                    <div class="oc-price">od 2,10 zł</div>
                </button>
                <button class="option-card" onclick="selectType('pakietowy', this)">
                    <span class="oc-icon">📦</span>
                    <div class="oc-title">Pakietowy</div>
                    <div class="oc-desc">20, 40 lub 80 przejazdów</div>
                    <div class="oc-price">od 60 zł</div>
                </button>
                <button class="option-card" onclick="selectType('dlugookresowy', this)">
                    <span class="oc-icon">📅</span>
                    <div class="oc-title">Sieć 7/30/90</div>
                    <div class="oc-desc">Nieograniczone przejazdy</div>
                    <div class="oc-price">od 60 zł</div>
                </button>
            </div>
        </div>
        <div id="wz-step-2" style="display: none;">
            <h3>Krok 2 z 3: Masz uprawnienie do ulgi?</h3>
            <div class="options-grid col2">
                <button class="option-card" onclick="selectDiscount('normalny', this)">
                    <span class="oc-icon">🧑</span>
                    <div class="oc-title">Normalny</div>
                    <div class="oc-desc">Pełna cena biletu</div>
                </button>
                <button class="option-card" onclick="selectDiscount('ulgowy', this)">
                    <span class="oc-icon">🎓</span>
                    <div class="oc-title">Ulgowy 50%</div>
                    <div class="oc-desc">Uczniowie, studenci, emeryci 60+</div>
                </button>
            </div>
        </div>
        <div id="wz-step-3" style="display: none;">
            <h3 id="wz3-title">Krok 3 z 3: Wybierz wariant</h3>
            <div class="options-grid col2" id="wz3-opts"></div>
        </div>
        <div id="wz-step-4" style="display: none;">
            <h3>Twój bilet</h3>
            <div style="background: #f0f4f8; padding: 16px; border-radius: 8px; margin: 12px 0;">
                <div style="font-size: 12px; color: #666;">BILET</div>
                <div style="font-size: 24px; font-weight: bold; margin: 8px 0;" id="res-name">-</div>
                <div style="font-size: 14px; color: #666;" id="res-scope">-</div>
                <div style="font-size: 28px; font-weight: bold; color: #1a56db; margin: 12px 0;" id="res-price">-</div>
            </div>
            <div id="res-info" style="background: #e8f0fe; padding: 12px; border-radius: 8px; font-size: 13px; margin: 12px 0; line-height: 1.6;"></div>
        </div>
    `;
}

function selectType(t, btn) {
    WZ.type = t;
    document.querySelectorAll('#wz-step-1 .option-card').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    setTimeout(() => wzStep(2), 220);
}

function selectDiscount(d, btn) {
    WZ.discount = d;
    document.querySelectorAll('#wz-step-2 .option-card').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    setTimeout(() => wzStep(3), 220);
}

function wzStep(n) {
    [1, 2, 3, 4].forEach(i => {
        const el = document.getElementById(`wz-step-${i}`);
        if (el) el.style.display = i === n ? 'block' : 'none';
    });
    if (n === 3) buildVariants();
    if (n === 4) buildResult();
}

function buildVariants() {
    const list = VARIANTS[WZ.type] || [];
    const isU = WZ.discount === 'ulgowy';
    const c = document.getElementById('wz3-opts');
    c.innerHTML = '';

    list.forEach(v => {
        const price = isU ? v.ulg : v.norm;
        const btn = document.createElement('button');
        btn.className = 'option-card';
        btn.innerHTML = `
            <div class="oc-title">${v.label}</div>
            ${v.desc ? `<div class="oc-desc">${v.desc}</div>` : ''}
            <div class="oc-price">${fmt(price)}</div>
        `;
        btn.onclick = () => {
            c.querySelectorAll('.option-card').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            WZ.variant = v;
            setTimeout(() => wzStep(4), 220);
        };
        c.appendChild(btn);
    });
}

function buildResult() {
    const v = WZ.variant;
    if (!v) return;

    const isU = WZ.discount === 'ulgowy';
    const price = isU ? v.ulg : v.norm;

    document.getElementById('res-name').textContent = v.label;
    document.getElementById('res-scope').textContent = v.scope;
    document.getElementById('res-price').textContent = fmt(price);
    document.getElementById('res-info').innerHTML = v.info || 'Dostępny w aplikacji Transport GZM i na portalu transportgzm.pl.';
}
