import { supabase } from './supabase';

/**
 * Auth Service - Handles Admin Authentication (Non-React usage)
 * React components should use the AuthContext (useAuth) hook instead.
 */
export const authService = {
  // Perform login with Supabase
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    return { success: true, data };
  },

  // Perform logout
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout Error:", error.message);
    }
  }
};
