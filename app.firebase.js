// app.firebase.js (responsive, compat syntax)
// No manifest/SW. Avoids optional chaining. Mobile-first UX, Hindi labels + a11y + shortcuts.

'use strict';

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, onSnapshot, query, where,
  setDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

/* Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyDzQELYYO_TBr1WbjUDnRD7lTS2eatAHOk",
  authDomain: "app-pixel-f3dac.firebaseapp.com",
  projectId: "app-pixel-f3dac",
  storageBucket: "app-pixel-f3dac.firebasestorage.app",
  messagingSenderId: "1009603431459",
  appId: "1:1009603431459:web:e67c9d8a7ae57b26d6b596"
};
const ADMIN_UID = "wpK7wiO8L4Xmaq6sL46CZZnhhKk2";

/* Init */
const appFB = initializeApp(firebaseConfig);
const db = getFirestore(appFB);
const auth = getAuth(appFB);

/* State */
const CATEGORIES = [
  "Games","Tools","Productivity","Social","Entertainment","Photography","Music","Video",
  "Personalization","Health","Education","Finance","Shopping","Communication","Security",
  "Travel","Maps","News","Weather","Utilities"
];
let apps = [];
let userProfile = { name: "Guest", email: "guest@example.com", avatar: "" };
let historyList = JSON.parse(localStorage.getItem("apx_history")||"[]");
let unsubPublicApps = null;
let unsubAdminApps = null;

/* Helpers */
function $(s){ return document.querySelector(s); }
function $$(s){ return document.querySelectorAll(s); }
function toast(msg){
  const t=$("#toast"); if(!t) return;
  t.textContent=msg; t.classList.add("show");
  setTimeout(function(){ t.classList.remove("show"); }, 1600);
}
function saveHistory(){ localStorage.setItem("apx_history", JSON.stringify(historyList)); }
function saveUser(){ localStorage.setItem("apx_user", JSON.stringify(userProfile)); updateDrawerUser(); }
function loadUser(){
  const u = localStorage.getItem("apx_user");
  if(u){ try{ userProfile = JSON.parse(u); }catch(e){} }
  updateDrawerUser();
}
function updateDrawerUser(){
  const nameEl=$("#drawerName"), emailEl=$("#drawerEmail"), av=$("#drawerAvatar");
  if(nameEl) nameEl.textContent = userProfile.name || "Guest";
  if(emailEl) emailEl.textContent = userProfile.email || "guest@example.com";
  if(!av) return;
  if(userProfile.avatar){
    av.style.background = 'url("'+userProfile.avatar+'") center/cover no-repeat';
    av.textContent="";
  } else {
    av.style.background="linear-gradient(135deg,var(--primary),var(--accent))";
    av.textContent=(userProfile.name||"G").slice(0,1).toUpperCase();
  }
}
function slug(s){ return (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,50) || ("app-"+Date.now()); }

const THEME_KEY = "apx_theme";
function applyTheme(t){
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(THEME_KEY, t);
  const btn = document.querySelector("#btnTheme");
  if(btn) btn.textContent = t === "dark" ? "☀️" : "🌙";
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute("content", t === "dark" ? "#0B1220" : "#2563EB");
}
function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
}

const SKIN_KEY = "apx_skin";
const SKINS = ["nebula","sunset","mint"];
function applySkin(s){
  document.documentElement.setAttribute("data-skin", s);
  localStorage.setItem(SKIN_KEY, s);
  const b = document.querySelector("#btnSkin");
  if(b){ b.textContent = s === "sunset" ? "🌅" : s === "mint" ? "🌿" : "🎨"; }
}
function initSkin(){ applySkin(localStorage.getItem(SKIN_KEY) || "nebula"); }

function copyText(text){
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  const ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.left = "-9999px";
  document.body.appendChild(ta); ta.focus(); ta.select();
  try { document.execCommand("copy"); } finally { ta.remove(); }
  return Promise.resolve();
}
async function shareLink(url, title, text){
  title = title || 'App‑Pixel';
  text = text || 'Check this app on App‑Pixel';
  if (navigator.share) {
    try { await navigator.share({ title: title, text: text, url: url }); return true; }
    catch(e){ /* ignore */ }
  }
  await copyText(url);
  return false;
}

