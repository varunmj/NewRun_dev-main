import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, LayersTwo01, LogOut01, Settings01, User01, Home05 } from "@untitledui/icons";
import { MdCircle, MdAccessTime, MdDoNotDisturb, MdOfflineBolt } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useUserStatus } from '../../context/UserStatusContext';
import { getInitials, getAvatarBgColor } from '../../utils/avatarUtils';
import axios from '../../utils/axiosInstance';

// Status configuration for mini dropdown

const STATUS_CONFIG = {
  online: {
    label: 'Online',
    icon: MdCircle,
    color: '#22c55e',
    bgColor: '#22c55e',
    showIcon: false, // Just green dot
    showDot: true
  },
  away: {
    label: 'Away',
    icon: MdAccessTime,
    color: '#f59e0b',
    bgColor: '#f59e0b',
    showIcon: true, // Yellow clock
    showDot: false
  },
  dnd: {
    label: 'Do Not Disturb',
    icon: MdDoNotDisturb,
    color: '#ef4444',
    bgColor: '#ef4444',
    showIcon: true, // Red DND icon
    showDot: false
  },
  offline: {
    label: 'Offline',
    icon: MdOfflineBolt,
    color: '#6b7280',
    bgColor: '#6b7280',
    showIcon: false, // Just gray dot
    showDot: true
  }
};

