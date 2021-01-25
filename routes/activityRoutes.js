const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

//lifting html page
router.get('/lifting', activityController.get_activity_list_page);

//form to add a new lift/submission of form
router.get('/add-lift:exType', activityController.get_add_activity_form);
router.post('/add-lift', activityController.add_activity_db);

//get specific lift and its vals
router.get('/get-lift:id', activityController.get_activity_page);
router.get('/get-vals:id', activityController.get_activity_values);

//modify a lift: add/remove from array, change name
router.get('/mod-lift:id', activityController.get_modify_activity_page);
router.put('/mod-lift:id', activityController.modify_activity_db);

//delete a lift
router.get('/rem-lift:id', activityController.get_remove_activity_page);
router.delete('/del-lift:id', activityController.remove_activity);

module.exports = router;