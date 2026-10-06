// ===== ตั้งค่า (ใส่ค่าของโปรเจกต์ Supabase ของคุณ) =====
// anon key เป็นคีย์สาธารณะ ใส่ในหน้าเว็บได้ ส่วน API key ลับอยู่ใน Supabase secrets เท่านั้น
const SUPABASE_URL = "https://otfirclufoiwmuekcszj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZmlyY2x1Zm9pd211ZWtjc3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMDE2MjYsImV4cCI6MjEwNjc3NzYyNn0.FZfDEfYh-3dl7L0Eis9roY2K2cfxXMftkIycRCrCFJg";
const FN_URL = `${SUPABASE_URL}/functions/v1/recommend`;

const $ = (id) => document.getElementById(id);
const goBtn = $("goBtn"), statusEl = $("status");

// เรียก Edge Function (ส่ง action เพื่อแยก แนะนำเพลง / ดึงประวัติ)
async function callFn(body) {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
  return data;
}

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle("error", isError);
}

// สร้างการ์ดเพลง (ใช้ textContent กันโค้ดแปลกปลอม)
function renderSongs(data) {
  $("moodChip").textContent = data.mood;
  $("summary").textContent = data.summary;
  const box = $("cards");
  box.innerHTML = "";
  data.songs.forEach((s) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = "<h3></h3><p class='artist'></p><p class='reason'></p><a class='yt' target='_blank' rel='noopener'>ฟังบน YouTube</a>";
    card.querySelector("h3").textContent = s.title;
    card.querySelector(".artist").textContent = s.artist;
    card.querySelector(".reason").textContent = s.reason;
    card.querySelector(".yt").href = s.url; // URL จริงจาก YouTube API
    box.appendChild(card);
  });
  $("result").hidden = false;
}

async function loadHistory() {
  try {
    const { history } = await callFn({ action: "history" });
    if (!history || !history.length) return;
    const ul = $("history");
    ul.innerHTML = "";
    history.forEach((h) => {
      const li = document.createElement("li");
      li.textContent = `${h.mood} — "${h.mood_text}"`;
      ul.appendChild(li);
    });
    $("historyBox").hidden = false;
  } catch (e) { /* ไม่มีประวัติก็ข้ามได้ */ }
}

goBtn.addEventListener("click", async () => {
  const text = $("moodText").value.trim();
  if (text.length < 3) return setStatus("กรุณาเล่าความรู้สึกสักหน่อยนะ", true);
  goBtn.disabled = true;
  $("result").hidden = true;
  setStatus("กำลังฟังความรู้สึกและเลือกเพลงให้คุณ…");
  try {
    renderSongs(await callFn({ action: "recommend", text }));
    setStatus("");
    loadHistory();
  } catch (e) {
    setStatus(`ขออภัย ${e.message} ลองกดใหม่อีกครั้ง`, true);
  } finally {
    goBtn.disabled = false;
  }
});
loadHistory();
