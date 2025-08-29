// src/pages/UserDashboard.jsx
import React, { useEffect, useState } from "react";
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

import "../styles/newrun-hero.css"; // same dotted/hero background as Marketplace

/* ------------------------------ tiny helpers ------------------------------ */
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

/* ----------------------- glassy quick-create sheet ----------------------- */
function CreateSheet({ open, onClose, onChoose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
      <div
        className="absolute bottom-6 right-6 w-[min(92vw,360px)] rounded-3xl border border-white/10 bg-[#0f1115]/85 p-4 shadow-[0_24px_64px_-12px_rgba(0,0,0,.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Create</h3>
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

/* ================================= Page ================================== */
export default function UserDashboard() {
  const nav = useNavigate();

  // modal for actual create/edit
  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: "add",
    data: null,
    modalType: "", // 'property' | 'item'
  });

  // sheet for the floating + button
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
  const [viewMode, setViewMode] = useState("properties"); // "properties" | "items"

  const pCount = allProperties.length;
  const mCount = allItems.length;

  /* ------------------------------ API calls ------------------------------ */
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response?.data?.user) setUserInfo(response.data.user);
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.clear();
        nav("/login");
      }
    }
  };

  const getAllProperties = async () => {
    try {
      const response = await axiosInstance.get("/get-all-property-user");
      setAllProperties(response?.data?.properties || []);
    } catch {
      setAllProperties([]);
    }
  };

  const getAllItems = async () => {
    try {
      const response = await axiosInstance.get("/marketplace/items-user");
      setAllItems(response?.data?.items || []);
    } catch {
      setAllItems([]);
    }
  };

  const deleteProperty = async (data) => {
    try {
      const r = await axiosInstance.delete(`/delete-property/${data._id}`);
      if (r?.data && !r.data.error) {
        showToast("Property Deleted Successfully", "delete");
        getAllProperties();
      }
    } catch {}
  };

  const deleteItem = async (data) => {
    try {
      const r = await axiosInstance.delete(`/marketplace/item/${data._id}`);
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

  /* --------------------------------- UI ---------------------------------- */
  return (
    <div className="nr-dots-page min-h-screen text-white">
      <Navbar userInfo={userInfo} handleClearSearch={handleClearSearch} />

      {/* HERO — mirrors Marketplace vibe */}
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f1115] px-6 py-6 shadow-[0_16px_48px_-12px_rgba(0,0,0,.55)]">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_400px_at_right_-200px,rgba(99,102,241,0.18),transparent),radial-gradient(800px_320px_at_left_-160px,rgba(59,130,246,0.16),transparent)]" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome Back {userInfo?.firstName ? `, ${userInfo.firstName}` : ""} ✨
              </h1>
              <p className="mt-1 text-white/70">
                Manage your properties and marketplace listings in one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatChip>{pCount} properties</StatChip>
              <StatChip>{mCount} items</StatChip>
            </div>
          </div>
        </div>
      </section>

      {/* VIEW TOGGLE — pill chips like Marketplace toolbar */}
      <section className="mx-auto mt-6 flex justify-center px-4">
        <div className="inline-flex overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-0.5">
          <button
            onClick={() => setViewMode("properties")}
            className={classNames(
              "px-4 py-2 text-sm font-medium transition-colors",
              viewMode === "properties"
                ? "rounded-xl bg-white text-black"
                : "text-white/85 hover:bg-white/10"
            )}
          >
            Properties
          </button>
          <button
            onClick={() => setViewMode("items")}
            className={classNames(
              "px-4 py-2 text-sm font-medium transition-colors",
              viewMode === "items"
                ? "rounded-xl bg-white text-black"
                : "text-white/85 hover:bg-white/10"
            )}
          >
            Marketplace
          </button>
        </div>
      </section>

      {/* GRID */}
      <main className="container mx-auto mt-8 px-4 pb-24">
        {viewMode === "properties" ? (
          allProperties.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {allProperties.map((p) => (
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
                  onEdit={() => handleEdit(p, "property")}
                  onDelete={() => deleteProperty(p)}
                />
              ))}
            </div>
          ) : (
            <EmptyCard
              imgSrc={isSearch ? NoDataImg : AddPropertyImg}
              message={
                isSearch
                  ? "No properties found."
                  : "No properties. Add one to get started."
              }
            />
          )
        ) : allItems.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {allItems.map((it) => (
              <MarketplaceItemCard
                key={it._id}
                item={it}
                onClick={() => {
                  // Open edit for owner directly; or navigate to details (your choice)
                  // nav(`/marketplace/item/${it._id}`);
                  setOpenAddEditModal({
                    isShown: true,
                    type: "edit",
                    data: it,
                    modalType: "item",
                  });
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyCard
            imgSrc={isSearch ? NoDataImg : AddPropertyImg}
            message={
              isSearch
                ? "No marketplace items found."
                : "No items. Add one to get started."
            }
          />
        )}
      </main>

      {/* FLOATING “+” BUTTON (same position/feel, opens glass sheet) */}
      <button
        className="fixed right-8 bottom-8 grid h-16 w-16 place-items-center rounded-full bg-sky-600 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-700"
        onClick={() => setShowCreateSheet(true)}
        aria-label="Create"
      >
        <MdAdd className="text-[32px]" />
      </button>

      {/* QUICK CREATE SHEET */}
      <CreateSheet
        open={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        onChoose={(key) => {
          setShowCreateSheet(false);
          // open the main modal with chosen type
          setOpenAddEditModal({
            isShown: true,
            type: "add",
            data: null,
            modalType: key === "property" ? "property" : "item",
          });
        }}
      />

      {/* MAIN MODAL (react-modal, same translucent overlay you like) */}
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
        overlayClassName="fixed inset-0 bg-black/30 backdrop-blur-sm"
        className="w-[min(760px,92vw)] max-h-[88vh] overflow-auto rounded-2xl border border-white/10 bg-white p-5 text-black shadow-2xl outline-none mx-auto mt-14"
        contentLabel=""
      >
        {openAddEditModal.modalType === "property" ? (
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
            getAllProperties={getAllProperties}
            showToastMessage={showToast}
          />
        ) : (
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
}
