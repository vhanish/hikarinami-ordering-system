import { supabase } from '../lib/supabase.js';

// Order session state — holds the history of all submitted order batches for this table session.
//
// Lifecycle:
//   1. User adds items to cart           →  only cart.js is touched
//   2. User clicks Place Order           →  order.placeOrder() appends a new batch to history,
//                                            then cart.clear() is called in main.js
//   3. OrderConfirmedPage reads          →  order.getLatestOrder() for the current confirmation
//                                            order.getOrderHistory() for the full session list
//   4. User clicks Back to Menu          →  history is NOT cleared — session persists
//   5. User adds more items, places again →  a second batch is appended to history
//
// History persists for the lifetime of the page (table session).
// A full page reload (new QR scan) starts a fresh session — history resets automatically.
//
// Supabase integration path:
//   - placeOrder() becomes async; sends the batch to Supabase, then pushes the
//     Supabase-returned row (with its real id) onto _orderHistory
//   - getOrderHistory() / getLatestOrder() stay the same — UI reads them the same way
//   - Kitchen dashboard queries Supabase directly by table number / session id
//   - Billing combines all rows for the table session into one receipt

// ---------------------------------------------------------------------------
// Table number
// ---------------------------------------------------------------------------
// Read once on module load from the URL query string: ?table=4
// QR code support: each table's QR links to https://yourapp.com/?table=4
// No code changes needed here when adding QR support — just ensure the QR URL
// includes the ?table= parameter.

function readTableNumber() {
  const params = new URLSearchParams(window.location.search);
  const t = params.get('table');
  return t !== null ? t : '4'; // TODO: replace fallback with QR-based table detection
}

// ---------------------------------------------------------------------------
// Order id / round id generation (local / frontend-only)
// ---------------------------------------------------------------------------
// Produces a temporary id suitable for testing without a backend.
// On Supabase integration: replace the return value with the Supabase row id.

function generateOrderId() {
  return 'HN-' + Math.floor(1000 + Math.random() * 9000);
}

// ---------------------------------------------------------------------------
// Session state
// ---------------------------------------------------------------------------

// Array of submitted order batches for the current table session.
// Each entry is one "round" / kitchen ticket.
let _orderHistory = [];

