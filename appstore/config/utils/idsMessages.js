
let db = require('../db'), appModel = db.model('app')
	, settings = require('../settings')
	, FormData = require('form-data');



let reply = (header, payload, opts, res_payload) => {
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
			"@id" : settings.id
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

 	return fd;
 	// res.setHeader('Content-Type', 'multipart/form-data; boundary='+fd.getBoundary());
 	// fd.pipe(res);
}

// header['@type'] == 'ids:AppRegistrationRequestMessage'
let appRegistrationRequestHandler = (header, payload, dat, cb)=>{
	console.log("header['ids:affectedDataApp'] : ", header['ids:affectedDataApp']);
	if ('ids:affectedDataApp' in header){

		appModel.findOne({"metadata.id": header['ids:affectedDataApp']}, (err, app)=>{
			if (err){
				console.log(err);
				cb( reply(header, payload, {type: "ids:RejectionMessage"}, err) );
				return;
			}
			console.log("** app found : ", app);
			if (!app){
				console.log("App not found");
				cb( reply(header, payload, {type: "ids:RejectionMessage"}, err) );
				return;
			}
			Object.assign(app.metadata, payload);
			app.save((err, saved)=>{
				if (err){
					console.log(err);
					cb( reply(header, payload, {type: "ids:RejectionMessage"}, err) );
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
				cb( reply(header, payload, {type: "ids:AppRegistrationResponseMessage"}, catalog_entry) );
			});
		});
	}
	else{
		var app = new appModel({
			metadata : Object.assign(payload, {id: settings.id+'/apps/'+db.Types.ObjectId()}),
			owner_connectorID: header['ids:issuerConnector']["@id"]
		});

		app.save((err, saved)=>{
			if (err){
				console.log(err);
				cb( reply(header, payload, {type: "ids:RejectionMessage"}, err) );
				return;
			}
			
			let catalog_entry = {
				"@id": saved.metadata.id,
			    "@type": [
					"ids:AppResource"
				],
				"ids:description": saved.metadata.description,
			    "ids:title": saved.metadata.name,
			    "ids:comment": saved.metadata.introduction,
			    "ids:keyword": saved.metadata.keywords,
			    "ids:artifact":[{"@id": saved.metadata.id}]
			}

			cb( reply(header, payload, {type: "ids:AppRegistrationResponseMessage"}, catalog_entry) );
		});
	}
}

// header['@type'] == 'ids:AppUploadMessage'
let appUploadHandler = (header, payload, dat, cb)=>{
	if ( !('ids:affectedDataApp' in header) ){
		return reply(header, payload, {type: "ids:RejectionMessage"}, '"ids:affectedDataApp" missing');
	}

	appModel.findOne({"metadata.id": header['ids:affectedDataApp']}, (err, app)=>{
		if (err){
			console.log(err);
			cb( reply(header, payload, {type: "ids:RejectionMessage"}, err) );
			return;
		}
		
		if (!app){
			console.log("App not found");
			cb( reply(header, payload, {type: "ids:RejectionMessage"}, "App not found") );
			return;
		}

		app.artifact = app.artifact ? app.artifact : {};
		Object.assign(app.artifact, payload);
		
		app.save((err, saved)=>{
			if (err){
				console.log(err);
				reply(header, payload, {type: "ids:RejectionMessage"}, err);
				return;
			}

			cb( reply(header, payload, {type: "ids:AppUploadResponseMessage"}, saved.artifact) );
		});
	});
}

// header['@type'] == 'ids:QueryMessage'
let queryHandler = (header, payload, dat, cb)=>{
	appModel.find({}, (err, apps)=>{
		if (err){
			console.log(err);
			return cb( reply(header, payload, {type: "ids:RejectionMessage"}, err) );
		}

		let catalog = apps.map(app => {
			let entry = {
				"@id": app.metadata.id,
			    "@type": [
					"ids:AppResource"
				],
				"ids:description": app.metadata.description,
			    "ids:title": app.metadata.name,
			    "ids:comment": app.metadata.introduction,
			    "ids:keywords": app.metadata.keywords,
			    "ids:artifact":[{"@id": app.metadata.id}]
			}

			return entry;
		});

		// Apply SPARQL ...
		
		// Return result
		cb( reply(header, payload, {type: "ids:ResponseMessage"}, catalog) );
	});
}

// header['@type'] == 'ids:DescriptionRequestMessage'
let descriptionRequestHandler = (header, payload, dat, cb)=>{
	console.log("... SENDING BACK SELF DESCRIPTION ...");
	
	let selfDescription = {
		"@context": "http://w3id.org/idsa/contexts/context.json",
		"@id": settings.id,
		"ids:correlationMessage": settings.id,
		"@type": "ids:AppStore",
		"ids:description": {
			"@value": settings.description,
			"@language": "en"
		},
		"ids:curator": settings.curator,
		"ids:maintainer": settings.maintainer,
		"ids:inboundModelVersion": [ "4.0.0" ],
		"ids:outboundModelVersion": "4.0.0",
		"ids:title": {
			"@value":  settings.title,
			"@language": "en"
		},
		"ldp:contains": {
			"@id": "Catalog"
		},
		"ids:catalog": {
			"@id":  settings.id+"/catalog",
			"@type": [
			  "ids:Catalog",
			  "ldp:BasicContainer"
			],
			"ids:offer": []
		}
	}

	appModel.find({}, (err, apps)=>{
		if (err){
			console.log(err);
			return cb( reply(header, payload, {type: "ids:RejectionMessage"}, err) );
		}

		selfDescription['ids:catalog']['ids:offer'] = apps.map(app => {
			let entry = {
				"@id": app.metadata.id,
			    "@type": [
					"ids:AppResource"
				],
				"ids:description": app.metadata.description,
			    "ids:title": app.metadata.name,
			    "ids:comment": app.metadata.introduction,
			    "ids:keywords": app.metadata.keywords,
			    "ids:artifact":[{"@id": app.metadata.id}]
			}

			return entry;
		});

		
		cb (reply(header, payload, {type: "ids:DescriptionResponseMessage"}, selfDescription) );
	});
}

//header['@type'] == 'ids:ArtifactRequestMessage'
let artifactRequestHandler = (header, payload, dat, cb)=>{
	if ( !('ids:requestedArtifact' in header) ){
		return cb (reply(header, payload, {type: "ids:RejectionMessage"}, '"ids:requestedArtifact" missing') );
	}
	console.log("requestedArtifact: ", header['ids:requestedArtifact']);

	appModel.findOne({"metadata.id": header['ids:requestedArtifact']}, (err, app)=>{
		if (err){
			console.log(err);
			cb( reply(header, payload, {type: "ids:RejectionMessage"}, err) );
			return;
		}
		console.log("App : ", app);
		if (!app){
			console.log("App not found");
			cb( reply(header, payload, {type: "ids:RejectionMessage"}, "App not found") );
			return;
		}
		if (!app.artifact.image){
			console.log("App artifact not defined");
			cb( reply(header, payload, {type: "ids:RejectionMessage"}, "App artifact not defined") );
			return;
		}

		cb( reply(header, payload, {type: "ids:ArtifactResponseMessage"}, app.artifact) );

	});
}

exports.idsReply = reply;

exports.idsMessagesHandler = (req, res, next)=>{
	let {header, payload, dat} = res.locals;
	// console.log("header : ", header);
	// console.log("payload : ", payload);
	// console.log('dat : ', dat);
	
	let messageHandler = null;
	
	switch(header['@type']){
		case 'ids:AppRegistrationRequestMessage':
			messageHandler = appRegistrationRequestHandler;
		break;
		case 'ids:AppUploadMessage':
			messageHandler = appUploadHandler;
		break;
		case 'ids:QueryMessage':
			messageHandler = queryHandler;
		break;
		case 'ids:DescriptionRequestMessage':
			messageHandler = descriptionRequestHandler;
		break;
		case 'ids:AppRegistrationRequestMessage':
			messageHandler = appRegistrationRequestHandler;
		break;
		case 'ids:ArtifactRequestMessage':
			messageHandler = artifactRequestHandler;
		break;
	}

	if (messageHandler == null){
		messageHandler = (header, payload, cb)=>{
			cb( reply(header, payload, {type: "ids:RejectionMessage"}, `Message type ${header['@type']} is not [yet] supported.` ) );
		}
	}

	messageHandler(header, payload, dat, (multipartResponse)=>{

		res.setHeader('Content-Type', 'multipart/form-data; boundary='+multipartResponse.getBoundary());
 		multipartResponse.pipe(res);

	});
}