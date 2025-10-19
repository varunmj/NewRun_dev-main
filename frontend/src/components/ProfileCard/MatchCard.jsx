import React, { useEffect } from 'react';
import ProfileCard from './ProfileCard';
import VerifiedIcon from '../../assets/icons/icons8-verified-48.png';
import { getUniversityLogoUrl, prefetchUniversityLogo } from '../../utils/clearbitLogo';
import './MatchCard.css';

// Smart display name per PM rules
const displayName = ({ full = "", firstName = "", lastName = "" } = {}) => {
  const split = (s) => String(s).trim().split(/\s+/).filter(Boolean);
  const fParts = split(firstName);
  const lParts = split(lastName);

  if (fParts.length || lParts.length) {
    if (fParts.length >= 2) return `${fParts[0]} ${fParts[1]}`.trim();
    if (fParts.length === 1 && lParts.length >= 2) return `${fParts[0]} ${lParts[lParts.length - 1]}`.trim();
    const f = fParts[0] || "";
    const l = lParts[lParts.length - 1] || "";
    return `${f} ${l}`.trim() || (full || "").trim();
  }
  const tokens = split(full);
  if (tokens.length <= 2) return tokens.join(" ").trim();
  return `${tokens[0]} ${tokens[1]}`.trim();
};

const formatLastActive = (iso) => {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch { return "recently"; }
};

const MatchCard = ({ 
  item, 
  onOpen, 
  onMessage,
  className = "",
  hideOverlays = false,
  contactText = "Message"
}) => {
  const nameShort = displayName({ full: item.name, firstName: item.firstName, lastName: item.lastName });
  const handle = nameShort.toLowerCase().replace(/\s+/g, '');
  
  // Use status if available, otherwise fall back to lastActive
  const status = item.statusLabel || (item.lastActive ? formatLastActive(item.lastActive) : "Recently active");
  const title = item.university || "";

  useEffect(() => {
    if (item.university) prefetchUniversityLogo(item.university);
  }, [item.university]);

  const handleContactClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation(); // Prevent card click when clicking message button
      }
    }
    
    // Check if this is a self-profile (Edit Profile button)
    if (item.isSelfProfile && onOpen) {
      onOpen();
      return;
    }
    
    // Create a pre-filled message with roommate request details
    const matchReasons = item.reasons?.slice(0, 3).map(r => r.text).join(', ') || 'We have compatible preferences';
    const preFilledMessage = `Hi ${nameShort}! 👋 

I found you through NewRun's roommate matching and we have a ${Math.round(item.matchScore || 0)}% compatibility score! 

Here's why I think we'd be great roommates:
• ${matchReasons}

${item.university ? `I see you're also at ${item.university} - that's awesome!` : ''}
${hasBudget ? `My budget is around $${item.budget}/month.` : ''}

Would you be interested in chatting about potentially being roommates? I'd love to learn more about what you're looking for! 

Looking forward to hearing from you! 😊`;

    // Use a safer encoding method that handles emojis properly
    const encodedMessage = encodeURIComponent(preFilledMessage).replace(/'/g, '%27');
    
    if (onMessage) {
      onMessage(item.userId, preFilledMessage);
    } else {
      window.location.assign(`/messaging?to=${item.userId}&ctx=roommate&message=${encodedMessage}`);
    }
  };

  const handleCardClick = (e) => { 
    // Only open drawer if not clicking on message button or its children
    if (e.target.closest('.pc-contact-btn')) {
      return; // Don't open drawer when clicking message button
    }
    
    // For self-profiles, don't open modal when clicking on the card/image
    // Only the "Edit Profile" button should open the modal
    if (item.isSelfProfile) {
      return; // Don't open modal when clicking on self-profile card
    }
    
    if (onOpen) onOpen(item); 
  };

  return (
    <div 
      className={`match-card-wrapper ${className}`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <ProfileCard
        avatarUrl={item.avatarUrl || ''}
        name={nameShort}
        title={title}
        handle={handle}
        status={status}
        contactText={contactText}
        showUserInfo={true}
        onContactClick={handleContactClick}
        enableTilt={true}
        enableMobileTilt={false}
        className="roommate-match-card"
      >
        {/* Overlays are now children of ProfileCard */}
        {!hideOverlays && item.matchScore && !item.isSelfProfile && (
          <div className="match-score-overlay">
            <div 
              className="match-score-ring"
              style={{
                '--score': item.matchScore,
                '--ring-color': `hsl(${Math.round(Math.max(0, Math.min(100, item.matchScore)) * 1.2)}, 85%, 55%)`
              }}
            >
              <div className="match-score-text">
                {Math.round(item.matchScore)}%
              </div>
            </div>
          </div>
        )}
        
        {!hideOverlays && item.matchScore >= 85 && !item.isSelfProfile && (
          <div className="top-match-badge">
            <div className="badge-dot"></div>
            <span>Top Match</span>
          </div>
        )}
        
        {/* Academic Status Badge for Self-Profile */}
        {!hideOverlays && item.isSelfProfile && item.academicStatus && (
          <div className={`academic-status-badge ${item.academicStatus}`}>
            {item.academicStatus === 'alumni' && (
              <svg className="alumni-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 12h8M8 16h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
            <span>
              {item.academicStatus === 'undergraduate' && 'Undergraduate'}
              {item.academicStatus === 'graduate' && 'Graduate'}
              {item.academicStatus === 'alumni' && 'Alumni'}
            </span>
          </div>
        )}
        
        {!hideOverlays && item.university && (
          <div className="university-badge">
            <img
              className="university-logo-img"
              src={getUniversityLogoUrl(item.university)}
              alt={item.university}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        )}
        
        {!hideOverlays && item.university && (
          <img 
            aria-hidden 
            className="university-watermark" 
            src={getUniversityLogoUrl(item.university)} 
            alt="" 
            onError={(e)=>{e.currentTarget.style.display='none';}} 
          />
        )}
        
        {!hideOverlays && item.verified?.edu && (
          <div className="verification-badge">
            <img src={VerifiedIcon} alt="Verified" className="verified-icon"/>
          </div>
        )}
      </ProfileCard>
    </div>
  );
};

export default MatchCard;


