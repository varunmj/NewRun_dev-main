import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CommunityService from '../services/CommunityService';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import axiosInstance from '../utils/axiosInstance';
import { timeAgo } from '../utils/timeUtils';
import '../styles/newrun-hero.css';

export default function Thread() {
  const { id } = useParams();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    async function fetchThread() {
      setLoading(true);
      try {
        const data = await CommunityService.get(id);
        setThread(data);
      } catch (error) {
        console.error('Error fetching thread:', error);
        setThread(null);
      } finally {
        setLoading(false);
      }
    }
    fetchThread();
  }, [id]);

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

  const handleVote = async (delta) => {
    if (voting) return;
    setVoting(true);
    try {
      const newVotes = await CommunityService.voteThread(thread._id || thread.id, delta);
      if (newVotes !== null) {
        setThread({ ...thread, votes: newVotes });
      }
    } catch (error) {
      console.error('Vote error:', error);
    } finally {
      setVoting(false);
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

          <h1 className="text-3xl font-bold leading-tight">{thread.title}</h1>

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

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleVote(1)}
                disabled={voting}
                className="group flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm hover:border-green-400/30 hover:bg-green-500/10 disabled:opacity-50"
              >
                <svg 
                  className="w-4 h-4 text-white/60 group-hover:text-green-400 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                <span className="font-semibold text-white/90">{thread.votes}</span>
              </button>
              <button
                onClick={() => handleVote(-1)}
                disabled={voting}
                className="group flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm hover:border-red-400/30 hover:bg-red-500/10 disabled:opacity-50"
              >
                <svg 
                  className="w-4 h-4 text-white/60 group-hover:text-red-400 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
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
              <article key={a._id || a.id} className={`nr-panel ${a.accepted ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}>
                {a.accepted && (
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                    <span>✓</span> Accepted Answer
                  </div>
                )}

                <div className="text-[15px] leading-relaxed text-white/85 whitespace-pre-wrap">{a.body}</div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
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


