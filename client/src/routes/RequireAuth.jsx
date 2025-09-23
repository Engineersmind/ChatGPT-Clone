import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Reads auth status from localStorage. In larger apps you might use context.
const USER_KEY = 'chatapp_remember_user';

export default function RequireAuth({ children }) {
  const location = useLocation();
  let isAuthed = false;
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      isAuthed = !!parsed?.id;
    }
  } catch {
    isAuthed = false;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
