"use client";

import { HorizontalNav } from '@/components/horizontal-nav';

export default function Home() {
  return (
    <div className="tt-view">
      <HorizontalNav />
      <main style={{ paddingTop: '80px' }}>
        {/* Hero Section */}
        <header className="tt-hero gradient-top-right">
          <div className="tt-hero-intro z-1">
            <div className="tt-gradient-container">
              <div className="tt-gradient-panel-unsticky">
                <div data-wf--gradient-position--sticky="no" className="tt-gradient-position">
                  <div className="tt-gradient-rive w-variant-edac47b4-7f20-2f04-107c-8cb935528e75"></div>
                </div>
              </div>
            </div>
            <div className="tt-heading-content center gap-4">
              <h1 className="heading-xxlarge z-1">Transform your <em className="bold-italic-framed">GitHub</em> contributions into&nbsp;<em className="slim-italic">unique NFTs</em> 🚀 with <span className="underline"><em>deterministic</em></span> generation</h1>
              <div className="tt-code-examples large">
                <div className="tt-button-group mt-0">
                  <a href="/studio" className="tt-button btn-primary btn-arrow w-inline-block">
                    <div className="btn-content">Start Minting</div>
                    <div className="btn-primary-arrow w-embed">
                      <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 7.38197L15.4495 7.10674L15.4484 7.10617L15.4455 7.10464L15.4188 7.09062C15.393 7.07688 15.3516 7.05438 15.2965 7.02295C15.1862 6.96006 15.0213 6.86173 14.8166 6.72686C14.4066 6.45661 13.8417 6.0427 13.2383 5.47699C12.029 4.34323 10.6931 2.62752 10.1006 0.257465L8.16032 0.742531C8.87215 3.58987 10.4711 5.62416 11.8704 6.93606C11.8933 6.95756 11.9162 6.97887 11.9391 7H0V9H11.9391C11.9162 9.02112 11.8933 9.04244 11.8704 9.06394C10.4711 10.3758 8.87215 12.4101 8.16032 15.2575L10.1006 15.7425C10.6931 13.3725 12.029 11.6568 13.2383 10.523C13.8417 9.9573 14.4066 9.54339 14.8166 9.27313C15.0213 9.13826 15.1862 9.03994 15.2965 8.97705C15.3516 8.94562 15.393 8.92311 15.4188 8.90937L15.4455 8.89535L15.4484 8.89383L15.4495 8.89326L16 8.61803V7.38197Z" fill="currentColor"></path>
                      </svg>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Animated Marquee Section */}
        <section className="tt-marquee-section">
          <div className="tt-marquee-group">
            <div className="tt-marquee-slider">
              <div className="marquee-text marquee-right-speed-1">
                Build • Deploy • Mint • Collect • Build • Deploy • Mint • Collect
              </div>
            </div>
            <div className="tt-marquee-slider">
              <div className="marquee-text marquee-left-speed-2 is-outline-dark">
                GitHub • Blockchain • NFTs • Web3 • GitHub • Blockchain • NFTs • Web3
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="tt-section pb-12 pt-0">
          <div className="tt-heading-content center">
            <div className="tt-heading-group centered">
              <p className="intro-text mt-0">GridGit Suite</p>
              <h2 className="heading-xlarge">Create your <strong className="headline-decoration">contribution NFTs</strong> with the features you want</h2>
            </div>
            <div className="intro-text">
              <p>GridGit is the deterministic and open source NFT framework. Generate unique visual representations of your coding activity with guaranteed consistency between preview and mint.</p>
            </div>
          </div>
          
          <div className="container">
            <div className="explore">
              <div className="nft-card">
                <div className="nft-media">
                  <div style={{ fontSize: '3rem', color: '#ff2db3' }}>🎨</div>
                </div>
                <div className="nft-body">
                  <div className="nft-title">Deterministic Generation</div>
                  <div className="nft-sub">Same input always produces the same NFT</div>
                </div>
              </div>
              
              <div className="nft-card">
                <div className="nft-media">
                  <div style={{ fontSize: '3rem', color: '#8a2be2' }}>🔗</div>
                </div>
                <div className="nft-body">
                  <div className="nft-title">GitHub Integration</div>
                  <div className="nft-sub">Direct connection to your contribution data</div>
                </div>
              </div>
              
              <div className="nft-card">
                <div className="nft-media">
                  <div style={{ fontSize: '3rem', color: '#00E5FF' }}>🚀</div>
                </div>
                <div className="nft-body">
                  <div className="nft-title">Instant Minting</div>
                  <div className="nft-sub">Preview and mint in one seamless flow</div>
                </div>
              </div>
              
              <div className="nft-card">
                <div className="nft-media">
                  <div style={{ fontSize: '3rem', color: '#00FFA3' }}>💎</div>
                </div>
                <div className="nft-body">
                  <div className="nft-title">Unique Patterns</div>
                  <div className="nft-sub">Every contribution creates a distinct visual</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Client Quotes Section */}
        <section className="tt-client-quote-section">
          <div className="container">
            <div className="tt-client-quote-wrap">
              <blockquote>
                &ldquo;GridGit has revolutionized how I think about my coding contributions. 
                <span className="blockquote-span-dark"> Every commit now has a visual story.&rdquo;</span>
              </blockquote>
              <div className="tt-client-logo-wrap">
                <div className="tt-client-quote-logo dark">
                  <img src="https://github.com/github.png" alt="GitHub" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'white' }}>Open Source Developer</div>
                  <div className="text-note">Active GitHub contributor</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

