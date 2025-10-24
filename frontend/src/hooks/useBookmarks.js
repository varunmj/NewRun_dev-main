// src/hooks/useBookmarks.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CommunityService from "../services/CommunityService";

export default function useBookmarks(user) {
  const userId = ((user && (user.userId || userId)) || "").toString();
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set());
  const [bookmarkInFlight, setBookmarkInFlight] = useState({});
  const seeded = useRef(false);

  // seed once per user
  useEffect(() => {
    if (!userId) {
      setBookmarkedIds(new Set());
      seeded.current = false;
      return;
    }
    if (seeded.current) return;

    (async () => {
      try {
        const res = await CommunityService.getBookmarks();
        const ids = Array.isArray(res?.bookmarks)
          ? res.bookmarks
              .map((b) => {
                if (typeof b === "string") return b;
                return String(
                  b?.threadId ||
                    b?.thread?._id ||
                    b?.thread?.id ||
                    b?._id ||
                    ""
                );
              })
              .filter(Boolean)
          : [];
        setBookmarkedIds(new Set(ids));
        seeded.current = true;
      } catch (_) {
        setBookmarkedIds(new Set());
        seeded.current = true;
      }
    })();
  }, [userId]);

  const toggleBookmark = useCallback(
    async (rawId, e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();

      const tid = String(rawId || "");
      if (!tid || tid === "undefined" || tid === "null") return;

      if (bookmarkInFlight[tid]) return;
      setBookmarkInFlight((s) => ({ ...s, [tid]: true }));

      const was = bookmarkedIds.has(tid);

      // optimistic flip
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        was ? next.delete(tid) : next.add(tid);
        return next;
      });

      try {
        if (was) {
          await CommunityService.removeBookmark(tid);
        } else {
          await CommunityService.bookmarkThread(tid);
        }
      } catch (err) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || "";
        const idempotentOK =
          (was && (status === 404 || /not\s*bookmarked/i.test(msg))) ||
          (!was && (status === 409 || /already\s*bookmarked/i.test(msg)));

        if (!idempotentOK) {
          // revert
          setBookmarkedIds((prev) => {
            const next = new Set(prev);
            was ? next.add(tid) : next.delete(tid);
            return next;
          });
        }
      } finally {
        setBookmarkInFlight((s) => ({ ...s, [tid]: false }));
      }
    },
    [bookmarkedIds, bookmarkInFlight]
  );

  return useMemo(
    () => ({ bookmarkedIds, bookmarkInFlight, toggleBookmark }),
    [bookmarkedIds, bookmarkInFlight, toggleBookmark]
  );
}
