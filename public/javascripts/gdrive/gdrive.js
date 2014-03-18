var AIRYBOX_CLIENT_ID = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com';
var SCOPES = 'https://www.googleapis.com/auth/drive';

var GDrive = function (gapi, clientid) {
    this.client_ID = clientid || AIRYBOX_CLIENT_ID;
    this.scopes = SCOPES;
    this.gapi = gapi;
    this.cors = new CORS(gapi);
	this.auth_token = null;
};

var File = function () {
    this.Name = null;
    this.Directory = false;

    this.Attributes = {
        ReadOnly: false,
        Executable: false,
        Hidden: false,
        Archive: false,
        SymbolicLink: false
    };
};

File.prototype.init = function (gFile) {
    this.Name = gFile.title;
    this.ETag = gFile.id;
    if (gFile.mimeType !== 'application/vnd.google-apps.folder') {
        this.Directory = false;
    } else {
        this.Directory = true;   
    }
    
    this.ContentType = gFile.mimeType || 'text/plain';
    this.Parents = [];
    for(var p in gFile.parents) {
        var f = new File();
        f.init(gFile.parents[p]);
        this.Parents.push(f);
    }
    
    this.Google = gFile;
};

File.prototype.toGoogleStruct = function () {
    var G = {
        title: this.Name,
        mimeType: this.ContentType
    };
    return G;
    
};

File.prototype.toString = function () {
    return this.Name + '[' + this.ETag + ']';
};

/**
 * auth api
 */
GDrive.prototype.authorize = function (callback, immediate) {
        if (immediate === undefined) { immediate = true; }
        var that = this;
        if (!this.gapi.auth) {
                this.gapi.auth = {};
                this.gapi.load('auth', function() {
                        setTimeout(function () {
                                that.gapi.auth.authorize({
                                'client_id': that.client_ID,
                                'scope': that.scopes,
                                'immediate': immediate
                                }, handleAuthorize);
                        console.log("Loaded auth module2.", that.gapi);
                        }, 0);
                        console.log("Loaded auth module.", that.gapi);
                });
        } else {
                console.log("Api seems to exist");
                if (this.auth_token === null){
                        setTimeout(function(){
                                that.gapi.auth.authorize({
                                'client_id': that.client_ID,
                                'scope': that.scopes,
                                'immediate': true
                                }, handleAuthorize);
                        }, 1000);
                } else {
                        callback(this.auth_token);
                }
        }
       
        function handleAuthorize(authResult){
                console.log("Result",authResult);
                if (authResult && !authResult.error) {
                        console.log("Auth OK");
                        that.auth_token = that.gapi.auth.getToken().access_token;
            that.cors.setAuth(that.auth_token);
                        callback(authResult);
                } else {
                        console.log("Auth failed. Retry.");
                        that.authorize(callback, false);
                }
        }
};

GDrive.prototype._convertFilesToOrion = function (files) {
    var result = [];
    for(var p in files){
        var f = new File();
        f.init(files[p]);
        result.push(f);
    }
    return result;
};

/**
 * Lists everything.
 * @param {Function} callback(err, result) Function which takes a list of entries as a parameter.
 * @param {String} query Optional search argument.
 */
GDrive.prototype.list = function (callback, query) {
    var that = this;
    var request = {
        path: 'https://www.googleapis.com/drive/v2/files',
        params: {'maxResults': '5'}
    };
    //if (query) { request.params.q = encodeURIComponent(query); } // bug
	if (query) { request.params.q = query; }
	//if (query) { request.params.key = 'AIzaSyCsq23wslAmGn2OwfXmeGDcXZm3ZZWZcpk'; }
    
	var result = [];
    
    that.cors.get(request, on_result);
       
    function on_result(err, resp) {
        if (err) {
            console.error("[list]Error:",err);  
            callback(err, result);
            return;
        }
        resp = JSON.parse(resp);
        result.push.apply(result, resp.items);

        if (resp.nextPageToken) {
            request.params = {
                'pageToken': resp.nextPageToken 
            };
            (function partial(){
            	that.cors.get(request, on_result);
            })();
        } else {
            callback(null, that._convertFilesToOrion(result));   
        }
        
    }
    
};

