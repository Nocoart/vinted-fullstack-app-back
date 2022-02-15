const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const isAuthenticated = require("../utils/middleWares");
const Offer = require("../models/Offer");
const User = require("../models/User");

//PUBLISH

router.post("/offer/publish", isAuthenticated, async (req, res) => {
	try {
		const { title, description, price, brand, size, condition, color, city } =
			req.fields;

		const newOffer = new Offer({
			product_name: title,
			product_description: description,
			product_price: price,
			product_details: [
				{ MARQUE: brand },
				{ TAILLE: size },
				{ ÉTAT: condition },
				{ COULEUR: color },
				{ EMPLACEMENT: city },
			],

			owner: req.user,
		});

		const pictureToUpload = req.files.picture.path;
		const savedPicture = await cloudinary.uploader.upload(pictureToUpload, {
			folder: `/vinted/offers/${newOffer._id}`,
		});
		newOffer.product_image = savedPicture;
		await newOffer.save();
		res.status(200).json(newOffer);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

// UPDATE

router.put("/offer/update", isAuthenticated, async (req, res) => {
	try {
		const foundOffer = await Offer.findById(req.fields.id);
		if (!foundOffer) {
			res.status(400).json({ error: `Id missing or incorect` });
		} else {
			// Update image
			if (req.files) {
				await cloudinary.api.delete_resources_by_prefix(
					`${foundOffer.product_image.public_id}`
				);

				const pictureToUpload = req.files.picture.path;
				const savedPicture = await cloudinary.uploader.upload(pictureToUpload, {
					folder: `/vinted/offers/${foundOffer._id}`,
				});

				foundOffer.product_image = savedPicture;
			}
			// Update fields infos if present
			if (req.fields.title) {
				foundOffer.product_name = req.fields.title;
			}
			if (req.fields.description) {
				foundOffer.product_description = req.fields.description;
			}
			if (req.fields.price) {
				foundOffer.product_price = req.fields.price;
			}
			if (req.fields.brand) {
				foundOffer.product_details.MARQUE = req.fields.brand;
			}
			if (req.fields.size) {
				foundOffer.product_details.TAILLE = req.fields.size;
			}
			if (req.fields.condition) {
				foundOffer.product_details.ÉTAT = req.fields.condition;
			}
			if (req.fields.color) {
				foundOffer.product_details.COULEUR = req.fields.color;
			}
			if (req.fields.city) {
				foundOffer.product_details.EMPLACEMENT = req.fields.city;
			}

			await foundOffer.save();

			res.status(200).json(foundOffer);
		}
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

//DELETE

router.delete("/offer/delete", isAuthenticated, async (req, res) => {
	try {
		const foundOffer = await Offer.findById(req.fields.id);
		if (!foundOffer) {
			res.status(400).json({ error: `Id missing or incorect` });
		} else {
			await cloudinary.api.delete_resources_by_prefix(
				`vinted/offers/${foundOffer._id}`
			);

			await cloudinary.api.delete_folder(`/vinted/offers/${foundOffer._id}`);

			await Offer.deleteOne({ _id: req.fields.id });
			res.status(200).json(`Offer successfully deleted`);
		}
	} catch (error) {
		res.status(400).json({ error: error });
	}
});

//SERACH

router.get("/offers", async (req, res) => {
	try {
		let filterObject = {};
		let sortingObject;
		let itemsByPage = Number(req.query.limit);
		let page;

		if (req.query.title) {
			filterObject.product_name = new RegExp(req.query.title, "i");
		}
		if (req.query.priceMin && req.query.priceMax) {
			filterObject.product_price = {
				$gte: Number(req.query.priceMin),
				$lte: Number(req.query.priceMax),
			};
		} else if (req.query.priceMin) {
			filterObject.product_price = { $gte: Number(req.query.priceMin) };
		} else if (req.query.priceMax) {
			filterObject.product_price = { $lte: Number(req.query.priceMax) };
		}
		if (req.query.sort) {
			if (req.query.sort === "price-asc") {
				sortingObject = { product_price: 1 };
			} else if (req.query.sort === "price-desc") {
				sortingObject = { product_price: -1 };
			}
		}

		if (Number(req.query.page) < 1) {
			page = 1;
		} else {
			page = Number(req.query.page);
		}

		const foundOffer = await Offer.find(filterObject)
			.populate("owner", "account _id token")
			.sort(sortingObject)
			.skip((page - 1) * limit)
			.limit(itemsByPage);
		// .select("product_name product_price");

		const count = await Offer.countDocuments(filterObject);

		res.status(200).json({ count: count, foundOffer: foundOffer });
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

//SEARCH by ID

router.get("/offer/:id", async (req, res) => {
	try {
		const foundOffer = await Offer.findById(req.params.id).populate({
			path: "owner",
			select: "account.username account.phone",
		});
		res.status(200).json(foundOffer);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

module.exports = router;
