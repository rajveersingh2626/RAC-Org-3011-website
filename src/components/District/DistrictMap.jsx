import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  User, 
  Sparkles, 
  X, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Search, 
  CheckCircle2, 
  Award,
  Globe,
  Layers,
  Compass,
  Info
} from 'lucide-react';
import { parseExcelClubs, getParsedClubsFromExcel } from '../../data/excelReader';

const REGIONAL_ZONES = [
  {
    id: 'zone-south',
    name: 'South & Central Delhi',
    color: '#ff2a5f',
    fillColor: '#ff2a5f',
    polygon: [
      [28.6400, 77.1800],
      [28.6400, 77.2800],
      [28.5000, 77.2900],
      [28.4900, 77.1600],
      [28.5800, 77.1600]
    ]
  },
  {
    id: 'zone-west',
    name: 'West & North Delhi',
    color: '#00b0ff',
    fillColor: '#00b0ff',
    polygon: [
      [28.7300, 77.0000],
      [28.7300, 77.1600],
      [28.5800, 77.1600],
      [28.5700, 77.0100]
    ]
  },
  {
    id: 'zone-gurugram',
    name: 'Gurugram & Cybercity',
    color: '#e6a100',
    fillColor: '#e6a100',
    polygon: [
      [28.5200, 76.9200],
      [28.5200, 77.1100],
      [28.3400, 77.1100],
      [28.3400, 76.9200]
    ]
  },
  {
    id: 'zone-faridabad',
    name: 'Faridabad & Noida',
    color: '#10b981',
    fillColor: '#10b981',
    polygon: [
      [28.6400, 77.2800],
      [28.6400, 77.5300],
      [28.3500, 77.5300],
      [28.3500, 77.2800]
    ]
  }
];

