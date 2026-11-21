(function () {
  "use strict";

  const STORAGE_KEY = "winlist.v1";
  const LEDGER_TX_KEY = "transactions";
  const LEDGER_BALANCE_KEY = "currentBalance";
  const APP_VERSION = "1.0.0";
  const DEFAULT_LEDGER_URL =
    "../WebMangageMent Monney/Web ManageMent Money But have calendar/index.html";

  const CATEGORIES = {
    expense: [
      "อาหาร",
      "ค่าเดินทาง",
      "ค่าที่พัก",
      "สาธารณูปโภค",
      "ช้อปปิ้ง",
      "บันเทิง",
      "สุขภาพ",
      "การศึกษา",
      "อื่นๆ",
    ],
    income: ["เงินเดือน", "โบนัส", "ลงทุน", "ขายของ", "ธุรกิจส่วนตัว", "อื่นๆ"],
  };

  const MONTHS_FULL = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const MONTHS_SHORT = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  const WEEKDAYS_FULL = [
    "วันอาทิตย์",
    "วันจันทร์",
    "วันอังคาร",
    "วันพุธ",
    "วันพฤหัสบดี",
    "วันศุกร์",
    "วันเสาร์",
  ];
  const WEEKDAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

  const SEGMENT_MAP = {
    0: "abcdef",
    1: "bc",
    2: "abged",
    3: "abgcd",
    4: "fgbc",
    5: "afgcd",
    6: "afgedc",
    7: "abc",
    8: "abcdefg",
    9: "abcdfg",
  };

  const MONEY_PENDING_STATES = new Set([
    "queued",
    "sent",
    "removing",
    "missing",
    "error",
  ]);

  const NUMBER_FORMAT = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const els = {};
  const app = {
    filter: "today",
    editingId: null,
    lastDayKey: "",
    lastStampedId: null,
    deferredPrompt: null,
    confirmResolve: null,
    loadError: "",
  };

  let state;

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function cacheElements() {
    els.topbar = $("#topbar");
    els.syncBtn = $("#syncBtn");
    els.themeBtn = $("#themeBtn");
    els.settingsBtn = $("#settingsBtn");
    els.dateDay = $("#dateDay");
    els.dateWeekday = $("#dateWeekday");
    els.dateMonth = $("#dateMonth");
    els.weekNo = $("#weekNo");
    els.clockSvg = $("#clockSvg");
    els.clockDate = $("#clockDate");
    els.clockMeridiem = $("#clockMeridiem");
    els.clockSr = $("#clockSr");
    els.clockZone = $("#clockZone");
    els.statTotal = $("#statTotal");
    els.statWins = $("#statWins");
    els.statOut = $("#statOut");
    els.statIn = $("#statIn");
    els.tallyNote = $("#tallyNote");
    els.filters = $(".filters");
    els.listWrap = $(".list-wrap");
    els.listHead = $(".list-head");
    els.taskList = $("#taskList");
    els.emptyState = $("#emptyState");
    els.emptyKicker = $("#emptyKicker");
    els.emptyTitle = $("#emptyTitle");
    els.emptyBody = $("#emptyBody");
    els.emptyAddBtn = $("#emptyAddBtn");
    els.ledgerSummary = $("#ledgerSummary");
    els.ledgerDetail = $("#ledgerDetail");
    els.ledgerAction = $("#ledgerAction");
    els.addBtn = $("#addBtn");
    els.taskDialog = $("#taskDialog");
    els.taskForm = $("#taskForm");
    els.taskDialogTitle = $("#taskDialogTitle");
    els.taskDialogSub = $("#taskDialogSub");
    els.taskTitle = $("#taskTitle");
    els.titleField = $("#titleField");
    els.titleError = $("#titleError");
    els.taskDate = $("#taskDate");
    els.taskTime = $("#taskTime");
    els.quickDateRow = $(".quick-row");
    els.moneyInputs = $("#moneyInputs");
    els.moneyTypeInputs = document.querySelectorAll(
      'input[name="moneyType"]'
    );
    els.taskAmount = $("#taskAmount");
    els.amountField = $("#amountField");
    els.amountError = $("#amountError");
    els.taskCategory = $("#taskCategory");
    els.quickAmounts = $("#quickAmounts");
    els.taskNotes = $("#taskNotes");
    els.taskStamps = $("#taskStamps");
    els.stampCreated = $("#stampCreated");
    els.stampUpdated = $("#stampUpdated");
    els.stampCompletedRow = $("#stampCompletedRow");
    els.stampCompleted = $("#stampCompleted");
    els.stampLedgerRow = $("#stampLedgerRow");
    els.stampLedger = $("#stampLedger");
    els.saveTaskBtn = $("#saveTaskBtn");
    els.deleteTaskBtn = $("#deleteTaskBtn");
    els.settingsDialog = $("#settingsDialog");
    els.ledgerStatus = $("#ledgerStatus");
    els.ledgerStatusText = $("#ledgerStatusText");
    els.ledgerStatusDetail = $("#ledgerStatusDetail");
    els.ledgerUrl = $("#ledgerUrl");
    els.ledgerTestBtn = $("#ledgerTestBtn");
    els.ledgerFlushBtn = $("#ledgerFlushBtn");
    els.ledgerOpenBtn = $("#ledgerOpenBtn");
    els.exportBtn = $("#exportBtn");
    els.importBtn = $("#importBtn");
    els.importFile = $("#importFile");
    els.clearDoneBtn = $("#clearDoneBtn");
    els.clearAllBtn = $("#clearAllBtn");
    els.secondsToggle = $("#secondsToggle");
    els.installBtn = $("#installBtn");
    els.installHelp = $("#installHelp");
    els.storageNote = $("#storageNote");
    els.aboutVersion = $("#aboutVersion");
    els.footVersion = $("#footVersion");
    els.confirmDialog = $("#confirmDialog");
    els.confirmTitle = $("#confirmTitle");
    els.confirmBody = $("#confirmBody");
    els.confirmOk = $("#confirmOk");
    els.confirmCancel = $("#confirmCancel");
    els.toastRegion = $("#toastRegion");
  }

  function defaultSettings() {
    return {
      theme: "system",
      clockFormat: "24",
      showSeconds: true,
      ledgerUrl: DEFAULT_LEDGER_URL,
      ledgerVerified: false,
    };
  }

  function defaultState() {
    return {
      version: 1,
      tasks: [],
      settings: defaultSettings(),
      ledgerQueue: [],
      meta: {
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
      },
    };
  }

  function validIso(value) {
    if (typeof value !== "string") return null;
    const time = Date.parse(value);
    return Number.isFinite(time) ? new Date(time).toISOString() : null;
  }

  function normalizeTask(raw) {
    if (!raw || typeof raw !== "object") return null;
    const title = String(raw.title || "").trim().slice(0, 140);
    if (!title) return null;

    const createdAt = validIso(raw.createdAt) || new Date().toISOString();
    let money = null;
    if (raw.money && typeof raw.money === "object") {
      const type = raw.money.type;
      const amount = Number(raw.money.amount);
      if (
        (type === "expense" || type === "income") &&
        Number.isFinite(amount) &&
        amount > 0
      ) {
        money = {
          type,
          amount: Math.round(amount * 100) / 100,
          category:
            typeof raw.money.category === "string" && raw.money.category
              ? raw.money.category.slice(0, 80)
              : "อื่นๆ",
        };
      }
    }

    const stateValue = [
      "none",
      "queued",
      "sent",
      "posted",
      "missing",
      "removing",
      "error",
    ].includes(raw.moneyState)
      ? raw.moneyState
      : raw.ledgerId
        ? "posted"
        : "none";

    return {
      id:
        typeof raw.id === "string" && raw.id
          ? raw.id
          : uid(),
      title,
      notes:
        typeof raw.notes === "string" ? raw.notes.slice(0, 500) : "",
      dueDate:
        typeof raw.dueDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(raw.dueDate)
          ? raw.dueDate
          : "",
      dueTime:
        typeof raw.dueTime === "string" &&
        /^\d{2}:\d{2}$/.test(raw.dueTime)
          ? raw.dueTime
          : "",
      money,
      createdAt,
      updatedAt: validIso(raw.updatedAt) || createdAt,
      completedAt: validIso(raw.completedAt),
      moneyState: money ? stateValue : "none",
      ledgerId:
        Number.isFinite(Number(raw.ledgerId)) && Number(raw.ledgerId) > 0
          ? Number(raw.ledgerId)
          : null,
      postedAt: validIso(raw.postedAt),
      syncError:
        typeof raw.syncError === "string"
          ? raw.syncError.slice(0, 240)
          : null,
    };
  }

  function normalizeQueue(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((op) => op && typeof op === "object" && op.taskId)
      .map((op) => {
        const safe = {
          id:
            typeof op.id === "string" && op.id ? op.id : uid(),
          op: op.op === "remove" ? "remove" : "upsert",
          taskId: String(op.taskId),
          ledgerId: Number.isFinite(Number(op.ledgerId)) && Number(op.ledgerId) > 0
            ? Number(op.ledgerId)
            : null,
          todoId: String(op.taskId),
          createdAt: validIso(op.createdAt) || new Date().toISOString(),
          sentAt: validIso(op.sentAt),
        };
        if (safe.op === "upsert" && op.entry && typeof op.entry === "object") {
          safe.entry = op.entry;
        }
        return safe;
      });
  }

  function normalizeState(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const settings = Object.assign(defaultSettings(), source.settings || {});
    settings.theme = ["system", "light", "dark"].includes(settings.theme)
      ? settings.theme
      : "system";
    settings.clockFormat = settings.clockFormat === "12" ? "12" : "24";
    settings.showSeconds = settings.showSeconds !== false;
    settings.ledgerUrl =
      typeof settings.ledgerUrl === "string"
        ? settings.ledgerUrl.trim()
        : DEFAULT_LEDGER_URL;
    settings.ledgerVerified = Boolean(settings.ledgerVerified);

    return {
      version: 1,
      tasks: Array.isArray(source.tasks)
        ? source.tasks.map(normalizeTask).filter(Boolean)
        : [],
      settings,
      ledgerQueue: normalizeQueue(source.ledgerQueue),
      meta: Object.assign(
        {
          createdAt: new Date().toISOString(),
          lastOpenedAt: new Date().toISOString(),
        },
        source.meta && typeof source.meta === "object" ? source.meta : {}
      ),
    };
  }

  function loadState() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      app.loadError = "เบราว์เซอร์ไม่อนุญาตให้ใช้ที่เก็บข้อมูลในเครื่องนี้";
      return defaultState();
    }
    if (!raw) return defaultState();
    try {
      return normalizeState(JSON.parse(raw));
    } catch (error) {
      try {
        localStorage.setItem(
          STORAGE_KEY + ".corrupt." + Date.now(),
          raw
        );
      } catch (ignored) {}
      app.loadError =
        "อ่านข้อมูลเดิมไม่สำเร็จ จึงเริ่มจากสมุดว่าง (สำรองข้อมูลเดิมไว้แล้ว)";
      return defaultState();
    }
  }

  function saveState() {
    try {
      state.meta = state.meta || {};
      state.meta.lastOpenedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      showToast("บันทึกไม่ได้: พื้นที่เก็บข้อมูลเต็มหรือถูกบล็อก", {
        type: "error",
        duration: 6000,
      });
      return false;
    }
  }

  function uid() {
    return (
      "t_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function localDayKey(value) {
    const date =
      value instanceof Date
        ? value
        : value
          ? new Date(value)
          : new Date();
    if (!Number.isFinite(date.getTime())) return "";
    return (
      date.getFullYear() +
      "-" +
      pad2(date.getMonth() + 1) +
      "-" +
      pad2(date.getDate())
    );
  }

  function localMonthKey(value) {
    const date =
      value instanceof Date
        ? value
        : value
          ? new Date(value)
          : new Date();
    if (!Number.isFinite(date.getTime())) return "";
    return date.getFullYear() + "-" + pad2(date.getMonth() + 1);
  }

  function todayKey() {
    return localDayKey(new Date());
  }

  function tomorrowKey() {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return localDayKey(date);
  }

  function yesterdayKey() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return localDayKey(date);
  }

  function parseDayKey(key) {
    if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
    const parts = key.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function dueTimestamp(task) {
    if (!task.dueDate) return Infinity;
    const day = parseDayKey(task.dueDate);
    if (!day) return Infinity;
    let hours = 23;
    let minutes = 59;
    if (task.dueTime) {
      const parts = task.dueTime.split(":").map(Number);
      hours = parts[0];
      minutes = parts[1];
    }
    const date = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      hours,
      minutes,
      0,
      0
    );
    return date.getTime();
  }

  function isDone(task) {
    return Boolean(task.completedAt);
  }

  function isOverdue(task, now) {
    if (!task || isDone(task) || !task.dueDate) return false;
    const reference = now || new Date();
    const today = localDayKey(reference);
    if (task.dueDate < today) return true;
    if (task.dueDate > today) return false;
    if (!task.dueTime) return false;
    const timestamp = dueTimestamp(task);
    return Number.isFinite(timestamp) && timestamp < reference.getTime();
  }

  function isVisibleToday(task, now) {
    const reference = now || new Date();
    const today = localDayKey(reference);
    if (task.dueDate) {
      if (task.dueDate === today) return true;
      if (!isDone(task) && isOverdue(task, reference)) return true;
      if (task.completedAt && localDayKey(task.completedAt) === today) {
        return true;
      }
      return false;
    }
    if (localDayKey(task.createdAt) === today) return true;
    if (task.completedAt && localDayKey(task.completedAt) === today) {
      return true;
    }
    return false;
  }

  function formatMoney(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value)) return "฿0.00";
    return "฿" + NUMBER_FORMAT.format(Math.abs(value));
  }

  function formatAmountPlain(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value)) return "";
    return String(Math.round(value * 100) / 100);
  }

  function formatTimeParts(hours, minutes, options) {
    const settings = options || {};
    const withSeconds = Boolean(settings.seconds);
    const seconds = Number(settings.secondValue || 0);
    const use12 = state && state.settings.clockFormat === "12";
    let displayHours = hours;
    let meridiem = "";
    if (use12) {
      meridiem = hours >= 12 ? "PM" : "AM";
      displayHours = hours % 12 || 12;
    }
    const base =
      (use12 ? String(displayHours) : pad2(displayHours)) +
      ":" +
      pad2(minutes) +
      (withSeconds ? ":" + pad2(seconds) : "");
    return { time: base, meridiem };
  }

  function formatClock(date) {
    return formatTimeParts(date.getHours(), date.getMinutes(), {
      seconds: state.settings.showSeconds,
      secondValue: date.getSeconds(),
    });
  }

  function formatDueTime(value) {
    if (!value || !/^\d{2}:\d{2}$/.test(value)) return "";
    const parts = value.split(":").map(Number);
    const formatted = formatTimeParts(parts[0], parts[1]);
    return formatted.time + (formatted.meridiem ? " " + formatted.meridiem : "");
  }

  function formatStampShort(value, options) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return "—";
    const today = todayKey();
    const key = localDayKey(date);
    const time = formatTimeParts(date.getHours(), date.getMinutes()).time;
    if (key === today && !(options && options.alwaysDate)) {
      return time + " น.";
    }
    const year =
      date.getFullYear() === new Date().getFullYear()
        ? ""
        : " " + (date.getFullYear() + 543);
    return (
      date.getDate() +
      " " +
      MONTHS_SHORT[date.getMonth()] +
      year +
      " " +
      time
    );
  }

  function formatStampFull(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return "—";
    const formatted = formatTimeParts(
      date.getHours(),
      date.getMinutes(),
      { seconds: true, secondValue: date.getSeconds() }
    );
    return (
      date.getDate() +
      " " +
      MONTHS_SHORT[date.getMonth()] +
      " " +
      (date.getFullYear() + 543) +
      " " +
      formatted.time +
      (formatted.meridiem ? " " + formatted.meridiem : "") +
      " น."
    );
  }

  function formatDueLabel(task) {
    if (!task.dueDate) return "";
    if (task.dueDate === todayKey()) return "วันนี้";
    if (task.dueDate === tomorrowKey()) return "พรุ่งนี้";
    if (task.dueDate === yesterdayKey()) return "เมื่อวาน";
    const day = parseDayKey(task.dueDate);
    if (!day) return "";
    return (
      day.getDate() + " " + MONTHS_SHORT[day.getMonth()]
    );
  }

  function weekNumber(date) {
    const target = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNumber = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    return Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
  }

  function getTask(id) {
    return state.tasks.find((task) => task.id === id) || null;
  }

  function moneyPending(task) {
    return Boolean(
      task &&
        task.money &&
        isDone(task) &&
        MONEY_PENDING_STATES.has(task.moneyState)
    );
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const ICON_CLOCK =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.2" stroke="currentColor" stroke-width="1.7"/><path d="M12 7.6V12l3 1.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
  const ICON_LEDGER =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 5.5h10a2 2 0 0 1 2 2v11H7a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.6"/><path d="M9 9.5h6M9 12.5h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  /* ---------- Clock ---------- */

  const CLOCK_WIDTH = 300;
  const CLOCK_HEIGHT = 84;
  let clockSlots = [];
  let lastClockText = "";

  function createSvgEl(name, attrs) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attrs || {}).forEach((key) => {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function segmentRects() {
    return [
      [8, 0, 22, 5],
      [30, 5, 5, 24],
      [30, 34, 5, 25],
      [8, 59, 22, 5],
      [3, 34, 5, 25],
      [3, 5, 5, 24],
      [8, 29, 22, 5],
    ];
  }

  function updateClockText(text) {
    const value = String(text);
    const chars = value.split("");
    const fits =
      chars.length === clockSlots.length &&
      chars.every((char, index) => {
        const slot = clockSlots[index];
        if (!slot) return false;
        return char === ":"
          ? slot.type === "colon"
          : slot.type === "digit" && /\d/.test(char);
      });
    if (!fits) {
      buildClock(value);
      return;
    }
    chars.forEach((char, index) => {
      const slot = clockSlots[index];
      if (slot.type !== "digit") return;
      const active = SEGMENT_MAP[char] || "";
      slot.segs.forEach((seg) => {
        seg.classList.toggle(
          "on",
          active.indexOf(seg.getAttribute("data-seg")) !== -1
        );
      });
    });
  }

  function buildClock(text) {
    const chars = String(text).split("");
    const digitCount = chars.filter((char) => /\d/.test(char)).length;
    const colonCount = chars.length - digitCount;
    const totalWidth =
      digitCount * 38 + colonCount * 12 + Math.max(0, chars.length - 1) * 4;
    let x = Math.max(0, (CLOCK_WIDTH - totalWidth) / 2);

    els.clockSvg.textContent = "";
    clockSlots = [];

    chars.forEach((char, index) => {
      if (/\d/.test(char)) {
        const group = createSvgEl("g", {
          transform: "translate(" + x + " 10)",
        });
        const segs = segmentRects().map((rect, rectIndex) => {
          const node = createSvgEl("rect", {
            x: rect[0],
            y: rect[1],
            width: rect[2],
            height: rect[3],
            rx: 1.2,
            class: "seg",
            "data-seg": "abcdefg"[rectIndex],
          });
          group.appendChild(node);
          return node;
        });
        els.clockSvg.appendChild(group);
        clockSlots.push({ type: "digit", segs: segs });
        x += 38;
      } else if (char === ":") {
        const group = createSvgEl("g", {
          transform: "translate(" + x + " 10)",
        });
        [28, 50].forEach((cy) => {
          group.appendChild(
            createSvgEl("circle", {
              cx: 6,
              cy: cy,
              r: 3,
              class: "colon-dot",
            })
          );
        });
        els.clockSvg.appendChild(group);
        clockSlots.push({ type: "colon" });
        x += 12;
      }
      if (index < chars.length - 1) x += 4;
    });

    updateClockText(text);
  }

  function renderDateBand(now) {
    const date = now || new Date();
    els.dateDay.textContent = String(date.getDate());
    els.dateWeekday.textContent = WEEKDAYS_FULL[date.getDay()];
    els.dateWeekday.classList.toggle("is-sunday", date.getDay() === 0);
    els.dateMonth.textContent =
      MONTHS_FULL[date.getMonth()] + " " + (date.getFullYear() + 543);
    els.weekNo.textContent = "สัปดาห์ที่ " + weekNumber(date);
    els.clockDate.textContent =
      WEEKDAYS_SHORT[date.getDay()] +
      " " +
      date.getDate() +
      " " +
      MONTHS_SHORT[date.getMonth()] +
      " " +
      (date.getFullYear() + 543);
  }

  function tickClock(force) {
    const now = new Date();
    const clock = formatClock(now);
    if (force || clock.time !== lastClockText) {
      updateClockText(clock.time);
      lastClockText = clock.time;
    }
    if (els.clockMeridiem) {
      els.clockMeridiem.textContent = clock.meridiem || "";
      els.clockMeridiem.hidden = !clock.meridiem;
    }
    if (els.clockSr) {
      els.clockSr.textContent =
        "เวลา " + clock.time + (clock.meridiem ? " " + clock.meridiem : "");
    }

    const dayKey = localDayKey(now);
    if (force || dayKey !== app.lastDayKey) {
      app.lastDayKey = dayKey;
      renderDateBand(now);
      renderAll();
    }
  }

  function startClock() {
    buildClock(formatClock(new Date()).time);
    tickClock(true);
    window.setInterval(function () {
      tickClock(false);
    }, 1000);
  }

  /* ---------- Theme ---------- */

  function resolvedTheme() {
    if (state.settings.theme === "dark") return "dark";
    if (state.settings.theme === "light") return "light";
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme() {
    const theme = resolvedTheme();
    document.documentElement.setAttribute("data-theme", theme);
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach((meta) => {
      if (meta.getAttribute("media")) return;
      meta.setAttribute(
        "content",
        theme === "dark" ? "#0b1310" : "#e5ebe1"
      );
    });
  }

  function cycleTheme() {
    const current = resolvedTheme();
    state.settings.theme = current === "dark" ? "light" : "dark";
    saveState();
    applyTheme();
    syncSettingsControls();
  }

  /* ---------- Rendering ---------- */

  function taskMatchesFilter(task, filter) {
    if (filter === "open") return !isDone(task);
    if (filter === "done") return isDone(task);
    if (filter === "all") return true;
    return isVisibleToday(task);
  }

  function sortTasks(tasks) {
    return tasks.slice().sort(function (a, b) {
      const aDone = isDone(a);
      const bDone = isDone(b);
      if (aDone !== bDone) return aDone ? 1 : -1;
      if (aDone) {
        return (
          (Date.parse(b.completedAt) || 0) -
          (Date.parse(a.completedAt) || 0)
        );
      }
      const aDue = dueTimestamp(a);
      const bDue = dueTimestamp(b);
      if (aDue !== bDue) return aDue - bDue;
      return (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0);
    });
  }

  function visibleTasks(filter) {
    return sortTasks(
      state.tasks.filter(function (task) {
        return taskMatchesFilter(task, filter);
      })
    );
  }

  function moneyStateLabel(task) {
    if (!task.money || !isDone(task)) return "";
    if (task.moneyState === "posted") return "ลงบัญชีแล้ว";
    if (task.moneyState === "queued" || task.moneyState === "sent") {
      return "รอลงบัญชี";
    }
    if (task.moneyState === "removing") return "กำลังถอนรายการ";
    if (task.moneyState === "error" || task.moneyState === "missing") {
      return "ยังไม่ลงบัญชี";
    }
    return "ยังไม่ลงบัญชี";
  }

  function metaTimeText(task) {
    if (task.dueTime) return formatDueTime(task.dueTime);
    const date = new Date(task.createdAt);
    if (!Number.isFinite(date.getTime())) return "";
    return formatTimeParts(date.getHours(), date.getMinutes()).time;
  }

  function taskRowHtml(task) {
    const done = isDone(task);
    const overdue = isOverdue(task);
    const money = task.money;
    const meta = [];

    if (task.dueDate) {
      const dueLabel = formatDueLabel(task);
      const dueText =
        (task.dueTime ? formatDueTime(task.dueTime) + " · " : "") + dueLabel;
      meta.push(
        '<span class="' +
          (overdue ? "overdue " : "") +
          'mobile-time">' +
          ICON_CLOCK +
          escapeHtml(dueText) +
          "</span>"
      );
    }

    meta.push(
      "<span>จด " + escapeHtml(formatStampShort(task.createdAt)) + "</span>"
    );

    if (done) {
      meta.push(
        '<span class="stamp-time">WIN ' +
          escapeHtml(formatStampShort(task.completedAt)) +
          "</span>"
      );
    }

    if (money && done) {
      const stateLabel = moneyStateLabel(task);
      const stateClass =
        task.moneyState === "posted"
          ? "sync-posted"
          : task.moneyState === "error" || task.moneyState === "missing"
            ? "sync-error"
            : "sync-queued";
      meta.push(
        '<span class="sync ' +
          stateClass +
          '" title="' +
          escapeHtml(task.syncError || stateLabel) +
          '">' +
          escapeHtml(stateLabel) +
          "</span>"
      );
    }

    const out =
      money && money.type === "expense"
        ? "−" + formatMoney(money.amount)
        : "";
    const income =
      money && money.type === "income"
        ? "+" + formatMoney(money.amount)
        : "";

    const timeParts = (function () {
      if (task.dueTime) {
        return {
          main: formatDueTime(task.dueTime),
          sub: task.dueDate ? formatDueLabel(task) : "",
        };
      }
      const created = new Date(task.createdAt);
      if (!Number.isFinite(created.getTime())) return { main: "", sub: "" };
      return {
        main: formatTimeParts(created.getHours(), created.getMinutes()).time,
        sub: "จด",
      };
    })();

    return (
      '<div class="task-row' +
      (done ? " is-done" : "") +
      '" data-id="' +
      escapeHtml(task.id) +
      '">' +
      '<button type="button" class="stamp-btn" data-action="stamp" data-id="' +
      escapeHtml(task.id) +
      '" aria-pressed="' +
      (done ? "true" : "false") +
      '" aria-label="' +
      escapeHtml(
        (done ? "ยกเลิกการทำเสร็จ: " : "ทำเครื่องหมายว่าเสร็จ: ") + task.title
      ) +
      '">' +
      '<span class="stamp-word" aria-hidden="true">WIN</span>' +
      "</button>" +
      '<div class="task-time' +
      (overdue ? " is-overdue" : "") +
      '">' +
      "<span>" +
      escapeHtml(timeParts.main) +
      "</span>" +
      (timeParts.sub
        ? '<span class="date-part">' + escapeHtml(timeParts.sub) + "</span>"
        : "") +
      "</div>" +
      '<button type="button" class="task-main" data-action="edit" data-id="' +
      escapeHtml(task.id) +
      '" aria-label="แก้ไขรายการ: ' +
      escapeHtml(task.title) +
      '">' +
      '<span class="task-title"><span>' +
      escapeHtml(task.title) +
      "</span></span>" +
      '<span class="task-meta">' +
      meta.join('<span class="dot" aria-hidden="true"></span>') +
      "</span>" +
      "</button>" +
      '<div class="task-money">' +
      (out ? '<span class="money-out">' + out + "</span>" : "") +
      (income ? '<span class="money-in">' + income + "</span>" : "") +
      "</div>" +
      "</div>"
    );
  }

  function renderTaskList() {
    const tasks = visibleTasks(app.filter);
    if (tasks.length) {
      els.taskList.innerHTML = tasks.map(taskRowHtml).join("");
      els.emptyState.hidden = true;
      if (app.lastStampedId) {
        const row = els.taskList.querySelector(
          '[data-id="' + app.lastStampedId + '"]'
        );
        if (row) {
          row.classList.add("just-stamped");
          window.setTimeout(function () {
            row.classList.remove("just-stamped");
          }, 480);
        }
        app.lastStampedId = null;
      }
    } else {
      els.taskList.innerHTML = "";
      els.emptyState.hidden = false;
      renderEmptyState();
    }
    renderCounts();
  }

  function renderEmptyState() {
    const copy = {
      today: {
        kicker: "วันนี้ยังว่าง",
        title: "เริ่มจากสิ่งที่ต้องทำวันนี้",
        body:
          "จดงานหนึ่งอย่าง ใส่เวลา และถ้ามีเงินที่ต้องจ่ายหรือได้รับ ก็ใส่จำนวนไว้ได้เลย WinList จะลงบัญชีให้เมื่อคุณทำเสร็จ",
        button: "เขียนรายการแรก",
      },
      open: {
        kicker: "ไม่มีงานค้าง",
        title: "คิวว่างแล้ว",
        body:
          "ทุกงานที่ยังไม่เสร็จจะอยู่ที่นี่ ถ้ามีงานใหม่ที่ยังไม่กำหนดวัน ก็เพิ่มได้เลย",
        button: "เพิ่มงานค้าง",
      },
      done: {
        kicker: "ยังไม่มีWIN",
        title: "ยังไม่มีงานที่ทำเสร็จ",
        body:
          "กดช่องประทับทางซ้ายของแต่ละงาน เพื่อบันทึกเวลาเสร็จและลงเงินที่เกี่ยวข้อง",
        button: "ไปที่รายการวันนี้",
      },
      all: {
        kicker: "สมุดยังว่าง",
        title: "จดงานแรกของสมุดเล่มนี้",
        body:
          "WinList เก็บงาน เวลา และเงินที่เกี่ยวข้องไว้ในเครื่องเดียว ทำเสร็จแล้วจึงลงบัญชี",
        button: "เขียนรายการแรก",
      },
    };
    const item = copy[app.filter] || copy.today;
    els.emptyKicker.textContent = item.kicker;
    els.emptyTitle.textContent = item.title;
    els.emptyBody.textContent = item.body;
    els.emptyAddBtn.lastChild.textContent = " " + item.button;
  }

  function renderCounts() {
    const counts = {
      today: 0,
      open: 0,
      done: 0,
      all: state.tasks.length,
    };
    state.tasks.forEach(function (task) {
      if (isVisibleToday(task)) counts.today += 1;
      if (isDone(task)) counts.done += 1;
      else counts.open += 1;
    });
    Object.keys(counts).forEach(function (key) {
      const node = document.querySelector(
        '.filter .count[data-count="' + key + '"]'
      );
      if (node) node.textContent = String(counts[key]);
    });
  }

  function renderTally() {
    const today = state.tasks.filter(function (task) {
      return isVisibleToday(task);
    });
    const wins = today.filter(function (task) {
      return isDone(task) && localDayKey(task.completedAt) === todayKey();
    });
    let out = 0;
    let income = 0;
    today.forEach(function (task) {
      if (!isDone(task) || !task.money) return;
      if (localDayKey(task.completedAt) !== todayKey()) return;
      if (task.money.type === "expense") out += task.money.amount;
      else income += task.money.amount;
    });

    els.statTotal.textContent = String(today.length);
    els.statWins.textContent = String(wins.length);
    els.statOut.textContent = formatMoney(out);
    els.statIn.textContent = formatMoney(income);

    const pending = today.filter(moneyPending).length;
    const open = today.filter(function (task) {
      return !isDone(task);
    }).length;

    if (!today.length) {
      els.tallyNote.textContent =
        "ยังไม่มีรายการวันนี้ — เริ่มจากรายการแรกได้เลย";
      return;
    }
    const parts = [];
    if (open) {
      parts.push(
        '<span class="remaining">เหลือ ' + open + " งาน</span>"
      );
    } else {
      parts.push('<span class="synced">ปิดยอดวันนี้แล้ว</span>');
    }
    if (pending) {
      parts.push(
        '<span class="pending">' + pending + " รายการรอลงบัญชี</span>"
      );
    }
    els.tallyNote.innerHTML = parts.join(
      '<span class="dot" aria-hidden="true"></span>'
    );
  }

  function renderFilters() {
    const buttons = els.filters.querySelectorAll(".filter");
    buttons.forEach(function (button) {
      const active = button.getAttribute("data-filter") === app.filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function renderAll() {
    renderFilters();
    renderTally();
    renderTaskList();
    renderLedgerUi();
  }

  /* ---------- Dialogs, toasts, confirm ---------- */

  function anyDialogOpen() {
    return Boolean(document.querySelector("dialog[open]"));
  }

  function openDialog(dialog) {
    if (!dialog) return;
    if (dialog._closeTimer) {
      window.clearTimeout(dialog._closeTimer);
      dialog._closeTimer = null;
    }
    dialog.classList.remove("is-closing");
    if (dialog.open) return;
    document.body.classList.add("has-dialog");
    if (typeof dialog.showModal === "function") {
      try {
        dialog.showModal();
        return;
      } catch (error) {}
    }
    dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (!dialog || !dialog.open) return;
    dialog.classList.add("is-closing");
    if (dialog._closeTimer) window.clearTimeout(dialog._closeTimer);
    dialog._closeTimer = window.setTimeout(function () {
      dialog._closeTimer = null;
      dialog.classList.remove("is-closing");
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
      if (!anyDialogOpen()) document.body.classList.remove("has-dialog");
    }, 180);
  }

  function showToast(message, options) {
    const opts = options || {};
    if (!els.toastRegion) return;
    while (els.toastRegion.children.length >= 3) {
      els.toastRegion.removeChild(els.toastRegion.firstChild);
    }
    const toast = document.createElement("div");
    toast.className = "toast" + (opts.type ? " is-" + opts.type : "");
    const dot = document.createElement("span");
    dot.className = "toast-dot";
    dot.setAttribute("aria-hidden", "true");
    const text = document.createElement("span");
    text.textContent = message;
    toast.appendChild(dot);
    toast.appendChild(text);

    let removed = false;
    function remove() {
      if (removed) return;
      removed = true;
      toast.classList.add("is-leaving");
      window.setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }

    if (opts.action && typeof opts.action.onClick === "function") {
      const action = document.createElement("button");
      action.type = "button";
      action.className = "toast-action";
      action.textContent = opts.action.label || "ทำต่อ";
      action.addEventListener("click", function () {
        remove();
        opts.action.onClick();
      });
      toast.appendChild(action);
    }

    els.toastRegion.appendChild(toast);
    const duration =
      Number.isFinite(opts.duration) && opts.duration > 0
        ? opts.duration
        : 3400;
    window.setTimeout(remove, duration);
  }

  function askConfirm(options) {
    const opts = options || {};
    return new Promise(function (resolve) {
      if (app.confirmResolve) {
        const previous = app.confirmResolve;
        app.confirmResolve = null;
        previous(false);
      }
      app.confirmResolve = resolve;
      els.confirmTitle.textContent = opts.title || "ยืนยันการทำรายการ";
      els.confirmBody.textContent = opts.body || "";
      els.confirmOk.textContent = opts.okLabel || "ยืนยัน";
      openDialog(els.confirmDialog);
    });
  }

  function settleConfirm(value) {
    if (!app.confirmResolve) {
      closeDialog(els.confirmDialog);
      return;
    }
    const resolve = app.confirmResolve;
    app.confirmResolve = null;
    closeDialog(els.confirmDialog);
    resolve(value);
  }

  /* ---------- Task form ---------- */

  function parseAmountValue() {
    const raw = String(els.taskAmount.value || "")
      .replace(/,/g, "")
      .replace(/\s/g, "");
    if (!raw) return null;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) return null;
    if (value > 99999999) return null;
    return Math.round(value * 100) / 100;
  }

  function syncMoneyTypeLabels() {
    els.moneyTypeInputs.forEach(function (input) {
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("is-selected", input.checked);
      label.classList.toggle(
        "is-expense",
        input.checked && input.value === "expense"
      );
      label.classList.toggle(
        "is-income",
        input.checked && input.value === "income"
      );
    });
  }

  function currentMoneyType() {
    let type = "none";
    els.moneyTypeInputs.forEach(function (input) {
      if (input.checked) type = input.value;
    });
    return type;
  }

  function populateCategories(type, selected) {
    const list = CATEGORIES[type] || [];
    els.taskCategory.innerHTML = "";
    list.forEach(function (category) {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      els.taskCategory.appendChild(option);
    });
    if (selected && list.indexOf(selected) !== -1) {
      els.taskCategory.value = selected;
    } else if (list.length) {
      els.taskCategory.value = list[0];
    }
  }

  function buildQuickAmounts() {
    const amounts = [20, 50, 100, 300, 500, 1000];
    els.quickAmounts.innerHTML = "";
    amounts.forEach(function (amount) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chip chip-amount";
      button.setAttribute("data-amount", String(amount));
      button.textContent = "฿" + amount;
      els.quickAmounts.appendChild(button);
    });
  }

  function syncQuickAmounts() {
    const value = parseAmountValue();
    const chips = els.quickAmounts.querySelectorAll("[data-amount]");
    chips.forEach(function (chip) {
      chip.classList.toggle(
        "is-active",
        value !== null && Number(chip.getAttribute("data-amount")) === value
      );
    });
  }

  function syncQuickDates() {
    const value = els.taskDate.value;
    document.querySelectorAll("[data-quick-date]").forEach(function (chip) {
      const kind = chip.getAttribute("data-quick-date");
      const target =
        kind === "today" ? todayKey() : kind === "tomorrow" ? tomorrowKey() : "";
      chip.classList.toggle("is-active", value === target && target !== "");
    });
  }

  function setMoneyType(type, selectedCategory) {
    els.moneyTypeInputs.forEach(function (input) {
      input.checked = input.value === type;
    });
    const hasMoney = type === "expense" || type === "income";
    els.moneyInputs.hidden = !hasMoney;
    if (hasMoney) {
      populateCategories(type, selectedCategory);
      syncQuickAmounts();
    }
    els.taskAmount.required = hasMoney;
    els.amountError.hidden = true;
    els.amountField.classList.remove("is-invalid");
    syncMoneyTypeLabels();
  }

  function renderTaskStamps(task) {
    els.taskStamps.hidden = !task;
    if (!task) return;
    els.stampCreated.textContent = formatStampFull(task.createdAt);
    els.stampUpdated.textContent = formatStampFull(task.updatedAt);
    els.stampCompletedRow.hidden = !task.completedAt;
    if (task.completedAt) {
      els.stampCompleted.textContent = formatStampFull(task.completedAt);
    } else {
      els.stampCompleted.textContent = "—";
    }

    const showLedger = Boolean(task.money && task.completedAt);
    els.stampLedgerRow.hidden = !showLedger;
    if (!showLedger) {
      els.stampLedger.textContent = "—";
      return;
    }
    if (task.moneyState === "posted") {
      els.stampLedger.textContent =
        "ลงบัญชีแล้ว " + formatStampFull(task.postedAt || task.completedAt);
    } else if (task.moneyState === "error") {
      els.stampLedger.textContent =
        "ยังไม่สำเร็จ" + (task.syncError ? " · " + task.syncError : "");
    } else if (task.moneyState === "removing") {
      els.stampLedger.textContent = "กำลังถอนรายการเงิน";
    } else {
      els.stampLedger.textContent = "รอลงบัญชี (เก็บในคิวแล้ว)";
    }
  }

  function openTaskForm(id) {
    const task = id ? getTask(id) : null;
    app.editingId = task ? task.id : null;

    els.taskForm.reset();
    els.taskTitle.value = task ? task.title : "";
    els.taskDate.value = task ? task.dueDate : todayKey();
    els.taskTime.value = task ? task.dueTime : "";
    els.taskNotes.value = task ? task.notes : "";
    els.titleError.hidden = true;
    els.titleField.classList.remove("is-invalid");
    els.amountError.hidden = true;

    const moneyType = task && task.money ? task.money.type : "none";
    setMoneyType(
      moneyType,
      task && task.money ? task.money.category : CATEGORIES.expense[0]
    );
    els.taskAmount.value =
      task && task.money ? formatAmountPlain(task.money.amount) : "";
    renderTaskStamps(task);
    syncQuickDates();
    syncQuickAmounts();

    els.taskDialogTitle.textContent = task ? "แก้ไขรายการ" : "เขียนรายการ";
    els.taskDialogSub.textContent = task
      ? "แก้เวลา เงิน หรือโน้ตของรายการนี้"
      : "ใส่เวลาและเงินไว้ได้ ถ้ามี";
    els.saveTaskBtn.textContent = task ? "บันทึกการแก้ไข" : "บันทึก";
    els.deleteTaskBtn.hidden = !task;

    openDialog(els.taskDialog);
    if (window.matchMedia && window.matchMedia("(min-width: 720px)").matches) {
      window.setTimeout(function () {
        els.taskTitle.focus();
        els.taskTitle.select();
      }, 220);
    }
  }

  function validateTaskForm() {
    let valid = true;
    const title = els.taskTitle.value.trim();
    if (!title) {
      valid = false;
      els.titleError.textContent = "ใส่ชื่อรายการก่อนบันทึก";
      els.titleError.hidden = false;
      els.titleField.classList.add("is-invalid");
    } else {
      els.titleError.hidden = true;
      els.titleField.classList.remove("is-invalid");
    }

    const type = currentMoneyType();
    let amount = null;
    if (type !== "none") {
      amount = parseAmountValue();
      if (amount === null) {
        valid = false;
        els.amountError.textContent = "ใส่จำนวนเงินมากกว่า 0";
        els.amountError.hidden = false;
        els.amountField.classList.add("is-invalid");
      } else {
        els.amountError.hidden = true;
        els.amountField.classList.remove("is-invalid");
      }
    }
    return { valid: valid, title: title, amount: amount };
  }

  function submitTaskForm(event) {
    if (event) event.preventDefault();
    const check = validateTaskForm();
    if (!check.valid) {
      if (els.titleError.hidden === false) els.taskTitle.focus();
      else els.taskAmount.focus();
      return;
    }

    const type = currentMoneyType();
    const hasMoney = type === "expense" || type === "income";
    const dueDate = els.taskDate.value || "";
    let dueTime = els.taskTime.value || "";
    if (dueTime && !dueDate) {
      els.taskDate.value = todayKey();
    }
    const notes = els.taskNotes.value.trim();
    const category = hasMoney ? els.taskCategory.value : "";
    const now = nowIso();

    if (app.editingId) {
      const task = getTask(app.editingId);
      if (!task) {
        closeDialog(els.taskDialog);
        return;
      }
      const wasDone = isDone(task);
      task.title = check.title;
      task.notes = notes;
      task.dueDate = els.taskDate.value || "";
      task.dueTime = dueTime;
      task.updatedAt = now;
      task.money = hasMoney
        ? { type: type, amount: check.amount, category: category }
        : null;

      if (wasDone && hasMoney) {
        task.moneyState = "queued";
        task.syncError = null;
        queueMoneyOp(task, "upsert");
      } else if (wasDone && !hasMoney) {
        queueMoneyOp(task, "remove");
        task.ledgerId = null;
        task.postedAt = null;
        task.moneyState = "none";
      } else if (!wasDone) {
        task.ledgerId = null;
        task.postedAt = null;
        task.moneyState = "none";
      }

      saveState();
      renderAll();
      closeDialog(els.taskDialog);
      showToast("บันทึกการแก้ไขแล้ว", { type: "success" });
      return;
    }

    const task = {
      id: uid(),
      title: check.title,
      notes: notes,
      dueDate: els.taskDate.value || "",
      dueTime: dueTime,
      money: hasMoney
        ? { type: type, amount: check.amount, category: category }
        : null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      moneyState: "none",
      ledgerId: null,
      postedAt: null,
      syncError: null,
    };

    state.tasks.unshift(task);
    saveState();
    renderAll();
    closeDialog(els.taskDialog);
    showToast("เพิ่มรายการแล้ว", { type: "success" });
  }

  async function deleteTaskFromForm() {
    const task = app.editingId ? getTask(app.editingId) : null;
    if (!task) return;
    const moneyNote =
      task.money && isDone(task)
        ? "\n\nรายการเงินที่ลงบัญชีแล้วจะถูกถอนออกจาก Money Ledger ด้วย"
        : "";
    const confirmed = await askConfirm({
      title: "ลบรายการนี้?",
      body:
        "“" +
        task.title +
        "” จะถูกลบถาวรจาก WinList รวมถึงเวลาและโน้ตของรายการ" +
        moneyNote,
      okLabel: "ลบรายการ",
    });
    if (!confirmed) return;

    const hadLedger = Boolean(task.ledgerId);
    if (isDone(task) && task.money) {
      queueMoneyOp(task, "remove");
    } else {
      state.ledgerQueue = state.ledgerQueue.filter(function (op) {
        return op.taskId !== task.id;
      });
    }
    state.tasks = state.tasks.filter(function (item) {
      return item.id !== task.id;
    });
    saveState();
    closeDialog(els.taskDialog);
    app.editingId = null;
    renderAll();
    showToast(
      "ลบรายการแล้ว" + (hadLedger ? " · ถอนรายการเงินแล้ว" : ""),
      { type: "success" }
    );
  }

  function toggleTask(id) {
    const task = getTask(id);
    if (!task) return;

    if (isDone(task)) {
      const hadLedger = Boolean(task.ledgerId);
      task.completedAt = null;
      task.updatedAt = nowIso();
      if (task.money) {
        queueMoneyOp(task, "remove");
        task.ledgerId = null;
        task.postedAt = null;
        task.moneyState = "none";
      }
      saveState();
      renderAll();
      showToast(
        "ยกเลิกการประทับแล้ว" +
          (hadLedger ? " · ถอนรายการเงินออกจากบัญชี" : ""),
        {
          action: {
            label: "ประทับอีกครั้ง",
            onClick: function () {
              toggleTask(id);
            },
          },
        }
      );
      return;
    }

    task.completedAt = nowIso();
    task.updatedAt = task.completedAt;
    if (task.money) {
      task.moneyState = "queued";
      task.syncError = null;
      queueMoneyOp(task, "upsert");
    }
    app.lastStampedId = id;
    saveState();
    renderAll();

    if (task.money) {
      const posted = task.moneyState === "posted";
      showToast(
        "WIN · " +
          formatMoney(task.money.amount) +
          (posted ? " · ลงบัญชีแล้ว" : " · เก็บในคิวแล้ว"),
        {
          type: posted ? "success" : undefined,
          action: {
            label: "เลิกทำ",
            onClick: function () {
              toggleTask(id);
            },
          },
        }
      );
    } else {
      showToast("ประทับ WIN แล้ว", {
        type: "success",
        action: {
          label: "เลิกทำ",
          onClick: function () {
            toggleTask(id);
          },
        },
      });
    }
  }

  /* ---------- Money Ledger integration ---------- */

  const bridge = {
    frame: null,
    url: "",
    ready: false,
    loadPromise: null,
    waiters: new Map(),
  };

  function resolveLedgerUrl(raw) {
    const value = String(raw || "").trim();
    if (!value) return null;
    try {
      return new URL(value, window.location.href);
    } catch (error) {
      return null;
    }
  }

  function canDirectWrite(url) {
    if (!url) return false;
    if (!/^https?:$/.test(window.location.protocol)) return false;
    return url.origin === window.location.origin;
  }

  function readLedgerTransactions() {
    try {
      const raw = localStorage.getItem(LEDGER_TX_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return null;
    }
  }

  function nextLedgerId() {
    const transactions = readLedgerTransactions() || [];
    const used = new Set(
      transactions
        .map(function (entry) {
          return Number(entry && entry.id);
        })
        .filter(function (id) {
          return Number.isFinite(id);
        })
    );
    let id = Date.now();
    while (used.has(id)) id += 1;
    return id;
  }

  function makeLedgerEntry(task) {
    if (!task || !task.money) return null;
    const stamp = task.completedAt || nowIso();
    return {
      id: task.ledgerId || nextLedgerId(),
      type: task.money.type,
      description: task.title,
      category: task.money.category || "อื่นๆ",
      amount: Math.round(task.money.amount * 100) / 100,
      date: stamp,
      month: localMonthKey(stamp),
    };
  }

  function queueMoneyOp(task, kind) {
    if (!task) return null;
    state.ledgerQueue = state.ledgerQueue.filter(function (op) {
      return op.taskId !== task.id;
    });

    let op = null;
    if (kind === "upsert" && task.money && isDone(task)) {
      const entry = makeLedgerEntry(task);
      if (entry) {
        op = {
          id: uid(),
          op: "upsert",
          taskId: task.id,
          ledgerId: task.ledgerId || null,
          todoId: task.id,
          createdAt: nowIso(),
          sentAt: null,
          entry: entry,
        };
      }
    } else if (kind === "remove" && task.ledgerId) {
      op = {
        id: uid(),
        op: "remove",
        taskId: task.id,
        ledgerId: Number(task.ledgerId),
        todoId: task.id,
        createdAt: nowIso(),
        sentAt: null,
      };
    }

    if (op) state.ledgerQueue.push(op);
    saveState();
    renderLedgerUi();
    void flushQueue({ reason: "auto" });
    return op;
  }

  function applyDirectOps(ops) {
    const current = readLedgerTransactions();
    if (current === null) {
      return {
        ok: false,
        error: "อ่านที่เก็บข้อมูลของ Money Ledger ไม่ได้",
      };
    }
    let transactions = current.slice();
    const results = [];

    ops.forEach(function (op) {
      if (op.op === "remove") {
        const id = Number(op.ledgerId);
        transactions = transactions.filter(function (entry) {
          return Number(entry.id) !== id;
        });
        results.push({ taskId: op.taskId, ok: true, ledgerId: id });
        return;
      }

      const entry = op.entry;
      if (!entry || !entry.type || !Number.isFinite(Number(entry.amount))) {
        results.push({
          taskId: op.taskId,
          ok: false,
          error: "ข้อมูลรายการเงินไม่ครบ",
        });
        return;
      }

      const index = op.ledgerId
        ? transactions.findIndex(function (item) {
            return Number(item.id) === Number(op.ledgerId);
          })
        : -1;

      if (index !== -1) {
        transactions[index] = Object.assign({}, transactions[index], entry, {
          id: transactions[index].id,
        });
        results.push({
          taskId: op.taskId,
          ok: true,
          ledgerId: Number(transactions[index].id),
        });
      } else {
        transactions.push(entry);
        results.push({
          taskId: op.taskId,
          ok: true,
          ledgerId: entry.id,
        });
      }
    });

    try {
      localStorage.setItem(LEDGER_TX_KEY, JSON.stringify(transactions));
    } catch (error) {
      return {
        ok: false,
        error: "เขียนลง Money Ledger ไม่ได้ (ที่เก็บเต็มหรือถูกบล็อก)",
      };
    }
    return { ok: true, results: results };
  }

  function applyLedgerResults(results) {
    const map = new Map();
    (results || []).forEach(function (result) {
      if (result && result.taskId) map.set(String(result.taskId), result);
    });

    const keep = [];
    state.ledgerQueue.forEach(function (op) {
      const result = map.get(String(op.taskId));
      const task = getTask(op.taskId);

      if (!result) {
        op.sentAt = nowIso();
        keep.push(op);
        if (task && isDone(task)) task.moneyState = "sent";
        return;
      }
      if (!result.ok) {
        op.sentAt = nowIso();
        keep.push(op);
        if (task) {
          task.moneyState = "error";
          task.syncError = result.error || "Money Ledger ไม่รับรายการ";
        }
        return;
      }

      if (task) {
        if (op.op === "upsert") {
          task.ledgerId = Number(result.ledgerId) || (op.entry && op.entry.id);
          task.moneyState = "posted";
          task.postedAt = nowIso();
          task.syncError = null;
        } else {
          task.syncError = null;
          if (!task.completedAt) {
            task.ledgerId = null;
            task.postedAt = null;
            task.moneyState = "none";
          }
        }
      }
    });

    state.ledgerQueue = keep;
  }

  function markOpsQueued(ops, message) {
    ops.forEach(function (op) {
      const task = getTask(op.taskId);
      if (!task) return;
      if (task.moneyState !== "error") task.moneyState = "queued";
      if (message) task.syncError = message;
    });
  }

  function markOpsError(ops, message) {
    ops.forEach(function (op) {
      const task = getTask(op.taskId);
      if (!task) return;
      task.moneyState = "error";
      task.syncError = message || "ส่งไป Money Ledger ไม่สำเร็จ";
      op.sentAt = nowIso();
    });
  }

  function bridgeOrigin(url) {
    return url && url.origin && url.origin !== "null" ? url.origin : "*";
  }

  function ensureBridge(url) {
    if (bridge.frame && bridge.url === url.href) {
      return bridge.loadPromise || Promise.resolve(true);
    }
    if (bridge.frame && bridge.frame.parentNode) {
      bridge.frame.parentNode.removeChild(bridge.frame);
    }
    bridge.url = url.href;
    bridge.ready = false;

    bridge.loadPromise = new Promise(function (resolve) {
      const frame = document.createElement("iframe");
      frame.className = "ledger-bridge";
      frame.title = "Money Ledger bridge";
      frame.tabIndex = -1;
      frame.setAttribute("aria-hidden", "true");

      let settled = false;
      const timer = window.setTimeout(function () {
        if (settled) return;
        settled = true;
        resolve(false);
      }, 20000);

      frame.addEventListener(
        "load",
        function () {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          bridge.ready = true;
          resolve(true);
        },
        { once: true }
      );

      frame.src = url.href;
      document.body.appendChild(frame);
      bridge.frame = frame;
    });

    return bridge.loadPromise;
  }

  async function bridgeSend(payload) {
    const url = resolveLedgerUrl(state.settings.ledgerUrl);
    if (!url) return null;
    const loaded = await ensureBridge(url);
    if (!loaded || !bridge.frame) return null;

    const requestId =
      "wl_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8);

    return new Promise(function (resolve) {
      const timer = window.setTimeout(function () {
        bridge.waiters.delete(requestId);
        resolve(null);
      }, 12000);

      bridge.waiters.set(requestId, { resolve: resolve, timer: timer });
      try {
        bridge.frame.contentWindow.postMessage(
          Object.assign(
            { source: "winlist", requestId: requestId },
            payload
          ),
          bridgeOrigin(url)
        );
      } catch (error) {
        window.clearTimeout(timer);
        bridge.waiters.delete(requestId);
        resolve(null);
      }
    });
  }

  function handleBridgeMessage(event) {
    const data = event.data;
    if (!data || data.source !== "winlist-ledger" || !data.requestId) return;
    if (
      bridge.frame &&
      event.source &&
      event.source !== bridge.frame.contentWindow
    ) {
      return;
    }
    const waiter = bridge.waiters.get(String(data.requestId));
    if (!waiter) return;
    window.clearTimeout(waiter.timer);
    bridge.waiters.delete(String(data.requestId));
    waiter.resolve(data);
  }

  async function flushQueue(options) {
    const opts = options || {};
    if (app.flushing) {
      app.flushAgain = true;
      return;
    }
    const ops = state.ledgerQueue.slice();
    if (!ops.length) {
      if (opts.manual) {
        showToast("ไม่มีรายการเงินค้างส่ง", { type: "success" });
      }
      renderLedgerUi();
      return;
    }

    const url = resolveLedgerUrl(state.settings.ledgerUrl);
    if (!url) {
      markOpsQueued(ops, "ยังไม่ได้ตั้งลิงก์ Money Ledger");
      saveState();
      renderAll();
      if (opts.manual) {
        showToast("ตั้งลิงก์ Money Ledger ในหน้าตั้งค่าก่อน", {
          type: "error",
          duration: 5000,
        });
      }
      return;
    }

    if (canDirectWrite(url)) {
      const outcome = applyDirectOps(ops);
      if (outcome.ok) {
        applyLedgerResults(outcome.results);
        state.settings.ledgerVerified = true;
        saveState();
        renderAll();
        if (opts.manual) {
          showToast("ลงบัญชี Money Ledger แล้ว", { type: "success" });
        }
      } else {
        markOpsError(ops, outcome.error);
        state.settings.ledgerVerified = false;
        saveState();
        renderAll();
        if (opts.manual) {
          showToast(outcome.error, { type: "error", duration: 6000 });
        }
      }
      return;
    }

    if (opts.reason === "auto" && !state.settings.ledgerVerified) {
      markOpsQueued(ops, "รอเชื่อมต่อ Money Ledger");
      saveState();
      renderAll();
      return;
    }

    app.flushing = true;
    renderLedgerUi();
    let response = null;
    try {
      response = await bridgeSend({
        type: "apply",
        ops: ops.map(function (op) {
          return {
            op: op.op,
            taskId: op.taskId,
            ledgerId: op.ledgerId,
            entry: op.entry,
          };
        }),
      });
    } catch (error) {
      response = null;
    }
    app.flushing = false;

    if (!response) {
      markOpsQueued(ops, "ยังไม่ได้รับการตอบกลับจาก Money Ledger");
      ops.forEach(function (op) {
        op.sentAt = nowIso();
      });
      state.settings.ledgerVerified = false;
      saveState();
      renderAll();
      if (opts.manual) {
        showToast(
          "Money Ledger ไม่ตอบกลับ — เพิ่มตัวรับหรือเปิดลิงก์ให้ถูกต้อง",
          { type: "error", duration: 7000 }
        );
      }
    } else {
      applyLedgerResults(response.results || []);
      state.settings.ledgerVerified = true;
      saveState();
      renderAll();
      if (opts.manual) {
        const failed = (response.results || []).filter(function (result) {
          return result && result.ok === false;
        }).length;
        showToast(
          failed ? "ส่งแล้วบางรายการ · ที่เหลือยังค้างอยู่" : "ส่งคิวแล้ว",
          { type: failed ? undefined : "success" }
        );
      }
    }

    if (app.flushAgain) {
      app.flushAgain = false;
      window.setTimeout(function () {
        flushQueue({ reason: "auto" });
      }, 30);
    }
  }

  async function testLedgerConnection() {
    const url = resolveLedgerUrl(state.settings.ledgerUrl);
    if (!url) {
      showToast("ใส่ลิงก์ Money Ledger ก่อนทดสอบ", { type: "error" });
      return;
    }

    if (canDirectWrite(url)) {
      try {
        localStorage.setItem("winlist.probe", "1");
        localStorage.removeItem("winlist.probe");
        state.settings.ledgerVerified = true;
        saveState();
        renderAll();
        showToast("เชื่อมตรงกับ Money Ledger ได้ทันที", { type: "success" });
      } catch (error) {
        state.settings.ledgerVerified = false;
        saveState();
        renderAll();
        showToast("เบราว์เซอร์บล็อกที่เก็บข้อมูลของ Money Ledger", {
          type: "error",
          duration: 6000,
        });
      }
      return;
    }

    showToast("กำลังทดสอบกับ Money Ledger…", { duration: 1400 });
    const response = await bridgeSend({ type: "ping" });
    if (response) {
      state.settings.ledgerVerified = true;
      bridge.ready = true;
      saveState();
      renderAll();
      showToast("Money Ledger ตอบกลับแล้ว", { type: "success" });
    } else {
      state.settings.ledgerVerified = false;
      saveState();
      renderAll();
      showToast(
        "ยังไม่มีการตอบกลับ — ตรวจว่าหน้านั้นมีตัวรับของ WinList",
        { type: "error", duration: 7000 }
      );
    }
  }

  function openLedger() {
    const url = resolveLedgerUrl(state.settings.ledgerUrl);
    if (!url) {
      showToast("ยังไม่ได้ตั้งลิงก์ Money Ledger", { type: "error" });
      return;
    }
    window.open(url.href, "_blank", "noopener");
  }

  function ledgerSnapshot() {
    const url = resolveLedgerUrl(state.settings.ledgerUrl);
    const direct = canDirectWrite(url);
    const verified = Boolean(state.settings.ledgerVerified);
    const pending = state.ledgerQueue.length;
    const errors = state.tasks.filter(function (task) {
      return task.moneyState === "error" || task.moneyState === "missing";
    }).length;
    return {
      url: url,
      direct: direct,
      verified: verified,
      pending: pending,
      errors: errors,
      mode: direct ? "direct" : verified ? "bridge" : "queue",
    };
  }

  function renderLedgerUi() {
    const snapshot = ledgerSnapshot();
    let dotState = "off";
    if (app.flushing) dotState = "queued";
    else if (snapshot.errors) dotState = "error";
    else if (snapshot.pending) dotState = "queued";
    else if (snapshot.direct || snapshot.verified) dotState = "posted";

    if (els.syncBtn) {
      els.syncBtn.setAttribute("data-ledger-state", dotState);
      els.syncBtn.setAttribute(
        "aria-label",
        "Money Ledger: " +
          (dotState === "posted"
            ? "เชื่อมแล้ว"
            : dotState === "error"
              ? "มีรายการที่ยังไม่สำเร็จ"
              : dotState === "queued"
                ? "มีรายการรอส่ง"
                : "ยังไม่ได้เชื่อม")
      );
    }

    if (els.ledgerSummary) {
      if (!snapshot.url) {
        els.ledgerSummary.textContent = "ยังไม่ได้เชื่อมในเครื่องนี้";
        els.ledgerDetail.textContent =
          "รายการที่ทำเสร็จจะถูกเก็บไว้ในคิว และส่งต่อเมื่อเชื่อมได้";
      } else if (snapshot.direct) {
        els.ledgerSummary.textContent = "เชื่อมตรงกับ Money Ledger";
        els.ledgerDetail.textContent = snapshot.pending
          ? snapshot.pending +
            " รายการรอลงบัญชี · ระบบจะเขียนให้ทันทีเมื่อส่ง"
          : "รายการที่ทำเสร็จจะลงบัญชีทันทีในเบราว์เซอร์นี้";
      } else if (snapshot.verified) {
        els.ledgerSummary.textContent = "เชื่อมผ่านตัวรับ Money Ledger";
        els.ledgerDetail.textContent = snapshot.pending
          ? snapshot.pending + " รายการรอส่ง"
          : "พร้อมส่งรายการใหม่ผ่านตัวรับในหน้า Money Ledger";
      } else {
        els.ledgerSummary.textContent = snapshot.pending
          ? "มี " + snapshot.pending + " รายการรอลงบัญชี"
          : "ยังไม่ได้ยืนยันการเชื่อมต่อ";
        els.ledgerDetail.textContent =
          "เปิดหน้าตั้งค่าเพื่อใส่ลิงก์ ทดสอบ หรือส่งคิวที่ค้าง";
      }
      els.ledgerAction.textContent =
        snapshot.direct || snapshot.verified ? "จัดการ" : "เชื่อมต่อ";
    }

    if (els.ledgerStatusText) {
      els.ledgerStatus.className =
        "status-line" +
        (snapshot.direct || snapshot.verified
          ? " is-posted"
          : snapshot.url
            ? ""
            : " is-off");
      if (!snapshot.url) {
        els.ledgerStatusText.textContent = "ยังไม่ได้ตั้งลิงก์ Money Ledger";
        els.ledgerStatusDetail.textContent =
          "ใส่ลิงก์ไปยังหน้า Money Ledger ด้านล่าง แล้วกดทดสอบการเชื่อมต่อ";
      } else if (snapshot.direct) {
        els.ledgerStatusText.textContent = "เชื่อมตรงได้ (โดเมนเดียวกัน)";
        els.ledgerStatusDetail.textContent =
          "WinList เขียนลง localStorage เดียวกับ Money Ledger โดยตรง ไม่ต้องเปิดอีกแท็บ";
      } else if (snapshot.verified) {
        els.ledgerStatusText.textContent = "เชื่อมผ่านตัวรับแล้ว";
        els.ledgerStatusDetail.textContent =
          "หน้านี้ตอบกลับผ่าน bridge/money-ledger-receiver.js";
      } else if (snapshot.pending) {
        els.ledgerStatusText.textContent =
          "มี " + snapshot.pending + " รายการรอส่ง";
        els.ledgerStatusDetail.textContent =
          "กด “ทดสอบการเชื่อมต่อ” แล้วจึง “ส่งคิวที่ค้าง”";
      } else {
        els.ledgerStatusText.textContent = "ยังไม่ได้ยืนยันการเชื่อมต่อ";
        els.ledgerStatusDetail.textContent =
          "ถ้าอยู่โดเมนเดียวกันจะเขียนตรงได้ ถ้าไม่ใช่ ให้เพิ่มไฟล์ตัวรับในหน้า Money Ledger";
      }
    }

    if (els.ledgerFlushBtn) {
      els.ledgerFlushBtn.textContent = snapshot.pending
        ? "ส่งคิวที่ค้าง (" + snapshot.pending + ")"
        : "ส่งคิวที่ค้าง";
      els.ledgerFlushBtn.disabled = !snapshot.pending || app.flushing;
    }
    if (
      els.ledgerUrl &&
      document.activeElement !== els.ledgerUrl &&
      els.ledgerUrl.value !== state.settings.ledgerUrl
    ) {
      els.ledgerUrl.value = state.settings.ledgerUrl;
    }
  }

  /* ---------- Settings, data, install ---------- */

  function syncSegmented(name, value) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (input) {
      input.checked = input.value === value;
      const label = input.closest("label");
      if (label) label.classList.toggle("is-selected", input.checked);
    });
  }

  function syncSettingsControls() {
    syncSegmented("themeSetting", state.settings.theme);
    syncSegmented("clockSetting", state.settings.clockFormat);
    els.secondsToggle.checked = state.settings.showSeconds;
    if (document.activeElement !== els.ledgerUrl) {
      els.ledgerUrl.value = state.settings.ledgerUrl;
    }
    els.aboutVersion.textContent = "เวอร์ชัน " + APP_VERSION;
    els.footVersion.textContent = "v" + APP_VERSION.split(".").slice(0, 2).join(".");

    const count = state.tasks.length;
    els.storageNote.textContent =
      count + " รายการ · เก็บใน localStorage ของเบราว์เซอร์นี้";

    const standalone =
      (window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone;
    els.installHelp.textContent = standalone
      ? "เปิดใช้งานแบบติดตั้งแล้ว — ข้อมูลยังอยู่ในเครื่องนี้"
      : "เปิดผ่าน Chrome หรือ Safari แล้วเลือก “เพิ่มไปที่หน้าจอโฮม”";

    renderLedgerUi();
  }

  function exportBackup() {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "winlist-backup-" + todayKey() + ".json";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1500);
    showToast("ดาวน์โหลดไฟล์สำรองแล้ว", { type: "success" });
  }

  function importBackupFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function () {
      let parsed = null;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch (error) {
        showToast("ไฟล์นี้ไม่ใช่ JSON ที่อ่านได้", { type: "error" });
        return;
      }
      const incoming = normalizeState(parsed);
      if (!Array.isArray(parsed.tasks)) {
        showToast("ไฟล์สำรองไม่ถูกต้อง: ไม่พบรายการงาน", { type: "error" });
        return;
      }
      const confirmed = await askConfirm({
        title: "นำเข้าข้อมูลสำรอง?",
        body:
          "จะแทนที่งานและคิวปัจจุบันด้วย " +
          incoming.tasks.length +
          " รายการจากไฟล์นี้ การตั้งค่า Money Ledger ในเครื่องนี้จะถูกแทนที่ด้วย",
        okLabel: "นำเข้า",
      });
      if (!confirmed) return;

      state = incoming;
      saveState();
      applyTheme();
      buildClock(formatClock(new Date()).time);
      app.filter = "today";
      syncSettingsControls();
      renderAll();
      showToast("นำเข้าข้อมูลแล้ว", { type: "success" });
    };
    reader.onerror = function () {
      showToast("อ่านไฟล์ไม่สำเร็จ", { type: "error" });
    };
    reader.readAsText(file);
  }

  async function clearCompletedTasks() {
    const completed = state.tasks.filter(isDone);
    if (!completed.length) {
      showToast("ยังไม่มีงานที่ทำเสร็จให้ล้าง", { type: "error" });
      return;
    }
    const pending = completed.filter(moneyPending).length;
    const removable = completed.filter(function (task) {
      return !moneyPending(task);
    });
    if (!removable.length) {
      showToast("งานที่เสร็จทั้งหมดยังรอลงบัญชี — ส่งคิวก่อน", {
        type: "error",
        duration: 5000,
      });
      return;
    }
    const confirmed = await askConfirm({
      title: "ล้างงานที่เสร็จ?",
      body:
        "จะลบ " +
        removable.length +
        " งานที่เสร็จแล้วออกจากรายการ" +
        (pending ? " และเก็บ " + pending + " งานที่ยังรอลงบัญชีไว้" : "") +
        "\n\nรายการเงินที่ลงบัญชีแล้วใน Money Ledger จะยังอยู่",
      okLabel: "ล้างงานที่เสร็จ",
    });
    if (!confirmed) return;

    state.tasks = state.tasks.filter(function (task) {
      return !isDone(task) || moneyPending(task);
    });
    saveState();
    renderAll();
    showToast("ล้างงานที่เสร็จแล้ว " + removable.length + " รายการ", {
      type: "success",
    });
  }

  async function clearAllData() {
    const confirmed = await askConfirm({
      title: "ล้างข้อมูลทั้งหมด?",
      body:
        "งาน " +
        state.tasks.length +
        " รายการ และคิว " +
        state.ledgerQueue.length +
        " รายการจะถูกลบจากเครื่องนี้\n\nรายการที่ลงบัญชีใน Money Ledger แล้วจะไม่ถูกลบ",
      okLabel: "ล้างทั้งหมด",
    });
    if (!confirmed) return;

    state.tasks = [];
    state.ledgerQueue = [];
    state.meta.lastOpenedAt = nowIso();
    saveState();
    app.filter = "today";
    renderAll();
    syncSettingsControls();
    showToast("ล้างข้อมูลใน WinList แล้ว", { type: "success" });
  }

  function saveLedgerUrlFromInput() {
    const value = els.ledgerUrl.value.trim();
    if (value === state.settings.ledgerUrl) return;
    state.settings.ledgerUrl = value;
    state.settings.ledgerVerified = false;
    bridge.url = "";
    saveState();
    renderAll();
  }

  function openLedgerSettings() {
    openDialog(els.settingsDialog);
    syncSettingsControls();
    window.setTimeout(function () {
      const heading = document.getElementById("ledgerHeading");
      const group = heading ? heading.closest(".settings-group") : null;
      if (group && group.scrollIntoView) {
        group.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }, 220);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (!/^https?:$/.test(window.location.protocol)) return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }

  function initInstall() {
    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      app.deferredPrompt = event;
      els.installBtn.hidden = false;
    });
    window.addEventListener("appinstalled", function () {
      app.deferredPrompt = null;
      els.installBtn.hidden = true;
      showToast("ติดตั้ง WinList แล้ว", { type: "success" });
    });
  }

  /* ---------- Events ---------- */

  function bindEvents() {
    els.addBtn.addEventListener("click", function () {
      openTaskForm(null);
    });
    els.emptyAddBtn.addEventListener("click", function () {
      if (app.filter === "done") {
        app.filter = "today";
        renderAll();
      } else {
        openTaskForm(null);
      }
    });

    els.taskForm.addEventListener("submit", submitTaskForm);
    els.deleteTaskBtn.addEventListener("click", deleteTaskFromForm);

    els.taskTitle.addEventListener("input", function () {
      if (els.titleError.hidden) return;
      els.titleError.hidden = true;
      els.titleField.classList.remove("is-invalid");
    });
    els.taskAmount.addEventListener("input", function () {
      els.amountError.hidden = true;
      els.amountField.classList.remove("is-invalid");
      syncQuickAmounts();
    });

    els.moneyTypeInputs.forEach(function (input) {
      input.addEventListener("change", function () {
        if (!input.checked) return;
        setMoneyType(input.value, els.taskCategory.value);
      });
    });

    document.querySelectorAll("[data-quick-date]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        const kind = chip.getAttribute("data-quick-date");
        els.taskDate.value =
          kind === "today" ? todayKey() : kind === "tomorrow" ? tomorrowKey() : "";
        syncQuickDates();
      });
    });
    els.taskDate.addEventListener("change", syncQuickDates);

    els.quickAmounts.addEventListener("click", function (event) {
      const chip = event.target.closest("[data-amount]");
      if (!chip) return;
      els.taskAmount.value = chip.getAttribute("data-amount");
      els.amountError.hidden = true;
      els.amountField.classList.remove("is-invalid");
      syncQuickAmounts();
      els.taskAmount.focus();
    });

    els.filters.addEventListener("click", function (event) {
      const button = event.target.closest(".filter");
      if (!button) return;
      app.filter = button.getAttribute("data-filter") || "today";
      renderAll();
    });

    els.taskList.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const id = button.getAttribute("data-id");
      const action = button.getAttribute("data-action");
      if (action === "stamp") toggleTask(id);
      else if (action === "edit") openTaskForm(id);
    });

    els.themeBtn.addEventListener("click", cycleTheme);
    els.settingsBtn.addEventListener("click", function () {
      openDialog(els.settingsDialog);
      syncSettingsControls();
    });
    els.syncBtn.addEventListener("click", openLedgerSettings);
    els.ledgerAction.addEventListener("click", openLedgerSettings);

    document.querySelectorAll('input[name="themeSetting"]').forEach(function (input) {
      input.addEventListener("change", function () {
        if (!input.checked) return;
        state.settings.theme = input.value;
        saveState();
        applyTheme();
        syncSettingsControls();
      });
    });

    document.querySelectorAll('input[name="clockSetting"]').forEach(function (input) {
      input.addEventListener("change", function () {
        if (!input.checked) return;
        state.settings.clockFormat = input.value === "12" ? "12" : "24";
        saveState();
        buildClock(formatClock(new Date()).time);
        tickClock(true);
        syncSettingsControls();
      });
    });

    els.secondsToggle.addEventListener("change", function () {
      state.settings.showSeconds = els.secondsToggle.checked;
      saveState();
      buildClock(formatClock(new Date()).time);
      tickClock(true);
      syncSettingsControls();
    });

    els.ledgerUrl.addEventListener("change", saveLedgerUrlFromInput);
    els.ledgerUrl.addEventListener("blur", saveLedgerUrlFromInput);
    els.ledgerTestBtn.addEventListener("click", function () {
      saveLedgerUrlFromInput();
      void testLedgerConnection();
    });
    els.ledgerFlushBtn.addEventListener("click", function () {
      saveLedgerUrlFromInput();
      void flushQueue({ reason: "manual", manual: true });
    });
    els.ledgerOpenBtn.addEventListener("click", function () {
      saveLedgerUrlFromInput();
      openLedger();
    });

    els.exportBtn.addEventListener("click", exportBackup);
    els.importBtn.addEventListener("click", function () {
      els.importFile.click();
    });
    els.importFile.addEventListener("change", function () {
      const file = els.importFile.files && els.importFile.files[0];
      importBackupFile(file);
      els.importFile.value = "";
    });
    els.clearDoneBtn.addEventListener("click", clearCompletedTasks);
    els.clearAllBtn.addEventListener("click", clearAllData);

    els.installBtn.addEventListener("click", async function () {
      if (!app.deferredPrompt) return;
      app.deferredPrompt.prompt();
      try {
        await app.deferredPrompt.userChoice;
      } catch (error) {}
      app.deferredPrompt = null;
      els.installBtn.hidden = true;
    });

    els.confirmOk.addEventListener("click", function () {
      settleConfirm(true);
    });
    els.confirmCancel.addEventListener("click", function () {
      settleConfirm(false);
    });
    els.confirmDialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      settleConfirm(false);
    });
    els.confirmDialog.addEventListener("click", function (event) {
      if (event.target === els.confirmDialog) settleConfirm(false);
    });

    [els.taskDialog, els.settingsDialog].forEach(function (dialog) {
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) closeDialog(dialog);
      });
      dialog.addEventListener("cancel", function (event) {
        event.preventDefault();
        closeDialog(dialog);
      });
      dialog.addEventListener("close", function () {
        if (!anyDialogOpen()) document.body.classList.remove("has-dialog");
        if (dialog === els.taskDialog) app.editingId = null;
      });
    });

    document.querySelectorAll("[data-close-dialog]").forEach(function (button) {
      button.addEventListener("click", function () {
        const dialog = button.closest("dialog");
        if (dialog) closeDialog(dialog);
      });
    });

    window.addEventListener("message", handleBridgeMessage);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) return;
      tickClock(true);
      const snapshot = ledgerSnapshot();
      if (
        state.ledgerQueue.length &&
        (snapshot.direct || state.settings.ledgerVerified)
      ) {
        void flushQueue({ reason: "auto" });
      }
    });

    window.addEventListener("online", function () {
      const snapshot = ledgerSnapshot();
      if (snapshot.direct || state.settings.ledgerVerified) {
        void flushQueue({ reason: "auto" });
      }
    });

    window.addEventListener(
      "scroll",
      function () {
        if (els.topbar) {
          els.topbar.classList.toggle("is-raised", window.scrollY > 6);
        }
      },
      { passive: true }
    );

    if (window.matchMedia) {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = function () {
        if (state.settings.theme === "system") applyTheme();
      };
      if (media.addEventListener) media.addEventListener("change", onChange);
      else if (media.addListener) media.addListener(onChange);
    }
  }

  /* ---------- Init ---------- */

  function init() {
    state = loadState();
    cacheElements();
    app.lastDayKey = todayKey();

    applyTheme();
    buildQuickAmounts();
    syncSettingsControls();
    renderDateBand(new Date());
    renderAll();
    bindEvents();
    startClock();
    initInstall();
    registerServiceWorker();

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "1") {
        window.setTimeout(function () {
          openTaskForm(null);
        }, 320);
      }
    } catch (error) {}

    if (app.loadError) {
      showToast(app.loadError, { type: "error", duration: 7000 });
    }

    const snapshot = ledgerSnapshot();
    if (state.ledgerQueue.length && (snapshot.direct || snapshot.verified)) {
      void flushQueue({ reason: "auto" });
    }
  }

  init();
})();
