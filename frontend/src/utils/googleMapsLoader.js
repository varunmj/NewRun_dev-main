// src/utils/googleMapsLoader.js
import { useJsApiLoader } from "@react-google-maps/api";

// Static libraries array to prevent re-creation
const DEFAULT_LIBRARIES = ["places"];

/**
 * Always load the Google Maps script with the Places library, once.
 * Pass extra libraries via the `extra` arg if you ever need more.
 */
export function useGoogleMapsLoader(extra = []) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const libraries = extra.length > 0 ? [...DEFAULT_LIBRARIES, ...extra] : DEFAULT_LIBRARIES;

  const res = useJsApiLoader({
    id: "newrun-google-maps",     // stable id => inject once app-wide
    googleMapsApiKey: apiKey,
    libraries,
    version: "weekly",
    language: "en",
    region: "US",
  });

  if (!apiKey && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn("VITE_GOOGLE_MAPS_API_KEY is missing in your .env");
  }

  // Helpful dev hint if a stale script got injected without places
  if (res.isLoaded && !window.google?.maps?.places && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(
      "Google Maps loaded but 'places' is missing. Hard refresh the page (⌘⇧R / Ctrl+F5)."
    );
  }

  return res; // { isLoaded, loadError }
}
