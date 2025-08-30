// src/pages/UserDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { MdClose, MdArrowForwardIos, MdMicNone, MdTune } from "react-icons/md";

import Navbar from "../components/Navbar/Navbar";
import PropertyCard from "../components/Cards/PropertyCard";
import MarketplaceItemCard from "../components/Cards/MarketplaceItemCard";
import AddEditProperty from "../pages/AddEditProperty";
import AddEditItem from "../pages/AddEditItem";
import Toast from "../components/ToastMessage/Toast";
import EmptyCard from "../components/EmptyCard/EmptyCard";

import AddPropertyImg from "../assets/Images/add-proprty.svg";
import NoDataImg from "../assets/Images/no-data.svg";
import axiosInstance from "../utils/axiosInstance";

import "../styles/newrun-hero.css";

/* helpers */
const cx = (...s) => s.filter(Boolean).join(" ");
const StatChip = ({ children }) => (
  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur">
    {children}
  </span>
);

/* Screenshot-inspired hero */
function SolveHero({ firstName, value, setValue, onSubmit, onNewProperty, onNewItem }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 nr-hero-starry">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f1115] px-6 py-8 shadow-[0_16px_48px_-12px_rgba(0,0,0,.55)]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_400px_at_right_-200px,rgba(99,102,241,0.18),transparent),radial-gradient(800px_320px_at_left_-160px,rgba(59,130,246,0.16),transparent)]" />
        <header className="mb-5 text-center">
          <p className="text-xs tracking-wider text-white/60 uppercase">Limited beta</p>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {`Master campus life in `}
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">Solve Threads</span>
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mx-auto mt-2 max-w-3xl text-white/70">
            Tell NewRun what you need. We’ll scout, message, and organize next steps for you.
          </p>
        </header>

        {/* Big glass input */}
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2 backdrop-blur">
            <div className="flex items-center justify-between px-2 pb-2 text-white/70">
              <span className="inline-flex items-center gap-1 text-xs">
                <MdTune /> Tools
              </span>
              {/* small explicit create buttons instead of a floating + */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onNewProperty}
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15"
                >
                  New property
                </button>
                <button
                  onClick={onNewItem}
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15"
                >
                  New item
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder='Try: "Find me a room near campus under $900 for October"'
                className="flex-1 rounded-xl bg-transparent px-4 py-3 text-[15px] text-white placeholder:text-white/40 outline-none"
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
        </div>

        <div className="mt-4 text-center text-xs text-white/70">Over 200+ campus requests solved this week.</div>
      </div>
    </section>
  );
}