export default function DistrictMap({ clubs = [], selectedClubId, onSelectClub }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const [activeClubs, setActiveClubs] = useState(clubs);
  const [excelLoaded, setExcelLoaded] = useState(false);

  const [hoveredClub, setHoveredClub] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [activeSlideoutClub, setActiveSlideoutClub] = useState(null);
  const [activeZoneId, setActiveZoneId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    setActiveClubs(clubs);

    async function loadExcelRoster() {
      try {
        const parsed = await getParsedClubsFromExcel();
        if (parsed && parsed.length > 0 && isMounted) {
          setActiveClubs(prev => {
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
                  isDirector: matched.isDirector || c.isDirector || ''
                };
              }
              return c;
            });
          });
          setExcelLoaded(true);
        }
      } catch (err) {
        console.warn('Excel load error:', err);
      }
    }

    loadExcelRoster();
    return () => { isMounted = false; };
  }, [clubs]);

  useEffect(() => {
    if (selectedClubId) {
      const found = activeClubs.find(c => c.id === selectedClubId);
      if (found) setActiveSlideoutClub(found);
    } else {
      setActiveSlideoutClub(null);
    }
  }, [selectedClubId, activeClubs]);

  const handleMouseMove = (e) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const L = window.L;
    if (!L) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [28.5800, 77.1025],
      zoom: 11,
      scrollWheelZoom: false,
      zoomControl: false
    });

    mapInstanceRef.current = map;

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      attribution: 'Esri, Maxar, Earthstar Geographics'
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      opacity: 0.9
    }).addTo(map);

    REGIONAL_ZONES.forEach(zone => {
      L.polygon(zone.polygon, {
        color: zone.color,
        weight: 6,
        opacity: 0.4,
        fillColor: zone.fillColor,
        fillOpacity: 0.1
      }).addTo(map);

      L.polygon(zone.polygon, {
        color: zone.color,
        weight: 3,
        opacity: 0.95,
        fillColor: zone.fillColor,
        fillOpacity: 0.1
      }).addTo(map);
    });

    renderLeafletMarkers(L, map, activeClubs);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && window.L) {
      renderLeafletMarkers(window.L, mapInstanceRef.current, activeClubs);
    }
  }, [activeClubs, searchQuery, activeZoneId]);

  const renderLeafletMarkers = (L, map, clubsList) => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const filtered = clubsList.filter(c => {
      const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.president?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesZone = !activeZoneId || (
        (activeZoneId === 'zone-south' && c.zone?.toLowerCase().includes('south')) ||
        (activeZoneId === 'zone-west' && c.zone?.toLowerCase().includes('west')) ||
        (activeZoneId === 'zone-gurugram' && c.zone?.toLowerCase().includes('gurugram')) ||
        (activeZoneId === 'zone-faridabad' && (c.zone?.toLowerCase().includes('faridabad') || c.zone?.toLowerCase().includes('noida')))
      );
      return matchesSearch && matchesZone;
    });

    const coordCounts = {};

    filtered.forEach((club, index) => {
      let lat = club.lat || 28.5800;
      let lng = club.lng || 77.1025;

      // Smart coordinate dispersion so close pins don't overlap
      const key = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
      if (coordCounts[key]) {
        const count = coordCounts[key];
        const angle = (count * 60) * (Math.PI / 180);
        const radius = 0.007 * Math.ceil(count / 5);
        lat += Math.sin(angle) * radius;
        lng += Math.cos(angle) * radius;
        coordCounts[key] = count + 1;
      } else {
        coordCounts[key] = 1;
      }

      let neonColor = '#D81B60';
      if (club.zone?.toLowerCase().includes('west')) neonColor = '#0088cc';
      if (club.zone?.toLowerCase().includes('gurugram')) neonColor = '#d97706';
      if (club.zone?.toLowerCase().includes('faridabad') || club.zone?.toLowerCase().includes('noida')) neonColor = '#10b981';

      const displayName = (club.shortName || club.name).replace(/^RAC\s+/i, '');

      const customIcon = L.divIcon({
        className: 'leaflet-neon-marker',
        html: `
          <div class="neon-marker-container">
            <div class="neon-marker-core" style="background-color: ${neonColor}; box-shadow: 0 0 16px ${neonColor};"></div>
            <div class="neon-marker-pulse" style="border: 2px solid ${neonColor};"></div>
            <div class="neon-marker-label" style="border-color: ${neonColor}88; background: rgba(255,255,255,0.96); color: #1E1E24; font-weight: 800;">RAC ${displayName}</div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      marker.on('mouseover', () => setHoveredClub(club));
      marker.on('mouseout', () => setHoveredClub(null));
      marker.on('click', () => {
        setActiveSlideoutClub(club);
        if (onSelectClub) onSelectClub(club.id);
        map.flyTo([lat, lng], 13.5, { duration: 1.2 });
      });

      markersRef.current.push(marker);
    });
  };

  const getClubNeonColor = (c) => {
    if (!c) return '#D81B60';
    if (c.zone?.toLowerCase().includes('west')) return '#0088cc';
    if (c.zone?.toLowerCase().includes('gurugram')) return '#d97706';
    return '#D81B60';
  };

  return (
    <div 
      id="district-map-section"
      onMouseMove={handleMouseMove}
      style={{
        position: isFullScreen ? 'fixed' : 'relative',
        inset: isFullScreen ? 0 : 'auto',
        zIndex: isFullScreen ? 99999 : 1,
        width: '100%',
        height: isFullScreen ? '100vh' : 'calc(100vh - 72px)',
        minHeight: isFullScreen ? '100vh' : '780px',
        backgroundColor: '#FDF8FA',
        borderRadius: '0px',
        overflow: 'hidden',
        border: 'none',
        boxShadow: 'none',
        transition: 'all 0.3s ease'
      }}
    >
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }}
      />

      <div 
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          gap: '16px',
          zIndex: 1000,
          pointerEvents: 'none',
          flexWrap: 'wrap'
        }}
      >
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(216, 27, 96, 0.2)',
            padding: '12px 24px',
            borderRadius: '8px',
            color: '#1E1E24',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
            pointerEvents: 'auto'
          }}
        >
          <div 
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#D81B60',
              boxShadow: '0 0 12px #D81B60',
              animation: 'neonPulse 1.8s infinite ease-in-out'
            }}
          />
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, letterSpacing: '0.5px', color: '#1E1E24', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ROTARACT DISTRICT 3011 • SATELLITE DIRECTORY
              {excelLoaded && (
                <span className="pill-pink" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                  <CheckCircle2 size={10} /> RY 2026-27 Active
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#4A4A5A', fontWeight: 600 }}>
              ESRI High-Res Satellite • 3 Regional Zones • {activeClubs.length} Active Clubs
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'auto', flexWrap: 'wrap' }}>
          <div 
            style={{
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(216, 27, 96, 0.2)',
              borderRadius: '8px',
              padding: '6px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
            }}
          >
            <Search size={16} style={{ color: 'var(--rotaract-pink)' }} />
            <input
              type="text"
              placeholder="Search full club name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#1E1E24',
                fontSize: '0.84rem',
                fontWeight: 600,
                width: '170px'
              }}
            />
            {searchQuery && (
              <X size={14} style={{ color: '#71717A', cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveZoneId(null)}
              style={{
                background: !activeZoneId ? '#FFFFFF' : '#0E0E0E',
                backdropFilter: 'blur(12px)',
                color: !activeZoneId ? '#0E0E0E' : '#FFFFFF',
                border: !activeZoneId ? '2px solid #0E0E0E' : '1px solid #0E0E0E',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: !activeZoneId ? '0 4px 14px rgba(0,0,0,0.18)' : 'none'
              }}
            >
              All Zones
            </button>
            {REGIONAL_ZONES.map(z => (
              <button
                key={z.id}
                onClick={() => setActiveZoneId(activeZoneId === z.id ? null : z.id)}
                style={{
                  background: activeZoneId === z.id ? 'rgba(255, 255, 255, 0.96)' : '#123499',
                  backdropFilter: 'blur(12px)',
                  color: activeZoneId === z.id ? z.color : '#FFFFFF',
                  border: activeZoneId === z.id ? `2px solid ${z.color}` : '1px solid #123499',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: activeZoneId === z.id ? `0 4px 14px ${z.color}35` : 'none'
                }}
              >
                {z.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            style={{
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(216, 27, 96, 0.25)',
              color: 'var(--rotaract-pink)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
            }}
            title={isFullScreen ? "Exit Fullscreen" : "Full Screen Mode"}
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {hoveredClub && (
        <div 
          className="glass-hover-tooltip"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            zIndex: 10000
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div 
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getClubNeonColor(hoveredClub),
                boxShadow: `0 0 8px ${getClubNeonColor(hoveredClub)}`
              }} 
            />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: getClubNeonColor(hoveredClub), textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {hoveredClub.zone || 'District 3011'}
            </span>
          </div>

          <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1E1E24', margin: '2px 0 6px 0' }}>
            {hoveredClub.name}
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: '#4A4A5A', fontWeight: 700 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} style={{ color: 'var(--skyline-gold-dark)' }} />
              <span>President: {hoveredClub.president}</span>
            </div>
            {hoveredClub.isDirector && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={14} style={{ color: '#123499' }} />
                <span>International Services Director: {hoveredClub.isDirector}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {(() => {
        const currentSlideoutClub = activeSlideoutClub 
          ? (activeClubs.find(c => c.id === activeSlideoutClub.id) || activeSlideoutClub)
          : null;

        return (
          <>
            <div 
              className={`frosted-slideout-overlay ${currentSlideoutClub ? 'open' : ''}`}
              onClick={() => {
                setActiveSlideoutClub(null);
                if (onSelectClub) onSelectClub(null);
              }}
              style={{ zIndex: 99998 }}
            />

            <aside className={`frosted-slideout-panel ${currentSlideoutClub ? 'open' : ''}`}>
              {currentSlideoutClub && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '85px 30px 40px 30px', boxSizing: 'border-box' }}>
                  
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ flex: 1, paddingRight: '12px' }}>
                        <span 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            background: '#FDF0F5',
                            border: '1px solid rgba(216, 27, 96, 0.25)',
                            color: '#D81B60',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            marginBottom: '8px'
                          }}
                        >
                          {currentSlideoutClub.zone || 'District 3011'}
                        </span>
                        
                        <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#1E1E24', lineHeight: 1.2, margin: 0 }}>
                          {currentSlideoutClub.name}
                        </h2>
                      </div>

                <button
                  onClick={() => {
                    setActiveSlideoutClub(null);
                    if (onSelectClub) onSelectClub(null);
                  }}
                  style={{
                    background: '#FDF0F5',
                    border: '1px solid rgba(216, 27, 96, 0.25)',
                    color: '#D81B60',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#D81B60'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#FDF0F5'}
                  title="Close Sidebar"
                >
                  <X size={18} />
                </button>
              </div>

              <div 
                style={{
                  background: '#FFF8FA',
                  border: '1px solid #F3E5EB',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  marginBottom: '22px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#71717A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Club President (RY 2026-27)
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1E1E24', marginTop: '3px' }}>
                    {currentSlideoutClub.president || '-'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: '#71717A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    International Services Director
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#123499', marginTop: '3px' }}>
                    {currentSlideoutClub.isDirector || currentSlideoutClub.internationalServicesDirector || '-'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: '#71717A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Charter Year
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--skyline-gold-dark)', marginTop: '3px' }}>
                    {currentSlideoutClub.charterYear || '-'}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#FFFBEB',
                    border: '1px solid #123499',
                    padding: '4px 16px',
                    borderRadius: '6px',
                    marginBottom: '14px'
                  }}
                >
                  <span 
                    style={{
                      color: 'var(--skyline-gold-dark)',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}
                  >
                    CLUB KPIs
                  </span>
                </div>

                {(currentSlideoutClub.initiatives && currentSlideoutClub.initiatives.length > 0) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {(currentSlideoutClub.initiatives || []).map((init, idx) => (
                      <div 
                        key={idx}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #F3E5EB',
                          borderRadius: '16px',
                          padding: '18px 20px',
                          boxShadow: '0 4px 14px rgba(216, 27, 96, 0.04)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
                          <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--rotaract-pink)', lineHeight: 1.25, margin: 0 }}>
                            {init.title}
                          </h4>
                          <span className="pill-pink" style={{ fontSize: '0.72rem', padding: '2px 8px', flexShrink: 0 }}>
                            {init.category}
                          </span>
                        </div>

                        <p style={{ color: '#4A4A5A', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '10px', fontWeight: 500 }}>
                          {init.description}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', color: 'var(--skyline-gold-dark)', fontWeight: 800, borderTop: '1px solid #F3E5EB', paddingTop: '10px' }}>
                          <span>Impact: {init.impact}</span>
                          {init.date && <span style={{ color: '#71717A', fontWeight: 600 }}>{init.date}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div 
                    style={{
                      background: '#FFFFFF',
                      border: '1px dashed #E4E4E7',
                      borderRadius: '14px',
                      padding: '20px',
                      textAlign: 'center',
                      color: '#71717A',
                      fontSize: '0.88rem',
                      fontWeight: 500
                    }}
                  >
                    No monthly report KPIs uploaded yet for this club.
                  </div>
                )}
              </div>

            </div>

            <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
              <a
                href={`mailto:${currentSlideoutClub.email || 'techrid3011@gmail.com'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: '#FFFFFF',
                  background: 'linear-gradient(135deg, #D81B60 0%, #AD1457 100%)',
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(216, 27, 96, 0.25)',
                  transition: 'transform 0.2s ease'
                }}
              >
                Connect via Email <ChevronRight size={18} />
              </a>
            </div>

          </div>
        )}
      </aside>
    </>
  );
})()}

      <div 
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '65px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          zIndex: 1000,
          pointerEvents: 'none',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(216, 27, 96, 0.2)',
            padding: '10px 22px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            pointerEvents: 'auto',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#1E1E24', fontWeight: 700 }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#D81B60', boxShadow: '0 0 8px #D81B60' }} />
            South & Central Delhi
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#1E1E24', fontWeight: 700 }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0088cc', boxShadow: '0 0 8px #0088cc' }} />
            West & North Delhi
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#1E1E24', fontWeight: 700 }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#d97706', boxShadow: '0 0 8px #d97706' }} />
            Gurugram NCR
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#1E1E24', fontWeight: 700 }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            Faridabad & Noida
          </div>
        </div>

        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(216, 27, 96, 0.2)',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '0.76rem',
            color: '#4A4A5A',
            fontWeight: 700,
            pointerEvents: 'auto',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
          }}
        >
          Click pin to view Club Overview & Project Spotlight
        </div>
      </div>

    </div>
  );
}
