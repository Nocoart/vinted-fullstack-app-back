const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
	const token = req.headers.authorization.replace("Bearer ", "");
	const foundUser = await User.findOne({ token: token });
	if (foundUser) {
		req.user = foundUser;
		next();
	} else {
		res.status(400).json({ error: `authentication failed` });
	}
};

module.exports = isAuthenticated;