function normalizeUrl(u){
  if(!u) return "";
  var s = u.trim();
  if(/^https?:\/\//i.test(s)) return s;
  if(/^\/\//.test(s)) return "https:" + s;
  return "https://" + s.replace(/^\/+/, "");
}
function safeOpen(u){
  const url = normalizeUrl(u);
  if(!url){ toast("Download link missing"); return; }
  const a = document.createElement("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){
    if (document.visibilityState === "visible") {
      toast("Popup blocked? Allow popups and tap again.");
    }
  }, 300);
}

/* Stars/badge */
const STAR_SVG = '\
  <svg viewBox="0 0 20 20" class="star" aria-hidden="true">\
    <path fill="currentColor" d="M10 1.6l2.47 5.02 5.53.8-4 3.9.95 5.5L10 14.9 5.05 16.9 6 11.3 2 7.42l5.53-.8L10 1.6z"/>\
  </svg>\
';
function starsRow(){ return Array(5).fill(STAR_SVG).join(''); }
function ratingStars(val){
  const r = Math.max(0, Math.min(5, Number(val)||0));
  const pct = (r/5)*100;
  return '\
    <span class="rating" aria-label="Rating '+r.toFixed(1)+' of 5">\
      <span class="stars">\
        <span class="row bg">'+starsRow()+'</span>\
        <span class="row fg" style="width:'+pct+'%">'+starsRow()+'</span>\
      </span>\
      <span class="score">'+r.toFixed(1)+'</span>\
    </span>\
  ';
}
const VERIFIED_BADGE = '\
  <span class="badge badge-verify" title="Verified">\
    <svg class="i" viewBox="0 0 24 24" aria-hidden="true">\
      <path fill="currentColor" d="M12 2 3 7v6c0 5 5 9 9 9s9-4 9-9V7l-9-5zm-1 13.2-3.2-3.2 1.4-1.4L11 12.6l4.8-4.8 1.4 1.4L11 15.2z"/>\
    </svg>\
    Verified\
  </span>\
';

/* Lightbox */
var iv = { items: [], index: 0 };
function bindImageViewerChrome(){
  const root = document.querySelector("#imgViewer");
  if(!root) return;
  const c = document.querySelector("#ivClose"); if(c) c.addEventListener("click", closeViewer);
  const p = document.querySelector("#ivPrev"); if(p) p.addEventListener("click", function(){ showViewer(iv.index - 1); });
  const n = document.querySelector("#ivNext"); if(n) n.addEventListener("click", function(){ showViewer(iv.index + 1); });
  root.addEventListener("click", function(e){ if(e.target === root) closeViewer(); });
  document.addEventListener("keydown", function(e){
    if(!root.classList.contains("show")) return;
    if(e.key === "Escape") closeViewer();
    if(e.key === "ArrowRight") showViewer(iv.index + 1);
    if(e.key === "ArrowLeft") showViewer(iv.index - 1);
  });
}
function openViewer(items, startIndex){
  startIndex = startIndex || 0;
  iv.items = (items||[]).filter(Boolean);
  if(iv.items.length === 0) return;
  iv.index = Math.max(0, Math.min(startIndex, iv.items.length-1));
  const v = document.querySelector("#imgViewer");
  if(v) v.classList.add("show");
  showViewer(iv.index);
}
function showViewer(idx){
  if(iv.items.length === 0) return;
  iv.index = Math.max(0, Math.min(idx, iv.items.length-1));
  const src = iv.items[iv.index];
  const img = document.querySelector("#ivImg");
  if(img){ img.src = src; img.alt = "preview"; }
  const open = document.querySelector("#ivOpen");
  if(open) open.href = src;
  const hasMany = iv.items.length > 1;
  const prev = document.querySelector("#ivPrev");
  const next = document.querySelector("#ivNext");
  if(prev) prev.style.display = hasMany && iv.index > 0 ? "block" : "none";
  if(next) next.style.display = hasMany && iv.index < iv.items.length-1 ? "block" : "none";
}
function closeViewer(){
  const root = document.querySelector("#imgViewer");
  if(root) root.classList.remove("show");
  const img = document.querySelector("#ivImg");
  if(img) img.src = "";
}

/* Search overlay tap-to-close */
function bindSearchOverlayTapClose(){
  const ov = document.querySelector("#searchOverlay");
  if(!ov) return;
  ov.onclick = function(e){
    if (e.target.closest(".search-box")) return;
    if (e.target.closest(".search-result")) return;
    closeSearch();
  };
}

/* Chrome bindings */
window.addEventListener("DOMContentLoaded", function(){
  const yr = new Date().getFullYear();
  const y1 = $("#year"); if (y1) y1.textContent = yr;
  const y2 = $("#yearFoot"); if (y2) y2.textContent = yr;

  initSkin();
  initTheme();
  bindImageViewerChrome();
  bindChrome();
  bindNetworkStatus();
  loadUser();
  startPublicAppsListener();
  router();
});
window.addEventListener("hashchange", router);

function bindChrome(){
  const goHome = document.querySelector("#goHome");
  if(goHome){
    goHome.addEventListener("click", function(){ location.hash = "#/home"; });
    goHome.addEventListener("keydown", function(e){ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); location.hash="#/home"; } });
  }

  const skinBtn = document.querySelector("#btnSkin");
  if(skinBtn){
    skinBtn.addEventListener("click", function(){
      const cur = document.documentElement.getAttribute("data-skin") || "nebula";
      const arr = SKINS;
      const idx = arr.indexOf(cur);
      const next = arr[(idx>=0?idx:0)+1 >= arr.length ? 0 : (idx+1)];
      applySkin(next);
    });
  }

  const mbtn = $("#btnMenu"); if(mbtn) mbtn.addEventListener("click", openDrawer);
  const cbtn = $("#btnDrawerClose"); if(cbtn) cbtn.addEventListener("click", closeDrawer);
  const ov = $("#overlay"); if(ov) ov.addEventListener("click", function(){ closeDrawer(); closeSearch(); });
  const sbtn = $("#btnSearch"); if(sbtn) sbtn.addEventListener("click", openSearch);
  const sclose = $("#searchClose"); if(sclose) sclose.addEventListener("click", closeSearch);

  // Debounced search typing
  let t;
  const sin = $("#searchInput");
  if(sin){
    sin.addEventListener("input", function(){
      clearTimeout(t);
      t = setTimeout(handleSearch, 80);
    });
  }

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape"){ closeSearch(); closeDrawer(); }
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k"){ e.preventDefault(); openSearch(); }
    if(!e.ctrlKey && !e.metaKey && e.key === "/"){ e.preventDefault(); openSearch(); }
    if(!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "t"){
      const cur = document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(cur==="dark"?"light":"dark");
    }
  });

  const themeBtn = document.querySelector("#btnTheme");
  if(themeBtn){
    themeBtn.addEventListener("click", function(){
      const current = document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

  $$(".drawer-nav a").forEach(function(link){
    link.addEventListener("click", function(){
      closeDrawer();
      closeSearch();
    });
  });
}

/* Drawer */
function openDrawer(){
  const dr = $("#drawer");
  if(!dr) return;
  dr.classList.add("open");
  dr.setAttribute("aria-hidden","false");
  const ov = $("#overlay");
  if(ov) ov.classList.add("show");
  setTimeout(function(){ const a = dr.querySelector("a"); if(a) a.focus(); }, 10);
}
function closeDrawer(){
  const dr = $("#drawer");
  if(!dr) return;
  dr.classList.remove("open");
  dr.setAttribute("aria-hidden","true");
  const ov = $("#overlay");
  if(ov) ov.classList.remove("show");
}

/* Search overlay */
function openSearch(){
  const so = $("#searchOverlay"), ov = $("#overlay"), sin = $("#searchInput"), res = $("#searchResults");
  if(so) so.classList.add("show");
  if(ov) ov.classList.add("show");
  if(sin) sin.value = "";
  if(res) res.innerHTML = "";
  bindSearchOverlayTapClose();
  if(sin) sin.focus();
}
function closeSearch(){
  const so = $("#searchOverlay"), ov = $("#overlay");
  if(so) so.classList.remove("show");
  if(ov) ov.classList.remove("show");
}

/* Realtime published apps (no orderBy to avoid index requirement) */
function startPublicAppsListener(){
  const qPub = query(
    collection(db,"apps"),
    where("published","==", true)
  );
  if (typeof unsubPublicApps === "function") unsubPublicApps();
  unsubPublicApps = onSnapshot(qPub, function(snap){
    apps = snap.docs.map(function(d){
      const data = d.data() || {};
      return Object.assign({ id: d.id }, data);
    });
    const h = location.hash || "#/home";
    if (h.indexOf("#/home")===0 || h.indexOf("#/app")===0 || h.indexOf("#/about")===0 || h.indexOf("#/download")===0){
      router(true);
    }
  }, function(err){
    console.error("Apps listener error:", err);
    router(true);
  });
}

/* Router */
function router(isSilent){
  if(isSilent === undefined) isSilent = false;
  clearStickyCTA();
  closeDrawer();
  const hash = location.hash || "#/home";
  const parts = hash.replace(/^#\//,"").split("/");
  const view = parts[0] || "home";
  switch(view){
    case "home": renderHome(); break;
    case "app": renderAppDetail(parts[1]); break;
    case "download": renderDownloadStep(parts[1], parseInt(parts[3]||"1",10)); break;
    case "profile": renderProfile(); break;
    case "history": renderHistory(); break;
    case "admin": renderAdmin(); break;
    case "about": renderAbout(); break;
    default: renderHome(); break;
  }
  if(!isSilent) window.scrollTo({top:0, behavior:"instant"});
}

/* Home */
// 1) Render all items (no slice(0,1)!) and rebind buttons
function renderHome(){
  const el = document.querySelector("#view");
  if(!apps || apps.length === 0){
    el.innerHTML = skeletonHomeHTML ? skeletonHomeHTML() : '<div class="muted">Loading…</div>';
    return;
  }

  // Show every published app (change logic if you need)
  const all = apps.filter(a => a.published !== false);

  const trending = all.slice().sort((a,b)=> (b.rating||0) - (a.rating||0));                  // ALL by rating desc
  const updates  = all.slice().sort((a,b)=> asMillis(b.updatedAt) - asMillis(a.updatedAt));  // ALL by updatedAt desc

  el.innerHTML = `
    <section class="section hero">
      <h1>Find trusted APKs faster</h1>
      <p class="muted">Explore, verify, and download</p>
      <div class="tags" style="margin-top:12px;">
        ${CATEGORIES.map(c=>`<button class="chip" data-cat="${c}">${c}</button>`).join('')}
      </div>
    </section>

    <section class="section">
      <h2>Trending Apps</h2>
      <div class="grid" id="gridTrending">
        ${trending.map(appCard).join('') || `<div class="muted">No apps</div>`}
      </div>
    </section>

    <section class="section">
      <h2>New Updates</h2>
      <div class="grid" id="gridUpdates">
        ${updates.map(appCard).join('') || `<div class="muted">No apps</div>`}
      </div>
    </section>

    <section class="section">
      <h2>Categories</h2>
      <div class="grid">
        ${CATEGORIES.map(c=>`
          <div class="card" style="align-items:center;text-align:center;gap:8px;">
            <div class="avatar" style="width:54px;height:54px;border-radius:14px;background:linear-gradient(135deg,var(--primary),var(--accent));color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">${c.slice(0,1)}</div>
            <div style="font-weight:600">${c}</div>
            <button class="btn ghost cat-filter" data-filter-cat="${c}">Explore</button>
          </div>
        `).join('')}
      </div>
    </section>
  `;

  // Buttons behaviour
  document.querySelectorAll(".card .btn.details").forEach(btn=>{
    btn.addEventListener("click", e => location.hash = `#/app/${e.currentTarget.dataset.id}`);
  });
  document.querySelectorAll(".card .btn.download").forEach(btn=>{
    btn.addEventListener("click", e => location.hash = `#/download/${e.currentTarget.dataset.id}/step/1`);
  });
  document.querySelectorAll(".cat-filter").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(typeof openSearch === 'function'){
        openSearch();
        const sin = document.querySelector("#searchInput");
        if(sin){ sin.value = btn.getAttribute("data-filter-cat"); if(typeof handleSearch === 'function') handleSearch(); }
      }
    });
  });

  // Hero category filter chips
  document.querySelectorAll(".hero .chip").forEach(ch=>{
    ch.addEventListener("click", ()=>{
      const c = ch.getAttribute("data-cat");
      document.querySelectorAll(".hero .chip").forEach(x=>x.classList.remove("on"));
      ch.classList.add("on");
      const filtered = all.filter(a=>a.category===c);
      document.querySelector("#gridTrending").innerHTML = filtered.map(appCard).join('') || `<div class="muted">No apps in ${c}</div>`;
      document.querySelector("#gridUpdates").innerHTML = "";
      // rebind for filtered
      document.querySelectorAll(".card .btn.details").forEach(btn=>{
        btn.addEventListener("click", e => location.hash = `#/app/${e.currentTarget.dataset.id}`);
      });
      document.querySelectorAll(".card .btn.download").forEach(btn=>{
        btn.addEventListener("click", e => location.hash = `#/download/${e.currentTarget.dataset.id}/step/1`);
      });
    });
  });
}