GDrive.prototype.listChildren = function (folderId, callback) {
	var that = this;
    var request = {
        path: 'https://www.googleapis.com/drive/v2/files/'+folderId+'/children',
        params: {}
    };
    this.cors.get(request, function (err, resp) {
    	if (err) {
    		console.error("[about]Error:",err);
    		return callback(err);
    	}
    	resp = JSON.parse(resp);
    	var children = that._convertFilesToOrion(resp.items);
    	callback(null, children);   
    });
};

GDrive.prototype.about = function (callback) {
	var request = {
        path: 'https://www.googleapis.com/drive/v2/about',
        params: {}
    };
    this.cors.get(request, function (err, resp) {
    	if (err) {
    		console.error("[about]Error:",err);
    		return callback(err);
    	}
    	resp = JSON.parse(resp);
    	callback(null, resp);
    });
	
};


/**
  * Gets a file from drive.
  * @param {String} fileid FileID of the file to get.
  * @param {Function} [callback] callback To be called with filled File struct
  * @returns {GDFile}
*/

GDrive.prototype.get = function (fileid, callback) {
    var that = this;
    var request = { 
        path: 'https://www.googleapis.com/drive/v2/files/' + fileid
    };
    
    this.cors.get(request, function (err, resp) {
        if (err) {
            console.error("[get]Error",err);  
            return callback(err, null);
        }
        var file = JSON.parse(resp);
        callback(null, that._convertFilesToOrion([file])[0]);
    });

};

/**
 * Retrieves file contents from storage.
 * @param {String} fileid FileID of the object
 * @param {Function} [callback] callback 
 * */
GDrive.prototype.retrieve = function (file_id, callback) {
    var that = this;
    this.get(file_id, function (err, file) {
        if (err) {
            console.error("[retrieve]Error:",err);
            return callback(err, null);
        }
        var request = { 
            path: file.Google.downloadUrl
        };
        that.cors.get(request, function (err, content) {
            if (err) {
                console.error("[retrieve]Error:",err);
                return callback(err, null);   
            }
            callback(null, content);
        });
    });
};

 /**
  * Lists a file's permissions.
  * @param {String} fileid FileID of the file to get permissions.
  * @param {Function} [callback] callback To be called with filled File struct
  * @returns {GDFile}
  */

 GDrive.prototype.permissions = function (file_id, callback) {
	 var that = this;
	 var request = {
		 path: 'https://www.googleapis.com/drive/v2/files/'+file_id+'/permissions'
	 };

	 this.cors.get(request, function (err, resp) {
		 if (err) {
			 console.error("[get]Error",err);
			 return callback(err, null);
		 }
		 resp = JSON.parse(resp);
		 callback(null, resp);
	 });

 };

  /**
  * Creates new (empty!) file in drive
  * @param {String} title Title of the new file.
  * @param {Function} [callback] callback called with filled GDFile struct
*/
GDrive.prototype.insert = function (title, callback) {
    var that = this;
    var poster = new Poster();
    poster.addData({'title': title, 'mimeType':'application/octet-stream'});
    poster.addBinary('','application/octet-stream');
    
    var request = {
        'path': '/upload/drive/v2/files',
        'body': poster.build()        
    };
    
    this.cors.postMultiPart(request, poster.boundary, function(err, gFile){
        callback(null, that._convertFilesToOrion([gFile])[0]);
    });
};

