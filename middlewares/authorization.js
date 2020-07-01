const CustomError = require('../helpers/customError');

module.exports = async (req, res, next) => {
    if (req.user.userType != "admin" ) throw CustomError(401, "You have no permission");
    next();
}