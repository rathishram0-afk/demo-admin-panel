import { supabase } from './supabase';
import { GAME_COLLECTIONS } from '../data/gamingData';

/**
 * Service to manage Game Library using the structured Supabase SQL table 'game_library'.
 * Transforms flat rows into the nested category structure expected by the UI.
 */
export const gameLibraryService = {
  
  /**
   * Structure definitions for categories to keep the UI beautiful
   */
  getCategoryMetadata() {
    return {
      storyMode: {
        id: "story-mode",
        title: "STORY MODE GAMES",
        badge: "SOLO & CAMPAIGN"
      },
      multiplayer: {
        id: "multiplayer",
        title: "MULTIPLAYER GAMES",
        badge: "CO-OP & VERSUS"
      },
      racingSim: {
        id: "racing-sim",
        title: "RACING SIMULATOR",
        badge: "STEERING & PEDALS"
      },
      vrExperience: {
        id: "vr-experience",
        title: "VR EXPERIENCE",
        badge: "PS VR2 IMMERSIVE"
      }
    };
  },

  /**
   * Fetch all games and construct the nested object
   */
  async getGames() {
    const { data, error } = await supabase
      .from('game_library')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[gameLibraryService] Error fetching games:', error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      return null; // Indicates need for seeding
    }

    const categories = this.getCategoryMetadata();
    const result = {};

    // Initialize the structure based on categories
    Object.keys(categories).forEach(key => {
      result[key] = {
        ...categories[key],
        games: []
      };
    });

    // Populate games into their respective categories
    data.forEach(row => {
      // Map database row to frontend UI game structure
      const gameObj = {
        id: row.id,
        title: row.title,
        genre: row.genre,
        platform: row.platform,
        players: row.players,
        description: row.description || '',
        image: row.cover_image,
        featured: row.featured,
        isVisible: row.is_available,
        displayOrder: row.display_order
      };

      if (result[row.category]) {
        result[row.category].games.push(gameObj);
      } else {
        // Fallback for unknown categories if any ever get added
        result[row.category] = {
          id: row.category,
          title: row.category.toUpperCase(),
          badge: "OTHER",
          games: [gameObj]
        };
      }
    });

    // Update dynamic badges based on counts
    if (result.storyMode) result.storyMode.badge = `SOLO & CAMPAIGN (${result.storyMode.games.length} GAMES)`;
    if (result.multiplayer) result.multiplayer.badge = `CO-OP & VERSUS (${result.multiplayer.games.length} GAMES)`;
    if (result.racingSim) result.racingSim.badge = `STEERING & PEDALS (${result.racingSim.games.length} GAMES)`;
    if (result.vrExperience) result.vrExperience.badge = `PS VR2 IMMERSIVE (${result.vrExperience.games.length} GAMES)`;

    return result;
  },

  /**
   * Create a new game
   */
  async createGame(category, gameData) {
    const row = {
      title: gameData.title,
      category: category,
      platform: gameData.platform,
      genre: gameData.genre,
      players: gameData.players,
      description: gameData.description,
      cover_image: gameData.image,
      featured: gameData.featured || false,
      is_available: gameData.isVisible !== false,
      display_order: gameData.displayOrder || 0
    };

    const { data, error } = await supabase
      .from('game_library')
      .insert([row])
      .select();

    if (error) throw error;
    return data?.[0] || row;
  },

  /**
   * Update an existing game
   */
  async updateGame(id, gameData) {
    const row = {
      title: gameData.title,
      platform: gameData.platform,
      genre: gameData.genre,
      players: gameData.players,
      description: gameData.description,
      cover_image: gameData.image,
      featured: gameData.featured,
      is_available: gameData.isVisible,
      display_order: gameData.displayOrder
    };

    // If category is provided and changed, update it too (optional based on UI)
    if (gameData.category) {
      row.category = gameData.category;
    }

    const { data, error } = await supabase
      .from('game_library')
      .update(row)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0] || row;
  },

  /**
   * Delete a game
   */
  async deleteGame(id) {
    const { error } = await supabase
      .from('game_library')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  /**
   * Update just the display order of a batch of games (for drag/drop or sorting)
   */
  async updateDisplayOrders(updates) {
    // updates: Array of { id, displayOrder }
    const promises = updates.map(u => 
      supabase.from('game_library').update({ display_order: u.displayOrder }).eq('id', u.id)
    );
    await Promise.all(promises);
  },

  /**
   * Seed the database from local data if empty
   */
  async seedDatabase() {
    console.log('[gameLibraryService] Seeding database with default static data...');
    const rowsToInsert = [];

    Object.keys(GAME_COLLECTIONS).forEach(categoryKey => {
      const cat = GAME_COLLECTIONS[categoryKey];
      cat.games.forEach((game, index) => {
        rowsToInsert.push({
          title: game.title,
          category: categoryKey,
          platform: game.platform,
          genre: game.genre,
          players: game.players,
          description: game.description || '',
          cover_image: game.image,
          featured: game.featured || false,
          is_available: game.isVisible !== false,
          display_order: game.displayOrder !== undefined ? game.displayOrder : index
        });
      });
    });

    const { error } = await supabase
      .from('game_library')
      .upsert(rowsToInsert, { onConflict: 'title, platform' });

    if (error) {
      console.error('[gameLibraryService] Failed to seed database:', error.message);
      return null;
    }

    return this.getGames();
  }
};
