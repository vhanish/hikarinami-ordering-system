import { cart } from '../state/cart.js';

// Renders a bottom-sheet overlay on top of whatever page is currently mounted.
// Returns { mount(item), unmount() }
export function ItemDetailsSheet({ onClose, onAddedToCart }) {
  let quantity = 1;
  let selectedSpice = null;
  let selectedExtras = new Set();
  let specialInstructions = '';
  let currentItem = null;

  // --- DOM scaffold ---

  // z-40: sits above menu content but BELOW the top app bar (z-50) and bottom nav (z-[60]).
  // This ensures the header always floats above the sheet regardless of how tall the sheet is.
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop fixed inset-0 bg-black/10 backdrop-blur-md z-40 flex items-end';

  // Fixed height — 85dvh — applied via style so it is identical for every item.
  // Using a fixed height (not max-height) means content never drives the panel size,
  // so short items and long items open to exactly the same position on screen.
  // dvh = dynamic viewport height, which accounts for mobile browser chrome correctly.
  const panel = document.createElement('div');
  panel.className = 'sheet-panel bg-surface-container-lowest w-full rounded-t-[1.5rem] shadow-2xl flex flex-col';
  panel.style.height = '85dvh';

  // Handle bar — lives outside the scroll container so it never scrolls away.
  // Tapping it closes the sheet (same intent as dragging it down).
  const handleBar = document.createElement('div');
  handleBar.className = 'flex justify-center py-4 flex-shrink-0 cursor-pointer';
  handleBar.innerHTML = '<div class="w-12 h-1 bg-surface-container-high rounded-full pointer-events-none"></div>';
  handleBar.addEventListener('click', close);

  // Scrollable body — fills remaining height, scrolls internally.
  // min-h-0 is required: without it a flex child won't shrink below its content height.
  const scrollBody = document.createElement('div');
  scrollBody.className = 'overflow-y-auto flex-1 min-h-0';

  panel.appendChild(handleBar);
  panel.appendChild(scrollBody);
  backdrop.appendChild(panel);

  // Close on backdrop click (outside the panel)
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) close();
  });

  // Guard flag — prevents double-close if the user taps the handle
  // while the exit animation is already running.
  let isClosing = false;

  function close() {
    if (isClosing) return;
    isClosing = true;

    // Slide the panel down and fade the backdrop out simultaneously.
    // Both animations use 'forwards' fill-mode so the elements hold their
    // final state (off-screen / transparent) until the DOM removal fires.
    panel.style.animation   = 'slideDown 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards';
    backdrop.style.animation = 'fadeOut 0.3s ease-out forwards';

    // Remove from DOM after the animation completes.
    // 310ms gives the 300ms animation a small buffer before the node disappears.
    setTimeout(() => {
      backdrop.remove();
      const header = document.querySelector('header');
      if (header) header.style.zIndex = '';
      if (onClose) onClose();
    }, 310);
  }

  function computeExtrasTotal() {
    if (!currentItem) return 0;
    let total = 0;
    selectedExtras.forEach(name => {
      const extra = currentItem.extras.find(e => e.name === name);
      if (extra) total += extra.price;
    });
    return total;
  }

  function computeSubtotal() {
    if (!currentItem) return 0;
    return (currentItem.price + computeExtrasTotal()) * quantity;
  }

  function render() {
    if (!currentItem) return;

    const item = currentItem;
    const hasSpiceLevels = item.spiceLevels && item.spiceLevels.length > 0;
    const hasExtras = item.extras && item.extras.length > 0;

    // Default spice to first option if not set
    if (hasSpiceLevels && selectedSpice === null) {
      selectedSpice = item.spiceLevels[0];
    }

    const spiceHTML = hasSpiceLevels ? `
      <div>
        <span class="text-[0.6875rem] font-medium tracking-[0.05em] uppercase text-secondary block mb-4">Spice Level</span>
        <div class="flex flex-wrap gap-3">
          ${item.spiceLevels.map(level => `
            <button
              data-spice="${level}"
              class="spice-btn px-5 py-2.5 rounded-full text-body-md hover:opacity-80 transition-opacity
                ${selectedSpice === level
                  ? 'bg-primary-container text-white shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant'
                }"
            >${level}</button>
          `).join('')}
        </div>
      </div>
    ` : '';

    const extrasHTML = hasExtras ? `
      <div>
        <span class="text-[0.6875rem] font-medium tracking-[0.05em] uppercase text-secondary block mb-4">Add Extras</span>
        <div class="space-y-4">
          ${item.extras.map(extra => {
            const checked = selectedExtras.has(extra.name);
            return `
              <div class="flex items-center justify-between py-2 cursor-pointer extra-row" data-extra="${extra.name}">
                <div class="flex items-center space-x-4">
                  <div class="w-5 h-5 rounded-[0.125rem] border border-outline-variant flex items-center justify-center ${checked ? 'bg-primary border-primary' : ''}">
                    ${checked ? '<span class="material-symbols-outlined text-white text-[1rem]" style="font-size:14px;">check</span>' : ''}
                  </div>
                  <span class="text-body-md text-on-surface">${extra.name}</span>
                </div>
                <span class="text-label-sm font-bold text-primary-container">+$${extra.price.toFixed(2)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : '';

    // scrollBody is the scroll container — render all content here, not on panel.
    scrollBody.innerHTML = `
      <div class="px-6 pb-28">
        <!-- Header -->
        <div class="flex justify-between items-start mb-6">
          <div class="space-y-1">
            <h1 class="text-[2.0rem] font-bold tracking-[-0.02em] leading-tight text-on-surface">${item.name}</h1>
            <p class="text-[0.875rem] text-secondary max-w-xs">${item.description}</p>
          </div>
          <div class="text-[1.375rem] font-bold text-primary-container tracking-[-0.01em] ml-4 shrink-0">$${item.price.toFixed(2)}</div>
        </div>

        <section class="space-y-10">
          <!-- Quantity -->
          <div>
            <span class="text-[0.6875rem] font-medium tracking-[0.05em] uppercase text-secondary block mb-4">Quantity</span>
            <div class="flex items-center space-x-6">
              <button id="qty-minus" class="w-10 h-10 flex items-center justify-center border border-outline-variant/20 rounded-lg hover:bg-surface-container-low transition-colors">
                <span class="material-symbols-outlined text-on-surface">remove</span>
              </button>
              <span id="qty-display" class="text-[1.125rem] font-bold tabular-nums">${quantity}</span>
              <button id="qty-plus" class="w-10 h-10 flex items-center justify-center border border-outline-variant/20 rounded-lg hover:bg-surface-container-low transition-colors">
                <span class="material-symbols-outlined text-on-surface">add</span>
              </button>
            </div>
          </div>

          ${spiceHTML}
          ${extrasHTML}

          <!-- Special Instructions -->
          <div class="mt-10">
            <span class="text-[0.6875rem] font-medium tracking-[0.05em] uppercase text-secondary block mb-4">Special Instructions</span>
            <textarea
              id="special-instructions"
              class="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-lg text-[0.875rem] text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary-container/30 transition-all resize-none"
              placeholder="Add any special requests..."
              rows="3"
            >${specialInstructions}</textarea>
          </div>
        </section>

        <!-- Action Area -->
        <div class="mt-12 mb-4 pt-6 bg-surface-container-lowest">
          <div class="flex items-center justify-between mb-4">
            <span class="text-[0.6875rem] font-medium text-secondary">Subtotal</span>
            <div class="text-right">
              <span id="subtotal-display" class="text-[1.125rem] font-bold text-on-surface">$${computeSubtotal().toFixed(2)}</span>
              <span class="block text-[0.6875rem] text-secondary">HST (13%) calculated at checkout</span>
            </div>
          </div>
          <button id="add-to-cart-btn" class="w-full bg-primary-container text-white py-4 px-6 rounded-lg font-semibold tracking-wide text-center active:scale-95 transition-all duration-200">
            Add to Cart
          </button>
        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // All queries are now scoped to scrollBody (not panel) since the handle
    // is a separate DOM node and not part of the rendered innerHTML.
    const qtyMinus = scrollBody.querySelector('#qty-minus');
    const qtyPlus = scrollBody.querySelector('#qty-plus');
    const qtyDisplay = scrollBody.querySelector('#qty-display');
    const subtotalDisplay = scrollBody.querySelector('#subtotal-display');
    const addBtn = scrollBody.querySelector('#add-to-cart-btn');
    const instructionsArea = scrollBody.querySelector('#special-instructions');

    qtyMinus.addEventListener('click', () => {
      if (quantity > 1) {
        quantity--;
        qtyDisplay.textContent = quantity;
        subtotalDisplay.textContent = `$${computeSubtotal().toFixed(2)}`;
      }
    });

    qtyPlus.addEventListener('click', () => {
      quantity++;
      qtyDisplay.textContent = quantity;
      subtotalDisplay.textContent = `$${computeSubtotal().toFixed(2)}`;
    });

    // Spice level buttons
    scrollBody.querySelectorAll('.spice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedSpice = btn.getAttribute('data-spice');
        render();
      });
    });

    // Extra checkboxes
    scrollBody.querySelectorAll('.extra-row').forEach(row => {
      row.addEventListener('click', () => {
        const name = row.getAttribute('data-extra');
        if (selectedExtras.has(name)) {
          selectedExtras.delete(name);
        } else {
          selectedExtras.add(name);
        }
        render();
      });
    });

    instructionsArea.addEventListener('input', e => {
      specialInstructions = e.target.value;
    });

    addBtn.addEventListener('click', () => {
      const extras = currentItem.extras.filter(e => selectedExtras.has(e.name));
      cart.addItem({
        item: currentItem,
        quantity,
        spiceLevel: selectedSpice,
        extras,
        specialInstructions
      });
      close();
      if (onAddedToCart) onAddedToCart();
    });
  }

  return {
    mount(item) {
      // Reset state for new item
      currentItem = item;
      quantity = 1;
      selectedSpice = item.spiceLevels && item.spiceLevels.length > 0 ? item.spiceLevels[0] : null;
      selectedExtras = new Set();
      specialInstructions = '';

      render();
      // Drop the TopAppBar below the backdrop's z-index (z-40) so the backdrop's
      // backdrop-filter covers it. backdrop-filter blurs what it sees *behind* it
      // (a frosted-glass effect), which preserves text contrast far better than
      // applying filter:blur() directly to the DOM content.
      const header = document.querySelector('header');
      if (header) header.style.zIndex = '30';
      document.body.appendChild(backdrop);
    },
    unmount() {
      backdrop.remove();
    }
  };
}