function bindHomeGridButtons(){
  $$(".card .btn.details").forEach(function(btn){
    btn.addEventListener("click", function(e){ location.hash = '#/app/'+ e.currentTarget.getAttribute("data-id"); });
  });
  $$(".card .btn.download").forEach(function(btn){
    btn.addEventListener("click", function(e){ location.hash = '#/download/'+ e.currentTarget.getAttribute("data-id") + '/step/1'; });
  });
}
// helper used below
function asMillis(ts){
  if(!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts === 'object' && ts && typeof ts.seconds !== 'undefined') return ts.seconds*1000;
  const n = new Date(ts).getTime(); return isNaN(n) ? 0 : n;
}

// 2) Safe card template (only two buttons, no empty element)
function appCard(a){
  return `
    <div class="card">
      <div class="card-header">
        <img class="app-icon" loading="lazy" decoding="async"
             src="${a.icon||''}" alt="${a.name||'App'} icon"
             onerror="this.src='https://via.placeholder.com/96?text=App'">
        <div>
          <div class="app-title">${a.name||''}</div>
          <div class="meta">
            ${typeof ratingStars === 'function' ? ratingStars(a.rating||0) : `⭐ ${(a.rating||0).toFixed(1)}`}
            <span class="dot">•</span> ${a.sizeMB||0} MB
            <span class="dot">•</span> ${a.category||''}
          </div>
        </div>
      </div>

      <div class="tags">
        ${a.verified ? `
          <span class="badge badge-verify" title="Verified">
            <svg class="i" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 2 3 7v6c0 5 5 9 9 9s9-4 9-9V7l-9-5zm-1 13.2-3.2-3.2 1.4-1.4L11 12.6l4.8-4.8 1.4 1.4L11 15.2z"/>
            </svg>
            Verified
          </span>` : ``}
        ${(a.tags||[]).slice(0,3).map(t=>`<span class="chip">${t}</span>`).join('')}
      </div>

      <div class="controls">
        <button class="btn ghost details" data-id="${a.id}">Details</button>
        <button class="btn primary download" data-id="${a.id}">Download</button>
      </div>
    </div>
  `;
}

