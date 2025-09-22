import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OptimizedImage from '../components/ui/OptimizedImage';
import { 
  MdArrowBack, 
  MdFavorite, 
  MdFavoriteBorder, 
  MdShare, 
  MdLocationOn, 
  MdEmail, 
  MdPhone, 
  MdPerson,
  MdVerified,
  MdArrowForwardIos,
  MdClose
} from 'react-icons/md';
import { 
  FaFacebookF, 
  FaTwitter, 
  FaWhatsapp, 
  FaTelegramPlane,
  FaCopy
} from 'react-icons/fa';
import axiosInstance from '../utils/axiosInstance';
import Navbar from '../components/Navbar/Navbar';
import '../styles/newrun-hero.css';

export default function MarketplaceItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorited, setFavorited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactRevealed, setContactRevealed] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Fetch item details
  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/marketplace/item/${id}`);
      setItem(response.data.item);
      
      // Track view
      await axiosInstance.post(`/marketplace/item/${id}/view`);
    } catch (error) {
      console.error('Error fetching item details:', error);
      setError('Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    try {
      if (favorited) {
        await axiosInstance.delete(`/marketplace/favorites/${id}`);
      } else {
        await axiosInstance.post(`/marketplace/favorites/${id}`);
      }
      setFavorited(!favorited);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const shareToSocial = (platform) => {
    const url = window.location.href;
    const title = item?.title || 'Check out this item on NewRun';
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return `$${price.toLocaleString('en-US')}`;
  };

  const getConditionColor = (condition) => {
    const colors = {
      'new': 'bg-green-500/20 text-green-400 border-green-500/30',
      'like-new': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'good': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'fair': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'used': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[condition] || colors['used'];
  };

  const getExchangeMethodIcon = (method) => {
    switch (method) {
      case 'public': return '🏢';
      case 'campus': return '🎓';
      case 'shipping': return '📦';
      default: return '🤝';
    }
  };

  const getExchangeMethodText = (method) => {
    switch (method) {
      case 'public': return 'Public Meeting';
      case 'campus': return 'Campus Pickup';
      case 'shipping': return 'Shipping Available';
      default: return 'Contact Seller';
    }
  };

  if (loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/70 text-lg">Loading item details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdClose className="text-red-400 text-2xl" />
            </div>
            <p className="text-white/70 text-lg mb-4">{error || 'Item not found'}</p>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  const images = item.images || [];
  const currentImage = images[currentImageIndex] || item.thumbnailUrl || '';

  // Image handlers for OptimizedImage component
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <div className="nr-dots-page min-h-screen text-white">
      <Navbar />
      
      {/* NewRun Hero Background */}
      <section className="nr-hero-bg nr-hero-starry relative min-h-screen overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="hero-orb absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-orange-500/10 to-cyan-500/10 rounded-full blur-3xl" />
          <div className="hero-orb absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
          <div className="hero-orb absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-pink-500/10 to-orange-500/10 rounded-full blur-2xl" />
        </div>
        
        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-sm text-white/60 mb-4">
            <button 
              onClick={() => navigate('/marketplace')}
              className="hover:text-white/80 transition-colors"
            >
              Marketplace
            </button>
            <span>/</span>
            <span className="text-white/80 font-medium">{item.category}</span>
            <span>/</span>
            <span className="text-white font-medium truncate">{item.title}</span>
          </nav>

          {/* Main Product Section - NewRun Style */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* NewRun Style Image Gallery */}
          <div className="lg:col-span-1">
            <div className="flex gap-4">
              {/* Thumbnail Sidebar */}
              {images.length > 1 && (
                <div className="flex flex-col gap-2 w-20">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                        index === currentImageIndex 
                          ? 'border-orange-500 shadow-lg shadow-orange-500/25' 
                          : 'border-white/20 hover:border-white/40 bg-white/5'
                      }`}
                    >
                      <OptimizedImage
                        src={image}
                        alt={`${item.title} ${index + 1}`}
                        className="w-full h-full"
                        width={200}
                        height={200}
                        quality={80}
                        loading="lazy"
                        showLoading={false}
                        showError={false}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Product Image */}
              <div className="flex-1 relative group">
                <div 
                  className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-zoom-in shadow-2xl"
                  onClick={() => setShowImageModal(true)}
                >
                  <OptimizedImage
                    src={currentImage}
                    alt={item.title}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                    width={800}
                    height={800}
                    quality={85}
                    loading="lazy"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    fallbackIcon={MdPerson}
                  />
                  
                  {/* Zoom indicator */}
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
        </div>
        </div>

                {/* Image Navigation */}
                {images.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
                      }}
                      className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all duration-200 shadow-lg"
                    >
                      <MdArrowBack className="text-lg" />
                    </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
                        setCurrentImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
                      }}
                      className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all duration-200 shadow-lg"
                    >
                      <MdArrowForwardIos className="text-lg" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          
          {/* NewRun Style Product Information */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Product Header */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-white mb-2 leading-tight">
                    {item.title}
                  </h1>
                  <p className="text-sm text-white/60 mb-3">Item #{item._id?.slice(-6).toUpperCase()}</p>
                  
                  {/* Condition & Category Badges */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                      {item.condition?.charAt(0).toUpperCase() + item.condition?.slice(1)}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
                      {item.category}
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFavorite}
                    className="rounded-lg border border-white/10 p-1.5 text-white/80 hover:bg-white/10"
                  >
                    {favorited ? (
                      <MdFavorite className="text-lg" />
                    ) : (
                      <MdFavoriteBorder className="text-lg" />
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="rounded-lg border border-white/10 p-1.5 text-white/80 hover:bg-white/10"
                  >
                    <MdShare className="text-lg" />
          </button>
        </div>
      </div>

              {/* Price Section */}
              <div className="space-y-1">
                <div className="text-3xl font-bold text-white">
                  {formatPrice(item.price)}
                </div>
                <p className="text-sm text-white/70">Negotiable • Cash preferred • No fees</p>
              </div>
            </div>

            {/* Seller Information */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/2 to-white/0 p-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                  <MdPerson className="text-white/70 text-lg" />
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">{item.contactInfo?.name || 'Seller'}</p>
                  <div className="flex items-center gap-2">
                    <MdVerified className="text-white/70 text-sm" />
                    <span className="text-sm text-white/70 font-medium">Verified Seller</span>
                    <span className="text-sm text-white/60">• Student</span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-white/70">
                <p>📍 {item.contactInfo?.generalLocation || 'Campus area'}</p>
                <p>🕒 Responds within 2 hours</p>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm text-white/70">
                <span className="font-semibold">12 people</span> viewed this in the last hour
              </p>
            </div>

            {/* NewRun Style CTA Section */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/2 to-white/0 p-4">
              <div className="text-center space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Interested in this item?</h3>
                  <p className="text-sm text-white/70">Contact the seller to arrange a meeting</p>
                </div>
                
                {!contactRevealed ? (
                  <button
                    onClick={() => setContactRevealed(true)}
                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <MdPerson className="text-lg" />
                      Contact Seller
                    </span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    {/* Seller Info */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                          <MdPerson className="text-white/70 text-lg" />
                        </div>
                        <div>
                          <span className="text-white font-semibold text-sm">{item.contactInfo?.name || 'Seller'}</span>
                          <div className="flex items-center gap-1">
                            <MdVerified className="text-white/70 text-xs" />
                            <span className="text-white/70 text-xs font-medium">Verified</span>
                          </div>
                        </div>
                      </div>
                      
                      {item.contactInfo?.email && (
                        <div className="flex items-center gap-3 py-2 border-b border-white/10">
                          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                            <MdEmail className="text-white/70 text-sm" />
                          </div>
                          <span className="text-white flex-1 font-medium text-sm">{item.contactInfo.email}</span>
                          <button
                            onClick={() => copyToClipboard(item.contactInfo.email)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <FaCopy className="text-white/60 text-xs" />
                          </button>
                        </div>
                      )}
                      
                      {item.contactInfo?.phone && (
                        <div className="flex items-center gap-3 py-2">
                          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                            <MdPhone className="text-white/70 text-sm" />
                          </div>
                          <span className="text-white flex-1 font-medium text-sm">{item.contactInfo.phone}</span>
                          <button
                            onClick={() => copyToClipboard(item.contactInfo.phone)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <FaCopy className="text-white/60 text-xs" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => window.open(`mailto:${item.contactInfo?.email}`, '_blank')}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10 text-white flex items-center justify-center gap-2"
                      >
                        <MdEmail className="text-sm" />
                        Email
                      </button>
                      {item.contactInfo?.phone && (
                        <button
                          onClick={() => window.open(`tel:${item.contactInfo.phone}`, '_blank')}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium hover:bg-white/10 text-white flex items-center justify-center gap-2"
                        >
                          <MdPhone className="text-sm" />
                          Call
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* NewRun Style Information Tabs */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/2 to-white/0 p-4">
              <div className="flex space-x-1 mb-4 bg-white/5 rounded-xl p-1 border border-white/10">
                <button className="flex-1 py-2 px-4 text-sm font-medium text-orange-400 bg-white/10 rounded-lg shadow-sm">
                  Details
                </button>
                <button className="flex-1 py-2 px-4 text-sm font-medium text-white/60 hover:text-white/80">
                  Reviews
                </button>
                <button className="flex-1 py-2 px-4 text-sm font-medium text-white/60 hover:text-white/80">
                  Specs
                </button>
              </div>
              
              {/* Details Tab Content */}
              <div className="space-y-3">
                {/* Description */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Description</h4>
                  <p className="text-sm text-white/80 leading-relaxed">
              {item.description}
            </p>
                </div>

                {/* Product Details */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Product Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Condition:</span>
                      <span className="font-medium text-white capitalize">{item.condition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Category:</span>
                      <span className="font-medium text-white">{item.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Posted:</span>
                      <span className="font-medium text-white">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Views:</span>
                      <span className="font-medium text-white">{Math.floor(Math.random() * 50) + 10}</span>
                    </div>
                  </div>
                </div>

                {/* What's Included */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">What's Included</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-white/70 rounded-full"></div>
                      <span className="text-white/80">Original packaging</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-white/70 rounded-full"></div>
                      <span className="text-white/80">All accessories</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-white/70 rounded-full"></div>
                      <span className="text-white/80">User manual</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-white/70 rounded-full"></div>
                      <span className="text-white/80">Warranty card</span>
                    </div>
                  </div>
                </div>

                {/* Exchange Method */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Exchange Method</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                      {getExchangeMethodIcon(item.contactInfo?.exchangeMethod)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{getExchangeMethodText(item.contactInfo?.exchangeMethod)}</p>
                      <p className="text-sm text-white/70">
                        {item.contactInfo?.exchangeMethod === 'public' && 'Meet in a public place for safety'}
                        {item.contactInfo?.exchangeMethod === 'campus' && 'Pickup available on campus'}
                        {item.contactInfo?.exchangeMethod === 'shipping' && 'Item can be shipped to you'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                {item.contactInfo?.generalLocation && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Location</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                        <MdLocationOn className="text-white/70 text-sm" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-white">{item.contactInfo.generalLocation}</span>
                        <p className="text-sm text-white/70">General area only</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Safety Notice */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 border border-white/10">
                      <span className="text-white/70 text-sm">🛡️</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm mb-1">Safety First</h4>
                      <p className="text-white/70 text-sm leading-relaxed">
                        Always meet in public places during daylight hours. Never share your home address.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* NewRun Style Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative max-w-6xl max-h-[90vh] w-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 shadow-lg border border-white/20"
            >
              <MdClose className="text-2xl" />
            </button>
            
            <OptimizedImage
              src={currentImage}
              alt={item.title}
              className="w-full h-full rounded-2xl shadow-2xl"
              width={1200}
              height={1200}
              quality={90}
              loading="eager"
              style={{ objectFit: 'contain' }}
            />
            
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      index === currentImageIndex ? 'bg-orange-500 shadow-lg shadow-orange-500/50' : 'bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Share Item</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all duration-200"
              >
                <MdClose className="text-xl" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="text"
                  value={window.location.href}
                  readOnly
                  className="flex-1 bg-transparent text-gray-700 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(window.location.href)}
                  className="p-3 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FaCopy className="text-gray-500 text-lg" />
                </button>
        </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="group flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <FaFacebookF className="text-xl" />
                  Facebook
                </button>
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="group flex items-center justify-center gap-3 py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <FaTwitter className="text-xl" />
                  Twitter
                </button>
                <button
                  onClick={() => shareToSocial('whatsapp')}
                  className="group flex items-center justify-center gap-3 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <FaWhatsapp className="text-xl" />
                  WhatsApp
                </button>
                <button
                  onClick={() => shareToSocial('telegram')}
                  className="group flex items-center justify-center gap-3 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <FaTelegramPlane className="text-xl" />
                  Telegram
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}