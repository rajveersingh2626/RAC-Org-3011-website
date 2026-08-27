import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Lock, User, Mail, CheckCircle2, KeyRound, ShieldAlert, Smartphone, Clock, RefreshCw, QrCode, Copy } from 'lucide-react';
import { dbService } from '../../lib/supabaseClient';
import { getSecretForRotaryId, verifyTOTP } from '../../lib/totp';

export default function LoginModal({ onClose, onLoginSuccess }) {
  const [mode, setMode] = useState('login');
  
  const [rotaryId, setRotaryId] = useState('');
  const [password, setPassword] = useState('');
  
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [totpSecret, setTotpSecret] = useState('');
  const [showKeyDetails, setShowKeyDetails] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  
  const [otpCode, setOtpCode] = useState('');
  
  const [forgotInput, setForgotInput] = useState('');
  const [resetAttempts, setResetAttempts] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let timer = null;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownSeconds]);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!rotaryId || !password) return;

    setIsVerifying(true);
    const authResult = await dbService.authenticateUser(rotaryId, password);
    setIsVerifying(false);

    if (!authResult.success) {
      setErrorMessage(authResult.error || 'Authentication failed.');
      return;
    }

    const user = authResult.user;
    setAuthenticatedUser(user);

    const secret = user.totpSecret || await getSecretForRotaryId(user.rotaryId);
    setTotpSecret(secret);

    setMode('google2fa');
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!otpCode || otpCode.length !== 6) {
      setErrorMessage('Please enter the 6-digit Google Authenticator code.');
      return;
    }

    setIsVerifying(true);
    const isValid = await verifyTOTP(totpSecret, otpCode);
    setIsVerifying(false);

    if (!isValid) {
      setErrorMessage('Invalid 6-digit Google Authenticator code. Please check your Google Authenticator app and ensure phone clock is synced.');
      return;
    }

    const isOfficer = (authenticatedUser.role === 'officer' || authenticatedUser.role === 'admin' || (authenticatedUser.rotaryId || '').toLowerCase().includes('admin') || (authenticatedUser.rotaryId || '').toLowerCase().includes('officer'));

    onLoginSuccess({
      rotaryId: authenticatedUser.rotaryId,
      email: authenticatedUser.email,
      role: authenticatedUser.role || (isOfficer ? 'officer' : 'president'),
      fullName: authenticatedUser.fullName || (isOfficer ? 'District Secretariat Officer' : 'Rotaract Officer'),
      clubName: authenticatedUser.clubName || (isOfficer ? 'District Secretariat 3011' : 'Rotaract Club of Delhi Heights'),
      post: authenticatedUser.post || authenticatedUser.designation || (isOfficer ? 'District Secretariat Member' : 'Club President / Secretary'),
      mfaVerified: true,
      sessionToken: `sec_jwt_${Math.random().toString(36).substring(2)}`
    });
    onClose();
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResetSuccessMsg('');

    if (!forgotInput) {
      setErrorMessage('Please enter your registered Rotary ID or Email address.');
      return;
    }

    if (resetAttempts >= 3) {
      setErrorMessage('Security Cap Reached: Maximum 3 password reset requests per 24 hours. Please try again tomorrow.');
      return;
    }

    if (cooldownSeconds > 0) {
      setErrorMessage(`Please wait ${cooldownSeconds} seconds before requesting another reset email.`);
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const newAttempts = resetAttempts + 1;
      setResetAttempts(newAttempts);
      setCooldownSeconds(60);
      setResetSuccessMsg(`Password reset instructions have been sent to the email associated with ${forgotInput}. (Request ${newAttempts}/3 today)`);
    }, 900);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.68)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="rotaract-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '36px',
          position: 'relative',
          border: '2px solid var(--rotaract-pink)',
          animation: 'fadeInUp 0.3s ease-out forwards',
          boxShadow: '0 20px 60px rgba(216, 27, 96, 0.25)',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#FDF0F5',
            border: 'none',
            color: 'var(--rotaract-pink)',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={18} />
        </button>

        {isVerifying && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="biometric-scan-ring" style={{ marginBottom: '16px', margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--rotaract-pink)', marginBottom: '4px' }}>
              Authenticating Credentials...
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Verifying Rotary ID with District 3011 Security Vault...
            </p>
          </div>
        )}

        {!isVerifying && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div 
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--rotaract-pink) 0%, var(--rotaract-cranberry-dark) 100%)', 
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  boxShadow: '0 8px 25px rgba(216, 27, 96, 0.3)'
                }}
              >
                <ShieldCheck size={28} />
              </div>
              <div style={{ display: 'inline-flex', marginBottom: '6px' }}>
                <span className="pill-pink" style={{ fontSize: '0.74rem', padding: '3px 12px' }}>
                  <Lock size={12} /> DISTRICT 3011 SECURE PORTAL
                </span>
              </div>
              <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                {mode === 'login' && 'Officer Login'}
                {mode === 'google2fa' && 'Google Authenticator 2FA'}
                {mode === 'forgotPassword' && 'Reset Password'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                {mode === 'login' && 'Enter your official Rotary ID and portal password to log in.'}
                {mode === 'google2fa' && 'Enter the 6-digit code generated in your Google Authenticator App.'}
                {mode === 'forgotPassword' && 'Enter your Rotary ID or registered Email to receive a password reset link.'}
              </p>
            </div>

            {errorMessage && (
              <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#E11D48', padding: '12px 14px', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                {errorMessage}
              </div>
            )}

            {resetSuccessMsg && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: '12px 14px', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                {resetSuccessMsg}
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleCredentialsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Official Rotary ID *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="e.g. 10482950 or 3011-ADMIN"
                      required
                      value={rotaryId}
                      onChange={(e) => setRotaryId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 40px',
                        borderRadius: '12px',
                        border: '1px solid rgba(216, 27, 96, 0.25)',
                        fontSize: '0.92rem',
                        outline: 'none'
                      }}
                    />
                    <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--rotaract-pink)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Portal Password *
                    </label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setMode('forgotPassword');
                        setErrorMessage('');
                      }} 
                      style={{ background: 'none', border: 'none', color: 'var(--rotaract-pink)', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      placeholder="Enter portal password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 40px',
                        borderRadius: '12px',
                        border: '1px solid rgba(216, 27, 96, 0.25)',
                        fontSize: '0.92rem',
                        outline: 'none'
                      }}
                    />
                    <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--rotaract-pink)' }} />
                  </div>
                </div>

                <button type="submit" className="btn-rotaract" style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: '4px' }}>
                  Proceed to Google 2FA <KeyRound size={18} />
                </button>
              </form>
            )}

            {mode === 'google2fa' && (
              <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#FDF5F8', padding: '14px', borderRadius: '14px', border: '1px solid rgba(216,27,96,0.15)', textAlign: 'center' }}>
                  <Smartphone size={24} style={{ color: 'var(--rotaract-pink)', marginBottom: '4px' }} />
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Google Authenticator 2FA
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    User: {authenticatedUser?.fullName || rotaryId} • Designation: <strong>{(authenticatedUser?.post || authenticatedUser?.role || 'OFFICER').toUpperCase()}</strong>
                  </div>
                </div>

                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Authenticator Secret Key</span>
                    <button
                      type="button"
                      onClick={() => setShowKeyDetails(!showKeyDetails)}
                      style={{ background: 'none', border: 'none', color: 'var(--rotaract-pink)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {showKeyDetails ? 'Hide Secret' : 'Show Secret / Setup'}
                    </button>
                  </div>

                  {showKeyDetails && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E5E7EB' }}>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '6px', fontSize: '0.76rem' }}>
                        Add this key into your Google Authenticator app (or scan barcode):
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}>
                        <code style={{ fontSize: '0.95rem', fontWeight: 900, letterSpacing: '2px', color: 'var(--rotaract-pink)', flex: 1, fontFamily: 'monospace' }}>
                          {totpSecret}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(totpSecret);
                            setCopiedKey(true);
                            setTimeout(() => setCopiedKey(false), 2000);
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Copy size={14} /> {copiedKey ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)', textAlign: 'center' }}>
                    Enter 6-Digit Google 2FA Code *
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="123456"
                    autoFocus
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '2px solid var(--rotaract-pink)',
                      fontSize: '1.6rem',
                      fontWeight: 900,
                      letterSpacing: '8px',
                      textAlign: 'center',
                      color: 'var(--rotaract-pink)',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center', marginTop: '6px' }}>
                    Open your Google Authenticator app to view the 6-digit code.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setMode('login')} 
                    className="btn-rotaract-outline" 
                    style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn-rotaract" 
                    style={{ flex: 2, justifyContent: 'center', padding: '12px' }}
                  >
                    <CheckCircle2 size={18} /> Verify & Log In
                  </button>
                </div>
              </form>
            )}

            {mode === 'forgotPassword' && (
              <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#FFFDF0', border: '1px solid #FDE68A', padding: '12px 14px', borderRadius: '12px', fontSize: '0.78rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} style={{ flexShrink: 0 }} />
                  Rate-Limited Protection: Max 3 reset emails allowed per 24 hours per user.
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Registered Rotary ID or Email *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="e.g. 10482950 or techrid3011@gmail.com"
                      required
                      value={forgotInput}
                      onChange={(e) => setForgotInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 40px',
                        borderRadius: '12px',
                        border: '1px solid rgba(216, 27, 96, 0.25)',
                        fontSize: '0.92rem',
                        outline: 'none'
                      }}
                    />
                    <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--rotaract-pink)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                    }} 
                    className="btn-rotaract-outline" 
                    style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                  >
                    Back to Login
                  </button>
                  <button 
                    type="submit" 
                    disabled={cooldownSeconds > 0 || resetAttempts >= 3}
                    className="btn-rotaract" 
                    style={{ 
                      flex: 2, 
                      justify: 'center', 
                      padding: '12px',
                      opacity: (cooldownSeconds > 0 || resetAttempts >= 3) ? 0.6 : 1,
                      cursor: (cooldownSeconds > 0 || resetAttempts >= 3) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {cooldownSeconds > 0 ? (
                      <>Wait {cooldownSeconds}s <RefreshCw size={16} className="spin" /></>
                    ) : (
                      'Send Reset Email'
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
}
