// Cart state — simple observable module

const listeners = new Set();
let _items = [];

function notify() {
  listeners.forEach(fn => fn(_items));
}

export const cart = {
  subscribe(fn) {
    listeners.add(fn);
    fn(_items); // immediate call with current state
    return () => listeners.delete(fn);
  },

  getItems() {
    return _items;
  },

  addItem({ item, quantity, spiceLevel, extras, specialInstructions }) {
    const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
    const unitPrice = item.price + extrasTotal;

    // Check if identical item+options already in cart
    const existing = _items.find(
      ci =>
        ci.item.id === item.id &&
        ci.spiceLevel === spiceLevel &&
        JSON.stringify(ci.extras.map(e => e.name)) === JSON.stringify(extras.map(e => e.name)) &&
        ci.specialInstructions === specialInstructions
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      _items = [
        ..._items,
        { id: Date.now(), item, quantity, spiceLevel, extras, specialInstructions, unitPrice }
      ];
    }
    notify();
  },

  removeItem(id) {
    _items = _items.filter(ci => ci.id !== id);
    notify();
  },

  updateQuantity(id, qty) {
    if (qty <= 0) {
      cart.removeItem(id);
      return;
    }
    _items = _items.map(ci => ci.id === id ? { ...ci, quantity: qty } : ci);
    notify();
  },

  clear() {
    _items = [];
    notify();
  },

  get subtotal() {
    return _items.reduce((sum, ci) => sum + ci.unitPrice * ci.quantity, 0);
  },

  get hst() {
    return this.subtotal * 0.13;
  },

  get total() {
    return this.subtotal + this.hst;
  },

  get count() {
    return _items.reduce((sum, ci) => sum + ci.quantity, 0);
  }
};
