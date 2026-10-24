'use strict';
(() => {
  const days = window.TRIP_DATA;
  const routes = window.TRIP_ROUTES || [];
  const $ = (id) => document.getElementById(id);
  const escape = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const external = 'target="_blank" rel="noopener noreferrer"';
  const searchLink = stop => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${stop.title.split(' · ')[0]} ${stop.address}`)}`;
  let map, layer, markers = [], bounds;
  const tabs = Array.from(document.querySelectorAll('[data-day]'));
  if (window.L) {
    map = L.map('map', {scrollWheelZoom:false, zoomControl:true}).setView([43.06,141.35],10);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom:18
    }).addTo(map);
    tiles.on('tileerror', () => { $('map-error').hidden = false; });
    layer = L.featureGroup().addTo(map);
  } else {
    $('map-error').hidden = false;
    $('reset-map').disabled = true;
  }

  function navigationLink(day) {
    const points = day.driving.map(point => point.join(','));
    const params = new URLSearchParams({api:'1',origin:points[0],destination:points.at(-1),travelmode:'driving'});
    if (points.length > 2) params.set('waypoints',points.slice(1,-1).join('|'));
    return `https://www.google.com/maps/dir/?${params}`;
  }

  function timelineHTML(day) {
    return day.stops.map((stop, index) => `<article class="stop" id="stop-${index}">
      <span class="stop-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span>
      <div class="stop-time">${escape(stop.time)} <span class="stop-tag">${escape(stop.tag)}</span></div>
      <h3 style="margin:0"><button class="stop-title" data-stop="${index}" aria-label="在地圖查看：${escape(stop.title)}">${escape(stop.title)} ↗</button></h3>
      <p>${escape(stop.description)}</p><div class="stop-address">${escape(stop.address)}</div>
      <div class="stop-logistics">P / 交通與停車<br>${escape(stop.parking)}</div>
      <a class="stop-link" href="${searchLink(stop)}" ${external}>位置與導航 ↗</a><a class="stop-link" href="${escape(stop.url)}" ${external}>官方資訊 ↗</a>
      ${stop.next ? `<div class="stop-next">↓ ${escape(stop.next)}</div>` : ''}</article>`).join('');
  }

  function selectStop(index, pan = true) {
    document.querySelectorAll('.stop').forEach((el,i) => el.classList.toggle('active',i===index));
    if (!map) return;
    markers.forEach((marker,i) => marker.getElement()?.classList.toggle('selected',i===index));
    const marker = markers[index];
    if (!marker) return;
    if (pan) map.setView(marker.getLatLng(),Math.max(map.getZoom(),14),{animate:!window.matchMedia('(prefers-reduced-motion: reduce)').matches});
    marker.openPopup();
  }

  function showMap(day,index) {
    if (!map) return;
    layer.clearLayers();
    markers = [];
    const route = routes[index];
    if (route?.geometry) {
      L.geoJSON(route.geometry,{style:{color:'#173e3c',weight:4,opacity:.85}}).addTo(layer);
    }
    if (day.walking.length) {
      L.polyline(day.walking,{color:'#bc7853',weight:3,dashArray:'5,7',opacity:.9}).bindPopup('步行連線示意，非實際步道；請使用導航確認路口。').addTo(layer);
    }
    // Coincident stops share a pin with a tiny visual offset so each remains selectable.
    const used = new Map();
    day.stops.forEach((stop,i) => {
      const key = `${stop.lat},${stop.lng}`;
      const count = used.get(key) || 0;
      used.set(key,count+1);
      const icon = L.divIcon({className:'map-pin',html:`<span>${i+1}</span>`,iconSize:[29,29],iconAnchor:[14,14]});
      const marker = L.marker([stop.lat + count * .00016,stop.lng + count * .00016],{icon,title:stop.title,alt:stop.title}).addTo(layer);
      marker.bindPopup(`<strong>${i+1}. ${escape(stop.title)}</strong><br><small>${escape(stop.time)}<br>${escape(stop.address)}</small><br><a href="${searchLink(stop)}" ${external}>在 Google Maps 查看 ↗</a>`);
      marker.on('click',() => selectStop(i,false));
      markers.push(marker);
    });
    bounds = layer.getBounds();
    map.invalidateSize();
    map.fitBounds(bounds,{padding:[28,28],maxZoom:14});
  }

  function renderDay(index,updateHash = true) {
    const day = days[index];
    tabs.forEach((tab,i) => {tab.setAttribute('aria-selected',String(i===index));tab.tabIndex = i===index ? 0 : -1;});
    $('day-panel').setAttribute('aria-labelledby',`tab-${index}`);
    const route = routes[index];
    const routeText = route ? `道路引擎估 ${Math.round(route.distance/1000)} km / ${Math.round(route.duration/60)} 分，不含緩衝` : '道路資料暫不可用，請用 Google Maps 導航';
    $('day-intro').innerHTML = `<h3 class="day-intro-title">${escape(day.title)}</h3><p class="day-intro-desc">${escape(day.description)}</p><div class="day-stats">${day.stats.map(s=>`<span>${escape(s)}</span>`).join('')}</div><p class="small ${route?'':'route-fallback'}">${escape(routeText)}</p>`;
    $('timeline').innerHTML = timelineHTML(day);
    $('day-warning').textContent = day.warning;
    $('map-title').textContent = day.area;
    $('day-navigation').href = navigationLink(day);
    showMap(day,index);
    if (updateHash) history.replaceState(null,'',`#day-${index+1}`);
  }

  tabs.forEach((tab,index) => {
    tab.addEventListener('click',() => renderDay(index));
    tab.addEventListener('keydown',event => {
      let next;
      if (event.key === 'ArrowRight') next = (index+1)%tabs.length;
      if (event.key === 'ArrowLeft') next = (index+tabs.length-1)%tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length-1;
      if (next !== undefined) {event.preventDefault();renderDay(next);tabs[next].focus();}
    });
  });
  $('timeline').addEventListener('click',event => {
    const button = event.target.closest('[data-stop]');
    if (button) {
      selectStop(Number(button.dataset.stop));
      if (window.matchMedia('(max-width:640px)').matches) document.querySelector('.map-column').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    }
  });
  $('reset-map').addEventListener('click',() => {if(map && bounds) {map.closePopup();map.fitBounds(bounds,{padding:[28,28],maxZoom:14});}});
  function readHash() {
    const match = location.hash.match(/^#day-([123])$/);
    if (match) renderDay(Number(match[1])-1,false);
  }
  window.addEventListener('hashchange',readHash);
  renderDay(0,false);
  readHash();

  const storageKey = 'japan-travel.hokkaido-2026.checklist.v1';
  let checks = {};
  try {const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');if(saved && typeof saved === 'object') checks = saved;} catch { $('save-status').textContent = '此瀏覽器無法讀取儲存狀態，仍可使用清單。'; }
  document.querySelectorAll('[data-check]').forEach(input => {
    input.checked = checks[input.dataset.check] === true;
    input.addEventListener('change',() => {
      checks[input.dataset.check] = input.checked;
      try {localStorage.setItem(storageKey,JSON.stringify(checks));$('save-status').textContent = '已儲存在此裝置 ✓';} catch { $('save-status').textContent = '無法儲存在此裝置；本次勾選仍有效。'; }
    });
  });

  function preparePrint() {
    if ($('print-days')) return;
    const container = document.createElement('div');
    container.id = 'print-days';
    // Print in chronological order, not the currently-selected-day order.
    container.innerHTML = days.map(day=>`<section><h2 class="print-heading">${escape(day.date)} · ${escape(day.area)}</h2><p>${escape(day.description)}</p>${timelineHTML(day)}<p class="day-warning">${escape(day.warning)}</p></section>`).join('');
    container.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    $('journey').append(container);
    $('day-panel').hidden = true;
  }
  function cleanupPrint() { $('print-days')?.remove();$('day-panel').hidden = false; }
  window.addEventListener('beforeprint',preparePrint);
  window.addEventListener('afterprint',cleanupPrint);
  $('print').addEventListener('click',() => window.print());
})();
