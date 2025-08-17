// src/utils/googleMapsLoader.js
import { useJsApiLoader } from "@react-google-maps/api";

export function useGoogleMapsLoader(extraLibraries = []) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  // Always include "places", merge any extras, and dedupe
  const libraries = Array.from(new Set(["places", ...extraLibraries]));

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-maps-script",
    googleMapsApiKey: apiKey,
    libraries,
    version: "weekly",
    language: "en",
    region: "US",
  });

  if (!apiKey && import.meta.env.DEV) {
    console.warn("VITE_GOOGLE_MAPS_API_KEY is missing. Add it to your .env");
  }

  return { isLoaded, loadError };
}
