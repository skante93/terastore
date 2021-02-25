
import requests
import json
import uuid
import datetime
from requests_toolbelt.multipart import decoder

TERASTORE_URL = 'http://appstore:3000'
PROVIDER_DAT="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJAY29udGV4dCI6Imh0dHBzOi8vamlyYS5pYWlzLmZyYXVuaG9mZXIuZGUvc3Rhc2gvcHJvamVjdHMvSUNUU0wvcmVwb3MvaWRzLWluZm9tb2RlbC1jb21tb25zL3Jhdy9qc29ubGQtY29udGV4dC8zLjAuMC9jb250ZXh0Lmpzb25sZCIsIkB0eXBlIjoiaWRzOkRhdFBheWxvYWQiLCJzdWIiOiI4MWViM2NkYS04OTFhLTQyOWUtOWQ2Yy03NzFhYWUzMWM2NzQiLCJhdWQiOiIiLCJzY29wZSI6Imlkc2M6aWRzX2Nvbm5lY3Rvcl9hdHRyaWJ1dGVzIiwicmVmZXJyaW5nQ29ubmVjdG9yIjoiIiwidHJhbnNwb3J0Q2VydHNTaGEyNTYiOiIiLCJzZWN1cml0eVByb2ZpbGUiOiJiYXNlIiwiZXh0ZW5kZWRHdWFyYW50ZWUiOiIiLCJpYXQiOjE2MTQyNTA3MTEsImV4cCI6MTYxNDMzNzExMX0.QmZgRns50-c3PDkvenG3m-IwPPBEn04LIr5x2PlHwko_cbmBBMKD0vyKVCm5uSBmNUTC6BezARpmjEwiBaDclAYBdg6C9p4i3pd_6aO3s4S75uUAhHUL1yQCcnQ7DwDkGtMFCSXw27wEF8KupCY-3FOlrVQ8QnJ9oBNqKSTErT2rkn5IDTjp-nlbFZSN3nFIrDESHMyG4Y7gvoPdbPRYNSagczHvY70O34lzn-QkI8SAQ7v8BJUfldK_fC3Mm1TRA6xUCpo__9XLjXLO7t4FDJpTqCp1_axiu3MXZAgzK9Y-mlkYqRVpkguqlp0C7hEgyVDUR9l-WI0BZ_ZGsukd9Q"
CONSUMER_DAT = PROVIDER_DAT

with open('specs/provider.json', "r") as provider:
    providerSpec = json.load(provider)
with open('specs/consumer.json', "r") as consumer:
    consumerSpec = json.load(consumer)
    
#print("providerSpec", providerSpec)


def tabn(s, n=1):
    tabs = '\t'*n
    return tabs + s.replace('\n', '\n'+tabs)

def log(name, reqs):
    
    for i, req in enumerate(reqs):
        hp_req, hp_res = req
        log  = ">>> REQUEST >>>"
        log += "\n\t === HEADER ===\n" 
        log += tabn(json.dumps(hp_req[0], indent=4), 2)
        log += "\n\t === END HEADER ===\n"

        log += "\n\t === PAYLOAD ===\n" 
        if hp_req[1] != None:
            log += tabn(json.dumps(hp_req[1], indent=4), 2)
        else:
            log += "\t\t- NO PAYLOAD -"
        log += "\n\t === END PAYLOAD ===\n"

        log += " \n\n"

        log += "<<< RESPONSE <<<"
        log += "\n\t === HEADER ===\n" 
        log += tabn(json.dumps(hp_res[0], indent=4), 2)
        log += "\n\t === END HEADER ===\n"

        log += "\n\t === PAYLOAD ===\n" 
        if hp_res[1] != None:
            log += tabn(json.dumps(hp_res[1], indent=4), 2)
        else:
            log += "\t\t- NO PAYLOAD -"
        log += "\n\t === END PAYLOAD ===\n"

        with open('logs/%s_%d.log' %(name, i), 'w') as f:
            f.write(log)
            f.close()

def sendRequest(header, payload):
    #{header: header, payload : payload}}header: header, payload : payload}
    res = requests.post(url = TERASTORE_URL + '/infrastructure', files = dict(header=header, payload=payload))
    
    print(res)

def randomMessageID (messageType, connector="provider"):
    id = providerSpec['@id'] if connector == "provider" else consumerSpec['@id']
    
    return id + '/'+ messageType +'/' + str(uuid.uuid4())

def decodeMultipartResponse(res):
    
    content_type = res.headers['Content-Type']
    multipart_string = res.content
    
    header = None
    payload = None
    
    for part in decoder.MultipartDecoder(multipart_string, content_type).parts:
        if 'name="header"' in str(part.headers) :
            header = json.loads(part.text)
        if 'name="payload"' in str(part.headers) :
            payload = json.loads(part.text)
    return (header, payload)

