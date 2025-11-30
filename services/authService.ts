import { supabase } from '@/lib/supabase';

export const authService = {
  /**
   * Sign in a user with email and password
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle common Supabase auth errors
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email o contraseña incorrectos');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Por favor confirma tu email');
        }
        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al iniciar sesión. Intenta de nuevo.');
    }
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw on logout errors, just log them
    }
  },

  /**
   * Get the current session
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }
      return data.session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  /**
   * Check if email exists in auth system
   */
  async emailExists(email: string) {
    try {
      // This method requires admin credentials, so we use a workaround
      // by attempting to sign up and checking if it fails with "already exists"
      const { error } = await supabase.auth.signUp({
        email,
        password: 'temp_password_123',
      });

      // If no error, the signup succeeded (email doesn't exist)
      // If error includes "already exists", the email exists
      return error?.message?.includes('already exists') || false;
    } catch (error) {
      console.error('Error checking if email exists:', error);
      return false;
    }
  },
};
