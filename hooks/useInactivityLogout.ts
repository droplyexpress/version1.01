import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UseInactivityLogoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onlyForRole?: string;
}

export function useInactivityLogout({
  timeoutMinutes = 120, // 2 hours
  warningMinutes = 10,  // Show warning 10 minutes before logout
  onlyForRole = 'repartidor'
}: UseInactivityLogoutOptions = {}) {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only apply inactivity timeout to specific role
    if (!currentUser || currentUser.rol !== onlyForRole) {
      return;
    }

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

    const resetInactivityTimer = () => {
      // Clear previous timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      warningShownRef.current = false;

      // Set warning timer
      inactivityTimerRef.current = setTimeout(() => {
        if (!warningShownRef.current) {
          warningShownRef.current = true;
          toast({
            title: '⚠️ Sesión inactiva',
            description: `Tu sesión se cerrará en ${warningMinutes} minutos por inactividad.`,
            duration: 5000,
          });
        }
      }, warningMs);

      // Set logout timer
      timeoutRef.current = setTimeout(() => {
        console.log('[Inactivity] User inactive for 2 hours, logging out...');
        toast({
          title: 'Sesión cerrada',
          description: 'Tu sesión ha sido cerrada por inactividad.',
          duration: 3000,
        });
        logout();
      }, timeoutMs);
    };

    // Events to listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, true);
    });

    // Initialize timer on mount
    resetInactivityTimer();

    return () => {
      // Clean up event listeners
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity, true);
      });

      // Clear timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [currentUser, logout, toast, timeoutMinutes, warningMinutes, onlyForRole]);
}
