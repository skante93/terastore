

let db = require('./db'), settings = require('./settings');


const { getWorkshopApps } = require('./utils')

// 
// GET Marketplace Apps periodically
//
getWorkshopApps();
setInterval(getWorkshopApps, 1000*30); // Try each 1/2 minute

