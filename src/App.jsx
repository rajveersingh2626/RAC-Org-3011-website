import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import PublicHome from './components/Pages/PublicHome';
import DistrictAccess from './components/Pages/DistrictAccess';
import PortalPage from './components/Pages/PortalPage';
import LoginModal from './components/Modals/LoginModal';
import PresidentModal from './components/Modals/PresidentModal';
import { INITIAL_CLUBS } from './data/districtData';
import { getParsedClubsFromExcel } from './data/excelReader';
import rotaryLogoImg from '../images.png';

// Spinning Rotary Wheel Logo for Glass Loading Screen
function RotaryLoaderLogo({ size = 96 }) {
  return (
    <img
      src={rotaryLogoImg}
      alt="Rotary International Logo"
      loading="eager"
      decoding="async"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        animation: 'rotarySpin 3.5s linear infinite'
      }}
    />
  );
}

export default function App() {
  // Navigation State ('home' | 'district' | 'portal')
  const [activePage, setActivePage] = useState('home');

  // District Sub-navigation ('map-clubs' | 'heritage' | 'initiatives' | 'leadership')
  const [activeDistrictTab, setActiveDistrictTab] = useState('map-clubs');

  // Dynamic Clubs Data State
  const [clubs, setClubs] = useState(INITIAL_CLUBS);

  // Authentication & Access Role Tier State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('president'); // 'president' | 'officer' | 'member'
  const [userSession, setUserSession] = useState(null);

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [uploaderModalMode, setUploaderModalMode] = useState(null); // null | 'uploadClub' | 'postInitiative'
  const [preselectedClubForModal, setPreselectedClubForModal] = useState(null);

  // Contextual Morphing Custom Cursor (Zero-Lag Direct DOM Ref)
  const cursorDotRef = useRef(null);
  const cursorFollowerRef = useRef(null);
  const [cursorHovered, setCursorHovered] = useState(false);

  // Staggered Curtain Reveal State for VERY BEGINNING Initial Load (Rotaract Pink)
  const [showCurtain, setShowCurtain] = useState(true);
  const [curtainAnimated, setCurtainAnimated] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setCurtainAnimated(true);
    }, 150);
    const timer2 = setTimeout(() => {
      setShowCurtain(false);
    }, 2200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Sync Excel roster (President Database 2026-27.xlsx) into global clubs state
  useEffect(() => {
    async function syncExcelData() {
      try {
        const parsed = await getParsedClubsFromExcel();
        if (parsed && parsed.length > 0) {
          setClubs(prev => {
            return prev.map(c => {
              const clean = (s) => (s || '').toLowerCase().replace(/rotaract|club|of|\s+/g, '');
              const matched = parsed.find(ec => 
                ec.name.toLowerCase().trim() === c.name.toLowerCase().trim() ||
                ec.name.toLowerCase().includes(c.name.toLowerCase()) || 
                c.name.toLowerCase().includes(ec.name.toLowerCase()) ||
                (c.shortName && ec.name.toLowerCase().includes(c.shortName.toLowerCase())) ||
                clean(ec.name).includes(clean(c.shortName || c.name)) ||
                clean(c.name).includes(clean(ec.name))
              );
              if (matched) {
                return {
                  ...c,
                  president: matched.president || c.president,
                  isDirector: matched.isDirector || c.isDirector || '',
                  zone: matched.zone || c.zone,
                  phone: matched.phone || c.phone,
                  email: matched.email || c.email
                };
              }
              return c;
            });
          });
        }
      } catch (err) {
        console.warn('Excel sync notice:', err);
      }
    }
    syncExcelData();
  }, []);

  useEffect(() => {
    let rAFId = null;

    const handleMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;

      if (rAFId) cancelAnimationFrame(rAFId);
      rAFId = requestAnimationFrame(() => {
        if (cursorDotRef.current) {
          cursorDotRef.current.style.left = `${x}px`;
          cursorDotRef.current.style.top = `${y}px`;
        }
        if (cursorFollowerRef.current) {
          cursorFollowerRef.current.style.left = `${x}px`;
          cursorFollowerRef.current.style.top = `${y}px`;
        }
      });

      const target = e.target.closest('[data-cursor]');
      const isHovering = Boolean(target);
      setCursorHovered((prev) => (prev !== isHovering ? isHovering : prev));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rAFId) cancelAnimationFrame(rAFId);
    };
  }, []);

  // Universal Page & Sub-Tab Loader State (For all subsequent page/tab transitions)
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Trigger loading screen on page navigation
  const handlePageChange = (newPage) => {
    if (newPage === activePage) return;
    setIsPageLoading(true);
    setTimeout(() => {
      setActivePage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 380);
    setTimeout(() => {
      setIsPageLoading(false);
    }, 650);
  };

  // Trigger loading screen on sub-tab navigation
  const handleTabChange = (newTab) => {
    if (newTab === activeDistrictTab) return;
    setIsPageLoading(true);
    setTimeout(() => {
      setActiveDistrictTab(newTab);
      setIsPageLoading(false);
    }, 450);
  };

  // Add uploaded club
  const handleAddClub = (newClub) => {
    setClubs((prevClubs) => [newClub, ...prevClubs]);
    handlePageChange('district');
    setActiveDistrictTab('map-clubs');
  };

  // Add posted initiative
  const handleAddInitiative = (targetClubId, newInitiative) => {
    setClubs((prevClubs) =>
      prevClubs.map((club) => {
        if (club.id === targetClubId) {
          return {
            ...club,
            initiatives: [newInitiative, ...(club.initiatives || [])]
          };
        }
        return club;
      })
    );
    handlePageChange('district');
    setActiveDistrictTab('map-clubs');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>

      {/* 1. INITIAL SITE ENTRANCE: Staggered Rotaract Pink Curtain Reveal Overlay */}
      {showCurtain && (
        <div className={`curtain-container ${curtainAnimated ? 'animate' : ''}`}>
          <div className="curtain-strip" />
          <div className="curtain-strip" />
          <div className="curtain-strip" />
          <div className="curtain-strip" />
          <div className="curtain-strip" />
        </div>
      )}

      {/* 2. SUBSEQUENT PAGE & TAB NAVIGATIONS: Translucent Glass Loading Screen with Spinning Rotary Logo */}
      {isPageLoading && (
        <div className="glass-loading-screen">
          <div className="glass-loading-card">
            <RotaryLoaderLogo size={96} />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '2px', color: '#FFFFFF', textTransform: 'uppercase' }}>
              ROTARACT DISTRICT 3011
            </span>
          </div>
        </div>
      )}

      {/* Contextual Morphing Custom Cursor (Desktop Only) */}
      <div
        ref={cursorDotRef}
        className="custom-cursor-dot"
        style={{ left: '-100px', top: '-100px' }}
      />
      <div
        ref={cursorFollowerRef}
        className={`custom-cursor-follower ${cursorHovered ? 'hovered' : ''}`}
        style={{ left: '-100px', top: '-100px' }}
      />

      {/* Top Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={handlePageChange}
        activeDistrictTab={activeDistrictTab}
        setActiveDistrictTab={handleTabChange}
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={() => {
          setIsLoggedIn(false);
          setUserSession(null);
          if (activePage === 'portal') handlePageChange('home');
        }}
      />

      {/* Main Workspace Body */}
      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {activePage === 'home' && (
          <PublicHome
            onNavigateDistrict={() => {
              handlePageChange('district');
              setActiveDistrictTab('map-clubs');
            }}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
          />
        )}

        {activePage === 'district' && (
          <DistrictAccess
            clubs={clubs}
            activeDistrictTab={activeDistrictTab}
            isLoggedIn={isLoggedIn}
            userRole={userRole}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            onOpenUploadClubModal={() => setUploaderModalMode('uploadClub')}
            onOpenPostInitiativeModal={(club) => {
              setPreselectedClubForModal(club);
              setUploaderModalMode('postInitiative');
            }}
          />
        )}

        {activePage === 'portal' && (
          <PortalPage
            isLoggedIn={isLoggedIn}
            userRole={userRole}
            setUserRole={setUserRole}
            userSession={userSession}
            onLogout={() => {
              setIsLoggedIn(false);
              setUserSession(null);
              handlePageChange('home');
            }}
            onOpenUploadClubModal={() => setUploaderModalMode('uploadClub')}
            onOpenPostInitiativeModal={() => {
              setPreselectedClubForModal(null);
              setUploaderModalMode('postInitiative');
            }}
            clubs={clubs}
          />
        )}

        {/* Shared Footer (rendered inside main scroll container for non-home pages) */}
        {activePage !== 'home' && (
          <Footer onNavigatePage={(page) => handlePageChange(page)} />
        )}
      </main>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(session) => {
            setIsLoggedIn(true);
            setUserSession(session);
            setUserRole(session.role || 'president');
            handlePageChange('portal');
          }}
        />
      )}

      {/* Club & Initiative Uploader Modals */}
      {uploaderModalMode && (
        <PresidentModal
          mode={uploaderModalMode}
          onClose={() => setUploaderModalMode(null)}
          onLoginSuccess={() => { }}
          onAddClub={handleAddClub}
          onAddInitiative={handleAddInitiative}
          clubs={clubs}
          preselectedClub={preselectedClubForModal}
        />
      )}

    </div>
  );
}
