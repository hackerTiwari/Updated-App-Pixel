/* App‑Pixel • Standalone Responsive Webapp (No Firebase)
   - Mobile-first, fluid grid, light/dark theme + skins
   - Search overlay, detail page (zoomable screenshots)
   - 3-step download flow with countdown
   - Download history + Profile (localStorage)
   - Admin (localStorage CRUD)
   - No optional chaining; works on older browsers too
*/

(function(){
  'use strict';

  /* ------- Data (Demo) ------- */
  var DEMO_APPS = [
    { id:"whatsapp", name:"WhatsApp Messenger", icon:"https://via.placeholder.com/96?text=W",
      category:"Communication", sizeMB:45, rating:4.5, version:"2.24.9", verified:true,
      tags:["chat","secure"], screenshots:["https://via.placeholder.com/800x450?text=WhatsApp+1","https://via.placeholder.com/800x450?text=WhatsApp+2"],
      description:"Fast, simple, and secure messaging.", permissions:["Contacts","Storage"], downloadLink:"https://example.com/whatsapp.apk", published:true, updatedAt: Date.now()-86400000 },
    { id:"yt", name:"YouTube", icon:"https://via.placeholder.com/96?text=YT",
      category:"Video", sizeMB:78, rating:4.6, version:"19.12", verified:true,
      tags:["video","stream"], screenshots:["https://via.placeholder.com/800x450?text=YouTube+1","https://via.placeholder.com/800x450?text=YouTube+2"],
      description:"Enjoy your favorite videos and creators.", permissions:["Network"], downloadLink:"https://example.com/youtube.apk", published:true, updatedAt: Date.now()-172800000 },
    { id:"snapseed", name:"Snapseed", icon:"https://via.placeholder.com/96?text=SN",
      category:"Photography", sizeMB:32, rating:4.4, version:"2.20", verified:false,
      tags:["editor","filters"], screenshots:["https://via.placeholder.com/800x450?text=Snapseed+1"], description:"Professional photo editor.",
      permissions:["Storage","Camera"], downloadLink:"https://example.com/snapseed.apk", published:true, updatedAt: Date.now()-7200000 },
    { id:"spotify", name:"Spotify Music", icon:"https://via.placeholder.com/96?text=SP",
      category:"Music", sizeMB:60, rating:4.7, version:"8.9.12", verified:true,
      tags:["music","streaming"], screenshots:["https://via.placeholder.com/800x450?text=Spotify+1"], description:"Music for everyone.",
      permissions:["Network"], downloadLink:"https://example.com/spotify.apk", published:true, updatedAt: Date.now()-3600000 },
    { id:"mxplayer", name:"MX Player", icon:"https://via.placeholder.com/96?text=MX",
      category:"Video", sizeMB:55, rating:4.3, version:"1.78", verified:true,
      tags:["player","local"], screenshots:["https://via.placeholder.com/800x450?text=MX+1"], description:"Powerful video player.",
      permissions:["Storage"], downloadLink:"https://example.com/mxplayer.apk", published:true, updatedAt: Date.now()-5400000 },
    { id:"telegram", name:"Telegram", icon:"https://via.placeholder.com/96?text=T",
      category:"Communication", sizeMB:38, rating:4.4, version:"10.3", verified:true,
      tags:["chat","cloud"], screenshots:["https://via.placeholder.com/800x450?text=Telegram+1"], description:"Cloud-based messaging.",
      permissions:["Contacts","Storage"], downloadLink:"https://example.com/telegram.apk", published:true, updatedAt: Date.now()-2800000 },
    { id:"instagram", name:"Instagram", icon:"https://via.placeholder.com/96?text=IG",
      category:"Photography", sizeMB:62, rating:4.2, version:"326.0", verified:true,
      tags:["social","photo"], screenshots:["https://via.placeholder.com/800x450?text=Instagram+1"], description:"Photos and Reels.",
      permissions:["Camera","Storage"], downloadLink:"https://example.com/instagram.apk", published:true, updatedAt: Date.now()-990000 },
    { id:"gpay", name:"Google Pay", icon:"https://via.placeholder.com/96?text=GP",
      category:"Finance", sizeMB:28, rating:4.3, version:"210.1", verified:true,
      tags:["upi","payments"], screenshots:["https://via.placeholder.com/800x450?text=GPay+1"], description:"Simple, secure payments.",
      permissions:["SMS","Network"], downloadLink:"https://example.com/gpay.apk", published:true, updatedAt: Date.now()-11000000 },
    { id:"sheets", name:"Google Sheets", icon:"https://via.placeholder.com/96?text=GS",
      category:"Productivity", sizeMB:25, rating:4.1, version:"1.24", verified:true,
      tags:["office","excel"], screenshots:["https://via.placeholder.com/800x450?text=Sheets+1"], description:"Create and edit spreadsheets.",
      permissions:["Storage"], downloadLink:"https://example.com/sheets.apk", published:true, updatedAt: Date.now()-21000000 },
    { id:"maps", name:"Google Maps", icon:"https://via.placeholder.com/96?text=MP",
      category:"Maps", sizeMB:70, rating:4.6, version:"11.126", verified:true,
      tags:["navigation","offline"], screenshots:["https://via.placeholder.com/800x450?text=Maps+1"], description:"Navigate your world.",
      permissions:["Location","Network"], downloadLink:"https://example.com/maps.apk", published:true, updatedAt: Date.now()-3500000 },
    { id:"snapchat", name:"Snapchat", icon:"https://via.placeholder.com/96?text=SC",
      category:"Social", sizeMB:50, rating:4.0, version:"12.69", verified:false,
      tags:["camera","chat"], screenshots:["https://via.placeholder.com/800x450?text=Snapchat+1"], description:"Fun filters & chat.",
      permissions:["Camera","Storage"], downloadLink:"https://example.com/snapchat.apk", published:true, updatedAt: Date.now()-6500000 },
    { id:"notion", name:"Notion", icon:"https://via.placeholder.com/96?text=N",
      category:"Productivity", sizeMB:40, rating:4.6, version:"1.5.98", verified:true,
      tags:["notes","wiki"], screenshots:["https://via.placeholder.com/800x450?text=Notion+1"], description:"All-in-one workspace.",
      permissions:["Storage","Network"], downloadLink:"https://example.com/notion.apk", published:true, updatedAt: Date.now()-12500000 }
  ];
  var CATEGORIES = ["Games","Tools","Productivity","Social","Entertainment","Photography","Music","Video","Personalization","Health","Education","Finance","Shopping","Communication","Security","Travel","Maps","News","Weather","Utilities"];

  /* ------- State ------- */
  var apps = JSON.parse(localStorage.getItem("apx_apps") || "null") || DEMO_APPS.slice();
  var userProfile = JSON.parse(localStorage.getItem("apx_user") || "null") || { name: "Guest", email: "guest@example.com", avatar: "" };
  var historyList = JSON.parse(localStorage.getItem("apx_history") || "[]");

  /* ------- Utils ------- */
  function $(s){ return document.querySelector(s); }
  function $$(s){ return document.querySelectorAll(s); }
  function toast(msg){ var t=$("#toast"); if(!t) return; t.textContent=msg; t.classList.add("show"); setTimeout(function(){ t.classList.remove("show"); }, 1600); }
  function saveApps(){ localStorage.setItem("apx_apps", JSON.stringify(apps)); }
  function saveHistory(){ localStorage.setItem("apx_history", JSON.stringify(historyList)); }
  function saveUser(){ localStorage.setItem("apx_user", JSON.stringify(userProfile)); updateDrawerUser(); }
  function slug(s){ return (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,50) || ("app-"+Date.now()); }
  function asMillis(ts){ if(!ts) return 0; var n = new Date(ts).getTime(); return isNaN(n)?0:n; }

  /* Theme + skin */
  var THEME_KEY="apx_theme", SKIN_KEY="apx_skin", SKINS=["nebula","sunset","mint"];
  function applyTheme(t){
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(THEME_KEY, t);
    var btn=$("#btnTheme"); if(btn) btn.textContent = t==="dark"?"☀️":"🌙";
    var meta=document.querySelector('meta[name="theme-color"]'); if(meta) meta.setAttribute("content", t==="dark"?"#0B1220":"#2563EB");
  }
  function initTheme(){ var saved=localStorage.getItem(THEME_KEY); var prefers=window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches; applyTheme(saved||(prefers?"dark":"light")); }
  function applySkin(s){ document.documentElement.setAttribute("data-skin", s); localStorage.setItem(SKIN_KEY, s); var b=$("#btnSkin"); if(b){ b.textContent = s==="sunset"?"🌅":(s==="mint"?"🌿":"🎨"); } }
  function initSkin(){ applySkin(localStorage.getItem(SKIN_KEY)||"nebula"); }

  /* Share / Copy */
  function copyText(text){
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    var ta=document.createElement("textarea"); ta.value=text; ta.style.position="fixed"; ta.style.left="-9999px"; document.body.appendChild(ta); ta.focus(); ta.select();
    try{ document.execCommand("copy"); }catch(e){} ta.remove(); return Promise.resolve();
  }
  function shareLink(url, title, text){
    title=title||"App‑Pixel"; text=text||"Check this app on App‑Pixel";
    if(navigator.share){ return navigator.share({title:title, text:text, url:url}).then(function(){return true;}).catch(function(){return copyText(url).then(function(){return false;});}); }
    return copyText(url).then(function(){ return false; });
  }
  function normalizeUrl(u){ if(!u) return ""; var s=u.trim(); if(/^https?:\/\//i.test(s)) return s; if(/^\/\//.test(s)) return "https:"+s; return "https://"+s.replace(/^\/+/, ""); }
  function safeOpen(u){
    var url = normalizeUrl(u); if(!url){ toast("Download link missing"); return; }
    var a=document.createElement("a"); a.href=url; a.target="_blank"; a.rel="noopener noreferrer"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ if(document.visibilityState==="visible") toast("Popup blocked? Allow popups and tap again."); }, 300);
  }

  /* Stars + badge */
  var STAR_SVG = '<svg viewBox="0 0 20 20" class="star" aria-hidden="true"><path fill="currentColor" d="M10 1.6l2.47 5.02 5.53.8-4 3.9.95 5.5L10 14.9 5.05 16.9 6 11.3 2 7.42l5.53-.8L10 1.6z"/></svg>';
  function starsRow(){ return Array(5).fill(STAR_SVG).join(''); }
  function ratingStars(val){
    var r=Math.max(0,Math.min(5,Number(val)||0)); var pct=(r/5)*100;
    return '<span class="rating" aria-label="Rating '+r.toFixed(1)+' of 5">'+
      '<span class="stars">'+
        '<span class="row bg">'+starsRow()+'</span>'+
        '<span class="row fg" style="width:'+pct+'%">'+starsRow()+'</span>'+
      '</span>'+
      '<span class="score">'+r.toFixed(1)+'</span>'+
    '</span>';
  }
  var VERIFIED_BADGE = '<span class="badge badge-verify" title="Verified"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2 3 7v6c0 5 5 9 9 9s9-4 9-9V7l-9-5zm-1 13.2-3.2-3.2 1.4-1.4L11 12.6l4.8-4.8 1.4 1.4L11 15.2z"/></svg>Verified</span>';

  /* Lightbox */
  var iv={ items:[], index:0 };
  function bindLightbox(){
    var root=$("#imgViewer"); if(!root) return;
    var c=$("#ivClose"), p=$("#ivPrev"), n=$("#ivNext");
    if(c) c.addEventListener("click", closeViewer);
    if(p) p.addEventListener("click", function(){ showViewer(iv.index-1); });
    if(n) n.addEventListener("click", function(){ showViewer(iv.index+1); });
    root.addEventListener("click", function(e){ if(e.target===root) closeViewer(); });
    document.addEventListener("keydown", function(e){
      if(!root.classList.contains("show")) return;
      if(e.key==="Escape") closeViewer();
      if(e.key==="ArrowRight") showViewer(iv.index+1);
      if(e.key==="ArrowLeft") showViewer(iv.index-1);
    });
  }
  function openViewer(items, start){ start=start||0; iv.items=(items||[]).filter(Boolean); if(!iv.items.length) return; iv.index=Math.max(0,Math.min(start,iv.items.length-1)); $("#imgViewer").classList.add("show"); showViewer(iv.index); }
  function showViewer(idx){
    if(!iv.items.length) return; iv.index=Math.max(0,Math.min(idx,iv.items.length-1));
    var src=iv.items[iv.index]; var img=$("#ivImg"); if(img){ img.src=src; img.alt="preview"; }
    var open=$("#ivOpen"); if(open) open.href=src;
    var prev=$("#ivPrev"), next=$("#ivNext"); var hasMany=iv.items.length>1;
    if(prev) prev.style.display=(hasMany && iv.index>0)?"block":"none";
    if(next) next.style.display=(hasMany && iv.index<iv.items.length-1)?"block":"none";
  }
  function closeViewer(){ var root=$("#imgViewer"); root.classList.remove("show"); var img=$("#ivImg"); if(img) img.src=""; }

  /* Search overlay tap-close */
  function bindSearchOverlayTapClose(){
    var ov=$("#searchOverlay"); if(!ov) return;
    ov.onclick=function(e){
      if(e.target.closest(".search-box")) return;
      if(e.target.closest(".search-result")) return;
      closeSearch();
    };
  }

  /* Network status */
  function bindNetworkStatus(){
    var bar=$("#netStatus");
    function show(msg){
      if(!bar) return;
      bar.textContent=msg;
      bar.classList.remove("hidden");
      bar.classList.add("show");
      setTimeout(function(){ bar.classList.remove("show"); }, 1600);
    }
    window.addEventListener("online", function(){ show("Back online"); });
    window.addEventListener("offline", function(){ show("You are offline"); });
    if(!navigator.onLine){ show("You are offline"); }
  }

  /* Chrome bindings */
  window.addEventListener("DOMContentLoaded", function(){
    var yr=new Date().getFullYear(); var y1=$("#year"); if(y1) y1.textContent=yr; var y2=$("#yearFoot"); if(y2) y2.textContent=yr;
    initSkin(); initTheme(); bindLightbox(); bindChrome(); bindNetworkStatus(); updateDrawerUser(); router();
  });
  window.addEventListener("hashchange", router);

  function bindChrome(){
    var go=$("#goHome"); if(go){ go.addEventListener("click", function(){ location.hash="#/home"; }); go.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); location.hash="#/home"; } }); }
    var skin=$("#btnSkin"); if(skin){ skin.addEventListener("click", function(){ var cur=document.documentElement.getAttribute("data-skin")||"nebula"; var i=SKINS.indexOf(cur); var next=SKINS[(i>=0?i:0)+1>=SKINS.length?0:i+1]; applySkin(next); }); }
    var m=$("#btnMenu"); if(m) m.addEventListener("click", openDrawer);
    var c=$("#btnDrawerClose"); if(c) c.addEventListener("click", closeDrawer);
    var ov=$("#overlay"); if(ov) ov.addEventListener("click", function(){ closeDrawer(); closeSearch(); });
    var sb=$("#btnSearch"); if(sb) sb.addEventListener("click", openSearch);
    var sc=$("#searchClose"); if(sc) sc.addEventListener("click", closeSearch);
    var sin=$("#searchInput"); var t;
    if(sin){ sin.addEventListener("input", function(){ clearTimeout(t); t=setTimeout(handleSearch, 90); }); }
    document.addEventListener("keydown", function(e){
      if(e.key==="Escape"){ closeSearch(); closeDrawer(); }
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==="k"){ e.preventDefault(); openSearch(); }
      if(!e.ctrlKey && !e.metaKey && e.key==="/"){ e.preventDefault(); openSearch(); }
      if(!e.ctrlKey && !e.metaKey && e.key.toLowerCase()==="t"){ var cur=document.documentElement.getAttribute("data-theme")||"light"; applyTheme(cur==="dark"?"light":"dark"); }
    });
    var th=$("#btnTheme"); if(th){ th.addEventListener("click", function(){ var cur=document.documentElement.getAttribute("data-theme")||"light"; applyTheme(cur==="dark"?"light":"dark"); }); }
    $$(".drawer-nav a").forEach(function(a){ a.addEventListener("click", function(){ closeDrawer(); closeSearch(); }); });
  }

  function openDrawer(){ var dr=$("#drawer"); if(!dr) return; dr.classList.add("open"); dr.setAttribute("aria-hidden","false"); $("#overlay").classList.add("show"); setTimeout(function(){ var a=dr.querySelector("a"); if(a) a.focus(); }, 10); }
  function closeDrawer(){ var dr=$("#drawer"); if(!dr) return; dr.classList.remove("open"); dr.setAttribute("aria-hidden","true"); $("#overlay").classList.remove("show"); }

  function openSearch(){ var so=$("#searchOverlay"), ov=$("#overlay"), sin=$("#searchInput"), res=$("#searchResults"); if(so) so.classList.add("show"); if(ov) ov.classList.add("show"); if(sin) sin.value=""; if(res) res.innerHTML=""; bindSearchOverlayTapClose(); if(sin) sin.focus(); }
  function closeSearch(){ var so=$("#searchOverlay"), ov=$("#overlay"); if(so) so.classList.remove("show"); if(ov) ov.classList.remove("show"); }

  function updateDrawerUser(){
    var nameEl=$("#drawerName"), emailEl=$("#drawerEmail"), av=$("#drawerAvatar");
    if(nameEl) nameEl.textContent=userProfile.name||"Guest";
    if(emailEl) emailEl.textContent=userProfile.email||"guest@example.com";
    if(av){
      if(userProfile.avatar){ av.style.background='url("'+userProfile.avatar+'") center/cover no-repeat'; av.textContent=""; }
      else{ av.style.background="linear-gradient(135deg,var(--primary),var(--accent))"; av.textContent=(userProfile.name||"G").slice(0,1).toUpperCase(); }
    }
  }

  /* ------- Router ------- */
  function router(){
    clearStickyCTA(); closeDrawer();
    var h=location.hash||"#/home"; var parts=h.replace(/^#\//,"").split("/"); var view=parts[0]||"home";
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
    window.scrollTo({top:0, behavior:"instant"});
  }

  /* ------- Home ------- */
  function renderHome(){
    var el=$("#view"); if(!el) return;
    if(!apps||apps.length===0){ el.innerHTML=skeletonHomeHTML(); return; }
    var trending=apps.slice().sort(function(a,b){return (b.rating||0)-(a.rating||0);}).slice(0,8);
    var updates=apps.slice().sort(function(a,b){return (asMillis(b.updatedAt))-(asMillis(a.updatedAt));}).slice(0,8);
    el.innerHTML =
      '<section class="section hero">'+
        '<h1>Find trusted APKs faster</h1>'+
        '<p class="muted">Explore, verify, and download</p>'+
        '<div class="tags" style="margin-top:12px;overflow:auto;white-space:nowrap;padding-bottom:4px;">'+
          CATEGORIES.map(function(c){ return '<button class="chip" data-cat="'+c+'">'+c+'</button>'; }).join('')+
        '</div>'+
      '</section>'+
      '<section class="section"><h2>Trending Apps</h2>'+
        '<div class="grid" id="gridTrending">'+(trending.map(appCard).join('') || '<div class="muted">No apps yet</div>')+'</div>'+
      '</section>'+
      '<section class="section"><h2>New Updates</h2>'+
        '<div class="grid" id="gridUpdates">'+(updates.map(appCard).join('') || '')+'</div>'+
      '</section>'+
      '<section class="section"><h2>Categories</h2>'+
        '<div class="grid">'+CATEGORIES.slice(0,12).map(categoryTile).join('')+'</div>'+
      '</section>';

    bindHomeGridButtons();

    /* Category filter chips */
    $$(".hero .chip").forEach(function(ch){
      ch.addEventListener("click", function(){
        var c=ch.getAttribute("data-cat");
        $$(".hero .chip").forEach(function(x){ x.classList.remove("on"); });
        ch.classList.add("on");
        var filtered=apps.filter(function(a){ return a.category===c; });
        var tEl=$("#gridTrending"), uEl=$("#gridUpdates");
        if(tEl) tEl.innerHTML = filtered.slice(0,8).map(appCard).join('') || '<div class="muted">No apps in '+c+'</div>';
        if(uEl) uEl.innerHTML = "";
        bindHomeGridButtons();
      });
    });

    /* Category tiles Explore buttons */
    $$(".cat-filter").forEach(function(btn){
      btn.addEventListener("click", function(){
        openSearch(); var sin=$("#searchInput");
        if(sin){ sin.value=btn.getAttribute("data-filter-cat"); handleSearch(); }
      });
    });
  }

  function appCard(a){
    return '<div class="card">'+
      '<div class="card-header">'+
        '<img class="app-icon" loading="lazy" decoding="async" src="'+(a.icon||"")+'" alt="'+(a.name||"App")+' icon" onerror="this.src=\'https://via.placeholder.com/96?text=App\'">'+
        '<div><div class="app-title">'+(a.name||"")+'</div>'+
        '<div class="meta">'+
          ratingStars(a.rating||0)+
          '<span class="dot">•</span> '+(a.sizeMB||0)+' MB'+
          '<span class="dot">•</span> '+(a.category||"")+
        '</div></div>'+
      '</div>'+
      '<div class="tags">'+
        (a.verified?VERIFIED_BADGE:'')+
        (a.tags||[]).slice(0,2).map(function(t){return '<span class="chip">'+t+'</span>';}).join('')+
      '</div>'+
      '<div class="controls">'+
        '<button class="btn ghost details" data-id="'+a.id+'">Details</button>'+
        '<button class="btn primary download" data-id="'+a.id+'">Download</button>'+
      '</div>'+
    '</div>';
  }

  function categoryTile(c){
    return '<div class="card" style="align-items:center;text-align:center;gap:8px;">'+
      '<div class="avatar" style="width:54px;height:54px;border-radius:14px;">'+c.slice(0,1)+'</div>'+
      '<div style="font-weight:600">'+c+'</div>'+
      '<button class="btn ghost cat-filter" data-filter-cat="'+c+'">Explore</button>'+
    '</div>';
  }

  function bindHomeGridButtons(){
    $$(".card .btn.details").forEach(function(btn){
      btn.addEventListener("click", function(e){ location.hash='#/app/'+ e.currentTarget.getAttribute("data-id"); });
    });
    $$(".card .btn.download").forEach(function(btn){
      btn.addEventListener("click", function(e){ location.hash='#/download/'+ e.currentTarget.getAttribute("data-id") + '/step/1'; });
    });
  }

  /* ------- App Detail ------- */
  function renderAppDetail(id){
    var a = apps.find(function(x){ return x.id===id; });
    var el=$("#view"); if(!el) return;
    if(!a){ el.innerHTML='<div class="muted">App not found.</div>'; return; }
    var hasShots = a.screenshots && a.screenshots.length>0;
    el.innerHTML =
      '<section class="detail-head">'+
        '<img class="app-icon zoomable" loading="lazy" decoding="async" src="'+a.icon+'" alt="'+a.name+'" style="width:96px;height:96px;border-radius:20px;">'+
        '<div style="flex:1">'+
          '<h2 style="margin:0 0 6px">'+a.name+'</h2>'+
          '<div class="detail-meta">'+
            ratingStars(a.rating||0)+
            '<span>'+(a.sizeMB||0)+' MB</span>'+
            '<span>v'+(a.version||"1.0.0")+'</span>'+
            '<span>'+(a.category||"")+'</span>'+
            (a.verified?VERIFIED_BADGE:'')+
          '</div>'+
          '<div class="controls" style="margin-top:10px;">'+
            '<button class="btn primary" id="dlFromDetail">Download (Free)</button>'+
            '<button class="btn ghost" id="shareBtn">Share</button>'+
          '</div>'+
          '<div class="muted" style="margin-top:6px;">Verified link • Last scanned: 24h</div>'+
        '</div>'+
      '</section>'+
      '<section class="section"><h2>About</h2><p>'+(a.description||"")+'</p></section>'+
      (hasShots?
        '<section class="section"><h2>Screenshots</h2><div class="screens">'+
          a.screenshots.map(function(s){ return '<img class="zoomable" loading="lazy" decoding="async" src="'+s+'" alt="screenshot" onerror="this.remove()">'; }).join('')+
        '</div></section>':'')+
      '<section class="section"><h2>Permissions</h2><div class="tags">'+
        ((a.permissions||[]).map(function(p){ return '<span class="chip">'+p+'</span>'; }).join('') || '<span class="muted">No special permissions</span>')+
      '</div></section>'+
      '<section class="section"><h2>Similar</h2><div class="grid">'+
        (apps.filter(function(x){ return x.category===a.category && x.id!==a.id; }).slice(0,4).map(appCard).join('') || '<div class="muted">No similar apps</div>')+
      '</div></section>';

    var dld=$("#dlFromDetail"); if(dld) dld.addEventListener("click", function(){ location.hash='#/download/'+a.id+'/step/1'; });
    $$(".grid .btn.details").forEach(function(btn){ btn.addEventListener("click", function(e){ location.hash='#/app/'+ e.currentTarget.getAttribute("data-id"); }); });
    $$(".grid .btn.download").forEach(function(btn){ btn.addEventListener("click", function(e){ location.hash='#/download/'+ e.currentTarget.getAttribute("data-id") + '/step/1'; }); });

    var sb=$("#shareBtn"); if(sb){ sb.addEventListener("click", function(){ shareLink(window.location.href, a.name, 'Download '+a.name+' on App‑Pixel').then(function(ok){ toast(ok?'Shared':'Link copied'); }); }); }

    var iconEl=document.querySelector(".detail-head .app-icon"); if(iconEl) iconEl.addEventListener("click", function(){ openViewer([a.icon], 0); });
    var shotEls=document.querySelectorAll(".screens img"); if(shotEls){ shotEls.forEach(function(im,i){ im.addEventListener("click", function(){ openViewer(a.screenshots, i); }); }); }

    setupStickyCTA(a);
  }

  /* ------- Sticky CTA (mobile) ------- */
  function setupStickyCTA(app){
    document.querySelectorAll(".sticky-cta").forEach(function(n){ n.remove(); });
    if(window.matchMedia("(min-width:768px)").matches) return;
    var bar=document.createElement("div");
    bar.className="sticky-cta";
    bar.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px">'+
        '<img loading="lazy" decoding="async" src="'+app.icon+'" class="app-icon" style="width:40px;height:40px;border-radius:10px" alt="'+app.name+'">'+
        '<div><div class="title">'+app.name+'</div><div class="meta">v'+(app.version||"1.0.0")+' • '+(app.sizeMB||0)+' MB</div></div>'+
      '</div>'+
      '<button class="btn primary" style="height:44px" id="stickyDownload">Download</button>';
    document.body.appendChild(bar);
    var b=bar.querySelector("#stickyDownload"); if(b) b.addEventListener("click", function(){ location.hash='#/download/'+app.id+'/step/1'; });
  }
  function clearStickyCTA(){ document.querySelectorAll(".sticky-cta").forEach(function(n){ n.remove(); }); }

  /* ------- Download flow ------- */
  var countdownTimer=null;
  function renderDownloadStep(id, step){ if(!step) step=1;
    var a=apps.find(function(x){ return x.id===id; }); var el=$("#view"); if(!el) return;
    if(!a){ el.innerHTML='<section class="step-wrap"><div class="muted">Loading…</div></section>'; return; }
    clearInterval(countdownTimer);
    var dots=[1,2,3].map(function(n){ return '<div class="dot '+(n===step?'active':'')+'"></div>'; }).join('');
    el.innerHTML =
      '<section class="step-wrap">'+
        '<div class="stepper">'+dots+'<div style="margin-left:8px" class="muted">Step '+step+' of 3</div></div>'+
        '<h2 style="margin:0 0 8px;">Prepare download • '+a.name+'</h2>'+
        (step<3?
          ('<div class="ad-box">Ad space (placeholder)</div>'+
          '<div class="countdown" id="countdown">Please wait 5s</div>'+
          '<div class="controls">'+
            '<button id="btnContinue" class="btn primary" disabled>Continue..</button>'+
            '<button class="btn ghost" id="btnBackApp">Back to app</button>'+
          '</div>')
        :
          ('<div class="card" style="display:flex;align-items:center;gap:12px;">'+
            '<img class="app-icon" src="'+a.icon+'" style="width:56px;height:56px;border-radius:14px;" alt="">'+
            '<div><div style="font-weight:600">'+a.name+'</div><div class="meta">v'+(a.version||"1.0.0")+' • '+(a.sizeMB||0)+' MB</div></div>'+
          '</div>'+
          '<div class="controls" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">'+
            '<button class="btn primary" id="finalLink">Get download link</button>'+
            '<button class="btn ghost" id="copyLink">Copy link</button>'+
            '<button class="btn ghost" id="btnBackApp">Back to app</button>'+
          '</div>'+
          '<div class="muted" style="margin-top:6px;">Link valid for 24 hours • If not working, try again</div>')
        )+
      '</section>';

    var back=$("#btnBackApp"); if(back) back.addEventListener("click", function(){ location.hash='#/app/'+a.id; });

    if(step<3){
      var remaining=5; var cd=$("#countdown"); var btn=$("#btnContinue");
      if(cd) cd.textContent='Please wait '+remaining+'s';
      countdownTimer=setInterval(function(){
        remaining--; if(cd) cd.textContent='Please wait '+remaining+'s';
        if(remaining<=0){ clearInterval(countdownTimer); if(btn) btn.disabled=false; if(cd) cd.textContent="You can continue"; }
      }, 1000);
      if(btn) btn.addEventListener("click", function(){ location.hash='#/download/'+id+'/step/'+(step+1); });
    } else {
      var copyBtn=$("#copyLink"); var finalBtn=$("#finalLink");
      if(copyBtn) copyBtn.addEventListener("click", function(){ copyText(a.downloadLink).then(function(){ toast("Link copied"); }); });
      if(finalBtn) finalBtn.addEventListener("click", function(e){
        e.preventDefault(); e.stopPropagation();
        historyList.unshift({ id:a.id, name:a.name, version:a.version, icon:a.icon, time:new Date().toISOString(), sizeMB:a.sizeMB });
        historyList=historyList.slice(0,200); saveHistory(); safeOpen(a.downloadLink);
      });
    }
  }

  /* ------- Profile ------- */
  function renderProfile(){
    var u=userProfile; var el=$("#view"); if(!el) return;
    el.innerHTML =
      '<section class="section">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">'+
          '<h2 style="margin:0">Profile</h2>'+
          '<button class="btn ghost" onclick="location.hash=\'#/home\'">Back to Home</button>'+
        '</div>'+
        '<div class="form" style="max-width:460px">'+
          '<div class="input"><label>Name</label><input id="pName" value="'+(u.name||"")+'" placeholder="Your name"></div>'+
          '<div class="input"><label>Email</label><input id="pEmail" value="'+(u.email||"")+'" placeholder="you@example.com" inputmode="email"></div>'+
          '<div class="input"><label>Avatar URL</label><input id="pAvatar" value="'+(u.avatar||"")+'" placeholder="https://..."></div>'+
          '<div class="controls"><button id="saveProfile" class="btn primary">Save</button></div>'+
        '</div>'+
      '</section>';
    var sv=$("#saveProfile"); if(sv) sv.addEventListener("click", function(){
      userProfile.name=($("#pName").value||"").trim()||"Guest";
      userProfile.email=($("#pEmail").value||"").trim()||"guest@example.com";
      userProfile.avatar=($("#pAvatar").value||"").trim();
      saveUser(); toast("Profile saved");
    });
  }

  /* ------- History ------- */
  function renderHistory(){
    var items=historyList; var el=$("#view"); if(!el) return;
    el.innerHTML =
      '<section class="section">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">'+
          '<h2 style="margin:0">Download History</h2>'+
          '<div class="controls">'+
            '<button class="btn ghost" onclick="location.hash=\'#/home\'">Back to Home</button>'+
            (items.length?'<button class="btn ghost" id="btnClearHistory">Clear history</button>':'')+
          '</div>'+
        '</div>'+
        (items.length===0?
          ('<div class="card" style="text-align:center;">'+
            '<div class="muted">Abhi koi download nahi hai. Explore karein!</div>'+
            '<div class="controls" style="justify-content:center;margin-top:8px;"><button class="btn ghost" onclick="location.hash=\'#/home\'">Explore apps</button></div>'+
          '</div>')
        :
          ('<div class="list">'+
            items.map(function(it){
              return '<div class="list-item">'+
                '<img src="'+it.icon+'" class="app-icon" style="width:44px;height:44px;border-radius:12px;" alt="">'+
                '<div style="flex:1"><div style="font-weight:600">'+it.name+'</div>'+
                '<div class="meta">v'+it.version+' • '+it.sizeMB+' MB • '+new Date(it.time).toLocaleString()+'</div></div>'+
                '<button class="btn ghost" onclick="location.hash=\'#/download/'+it.id+'/step/1\'">Re‑download</button>'+
                '<button class="btn" onclick="location.hash=\'#/app/'+it.id+'\'">Details</button>'+
              '</div>';
            }).join('')+
          '</div>')
        )+
      '</section>';
    var clr=$("#btnClearHistory"); if(clr) clr.addEventListener("click", function(){ if(!confirm("Clear all download history?")) return; historyList=[]; saveHistory(); renderHistory(); toast("History cleared"); });
  }

  /* ------- Admin (localStorage CRUD) ------- */
  function renderAdmin(){
    var el=$("#view"); if(!el) return;
    el.innerHTML =
      '<section class="section">'+
        '<h2>Admin • Add / Edit APK (local)</h2>'+
        '<div class="form">'+
          '<div class="controls" style="margin-bottom:4px;">'+
            '<button class="btn" id="btnNew">New</button>'+
            '<button class="btn" id="btnExport">Export JSON</button>'+
            '<label class="btn">Import JSON <input id="importFile" type="file" accept="application/json" style="display:none"></label>'+
            '<span style="flex:1"></span>'+
            '<button class="btn ghost" onclick="location.hash=\'#/home\'">Back to Home</button>'+
          '</div>'+
          '<div class="input"><label>App ID (doc id)</label><input id="aId" placeholder="e.g., pixel-photo"></div>'+
          '<div class="input"><label>Name</label><input id="aName" placeholder="App name"></div>'+
          '<div class="input"><label>Description</label><textarea id="aDesc" placeholder="Short description"></textarea></div>'+
          '<div class="input"><label>Icon URL</label><input id="aIcon" placeholder="https://..."></div>'+
          '<div class="input"><label>Download Link (final)</label><input id="aLink" placeholder="https://..."></div>'+
          '<div class="input"><label>Category</label><select id="aCat">'+ CATEGORIES.map(function(c){return '<option>'+c+'</option>';}).join('') +'</select></div>'+
          '<div class="controls">'+
            '<div class="input" style="flex:1;min-width:140px"><label>Version</label><input id="aVer" placeholder="1.0.0"></div>'+
            '<div class="input" style="flex:1;min-width:140px"><label>Size (MB)</label><input id="aSize" type="number" placeholder="24" inputmode="numeric"></div>'+
            '<div class="input" style="flex:1;min-width:140px"><label>Rating</label><input id="aRate" type="number" step="0.1" placeholder="4.5" inputmode="decimal"></div>'+
          '</div>'+
          '<div class="controls">'+
            '<div class="input" style="flex:1"><label>Tags (comma)</label><input id="aTags" placeholder="offline, editor"></div>'+
            '<div class="input" style="flex:1"><label>Screenshots (comma URLs)</label><input id="aShots" placeholder="https://img1, https://img2"></div>'+
          '</div>'+
          '<div class="controls">'+
            '<label class="chip"><input id="aVerified" type="checkbox" style="margin-right:8px">Verified</label>'+
            '<label class="chip"><input id="aPublished" type="checkbox" style="margin-right:8px">Published</label>'+
          '</div>'+
          '<div class="controls"><button class="btn primary" id="btnSave">Save / Update</button></div>'+
        '</div>'+
      '</section>'+
      '<section class="section"><h2>Manage APKs</h2><div style="overflow:auto">'+
        '<table class="table"><thead><tr><th>Icon</th><th>Name</th><th>Category</th><th>Version</th><th>Rating</th><th>Published</th><th>Updated</th><th>Actions</th></tr></thead>'+
        '<tbody id="appRows"></tbody></table></div></section>';

    $("#btnNew").addEventListener("click", clearForm);
    $("#btnSave").addEventListener("click", saveFormLocal);
    $("#btnExport").addEventListener("click", exportJSON);
    $("#importFile").addEventListener("change", importJSON);

    renderRows();

    function renderRows(){
      var rows=apps.slice().sort(function(a,b){ return (asMillis(b.updatedAt))-(asMillis(a.updatedAt)); });
      var tb=$("#appRows");
      tb.innerHTML = rows.map(rowHtml).join('') || '<tr><td colspan="8" class="muted">No apps yet</td></tr>';
      $$("#appRows .btn-edit").forEach(function(b){ b.addEventListener("click", function(){ loadIntoForm(b.getAttribute("data-id")); }); });
      $$("#appRows .btn-del").forEach(function(b){ b.addEventListener("click", function(){ delApp(b.getAttribute("data-id")); renderRows(); }); });
    }
    function rowHtml(a){
      var upd=a.updatedAt? new Date(a.updatedAt): null;
      return '<tr>'+
        '<td><img src="'+(a.icon||'')+'" style="width:36px;height:36px;border-radius:8px;border:1px solid var(--border)" alt=""></td>'+
        '<td>'+(a.name||'')+'<div class="meta">'+a.id+'</div></td>'+
        '<td>'+(a.category||'')+'</td>'+
        '<td>'+(a.version||'')+'</td>'+
        '<td>⭐ '+((a.rating||0).toFixed(1))+'</td>'+
        '<td>'+(a.published?'Yes':'No')+'</td>'+
        '<td>'+(upd?upd.toLocaleDateString():'—')+'</td>'+
        '<td><div class="controls">'+
          '<button class="btn btn-edit" data-id="'+a.id+'">Edit</button>'+
          '<button class="btn btn-del" data-id="'+a.id+'">Delete</button>'+
        '</div></td>'+
      '</tr>';
    }
    function clearForm(){
      $("#aId").value=""; $("#aName").value=""; $("#aDesc").value="";
      $("#aIcon").value=""; $("#aLink").value=""; $("#aCat").value="Tools";
      $("#aVer").value="1.0.0"; $("#aSize").value="1"; $("#aRate").value="0";
      $("#aTags").value=""; $("#aShots").value="";
      $("#aVerified").checked=true; $("#aPublished").checked=true;
    }
    function loadIntoForm(id){
      var a=apps.find(function(x){return x.id===id;}); if(!a) return;
      $("#aId").value=a.id; $("#aName").value=a.name||""; $("#aDesc").value=a.description||"";
      $("#aIcon").value=a.icon||""; $("#aLink").value=a.downloadLink||""; $("#aCat").value=a.category||"Tools";
      $("#aVer").value=a.version||"1.0.0"; $("#aSize").value=a.sizeMB||"1"; $("#aRate").value=a.rating||"0";
      $("#aTags").value=(a.tags||[]).join(", "); $("#aShots").value=(a.screenshots||[]).join(", ");
      $("#aVerified").checked=!!a.verified; $("#aPublished").checked=!!a.published;
    }
    function saveFormLocal(){
      var id = ($("#aId").value || slug($("#aName").value)).trim();
      var obj = {
        id:id,
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
        updatedAt: Date.now()
      };
      if(!obj.name || !obj.downloadLink){ alert("Name aur download link required."); return; }
      var idx=apps.findIndex(function(x){return x.id===id;});
      if(idx>=0) apps[idx]=obj; else apps.unshift(obj);
      saveApps(); toast("Saved"); renderRows();
    }
    function delApp(id){
      if(!confirm("Delete this app?")) return;
      apps = apps.filter(function(x){ return x.id!==id; });
      saveApps(); toast("Deleted");
    }
    function exportJSON(){
      var blob=new Blob([JSON.stringify(apps,null,2)], {type:"application/json"});
      var a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="apps.json"; a.click();
    }
    function importJSON(e){
      var file=e.target.files[0]; if(!file) return;
      var fr=new FileReader();
      fr.onload=function(){
        try{
          var data=JSON.parse(fr.result);
          if(!Array.isArray(data)) throw new Error("Invalid");
          data.forEach(function(item){
            var id=item.id||slug(item.name);
            var obj={
              id:id,
              name:item.name||"",
              description:item.description||"",
              icon:item.icon||"",
              downloadLink:item.downloadLink||"",
              category:item.category||"Tools",
              version:item.version||"1.0.0",
              sizeMB:Number(item.sizeMB)||0,
              rating:Number(item.rating)||0,
              verified:!!item.verified,
              published:item.published!==false,
              tags:item.tags||[],
              screenshots:item.screenshots||[],
              permissions:item.permissions||[],
              updatedAt: Date.now()
            };
            var idx=apps.findIndex(function(x){return x.id===id;});
            if(idx>=0) apps[idx]=obj; else apps.push(obj);
          });
          saveApps(); toast("Imported"); e.target.value="";
          renderRows();
        }catch(err){ alert("Invalid JSON"); }
      };
      fr.readAsText(file);
    }
  }

  /* ------- About ------- */
  function renderAbout(){
    var el=$("#view");
    el.innerHTML =
      '<section class="section">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">'+
          '<h2 style="margin:0">About App‑Pixel</h2>'+
          '<button class="btn ghost" onclick="location.hash=\'#/home\'">Back to Home</button>'+
        '</div>'+
        '<p>App‑Pixel ek next‑gen APK explorer hai — jahan discovery, trust aur speed ek saath milte hain. No clutter, no confusion. Clean design, verified links aur lightning‑fast experience.</p>'+
        '<h3 style="margin:14px 0 8px;">Kyun App‑Pixel?</h3>'+
        '<div class="tags" style="flex-wrap:wrap">'+
          '<span class="chip">🛡️ Verified sources</span>'+
          '<span class="chip">⚡ Realtime‑like UI</span>'+
          '<span class="chip">🔍 Clear details</span>'+
          '<span class="chip">🌗 Elegant light/dark</span>'+
        '</div>'+
        '<h3 style="margin:16px 0 8px;">Experience that just flows</h3>'+
        '<div class="tags" style="flex-wrap:wrap">'+
          '<span class="chip">🔎 Smart search overlay</span>'+
          '<span class="chip">📸 Zoomable screenshots</span>'+
          '<span class="chip">📱 Sticky download bar</span>'+
          '<span class="chip">🔗 One‑tap share</span>'+
          '<span class="chip">🧭 3‑step safe download</span>'+
        '</div>'+
      '</section>'+
      '<section class="section"><h2>Privacy & Trust</h2>'+
        '<p class="muted">No forced sign‑in. Download history sirf aapke device par (local). Aapka control, aapki choice.</p>'+
      '</section>';
  }

  /* ------- Search ------- */
  function handleSearch(){
    var sin=$("#searchInput"), box=$("#searchResults"); if(!sin||!box) return;
    var q=(sin.value||"").toLowerCase().trim(); bindSearchOverlayTapClose();
    if(!q){ box.innerHTML=""; return; }
    var results=apps.filter(function(a){
      return ((a.name||"").toLowerCase().includes(q) ||
        (a.category||"").toLowerCase().includes(q) ||
        (a.description||"").toLowerCase().includes(q) ||
        (a.tags||[]).some(function(t){ return (t||"").toLowerCase().includes(q); })
      );
    }).slice(0,20);

    if(results.length===0){
      box.innerHTML = '<div class="no-results"><div>No results</div><small class="muted">Tap outside the search bar to go back</small></div>';
      return;
    }
    box.innerHTML = results.map(function(a){
      return '<div class="search-result" data-id="'+a.id+'">'+
        '<img loading="lazy" decoding="async" src="'+a.icon+'" alt="'+a.name+'" style="width:36px;height:36px;border-radius:8px;border:1px solid var(--border)">'+
        '<div style="flex:1"><div style="font-weight:600">'+a.name+'</div><div class="meta">'+a.category+' • ⭐ '+((a.rating||0).toFixed(1))+' • '+(a.sizeMB||0)+' MB</div></div>'+
        '<button class="btn" data-dl="'+a.id+'">Download</button>'+
      '</div>';
    }).join('');

    $$(".search-result").forEach(function(row){
      row.addEventListener("click", function(e){ if(e.target.closest("button")) return; location.hash='#/app/'+row.getAttribute("data-id"); closeSearch(); });
    });
    $$(".search-result .btn").forEach(function(btn){
      btn.addEventListener("click", function(e){ e.stopPropagation(); var id=e.currentTarget.getAttribute("data-dl"); location.hash='#/download/'+id+'/step/1'; closeSearch(); });
    });
  }

  /* ------- Skeletons ------- */
  function skeletonCardsHTML(n){ n=n||8; return Array(n).fill(0).map(function(){ return '<div class="card"><div class="card-header"><div class="skel-icon"></div><div style="flex:1;display:grid;gap:8px"><div class="skel skel-line" style="width:70%"></div><div class="skel skel-line" style="width:50%"></div></div></div><div class="skel skel-line" style="height:28px;border-radius:10px"></div></div>'; }).join(''); }
  function skeletonHomeHTML(){
    return '<section class="section hero"><h1>Find trusted APKs faster</h1><p class="muted">Explore, verify, and download</p><div class="tags">'+["Games","Tools","Productivity","Social","Security","Video"].map(function(c){return '<span class="chip">'+c+'</span>';}).join('')+'</div></section><section class="section"><h2>Trending Apps</h2><div class="grid">'+skeletonCardsHTML(8)+'</div></section><section class="section"><h2>New Updates</h2><div class="grid">'+skeletonCardsHTML(8)+'</div></section>';
  }
})();