def getSelfDescription(connector="provider", log_exchanges=False):
    connectorSpec = providerSpec if connector == "provider" else consumerSpec

    header = {
      "@context" : {
        "ids" : "https://w3id.org/idsa/core/",
        "idsc" : "https://w3id.org/idsa/code/"
      },
      "@type" : "ids:DescriptionRequestMessage",
      "@id" : randomMessageID("descriptionRequestMessage", connector),
      "ids:senderAgent" : {
        "@id" : "https://w3id.org/idsa/autogen/baseConnector/7b934432-a85e-41c5-9f65-669219dde4ea"
      },
      "ids:issuerConnector" : {
        "@id" : connectorSpec['@id']
      },
      "ids:issued" : {
        "@value" : str(datetime.datetime.now()),
        "@type" : "http://www.w3.org/2001/XMLSchema#dateTimeStamp"
      },
      "ids:modelVersion" : "4.0.0",
      "ids:securityToken" : {
        "@type" : "ids:DynamicAttributeToken",
        "@id" : "https://w3id.org/idsa/autogen/dynamicAttributeToken/21b0ba17-dfb3-42f2-b7d0-ece4debfa4af",
        "ids:tokenValue" : PROVIDER_DAT if connector == "provider" else CONSUMER_DAT,
        "ids:tokenFormat" : {
          "@id" : "idsc:JWT"
        }
      },
      "ids:recipientConnector" : [ 
          {
            "@id" : connectorSpec['@id']
          } 
      ]
    }
    
    
    res = requests.post(url = TERASTORE_URL + '/infrastructure', files = {'foo': 'bar'}, data = {'header': json.dumps(header)})
    
    decoded_res = decodeMultipartResponse(res)
    
    if log_exchanges:
        hp_req = (header, None)
        hp_res = decoded_res
        
        log('get_self_description', [(hp_req, hp_res)])
    
    return decoded_res


def getCatalog(connector='consumer', log_exchanges=False):
    connectorSpec = providerSpec if connector == "provider" else consumerSpec

    header = {
      "@context" : {
        "ids" : "https://w3id.org/idsa/core/",
        "idsc" : "https://w3id.org/idsa/code/"
      },
      "@type" : "ids:QueryMessage",
      "@id" : randomMessageID("queryMessage", connector),
      "ids:senderAgent" : {
        "@id" : "https://w3id.org/idsa/autogen/baseConnector/7b934432-a85e-41c5-9f65-669219dde4ea"
      },
      "ids:issuerConnector" : {
        "@id" : connectorSpec['@id']
      },
      "ids:issued" : {
        "@value" : str(datetime.datetime.now()),
        "@type" : "http://www.w3.org/2001/XMLSchema#dateTimeStamp"
      },
      "ids:modelVersion" : "4.0.0",
      "ids:securityToken" : {
        "@type" : "ids:DynamicAttributeToken",
        "@id" : "https://w3id.org/idsa/autogen/dynamicAttributeToken/21b0ba17-dfb3-42f2-b7d0-ece4debfa4af",
        "ids:tokenValue" : PROVIDER_DAT if connector == "provider" else CONSUMER_DAT,
        "ids:tokenFormat" : {
          "@id" : "idsc:JWT"
        }
      },
      "ids:recipientConnector" : [ 
          {
            "@id" : connectorSpec['@id']
          } 
      ]
    }
    
    
    
    res = requests.post(url = TERASTORE_URL + '/infrastructure', files = {'foo': 'bar'}, data= {'header': json.dumps(header)})
    
    decoded_res = decodeMultipartResponse(res)
    
    if log_exchanges:
        hp_req = (header, None)
        hp_res = decoded_res
        
        log('get_catalog', [(hp_req, hp_res)])
    
    return decoded_res

