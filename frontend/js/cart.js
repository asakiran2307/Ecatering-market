// cart.js — Cart state management (localStorage-backed)
const CART_KEY = 'ecatring_cart';

export const cart = {
  _data: null,

  _load() {
    if (this._data) return this._data;
    try {
      this._data = JSON.parse(localStorage.getItem(CART_KEY)) || { caterer_id: null, caterer_name: '', items: {} };
    } catch {
      this._data = { caterer_id: null, caterer_name: '', items: {} };
    }
    return this._data;
  },

  _save() {
    localStorage.setItem(CART_KEY, JSON.stringify(this._data));
    window.dispatchEvent(new CustomEvent('cart:changed'));
  },

  get() { return this._load(); },

  count() {
    const d = this._load();
    return Object.values(d.items).reduce((s, i) => s + i.qty, 0);
  },

  total() {
    const d = this._load();
    return Object.values(d.items).reduce((s, i) => s + i.price * i.qty, 0);
  },

  addItem(caterer_id, caterer_name, item) {
    const d = this._load();
    if (d.caterer_id && d.caterer_id !== caterer_id) {
      // Different caterer — clear cart
      this.clear();
      this._data = this._load();
    }
    if (!d.caterer_id) { d.caterer_id = caterer_id; d.caterer_name = caterer_name; }
    const key = String(item.id);
    if (d.items[key]) {
      d.items[key].qty += 1;
    } else {
      d.items[key] = { id: item.id, name: item.name, price: item.price, category: item.category, qty: 1 };
    }
    this._save();
    return true;
  },

  setQty(item_id, qty) {
    const d = this._load();
    const key = String(item_id);
    if (!d.items[key]) return;
    if (qty <= 0) {
      delete d.items[key];
    } else {
      d.items[key].qty = qty;
    }
    if (Object.keys(d.items).length === 0) {
      d.caterer_id = null;
      d.caterer_name = '';
    }
    this._save();
  },

  removeItem(item_id) { this.setQty(item_id, 0); },

  clear() {
    this._data = { caterer_id: null, caterer_name: '', items: {} };
    this._save();
  },

  getQty(item_id) {
    return this._load().items[String(item_id)]?.qty || 0;
  },

  isEmpty() { return this.count() === 0; },
};

export default cart;
