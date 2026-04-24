import { supabase } from './lib/supabase.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let _allOrders    = [];    // live-board cache (excludes completed)
let _activeFilter = 'all'; // 'all' | 'new' | 'preparing' | 'ready'
let _activeView   = 'live';// 'live' | 'history' | 'stats'
let _inflightCount = 0;    // blocks Realtime refresh while a local write is in-flight
let _soundEnabled   = true;  // mute toggle state
let _pendingChime   = false; // play chime when tab regains focus if context wasn't ready
const _pendingFetch = new Set(); // order IDs with an in-flight fetchOneOrder call

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------
const grid        = document.getElementById('orders-grid');
const statsEl     = document.getElementById('active-order-count');
const pageTitleEl = document.getElementById('page-title');
const filterBarEl = document.getElementById('filter-bar');

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
async function fetchLiveOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, table_number, status, created_at, order_items(id, name, quantity, extras, spice_level, notes)')
    .neq('status', 'completed')
    .order('created_at', { ascending: false });
  if (error) { console.error('[kitchen] fetchLiveOrders failed:', error); return null; }
  return data || [];
}

async function fetchOneOrder(id) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, table_number, status, created_at, order_items(id, name, quantity, extras, spice_level, notes)')
    .eq('id', id)
    .single();
  if (error) { console.error('[kitchen] fetchOneOrder failed:', error); return null; }
  return data;
}

async function fetchCompletedOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, table_number, status, created_at, order_items(id, name, quantity, extras, spice_level, notes)')
    .eq('status', 'completed')
    .order('created_at', { ascending: false });
  if (error) { console.error('[kitchen] fetchCompletedOrders failed:', error); return null; }
  return data || [];
}

async function fetchAllOrderCounts() {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status');
  if (error) { console.error('[kitchen] fetchAllOrderCounts failed:', error); return null; }
  return data || [];
}

