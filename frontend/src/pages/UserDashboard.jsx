// src/pages/UserDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { MdClose, MdArrowForwardIos, MdMicNone, MdTune } from "react-icons/md";

import Navbar from "../components/Navbar/Navbar";
import AddEditProperty from "../pages/AddEditProperty";
import AddEditItem from "../pages/AddEditItem";
import Toast from "../components/ToastMessage/Toast";
import axiosInstance from "../utils/axiosInstance";

import "../styles/newrun-hero.css";

/* -------------------------- feature flags -------------------------- */
const SHOW_LISTS = false;

/* helpers */
const cx = (...s) => s.filter(Boolean).join(" ");
const fmtMoney = (n) =>
  typeof n === "number" && !Number.isNaN(n) ? `$${n.toLocaleString()}` : null;

/* ============================ HERO ============================ */
function SolveHero({
  firstName,
  value,
  setValue,
  onSubmit,
  onNewProperty,
  onNewItem,
}) {
  return (
    <section className="nr-hero-bg nr-hero-starry">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10">
        <p className="mb-2 text-center text-[11px] tracking-[0.18em] text-white/60 uppercase">
          Limited Beta
        </p>

        <header className="text-center">
          <h1 className="text-[clamp(2.6rem,5vw,4rem)] font-extrabold leading-tight tracking-tight">
            Master campus life in{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              Solve Threads
            </span>
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mx-auto mt-2 max-w-3xl text-white/75">
            Tell NewRun what you need. We’ll scout, message, and organize next
            steps for you.
          </p>
        </header>

        <div className="mx-auto mt-6 max-w-3xl">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2 backdrop-blur">
            <div className="flex items-center justify-between px-2 pb-2 text-white/70">
              <span className="inline-flex items-center gap-1 text-xs">
                <MdTune /> Tools
              </span>
            </div>

            <div className="flex items-center gap-2 px-1 pb-1">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder='Try: "Find me a room near campus under $900 for October"'
                className="flex-1 rounded-xl bg-transparent px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/40"
              />
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/15"
                aria-label="Voice"
                title="Voice"
              >
                <MdMicNone />
              </button>
              <button
                onClick={() => onSubmit?.()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:opacity-95"
              >
                Start solving <MdArrowForwardIos className="text-[14px]" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={onNewProperty}
              className="rounded-lg border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-sm text-white hover:bg-white/[0.12]"
            >
              New property
            </button>
            <button
              onClick={onNewItem}
              className="rounded-lg border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-sm text-white hover:bg-white/[0.12]"
            >
              New item
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-white/70">
          Over 200+ campus requests solved this week.
        </p>
      </div>
    </section>
  );
}

/* ====================== Solve Housing Panel ====================== */
function SolveHousingPanel({ initialText, onCreateProperty, onClose }) {
  const [loading, setLoading] = useState(true);
  const [criteria, setCriteria] = useState(null);
  const [cands, setCands] = useState([]);
  const [plan, setPlan] = useState([]);
  const [threadId, setThreadId] = useState(null);
  // per-property request state: "requesting" | "pending" | "approved" | "self" | "error" | undefined
  const [reqState, setReqState] = useState({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.post("/solve/housing", {
          prompt: initialText || "",
        });
        if (!mounted) return;
        setThreadId(data?.threadId || null);
        setCriteria(data?.criteria || null);
        setCands(Array.isArray(data?.candidates) ? data.candidates : []);
        setPlan(Array.isArray(data?.plan) ? data.plan : []);
      } catch {
        if (mounted) {
          setCands([]);
          setPlan([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [initialText]);

  const requestContact = async (propertyId) => {
    try {
      setReqState((s) => ({ ...s, [propertyId]: "requesting" }));
      const { data } = await axiosInstance.post("/contact-access/request", {
        propertyId,
      });

      // explicit cases from backend
      if (data?.self) {
        setReqState((s) => ({ ...s, [propertyId]: "self" }));
      } else if (data?.approved) {
        setReqState((s) => ({ ...s, [propertyId]: "approved" }));
      } else if (data?.pending || data?.already) {
        setReqState((s) => ({ ...s, [propertyId]: "pending" }));
      } else {
        // generic success
        setReqState((s) => ({ ...s, [propertyId]: "pending" }));
      }
    } catch {
      setReqState((s) => ({ ...s, [propertyId]: "error" }));
    }
  };

  const buttonLabel = (state) => {
    switch (state) {
      case "requesting":
        return "Requesting…";
      case "pending":
        return "Requested";
      case "approved":
        return "Approved";
      case "self":
        return "You own this";
      case "error":
        return "Failed, retry";
      default:
        return "Request contact";
    }
  };

  const isDisabled = (state) =>
    state === "requesting" || state === "pending" || state === "approved" || state === "self";

  return (
    <div className="space-y-5">
      <header>
        <h3 className="text-xl font-semibold">Housing Solve Thread</h3>
        <p className="mt-1 text-sm text-black/70">
          We parsed your request and found matches.
        </p>
      </header>

      {/* Criteria & plan */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-black/[0.03] p-3 text-sm">
          <div className="text-xs font-semibold text-black/60">Criteria</div>
          <ul className="mt-1 list-disc pl-4">
            {typeof criteria?.maxPrice === "number" && (
              <li>Max price: {fmtMoney(criteria.maxPrice)}</li>
            )}
            {criteria?.moveIn && <li>Move-in: {criteria.moveIn}</li>}
            {!!(criteria?.keywords || []).length && (
              <li>Keywords: {(criteria.keywords || []).join(", ")}</li>
            )}
            {criteria?.campus && <li>Campus: {criteria.campus}</li>}
            {typeof criteria?.bedrooms === "number" && (
              <li>Bedrooms: {criteria.bedrooms}+</li>
            )}
            {typeof criteria?.bathrooms === "number" && (
              <li>Bathrooms: {criteria.bathrooms}+</li>
            )}
            {typeof criteria?.distanceMiles === "number" && (
              <li>Within {criteria.distanceMiles} miles</li>
            )}
          </ul>
        </div>
        <div className="rounded-xl border border-black/10 bg-black/[0.03] p-3 text-sm">
          <div className="text-xs font-semibold text-black/60">Plan</div>
          <ul className="mt-1 list-disc pl-4">
            {(plan.length ? plan : [
              "We parsed your request into search criteria.",
              "Here are matching listings — select ones you like.",
              "Tap Request contact to ask owners (uses SafeContact).",
              "We’ll ping you when owners approve.",
            ]).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-black/5" />
          ))}
        </div>
      ) : cands.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-black/[0.03] p-6 text-center text-black/70">
          No matches right now. Try widening your request or{" "}
          <button className="underline" onClick={onCreateProperty}>
            create a request post
          </button>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cands.map((p) => {
            const img =
              Array.isArray(p.images) && p.images[0] ? p.images[0] : "";
            const state = reqState[p._id];
            return (
              <div
                key={p._id}
                className="overflow-hidden rounded-xl border border-black/10 bg-white"
              >
                <div className="aspect-[16/10] w-full bg-black/5">
                  {img ? (
                    <img
                      src={img}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="line-clamp-1 font-semibold">{p.title}</h4>
                    {typeof p.price === "number" && (
                      <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-sm font-medium">
                        {fmtMoney(p.price)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13.5px] text-black/70">
                    {p.address?.street ||
                      p.address ||
                      p.description ||
                      ""}
                  </p>

                  {/* state chip */}
                  {state && (
                    <div
                      className={cx(
                        "mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        state === "approved"
                          ? "bg-emerald-600 text-white"
                          : state === "pending"
                          ? "bg-amber-400 text-black"
                          : state === "self"
                          ? "bg-black text-white"
                          : state === "error"
                          ? "bg-rose-600 text-white"
                          : "bg-black/5 text-black/70"
                      )}
                    >
                      {buttonLabel(state)}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => requestContact(p._id)}
                      disabled={isDisabled(state)}
                      aria-busy={state === "requesting"}
                      className={cx(
                        "rounded-lg px-3 py-1.5 text-sm font-medium",
                        state === "approved"
                          ? "bg-emerald-600 text-white"
                          : state === "pending"
                          ? "bg-amber-500 text-black"
                          : state === "self"
                          ? "bg-black text-white opacity-70"
                          : state === "error"
                          ? "bg-rose-600 text-white"
                          : "bg-black text-white hover:bg-black/90"
                      )}
                    >
                      {buttonLabel(state)}
                    </button>

                    <button
                      onClick={onCreateProperty}
                      className="rounded-lg bg-black/5 px-3 py-1.5 text-sm hover:bg-black/10"
                    >
                      Create request post
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-black/90"
        >
          Done
        </button>
      </div>
    </div>
  );
}

/* ============================ PAGE ============================ */
export default function UserDashboard() {
  const nav = useNavigate();

  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: "add",
    data: null,
    modalType: "",
  });
  const [toast, setToast] = useState({
    isShown: false,
    type: "add",
    message: "",
  });

  const [userInfo, setUserInfo] = useState(null);
  const [solveText, setSolveText] = useState("");

  const fetchUser = async () => {
    try {
      const r = await axiosInstance.get("/get-user");
      return r?.data?.user || null;
    } catch (e) {
      if (e?.response?.status === 401) {
        localStorage.clear();
        nav("/login");
      }
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const u = await fetchUser();
      if (!mounted) return;
      setUserInfo(u);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message, type) =>
    setToast({ isShown: true, message, type });
  const closeToast = () => setToast({ isShown: false, message: "" });

  return (
    <div className="nr-dots-page min-h-screen text-white">
      <Navbar userInfo={userInfo} handleClearSearch={() => {}} />

      <SolveHero
        firstName={userInfo?.firstName}
        value={solveText}
        setValue={setSolveText}
        onSubmit={() =>
          setOpenAddEditModal({
            isShown: true,
            type: "add",
            data: { __solveText: solveText },
            modalType: "solve-housing",
          })
        }
        onNewProperty={() =>
          setOpenAddEditModal({
            isShown: true,
            type: "add",
            data: null,
            modalType: "property",
          })
        }
        onNewItem={() =>
          setOpenAddEditModal({
            isShown: true,
            type: "add",
            data: null,
            modalType: "item",
          })
        }
      />

      {SHOW_LISTS && <div className="mx-auto max-w-7xl px-4 pb-24" />}

      <Modal
        isOpen={openAddEditModal.isShown}
        onRequestClose={() =>
          setOpenAddEditModal({
            isShown: false,
            type: "add",
            data: null,
            modalType: "",
          })
        }
        ariaHideApp={false}
        overlayClassName="fixed inset-0 bg-black/30 backdrop-blur-sm"
        className="mx-auto mt-14 w-[min(960px,92vw)] max-h-[90vh] overflow-auto rounded-2xl border border-white/10 bg-white p-5 text-black shadow-2xl outline-none"
      >
        {openAddEditModal.modalType === "property" && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">New Property</h3>
              <button
                className="grid h-8 w-8 place-items-center rounded-full bg-black/5"
                onClick={() =>
                  setOpenAddEditModal({
                    isShown: false,
                    type: "add",
                    data: null,
                    modalType: "",
                  })
                }
              >
                <MdClose />
              </button>
            </div>
            <AddEditProperty
              type={openAddEditModal.type}
              propertyData={openAddEditModal.data}
              onClose={() =>
                setOpenAddEditModal({
                  isShown: false,
                  type: "add",
                  data: null,
                  modalType: "",
                })
              }
              getAllProperties={async () => {}}
              showToastMessage={(m, t) => showToast(m, t || "add")}
            />
          </>
        )}

        {openAddEditModal.modalType === "item" && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">New Marketplace Item</h3>
              <button
                className="grid h-8 w-8 place-items-center rounded-full bg-black/5"
                onClick={() =>
                  setOpenAddEditModal({
                    isShown: false,
                    type: "add",
                    data: null,
                    modalType: "",
                  })
                }
              >
                <MdClose />
              </button>
            </div>
            <AddEditItem
              type={openAddEditModal.type}
              itemData={openAddEditModal.data}
              onClose={() =>
                setOpenAddEditModal({
                  isShown: false,
                  type: "add",
                  data: null,
                  modalType: "",
                })
              }
              getAllItems={async () => {}}
              showToastMessage={(m, t) => showToast(m, t || "add")}
            />
          </>
        )}

        {openAddEditModal.modalType === "solve-housing" && (
          <SolveHousingPanel
            initialText={openAddEditModal?.data?.__solveText || ""}
            onCreateProperty={() =>
              setOpenAddEditModal({
                isShown: true,
                type: "add",
                data: {
                  title: "Housing Request",
                  description: openAddEditModal?.data?.__solveText || "",
                },
                modalType: "property",
              })
            }
            onClose={() =>
              setOpenAddEditModal({
                isShown: false,
                type: "add",
                data: null,
                modalType: "",
              })
            }
          />
        )}
      </Modal>

      <Toast
        isShown={toast.isShown}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
    </div>
  );
}
