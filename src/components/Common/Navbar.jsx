import React, { useState, useEffect, useRef } from 'react';
import MorphedMenu from './MorphedMenu';
import { Home, MapPin, Award, Sparkles, Users } from 'lucide-react';

export default function Navbar({
  activePage,
  setActivePage,
  activeDistrictTab,
  setActiveDistrictTab,
  isLoggedIn,
  userRole,
  onOpenLoginModal,
  onLogout
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredSubTab, setHoveredSubTab] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const isHome = activePage === 'home';

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 280);
  };

  const districtSubTabs = [
    { id: 'map-clubs', label: 'Interactive Map & Clubs', shortLabel: 'Map & Clubs', icon: <MapPin size={18} /> },
    { id: 'heritage', label: 'Past DRR & Heritage', shortLabel: 'Heritage', icon: <Award size={18} /> },
    { id: 'initiatives', label: 'Initiatives Showcase', shortLabel: 'Initiatives', icon: <Sparkles size={18} /> },
    { id: 'leadership', label: 'District Leadership', shortLabel: 'Leadership', icon: <Users size={18} /> }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const snapContainer = document.querySelector('.snap-container');
      const containerScroll = snapContainer ? snapContainer.scrollTop : 0;
      const windowScroll = window.scrollY || document.documentElement.scrollTop;
      const currentScroll = Math.max(windowScroll, containerScroll);

      // Automatically reveal when scrolled past 200px into Section 2 of homepage
      if (currentScroll > 200) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const snapContainer = document.querySelector('.snap-container');
    if (snapContainer) {
      snapContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    const interval = setInterval(handleScroll, 300);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (snapContainer) {
        snapContainer.removeEventListener('scroll', handleScroll);
      }
      clearInterval(interval);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [activePage]);

  // Navbar is hidden by default on all pages at top; shows on hover, scroll down, or menu open
  const shouldShowNavbar = isHovered || isScrolled || isMenuOpen;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'fixed',
        top: '0px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        pointerEvents: 'auto',
        paddingTop: '20px',
        paddingBottom: '20px',
        minWidth: '320px',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      {/* Floating Translucent Glass Capsule Navbar */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '7px 16px 7px 10px',
          backgroundColor: isMenuOpen ? 'transparent' : 'rgba(15, 18, 24, 0.75)',
          backdropFilter: isMenuOpen ? 'none' : 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: isMenuOpen ? 'none' : 'blur(24px) saturate(180%)',
          border: isMenuOpen ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: '9999px',
          boxShadow: isMenuOpen 
            ? 'none' 
            : '0 14px 40px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
          transform: shouldShowNavbar ? 'translateY(0) scale(1.1)' : 'translateY(-120px) scale(1.1)',
          opacity: shouldShowNavbar ? 1 : 0,
          pointerEvents: shouldShowNavbar ? 'auto' : 'none',
          transition: 'transform 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease'
        }}
      >
        {/* Home Icon Only (Clean icon, NO background box) */}
        <button
          onClick={() => setActivePage('home')}
          title="Home"
          aria-label="Go to Home"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#FFFFFF',
            cursor: 'pointer',
            opacity: isMenuOpen ? 0 : 1,
            pointerEvents: isMenuOpen ? 'none' : 'auto',
            transition: 'opacity 0.25s ease, color 0.2s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            if (!isMenuOpen) e.currentTarget.style.color = '#123499';
          }}
          onMouseLeave={(e) => {
            if (!isMenuOpen) e.currentTarget.style.color = '#FFFFFF';
          }}
        >
          <Home size={20} />
        </button>

        {/* Divider 1 */}
        <div 
          style={{ 
            width: '1px', 
            height: '20px', 
            backgroundColor: 'rgba(255, 255, 255, 0.18)', 
            margin: '0 2px',
            opacity: isMenuOpen ? 0 : 1,
            transition: 'opacity 0.25s ease'
          }} 
        />

        {/* Know Our District Sub-Tab Icons Section (Only rendered on District page) */}
        {activePage === 'district' && (
          <>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                opacity: isMenuOpen ? 0 : 1,
                pointerEvents: isMenuOpen ? 'none' : 'auto',
                transition: 'opacity 0.25s ease'
              }}
            >
              {districtSubTabs.map((tab) => {
                const isTabActive = activePage === 'district' && activeDistrictTab === tab.id;
                const isTabHovered = hoveredSubTab === tab.id;
                const isExpanded = isTabHovered || isTabActive;

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActivePage('district');
                      if (setActiveDistrictTab) setActiveDistrictTab(tab.id);
                    }}
                    onMouseEnter={() => setHoveredSubTab(tab.id)}
                    onMouseLeave={() => setHoveredSubTab(null)}
                    title={tab.label}
                    aria-label={tab.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: isExpanded ? '6px 12px' : '6px 8px',
                      borderRadius: '16px',
                      border: 'none',
                      backgroundColor: isTabActive 
                        ? 'rgba(255, 255, 255, 0.18)' 
                        : isTabHovered 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'transparent',
                      color: isTabHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
                      cursor: 'pointer',
                      transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                      outline: 'none'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', color: isTabActive ? '#123499' : 'inherit' }}>
                      {tab.icon}
                    </span>

                    {/* Text reveals smoothly on hover or active state */}
                    <span
                      style={{
                        maxWidth: isExpanded ? '120px' : '0px',
                        opacity: isExpanded ? 1 : 0,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      {tab.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Divider 2 */}
            <div 
              style={{ 
                width: '1px', 
                height: '20px', 
                backgroundColor: 'rgba(255, 255, 255, 0.18)', 
                margin: '0 2px',
                opacity: isMenuOpen ? 0 : 1,
                transition: 'opacity 0.25s ease'
              }} 
            />
          </>
        )}

        {/* Morphed Menu (Text Trigger) */}
        <MorphedMenu
          activePage={activePage}
          setActivePage={setActivePage}
          activeDistrictTab={activeDistrictTab}
          setActiveDistrictTab={setActiveDistrictTab}
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          onOpenLoginModal={onOpenLoginModal}
          onLogout={onLogout}
          onMenuOpenChange={setIsMenuOpen}
        />
      </div>
    </div>
  );
}