// ---------------------------------------------------------------------------
// Status update — DB-first, no optimistic state
// The UI is rebuilt entirely from Supabase after each write.
// Logging is intentional: open the browser console to diagnose write failures.
// ---------------------------------------------------------------------------
async function setStatus(orderId, newStatus) {
  _inflightCount++;
  console.log(`[kitchen] setStatus  id=${orderId}  →  ${newStatus}`);

  try {
    // Write
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select('id, status');

    console.log('[kitchen] UPDATE response  data:', data, ' error:', error);

    if (error) {
      console.error('[kitchen] UPDATE failed:', error.message, error.hint ?? '');
    } else if (!data || data.length === 0) {
      console.error(
        '[kitchen] UPDATE matched 0 rows for id:', orderId,
        '— most likely cause: RLS UPDATE policy missing for the anon role on the orders table.',
        'Go to Supabase → Table Editor → orders → Policies and add an UPDATE policy for anon.'
      );
    } else {
      console.log('[kitchen] UPDATE confirmed — DB status is now:', data[0].status);
    }

    // Verify: re-fetch the single row so the console shows the ground truth
    const { data: row } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single();
    console.log('[kitchen] re-fetch verify:', row
      ? `status = "${row.status}"`
      : 'row not returned (completed orders are excluded from live fetch)');

  } catch (err) {
    console.error('[kitchen] setStatus threw unexpectedly:', err);
  } finally {
    _inflightCount--;
    // Rebuild the live board from DB — this is the only state that matters.
    if (_activeView === 'live') await refreshLive();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function shortId(uuid) {
  return uuid.slice(0, 8).toUpperCase();
}

function relativeTime(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)} hr ago`;
}

function itemTagsHTML(item) {
  const tags = [];
  if (item.extras) {
    item.extras.split(',').forEach(e => {
      const label = e.trim();
      if (label) tags.push(`<span class="bg-surface-container-high text-[10px] px-2 py-0.5 rounded-full font-bold text-on-surface-variant uppercase">${label}</span>`);
    });
  }
  if (item.spice_level) {
    tags.push(`<span class="bg-surface-container-high text-[10px] px-2 py-0.5 rounded-full font-bold text-on-surface-variant uppercase">Spice: ${item.spice_level}</span>`);
  }
  return tags.length ? `<div class="flex flex-wrap gap-2 mt-1">${tags.join('')}</div>` : '';
}

function notesBlockHTML(items) {
  const notedItems = items.filter(i => i.notes);
  if (!notedItems.length) return '';
  const lines = notedItems.length === 1
    ? `<p class="text-sm text-on-background italic font-medium">"${notedItems[0].notes}"</p>`
    : notedItems.map(i => `<p class="text-sm text-on-background italic font-medium">${i.name}: "${i.notes}"</p>`).join('');
  return `
    <div class="bg-surface-container-low p-4 rounded-lg border-l-2 border-primary/20">
      <p class="text-[0.6875rem] font-bold text-secondary uppercase tracking-widest mb-1">Special Instructions</p>
      ${lines}
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Order age timers
// ---------------------------------------------------------------------------
function ageColor(isoString) {
  const mins = Math.floor((Date.now() - new Date(isoString)) / 60000);
  if (mins < 5)  return '#5f5e5e'; // neutral — fresh order
  if (mins < 15) return '#d97706'; // amber  — getting old
  return '#c0392b';                // red    — needs attention
}

function updateAgeTimers() {
  document.querySelectorAll('[data-placed-at]').forEach(el => {
    el.textContent  = relativeTime(el.dataset.placedAt);
    el.style.color  = ageColor(el.dataset.placedAt);
    el.style.fontWeight = '600';
  });
}

// ---------------------------------------------------------------------------
// Sound alert — Web Audio API with a silent keep-alive oscillator
//
// Chrome auto-suspends an AudioContext only when it has NO active nodes.
// A zero-gain oscillator running permanently prevents that. Once the context
// is 'running' it stays running even in background tabs, so chimes triggered
// from WebSocket callbacks (not user gestures) work reliably.
// ---------------------------------------------------------------------------

const _AC = window.AudioContext || window['webkitAudioContext'];
let _audioCtx = null;

function _ensureContext() {
  if (_audioCtx || !_AC) return;
  try {
    _audioCtx = new _AC();
    // Silent oscillator — keeps the context active so Chrome never suspends it.
    const keepAliveGain = _audioCtx.createGain();
    keepAliveGain.gain.value = 0;
    const keepAliveOsc = _audioCtx.createOscillator();
    keepAliveOsc.frequency.value = 1; // 1 Hz, completely inaudible
    keepAliveOsc.connect(keepAliveGain);
    keepAliveGain.connect(_audioCtx.destination);
    keepAliveOsc.start();
  } catch (e) {}
}

async function unlockAudio() {
  _ensureContext();
  if (_audioCtx && _audioCtx.state === 'suspended') {
    try { await _audioCtx.resume(); } catch (e) {}
  }
}

function _doChime() {
  if (!_audioCtx || _audioCtx.state !== 'running') return;
  const now = _audioCtx.currentTime;
  [[880, 0.5, 1.4], [1320, 0.2, 0.7]].forEach(([freq, gain, decay]) => {
    const osc = _audioCtx.createOscillator();
    const g   = _audioCtx.createGain();
    osc.connect(g); g.connect(_audioCtx.destination);
    osc.type = 'sine'; osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + decay);
    osc.start(now); osc.stop(now + decay);
  });
}

function playNewOrderChime() {
  if (!_soundEnabled) return;
  if (_audioCtx && _audioCtx.state === 'running') {
    _doChime();
  } else {
    // Context not yet running (no user click yet) — queue for next focus event.
    _pendingChime = true;
  }
}

// When the tab comes back into view, flush any queued chime.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && _pendingChime && _soundEnabled) {
    _pendingChime = false;
    _doChime();
  }
});

