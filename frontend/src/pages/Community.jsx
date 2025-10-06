// src/pages/Community.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import "../styles/newrun-hero.css";
import CommunityService from "../services/CommunityService";
import { timeAgo } from "../utils/timeUtils";
import PlaybookSpotlight from "../components/ThisWeekCard";
import { MdChecklist, MdTimeline } from "react-icons/md";
// Exact geometry from /assets/icons/bookmark.svg
const BookmarkSvg = ({ active, className = "" }) => (
  <svg
    viewBox="0 0 120 120"
    className={className}
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon
      points="98,109 60,88 22,109 22,12 98,12"
      // solid red when active, otherwise transparent with red outline
      fill={active ? "#ff1200" : "transparent"}
      stroke="#ff1200"
      strokeWidth={active ? 0 : 8}          // ~1.6px when rendered at 24px
      strokeLinejoin="round"
      strokeLinecap="round"
      shapeRendering="geometricPrecision"
    />
  </svg>
);
import { getUniversityBranding, getContrastTextColor } from "../utils/universityBranding";
import ViewAllModal from "../components/Community/ViewAllModal";
import MagicBento, { ParticleCard, GlobalSpotlight } from "../components/MagicBento";

/* ------------------------------------------------------------------ */
/* Tiny UI atoms that match your Marketplace look                      */
/* ------------------------------------------------------------------ */
function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/70">
      {children}
    </span>
  );
}
function Panel({ className = "", children }) {
  return <div className={`nr-panel ${className}`}>{children}</div>;
}
function GlowIcon({ children }) {
  return (
    <div className="nr-iconTile">
      <div className="nr-iconTile-inner">{children}</div>
    </div>
  );
}

