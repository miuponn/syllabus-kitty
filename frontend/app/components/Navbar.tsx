'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';

export default function Navbar() {
  const router = useRouter();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isIconHovered, setIsIconHovered] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const handleUploadClick = () => {
    router.push('/');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-5 md:px-8 lg:px-12 pt-3 sm:pt-4 md:pt-5">
      <nav 
        className="rounded-2xl px-4 sm:px-6 md:px-8 lg:px-10 transition-all duration-300 ease-out"
        style={{
          paddingTop: isIconHovered ? '0.75rem' : '0.75rem',
          paddingBottom: isIconHovered ? '1.25rem' : '0.5rem',
          background: isHovered 
            ? 'rgba(255, 255, 255, 0.45)' 
            : 'transparent',
          backdropFilter: isHovered ? 'blur(14px)' : 'none',
          WebkitBackdropFilter: isHovered ? 'blur(14px)' : 'none',
          border: isHovered 
            ? '1px solid rgba(255, 255, 255, 0.7)' 
            : '1px solid transparent',
          boxShadow: isHovered
            ? '0 4px 24px rgba(108, 130, 255, 0.1)'
            : 'none',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-between">
          {/* Left side - Upload new PDF */}
          <div 
            className="flex flex-col items-center cursor-pointer"
            onMouseEnter={() => setIsIconHovered(true)}
            onMouseLeave={() => setIsIconHovered(false)}
            onClick={handleUploadClick}
          >
            <img 
              src="/assets/images/calendar.png" 
              alt="Upload new PDF" 
              className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 object-contain transition-all duration-300 ${
                isIconHovered ? 'scale-125 animate-wiggle' : ''
              }`}
              style={{
                filter: isIconHovered 
                  ? 'drop-shadow(0 0 12px rgba(255, 178, 225, 0.8)) drop-shadow(0 0 24px rgba(255, 178, 225, 0.6))' 
                  : 'none',
              }}
            />
            {/* "Upload new pdf" text that fades in */}
            <span 
              className={`whitespace-nowrap text-sm sm:text-base md:text-lg transition-all duration-300 mt-1 ${
                isIconHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 h-0'
              }`}
              style={{
                fontFamily: 'ViuCobacoba, display',
                fontWeight: 600,
                color: 'var(--pink-body)',
              }}
            >
              Upload new PDF
            </span>
          </div>

          {/* Right side - Auth */}
          <div className="flex items-center gap-3 sm:gap-4">
            {loading ? (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-white/50 rounded-full">
                <div 
                  className="w-5 h-5 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'var(--hotpinku)', borderTopColor: 'transparent' }}
                />
              </div>
            ) : user ? (
              <>
                {/* Profile display */}
                <div 
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full h-10 sm:h-11 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-default"
                  style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                  }}
                >
                  {/* Avatar with pawfessor fallback */}
                  {user.user_metadata?.avatar_url && !avatarError ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <img
                      src="/assets/images/pawfessor-head.png"
                      alt="Profile"
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover"
                      style={{ 
                        background: 'linear-gradient(135deg, #BDDBFF 0%, #E8D5FF 100%)',
                      }}
                    />
                  )}
                  <span 
                    className="text-xs sm:text-sm font-semibold hidden sm:inline"
                    style={{
                      fontFamily: 'Urbanist, sans-serif',
                      color: 'var(--dark)',
                    }}
                  >
                  {user.user_metadata?.full_name || user.email}
                </span>
              </div>
              
              {/* Sign out button - gradient peach style */}
              <button
                onClick={signOut}
                className="px-5 sm:px-6 text-white text-xs sm:text-sm font-semibold rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 h-10 sm:h-11"
                style={{ 
                  fontFamily: 'Urbanist, sans-serif',
                  background: 'var(--gradient-peach)',
                  backgroundSize: '200% 200%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.animation = 'gradient-shift 2s ease infinite';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.animation = 'none';
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            /* Sign in button */
            <button
              onClick={signInWithGoogle}
              className="flex items-center justify-center gap-2 px-5 sm:px-6 bg-white font-semibold rounded-full border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 h-10 sm:h-11"
              style={{
                fontFamily: 'Urbanist, sans-serif',
                color: 'var(--dark)',
                borderColor: 'rgba(189, 219, 255, 0.6)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--hotpinku)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(189, 219, 255, 0.6)';
              }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-xs sm:text-sm">Sign in with Google</span>
            </button>
          )}
          </div>
        </div>
      </nav>
    </div>
  );
}