// ---------------------------------------------------------------------------
// Card HTML — live board
// ---------------------------------------------------------------------------
function liveCardHTML(order) {
  const items       = order.order_items || [];
  const isNew       = order.status === 'new';
  const isPreparing = order.status === 'preparing';
  const isReady     = order.status === 'ready';

  const borderClass = isPreparing ? 'border-l-4 border-primary'
    : isReady ? 'border-l-4 border-tertiary-container'
    : '';

  const statusBadge = isNew
    ? `<span class="px-3 py-1 bg-surface-container-highest text-on-surface-variant text-[0.6875rem] font-bold tracking-[0.05em] uppercase rounded-full">NEW</span>
       <span data-placed-at="${order.created_at}" class="text-xs font-semibold mt-2">${relativeTime(order.created_at)}</span>`
    : isPreparing
    ? `<span class="px-3 py-1 bg-primary text-white text-[0.6875rem] font-bold tracking-[0.05em] uppercase rounded-full">PREPARING</span>
       <span data-placed-at="${order.created_at}" class="text-xs font-semibold mt-2">${relativeTime(order.created_at)}</span>`
    : `<span class="px-3 py-1 bg-tertiary-container text-white text-[0.6875rem] font-bold tracking-[0.05em] uppercase rounded-full">READY</span>
       <span data-placed-at="${order.created_at}" class="text-xs font-semibold mt-2">${relativeTime(order.created_at)}</span>`;

  const itemsListHTML = items.length === 0
    ? `<p class="text-secondary text-sm italic">Loading items…</p>`
    : isReady
    ? items.map(item => `
        <div class="flex justify-between items-start line-through">
          <div class="flex gap-3">
            <span class="text-secondary font-bold">${item.quantity}x</span>
            <p class="font-bold text-on-background">${item.name}</p>
          </div>
        </div>
      `).join('')
    : items.map(item => `
        <div class="flex justify-between items-start">
          <div class="flex gap-3">
            <span class="text-primary font-bold">${item.quantity}x</span>
            <div>
              <p class="font-bold text-on-background">${item.name}</p>
              ${itemTagsHTML(item)}
            </div>
          </div>
        </div>
      `).join('');

  const actionsHTML = isNew
    ? `<button class="action-btn w-full py-3 border-2 border-primary text-primary font-bold text-sm rounded-lg hover:bg-primary/5 active:opacity-70 transition-all" data-id="${order.id}" data-action="preparing">Start Preparing</button>
       <button class="action-btn w-full py-2 bg-transparent text-secondary font-bold text-[10px] uppercase tracking-widest hover:text-on-background transition-colors" data-id="${order.id}" data-action="completed">Complete Order</button>`
    : isPreparing
    ? `<button class="action-btn w-full py-3 bg-primary text-white font-bold text-sm rounded-lg hover:opacity-90 active:opacity-70 transition-all" data-id="${order.id}" data-action="ready">Mark Ready</button>
       <button class="action-btn w-full py-2 bg-transparent text-secondary font-bold text-[10px] uppercase tracking-widest hover:text-on-background transition-colors" data-id="${order.id}" data-action="completed">Complete Order</button>`
    : `<button class="action-btn w-full py-3 bg-on-background text-white font-bold text-sm rounded-lg hover:opacity-90 active:opacity-70 transition-all" data-id="${order.id}" data-action="completed">Complete Order</button>
       <button class="action-btn w-full py-2 bg-transparent text-secondary font-bold text-[10px] uppercase tracking-widest hover:text-on-background transition-colors" data-id="${order.id}" data-action="preparing">Back to Kitchen</button>`;

  return `
    <div class="bg-surface-container-lowest rounded-lg overflow-hidden flex flex-col h-full shadow-[0_24px_24px_rgba(26,28,28,0.04)] ${borderClass} transition-all hover:scale-[1.01]">
      <div class="p-6 flex-grow">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h2 class="text-[1.375rem] font-extrabold tracking-[-0.01em] text-on-background">TABLE ${order.table_number ?? '—'}</h2>
            <p class="text-xs font-medium text-secondary mt-0.5">#${shortId(order.id)}</p>
          </div>
          <div class="flex flex-col items-end">${statusBadge}</div>
        </div>
        <div class="space-y-6">
          <div class="space-y-3 ${isReady ? 'opacity-60' : ''}">${itemsListHTML}</div>
          ${isReady ? '' : notesBlockHTML(items)}
        </div>
      </div>
      <div class="p-6 pt-0 mt-auto flex flex-col gap-2">${actionsHTML}</div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Card HTML — history view (no action buttons)
// ---------------------------------------------------------------------------
function historyCardHTML(order) {
  const items = order.order_items || [];
  return `
    <div class="bg-surface-container-lowest rounded-lg overflow-hidden flex flex-col h-full shadow-[0_24px_24px_rgba(26,28,28,0.04)] transition-all hover:scale-[1.01]">
      <div class="p-6">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h2 class="text-[1.375rem] font-extrabold tracking-[-0.01em] text-on-background">TABLE ${order.table_number ?? '—'}</h2>
            <p class="text-xs font-medium text-secondary mt-0.5">#${shortId(order.id)}</p>
          </div>
          <div class="flex flex-col items-end">
            <span class="px-3 py-1 bg-surface-container-highest text-secondary text-[0.6875rem] font-bold tracking-[0.05em] uppercase rounded-full">COMPLETED</span>
            <span class="text-xs text-secondary font-medium mt-2">${relativeTime(order.created_at)}</span>
          </div>
        </div>
        <div class="space-y-3">
          ${items.map(item => `
            <div class="flex gap-3">
              <span class="text-secondary font-bold">${item.quantity}x</span>
              <div>
                <p class="font-bold text-on-background">${item.name}</p>
                ${itemTagsHTML(item)}
              </div>
            </div>
          `).join('')}
        </div>
        ${notesBlockHTML(items)}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------
function wireActionButtons() {
  grid.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => setStatus(btn.dataset.id, btn.dataset.action));
  });
}

