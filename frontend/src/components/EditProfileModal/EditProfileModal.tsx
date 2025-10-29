import React, { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
// @ts-ignore
import Toast from "../ToastMessage/Toast";
// @ts-ignore
import axiosInstance from "../../utils/axiosInstance";
// @ts-ignore
import { useGoogleMapsLoader } from "../../utils/googleMapsLoader";
import { Autocomplete } from "@react-google-maps/api";
// @ts-ignore
import ProfilePictureUpload from "../ProfilePictureUpload/ProfilePictureUpload";
import { ProfileSchema } from "../../schemas/profileSchema";
import type { ProfileValues } from "../../schemas/profileSchema";
import {
  MdClose,
  MdEdit,
  MdCheckCircle,
  MdSave,
  MdPhotoCamera,
  MdPerson,
  MdSchool,
} from "react-icons/md";

// Date helper functions for proper date handling
function toDateInputValue(raw?: string | Date | null): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  // Make it date-only in local time to avoid TZ shifts
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ensureDateOnlyString(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v; // already good
  return toDateInputValue(v) || null;
}

function EditProfileModal({ open, onClose, initialUser, onSaved }: {
  open: boolean;
  onClose: () => void;
  initialUser: any;
  onSaved?: (updatedUser?: any) => void;
}) {
  const { isLoaded } = useGoogleMapsLoader();
  const acRef = useRef<any>(null);
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toast, setToast] = useState({ isShown: false, message: "", type: "success" });
  const [currentAvatar, setCurrentAvatar] = useState(initialUser?.avatar || "");

  // Parse cohortTerm to extract season and year
  function splitCohort(term?: string) {
    const m = term?.match(/^\s*(Spring|Summer|Fall)\s+(\d{4})\s*$/i);
    return m ? { season: m[1], year: m[2] } : { season: "", year: "" };
  }

  // Generate year options for cohort year
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      years.push(year.toString());
    }
    return years;
  }, []);

  // Server-allowed fields with proper typing
  const ALLOWED_FIELDS = new Set<keyof ProfileValues | "username" | "cohortTerm" | "campusLabel" | "campusPlaceId" | "campusDisplayName">([
    "firstName","lastName","username","avatar",
    "currentLocation","hometown","birthday",
    "university","graduationDate",
    "schoolDepartment","cohortTerm",
    "campusLabel","campusPlaceId","campusDisplayName",
  ]);

  // Maps RHF partial -> API payload; returns {} if nothing to send
  function mapToApiPayload(partial: Partial<ProfileValues>, getValues: () => ProfileValues) {
    const out: Record<string, any> = {};

    // combine cohortSeason/year → cohortTerm (only when both exist)
    if ("cohortSeason" in partial || "cohortYear" in partial) {
      const season = partial.cohortSeason ?? getValues().cohortSeason;
      const year   = partial.cohortYear   ?? getValues().cohortYear;
      if (season && year) out.cohortTerm = `${season} ${year}`;
    }

    // copy allowed fields
    for (const [k, v] of Object.entries(partial)) {
      if (!ALLOWED_FIELDS.has(k as any)) continue;
      if (k === "birthday") {
        out.birthday = ensureDateOnlyString(v);
      } else {
        out[k] = v;
      }
    }

    return out;
  }

  // Parse cohortTerm to get season and year for form defaults
  const { season, year } = splitCohort(initialUser?.cohortTerm);

  // Extract onboarding data and map to profile fields
  const getOnboardingData = (user: any) => {
    const onboarding = user?.onboardingData || {};
    return {
      // All fields are now directly available from the consolidated onboardingData
      academicLevel: onboarding.academicLevel,
      currentSituation: onboarding.currentSituation,
      usStatus: onboarding.usStatus,
      usEntryDate: onboarding.usEntryDate,
      intake: onboarding.intake,
      visaStatus: onboarding.visaStatus,
      city: onboarding.city,
      budgetRange: onboarding.budgetRange,
      housingNeed: onboarding.housingNeed,
      essentials: onboarding.essentials,
      focus: onboarding.focus,
      birthday: onboarding.birthday,
      university: onboarding.university,
      major: onboarding.major,
      graduationDate: onboarding.graduationDate,
      arrivalDate: onboarding.arrivalDate,
      roommateInterest: onboarding.roommateInterest,
      completed: onboarding.completed,
      completedAt: onboarding.completedAt,
    };
  };

  // Extract synapse data for lifestyle preferences
  const getSynapseData = (user: any) => {
    const synapse = user?.synapse || {};
    return {
      culture: synapse.culture || {},
      logistics: synapse.logistics || {},
      lifestyle: synapse.lifestyle || {},
      habits: synapse.habits || {},
      pets: synapse.pets || {},
      dealbreakers: synapse.dealbreakers || [],
    };
  };

  const onboardingData = getOnboardingData(initialUser);
  const synapseData = getSynapseData(initialUser);



  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors, isDirty },
    reset,
    setValue,
  } = useForm<ProfileValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      firstName: initialUser?.firstName || "",
      lastName: initialUser?.lastName || "",
      // Data priority: onboardingData (most recent) > initialUser (existing) > synapse (lifestyle)
      currentLocation: onboardingData?.city || initialUser?.currentLocation || "",
      hometown: initialUser?.hometown || "",
      birthday: toDateInputValue(onboardingData?.birthday || initialUser?.birthday), // Convert to YYYY-MM-DD format
      graduationDate: toDateInputValue(onboardingData?.graduationDate || initialUser?.graduationDate) || "",
      university: onboardingData?.university || initialUser?.university || "",
      schoolDepartment: initialUser?.schoolDepartment || "",
      campusDisplayName: initialUser?.campusDisplayName || "",
      campusPlaceId: initialUser?.campusPlaceId || "",
      cohortSeason: initialUser?.cohortSeason ?? season,
      cohortYear: initialUser?.cohortYear ?? year,
      avatar: initialUser?.avatar || "",
    },
  });

  // Autosave mutation
  const autosaveMutation = useMutation({
    mutationFn: (data: Record<string, any>) => axiosInstance.patch("/user/update", data),
    onSuccess: (response) => {
      setToast({ isShown: true, message: "Changes saved automatically", type: "success" });
      // Pass updated user data to onSaved callback for autosave
      const updatedUser = (response as any).data?.user || (response as any).data;
      if (updatedUser) {
        onSaved?.(updatedUser);
      }
    },
    onError: (e) => { 
      console.error(e); 
      setToast({ isShown: true, message: "Failed to save changes", type: "error" }); 
    },
  });

  // Debounced autosave
  const debouncedAutosave = useMemo(() => {
    let t: ReturnType<typeof setTimeout>;
    return (apiPayload: Record<string, any>) => {
      clearTimeout(t);
      if (!Object.keys(apiPayload).length) return; // nothing valid → skip
      t = setTimeout(() => autosaveMutation.mutate(apiPayload), 500);
    };
  }, [autosaveMutation]);

  // Watch for changes and autosave
  useEffect(() => {
    const sub = watch((value, { name, type }) => {
      if (type !== "change" || !name) return;
      setHasUnsavedChanges(true);
      
      // If campusDisplayName changes manually (not from autocomplete), try to geocode it
      if (name === "campusDisplayName" && isLoaded && typeof window !== "undefined" && window.google) {
        const campusDisplayName = (value as any).campusDisplayName;
        
        // Clear any pending geocode timeout
        if (geocodeTimeoutRef.current) {
          clearTimeout(geocodeTimeoutRef.current);
          geocodeTimeoutRef.current = null;
        }
        
        if (campusDisplayName && campusDisplayName.length > 3) {
          // Debounce geocoding to avoid too many API calls (wait 1 second after user stops typing)
          geocodeTimeoutRef.current = setTimeout(() => {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ address: campusDisplayName }, (results, status) => {
              if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
                const result = results[0];
                // Update placeId if we found a match
                if (result.place_id) {
                  setValue("campusPlaceId", result.place_id, { shouldDirty: true, shouldValidate: true });
                  setValue("campusLabel", result.formatted_address || campusDisplayName, { shouldDirty: true, shouldValidate: true });
                  
                  if (import.meta.env.DEV) {
                    console.log('📍 Campus geocoded automatically:', {
                      placeId: result.place_id,
                      address: result.formatted_address
                    });
                  }
                  
                  // Explicitly save campusPlaceId and campusLabel to DB
                  const campusPayload = mapToApiPayload({
                    campusPlaceId: result.place_id,
                    campusLabel: result.formatted_address || campusDisplayName,
                    campusDisplayName: campusDisplayName
                  }, () => getValues());
                  
                  if (Object.keys(campusPayload).length > 0) {
                    if (import.meta.env.DEV) {
                      console.log('💾 Autosaving campus location data:', campusPayload);
                    }
                    debouncedAutosave(campusPayload);
                  }
                }
              }
            });
            geocodeTimeoutRef.current = null;
          }, 1000);
        }
      }
      
      const partial = { [name]: (value as any)[name] };
      const apiPayload = mapToApiPayload(partial, () => getValues());
      debouncedAutosave(apiPayload);
    });
    
    // Cleanup function to clear timeout on unmount
    return () => {
      sub.unsubscribe();
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
        geocodeTimeoutRef.current = null;
      }
    };
  }, [watch, debouncedAutosave, isLoaded, setValue, getValues, mapToApiPayload]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "s") {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
      if (e.key === "Escape") {
        if (hasUnsavedChanges) {
          if (confirm("You have unsaved changes. Are you sure you want to close?")) {
            onClose();
          }
        } else {
          onClose();
        }
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, hasUnsavedChanges, onClose]);

  const onPlaceChanged = () => {
    if (acRef.current !== null) {
      const place = acRef.current.getPlace();
      if (place && place.place_id) {
        const campusDisplayName = place.name || place.formatted_address || "";
        const campusLabel = place.formatted_address || place.name || "";
        const campusPlaceId = place.place_id;
        
        // Set all campus-related fields when a place is selected
        setValue("campusPlaceId", campusPlaceId, { shouldDirty: true, shouldValidate: true });
        setValue("campusDisplayName", campusDisplayName, { shouldDirty: true, shouldValidate: true });
        setValue("campusLabel", campusLabel, { shouldDirty: true, shouldValidate: true });
        
        // Trigger form change detection
        setHasUnsavedChanges(true);
        
        // Immediately save campus data to DB
        const campusPayload = mapToApiPayload({
          campusPlaceId: campusPlaceId,
          campusDisplayName: campusDisplayName,
          campusLabel: campusLabel
        }, () => getValues());
        
        if (Object.keys(campusPayload).length > 0) {
          if (import.meta.env.DEV) {
            console.log('📍 Campus selected and saving:', {
              placeId: campusPlaceId,
              name: campusDisplayName,
              formattedAddress: campusLabel,
              payload: campusPayload
            });
          }
          // Use autosave but with shorter delay since user explicitly selected this
          debouncedAutosave(campusPayload);
        }
      }
    }
  };

  const onSubmit = async (form: ProfileValues) => {
    try {
      // build from full form (so cohortTerm is included if both set)
      const apiPayload = mapToApiPayload(form, () => form);
      // remove client-only extras
      delete (apiPayload as any).bio;
      delete (apiPayload as any).interests;
      delete (apiPayload as any).phone;

      if (!Object.keys(apiPayload).length) {
        setToast({ isShown: true, message: "Nothing to update", type: "success" });
        onClose();
        return;
      }

      const response = await axiosInstance.patch("/user/update", apiPayload);
      setToast({ isShown: true, message: "Profile updated successfully!", type: "success" });
      
      // Pass the updated user data to the onSaved callback
      const updatedUser = (response as any).data?.user || (response as any).data;
      if (updatedUser) {
        onSaved?.(updatedUser);
      }
      
      // Dispatch custom event to notify other components (like PropertyDetails) that profile was updated
      window.dispatchEvent(new CustomEvent('profile_updated', { detail: updatedUser }));
      
      // Also set localStorage flag for cross-tab updates
      localStorage.setItem('profile_updated', Date.now().toString());
      
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      setToast({ isShown: true, message: "Failed to update profile", type: "error" });
    }
  };

  const fullName = (user: any) => {
    if (!user) return "";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setCurrentAvatar(newAvatarUrl);
    setValue("avatar", newAvatarUrl);
    setToast({ isShown: true, message: "Profile picture updated!", type: "success" });
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await axiosInstance.post('/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if ((response as any).data.avatarUrl) {
        handleAvatarUpdate((response as any).data.avatarUrl);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setToast({ isShown: true, message: "Failed to upload photo", type: "error" });
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] bg-black rounded-xl shadow-xl overflow-hidden z-[61] flex flex-col">
          <Dialog.Title className="sr-only">Edit Profile</Dialog.Title>
          <Dialog.Description className="sr-only">Edit your profile information and settings</Dialog.Description>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col flex-1 min-h-0"
          >
            {/* Header with Banner */}
            <div className="relative">
              {/* Banner Background */}
              <div className="h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
              
              {/* Profile Picture Overlay */}
              <div className="absolute -bottom-8 left-6">
                <div className="relative">
                  <img
                    src={currentAvatar || '/default-avatar.png'}
                    alt="Profile"
                    className="w-16 h-16 rounded-full border-4 border-white object-cover"
                  />
                  {currentAvatar && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Close Button */}
              <Dialog.Close className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
                <MdClose className="h-5 w-5" />
              </Dialog.Close>
            </div>
            
            {/* Content */}
            <div className="pt-12 pb-6 flex-1 overflow-y-auto min-h-0">
              {/* User Info Header */}
              <div className="px-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{fullName(initialUser)}</h2>
                    <p className="text-sm text-gray-400">@{initialUser?.firstName?.toLowerCase() || 'user'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        // Trigger file input for photo upload
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*';
                        fileInput.onchange = (e) => {
                          const target = e.target as HTMLInputElement;
                          const file = target.files?.[0];
                          if (file) {
                            // Handle photo upload
                            handlePhotoUpload(file);
                          }
                        };
                        fileInput.click();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      <MdPhotoCamera className="w-4 h-4" />
                      Change Photo
                    </button>
                    <button 
                      onClick={() => {
                        // Handle banner edit
                        setToast({ isShown: true, message: "Banner editing coming soon!", type: "success" });
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0F1115]/95 border border-white/10 rounded-lg shadow-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      <MdEdit className="w-4 h-4" />
                      Edit Banner
                    </button>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="px-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <MdPerson className="w-4 h-4 text-blue-400" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">First name</label>
                      <input
                        {...register("firstName")}
                        className="w-full rounded-lg border border-white/10 bg-[#0F1115]/95 px-3 py-2 text-sm text-white placeholder-white/60 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Enter your first name"
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Last name</label>
                      <input
                        {...register("lastName")}
                        className="w-full rounded-lg border border-white/10 bg-[#0F1115]/95 px-3 py-2 text-sm text-white placeholder-white/60 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Enter your last name"
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-200 mb-1">Current location</label>
                      <input
                        {...register("currentLocation")}
                        className="w-full rounded-lg border border-white/10 bg-[#0F1115]/95 px-3 py-2 text-sm text-white placeholder-white/60 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="City, State (optional)"
                      />
                    </div>
                      <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-200 mb-1">Hometown</label>
                      <input
                        {...register("hometown")}
                        className="w-full rounded-lg border border-white/10 bg-[#0F1115]/95 px-3 py-2 text-sm text-white placeholder-white/60 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Hometown (optional)"
                      />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Birthday</label>
                      <input
                        type="date"
                        {...register("birthday")}
                        className="w-full rounded-lg border border-white/10 bg-[#0F1115]/95 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      {errors.birthday && (
                        <p className="mt-1 text-sm text-red-600">{errors.birthday.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Graduation date</label>
                      <input
                        {...register("graduationDate")}
                        className="w-full rounded-lg border border-white/10 bg-[#0F1115]/95 px-3 py-2 text-sm text-white placeholder-white/60 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g., May 2026"
                      />
                    </div>
                  </div>
                </div>

                {/* University Information */}
                <div>
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <MdSchool className="w-4 h-4 text-blue-400" />
                    University Information
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">Used for routing & distance on properties</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
                        University name
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </label>
                      <div className="relative group">
                        <input
                          {...register("university")}
                          disabled={true}
                          className="w-full rounded-lg border border-white/10 bg-[#0F1115]/50 px-3 py-2 text-sm text-white/50 placeholder-white/30 cursor-not-allowed opacity-70"
                          placeholder="e.g., Northern Illinois University"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500/60">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 border border-white/20 rounded-lg px-3 py-2 text-xs text-white/80 whitespace-nowrap z-10">
                          Set during onboarding - cannot be changed manually
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">School / Department</label>
                      <input
                        {...register("schoolDepartment")}
                        className="w-full rounded-lg border border-white/10 bg-[#0F1115]/95 px-3 py-2 text-sm text-white placeholder-white/60 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g., College of Business"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Campus</label>
                      {isLoaded ? (
                        <Autocomplete
                          onLoad={(ac: any) => (acRef.current = ac)}
                          onPlaceChanged={onPlaceChanged}
                          options={{ fields: ["place_id", "name", "formatted_address"], componentRestrictions: { country: "us" } }}
                        >
                          <input
                            {...register("campusDisplayName")}
                            className="w-full rounded-lg border border-white/10 bg-[#0F1115]/95 px-3 py-2 text-sm text-white placeholder-white/60 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Search for building..."
                          />
                        </Autocomplete>
                      ) : (
                        <input
                          disabled
                          {...register("campusDisplayName")}
                          className="w-full cursor-not-allowed rounded-lg border border-white/10 px-3 py-2 text-sm text-white placeholder-white/60 bg-[#0F1115]/95"
                          placeholder="Loading Google…"
                        />
                      )}
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-200 mb-1">Cohort Season</label>
                      <select
                        {...register("cohortSeason")}
                          className="w-full rounded-lg border border-white/10 bg-[#0F1115]/95 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Select Season</option>
                        <option value="Spring">Spring</option>
                        <option value="Summer">Summer</option>
                        <option value="Fall">Fall</option>
                      </select>
                    </div>
                      <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-200 mb-1">Cohort Year</label>
                      <select
                        {...register("cohortYear")}
                          className="w-full rounded-lg border border-white/10 bg-[#0F1115]/95 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">Select Year</option>
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-500">
                        Stored as: {watch("cohortSeason")} {watch("cohortYear")}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Onboarding Information */}
                {onboardingData && (
                  <div className="mt-8">
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                      <MdSchool className="w-4 h-4 text-blue-400" />
                      Onboarding Information
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Row 1: Academic Level + Current Situation */}
                      {onboardingData.academicLevel && (
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
                            Academic Level
                            <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            {onboardingData.academicLevel.charAt(0).toUpperCase() + onboardingData.academicLevel.slice(1)}
                          </div>
                        </div>
                      )}
                      {onboardingData.currentSituation && (
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
                            Current Situation
                            <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            {onboardingData.currentSituation.charAt(0).toUpperCase() + onboardingData.currentSituation.slice(1)}
                          </div>
                        </div>
                      )}
                      {/* Row 2: University + Major (Major gets full width due to long text) */}
                      {onboardingData.university && (
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">University</label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            {onboardingData.university}
                          </div>
                        </div>
                      )}
                      {onboardingData.major && (
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-200 mb-1">Major</label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            {onboardingData.major}
                          </div>
                        </div>
                      )}
                      {/* Row 3: Intake/Semester + Graduation Date */}
                      {onboardingData.intake && (
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">Intake/Semester</label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            {onboardingData.intake.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </div>
                        </div>
                      )}
                      {onboardingData.graduationDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">Graduation Date</label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            {new Date(onboardingData.graduationDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Visa Information */}
                      {/* Row 4: US Status + Visa Status */}
                      {onboardingData.usStatus && (
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">US Status</label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            {onboardingData.usStatus === 'in_us' ? 'Currently in the US' : 'Coming to the US'}
                          </div>
                        </div>
                      )}
                      {onboardingData.visaStatus && (
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
                            Visa Status
                            <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            {onboardingData.visaStatus === 'F1' ? 'F1 Student Visa' :
                             onboardingData.visaStatus === 'CPT' ? 'CPT (F-1)' :
                             onboardingData.visaStatus === 'OPT_STEM' ? 'OPT / STEM-OPT (F-1)' :
                             onboardingData.visaStatus === 'H1B' ? 'H1B Work Visa' :
                             onboardingData.visaStatus === 'citizen' ? 'US Citizen/Green Card' :
                             onboardingData.visaStatus}
                          </div>
                        </div>
                      )}
                      {/* Row 5: US Entry Date + Arrival Date */}
                      {onboardingData.usEntryDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">US Entry Date</label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            {new Date(onboardingData.usEntryDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      )}
                      {onboardingData.arrivalDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">Arrival Date</label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            {new Date(onboardingData.arrivalDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Location and Budget */}
                      {/* Row 6: City + Budget Range */}
                      {onboardingData.city && (
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">City</label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            {onboardingData.city}
                          </div>
                        </div>
                      )}
                      {onboardingData.budgetRange && (onboardingData.budgetRange.min || onboardingData.budgetRange.max) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">Budget Range</label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            ${onboardingData.budgetRange.min || 0} - ${onboardingData.budgetRange.max || 'No limit'}
                          </div>
                        </div>
                      )}
                      {onboardingData.housingNeed && (
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">Housing Need</label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            {onboardingData.housingNeed}
                          </div>
                        </div>
                      )}
                      {onboardingData.roommateInterest !== null && (
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">Roommate Interest</label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            {onboardingData.roommateInterest ? 'Yes' : 'No'}
                          </div>
                        </div>
                      )}
                      
                      {/* Status Information */}
                      {/* Row 7: Onboarding Status + Completed At */}
                      {onboardingData.completed && (
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">Onboarding Status</label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Completed
                            </span>
                          </div>
                        </div>
                      )}
                      {onboardingData.completedAt && (
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-1">Completed At</label>
                          <div className="w-full rounded-lg border border-gray-600/50 px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-not-allowed">
                            {new Date(onboardingData.completedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Tags */}
                      {onboardingData.essentials && onboardingData.essentials.length > 0 && (
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-white mb-2">Essentials</label>
                          <div className="flex flex-wrap gap-1.5">
                            {onboardingData.essentials.map((essential: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-300 shadow-sm"
                              >
                                {essential.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {onboardingData.focus && onboardingData.focus.length > 0 && (
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-white mb-2">Focus Areas</label>
                          <div className="flex flex-wrap gap-1.5">
                            {onboardingData.focus.map((focus: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1.5 rounded-md border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-300 shadow-sm"
                              >
                                {focus}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div className="mt-8">
                  <h3 className="text-base font-semibold text-white mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Bio</label>
                      <textarea
                        {...register("bio")}
                        rows={3}
                        className="w-full rounded-lg border border-white/10 bg-[#0F1115]/95 px-3 py-2 text-sm text-white placeholder-white/60 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Interests</label>
                      <input
                        {...register("interests")}
                        className="w-full rounded-lg border border-white/10 bg-[#0F1115]/95 px-3 py-2 text-sm text-white placeholder-white/60 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g., Sports, Music, Travel"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Phone Number</label>
                      <input
                        {...register("phone")}
                        className="w-full rounded-lg border border-white/10 bg-[#0F1115]/95 px-3 py-2 text-sm text-white placeholder-white/60 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>
          </motion.div>
          
          {/* Action Buttons - Fixed at bottom, outside motion.div */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#0F1115]/95 border-t border-white/10 rounded-b-xl flex-shrink-0">
              <div className="text-sm text-gray-400">
                {errors.birthday && (
                  <p className="text-red-400">{errors.birthday.message}</p>
                )}
                {!errors.birthday && (
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Profile will be saved automatically as you type
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Dialog.Close className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0F1115]/95 border border-white/10 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
                  <MdClose className="w-4 h-4" />
                  Cancel
                </Dialog.Close>
                <button
                  type="submit"
                  form="profile-form"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                >
                  <MdSave className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      
      {/* Toast Notification - Rendered at document body level */}
      {toast.isShown && createPortal(
        <Toast
          isShown={toast.isShown}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ isShown: false, message: "", type: "success" })}
        />,
        document.body
      )}
    </Dialog.Root>
  );
}

export default EditProfileModal;
