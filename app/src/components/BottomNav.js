import { cart } from '../state/cart.js';

// active: 'menu' | 'cart' | 'orders'
export function BottomNav(active) {
  const el = document.createElement('nav');
  el.className = 'fixed bottom-0 left-0 w-full flex justify-around items-center h-20 pb-safe px-4 bg-[#f9f9f9] z-[60] shadow-[0px_-4px_24px_0px_rgba(26,28,28,0.04)]';
  el.id = 'bottom-nav';

  function render(cartCount) {
    const isMenu = active === 'menu';
    const isCart = active === 'cart';
    const isOrders = active === 'orders';

    el.innerHTML = `
      <a id="nav-menu" href="#/" class="flex flex-col items-center justify-center ${isMenu ? 'text-[#af101a] scale-105' : 'text-[#5f5e5e]'} transition-transform cursor-pointer">
        <span class="material-symbols-outlined ${isMenu ? '' : ''}" style="${isMenu ? "font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24" : ''}">restaurant_menu</span>
        <span class="font-['Plus_Jakarta_Sans'] text-[0.6875rem] ${isMenu ? 'font-bold' : 'font-medium'} tracking-widest uppercase mt-1">Menu</span>
      </a>
      <a id="nav-cart" href="#/cart" class="flex flex-col items-center justify-center ${isCart ? 'text-[#af101a] scale-105' : 'text-[#5f5e5e]'} transition-transform cursor-pointer relative">
        <span class="relative inline-block">
          <span class="material-symbols-outlined" style="${isCart ? "font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24" : ''}">shopping_cart</span>
          ${cartCount > 0 ? `<span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#d32f2f] text-white text-[0.5rem] font-bold flex items-center justify-center leading-none">${cartCount > 9 ? '9+' : cartCount}</span>` : ''}
        </span>
        <span class="font-['Plus_Jakarta_Sans'] text-[0.6875rem] ${isCart ? 'font-bold' : 'font-medium'} tracking-widest uppercase mt-1">Cart</span>
      </a>
      <a id="nav-orders" href="#/order-confirmed" class="flex flex-col items-center justify-center ${isOrders ? 'text-[#af101a] scale-105' : 'text-[#5f5e5e]'} transition-transform cursor-pointer">
        <span class="material-symbols-outlined" style="${isOrders ? "font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24" : ''}">receipt_long</span>
        <span class="font-['Plus_Jakarta_Sans'] text-[0.6875rem] ${isOrders ? 'font-bold' : 'font-medium'} tracking-widest uppercase mt-1">Orders</span>
      </a>
    `;
  }

  // Initial render
  render(cart.count);

  // Subscribe to cart changes to update badge
  cart.subscribe(() => render(cart.count));

  return el;
}
