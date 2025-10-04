// Community service: now calls backend; falls back to local seed if backend is unavailable.
import axiosInstance from '../utils/axiosInstance';

const STORAGE_KEY = 'nr_community_threads_v1';

function seed() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return JSON.parse(existing);
  const now = Date.now();
  const threads = [
    {
      id: 't1',
      title: 'I just got accepted! How do I apply for an I-20?',
      body: 'I received my admission letter. What docs and timeline are typical for issuing the I-20? Any pitfalls to avoid?',
      tags: ['visa','I-20','international'],
      school: 'NIU',
      author: '@aryarox',
      votes: 18,
      solved: true,
      createdAt: now - 1000*60*60*24*3,
      answers: [
        { id: 'a1', author: '@admitcoach', body: 'Pay the I-20 processing fee (if applicable), upload your passport, bank statement (covering first year expenses), and affidavit of support. Typical issuance is 1–2 weeks. Common pitfall: mismatched name/order vs. passport.', votes: 12, accepted: true, createdAt: now-1000*60*60*24*2 },
        { id: 'a2', author: '@intloffice', body: 'Check your admit portal for the “immigration” checklist. If your bank doc isn’t in English, provide a notarized translation. PDF only to avoid delays.', votes: 7, accepted: false, createdAt: now-1000*60*60*24*2 }
      ]
    },
    {
      id: 't2',
      title: 'How does my tourist visa affect F-1?',
      body: 'I have a B1/B2 visa. Any impact when applying for F-1 at the consulate?',
      tags: ['visa','F-1'],
      school: 'UIC',
      author: '@hesen',
      votes: 12,
      solved: false,
      createdAt: now - 1000*60*60*24*4,
      answers: [
        { id: 'a3', author: '@alumni', body: 'No conflict. The officer checks “non-immigrant intent”. Bring ties to home country, admission letter, I-20, SEVIS receipt, and funding proofs.', votes: 5, accepted: false, createdAt: now-1000*60*60*24*3 }
      ]
    },
    {
      id: 't3',
      title: 'Tips for finding affordable housing near campus?',
      body: 'Looking for <$900 near campus. What neighborhoods and filters do you recommend?',
      tags: ['housing','budget'],
      school: 'NIU',
      author: '@yuechen',
      votes: 25,
      solved: true,
      createdAt: now - 1000*60*60*24*1,
      answers: [
        { id: 'a4', author: '@campusrealty', body: 'Sort by walking distance (<1.5mi), filter “furnished” if you won’t buy furniture, and set price alerts. Check roommate boards to split 2BRs.', votes: 11, accepted: true, createdAt: now-1000*60*60*20 }
      ]
    }
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  return threads;
}

