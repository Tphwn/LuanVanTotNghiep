const express = require("express");
const router = express.Router();
const controller = require("./amenity.controller");

router.get("/",        controller.getAll);
router.post("/",       controller.create);
router.put("/:id",     controller.update);
router.delete("/:id",  controller.delete);

router.get("/requests",              controller.getRequests);
router.patch("/requests/:id/approve", controller.approveRequest);
router.patch("/requests/:id/reject",  controller.rejectRequest);

module.exports = router;