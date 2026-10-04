'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, openLoginModal, logout } = useAuth();
  const { itemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 w-full z-50 bg-surface shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Topmost Official & Trust Bar */}
      <div className="bg-primary-container text-on-primary py-space-xs px-4 md:px-margin-desktop">
        <div className="max-w-7xl mx-auto flex items-center justify-between font-label-sm text-label-sm">
          <div className="flex items-center gap-space-lg">
            <span>
              <span className="font-code-md text-code-md uppercase">GSTIN: 09AAAFB1234F1Z5</span> • CIB&amp;RC Reg. Govt. Licensed Depot
            </span>
            <span className="hidden lg:inline">मुख्य बाज़ार, मण्डी रोड, उत्तर प्रदेश (Main Market, Mandi Road, UP)</span>
          </div>
          <div className="flex items-center gap-space-md md:gap-space-lg">
            <span className="hidden sm:flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[15px]">call</span> किसान हेल्पलाइन: 1800-890-5421
            </span>
            <span className="flex items-center gap-space-xs text-on-primary font-bold">
              <span className="material-symbols-outlined text-[15px]">chat</span> WhatsApp: +91 79836 36796
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="h-20 max-w-7xl mx-auto px-4 md:px-margin-desktop flex items-center justify-between gap-space-md">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-space-sm shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow">
            <span className="material-symbols-outlined text-[24px]">agriculture</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md tracking-tight text-primary font-bold leading-none">
              भगवती किसान मार्ट
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">
              Maa Bhagwati Kisan Seva Kendra
            </span>
          </div>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex items-center">
          <div className="w-full flex items-center bg-surface-container-lowest rounded-lg px-space-md py-space-xs shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-outline-variant/30">
            <span className="material-symbols-outlined text-outline mr-space-sm text-[20px]">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-outline outline-none"
              placeholder="दवा, खाद, बीज या ब्रांड खोजें (Search Insecticides, Fertilizers, Seeds...)"
              type="text"
            />
            <button
              type="submit"
              className="bg-primary text-on-primary px-space-md py-1 rounded-lg font-label-md text-label-md flex items-center hover:bg-primary-container transition-colors shrink-0"
            >
              खोजें
            </button>
          </div>
        </form>

        {/* Right Action Icons: Trust Badge, User Profile, Cart Drawer */}
        <div className="flex items-center gap-space-sm md:gap-space-md">
          {/* Trust Badge */}
          <div className="hidden lg:flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-lg">
            <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
            <div className="flex flex-col">
              <span className="font-label-sm text-[11px] leading-none text-on-surface font-bold">100% पक्का बिल</span>
              <span className="font-code-md text-[10px] text-on-surface-variant leading-none">GST Verified</span>
            </div>
          </div>

          {/* Cart Icon */}
          <Link
            href="/cart"
            id="header-cart-btn"
            className="relative flex items-center gap-1 bg-surface-container-lowest border border-outline-variant/40 px-space-sm py-2 rounded-lg hover:bg-surface-container-low transition-colors text-primary"
          >
            <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
            <span className="font-label-md font-bold hidden sm:inline">कार्ट</span>
            {itemCount > 0 && (
              <span
                id="cart-badge-count"
                className="absolute -top-1.5 -right-1.5 bg-secondary text-on-secondary rounded-full font-code-md text-xs w-5 h-5 flex items-center justify-center font-bold shadow"
              >
                {itemCount}
              </span>
            )}
          </Link>

          {/* User Account / Profile */}
          <div className="relative">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-primary-fixed/40 px-space-sm py-1.5 rounded-lg border border-primary/20 hover:bg-primary-fixed/60 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="font-label-sm font-bold text-primary hidden sm:inline max-w-[100px] truncate">
                    {user?.name || user?.phoneNumber.replace('+91', '')}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-primary">expand_more</span>
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/40 py-2 z-50 animate-in fade-in slide-in-from-top-1"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-surface-container">
                      <p className="font-label-sm font-bold text-on-surface truncate">{user?.name || 'किसान मित्र'}</p>
                      <p className="font-code-md text-xs text-on-surface-variant">{user?.phoneNumber}</p>
                      {user?.role && user.role !== 'customer' && (
                        <span className="mt-1 inline-block px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                          {user.role === 'owner' ? 'Store Owner' : 'Store Staff'}
                        </span>
                      )}
                    </div>
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-surface-container-low text-on-surface font-label-md">
                      <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                      किसान प्रोफ़ाइल
                    </Link>
                    <Link href="/orders" className="flex items-center gap-2 px-4 py-2 hover:bg-surface-container-low text-on-surface font-label-md">
                      <span className="material-symbols-outlined text-[18px] text-primary">receipt_long</span>
                      मेरे ऑर्डर (Order History)
                    </Link>
                    {user?.role && user.role !== 'customer' && (
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2 hover:bg-surface-container-low text-secondary font-label-md font-bold">
                        <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                        संचालक पोर्टल (Admin)
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-error-container/20 text-error font-label-md"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      लॉग आउट (Logout)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={() => openLoginModal()}
                className="flex items-center gap-1.5 bg-primary text-on-primary px-space-md py-2 rounded-lg font-label-md hover:bg-primary-container transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>लॉगिन</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="bg-surface-container-low py-space-xs px-4 md:px-margin-desktop border-t border-outline-variant/20 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-space-md whitespace-nowrap">
          <nav className="flex items-center gap-space-xs sm:gap-space-sm">
            <Link
              href="/products"
              className="px-space-sm py-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest rounded-lg font-label-md transition-colors"
            >
              सभी उत्पाद (All Catalog)
            </Link>
            <Link
              href="/products?category=insecticide"
              className="px-space-sm py-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest rounded-lg font-label-md transition-colors"
            >
              कीटनाशक (Insecticides)
            </Link>
            <Link
              href="/products?category=fungicide"
              className="px-space-sm py-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest rounded-lg font-label-md transition-colors"
            >
              फफूंदनाशक (Fungicides)
            </Link>
            <Link
              href="/products?category=herbicide"
              className="px-space-sm py-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest rounded-lg font-label-md transition-colors"
            >
              खरपतवारनाशक (Herbicides)
            </Link>
            <Link
              href="/products?category=fertilizer"
              className="px-space-sm py-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest rounded-lg font-label-md transition-colors"
            >
              खाद व उर्वरक (Fertilizers)
            </Link>
            <Link
              href="/products?category=seed"
              className="px-space-sm py-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-lowest rounded-lg font-label-md transition-colors"
            >
              उन्नत बीज (Seeds)
            </Link>
          </nav>
          <div className="hidden lg:flex items-center gap-space-xs font-label-sm text-secondary">
            <span className="material-symbols-outlined text-[16px]">storefront</span>
            <span>दुकान से उठाव (Pickup) / गाँव डिलीवरी</span>
          </div>
        </div>
      </div>
    </header>
  );
};
