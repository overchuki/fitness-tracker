const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

//activity html page
router.get('/act-list:exType', activityController.get_activity_list_page);

//form to add a new activity/submission of form
router.get('/add-act:exType', activityController.get_add_activity_form);
router.post('/add-act', activityController.add_activity_db);

//get specific activity and its vals
router.get('/get-act:id', activityController.get_activity_page);
router.get('/get-vals:id', activityController.get_activity_values);

//modify an activity: add/remove from array, change name
router.get('/mod-act:id', activityController.get_modify_activity_page);
router.put('/mod-act:id', activityController.modify_activity_db);

//delete a activity
router.get('/rem-act:id', activityController.get_remove_activity_page);
router.delete('/del-act:id', activityController.remove_activity);

//dev method
router.get('/test-endpoint', activityController.test_endpoint);

module.exports = router;