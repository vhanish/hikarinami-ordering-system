import { cart } from '../state/cart.js';
import { TopAppBar } from '../components/TopAppBar.js';
import { BottomNav } from '../components/BottomNav.js';

export function CartPage({ onPlaceOrder }) {
  const el = document.createElement('div');

  el.appendChild(TopAppBar());

  const main = document.createElement('main');
  main.className = 'pt-24 pb-32 px-6 max-w-2xl mx-auto';
  el.appendChild(main);

  el.appendChild(BottomNav('cart'));

  function render(items) {
    const subtotal = cart.subtotal;
    const hst = cart.hst;
    const total = cart.total;
    const isEmpty = items.length === 0;

    let itemsHTML = '';
    if (isEmpty) {
      itemsHTML = `
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <span class="material-symbols-outlined text-[3rem] text-secondary mb-4">shopping_cart</span>
          <p class="text-secondary text-[0.875rem]">Your cart is empty.</p>
          <a href="#/" class="mt-6 text-[0.75rem] font-medium text-primary-container tracking-widest uppercase underline underline-offset-4">Browse Menu</a>
        </div>
      `;
    } else {
      itemsHTML = items.map(ci => {
        const detailParts = [];
        if (ci.spiceLevel && ci.spiceLevel !== 'None') detailParts.push(`Spice Level: ${ci.spiceLevel}`);
        ci.extras.forEach(e => detailParts.push(e.name));
        const detailStr = detailParts.join(', ');

        return `
          <div class="flex items-start justify-between" data-cart-id="${ci.id}">
            <div class="flex flex-col gap-1 flex-1 min-w-0 pr-4">
              <span class="text-xs font-medium tracking-widest text-secondary uppercase">${ci.item.category}</span>
              <h3 class="text-[0.875rem] font-semibold text-on-surface">${ci.quantity > 1 ? `${ci.quantity}x ` : ''}${ci.item.name}</h3>
              ${detailStr ? `<p class="text-[0.6875rem] text-secondary">${detailStr}</p>` : ''}
              ${ci.specialInstructions ? `<p class="text-[0.6875rem] text-secondary italic">"${ci.specialInstructions}"</p>` : ''}
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <div class="text-[0.875rem] font-bold text-primary-container">$${(ci.unitPrice * ci.quantity).toFixed(2)}</div>
              <button class="remove-item-btn text-secondary hover:text-primary transition-colors" data-id="${ci.id}" aria-label="Remove item">
                <span class="material-symbols-outlined text-[1.125rem]">close</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    const summaryHTML = !isEmpty ? `
      <section class="bg-surface-container-low p-8 rounded-lg space-y-4 mb-12">
        <div class="flex justify-between items-center text-[0.6875rem] font-medium tracking-widest text-secondary uppercase">
          <span>Subtotal</span>
          <span class="text-on-surface">$${subtotal.toFixed(2)}</span>
        </div>
        <div class="flex justify-between items-center text-[0.6875rem] font-medium tracking-widest text-secondary uppercase">
          <span>HST (13%)</span>
          <span class="text-on-surface">$${hst.toFixed(2)}</span>
        </div>
        <div class="pt-6 mt-6 border-t border-outline-variant/20">
          <div class="flex justify-between items-end">
            <span class="text-[0.6875rem] font-bold tracking-widest text-on-surface uppercase mb-1">Total</span>
            <span class="text-[1.375rem] font-extrabold tracking-[-0.01em] text-primary-container leading-none">$${total.toFixed(2)}</span>
          </div>
        </div>
      </section>
      <div class="mt-12">
        <button id="place-order-btn" class="w-full bg-primary-container text-white font-semibold py-4 px-6 rounded-lg shadow-[0px_-4px_24px_0px_rgba(26,28,28,0.04)] hover:opacity-90 transition-opacity active:scale-95">
          Place Order
        </button>
      </div>
    ` : '';

    main.innerHTML = `
      <section class="mb-12 flex justify-center">
        <h2 class="text-[2.0rem] font-extrabold tracking-[-0.02em] text-on-surface">Your Order</h2>
      </section>
      <section class="space-y-6 mb-16">${itemsHTML}</section>
      ${summaryHTML}
    `;

    // Wire up remove buttons
    main.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        cart.removeItem(id);
      });
    });

    // Wire up place order button
    const placeOrderBtn = main.querySelector('#place-order-btn');
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener('click', async () => {
        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = 'Placing Order…';
        try {
          if (onPlaceOrder) await onPlaceOrder();
        } catch (err) {
          console.error('[CartPage] Place Order failed:', err);
          placeOrderBtn.disabled = false;
          placeOrderBtn.textContent = 'Place Order';
        }
      });
    }
  }

  // Subscribe to cart changes
  cart.subscribe(items => render(items));

  return el;
}