/* Solve Housing panel rendered inside Modal */
function SolveHousingPanel({ initialText, onCreateProperty, onClose }) {
  const [loading, setLoading] = useState(true);
  const [criteria, setCriteria] = useState(null);
  const [cands, setCands] = useState([]);
  const [plan, setPlan] = useState([]);
  const [reqState, setReqState] = useState({}); // propertyId -> state

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.post("/solve/housing", { prompt: initialText || "" });
        if (!mounted) return;
        setCriteria(data?.criteria || null);
        setCands(Array.isArray(data?.candidates) ? data.candidates : []);
        setPlan(Array.isArray(data?.plan) ? data.plan : []);
      } catch {
        setCands([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [initialText]);

  const requestContact = async (propertyId) => {
    try {
      setReqState((s) => ({ ...s, [propertyId]: "requesting" }));
      const { data } = await axiosInstance.post("/contact-access/request", { propertyId });
      if (data?.approved) setReqState((s) => ({ ...s, [propertyId]: "approved" }));
      else if (data?.pending || data?.already) setReqState((s) => ({ ...s, [propertyId]: "pending" }));
      else setReqState((s) => ({ ...s, [propertyId]: "requested" }));
    } catch {
      setReqState((s) => ({ ...s, [propertyId]: "error" }));
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h3 className="text-xl font-semibold">Housing Solve Thread</h3>
        <p className="mt-1 text-sm text-black/70">We parsed your request and found matches.</p>
      </header>

      {/* Criteria & plan */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-black/[0.03] p-3 text-sm">
          <div className="text-xs font-semibold text-black/60">Criteria</div>
          <ul className="mt-1 list-disc pl-4">
            {criteria?.maxPrice && <li>Max price: ${criteria.maxPrice}</li>}
            {criteria?.bedrooms && <li>Bedrooms: {criteria.bedrooms}+</li>}
            {criteria?.bathrooms && <li>Bathrooms: {criteria.bathrooms}+</li>}
            {criteria?.distanceMiles && <li>Within {criteria.distanceMiles} miles</li>}
            {criteria?.moveIn && <li>Move-in: {criteria.moveIn}</li>}
            {!!(criteria?.keywords || []).length && <li>Keywords: {(criteria.keywords || []).join(", ")}</li>}
            {criteria?.campus && <li>Campus: {criteria.campus}</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-black/10 bg-black/[0.03] p-3 text-sm">
          <div className="text-xs font-semibold text-black/60">Plan</div>
          <ul className="mt-1 list-disc pl-4">
            {plan.map((p, i) => <li key={i}>{p}</li>)}
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
          <button className="underline" onClick={onCreateProperty}>create a request post</button>.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cands.map((p) => {
            const img = Array.isArray(p.images) && p.images[0] ? p.images[0] : "";
            const state = reqState[p._id];
            return (
              <div key={p._id} className="overflow-hidden rounded-xl border border-black/10 bg-white">
                <div className="aspect-[16/10] w-full bg-black/5">
                  {img ? <img src={img} alt={p.title} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="line-clamp-1 font-semibold">{p.title}</h4>
                    {typeof p.price === "number" && (
                      <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-sm font-medium">${p.price}</span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13.5px] text-black/70">{p.address || p.description || ""}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => requestContact(p._id)}
                      disabled={state === "pending" || state === "approved" || state === "requesting"}
                      className={cx(
                        "rounded-lg px-3 py-1.5 text-sm font-medium",
                        state === "approved" ? "bg-emerald-600 text-white" :
                        state === "pending" ? "bg-amber-500 text-black" :
                        "bg-black text-white hover:bg-black/90"
                      )}
                    >
                      {state === "approved" ? "Approved" :
                       state === "pending" ? "Requested" :
                       state === "requesting" ? "Requesting…" : "Request contact"}
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
        <button onClick={onClose} className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-black/90">
          Done
        </button>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const nav = useNavigate();

  const [openAddEditModal, setOpenAddEditModal] = useState({ isShown: false, type: "add", data: null, modalType: "" });
  const [toast, setToast] = useState({ isShown: false, type: "add", message: "" });

  const [allProperties, setAllProperties] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [viewMode, setViewMode] = useState("properties");
  const [loading, setLoading] = useState(true);

  // hero input
  const [solveText, setSolveText] = useState("");
  // search
  const [searchQ, setSearchQ] = useState("");

  const pCount = allProperties.length;
  const mCount = allItems.length;

  const fetchProperties = async () => {
    try { const r = await axiosInstance.get("/get-all-property-user"); return r?.data?.properties || []; }
    catch { return []; }
  };
  const fetchItems = async () => {
    try { const r = await axiosInstance.get("/marketplace/items-user"); return r?.data?.items || []; }
    catch { return []; }
  };
  const fetchUser = async () => {
    try { const r = await axiosInstance.get("/get-user"); return r?.data?.user || null; }
    catch (e) {
      if (e?.response?.status === 401) { localStorage.clear(); nav("/login"); }
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [p, i, u] = await Promise.all([fetchProperties(), fetchItems(), fetchUser()]);
      if (!mounted) return;
      setAllProperties(p); setAllItems(i); setUserInfo(u);
      setLoading(false);
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProperties = async () => setAllProperties(await fetchProperties());
  const refreshItems = async () => setAllItems(await fetchItems());
  const showToast = (message, type) => setToast({ isShown: true, message, type });
  const closeToast = () => setToast({ isShown: false, message: "" });

  // search filtering
  const filteredProperties = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return allProperties;
    return allProperties.filter((p) =>
      [p.title, p.address, p.description, p.content].filter(Boolean).some((s) => String(s).toLowerCase().includes(q))
    );
  }, [allProperties, searchQ]);

  const filteredItems = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((it) =>
      [it.title, it.description, it.category].filter(Boolean).some((s) => String(s).toLowerCase().includes(q))
    );
  }, [allItems, searchQ]);

  const showingCount = viewMode === "properties" ? filteredProperties.length : filteredItems.length;
  const totalCount = viewMode === "properties" ? pCount : mCount;

  return (
    <div className="nr-dots-page min-h-screen text-white">
      <Navbar
        userInfo={userInfo}
        handleClearSearch={async () => {
          setSearchQ("");
          await Promise.all([refreshProperties(), refreshItems()]);
        }}
      />

      {/* HERO */}
      <SolveHero
        firstName={userInfo?.firstName}
        value={solveText}
        setValue={setSolveText}
        onSubmit={() =>
          setOpenAddEditModal({ isShown: true, type: "add", data: { __solveText: solveText }, modalType: "solve-housing" })
        }
        onNewProperty={() =>
          setOpenAddEditModal({ isShown: true, type: "add", data: null, modalType: "property" })
        }
        onNewItem={() =>
          setOpenAddEditModal({ isShown: true, type: "add", data: null, modalType: "item" })
        }
      />

      {/* VIEW TOGGLE */}
      <section className="mx-auto mt-6 flex justify-center px-4">
        <div className="inline-flex overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-0.5">
          <button
            onClick={() => setViewMode("properties")}
            className={cx("px-4 py-2 text-sm font-medium transition-colors", viewMode === "properties" ? "rounded-xl bg-white text-black" : "text-white/85 hover:bg-white/10")}
          >
            Properties
          </button>
          <button
            onClick={() => setViewMode("items")}
            className={cx("px-4 py-2 text-sm font-medium transition-colors", viewMode === "items" ? "rounded-xl bg-white text-black" : "text-white/85 hover:bg-white/10")}
          >
            Marketplace
          </button>
        </div>
      </section>

      {/* Sticky search */}
      <section className="sticky top-[68px] z-10 mx-auto mt-4 max-w-7xl px-4">
        <div className="rounded-2xl border border-white/10 bg-[#0f1115]/80 p-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">⌕</span>
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={`Search your ${viewMode === "properties" ? "properties" : "items"}…`}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] pl-8 pr-9 py-2 text-sm outline-none placeholder:text-white/40 focus:border-sky-500"
              />
              {searchQ && (
                <button onClick={() => setSearchQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/15">
                  Clear
                </button>
              )}
            </div>
            <div className="hidden text-xs text-white/60 md:block">
              Showing <b>{showingCount}</b> of {totalCount}
            </div>
          </div>
        </div>
      </section>

      {/* GRID */}
      <main className="container mx-auto mt-8 px-4 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-3xl bg-white/[0.06]" />
            ))}
          </div>
        ) : viewMode === "properties" ? (
          filteredProperties.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProperties.map((p) => (
                <PropertyCard
                  key={p._id}
                  _id={p._id}
                  title={p.title}
                  date={p.createdOn}
                  content={p.content}
                  tags={p.tags}
                  isPinned={p.isPinned}
                  price={p.price}
                  bedrooms={p.bedrooms}
                  bathrooms={p.bathrooms}
                  distanceFromUniversity={p.distanceFromUniversity}
                  address={p.address}
                  availabilityStatus={p.availabilityStatus}
                  description={p.description}
                  isFeatured={p.isFeatured}
                  onEdit={() => setOpenAddEditModal({ isShown: true, type: "edit", data: p, modalType: "property" })}
                  onDelete={async () => { await axiosInstance.delete(`/delete-property/${p._id}`); await refreshProperties(); setToast({ isShown:true, type:"delete", message:"Property Deleted Successfully"}); }}
                />
              ))}
            </div>
          ) : (
            <EmptyCard imgSrc={searchQ ? NoDataImg : AddPropertyImg} message={searchQ ? "No properties match your search." : "No properties. Add one to get started."} />
          )
        ) : filteredItems.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((it) => (
              <MarketplaceItemCard
                key={it._id}
                item={it}
                onClick={() => setOpenAddEditModal({ isShown: true, type: "edit", data: it, modalType: "item" })}
              />
            ))}
          </div>
        ) : (
          <EmptyCard imgSrc={searchQ ? NoDataImg : AddPropertyImg} message={searchQ ? "No items match your search." : "No items. Add one to get started."} />
        )}
      </main>

      {/* Main modal */}
      <Modal
        isOpen={openAddEditModal.isShown}
        onRequestClose={() => setOpenAddEditModal({ isShown: false, type: "add", data: null, modalType: "" })}
        ariaHideApp={false}
        overlayClassName="fixed inset-0 bg-black/30 backdrop-blur-sm"
        className="w-[min(760px,92vw)] max-h-[88vh] overflow-auto rounded-2xl border border-white/10 bg-white p-5 text-black shadow-2xl outline-none mx-auto mt-14"
      >
        {openAddEditModal.modalType === "property" && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">New Property</h3>
              <button className="grid h-8 w-8 place-items-center rounded-full bg-black/5" onClick={() => setOpenAddEditModal({ isShown: false, type: "add", data: null, modalType: "" })}>
                <MdClose />
              </button>
            </div>
            <AddEditProperty
              type={openAddEditModal.type}
              propertyData={openAddEditModal.data}
              onClose={() => setOpenAddEditModal({ isShown: false, type: "add", data: null, modalType: "" })}
              getAllProperties={async () => await refreshProperties()}
              showToastMessage={(m,t)=>setToast({ isShown:true, type:t||"add", message:m })}
            />
          </>
        )}

        {openAddEditModal.modalType === "item" && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">New Marketplace Item</h3>
              <button className="grid h-8 w-8 place-items-center rounded-full bg-black/5" onClick={() => setOpenAddEditModal({ isShown: false, type: "add", data: null, modalType: "" })}>
                <MdClose />
              </button>
            </div>
            <AddEditItem
              type={openAddEditModal.type}
              itemData={openAddEditModal.data}
              onClose={() => setOpenAddEditModal({ isShown: false, type: "add", data: null, modalType: "" })}
              getAllItems={async () => await refreshItems()}
              showToastMessage={(m,t)=>setToast({ isShown:true, type:t||"add", message:m })}
            />
          </>
        )}

        {openAddEditModal.modalType === "solve-housing" && (
          <SolveHousingPanel
            initialText={openAddEditModal?.data?.__solveText || ""}
            onCreateProperty={() => setOpenAddEditModal({
              isShown: true, type: "add",
              data: { title: "Housing Request", description: openAddEditModal?.data?.__solveText || "" },
              modalType: "property",
            })}
            onClose={() => setOpenAddEditModal({ isShown: false, type: "add", data: null, modalType: "" })}
          />
        )}
      </Modal>

      {/* Toast */}
      <Toast isShown={toast.isShown} message={toast.message} type={toast.type} onClose={closeToast} />
    </div>
  );
}
