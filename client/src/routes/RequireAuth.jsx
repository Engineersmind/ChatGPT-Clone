import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function RequireAuth({ children, loggedIn }) {
  const location = useLocation();

  if (!loggedIn) {

    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}