var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {
	let {grant_type, client_assertion_type, client_assertion, scope} = req.query;

	let decoded = jwt.decode(client_assertion);

	let response = {
		"@context": "https://w3id.org/idsa/contexts/3.0.0/context.json",
		"@type": "ids:DatPayload",
		"iss": "https://teradaps.tl.teralab-datascience.fr",
		"sub": decoded.sub,
		"exp": Date.now()+60*1000,
		"securityProfile": "idsc:BaseConnector"
		// "iss": "DD:CB:FD:0B:93:84:33:01:11:EB:5D:94:94:88:BE:78:7D:57:FC:4A:keyid:CB:8C:C7:B6:85:79:A8:23:A6:CB:15:AB:17:50:2F:E6:65:43:5D:E8",
		// "sub": "DD:CB:FD:0B:93:84:33:01:11:EB:5D:94:94:88:BE:78:7D:57:FC:4A:keyid:E1:8C:C7:B6:85:79:A8:23:A6:CB:03:AB:17:50:2F:E6:65:43:5D:F9",
		// "exp": 1600000000,
		// "iat": 1585149036,
		// "nbf": 1585149036,
		// "aud": "soliot",
		// "scope": "https://w3id.org/idsa/core/Connector",
		// "referringConnector": "http://localhost",
		// "transportCertsSha256": [
		// 	"public key of transport cert"
		// ],
		// "securityProfile": "idsc:BaseConnector",
		// "extendedGuarantee": [
		// 	"idsc:REMOTE_LOGGING"
		// ]
	}

	let token = jwt.sign(response);
	res.end(token);
});

module.exports = router;
