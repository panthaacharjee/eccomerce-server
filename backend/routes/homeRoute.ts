const expressHomeRoute = require("express");
const homeRouter = expressHomeRoute.Router();

const { getSliders, getNavitems, getCategory } = require("../controllers/homeController");

homeRouter.route("/all/sliders").get(getSliders);
homeRouter.route("/navitems").get(getNavitems);
homeRouter.route("/category").get(getCategory);

module.exports = homeRouter;
