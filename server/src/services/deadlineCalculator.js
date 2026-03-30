'use strict';

// Festività fisse italiane (mese 1-based, giorno)
const FESTIVITA_FISSE = [
  [1, 1],   // Capodanno
  [1, 6],   // Epifania
  [4, 25],  // Liberazione
  [5, 1],   // Festa del Lavoro
  [6, 2],   // Repubblica
  [8, 15],  // Ferragosto
  [11, 1],  // Ognissanti
  [12, 8],  // Immacolata
  [12, 25], // Natale
  [12, 26], // Santo Stefano
];

/**
 * Calcola la Pasqua con l'algoritmo di Gauss.
 * @param {number} year
 * @returns {Date}
 */
function calcolaPasqua(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Restituisce le festività italiane per un dato anno (Pasqua inclusa).
 * @param {number} year
 * @returns {Set<string>} Set di stringhe "YYYY-MM-DD"
 */
function getFestivita(year) {
  const festivita = new Set();

  for (const [mese, giorno] of FESTIVITA_FISSE) {
    const d = new Date(year, mese - 1, giorno);
    festivita.add(toKey(d));
  }

  // Pasqua
  const pasqua = calcolaPasqua(year);
  festivita.add(toKey(pasqua));

  // Pasquetta (lunedì dopo Pasqua)
  const pasquetta = new Date(pasqua);
  pasquetta.setDate(pasquetta.getDate() + 1);
  festivita.add(toKey(pasquetta));

  return festivita;
}

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Verifica se una data è festiva (sabato, domenica o festività italiana).
 * @param {Date} date
 * @param {Set<string>} festivita
 * @returns {boolean}
 */
function isFestivo(date, festivita) {
  const dow = date.getDay(); // 0=domenica, 6=sabato
  if (dow === 0 || dow === 6) return true;
  return festivita.has(toKey(date));
}

/**
 * Avanza la data al primo giorno lavorativo successivo se festiva.
 * @param {Date} date
 * @returns {Date}
 */
function prossimoFeriale(date) {
  const festivita = getFestivita(date.getFullYear());
  const d = new Date(date);
  while (isFestivo(d, festivita)) {
    d.setDate(d.getDate() + 1);
    // Aggiorna festivita se cambio anno
    if (d.getFullYear() !== date.getFullYear()) {
      const nuoveFestivita = getFestivita(d.getFullYear());
      nuoveFestivita.forEach(f => festivita.add(f));
    }
  }
  return d;
}

/**
 * Verifica se il periodo [inizio, fine] attraversa agosto (sospensione feriale).
 * @param {Date} inizio
 * @param {Date} fine
 * @returns {boolean}
 */
function attraversaAgosto(inizio, fine) {
  const start = inizio < fine ? inizio : fine;
  const end = inizio < fine ? fine : inizio;
  // Attraversa agosto se c'è almeno un giorno di agosto nel periodo
  let d = new Date(start);
  while (d <= end) {
    if (d.getMonth() === 7) return true; // agosto = mese 7 (0-based)
    d.setMonth(d.getMonth() + 1);
    d.setDate(1); // salto al primo del mese successivo per efficienza
  }
  // Controllo più preciso: se il mese di agosto è compreso tra i due anni/mesi
  if (start.getFullYear() === end.getFullYear()) {
    return start.getMonth() <= 7 && end.getMonth() >= 7;
  }
  // Anni diversi: sicuramente attraversa agosto
  return true;
}

/**
 * Calcola un termine processuale o libero.
 *
 * @param {Date} dataInizio - dies a quo (NON conteggiato)
 * @param {number} giorni - numero giorni (positivo = avanti, negativo = indietro dall'ancora)
 * @param {string} tipo - "libero" | "processuale"
 * @param {Date|null} ancora - data di riferimento per termini negativi (es. data udienza)
 * @returns {Date} data scadenza corretta
 */
function calcolaTermine(dataInizio, giorni, tipo, ancora = null) {
  let dataBase;
  let dataFine;

  if (giorni >= 0) {
    // Termine in avanti da dataInizio
    dataBase = new Date(dataInizio);
    dataBase.setDate(dataBase.getDate() + 1); // dies a quo non si conta
    dataFine = new Date(dataBase);
    dataFine.setDate(dataFine.getDate() + giorni);
  } else {
    // Termine negativo: N giorni PRIMA dell'ancora
    if (!ancora) throw new Error('ancora obbligatoria per termini negativi');
    dataFine = new Date(ancora);
    dataFine.setDate(dataFine.getDate() + giorni); // giorni è già negativo
  }

  // Sospensione feriale per termini processuali
  if (tipo === 'processuale') {
    const periodoInizio = giorni >= 0 ? dataBase : dataFine;
    const periodoFine = giorni >= 0 ? dataFine : (ancora || dataInizio);
    if (attraversaAgosto(periodoInizio, periodoFine)) {
      // Aggiungi 31 giorni di sospensione feriale
      dataFine.setDate(dataFine.getDate() + 31);
    }
  }

  // Proroga al giorno lavorativo successivo se festivo
  return prossimoFeriale(dataFine);
}

module.exports = { calcolaTermine, calcolaPasqua, getFestivita };
