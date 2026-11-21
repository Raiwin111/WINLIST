# WinList — แอปจดรายวันและบันทึกบัญชี (Thai PWA)

## ภาพรวม
**WinList** คือแอปพลิเคーションจัดรายการงาน (Todo) แบบมือถือ-first สำหรับคนไทย ทำให้บันทึกงานที่ต้องทำ พร้อมค่าเงินที่เกี่ยวข้อง แล้วเมื่อทำเสร็จจะโพสต์เงินเข้าบัญชี Money Ledger อัตโนมัติ มีหน้าตาแบบ "กระดาษคอลัมน์ทำงาน" แบ่งสีเขียว-ดำ เงินเบอร์ม่วงสำหรับค่าใช้จ่าย/สเตamp WIN, เขียวเข้มสำหรับรายรับ, แอמברสำหรับสถานะรอตรวจสอบ

ทำงานได้ทั้งออนไลน์ (เชื่อมต่อกับ Money Ledger เดิม หรือใช้ Supabase Cloud) และออฟไลน์ (ใช้ localStorage เป็นสำรอง) ติดตั้งเป็น PWA บนโทรศัพท์ได้ครับ

---

## 🛠 ใช้ฐานข้อมูล Supabase (ตัวเลือกใหม่)

### ทำไมต้องใช้ Supabase
Supabase เป็น open-source Firebase alternative ที่ใช้ PostgreSQL เป็นฐานข้อมูลหลัก มีข้อได้เปรียบดังนี้:

| ประการ | localStorage (เก่า) | Supabase (ใหม่) |
|---|---|---|
| **เก็บที่** | บนเครื่อง/เบราว์เซอร์ | บนคลาวด์ PostgreSQL |
| **ความจุ** | 5-10 MB | ขนาดมหาศาล (ขึ้นกับแผน) |
| **การซิงค์** | เฉพาะเครื่องเดียว | 全device (ทุกอุปกรณ์ที่ล็อกอิน) |
| **Real-time updates** | ไม่มี | มี (Realtime subscriptions) |
| **การยืนยันตัวตน** | ไม่มี | ตัวเลือก (อีเมล, Google, Apple etc.) |
| **ราคา** | ฟรี (0 บาท) | ฟรีจนถึงระดับหนึ่ง แล้วมีค่าใช้จ่าย |
| **ออฟไลน์** | ทำงานได้ทันที | ใช้ localStorage สำรองได้ |

