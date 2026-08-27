import React, { useState } from 'react';
import { PAST_DRRS } from '../../data/districtData';
import { Award, Sparkles, ChevronDown, Calendar, CheckCircle2, User } from 'lucide-react';

export default function PastDRRShowcase() {
  const [hoveredDRRId, setHoveredDRRId] = useState(null);

  return (
    <div style={{ marginTop: '20px' }}>
      
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '45px' }}>
        <span className="pill-gold" style={{ marginBottom: '12px' }}>
          DISTRICT HERITAGE & LEGACY
        </span>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF' }}>
          Past District Rotaract Representatives (PDRRs)
        </h2>
        <p style={{ color: '#FCE4EC', fontSize: '1.05rem', maxWidth: '680px', margin: '8px auto 0 auto' }}>
          Honoring the visionary leaders of District 3011. Hover over any Past DRR card to reveal their tenure initiatives & major achievements.
        </p>
      </div>

      {/* DRR CARDS GRID WITH BIG PORTRAIT PHOTOS (USER REQUEST) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
        {PAST_DRRS.map((drr) => {
          const isHovered = hoveredDRRId === drr.id;

          return (
            <div
              key={drr.id}
              className="rotaract-card"
              onMouseEnter={() => setHoveredDRRId(drr.id)}
              onMouseLeave={() => setHoveredDRRId(null)}
              style={{
                padding: '0px',
                overflow: 'hidden',
                border: isHovered ? '2px solid var(--rotaract-pink)' : '1px solid rgba(216, 27, 96, 0.12)',
                backgroundColor: '#FFFFFF',
                boxShadow: isHovered ? '0 16px 40px rgba(216, 27, 96, 0.18)' : 'var(--shadow-sm)',
                transition: 'all 0.35s ease',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* BIG PORTRAIT PHOTO */}
              <div style={{ width: '100%', height: '320px', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={drr.avatar}
                  alt={drr.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                  }}
                />
                <div 
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '20px'
                  }}
                >
                  <span className="pill-gold" style={{ fontSize: '0.78rem', alignSelf: 'flex-start', marginBottom: '6px' }}>
                    <Calendar size={12} /> {drr.tenure}
                  </span>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FFFFFF' }}>
                    {drr.name}
                  </h3>
                  <div style={{ fontSize: '0.84rem', color: '#FCE4EC', fontWeight: 700 }}>
                    {drr.homeClub}
                  </div>
                </div>
              </div>

              {/* CARD DETAILS BELOW PHOTO */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Theme Slogan Banner */}
                <div style={{ background: '#FDF5F8', padding: '10px 14px', borderRadius: '12px', borderLeft: '4px solid var(--rotaract-pink)', fontSize: '0.88rem', fontWeight: 800, color: 'var(--rotaract-pink)' }}>
                  Theme: "{drr.theme}"
                </div>

                {/* HOVER REVEAL INITIATIVES */}
                <div
                  style={{
                    maxHeight: isHovered ? '400px' : '0px',
                    opacity: isHovered ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    borderTop: isHovered ? '1px dashed rgba(216, 27, 96, 0.25)' : 'none',
                    paddingTop: isHovered ? '14px' : '0px'
                  }}
                >
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--rotaract-pink)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Tenure Initiatives (Revealed on Hover)
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {drr.initiatives.map((init, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          background: '#FFFFFF', 
                          border: '1px solid #F3E5EB', 
                          borderRadius: '10px', 
                          padding: '10px 12px' 
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          <CheckCircle2 size={14} style={{ color: 'var(--rotaract-pink)' }} />
                          {init.title}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', marginLeft: '20px' }}>
                          {init.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hover Prompt if not hovered */}
                {!isHovered && (
                  <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--rotaract-pink)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span>Hover to reveal tenure initiatives</span>
                    <ChevronDown size={14} />
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
