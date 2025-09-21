import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with NewRun hero styling */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('/src/assets/Graphics/noise-8bit.png')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-blue-500/10"></div>
        <div className="absolute inset-0 bg-[url('/src/assets/Graphics/mesh-hero.png')] opacity-30 mix-blend-overlay"></div>
      </div>
      
      <Navbar />
      
      {/* Back Button */}
      <div className="relative z-10 container mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/marketplace')}
          className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
        >
          <MdArrowBack className="text-lg group-hover:-translate-x-1 transition-transform" />
          <span>Back to Marketplace</span>
        </button>
      </div>

      <div className="relative z-10 container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Image Gallery */}
          <div className="space-y-6">
            {/* Main Image */}
            <div 
              className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-white/5 to-white/10 border border-white/20 cursor-pointer group shadow-2xl backdrop-blur-sm"
              onClick={() => setShowImageModal(true)}
            >
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white/40">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/20">
                      <MdPerson className="text-3xl text-white/60" />
                    </div>
                    <p className="text-white/60">No image available</p>
                  </div>
                </div>
              )}
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
                    }}
                    className="w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all duration-200 border border-white/20"
                  >
                    <MdArrowBack className="text-xl" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
                    }}
                    className="w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all duration-200 border border-white/20"
                  >
                    <MdArrowForwardIos className="text-xl" />
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 backdrop-blur-sm ${
                      index === currentImageIndex 
                        ? 'border-orange-500 shadow-lg shadow-orange-500/25' 
                        : 'border-white/20 hover:border-white/40 hover:shadow-lg'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${item.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Information */}
          <div className="space-y-8">
            
            {/* Header */}
            <div className="space-y-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-white via-orange-100 to-white bg-clip-text text-transparent">
                    {item.title}
                  </h1>
                  <div className="flex items-center gap-4 mb-8">
                    <span className={`px-6 py-3 rounded-full text-sm font-bold border backdrop-blur-sm ${getConditionColor(item.condition)}`}>
                      {item.condition?.charAt(0).toUpperCase() + item.condition?.slice(1)}
                    </span>
                    <span className="px-6 py-3 rounded-full text-sm font-bold bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-sm">
                      {item.category}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleFavorite}
                    className="group w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/40"
                  >
                    {favorited ? (
                      <MdFavorite className="text-red-400 text-3xl group-hover:scale-110 transition-transform" />
                    ) : (
                      <MdFavoriteBorder className="text-white/70 text-3xl group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="group w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/40"
                  >
                    <MdShare className="text-white/70 text-3xl group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="text-6xl lg:text-7xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent">
                  {formatPrice(item.price)}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">Description</h3>
              <div className="p-8 bg-gradient-to-br from-white/5 to-white/10 rounded-3xl border border-white/20 backdrop-blur-sm shadow-2xl">
                <p className="text-white/90 leading-relaxed text-xl">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Exchange Method */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">Exchange Method</h3>
              <div className="flex items-center gap-6 p-8 bg-gradient-to-br from-orange-500/10 to-purple-500/10 rounded-3xl border border-orange-500/20 backdrop-blur-sm shadow-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm border border-white/20">
                  {getExchangeMethodIcon(item.contactInfo?.exchangeMethod)}
                </div>
                <div>
                  <p className="text-white font-bold text-2xl">{getExchangeMethodText(item.contactInfo?.exchangeMethod)}</p>
                  <p className="text-white/70 text-lg">
                    {item.contactInfo?.exchangeMethod === 'public' && 'Meet in a public place for safety'}
                    {item.contactInfo?.exchangeMethod === 'campus' && 'Pickup available on campus'}
                    {item.contactInfo?.exchangeMethod === 'shipping' && 'Item can be shipped to you'}
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            {item.contactInfo?.generalLocation && (
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">Location</h3>
                <div className="flex items-center gap-6 p-8 bg-gradient-to-br from-white/5 to-white/10 rounded-3xl border border-white/20 backdrop-blur-sm shadow-2xl">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-orange-500/30">
                    <MdLocationOn className="text-orange-400 text-2xl" />
                  </div>
                  <span className="text-white/90 text-2xl font-bold">{item.contactInfo.generalLocation}</span>
                </div>
              </div>
            )}

            {/* Contact Section */}
            <div className="space-y-8">
              <h3 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">Contact Seller</h3>
              
              {!contactRevealed ? (
                <div className="p-10 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl border border-orange-500/20 backdrop-blur-sm shadow-2xl">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/20">
                      <MdPerson className="text-orange-400 text-4xl" />
                    </div>
                    <h4 className="text-3xl font-bold text-white mb-4">Contact Information</h4>
                    <p className="text-white/80 mb-8 text-xl">
                      Click below to reveal seller contact information
                    </p>
                    <button
                      onClick={() => setContactRevealed(true)}
                      className="group px-12 py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-3xl font-bold text-xl transition-all duration-200 shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105"
                    >
                      <span className="flex items-center gap-3">
                        Reveal Contact Info
                        <MdArrowForwardIos className="text-2xl group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="p-8 bg-gradient-to-br from-white/5 to-white/10 rounded-3xl border border-white/20 backdrop-blur-sm shadow-2xl">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <MdPerson className="text-orange-400 text-3xl" />
                      </div>
                      <div>
                        <span className="text-white font-bold text-2xl">{item.contactInfo?.name || 'Seller'}</span>
                        <div className="flex items-center gap-3 mt-2">
                          <MdVerified className="text-blue-400 text-2xl" />
                          <span className="text-blue-400 text-lg font-bold">Verified Seller</span>
                        </div>
                      </div>
                    </div>
                    
                    {item.contactInfo?.email && (
                      <div className="flex items-center gap-6 py-6 border-b border-white/10">
                        <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <MdEmail className="text-blue-400 text-2xl" />
                        </div>
                        <span className="text-white/90 text-xl flex-1 font-semibold">{item.contactInfo.email}</span>
                        <button
                          onClick={() => copyToClipboard(item.contactInfo.email)}
                          className="p-3 hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <FaCopy className="text-white/60 text-xl" />
                        </button>
                      </div>
                    )}
                    
                    {item.contactInfo?.phone && (
                      <div className="flex items-center gap-6 py-6">
                        <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center">
                          <MdPhone className="text-green-400 text-2xl" />
                        </div>
                        <span className="text-white/90 text-xl flex-1 font-semibold">{item.contactInfo.phone}</span>
                        <button
                          onClick={() => copyToClipboard(item.contactInfo.phone)}
                          className="p-3 hover:bg-white/10 rounded-xl transition-colors"
                        >
                          <FaCopy className="text-white/60 text-xl" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button
                      onClick={() => window.open(`mailto:${item.contactInfo?.email}`, '_blank')}
                      className="group py-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-3xl font-bold text-xl transition-all duration-200 flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
                    >
                      <MdEmail className="text-2xl" />
                      Send Email
                    </button>
                    {item.contactInfo?.phone && (
                      <button
                        onClick={() => window.open(`tel:${item.contactInfo.phone}`, '_blank')}
                        className="group py-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-3xl font-bold text-xl transition-all duration-200 flex items-center justify-center gap-4 shadow-2xl shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105"
                      >
                        <MdPhone className="text-2xl" />
                        Call Now
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative max-w-6xl max-h-[90vh] w-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all duration-200 border border-white/20"
            >
              <MdClose className="text-2xl" />
            </button>
            
            <img
              src={currentImage}
              alt={item.title}
              className="w-full h-full object-contain rounded-2xl shadow-2xl"
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-3xl p-8 max-w-md w-full border border-white/20 backdrop-blur-sm shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">Share Item</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:bg-white/20 transition-all duration-200 border border-white/20"
              >
                <MdClose className="text-xl" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/20">
                <input
                  type="text"
                  value={window.location.href}
                  readOnly
                  className="flex-1 bg-transparent text-white/80 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(window.location.href)}
                  className="p-3 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <FaCopy className="text-white/60 text-lg" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="group flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-105"
                >
                  <FaFacebookF className="text-xl" />
                  Facebook
                </button>
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="group flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-105"
                >
                  <FaTwitter className="text-xl" />
                  Twitter
                </button>
                <button
                  onClick={() => shareToSocial('whatsapp')}
                  className="group flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105"
                >
                  <FaWhatsapp className="text-xl" />
                  WhatsApp
                </button>
                <button
                  onClick={() => shareToSocial('telegram')}
                  className="group flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105"
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