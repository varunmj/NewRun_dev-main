import React from 'react';
import { Card, CardFooter, Image, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { FiMoreVertical } from "react-icons/fi";  // Import the FiMoreVertical icon
import default_property_image from '../../assets/Images/default-item-image.jpg';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useLocation and useNavigate hooks

const ItemCard = ({ title, price, images = [], onEdit, onDelete, id }) => {
  const location = useLocation(); // Get the current location
  const navigate = useNavigate(); // Initialize navigate function

  // Use the first image from the images array as the thumbnail, or a placeholder if no image exists
  const thumbnail = images.length > 0 ? images[0] : default_property_image;

  // Check if we are on the "/dashboard" page
  const isDashboardPage = location.pathname === '/dashboard';

  const handleEdit = () => {
    onEdit(); // Trigger the edit functionality
  };

  const handleDelete = () => {
    onDelete(); // Trigger the delete functionality
  };

  const handleViewDetails = () => {
    navigate(`/marketplace/item/${id}`); // Redirect to MarketplaceItemDetails with itemId
  };

  return (
    <Card
      isFooterBlurred
      radius="lg"
      className="border-none hover:shadow-lg transition-all relative" // Added relative positioning for the dropdown
      css={{ mw: "400px" }} // Optional: Set max width of card
    >
      {/* Image Section */}
      <Image
        src={thumbnail} // Display the first image from the images array or the default image
        alt={title}
        height={300}
        width="100%"
        className="object-cover rounded-t-lg"
      />

      {/* Conditionally show dropdown with FiMoreVertical if on the dashboard */}
      {isDashboardPage && (
        <Dropdown backdrop="blur" placement="top-right">
          <DropdownTrigger>
            <Button
              variant="text"
              size="xl"
              className="absolute top-2 right-2 text-black p-2"  // Adjust padding for larger size
              css={{ fontSize: "28px", fontWeight: "bold" }}  // Set the icon size and make it bold
            >
              <FiMoreVertical size={28} />  {/* Set icon size explicitly */}
            </Button>
          </DropdownTrigger>
          <DropdownMenu variant="faded" aria-label="Dropdown menu for edit and delete">
            <DropdownItem
              key="edit"
              shortcut="⌘⇧E"
              startContent={<i className="fas fa-edit text-xl text-default-500 pointer-events-none" />}
              onClick={handleEdit}
            >
              Edit
            </DropdownItem>
            <DropdownItem
              key="delete"
              color="danger"
              shortcut="⌘⇧D"
              startContent={<i className="fas fa-trash text-xl text-danger pointer-events-none" />}
              onClick={handleDelete}
            >
              Delete
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      )}

      {/* Blurred Footer Section with Title and Price */}
      <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
        <div className="text-black">
          <p className="text-lg font-bold">{title}</p>
          <p className="text-md">${price}</p>
        </div>

        {/* View details button navigates to the MarketplaceItemDetails page */}
        <Button
          className="text-tiny text-white bg-black/20"
          variant="flat"
          color="default"
          radius="lg"
          size="sm"
          onClick={handleViewDetails} // Add onClick handler to navigate
        >
          View details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ItemCard;
