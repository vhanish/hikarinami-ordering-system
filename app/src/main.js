import { MenuPage } from './pages/MenuPage.js';
import { ItemDetailsSheet } from './pages/ItemDetailsSheet.js';
import { CartPage } from './pages/CartPage.js';
import { OrderConfirmedPage } from './pages/OrderConfirmedPage.js';
import { findItemById } from './data/menu.js';
import { cart } from './state/cart.js';
import { order } from './state/order.js';

const appEl = document.getElementById('app');
let currentSheet = null;

// --- Router ---

function getRoute() {
  const hash = window.location.hash || '#/';
  return hash.replace('#', '') || '/';
}

function navigate(path) {
  window.location.hash = path;
}

function render() {
  const route = getRoute();

  // Unmount any open sheet when navigating away
  if (currentSheet) {
    currentSheet.unmount();
    currentSheet = null;
  }

  // Clear the app container
  appEl.innerHTML = '';

  if (route === '/' || route === '') {
    const page = MenuPage({
      onItemSelect(id) {
        const item = findItemById(id);
        if (!item) return;

        // Beverages have no details sheet — just add directly with qty 1
        if (item.spiceLevels.length === 0 && item.extras.length === 0) {
          // For simple items (drinks, basic sushi), show the sheet anyway
          // so users can adjust quantity/instructions
        }

        currentSheet = ItemDetailsSheet({
          onClose() { currentSheet = null; },
          onAddedToCart() {
            currentSheet = null;
            // Brief visual feedback — flash the cart nav item
            const cartNav = document.querySelector('#nav-cart');
            if (cartNav) {
              cartNav.classList.add('scale-125');
              setTimeout(() => cartNav.classList.remove('scale-125'), 300);
            }
          }
        });
        currentSheet.mount(item);
      }
    });
    appEl.appendChild(page);

  } else if (route === '/cart') {
    const page = CartPage({
      async onPlaceOrder() {
        // 1. Insert into Supabase (orders row + all order_items rows).
        //    Throws on any DB error — execution stops here, cart is NOT cleared.
        await order.placeOrder({
          items: cart.getItems(),
          subtotal: cart.subtotal,
          hst: cart.hst,
          total: cart.total,
        });
        // 2. Clear cart only after both DB inserts succeeded.
        cart.clear();
        // 3. Navigate — OrderConfirmedPage reads from local cache (just populated above).
        navigate('/order-confirmed');
      }
    });
    appEl.appendChild(page);

  } else if (route === '/order-confirmed') {
    const page = OrderConfirmedPage({
      onBackToMenu() {
        navigate('/');
      }
    });
    appEl.appendChild(page);

  } else {
    // Fallback to menu
    navigate('/');
  }
}

// Listen to hash changes
window.addEventListener('hashchange', render);

// Initial render
render();
