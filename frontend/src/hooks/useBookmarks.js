// src/hooks/useBookmarks.js
import { useEffect, useState } from 'react';
import CommunityService from '../services/CommunityService';

export default function useBookmarks(userInfo) {
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    // seed from cache for instant UI
    try {
      const cached = JSON.parse(localStorage.getItem('nr_bookmarks') || '[]');
      return new Set(cached.map(String));
    } catch { return new Set(); }
  });
  const [bookmarkInFlight, setBookmarkInFlight] = useState({});

  useEffect(() => {
    const uid = userInfo?._id || userInfo?.userId;
    if (!uid) return;

    (async () => {
      try {
        const res = await CommunityService.getBookmarks();
        const list = Array.isArray(res?.bookmarks) ? res.bookmarks
                     : Array.isArray(res) ? res : [];
        const ids = list.map((b) => {
          if (typeof b === 'string') return b;
          if (b.threadId) return String(b.threadId);
          if (b.thread?._id) return String(b.thread._id);
          if (b.thread) return String(b.thread);
          return null;
        }).filter(Boolean);
        setBookmarkedIds(new Set(ids));
        localStorage.setItem('nr_bookmarks', JSON.stringify(ids));
      } catch (e) {
        console.error('Bookmarks load failed:', e?.response?.data || e.message);
      }
    })();
  }, [userInfo?._id, userInfo?.userId]);

  const toggleBookmark = async (threadIdRaw, e) => {
    e?.preventDefault?.(); e?.stopPropagation?.();
    const threadId = String(threadIdRaw);
    if (!threadId || bookmarkInFlight[threadId]) return;

    setBookmarkInFlight((s) => ({ ...s, [threadId]: true }));
    const was = bookmarkedIds.has(threadId);

    // optimistic
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      was ? next.delete(threadId) : next.add(threadId);
      localStorage.setItem('nr_bookmarks', JSON.stringify([...next]));
      return next;
    });

    try {
      if (was) await CommunityService.removeBookmark(threadId);
      else     await CommunityService.bookmarkThread(threadId);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || '';
      const idempotentOK =
        (was && (status === 404 || /not\s*bookmarked/i.test(msg))) ||
        (!was && (status === 409 || /already\s*bookmarked/i.test(msg)));
      if (!idempotentOK) {
        // revert
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          was ? next.add(threadId) : next.delete(threadId);
          localStorage.setItem('nr_bookmarks', JSON.stringify([...next]));
          return next;
        });
        console.error('Bookmark toggle failed:', status, msg);
        alert('Failed to update bookmark. Please try again.');
      }
    } finally {
      setBookmarkInFlight((s) => ({ ...s, [threadId]: false }));
    }
  };

  return { bookmarkedIds, setBookmarkedIds, bookmarkInFlight, toggleBookmark };
}
