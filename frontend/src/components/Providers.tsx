'use client';

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { LoginModal } from './LoginModal';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <LoginModal />
      </CartProvider>
    </AuthProvider>
  );
};
