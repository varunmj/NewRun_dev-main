// src/pages/UserDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import { MdAdd, MdClose } from "react-icons/md";

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

import "../styles/newrun-hero.css"; // same background style used in Marketplace

/* ------------------------------ helpers ------------------------------ */
function classNames(...s) {
  return s.filter(Boolean).join(" ");
}

function StatChip({ children }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur">
      {children}
    </span>
  );
}

/* Glassy quick-create sheet (no NextUI) */
function CreateSheet({ open, onClose, onChoose }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-[#0f1115]/80 p-4 shadow-[0_20px_60px_-12px_rgba(0,0,0,.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Create</h3>
          <button
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/15"
            onClick={onClose}
          >
            <MdClose />
          </button>
        </div>

        <div className="grid gap-2">
          <button
            onClick={() => onChoose("property")}
            className="rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-left text-sm text-white hover:bg-white/[0.12]"
          >
            Property Listing
            <div className="mt-0.5 text-[12px] text-white/60">
              Add a place for rent/sublet with photos & details.
            </div>
          </button>
          <button
            onClick={() => onChoose("item")}
            className="rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-left text-sm text-white hover:bg-white/[0.12]"
          >
            Marketplace Item
            <div className="mt-0.5 text-[12px] text-white/60">
              Sell a campus essential with images and price.
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* =============================== Page =============================== */
const UserDashboard = () => {
  const nav = useNavigate();

  // modal for actual create/edit
  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: "add",
    data: null,
    modalType: "", // 'property' | 'item'
  });

  // sheet under + button
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  // toast
  const [showToastMsg, setShowToastMsg] = useState({
    isShown: false,
    type: "add",
    message: "",
  });

  // data
  const [allProperties, setAllProperties] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [isSearch, setIsSearch] = useState(false);
  const [viewMode, setViewMode] = useState("properties");

  const pCount = allProperties.length;
  const mCount = allItems.length;

  // ---------- API calls ----------
  const getUserInfo = async () => {
    try {
      const r = await axiosInstance.get("/get-user");
      if (r?.data?.user) setUserInfo(r.data.user);
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.clear();
        nav("/login");
      }
    }
  };

  const getAllProperties = async () => {
    try {
      const r = await axiosInstance.get("/get-all-property-user");
      setAllProperties(r?.data?.properties || []);
    } catch {
      setAllProperties([]);
    }
  };

  const getAllItems = async () => {
    try {
      const r = await axiosInstance.get("/marketplace/items-user");
      setAllItems(r?.data?.items || []);
    } catch {
      setAllItems([]);
    }
  };

  const deleteProperty = async (data) => {
    const id = data._id;
    try {
      const r = await axiosInstance.delete(`/delete-property/${id}`);
      if (r?.data && !r.data.error) {
        showToast("Property Deleted Successfully", "delete");
        getAllProperties();
      }
    } catch {}
  };

  const deleteItem = async (data) => {
    const id = data._id;
    try {
      const r = await axiosInstance.delete(`/marketplace/item/${id}`);
      if (r?.data && !r.data.error) {
        showToast("Marketplace Item Deleted Successfully", "delete");
        getAllItems();
      }
    } catch {}
  };

  useEffect(() => {
    getAllProperties();
    getAllItems();
    getUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message, type) =>
    setShowToastMsg({ isShown: true, message, type });

  const handleCloseToast = () =>
    setShowToastMsg({ isShown: false, message: "" });

  const handleClearSearch = () => {
    setIsSearch(false);
    getAllProperties();
    getAllItems();
  };

  const handleEdit = (details, modalType) => {
    setOpenAddEditModal({
      isShown: true,
      data: details,
      type: "edit",
      modalType,
    });
  };

  const handleAddNewItem = (type) => {
    setOpenAddEditModal({
      isShown: true,
      type: "add",
      data: null,
      modalType: type === "property" ? "property" : "item",
    });
  };

  // ---------- UI ----------
  return (
    <div className="nr-dots-page min-h-screen text-white">
      <Navbar userInfo={userInfo} handleClearSearch={handleClearSearch} />

      {/* HERO (light lift from Marketplace vibe) */}
      <header className="mx-auto max-w-7xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f1115] px-5 py-6 shadow-[0_16px_48px_-12px_rgba(0,0,0,.55)]">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_400px_at_right_-200px,rgba(99,102,241,0.18),transparent),radial-gradient(800px_320px_at_left_-160px,rgba(59,130,246,0.16),transparent)]" />
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Welcome back{userInfo?.firstName ? `, ${userInfo.firstName}` : ""} 👋
              </h1>
              <p className="mt-1 text-white/70">
                Your hub for properties, marketplace, and quick actions.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatChip>{pCount} properties</StatChip>
              <StatChip>{mCount} items</StatChip>
            </div>
          </div>
        </div>
      </header>

      {/* TOGGLE */}
      <div className="mt-6 flex justify-center px-4">
        <div className="inline-flex overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] p-0.5">
          <button
            onClick={() => setViewMode("properties")}
            className={classNames(
              "px-4 py-2 text-sm font-medium transition-colors",
              viewMode === "properties"
                ? "rounded-lg bg-white text-black"
                : "text-white/85 hover:bg-white/10"
            )}
          >
            View Properties
          </button>
          <button
            onClick={() => setViewMode("items")}
            className={classNames(
              "px-4 py-2 text-sm font-medium transition-colors",
              viewMode === "items"
                ? "rounded-lg bg-white text-black"
                : "text-white/85 hover:bg-white/10"
            )}
          >
            View Marketplace Items
          </button>
        </div>
      </div>

      {/* GRID */}
      <main className="container mx-auto mt-8 px-4 pb-24">
        {viewMode === "properties" ? (
          allProperties.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allProperties.map((it) => (
                <PropertyCard
                  key={it._id}
                  _id={it._id}
                  title={it.title}
                  date={it.createdOn}
                  content={it.content}
                  tags={it.tags}
                  isPinned={it.isPinned}
                  price={it.price}
                  bedrooms={it.bedrooms}
                  bathrooms={it.bathrooms}
                  distanceFromUniversity={it.distanceFromUniversity}
                  address={it.address}
                  availabilityStatus={it.availabilityStatus}
                  description={it.description}
                  isFeatured={it.isFeatured}
                  onEdit={() => handleEdit(it, "property")}
                  onDelete={() => deleteProperty(it)}
                />
              ))}
            </div>
          ) : (
            <EmptyCard
              imgSrc={isSearch ? NoDataImg : AddPropertyImg}
              message={
                isSearch
                  ? `No properties found.`
                  : `No properties. Add one to get started.`
              }
            />
          )
        ) : allItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allItems.map((item) => (
              <MarketplaceItemCard
                key={item._id}
                item={item}
                onClick={() => nav(`/marketplace/item/${item._id}`)}
                onToggleFav={async () => {
                  try {
                    await axiosInstance.post(`/marketplace/favorites/${item._id}`);
                  } catch {}
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyCard
            imgSrc={isSearch ? NoDataImg : AddPropertyImg}
            message={
              isSearch
                ? `No marketplace items found.`
                : `No items. Add one to get started.`
            }
          />
        )}
      </main>

      {/* FLOATING + BUTTON */}
      <button
        className="fixed right-8 bottom-8 grid h-16 w-16 place-items-center rounded-full bg-sky-600 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-700"
        onClick={() => setShowCreateSheet(true)}
        aria-label="Create"
      >
        <MdAdd className="text-[32px]" />
      </button>

      {/* QUICK-CREATE SHEET */}
      <CreateSheet
        open={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        onChoose={(key) => {
          setShowCreateSheet(false);
          handleAddNewItem(key);
        }}
      />

      {/* MAIN MODAL (react-modal, same style as your project) */}
      <Modal
        isOpen={openAddEditModal.isShown}
        onRequestClose={() =>
          setOpenAddEditModal({ isShown: false, type: "add", data: null, modalType: "" })
        }
        overlayClassName="fixed inset-0 bg-black/30 backdrop-blur-sm"
        className="w-[min(720px,92vw)] max-h-[88vh] overflow-auto rounded-2xl border border-white/10 bg-white p-5 text-black shadow-2xl outline-none mx-auto mt-14"
        contentLabel=""
      >
        {openAddEditModal.modalType === "property" ? (
          <AddEditProperty
            type={openAddEditModal.type}
            propertyData={openAddEditModal.data}
            onClose={() =>
              setOpenAddEditModal({ isShown: false, type: "add", data: null, modalType: "" })
            }
            getAllProperties={getAllProperties}
            showToastMessage={showToast}
          />
        ) : (
          <AddEditItem
            type={openAddEditModal.type}
            itemData={openAddEditModal.data}
            onClose={() =>
              setOpenAddEditModal({ isShown: false, type: "add", data: null, modalType: "" })
            }
            getAllItems={getAllItems}
            showToastMessage={showToast}
          />
        )}
      </Modal>

      {/* Toast */}
      <Toast
        isShown={showToastMsg.isShown}
        message={showToastMsg.message}
        type={showToastMsg.type}
        onClose={handleCloseToast}
      />
    </div>
  );
};

export default UserDashboard;