function categoryTile(c){
  return '\
    <div class="card" style="align-items:center;text-align:center;gap:8px;">\
      <div class="avatar" style="width:54px;height:54px;border-radius:14px;">'+c.slice(0,1)+'</div>\
      <div style="font-weight:600">'+c+'</div>\
      <button class="btn ghost cat-filter" data-filter-cat="'+c+'">Explore</button>\
    </div>\
  ';
}

/* App detail */
async function renderAppDetail(id){
  let a = apps.find(function(x){ return x.id===id; });
  if(!a){
    try{
      const snap = await getDoc(doc(db,"apps", id));
      if(snap.exists()) a = Object.assign({ id: snap.id }, snap.data());
    } catch(e){}
  }
  const view = $("#view");
  if(!a){ if(view) view.innerHTML = '<div class="muted">App not found.</div>'; return; }

  const hasScreens = a.screenshots && a.screenshots.length;
  if(view) view.innerHTML = '\
    <section class="detail-head">\
      <img class="app-icon zoomable" loading="lazy" decoding="async"\
        src="'+a.icon+'" alt="'+a.name+'" style="width:96px;height:96px;border-radius:20px;">\
      <div style="flex:1">\
        <h2 style="margin:0 0 6px">'+a.name+'</h2>\
        <div class="detail-meta">\
          '+ratingStars(a.rating||0)+'\
          <span>'+(a.sizeMB||0)+' MB</span>\
          <span>v'+(a.version||'1.0.0')+'</span>\
          <span>'+(a.category||'')+'</span>\
          '+(a.verified ? VERIFIED_BADGE : '')+'\
        </div>\
        <div class="controls" style="margin-top:10px;">\
          <button class="btn primary" id="dlFromDetail">Download (Free)</button>\
          <button class="btn ghost" id="shareBtn">Share</button>\
        </div>\
        <div class="muted" style="margin-top:6px;">Verified link • Last scanned: 24h</div>\
      </div>\
    </section>\
    <section class="section">\
      <h2>About</h2>\
      <p>'+(a.description||'')+'</p>\
    </section>\
    '+(hasScreens ? '\
      <section class="section">\
        <h2>Screenshots</h2>\
        <div class="screens">\
          '+a.screenshots.map(function(s){ return '<img class="zoomable" loading="lazy" decoding="async" src="'+s+'" alt="screenshot" onerror="this.remove()">'; }).join('')+'\
        </div>\
      </section>\
    ' : '')+'\
    <section class="section">\
      <h2>Permissions</h2>\
      <div class="tags">\
        '+((a.permissions||[]).map(function(p){ return '<span class="chip">'+p+'</span>'; }).join('') || '<span class="muted">No special permissions</span>')+'\
      </div>\
    </section>\
    <section class="section">\
      <h2>Similar</h2>\
      <div class="grid">\
        '+(apps.filter(function(x){ return x.category===a.category && x.id!==a.id; }).slice(0,4).map(appCard).join('') || '<div class="muted">No similar apps</div>')+'\
      </div>\
    </section>\
  ';

  const dld = $("#dlFromDetail"); if(dld) dld.addEventListener("click", function(){ location.hash = '#/download/'+a.id+'/step/1'; });
  $$(".grid .btn.details").forEach(function(btn){ btn.addEventListener("click", function(e){ location.hash = '#/app/'+ e.currentTarget.getAttribute("data-id"); }); });
  $$(".grid .btn.download").forEach(function(btn){ btn.addEventListener("click", function(e){ location.hash = '#/download/'+ e.currentTarget.getAttribute("data-id") + '/step/1'; }); });

  const sb = $("#shareBtn");
  if(sb){
    sb.addEventListener("click", async function(){
      const ok = await shareLink(window.location.href, a.name, 'Download '+a.name+' on App‑Pixel');
      toast(ok ? "Shared" : "Link copied");
    });
  }

  const iconEl = document.querySelector(".detail-head .app-icon");
  if(iconEl) iconEl.addEventListener("click", function(){ openViewer([a.icon], 0); });
  const shotEls = document.querySelectorAll(".screens img");
  if(shotEls) shotEls.forEach(function(im, i){ im.addEventListener("click", function(){ openViewer(a.screenshots, i); }); });

  setupStickyCTA(a);
}

