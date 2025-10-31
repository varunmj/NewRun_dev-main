import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

/**
 * Agent Workbench Panel - Shows AI action progress with animated connecting lines
 * Inspired by modern AI agent interfaces
 */
const AgentWorkbenchPanel = ({ isOpen, onClose, actionType, property, onActionComplete, composeDraft, onComposeChange, onComposeSend, composeSending }) => {
  const [steps, setSteps] = useState([]);
  const pathControls = useAnimation();
  const stepControls = useAnimation();
  const [showCompose, setShowCompose] = useState(false);

  // Define action workflows
  const workflows = {
    'ask_host': {
      title: 'Message Host',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="size-5">
          <path d="M12,111l112,64a8,8,0,0,0,7.94,0l112-64a8,8,0,0,0,0-13.9l-112-64a8,8,0,0,0-7.94,0l-112,64A8,8,0,0,0,12,111ZM128,49.21,223.87,104,128,158.79,32.13,104ZM246.94,140A8,8,0,0,1,244,151L132,215a8,8,0,0,1-7.94,0L12,151A8,8,0,0,1,20,137.05l108,61.74,108-61.74A8,8,0,0,1,246.94,140Z"></path>
        </svg>
      ),
      steps: [
        { id: 'draft', label: 'Drafting message', status: 'pending' },
        { id: 'review', label: 'Ready for review', status: 'pending' },
        { id: 'send', label: 'Sending to host', status: 'pending' },
        { id: 'waiting', label: 'Waiting for reply', status: 'pending' }
      ]
    },
    'request_contact': {
      title: 'Request Contact Info',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="size-5">
          <path d="M12,111l112,64a8,8,0,0,0,7.94,0l112-64a8,8,0,0,0,0-13.9l-112-64a8,8,0,0,0-7.94,0l-112,64A8,8,0,0,0,12,111ZM128,49.21,223.87,104,128,158.79,32.13,104ZM246.94,140A8,8,0,0,1,244,151L132,215a8,8,0,0,1-7.94,0L12,151A8,8,0,0,1,20,137.05l108,61.74,108-61.74A8,8,0,0,1,246.94,140Z"></path>
        </svg>
      ),
      steps: [
        { id: 'check', label: 'Checking status', status: 'pending' },
        { id: 'send', label: 'Sending request', status: 'pending' },
        { id: 'waiting', label: 'Awaiting approval', status: 'pending' }
      ]
    },
    'schedule_tour': {
      title: 'Schedule Tour',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="size-5">
          <path d="M12,111l112,64a8,8,0,0,0,7.94,0l112-64a8,8,0,0,0,0-13.9l-112-64a8,8,0,0,0-7.94,0l-112,64A8,8,0,0,0,12,111ZM128,49.21,223.87,104,128,158.79,32.13,104ZM246.94,140A8,8,0,0,1,244,151L132,215a8,8,0,0,1-7.94,0L12,151A8,8,0,0,1,20,137.05l108,61.74,108-61.74A8,8,0,0,1,246.94,140Z"></path>
        </svg>
      ),
      steps: [
        { id: 'fetch', label: 'Fetching availability', status: 'pending' },
        { id: 'hold', label: 'Holding slot', status: 'pending' },
        { id: 'book', label: 'Booking confirmed', status: 'pending' }
      ]
    }
  };

  const workflow = workflows[actionType] || workflows['ask_host'];

  // Initialize steps when workflow changes
  useEffect(() => {
    if (isOpen && actionType) {
      const initialSteps = workflow.steps.map(s => ({ ...s, status: 'pending' }));
      setSteps(initialSteps);
      setShowCompose(false);
      
      // Start animation sequence
      stepControls.set({ opacity: 0, y: 24 });
      pathControls.set({ pathLength: 0 });
      
      setTimeout(() => {
        stepControls.start({ opacity: 1, y: 0 });
        
        // Auto-start workflow for ask_host
        if (actionType === 'ask_host' && initialSteps.length > 0) {
          // If draft already exists, skip directly to review
          if (composeDraft?.trim()) {
            setTimeout(() => {
              setSteps(prev => prev.map((s, idx) => 
                idx === 0 ? { ...s, status: 'completed' } : 
                idx === 1 ? { ...s, status: 'in_progress' } : s
              ));
              setShowCompose(true);
              pathControls.start({ pathLength: 0.5, transition: { duration: 0.6 } });
            }, 600);
          } else {
            // No draft yet, start from beginning
            setTimeout(() => {
              setSteps(prev => prev.map((s, idx) => 
                idx === 0 ? { ...s, status: 'in_progress' } : s
              ));
              // Complete draft step quickly and move to review
              setTimeout(() => {
                setSteps(prev => prev.map((s, idx) => 
                  idx === 0 ? { ...s, status: 'completed' } : 
                  idx === 1 ? { ...s, status: 'in_progress' } : s
                ));
                setShowCompose(true);
                pathControls.start({ pathLength: 0.5, transition: { duration: 0.6 } });
              }, 800);
            }, 400);
          }
        }
      }, 200);
    }
  }, [isOpen, actionType, composeDraft]);

  // Update step status externally
  const updateStep = (stepId, status, details = {}) => {
    setSteps(prev => prev.map(s => 
      s.id === stepId ? { ...s, status, ...details } : s
    ));
    
    // Animate path as steps complete
    const completedCount = steps.filter(s => s.status === 'completed').length + (status === 'completed' ? 1 : 0);
    const totalSteps = steps.length;
    const progress = (completedCount + 1) / totalSteps;
    
    pathControls.start({
      pathLength: progress,
      transition: { duration: 0.6, ease: 'easeOut' }
    });
  };

  // Expose update method to parent
  useEffect(() => {
    if (window.agentWorkbenchUpdate) {
      window.agentWorkbenchUpdate.current = updateStep;
    } else {
      window.agentWorkbenchUpdate = { current: updateStep };
    }
  }, []);

  // Handle send button click
  const handleSend = async () => {
    if (!composeDraft?.trim() || composeSending) return;
    
    // Mark review as completed and send as in_progress
    setSteps(prev => prev.map(s => 
      s.id === 'review' ? { ...s, status: 'completed' } :
      s.id === 'send' ? { ...s, status: 'in_progress' } : s
    ));
    pathControls.start({ pathLength: 0.75, transition: { duration: 0.6 } });
    
    // Call parent send handler
    if (onComposeSend) {
      await onComposeSend();
      
      // Mark send as completed and waiting as in_progress
      setSteps(prev => prev.map(s => 
        s.id === 'send' ? { ...s, status: 'completed' } :
        s.id === 'waiting' ? { ...s, status: 'in_progress' } : s
      ));
      pathControls.start({ pathLength: 1, transition: { duration: 0.6 } });
      
      // Close after a moment
      setTimeout(() => {
        if (onActionComplete) onActionComplete();
        onClose();
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10050] bg-black/70 backdrop-blur-sm flex items-start justify-start p-4" style={{ left: 0, top: 0 }}>
      {/* Left Modal - Message Host Workflow */}
      <motion.div
        initial={{ x: -500, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -500, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-[480px] h-[92vh] bg-gradient-to-br from-[#0f1115] via-[#1a1d24] to-[#0f1115] border border-white/10 rounded-[36px] shadow-[0px_0px_39.9px_-4px_hsla(220,50%,50%,0.15)] overflow-hidden flex flex-col relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-400 size-9 shrink-0">
              {workflow.icon}
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="leading-tight tracking-tight text-white line-clamp-1 font-medium text-lg">
                {workflow.title}
              </h3>
              {property && (
                <p className="text-white/60 text-xs">{property.title}</p>
              )}
            </div>
          </div>
          <button 
            className="p-2 rounded-lg hover:bg-white/10 transition-colors" 
            onClick={onClose}
          >
            <svg className="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 pt-6 pb-6">
          <div className="flex flex-col gap-4">
            {/* Main Task Card */}
            <div className="bg-blue-500/10 max-w-md rounded-lg px-4 pb-4 pt-3 border border-blue-500/20">
              <p className="text-white/90 text-sm leading-relaxed">
                {actionType === 'ask_host' && 'Drafting a personalized message to the host about this property.'}
                {actionType === 'request_contact' && 'Requesting contact information from the property host.'}
                {actionType === 'schedule_tour' && 'Scheduling a property viewing with the host.'}
              </p>
            </div>

            {/* Steps Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={stepControls}
              className="bg-[#0f1115] border border-white/10 flex flex-col space-y-2 rounded-2xl p-6 shadow-[0px_0px_39.9px_-4px_hsla(151,33%,33%,0.1)] max-w-md"
            >
              <div className="flex flex-col items-center gap-2 sm:flex-row mb-4">
                <div className="flex flex-1 items-center space-x-2">
                  <div className="inline-flex items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 size-9 shrink-0">
                    {workflow.icon}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h3 className="leading-tight tracking-tight text-white line-clamp-1 font-medium">
                      {workflow.title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Steps with connecting lines */}
              <div className="flex flex-col space-y-0">
                {steps.map((step, index) => (
                  <div key={step.id} className="relative">
                    <div className="relative flex items-center py-3 font-medium">
                      <div className="flex items-center justify-center">
                        <div className="relative flex aspect-square items-center justify-center rounded-full">
                          {/* Step icon */}
                          <motion.div
                            animate={{
                              backgroundColor: step.status === 'completed' 
                                ? 'rgba(34, 197, 94, 0.2)' 
                                : step.status === 'in_progress'
                                ? 'rgba(59, 130, 246, 0.2)'
                                : 'rgba(255, 255, 255, 0.05)',
                              borderColor: step.status === 'completed'
                                ? 'rgba(34, 197, 94, 0.4)'
                                : step.status === 'in_progress'
                                ? 'rgba(59, 130, 246, 0.4)'
                                : 'rgba(255, 255, 255, 0.1)'
                            }}
                            className="grid w-fit place-items-center rounded-full p-1.5 border"
                          >
                            {step.status === 'completed' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="size-5 text-green-400">
                                <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path>
                              </svg>
                            ) : step.status === 'in_progress' ? (
                              <div className="size-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256" className="size-5 text-white/40">
                                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                              </svg>
                            )}
                          </motion.div>
                          
                          {/* Connecting line */}
                          {index < steps.length - 1 && (
                            <div 
                              className="absolute left-3.5 top-full w-0.5"
                              style={{ height: step.status === 'completed' ? '4rem' : '0' }}
                            >
                              <motion.div
                                initial={{ scaleY: 0 }}
                                animate={{ 
                                  scaleY: step.status === 'completed' ? 1 : 0,
                                  backgroundColor: step.status === 'completed' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'
                                }}
                                transition={{ duration: 0.4 }}
                                className="w-full h-full origin-top"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="ml-4 line-clamp-2 text-left text-sm text-white/80">
                        {step.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Right Modal - Your Message Compose */}
      {showCompose && actionType === 'ask_host' && (
        <motion.div
          initial={{ x: 500, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 500, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300, delay: 0.2 }}
          className="absolute left-[520px] w-[420px] h-[92vh] bg-gradient-to-br from-[#0f1115] to-[#1a1d24] border border-white/10 rounded-[36px] shadow-[0px_0px_39.9px_-4px_hsla(220,50%,50%,0.15)] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white leading-tight">Your message</h3>
            <button 
              className="p-2 rounded-lg hover:bg-white/10 transition-colors" 
              onClick={() => {
                setShowCompose(false);
                onClose();
              }}
            >
              <svg className="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-6 pt-4 pb-6">
            <textarea 
              className="w-full min-h-[60vh] bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm leading-relaxed" 
              value={composeDraft || ''} 
              onChange={(e) => onComposeChange?.(e.target.value)}
              placeholder="Type your message to the host..."
            />
          </div>

          {/* Footer Actions */}
          <div className="border-t border-white/10 p-6 pt-4 flex justify-end gap-3">
            <button 
              className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors font-medium text-sm" 
              onClick={() => {
                setShowCompose(false);
                onClose();
              }}
            >
              Cancel
            </button>
            <button 
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-900/30 text-sm" 
              disabled={composeSending || !composeDraft?.trim()} 
              onClick={handleSend}
            >
              {composeSending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Animated connecting line between modals - horizontal curved line */}
      {showCompose && actionType === 'ask_host' && (
        <div 
          className="absolute left-[480px] top-1/2 -translate-y-1/2 pointer-events-none z-[10002]"
          style={{ width: '40px', height: '200px' }}
        >
          <svg 
            width="40" 
            height="200" 
            viewBox="0 0 40 200" 
            className="overflow-visible"
            style={{ transform: 'translateY(-100px)' }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#22c55e" stopOpacity="1" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.4" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Horizontal curved path connecting the two modals */}
            <motion.path
              d="M 0 100 Q 20 80, 40 100"
              stroke="url(#lineGradient)"
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ 
                duration: 1.2, 
                ease: 'easeOut',
                delay: 0.4
              }}
            />
            {/* Animated glowing dot traveling along the path */}
            <motion.circle
              r="3"
              fill="#22c55e"
              filter="url(#glow)"
              initial={{ opacity: 0, x: 0, y: 100 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                x: [0, 20, 40],
                y: [100, 80, 100]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1.0
              }}
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default AgentWorkbenchPanel;

