import { order } from '../state/order.js';
import { TopAppBar } from '../components/TopAppBar.js';
import { BottomNav } from '../components/BottomNav.js';

export function OrderConfirmedPage({ onBackToMenu }) {
  const el = document.createElement('div');
  el.className = 'flex flex-col min-h-screen';

  el.appendChild(TopAppBar());

  const main = document.createElement('main');
  main.className = 'flex-grow pt-24 pb-32 px-6 max-w-lg mx-auto w-full flex flex-col';
  el.appendChild(main);

  el.appendChild(BottomNav('orders'));

  // Show a loading state while the Supabase fetch is in flight.
  main.innerHTML = `
    <div class="flex flex-col items-center justify-center flex-1 text-center py-24">
      <p class="text-secondary text-[0.875rem]">Loading orders…</p>
    </div>
  `;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  // Render items from Supabase shape: { name, quantity, extras (string|null),
  // spice_level (string|null), notes (string|null) }
  function itemsHTML(items) {
    return items.map(item => {
      const detailParts = [];
      if (item.spice_level) detailParts.push(`Spice Level: ${item.spice_level}`);
      if (item.extras)      detailParts.push(item.extras);
      const detailStr = detailParts.join(', ');
      return `
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-0.5">
            <h3 class="text-[0.875rem] font-semibold text-on-surface">${item.quantity}x ${item.name}</h3>
            ${detailStr
              ? `<p class="text-[0.6875rem] text-secondary leading-tight">${detailStr}</p>`
              : ''}
            ${item.notes
              ? `<p class="text-[0.6875rem] text-secondary leading-tight italic">"${item.notes}"</p>`
              : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function roundTotalsHTML(o) {
    return `
      <div class="mt-4 pt-4 border-t border-outline-variant/20 space-y-1">
        <div class="flex justify-between text-[0.6875rem] text-secondary">
          <span>Subtotal</span><span>$${o.subtotal.toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-[0.6875rem] text-secondary">
          <span>HST (13%)</span><span>$${o.hst.toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-[0.875rem] font-bold text-on-surface pt-1">
          <span>Round Total</span><span class="text-primary-container">$${o.total.toFixed(2)}</span>
        </div>
      </div>
    `;
  }

  // Short human-readable order reference from UUID (first 8 chars).
  function shortId(uuid) {
    return uuid.slice(0, 8).toUpperCase();
  }

  function formatTime(isoString) {
    return new Date(isoString).toLocaleString([], {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  // ---------------------------------------------------------------------------
  // Render — called once data arrives from Supabase
  // orders is newest-first: orders[0] = latest, orders.slice(1) = previous
  // ---------------------------------------------------------------------------
  function paint(orders) {
    // Empty state
    if (orders.length === 0) {
      el.className = '';
      main.className = 'pt-24 pb-32 px-6 max-w-2xl mx-auto';
      main.innerHTML = `
        <section class="mb-12 flex justify-center">
          <h2 class="text-[2.0rem] font-extrabold tracking-[-0.02em] text-on-surface">Your Orders</h2>
        </section>
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <span class="material-symbols-outlined text-[3rem] text-secondary mb-4">receipt_long</span>
          <p class="text-secondary text-[0.875rem]">No order placed yet.</p>
          <a href="#/" class="mt-6 text-[0.75rem] font-medium text-primary-container tracking-widest uppercase underline underline-offset-4">Browse Menu</a>
        </div>
      `;
      return;
    }

    const latest         = orders[0];
    const previousOrders = orders.slice(1);
    const isMultiRound   = previousOrders.length > 0;
    const tableDisplay   = latest.tableNumber ?? '—';

    const sessionTotals = isMultiRound ? {
      subtotal: orders.reduce((s, o) => s + o.subtotal, 0),
      hst:      orders.reduce((s, o) => s + o.hst,      0),
      total:    orders.reduce((s, o) => s + o.total,     0),
    } : null;

    const previousRoundsHTML = isMultiRound ? `
      <div class="mt-8 space-y-6">
        <span class="text-[0.6875rem] font-medium tracking-widest text-secondary uppercase block">Previous Rounds</span>
        ${previousOrders.map(o => `
          <div class="bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant/20">
            <div class="px-4 py-3 bg-surface-container-low flex justify-between items-center">
              <div>
                <span class="text-[0.6875rem] font-medium tracking-widest text-secondary uppercase block">Round ${o.round} · ${shortId(o.id)}</span>
                <span class="text-[0.6875rem] text-secondary">${formatTime(o.placedAt)} · ${o.status}</span>
              </div>
              <span class="text-[0.75rem] font-bold text-primary-container">$${o.total.toFixed(2)}</span>
            </div>
            <div class="px-4 py-4 space-y-3">
              ${itemsHTML(o.items)}
            </div>
          </div>
        `).join('')}
      </div>
    ` : '';

    const sessionTotalHTML = sessionTotals ? `
      <div class="mt-8 bg-surface-container-low p-6 rounded-lg space-y-1">
        <span class="text-[0.6875rem] font-medium tracking-widest text-secondary uppercase block mb-3">Session Total</span>
        <div class="flex justify-between text-[0.6875rem] text-secondary">
          <span>Subtotal</span><span>$${sessionTotals.subtotal.toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-[0.6875rem] text-secondary">
          <span>HST (13%)</span><span>$${sessionTotals.hst.toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-[0.875rem] font-bold text-on-surface pt-2 border-t border-outline-variant/20 mt-2">
          <span>Total</span><span class="text-primary-container">$${sessionTotals.total.toFixed(2)}</span>
        </div>
      </div>
    ` : '';

    main.innerHTML = `
      <!-- Check circle -->
      <div class="flex justify-center mb-12">
        <div class="w-32 h-32 bg-surface-container-high flex items-center justify-center rounded-lg">
          <span class="material-symbols-outlined text-primary text-5xl" style="font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; font-size: 3rem;">check_circle</span>
        </div>
      </div>

      <!-- Confirmation message -->
      <div class="text-center mb-16">
        <h2 class="text-[2.0rem] font-extrabold tracking-tight text-on-surface mb-2">Order Confirmed</h2>
        <p class="text-secondary text-[0.875rem]">Your order has been sent to the kitchen.</p>
      </div>

      <!-- Status bar — reflects live status of the latest order -->
      <div class="bg-surface-container-low p-6 mb-12 flex flex-col items-center">
        <span class="text-[0.6875rem] text-secondary tracking-widest uppercase mb-4">Current Status</span>
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span class="text-primary font-bold text-[1.125rem]">${
            latest.status === 'new' ? 'Order Received' : latest.status
          }</span>
        </div>
      </div>

      <!-- Latest round bento grid -->
      <div class="grid grid-cols-2 gap-px bg-outline-variant/20 mb-4 overflow-hidden rounded-lg">
        <div class="bg-surface-container-lowest p-6 flex flex-col">
          <span class="text-[0.6875rem] text-secondary uppercase mb-1">Order Number</span>
          <span class="text-on-surface font-semibold text-lg">${shortId(latest.id)}</span>
        </div>
        <div class="bg-surface-container-lowest p-6 flex flex-col border-l border-outline-variant/20">
          <span class="text-[0.6875rem] text-secondary uppercase mb-1">Table</span>
          <span class="text-on-surface font-semibold text-lg">${tableDisplay}</span>
        </div>
        <div class="bg-surface-container-lowest p-6 flex flex-col border-t border-outline-variant/20 col-span-2">
          <span class="text-[0.6875rem] text-secondary uppercase mb-4 text-center">
            ${isMultiRound ? `Round ${latest.round} Summary` : 'Order Summary'}
          </span>
          <div class="space-y-4">
            ${itemsHTML(latest.items)}
          </div>
          ${roundTotalsHTML(latest)}
          <p class="text-[0.625rem] text-secondary mt-3 text-right">${formatTime(latest.placedAt)}</p>
        </div>
      </div>

      <!-- Previous rounds (only shown when multiple rounds have been placed) -->
      ${previousRoundsHTML}

      <!-- Session total (only shown when multiple rounds have been placed) -->
      ${sessionTotalHTML}

      <!-- Back to menu -->
      <div class="mt-8">
        <button id="back-to-menu-btn" class="w-full bg-primary-container text-on-primary py-4 px-6 rounded-lg font-semibold transition-all hover:opacity-90 active:scale-95 shadow-[0px_24px_24px_0px_rgba(26,28,28,0.04)]">
          Back to Menu
        </button>
        <div class="mt-8 text-center">
          <span class="text-[0.6875rem] text-secondary uppercase tracking-widest">All prices include HST (13%)</span>
        </div>
      </div>
    `;

    main.querySelector('#back-to-menu-btn').addEventListener('click', () => {
      if (onBackToMenu) onBackToMenu();
    });
  }

  // ---------------------------------------------------------------------------
  // Fetch from Supabase and paint
  // ---------------------------------------------------------------------------
  order.fetchAllOrders()
    .then(orders => paint(orders))
    .catch(err => {
      console.error('[OrderConfirmedPage] fetch failed:', err);
      main.innerHTML = `
        <div class="flex flex-col items-center justify-center flex-1 text-center py-24">
          <span class="material-symbols-outlined text-[3rem] text-secondary mb-4">error</span>
          <p class="text-secondary text-[0.875rem]">Could not load orders. Please try again.</p>
        </div>
      `;
    });

  return el;
}