/* Sticky CTA mobile */
function setupStickyCTA(app){
  document.querySelectorAll(".sticky-cta").forEach(function(n){ n.remove(); });
  if(window.matchMedia("(min-width:768px)").matches) return;
  const bar = document.createElement("div");
  bar.className = "sticky-cta";
  bar.innerHTML = '\
    <div style="display:flex;align-items:center;gap:10px">\
      <img loading="lazy" decoding="async" src="'+app.icon+'" class="app-icon" style="width:40px;height:40px;border-radius:10px" alt="'+app.name+'">\
      <div>\
        <div class="title">'+app.name+'</div>\
        <div class="meta">v'+(app.version||'1.0.0')+' • '+(app.sizeMB||0)+' MB</div>\
      </div>\
    </div>\
    <button class="btn primary" style="height:44px" id="stickyDownload">Download</button>\
  ';
  document.body.appendChild(bar);
  const b = bar.querySelector("#stickyDownload");
  if(b) b.addEventListener("click", function(){ location.hash = '#/download/'+app.id+'/step/1'; });
}
function clearStickyCTA(){ document.querySelectorAll(".sticky-cta").forEach(function(n){ n.remove(); }); }

/* Download flow */
let countdownTimer = null;
function renderDownloadStep(id, step){
  if(!step) step = 1;
  const a = apps.find(function(x){ return x.id===id; });
  const view = $("#view");
  if(!a){ if(view) view.innerHTML = '<section class="step-wrap"><div class="muted">Loading…</div></section>'; return; }
  clearInterval(countdownTimer);

  const dots = [1,2,3].map(function(n){ return '<div class="dot '+(n===step?'active':'')+'"></div>'; }).join('');
  if(view) view.innerHTML = '\
    <section class="step-wrap">\
      <div class="stepper">'+dots+'<div style="margin-left:8px" class="muted">Step '+step+' of 3</div></div>\
      <h2 style="margin:0 0 8px;">Prepare download • '+a.name+'</h2>\
      '+(step<3? '\
        <div class="ad-box">Ad space (placeholder)</div>\
        <div class="countdown" id="countdown">Please wait 5s</div>\
        <div class="controls">\
          <button id="btnContinue" class="btn primary" disabled>Continue..</button>\
          <button class="btn ghost" id="btnBackApp">Back to app</button>\
        </div>\
      ' : '\
        <div class="card" style="display:flex;align-items:center;gap:12px;">\
          <img class="app-icon" src="'+a.icon+'" style="width:56px;height:56px;border-radius:14px;" alt="">\
          <div>\
            <div style="font-weight:600">'+a.name+'</div>\
            <div class="meta">v'+(a.version||'1.0.0')+' • '+(a.sizeMB||0)+' MB</div>\
          </div>\
        </div>\
        <div class="controls" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">\
          <button class="btn primary" id="finalLink">Get download link</button>\
          <button class="btn ghost" id="copyLink">Copy link</button>\
          <button class="btn ghost" id="btnBackApp">Back to app</button>\
        </div>\
        <div class="muted" style="margin-top:6px;">Link valid for 24 hours • If not working, try again</div>\
      ')+'\
    </section>\
  ';

  const back = $("#btnBackApp");
  if(back) back.addEventListener("click", function(){ location.hash = '#/app/'+a.id; });

  if(step < 3){
    let remaining = 5;
    const cd = $("#countdown");
    const btn = $("#btnContinue");
    if(cd) cd.textContent = 'Please wait '+remaining+'s';
    countdownTimer = setInterval(function(){
      remaining--;
      if(cd) cd.textContent = 'Please wait '+remaining+'s';
      if(remaining <= 0){
        clearInterval(countdownTimer);
        if(btn) btn.disabled = false;
        if(cd) cd.textContent = "You can continue";
      }
    }, 1000);
    if(btn) btn.addEventListener("click", function(){ location.hash = '#/download/'+id+'/step/'+(step+1); });
  } else {
    const copyBtn = $("#copyLink");
    const finalBtn = $("#finalLink");

    if(copyBtn) copyBtn.addEventListener("click", function(){ navigator.clipboard.writeText(a.downloadLink).then(function(){ toast("Link copied"); }); });

    if(finalBtn) finalBtn.addEventListener("click", function(e){
      e.preventDefault(); e.stopPropagation();
      historyList.unshift({ id:a.id, name:a.name, version:a.version, icon:a.icon, time:new Date().toISOString(), sizeMB:a.sizeMB });
      historyList = historyList.slice(0,200);
      saveHistory();
      safeOpen(a.downloadLink);
    });
  }
}

/* Profile */
function renderProfile(){
  const u = userProfile;
  const view=$("#view"); if(!view) return;
  view.innerHTML = '\
    <section class="section">\
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">\
        <h2 style="margin:0">Profile</h2>\
        <button class="btn ghost" onclick="location.hash=\'#/home\'">Back to Home</button>\
      </div>\
      <div class="form" style="max-width:460px">\
        <div class="input"><label>Name</label><input id="pName" value="'+(u.name||'')+'" placeholder="Your name"></div>\
        <div class="input"><label>Email</label><input id="pEmail" value="'+(u.email||'')+'" placeholder="you@example.com" inputmode="email"></div>\
        <div class="input"><label>Avatar URL</label><input id="pAvatar" value="'+(u.avatar||'')+'" placeholder="https://..."></div>\
        <div class="controls"><button id="saveProfile" class="btn primary">Save</button></div>\
      </div>\
    </section>\
  ';
  const sv = $("#saveProfile");
  if(sv) sv.addEventListener("click", function(){
    userProfile.name = ($("#pName").value||"").trim() || "Guest";
    userProfile.email = ($("#pEmail").value||"").trim() || "guest@example.com";
    userProfile.avatar = ($("#pAvatar").value||"").trim();
    saveUser(); toast("Profile saved");
  });
}

