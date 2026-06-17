"use strict";

// --- Konfiguration ---------------------------------------------------------

// Alle Spieler
const PLAYERS = ["Philipp", "Sebastian", "Christopher", "Martina", "Karsten"];

// Aussetz-Reihenfolge (alphabetisch), zyklisch
const SITOUT_ORDER = [
  "Karsten",
  "Sebastian",
  "Martina",
  "Philipp",
  "Christopher",
];

// Saison: jeden Mittwoch, 18:00-19:00 Uhr
const SEASON_START = { y: 2026, m: 6, d: 17 }; // Mi, 17.06.2026
const SEASON_END = { y: 2026, m: 10, d: 7 }; // Mi, 07.10.2026
const START_HOUR = 18;
const END_HOUR = 19;

// Sommerferien: in diesem Zeitraum (inklusive) finden keine Termine statt
const BREAK_START = { y: 2026, m: 7, d: 20 }; // Mo, 20.07.2026
const BREAK_END = { y: 2026, m: 9, d: 1 }; // Di, 01.09.2026

const WEEKDAYS = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];
const WEEKDAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// --- Hilfsfunktionen -------------------------------------------------------

function makeDate(y, m, d) {
  // m ist 1-basiert
  return new Date(y, m - 1, d);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// getDay(): 0 = Sonntag ... 6 = Samstag -> auf "Montag zuerst"-Arrays mappen
function weekdayIndex(date) {
  return (date.getDay() + 6) % 7;
}

function formatDateLong(date) {
  return `${WEEKDAYS_SHORT[weekdayIndex(date)]}, ${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function formatDateFull(date) {
  return `${WEEKDAYS[weekdayIndex(date)]}, ${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
}

// --- Terminplan erzeugen ---------------------------------------------------

function isInBreak(date) {
  const t = startOfDay(date).getTime();
  const start = makeDate(BREAK_START.y, BREAK_START.m, BREAK_START.d).getTime();
  const end = makeDate(BREAK_END.y, BREAK_END.m, BREAK_END.d).getTime();
  return t >= start && t <= end;
}

function buildSchedule() {
  const sessions = [];
  const end = makeDate(SEASON_END.y, SEASON_END.m, SEASON_END.d);
  let current = makeDate(SEASON_START.y, SEASON_START.m, SEASON_START.d);
  let played = 0;

  while (current.getTime() <= end.getTime()) {
    // Ferien-Termine ueberspringen; die Rotation laeuft nur ueber tatsaechliche Termine weiter
    if (!isInBreak(current)) {
      const sitOut = SITOUT_ORDER[played % SITOUT_ORDER.length];
      const playing = PLAYERS.filter((p) => p !== sitOut);
      sessions.push({
        index: played + 1,
        date: new Date(current),
        sitOut,
        playing,
      });
      played += 1;
    }
    current = new Date(current);
    current.setDate(current.getDate() + 7);
  }
  return sessions;
}

// Index des naechsten Termins (Datum >= heute), sonst -1
function findNextIndex(sessions, today) {
  const todayStart = startOfDay(today).getTime();
  for (let i = 0; i < sessions.length; i++) {
    if (startOfDay(sessions[i].date).getTime() >= todayStart) {
      return i;
    }
  }
  return -1;
}

// --- Rendering -------------------------------------------------------------

const SCHEDULE = buildSchedule();
let nextIndex = -1;
let selectedPerson = "";

function renderStatus(today) {
  document.getElementById("todayValue").textContent = formatDateFull(today);

  const nextDateEl = document.getElementById("nextDateValue");
  const nextOutEl = document.getElementById("nextOutValue");
  const nextOutInlineEl = document.getElementById("nextOutInline");
  const countdownEl = document.getElementById("nextCountdown");

  if (nextIndex === -1) {
    nextDateEl.textContent = "Saison beendet";
    countdownEl.textContent = "";
    nextOutEl.textContent = "\u2013";
    nextOutInlineEl.textContent = "";
    return;
  }

  const next = SCHEDULE[nextIndex];
  nextDateEl.textContent = `${formatDateLong(next.date)}, ${pad2(START_HOUR)}:00 Uhr`;
  nextOutEl.textContent = next.sitOut;
  nextOutInlineEl.textContent = `${next.sitOut} setzt aus`;

  const diffDays = Math.round(
    (startOfDay(next.date).getTime() - startOfDay(today).getTime()) / 86400000,
  );
  if (diffDays === 0) {
    countdownEl.textContent = "Heute!";
  } else if (diffDays === 1) {
    countdownEl.textContent = "Morgen";
  } else {
    countdownEl.textContent = `in ${diffDays} Tagen`;
  }
}

function renderTable(today) {
  const tbody = document.getElementById("scheduleBody");
  const todayStart = startOfDay(today).getTime();
  tbody.innerHTML = "";

  SCHEDULE.forEach((session, i) => {
    // Trennzeile fuer die Sommerpause, wenn zwischen zwei Terminen mehr als eine Woche liegt
    if (i > 0) {
      const prev = SCHEDULE[i - 1];
      const gapDays = Math.round(
        (startOfDay(session.date).getTime() - startOfDay(prev.date).getTime()) / 86400000,
      );
      if (gapDays > 7) {
        const breakTr = document.createElement("tr");
        breakTr.className = "row--break";
        const breakTd = document.createElement("td");
        breakTd.colSpan = 5;
        breakTd.textContent = `Sommerpause \u00b7 keine Termine (${pad2(BREAK_START.d)}.${pad2(BREAK_START.m)}. \u2013 ${pad2(BREAK_END.d)}.${pad2(BREAK_END.m)}.${BREAK_END.y})`;
        breakTr.appendChild(breakTd);
        tbody.appendChild(breakTr);
      }
    }

    const tr = document.createElement("tr");
    const isPast = startOfDay(session.date).getTime() < todayStart;
    const isNext = i === nextIndex;

    if (isPast) tr.classList.add("row--past");
    if (isNext) tr.classList.add("row--next");
    if (selectedPerson && session.sitOut === selectedPerson) {
      tr.classList.add("row--selected-out");
    }

    // # Nummer
    const numTd = document.createElement("td");
    numTd.className = "cell-num";
    numTd.textContent = session.index;
    tr.appendChild(numTd);

    // Datum
    const dateTd = document.createElement("td");
    dateTd.className = "cell-date";
    dateTd.textContent = formatDateLong(session.date);
    if (isNext) {
      const badge = document.createElement("span");
      badge.className = "badge-next";
      badge.textContent = "Nächster";
      dateTd.appendChild(badge);
    }
    tr.appendChild(dateTd);

    // Uhrzeit
    const timeTd = document.createElement("td");
    timeTd.className = "cell-time";
    timeTd.textContent = `${pad2(START_HOUR)}:00\u2013${pad2(END_HOUR)}:00`;
    tr.appendChild(timeTd);

    // Setzt aus
    const outTd = document.createElement("td");
    outTd.className = "cell-out";
    const outSpan = document.createElement("span");
    outSpan.className = "out-name";
    outSpan.textContent = session.sitOut;
    outTd.appendChild(outSpan);
    tr.appendChild(outTd);

    // Spieler
    const playersTd = document.createElement("td");
    playersTd.className = "players";
    session.playing.forEach((p, idx) => {
      const span = document.createElement("span");
      span.textContent = p;
      if (selectedPerson && p === selectedPerson) {
        span.className = "player--me";
      }
      playersTd.appendChild(span);
      if (idx < session.playing.length - 1) {
        playersTd.appendChild(document.createTextNode(", "));
      }
    });
    tr.appendChild(playersTd);

    tbody.appendChild(tr);
  });
}

function populateSelect() {
  const select = document.getElementById("personSelect");
  // alphabetisch sortiert fuer die Auswahl
  [...PLAYERS]
    .sort((a, b) => a.localeCompare(b, "de"))
    .forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      select.appendChild(opt);
    });
}