/**
  * Updates file content
  * @param {String} fileid FileID of the object
  * @param {File} fileMeta Updated metadata and/or content.
  * @param {Text} fileData
  * @param {Function} [callback] callback called with filled File struct
*/
GDrive.prototype.update = function (file_id, fileMeta, fileData, callback) {
	console.log("123123");
	var fm = new File();
	fm.Name = fileMeta.Name;
	fm.ContentType  = fileMeta.ContentType;
	fileMeta = fm;
    var that = this;
    var poster = new Poster();
    if (fileMeta) {
        poster.addData(fileMeta.toGoogleStruct());
    }
    console.log("456");
    poster.addBinary(fileData, fileMeta.ContentType||'application/octet-stream');
    
    var request = {
        'path': '/upload/drive/v2/files/' + file_id,
        'body': poster.build()
        
    };
    console.log("567");
    this.cors.putMultiPart(request, poster.boundary, function(err, gFile){
    	console.log("putMultiPart");
        callback(null, that._convertFilesToOrion([gFile])[0]);
    });
};


/**
  * Copies file.
  * @param {String} [origin_file] file to copy
  * @param {String} [copy_file] struct with title of the copied file
  * @param {Function} [callback] callback called with filled GDFile struct
*/

GDrive.prototype.copy = function (origin_file_id, copy_title, callback) {
    var body = {'title': copy_title};
    var that = this;
    if (!this.gapi.client) {
        this.gapi.load('client', function() {
            that.copy(origin_file_id, copy_title, callback);
        });
        return;
    }
    
    var request = {
        'path': 'drive/v2/files/' + origin_file_id + '/copy',
        'body': body
    };
    this.cors.post(request, function(err, resp) {
        callback(null, that._convertFilesToOrion([resp])[0]);
    });
};


/**
  * Removes a file from drive.
  * @param {GDFile} file The location of the file or directory to remove.
            Requires filled fileid field.
  * @param {Function} [callback] callback called with filled GDFile struct
*/
GDrive.prototype.remove = function (file_id, callback) {
    var request = {
        path: "https://www.googleapis.com/drive/v2/files/" + file_id
    };
    this.cors.remove(request, callback);
};


/**
 * file api
 */
 
var Poster = function (boundary) {
    this.boundary = boundary || '-------314159265358979323846';
    this.delimiter = "\r\n--" + this.boundary + "\r\n";
    this.close_delim = "\r\n--" + this.boundary + "--";    
    this.parts = [];
};

Poster.prototype.addData = function (data) {
    var json = JSON.stringify(data);
    var part = this.delimiter + 
        'Content-Type: application/json\r\n\r\n' +
        json;
        
    this.parts.push(part);
};

Poster.prototype.addBinary = function (data, content_type) {
    var base64Data = btoa(data);
    var part = this.delimiter + 
        'Content-Type: ' + content_type + '\r\n' + 
        'Content-Transfer-Encoding: base64\r\n' + 
        '\r\n' + 
        base64Data;
    this.parts.push(part);    
};

Poster.prototype.build = function () {
    var body = '';
    for(var p in this.parts) {
        body += this.parts[p];
    }
    body += this.close_delim;
    return body;
};

var CORS = function (gapi, access_token, token) {
    this.setAuth(access_token, token);
    this.gapi = gapi;
};

/**
 * Prepares request for given request_data
 * @param {Object} request_data Struct filled with data for request
 * @param {Function} callback(err,result) Function to call after invocation. 
 */
CORS.prototype.request = function (request_data, callback) {
	var url_drive_v2_files = 'https://www.googleapis.com/drive/v2/files';
	var addAuthHeader;

	if (request_data && request_data.path && request_data.path.length >= url_drive_v2_files.length &&
		request_data.path.substr(0, url_drive_v2_files.length) == url_drive_v2_files) {
		addAuthHeader = false;
	} else {
		addAuthHeader = true;
	}

    var xhr = new XMLHttpRequest();

	request_data.path += this._encode_params(request_data.params);

    xhr.open(request_data.method, request_data.path, true);

	if (addAuthHeader)
		xhr.setRequestHeader('Authorization', this.token + ' ' + this.access_token);

    this._apply_headers(xhr, request_data.headers);
    //request_data.path += this._encode_params(request_data.params); // bug
    
    xhr.onload = on_load;
    xhr.onerror = on_error;
    
    return xhr;
    
    function on_load(result) {
        callback(null, xhr.responseText);   
    }
    function on_error(err) {
        callback(err, null);   
    }
    
};

