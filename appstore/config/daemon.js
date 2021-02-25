

let db = require('./db'), settings = require('./settings');


const { getWorkshopApps, daps } = require('./utils');

// 
// GET Marketplace Apps periodically
//
getWorkshopApps();
setInterval(getWorkshopApps, 1000*30); // Try each 1/2 minute

let getNewDAT = ()=>{
	daps.requestDAT((err, dat)=>{
		//console.log(err || dat);
		if (err){
			return console.log(err);
		}
		DAT = dat;
		console.log("* DAT", DAT);
	});
}

getNewDAT();
setInterval(getNewDAT, 1000*3600); // Try each hour
