import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import CommunityService from '../../services/CommunityService';
import { timeAgo } from '../../utils/timeUtils';

const ViewAllModal = ({ isOpen, onClose, universityFilter, userInfo }) => {
  const [allThreads, setAllThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [searching, setSearching] = useState(false);
  const [votingStates, setVotingStates] = useState({}); // Track voting for each thread

  const ITEMS_PER_PAGE = 12; // More items per page in modal

  useEffect(() => {
    if (isOpen) {
      loadAllThreads();
    }
  }, [isOpen, universityFilter, currentPage]);

  const loadAllThreads = async () => {
    setLoading(true);
    try {
      const params = { 
        limit: ITEMS_PER_PAGE, 
        page: currentPage,
        q: searchQuery 
      };
      
      if (universityFilter === 'my' && userInfo?.university) {
        params.school = userInfo.university;
      }
      
      console.log('🔄 Loading all threads with params:', params);
      const result = await CommunityService.list(params);
      
      if (result && result.items) {
        setAllThreads(result.items);
        setPagination(result.pagination);
      } else {
        // Fallback for old API response format
        setAllThreads(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error('Error loading all threads:', error);
      setAllThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on search
    setSearching(true);
    try {
      const params = { 
        limit: ITEMS_PER_PAGE, 
        page: 1,
        q: searchQuery.trim() 
      };
      
      if (universityFilter === 'my' && userInfo?.university) {
        params.school = userInfo.university;
      }
      
      const result = await CommunityService.list(params);
      
      if (result && result.items) {
        setAllThreads(result.items);
        setPagination(result.pagination);
      } else {
        setAllThreads(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error('Error searching threads:', error);
      setAllThreads([]);
    } finally {
      setSearching(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (pagination?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    loadAllThreads();
  };

  // Voting function
  const handleVote = async (threadId, delta, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const votingKey = `${threadId}_${delta}`;
    if (votingStates[votingKey]) return; // Prevent double voting
    
    setVotingStates(prev => ({ ...prev, [votingKey]: true }));
    
    try {
      const newVotes = await CommunityService.voteThread(threadId, delta);
      
      // Update the local state
      setAllThreads(prev => prev.map(thread => 
        (thread._id || thread.id) === threadId 
          ? { ...thread, votes: newVotes }
          : thread
      ));
      
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVotingStates(prev => ({ ...prev, [votingKey]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] mx-4 bg-black/90 border border-white/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/95 border-b border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                All Community Questions
              </h2>
              {pagination && (
                <p className="text-white/60 text-sm mt-1">
                  {pagination.totalItems} questions • Page {pagination.currentPage} of {pagination.totalPages}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all questions..."
                className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-3 h-3 text-white/60" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading || searching ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-white/60">
                {searching ? 'Searching...' : 'Loading questions...'}
              </span>
            </div>
          ) : allThreads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60">
                {searchQuery ? `No questions found for "${searchQuery}"` : 'No questions available'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allThreads.map((thread) => (
                <Link
                  key={thread._id || thread.id}
                  to={`/community/thread/${thread._id || thread.id}`}
                  onClick={onClose}
                  className="block p-4 bg-white/[0.02] border border-white/10 rounded-lg hover:bg-white/[0.04] hover:border-white/20 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {thread.title}
                      </h3>
                    </div>
                    {thread.solved && (
                      <div className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                        Solved
                      </div>
                    )}
                  </div>

                  {thread.body && (
                    <p className="text-white/60 text-xs mb-3 line-clamp-2">
                      {thread.body}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      {/* Voting Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleVote(thread._id || thread.id, 1, e)}
                          disabled={votingStates[`${thread._id || thread.id}_1`]}
                          className="p-1 rounded hover:bg-white/10 transition-colors group disabled:opacity-50"
                          title="Upvote"
                        >
                          <svg 
                            className="w-3 h-3 text-white/60 group-hover:text-green-400 transition-colors" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        
                        <span className="text-white/70 font-medium min-w-[1.5rem] text-center text-xs">
                          {thread.votes || 0}
                        </span>
                        
                        <button
                          onClick={(e) => handleVote(thread._id || thread.id, -1, e)}
                          disabled={votingStates[`${thread._id || thread.id}_-1`]}
                          className="p-1 rounded hover:bg-white/10 transition-colors group disabled:opacity-50"
                          title="Downvote"
                        >
                          <svg 
                            className="w-3 h-3 text-white/60 group-hover:text-red-400 transition-colors" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Answers Count */}
                      <div className="flex items-center gap-1 text-white/50">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{thread.answers?.length || 0}</span>
                      </div>
                      
                      {/* School Tag */}
                      {thread.school && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                          {thread.school}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    <span className="text-white/40 text-xs">
                      {thread.authorName || thread.author || '@anonymous'}
                    </span>
                    <span className="text-white/40 text-xs">
                      {timeAgo(thread.createdAt)}
                    </span>
                  </div>

                  {thread.tags && thread.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {thread.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-white/5 text-white/60 text-xs rounded-full border border-white/10"
                        >
                          {tag}
                        </span>
                      ))}
                      {thread.tags.length > 3 && (
                        <span className="text-white/40 text-xs">+{thread.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="sticky bottom-0 bg-black/95 border-t border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/60">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                {pagination.totalItems} questions
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-white/70" />
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          pageNum === pagination.currentPage
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-white/70" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewAllModal;
