"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useFarcasterMiniApp } from '@/lib/useFarcasterMiniApp';
import { useAccount } from 'wagmi';

export function HorizontalNav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isInMiniApp, user, client } = useFarcasterMiniApp();
  const { address: account, isConnected } = useAccount();
  
  const navItems = [
    { href: '/' as const, label: 'Home' },
    { href: '/studio' as const, label: 'Studio' },
    { href: '/test_studio' as const, label: 'Test Studio' },
    { href: isConnected ? `/gallery/${account}` as const : '/gallery' as const, label: 'Gallery' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="horizontal-navbar">
      <div className="nav-inner">
        <Link href="/" className="brand font-display font-black text-2xl text-text-primary">
          GridGit
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="nav-links desktop-only">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link text-sm font-medium transition-all duration-200 ${
                pathname === item.href ? 'active' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://opensea.io/collection/gridgit-292351702"
            target="_blank"
            rel="noreferrer"
            className="nav-link text-sm font-medium transition-all duration-200"
          >
            OpenSea
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-button desktop-hidden"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <div className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        {/* Wallet Section */}
        <div className="wallet-section">
          {isInMiniApp && user ? (
            <div className="farcaster-user">
              <div className="user-info">
                <span className="username">@{user.username || user.fid}</span>
                {user.displayName && (
                  <span className="display-name">{user.displayName}</span>
                )}
              </div>
              {user.pfpUrl && (
                <img 
                  src={user.pfpUrl} 
                  alt="Profile" 
                  className="user-avatar"
                />
              )}
            </div>
          ) : (
            <appkit-button />
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <nav className="mobile-nav-links">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-link ${pathname === item.href ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://opensea.io/collection/gridgit-292351702"
            target="_blank"
            rel="noreferrer"
            className="mobile-nav-link"
            onClick={closeMobileMenu}
          >
            OpenSea
          </a>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu} />
      )}
    </header>
  );
}
