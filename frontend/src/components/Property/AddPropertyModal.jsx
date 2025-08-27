// src/components/Property/AddPropertyModal.jsx
import { useState } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Textarea, Button
} from "@nextui-org/react";
import axiosInstance from "../../utils/axiosInstance";

export default function AddPropertyModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [distance, setDistance] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [files, setFiles] = useState([]);       // File[]
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    setFiles(picked.slice(0, 5));               // your backend caps at 5
  };

  const uploadImages = async () => {
    if (!files.length) return [];
    setUploading(true);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("images", f);  // 👈 field name MUST be "images"
      const { data } = await axiosInstance.post("/upload-images", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data?.imageUrls || [];
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setTitle(""); setAddress(""); setPrice(""); setDescription("");
    setDistance(""); setBedrooms(""); setBathrooms(""); setFiles([]);
  };

  const submit = async () => {
    if (!title || !address || !price) {
      alert("title, address and price are required");
      return;
    }
    setSaving(true);
    try {
      // 1) upload raw files -> get public URLs
      const imageUrls = await uploadImages();

      // 2) create property with those URLs
      await axiosInstance.post("/add-property", {
        title,
        address,
        price: Number(price),
        description,
        distanceFromUniversity: Number(distance || 0),
        bedrooms: Number(bedrooms || 0),
        bathrooms: Number(bathrooms || 0),
        images: imageUrls, // 👈 use URLs from /upload-images
        availabilityStatus: "available",
      });

      reset();
      onClose?.();
      onSuccess?.(); // e.g., your dashboard will refetch
    } catch (e) {
      console.error(e);
      alert("Failed to create property");
    } finally {
      setSaving(false);
    }
  };

  // local previews (optional)
  const previews = files.map((f) => URL.createObjectURL(f));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader>New Property</ModalHeader>
        <ModalBody className="space-y-3">
          <Input label="Title" value={title} onChange={e=>setTitle(e.target.value)} variant="bordered"/>
          <Input label="Address" value={address} onChange={e=>setAddress(e.target.value)} variant="bordered"/>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Price (USD/mo)" type="number" value={price} onChange={e=>setPrice(e.target.value)} variant="bordered"/>
            <Input label="Bedrooms" type="number" value={bedrooms} onChange={e=>setBedrooms(e.target.value)} variant="bordered"/>
            <Input label="Bathrooms" type="number" value={bathrooms} onChange={e=>setBathrooms(e.target.value)} variant="bordered"/>
          </div>
          <Input label="Distance from University (miles)" type="number" value={distance} onChange={e=>setDistance(e.target.value)} variant="bordered"/>
          <Textarea label="Description" value={description} onChange={e=>setDescription(e.target.value)} variant="bordered"/>

          <div className="space-y-2">
            <label className="text-sm">Images (max 5)</label>
            <input type="file" accept="image/*" multiple onChange={onPickFiles} />
            {!!previews.length && (
              <div className="flex flex-wrap gap-2">
                {previews.map((u, i) => (
                  <img key={i} src={u} alt="preview" className="w-20 h-20 object-cover rounded" />
                ))}
              </div>
            )}
            {uploading && <div className="text-xs opacity-70">Uploading…</div>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>Cancel</Button>
          <Button
            color="primary"
            isDisabled={saving || uploading || !title || !address || !price}
            isLoading={saving}
            onPress={submit}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
