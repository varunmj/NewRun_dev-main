// src/lib/propertiesApi.js
import axiosInstance from "../utils/axiosInstance";

/**
 * Fetch a page of properties (cursor-based).
 * @param {Object} params
 * @returns {Promise<{items: any[], nextCursor: string|null}>}
 */
export async function fetchProperties(params = {}) {
  const res = await axiosInstance.get("/v2/properties", { params });
  return res.data;
}
