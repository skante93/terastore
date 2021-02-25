

const request = require('request'), multiparty = require('multiparty');
let db = require('../db'), settings = require('../settings');

let daps = require('./daps'), {idsReply, idsMessagesHandler } = require('./idsMessages');

exports.daps = daps;

exports.getWorkshopApps = ()=>{

	let appModel = db.model('app');
	//console.log("settings : ", settings);
	//console.log("calling : ", settings.marketplaceAPIURL+'/workshops', '...');
	request(
		{
		method: "get",
		url: settings.marketplaceAPIURL+'/workshops',
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${settings.marketplaceAPIToken}`
		}
	}, (err, res, body)=>{
		if (err){
			console.log(`err: ${err}`); 
		}
		else if (res.statusCode != 200){
			console.log(body.error);
			//console.log(` statusCode: ${res.statusCode} | body : ${body}`);
		}
		else{
			//console.log(JSON.parse(body).response.filter(e => e.metadata.type == 'app'));

			appModel.find({}, (err, apps)=>{

				JSON.parse(body).response.filter(e => e.metadata.type == 'app').map((e)=>{
					let id = settings.id+'/apps/'+e._id.toString();

					let spec = {
						
						metadata: {
							id: id,
							introduction: e.metadata.introduction,
							name: e.metadata.name,
							description: e.metadata.description,
							keywords: e.metadata.keywords instanceof Array ? e.metadata.keywords : []
						},
						artifact:{
							image: e.spec.image,
							ports: e.spec.ports,
							settings: e.spec.settings,
							volumes: e.spec.volumes
						},
						owner_connectorID: settings.id
					};

					// Add the "from:marketplace" tag
					spec.metadata.keywords.push('from:marketplace');

					// App found in DB, checking updates
					if (apps.filter (a => a.metadata.id == id).length != 0){
						//console.log("version : ", apps.filter (a => a.id == id)[0].__v);
						//spec.__v = apps.filter (a => a.id == id)[0].__v + 1;
						appModel.update({id: id}, {$set: spec}, (err, editinfo)=>{
							//console.log( err || `Marketplace app "${id}" updated!! ${JSON.stringify(editinfo, null, 2)}` );
						});
					}
					// Creating new App 
					else{			
						new appModel(spec).save((err, app)=>{
							console.log( err || `New app retrieved from marketplace!! ${JSON.stringify(app, null, 2)}` );
						});
					}
				
				});
			});
			//console.log(apps);
		}
	});
}


exports.middlewares = {
	parseMultipartHeaderAndPayload : (req, res, next)=>{
		//console.log("parseMultipartyBody called!!");
		new multiparty.Form().parse(req, function(err, fields, files) {
			if (err){
				console.log(err);
				return next(err);
			}

			// console.log('fields : ', fields);
			// console.log('files : ', files);
			if ( !('header' in fields) ){
				return next(new Error('field "header" is missing'));
			}
			else{
				res.locals.header = fields.header[0];
				if (typeof res.locals.header === 'string'){
					res.locals.header = JSON.parse(res.locals.header);
				}
			}

			if ('payload' in fields || 'payload' in files){
				res.locals.payload = 'payload' in fields ? fields.payload[0] : files.payload[0];
				if ('payload' in fields){
					if (typeof res.locals.payload === 'string'){
						res.locals.payload = JSON.parse(res.locals.payload);
					}
				}
			}

			next();
		});
	},

	dapsAuth : (req, res, next)=>{
		//

		//next();
		
		let header = res.locals.header;
		
		let SECURITY_TOKEN_TYPES = ["ids:DynamicAttributeToken"], SECURITY_TOKEN_FORMATS = ["idsc:JWT"];

		if ( !('ids:securityToken' in header) ){
			return next(new Error('field "securityToken" is mandatory'));
		}
		else {
			// if ( SECURITY_TOKEN_TYPES.indexOf(header['ids:securityToken']['@type']) < 0 ){
			// 	return next(new Error(`field "securityToken -> @type" only one of the following are supported: ${SECURITY_TOKEN_TYPES.join(', ')}`));
			// }
			// if ( SECURITY_TOKEN_FORMATS.indexOf(header['ids:securityToken'].tokenFormat['@id']) < 0){
			// 	return next(new Error(`field "securityToken -> tokenFormat -> @id" must be one of the following : ${SECURITY_TOKEN_FORMATS.join(', ')}`));
			// }
			// if (!header.securityToken.tokenValue){
			// 	return next(new Error(`field "securityToken -> tokenValue" is mandatory`));
			// }

			let token = header['ids:securityToken']['ids:tokenValue'];
			daps.verifyDAT(token, (err, decoded)=>{
				if (err){
					console.log("err:" , err);
					return next('DATVerifyingError: '+err.message);
				}
				res.locals.dat = decoded;
				next();
			});
		}
	},
	
	idsMessagesHandler : idsMessagesHandler
}



