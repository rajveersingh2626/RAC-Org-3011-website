import React from 'react';
import DistrictLogo from './DistrictLogo';
import { Heart, Globe, Mail, MapPin, Shield, ExternalLink, Sparkles, Award } from 'lucide-react';

export default function Footer({ onNavigatePage, isFullScreen = false }) {
  return (
    <footer
      style={{
        backgroundColor: '#18181B',
        color: '#FAFAFA',
        borderTop: '4px solid var(--rotaract-pink)',
        paddingTop: '60px',
        paddingBottom: '40px',
        position: 'relative',
        zIndex: 20,
        width: '100%',
        minHeight: isFullScreen ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '40px', marginBottom: '50px' }}>
          
          {/* Column 1: Brand & Slogan */}
          <div>
            <div style={{ background: 'transparent', padding: '0px', display: 'inline-block', marginBottom: '20px' }}>
              <DistrictLogo size="small" />
            </div>
            <p style={{ color: '#A1A1AA', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '20px' }}>
              Rotaract District Organization 3011 encompasses over 70+ clubs across Delhi & NCR, uniting young leaders for impact, service, and global fellowship.
            </p>
            <span className="pill-gold" style={{ fontSize: '0.8rem' }}>
              Service Above Self • RY 2026-27
            </span>
          </div>

          {/* Column 2: Quick Navigation */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', fontWeight: 700, marginBottom: '20px', letterSpacing: '0.5px' }}>
              Quick Navigation
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <button
                  onClick={() => onNavigatePage && onNavigatePage('home')}
                  style={{ background: 'none', border: 'none', color: '#A1A1AA', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.target.style.color = '#D81B60'}
                  onMouseLeave={(e) => e.target.style.color = '#A1A1AA'}
                >
                  Home Page
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePage && onNavigatePage('district')}
                  style={{ background: 'none', border: 'none', color: '#A1A1AA', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.target.style.color = '#D81B60'}
                  onMouseLeave={(e) => e.target.style.color = '#A1A1AA'}
                >
                  District Directory (RY 2026-27)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePage && onNavigatePage('portal')}
                  style={{ background: 'none', border: 'none', color: '#A1A1AA', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.target.style.color = '#D81B60'}
                  onMouseLeave={(e) => e.target.style.color = '#A1A1AA'}
                >
                  District Portal Access
                </button>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/rotaractdistrict.3011/"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#A1A1AA', fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.target.style.color = '#D81B60'}
                  onMouseLeave={(e) => e.target.style.color = '#A1A1AA'}
                >
                  Official Instagram <ExternalLink size={14} />
                </a>
              </li>
              <li>
                <a
                  href="https://www.rotary.org"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#A1A1AA', fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.target.style.color = '#D81B60'}
                  onMouseLeave={(e) => e.target.style.color = '#A1A1AA'}
                >
                  Rotary International <ExternalLink size={14} />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Flagship Initiatives & Causes */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', fontWeight: 700, marginBottom: '20px', letterSpacing: '0.5px' }}>
              Flagship Causes
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', color: '#A1A1AA', fontSize: '0.88rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} style={{ color: 'var(--rotaract-pink)' }} /> Mahadan 9.0 Blood Drive
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} style={{ color: 'var(--rotaract-pink)' }} /> Clean Yamuna & Green NCR
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} style={{ color: 'var(--rotaract-pink)' }} /> Digital Literacy School Labs
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} style={{ color: 'var(--rotaract-pink)' }} /> Pediatric Health Screenings
              </li>
            </ul>
          </div>

          {/* Column 4: Secretariat & Contact */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', fontWeight: 700, marginBottom: '20px', letterSpacing: '0.5px' }}>
              District Secretariat
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', color: '#A1A1AA', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <MapPin size={18} style={{ color: 'var(--rotaract-pink)', flexShrink: 0, marginTop: '3px' }} />
                <span>District Secretariat Office, Delhi NCR, India (Placeholder Location)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={18} style={{ color: 'var(--rotaract-pink)', flexShrink: 0 }} />
                <span>contact@placeholder.org</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe size={18} style={{ color: 'var(--rotaract-pink)', flexShrink: 0 }} />
                <span>www.placeholder.org</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid #27272A', paddingTop: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', fontSize: '0.85rem', color: '#71717A' }}>
          <div>
            © 2026 Rotaract District Organization 3011. All Rights Reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Built with <Heart size={14} fill="#D81B60" color="#D81B60" /> for District 3011 Rotaractors
          </div>
        </div>
      </div>
    </footer>
  );
}
