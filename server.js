'use strict';

  const express = require('express');
  const path = require('path');
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // ── STOPS DATA (bundled from GZM GTFS) ─────────────────────────────────────
  let gtfsStops = [];
  try {
    gtfsStops = require('./data/stops.json');
    console.log('[stops] Loaded', gtfsStops.length, 'stops from bundled data');
  } catch(e) {
    console.warn('[stops] Could not load bundled stops:', e.message);
    // Try to refresh from live source at startup
    refreshStops();
  }

  async function refreshStops() {
    try {
      const res = await fetch('https://dobierzmibilet.replit.app/api/stops', { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 100) {
        gtfsStops = data;
        console.log('[stops] Refreshed', gtfsStops.length, 'stops from live source');
        const fs2 = require('fs');
        const dataDir = path.join(__dirname, 'data');
        if (!fs2.existsSync(dataDir)) fs2.mkdirSync(dataDir, {recursive:true});
        fs2.writeFileSync(path.join(dataDir, 'stops.json'), JSON.stringify(data));
      }
    } catch(e) {
      console.warn('[stops] Live refresh failed:', e.message);
    }
  }

  // ── TARIFF DATA ─────────────────────────────────────────────────────────────
  const TARIFF = {
    tariff_label: 'Taryfa Transport GZM — od 01.01.2026',
    tickets: [
      // JEDNORAZOWE
      {val:'20e',  label:'20 minut (elektroniczny)', cat:'jednorazowy', norm:4.20, ulg:2.10, scope:'20 min od zakupu, cała sieć', desc:'Przesiadki OK', features:['Aplikacja mobilna','Kasownik w pojeździe','Karta płatnicza/NFC']},
      {val:'20p',  label:'20 minut (papierowy)', cat:'jednorazowy', norm:4.60, ulg:2.30, scope:'20 min od skasowania', desc:'Przesiadki OK', features:['Punkt sprzedaży (kiosk)','Automat biletowy','POP']},
      {val:'40e',  label:'40 minut (elektroniczny)', cat:'jednorazowy', norm:5.20, ulg:2.60, scope:'40 min od zakupu, cała sieć', desc:'Przesiadki OK', features:['Aplikacja mobilna','Kasownik w pojeździe','Karta płatnicza/NFC']},
      {val:'40p',  label:'40 minut (papierowy)', cat:'jednorazowy', norm:5.60, ulg:2.80, scope:'40 min od skasowania', desc:'Przesiadki OK', features:['Punkt sprzedaży (kiosk)','Automat biletowy','POP']},
      {val:'120e', label:'120 minut (elektroniczny)', cat:'jednorazowy', norm:6.60, ulg:3.30, scope:'120 min od zakupu, cała sieć', desc:'Przesiadki OK', features:['Aplikacja mobilna','Kasownik w pojeździe','Karta płatnicza/NFC']},
      {val:'120p', label:'120 minut (papierowy)', cat:'jednorazowy', norm:7.00, ulg:3.50, scope:'120 min od skasowania', desc:'Przesiadki OK', features:['Punkt sprzedaży (kiosk)','Automat biletowy','POP']},
      {val:'grpe', label:'Grupowy elektroniczny', cat:'jednorazowy', norm:12.80, ulg:6.40, scope:'120 min, do 5 osób, cała sieć', desc:'Do 5 osób, 120 min', features:['Do 5 osób','Aplikacja mobilna','Kasownik w pojeździe']},
      {val:'grpp', label:'Grupowy papierowy', cat:'jednorazowy', norm:13.80, ulg:6.90, scope:'120 min, do 5 osób', desc:'Do 5 osób, 120 min', features:['Do 5 osób','Tylko automat biletowy']},
      // START/STOP
      {val:'ss5',   label:'Start/Stop (≤5 min)',    cat:'start-stop', norm:2.10, ulg:1.05, scope:'Taryfa czasowa Start/Stop', features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      {val:'ss10',  label:'Start/Stop (5–10 min)',  cat:'start-stop', norm:3.20, ulg:1.60, scope:'Taryfa czasowa Start/Stop', features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      {val:'ss15',  label:'Start/Stop (10–15 min)', cat:'start-stop', norm:3.70, ulg:1.85, scope:'Taryfa czasowa Start/Stop', features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      {val:'ss20',  label:'Start/Stop (15–20 min)', cat:'start-stop', norm:4.20, ulg:2.10, scope:'Taryfa czasowa Start/Stop', features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      {val:'ss30',  label:'Start/Stop (20–30 min)', cat:'start-stop', norm:4.70, ulg:2.35, scope:'Taryfa czasowa Start/Stop', features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      {val:'ss40',  label:'Start/Stop (30–40 min)', cat:'start-stop', norm:5.20, ulg:2.60, scope:'Taryfa czasowa Start/Stop', features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      {val:'ss60',  label:'Start/Stop (40–60 min)', cat:'start-stop', norm:5.70, ulg:2.85, scope:'Taryfa czasowa Start/Stop', features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      {val:'ss120', label:'Start/Stop (60–120 min)', cat:'start-stop', norm:6.60, ulg:3.30, scope:'Taryfa czasowa Start/Stop', features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      // PAKIETOWE
      {val:'p20', label:'Pakiet 20 przejazdów', cat:'pakietowy', norm:60, ulg:30, scope:'20 przejazdów, cała sieć, 180 dni', desc:'3,00 zł/przejazd · 180 dni', features:['Bez przesiadek','Imienny','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'p40', label:'Pakiet 40 przejazdów', cat:'pakietowy', norm:110, ulg:55, scope:'40 przejazdów, cała sieć, 180 dni', desc:'2,75 zł/przejazd · 180 dni', features:['Bez przesiadek','Imienny','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'p80', label:'Pakiet 80 przejazdów', cat:'pakietowy', norm:200, ulg:100, scope:'80 przejazdów, cała sieć, 180 dni', desc:'2,50 zł/przejazd · 180 dni', features:['Bez przesiadek','Imienny','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      // ŚREDNIOOKRESOWE
      {val:'dzi', label:'Dzienny', cat:'sredniookresowy', norm:13, ulg:6.50, scope:'Cała sieć, do 23:59', desc:'Do 23:59 danego dnia', features:['Sob/święta: +1 osoba gratis','Aplikacja mobilna','Kasownik (wybrane)','Portal transportgzm.pl','Punkt sprzedaży','POP','Automat']},
      {val:'24h', label:'Metrobilet 24h', cat:'sredniookresowy', norm:24, ulg:12, scope:'Cała sieć + linie kolejowe KŚ/POLREGIO w GZM', desc:'Imienny · 24h + pociągi KŚ/POLREGIO', features:['Pociągi KŚ/POLREGIO','Imienny','Portal / aplikacja / POP / automat']},
      // DŁUGOOKRESOWE
      {val:'m30',   label:'Metrobilet Miasto 30', cat:'dlugookresowy', norm:119, ulg:59.50, scope:'1 gmina + pociągi KŚ/POLREGIO, 30 dni', desc:'1 gmina + kolej, 30 dni', features:['1 gmina','+ kolej KŚ/POLREGIO','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'m90',   label:'Miasto 90', cat:'dlugookresowy', norm:300, ulg:150, scope:'1 gmina, 90 dni', desc:'1 gmina, 90 dni', features:['1 gmina','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'2m30',  label:'Metrobilet 2 Miasta 30', cat:'dlugookresowy', norm:149, ulg:74.50, scope:'2 graniczące gminy + pociągi, 30 dni', desc:'2 graniczące gminy + kolej, 30 dni', features:['2 gminy','+ kolej KŚ/POLREGIO','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'2m90',  label:'2 Miasta 90', cat:'dlugookresowy', norm:380, ulg:190, scope:'2 graniczące gminy, 90 dni', desc:'2 graniczące gminy, 90 dni', features:['2 gminy','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'obs30', label:'Metrobilet Obszarowy 30', cat:'dlugookresowy', norm:189, ulg:94.50, scope:'Cała sieć + kolej 3–6 gmin, 30 dni', desc:'Cała sieć + opcja kolejowa, 30 dni', features:['Cała sieć','Opcja kolejowa KŚ/POLREGIO','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'s7',    label:'Sieć 7 imienny', cat:'dlugookresowy', norm:60, ulg:30, scope:'Cała sieć, 7 dni', desc:'Cała sieć, 7 dni — imienny', features:['Cała sieć','Imienny','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'s7ok',  label:'Sieć 7 na okaziciela', cat:'dlugookresowy', norm:63, ulg:31.50, scope:'Cała sieć, 7 dni', desc:'Cała sieć, 7 dni — na okaziciela', features:['Cała sieć','Na okaziciela (anonimowy)','Portal / aplikacja / POP / automat']},
      {val:'ms30',  label:'Metrobilet Sieć 30', cat:'dlugookresowy', norm:249, ulg:124.50, scope:'Cała sieć + KŚ i POLREGIO, 30 dni', desc:'Cała sieć + wszystkie pociągi, 30 dni', features:['Cała sieć','Wszystkie pociągi KŚ/POLREGIO','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'s90',   label:'Sieć 90', cat:'dlugookresowy', norm:460, ulg:230, scope:'Cała sieć, 90 dni', desc:'Cała sieć, 90 dni', features:['Cała sieć','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'s180',  label:'Sieć 180', cat:'dlugookresowy', norm:600, ulg:300, scope:'Cała sieć, 180 dni', desc:'Cała sieć, 180 dni — 3,33 zł/dzień', features:['Cała sieć','Najtaniej/dzień','Portal / aplikacja / POP / automat / punkt sprzedaży']},
    ]
  };

  // ── HAVERSINE ────────────────────────────────────────────────────────────────
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function findStop(id) {
    const numId = parseInt(id);
    return gtfsStops.find(s => s.id === numId) || null;
  }

  // ── API ROUTES ───────────────────────────────────────────────────────────────

  app.get('/api/stops', (req, res) => {
    res.json(gtfsStops);
  });

  app.get('/api/tariff', (req, res) => {
    res.json(TARIFF);
  });

  app.get('/api/travel-time', (req, res) => {
    const fromIds = (req.query.from || '').split(',').map(Number).filter(Boolean);
    const toIds   = (req.query.to   || '').split(',').map(Number).filter(Boolean);

    if (!fromIds.length || !toIds.length) {
      return res.json({ minutes: null, estimated: true, error: 'Brak ID przystanków' });
    }

    // Find best matching stops
    const fromStop = fromIds.map(findStop).find(Boolean);
    const toStop   = toIds.map(findStop).find(Boolean);

    if (!fromStop || !toStop) {
      return res.json({ minutes: null, estimated: true });
    }

    // Haversine estimation: average transit speed ~20 km/h in urban area
    const dist = haversine(fromStop.lat, fromStop.lon, toStop.lat, toStop.lon);
    const estMin = Math.max(3, Math.round(dist * 3.5)); // ~17 km/h effective speed

    res.json({ minutes: estMin, estimated: true, dist_km: parseFloat(dist.toFixed(2)) });
  });

  app.get('/api/route-search', (req, res) => {
    const fromIds = (req.query.from || '').split(',').map(Number).filter(Boolean);
    const toIds   = (req.query.to   || '').split(',').map(Number).filter(Boolean);

    const fromStop = fromIds.map(findStop).find(Boolean);
    const toStop   = toIds.map(findStop).find(Boolean);

    if (!fromStop || !toStop) {
      return res.json({ journeys: [], estimated: true });
    }

    const dist = haversine(fromStop.lat, fromStop.lon, toStop.lat, toStop.lon);
    const estMin = Math.max(3, Math.round(dist * 3.5));

    res.json({ minutes: estMin, estimated: true, journeys: [] });
  });

  // ── STATIC FILES ─────────────────────────────────────────────────────────────
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

  app.listen(PORT, () => {
    console.log('Server running on port', PORT);
    console.log('Stops loaded:', gtfsStops.length);
  });