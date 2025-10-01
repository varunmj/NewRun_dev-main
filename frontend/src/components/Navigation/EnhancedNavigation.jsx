import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MdHome, 
  MdStore, 
  MdGroup, 
  MdAccountBalance, 
  MdSchool, 
  MdDirectionsBus,
  MdRestaurant,
  MdHealthAndSafety,
  MdWork,
  MdPeople,
  MdMenu,
  MdClose
} from 'react-icons/md';

/**
 * Enhanced Navigation Component
 * Complete navigation for the NewRun platform
 * CEO-level UX with all platform entities
 */
const EnhancedNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: MdHome,
      description: 'AI-powered insights and overview'
    },
    {
      name: 'Housing',
      href: '/all-properties',
      icon: MdHome,
      description: 'Find your perfect home'
    },
    {
      name: 'Marketplace',
      href: '/marketplace',
      icon: MdStore,
      description: 'Buy and sell with students'
    },
    {
      name: 'Roommates',
      href: '/Synapse',
      icon: MdGroup,
      description: 'Find compatible roommates'
    },
    {
      name: 'Finance',
      href: '/finance',
      icon: MdAccountBalance,
      description: 'AI budget planning & optimization',
      isNew: true
    },
    {
      name: 'Academic',
      href: '/academic',
      icon: MdSchool,
      description: 'Course planning & deadlines',
      isNew: true
    },
    {
      name: 'Transport',
      href: '/transport',
      icon: MdDirectionsBus,
      description: 'Route optimization & carpool',
      isNew: true
    },
    {
      name: 'Dining',
      href: '/dining',
      icon: MdRestaurant,
      description: 'Meal plan optimization',
      isNew: true,
      comingSoon: true
    },
    {
      name: 'Wellness',
      href: '/wellness',
      icon: MdHealthAndSafety,
      description: 'Health & fitness tracking',
      isNew: true,
      comingSoon: true
    },
    {
      name: 'Career',
      href: '/career',
      icon: MdWork,
      description: 'Job matching & networking',
      isNew: true,
      comingSoon: true
    },
    {
      name: 'Social',
      href: '/social',
      icon: MdPeople,
      description: 'Study groups & communities',
      isNew: true,
      comingSoon: true
    }
  ];

  const isActive = (href) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-800 text-white p-2 rounded-lg"
      >
        {isOpen ? <MdClose className="text-xl" /> : <MdMenu className="text-xl" />}
      </button>

      {/* Navigation Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: isOpen ? 0 : '-100%' }}
        className={`fixed inset-y-0 left-0 z-40 w-80 bg-slate-900 border-r border-slate-700 lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <h1 className="text-2xl font-bold text-white">NewRun</h1>
            <p className="text-slate-400 text-sm">AI-Powered University Life</p>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-6 space-y-2">
            {navigationItems.map((item, index) => {
              const IconComponent = item.icon;
              const active = isActive(item.href);
              
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`group flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    } ${item.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="relative">
                      <IconComponent className="text-xl" />
                      {item.isNew && !item.comingSoon && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.isNew && !item.comingSoon && (
                          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                            New
                          </span>
                        )}
                        {item.comingSoon && (
                          <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 group-hover:text-slate-300">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-slate-700">
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">AI Insights</h3>
              <p className="text-slate-400 text-sm mb-3">
                Get personalized recommendations across all your university needs.
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                View All Insights
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Overlay for mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}
    </>
  );
};

export default EnhancedNavigation;

