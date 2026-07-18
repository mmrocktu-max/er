/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowRight, Cookie, Shield, X } from 'lucide-react';

interface LobbyViewProps {
  onGetStarted: () => void;
  bgRef: React.RefObject<HTMLDivElement | null>;
}

export default function LobbyView({ onGetStarted, bgRef }: LobbyViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cookieRef = useRef<HTMLDivElement>(null);
  const [cookieDismissed, setCookieDismissed] = useState(false);

  useEffect(() => {
    // GSAP Entry Animation
    const ctx = gsap.context(() => {
      // Fade in container
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.2, ease: 'power2.out' }
      );

      // Slide and scale title
      gsap.fromTo(
        titleRef.current,
        { y: 50, scale: 0.95, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 1.5, delay: 0.2, ease: 'back.out(1.5)' }
      );

      // Animate Get Started Button with glow pulse
      gsap.fromTo(
        buttonRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 0.6, ease: 'power3.out' }
      );

      // Pulse glow loop for button
      gsap.to(buttonRef.current, {
        boxShadow: '0 0 20px rgba(255, 255, 255, 0.4)',
        repeat: -1,
        yoyo: true,
        duration: 1.5,
        ease: 'sine.inOut'
      });

      // Slide in Cookie Consent from bottom-right
      gsap.fromTo(
        cookieRef.current,
        { x: 100, y: 50, opacity: 0 },
        { x: 0, y: 0, opacity: 1, duration: 1, delay: 1, ease: 'power3.out' }
      );
    }, containerRef);

    // Subtle floating loop for background mountain layer
    let floatTween: gsap.core.Tween;
    if (bgRef.current) {
      floatTween = gsap.to(bgRef.current, {
        y: '-=15',
        scale: 1.02,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }

    return () => {
      ctx.revert();
      if (floatTween) floatTween.kill();
    };
  }, [bgRef]);

  // Handle Cookie Dismiss
  const dismissCookie = () => {
    if (cookieRef.current) {
      gsap.to(cookieRef.current, {
        x: 150,
        y: 50,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.in',
        onComplete: () => setCookieDismissed(true)
      });
    } else {
      setCookieDismissed(true);
    }
  };

  return (
    <div
      ref={containerRef}
      id="lobby-container"
      className="relative flex-1 flex flex-col justify-between p-8 sm:p-16 select-none z-10"
    >
      {/* Spacer for top nav positioning alignment */}
      <div className="h-16" id="top-spacer" />

      {/* Main Title Section */}
      <div className="flex-1 flex flex-col justify-center items-center text-center" id="main-title-section">
        <h1
          ref={titleRef}
          id="product-display-title"
          className="font-pixel text-[8vw] sm:text-[6.5vw] md:text-[5.5vw] text-white tracking-widest leading-none select-none glow-text-purple px-4 select-none drop-shadow-2xl font-bold filter saturate-125"
          style={{ letterSpacing: '0.08em' }}
        >
          FINANCE DASHBOARD
        </h1>
      </div>

      {/* Bottom Section containing Get Started and Cookie Policy */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 w-full" id="lobby-bottom-panel">
        {/* Get Started Button Wrapper - Glow Capsule */}
        <div id="get-started-capsule" className="p-[2px] rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
          <button
            ref={buttonRef}
            onClick={onGetStarted}
            id="get-started-button"
            className="flex items-center gap-3 px-8 py-4 bg-black text-white hover:bg-white hover:text-black font-semibold text-sm rounded-full tracking-wider uppercase transition-colors duration-300 group shadow-md"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>

        {/* Cookie Consent Settings Popup */}
        {!cookieDismissed && (
          <div
            ref={cookieRef}
            id="cookie-consent-popup"
            className="w-full max-w-sm p-5 bg-white text-gray-900 rounded-2xl shadow-2xl flex flex-col gap-4 border border-gray-100 z-50 text-left"
          >
            <div className="flex justify-between items-start" id="cookie-header-row">
              <div className="flex items-center gap-2" id="cookie-title-group">
                <div className="p-1.5 bg-violet-100 text-violet-700 rounded-lg" id="cookie-icon-wrapper">
                  <Cookie className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900" id="cookie-heading">Cookie Settings</h3>
              </div>
              <button
                onClick={dismissCookie}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                id="close-cookie-button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed" id="cookie-description">
              We use cookies to enhance your experience, analyze site traffic and deliver personalized content.
              Read our{' '}
              <a href="#" className="text-violet-600 hover:underline font-medium" id="cookie-policy-link">
                Cookie Policy
              </a>
              .
            </p>

            <div className="flex gap-2 w-full mt-1" id="cookie-actions">
              <button
                onClick={dismissCookie}
                className="flex-1 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                id="reject-cookies-button"
              >
                Reject
              </button>
              <button
                onClick={dismissCookie}
                className="flex-1 py-2 text-xs font-medium text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors shadow-sm"
                id="accept-cookies-button"
              >
                Accept
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