async function list({ q = '', limit = 20, school = '', page = 1 } = {}) {
  try {
    const params = { q, limit, page };
    if (school) params.school = school;
    const r = await axiosInstance.get('/community/threads', { params });
    if (r?.data) {
      return {
        items: r.data.items || [],
        pagination: r.data.pagination || null
      };
    }
  } catch (err) {
    console.log('Backend fetch failed, using local storage fallback:', err.message);
  }
  
  // Fallback to local storage with pagination
  const all = seed();
  let filtered = all;
  
  // Apply school filter
  if (school) {
    filtered = filtered.filter(t => t.school && t.school.toLowerCase().includes(school.toLowerCase()));
  }
  
  // Apply search filter
  if (q) {
    const qq = q.toLowerCase();
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(qq) || 
      t.body.toLowerCase().includes(qq) || 
      t.tags.some(tag => tag.toLowerCase().includes(qq))
    );
  }
  
  // Calculate pagination for local storage
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = filtered.slice(startIndex, endIndex);
  
  return {
    items: paginatedItems,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

async function get(id) {
  try {
    const r = await axiosInstance.get(`/community/threads/${id}`);
    if (r?.data?.item) return r.data.item;
  } catch (err) {
    console.log('Backend fetch failed, using local storage fallback:', err.message);
  }
  // Fallback to local storage
  const all = seed();
  return all.find(t => t.id === id || t._id === id) || null;
}

async function addThread({ title, body, tags = [], school = '', author = '@you' }) {
  try {
    const r = await axiosInstance.post('/community/threads', { title, body, tags, school, author });
    if (r?.data?.item) return r.data.item;
  } catch {}
  const all = seed();
  const t = { id: 't' + (Date.now()), title, body, tags, school, author, votes: 0, solved: false, createdAt: Date.now(), answers: [] };
  all.unshift(t);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return t;
}

async function addAnswer(threadId, { body, author = '@you' }) {
  try {
    const r = await axiosInstance.post(`/community/threads/${threadId}/answers`, { body, author });
    if (r?.data?.item) return r.data.item;
  } catch {}
  const all = seed();
  const t = all.find(tt => tt.id === threadId);
  if (!t) return null;
  const a = { id: 'a' + (Date.now()), body, author, votes: 0, accepted: false, createdAt: Date.now() };
  t.answers.push(a);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return a;
}

async function voteThread(threadId, type) {
  try {
    const r = await axiosInstance.post(`/community/threads/${threadId}/vote`, { type });
    if (r?.data) return r.data;
  } catch (err) {
    console.error('Vote error:', err);
  }
  
  // Fallback to local storage
  const all = seed();
  const t = all.find(tt => tt.id === threadId);
  if (!t) return null;
  
  if (type === 'upvote') {
    t.upvotes = (t.upvotes || 0) + 1;
  } else if (type === 'downvote') {
    t.downvotes = (t.downvotes || 0) + 1;
  }
  t.votes = (t.upvotes || 0) - (t.downvotes || 0);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return { upvotes: t.upvotes || 0, downvotes: t.downvotes || 0, votes: t.votes };
}

async function bookmarkThread(threadId) {
  try {
    console.log('🔍 Bookmarking thread:', threadId);
    const r = await axiosInstance.post(`/community/threads/${threadId}/bookmark`);
    console.log('✅ Bookmark success:', r.data);
    return r.data;
  } catch (err) {
    console.error('❌ Bookmark error:', err);
    console.error('❌ Error response:', err.response?.data);
    throw err;
  }
}

async function removeBookmark(threadId) {
  try {
    console.log('🔍 Removing bookmark for thread:', threadId);
    const r = await axiosInstance.delete(`/community/threads/${threadId}/bookmark`);
    console.log('✅ Remove bookmark success:', r.data);
    return r.data;
  } catch (err) {
    console.error('❌ Remove bookmark error:', err);
    console.error('❌ Error response:', err.response?.data);
    throw err;
  }
}

async function getBookmarks(page = 1, limit = 20) {
  try {
    const r = await axiosInstance.get(`/community/bookmarks?page=${page}&limit=${limit}`);
    return r.data;
  } catch (err) {
    console.error('Get bookmarks error:', err);
    throw err;
  }
}

async function checkBookmarkStatus(threadId) {
  try {
    const r = await axiosInstance.get(`/community/threads/${threadId}/bookmark-status`);
    return r.data;
  } catch (err) {
    console.error('Check bookmark status error:', err);
    return { isBookmarked: false };
  }
}

async function checkVoteStatus(threadId) {
  try {
    const r = await axiosInstance.get(`/community/threads/${threadId}/vote-status`);
    return r.data;
  } catch (err) {
    console.error('Check vote status error:', err);
    return { userVote: null, upvotes: 0, downvotes: 0, votes: 0 };
  }
}

async function voteAnswer(threadId, answerId, type) {
  try {
    const r = await axiosInstance.post(`/community/threads/${threadId}/answers/${answerId}/vote`, { type });
    return r.data;
  } catch (err) {
    console.error('Vote answer error:', err);
    throw err;
  }
}

async function addReply(threadId, answerId, body) {
  try {
    const r = await axiosInstance.post(`/community/threads/${threadId}/answers/${answerId}/reply`, { body });
    return r.data;
  } catch (err) {
    console.error('Add reply error:', err);
    throw err;
  }
}

async function checkAnswerVoteStatus(threadId, answerId) {
  try {
    const r = await axiosInstance.get(`/community/threads/${threadId}/answers/${answerId}/vote-status`);
    return r.data;
  } catch (err) {
    console.error('Check answer vote status error:', err);
    return { userVote: null, upvotes: 0, downvotes: 0, votes: 0 };
  }
}

async function acceptAnswer(threadId, answerId) {
  try {
    const r = await axiosInstance.post(`/community/threads/${threadId}/answers/${answerId}/accept`);
    if (r?.data?.success) return true;
  } catch {}
  const all = seed();
  const t = all.find(tt => tt.id === threadId);
  if (!t) return null;
  t.answers = t.answers.map(a => ({ ...a, accepted: a.id === answerId }));
  t.solved = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return true;
}

export default {
  list,
  get,
  addThread,
  addAnswer,
  voteThread,
  bookmarkThread,
  removeBookmark,
  getBookmarks,
  checkBookmarkStatus,
  checkVoteStatus,
  voteAnswer,
  addReply,
  checkAnswerVoteStatus,
  acceptAnswer
};