// --- .ics Export -----------------------------------------------------------

// VTIMEZONE-Definition fuer Europe/Berlin (CET/CEST)
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Berlin",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

function icsDateTime(date, hour) {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}T${pad2(hour)}0000`;
}

function dtstamp() {
  const now = new Date();
  const u = (n) => pad2(n);
  return `${now.getUTCFullYear()}${u(now.getUTCMonth() + 1)}${u(now.getUTCDate())}T${u(now.getUTCHours())}${u(now.getUTCMinutes())}${u(now.getUTCSeconds())}Z`;
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function buildIcs(person) {
  const stamp = dtstamp();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tennis Training//Terminuebersicht//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Tennis Training - ${person}`,
    ...VTIMEZONE,
  ];

  // Nur Termine, an denen die Person spielt
  SCHEDULE.filter((s) => s.sitOut !== person).forEach((s) => {
    const dateKey = `${s.date.getFullYear()}${pad2(s.date.getMonth() + 1)}${pad2(s.date.getDate())}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:tennis-${dateKey}-${slugify(person)}@tennis-training`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Europe/Berlin:${icsDateTime(s.date, START_HOUR)}`,
      `DTEND;TZID=Europe/Berlin:${icsDateTime(s.date, END_HOUR)}`,
      "SUMMARY:Tennis Training",
      `DESCRIPTION:Diese Woche setzt ${s.sitOut} aus. Spieler: ${s.playing.join(", ")}.`,
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadIcs(person) {
  const content = buildIcs(person);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tennis_${slugify(person)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Initialisierung -------------------------------------------------------

function init() {
  const today = new Date();
  nextIndex = findNextIndex(SCHEDULE, today);

  populateSelect();
  renderStatus(today);
  renderTable(today);

  const select = document.getElementById("personSelect");
  const downloadBtn = document.getElementById("downloadBtn");
  const hint = document.getElementById("controlsHint");

  select.addEventListener("change", () => {
    selectedPerson = select.value;
    downloadBtn.disabled = !selectedPerson;
    if (selectedPerson) {
      const count = SCHEDULE.filter((s) => s.sitOut !== selectedPerson).length;
      hint.textContent = `${selectedPerson} spielt bei ${count} von ${SCHEDULE.length} Terminen. Aussetz-Termine sind in der Tabelle markiert.`;
    } else {
      hint.textContent =
        "Wähle eine Person, um deine Aussetz-Termine hervorzuheben und deine Spieltermine als Kalenderdatei zu speichern.";
    }
    renderTable(today);
  });

  downloadBtn.addEventListener("click", () => {
    if (selectedPerson) {
      downloadIcs(selectedPerson);
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
