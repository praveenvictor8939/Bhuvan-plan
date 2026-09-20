// Bhuvan Planner service worker: offline shell for the app itself.
// Firebase, Google and other websites are never intercepted, so login keeps working normally.
const CACHE='bhuvan-planner-v1';
const SHELL=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin)return;
  // Pages: try the network first so updates appear, fall back to the saved copy offline.
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put('index.html',copy));return res;}).catch(()=>caches.match('index.html').then(r=>r||caches.match('./'))));
    return;
  }
  // Other same-site files: saved copy first, then network.
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res;})));
});
// Lets PWABuilder detect these features; the planner does not use them yet.
self.addEventListener('sync',()=>{});
self.addEventListener('periodicsync',()=>{});
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{}}catch(x){}
  e.waitUntil(self.registration.showNotification(d.title||'Bhuvan Planner',{body:d.body||'',icon:'icon-192.png'}));
});
