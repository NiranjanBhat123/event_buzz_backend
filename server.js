const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Define the Event schema
const eventSchema = new mongoose.Schema({
  name: String,
  date: String,
  hour: Number,
  mins: Number,
  description: String,
  registrations: { type: Number, default: 0 },
  organizerClub: String,
  image: String,
  Eventlocation: String,
  detailedDiscription: String,
});

// Define the Registration schema
const registrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
  },
  name: String,
  email: String,
  branch: {
    type: String,
    enum: ["CSE", "ISE", "ECE", "EEE", "Civil", "Mechanical"],
  },
  phone: String,
});

// Create models
const Event = mongoose.model("Event", eventSchema, "events");
const Registration = mongoose.model(
  "Registration",
  registrationSchema,
  "registration"
);

const uri =
  "mongodb+srv://niranjanbhat12702:Prohvj1DyDGl25Vn@eventbuzz.hl3vxlo.mongodb.net/eventsDB?retryWrites=true&w=majority&appName=EventBUZZ";

// Connect to MongoDB
mongoose
  .connect(uri)
  .then(() => {
    console.log("MongoDB connected successfully");

    // Print database and collection details
    const db = mongoose.connection;
    console.log(`Connected to database: ${db.name}`);
   
  })
  .catch((err) => console.log("MongoDB connection error: ", err));

// Get all events
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).send(err);
  }
});

// Get event by ID
app.get("/api/events/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.warn("Invalid event ID:", req.params.id);
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      console.warn("Event not found for ID:", req.params.id);
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Register for an event
app.post("/api/register", async (req, res) => {
  const { eventId, name, email, branch, phone } = req.body;

  if (!eventId || !name || !email || !branch || !phone) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingRegistration = await Registration.findOne({
      eventId,
      $or: [{ email }, { phone }],
    });

    if (existingRegistration) {
      return res
        .status(400)
        .json({
          message: "Email or phone number already registered for this event",
        });
    }

    const registration = new Registration({
      eventId,
      name,
      email,
      branch,
      phone,
    });
    await registration.save();
    await Event.findByIdAndUpdate(eventId, { $inc: { registrations: 1 } });

    res.status(201).json({ message: "Registration successful", registration });
  } catch (error) {
    console.error("Error saving registration:", error);
    res.status(500).json({ message: "Error saving registration" });
  }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
