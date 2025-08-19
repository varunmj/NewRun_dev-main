require('dotenv').config();

const config = require('./config.json');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('./utilities');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const axios = require('axios');




mongoose.connect(config.connectionString);

const User = require('./models/user.model');
const Property = require('./models/property.model');
const MarketplaceItem = require('./models/marketplaceItem.model');
const Message = require('./models/message.model');
const Conversation = require('./models/conversation.model');
const ContactAccessRequest = require('./models/contactAccessRequest.model');


const app = express();

const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, { 
    cors: { origin: '*', methods: ['GET', 'POST'] }
});



app.use(express.json());
app.use(cors({ origin: '*' }));

// AWS configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

// AWS S3 configuration for SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const s3 = new AWS.S3();

// Multer storage for S3
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET,
    // Adjust based on the access level you need
    key: function (req, file, cb) {
      const filename = Date.now().toString() + "-" + file.originalname;
      cb(null, filename); // File name format
    },
  }),
});

app.get('/', (req, res) => {
  res.json({ data: 'hello' });
});

// =====================
// Socket.IO Integration
// =====================
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('joinRoom', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  socket.on('leaveRoom', (conversationId) => {
    socket.leave(conversationId);
    console.log(`User left room: ${conversationId}`);
  });

   socket.on('registerUser', (userId) => {
    if (userId) socket.join(`user:${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});


//Create Account API:
app.post("/create-account", async(req,res)=>{

    let { firstName, lastName, email, password, username } = req.body;

    if (!firstName){
        return res
        .status(400)
        .json({error:true, message:"First name is required"});
    }

    if (!lastName){
        return res
        .status(400)
        .json({error:true, message:"Last name is required"});
    }

    if (!email){
        return res
        .status(400)
        .json({error:true, message:"Email address is required"});
    }

    if (!password){
        return res
        .status(400)
        .json({error:true, message:"Password is required"});
    }

    email = String(email).toLowerCase().trim();
    if (username) username = String(username).toLowerCase().trim();

    if (username) {
      const userByUsername = await User.findOne({ username });
      if (userByUsername) {
      return res.status(400).json({ error: true, message: "Username already taken" });
      }
    }

    const isUser = await User.findOne({email:email});

    if(isUser){
        return res
        .status(400)
        .json({
            error: true,
            message: "User already exist",
        });
    }

    const user = new User({
        firstName,
        lastName,
        email,
        password,
        username
    });

    await user.save();

    const accessToken = jwt.sign({user},process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: '36000m',
    });

    return res.json({
        error:false,
        user,
        accessToken,
        message: "Registration Successful",
    });
});

//Login API:
// app.post ("/login", async(req,res)=>{
//     const {email,password } = req.body;

//     if(!email){
//         return res
//         .status(400)
//         .json({message: "Email address is required"});
//     }

//     if(!password){
//         return res
//         .status(400)
//         .json({message: "Password is required"});
//     }

//     const userInfo = await User.findOne({email: email});

//     if(!userInfo){
//         return res
//         .status(400)
//         .json({message: "User not found"});
//     }

//     if(userInfo.email == email && userInfo.password == password){
//         const user = {user:userInfo};
//         const accessToken =jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
//             expiresIn:"36000m",
//         });

//         return res.json({
//             error: false,
//             message: "Login Successful",
//             email,
//             accessToken,
//         });
//     }else{
//         return res.status(400).json({
//             error: true,
//             message: "Invalid Credentials",
//         });
//     }
// });

app.post('/login', async (req, res) => {
  let { identifier, email, password } = req.body;

  if (!identifier && email) identifier = email;

  if (!identifier) {
      return res.status(400).json({ message: 'Email or username is required' });
    }

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    // Fetch only the fields needed for login
    const query = identifier.includes("@")
      ? { email: identifier.toLowerCase().trim() }
      : { username: identifier.toLowerCase().trim() };
    const userInfo = await User.findOne(query, 'email username password firstName lastName');

    if (!userInfo) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (userInfo.password === password) {
      const user = { user: userInfo };
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '36000m',
      });

      return res.json({
        error: false,
        message: 'Login Successful',
        email,
        identifier,
        accessToken,
      });
    } else {
      return res.status(400).json({
        error: true,
        message: 'Invalid Credentials',
      });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});


// Get user API:
// app.get("/get-user", authenticateToken, async (req, res) => {
//     const { user } = req.user;

//     try {
//         const isUser = await User.findOne({ _id: user._id });

//         if (!isUser) {
//             return res.sendStatus(401);
//         }

//         // Send additional fields if needed
//         return res.json({
//             user: {
//                 firstName: isUser.firstName,
//                 lastName: isUser.lastName,
//                 email: isUser.email,
//                 // Add other fields if required
//                 _id: isUser._id,
//                 createdOn: isUser.createdOn,
//             },
//             message: "",
//         });
//     } catch (error) {
//         console.error("Error retrieving user:", error);
//         res.status(500).json({ error: "Failed to fetch user data" });
//     }
// });

// Updated Get User API
app.get("/get-user", authenticateToken, async (req, res) => {
  const payloadUser = req?.user?.user || req?.user; // support both token shapes
  try {
    const isUser = await User.findById(payloadUser._id);
    if (!isUser) return res.sendStatus(401);

    return res.json({
      user: {
        _id: isUser._id,
        firstName: isUser.firstName,
        lastName: isUser.lastName,
        email: isUser.email,
        createdOn: isUser.createdOn,

        currentLocation: isUser.currentLocation,
        hometown: isUser.hometown,
        birthday: isUser.birthday,

        university: isUser.university,
        major: isUser.major,
        graduationDate: isUser.graduationDate,

        // ✨ new fields
        schoolDepartment:  isUser.schoolDepartment,
        cohortTerm:        isUser.cohortTerm,
        campusLabel:       isUser.campusLabel,
        campusPlaceId:     isUser.campusPlaceId,
        campusDisplayName: isUser.campusDisplayName,
      },
      message: "",
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// Image upload API:
// Route to handle image uploads
// Image Upload Route (using AWS SDK v3)
app.post("/upload-images", upload.array("images", 5), async (req, res) => {
  try {
    console.log("Request files:", req.files); // Log incoming files
    const imageUrls = req.files.map((file) => file.location);
    console.log("Uploaded images:", imageUrls); // Log uploaded image URLs

    res.json({
      error: false,
      imageUrls,
    });
  } catch (error) {
    console.error("Error uploading images:", error); // Log the error
    res.status(500).json({
      error: true,
      message: "Failed to upload images",
    });
  }
});

// Add Property API:
// Add Property API:
app.post('/add-property', authenticateToken, async (req, res) => {
  const {
    title,
    content,
    tags,
    price,
    bedrooms,
    bathrooms,
    distanceFromUniversity,
    address,
    availabilityStatus,
    images,
    contactInfo,
    description,
    isFeatured,
  } = req.body;

  const { user } = req.user;

  if (!title || !content) {
    return res.status(400).json({ error: true, message: 'Title and Content are required' });
  }

  try {
    const property = new Property({
      title,
      content,
      tags: tags || [],
      price,
      bedrooms,
      bathrooms,
      distanceFromUniversity,
      address,
      availabilityStatus,
      images: images || [],
      contactInfo,
      description,
      isFeatured: isFeatured || false,
      userId: user._id,
    });

    await property.save();
    return res.json({ error: false, property, message: 'Property added successfully' });
  } catch (error) {
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// Edit Property API:
// Edit Property API:
app.put('/edit-property/:propertyId', authenticateToken, async (req, res) => {
  const propertyId = req.params.propertyId;
  const {
    title,
    content,
    tags,
    isPinned,
    price,
    bedrooms,
    bathrooms,
    distanceFromUniversity,
    address,
    availabilityStatus,
    images,
    contactInfo,
    description,
    isFeatured,
  } = req.body;
  const { user } = req.user;

  try {
    const property = await Property.findOne({ _id: propertyId, userId: user._id });

    if (!property) {
      return res.status(404).json({ error: true, message: 'Property not found' });
    }

    if (title) property.title = title;
    if (content) property.content = content;
    if (tags) property.tags = tags;
    if (isPinned !== undefined) property.isPinned = isPinned;
    if (price) property.price = price;
    if (bedrooms) property.bedrooms = bedrooms;
    if (bathrooms) property.bathrooms = bathrooms;
    if (distanceFromUniversity) property.distanceFromUniversity = distanceFromUniversity;
    if (address) property.address = address;
    if (availabilityStatus) property.availabilityStatus = availabilityStatus;
    if (images) property.images = images;
    if (contactInfo) property.contactInfo = contactInfo;
    if (description) property.description = description;
    if (isFeatured !== undefined) property.isFeatured = isFeatured;

    await property.save();
    return res.json({ error: false, property, message: 'Property updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// Get all properties by User:
app.get("/get-all-property-user", authenticateToken, async (req, res) => {
    const { user } = req.user;

    try {
        const properties = await Property.find({ userId: user._id })
            .sort({ isPinned: -1 })
            .populate('userId', 'firstName lastName');  // Populate user info

        return res.json({
            error: false,
            properties,
            message: "All properties retrieved successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

// Get all properties (for all users):
app.get("/get-all-property", async (req, res) => {
  const userId = req.user ? req.user._id : null; // Check if user is authenticated
  try {
      const properties = await Property.find({})
          .sort({ isPinned: -1 })
          .populate('userId', 'firstName lastName');
      
      const propertiesWithLikes = properties.map((property) => ({
          ...property.toObject(),
          likesCount: property.likes.length,
          likedByUser: userId ? property.likes.includes(userId) : false
      }));

      return res.json({
          error: false,
          properties: propertiesWithLikes,
          message: "All properties retrieved successfully",
      });
  } catch (error) {
      console.error("Error retrieving properties:", error);
      return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});




//Delete property API:
app.delete("/delete-property/:propertyId",authenticateToken,async(req,res)=>{
    const propertyId = req.params.propertyId;
    const {user} = req.user;

    try{
        const property = await Property.findOne({ _id: propertyId, userId:user._id
        });

        if(!property){
            return res.status(404).json({error:true,message:"Note not found"});
        }

        await Property.deleteOne({ _id: propertyId, userId:user._id
        });

        return res.json({
            error: false,
            message: "Note deleted successfully"
        });
    } catch(error){
        return res.status(500).json({
            error: true,
            message: "Internal Server Error"
        });
    }
});

//API for // Find the property by ID
app.get("/properties/:id", authenticateToken, async (req, res) => {
  const propertyId = req.params.id;

  try {
      // Find the property by ID
      const property = await Property.findById(propertyId).populate('userId', 'firstName lastName');

      if (!property) {
          return res.status(404).json({ error: true, message: "Property not found" });
      }

      return res.json({
          error: false,
          property,
          message: "Property details retrieved successfully",
      });
  } catch (error) {
      console.error("Error fetching property details:", error); // Log the error
      return res.status(500).json({
          error: true,
          message: "Internal Server Error",
      });
  }
});

//Update isPinned value API:
app.put("/update-property-pinned/:propertyId",authenticateToken,async(req,res)=>{
    const propertyId = req.params.propertyId;
    const {isPinned} = req.body;
    const {user} =req.user;

    try{
        const property = await Property.findOne({_id:propertyId,userId:user._id});

        if(!property){
            return res.status(404).json({error:true,message:"Note not found"});
        }

        property.isPinned = isPinned ;

        await property.save();

        return res.json({
            error: false,
            property,
            message: "Property Updated Succesfully",
        });
    }catch(error){
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

//Search API:
app.get("/search-properties/",authenticateToken,async(req,res)=>{
    const {user} = req.user;
    const {query} = req.query;

    if(!query){
        return res
        .status(400)
        .json({error: true, message: "Search query is required"});
    }

    try{
        const matchingProperties = await Property.find({
            userId: user._id,
            $or: [
                {title: { $regex : new RegExp(query,"i")}},
                {content : {$regex: new RegExp(query,"i")}},
                {tags : {$regex: new RegExp(query,"i")}},
            ],
        });

        return res.json({
            error: false,
            properties:matchingProperties,
            message: " Properties matching the search query retreived successfully",
        });
    }catch(error){
        return res.status(500).json(
            {
                error: true,
                message: "Internal Server Error"
            }
        )
    }
})

// Toggle Like API
app.put('/property/:propertyId/like', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.user?._id || req.user._id; // compat if you change middleware later
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ error: true, message: 'Property not found' });

    const hasLike = (property.likes || []).some((u) => String(u) === String(userId));

    if (hasLike) {
      property.likes = property.likes.filter((u) => String(u) !== String(userId));
    } else {
      property.likes.push(userId);
    }

    await property.save();
    return res.json({ success: true, likes: property.likes.length, liked: !hasLike });
  } catch (error) {
    console.error('Toggle like error:', error);
    return res.status(500).json({ error: true, message: 'Error toggling like' });
  }
});

app.post('/contact-access/request', authenticateToken, async (req, res) => {
  try {
    const requesterId = getAuthUserId(req);
    const { propertyId } = req.body;
    if (!requesterId || !propertyId) {
      return res.status(400).json({ error: true, message: 'Missing propertyId' });
    }

    const prop = await Property.findById(propertyId).select('userId contactInfo title');
    if (!prop) return res.status(404).json({ error: true, message: 'Property not found' });

    const ownerId = prop.userId?._id || prop.userId;
    if (String(ownerId) === String(requesterId)) {
      return res.status(400).json({ error: true, message: 'Cannot request your own listing' });
    }

    // Because you have a UNIQUE index on (propertyId, requesterId),
    // we either:
    //  - create a new "pending" doc, or
    //  - if a doc already exists (approved/denied/pending), we reuse it:
    //      - if pending: return pending
    //      - else: flip back to pending and reset timers
    let cr = await ContactAccessRequest.findOne({ propertyId, requesterId });

    if (cr) {
      if (cr.status === 'pending') {
        return res.json({ ok: true, status: 'pending', id: cr._id });
      }
      // flip denial/approval back to pending for a new cycle
      cr.status = 'pending';
      cr.approvedAt = undefined;
      cr.deniedAt = undefined;
      cr.phone = undefined;
      cr.email = undefined;
      // reset owner (in case listing moved) + expiry window
      cr.ownerId = ownerId;
      cr.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await cr.save();
    } else {
      cr = await ContactAccessRequest.create({
        propertyId,
        ownerId,
        requesterId,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    // Notify host in real time
    io.to(`user:${ownerId}`).emit('contact_request:new', {
      id: cr._id,
      propertyId,
      requesterId,
    });

    return res.json({ ok: true, status: 'pending', id: cr._id });
  } catch (e) {
    // handle duplicate key race safety (E11000) by fetching existing doc
    if (e?.code === 11000) {
      try {
        const requesterId = getAuthUserId(req);
        const { propertyId } = req.body;
        const cr = await ContactAccessRequest.findOne({ propertyId, requesterId });
        if (cr) {
          return res.json({ ok: true, status: cr.status, id: cr._id });
        }
      } catch {}
    }
    console.error('POST /contact-access/request', e);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});



app.get('/contact-access/status/:propertyId', authenticateToken, async (req, res) => {
  try {
    const requesterId = getAuthUserId(req);
    const { propertyId } = req.params;

    const cr = await ContactAccessRequest.findOne({ propertyId, requesterId })
      .sort({ createdAt: -1 });

    if (!cr) return res.json({ approved: false, pending: false });

    if (cr.status === 'approved') {
      return res.json({
        approved: true,
        pending: false,
        phone: cr.phone || '',
        email: cr.email || '',
      });
    }
    if (cr.status === 'pending') {
      return res.json({ approved: false, pending: true });
    }
    // denied/expired
    return res.json({ approved: false, pending: false });
  } catch (e) {
    console.error('GET /contact-access/status/:propertyId', e);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});



app.get('/contact-access/inbox', authenticateToken, async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const { status = 'pending' } = req.query;

    const items = await ContactAccessRequest.find({ ownerId, status })
      .sort({ createdAt: -1 })
      .populate('propertyId', 'title images')
      .populate('requesterId', 'firstName lastName email');

    return res.json({ ok: true, items });
  } catch (e) {
    console.error('GET /contact-access/inbox', e);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});


app.post('/contact-access/:id/approve', authenticateToken, async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const { id } = req.params;

    const cr = await ContactAccessRequest.findOne({ _id: id, ownerId });
    if (!cr) return res.status(404).json({ error: true, message: 'Request not found' });

    const prop = await Property.findById(cr.propertyId).select('contactInfo');
    const phone = prop?.contactInfo?.phone || '';
    const email = prop?.contactInfo?.email || '';

    cr.status = 'approved';
    cr.approvedAt = new Date();
    cr.deniedAt = undefined;
    cr.phone = phone;
    cr.email = email;
    await cr.save();

    // Notify requester to flip UI immediately
    io.to(`user:${cr.requesterId}`).emit('contact_request:updated', {
      propertyId: cr.propertyId,
      status: 'approved',
      phone,
      email,
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error('POST /contact-access/:id/approve', e);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

app.post('/contact-access/:id/deny', authenticateToken, async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const { id } = req.params;

    const cr = await ContactAccessRequest.findOne({ _id: id, ownerId });
    if (!cr) return res.status(404).json({ error: true, message: 'Request not found' });

    cr.status = 'denied';
    cr.deniedAt = new Date();
    cr.approvedAt = undefined;
    cr.phone = undefined;
    cr.email = undefined;
    await cr.save();

    io.to(`user:${cr.requesterId}`).emit('contact_request:updated', {
      propertyId: cr.propertyId,
      status: 'denied',
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error('POST /contact-access/:id/deny', e);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});



// =====================
// Marketplace Routes
// =====================

// Create a new marketplace item
app.post("/marketplace/item", authenticateToken, async (req, res) => {
    const { user } = req.user;
    const {
      title,
      description,
      price,
      category,
      condition,
      thumbnailUrl,
      contactInfo,
    } = req.body;
  
    if (!title || !description || !category || !contactInfo) {
      return res.status(400).json({
        error: true,
        message: "Title, description, category, and contact information are required",
      });
    }
  
    try {
      const newItem = new MarketplaceItem({
        userId: user._id,
        title,
        description,
        price: price || 0,
        category,
        condition: condition || 'used',
        thumbnailUrl,
        contactInfo,
      });
  
      await newItem.save();
  
      return res.json({
        error: false,
        item: newItem,
        message: "Marketplace item created successfully",
      });
    } catch (error) {
      console.error("Error creating marketplace item:", error);
      return res.status(500).json({
        error: true,
        message: "Internal Server Error",
      });
    }
  });
  
  // Get all marketplace items
  app.get("/marketplace/items", async (req, res) => {
    try {
      const items = await MarketplaceItem.find({})
        .sort({ createdAt: -1 })
        .populate('userId', 'firstName lastName');  // Populate userId to include the user's first and last name
  
      return res.json({
        error: false,
        items,
        message: "All marketplace items retrieved successfully",
      });
    } catch (error) {
      console.error("Error retrieving marketplace items:", error);
      return res.status(500).json({
        error: true,
        message: "Internal Server Error",
      });
    }
  });
  
  // Get details of a single marketplace item
  app.get("/marketplace/item/:id", authenticateToken, async (req, res) => {
    const itemId = req.params.id;

    try {
        const item = await MarketplaceItem.findById(itemId)
            .populate('userId', 'firstName lastName email phone'); // Populate user details

        if (!item) {
            return res.status(404).json({ error: true, message: "Item not found" });
        }

        return res.json({
            error: false,
            item,
            message: "Marketplace item retrieved successfully",
        });
    } catch (error) {
        console.error("Error retrieving marketplace item:", error);
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});
  
  // Update an existing marketplace item
  app.put("/marketplace/item/:id", authenticateToken, async (req, res) => {
    const itemId = req.params.id;
    const { user } = req.user;
    const {
      title,
      description,
      price,
      category,
      condition,
      thumbnailUrl,
      contactInfo,
    } = req.body;
  
    try {
      const item = await MarketplaceItem.findOne({ _id: itemId, userId: user._id });
  
      if (!item) {
        return res.status(404).json({ error: true, message: "Item not found or unauthorized" });
      }
  
      // Update fields if provided
      if (title) item.title = title;
      if (description) item.description = description;
      if (price !== undefined) item.price = price;
      if (category) item.category = category;
      if (condition) item.condition = condition;
      if (thumbnailUrl) item.thumbnailUrl = thumbnailUrl;
      if (contactInfo) item.contactInfo = contactInfo;
  
      await item.save();
  
      return res.json({
        error: false,
        item,
        message: "Marketplace item updated successfully",
      });
    } catch (error) {
      console.error("Error updating marketplace item:", error);
      return res.status(500).json({
        error: true,
        message: "Internal Server Error",
      });
    }
  });
  
  // Delete a marketplace item
  app.delete("/marketplace/item/:id", authenticateToken, async (req, res) => {
    const itemId = req.params.id;
    const { user } = req.user;
  
    try {
      const item = await MarketplaceItem.findOne({ _id: itemId, userId: user._id });
  
      if (!item) {
        return res.status(404).json({ error: true, message: "Item not found or unauthorized" });
      }
  
      await MarketplaceItem.deleteOne({ _id: itemId });
  
      return res.json({
        error: false,
        message: "Marketplace item deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting marketplace item:", error);
      return res.status(500).json({
        error: true,
        message: "Internal Server Error",
      });
    }
  });
  
  // Search marketplace items
  app.get("/marketplace/search", authenticateToken, async (req, res) => {
    const { query } = req.query;
  
    if (!query) {
      return res.status(400).json({ error: true, message: "Search query is required" });
    }
  
    try {
      const items = await MarketplaceItem.find({
        $or: [
          { title: { $regex: new RegExp(query, "i") } },
          { description: { $regex: new RegExp(query, "i") } },
          { category: { $regex: new RegExp(query, "i") } },
        ],
      }).populate('userId', 'firstName lastName');
  
      return res.json({
        error: false,
        items,
        message: "Marketplace items matching the search query retrieved successfully",
      });
    } catch (error) {
      console.error("Error searching marketplace items:", error);
      return res.status(500).json({
        error: true,
        message: "Internal Server Error",
      });
    }
  });

  app.get("/marketplace/items-user", authenticateToken, async (req, res) => {
    const { user } = req.user;
  
    try {
      const items = await MarketplaceItem.find({ userId: user._id }); // Fetch items created by the logged-in user
      res.json({
        error: false,
        items,
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "Error fetching marketplace items",
      });
    }
  });

  // OpenAI proxy endpoint
  app.post('/api/openai', authenticateToken, async (req, res) => {
    const { prompt } = req.body;
  
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      }, {
        headers: {
          Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      res.json(response.data);
    } catch (error) {
      console.error("Error in OpenAI request:", error);
      res.status(500).json({ error: "Failed to fetch data from OpenAI" });
    }
  });

  // Update user data API
  app.patch('/user/update', authenticateToken, async (req, res) => {
  const authed = req.user?.user || req.user;
  if (!authed?._id) return res.sendStatus(401);

  // Whitelist fields you allow to update
  const {
    firstName, lastName, username, avatar,
    currentLocation, hometown, birthday,
    university, major, graduationDate,
    schoolDepartment, cohortTerm,
    campusLabel, campusPlaceId, campusDisplayName,
  } = req.body || {};

  // Build $set only with provided fields (avoid clobbering with undefined)
  const $set = {};
  const put = (k, v) => { if (typeof v !== 'undefined') $set[k] = v; };

  put('firstName', firstName);
  put('lastName',  lastName);
  put('username',  username);
  put('avatar',    avatar);

  put('currentLocation', currentLocation);
  put('hometown',        hometown);
  // normalize birthday if present (accepts "", null, or ISO/string)
  if (typeof birthday !== 'undefined') {
    if (!birthday) {
      $set['birthday'] = null;
    } else {
      const d = new Date(birthday);
      if (!isNaN(d)) $set['birthday'] = d;
    }
  }

  put('university',     university);
  put('major',          major);
  put('graduationDate', graduationDate);

  put('schoolDepartment',  schoolDepartment);
  put('cohortTerm',        cohortTerm);        // e.g. "Fall 2025"
  put('campusLabel',       campusLabel);
  put('campusPlaceId',     campusPlaceId);     // from Places
  put('campusDisplayName', campusDisplayName); // human-readable

  try {
    const updated = await User.findByIdAndUpdate(
      authed._id,
      { $set },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // mirror /get-user shape
    return res.json({
      success: true,
      user: {
        _id: updated._id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        username: updated.username || '',
        avatar: updated.avatar || '',

        currentLocation: updated.currentLocation || '',
        hometown: updated.hometown || '',
        birthday: updated.birthday || null,

        university: updated.university || '',
        major: updated.major || '',
        graduationDate: updated.graduationDate || '',

        schoolDepartment: updated.schoolDepartment || '',
        cohortTerm: updated.cohortTerm || '',
        campusLabel: updated.campusLabel || '',
        campusPlaceId: updated.campusPlaceId || '',
        campusDisplayName: updated.campusDisplayName || '',

        createdOn: updated.createdOn || null,
      }
    });
  } catch (err) {
    console.error('PATCH /user/update error:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// --- allow PATCHing only safe, known fields ---
const ALLOWED_USER_FIELDS = [
  'firstName','lastName','currentLocation','hometown','birthday',
  'university','major','graduationDate',
  'schoolDepartment','cohortTerm','campusLabel','campusPlaceId','campusDisplayName'
];

function buildUserUpdate(body = {}) {
  const doc = {};
  for (const k of ALLOWED_USER_FIELDS) {
    if (typeof body[k] !== 'undefined' && body[k] !== null) {
      doc[k] = (k === 'birthday' && body[k]) ? new Date(body[k]) : body[k];
    }
  }
  // fallback: if client sent season+year instead of cohortTerm
  if (!doc.cohortTerm && body.cohortSeason && body.cohortYear) {
    doc.cohortTerm = `${body.cohortSeason} ${body.cohortYear}`;
  }
  return doc;
}

async function updateUserHandler(req, res) {
  try {
    const userId = req?.user?.user?._id || req?.user?._id;  // supports both payload shapes
    if (!userId) return res.status(401).json({ error: true, message: 'Unauthorized' });

    const updateDoc = buildUserUpdate(req.body);
    if (Object.keys(updateDoc).length === 0) {
      return res.status(400).json({ error: true, message: 'No valid fields to update' });
    }

    const updated = await User.findByIdAndUpdate(userId, { $set: updateDoc }, { new: true });
    if (!updated) return res.status(404).json({ error: true, message: 'User not found' });

    return res.json({ error: false, user: updated });
  } catch (err) {
    console.error('update user error:', err);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
}

// Keep your original route AND add aliases used by the frontend
app.patch('/user/update', authenticateToken, updateUserHandler);   // existing canonical
app.patch('/update-user', authenticateToken, updateUserHandler);   // alias for old FE
app.patch('/update-profile', authenticateToken, updateUserHandler);// alias for old FE


  

  // =====================
  // Messaging and Conversation Routes
  // =====================

  // Initiate a conversation if it doesn't exist
  app.post('/conversations/initiate', authenticateToken, async (req, res) => {
    const { receiverId } = req.body; // Only pass receiverId from the frontend
    const senderId = req.user.user._id; // Get the sender (current user) from the token

    try {
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [senderId, receiverId],
        });
        await conversation.save();
      }
      
      res.status(200).json({ success: true, conversationId: conversation._id });
    } catch (error) {
      console.error("Error initiating conversation:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send a message in a conversation
  app.post('/messages/send', authenticateToken, async (req, res) => {
    console.log("Authenticated User:", req.user); // Debugging line
    const { conversationId, content, attachments, gif, emoji } = req.body;
    const senderId = req.user.user._id; // Current user from the token
  
    try {
      console.log("Request to send message with conversationId:", conversationId);
      
      const conversation = await Conversation.findById(conversationId);
  
      if (!conversation) {
        console.error(`Conversation with ID ${conversationId} not found.`);
        return res.status(403).json({ success: false, message: 'Conversation not found or unauthorized access' });
      }
      
      if (!conversation.participants.includes(senderId)) {
        console.error(`User ${senderId} is not a participant of conversation ${conversationId}.`);
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
      }
  
      const receiverId = conversation.participants.find(id => id.toString() !== senderId.toString());
  
      const newMessage = new Message({
        conversationId,
        senderId,
        receiverId,
        content,
        attachments,
        gif,
        emoji,
      });
  
      await newMessage.save();
  
      conversation.lastMessage = newMessage._id;
      conversation.lastUpdated = Date.now();
      await conversation.save();
  
      io.to(conversationId).emit('newMessage', {
        conversationId,
        message: newMessage,
      });
  
      res.status(200).json({ success: true, message: 'Message sent!', data: newMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  

  // Get all conversations of a user
  app.get('/conversations', authenticateToken, async (req, res) => {
    const userId = req.user.user._id;

    try {
      const conversations = await Conversation.find({
        participants: userId,
      })
        .populate({
          path: 'participants',
          select: 'firstName lastName', // Populate participant names
        })
        .populate({
          path: 'lastMessage',
          select: 'content timestamp senderId',
          populate: {
            path: 'senderId', // Populate sender's name in the last message
            select: 'firstName lastName',
          },
        })
        .sort({ lastUpdated: -1 });

      res.status(200).json({ success: true, data: conversations });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get all messages of a specific conversation
  app.get('/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.user._id;

    try {
      const conversation = await Conversation.findById(conversationId);

      // Check if the current user is a participant in the conversation
      if (!conversation || !conversation.participants.includes(userId)) {
        return res.status(403).json({ success: false, message: 'Unauthorized access' });
      }

      const messages = await Message.find({
        conversationId,
      })
        .populate({
          path: 'senderId',
          select: 'firstName lastName', // Populate sender names in each message
        })
        .sort({ timestamp: 1 }); // Sort messages by timestamp (earliest first)

      res.status(200).json({ success: true, data: messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Endpoint to get the count of unread messages
  app.get('/messages/unread-count', authenticateToken, async (req, res) => {
    const userId = req.user.user._id; // Get the user ID from the authenticated token

    try {
      // Find all unread messages where the user is the receiver
      const unreadCount = await Message_NewRUN.countDocuments({
        receiverId: userId,
        isRead: false
      });

      res.status(200).json({ success: true, count: unreadCount });
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch unread message count' });
    }
  });

  server.listen(8000, () => {
    console.log('Server is running on port 8000');
});

  module.exports = app;