/* History */
function renderHistory(){
  const items = historyList;
  const view=$("#view"); if(!view) return;
  view.innerHTML = '\
    <section class="section">\
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">\
        <h2 style="margin:0">Download History</h2>\
        <div class="controls">\
          <button class="btn ghost" onclick="location.hash=\'#/home\'">Back to Home</button>\
          '+(items.length ? '<button class="btn ghost" id="btnClearHistory">Clear history</button>' : '')+'\
        </div>\
      </div>\
      '+(items.length===0 ? '\
        <div class="card" style="text-align:center;">\
          <div class="muted">Abhi koi download nahi hai. Explore karein!</div>\
          <div class="controls" style="justify-content:center;margin-top:8px;">\
            <button class="btn ghost" onclick="location.hash=\'#/home\'">Explore apps</button>\
          </div>\
        </div>\
      ' : '\
        <div class="list">\
          '+items.map(function(it){ return '\
            <div class="list-item">\
              <img src="'+it.icon+'" class="app-icon" style="width:44px;height:44px;border-radius:12px;" alt="">\
              <div style="flex:1">\
                <div style="font-weight:600">'+it.name+'</div>\
                <div class="meta">v'+it.version+' • '+it.sizeMB+' MB • '+new Date(it.time).toLocaleString()+'</div>\
              </div>\
              <button class="btn ghost" onclick="location.hash=\'#/download/'+it.id+'/step/1\'">Re‑download</button>\
              <button class="btn" onclick="location.hash=\'#/app/'+it.id+'\'">Details</button>\
            </div>\
          '; }).join('')+'\
        </div>\
      ')+'\
    </section>\
  ';

  if(items.length){
    const clr = $("#btnClearHistory");
    if(clr) clr.addEventListener("click", function(){
      if(!confirm("Clear all download history?")) return;
      historyList = [];
      saveHistory();
      renderHistory();
      toast("History cleared");
    });
  }
}

/* Admin */
async function renderAdmin(){
  const user = auth.currentUser;
  const view = $("#view"); if(!view) return;
  if(!user || user.uid !== ADMIN_UID){
    view.innerHTML = '\
      <section class="section">\
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">\
          <h2 style="margin:0">Admin Login</h2>\
          <button class="btn ghost" onclick="location.hash=\'#/home\'">Back to Home</button>\
        </div>\
        <div class="form" style="max-width:420px">\
          <div class="input"><label>Email</label><input id="adEmail" placeholder="admin@example.com" inputmode="email"></div>\
          <div class="input"><label>Password</label><input id="adPass" type="password" placeholder="••••••••"></div>\
          <div class="controls">\
            <button id="adLogin" class="btn primary">Login</button>\
          </div>\
          <div class="muted">Note: Only authorized administrators have full access.</div>\
        </div>\
      </section>\
    ';
    const log = $("#adLogin");
    if(log) log.addEventListener("click", doAdminLogin);
    const pass = $("#adPass");
    if(pass) pass.addEventListener("keydown", function(e){ if(e.key==='Enter') doAdminLogin(); });
    return;
  }
  renderAdminUI();
}

async function doAdminLogin(){
  const email = ($("#adEmail").value||"").trim();
  const pass = $("#adPass").value;
  try{
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if(!cred.user || cred.user.uid !== ADMIN_UID){
      toast("Not authorized admin");
      await signOut(auth);
      return;
    }
    toast("Welcome Admin");
    renderAdminUI();
  }catch(e){
    console.error(e); toast("Login failed");
  }
}

