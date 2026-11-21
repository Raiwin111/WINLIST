# explained.md — Supabase Migration Plan for WinList

**seed:** `b19749c8e9d9f7e0`

> *This document records the complete migration plan from localStorage-based storage to Supabase PostgreSQL. It serves as the single source of truth for all technical decisions during the transition.*

---

## 1. Motivation

| Issue | localStorage | Supabase |
|---|---|---|
| Data persistence | Lost if browser clears cache / different device | Persistent cloud storage |
| Cross-device sync | Manual export/import required | Automatic sync via PostgreSQL |
| Data size limit | ~5-10 MB per origin | Virtually unlimited (PostgreSQL) |
| Real-time updates | Not supported | Built-in via Realtime subscriptions |
| Backup/restore | User-initiated JSON files | Automated PostgreSQL backups + user export |
| Authentication | None (all data shared on device) | Optional Supabase Auth (email, social, etc.) |

**Decision:** Supabase provides the best balance of:
- Zero server maintenance (fully managed)
- PostgreSQL SQL we already understand
- Real-time features for free on the free tier
- Easy migration path from existing localStorage code

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                           │
│                                                             │
│  ┌─────────────────┐   HTTPS         ┌────────────────────┐ │
│  │  WinList PWA    │ ────────────→ │  Supabase Project  │ │
│  │  (app.js + HTML)│               │  • PostgreSQL DB   │ │
│  │                 │               │  • Realtime API    │ │
│  │                 │               │  • Storage API     │ │
│  └─────────────────┘               └────────────────────┘ │
│          ▲                               │                  │
│          │   HTTPS                       │  Rest API        │
│  ┌─────────────────┐   HTTPS         ┌────────────────────┐ │
│  │ Money Ledger    │ ────────────→ │  Supabase Project  │ │
│  │  (optional)     │               │  (same DB or      │ │
│  │                 │               │   separate schema)│ │
│  └─────────────────┘               └────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Key flows:**
1. **Add/edit task** → Supabase `winlist_tasks` table
2. **Complete task → post money** → Update `winlist_tasks` + Insert to `winlist_ledger_queue` → Real-time triggers push to Money Ledger (or direct SQL if same-origin)
3. **Sync queue** → `winlist_ledger_queue` table + manual flush button
4. **Backup/export** → Supabase SQL dump OR REST API export

---

## 3. Supabase Project Setup

### 3.1 Create Project
1. Register at <https://supabase.io>
2. Click **"New project"**
3. Name: `winlist` (or any name)
4. Select region closest to your users (e.g., `ap-southeast-1` for Thailand)
5. Wait for provisioning (≈ 2-5 minutes)

### 3.2 Get API Keys
After project is ready:
1. Go to **Settings → API**
2. Copy these values:
   - **Project URL:** `https://<uuid>.supabase.com`
   - **anon public:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (shortened as `ANON_KEY`)
   - **service_role key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6ikpXVCJ9...` (for server ops, keep secret!)

### 3.3 Create Database Tables
In the Supabase SQL Editor, run:

```sql
-- Enable UUID extension if not already enabled
create extension if not exists "uuid-osc";

-- Table: public.winlist_tasks
create table if not exists public.winlist_tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  notes text,
  due_date text,
  due_time text,
  money_type text check (money_type in ('expense', 'income', 'none')),
  money_amount numeric(12,2) default 0,
  money_category text default 'อื่นๆ',
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  money_state text default 'none' check (money_state in ('none', 'queued', 'sent', 'posted', 'error', 'missing')),
  ledger_id integer,
  posted_at timestamp with time zone,
  sync_error text
);

-- Table: public.winlist_ledger_queue
create table if not exists public.winlist_ledger_queue (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.winlist_tasks(id) on delete cascade,
  op text check (op in ('upsert', 'remove')),
  ledger_id integer,
  entry jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  sent_at timestamp with time zone
);

-- Row Level Security: Allow authenticated actions from the app's origin
-- (For now, keep RLS off for simplicity during migration)
alter table public.winlist_tasks enable row level security;
alter table public.winlist_ledger_queue enable row level security;

