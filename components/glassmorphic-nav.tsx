"use client"

import { Home, Search, BarChart3, Bell, Settings, Check, Github, Palette, Zap, Wallet } from "lucide-react"
import { useState, useEffect } from "react"

interface Toast {
  id: number
  message: string
  visible: boolean
  showIcon: boolean
}

export function GlassmorphicNav() {
  const [toast, setToast] = useState<Toast | null>(null)
  const [account, setAccount] = useState<string | null>(null)

  const menuItems = [
    {
      icon: Home,
      label: "Home",
      href: "/",
      isActive: true,
    },
    {
      icon: Github,
      label: "Studio",
      href: "/studio",
    },
    {
      icon: Palette,
      label: "Test Studio",
      href: "/test_studio",
    },
    {
      icon: BarChart3,
      label: "Gallery",
      href: "/gallery",
    },
    {
      icon: Zap,
      label: "OpenSea",
      href: "https://opensea.io/collection/gridgit",
      external: true,
    },
  ]

  const showToast = (message: string) => {
    const newToast = {
      id: Date.now(),
      message,
      visible: true,
      showIcon: false,
    }
    setToast(newToast)

    setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, showIcon: true } : null))
    }, 200)
  }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast((prev) => (prev ? { ...prev, visible: false, showIcon: false } : null))
        setTimeout(() => setToast(null), 500)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleItemClick = (item: any) => {
    showToast(`${item.label} clicked!`)
    
    if (item.external) {
      window.open(item.href, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = item.href
    }
  }

  async function connectWallet() {
    try {
      const eth = (window as any).ethereum;
      if (!eth) {
        showToast('Please install MetaMask!');
        return;
      }
      const [addr] = await eth.request({ method: 'eth_requestAccounts' });
      setAccount(addr);
      showToast('Wallet connected successfully!');
    } catch (error) {
      showToast('Failed to connect wallet');
    }
  }

  return (
    <div className="relative">
      {/* Enhanced glassmorphic container */}
      <div className="w-80 p-8 rounded-3xl bg-white/8 backdrop-blur-2xl border border-white/20 shadow-2xl relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-blue-500/5 rounded-3xl"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Mozilla Headline, sans-serif' }}>
              <span style={{ 
                background: 'linear-gradient(135deg, #ff2db3, #8a2be2)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                GridGit
              </span>
            </h1>
            <p className="text-white/70 text-sm">GitHub Activity NFTs</p>
          </div>
          
          <nav className="space-y-3">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={index}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                    item.isActive ? "bg-white/20 shadow-md border border-white/30" : ""
                  }`}
                  onClick={() => handleItemClick(item)}
                >
                  <Icon className="w-5 h-5 text-white transition-transform duration-200 hover:scale-110" />
                  <span className="text-white font-medium text-sm">{item.label}</span>
                </div>
              )
            })}
          </nav>

          {/* Wallet Connection Section */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-center mb-4">
              <h3 className="text-sm font-medium text-white/70 mb-2">Wallet Connection</h3>
              {account ? (
                <div className="px-4 py-3 rounded-xl bg-white/10 border border-white/20">
                  <div className="text-white font-medium text-sm mb-1">Connected</div>
                  <div className="text-white/60 text-xs font-mono">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </div>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-white/20 transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-3"
                >
                  <Wallet className="w-4 h-4 text-white" />
                  <span className="text-white font-medium text-sm">Connect Wallet</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced toast notification */}
      {toast && (
        <div
          className={`absolute top-full mt-6 left-0 right-0 p-5 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl transition-all duration-500 ease-out transform-gpu z-20 ${
            toast.visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
          }`}
          style={{
            animation: toast.visible
              ? "slideInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
              : "slideOutDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-all duration-300 ease-out ${
                toast.showIcon ? "scale-100 rotate-0" : "scale-0 rotate-180"
              }`}
            >
              <Check
                className={`w-4 h-4 text-white transition-all duration-200 delay-100 ${
                  toast.showIcon ? "opacity-100 scale-100" : "opacity-0 scale-50"
                }`}
              />
            </div>
            <span
              className={`text-white font-medium text-sm transition-all duration-300 delay-75 ${
                toast.visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
              }`}
            >
              {toast.message}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 rounded-b-2xl overflow-hidden">
            <div
              className={`h-full bg-white/30 transition-all duration-2500 ease-linear ${
                toast.visible ? "w-0" : "w-full"
              }`}
              style={{
                animation: toast.visible ? "progressBar 2.5s linear" : "none",
              }}
            />
          </div>
        </div>
      )}

      {/* Enhanced call to action button */}
      <div className="absolute top-full mt-10 left-0 right-0 z-10">
        <div className="text-center">
          <a
            href="/studio"
            className="inline-block px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-600/20 backdrop-blur-2xl border border-white/20 shadow-2xl hover:from-pink-500/30 hover:to-purple-600/30 hover:scale-105 transition-all duration-300 ease-out group"
          >
            <span className="text-white font-semibold text-lg group-hover:text-pink-200 transition-colors duration-300">
              🚀 Mint Your NFT
            </span>
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          0% {
            opacity: 0;
            transform: translateY(2rem) scale(0.9);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-0.2rem) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideOutDown {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(1rem) scale(0.95);
          }
        }
        
        @keyframes progressBar {
          0% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}