// Table number is fixed for the session (set by QR code URL param).
const _tableNumber = readTableNumber();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const order = {
  /**
   * Returns the full submitted order history for this table session.
   * Each entry represents one submitted round / kitchen ticket.
   *
   * Shape of each batch (ready for Supabase as a row):
   * {
   *   id:          string,          // 'HN-XXXX' locally; Supabase row id on integration
   *   round:       number,          // 1-based round number within the session
   *   tableNumber: string | null,   // from ?table= param
   *   items:       CartItem[],      // deep copy — fully independent of cart
   *   subtotal:    number,
   *   hst:         number,
   *   total:       number,
   *   placedAt:    string,          // ISO timestamp
   *   status:      string,          // 'preparing' — kitchen dashboard updates this
   * }
   *
   * Returns a shallow copy of the array so callers cannot mutate session state.
   */
  getOrderHistory() {
    return [..._orderHistory];
  },

  /**
   * Returns the most recently submitted batch, or null if nothing has been placed yet.
   * Used by OrderConfirmedPage to show the "Order Confirmed" confirmation for the latest round.
   */
  getLatestOrder() {
    return _orderHistory.length > 0 ? _orderHistory[_orderHistory.length - 1] : null;
  },

  /**
   * Returns true if at least one order batch has been submitted this session.
   */
  hasOrders() {
    return _orderHistory.length > 0;
  },

  /**
   * Returns the table number from ?table= URL param, or null if absent.
   */
  getTableNumber() {
    return _tableNumber;
  },

  /**
   * Inserts the order into Supabase (orders row + order_items rows), then
   * commits the batch to local session history.
   *
   * Throws on any DB error so the caller (main.js) can skip cart.clear().
   * Cart is only cleared after BOTH inserts succeed.
   */
  async placeOrder({ items, subtotal, hst, total }) {
    // ------------------------------------------------------------------
    // 1. Insert the order row
    // ------------------------------------------------------------------
    const { data: orderRow, error: orderErr } = await supabase
      .from('orders')
      .insert({
        table_number: _tableNumber,
        status:       'new',
        subtotal,
        hst,
        total,
      })
      .select('id, created_at, status')
      .single();

    if (orderErr) {
      console.error('[placeOrder] orders insert failed:', orderErr);
      throw orderErr;
    }

    // ------------------------------------------------------------------
    // 2. Build and insert all order item rows
    //    extras  → comma-separated names, or null when none selected
    //    spice   → null when item has no spice option or user kept default
    //    notes   → null when user left the field blank
    // ------------------------------------------------------------------
    const orderItemRows = items.map(ci => ({
      order_id:    orderRow.id,
      name:        ci.item.name,
      quantity:    ci.quantity,
      extras:      (ci.extras && ci.extras.length > 0)
                     ? ci.extras.map(e => e.name).join(', ')
                     : null,
      spice_level: ci.spiceLevel  || null,
      notes:       (ci.specialInstructions && ci.specialInstructions.trim())
                     ? ci.specialInstructions.trim()
                     : null,
    }));

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(orderItemRows);

    if (itemsErr) {
      console.error('[placeOrder] order_items insert failed:', itemsErr);
      throw itemsErr;
    }

    // ------------------------------------------------------------------
    // 3. Commit to local session cache — only reached when both inserts
    //    succeeded.  Deep-copy items so the batch is independent of cart.
    // ------------------------------------------------------------------
    const batch = {
      id:          orderRow.id,
      round:       _orderHistory.length + 1,
      tableNumber: _tableNumber,
      items:       items.map(ci => ({ ...ci, extras: [...ci.extras] })),
      subtotal,
      hst,
      total,
      placedAt:    orderRow.created_at,
      status:      orderRow.status,
    };
    _orderHistory.push(batch);
    return batch;
  },

  /**
   * Fetches all orders for this table from Supabase, newest first.
   * Filters by table_number when the ?table= param is present.
   * Returns each order with its items in the shape OrderConfirmedPage expects.
   */
  async fetchAllOrders() {
    let query = supabase
      .from('orders')
      .select('id, table_number, status, subtotal, hst, total, created_at, order_items(id, name, quantity, extras, spice_level, notes)')
      .order('created_at', { ascending: false });

    if (_tableNumber !== null) {
      query = query.eq('table_number', _tableNumber);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[fetchAllOrders] query failed:', error);
      throw error;
    }
    console.log('[fetchAllOrders] table_number filter:', _tableNumber, '| rows returned:', (data || []).length);

    const rows = data || [];
    return rows.map((o, i) => ({
      id:          o.id,
      round:       rows.length - i,       // oldest = round 1, newest = round N
      tableNumber: o.table_number,
      status:      o.status,
      subtotal:    parseFloat(o.subtotal),
      hst:         parseFloat(o.hst),
      total:       parseFloat(o.total),
      placedAt:    o.created_at,
      items:       (o.order_items || []).map(oi => ({
        name:        oi.name,
        quantity:    oi.quantity,
        extras:      oi.extras      || null,  // already a comma-separated string
        spice_level: oi.spice_level || null,
        notes:       oi.notes       || null,
      })),
    }));
  },

  /**
   * Computes the combined session totals across all submitted batches.
   * Used for the full-session receipt / billing view.
   *
   * Billing logic: sum all batches for the table session → one final receipt.
   */
  getSessionTotals() {
    const subtotal = _orderHistory.reduce((s, b) => s + b.subtotal, 0);
    const hst      = _orderHistory.reduce((s, b) => s + b.hst,      0);
    const total    = _orderHistory.reduce((s, b) => s + b.total,     0);
    return { subtotal, hst, total };
  },

  /**
   * Resets the entire session (clears history + resets round counter).
   * Not called during normal navigation — history should persist across rounds.
   * Call this only when starting a completely new table session
   * (e.g., on explicit "End Session" action, or handle via page reload / new QR scan).
   */
  clearSession() {
    _orderHistory = [];
  },
};