-- Create policy for public access (development only, tighten later)
create policy "Allow public insert/select" on public.winlist_tasks
  for all using (true) with check (true);

create policy "Allow public queue insert/select" on public.winlist_ledger_queue
  for all using (true) with check (true);
```

### 3.4 (Optional) Set up Real-time
1. Go to **Project → Realtime**
2. Ensure tables `winlist_tasks` and `winlist_ledger_queue` are ticked on
3. The app can now listen for `INSERT`/`UPDATE`/`DELETE` events

---

## 4. Code Modifications in `assets/app.js`

### 4.1 Add Supabase Client Initialization
At the top of the IIFE (after line 1, before `const STORAGE_KEY`), add:

```javascript
// Supabase configuration (will be overridden by HTML meta tags or localStorage)
let supabaseConfig = {
  url: null,
  anonKey: null
};

// Initialize Supabase client (called from init())
function initSupabase() {
  // Try to get from meta tags first
  const urlMeta = document.getElementById('supabase-url');
  const keyMeta = document.getElementById('supabase-anon-key');
  
  if (urlMeta && keyMeta) {
    supabaseConfig = {
      url: urlMeta.content,
      anonKey: keyMeta.content
    };
  } else {
    // Fallback to localStorage (for gradual migration)
    supabaseConfig = {
      url: localStorage.getItem('supabase_url'),
      anonKey: localStorage.getItem('supabase_anon_key')
    };
  }
  
  // Initialize client globally
  if (supabaseConfig.url && supabaseConfig.anonKey) {
    app.supabase = supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
    
    // Optionally save to localStorage for future sessions
    localStorage.setItem('supabase_url', supabaseConfig.url);
    localStorage.setItem('supabase_anon_key', supabaseConfig.anonKey);
  }
}
```

### 4.2 Replace `loadState()` with Supabase Read
**Old (lines 355-377):**
```javascript
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
```

**New:** Replace the entire `loadState()` function with:

```javascript
async function loadState() {
  // Try to load from Supabase first
  if (app.supabase) {
    const { data, error } = await app.supabase
      .from('winlist_tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    if (data && data.length > 0) {
      // Normalize multiple tasks from Supabase
      const tasks = data.map(normalizeTask);
      state.tasks = tasks;
      state.meta = data.length > 0 ? 
        { createdAt: data[0].created_at, lastOpenedAt: new Date().toISOString() } 
        : defaultState().meta;
      saveState(); // Also save locally for offline fallback
      return state;
    }
  }
  
  // Fallback to localStorage
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
```

### 4.3 Replace `saveState()` with Supabase Write
**Old (lines 379-392):**
```javascript
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
```

**New:** Replace with:

```javascript
async function saveState() {
  try {
    state.meta = state.meta || {};
    state.meta.lastOpenedAt = new Date().toISOString();
    
    if (app.supabase) {
      // Upsert tasks to Supabase
      const { error } = await app.supabase
        .from('winlist_tasks')
        .upsert(state.tasks, { returning: 'minimal' });
      
      if (error) throw error;
      
      // Also maintain localStorage copy for offline fallback
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (localError) {
        // Ignored - Supabase is the source of truth
      }
    } else {
      // Pure localStorage mode (no Supabase)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    
    return true;
  } catch (error) {
    showToast("บันทึกข้อมูลไม่สำเร็จ: " + (error.message || error), {
      type: "error",
      duration: 6000,
    });
    return false;
  }
}
```

### 4.4 Update Money Ledger Integration

Replace `applyDirectOps()` (lines 1789-1854) with Supabase-based operations:

```javascript
async function applyDirectOps(ops) {
  // If we have Supabase, write directly to DB
  if (app.supabase) {
    const currentTasks = await app.supabase
      .from('winlist_tasks')
      .select('id, money_state, ledger_id, posted_at, sync_error');
    
    if (!currentTasks || !currentTasks.data) return { ok: false, error: "อ่านฐานข้อมูลไม่ได้" };
    
    const tasksMap = new Map();
    currentTasks.data.forEach(t => tasksMap.set(t.id, t));
    
    const results = [];
    ops.forEach(function (op) {
      if (op.op === "remove") {
        const task = tasksMap.get(op.taskId);
        if (task) {
          // Update task: clear ledger references
          app.supabase
            .from('winlist_tasks')
            .update({
              money_state: 'none',
              ledger_id: null,
              posted_at: null,
              sync_error: null
            })
            .eq('id', op.taskId);
          results.push({ taskId: op.taskId, ok: true, ledgerId: op.ledgerId });
        } else {
          results.push({ taskId: op.taskId, ok: false, error: "ไม่พบรายการ" });
        }
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
      
      const task = tasksMap.get(op.taskId);
      if (!task) {
        results.push({ taskId: op.taskId, ok: false, error: "ไม่พบรายการงาน" });
        return;
      }
      
      // Update task with new ledger entry
      const updateData = {
        money_type: entry.type,
        money_amount: entry.amount,
        money_category: entry.category || 'อื่นๆ',
        money_state: 'posted',
        ledger_id: entry.id,
        posted_at: nowIso(),
        sync_error: null
      };
      
      app.supabase
        .from('winlist_tasks')
        .update(updateData)
        .eq('id', op.taskId);
      
      results.push({
        taskId: op.taskId,
        ok: true,
        ledgerId: entry.id
      });
    });
    
    return { ok: true, results: results };
  }
  
  // Fallback to original localStorage logic
  const current = readLedgerTransactions();
  if (current === null) {
    return {
      ok: false,
      error: "อ่านที่เก็บข้อมูลของ Money Ledger ไม่ได้",
    };
  }
  // ... (rest of original localStorage logic) ...
}
```

### 4.5 Update `queueMoneyOp()` to use Supabase
Modify the function to insert into `winlist_ledger_queue` table when Supabase is available, while keeping the localStorage queue as fallback.

### 4.6 Update `flushQueue()` to use Supabase Real-time or Direct SQL
The flush mechanism can now:
1. Directly UPDATE `winlist_tasks` money_state columns
2. INSERT into `winlist_ledger_queue` for audit trail
3. Optionally use Supabase Realtime to notify other tabs/windows

### 4.7 Update Bridge Logic (Optional)
If both WinList and Money Ledger use the same Supabase project:
- May reduce need for postMessage bridge
- Can use Supabase Postgres HTTP API or real-time instead
- Keep bridge as fallback for cross-origin scenarios without Supabase

---

## 5. Backup & Restore Strategy (Updated)

### 5.1 User-Initiated Export (Keep Existing)
The existing `exportBackup()` function can be enhanced to export from Supabase:

```javascript
async function exportBackup() {
  if (!app.supabase) {
    // Original localStorage export
    const payload = JSON.stringify(state, null, 2);
    // ... (existing code)
    return;
  }
  
  // Export from Supabase via REST API
  const { data, error } = await app.supabase
    .from('winlist_tasks')
    .select('*');
    
  if (error) throw error;
  
  const payload = JSON.stringify({ tasks: data }, null, 2);
  // ... (rest of existing export code, but with Supabase data)
}
```

### 5.2 User-Initiated Import (Keep Existing)
Keep `importBackupFile()` as-is but add Supabase import option:

```javascript
async function importBackupFile(file, options = {}) {
  // ... (existing FileReader code to parse JSON)
  
  // After parsing, ask user where to import to:
  const confirmed = await askConfirm({
    title: "นำเข้าข้อมูลสำรอง?",
    body: `จะนำเข้าข้อมูล ${incoming.tasks.length} รายการ`,
    okLabel: options.toSupabase ? "นำเข้าไป Supabase" : "นำเข้า",
  });
  
  if (options.toSupabase && confirmed) {
    // Upload to Supabase
    const { error } = await app.supabase
      .from('winlist_tasks')
      .upsert(incoming.tasks, { returning: 'minimal' });
    
    if (error) throw error;
    showToast("นำเข้าเข้าสู่ Supabase แล้ว", { type: "success" });
  } else if (confirmed) {
    // Original localStorage import
    // ... (existing code)
  }
}
```

### 5.3 Automated Backups (Supabase-side)
1. Go to **Project → Backups** in Supabase Dashboard
2. Enable **Daily/Weekly automatic backups**
3. Backups stored in encrypted format in chosen cloud (AWS S3, Google Cloud Storage)
4. Can be restored anytime from the dashboard

### 5.3 Migration from Existing localStorage Data
For users upgrading from the old version:
1. On first launch with Supabase config, check if `localStorage.getItem('winlist.v1')` exists
2. If yes, offer to migrate:
   ```javascript
   const oldData = JSON.parse(localStorage.getItem('winlist.v1') || '{}');
   if (oldData.tasks && oldData.tasks.length > 0) {
     const migrate = await askConfirm({
       title: "ย้ายข้อมูลจากเครื่องเดิม?",
       body: `พบ ${oldData.tasks.length} รายการในเครื่องเก่า`,
       okLabel: "ย้ายไป Supabase",
     });
     if (migrate) {
       // Upload old tasks to Supabase
       const { error } = await app.supabase
         .from('winlist_tasks')
         .upsert(oldData.tasks, { returning: 'minimal' });
       if (!error) showToast("ย้ายข้อมูลสำเร็จ", { type: "success" });
     }
   }
   ```
3. After migration, old `localStorage` data can be cleared or kept as fallback

---

## 6. Deployment checklist

### 6.1 Before Deploy
- [ ] Create Supabase project and tables
- [ ] Add meta tags to `index.html`/`WinList.html`:
  ```html
  <meta id="supabase-url" content="https://your-project.supabase.com">
  <meta id="supabase-anon-key" content="your-anon-key">
  ```
- [ ] Test locally: `python -m http.server 8123`
- [ ] Verify tasks add/edit/delete works with Supabase
- [ ] Verify Money Ledger integration works
- [ ] Test backup export/import

### 6.2 After Deploy (Vercel/Netlify)
- [ ] Check browser console for Supabase errors
- [ ] Test in incognito/private mode
- [ ] Verify real-time subscriptions work (if enabled)
- [ ] Confirm backup functionality
- [ ] Check mobile responsiveness (320px+)

### 6.3 Rollback Plan
If something goes wrong:
1. Remove meta tags from HTML
2. Supabase calls will fall back to localStorage (if code has fallback)
3. Old `localStorage` data remains intact
4. Re-deploy previous version if needed

---

## 7. Timeline Estimate

| ขั้นตอน | เวลาประมาณ |
|---|---|
| สร้าง Supabase project + ตาราง | 15-30 นาที |
| เพิ่ม meta tags และเริ่มต้น client | 30-60 นาที |
| ย้าย `loadState()` / `saveState()` | 60-90 นาที |
| ย้าย Money Ledger integration | 60-90 นาที |
| อัพเดท Queue/Flush กลไก | 30-60 นาที |
| ทดสอบและ Debug | 30-60 นาที |
| อัปเดต README และเอกสาร | 30-45 นาที |
| **รวมทั้งหมด** | **≈ 4-5 ชั่วโมง** |

**หมายเหตุ:** เวลาอาจแตกต่างไปขึ้นกับความคุ้นเคยกับ Supabase API และขนาดข้อมูลที่มีอยู่แล้ว

---

## 8. Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Supabase API rate limits (free tier) | Low | Medium | Set appropriate caching; upgrade plan if needed |
| Network offline → data loss | Medium | High | Keep localStorage fallback; queue operations for sync later |
| Data migration errors | Medium | High | Test migration on dummy data first; keep old localStorage backup |
| RLS policies lock us out | Low | High | Start with RLS off, add restrictive policies gradually |
| Supabase service downtime | Very Low | Medium | Have localStorage fallback; Supabase SLA 99.9%+ |

---

## 9. Final Notes

1. **Backward compatibility:** Code includes fallback to localStorage if Supabase keys are missing or fail
2. **Gradual migration:** Users can start without Supabase keys; features work in localStorage mode
3. **Optional Auth:** Supabase Auth can be added later without breaking existing code
4. **Cost control:** Free tier covers ~500MB storage + 10K rows—sufficient for personal use
5. **Keep it simple:** Don't over-engineer; start with basic CRUD, add Real-time later if needed

---
*End of explained.md*
*seed: b19749c8e9d9f7e0*