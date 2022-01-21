const express = require("express");
const cloudinary = require("cloudinary").v2;

const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

const router = express.Router();

const User = require("../models/User");
const verifyEmail = require("../utils/verifyInput");

// SIGNUP

router.post("/user/signup", async (req, res) => {
	try {
		if (await User.findOne({ email: req.fields.email.toLocaleLowerCase() })) {
			res.status(400).json({ error: `This email already exists` });
		} else if (!req.fields.username || !req.fields.email) {
			res.status(400).json({ error: `email or username missing` });
		} else {
			if (!verifyEmail(req.fields.email)) {
				res.status(400).json({ error: `Invalid email input` });
			} else {
				//Account setup

				const salt = uid2(16);
				const token = uid2(16);
				const hash = SHA256(req.fields.password + salt).toString(encBase64);

				const newUser = new User({
					email: req.fields.email.toLocaleLowerCase(),
					account: {
						username: req.fields.username,
						phone: req.fields.phone,
					},
					token: token,
					hash: hash,
					salt: salt,
				});

				if (req.files) {
					const pictureToUpload = req.files.picture.path;
					const savedPicture = await cloudinary.uploader.upload(
						pictureToUpload,
						{
							folder: `/vinted/users/${newUser._id}`,
						}
					);
					console.log(savedPicture);
					newUser.account.avatar = savedPicture;
					console.log(newUser);
				}

				await newUser.save();

				// Response

				res.status(200).json({
					id: newUser._id,
					email: newUser.email,
					username: newUser.account.username,
					phone: newUser.account.phone,
					token: newUser.token,
				});
			}
		}
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

//LOGIN

router.post("/user/login", async (req, res) => {
	const email = req.fields.email;
	const foundUser = await User.findOne({ email: email.toLocaleLowerCase() });
	if (!foundUser) {
		res.status(400).json({ message: `Email and password do not match` });
	} else {
		const newHash = SHA256(req.fields.password + foundUser.salt).toString(
			encBase64
		);
		if (newHash === foundUser.hash) {
			res.status(200).json({ message: `authentification completed` });
		} else {
			res.status(400).json({ message: `Email and password do not match` });
		}
	}
});

//UPDATE

router.post("/user/update", async (req, res) => {
	try {
		const foundUser = await User.findById(req.fields.id);
		if (!foundUser) {
			res.status(400).json({ error: `Id missing or incorect` });
		} else {
			// Update image
			if (req.files) {
				await cloudinary.api.delete_resources_by_prefix(
					`${foundUser.account.avatar.public_id}`
				);

				const pictureToUpload = req.files.picture.path;
				const savedPicture = await cloudinary.uploader.upload(pictureToUpload, {
					folder: `/vinted/users/${foundUser._id}`,
				});

				foundUser.account.avatar = savedPicture;
			}
			// Update fields infos if present
			if (req.fields.email) {
				foundUser.email = req.fields.email;
			}
			if (req.fields.username) {
				foundUser.account.username = req.fields.username;
			}
			if (req.fields.phone) {
				foundUser.account.phone = req.fields.phone;
			}
			if (req.fields.password) {
				foundUser.hash = SHA256(req.fields.password + foundUser.salt).toString(
					encBase64
				);
			}

			await foundUser.save();

			res.status(200).json(foundUser);
		}
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

module.exports = router;
