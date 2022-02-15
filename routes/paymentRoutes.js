const express = require("express");
const router = express.Router();
const createStripe = require("stripe");

const stripe = createStripe(process.env.STRIPE_API_SECRET);

router.post("/payment", async (req, res) => {
	try {
		const response = await stripe.charges.create({
			amount: (req.fields.amount * 100).toFixed(0),
			currency: "eur",
			description: `paiement vinted for ${req.fields.title}`,
			source: req.fields.token,
		});

		res.json(response.status);
	} catch (error) {
		console.log(error.message);
		res.status(400).json({ error: error.message });
	}
});

module.exports = router;
