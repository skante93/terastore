


let settings = require('../settings'), request = require('request'), jsonwebtoken = require('jsonwebtoken');
let fs = require('fs');

//console.log(' *** SETTINGS : ', settings);

let daps_token_url = `${settings.daps_scheme}://${settings.daps_host}:${settings.daps_port}${settings.daps_token_path}`;
let daps_pem_url = `${settings.daps_scheme}://${settings.daps_host}:${settings.daps_port}${settings.daps_pem_path}`
//console.log('Getting private key : ', settings.private_key_path);
let private_key = fs.readFileSync(settings.private_key_path, {encoding: 'utf8'});
//console.log('Getting public cert : ', settings.public_cert_path);
let public_cert = fs.readFileSync(settings.public_cert_path, {encoding: 'utf8'});
//console.log(daps_token_url);

let requestDAT = (cb)=>{
	//
	let timestamp = (new Date).valueOf(), now_sec = Math.floor(timestamp / 1000);

	let jwt_client_payload = {
        //'@context': {
        //    "@base": {
        //        '@prefix': false,
        //        '@id':     "http://www.rfc-editor.org/rfc/rfc7519.txt",
        //        '@vocab':  ""
        //    },
        //    "ids":   "https://w3id.org/idsa/core/"
        //},
        '@context': "https://w3id.org/idsa/contexts/context.jsonld",
        '@type': "ids:DatPayload",
        'id': settings.idsuuid,
        //'iss':      settings.idsuuid,
        'aud':      "", //settings.jwt_audience,
        'sub':      settings.idsuuid,
        'scope': "idsc:ids_connector_attributes",
        //'name':     name,
        //"jti":      `${settings.id}/jti/${settings.idsuuid}/${timestamp}/${Math.floor((Math.random() * Number.MAX_SAFE_INTEGER) + 1)}`,
        'iat':      now_sec,
        //REM: you can play around with it's 'issued at'
        //'iat':  Math.floor(now_sec - 2000),
        'exp':      Math.floor((now_sec + (60 * 60))) /** will be fresh for one hour */
        //REM: you can play around with it's experation time
        //'exp':  Math.floor(now_sec + 5) /* will be fresh for five seconds */
        //'exp':  now_sec - 1 /** will be declined by DAPS, because it's already expired (one second in the past */
        ,
        //'ids':      "requestSecurityProfile",
        'nbf': now_sec
    }

    //console.log(`${new Date().toISOString()} : jwt_client_payload : ${JSON.stringify(jwt_client_payload, "", "\t")}`);

	// request({
	// 	method: 'post',
	// 	url: daps_token_url,

	// })
	jsonwebtoken.sign( jwt_client_payload, private_key, { 'algorithm': settings.jwt_sign_algorithm }, (err, token) => {
		//console.log("WOOO token : ", err || token);
		let dat_request_opts = {
            'method': "POST",
            'url': daps_token_url,
            //'proxy': proxy,
            'form': {
                'grant_type': "client_credentials",
                'client_assertion_type': "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                //'client_assertion': "JWTC1",
                'client_assertion': token,
                //'scope': "ids_connector",
                'scope': "https://w3id.org/idsa/core/Connector"
                //'assertion':             token
            }, // form
            'agentOptions': {
                'key':  private_key,
                'cert': public_cert
            }
        }

        //console.log(`${new Date().toISOString()} : dat_request_opts : ${JSON.stringify(dat_request_opts, "", "\t")}`);

        request(dat_request_opts, (err, res, body) => {
        	//console.log(`[${res.statusCode}]: ${JSON.stringify(err || body)}`);

        	try{
        		cb(null, JSON.parse(body).response );
        	}
        	catch(e){
        		cb(e);
        	}
        });
	});
}

// requestDAT((err, dat)=>{
// 	console.log(err || dat);
// });

let getRootPem = (cb)=>{
	request({
		method: 'GET',
		url: daps_pem_url
	}, (err, res, body)=>{
		//console.log(err || body);
		cb(err, body);
	});
}

//getRootPem((err, pem)=>{ console.log(err || pem); });

let verifyDAT = (dat, cb)=>{
	getRootPem((err, pem)=>{
		if (err){
			console.log(err);
		}
		else{
			//console.log("** PEM ** ", pem);
			jsonwebtoken.verify(dat, pem, cb);
		}
	});
}

//let exple_dat = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJAY29udGV4dCI6Imh0dHBzOi8vamlyYS5pYWlzLmZyYXVuaG9mZXIuZGUvc3Rhc2gvcHJvamVjdHMvSUNUU0wvcmVwb3MvaWRzLWluZm9tb2RlbC1jb21tb25zL3Jhdy9qc29ubGQtY29udGV4dC8zLjAuMC9jb250ZXh0Lmpzb25sZCIsIkB0eXBlIjoiaWRzOkRhdFBheWxvYWQiLCJzdWIiOiI4MWViM2NkYS04OTFhLTQyOWUtOWQ2Yy03NzFhYWUzMWM2NzQiLCJhdWQiOiIiLCJzY29wZSI6Imlkc2M6aWRzX2Nvbm5lY3Rvcl9hdHRyaWJ1dGVzIiwicmVmZXJyaW5nQ29ubmVjdG9yIjoiIiwidHJhbnNwb3J0Q2VydHNTaGEyNTYiOiIiLCJzZWN1cml0eVByb2ZpbGUiOiJiYXNlIiwiZXh0ZW5kZWRHdWFyYW50ZWUiOiIiLCJpYXQiOjE2MTQxOTA2NTYsImV4cCI6MTYxNDI3NzA1Nn0.JYWgiUZaKuvkqcRP0hLj_nZBhzE0zatLHoFB5hRUXB3ttH4Hq1nRQriOODkbREejeX3YHMy9EXtRSsOi9tBNAL9nNHqpPLOaNYMSWOjeE3oiZwspQxZ4aSGEpcfe6SWkNsjBAzrUbrin3_nSPx6N0X-fity6UKUTH9ZrDLRoEORfsbjobxScnYv450O2evnQy7cpEvdo7ZssyliJhw0IPGG6Jd2B4kkdsjnT8bRReu2mk5VfX_MaLoIqxXcDtREixxc76J2unIXWfMKPTLbh19Z4OVRdJf7uB5H7XxAed5HXsIiy7u-YgM3x-DtVLffh2lMSjc2x7T_Ym5XTVQlpbw";
//verifyDAT(exple_dat);

exports.requestDAT = requestDAT;
exports.getRootPem = getRootPem;
exports.verifyDAT = verifyDAT;