def createApp(app, log_exchanges=False):
    
    c_header = {
      "@context" : {
        "ids" : "https://w3id.org/idsa/core/",
        "idsc" : "https://w3id.org/idsa/code/"
      },
      "@type" : "ids:AppRegistrationRequestMessage",
      "@id" : randomMessageID("appRegistrationRequestMessage", 'provider'),
      "ids:senderAgent" : {
        "@id" : "https://w3id.org/idsa/autogen/baseConnector/7b934432-a85e-41c5-9f65-669219dde4ea"
      },
      "ids:issuerConnector" : {
        "@id" : providerSpec['@id']
      },
      "ids:issued" : {
        "@value" : str(datetime.datetime.now()),
        "@type" : "http://www.w3.org/2001/XMLSchema#dateTimeStamp"
      },
      "ids:modelVersion" : "4.0.0",
      "ids:securityToken" : {
        "@type" : "ids:DynamicAttributeToken",
        "@id" : "https://w3id.org/idsa/autogen/dynamicAttributeToken/21b0ba17-dfb3-42f2-b7d0-ece4debfa4af",
        "ids:tokenValue" : PROVIDER_DAT,
        "ids:tokenFormat" : {
          "@id" : "idsc:JWT"
        }
      },
      "ids:recipientConnector" : [ 
          {
            "@id" : providerSpec['@id']
          } 
      ]
    }
    
    c_payload = app['metadata']
    
    c_res = requests.post(url = TERASTORE_URL + '/infrastructure', files = {'foo': 'bar'}, data= {'header': json.dumps(c_header), 'payload' : json.dumps(c_payload)})
    
    if c_res.status_code != 200:
        raise c_res.text
    
    c_res_header, c_res_payload = decodeMultipartResponse(c_res)
    
    u_header = {
      "@context" : {
        "ids" : "https://w3id.org/idsa/core/",
        "idsc" : "https://w3id.org/idsa/code/"
      },
      "@type" : "ids:AppUploadMessage",
      "@id" : randomMessageID("appUploadMessage", 'provider'),
      "ids:senderAgent" : {
        "@id" : "https://w3id.org/idsa/autogen/baseConnector/7b934432-a85e-41c5-9f65-669219dde4ea"
      },
      "ids:issuerConnector" : {
        "@id" : providerSpec['@id']
      },
      "ids:issued" : {
        "@value" : str(datetime.datetime.now()),
        "@type" : "http://www.w3.org/2001/XMLSchema#dateTimeStamp"
      },
      "ids:modelVersion" : "4.0.0",
      "ids:securityToken" : {
        "@type" : "ids:DynamicAttributeToken",
        "@id" : "https://w3id.org/idsa/autogen/dynamicAttributeToken/21b0ba17-dfb3-42f2-b7d0-ece4debfa4af",
        "ids:tokenValue" : PROVIDER_DAT,
        "ids:tokenFormat" : {
          "@id" : "idsc:JWT"
        }
      },
      "ids:recipientConnector" : [ 
          {
            "@id" : providerSpec['@id']
          } 
      ],
      "ids:affectedDataApp": c_res_payload['@id']
    }
    
    u_payload = app['spec']
    
    u_res = requests.post(url = TERASTORE_URL + '/infrastructure', files = {'foo': 'bar'}, data= {'header': json.dumps(u_header), 'payload' : json.dumps(u_payload)})
    
    u_res_header, u_res_payload = decodeMultipartResponse(u_res)
    
    if log_exchanges:
        hp1_req = (c_header, c_payload)
        hp1_res = (c_res_header, c_res_payload)
        
        hp2_req = (u_header, u_payload)
        hp2_res = (u_res_header, u_res_payload)
        
        log('create_app', [(hp1_req, hp1_res), (hp2_req, hp2_res)])
    
    return (c_res_header, c_res_payload, u_res_header, u_res_payload) 

def artifactRequestMessage(app_id, log_exchanges=False):
    
    header = {
      "@context" : {
        "ids" : "https://w3id.org/idsa/core/",
        "idsc" : "https://w3id.org/idsa/code/"
      },
      "@type" : "ids:ArtifactRequestMessage",
      "@id" : randomMessageID("artifactRequestMessage", 'consumer'),
      "ids:senderAgent" : {
        "@id" : "https://w3id.org/idsa/autogen/baseConnector/7b934432-a85e-41c5-9f65-669219dde4ea"
      },
      "ids:issuerConnector" : {
        "@id" : consumerSpec['@id']
      },
      "ids:issued" : {
        "@value" : str(datetime.datetime.now()),
        "@type" : "http://www.w3.org/2001/XMLSchema#dateTimeStamp"
      },
      "ids:modelVersion" : "4.0.0",
      "ids:securityToken" : {
        "@type" : "ids:DynamicAttributeToken",
        "@id" : "https://w3id.org/idsa/autogen/dynamicAttributeToken/21b0ba17-dfb3-42f2-b7d0-ece4debfa4af",
        "ids:tokenValue" : CONSUMER_DAT,
        "ids:tokenFormat" : {
          "@id" : "idsc:JWT"
        }
      },
      "ids:recipientConnector" : [ 
          {
            "@id" : consumerSpec['@id']
          } 
      ],
      "ids:requestedArtifact": app_id
    }
    
    res = requests.post(url = TERASTORE_URL + '/infrastructure', files = {'foo': 'bar'}, data= {'header': json.dumps(header)})
    
    decoded_res = decodeMultipartResponse(res)
    
    if log_exchanges:
        hp_req = (header, None)
        hp_res = decoded_res
        
        log('artifact_request', [(hp_req, hp_res)])
    
    return decoded_res
