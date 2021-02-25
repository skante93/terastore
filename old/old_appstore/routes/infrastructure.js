
const express = require('express'), router = express.Router(), multiparty = require('multiparty');

var FormData = require('form-data');


// Parsing multipart veriables

module.exports = (conf)=>{
	let appModel = conf.db.model('app');

	let fetchCatalog = (cb)=>{
		appModel.find({}, (err, a)=>{
			if (err){
				console.log(err);
				return cb(err);
			}
			let apps = a.concat(conf.mk_apps).map(app => {
				let catalog_entry = {
					"@id": app.id,
				    "@type": [
						"ids:AppResource"
					],
					"ids:description": app.metadata.description,
				    "ids:title": app.metadata.name,
				    "ids:comment": app.metadata.introduction,
				    "ids:keyword": app.metadata.keywords
				}

				return catalog_entry;
			});

			cb(null, apps);
		});
	}

	let parseMultipartyBody = (req, res, next)=>{
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
	}

	// Check DAT
	let dapsAuthsHandler = (req, res, next)=>{
		//

		next();
		// if (err){
		// 	return next(err);
		// }
		// let header = res.locals.header;
		
		// let SECURITY_TOKEN_TYPES = ["ids:DynamicAttributeToken"], SECURITY_TOKEN_FORMATS = ["idsc:JWT"];

		// if ( !('securityToken' in header) ){
		// 	return next(new Error('field "securityToken" is mandatory'));
		// }
		// else {
		// 	if ( SECURITY_TOKEN_TYPES.indexOf(header.securityToken['@type']) < 0 ){
		// 		return next(new Error(`field "securityToken -> @type" must be one of the following : ${SECURITY_TOKEN_TYPES.join(', ')}`));
		// 	}
		// 	if ( SECURITY_TOKEN_FORMATS.indexOf(header.securityToken.tokenFormat['@id']) < 0){
		// 		return next(new Error(`field "securityToken -> tokenFormat -> @id" must be one of the following : ${SECURITY_TOKEN_FORMATS.join(', ')}`));
		// 	}
		// 	if (!header.securityToken.tokenValue){
		// 		return next(new Error(`field "securityToken -> tokenValue" is mandatory`));
		// 	}
		// }
	};

	// Handle Messages
	let idsMessagesHandler = (req, res, next)=>{
		let {header, payload} = res.locals;

		console.log("header : ", header);
		console.log("payload : ", payload);
		let reply = (opts, res_payload) => {
			res_header = {
				"@context" : {
					"ids" : "https://w3id.org/idsa/core/",
					"idsc" : "https://w3id.org/idsa/code/"
				},
				"@type" : opts.type,
				"@id" : header['@id'],
				"ids:senderAgent" : {
					"@id" : "https://w3id.org/idsa/autogen/baseConnector/7b934432-a85e-41c5-9f65-669219dde4ea"
				},
				"ids:issuerConnector" : {
					"@id" : conf.settings.id
				},
				"ids:issued" : {
					"@value" : new Date(),
					"@type" : "http://www.w3.org/2001/XMLSchema#dateTimeStamp"
				},
				"ids:modelVersion" : "4.0.0",
				"ids:securityToken" : {
					"@type" : "ids:DynamicAttributeToken",
					"@id" : "https://w3id.org/idsa/autogen/dynamicAttributeToken/21b0ba17-dfb3-42f2-b7d0-ece4debfa4af",
					"ids:tokenValue" : "...",
					"ids:tokenFormat" : {
						"@id" : "idsc:JWT"
					}
				},
				"ids:recipientConnector" : header['ids:recipientConnector']
		    }

		    let fd = new FormData();
		    
		    fd.append('header', JSON.stringify(res_header));
		    
		    if (res_payload){
		 		fd.append('payload', JSON.stringify(res_payload));
		 	}

		 	res.setHeader('Content-Type', 'multipart/form-data; boundary='+fd.getBoundary());
		 	fd.pipe(res);
		}
		
		if (header['@type'] == 'ids:AppRegistrationRequestMessage' ){
			//
			if ('ids:affectedDataApp' in header){
				appModel.findOne({id: header['ids:affectedDataApp']}, (err, app)=>{
					if (err){
						console.log(err);
						return;
					}
					
					if (!app){
						console.log("App not found");
						return;
					}
					Object.assign(app.metadata, payload);
					app.save((err)=>{
						if (err){
							console.log(err);
							return;
						}
					});
				});
			}
			else{
				var app = new appModel({
					id: conf.settings.id+'/apps/'+conf.db.Types.ObjectId(),
					metadata : payload,
					connector: header['ids:issuerConnector']["@id"]
				});

				app.save((err, saved)=>{
					if (err){
						console.log(err);
						reply({type: "ids:RejectionMessage"}, err);
						return;
					}
					
					let catalog_entry = {
						"@id": saved.id,
					    "@type": [
							"ids:AppResource"
						],
						"ids:description": saved.metadata.description,
					    "ids:title": saved.metadata.name,
					    "ids:comment": saved.metadata.introduction,
					    "ids:keyword": saved.metadata.keywords
					}

					reply({type: "ids:AppRegistrationResponseMessage"}, catalog_entry);
				});
			}

		}
		else if (header['@type'] == 'ids:AppUploadMessage' ){
			//
			if ( !('ids:affectedDataApp' in header) ){
				return reply({type: "ids:RejectionMessage"}, '"ids:affectedDataApp" missing');
			}

			appModel.findOne({id: header['ids:affectedDataApp']}, (err, app)=>{
				if (err){
					console.log(err);
					reply({type: "ids:RejectionMessage"}, err);
					return;
				}
				
				if (!app){
					console.log("App not found");
					reply({type: "ids:RejectionMessage"}, "App not found");
					return;
				}

				app.spec = app.spec ? app.spec : {};
				Object.assign(app.spec, payload);
				app.save((err, saved)=>{
					if (err){
						console.log(err);
						reply({type: "ids:RejectionMessage"}, err);
						return;
					}

					reply({type: "ids:AppUploadResponseMessage"}, saved.spec);
				});
			});
		}
		// QueryMessage
		else if (header['@type'] == 'ids:QueryMessage' ){
			//
			fetchCatalog((err, cat)=>{
				if (err){
					reply({type: "ids:RejectionMessage"}, err);
					return;
				}
				
				// Apply SPARQL
				reply({type: "ids:ResponseMessage"}, cat);
			});
		}
		else if (header['@type'] == 'ids:DescriptionRequestMessage' ){
			//
			console.log("... SENDING BACK SELF DESCRIPTION ...");
			let selfDescription = {
				"@context": "http://w3id.org/idsa/contexts/context.json",
				"@id": conf.settings.id,
				"@type": "ids:AppStore",
				"ids:description": {
					"@value": conf.settings.description,
					"@language": "en"
				},
				"ids:curator": conf.settings.curator,
				"ids:maintainer": conf.settings.maintainer,
				"ids:inboundModelVersion": [ "4.0.0" ],
				"ids:outboundModelVersion": "4.0.0",
				"ids:title": {
					"@value": conf.settings.title,
					"@language": "en"
				},
				"ldp:contains": {
					"@id": "Catalog"
				},
				"ids:catalog": {
					"@id": conf.settings.id+"/catalog",
					"@type": [
					  "ids:Catalog",
					  "ldp:BasicContainer"
					],
					"ids:offer": []
				}
			}

			fetchCatalog((err, cat)=>{
				if (err){
					reply({type: "ids:RejectionMessage"}, err);
					return;
				}
				selfDescription['ids:catalog']['ids:offer'] = cat;

				//console.log("selfDescription : ", selfDescription);
				reply({type: "ids:DescriptionResponseMessage"}, selfDescription);
			});
		}
		else if ( header['@type'] == 'ids:ArtifactRequestMessage'){
			if ( !('ids:requestedArtifact' in header) ){
				return reply({type: "ids:RejectionMessage"}, '"ids:requestedArtifact" missing');
			}
			console.log("requestedArtifact: ", header['ids:requestedArtifact']);

			appModel.findOne({id: header['ids:requestedArtifact']}, (err, app)=>{
				if (err){
					console.log(err);
					reply({type: "ids:RejectionMessage"}, err);
					return;
				}
				console.log("App : ", app);
				if (!app){
					console.log("App not found");
					reply({type: "ids:RejectionMessage"}, "App not found");
					return;
				}

				reply({type: "ids:ArtifactResponseMessage"}, app.spec);

			});
		}
		// else if (header['@type'] == 'ids:DescriptionRequestMessage' ){
		// 	//
		// }
	};

	let errHandler = (err, req, res, next)=>{
		res.status(err.status || 500).json({ status: err.status, message: err.message, stack: err.stack });
	}

	router.post('/', [parseMultipartyBody, dapsAuthsHandler, idsMessagesHandler, errHandler]);

	return router;
}