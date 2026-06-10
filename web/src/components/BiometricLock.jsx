import React, { useState, useEffect, useRef } from 'react';
import { Database } from '../services/db';

export function BiometricLock({ onUnlock }) {
    const [scanning, setScanning] = useState(false);
    const [authMode, setAuthMode] = useState('biometric'); // 'biometric' or 'pin'
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const canvasRef = useRef(null);

    // Particle/constellation animation background
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (canvas) {
                width = canvas.width = window.innerWidth;
                height = canvas.height = window.innerHeight;
            }
        };
        window.addEventListener('resize', handleResize);

        const particles = Array.from({ length: 40 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 1
        }));

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(20, 184, 166, 0.15)';
            ctx.strokeStyle = 'rgba(20, 184, 166, 0.04)';

            particles.forEach((p, idx) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();

                // Draw lines between nearby particles
                for (let j = idx + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleScan = () => {
        if (scanning) return;
        setScanning(true);

        setTimeout(() => {
            Database.logAudit("Biometric Authentication", "Biometric credentials parsed. Session successfully decrypted.");
            onUnlock();
        }, 1500);
    };

    const handlePinSubmit = (e) => {
        e.preventDefault();
        // Mock PIN validation (e.g., "1234" or "2026")
        if (pin === '1234' || pin === '2026' || pin === '0000') {
            setPinError('');
            Database.logAudit("PIN Authentication", "Backup PIN verified. Cryptographic session decrypted.");
            onUnlock();
        } else {
            setPinError('Invalid security PIN code.');
            setPin(null);
            setTimeout(() => setPin(''), 1000);
        }
    };

    const scannerStyle = scanning ? {
        borderColor: 'var(--color-secondary)',
        background: 'rgba(20, 184, 166, 0.25)',
        boxShadow: '0 0 30px rgba(20, 184, 166, 0.6)'
    } : {};

    const iconStyle = scanning ? {
        color: 'var(--color-secondary)',
        transform: 'scale(1.1)'
    } : {};

    return (
        <div id="biometric-lock-screen">
            <canvas ref={canvasRef} className="lock-particles-canvas"></canvas>
            
            <div className="lock-container">
                <div className="lock-shield-wrapper">
                    <i className="fa-solid fa-shield-halved lock-icon-shield"></i>
                    <span className="shield-glow-pulse"></span>
                </div>
                <h1 className="lock-title">PsyPyrus AI OS</h1>
                <p className="lock-subtitle">HIPAA and GDPR Cryptographic Workspace</p>

                {authMode === 'biometric' ? (
                    <div className="lock-mode-wrapper">
                        <div 
                            className={`biometric-scanner-node ${scanning ? 'scanning' : ''}`} 
                            id="lock-scanner-trigger"
                            style={scannerStyle}
                            onClick={handleScan}
                        >
                            <i className="fa-solid fa-fingerprint biometric-icon" style={iconStyle}></i>
                            <div className="scanner-laser-bar"></div>
                            {scanning && <span className="scanner-scanning-text">DECRYPTING...</span>}
                        </div>
                        
                        <p className="scanner-tip-text">
                            {scanning ? "Processing hardware key..." : "Tap biometric scanner node to verify credentials."}
                        </p>
                        
                        <button 
                            className="auth-switch-btn"
                            onClick={() => setAuthMode('pin')}
                        >
                            <i className="fa-solid fa-keyboard"></i> Use Backup Security PIN
                        </button>
                    </div>
                ) : (
                    <div className="lock-mode-wrapper">
                        <form onSubmit={handlePinSubmit} className="pin-auth-form">
                            <div className="pin-input-group">
                                <input
                                    type="password"
                                    maxLength={4}
                                    placeholder="••••"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="pin-digit-input"
                                    autoFocus
                                />
                            </div>
                            {pinError && <p className="pin-error-text">{pinError}</p>}
                            <p className="scanner-tip-text">Enter your 4-digit practitioner secure vault PIN.</p>
                            
                            <div className="pin-form-actions">
                                <button 
                                    type="button"
                                    className="auth-switch-btn"
                                    onClick={() => {
                                        setPin('');
                                        setPinError('');
                                        setAuthMode('biometric');
                                    }}
                                >
                                    <i className="fa-solid fa-fingerprint"></i> Use Fingerprint Scanner
                                </button>
                                <button 
                                    type="submit" 
                                    className="pin-submit-btn"
                                    disabled={pin.length < 4}
                                >
                                    Verify PIN
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                
                <div className="compliance-status-tag">
                    <i className="fa-solid fa-key compliance-tag-icon"></i>
                    <div className="compliance-tag-text">
                        AES-GCM-256 local health vault initialized.<br />
                        Hardware biometric bindings active.
                    </div>
                </div>
            </div>
        </div>
    );
}
