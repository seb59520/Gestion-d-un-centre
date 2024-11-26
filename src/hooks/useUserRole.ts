import { useAuth } from '../contexts/AuthContext';

export function useUserRole() {
  const { currentUser } = useAuth();

  const isDirector = currentUser?.role === 'director';
  const isAssistant = currentUser?.role === 'assistant';
  const isAnimator = currentUser?.role === 'animator';
  const isAdmin = isDirector || isAssistant;

  return {
    isDirector,
    isAssistant,
    isAnimator,
    isAdmin,
    role: currentUser?.role
  };
}