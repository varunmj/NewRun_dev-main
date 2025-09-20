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
  hideOverlays = false
}) => {
  const nameShort = displayName({ full: item.name, firstName: item.firstName, lastName: item.lastName });
  const hasBudget = typeof item.budget === "number";
  const budgetText = hasBudget ? `$${item.budget}/month` : "Budget not specified";
  const handle = nameShort.toLowerCase().replace(/\s+/g, '');
  const status = item.lastActive ? formatLastActive(item.lastActive) : "Recently active";
  const title = item.university ? `${item.university} • ${budgetText}` : budgetText;

  useEffect(() => {
    if (item.university) prefetchUniversityLogo(item.university);
  }, [item.university]);

  const handleContactClick = () => {
    if (onMessage) onMessage(item.userId);
    else window.location.assign(`/messages?to=${item.userId}&ctx=roommate`);
  };

  const handleCardClick = () => { if (onOpen) onOpen(item); };

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
        contactText="Message"
        showUserInfo={true}
        onContactClick={handleContactClick}
        enableTilt={true}
        enableMobileTilt={false}
        className="roommate-match-card"
      >
        {/* Overlays */}
        <div className="match-overlays">
          {!hideOverlays && item.matchScore && (
            <div className="match-score-overlay">
              <div 
                className="match-score-ring"
                style={{
                  '--score': item.matchScore,
                  '--ring-color': `hsl(${Math.round(Math.max(0, Math.min(100, item.matchScore)) * 1.2)}, 85%, 55%)`
                }}
              >
                <div className="match-score-text">{Math.round(item.matchScore)}%</div>
              </div>
            </div>
          )}

          {!hideOverlays && item.matchScore >= 85 && (
            <div className="top-match-badge"><div className="badge-dot"></div><span>Top Match</span></div>
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
            <img aria-hidden className="university-watermark" src={getUniversityLogoUrl(item.university)} alt="" onError={(e)=>{e.currentTarget.style.display='none';}} />
          )}

          {!hideOverlays && item.verified?.edu && (
            <div className="verification-badge"><img src={VerifiedIcon} alt="Verified" className="verified-icon"/></div>
          )}
        </div>
      </ProfileCard>
    </div>
  );
};

export default MatchCard;