function renderAdminUI(){
  const view=$("#view"); if(!view) return;
  view.innerHTML = '\
    <section class="section">\
      <h2>Admin • Add / Edit APK</h2>\
      <div class="form">\
        <div class="controls" style="margin-bottom:4px;">\
          <button class="btn" id="btnNew">New</button>\
          <button class="btn" id="btnExport">Export JSON</button>\
          <label class="btn">Import JSON\
            <input id="importFile" type="file" accept="application/json" style="display:none">\
          </label>\
          <span style="flex:1"></span>\
          <button class="btn ghost" onclick="location.hash=\'#/home\'">Back to Home</button>\
          <button class="btn ghost" id="btnLogout">Logout</button>\
        </div>\
        <div class="input"><label>App ID (doc id)</label><input id="aId" placeholder="e.g., pixel-photo"></div>\
        <div class="input"><label>Name</label><input id="aName" placeholder="App name"></div>\
        <div class="input"><label>Description</label><textarea id="aDesc" placeholder="Short description"></textarea></div>\
        <div class="input"><label>Icon URL</label><input id="aIcon" placeholder="https://..."></div>\
        <div class="input"><label>Devuploads Link (final)</label><input id="aLink" placeholder="https://devuploads.com/..."></div>\
        <div class="input">\
          <label>Category</label>\
          <select id="aCat">'+ CATEGORIES.map(function(c){return '<option>'+c+'</option>';}).join('') +'</select>\
        </div>\
        <div class="controls">\
          <div class="input" style="flex:1;min-width:140px"><label>Version</label><input id="aVer" placeholder="1.0.0"></div>\
          <div class="input" style="flex:1;min-width:140px"><label>Size (MB)</label><input id="aSize" type="number" placeholder="24" inputmode="numeric"></div>\
          <div class="input" style="flex:1;min-width:140px"><label>Rating</label><input id="aRate" type="number" step="0.1" placeholder="4.5" inputmode="decimal"></div>\
        </div>\
        <div class="controls">\
          <div class="input" style="flex:1"><label>Tags (comma)</label><input id="aTags" placeholder="offline, editor"></div>\
          <div class="input" style="flex:1"><label>Screenshots (comma URLs)</label><input id="aShots" placeholder="https://img1, https://img2"></div>\
        </div>\
        <div class="controls">\
          <label class="chip"><input id="aVerified" type="checkbox" style="margin-right:8px">Verified</label>\
          <label class="chip"><input id="aPublished" type="checkbox" style="margin-right:8px">Published</label>\
        </div>\
        <div class="controls">\
          <button class="btn primary" id="btnSave">Save / Update</button>\
        </div>\
      </div>\
    </section>\
    <section class="section">\
      <h2>Manage APKs</h2>\
      <div style="overflow:auto">\
        <table class="table">\
          <thead><tr><th>Icon</th><th>Name</th><th>Category</th><th>Version</th><th>Rating</th><th>Published</th><th>Updated</th><th>Actions</th></tr></thead>\
          <tbody id="appRows"></tbody>\
        </table>\
      </div>\
    </section>\
  ';

  const lo=$("#btnLogout"); if(lo) lo.addEventListener("click", async function(){ await signOut(auth); toast("Logged out"); renderAdmin(); });
  const bn=$("#btnNew"); if(bn) bn.addEventListener("click", function(){ clearForm(); });
  const bs=$("#btnSave"); if(bs) bs.addEventListener("click", saveForm);
  const ex=$("#btnExport"); if(ex) ex.addEventListener("click", exportJSON);
  const im=$("#importFile"); if(im) im.addEventListener("change", importJSON);

  if (typeof unsubAdminApps === "function") unsubAdminApps();
  // Realtime all apps, client-side sorting on updatedAt where needed
  unsubAdminApps = onSnapshot(collection(db,"apps"), function(snap){
    const rows = snap.docs.map(function(d){
      const data = d.data() || {};
      return Object.assign({ id:d.id }, data);
    }).sort(function(a,b){ return (asMillis(b.updatedAt)) - (asMillis(a.updatedAt)); });
    const tbody = $("#appRows");
    if(tbody) tbody.innerHTML = rows.map(rowHtml).join('') || '<tr><td colspan="8" class="muted">No apps yet</td></tr>';
    $$("#appRows .btn-edit").forEach(function(b){ b.addEventListener("click", function(){ loadIntoForm(b.getAttribute("data-id"), rows); }); });
    $$("#appRows .btn-del").forEach(function(b){ b.addEventListener("click", function(){ delApp(b.getAttribute("data-id")); }); });
  });

  function rowHtml(a){
    const upd = (a.updatedAt && typeof a.updatedAt.toDate === 'function') ? a.updatedAt.toDate() : (a.updatedAt? new Date(a.updatedAt): null);
    return '\
      <tr>\
        <td><img src="'+(a.icon||'')+'" style="width:36px;height:36px;border-radius:8px;border:1px solid var(--border)" alt=""></td>\
        <td>'+(a.name||'')+'<div class="meta">'+a.id+'</div></td>\
        <td>'+(a.category||'')+'</td>\
        <td>'+(a.version||'')+'</td>\
        <td>⭐ '+((a.rating||0).toFixed(1))+'</td>\
        <td>'+(a.published? 'Yes':'No')+'</td>\
        <td>'+(upd? upd.toLocaleDateString() : '—')+'</td>\
        <td><div class="controls">\
            <button class="btn btn-edit" data-id="'+a.id+'">Edit</button>\
            <button class="btn btn-del" data-id="'+a.id+'">Delete</button>\
        </div></td>\
      </tr>\
    ';
  }
  function clearForm(){
    $("#aId").value=""; $("#aName").value=""; $("#aDesc").value="";
    $("#aIcon").value=""; $("#aLink").value=""; $("#aCat").value="Tools";
    $("#aVer").value="1.0.0"; $("#aSize").value="1"; $("#aRate").value="0";
    $("#aTags").value=""; $("#aShots").value="";
    $("#aVerified").checked=true; $("#aPublished").checked=true;
  }
  function loadIntoForm(id, rows){
    const a = rows.find(function(x){ return x.id===id; }); if(!a) return;
    $("#aId").value=a.id; $("#aName").value=a.name||""; $("#aDesc").value=a.description||"";
    $("#aIcon").value=a.icon||""; $("#aLink").value=a.downloadLink||""; $("#aCat").value=a.category||"Tools";
    $("#aVer").value=a.version||"1.0.0"; $("#aSize").value=a.sizeMB||"1"; $("#aRate").value=a.rating||"0";
    $("#aTags").value=(a.tags||[]).join(", "); $("#aShots").value=(a.screenshots||[]).join(", ");
    $("#aVerified").checked=!!a.verified; $("#aPublished").checked=!!a.published;
  }
  async function saveForm(){
    const id = ($("#aId").value || slug($("#aName").value)).trim();
    const obj = {
      name: ($("#aName").value||"").trim(),
      description: ($("#aDesc").value||"").trim(),
      icon: ($("#aIcon").value||"").trim() || "https://via.placeholder.com/96?text=App",
      downloadLink: ($("#aLink").value||"").trim(),
      category: $("#aCat").value,
      version: ($("#aVer").value||"").trim() || "1.0.0",
      sizeMB: parseFloat($("#aSize").value)||0,
      rating: parseFloat($("#aRate").value)||0,
      verified: $("#aVerified").checked,
      published: $("#aPublished").checked,
      tags: ($("#aTags").value||"").split(",").map(function(x){return x.trim();}).filter(Boolean),
      screenshots: ($("#aShots").value||"").split(",").map(function(x){return x.trim();}).filter(Boolean),
      permissions: [],
      updatedAt: serverTimestamp()
    };
    if(!obj.name || !obj.downloadLink){ alert("Name aur Devuploads link required."); return; }
    try{
      await setDoc(doc(db,"apps", id), obj, { merge: true });
      toast("Saved");
    }catch(e){
      console.error(e); toast("Save failed");
    }
  }
  async function delApp(id){
    if(!confirm("Delete this app?")) return;
    try{ await deleteDoc(doc(db,"apps", id)); toast("Deleted"); }
    catch(e){ console.error(e); toast("Delete failed"); }
  }
  function exportJSON(){
    toast("Preparing export…");
    import("https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js").then(async function(mod){
      const getDocs = mod.getDocs;
      const snap = await getDocs(collection(db,"apps"));
      const data = snap.docs.map(function(d){
        const dd = d.data() || {};
        return Object.assign({id:d.id}, dd);
      });
      const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "apps.json"; a.click();
    });
  }
  function importJSON(e){
    const file = e.target.files[0]; if(!file) return;
    const fr = new FileReader();
    fr.onload = async function(){
      try{
        const data = JSON.parse(fr.result);
        if(!Array.isArray(data)) throw new Error("Invalid JSON");
        for(let i=0;i<data.length;i++){
          const item = data[i];
          const id = item.id || slug(item.name);
          await setDoc(doc(db,"apps", id), {
            name: item.name||"",
            description: item.description||"",
            icon: item.icon||"",
            downloadLink: item.downloadLink||"",
            category: item.category||"Tools",
            version: item.version||"1.0.0",
            sizeMB: Number(item.sizeMB)||0,
            rating: Number(item.rating)||0,
            verified: !!item.verified,
            published: item.published!==false,
            tags: item.tags||[],
            screenshots: item.screenshots||[],
            permissions: item.permissions||[],
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
        toast("Imported");
        e.target.value = "";
      }catch(err){ alert("Invalid JSON"); }
    };
    fr.readAsText(file);
  }
}

/* About */
function renderAbout(){
  const view=$("#view"); if(!view) return;
  view.innerHTML = '\
    <section class="section">\
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">\
        <h2 style="margin:0">About App‑Pixel</h2>\
        <button class="btn ghost" onclick="location.hash=\'#/home\'">Back to Home</button>\
      </div>\
      <p>App‑Pixel ek next‑gen APK explorer hai — jahan discovery, trust aur speed ek saath milte hain. No clutter, no confusion. Bas clean design, verified links aur lightning‑fast experience.</p>\
      <h3 style="margin:14px 0 8px;">Kyun App‑Pixel?</h3>\
      <div class="tags" style="flex-wrap:wrap">\
        <span class="chip">🛡️ Verified sources</span>\
        <span class="chip">⚡ Realtime updates</span>\
        <span class="chip">🔍 Clear details (version, size, permissions)</span>\
        <span class="chip">🌗 Elegant light/dark UI</span>\
      </div>\
      <h3 style="margin:16px 0 8px;">Experience that just flows</h3>\
      <div class="tags" style="flex-wrap:wrap">\
        <span class="chip">🔎 Smart search overlay</span>\
        <span class="chip">📸 Zoomable screenshots</span>\
        <span class="chip">📱 Sticky download bar</span>\
        <span class="chip">🔗 One‑tap share</span>\
        <span class="chip">🧭 3‑step safe download</span>\
      </div>\
    </section>\
    <section class="section">\
      <h2>Privacy & Trust</h2>\
      <p class="muted">No forced sign‑in for browsing. Download history sirf aapke device par save hoti hai (local). Hum minimal data rakhte hain — aapka control, aapki choice.</p>\
    </section>\
    <section class="section">\
      <h2>What’s next</h2>\
      <div class="tags" style="flex-wrap:wrap">\
        <span class="chip">🧩 Multi‑source mirrors</span>\
        <span class="chip">🛡️ Hash verification (SHA‑256)</span>\
        <span class="chip">🔔 Smart update alerts</span>\
        <span class="chip">📦 PWA (Installable app)</span>\
        <span class="chip">✨ Better recommendations</span>\
      </div>\
      <p class="muted" style="margin-top:8px;">Note: Third‑party APKs install karne se pehle permissions check karein, sirf trusted sources use karein, aur zarurat ho to antivirus scan karein.</p>\
    </section>\
  ';
}

/* Search */
function handleSearch(){
  const sin = $("#searchInput");
  const box = $("#searchResults");
  if(!sin || !box) return;

  bindSearchOverlayTapClose();
  const q = (sin.value||"").toLowerCase().trim();
  if(!q){ box.innerHTML = ""; return; }

  const results = apps.filter(function(a){
    return ((a.name||"").toLowerCase().includes(q) ||
      (a.category||"").toLowerCase().includes(q) ||
      (a.description||"").toLowerCase().includes(q) ||
      (a.tags||[]).some(function(t){ return (t||"").toLowerCase().includes(q); })
    );
  }).slice(0,20);

  if(results.length === 0){
    box.innerHTML = '\
      <div class="no-results">\
        <div>No results</div>\
        <small class="muted">Tap anywhere outside the search bar to go back</small>\
      </div>\
    ';
    return;
  }

  box.innerHTML = results.map(function(a){
    return '\
    <div class="search-result" data-id="'+a.id+'">\
      <img loading="lazy" decoding="async" src="'+a.icon+'" alt="'+a.name+'" style="width:36px;height:36px;border-radius:8px;border:1px solid var(--border)">\
      <div style="flex:1">\
        <div style="font-weight:600">'+a.name+'</div>\
        <div class="meta">'+a.category+' • ⭐ '+((a.rating||0).toFixed(1))+' • '+(a.sizeMB||0)+' MB</div>\
      </div>\
      <button class="btn" data-dl="'+a.id+'">Download</button>\
    </div>\
  ';
  }).join('');

  $$(".search-result").forEach(function(row){
    row.addEventListener("click", function(e){
      if(e.target.closest("button")) return;
      location.hash = '#/app/'+row.getAttribute("data-id");
      closeSearch();
    });
  });
  $$(".search-result .btn").forEach(function(btn){
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      const id = e.currentTarget.getAttribute("data-dl");
      location.hash = '#/download/'+id+'/step/1';
      closeSearch();
    });
  });
}

/* Skeleton loaders */
function skeletonCardsHTML(n){
  n = n || 8;
  return Array(n).fill(0).map(function(){
    return '\
    <div class="card">\
      <div class="card-header">\
        <div class="skel-icon"></div>\
        <div style="flex:1;display:grid;gap:8px">\
          <div class="skel skel-line" style="width:70%"></div>\
          <div class="skel skel-line" style="width:50%"></div>\
        </div>\
      </div>\
      <div class="skel skel-line" style="height:28px;border-radius:10px"></div>\
    </div>\
  ';
  }).join('');
}
function skeletonHomeHTML(){
  return '\
    <section class="section hero">\
      <h1>Find trusted APKs faster</h1>\
      <p class="muted">Explore, verify, and download</p>\
      <div class="tags">\
        '+["Games","Tools","Productivity","Social","Security","Video"].map(function(c){ return '<span class="chip">'+c+'</span>'; }).join('')+'\
      </div>\
    </section>\
    <section class="section">\
      <h2>Trending Apps</h2>\
      <div class="grid">'+skeletonCardsHTML(8)+'</div>\
    </section>\
    <section class="section">\
      <h2>New Updates</h2>\
      <div class="grid">'+skeletonCardsHTML(8)+'</div>\
    </section>\
  ';
}

/* Network status (no SW) */
function bindNetworkStatus(){
  const bar = $("#netStatus");
  function show(msg){
    if(!bar) return;
    bar.textContent = msg;
    bar.classList.remove('hidden');
    bar.classList.add('show');
    setTimeout(function(){ bar.classList.remove('show'); }, 1600);
  }
  window.addEventListener('online', function(){ show('Back online'); });
  window.addEventListener('offline', function(){ show('You are offline'); });
  if(!navigator.onLine){ show('You are offline'); }
}

