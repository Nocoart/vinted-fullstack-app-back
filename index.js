require("dotenv").config();

const express = require("express");
const cors = require("cors");
const formidable = require("express-formidable");
const mongoose = require("mongoose");

const cloudinary = require("cloudinary").v2;

cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.API_KEY,
	api_secret: process.env.API_SECRET,
});

const app = express();
app.use(formidable());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

const userRoutes = require("./routes/userRoutes");
app.use(userRoutes);

const offerRoutes = require("./routes/offerRoutes");
app.use(offerRoutes);

const paymentRoutes = require("./routes/paymentRoutes");
app.use(paymentRoutes);

app.get("/", (req, res) => {
	res.json(`FEU`);
});

app.all("*", (req, res) => {
	res.status(404).json(`Page not found 😔`);
});

app.listen(process.env.PORT, () => {
	console.log(`Server started 🔥`);
});