/* Inline SVGs (no external deps) */
const Svg = {
  Cap: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-4 9 4-9 4-9-4Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 11v4c0 1.1 2.7 2 6 2s6-.9 6-2v-4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Clock: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  Shield: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 4 6v6c0 4.5 3.4 7.3 8 9 4.6-1.7 8-4.5 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function Community() {
  const [userInfo, setUserInfo] = useState(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const askRef = useRef(null);
  
  // Ask Question Modal State
  const [showAskModal, setShowAskModal] = useState(false);
  const [askForm, setAskForm] = useState({
    title: '',
    body: '',
    tags: '',
    school: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await axiosInstance.get("/get-user");
        if (r?.data?.user) {
          setUserInfo(r.data.user);
          // Get university branding from backend (cached)
          if (r.data.user.university) {
            console.log('Fetching branding for:', r.data.user.university);
            const branding = await getUniversityBranding(r.data.user.university, axiosInstance);
            console.log('Branding received:', branding);
            console.log('Logo URL:', branding?.logoUrl);
            if (branding) {
              setUniversityBranding(branding);
              setLogoError(false); // Reset logo error when new branding loads
            } else {
              // Set default branding if fetch fails
              setUniversityBranding({
                name: r.data.user.university,
                primary: '#2F64FF',
                secondary: '#FFA500',
                textColor: '#FFFFFF',
                logoUrl: null
              });
            }
          }
        }
      } catch (err) {
        console.error('Error loading user or branding:', err);
        if (err?.response?.status === 401) {
          localStorage.clear();
          navigate("/login");
        }
      }
    })();
  }, [navigate]);

  /* Mock data (swap to API later) */
  const trending = [
    "F-1 visa", "I-20", "Affordable housing", "Dorm essentials",
    "Buy/sell textbooks", "Part-time jobs", "Phone plans", "Banking"
  ];
  const [latest, setLatest] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('');
  const [universityFilter, setUniversityFilter] = useState('my'); // 'my' or 'all'
  const [universityBranding, setUniversityBranding] = useState(null);
  const [logoError, setLogoError] = useState(false); // Track if logo failed to load
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showViewAllModal, setShowViewAllModal] = useState(false);
  
  // Voting states
  const [votingStates, setVotingStates] = useState({}); // Track voting for each thread
  const [userVotes, setUserVotes] = useState({}); // Track user's vote for each thread
  
  // Bookmark states - single source of truth
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set()); // Set<string>
  const [bookmarkInFlight, setBookmarkInFlight] = useState({}); // { [id]: boolean }
  const [showBookmarks, setShowBookmarks] = useState(false); // Show bookmarked questions
  const gridRef = useRef(null);
  
  // AI Question Assistant states
  const [aiDraft, setAiDraft] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [draftStep, setDraftStep] = useState('idle'); // 'idle', 'generating', 'review', 'ready'
  const [questionContext, setQuestionContext] = useState({
    topic: '',
    urgency: 'medium',
    details: ''
  });
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  
  const QUESTIONS_PER_PAGE = 6;

  // Normalize thread IDs to prevent ObjectId/string mismatches
  const normId = (t) => String(t?._id || t?.id);

  // Robust pagination normalizer to handle both API and fallback responses
  const normalizePagination = ({ page, limit, total, itemsLen, raw }) => {
    // Prefer backend values if present and complete
    if (raw?.totalPages != null) {
      return {
        currentPage: raw.currentPage ?? page,
        totalPages: raw.totalPages,
        hasPrevPage: raw.hasPrevPage ?? page > 1,
        hasNextPage: raw.hasNextPage ?? (raw.currentPage ?? page) < raw.totalPages,
      };
    }

    // Client-side best effort (array or missing pagination)
    const totalPages = total
      ? Math.max(1, Math.ceil(total / (limit || QUESTIONS_PER_PAGE)))
      : Math.max(1, Math.ceil((itemsLen || 0) / (limit || QUESTIONS_PER_PAGE)));

    return {
      currentPage: page,
      totalPages,
      hasPrevPage: page > 1,
      // If server didn't tell us, assume "maybe next" when we filled the page
      hasNextPage: (itemsLen || 0) >= (limit || QUESTIONS_PER_PAGE) && page < totalPages,
    };
  };

  // Computed values
  const bookmarkedCount = latest.filter(q => bookmarkedIds.has(normId(q))).length;

  const scrollToAsk = () => askRef.current?.scrollIntoView({ behavior: "smooth" });

  // Safe page changer to prevent out-of-range page requests
  const changePage = (next) => {
    if (!pagination) return;
    const p = Math.min(Math.max(1, next), pagination.totalPages);
    if (p !== currentPage) loadThreads(p);
  };

  // AI Question Assistant functions
  const generateSuggestedTags = (topic, question) => {
    const topicLower = topic.toLowerCase();
    const questionLower = question.toLowerCase();
    
    // Base tags based on topic
    const topicTags = {
      'housing': ['housing', 'apartment', 'rent', 'dorm', 'off-campus'],
      'visa': ['visa', 'immigration', 'f1', 'h1b', 'opt', 'cpt'],
      'budget': ['budget', 'money', 'finance', 'expenses', 'savings'],
      'academic': ['academic', 'courses', 'gpa', 'study', 'grades'],
      'job': ['job', 'career', 'internship', 'employment', 'interview'],
      'social': ['social', 'friends', 'activities', 'events', 'community'],
      'health': ['health', 'insurance', 'medical', 'wellness', 'mental-health'],
      'transportation': ['transportation', 'car', 'bus', 'uber', 'commute']
    };

    // Find matching tags based on topic
    let suggested = [];
    for (const [key, tags] of Object.entries(topicTags)) {
      if (topicLower.includes(key) || questionLower.includes(key)) {
        suggested = [...suggested, ...tags];
      }
    }

    // Add common tags based on question content
    if (questionLower.includes('help') || questionLower.includes('advice')) {
      suggested.push('help', 'advice');
    }
    if (questionLower.includes('experience') || questionLower.includes('story')) {
      suggested.push('experience', 'story');
    }
    if (questionLower.includes('urgent') || questionLower.includes('asap')) {
      suggested.push('urgent');
    }

    // Remove duplicates and limit to 5 tags
    return [...new Set(suggested)].slice(0, 5);
  };

  const generateAIDraft = async () => {
    if (!questionContext.topic.trim()) {
      alert('Please enter a topic or question to get AI help!');
      return;
    }

    setIsGeneratingDraft(true);
    setDraftStep('generating');

    try {
      // Simulate AI generation (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const sampleDrafts = [
        `I'm looking for advice on ${questionContext.topic}. Can anyone share their experience or recommendations?`,
        `Quick question about ${questionContext.topic} - what worked best for you?`,
        `Need help with ${questionContext.topic}. Any tips or resources you'd recommend?`,
        `Has anyone dealt with ${questionContext.topic}? Looking for guidance on the best approach.`
      ];
      
      const randomDraft = sampleDrafts[Math.floor(Math.random() * sampleDrafts.length)];
      setAiDraft(randomDraft);
      
      // Generate suggested tags
      const tags = generateSuggestedTags(questionContext.topic, randomDraft);
      setSuggestedTags(tags);
      setSelectedTags(tags); // Auto-select all suggested tags
      
      setDraftStep('review');
    } catch (error) {
      console.error('AI generation error:', error);
      setDraftStep('idle');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const acceptDraft = () => {
    setAskForm(prev => ({ ...prev, title: aiDraft }));
    setDraftStep('ready');
  };

  const regenerateDraft = () => {
    generateAIDraft();
  };

  const useDraftAndAsk = () => {
    setAskForm(prev => ({ ...prev, title: aiDraft }));
    openAskModal();
  };

  const resetAIAssistant = () => {
    setDraftStep('idle');
    setAiDraft('');
    setQuestionContext({ topic: '', urgency: 'medium', details: '' });
    setSuggestedTags([]);
    setSelectedTags([]);
  };

  const addTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const addCustomTag = (tag) => {
    const cleanTag = tag.trim().toLowerCase();
    if (cleanTag && !selectedTags.includes(cleanTag)) {
      setSelectedTags(prev => [...prev, cleanTag]);
    }
  };

  const onSearch = async (e) => {
    e.preventDefault();
    const q = search.trim();
    setSearching(true);
    try {
      const params = {};
      if (universityFilter === 'my' && userInfo?.university) {
        params.school = userInfo.university;
      }
      if (!q) {
        await loadThreads(1); // Reset to first page
        setActiveFilter('');
        setCurrentPage(1);
        setPagination(prev => prev ? { ...prev, currentPage: 1 } : prev);
        return;
      }
      params.q = q;
      params.limit = QUESTIONS_PER_PAGE;
      params.page = 1;
      
      const result = await CommunityService.list(params);
      console.log('Search results for:', q, result);
      
      if (result && result.items) {
        setLatest(result.items);
        setPagination(result.pagination);
        setCurrentPage(1);
      } else {
        setLatest(Array.isArray(result) ? result : []);
        setPagination(null);
      }
      setActiveFilter(q);
    } catch (error) {
      console.error('Search error:', error);
      setLatest([]);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = async () => {
    setSearch('');
    setActiveFilter('');
    setSearching(true);
    try {
      const params = {};
      if (universityFilter === 'my' && userInfo?.university) {
        params.school = userInfo.university;
      }
      const items = await CommunityService.list(params);
      setLatest(Array.isArray(items) ? items : []);
      setCurrentPage(1);
      setPagination(prev => prev ? { ...prev, currentPage: 1 } : prev);
      setShowAll(false);
    } catch (error) {
      console.error('Error clearing search:', error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    // Reload when university filter changes - reset pagination to prevent stale state
    setCurrentPage(1);
    setPagination(null);   // prevents showing stale pager from previous filter
    loadThreads(1);
  }, [universityFilter]);

  // Load bookmarks once when user changes
  useEffect(() => {
    if (!userInfo?.userId) return;
    
    (async () => {
      try {
        console.log('🔄 Loading bookmarks for user:', userInfo.userId);
        const res = await CommunityService.getBookmarks();
        console.log('📌 Raw bookmark response:', res);
        
        // Robust ID normalization for any backend response format
        const toId = (x) => {
          if (!x) return null;
          if (typeof x === 'string') return x;
          return String(x._id || x.id || x.threadId || (x.thread && (x.thread._id || x.thread.id)));
        };
        
        const ids = (res?.bookmarks || []).map(toId).filter(Boolean);
        console.log('📌 Loaded bookmark IDs:', ids);
        console.log('📌 Setting bookmarkedIds to:', new Set(ids));
        setBookmarkedIds(new Set(ids));
      } catch (e) {
        console.error('❌ Load bookmarks error:', e?.response?.data || e.message);
        console.log('📌 Setting bookmarkedIds to empty Set due to error');
        setBookmarkedIds(new Set());
      }
    })();
  }, [userInfo?.userId]);

  const loadThreads = async (page = 1) => {
    setSearching(true);
    try {
      const params = { 
        limit: QUESTIONS_PER_PAGE, 
        page: page 
      };
      if (universityFilter === 'my' && userInfo?.university) {
        params.school = userInfo.university;
      }
      console.log('🔄 Loading threads with params:', params);
      const result = await CommunityService.list(params);
      
      if (result && result.items) {
        console.log('📋 Loaded threads:', result.items.length, 'Pagination:', result.pagination);
        setLatest(result.items);
        setPagination(
          normalizePagination({
            page,
            limit: params.limit,
            total: result.total ?? result.count,   // use if backend provides
            itemsLen: result.items.length,
            raw: result.pagination,
          })
        );
        setCurrentPage(page);
        if (userInfo?.userId) loadVoteStatuses(result.items);
      } else {
        // Plain array: client-side paginate
        const arr = Array.isArray(result) ? result : [];
        const start = (page - 1) * QUESTIONS_PER_PAGE;
        const slice = arr.slice(start, start + QUESTIONS_PER_PAGE);
        console.log('📋 Loaded threads (fallback):', arr.length, 'page:', page, 'start:', start, 'slice:', slice.length);
        setLatest(slice);
        setPagination(
          normalizePagination({
            page,
            limit: QUESTIONS_PER_PAGE,
            total: arr.length,
            itemsLen: slice.length,
          })
        );
        setCurrentPage(page);
        if (userInfo?.userId) loadVoteStatuses(slice);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
      setLatest([]);
      setPagination(null);
    } finally {
      setSearching(false);
    }
  };

  const openAskModal = () => {
    setShowAskModal(true);
    setAskForm({
      title: aiDraft || '',
      body: '',
      tags: selectedTags.join(', '),
      school: userInfo?.university || ''
    });
  };

  const handleAskSubmit = async (e) => {
    e.preventDefault();
    if (!askForm.title.trim() || askForm.title.trim().length < 6) {
      alert('Title must be at least 6 characters');
      return;
    }
    setIsSubmitting(true);
    try {
      const tagsArray = selectedTags.length > 0 ? selectedTags : askForm.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      const newThread = await CommunityService.addThread({
        title: askForm.title.trim(),
        body: askForm.body.trim(),
        tags: tagsArray,
        school: askForm.school.trim() || userInfo?.university || 'Unknown',
        author: userInfo?.username || '@anonymous'
      });
      setShowAskModal(false);
      // Refresh the list with current filter context
      await loadThreads(); // Use existing loadThreads function to respect university filter
      // Navigate to the new thread
      if (newThread?._id || newThread?.id) {
        navigate(`/community/thread/${newThread._id || newThread.id}`);
      }
    } catch (error) {
      console.error('Error posting question:', error);
      alert('Failed to post question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagClick = async (tag) => {
    setSearch(tag);
    setSearching(true);
    setActiveFilter(tag);
    try {
      const params = { q: tag };
      if (universityFilter === 'my' && userInfo?.university) {
        params.school = userInfo.university;
      }
      const items = await CommunityService.list(params);
      console.log('Tag filter results for:', tag, items);
      setLatest(Array.isArray(items) ? items : []);
      setShowAll(true);
      // Scroll to results
      setTimeout(() => {
        const resultsSection = document.querySelector('.grid.gap-5');
        if (resultsSection) {
          const offset = resultsSection.getBoundingClientRect().top + window.pageYOffset - 100;
          window.scrollTo({ top: offset, behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Tag filter error:', error);
      setLatest([]);
    } finally {
      setSearching(false);
    }
  };

  const [newsEmail, setNewsEmail] = useState('');
  const [newsStatus, setNewsStatus] = useState('');

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsEmail.trim()) return;
    try {
      const res = await axiosInstance.post('/newsletter', { email: newsEmail, source: 'community' });
      if (res.data.success) {
        setNewsStatus('success');
        setNewsEmail('');
        setTimeout(() => setNewsStatus(''), 3000);
      }
    } catch (err) {
      setNewsStatus('error');
      setTimeout(() => setNewsStatus(''), 3000);
    }
  };

  const loadVoteStatuses = async (threads) => {
    try {
      const votePromises = threads.map(async (thread) => {
        const threadId = thread._id || thread.id;
        const voteStatus = await CommunityService.checkVoteStatus(threadId);
        return { threadId, userVote: voteStatus.userVote };
      });
      
      const voteResults = await Promise.all(votePromises);
      const newUserVotes = {};
      voteResults.forEach(({ threadId, userVote }) => {
        if (userVote) {
          newUserVotes[threadId] = userVote;
        }
      });
      
      setUserVotes(prev => ({ ...prev, ...newUserVotes }));
    } catch (error) {
      console.error('Load vote statuses error:', error);
    }
  };

  // Voting function
  const handleVote = async (threadId, type, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const votingKey = `${threadId}_${type}`;
    if (votingStates[votingKey]) return; // Prevent double voting
    
    // Check if user already voted on this thread
    const currentUserVote = userVotes[threadId];
    if (currentUserVote === type) {
      // User is trying to vote the same way again
      alert('You have already voted on this question!');
      return;
    }
    
    setVotingStates(prev => ({ ...prev, [votingKey]: true }));
    
    try {
      const result = await CommunityService.voteThread(threadId, type);
      
      // Update user vote state
      setUserVotes(prev => ({ ...prev, [threadId]: type }));
      
      // Update the local state with separate counters
      setLatest(prev => prev.map(thread => 
        (thread._id || thread.id) === threadId 
          ? { 
              ...thread, 
              upvotes: result.upvotes || 0, 
              downvotes: result.downvotes || 0, 
              votes: result.votes || 0 
            }
          : thread
      ));
      
    } catch (error) {
      console.error('Error voting:', error);
      if (error.response?.status === 400) {
        alert(error.response.data.message || 'You have already voted on this question!');
      }
    } finally {
      setVotingStates(prev => ({ ...prev, [votingKey]: false }));
    }
  };

  // Robust bookmark handler with optimistic updates
  const handleBookmark = async (threadIdRaw, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    // threadIdRaw is already a normalized string from the UI
    const threadId = String(threadIdRaw);
    
    if (!threadId || threadId === 'undefined' || threadId === 'null') {
      console.error('❌ Invalid threadId:', threadId);
      alert('Invalid thread ID. Please refresh the page and try again.');
      return;
    }
    
    if (bookmarkInFlight[threadId]) return;

    setBookmarkInFlight((s) => ({ ...s, [threadId]: true }));

    const wasBookmarked = bookmarkedIds.has(threadId);

    // Optimistic update
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(threadId);
      else next.add(threadId);
      return next;
    });

    try {
      if (wasBookmarked) {
        await CommunityService.removeBookmark(threadId);
        console.log('✅ Bookmark removed successfully');
      } else {
        await CommunityService.bookmarkThread(threadId);
        console.log('✅ Bookmark added successfully');
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || '';

      // ✅ Accept common idempotent failures as success
      const isIdempotentOk =
        (wasBookmarked && (status === 404 || /not\s*bookmarked/i.test(msg))) ||
        (!wasBookmarked && (status === 409 || /already\s*bookmarked/i.test(msg)));

      if (!isIdempotentOk) {
        // Revert only on real failures
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          if (wasBookmarked) next.add(threadId);
          else next.delete(threadId);
          return next;
        });
        console.error('❌ Bookmark toggle failed:', status, msg);
        alert('Failed to update bookmark. Please try again.');
      } else {
        console.log('✅ Idempotent success - server already in desired state');
      }
    } finally {
      setBookmarkInFlight((s) => ({ ...s, [threadId]: false }));
    }
  };

  const toggleBookmarks = () => {
    setShowBookmarks(!showBookmarks);
  };

  return (
    <div className="nr-dots-page min-h-screen text-white">
      <style>
        {`
          .particle {
            position: absolute;
            border-radius: 50%;
            pointer-events: none;
            z-index: 100;
          }
          
          .particle::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: rgba(132, 0, 255, 0.2);
            border-radius: 50%;
            z-index: -1;
          }
        `}
      </style>
      <Navbar userInfo={userInfo} />

      {/* ---------------- Hero ---------------- */}
      <section className="nr-hero-bg">
        <div className="mx-auto max-w-6xl px-4 pt-16 md:pt-20 pb-10">
          {/* University Filter Toggle */}
          {userInfo?.university && universityBranding && (
            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] p-1 backdrop-blur-sm">
                <button
                  onClick={() => setUniversityFilter('my')}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all flex items-center gap-2.5 ${
                    universityFilter === 'my'
                      ? 'shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                  style={universityFilter === 'my' ? {
                    backgroundColor: universityBranding.primary || '#2F64FF',
                    color: universityBranding.textColor || getContrastTextColor(universityBranding.primary || '#2F64FF')
                  } : {}}
                >
                  {universityBranding?.logoUrl && !logoError ? (
                    <>
                      <img 
                        src={universityBranding.logoUrl} 
                        alt={universityBranding.name}
                        className="w-7 h-7 rounded-full object-cover border-2 border-white/30 shadow-md bg-white -ml-1"
                        style={{ display: 'block' }}
                        crossOrigin="anonymous"
                        onError={(e) => {
                          console.error('❌ Logo failed to load:', universityBranding.logoUrl);
                          console.error('Error event:', e);
                          setLogoError(true);
                        }}
                        onLoad={(e) => {
                          console.log('✅ Logo loaded successfully:', universityBranding.logoUrl);
                          console.log('Image dimensions:', e.target.naturalWidth, 'x', e.target.naturalHeight);
                        }}
                      />
                    </>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center text-[10px] font-bold -ml-1">
                      {(universityBranding?.name || userInfo?.university || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="whitespace-nowrap">
                    {universityBranding?.name || userInfo?.university || 'My University'}
                  </span>
                </button>
                <button
                  onClick={() => setUniversityFilter('all')}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    universityFilter === 'all'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-black shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  All Universities
                </button>
              </div>
            </div>
          )}

          {/* tiny badges */}
          <div className="mb-5 flex items-center justify-center gap-2 text-[11px]">
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">
              Student Q&A
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">
              Verified .edu accounts
            </span>
            {universityFilter === 'my' && userInfo?.university && universityBranding && (
              <span 
                className="rounded-full border px-2.5 py-1 font-semibold text-xs flex items-center gap-1.5"
                style={{
                  borderColor: `${universityBranding.primary}80`,
                  backgroundColor: `${universityBranding.primary}15`,
                  color: universityBranding.textColor || '#fff'
                }}
              >
                {universityBranding?.logoUrl && !logoError && (
                  <img 
                    src={universityBranding.logoUrl} 
                    alt=""
                    className="w-3.5 h-3.5 rounded-full object-cover bg-white"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}
                Filtered: {universityBranding.name}
              </span>
            )}
          </div>

          <h1 className="mx-auto max-w-5xl text-center text-4xl font-black tracking-tight md:text-6xl">
            You’ve got questions?{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
              Your campus has answers.
            </span>
          </h1>

          {/* search */}
          <form onSubmit={onSearch} className="mx-auto mt-8 w-full max-w-3xl">
            <div className="rounded-2xl border border-white/10 bg-white/5/50 p-3 backdrop-blur-md">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#101215] px-3 py-2.5">
                <span className="text-white/50">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Try: "I-20", "cheap desk", "sublet near campus"'
                  className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/40 focus:outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-white/50 hover:text-white/80 text-lg leading-none"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
                <button
                  type="submit"
                  disabled={searching}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/90 hover:bg-white/15 disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </form>

          {/* CTA row */}
          <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={scrollToAsk}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_8px_24px_rgba(255,153,0,.25)] hover:bg-orange-400"
            >
              Ask a question <Svg.ArrowRight />
            </button>
            <a
              href="#guides"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm text-white/85 hover:bg-white/10"
            >
              Browse guides
            </a>
          </div>

          {/* trending chips (marquee) */}
          <div className="mx-auto mt-7 max-w-3xl">
            <div className="nr-marquee" style={{ "--nr-gap": "10px", "--nr-marquee-dur": "26s" }}>
              <div className="nr-marquee-track">
                {trending.map((t, i) => (
                  <span key={`t1-${i}`} className="nr-chip cursor-pointer hover:bg-white/15" onClick={() => handleTagClick(t)}>#{t}</span>
                ))}
                {trending.map((t, i) => (
                  <span key={`t2-${i}`} className="nr-chip cursor-pointer hover:bg-white/15" aria-hidden onClick={() => handleTagClick(t)}>#{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Split: Ask panel + feature tiles ---------------- */}
      <section ref={askRef} className="mx-auto max-w-7xl px-4 pt-6 pb-12">
        <div className="mb-6 text-center">
          <Pill>WHY NEWRUN COMMUNITY</Pill>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-[40px]">
            The fastest way to get real answers from classmates.
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-12" ref={gridRef}>
          {/* Left: Ask panel */}
          <ParticleCard 
            className="nr-panel relative overflow-hidden lg:col-span-7"
            glowColor="47, 100, 255"
            particleCount={12}
            enableTilt={false}
            enableMagnetism={false}
            clickEffect={true}
            disableAnimations={false}
          >
            <div className="mb-4">
              <span className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-[11px] text-white/70">
                Get help fast
              </span>
            </div>

            <h3 className="max-w-xl text-[28px] font-extrabold leading-tight sm:text-[32px] bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent">
              Ask the community — and get a trustworthy answer.
            </h3>

            <p className="mt-3 max-w-xl text-white/80 leading-relaxed">
              Post your question with tags (e.g. <span className="text-blue-400 font-medium">#visa</span>, <span className="text-green-400 font-medium">#housing</span>, <span className="text-purple-400 font-medium">#dorm</span>). 
              Verified students respond quickly, and the accepted answer is pinned on top.
            </p>

            {/* Smart Question Builder */}
            <div className="mt-6 group">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2 transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/[0.06]">
                {/* Step 1: Topic Input */}
                {draftStep === 'idle' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-lg bg-[#0f1115]/80 px-4 py-3 ring-1 ring-white/10">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                        <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                <input
                        value={questionContext.topic}
                        onChange={(e) => setQuestionContext(prev => ({ ...prev, topic: e.target.value }))}
                        placeholder="What do you need help with? (e.g., housing, visa, budget)"
                        className="flex-1 bg-transparent text-sm text-white/70 placeholder:text-white/50 outline-none transition-colors duration-300 focus:text-white/90"
                      />
                      <button
                        onClick={generateAIDraft}
                        disabled={!questionContext.topic.trim()}
                        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 px-3 py-1.5 text-xs font-medium text-purple-300 hover:from-purple-500/30 hover:to-blue-500/30 hover:text-purple-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                  Draft with AI
                </button>
              </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={openAskModal}
                        className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-1.5 text-xs font-semibold text-black hover:from-amber-400 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
                      >
                        Ask Manually
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: AI Generating */}
                {draftStep === 'generating' && (
                  <div className="flex items-center gap-3 rounded-lg bg-[#0f1115]/80 px-4 py-3 ring-1 ring-white/10">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                      <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <span className="text-sm text-white/70">AI is crafting your question...</span>
                  </div>
                )}

                {/* Step 3: Review Draft */}
                {draftStep === 'review' && (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-[#0f1115]/80 px-4 py-3 ring-1 ring-white/10">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 mt-0.5">
                          <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-white/60 mb-1">AI Generated Question:</p>
                          <p className="text-sm text-white/90">{aiDraft}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={acceptDraft}
                        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:from-green-400 hover:to-emerald-500 transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Use This
                      </button>
                      <button
                        onClick={regenerateDraft}
                        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 px-3 py-1.5 text-xs font-medium text-purple-300 hover:from-purple-500/30 hover:to-blue-500/30 hover:text-purple-200 transition-all duration-300"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Regenerate
                      </button>
                      <button
                        onClick={useDraftAndAsk}
                        className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-1.5 text-xs font-semibold text-black hover:from-amber-400 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
                      >
                        Ask Now
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Ready to Ask */}
                {draftStep === 'ready' && (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-[#0f1115]/80 px-4 py-3 ring-1 ring-green-500/30">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                          <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-white/90">Question ready! Click "Ask Now" to post.</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setAskForm(prev => ({ ...prev, title: aiDraft }));
                          openAskModal();
                        }}
                        className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-1.5 text-xs font-semibold text-black hover:from-amber-400 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
                      >
                        Ask Now
                      </button>
                      <button
                        onClick={resetAIAssistant}
                        className="rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-medium text-white/70 hover:bg-white/20 hover:text-white/90 transition-all duration-300"
                      >
                        Start Over
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Quick suggestion chips */}
              <div className="mt-3 flex flex-wrap gap-2">
                {['🏠 Housing tips', '📋 Visa help', '💰 Budget advice', '🎓 Academic support'].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const tag = suggestion.split(' ')[1].toLowerCase();
                      setSearch(tag);
                      handleTagClick(tag);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/60 hover:text-white/90 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300"
                  >
                    {suggestion}
                </button>
                ))}
              </div>
            </div>

            {/* soft corner glow */}
            <div className="nr-ramp" aria-hidden />
          </ParticleCard>

          {/* Right: three tiles */}
          <div className="flex flex-col gap-5 lg:col-span-5">
            <ParticleCard 
              className="nr-panel flex items-start gap-4 p-5 sm:p-6"
              glowColor="47, 100, 255"
              particleCount={12}
              enableTilt={false}
              enableMagnetism={false}
              clickEffect={true}
              disableAnimations={false}
            >
              <GlowIcon><Svg.Cap /></GlowIcon>
              <div>
                <p className="text-[12px] font-semibold tracking-wide text-white/60">VERIFIED STUDENTS</p>
                <h4 className="mt-1 text-[18px] font-semibold">Sign in with .edu</h4>
                <p className="mt-1 text-white/75">
                  Buyers and sellers know they're dealing with real classmates.
                </p>
              </div>
            </ParticleCard>

            <ParticleCard 
              className="nr-panel flex items-start gap-4 p-5 sm:p-6"
              glowColor="47, 100, 255"
              particleCount={12}
              enableTilt={false}
              enableMagnetism={false}
              clickEffect={true}
              disableAnimations={false}
            >
              <GlowIcon><Svg.Clock /></GlowIcon>
              <div>
                <p className="text-[12px] font-semibold tracking-wide text-white/60">FAST ANSWERS</p>
                <h4 className="mt-1 text-[18px] font-semibold">Most questions solved in a day</h4>
                <p className="mt-1 text-white/75">
                  Accepted answers float to the top so you can act quickly.
                </p>
              </div>
            </ParticleCard>

            <ParticleCard 
              className="nr-panel flex items-start gap-4 p-5 sm:p-6"
              glowColor="47, 100, 255"
              particleCount={12}
              enableTilt={false}
              enableMagnetism={false}
              clickEffect={true}
              disableAnimations={false}
            >
              <GlowIcon><Svg.Shield /></GlowIcon>
              <div>
                <p className="text-[12px] font-semibold tracking-wide text-white/60">SAFE & PRIVATE</p>
                <h4 className="mt-1 text-[18px] font-semibold">Share only what's needed</h4>
                <p className="mt-1 text-white/75">
                  Post anonymously if you prefer; moderators keep things clean.
                </p>
              </div>
            </ParticleCard>
          </div>
        </div>
        
        {/* Global Spotlight for glow between boxes */}
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={false}
          enabled={true}
          spotlightRadius={300}
          glowColor="47, 100, 255"
        />
      </section>

      {/* ---------------- Latest questions ---------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">
              {showBookmarks ? (
                <>
                  <span className="text-amber-400">My Bookmarks</span>
                </>
              ) : activeFilter ? (
                <>
                  Search results for <span className="text-amber-400">"{activeFilter}"</span>
                </>
              ) : (
                'Latest questions'
              )}
            </h3>
            <p className="text-white/60">
              {showBookmarks ? (
                <>
                  {bookmarkedCount} {bookmarkedCount === 1 ? 'bookmark' : 'bookmarks'} saved
                </>
              ) : activeFilter ? (
                <>
                  {latest.length} {latest.length === 1 ? 'result' : 'results'} found
                  <button 
                    onClick={clearSearch}
                    className="ml-2 text-amber-400 hover:text-amber-300 underline"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                'Fresh threads from your campus and nearby schools.'
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Bookmark Toggle Button */}
            <button
              onClick={toggleBookmarks}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                showBookmarks
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <svg 
                className="w-4 h-4" 
                fill={showBookmarks ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
                />
              </svg>
              {showBookmarks ? 'All Questions' : 'My Bookmarks'}
            </button>
            
            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && !showBookmarks && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => changePage(currentPage - 1)}
                  disabled={!pagination.hasPrevPage || searching}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <span className="text-sm text-white/60">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => changePage(currentPage + 1)}
                  disabled={!pagination.hasNextPage || searching}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
        </div>
            )}
            
            {/* View All Modal Button */}
            <button
              onClick={() => setShowViewAllModal(true)}
              className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-white/85 hover:bg-white/10 transition-colors"
            >
              View All Questions
            </button>
          </div>
        </div>

        {searching ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-amber-400"></div>
              <p className="mt-3 text-white/60">Searching...</p>
            </div>
          </div>
        ) : (showBookmarks ? bookmarkedCount === 0 : latest.length === 0) ? (
          <div className="nr-panel text-center py-12">
            <p className="text-white/60">
              {activeFilter ? (
                <>
                  No questions found matching <span className="text-amber-400">"{activeFilter}"</span>
                  <br />
                  <button 
                    onClick={clearSearch}
                    className="mt-3 text-amber-400 hover:text-amber-300 underline"
                  >
                    Clear search and show all questions
                  </button>
                </>
              ) : (
                'No questions yet. Be the first to ask!'
              )}
            </p>
          </div>
        ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(showBookmarks ? latest.filter(q => bookmarkedIds.has(normId(q))) : latest).map((q) => {
            const threadId = normId(q);
            const isBookmarked = bookmarkedIds.has(threadId);
            const isBusy = !!bookmarkInFlight[threadId];
            
            return (
            <div key={threadId} className="relative">
              {/* Bookmark Button - Top Right Corner */}
              <button
                onClick={(e) => handleBookmark(threadId, e)}
                disabled={isBusy}
                className={`absolute top-3 right-3 p-2 rounded-lg transition-colors duration-200 disabled:opacity-50 z-10 ${
                  isBookmarked
                    ? 'bg-transparent text-red-500 ring-1 ring-red-500/25 hover:ring-red-500/35'
                    : 'bg-transparent text-red-500 hover:bg-red-500/5'
                }`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
              >
                <BookmarkSvg
                  active={isBookmarked}
                  className={`w-6 h-6 ${isBusy ? 'opacity-60' : ''}`}
                  style={{ filter: isBookmarked ? 'drop-shadow(0 0 3px rgba(239,68,68,.25))' : 'none' }}
                />
              </button>

              <a href={`/community/thread/${q._id || q.id}`} className="nr-panel hover:bg-white/[0.08] transition block">
                <div className="pr-12">
              <div className="mb-2 flex items-center gap-2 text-[12px]">
                <span className={`rounded-full px-2 py-0.5 ${q.solved ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/75"}`}>
                  {q.solved ? "Solved" : "Open"}
                </span>
                <span className="text-white/50">·</span>
                <span className="text-white/70">{q.school}</span>
              </div>
              <h4 className="text-[17px] font-semibold leading-snug">{q.title}</h4>
                <p className="mt-1 text-sm text-white/60">
                  Asked by {q.authorName || q.author}
                  <span className="mx-1.5">·</span>
                  {timeAgo(q.createdAt || q.updatedAt)}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-3">
                  {/* Voting Controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleVote(q._id || q.id, 'upvote', e)}
                        disabled={votingStates[`${q._id || q.id}_upvote`] || userVotes[q._id || q.id] === 'downvote'}
                        className={`p-1 rounded transition-colors group disabled:opacity-50 ${
                          userVotes[q._id || q.id] === 'upvote' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'hover:bg-white/10'
                        }`}
                        title={userVotes[q._id || q.id] === 'upvote' ? 'You upvoted this' : 'Upvote'}
                      >
                        <svg 
                          className={`w-4 h-4 transition-colors ${
                            userVotes[q._id || q.id] === 'upvote'
                              ? 'text-green-400'
                              : 'text-white/60 group-hover:text-green-400'
                          }`}
                          fill={userVotes[q._id || q.id] === 'upvote' ? 'currentColor' : 'none'}
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <span className="text-green-400 font-medium text-xs min-w-[1.5rem] text-center">
                        {q.upvotes || 0}
                      </span>
              </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleVote(q._id || q.id, 'downvote', e)}
                        disabled={votingStates[`${q._id || q.id}_downvote`] || userVotes[q._id || q.id] === 'upvote'}
                        className={`p-1 rounded transition-colors group disabled:opacity-50 ${
                          userVotes[q._id || q.id] === 'downvote' 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'hover:bg-white/10'
                        }`}
                        title={userVotes[q._id || q.id] === 'downvote' ? 'You downvoted this' : 'Downvote'}
                      >
                        <svg 
                          className={`w-4 h-4 transition-colors ${
                            userVotes[q._id || q.id] === 'downvote'
                              ? 'text-red-400'
                              : 'text-white/60 group-hover:text-red-400'
                          }`}
                          fill={userVotes[q._id || q.id] === 'downvote' ? 'currentColor' : 'none'}
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <span className="text-red-400 font-medium text-xs min-w-[1.5rem] text-center">
                        {q.downvotes || 0}
                      </span>
        </div>
                  </div>
                  
                  {/* Answers Count */}
                  <div className="flex items-center gap-1 text-white/60">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{q.answers?.length || 0} answers</span>
                  </div>
                </div>
              </div>
              </a>
            </div>
            );
          })}
        </div>
        )}
      </section>

      {/* ---------------- Guides / Newsletter ---------------- */}
      <section id="guides" className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-5 lg:grid-cols-12">
          <Panel className="lg:col-span-7">
            <div className="mb-3">
              <Pill>PLAYBOOKS</Pill>
            </div>
            <h3 className="text-xl font-semibold">Quick guides to save time & money</h3>
            <ul className="mt-3 grid gap-2 text-white/80 sm:grid-cols-2">
              <li className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <a 
                  href="/marketplace?category=furniture&maxPrice=300"
                  className="block"
                >
                Furnish a room under $300 → opens Marketplace: Furniture
                </a>
              </li>
              <li className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <a 
                  href="/marketplace?category=dorm-essentials"
                  className="block"
                >
                Move-in day toolkit → links to Dorm essentials
                </a>
              </li>
              <li className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <a 
                  href="/marketplace/sell"
                  className="block"
                >
                Sell everything in 48h → prefilled sell flow
                </a>
              </li>
              <li 
                onClick={() => {
                  setSearch('visa I-20');
                  handleTagClick('visa');
                }}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 cursor-pointer"
              >
                Visa docs checklist (I-20 / F-1) → community thread template
              </li>
            </ul>
          </Panel>

          <div className="lg:col-span-5">
            <PlaybookSpotlight
              university={universityBranding?.name || "Northern Illinois University"}
              playbooks={[
                {
                  id: "movein",
                  title: "Move-in week checklist",
                  description: "Complete your setup in 3 days with our proven step-by-step guide",
                  successRate: 89,
                  icon: MdChecklist,
                  href: "/playbooks/move-in"
                },
                {
                  id: "visa",
                  title: "Visa timeline tracker",
                  description: "Never miss a deadline with automated reminders and document checklists",
                  successRate: 94,
                  icon: MdTimeline,
                  href: "/playbooks/visa-timeline"
                }
              ]}
              onViewAll={() => navigate("/playbooks")}
            />
          </div>
        </div>
      </section>

      <Footer />

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="nr-panel max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold">Ask the Community</h2>
              <button 
                onClick={() => setShowAskModal(false)}
                className="text-white/60 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAskSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Question Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={askForm.title}
                  onChange={(e) => setAskForm({ ...askForm, title: e.target.value })}
                  placeholder="e.g., How do I apply for an I-20 at NIU?"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-amber-400"
                />
                <p className="mt-1 text-xs text-white/50">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Details (optional)
                </label>
                <textarea
                  value={askForm.body}
                  onChange={(e) => setAskForm({ ...askForm, body: e.target.value })}
                  placeholder="Add more context, what you've tried, specific requirements, etc."
                  rows={5}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Tags
                </label>
                
                {/* Selected Tags Chips */}
                {selectedTags.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-sm text-blue-300"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:bg-white/10 rounded-full p-0.5 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Tags */}
                {suggestedTags.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-white/60 mb-2">Suggested tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags
                        .filter(tag => !selectedTags.includes(tag))
                        .map((tag, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/20 text-sm text-white/70 hover:bg-white/10 hover:text-white/90 transition-colors"
                          >
                            + #{tag}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Add Custom Tag Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Add custom tag..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-amber-400"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTag(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-white/50">Press Enter to add custom tags</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  School
                </label>
                <input
                  type="text"
                  value={askForm.school}
                  onChange={(e) => setAskForm({ ...askForm, school: e.target.value })}
                  placeholder="e.g., NIU, UIC"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Posting...' : 'Post Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View All Modal */}
      <ViewAllModal
        isOpen={showViewAllModal}
        onClose={() => setShowViewAllModal(false)}
        universityFilter={universityFilter}
        userInfo={userInfo}
      />
    </div>
  );
}