function showEmptyState(message) {
  grid.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <span class="material-symbols-outlined text-[3rem] text-secondary mb-4">restaurant</span>
      <p class="text-secondary text-sm">${message}</p>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Live view
// ---------------------------------------------------------------------------
function applyFilter() {
  const filtered = _activeFilter === 'all'
    ? _allOrders
    : _allOrders.filter(o => o.status === _activeFilter);

  const activeCount = _allOrders.filter(o => o.status === 'new' || o.status === 'preparing').length;
  if (statsEl) statsEl.textContent = `${activeCount} Active Order${activeCount !== 1 ? 's' : ''} • Kitchen Load: Optimal`;

  if (filtered.length === 0) { showEmptyState('No active orders.'); return; }
  grid.innerHTML = filtered.map(liveCardHTML).join('');
  wireActionButtons();
  updateAgeTimers(); // color-code timestamps immediately after render
}

async function refreshLive() {
  const orders = await fetchLiveOrders();
  if (orders === null) return;
  _allOrders = orders; // DB is source of truth — fetchLiveOrders already excludes completed
  if (_activeView === 'live') applyFilter();
}

// ---------------------------------------------------------------------------
// History view
// ---------------------------------------------------------------------------
async function showHistoryView() {
  if (pageTitleEl) pageTitleEl.textContent = 'Order History';
  if (statsEl)     statsEl.textContent     = 'Completed orders';
  if (filterBarEl) filterBarEl.classList.add('hidden');

  grid.innerHTML = `<div class="col-span-full text-center py-8 text-secondary text-sm">Loading history…</div>`;

  const orders = await fetchCompletedOrders();
  if (orders === null) { showEmptyState('Could not load history.'); return; }
  if (orders.length === 0) { showEmptyState('No completed orders yet.'); return; }
  grid.innerHTML = orders.map(historyCardHTML).join('');
}

// ---------------------------------------------------------------------------
// Stats view
// ---------------------------------------------------------------------------
async function showStatsView() {
  if (pageTitleEl) pageTitleEl.textContent = 'Kitchen Stats';
  if (statsEl)     statsEl.textContent     = 'All-time overview';
  if (filterBarEl) filterBarEl.classList.add('hidden');

  grid.innerHTML = `<div class="col-span-full text-center py-8 text-secondary text-sm">Loading stats…</div>`;

  const rows = await fetchAllOrderCounts();
  if (rows === null) { showEmptyState('Could not load stats.'); return; }

  const count = status => rows.filter(o => o.status === status).length;

  grid.innerHTML = `
    <div class="col-span-full grid grid-cols-2 md:grid-cols-4 gap-8">
      <div class="bg-surface-container-lowest rounded-lg p-6 shadow-[0_24px_24px_rgba(26,28,28,0.04)]">
        <p class="text-[0.6875rem] font-bold text-secondary uppercase tracking-widest mb-2">New</p>
        <p class="text-[2rem] font-extrabold text-on-background">${count('new')}</p>
      </div>
      <div class="bg-surface-container-lowest rounded-lg p-6 shadow-[0_24px_24px_rgba(26,28,28,0.04)] border-l-4 border-primary">
        <p class="text-[0.6875rem] font-bold text-secondary uppercase tracking-widest mb-2">Preparing</p>
        <p class="text-[2rem] font-extrabold text-on-background">${count('preparing')}</p>
      </div>
      <div class="bg-surface-container-lowest rounded-lg p-6 shadow-[0_24px_24px_rgba(26,28,28,0.04)] border-l-4 border-tertiary-container">
        <p class="text-[0.6875rem] font-bold text-secondary uppercase tracking-widest mb-2">Ready</p>
        <p class="text-[2rem] font-extrabold text-on-background">${count('ready')}</p>
      </div>
      <div class="bg-surface-container-lowest rounded-lg p-6 shadow-[0_24px_24px_rgba(26,28,28,0.04)]">
        <p class="text-[0.6875rem] font-bold text-secondary uppercase tracking-widest mb-2">Completed</p>
        <p class="text-[2rem] font-extrabold text-on-background">${count('completed')}</p>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// View switcher
// ---------------------------------------------------------------------------
function setNavActive(view) {
  // Desktop nav
  document.querySelectorAll('nav [data-view]').forEach(a => {
    const active = a.dataset.view === view;
    a.classList.toggle('text-[#af101a]',      active);
    a.classList.toggle('font-semibold',        active);
    a.classList.toggle('border-b-2',           active);
    a.classList.toggle('border-[#af101a]',     active);
    a.classList.toggle('text-[#5f5e5e]',      !active);
    a.classList.toggle('font-medium',         !active);
  });
  // Mobile bottom nav
  document.querySelectorAll('[data-view]').forEach(el => {
    if (el.closest('nav')) return; // skip desktop nav (already handled)
    const active = el.dataset.view === view;
    el.classList.toggle('text-primary',   active);
    el.classList.toggle('text-secondary', !active);
  });
}

async function switchView(view) {
  _activeView = view;
  setNavActive(view);

  if (view === 'live') {
    if (pageTitleEl) pageTitleEl.textContent = 'Kitchen Live Board';
    if (filterBarEl) filterBarEl.classList.remove('hidden');
    await refreshLive();
  } else if (view === 'history') {
    await showHistoryView();
  } else if (view === 'stats') {
    await showStatsView();
  }
}

// Wire desktop nav links
document.querySelectorAll('nav [data-view]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    switchView(a.dataset.view);
  });
});

// Wire mobile bottom nav items
document.querySelectorAll('[data-view]').forEach(el => {
  if (el.closest('nav')) return;
  el.addEventListener('click', () => switchView(el.dataset.view));
});

// Wire status filter select
const filterSelect = document.getElementById('status-filter');
if (filterSelect) {
  filterSelect.addEventListener('change', () => {
    _activeFilter = filterSelect.value;
    applyFilter();
  });
}

// ---------------------------------------------------------------------------
// Boot + realtime
// ---------------------------------------------------------------------------

// Any click on the page resumes the AudioContext (Chrome's autoplay gate).
document.addEventListener('click', () => unlockAudio());

// Sound toggle — wired to the notifications icon in the header.
const soundToggleEl = document.getElementById('sound-toggle');
function updateSoundToggleIcon() {
  if (!soundToggleEl) return;
  soundToggleEl.textContent   = _soundEnabled ? 'notifications_active' : 'notifications_off';
  soundToggleEl.title         = _soundEnabled ? 'Sound on — click to mute' : 'Sound muted — click to unmute';
  soundToggleEl.style.color   = _soundEnabled ? '#af101a' : '#8f6f6c';
  soundToggleEl.style.opacity = _soundEnabled ? '1' : '0.5';
}
if (soundToggleEl) {
  soundToggleEl.addEventListener('click', async () => {
    _soundEnabled = !_soundEnabled;
    updateSoundToggleIcon();
    if (_soundEnabled) {
      await unlockAudio(); // ensure context is running before playing
      _doChime();          // test chime confirms audio is live
    }
  });
}
updateSoundToggleIcon();

// Initial load — live view
refreshLive();

// Poll every 15 s (live view only — guard inside refreshLive)
setInterval(refreshLive, 15000);

// Update age timer colors every 30 s without a full re-render
setInterval(updateAgeTimers, 30000);

// Supabase Realtime subscriptions.
// orders INSERT  → show stub card immediately (items arrive separately), play chime
// order_items INSERT → fill items into the stub card once they're in the DB
// orders UPDATE  → full refresh (status change from kitchen buttons)
supabase
  .channel('kitchen-orders')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
    playNewOrderChime();
    if (_activeView !== 'live' || _inflightCount !== 0) return;
    // Show card immediately — items arrive via a separate insert, so render a
    // stub now and let the order_items subscription fill them in.
    const stub = { ...payload.new, order_items: [] };
    _allOrders = [stub, ..._allOrders.filter(o => o.id !== stub.id)];
    applyFilter();
    // Guaranteed fallback: if order_items subscription misses the event (Supabase
    // publication config, RLS, network hiccup), fetch the full order after 700 ms.
    setTimeout(async () => {
      const cur = _allOrders.find(o => o.id === payload.new.id);
      if (!cur || cur.order_items.length > 0) return; // already filled
      if (_pendingFetch.has(payload.new.id)) return;  // fetch already in flight
      _pendingFetch.add(payload.new.id);
      const order = await fetchOneOrder(payload.new.id);
      _pendingFetch.delete(payload.new.id);
      if (!order || order.status === 'completed') return;
      _allOrders = _allOrders.map(o => o.id === order.id ? order : o);
      if (_activeView === 'live') applyFilter();
    }, 700);
  })
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_items' }, async (payload) => {
    if (_activeView !== 'live' || _inflightCount !== 0) return;
    const orderId = payload.new.order_id;
    // Only act if we have a stub for this order (no items yet).
    const stub = _allOrders.find(o => o.id === orderId);
    if (!stub || stub.order_items.length > 0) return;
    // Debounce: skip if a fetch is already in flight for this order
    // (bulk insert fires one event per item row).
    if (_pendingFetch.has(orderId)) return;
    _pendingFetch.add(orderId);
    const order = await fetchOneOrder(orderId);
    _pendingFetch.delete(orderId);
    if (order && order.status !== 'completed') {
      _allOrders = _allOrders.map(o => o.id === order.id ? order : o);
      applyFilter();
    }
  })
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
    if (_activeView === 'live' && _inflightCount === 0) refreshLive();
  })
  .subscribe();
