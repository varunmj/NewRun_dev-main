// frontend/src/components/Dashboard/CreateChooserModal.jsx
import { Modal, ModalContent, ModalHeader, ModalBody, Button } from "@nextui-org/react";


export default function CreateChooserModal({ isOpen, onClose, onChoose }) {
return (
<Modal isOpen={isOpen} onClose={onClose} size="md">
<ModalContent>
<ModalHeader>Select what to create</ModalHeader>
<ModalBody className="space-y-2">
<Button color="primary" onPress={() => onChoose("property")}>Property Listing</Button>
<Button variant="bordered" onPress={() => onChoose("marketplace")}>Marketplace Item</Button>
<Button variant="bordered" onPress={() => onChoose("community")}>Community Post</Button>
<Button variant="bordered" onPress={() => onChoose("blog")}>Blog Draft</Button>
</ModalBody>
</ModalContent>
</Modal>
);
}