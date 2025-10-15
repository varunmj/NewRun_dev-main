import React, { useEffect } from 'react'
import {LuCheck} from 'react-icons/lu'
import { MdDeleteOutline } from 'react-icons/md'


const Toast = ({isShown,message,type,onClose}) => {


    useEffect(()=>{
        const timeoutId = setTimeout(()=>{
            onClose();
        },3000);
        return () =>{
            clearTimeout(timeoutId);
        };
    }, [onClose]);

    return (
        <div className={`fixed top-6 right-6 z-50 transition-all duration-500 transform ${
            isShown ? "opacity-100 translate-y-0 scale-100": "opacity-0 -translate-y-4 scale-95"
            }`}  
        >
            {/* Magic Bento Container */}
            <div className="relative">
                {/* Outer glow effect */}
                <div className={`absolute inset-0 rounded-2xl blur-xl ${
                    type === "delete" 
                        ? "bg-gradient-to-r from-red-500/30 to-pink-500/30" 
                        : "bg-gradient-to-r from-blue-500/30 to-cyan-500/30"
                }`}></div>
                
                {/* Main container with Magic Bento styling */}
                <div className={`relative min-w-64 max-w-80 rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden ${
                    type === "delete" 
                        ? "border-red-500/20 bg-black/40" 
                        : "border-blue-500/20 bg-black/40"
                }`}>
                    {/* Animated gradient border */}
                    <div className={`absolute inset-0 rounded-2xl ${
                        type === "delete" 
                            ? "bg-gradient-to-r from-red-500/20 via-pink-500/20 to-red-500/20" 
                            : "bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20"
                    } animate-pulse`}></div>
                    
                    {/* Content container */}
                    <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl">
                        <div className='flex items-center gap-4 py-4 px-6'>
                            {/* Icon with Magic Bento effect */}
                            <div className={`relative w-12 h-12 flex items-center justify-center rounded-xl ${
                                type === "delete" 
                                    ? "bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30" 
                                    : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
                            }`}>
                                {/* Inner glow */}
                                <div className={`absolute inset-0 rounded-xl ${
                                    type === "delete" 
                                        ? "bg-gradient-to-br from-red-500/10 to-pink-500/10" 
                                        : "bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
                                }`}></div>
                                
                                {/* Icon */}
                                <div className="relative z-10">
                                    {type === 'delete' ? ( 
                                        <MdDeleteOutline className='text-xl text-red-400' />
                                    ):( 
                                        <LuCheck className="text-xl text-blue-400" />
                                    )}
                                </div>
                            </div>

                            {/* Message with NewRun styling */}
                            <div className="flex-1">
                                <p className='text-sm font-medium text-white/90 leading-relaxed'>
                                    {message}
                                </p>
                            </div>
                        </div>
                        
                        {/* Bottom accent line */}
                        <div className={`h-1 ${
                            type === "delete" 
                                ? "bg-gradient-to-r from-red-500 to-pink-500" 
                                : "bg-gradient-to-r from-blue-500 to-cyan-500"
                        }`}></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Toast