CORS.prototype.setAuth = function (access_token, token) {
    this.access_token = access_token;  
    this.token = token || "Bearer";
    console.log(this);
};

CORS.prototype._apply_headers = function (xhr, headers) {
    for(var h in headers){
        xhr.setRequestHeader(h, headers[h]);   
    }
};

CORS.prototype._encode_params = function (params) {
    var qs = '';
    for(var p in params) {
        qs += '&' + p + '=' + encodeURIComponent(params[p]);
    }
    return qs.replace('&', '?');
    
};

CORS.prototype.get = function (request_data, callback) {
    // GET request passes params in URL.

	var url_drive_v2_files = 'https://www.googleapis.com/drive/v2/files';

	if (request_data && request_data.path && request_data.path.length >= url_drive_v2_files.length &&
			request_data.path.substr(0, url_drive_v2_files.length) == url_drive_v2_files) {

		if (request_data.params)
			request_data.params.access_token = this.access_token;
		else
			request_data.params = {'access_token': this.access_token};
	};

	request_data.method = "GET";

    var xhr = this.request(request_data, callback);
    xhr.send();
};

CORS.prototype.remove = function (request_data, callback) {
	var url_drive_v2_files = 'https://www.googleapis.com/drive/v2/files';

	if (request_data && request_data.path && request_data.path.length >= url_drive_v2_files.length &&
			request_data.path.substr(0, url_drive_v2_files.length) == url_drive_v2_files) {

		if (request_data.params)
			request_data.params.access_token = this.access_token;
		else
			request_data.params = {'access_token': this.access_token};
	};

    request_data.method = "DELETE";
    var xhr = this.request(request_data, callback);
    xhr.send();
};

CORS.prototype.postMultiPart = function (request_data, boundary, callback) {
    var that = this;
    if (!this.gapi.client) {
        this.gapi.load('client', function() {
            that.postMultiPart(request_data, boundary, callback);
        });
        return;
    }
    
    request_data.method = "POST";
    if (!request_data.params) {
        request_data.params = {};   
    }
    
    request_data.params.uploadType = 'multipart';

	if (request_data.params)
		request_data.params.access_token = this.access_token;
	else
		request_data.params = {'access_token': this.access_token};

    request_data.headers = {
        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"',
		'Authorization': this.token + ' ' + this.access_token
    };

    var request = this.gapi.client.request(request_data);
    request.execute(function(res){
        callback(null, res); 
    });

};

CORS.prototype.post = function (request_data, callback) {
    var that = this;
    if (!this.gapi.client) {
        this.gapi.load('client', function() {
            that.postMultiPart(request_data, callback);
        });
        return;
    }
    request_data.method = "POST";

	if (request_data.params)
		request_data.params.access_token = this.access_token;
	else
		request_data.params = {'access_token': this.access_token};

	request_data.headers = {
		'Authorization': this.token + ' ' + this.access_token
	};

	var request = this.gapi.client.request(request_data);
    request.execute(function(res){
        callback(null, res); 
    });
};

CORS.prototype.putMultiPart = function (request_data, boundary, callback) {
    var that = this;
    if (!this.gapi.client) {
        this.gapi.load('client', function() {
            that.putMultiPart(request_data, boundary, callback);
        });
        return;
    }
    
    request_data.method = "PUT";
    if (!request_data.params) {
        request_data.params = {};   
    }
    
    request_data.params.uploadType = 'multipart';
    request_data.params.alt = 'json';

	if (request_data.params)
		request_data.params.access_token = this.access_token;
	else
		request_data.params = {'access_token': this.access_token};


	request_data.headers = {
        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"',
		'Authorization': this.token + ' ' + this.access_token
    };

    var request = this.gapi.client.request(request_data);
    request.execute(function(res){
        callback(null, res); 
    });

};

// endof CORS
