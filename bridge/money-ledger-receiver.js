/* WinList → Money Ledger receiver
 *
 * Add one line before </body> of the Money Ledger page:
 *   <script src="bridge/money-ledger-receiver.js"></script>
 *
 * Optional origin lock (recommended when served over HTTP):
 *   <script src="bridge/money-ledger-receiver.js"
 *           data-allow-origin="http://localhost:8080"></script>
 *
 * The receiver listens for WinList's postMessage requests, writes into the
 * existing `transactions` localStorage key, and answers with an ack. It never
 * changes `currentBalance`: Money Ledger treats that value as the opening
 * balance and computes the rest from transactions.
 */
(function () {
  "use strict";

  if (window.__winListLedgerReceiver) return;
  window.__winListLedgerReceiver = true;

  const SCRIPT = document.currentScript;
  const ALLOWED_ORIGIN = SCRIPT
    ? (SCRIPT.getAttribute("data-allow-origin") || "").trim()
    : "";

  function reply(source, origin, payload) {
    if (!source || typeof source.postMessage !== "function") return;
    const target = !origin || origin === "null" ? "*" : origin;
    source.postMessage(
      Object.assign({ source: "winlist-ledger", type: "ack" }, payload),
      target
    );
  }

  function readTransactions() {
    try {
      const raw = localStorage.getItem("transactions");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function toAmount(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return Math.round(amount * 100) / 100;
  }

  function normalizeEntry(raw, existingIds) {
    if (!raw || typeof raw !== "object") return null;
    const type =
      raw.type === "income"
        ? "income"
        : raw.type === "expense"
          ? "expense"
          : null;
    const amount = toAmount(raw.amount);
    if (!type || amount === null) return null;

    const description = String(raw.description || "WinList")
      .trim()
      .slice(0, 200);
    const category = String(raw.category || "อื่นๆ")
      .trim()
      .slice(0, 80);

    let date = new Date(raw.date);
    if (!Number.isFinite(date.getTime())) date = new Date();
    const iso = date.toISOString();
    const month = /^\d{4}-\d{2}$/.test(String(raw.month || ""))
      ? String(raw.month)
      : iso.slice(0, 7);

    let id = Number(raw.id);
    if (!Number.isFinite(id) || id <= 0) {
      id = Date.now();
      while (existingIds.has(id)) id += 1;
    }
    existingIds.add(id);

    return {
      id: id,
      type: type,
      description: description || "WinList",
      category: category || "อื่นๆ",
      amount: amount,
      date: iso,
      month: month,
    };
  }

  function applyOps(ops) {
    if (!Array.isArray(ops)) {
      return { ok: false, error: "ops ไม่ใช่ array", results: [] };
    }

    const current = readTransactions();
    let transactions = current.slice();
    const results = [];

    ops.forEach(function (op) {
      if (!op || typeof op !== "object") return;
      const taskId = op.taskId ? String(op.taskId) : "";

      if (op.op === "remove") {
        const ledgerId = Number(op.ledgerId);
        const before = transactions.length;
        if (Number.isFinite(ledgerId) && ledgerId > 0) {
          transactions = transactions.filter(function (entry) {
            return Number(entry.id) !== ledgerId;
          });
        }
        results.push({
          taskId: taskId,
          ok: true,
          ledgerId: ledgerId || null,
          removed: transactions.length !== before,
        });
        return;
      }

      if (op.op !== "upsert") {
        results.push({ taskId: taskId, ok: false, error: "คำสั่งไม่รู้จัก" });
        return;
      }

      const requestedId = Number(op.ledgerId);
      let index = -1;
      if (Number.isFinite(requestedId) && requestedId > 0) {
        index = transactions.findIndex(function (entry) {
          return Number(entry.id) === requestedId;
        });
      }

      const used = new Set(
        transactions
          .map(function (entry) {
            return Number(entry.id);
          })
          .filter(function (id) {
            return Number.isFinite(id);
          })
      );

      const entry = normalizeEntry(op.entry, used);
      if (!entry) {
        results.push({
          taskId: taskId,
          ok: false,
          error: "ข้อมูลรายการเงินไม่ครบ",
        });
        return;
      }

      if (index !== -1) {
        entry.id = Number(transactions[index].id) || entry.id;
        transactions[index] = entry;
      } else {
        // A retried request carries the same entry.id. Reuse it instead of
        // duplicating the transaction if the first ack was lost.
        const sameId = transactions.findIndex(function (item) {
          return Number(item.id) === Number(entry.id);
        });
        if (sameId !== -1) {
          entry.id = Number(transactions[sameId].id);
          transactions[sameId] = entry;
        } else {
          transactions.push(entry);
        }
      }

      results.push({ taskId: taskId, ok: true, ledgerId: entry.id });
    });

    try {
      localStorage.setItem("transactions", JSON.stringify(transactions));
    } catch (error) {
      return {
        ok: false,
        error: "เขียนที่เก็บข้อมูลของ Money Ledger ไม่ได้",
        results: results.map(function (result) {
          return Object.assign({}, result, {
            ok: false,
            error: "เขียนที่เก็บข้อมูลไม่ได้",
          });
        }),
      };
    }

    try {
      window.dispatchEvent(
        new CustomEvent("winlist:ledger-updated", {
          detail: { count: transactions.length },
        })
      );
    } catch (error) {}

    // The Money Ledger app is a classic script, so its functions are global.
    // Refresh its screen when those functions exist; failures are harmless.
    try {
      if (typeof window.loadTransactions === "function") {
        window.loadTransactions();
      }
      if (typeof window.updateSummary === "function") {
        window.updateSummary();
      }
    } catch (error) {}

    return { ok: true, results: results };
  }

  function handleMessage(event) {
    const data = event.data;
    if (!data || data.source !== "winlist") return;
    if (!data.requestId) return;
    if (ALLOWED_ORIGIN) {
      const origin = event.origin || "";
      if (origin !== ALLOWED_ORIGIN && origin !== "null") return;
    }

    if (data.type === "ping") {
      reply(event.source, event.origin, {
        requestId: data.requestId,
        ok: true,
        pong: true,
        version: 1,
      });
      return;
    }

    if (data.type === "apply") {
      const outcome = applyOps(data.ops);
      reply(event.source, event.origin, {
        requestId: data.requestId,
        ok: outcome.ok,
        error: outcome.error || null,
        results: outcome.results || [],
      });
      return;
    }

    reply(event.source, event.origin, {
      requestId: data.requestId,
      ok: false,
      error: "คำสั่งไม่รู้จัก",
      results: [],
    });
  }

  window.addEventListener("message", handleMessage);

  window.WinListLedger = {
    apply: applyOps,
    ping: function () {
      return { ok: true, pong: true, count: readTransactions().length };
    },
  };

  if (!ALLOWED_ORIGIN) {
    console.warn(
      "[WinList] receiver is open to any origin. Add data-allow-origin to the script tag when hosting."
    );
  }
})();
