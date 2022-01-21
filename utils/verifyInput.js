const verifyEmail = (string) => {
	if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(string)) {
		return true;
	} else {
		return false;
	}
};

module.exports = verifyEmail;
