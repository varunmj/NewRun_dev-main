require('dotenv').config();

const config = require('./config.json');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const axios = require('axios');
const { authenticateToken, getAuthUserId } = require('./utilities');
const Thread = require('./models/thread.model');




mongoose.connect(config.connectionString);

const User = require('./models/user.model');
const Property = require('./models/property.model');
const MarketplaceItem = require('./models/marketplaceItem.model');
const Message = require('./models/message.model');
const Conversation = require('./models/conversation.model');
const ContactAccessRequest = require('./models/contactAccessRequest.model');
const { extractHousingCriteria } = require('./services/newrun-llm/newrunLLM');


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

    // Hash the password before saving
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword, // Store hashed password
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

  console.log('Login attempt:', { identifier, email: email ? 'provided' : 'not provided', password: password ? 'provided' : 'not provided' });

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

    console.log('User found:', { 
      found: !!userInfo, 
      email: userInfo?.email, 
      username: userInfo?.username,
      passwordType: userInfo?.password ? (userInfo.password.startsWith('$2') ? 'hashed' : 'plain') : 'none'
    });

    if (!userInfo) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare password - handle both hashed and plain text (for existing users)
    let isPasswordValid = false;
    
    // Check if password is already hashed (starts with $2a$ or $2b$)
    if (userInfo.password.startsWith('$2a$') || userInfo.password.startsWith('$2b$')) {
      // Password is hashed, use bcrypt compare
      isPasswordValid = await bcrypt.compare(password, userInfo.password);
    } else {
      // Password is plain text (legacy), compare directly
      isPasswordValid = (userInfo.password === password);
      
      // If login successful with plain text, hash the password for future use
      if (isPasswordValid) {
        try {
          const saltRounds = 12;
          const hashedPassword = await bcrypt.hash(password, saltRounds);
          await User.findByIdAndUpdate(userInfo._id, { password: hashedPassword });
          console.log(`Updated password for user ${userInfo.email} to hashed format`);
        } catch (hashError) {
          console.error('Error hashing password during login:', hashError);
          // Continue with login even if hashing fails
        }
      }
    }
    
    if (isPasswordValid) {
      const user = { user: userInfo };
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '36000m',
      });

      return res.json({
        error: false,
        message: 'Login Successful',
        email: userInfo.email,
        identifier,
        accessToken,
        user: userInfo, // Include user data in response
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

// Logout API (optional - mainly for logging purposes)
app.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { user } = req.user;
    console.log(`User ${user.email || user.username} logged out`);
    
    // In a more sophisticated setup, you might:
    // 1. Add token to a blacklist
    // 2. Log the logout event
    // 3. Clean up user sessions
    
    res.json({
      error: false,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: true,
      message: 'Logout failed'
    });
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
app.post('/add-property', authenticateToken, async (req, res) => {
  const {
    title,
    content,                     // keep accepting if you still use it anywhere
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

  // ✅ NEW: realistic required fields for a listing
  if (!title || !address || typeof price === 'undefined') {
    return res.status(400).json({
      error: true,
      message: 'title, address and price are required'
    });
  }

  try {
    const property = new Property({
      title,
      content: content || '',           // optional
      tags: tags || [],
      price: Number(price) || 0,
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      distanceFromUniversity: Number(distanceFromUniversity) || 0,
      address,
      availabilityStatus: availabilityStatus || 'available',
      images: images || [],             // expects array of URLs (from /upload-images)
      contactInfo: contactInfo || {},
      description: description || '',
      isFeatured: Boolean(isFeatured),
      userId: user._id,
      // optional: copy user.university onto the property for future scoping
      // university: user.university || ''
    });

    await property.save();
    return res.json({ error: false, property, message: 'Property added successfully' });
  } catch (error) {
    console.error('POST /add-property error:', error);
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
app.get("/properties/:id", async (req, res) => {
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

// Advanced Property Search API with Filters:
app.get("/search-properties", async (req, res) => {
  try {
    const {
      query = '',
      minPrice,
      maxPrice,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      maxDistance,
      city,
      state,
      availabilityStatus = 'available',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    // Build filter object
    const filter = {
      availabilityStatus: availabilityStatus
    };

    // Text search across multiple fields
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
        { 'address.street': { $regex: query, $options: 'i' } },
        { 'address.city': { $regex: query, $options: 'i' } }
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Bedrooms filter
    if (minBedrooms || maxBedrooms) {
      filter.bedrooms = {};
      if (minBedrooms) filter.bedrooms.$gte = Number(minBedrooms);
      if (maxBedrooms) filter.bedrooms.$lte = Number(maxBedrooms);
    }

    // Bathrooms filter
    if (minBathrooms || maxBathrooms) {
      filter.bathrooms = {};
      if (minBathrooms) filter.bathrooms.$gte = Number(minBathrooms);
      if (maxBathrooms) filter.bathrooms.$lte = Number(maxBathrooms);
    }

    // Distance filter
    if (maxDistance) {
      filter.distanceFromUniversity = { $lte: Number(maxDistance) };
    }

    // Location filters
    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' };
    }
    if (state) {
      filter['address.state'] = { $regex: state, $options: 'i' };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query with pagination
    const properties = await Property.find(filter)
      .populate('userId', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await Property.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / Number(limit));

    // Add likes count and liked status for each property
    const userId = req.user ? req.user._id : null;
    const propertiesWithLikes = properties.map((property) => ({
      ...property,
      likesCount: property.likes ? property.likes.length : 0,
      likedByUser: userId ? property.likes?.includes(userId) : false
    }));

    return res.json({
      error: false,
      properties: propertiesWithLikes,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalCount,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      },
      filters: {
        query,
        minPrice: minPrice ? Number(minPrice) : null,
        maxPrice: maxPrice ? Number(maxPrice) : null,
        minBedrooms: minBedrooms ? Number(minBedrooms) : null,
        maxBedrooms: maxBedrooms ? Number(maxBedrooms) : null,
        minBathrooms: minBathrooms ? Number(minBathrooms) : null,
        maxBathrooms: maxBathrooms ? Number(maxBathrooms) : null,
        maxDistance: maxDistance ? Number(maxDistance) : null,
        city,
        state,
        availabilityStatus
      },
      message: "Properties retrieved successfully"
    });

  } catch (error) {
    console.error("Search properties error:", error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error"
    });
  }
});

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

// create / re-send request
// POST /contact-access/request
// POST /contact-access/request
app.post("/contact-access/request", authenticateToken, async (req, res) => {
  try {
    const requesterId = getAuthUserId(req);
    const { propertyId } = req.body;
    if (!requesterId) return res.status(401).json({ error: true, message: "Unauthorized" });
    if (!propertyId) return res.status(400).json({ error: true, message: "propertyId is required" });

    const prop = await Property.findById(propertyId).select("userId contactInfo").lean();
    if (!prop) return res.status(404).json({ error: true, message: "Property not found" });
    const ownerId = String(prop.userId);

    // If viewer is the owner, tell the client explicitly
    if (String(ownerId) === String(requesterId)) {
      return res.status(200).json({ success: true, self: true });
    }

    // If there’s already a doc, don’t create another; tell client it’s already pending/approved
    const existing = await ContactAccessRequest.findOne({ propertyId, requesterId }).lean();
    if (existing) {
      return res.status(200).json({
        success: true,
        already: true,
        pending: existing.status === "pending",
        approved: existing.status === "approved",
      });
    }

    // Create a new pending request
    const doc = await ContactAccessRequest.create({
      propertyId,
      ownerId,
      requesterId,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    io.to(`user:${ownerId}`).emit("contact_request:new", {
      id: String(doc._id),
      propertyId: String(propertyId),
      requesterId: String(requesterId),
      status: doc.status,
      createdAt: doc.createdAt,
    });

    return res.status(201).json({ success: true, pending: true, requestId: doc._id });
  } catch (err) {
    console.error("POST /contact-access/request error:", err);
    return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});


// GET /contact-access/status/:propertyId (for the requester)
app.get('/contact-access/status/:propertyId', authenticateToken, async (req, res) => {
  try {
    const requesterId = getAuthUserId(req);
    const { propertyId } = req.params;
    const doc = await ContactAccessRequest.findOne({ propertyId, requesterId }).lean();

    if (!doc) return res.json({ approved: false, pending: false });

    return res.json({
      approved: doc.status === 'approved',
      pending: doc.status === 'pending',
      phone: doc.status === 'approved' ? doc.phone : undefined,
      email: doc.status === 'approved' ? doc.email : undefined,
    });
  } catch (err) {
    console.error('GET /contact-access/status error:', err);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// GET /contact-access/inbox?status=pending (for the OWNER)
app.get('/contact-access/inbox', authenticateToken, async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const status = req.query.status || 'pending';

    const items = await ContactAccessRequest.find({ ownerId, status })
      .sort({ createdAt: -1 })
      .populate('requesterId', 'firstName lastName email')
      .populate('propertyId', 'title price')
      .lean();

    res.json({ items });
  } catch (err) {
    console.error('GET /contact-access/inbox error:', err);
    return res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// POST /contact-access/approve  (owner action)
app.post('/contact-access/approve', authenticateToken, async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const { requestId } = req.body;
    const reqDoc = await ContactAccessRequest.findOne({ _id: requestId, ownerId });
    if (!reqDoc) return res.status(404).json({ error: true, message: 'Request not found' });

    // snapshot contact at approval time
    const prop = await Property.findById(reqDoc.propertyId).select('contactInfo').lean();
    reqDoc.status = 'approved';
    reqDoc.approvedAt = new Date();
    reqDoc.phone = prop?.contactInfo?.phone || '';
    reqDoc.email = prop?.contactInfo?.email || '';
    await reqDoc.save();

    // notify requester
    io.to(`user:${reqDoc.requesterId}`).emit('contact_request:updated', {
      propertyId: String(reqDoc.propertyId),
      status: 'approved',
    });

    res.json({ success: true });
  } catch (err) {
    console.error('POST /contact-access/approve error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

// POST /contact-access/deny (owner action)
app.post('/contact-access/deny', authenticateToken, async (req, res) => {
  try {
    const ownerId = getAuthUserId(req);
    const { requestId } = req.body;
    const reqDoc = await ContactAccessRequest.findOneAndUpdate(
      { _id: requestId, ownerId },
      { $set: { status: 'denied', deniedAt: new Date() } },
      { new: true }
    );
    if (!reqDoc) return res.status(404).json({ error: true, message: 'Request not found' });

    io.to(`user:${reqDoc.requesterId}`).emit('contact_request:updated', {
      propertyId: String(reqDoc.propertyId),
      status: 'denied',
    });

    res.json({ success: true });
  } catch (err) {
    console.error('POST /contact-access/deny error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});




// =====================
// Marketplace Routes
// =====================

// after you initialize io:
app.set('io', io);

// require the router
// const marketplaceRouter = require('./routes/marketplace');
// app.use('/marketplace', marketplaceRouter);

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
      images = [],
    } = req.body;
  
    console.log('Creating marketplace item with data:', {
      title,
      description,
      price,
      category,
      condition,
      contactInfo,
      images: images?.length || 0
    });
  
    if (!title || !description || !category) {
      return res.status(400).json({
        error: true,
        message: "Title, description, and category are required",
      });
    }
  
    try {
      // Map contactInfo to location if provided
      const location = contactInfo?.generalLocation ? {
        city: contactInfo.generalLocation,
        state: contactInfo.generalLocation, // Use general location for both
      } : {};
      
      // Map exchange method to delivery options
      const delivery = {
        pickup: contactInfo?.exchangeMethod === 'public' || contactInfo?.exchangeMethod === 'campus',
        localDelivery: false,
        shipping: contactInfo?.exchangeMethod === 'shipping',
      };
      
      const newItem = new MarketplaceItem({
        userId: user._id,
        title,
        description,
        price: price || 0,
        category,
        condition: condition || 'used',
        images: images || [],
        coverIndex: 0,
        location,
        delivery,
        // Store contact info in a custom field for now
        contactInfo: {
          name: contactInfo?.name || '',
          email: contactInfo?.email || '',
          phone: contactInfo?.phone || '',
          exchangeMethod: contactInfo?.exchangeMethod || 'public',
        },
      });
  
      await newItem.save();
      
      console.log('Marketplace item created successfully:', newItem._id);
  
      return res.json({
        error: false,
        item: newItem,
        message: "Marketplace item created successfully",
      });
    } catch (error) {
      console.error("Error creating marketplace item:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return res.status(500).json({
        error: true,
        message: "Internal Server Error",
        details: error.message
      });
    }
  });
  
  // Get all marketplace items
  function escapeRegExp(s = '') {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

app.get('/marketplace/items', async (req, res) => {
  try {
    const {
      q = '',
      category = 'all',
      condition = 'any',
      campus = '',
      delivery = '',                  // '' | pickup | localDelivery | shipping
      min, max,                       // backend-style
      minPrice, maxPrice,             // frontend-style
      cursor = '',                    // ISO date string from FE
      limit = '24',
    } = req.query;

    const lim = Math.min(60, Math.max(1, parseInt(limit, 10) || 24));

    // Start lenient (show active; include legacy with no status if you want)
    const filter = {
      $or: [{ status: 'active' }, { status: { $exists: false } }],
    };

    // Search q (title/description)
    if (q) {
      (filter.$and ||= []).push({
        $or: [
          { title:       { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
        ],
      });
    }

    // Exact (case-insensitive) filters
    if (category && category !== 'all') {
      filter.category = { $regex: `^${escapeRegExp(category)}$`, $options: 'i' };
    }
    if (condition && condition !== 'any') {
      filter.condition = { $regex: `^${escapeRegExp(condition)}$`, $options: 'i' };
    }
    if (campus) {
      filter['location.campus'] = { $regex: `^${escapeRegExp(campus)}$`, $options: 'i' };
    }

    // Delivery booleans (delivery.pickup / delivery.localDelivery / delivery.shipping)
    if (delivery) {
      filter[`delivery.${delivery}`] = true;
    }

    // Price range – accept min/max or minPrice/maxPrice
    const low  = (min ?? minPrice ?? '').toString().trim();
    const high = (max ?? maxPrice ?? '').toString().trim();
    if (low || high) {
      filter.price = {};
      if (low)  filter.price.$gte = Number(low);
      if (high) filter.price.$lte = Number(high);
    }

    // Cursor pagination — FE sends last item's createdAt (ISO) back as cursor
    const sort = { createdAt: -1, _id: -1 };
    if (cursor) {
      const before = new Date(cursor);
      if (!isNaN(before)) {
        (filter.$and ||= []).push({ createdAt: { $lt: before } });
      }
    }

    const items = await MarketplaceItem
      .find(filter)
      .sort(sort)
      .limit(lim)
      .lean();

    const nextCursor = items.length === lim
      ? items[items.length - 1].createdAt
      : null;

    res.json({ items, nextCursor });
  } catch (err) {
    console.error('GET /marketplace/items error:', err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
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

app.post('/marketplace/item/:id/view', async (req, res) => {
  try {
    await MarketplaceItem.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: false }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /marketplace/item/:id/view error', e);
    res.status(200).json({ ok: false }); // keep FE happy even if it fails
  }
});

app.post('/marketplace/favorites/:id', (req, res) => {
  // TODO: implement real per-user favorites (e.g., User.favoriteItemIds)
  res.json({ favored: true });
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
    const userId = req.user.user._id;
    try {
      const unreadCount = await Message.countDocuments({
        receiverId: userId,
        isRead: false
      });
      res.status(200).json({ success: true, count: unreadCount });
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch unread message count' });
    }
  });

// =====================
// Dashboard Overview (NEW)
// =====================
  app.get('/dashboard/overview', authenticateToken, async (req, res) => {
    try {
      const authed = req.user?.user || req.user;
      const userId = authed?._id;

      // latest 6 of each, owned by user
      const [properties, marketplace, conversations] = await Promise.all([
        Property.find({ userId }).sort({ createdAt: -1 }).limit(6).lean(),
        MarketplaceItem.find({ userId }).sort({ createdAt: -1 }).limit(6).lean(),
        Conversation.find({ participants: userId })
          .sort({ lastUpdated: -1 })
          .limit(3)
          .populate({
            path: 'lastMessage',
            select: 'content timestamp senderId',
            populate: { path: 'senderId', select: 'firstName lastName' }
          })
          .lean(),
      ]);

      // simple needs-attention rules on properties
      const needsAttention = [];
      for (const p of properties) {
        if (!p.images || p.images.length === 0)
          needsAttention.push({ type: 'missingImages', targetType: 'property', targetId: String(p._id), label: `Add images to "${p.title}"` });
        if (!p.description || !p.description.trim())
          needsAttention.push({ type: 'missingDescription', targetType: 'property', targetId: String(p._id), label: `Add description to "${p.title}"` });
        if (!p.address || !p.address.trim())
          needsAttention.push({ type: 'missingAddress', targetType: 'property', targetId: String(p._id), label: `Add address to "${p.title}"` });
      }

      // campus pulse v1: latest public marketplace items (can later filter by campus/university)
      const campusPulse = await MarketplaceItem.find({})
        .sort({ createdAt: -1 })
        .limit(6)
        .select('title price thumbnailUrl createdAt')
        .lean();

      const payload = {
        userSummary: {
          firstName: authed.firstName,
          university: authed.university || '',
          digest: `${conversations.length} recent chats • ${properties.length} properties • ${marketplace.length} items`,
        },
        myListings: {
          counts: { propertiesCount: properties.length, marketplaceCount: marketplace.length },
          properties,
          marketplace,
        },
        needsAttention,
        messagesPreview: conversations.map(c => ({
          id: String(c._id),
          lastUpdated: c.lastUpdated,
          lastMessage: c.lastMessage ? {
            content: c.lastMessage.content,
            timestamp: c.lastMessage.timestamp,
            sender: c.lastMessage.senderId ? `${c.lastMessage.senderId.firstName} ${c.lastMessage.senderId.lastName}` : 'Someone'
          } : null,
          participants: (c.participants || []).map(String),
        })),
        campusPulse,
        tasks: [], // can fill later
        profileProgress: { percent: 60, steps: [{ key: 'avatar', done: Boolean(authed.avatar) }] },
      };

      res.json(payload);
    } catch (err) {
      console.error('GET /dashboard/overview error:', err);
      res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
  });

// ========= Solve Threads (Housing) =========
app.post('/solve/housing', authenticateToken, async (req, res) => {
  try {
    const { prompt = "" } = req.body || {};
    const authedUser = req?.user?.user || req?.user || {};
    const campus = authedUser?.campusLabel || authedUser?.university || "";

    // 1) Ask LLM to extract criteria
    const sys = `You extract structured JSON search criteria for student housing.
Return only JSON with keys:
{
  "maxPrice": number|null,
  "bedrooms": number|null,
  "bathrooms": number|null,
  "distanceMiles": number|null,
  "moveIn": string|null,
  "keywords": string[]
}`;
    const userMsg = `Campus: ${campus || "unknown"}\nRequest: ${prompt}`;

    const aiResp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        temperature: 0.2,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userMsg }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEWRUN_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let extracted = {};
    try {
      const txt = aiResp?.data?.choices?.[0]?.message?.content || "{}";
      const m = txt.match(/\{[\s\S]*\}/);
      extracted = m ? JSON.parse(m[0]) : {};
    } catch { extracted = {}; }

    // Build filters
    const strictFilter = {};
    const lenientFilter = {};

    const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

    const maxPrice = toNum(extracted.maxPrice);
    const minBeds  = toNum(extracted.bedrooms);
    const minBaths = toNum(extracted.bathrooms);

    // price / beds / baths go to BOTH strict & lenient queries
    if (maxPrice !== null) {
      strictFilter.price = { $lte: maxPrice };
      lenientFilter.price = { $lte: maxPrice };
    }
    if (minBeds !== null) {
      strictFilter.bedrooms = { $gte: minBeds };
      lenientFilter.bedrooms = { $gte: minBeds };
    }
    if (minBaths !== null) {
      strictFilter.bathrooms = { $gte: minBaths };
      lenientFilter.bathrooms = { $gte: minBaths };
    }

    // Optional keyword filter (strict only) — ignore generic words
    const stop = /^(near|around|close|campus|the|a|an|for|in|at|to|under|less|than|with|and|or|of|me|room|apartment|apt)$/i;
    const tokens = (Array.isArray(extracted.keywords) ? extracted.keywords : [])
      .map(s => String(s || "").trim())
      .filter(s => s && !stop.test(s) && s.length >= 3);

    if (tokens.length) {
      // Build AND-of-ORs: each token must appear in title OR description
      strictFilter.$and = tokens.map(t => ({
        $or: [
          { title:       { $regex: t, $options: 'i' } },
          { description: { $regex: t, $options: 'i' } },
          // don't regex the address object; uncomment if you store a string address:
          // { address:     { $regex: t, $options: 'i' } },
        ]
      }));
    }

    // Query strict first
    let candidates = await Property.find(strictFilter)
      .sort({ createdAt: -1 })
      .limit(12)
      .select('title price bedrooms bathrooms images address distanceFromUniversity description createdAt')
      .lean();

    // Fallback to lenient if strict returns nothing
    if (!candidates.length) {
      candidates = await Property.find(lenientFilter)
        .sort({ createdAt: -1 })
        .limit(12)
        .select('title price bedrooms bathrooms images address distanceFromUniversity description createdAt')
        .lean();
    }

    const criteria = {
      maxPrice: maxPrice ?? null,
      bedrooms: minBeds ?? null,
      bathrooms: minBaths ?? null,
      distanceMiles: extracted.distanceMiles ?? null,
      moveIn: extracted.moveIn ?? null,
      keywords: Array.isArray(extracted.keywords) ? extracted.keywords : [],
      campus,
    };

    const plan = [
      "We parsed your request into search criteria.",
      "Here are matching listings — select ones you like.",
      "Tap Request contact to ask owners (uses SafeContact).",
      "We’ll ping you when owners approve."
    ];

    // Save a thread snapshot
    const threadDoc = await Thread.create({
      userId: authedUser._id,
      kind: 'housing',
      prompt,
      criteria,
      plan,
      candidatesSnapshot: candidates,
      status: 'active',
      meta: { campus }
    });

    return res.json({
      ok: true,
      criteria,
      candidates,
      plan,
      thread: threadDoc,
      threadId: String(threadDoc._id),
    });
  } catch (err) {
    console.error("POST /solve/housing error:", err);
    res.status(500).json({ error: true, message: "Failed to run Solve Thread" });
  }
});


app.get('/threads/:id', authenticateToken, async (req, res) => {
  try {
    const userId = (req.user?.user || req.user)?._id;
    const t = await Thread.findOne({ _id: req.params.id, userId }).lean();
    if (!t) return res.status(404).json({ error: true, message: 'Thread not found' });
    res.json({ thread: t });
  } catch (e) {
    console.error('GET /threads/:id error', e);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});


// Synapse Preference : 

// --- Synapse (roommate) preferences ---
// GET: fetch current user's preferences
app.get("/synapse/preferences", authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId, { synapse: 1 }).lean();
    return res.json({ preferences: user?.synapse || {} });
  } catch (err) {
    console.error("GET /synapse/preferences error:", err);
    return res.status(500).json({ message: "Failed to load preferences" });
  }
});

// POST: upsert (replace) current user's preferences
app.post("/synapse/preferences", authenticateToken, async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const incoming = req.body || {};

    // Only allow the expected top-level keys
    const allowed = ["culture", "logistics", "lifestyle", "habits", "pets", "dealbreakers"];
    const clean = {};
    for (const k of allowed) if (k in incoming) clean[k] = incoming[k];

    // --- normalize: drop primary from otherLanguages + dedupe ---
    const norm = (() => {
      const out = { ...clean };
      const c = { ...(out.culture || {}) };

      const primary =
        typeof c.primaryLanguage === "string" ? c.primaryLanguage.trim() : "";

      let others = Array.isArray(c.otherLanguages) ? c.otherLanguages : [];
      // keep strings only, trim empties, remove primary, and dedupe
      others = [...new Set(
        others
          .filter(x => typeof x === "string")
          .map(x => x.trim())
          .filter(x => x && x !== primary)
      )];

      out.culture = { ...c, otherLanguages: others };
      return out;
    })();

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { synapse: norm } },
      { new: true, projection: { synapse: 1 } }
    ).lean();

    return res.json({ ok: true, preferences: updated?.synapse || {} });
  } catch (err) {
    console.error("POST /synapse/preferences error:", err);
    return res.status(500).json({ message: "Failed to save preferences" });
  }
});



  // --- Synapse (roommate) matches ---
  // Query params:
  //   page (0-based), limit (default 24)
  //   scope: "school" | "country" | "any"   (optional narrowing)
  //   minScore: 0..100 (optional)
  // Notes: keep it simple now; we can iterate on weights later.
  // --- Synapse (roommate) matches ---
  app.get("/synapse/matches", authenticateToken, async (req, res) => {
    try {
      const userId = getAuthUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      // Load the authed user with just what we need
      const me = await User.findById(userId, {
        firstName: 1, lastName: 1, avatar: 1,
        university: 1,
        synapse: 1,
      }).lean();

      const s         = me?.synapse || {};
      const culture   = s.culture   || {};
      const logistics = s.logistics || {};
      const lifestyle = s.lifestyle || {};
      const habits    = s.habits    || {};
      const pets      = s.pets      || {};

      const mePrimary = (culture.primaryLanguage || "").trim();
      const meOthers  = Array.isArray(culture.otherLanguages) ? culture.otherLanguages : [];
      const meComfort = culture.languageComfort || "either";

      const meHomeCountry = (culture.home?.country || "").trim();
      const meHomeRegion  = (culture.home?.region  || "").trim();
      const meHomeCity    = (culture.home?.city    || "").trim();

      const meCommute     = Array.isArray(logistics.commuteMode) ? logistics.commuteMode : [];
      const meCleanliness = Number.isFinite(lifestyle.cleanliness) ? lifestyle.cleanliness : null;

      // Pagination & filters
      const page     = Math.max(0, parseInt(req.query.page ?? "0", 10));
      const limit    = Math.min(50, Math.max(1, parseInt(req.query.limit ?? "24", 10)));
      const minScore = Math.max(0, Math.min(100, parseInt(req.query.minScore ?? "0", 10)));
      const scope    = String(req.query.scope || "school").toLowerCase(); // default to same school

      // Pre-filter candidates. DO NOT require synapse; allow partial profiles.
      const match = { _id: { $ne: me._id } };

      if (scope === "school" && me.university) {
        match.university = me.university;               // <-- top-level university
      } else if (scope === "country" && meHomeCountry) {
        match["synapse.culture.home.country"] = meHomeCountry;
      }
      // else "any": no extra narrowing

      // Scoring weights (simple, tweak anytime)
      const W = {
        langPrimarySame: 25,
        langCrossOK:     15,
        comfortBonus:    10,
        country:         10,
        region:          8,
        city:            6,
        commuteMode:     6,
        sleep:           6,
        cleanlinessNear: 8,
        dietSame:        4,
        smokingSame:     3,
        drinkingSame:    3,
        partiesSame:     3,
        petsCompat:      7,
      };

      // Build the score parts dynamically so we only add checks that have a "me" side
      const scoreParts = [
        // Language
        { $cond: [{ $eq: ["$synapse.culture.primaryLanguage", mePrimary] }, W.langPrimarySame, 0] },
        { $cond: [
          { $in: [ mePrimary, { $ifNull: ["$synapse.culture.otherLanguages", []] } ] },
          W.langCrossOK, 0
        ]},
        { $cond: [
          { $in: [ "$synapse.culture.primaryLanguage", meOthers ] },
          W.langCrossOK, 0
        ]},
        // If my comfort isn't "same", small base
        ...(meComfort !== "same" ? [ { $literal: W.comfortBonus } ] : []),

        // Commute overlap
        { $cond: [
          { $gt: [ { $size: { $setIntersection: [ { $ifNull: ["$synapse.logistics.commuteMode", []] }, meCommute ] } }, 0 ] },
          W.commuteMode, 0
        ]},

        // Sleep & cleanliness
        { $cond: [ { $eq: ["$synapse.lifestyle.sleepPattern", lifestyle.sleepPattern || ""] }, W.sleep, 0 ] },
        ...(meCleanliness !== null ? [{
          $cond: [
            { $and: [
              { $ne: [ { $ifNull: ["$synapse.lifestyle.cleanliness", null] }, null ] },
              { $lte: [ { $abs: { $subtract: [ { $ifNull: ["$synapse.lifestyle.cleanliness", 0] }, meCleanliness ] } }, 1 ] }
            ]},
            W.cleanlinessNear, 0
          ]
        }] : []),

        // Habits
        { $cond: [ { $eq: ["$synapse.habits.diet",      habits.diet      || "" ] }, W.dietSame,     0 ] },
        { $cond: [ { $eq: ["$synapse.habits.smoking",   habits.smoking   || "" ] }, W.smokingSame,  0 ] },
        { $cond: [ { $eq: ["$synapse.habits.drinking",  habits.drinking  || "" ] }, W.drinkingSame, 0 ] },
        { $cond: [ { $eq: ["$synapse.habits.partying",  habits.partying  || "" ] }, W.partiesSame,  0 ] },

        // Pets compatibility (very light check)
        { $cond: [
          { $eq: [ { $ifNull: ["$synapse.pets.okWithPets", true] }, (pets.okWithPets ?? true) ] },
          W.petsCompat, 0
        ] },
      ];

      if (meHomeCountry) scoreParts.push({
        $cond: [ { $eq: ["$synapse.culture.home.country", meHomeCountry] }, W.country, 0 ]
      });
      if (meHomeRegion) scoreParts.push({
        $cond: [ { $eq: ["$synapse.culture.home.region",  meHomeRegion ] }, W.region,  0 ]
      });
      if (meHomeCity) scoreParts.push({
        $cond: [ { $eq: ["$synapse.culture.home.city",    meHomeCity   ] }, W.city,    0 ]
      });

      const pipeline = [
        { $match: match },
        { $addFields: { score: { $add: scoreParts } } },
        ...(minScore > 0 ? [{ $match: { score: { $gte: minScore } } }] : []),
        { $sort: { score: -1, createdOn: -1 } },
        { $skip: page * limit },
        { $limit: limit },
        { $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            avatar: 1,
            university: 1,
            score: 1,
            synapse: 1,
            budgetMax: "$synapse.logistics.budgetMax",
          }
        }
      ];

      const rows = await User.aggregate(pipeline);

      // Post-process for UI niceties (overlap, reasons, flags)
      const toSet = (a) => Array.from(new Set((Array.isArray(a) ? a : []).filter(Boolean)));
      const intersect = (a, b) => {
        const sb = new Set(b || []);
        return toSet(a).filter(x => sb.has(x));
      };

      const matches = rows.map(r => {
        const their = r.synapse || {};
        const tCult = their.culture   || {};
        const tLog  = their.logistics || {};
        const tLife = their.lifestyle || {};
        const tHab  = their.habits    || {};
        const tPets = their.pets      || {};

        const primaryLangSame = tCult.primaryLanguage && mePrimary && tCult.primaryLanguage === mePrimary;

        const theirLangsAll = toSet([ tCult.primaryLanguage, ...(tCult.otherLanguages || []) ]);
        const myLangsAll    = toSet([ mePrimary,            ...meOthers ]);
        const bothLangs     = intersect(theirLangsAll, myLangsAll);

        const commuteOverlap = intersect(tLog.commuteMode || [], meCommute || []);

        const sleepMatch = (tLife.sleepPattern && lifestyle.sleepPattern)
          ? (tLife.sleepPattern === lifestyle.sleepPattern ? "good" : "different")
          : null;

        const cleanMatch = (Number.isFinite(tLife.cleanliness) && meCleanliness !== null)
          ? (Math.abs(Number(tLife.cleanliness) - meCleanliness) <= 1)
          : false;

        const reasons = [];
        if (primaryLangSame) reasons.push("Same daily language");
        if (bothLangs.length) reasons.push(`Both speak ${bothLangs.join(", ")}`);
        if (commuteOverlap.length) reasons.push(`Overlap: ${commuteOverlap.join(" / ")}`);
        if (sleepMatch === "good") reasons.push("Similar sleep hours");
        if (cleanMatch) reasons.push("Clean & tidy");
        if (tPets.okWithPets && (pets.okWithPets ?? true)) reasons.push("Pets are okay");
        if (tHab.diet && habits.diet && tHab.diet === habits.diet) reasons.push(`Both ${tHab.diet}`);

        const flags = {
          // Basic conflict flag: if both have dealbreakers arrays, mark when they intersect
          hasDealbreakerConflict: (
            (their.dealbreakers || []).length &&
            (s.dealbreakers || []).length &&
            intersect(their.dealbreakers, s.dealbreakers).length > 0
          )
        };

        return {
          id: String(r._id),
          name: `${r.firstName || ""} ${r.lastName || ""}`.trim(),
          avatar: r.avatar || "",
          university: r.university || "",              // top-level field
          score: Math.max(0, Math.min(100, Math.round(r.score || 0))),
          homeCity: tCult?.home?.city || "",
          distanceMiles: null,                         // (optional) add real distance later
          budget: Number.isFinite(tLog.budgetMax) ? tLog.budgetMax : undefined,
          overlap: {
            primaryLanguage: primaryLangSame,
            otherLanguages: bothLangs,
            commute: commuteOverlap,
            sleep: sleepMatch,
            clean: cleanMatch,
            petsOk: Boolean(tPets.okWithPets),
            diet: tHab.diet || null,
          },
          reasons,
          flags,
          synapse: their, // keep raw slice if you need more details in the drawer
        };
      });

      return res.json({
        ok: true,
        page,
        limit,
        matches,          // <- what the FE expects
        results: matches, // <- alias for safety with older FE
      });
    } catch (err) {
      console.error("GET /synapse/matches error:", err);
      return res.status(500).json({ message: "Failed to load matches" });
    }
  });

  server.listen(8000, () => {
    console.log('Server is running on port 8000');
});

  module.exports = app;