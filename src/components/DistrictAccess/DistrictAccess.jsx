import React, { useState } from 'react';
import DistrictMap from './DistrictMap';
import ClubInitiativesList from './ClubInitiativesList';
import PastDRRShowcase from './PastDRRShowcase';
import { DISTRICT_LEADERSHIP } from '../../data/districtData';
import { Shield, Sparkles, MapPin, Award, BookOpen, User, CheckCircle2 } from 'lucide-react';

export default function DistrictAccess({
  clubs,
  activeDistrictTab,
  isLoggedIn,
  userRole,
  onOpenLoginModal,
  onOpenUploadClubModal,
  onOpenPostInitiativeModal
}) {
  const [selectedClubId, setSelectedClubId] = useState(null);

  return (
    <div style={{ background: (activeDistrictTab === 'map-clubs' || !activeDistrictTab) ? '#FDF8FA' : 'linear-gradient(180deg, #D81B60 0%, #AD1457 100%)', minHeight: '100vh', padding: (activeDistrictTab === 'map-clubs' || !activeDistrictTab) ? '0px' : '40px 24px 80px 24px', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: (activeDistrictTab === 'map-clubs' || !activeDistrictTab) ? '100%' : '1320px', margin: '0 auto' }}>
        
        {/* TAB 1: INTERACTIVE MAP & CLUBS LIST */}
        {(activeDistrictTab === 'map-clubs' || !activeDistrictTab) && (
          <div>
            {/* 100vh Full-Screen Interactive Satellite Map */}
            <DistrictMap
              clubs={clubs}
              selectedClubId={selectedClubId}
              onSelectClub={(id) => setSelectedClubId(id)}
            />

            {/* Clubs & Initiatives Directory (Rendered below full-screen map) */}
            <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '40px 24px 80px 24px' }}>
              <ClubInitiativesList
                clubs={clubs}
                selectedClubId={selectedClubId}
                onSelectClub={(id) => setSelectedClubId(id)}
                isPresidentLoggedIn={isLoggedIn && (userRole === 'president' || userRole === 'officer')}
                onOpenPostInitiativeForClub={(club) => onOpenPostInitiativeModal(club)}
                onOpenUploadClubModal={onOpenUploadClubModal}
              />
            </div>
          </div>
        )}

        {/* TAB 2: PAST DRR & DISTRICT HERITAGE */}
        {activeDistrictTab === 'heritage' && (
          <PastDRRShowcase />
        )}

        {/* TAB 3: INITIATIVES SHOWCASE */}
        {activeDistrictTab === 'initiatives' && (
          <div>
            <div style={{ marginBottom: '36px' }}>
              <span className="pill-gold" style={{ marginBottom: '8px' }}>
                DISTRICT PROJECTS SHOWCASE
              </span>
              <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#FFFFFF' }}>
                Active Initiatives in Rotaract District 3011
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
              {clubs.flatMap(c => (c.initiatives || []).map(init => ({ ...init, clubName: c.name, president: c.president }))).map((init, idx) => (
                <div key={idx} className="rotaract-card" style={{ padding: '28px', backgroundColor: '#FFFFFF', borderRadius: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="pill-pink" style={{ fontSize: '0.78rem' }}>
                      {init.category}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {init.date}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--rotaract-pink)', marginBottom: '8px' }}>
                    {init.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '16px' }}>
                    {init.description}
                  </p>
                  <div style={{ borderTop: '1px solid #F3E5EB', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      Club: {init.clubName}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--skyline-gold-dark)' }}>
                      {init.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CURRENT DAC & DISTRICT LEADERSHIP (BIG PHOTO DISPLAY AS REQUESTED) */}
        {activeDistrictTab === 'leadership' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
              <span className="pill-gold" style={{ marginBottom: '12px' }}>
                DISTRICT LEADERSHIP (RY 2026-27)
              </span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF' }}>
                Guided by Service & Vision
              </h2>
              <p style={{ color: '#FCE4EC', fontSize: '1.05rem', maxWidth: '650px', margin: '8px auto 0 auto' }}>
                Rotary Governor, District Rotaract Representative, and Executive Council.
              </p>
            </div>

            {/* BIG PORTRAIT CARDS FOR DAC LEADERS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
              {DISTRICT_LEADERSHIP.map((leader) => (
                <div 
                  key={leader.id} 
                  className="rotaract-card" 
                  style={{ 
                    padding: '0px', 
                    overflow: 'hidden', 
                    borderTop: '4px solid var(--skyline-gold)',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '20px'
                  }}
                >
                  {/* BIG PORTRAIT PHOTO */}
                  <div style={{ width: '100%', height: '340px', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={leader.avatar}
                      alt={leader.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div 
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.78) 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '20px'
                      }}
                    >
                      <span className="pill-gold" style={{ fontSize: '0.78rem', alignSelf: 'flex-start', marginBottom: '6px' }}>
                        {leader.badge}
                      </span>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF' }}>
                        {leader.name}
                      </h3>
                      <div style={{ fontSize: '0.9rem', color: '#FCE4EC', fontWeight: 700 }}>
                        {leader.role}
                      </div>
                    </div>
                  </div>

                  {/* DETAILS BELOW PHOTO */}
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      <strong>Home Club:</strong> {leader.club}
                    </div>
                    <p style={{ fontStyle: 'italic', color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.6, background: '#FDF5F8', padding: '12px 14px', borderRadius: '12px', borderLeft: '3px solid var(--rotaract-pink)' }}>
                      "{leader.quote}"
                    </p>
                    {leader.achievements && (
                      <div style={{ fontSize: '0.84rem', color: 'var(--skyline-gold-dark)', fontWeight: 700 }}>
                        <strong>Highlights:</strong> {leader.achievements}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
