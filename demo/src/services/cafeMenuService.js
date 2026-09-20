import { supabase } from './supabase.js';
import { MENU_DATA } from '../data/gamingData.js';

export function normalizeCategoryKey(rawCat) {
  if (!rawCat) return 'drinks';
  const str = String(rawCat).trim().toLowerCase();
  if (str === 'drinks' || str === 'cold drinks' || str === 'drink') return 'drinks';
  if (str === 'shakes' || str === 'thick shakes' || str === 'thick shake') return 'shakes';
  if (str === 'snacks' || str === 'snacks & chips' || str === 'snack') return 'snacks';
  if (str === 'waffles' || str === 'waffle') return 'waffles';
  if (str === 'fries_momos' || str === 'fries & momos' || str === 'fries' || str === 'momos') return 'fries_momos';
  if (str === 'burger_sandwich' || str === 'burger & sandwich' || str === 'burgers' || str === 'sandwiches' || str === 'burger' || str === 'sandwich') return 'burger_sandwich';
  
  return str.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/**
 * Service to manage Cafe Menu using the structured Supabase SQL table 'cafe_menu'.
 * Transforms flat rows into the nested category structure expected by the UI.
 */
export const cafeMenuService = {

  /**
   * Fetch all menu items and construct the nested object
   */
  async getMenuItems() {
    const { data, error } = await supabase
      .from('cafe_menu')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[cafeMenuService] Error fetching menu items:', error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      return null; // Indicates need for seeding
    }

    const result = {
      drinks: [],
      shakes: [],
      snacks: [],
      waffles: [],
      fries_momos: [],
      burger_sandwich: []
    };

    // Group items into their respective categories
    data.forEach(row => {
      const normKey = normalizeCategoryKey(row.category);
      // Map database row to frontend UI menu structure
      const itemObj = {
        id: row.id,
        name: row.name,
        category: row.category, // raw string
        categoryKey: normKey,
        price: `₹${row.price}`, // Formatted string expected by legacy UI
        numericPrice: row.price,
        tagline: row.description || '', // Maps from tagline
        image: row.image_url,
        badge: row.is_featured ? '⭐ POPULAR' : '', // Fallback badge text if featured
        status: row.is_available ? 'AVAILABLE' : 'OUT_OF_STOCK',
        featured: row.is_featured,
        isVisible: row.is_available,
        displayOrder: row.display_order
      };

      if (!result[normKey]) {
        result[normKey] = [];
      }
      
      result[normKey].push(itemObj);

      if (row.category && row.category !== normKey && !result[row.category]) {
        result[row.category] = result[normKey];
      }
    });

    return result;
  },

  /**
   * Create a new menu item
   */
  async createMenuItem(itemData) {
    const row = {
      name: itemData.name,
      category: itemData.category,
      description: itemData.tagline,
      price: itemData.numericPrice || parseFloat(String(itemData.price).replace(/[^0-9.]/g, '')) || 0,
      image_url: itemData.image,
      is_available: itemData.isVisible !== false && itemData.status !== 'OUT_OF_STOCK',
      is_featured: itemData.featured || false,
      display_order: itemData.displayOrder || 0
    };

    const { data, error } = await supabase
      .from('cafe_menu')
      .insert([row])
      .select();

    if (error) throw error;
    return data?.[0] || row;
  },

  /**
   * Update an existing menu item
   */
  async updateMenuItem(id, itemData) {
    const row = {
      name: itemData.name,
      category: itemData.category,
      description: itemData.tagline,
      price: itemData.numericPrice || parseFloat(String(itemData.price).replace(/[^0-9.]/g, '')) || 0,
      image_url: itemData.image,
      is_available: itemData.isVisible !== false && itemData.status !== 'OUT_OF_STOCK',
      is_featured: itemData.featured || false,
      display_order: itemData.displayOrder
    };

    const { data, error } = await supabase
      .from('cafe_menu')
      .update(row)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0] || row;
  },

  /**
   * Delete a menu item
   */
  async deleteMenuItem(id) {
    const { error } = await supabase
      .from('cafe_menu')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  /**
   * Update just the display order of a batch of items
   */
  async updateDisplayOrders(updates) {
    // updates: Array of { id, displayOrder }
    const promises = updates.map(u => 
      supabase.from('cafe_menu').update({ display_order: u.displayOrder }).eq('id', u.id)
    );
    await Promise.all(promises);
  },

  /**
   * Seed the database from local data if empty
   */
  async seedDatabase() {
    console.log('[cafeMenuService] Seeding database with default static data...');
    const rowsToInsert = [];

    Object.keys(MENU_DATA).forEach(categoryKey => {
      const items = MENU_DATA[categoryKey];
      items.forEach((item, index) => {
        rowsToInsert.push({
          name: item.name,
          category: categoryKey,
          description: item.tagline || '',
          price: item.numericPrice || parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0,
          image_url: item.image,
          is_available: item.status === 'AVAILABLE' && item.isVisible !== false,
          is_featured: item.badge ? true : false,
          display_order: item.displayOrder !== undefined ? item.displayOrder : index
        });
      });
    });

    const { error } = await supabase
      .from('cafe_menu')
      .upsert(rowsToInsert, { onConflict: 'name, category' });

    if (error) {
      console.error('[cafeMenuService] Failed to seed database:', error.message);
      return null;
    }

    return this.getMenuItems();
  }
};
