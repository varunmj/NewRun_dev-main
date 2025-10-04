import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CommunityService from '../services/CommunityService';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import axiosInstance from '../utils/axiosInstance';
import { timeAgo } from '../utils/timeUtils';
import BookmarkIcon from '../assets/icons/bookmark.svg';
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
  const [bookmarkStates, setBookmarkStates] = useState({});
  const [showReplyForm, setShowReplyForm] = useState({});
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    async function fetchThread() {
      setLoading(true);
      try {
        const data = await CommunityService.get(id);
        setThread(data);
        
        // Load vote status for this thread
        if (userInfo?.userId) {
          const voteStatus = await CommunityService.checkVoteStatus(id);
          if (voteStatus.userVote) {
            setUserVotes(prev => ({ ...prev, [id]: voteStatus.userVote }));
          }
          
          // Load bookmark status for this thread
          const bookmarkStatus = await CommunityService.checkBookmarkStatus(id);
          setBookmarkStates(prev => ({ 
            ...prev, 
            [`${id}_isBookmarked`]: bookmarkStatus.isBookmarked 
          }));
        }
      } catch (error) {
        console.error('Error fetching thread:', error);
        setThread(null);
      } finally {
        setLoading(false);
      }
    }
    fetchThread();
  }, [id, userInfo?.userId]);

  useEffect(() => {
    (async () => {
      try {
        const r = await axiosInstance.get("/get-user");
        if (r?.data?.user) setUserInfo(r.data.user);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;
    await CommunityService.addAnswer(thread._id || thread.id, { 
      body: answer.trim(),
      author: userInfo?.username || '@anonymous'
    });
    setAnswer('');
    // Re-fetch the thread to get the updated answers
    const updated = await CommunityService.get(id);
    setThread(updated);
  };

  const handleVote = async (type) => {
    if (voting) return;
    
    // Check if user already voted on this thread
    const currentUserVote = userVotes[thread._id || thread.id];
    if (currentUserVote === type) {
      alert('You have already voted on this question!');
      return;
    }
    
    setVoting(true);
    try {
      const result = await CommunityService.voteThread(thread._id || thread.id, type);
      if (result) {
        // Update user vote state
        setUserVotes(prev => ({ ...prev, [thread._id || thread.id]: type }));
        
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
      const result = await CommunityService.voteAnswer(thread._id || thread.id, answerId, type);
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
    
    try {
      const result = await CommunityService.addReply(thread._id || thread.id, answerId, replyBody);
      if (result.success) {
        // Clear reply text and hide form
        setReplyText(prev => ({ ...prev, [answerId]: '' }));
        setShowReplyForm(prev => ({ ...prev, [answerId]: false }));
        
        // Refresh thread to get updated replies
        const updated = await CommunityService.get(id);
        setThread(updated);
      }
    } catch (error) {
      console.error('Reply error:', error);
    }
  };

  const toggleReplyForm = (answerId) => {
    setShowReplyForm(prev => ({ ...prev, [answerId]: !prev[answerId] }));
  };

  const handleBookmark = async (threadId) => {
    try {
      setBookmarkStates(prev => ({ ...prev, [`${threadId}_bookmark`]: true }));
      
      const isBookmarked = bookmarkStates[`${threadId}_isBookmarked`];
      
      if (isBookmarked) {
        await CommunityService.removeBookmark(threadId);
        setBookmarkStates(prev => ({ 
          ...prev, 
          [`${threadId}_isBookmarked`]: false,
          [`${threadId}_bookmark`]: false
        }));
      } else {
        await CommunityService.bookmarkThread(threadId);
        setBookmarkStates(prev => ({ 
          ...prev, 
          [`${threadId}_isBookmarked`]: true,
          [`${threadId}_bookmark`]: false
        }));
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      setBookmarkStates(prev => ({ ...prev, [`${threadId}_bookmark`]: false }));
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      const success = await CommunityService.acceptAnswer(thread._id || thread.id, answerId);
      if (success) {
        const updated = await CommunityService.get(id);
        setThread(updated);
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
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Back link */}
        <Link to="/community" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white mb-6">
          <span>←</span> Back to Community
        </Link>

        {/* Question Card */}
        <div className="relative">
          {/* Bookmark Button - Top Right */}
          <button
            onClick={() => handleBookmark(thread._id || thread.id)}
            disabled={bookmarkStates[`${thread._id || thread.id}_bookmark`]}
            className={`absolute top-3 right-3 p-2 rounded-lg transition-all duration-300 disabled:opacity-50 z-10 ${
              bookmarkStates[`${thread._id || thread.id}_isBookmarked`]
                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 scale-110'
                : 'bg-transparent text-red-500 hover:bg-red-500/10 hover:scale-105'
            }`}
            title={bookmarkStates[`${thread._id || thread.id}_isBookmarked`] ? 'Remove bookmark' : 'Bookmark question'}
          >
            <img 
              src={BookmarkIcon} 
              alt="Bookmark" 
              className="w-6 h-6 transition-all duration-300"
              style={{ 
                filter: bookmarkStates[`${thread._id || thread.id}_isBookmarked`] 
                  ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' 
                  : 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.3))'
              }}
            />
          </button>

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
                  disabled={voting || userVotes[thread._id || thread.id] === 'downvote'}
                  className={`p-2 rounded-lg transition-colors group disabled:opacity-50 ${
                    userVotes[thread._id || thread.id] === 'upvote' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'hover:bg-white/10'
                  }`}
                  title={userVotes[thread._id || thread.id] === 'upvote' ? 'You upvoted this' : 'Upvote'}
                >
                  <svg 
                    className={`w-4 h-4 transition-colors ${
                      userVotes[thread._id || thread.id] === 'upvote'
                        ? 'text-green-400'
                        : 'text-white/60 group-hover:text-green-400'
                    }`}
                    fill={userVotes[thread._id || thread.id] === 'upvote' ? 'currentColor' : 'none'}
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
                  disabled={voting || userVotes[thread._id || thread.id] === 'upvote'}
                  className={`p-2 rounded-lg transition-colors group disabled:opacity-50 ${
                    userVotes[thread._id || thread.id] === 'downvote' 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'hover:bg-white/10'
                  }`}
                  title={userVotes[thread._id || thread.id] === 'downvote' ? 'You downvoted this' : 'Downvote'}
                >
                  <svg 
                    className={`w-4 h-4 transition-colors ${
                      userVotes[thread._id || thread.id] === 'downvote'
                        ? 'text-red-400'
                        : 'text-white/60 group-hover:text-red-400'
                    }`}
                    fill={userVotes[thread._id || thread.id] === 'downvote' ? 'currentColor' : 'none'}
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

                    {/* Reply Button */}
                    <button
                      onClick={() => toggleReplyForm(a._id || a.id)}
                      className="flex items-center gap-1 text-xs text-white/60 hover:text-white/90 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Reply
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-white/50">
                      <span className="font-medium text-white/80">{a.authorName || a.author}</span>
                      <span className="mx-1.5">·</span>
                      <span>{timeAgo(a.createdAt)}</span>
                    </div>

                    {isAuthor && !a.accepted && !thread.solved && (
                      <button
                        onClick={() => handleAcceptAnswer(a._id || a.id)}
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                      >
                        Accept Answer
                      </button>
                    )}
                  </div>
                </div>

                {/* Reply Form */}
                {showReplyForm[a._id || a.id] && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <textarea
                      value={replyText[a._id || a.id] || ''}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [a._id || a.id]: e.target.value }))}
                      placeholder="Write a reply..."
                      rows={3}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-400 resize-none"
                    />
                    <div className="mt-2 flex justify-end gap-2">
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
                        Post Reply
                      </button>
                    </div>
                  </div>
                )}

                {/* Replies Display */}
                {a.replies && a.replies.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="space-y-3">
                      {a.replies.map((reply, index) => (
                        <div key={index} className="relative ml-6">
                          {/* Curvy Arrow Connector */}
                          <div className="absolute -left-6 top-0 w-6 h-6 flex items-center justify-center">
                            <svg 
                              className="w-4 h-4 text-white/20" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={1.5} 
                                d="M9 5l7 7-7 7" 
                              />
                            </svg>
                          </div>
                          
                          {/* Reply Content */}
                          <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5 relative">
                            <div className="flex items-center gap-2 mb-2">
                              {/* Check if this reply is from the original poster */}
                              {thread.authorId && reply.authorId && thread.authorId.toString() === reply.authorId.toString() && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                                  OP
                                </span>
                              )}
                              <span className="text-xs font-medium text-white/80">{reply.authorName || reply.author}</span>
                              <span className="text-xs text-white/50">·</span>
                              <span className="text-xs text-white/50">{timeAgo(reply.createdAt)}</span>
                            </div>
                            <div className="text-sm text-white/85 whitespace-pre-wrap">{reply.body}</div>
                          </div>
                        </div>
                      ))}
                    </div>
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
      </main>
      
      <Footer />
    </div>
  );
}