### ขั้นตอนตั้งค่า Supabase
1. ลงทะเบียนที่ [supabase.io](https://supabase.io) (ฟรี)
2. สร้างโปรเจกต์ใหม่ (เช่น `winlist`)
3. จดบันทึกค่าดังนี้เก็บไว้:
   - **Project URL:** `https://<uuid>.supabase.com`
   - **anon public key:** ค่า `eyJ...` (ใช้กับฝั่ง client)
   - **service_role key:** ค่า `eyJ...` (ใช้กับ server-side เก็บเป็นความลับ)

### เพิ่มลงใน WinList
เปิดไฟล์ `index.html` หรือ `WinList.html` หา `<head>` แล้วเพิ่ม code ตรงนี้:

```html
<!-- Supabase Client -->
<script defer src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- ค่าคราแกร่ง Supabase (ดึงจาก Project Settings → API) -->
<meta id="supabase-url" content="https://your-project.supabase.com">
<meta id="supabase-anon-key" content="your-anon-public-key-here">
```

ใน `app.js` ตอนเริ่มต้น (ในฟังก์ชัน `init()`) จะมีการอ่าน meta tag เหล่านี้และสร้าง `app.supabase` ขึ้นมาใช้งานอัตโนมัติ

### ฟีเจอร์ที่ใช้ได้หลังจากต่อ Supabase
- **เก็บรายการงาน** บนคลาวด์ ดูได้ทุกอุปกรณ์
- **ซิงค์ข้อมูล** อัตโนมัติเมื่อล็อกอินบนอุปกรณ์ใหม่
- **Real-time updates** เมื่อมีการทำรายการเสร็จ (ตัวเลือก)
- **สำรองข้อมูล** อัตโนมัติจาก Supabase Dashboard
- **ลงชื่อเข้าใช้** (ตัวเลือก) เพื่อเก็บข้อมูลภายใต้บัญชีผู้ใช้

---

## การเชื่อมต่อกับ Money Ledger (เฉพาะเว็บเซิร์ฟเวอร์/สภาพแวดล้อม same-origin)

WinList ถูกออกแบบมาให้ทำงานคู่กับแอป **Money Ledger** ที่มีอยู่แล้ว โดยใช้ localStorage เหมือนกันหรือ Supabase เหมือนกัน

### โหมด Same-origin (แนะนำ)
- ทั้ง WinList และ Money Ledger ต้องอยู่บนโดเมน/โฟลเดอร์เดียวกัน (same-origin)
- เมื่อทำรายการเสร็จ WinList จะเขียนตรงลงไปในฐานข้อมูล (localStorage หรือ Supabase) ของ Money Ledger เอง
- ไม่ต้องใช้ iframe Bridge เลยครับ

### โหมด Cross-origin (Bridge)
- หากทั้งสองแอปไม่อยู่บนโดเมนเดียกัน จะมีการใช้ **Receiver Bridge** ทำงาน
- ไฟล์ประกอบ: `bridge/money-ledger-receiver.js` (ส่งผ่าน `postMessage`)
- ไฟล์patched: `bridge/money-ledger-with-winlist.html` (ใส่ iframe รับข้อความเข้ากับ Money Ledger)
- WinList จะบันทึกคิวคำขอไว้ส่ง หากการเชื่อมต่อล้มเหลวจะเก็บไว้ส่งทีหลัง (Queue)

### โหมด Supabase (แอปเดียวกันบนคลาวด์)
- ทั้ง WinList + Money Ledger เชื่อมต่อ Supabase โปรเจกต์เดียวกัน
- ข้อมูลเงินถูกเก็บที่ตาราง `winlist_tasks` ใน Supabase
- ไม่จำเป็นต้องใช้ bridge หรือ localStorage เลยครับ
- แค่ตั้งค่า `ledgerUrl` ใน settings เป็น URL ของ Money Ledger หรือเว้นไว้ว่างเพื่อใช้ Supabase แทน

### การตั้งค่า
- ในหน้า **Settings** สามารถเลือกได้ว่า:
  - `ledgerVerified: true` → ลองใช้ Bridge หรือ Supabase อัตโนมัติ
  - `ledgerVerified: false` → ใช้ localStorage / Supabase เฉพาะเครื่อง (ออฟไลน์)

---

## พฤติกรรมของคิว (Queue)

เมื่อ WinList ต้องการส่งข้อมูลเงินไป Supabase/Money Ledger แต่ยังไม่สามารถเชื่อมต่อได้ (เช่น ขณะออฟไลน์หรือ Network ขัดข้อง) จะเกิดเหตุการณ์ดังนี้:

1. **บันทึกคำขอไว้ในคิว** (localStorage key `winlist_queue` หรือ Supabase `winlist_ledger_queue` table)
2. **พยายามส่งซ้ำทุก 30 วินาที** (พร้อมสัญญาณ `ping`)
3. หากสำเร็จ จะ **ล้างคิว** และแสดง toast "โพสต์สำเร็จ"
4. หากเกินจำนวนครั้งที่ตั้งไว้ (ค่าเริ่มต้น 5 ครั้ง) จะแสดงข้อความ "ไม่สามารถส่งได้" และผู้ใช้สามารถกด **"ล้างคิว"** หรือ **"ส่งทีหลัง"** ได้

---

## การสำรองและกู้คืนข้อมูล (Backup & Restore)

ข้อมูลทั้งหมดสามารถเก็บได้ 2 แบบครับ:

### แบบที่ 1: บน Supabase Cloud (แนะนำ)
- Supabase มีระบบ **อัพเดทสำรองข้อมูลอัตโนมัติ** ตามรอบที่ตั้งค่า (Daily/Weekly)
- สามารถดาวน์โหลดสำรองได้จาก **Project → Backups** ใน dashboard
- หรือใช้ **REST API** ดึงข้อมูลออกมาเก็บได้

### แบบที่ 2: localStorage สำรอง (เดิมๆ)
- เปิด WinList บนเว็บเบราว์เซอร์
- ไปที่หน้า **Settings** → กดปุ่ม **"Export JSON"** → จะได้ไฟล์ JSON เก็บไว้
- เพื่อกู้คืน ให้กด **"Import JSON"** และเลือกไฟล์ที่บันทึกไว้
- หรือไปที่ `localStorage` โดยตรงผ่าน DevTools (Application → Local Storage)

### โหมดผสม (ทั้งคู่)
- ข้อมูลหลักเก็บบน Supabase
- สำรองเพิ่มเติมเป็น JSON ไฟล์ เก็บไว้ที่เครื่องหรือ Cloud storage ของตัวเอง

---

## การใช้งานเบื้องต้น

1. **ดูวันและเวลา** — บนหัวแอปจะแสดงวันที่ (วันไทย พ.ศ.) และนาฬิกา 7 ส่วน (HH:MM:SS) ตลอดเวลา
2. **เพิ่มงาน** — กดปุ่ม `+` เขียนรายการ → พิมพ์ชื่องาน เงิน (ถ้ามี) เลือกประเภท (ค่าใช้จ่าย/รายรับ) → บันทึก
   - หากเชื่อม Supabase → ข้อมูลจะเก็บที่ cloud ทันที
   - หากออฟไลน์ → เก็บที่ localStorage แล้วซิงค์เมื่อกลับมามี network
3. **ทำงานเสร็จ** — แทปที่วงเลขตรวจสอบ (check cell) → จะมีสัญลักษณ์ **WIN** หมุนแสดงสเตamp แล้วโพสต์เงินลงฐานข้อมูล (ถ้าประเภทเป็นค่าใช้จ่ายจะแสดง `−฿xxx.xx` ถ้าเป็นรายได้จะแสดง `+฿xxx.xx`)
4. **แก้ไข/ยกเลิก** — แทปที่งานที่ทำไว้เพื่อเปิดหน้าอัพเดท หรือ แทปค้างสองครั้งเพื่อลบ ระบบจะย้อนกลับการโพสต์เงินถ้าเคยส่งไปแล้ว

---

## การกำหนดค่าธีม (Theme)

WinList รองรับ 3 รูปแบบ:

1. **ระบบอัตโนมัติ** — ตามธีมของระบบปฏิบัติการ (Light/Dark)
2. **แสงสว่าง** — พื้นหลังครีมขาว ข้อความสีเขียวดำ
3. **มืด** — พื้นหลังสีน้ำเงินเข้ม-dark green-ground ข้อความสีครีมเผือก

เปลี่ยนได้จาก **Settings → Theme** หรือจะพิมพ์ `?theme=dark` ตอนเปิดแอปก็ได้ครับ

---

## ไฟล์สำคัญที่ส่งมอบ

| ไฟล์/โฟลเดอร์ | คำอธิบาย |
|---|---|
| `index.html` | หน้าจอหลัก แบบ multi-file PWA (เชื่อมต่อ Money Ledger/Supabase) |
| `WinList.html` | build เดี่ยว (standalone) — inlined CSS/JS/Fonts ใช้ได้ทั้ง file:// |
| `manifest.webmanifest` | แมนิเฟสต์สำหรับ PWA (ไอคอน, shortcut) |
| `sw.js` | Service Worker สำหรับออฟไลน์ cache |
| `assets/app.css` / `assets/app.js` | ไฟล์ต้นทาง (CSS ตกแต่ง + JS เต็มรูป) |
| `assets/fonts/` | ฟอนต์ Bai Jamjuree + Anuphan (6 ไฟล์ WOFF2) |
| `icons/` | ไอคอน PWA ขนาด 192, 512, maskable, apple-touch |
| `bridge/money-ledger-receiver.js` | สคริปต์รับ postMessage ข้ามโดเมน (หากใช้ cross-origin) |
| `bridge/money-ledger-with-winlist.html` | Money Ledger แก้ไขเพิ่มเติมใส่ iframe Bridge |
| `WinList-PWA.zip` | ซี่ปี้พร้อมใช้ทุกอย่างบรรจุในไฟล์เดียว |
| `README.md` | เอกสารนี้ครับ |
| `explained.md` | แผนการย้ายฐานข้อมูลสู่ Supabase (เทคนิคละเอียด) |
| `.impeccable/design.json` | โทเคนและค่าการตั้งค่าการออกแบบ |

---

## ข้อมูลสำคัญ

- **เงินที่บันทึก** จะแสดงเป็นตัวเลขมีเครื่องหมาย: `−฿450.00` (ค่าใช้จ่าย) หรือ `+฿3,500.00` (รายรับ) — ไม่ขึ้นกับสีเพียงอย่างเดียว
- **เวลาและวันที่** จะแสดงตามแบบไทย วันที่เขียนด้วยตัวอักษรไทย พร้อมเลขไทยบนแถบบน
- **สี** มีความหมาย: เขียวเข้ม = โพสต์รายได้, หมู่ข Vermilion (สีม่วงแดง) = ค่าใช้จestamp/stamp WIN, แอמבר = สถานะรอ/คิว
- **Touch target** อย่างน้อย 44 px ตลอดเวลา รองรับมือถือขนาด 320 px ขึ้นไป
- **ฐานข้อมูล** สามารถเลือกได้ทั้ง localStorage (เก่า), Supabase (ใหม่), หรือทั้งคู่ (ผสม)
- **สำรองข้อมูล** ทำได้ทั้งอัตโนมัติจาก Supabase หรือสำรองแบบ manual JSON
- **ไฟล์ seed/ทดสอบ** ถูกลบไปแล้ว ไม่เก็บข้อมูลตัวอย่างครับ

---
*WinList สร้างขึ้นภายใต้แนวทาง "ของบัญชีผู้ทำงาน" (working accountant's columnar pad)*
*seed: b19749c8e9d9f7e0*