const UserDropdown = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth(); // ADD isAuthenticated
  const { userStatus, setUserStatus } = useUserStatus();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  

  // refs
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const statusRef = useRef(null);

  // --- FOG (localized blur) state ---
  const [fog, setFog] = useState({ x: 0, y: 0, rInner: 0, rOuter: 0 });

  // Fetch user
  useEffect(() => {
    // SKIP if not authenticated
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await axios.get('/get-user');
        if (response.data && !response.data.error) {
          setUser(response.data.user);
        }
      } catch (e) {
        console.error('Error fetching user:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [isAuthenticated]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e) => {
      const t = e.target;
      // if click is inside the button, menu, or status dropdown, ignore
      if (buttonRef.current?.contains(t) || menuRef.current?.contains(t) || statusRef.current?.contains(t)) return;
      setIsOpen(false);
      setIsStatusOpen(false);
    };

    // use pointerdown so it feels snappy, but with the proper guards
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  // Recompute fog center/radius on open, resize, or scroll
  useLayoutEffect(() => {
    function computeFog() {
      const menuEl = menuRef.current;
      const btnEl  = buttonRef.current;

      // Prefer menu bounds when open; otherwise button
      const target = (isOpen && menuEl) ? menuEl : btnEl;
      if (!target) return;

      const rect = target.getBoundingClientRect();
      // center relative to viewport + scroll offset - position well below navbar
      const x = rect.left + rect.width / 2 + window.scrollX;
      const y = rect.top + rect.height / 2 + window.scrollY + 120; // Move center much lower to avoid navbar

       // radius: slightly bigger than menu diagonal for "in & around" feel
       const base = Math.hypot(rect.width, rect.height) / 2;
       const rInner = Math.max(120, base + 24);   // start of fog
       const rOuter = rInner + 180;               // fade-out edge (increased for larger blur bubble)

      setFog({ x, y, rInner, rOuter });
    }

    if (isOpen) {
      computeFog();
      const ro = new ResizeObserver(computeFog);
      if (menuRef.current) ro.observe(menuRef.current);
      if (buttonRef.current) ro.observe(buttonRef.current);
      window.addEventListener('scroll', computeFog, { passive: true });
      window.addEventListener('resize', computeFog);

      return () => {
        ro.disconnect();
        window.removeEventListener('scroll', computeFog);
        window.removeEventListener('resize', computeFog);
      };
    }
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const userInitials = user ? getInitials(`${user.firstName || ''} ${user.lastName || ''}`) : 'U';
  const userBgColor = user ? getAvatarBgColor(`${user.firstName || ''} ${user.lastName || ''}`) : 'bg-blue-500';
  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' : 'User';
  const userEmail = user?.email || 'user@newrun.com';

  if (isLoading) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-500 animate-pulse">
        <span className="text-xs font-semibold text-white">...</span>
      </div>
    );
  }

  // Build a ring mask so ONLY the nearby circular area shows the overlay (fog/blur)
  const fogMask = isOpen
    ? `radial-gradient(
        circle at ${fog.x}px ${fog.y}px,
        transparent ${fog.rInner - 24}px,
        #000 ${fog.rInner}px,
        #000 ${fog.rOuter}px,
        transparent ${fog.rOuter + 24}px
      )`
    : 'none';

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-white/10 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden"
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={userInitials}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`w-full h-full items-center justify-center text-xs font-semibold text-white ${
            user?.avatar ? 'hidden' : 'flex'
          } ${userBgColor}`}
        >
          {userInitials}
        </div>
        
      </button>

       {/* Localized radial blur backdrop - rendered at document level */}
       {isOpen && createPortal(
         <div
           className="fixed inset-0 pointer-events-none transition-opacity duration-200"
           style={{
             zIndex: 109, // below the menu
             // Actual blur
             backdropFilter: 'blur(12px) saturate(115%)',
             WebkitBackdropFilter: 'blur(12px) saturate(115%)',
             // Slight tint so the effect reads on dark UIs
             background: 'rgba(8,10,14,0.18)',

             // ----- NORMAL RADIAL MASK -----
             // Strong blur near dropdown, fade to transparent outward.
             WebkitMaskImage: `radial-gradient(
               circle at ${fog.x - window.scrollX}px ${fog.y - window.scrollY}px,
               rgba(0,0,0,1) ${fog.rInner - 24}px,      /* full blur near dropdown */
               rgba(0,0,0,0.75) ${fog.rInner + 8}px,    /* start fade */
               rgba(0,0,0,0.35) ${fog.rInner + 60}px,
               rgba(0,0,0,0) ${fog.rOuter}px            /* clear outside */
             )`,
             maskImage: `radial-gradient(
               circle at ${fog.x - window.scrollX}px ${fog.y - window.scrollY}px,
               rgba(0,0,0,1) ${fog.rInner - 24}px,
               rgba(0,0,0,0.75) ${fog.rInner + 8}px,
               rgba(0,0,0,0.35) ${fog.rInner + 60}px,
               rgba(0,0,0,0) ${fog.rOuter}px
             )`,
             willChange: 'backdrop-filter, -webkit-backdrop-filter, mask-image, -webkit-mask-image, opacity'
           }}
           aria-hidden="true"
         >
           {/* Optional soft halo for depth */}
           <div
             className="absolute inset-0"
             style={{
               background: `radial-gradient(
                 circle at ${fog.x - window.scrollX}px ${fog.y - window.scrollY}px,
                 rgba(255,255,255,0.06) 0px,
                 rgba(255,255,255,0.04) ${Math.max(fog.rInner, 140)}px,
                 rgba(0,0,0,0.12) ${fog.rOuter + 20}px,
                 transparent ${fog.rOuter + 160}px
               )`
             }}
           />
         </div>,
         document.body
       )}

      {/* DROPDOWN */}
      {isOpen && createPortal(
        <div
          ref={menuRef}
          onPointerDown={(e) => e.stopPropagation()}  // belt & suspenders
          className="fixed w-64 rounded-2xl border border-white/10 bg-[#0F1115]/95 backdrop-blur-md shadow-2xl ring-1 ring-black/5 z-[9999] pointer-events-auto"
          style={{
            top: `${buttonRef.current?.getBoundingClientRect().bottom + 8}px`,
            right: `${window.innerWidth - (buttonRef.current?.getBoundingClientRect().right || 0)}px`
          }}
        >
          {/* User Header */}
          <div className="flex gap-3 border-b border-white/20 p-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-blue-500 overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={userInitials}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full flex items-center justify-center text-sm font-semibold text-white ${
                      user?.avatar ? 'hidden' : 'flex'
                    } ${userBgColor}`}
                  >
                    {userInitials}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsStatusOpen(!isStatusOpen);
                  }}
                  className="absolute -bottom-1 -right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-white/20 bg-black/50 backdrop-blur-sm cursor-pointer hover:bg-black/70 transition-all duration-200 group"
                  title={`Status: ${STATUS_CONFIG[userStatus]?.label || 'Online'}`}
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: STATUS_CONFIG[userStatus]?.bgColor || '#22c55e' }}
                  />
                  <svg 
                    className="w-2 h-2 text-white/60 group-hover:text-white transition-colors" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col">
                <div className="text-sm font-semibold text-white">{fullName}</div>
                <div className="text-xs text-white/60">{userEmail}</div>
              </div>
            </div>
          </div>

          {/* Mini Status Dropdown */}
          {isStatusOpen && createPortal(
            <div
              ref={statusRef}
              onPointerDown={(e) => e.stopPropagation()}
              className="fixed w-48 rounded-xl border-2 border-white/30 bg-[#0F1115] backdrop-blur-md shadow-2xl ring-2 ring-white/10 z-[10000] pointer-events-auto"
              style={{
                top: `${(buttonRef.current?.getBoundingClientRect().bottom || 0) + 60}px`,
                left: `${(buttonRef.current?.getBoundingClientRect().left || 0) - 165}px`,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              <div className="p-2">
                <div className="text-xs font-medium text-white/60 mb-2 px-2">Set your status</div>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                  const Icon = config.icon;
                  const isSelected = status === userStatus;
                  
                  return (
                    <button
                      key={status}
                      onClick={() => {
                        setUserStatus(status);
                        setIsStatusOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                        isSelected 
                          ? 'bg-white/10 text-white' 
                          : 'hover:bg-white/5 text-white/80'
                      }`}
                    >
                      {config.showDot && (
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: config.bgColor }}
                        />
                      )}
                      {config.showIcon && (
                        <Icon 
                          className="w-4 h-4" 
                          style={{ color: config.color }}
                        />
                      )}
                      <span>{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )}

          {/* Menu Items */}
          <div className="py-1">
            <div className="px-1">
              <button
                onClick={() => handleNavigation('/profile')}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm font-semibold text-white hover:bg-white/5 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <User01 className="text-white/60 w-4 h-4" />
                  <span>View profile</span>
                </div>
                <span className="text-xs font-medium text-white/60 bg-white/5 rounded px-1.5 py-0.5 border border-white/10">⌘ K → P</span>
              </button>
              <button
                onClick={() => handleNavigation('/dashboard')}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm font-semibold text-white hover:bg-white/5 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Home05 className="text-white/60 w-4 h-4" />
                  <span>Dashboard</span>
                </div>
                <span className="text-xs font-medium text-white/60 bg-white/5 rounded px-1.5 py-0.5 border border-white/10">⌘ D</span>
              </button>
              <button
                onClick={() => handleNavigation('/settings')}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm font-semibold text-white hover:bg-white/5 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <Settings01 className="text-white/60 w-4 h-4" />
                  <span>Settings</span>
                </div>
                <span className="text-xs font-medium text-white/60 bg-white/5 rounded px-1.5 py-0.5 border border-white/10">⌘ S</span>
              </button>
            </div>

            <div className="my-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="px-1">
              <button
                onClick={() => handleNavigation('/activities')}
                className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm font-semibold text-white hover:bg-white/5 transition-all duration-200"
              >
                <LayersTwo01 className="text-white/60 w-4 h-4" />
                <span>Activities</span>
              </button>
              <button
                onClick={() => handleNavigation('/support')}
                className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm font-semibold text-white hover:bg-white/5 transition-all duration-200"
              >
                <HelpCircle className="text-white/60 w-4 h-4" />
                <span>Support Center</span>
              </button>
            </div>

            <div className="my-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="px-1">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm font-semibold text-red-300 hover:bg-red-500/20 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <LogOut01 className="text-red-300 w-4 h-4" />
                  <span>Log out</span>
                </div>
                <span className="text-xs font-medium text-white/60 bg-white/5 rounded px-1.5 py-0.5 border border-white/10">⌥ ⇧ Q</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserDropdown;
