'use strict';

  const express = require('express');
  const path = require('path');
  const AdmZip = require('adm-zip');

  const app = express();
  const PORT = process.env.PORT || 3000;
  app.use(express.json());

  // ── GTFS STATE ────────────────────────────────────────────────────────────────
  let gtfsStops = [];          // [{id, name, lat, lon}]
  let adj = new Map();         // Map<stop_id, [{to, time_s}]>
  let gtfsLoaded = false;
  let gtfsError  = false;
  let gtfsLabel  = 'Ładuję bazę przystanków GZM…';

  // ── TARIFF ────────────────────────────────────────────────────────────────────
  const TARIFF = {
    tariff_label: 'Taryfa Transport GZM — od 01.01.2026',
    tickets: [
      {val:'20e',  cat:'jednorazowy',   norm:4.20,  ulg:2.10,  label:'20 minut (elektroniczny)',       scope:'20 min od zakupu, cała sieć',        desc:'Przesiadki OK', features:['Aplikacja mobilna','Kasownik w pojeździe','Karta płatnicza/NFC']},
      {val:'20p',  cat:'jednorazowy',   norm:4.60,  ulg:2.30,  label:'20 minut (papierowy)',           scope:'20 min od skasowania',               desc:'Przesiadki OK', features:['Punkt sprzedaży (kiosk)','Automat biletowy','POP']},
      {val:'40e',  cat:'jednorazowy',   norm:5.20,  ulg:2.60,  label:'40 minut (elektroniczny)',       scope:'40 min od zakupu, cała sieć',        desc:'Przesiadki OK', features:['Aplikacja mobilna','Kasownik w pojeździe','Karta płatnicza/NFC']},
      {val:'40p',  cat:'jednorazowy',   norm:5.60,  ulg:2.80,  label:'40 minut (papierowy)',           scope:'40 min od skasowania',               desc:'Przesiadki OK', features:['Punkt sprzedaży (kiosk)','Automat biletowy','POP']},
      {val:'120e', cat:'jednorazowy',   norm:6.60,  ulg:3.30,  label:'120 minut (elektroniczny)',      scope:'120 min od zakupu, cała sieć',       desc:'Przesiadki OK', features:['Aplikacja mobilna','Kasownik w pojeździe','Karta płatnicza/NFC']},
      {val:'120p', cat:'jednorazowy',   norm:7.00,  ulg:3.50,  label:'120 minut (papierowy)',          scope:'120 min od skasowania',              desc:'Przesiadki OK', features:['Punkt sprzedaży (kiosk)','Automat biletowy','POP']},
      {val:'grpe', cat:'jednorazowy',   norm:12.80, ulg:6.40,  label:'Grupowy elektroniczny',          scope:'120 min, do 5 osób, cała sieć',      desc:'Do 5 osób, 120 min', features:['Do 5 osób','Aplikacja mobilna','Kasownik w pojeździe']},
      {val:'grpp', cat:'jednorazowy',   norm:13.80, ulg:6.90,  label:'Grupowy papierowy',              scope:'120 min, do 5 osób',                 desc:'Do 5 osób, 120 min', features:['Do 5 osób','Tylko automat biletowy']},
      {val:'ss5',   cat:'start-stop',   norm:2.10,  ulg:1.05,  label:'Start/Stop (≤5 min)',            scope:'Taryfa czasowa Start/Stop',          features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      {val:'ss10',  cat:'start-stop',   norm:3.20,  ulg:1.60,  label:'Start/Stop (5–10 min)',          scope:'Taryfa czasowa Start/Stop',          features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      {val:'ss15',  cat:'start-stop',   norm:3.70,  ulg:1.85,  label:'Start/Stop (10–15 min)',         scope:'Taryfa czasowa Start/Stop',          features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      {val:'ss20',  cat:'start-stop',   norm:4.20,  ulg:2.10,  label:'Start/Stop (15–20 min)',         scope:'Taryfa czasowa Start/Stop',          features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      {val:'ss30',  cat:'start-stop',   norm:4.70,  ulg:2.35,  label:'Start/Stop (20–30 min)',         scope:'Taryfa czasowa Start/Stop',          features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      {val:'ss40',  cat:'start-stop',   norm:5.20,  ulg:2.60,  label:'Start/Stop (30–40 min)',         scope:'Taryfa czasowa Start/Stop',          features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      {val:'ss60',  cat:'start-stop',   norm:5.70,  ulg:2.85,  label:'Start/Stop (40–60 min)',         scope:'Taryfa czasowa Start/Stop',          features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      {val:'ss120', cat:'start-stop',   norm:6.60,  ulg:3.30,  label:'Start/Stop (60–120 min)',        scope:'Taryfa czasowa Start/Stop',          features:['Aplikacja Transport GZM','Kasownik w pojeździe','Czas wg rozkładu']},
      {val:'p20',  cat:'pakietowy',     norm:60,    ulg:30,    label:'Pakiet 20 przejazdów',           scope:'20 przejazdów, cała sieć, 180 dni',  desc:'3,00 zł/przejazd · 180 dni', features:['Bez przesiadek','Imienny','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'p40',  cat:'pakietowy',     norm:110,   ulg:55,    label:'Pakiet 40 przejazdów',           scope:'40 przejazdów, cała sieć, 180 dni',  desc:'2,75 zł/przejazd · 180 dni', features:['Bez przesiadek','Imienny','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'p80',  cat:'pakietowy',     norm:200,   ulg:100,   label:'Pakiet 80 przejazdów',           scope:'80 przejazdów, cała sieć, 180 dni',  desc:'2,50 zł/przejazd · 180 dni', features:['Bez przesiadek','Imienny','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'dzi',  cat:'sredniookresowy', norm:13,  ulg:6.50,  label:'Dzienny',                        scope:'Cała sieć, do 23:59',                desc:'Do 23:59 danego dnia', features:['Sob/święta: +1 osoba gratis','Aplikacja mobilna','Kasownik (wybrane)','Portal transportgzm.pl','Punkt sprzedaży','POP','Automat']},
      {val:'24h',  cat:'sredniookresowy', norm:24,  ulg:12,    label:'Metrobilet 24h',                 scope:'Cała sieć + linie kolejowe KŚ/POLREGIO w GZM', desc:'Imienny · 24h + pociągi KŚ/POLREGIO', features:['Pociągi KŚ/POLREGIO','Imienny','Portal / aplikacja / POP / automat']},
      {val:'m30',   cat:'dlugookresowy', norm:119,  ulg:59.50, label:'Metrobilet Miasto 30',           scope:'1 gmina + pociągi KŚ/POLREGIO, 30 dni', desc:'1 gmina + kolej, 30 dni', features:['1 gmina','+ kolej KŚ/POLREGIO','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'m90',   cat:'dlugookresowy', norm:300,  ulg:150,   label:'Miasto 90',                      scope:'1 gmina, 90 dni', desc:'1 gmina, 90 dni', features:['1 gmina','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'2m30',  cat:'dlugookresowy', norm:149,  ulg:74.50, label:'Metrobilet 2 Miasta 30',         scope:'2 graniczące gminy + pociągi, 30 dni', desc:'2 graniczące gminy + kolej, 30 dni', features:['2 gminy','+ kolej KŚ/POLREGIO','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'2m90',  cat:'dlugookresowy', norm:380,  ulg:190,   label:'2 Miasta 90',                    scope:'2 graniczące gminy, 90 dni', desc:'2 graniczące gminy, 90 dni', features:['2 gminy','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'obs30', cat:'dlugookresowy', norm:189,  ulg:94.50, label:'Metrobilet Obszarowy 30',        scope:'Cała sieć + kolej 3–6 gmin, 30 dni', desc:'Cała sieć + opcja kolejowa, 30 dni', features:['Cała sieć','Opcja kolejowa KŚ/POLREGIO','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'s7',    cat:'dlugookresowy', norm:60,   ulg:30,    label:'Sieć 7 imienny',                 scope:'Cała sieć, 7 dni', desc:'Cała sieć, 7 dni — imienny', features:['Cała sieć','Imienny','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'s7ok',  cat:'dlugookresowy', norm:63,   ulg:31.50, label:'Sieć 7 na okaziciela',           scope:'Cała sieć, 7 dni', desc:'Cała sieć, 7 dni — na okaziciela', features:['Cała sieć','Na okaziciela (anonimowy)','Portal / aplikacja / POP / automat']},
      {val:'ms30',  cat:'dlugookresowy', norm:249,  ulg:124.50, label:'Metrobilet Sieć 30',            scope:'Cała sieć + KŚ i POLREGIO, 30 dni', desc:'Cała sieć + wszystkie pociągi, 30 dni', features:['Cała sieć','Wszystkie pociągi KŚ/POLREGIO','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'s90',   cat:'dlugookresowy', norm:460,  ulg:230,   label:'Sieć 90',                        scope:'Cała sieć, 90 dni', desc:'Cała sieć, 90 dni', features:['Cała sieć','Portal / aplikacja / POP / automat / punkt sprzedaży']},
      {val:'s180',  cat:'dlugookresowy', norm:600,  ulg:300,   label:'Sieć 180',                       scope:'Cała sieć, 180 dni', desc:'Cała sieć, 180 dni — 3,33 zł/dzień', features:['Cała sieć','Najtaniej/dzień','Portal / aplikacja / POP / automat / punkt sprzedaży']},
    ]
  };

  // ── UTILS ─────────────────────────────────────────────────────────────────────
  function parseTime(s) {
    // HH:MM:SS → seconds (handles >24h times for overnight trips)
    const [h, m, sec] = s.split(':').map(Number);
    return h * 3600 + m * 60 + (sec || 0);
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function parseCSV(text) {
    const lines = text.split('\n');
    const header = lines[0].trim().split(',');
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const vals = line.split(',');
      const row = {};
      header.forEach((h, j) => { row[h.trim()] = (vals[j] || '').trim(); });
      rows.push(row);
    }
    return rows;
  }

  // ── GTFS LOADER ───────────────────────────────────────────────────────────────
  async function getGtfsUrl() {
    const CKAN_API = 'https://otwartedane.metropoliagzm.pl/api/3/action/package_show?id=rozklady-jazdy-gtfs-wersja-tymczasowa';
    const res = await fetch(CKAN_API, { signal: AbortSignal.timeout(15000) });
    const data = await res.json();
    const resources = data.result.resources.filter(r => r.format === 'ZIP');
    if (!resources.length) throw new Error('No ZIP resource found in CKAN');
    // Sort by name (contains date) — pick latest
    resources.sort((a, b) => b.name.localeCompare(a.name));
    return { url: resources[0].url, name: resources[0].name };
  }

  async function loadGtfs() {
    try {
      console.log('[GTFS] Fetching URL from open data portal...');
      const { url, name } = await getGtfsUrl();
      console.log('[GTFS] Downloading:', name, '(' + url + ')');

      const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const buf = Buffer.from(await res.arrayBuffer());
      console.log('[GTFS] Downloaded', Math.round(buf.length / 1024 / 1024 * 10) / 10, 'MB, parsing...');

      const zip = new AdmZip(buf);

      // ── Parse stops.txt ──────────────────────────────────────────────────────
      const stopsEntry = zip.getEntry('stops.txt');
      if (!stopsEntry) throw new Error('stops.txt not found in ZIP');
      const stopsText = stopsEntry.getData().toString('utf-8');
      const stopsRows = parseCSV(stopsText);
      gtfsStops = stopsRows
        .filter(r => r.stop_id && r.stop_name && r.stop_lat && r.stop_lon)
        .map(r => ({
          id: parseInt(r.stop_id) || r.stop_id,
          name: r.stop_name,
          lat: parseFloat(r.stop_lat),
          lon: parseFloat(r.stop_lon),
        }));
      console.log('[GTFS] Stops loaded:', gtfsStops.length);

      // ── Parse stop_times.txt → adjacency list ───────────────────────────────
      const stEntry = zip.getEntry('stop_times.txt');
      if (!stEntry) throw new Error('stop_times.txt not found in ZIP');
      const stText = stEntry.getData().toString('utf-8');

      // Parse into trips: Map<trip_id, [{stop_id, dep_sec, seq}]>
      const lines = stText.split('\n');
      const header = lines[0].trim().split(',');
      const iTrip = header.indexOf('trip_id');
      const iStop = header.indexOf('stop_id');
      const iDep  = header.indexOf('departure_time');
      const iSeq  = header.indexOf('stop_sequence');

      const trips = new Map();
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',');
        const tripId = cols[iTrip];
        const stopId = parseInt(cols[iStop]);
        const depStr = cols[iDep];
        const seq    = parseInt(cols[iSeq]);
        if (!tripId || !stopId || !depStr) continue;
        const depSec = parseTime(depStr);
        if (!trips.has(tripId)) trips.set(tripId, []);
        trips.get(tripId).push({ stopId, depSec, seq });
      }
      console.log('[GTFS] Trips parsed:', trips.size);

      // Build adjacency from consecutive stops in each trip
      adj = new Map();
      for (const [, stops] of trips) {
        stops.sort((a, b) => a.seq - b.seq);
        for (let i = 0; i < stops.length - 1; i++) {
          const from = stops[i].stopId;
          const to   = stops[i + 1].stopId;
          const dt   = stops[i + 1].depSec - stops[i].depSec;
          if (dt <= 0 || dt > 7200) continue; // skip anomalies (> 2h)
          if (!adj.has(from)) adj.set(from, []);
          adj.get(from).push({ to, time: dt });
        }
      }
      console.log('[GTFS] Adjacency edges:', [...adj.values()].reduce((s, v) => s + v.length, 0));

      // ── Update state ─────────────────────────────────────────────────────────
      const dateMatch = name.match(/(\d{4}\.\d{2}\.\d{2})/);
      const dateStr   = dateMatch ? dateMatch[1].replace(/\./g, '.') : '';
      gtfsLoaded = true;
      gtfsError  = false;
      gtfsLabel  = 'Baza ' + gtfsStops.length + ' przystanków GZM gotowa ✓' + (dateStr ? ' (rozkład ' + dateStr + ')' : '');
      console.log('[GTFS] Ready:', gtfsLabel);

    } catch (e) {
      console.error('[GTFS] Error:', e.message);
      gtfsError = true;
      // Fall back to bundled stops if available
      try {
        const bundled = require('./data/stops.json');
        gtfsStops = bundled;
        gtfsLabel = 'Baza ' + gtfsStops.length + ' przystanków GZM (bufor) ✓';
        console.log('[GTFS] Using bundled stops:', gtfsStops.length);
      } catch (_) {
        gtfsLabel = 'Błąd ładowania bazy przystanków';
      }
    }
  }

  // ── DIJKSTRA ──────────────────────────────────────────────────────────────────
  function dijkstra(fromIds, toIds) {
    const toSet = new Set(toIds);
    const dist  = new Map();
    // Min-heap simulation with array (small enough for transit networks)
    const queue = [];
    for (const id of fromIds) {
      dist.set(id, 0);
      queue.push({ id, d: 0 });
    }
    while (queue.length > 0) {
      queue.sort((a, b) => a.d - b.d);
      const { id, d } = queue.shift();
      if (d > (dist.get(id) || Infinity)) continue;
      if (toSet.has(id)) return d;
      const edges = adj.get(id) || [];
      for (const { to, time } of edges) {
        const nd = d + time;
        if (nd < (dist.get(to) || Infinity)) {
          dist.set(to, nd);
          queue.push({ id: to, d: nd });
        }
      }
    }
    return null;
  }

  // ── API ───────────────────────────────────────────────────────────────────────
  app.get('/api/stops', (req, res) => res.json(gtfsStops));

  app.get('/api/tariff', (req, res) => res.json(TARIFF));

  app.get('/api/travel-time', (req, res) => {
    const fromIds = (req.query.from || '').split(',').map(Number).filter(Boolean);
    const toIds   = (req.query.to   || '').split(',').map(Number).filter(Boolean);

    if (!fromIds.length || !toIds.length) {
      return res.json({ minutes: null, estimated: false });
    }

    if (!gtfsLoaded || adj.size === 0) {
      // Fall back to haversine
      const fromStop = gtfsStops.find(s => fromIds.includes(s.id));
      const toStop   = gtfsStops.find(s => toIds.includes(s.id));
      if (!fromStop || !toStop) return res.json({ minutes: null });
      const dist = haversine(fromStop.lat, fromStop.lon, toStop.lat, toStop.lon);
      return res.json({ minutes: Math.max(3, Math.round(dist * 3.5)), estimated: true });
    }

    const timeSec = dijkstra(fromIds, toIds);
    if (timeSec != null) {
      return res.json({ minutes: Math.round(timeSec / 60), estimated: false });
    }

    // No direct connection — haversine fallback
    const fromStop = gtfsStops.find(s => fromIds.includes(s.id));
    const toStop   = gtfsStops.find(s => toIds.includes(s.id));
    if (!fromStop || !toStop) return res.json({ minutes: null });
    const dist = haversine(fromStop.lat, fromStop.lon, toStop.lat, toStop.lon);
    res.json({ minutes: Math.max(3, Math.round(dist * 3.5)), estimated: true });
  });

  app.get('/api/route-search', (req, res) => {
    // Reuse travel-time logic
    const fromIds = (req.query.from || '').split(',').map(Number).filter(Boolean);
    const toIds   = (req.query.to   || '').split(',').map(Number).filter(Boolean);
    const timeSec = (gtfsLoaded && adj.size > 0) ? dijkstra(fromIds, toIds) : null;
    const fromStop = gtfsStops.find(s => fromIds.includes(s.id));
    const toStop   = gtfsStops.find(s => toIds.includes(s.id));
    let minutes = null, estimated = false;
    if (timeSec != null) {
      minutes = Math.round(timeSec / 60); estimated = false;
    } else if (fromStop && toStop) {
      const dist = haversine(fromStop.lat, fromStop.lon, toStop.lat, toStop.lon);
      minutes = Math.max(3, Math.round(dist * 3.5)); estimated = true;
    }
    res.json({ minutes, estimated, journeys: [] });
  });

  // ── STATIC ────────────────────────────────────────────────────────────────────
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

  // ── START ─────────────────────────────────────────────────────────────────────
  app.listen(PORT, () => {
    console.log('[server] Listening on port', PORT);
    loadGtfs(); // async — server accepts requests immediately, GTFS loads in background
  });