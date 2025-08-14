"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SimpleNav() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/' as const, label: 'Home' },
    { href: '/studio' as const, label: 'Studio' },
    { href: '/test_studio' as const, label: 'Test Studio' },
    { href: '/gallery' as const, label: 'Gallery' },
  ];

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link href="/" className="brand" style={{ 
          fontSize: '1.5rem', 
          background: 'linear-gradient(135deg, #ff2db3, #8a2be2)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          fontWeight: 900,
          fontFamily: 'Mozilla Headline, sans-serif'
        }}>
          GridGit
        </Link>
        <nav className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          <a 
            href="https://opensea.io/collection/gridgit" 
            target="_blank" 
            rel="noreferrer" 
            className="nav-link"
          >
            OpenSea
          </a>
        </nav>
      </div>
    </header>
  );
}
