import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CommunityService from '../services/CommunityService';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import axiosInstance from '../utils/axiosInstance';
import { timeAgo } from '../utils/timeUtils';
import useBookmarks from '../hooks/useBookmarks';
import BookmarkSvg from '../components/BookmarkSvg.jsx';
import Toast from '../components/ToastMessage/Toast';

// Depth-capped comment system (Answer → Comment → Reply, max depth 2)
function CommentTree({ comments, thread, timeAgo, depth = 0, maxDepth = 2, onVote, onReply, showCommentForm, commentText, setCommentText, onDeleteComment, onDeleteReply, userInfo }) {
  if (depth >= maxDepth) {
    return (
      <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <p className="text-sm text-amber-300">
          💡 This discussion is getting deep! Consider starting a new thread for this topic.
        </p>
        <button className="mt-2 text-xs text-amber-400 hover:text-amber-300 underline">
          Continue in a new thread →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment, i) => {
        const isLast = i === comments.length - 1;
        const indentClass = depth === 0 ? 'ml-0' : depth === 1 ? 'ml-4' : 'ml-8';
        
        return (
          <div key={comment._id || comment.id || i} className={`${indentClass} relative`}>
            {/* Rail and elbow for depth > 0 */}
            {depth > 0 && (
              <div className="absolute -left-4 top-0 w-4 h-4 flex items-center justify-center">
                {!isLast && (
                  <span className="absolute left-[6px] top-0 bottom-0 w-px bg-white/12" aria-hidden />
                )}
                <span
                  className="absolute left-[6px] top-[12px] w-2 h-2 border-l border-b border-white/25 rounded-bl-sm"
                  aria-hidden
                />
              </div>
            )}

            {/* Comment card */}
            <div className="bg-white/[0.02] border border-white/8 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                {/* OP badge for any level */}
                {thread.authorId && comment.authorId &&
                  String(thread.authorId) === String(comment.authorId) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                      OP
                    </span>
                )}
                <span className="text-xs font-medium text-white/80">
                  {comment.authorName || comment.author}
                </span>
                <span className="text-xs text-white/50">·</span>
                <span className="text-xs text-white/50">{timeAgo(comment.createdAt)}</span>
                
                {/* Depth indicator */}
                {depth > 0 && (
                  <span className="text-xs text-white/40">
                    {depth === 1 ? 'Comment' : 'Reply'}
                  </span>
                )}
              </div>
              
              <div className="text-sm text-white/85 whitespace-pre-wrap mb-3">
                {comment.body}
              </div>

              {/* Actions based on depth */}
              <div className="flex items-center gap-3">
                {depth === 0 && (
                  <>
                    {/* Light upvote for comments only */}
                    <button 
                      onClick={() => onVote && onVote(comment._id || comment.id, 'upvote')}
                      className="flex items-center gap-1 text-xs text-white/60 hover:text-white/80 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      {comment.votesLight || 0}
                    </button>
                  </>
                )}
                
                {/* Reply button (only if not at max depth) */}
                {depth < maxDepth - 1 && (
                  <button 
                    onClick={() => onReply && onReply(comment._id || comment.id)}
                    className="text-xs text-white/60 hover:text-white/80 transition-colors"
                  >
                    Reply
                  </button>
                )}
                
                {/* Delete button - only show to comment author */}
                {(() => {
                  const isAuthor = userInfo && comment.authorId && String(comment.authorId) === String(userInfo._id || userInfo.userId);
                  console.log('🔍 Comment delete button check:', {
                    userInfo: userInfo ? { _id: userInfo._id, userId: userInfo.userId } : null,
                    commentAuthorId: comment.authorId,
                    isAuthor,
                    commentId: comment._id || comment.id
                  });
                  return isAuthor;
                })() && (
                  <button 
                    onClick={() => onDeleteComment && onDeleteComment(comment._id || comment.id)}
                    className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-500/10"
                    title="Delete this comment"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                
                {/* Report button */}
                <button className="text-xs text-white/40 hover:text-white/60 transition-colors">
                  Report
                </button>
              </div>

              {/* Reply form for this comment */}
              {showCommentForm && showCommentForm[comment._id || comment.id] && (
                <div className="mt-3 p-3 bg-white/[0.02] border border-white/10 rounded-lg">
                  <textarea
                    value={commentText[comment._id || comment.id] || ''}
                    onChange={(e) => setCommentText(prev => ({ ...prev, [comment._id || comment.id]: e.target.value }))}
                    placeholder="Write a reply..."
                    rows={2}
                    className="w-full bg-white/[0.03] border border-white/10 rounded px-2 py-1 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-400 resize-none"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => onReply && onReply(comment._id || comment.id)}
                      className="px-2 py-1 text-xs text-white/60 hover:text-white/90 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => onReply && onReply(comment._id || comment.id, 'submit')}
                      disabled={!commentText[comment._id || comment.id]?.trim()}
                      className="px-2 py-1 text-xs bg-amber-500/20 text-amber-300 rounded hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Post Reply
                    </button>
                  </div>
                </div>
              )}

              {/* Nested comments (recursive) */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3">
                  <CommentTree 
                    comments={comment.replies} 
                    thread={thread} 
                    timeAgo={timeAgo} 
                    depth={depth + 1}
                    maxDepth={maxDepth}
                    onVote={onVote}
                    onReply={onReply}
                    showCommentForm={showCommentForm}
                    commentText={commentText}
                    setCommentText={setCommentText}
                    onDeleteComment={onDeleteComment}
                    onDeleteReply={onDeleteReply}
                    userInfo={userInfo}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import '../styles/newrun-hero.css';

export default function Thread() {
  const { id } = useParams();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [voting, setVoting] = useState(false);
  const [userVotes, setUserVotes] = useState({});
  const [answerVotes, setAnswerVotes] = useState({});
  // Use shared bookmark hook
  const { bookmarkedIds, bookmarkInFlight, toggleBookmark } = useBookmarks(userInfo);
  const [showReplyForm, setShowReplyForm] = useState({});
  const [replyText, setReplyText] = useState({});
  const [showCommentForm, setShowCommentForm] = useState({});
  const [commentText, setCommentText] = useState({});
  const [commentVotes, setCommentVotes] = useState({});
  const [relatedQuestions, setRelatedQuestions] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  // Toast state
  const [showToastMsg, setShowToastMsg] = useState({
    isShown: false,
    type: 'success',
    message: '',
  });

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState({
    isShown: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  // Load user info first
  useEffect(() => {
    (async () => {
      try {
        const r = await axiosInstance.get("/get-user");
        if (r?.data?.user) {
          setUserInfo(r.data.user);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    })();
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showConfirmModal.isShown) {
        handleCancel();
      }
    };

    if (showConfirmModal.isShown) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showConfirmModal.isShown]);

  useEffect(() => {
    async function fetchThread() {
      setLoading(true);
      try {
        const data = await CommunityService.get(id);
        // Normalize canonical ID for consistent bookmark state management
        const canonicalId = String(data._id || data.id || id);
        setThread({ ...data, _canonicalId: canonicalId });
        
        // Load vote status for this thread
        const hasUser = !!(userInfo?._id || userInfo?.userId);
        if (hasUser) {
          const voteStatus = await CommunityService.checkVoteStatus(id);
          if (voteStatus.userVote) {
            setUserVotes(prev => ({ ...prev, [canonicalId]: voteStatus.userVote }));
          }
        }
        
        // Fetch related questions (always load, regardless of user login status)
        fetchRelatedQuestions(data);
      } catch (error) {
        console.error('Error fetching thread:', error);
        setThread(null);
      } finally {
        setLoading(false);
      }
    }
    fetchThread();
  }, [id, userInfo?._id, userInfo?.userId]);

  // Fallback: Load mock data immediately if no thread data
  useEffect(() => {
    if (!thread && !loading) {
      // Load mock data as fallback
      const mockData = {
        school: "Northern Illinois University"
      };
      fetchRelatedQuestions(mockData);
    }
  }, [thread, loading]);

  const fetchRelatedQuestions = async (currentThread) => {
    setLoadingRelated(true);
    try {
      // Mock data for now - replace with actual API call later
      const mockRelatedQuestions = [
        {
          _id: "mock1",
          title: "How to apply for OPT after graduation?",
          answers: [{}, {}, {}], // 3 answers
          upvotes: 15,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          solved: true,
          school: "Northern Illinois University"
        },
        {
          _id: "mock2", 
          title: "Best places to find housing near campus",
          answers: [{}, {}], // 2 answers
          upvotes: 8,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          solved: false,
          school: "Northern Illinois University"
        },
        {
          _id: "mock3",
          title: "Visa renewal process timeline and documents needed",
          answers: [{}, {}, {}, {}], // 4 answers
          upvotes: 22,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          solved: true,
          school: "Northern Illinois University"
        },
        {
          _id: "mock4",
          title: "How to get a social security number as international student?",
          answers: [{}], // 1 answer
          upvotes: 5,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          solved: false,
          school: "Northern Illinois University"
        },
        {
          _id: "mock5",
          title: "Part-time job opportunities on campus",
          answers: [{}, {}, {}], // 3 answers
          upvotes: 12,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          solved: true,
          school: "Northern Illinois University"
        }
      ];
      
      // Simulate API delay (reduced for testing)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('Setting mock related questions:', mockRelatedQuestions);
      setRelatedQuestions(mockRelatedQuestions);
    } catch (error) {
      console.error('Error fetching related questions:', error);
      setRelatedQuestions([]);
    } finally {
      setLoadingRelated(false);
    }
  };


  const submit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;
    const tid = thread._canonicalId || String(thread._id || thread.id);
    await CommunityService.addAnswer(tid, { 
      body: answer.trim(),
      author: userInfo?.username || '@anonymous'
    });
    setAnswer('');
    // Re-fetch the thread to get the updated answers
    const updated = await CommunityService.get(id);
    setThread({ ...updated, _canonicalId: tid });
  };

  const handleVote = async (type) => {
    if (voting) return;
    
    const tid = thread._canonicalId || String(thread._id || thread.id);
    
    // Check if user already voted on this thread
    const currentUserVote = userVotes[tid];
    if (currentUserVote === type) {
      alert('You have already voted on this question!');
      return;
    }
    
    setVoting(true);
    try {
      const result = await CommunityService.voteThread(tid, type);
      if (result) {
        // Update user vote state
        setUserVotes(prev => ({ ...prev, [tid]: type }));
        
        // Update thread with new vote counts
        setThread(prev => ({
          ...prev,
          upvotes: result.upvotes || 0,
          downvotes: result.downvotes || 0,
          votes: result.votes || 0
        }));
      }
    } catch (error) {
      console.error('Vote error:', error);
      if (error.response?.status === 400) {
        alert(error.response.data.message || 'You have already voted on this question!');
      }
    } finally {
      setVoting(false);
    }
  };

  const handleAnswerVote = async (answerId, type) => {
    try {
      const tid = thread._canonicalId || String(thread._id || thread.id);
      const result = await CommunityService.voteAnswer(tid, answerId, type);
      if (result) {
        // Update answer vote state
        setAnswerVotes(prev => ({ ...prev, [answerId]: type }));
        
        // Update thread with new answer vote counts
        setThread(prev => ({
          ...prev,
          answers: prev.answers.map(a => 
            (a._id || a.id) === answerId 
              ? { 
                  ...a, 
                  upvotes: result.upvotes || 0, 
                  downvotes: result.downvotes || 0, 
                  votes: result.votes || 0,
                  isBestAnswer: result.isBestAnswer || false
                }
              : a
          )
        }));
      }
    } catch (error) {
      console.error('Answer vote error:', error);
      if (error.response?.status === 400) {
        alert(error.response.data.message || 'You have already voted on this answer!');
      }
    }
  };

  const handleReply = async (answerId) => {
    const replyBody = replyText[answerId];
    if (!replyBody || !replyBody.trim()) return;
    
    // Check if user is logged in
    if (!userInfo) {
      alert('Please log in to post a reply.');
      return;
    }
    
    // Check authentication token
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('userToken');
    if (!token) {
      alert('Authentication token not found. Please log in again.');
      return;
    }
    
    console.log('🔑 Auth token found:', token.substring(0, 20) + '...');
    
    try {
      const tid = thread._canonicalId || String(thread._id || thread.id);
      console.log('🔄 Posting reply:', { tid, answerId, replyBody: replyBody.substring(0, 50) + '...' });
      
      const result = await CommunityService.addReply(tid, answerId, replyBody);
      console.log('✅ Reply result:', result);
      
      if (result.success) {
        // Clear reply text and hide form
        setReplyText(prev => ({ ...prev, [answerId]: '' }));
        setShowReplyForm(prev => ({ ...prev, [answerId]: false }));
        
        // Refresh thread to get updated replies
        const updated = await CommunityService.get(id);
        setThread({ ...updated, _canonicalId: tid });
      } else {
        console.error('❌ Reply failed - no success:', result);
        alert('Failed to post reply. Please try again.');
      }
    } catch (error) {
      console.error('❌ Reply error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      if (error.response?.status === 401) {
        alert('Please log in to post a reply.');
      } else if (error.response?.status === 400) {
        alert(error.response.data.message || 'Invalid request. Please try again.');
      } else {
        alert('Failed to post reply. Please try again.');
      }
    }
  };

  const toggleReplyForm = (answerId) => {
    setShowReplyForm(prev => ({ ...prev, [answerId]: !prev[answerId] }));
  };

  const toggleCommentForm = (commentId) => {
    setShowCommentForm(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleCommentVote = async (commentId, type) => {
    try {
      const tid = thread._canonicalId || String(thread._id || thread.id);
      const result = await CommunityService.voteComment(tid, commentId, type);
      if (result) {
        setCommentVotes(prev => ({ ...prev, [commentId]: type }));
      }
    } catch (error) {
      console.error('Comment vote error:', error);
      // For now, just update the UI optimistically
      setCommentVotes(prev => ({ ...prev, [commentId]: type }));
    }
  };

  const handleCommentSubmit = async (commentId, action = 'toggle') => {
    if (action === 'toggle') {
      toggleCommentForm(commentId);
      return;
    }
    
    if (action === 'submit') {
      const text = commentText[commentId];
      if (!text?.trim()) return;
      
      // Check if user is logged in
      if (!userInfo) {
        alert('Please log in to post a reply.');
        return;
      }
      
      try {
        const tid = thread._canonicalId || String(thread._id || thread.id);
        console.log('🔄 Posting comment reply:', { tid, commentId, text: text.substring(0, 50) + '...' });
        
        // ✅ Use the dedicated endpoint for comment replies
        const result = await CommunityService.replyToComment(tid, commentId, text.trim());
        
        if (result.success) {
          setCommentText(prev => ({ ...prev, [commentId]: '' }));
          setShowCommentForm(prev => ({ ...prev, [commentId]: false }));
          
          // Refresh thread to get updated comments
          const updated = await CommunityService.get(id);
          setThread({ ...updated, _canonicalId: tid });
        } else {
          alert(result.message || 'Failed to post reply. Please try again.');
        }
      } catch (error) {
        console.error('❌ Comment submit error:', error);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        
        if (error.response?.status === 401) {
          alert('Please log in to post a reply.');
        } else if (error.response?.status === 400) {
          alert(error.response.data.message || 'Invalid request. Please try again.');
        } else {
          alert('Failed to post reply. Please try again.');
        }
      }
    }
  };

  const handleBookmark = toggleBookmark;

  // Toast functions
  const showToastMessage = (message, type = 'success') => {
    setShowToastMsg({
      isShown: true,
      message: message,
      type: type,
    });
  };

  const handleCloseToast = () => {
    setShowToastMsg({
      isShown: false,
      message: '',
    });
  };

  // Confirmation modal functions
  const showConfirmDialog = (title, message, onConfirm) => {
    setShowConfirmModal({
      isShown: true,
      title,
      message,
      onConfirm,
    });
  };

  const handleConfirm = () => {
    if (showConfirmModal.onConfirm) {
      showConfirmModal.onConfirm();
    }
    setShowConfirmModal({
      isShown: false,
      title: '',
      message: '',
      onConfirm: null,
    });
  };

  const handleCancel = () => {
    setShowConfirmModal({
      isShown: false,
      title: '',
      message: '',
      onConfirm: null,
    });
  };

  // Delete handlers
  const handleDeleteAnswer = async (answerId) => {
    showConfirmDialog(
      'Delete Answer',
      'Are you sure you want to delete this answer? This action cannot be undone.',
      async () => {
        try {
          const tid = thread._canonicalId || String(thread._id || thread.id);
          const result = await CommunityService.deleteAnswer(tid, answerId);
          
          if (result.success) {
            // Refresh thread to get updated answers
            const updated = await CommunityService.get(id);
            setThread({ ...updated, _canonicalId: tid });
            showToastMessage('Answer deleted successfully', 'delete');
          } else {
            showToastMessage('Failed to delete answer. Please try again.', 'delete');
          }
        } catch (error) {
          console.error('Delete answer error:', error);
          if (error.response?.status === 403) {
            showToastMessage('You can only delete your own answers.', 'delete');
          } else {
            showToastMessage('Failed to delete answer. Please try again.', 'delete');
          }
        }
      }
    );
  };

  const handleDeleteComment = async (commentId) => {
    showConfirmDialog(
      'Delete Comment',
      'Are you sure you want to delete this comment? This action cannot be undone.',
      async () => {
        try {
          const tid = thread._canonicalId || String(thread._id || thread.id);
          const result = await CommunityService.deleteComment(tid, commentId);
          
          if (result.success) {
            // Refresh thread to get updated comments
            const updated = await CommunityService.get(id);
            setThread({ ...updated, _canonicalId: tid });
            showToastMessage('Comment deleted successfully', 'delete');
          } else {
            showToastMessage('Failed to delete comment. Please try again.', 'delete');
          }
        } catch (error) {
          console.error('Delete comment error:', error);
          if (error.response?.status === 403) {
            showToastMessage('You can only delete your own comments.', 'delete');
          } else {
            showToastMessage('Failed to delete comment. Please try again.', 'delete');
          }
        }
      }
    );
  };

  const handleDeleteReply = async (commentId, replyId) => {
    showConfirmDialog(
      'Delete Reply',
      'Are you sure you want to delete this reply? This action cannot be undone.',
      async () => {
        try {
          const tid = thread._canonicalId || String(thread._id || thread.id);
          const result = await CommunityService.deleteReply(tid, commentId, replyId);
          
          if (result.success) {
            // Refresh thread to get updated replies
            const updated = await CommunityService.get(id);
            setThread({ ...updated, _canonicalId: tid });
            showToastMessage('Reply deleted successfully', 'delete');
          } else {
            showToastMessage('Failed to delete reply. Please try again.', 'delete');
          }
        } catch (error) {
          console.error('Delete reply error:', error);
          if (error.response?.status === 403) {
            showToastMessage('You can only delete your own replies.', 'delete');
          } else {
            showToastMessage('Failed to delete reply. Please try again.', 'delete');
          }
        }
      }
    );
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      const tid = thread._canonicalId || String(thread._id || thread.id);
      const success = await CommunityService.acceptAnswer(tid, answerId);
      if (success) {
        const updated = await CommunityService.get(id);
        setThread({ ...updated, _canonicalId: tid });
      }
    } catch (error) {
      console.error('Accept answer error:', error);
    }
  };

  if (loading) {
    return (
      <div className="nr-dots-page min-h-screen text-white">
        <Navbar userInfo={userInfo} />
        <div className="mx-auto max-w-4xl px-4 py-12">
          <p className="text-white/70">Loading thread...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="nr-dots-page min-h-screen text-white">
        <Navbar userInfo={userInfo} />
        <div className="mx-auto max-w-4xl px-4 py-12">
          <p className="text-white/70">Thread not found. <Link to="/community" className="text-sky-400 hover:underline">Back to community</Link></p>
        </div>
        <Footer />
      </div>
    );
  }

  const isAuthor = userInfo?.username === thread.author || userInfo?.username === thread.authorName;

  return (
    <div className="nr-dots-page min-h-screen text-white">
      <Navbar userInfo={userInfo} />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Main Thread (8 columns) */}
          <div className="lg:col-span-8">
            {/* Back link */}
            <Link to="/community" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white mb-6">
              <span>←</span> Back to Community
            </Link>

        {/* Question Card */}
        <div className="relative">
          {/* Bookmark Button - Top Right */}
          {(() => {
            const tid = thread._canonicalId || String(thread._id || thread.id);
            return (
              <button
                type="button"
                onClick={(e) => handleBookmark(tid, e)}
                disabled={bookmarkInFlight[tid]}
                className={`absolute top-3 right-3 p-2 rounded-lg transition-all duration-200 z-10
                  ${bookmarkedIds.has(tid) ? "text-red-500" : "text-red-500 hover:bg-red-500/5"}
                  ${bookmarkInFlight[tid] ? "cursor-wait" : "cursor-pointer"}`}
                aria-pressed={bookmarkedIds.has(tid)}
                aria-label={bookmarkedIds.has(tid) ? "Remove bookmark" : "Bookmark question"}
              >
                <BookmarkSvg active={bookmarkedIds.has(tid)} className="w-6 h-6" />
              </button>
            );
          })()}

          <div className="nr-panel">

          {/* Status badges */}
          <div className="mb-4 flex items-center gap-2 text-[12px]">
            <span className={`rounded-full px-2.5 py-1 ${thread.solved ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/75"}`}>
              {thread.solved ? '✓ Solved' : 'Open'}
            </span>
            <span className="text-white/50">·</span>
            <span className="text-white/70">{thread.school}</span>
            <span className="text-white/50">·</span>
            <span className="text-white/60">{timeAgo(thread.createdAt || thread.updatedAt)}</span>
          </div>

          <h1 className="text-3xl font-bold leading-tight pr-16">{thread.title}</h1>

          {thread.body && (
            <p className="mt-4 text-[15px] leading-relaxed text-white/80 whitespace-pre-wrap">{thread.body}</p>
          )}

          {/* Tags */}
          {(thread.tags || []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {thread.tags.map(t => (
                <span key={t} className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/70">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Author & Voting */}
          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
            <div className="text-sm text-white/60">
              Asked by <span className="font-medium text-white/90">{thread.authorName || thread.author}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleVote('upvote')}
                  disabled={voting || userVotes[thread._canonicalId || String(thread._id || thread.id)] === 'downvote'}
                  className={`p-2 rounded-lg transition-colors group disabled:opacity-50 ${
                    userVotes[thread._canonicalId || String(thread._id || thread.id)] === 'upvote' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'hover:bg-white/10'
                  }`}
                  title={userVotes[thread._canonicalId || String(thread._id || thread.id)] === 'upvote' ? 'You upvoted this' : 'Upvote'}
                >
                  <svg 
                    className={`w-4 h-4 transition-colors ${
                      userVotes[thread._canonicalId || String(thread._id || thread.id)] === 'upvote'
                        ? 'text-green-400'
                        : 'text-white/60 group-hover:text-green-400'
                    }`}
                    fill={userVotes[thread._canonicalId || String(thread._id || thread.id)] === 'upvote' ? 'currentColor' : 'none'}
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <span className="text-green-400 font-medium text-sm min-w-[1.5rem] text-center">
                  {thread.upvotes || 0}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleVote('downvote')}
                  disabled={voting || userVotes[thread._canonicalId || String(thread._id || thread.id)] === 'upvote'}
                  className={`p-2 rounded-lg transition-colors group disabled:opacity-50 ${
                    userVotes[thread._canonicalId || String(thread._id || thread.id)] === 'downvote' 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'hover:bg-white/10'
                  }`}
                  title={userVotes[thread._canonicalId || String(thread._id || thread.id)] === 'downvote' ? 'You downvoted this' : 'Downvote'}
                >
                  <svg 
                    className={`w-4 h-4 transition-colors ${
                      userVotes[thread._canonicalId || String(thread._id || thread.id)] === 'downvote'
                        ? 'text-red-400'
                        : 'text-white/60 group-hover:text-red-400'
                    }`}
                    fill={userVotes[thread._canonicalId || String(thread._id || thread.id)] === 'downvote' ? 'currentColor' : 'none'}
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <span className="text-red-400 font-medium text-sm min-w-[1.5rem] text-center">
                  {thread.downvotes || 0}
                </span>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Answers Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold mb-5">
            {(thread.answers || []).length} {(thread.answers || []).length === 1 ? 'Answer' : 'Answers'}
          </h2>

          <div className="space-y-4">
            {(!thread.answers || thread.answers.length === 0) && (
              <div className="nr-panel text-center py-12">
                <p className="text-white/60">No answers yet. Be the first to help!</p>
              </div>
            )}

            {(thread.answers || []).map(a => (
              <article key={a._id || a.id} className={`nr-panel ${a.accepted ? 'border-emerald-500/30 bg-emerald-500/5' : ''} ${a.isBestAnswer ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
                {/* Answer Header with Badges */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {a.accepted && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                      <span>✓</span> Accepted Answer
                    </div>
                  )}
                  {a.isBestAnswer && !a.accepted && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-300">
                      <span>⭐</span> Best Answer
                    </div>
                  )}
                  {/* Check if this answer is from the original poster */}
                  {thread.authorId && a.authorId && thread.authorId.toString() === a.authorId.toString() && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1 text-[11px] font-semibold text-blue-300">
                      <span>OP</span> Original Poster
                    </div>
                  )}
                </div>

                <div className="text-[15px] leading-relaxed text-white/85 whitespace-pre-wrap">{a.body}</div>

                {/* Answer Voting and Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="flex items-center gap-4">
                    {/* Answer Voting */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAnswerVote(a._id || a.id, 'upvote')}
                          disabled={answerVotes[a._id || a.id] === 'downvote'}
                          className={`p-1.5 rounded transition-colors group disabled:opacity-50 ${
                            answerVotes[a._id || a.id] === 'upvote' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'hover:bg-white/10'
                          }`}
                          title={answerVotes[a._id || a.id] === 'upvote' ? 'You upvoted this' : 'Upvote'}
                        >
                          <svg 
                            className={`w-3.5 h-3.5 transition-colors ${
                              answerVotes[a._id || a.id] === 'upvote'
                                ? 'text-green-400'
                                : 'text-white/60 group-hover:text-green-400'
                            }`}
                            fill={answerVotes[a._id || a.id] === 'upvote' ? 'currentColor' : 'none'}
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <span className="text-green-400 font-medium text-xs min-w-[1rem] text-center">
                          {a.upvotes || 0}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAnswerVote(a._id || a.id, 'downvote')}
                          disabled={answerVotes[a._id || a.id] === 'upvote'}
                          className={`p-1.5 rounded transition-colors group disabled:opacity-50 ${
                            answerVotes[a._id || a.id] === 'downvote' 
                              ? 'bg-red-500/20 text-red-400' 
                              : 'hover:bg-white/10'
                          }`}
                          title={answerVotes[a._id || a.id] === 'downvote' ? 'You downvoted this' : 'Downvote'}
                        >
                          <svg 
                            className={`w-3.5 h-3.5 transition-colors ${
                              answerVotes[a._id || a.id] === 'downvote'
                                ? 'text-red-400'
                                : 'text-white/60 group-hover:text-red-400'
                            }`}
                            fill={answerVotes[a._id || a.id] === 'downvote' ? 'currentColor' : 'none'}
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <span className="text-red-400 font-medium text-xs min-w-[1rem] text-center">
                          {a.downvotes || 0}
                        </span>
                      </div>
                    </div>

                    {/* Comment Button */}
                    <button
                      onClick={() => toggleReplyForm(a._id || a.id)}
                      className="flex items-center gap-1 text-xs text-white/60 hover:text-white/90 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Comment
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-white/50">
                      <span className="font-medium text-white/80">{a.authorName || a.author}</span>
                      <span className="mx-1.5">·</span>
                      <span>{timeAgo(a.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAuthor && !a.accepted && !thread.solved && (
                        <button
                          onClick={() => handleAcceptAnswer(a._id || a.id)}
                          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                        >
                          Accept Answer
                        </button>
                      )}
                      
                      {/* Delete button - only show to answer author */}
                      {userInfo && a.authorId && String(a.authorId) === String(userInfo._id || userInfo.userId) && (
                        <button
                          onClick={() => handleDeleteAnswer(a._id || a.id)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20 transition-colors"
                          title="Delete this answer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comment Form */}
                {showReplyForm[a._id || a.id] && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="mb-2">
                      <label className="text-xs text-white/60">Add a comment to this answer</label>
                    </div>
                    <textarea
                      value={replyText[a._id || a.id] || ''}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [a._id || a.id]: e.target.value }))}
                      placeholder="Share your thoughts, ask for clarification, or add context..."
                      rows={3}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-400 resize-none"
                    />
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-xs text-white/50">
                        💡 Comments help clarify and improve answers
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleReplyForm(a._id || a.id)}
                          className="px-3 py-1 text-xs text-white/60 hover:text-white/90 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReply(a._id || a.id)}
                          disabled={!replyText[a._id || a.id]?.trim()}
                          className="px-3 py-1 text-xs bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Post Comment
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments Display */}
                {a.replies && a.replies.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-medium text-white/80">
                        Comments ({a.replies.length})
                      </h4>
                      <button className="text-xs text-white/60 hover:text-white/80 transition-colors">
                        Collapse
                      </button>
                    </div>
                    <CommentTree 
                      comments={a.replies} 
                      thread={thread} 
                      timeAgo={timeAgo} 
                      depth={0}
                      maxDepth={2}
                      onVote={handleCommentVote}
                      onReply={handleCommentSubmit}
                      showCommentForm={showCommentForm}
                      commentText={commentText}
                      setCommentText={setCommentText}
                      onDeleteComment={handleDeleteComment}
                      onDeleteReply={handleDeleteReply}
                      userInfo={userInfo}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Answer Form */}
        <section className="mt-8">
          <h3 className="text-xl font-bold mb-4">Your Answer</h3>
          <form onSubmit={submit} className="nr-panel">
            <textarea
              value={answer}
              onChange={(e)=>setAnswer(e.target.value)}
              placeholder="Write a helpful answer... Be clear and specific."
              rows={6}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-white/40 outline-none focus:border-amber-400 resize-none"
            />
            <div className="mt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={!answer.trim()}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post Answer
              </button>
            </div>
          </form>
        </section>
          </div>

          {/* Right Column - Related Questions (4 columns) */}
          <div className="lg:col-span-4">
            <div className="sticky top-8">
              {/* Fading divider line */}
              <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
              
              <div className="pl-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">RELATED QUESTIONS</h3>
                  <button className="text-xs text-white/60 hover:text-white transition-colors">
                    Clear
                  </button>
                </div>
                
                {loadingRelated ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-white/10 rounded-full flex-shrink-0"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-white/10 rounded mb-2"></div>
                            <div className="h-2 bg-white/5 rounded w-1/2 mb-1"></div>
                            <div className="h-2 bg-white/5 rounded w-1/3"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : relatedQuestions.length > 0 ? (
                  <div className="space-y-0">
                    {relatedQuestions.map((question, index) => (
                      <div key={question._id || question.id}>
                        <Link
                          to={`/community/thread/${question._id || question.id}`}
                          className="block group py-4"
                        >
                          <div className="flex items-start gap-3">
                            {/* University/Community indicator */}
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">
                                {question.school?.charAt(0) || 'N'}
                              </span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* University and time */}
                              <div className="flex items-center gap-1 text-xs text-white/60 mb-1">
                                <span>{question.school || 'Northern Illinois University'}</span>
                                <span>·</span>
                                <span>{timeAgo(question.createdAt || question.updatedAt)}</span>
                              </div>
                              
                              {/* Question title */}
                              <h4 className="text-sm font-medium text-white group-hover:text-blue-300 line-clamp-2 mb-2 transition-colors">
                                {question.title}
                              </h4>
                              
                              {/* Engagement metrics */}
                              <div className="flex items-center gap-3 text-xs text-white/50">
                                <span>{question.upvotes || Math.floor(Math.random() * 20) + 1} upvotes</span>
                                <span>·</span>
                                <span>{question.answers?.length || 0} comments</span>
                                {question.solved && (
                                  <>
                                    <span>·</span>
                                    <span className="inline-flex items-center gap-1 text-emerald-400">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                      Solved
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                        
                        {/* Horizontal fading line between questions (except for the last one) */}
                        {index < relatedQuestions.length - 1 && (
                          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                        )}
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t border-white/10">
                      <Link
                        to="/community"
                        className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
                      >
                        View all questions →
                      </Link>
                    </div>
                    
                    {/* Footer section */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                      <div className="space-y-3 text-xs text-white/50">
                        <div className="flex flex-wrap gap-3">
                          <Link to="/community/rules" className="hover:text-white/70 transition-colors">
                            Community Rules
                          </Link>
                          <Link to="/privacy" className="hover:text-white/70 transition-colors">
                            Privacy Policy
                          </Link>
                          <Link to="/terms" className="hover:text-white/70 transition-colors">
                            User Agreement
                          </Link>
                        </div>
                        <div className="space-y-1">
                          <Link to="/accessibility" className="hover:text-white/70 transition-colors">
                            Accessibility
                          </Link>
                          <div className="text-white/40">
                            NewRun, Inc. © 2025. All rights reserved.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-white/60 text-sm">No related questions found</p>
                    <Link
                      to="/community"
                      className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mt-3"
                    >
                      Browse all questions →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Toast Notification */}
      <Toast
        isShown={showToastMsg.isShown}
        message={showToastMsg.message}
        type={showToastMsg.type}
        onClose={handleCloseToast}
      />

      {/* Redesigned Delete Modal */}
      {showConfirmModal.isShown && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50"
          onClick={handleCancel}
        >
          <div 
            className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-2xl border border-gray-700/50 rounded-2xl p-5 max-w-xs mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  {showConfirmModal.title}
                </h3>
                <p className="text-gray-400 text-xs">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            {/* Message */}
            <p className="text-gray-300 text-sm mb-5 leading-relaxed">
              {showConfirmModal.message}
            </p>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-sm rounded-lg border border-gray-600/50 transition-all duration-200 hover:border-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm rounded-lg border border-red-500/50 transition-all duration-200 hover:border-red-400"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


