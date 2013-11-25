var Crypto = Crypto || {};

var DOMAIN_NAME_AIRYKEY = 'airykey.org';

var sjclEnabled = true;
var silverlightEnabled = false;

var inFileNameList = [];
var inFileDataList = [];
var inFileSizeList = [];

var outFileNameList = [];
var outFileDataList = [];
var outFileBlobList = [];

var zipEntryData = [];

var encKeysObj = {};
var decKeysObj = {};

var ibeArray = [];

var identityArray = [];
var aadArray = [];
var ivArray = [];
var ciKeyArray = [];
var tagArray = [];
var identityArrayJsonEnd = [];
var aadArrayJsonEnd = [];
var ivArrayJsonEnd = [];
var ciKeyArrayJsonEnd = [];
var tagArrayJsonEnd = [];

var decKeys = [];

var encKeysTxtObj = {};
var decKeysTxtObj = {};

var identityArrayTxt = [];
var aadArrayTxt = [];
var ivArrayTxt = [];
var ciKeyArrayTxt = [];
var tagTxtArray = [];
var identityArrayTxtJsonEnd = [];
var aadArrayTxtJsonEnd = [];
var ivArrayTxtJsonEnd = [];
var ciKeyArrayTxtJsonEnd = [];
var tagArrayTxtJsonEnd = [];

var decKeysTxt = [];

var dataTxt = "";

var DEFAULT_IN_FILES_COUNT_LIMIT = 10; // 10 files
var DEFAULT_OUT_FILES_COUNT_LIMIT = 10; // 10 files
var DEFAULT_IN_FILES_SIZE_LIMIT = 20 * (1024 * 1024); // 20MB
var DEFAULT_OUT_FILES_SIZE_LIMIT = 22 * (1024 * 1024); // 20MB + 2MB (10% safety)

var IBE_ARRAY_CNT = 5;

var sizeLimit = 0;

var reachedFileListCountLimit = false;
var reachedFileListSizeLimit = false;

/* enter actions */
var enterActions = {
	// password: doPbkdf2,
	// salt: doPbkdf2,
	// iter: doPbkdf2
};

(function (w, d) {
	var form, dummyForm, otherIdentities, dropStatus, dropContainer, inputFile, outStatus, outContainer, outputFileList;
	var fileReader, dropReader;
	var silverlightControlInPanel = null, silverlightControlOutPanel = null, controlInFileList = null, controlOutFileList = null;

	// Check for the various File API support.
	if (w.File && w.FileReader && w.FileList && w.Blob) {
		// Great success! All the File APIs are supported.
	} else {
		// alert('The File APIs are not fully supported in this browser.');
	}

	Crypto.init = function () {
		//if (sjclEnabled) {
		form = new formHandler('dummyForm', enterActions);
		form._extendedKey = [];
		sjcl.random.startCollectors();
		uTableInit();
		//}

		otherIdentities = d.getElementById("otherIdentities");

		dummyForm = d.getElementById("dummyForm");
		dropStatus = d.getElementById("dropStatus");
		dropContainer = d.getElementById("dropContainer");
		inputFile = d.getElementById("openFile");
		outStatus = d.getElementById("outStatus");
		outContainer = d.getElementById("outContainer");
		outputFileList = d.getElementById("outputFileList");

		//test IE
		if (inputFile.addEventListener) {
			inputFile.addEventListener('change', Crypto.handleFileSelect, false);

			dropContainer.addEventListener("dragenter", function(e){e.stopPropagation();e.preventDefault();}, false);
			dropContainer.addEventListener("dragover", function(e){e.stopPropagation();e.preventDefault();}, false);
			dropContainer.addEventListener("drop", Crypto.handleFileDrop, false);
		} else if (inputFile.attachEvent){
			// ?
		}

		//var plugin = navigator.plugins["Silverlight Plug-In"];

	};

	Crypto.updateSilverlightVars = function(name) {
		if (name == "InPanel" && silverlightControlInPanel == null)
		{
			silverlightControlInPanel = d.getElementById("silverlightControlInPanel");

			if (silverlightControlInPanel != null && controlInFileList == null)
				controlInFileList = silverlightControlInPanel.Content.InFileList;
		}

		if (name == "OutPanel" && silverlightControlOutPanel == null)
		{
			silverlightControlOutPanel = d.getElementById("silverlightControlOutPanel");

			if (silverlightControlOutPanel != null && controlOutFileList == null)
				controlOutFileList = silverlightControlOutPanel.Content.OutFileList;
		}
	}

	Crypto.updateInList = function() {
		var reachedFileListLimit = false;

		var output = [];

		if (silverlightEnabled) {
			controlInFileList.ClearAll();
		}

		for (var i = 0, f; f = inFileNameList[i]; i++) {
			output.push('<tr>', '<td>', f, '</td>', '<td><a href="javascript:Crypto.deleteFile(\'', i, '\');" class="remove">X</a></td>',
					'</tr>');

			if (silverlightEnabled) {
				if (!reachedFileListLimit) {
					reachedFileListLimit = controlInFileList.AddFileName(f, i);
				}
			}
		}

		dropContainer.innerHTML = '<table width="100%"><col align="left" /><col align="right" />' + output.join('') + '</table>';
	}

	Crypto.updateOutList = function() {
		var output = [];

		var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
		var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

		if (URL && BlobBuilder) {
			for (var i = 0, f; f = outFileNameList[i]; i++) {
				var MIME_TYPE = 'application/octet-stream';

				var byteString = atob(outFileDataList[i]);
				var ab = new ArrayBuffer(byteString.length);
				var ia = new Uint8Array(ab);
				for (var j = 0; j < byteString.length; j++) {
					ia[j] = byteString.charCodeAt(j);
				}

				var bb = new BlobBuilder();
				bb.append(ab);
				var blob = bb.getBlob(MIME_TYPE) 

				var a = document.createElement('a');
				a.download = outFileNameList[i];
				
				if (window.MSBlobBuilder) {
					outFileBlobList.push(blob);
					a.href = 'javascript:Crypto.saveFile(\'' + i + '\');';
				} else {
					a.href = URL.createObjectURL(blob);
				}	
				a.textContent = outFileNameList[i];

				output.push('<tr>', '<td>' + a.outerHTML + '</td>',
						'</tr>');
			}
		}

		outContainer.innerHTML = '<table width="100%"><col align="left" /><col align="right" />' + output.join('') + '</table>';
	}

	Crypto.findFileName = function(fname) {
		var fileNameFound = false;

		for (var i = 0, f; f = inFileNameList[i]; i++) {
			if (f == fname) {
				fileNameFound = true;
				break;
			}
		}

		return fileNameFound;
	}

	Crypto.ab2str = function(buf) {
		/*var bufView = new Uint8Array(buf);
        return String.fromCharCode.apply(String, bufView);*/
		var s = "";
		for (var i = 0; i < buf.byteLength/10000; i++) {
			var bufView = new Uint8Array(buf.slice(i*10000, i*10000 + 10000));
			s += String.fromCharCode.apply(String, bufView);
		}
		/*for (var i = 0; i < bufView.byteLength; i++){
			s += String.fromCharCode(null, bufView[i]);
		}*/
		return s;
	}
	
	Crypto.getFile = function(file) {
		var reader = new FileReader();
		reader.onerror = Crypto.errorHandler;

		// Closure to capture the file information.
		reader.onload = (function (theFile) {
			return function (e) {
				inFileNameList.push(theFile.name);
				if (e.target.result instanceof ArrayBuffer) {
					inFileDataList.push(JSZipBase64.encode(Crypto.ab2str(e.target.result)));
				} else {
					inFileDataList.push(JSZipBase64.encode(e.target.result));
				}
				inFileSizeList.push(theFile.size);
				dropStatus.innerHTML = 'Loaded : 100%';
				Crypto.updateInList();
			};
		})(file);

		dropStatus.innerHTML = 'Loading...';

	    if (reader.readAsArrayBuffer) {
            reader.readAsArrayBuffer(file); // IE10
        } else {
			reader.readAsBinaryString(file);
        } 
	};

	Crypto.handleFileSelect = function(evt) {
		var files = evt.target.files;
		var fcount = 0;
		var fsize = 0;

		if ((DEFAULT_IN_FILES_COUNT_LIMIT == 1) && (files.length == DEFAULT_IN_FILES_COUNT_LIMIT))
			Crypto.clearAllInFiles();

		var duplicateFileNameFound = "";

		for (var i = 0, f; f = files[i]; i++) {
			if (Crypto.findFileName(f.name)) {
				duplicateFileNameFound = f.name;
				break;
			}
		}

		if (duplicateFileNameFound.length == 0) {
			var fileCount = Crypto.calculateFileCount();
			var fileTotal = Crypto.calculateFileTotal();

			for (var i = 0, f; f = files[i]; i++) {
				fcount = 1;
				fsize = f.size;
				if ((fileCount + fcount <= DEFAULT_IN_FILES_COUNT_LIMIT) && (fileTotal + fsize <= DEFAULT_IN_FILES_SIZE_LIMIT)) {
					fileCount += fcount;
					fileTotal += fsize;
					fcount = 0;
					fsize = 0;

					if (i == 0)
						Crypto.clearAllOutFiles();

					Crypto.getFile(f);
				} else
					break;
			}

			dummyForm.reset();

			if (fileCount + fcount > DEFAULT_IN_FILES_COUNT_LIMIT)
				alert("The file list has reached the " + DEFAULT_IN_FILES_COUNT_LIMIT + " files limit.");

			if (fileTotal + fsize > DEFAULT_IN_FILES_SIZE_LIMIT)
				alert("The file list has reached the " + (DEFAULT_IN_FILES_SIZE_LIMIT / (1024 * 1024)) + "MB limit.");
		} else
			alert("Duplicate filename: ".concat(duplicateFileNameFound));
	};

	Crypto.handleFileDrop = function(evt) {
		evt.stopPropagation();
		evt.preventDefault();

		var files = evt.dataTransfer.files;
		var fcount = 0;
		var fsize = 0;

		if ((DEFAULT_IN_FILES_COUNT_LIMIT == 1) && (files.length == DEFAULT_IN_FILES_COUNT_LIMIT))
			Crypto.clearAllInFiles();

		var duplicateFileNameFound = "";

		for (var i = 0, f; f = files[i]; i++) {
			if (Crypto.findFileName(f.name)) {
				duplicateFileNameFound = f.name;
				break;
			}
		}

		if (duplicateFileNameFound.length == 0) {
			var fileCount = Crypto.calculateFileCount();
			var fileTotal = Crypto.calculateFileTotal();

			for (var i = 0, f; f = files[i]; i++) {
				fcount = 1;
				fsize = f.size;
				if ((fileCount + fcount <= DEFAULT_IN_FILES_COUNT_LIMIT) && (fileTotal + fsize <= DEFAULT_IN_FILES_SIZE_LIMIT)) {
					fileCount += fcount;
					fileTotal += fsize;
					fcount = 0;
					fsize = 0;

					if (i == 0)
						Crypto.clearAllOutFiles();

					Crypto.getFile(f);
				} else
					break;
			}

			if (fileCount + fcount > DEFAULT_IN_FILES_COUNT_LIMIT)
				alert("The file list has reached the " + DEFAULT_IN_FILES_COUNT_LIMIT + " files limit.");

			if (fileTotal + fsize > DEFAULT_IN_FILES_SIZE_LIMIT)
				alert("The file list has reached the " + (DEFAULT_IN_FILES_SIZE_LIMIT / (1024 * 1024)) + "MB limit.");
		} else
			alert("Duplicate filename: ".concat(duplicateFileNameFound));
	};

	Crypto.calculateFileCount = function() {
		return inFileNameList.length;
	}

	Crypto.calculateFileTotal = function() {
		rslt = 0;

		for (var i = 0, f; f = inFileSizeList[i]; i++) {
			rslt += f;
		}

		return rslt;
	}

	Crypto.deleteFile = function(idx) {
		inFileNameList.splice(idx, 1);
		inFileDataList.splice(idx, 1);
		inFileSizeList.splice(idx, 1);

		fileTotal = Crypto.calculateFileTotal();

		Crypto.clearAllOutFiles();

		Crypto.updateInList();
	}

	Crypto.saveFile = function(idx) {
		navigator.msSaveBlob(outFileBlobList[idx], outFileNameList[idx]);
	}

	Crypto.clearAllInFiles = function() {
		inFileNameList.length = 0;
		inFileDataList.length = 0;
		
		if (silverlightEnabled) {
			controlInFileList.ClearAll();
		}	
	}

	Crypto.clearAllOutFiles = function() {
		outFileNameList.length = 0;
		outFileDataList.length = 0;
		outFileBlobList.length = 0;

		var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
		var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

		if (URL && BlobBuilder) {
			var prevTable = outContainer.querySelector('table');
			if (prevTable) {
				var prevTD = prevTable.querySelector('td');
				if (prevTD) {
					var prevLink = prevTD.querySelector('a');
					while (prevTD && prevLink) {
						if (!(window.MSBlobBuilder)) {
							URL.revokeObjectURL(prevLink.href);
						}
						prevTable.deleteRow(0);
						prevTD = prevTable.querySelector('td');
						if (prevTD)
							prevLink = prevTD.querySelector('a');
						else
							prevLink = null;
					}
				}
			}
		}

		if (controlOutFileList)
			controlOutFileList.ClearAll();
	}

	Crypto.encryptAll = function(other_identities) {
		var fcount = 0;
		var errorOnEncryption = false;
		var reachedFileListLimit = false;
		var showAlertReachedFileListLimit = false;

		var ajaxOutputText = '';

		encKeysTxtObj = {};

		Crypto.clearAllOutFiles();

		//////////////////////////////////////////////////////////////////////////

		dataTxt = "";

		var plainTextEditor = $("#plainTextEditor").cleditor()[0];
		var cipherTextEditor = $("#cipherTextEditor").cleditor()[0];

		cipherTextEditor.$area.val("");
		cipherTextEditor.updateFrame();

		var textlength = 0;

		if (plainTextEditor.doc.body.innerText) {
			textlength = plainTextEditor.doc.body.innerText.replace(/^\s+|\s+$/g, "").length;
		} else {
			if (plainTextEditor.doc.body.textContent)
				textlength = plainTextEditor.doc.body.textContent.replace(/^\s+|\s+$/g, "").length;
			else
				textlength = 0;
		}

		if (textlength > 0) {
			$.ajax({
				type: "POST",
				url: "https://" + DOMAIN_NAME_AIRYKEY + "/ibe-encrypt",
				crossDomain: true,
				xhrFields: {
					withCredentials: true
				},
				beforeSend: function(xhr){
					xhr.withCredentials = true;
				},
				async: false,
				data: "keycnt=1" + "&identities=" + other_identities,
				success: function(msgJson) {
					ajaxOutputText = msgJson;
					encKeysTxtObj = JSON.parse(msgJson);  // or $.parseJSON

					if (encKeysTxtObj.hasOwnProperty("error"))
					{
						alert(encKeysTxtObj.error);
						return false;
					}

					if (!encKeysTxtObj.hasOwnProperty("keyArray") || !encKeysTxtObj.hasOwnProperty("ivArray") || !encKeysTxtObj.hasOwnProperty("ibeArray"))
					{
						alert("Error: AJAX/JSON parse.");
						return false;
					}
				},
				error: function (responseData, textStatus, errorThrown) {
					alert(errorThrown.message);
					return false;
				}
			});

			var htmltext = "";

			if (plainTextEditor.doc.body.outerHTML) {
				htmltext = plainTextEditor.doc.body.outerHTML;
			} else {
				htmltext = new XMLSerializer().serializeToString(plainTextEditor.doc.body);
			}

			dataTxt = htmltext; // global var

			dataTxt = Crypto.doEncryptTxt(0);

			cipherTextEditor.$area.val("<p style=\"font-family: arial; font-size: 8.0pt;\">" + dataTxt + "</p>");

			cipherTextEditor.updateFrame();

			dataTxt = "";

			//alert(ajaxOutputText);
		}

		encKeysTxtObj = {};

		encKeysObj = {};

		//////////////////////////////////////////////////////////////////////////

		if (inFileNameList.length > 0) {
			if (inFileNameList.length == 1) {
				var re = /(.+?)(\.[^.]*$|$)/;
				var fileName = inFileNameList[0];
				fileName = re.exec(fileName)[1];
				outFileNameList.push(fileName + ".zip");
			} else
				outFileNameList.push("Encrypted.zip");

			if (silverlightEnabled) {
				reachedFileListCountLimit = controlOutFileList.ReachedCountLimit(fcount);
			}

			if (!reachedFileListLimit && fcount < DEFAULT_OUT_FILES_COUNT_LIMIT) {

				$.ajax({
					type: "POST",
					url: "ibe-encrypt",
					async: false,
					data: "keycnt=" + (inFileNameList.length + fcount) + "&identities=" + otherIdentities.value,
					success: function(msgJson) {
						encKeysObj = JSON.parse(msgJson);
					}
				 });

				if (encKeysObj.hasOwnProperty("error"))
				{
					alert(encKeysObj.error);
					return false;
				}

				if (!encKeysObj.hasOwnProperty("keyArray") || !encKeysObj.hasOwnProperty("ivArray") || !encKeysObj.hasOwnProperty("ibeArray"))
				{
					alert("Error: AJAX/JSON parse.");
					return false;
				}

				if (sjclEnabled) {
					var zip = new JSZip("JSON");
				} else {
					controlInFileList.ZipOutCreate("JSON");
				}

				for (var i = 0, f; f = inFileNameList[i]; i++) {
					if (sjclEnabled) {
						zip.add(inFileNameList[i], Crypto.doEncrypt(i), inFileSizeList[i], {base64: false, binary: true});
					} else {
						controlInFileList.ZipOutAddEncrypt(i, Crypto.encKeysToJSON(i));
					}
				}

				if (sjclEnabled) {
					outFileDataList.push(zip.generate(false));
					Crypto.updateOutList();
					outStatus.innerHTML = 'To download file, click on file names.';
				} else {
					controlInFileList.ZipOutClose();
				}

				if (silverlightEnabled) {
					reachedFileListLimit = controlOutFileList.AddFileName(outFileNameList[fcount], fcount);
				}	
				if (!reachedFileListLimit) {
					fcount++;
				} //else
				//break;
			} else {
				showAlertReachedFileListLimit = !reachedFileListLimit;
				reachedFileListLimit = true;
				//break;
			}

			if (showAlertReachedFileListLimit) {
				alert("The file list has reached the " + DEFAULT_OUT_FILES_COUNT_LIMIT + " files limit.");
				//break;
			}
		}

		encKeysObj = {};
	};

	Crypto.decryptAll = function() {
		var fcount = 0;
		var fsize = 0;
		var showAlertReachedFileListCountLimit = false;

		var jsonbegin = -1; jsonend = -1;

		reachedFileListCountLimit = false;
		reachedFileListSizeLimit = false;

		var ajaxOutputText = '';

		decKeysTxtObj = {};

		Crypto.clearAllOutFiles();

		//////////////////////////////////////////////////////////////////////////

		dataTxt = "";

		var plainTextEditor = $("#plainTextEditor").cleditor()[0];     // #encplaintext / #decplaintext !!!
		var cipherTextEditor = $("#cipherTextEditor").cleditor()[0];   // #encciphertext / #decciphertext !!!

		plainTextEditor.$area.val("");
		plainTextEditor.updateFrame();

		var textlength = 0;

		if (cipherTextEditor.doc.body.innerText) {
			textlength = cipherTextEditor.doc.body.innerText.replace(/^\s+|\s+$/g, "").length;
		} else {
			if (plainTextEditor.doc.body.textContent)
				textlength = cipherTextEditor.doc.body.textContent.replace(/^\s+|\s+$/g, "").length;
			else
				textlength = 0;
		}

		if (textlength > 0) {
			var htmlkeys = [];
			var htmldata = [];

			ibeArray.length = 0;
			identityArray.length = 0;
			aadArray.length = 0;
			ivArray.length = 0;
			ciKeyArray.length = 0;
			tagArray.length = 0;
			identityArrayJsonEnd.length = 0;
			aadArrayJsonEnd.length = 0;
			ivArrayJsonEnd.length = 0;
			ciKeyArrayJsonEnd.length = 0;
			tagArrayJsonEnd.length = 0;
			decKeysTxt.length = 0;

			var htmltextin = "";

			//var regex_spaces = ' (?=([^"]*"[^"]*")*[^"]*$)'; // replace all spaces except those inside quotes
			//var re = new RegExp(regex_spaces, "g");

			//if (cipherTextEditor.doc.body.innerText) {
			//	htmltextin = cipherTextEditor.doc.body.innerText.replace(re, "");
			//} else {
			//	htmltextin = cipherTextEditor.doc.body.textContent.replace(re, "");
			//}

			if (cipherTextEditor.doc.body.innerText) {
				htmltextin = cipherTextEditor.doc.body.innerText.replace(/\s+/g, "");
			} else {
				htmltextin = cipherTextEditor.doc.body.textContent.replace(/\s+/g, "");
			}

			var htmltextout = "";

			var htmlblock = "";

			var blockbegin = -1;
			var blockend = 0;
			var blockindex = 0;

			do {
				blockbegin = htmltextin.indexOf("*[{", blockend);
				blockend = htmltextin.indexOf("}]*", blockbegin);
				if ((blockbegin >= 0) && (blockbegin < blockend)) {
					htmlblock = htmltextin.substr(blockbegin + 2, blockend - (blockbegin + 2) + 1);

					if (htmlblock.length > 0) {
						var pos = htmlblock.indexOf("{\"iv\":");

						if (pos > 0) {
							htmlkeys.push(htmlblock.substr(0, pos));
							htmldata.push(htmlblock.substr(pos, htmlblock.length - pos));
						}

						if (htmlkeys[blockindex].length > 0 && htmldata[blockindex].length > 0) {
							jsonbegin = htmlkeys[blockindex].indexOf("{");
							jsonend = htmlkeys[blockindex].indexOf("}");
							if ((jsonbegin == 0) && (jsonbegin < jsonend)) {
								identityArray.push(htmlkeys[blockindex].substr(jsonbegin, (jsonend - jsonbegin) + 1));
								identityArrayJsonEnd.push(jsonend);
								jsonbegin = htmlkeys[blockindex].indexOf("{", jsonend);
								jsonend = htmlkeys[blockindex].indexOf("}", jsonbegin);
								if ((jsonbegin > 0) && (jsonbegin < jsonend)) {
									aadArray.push(htmlkeys[blockindex].substr(jsonbegin, (jsonend - jsonbegin) + 1));
									aadArrayJsonEnd.push(jsonend);
									jsonbegin = htmlkeys[blockindex].indexOf("{", jsonend);
									jsonend = htmlkeys[blockindex].indexOf("}", jsonbegin);
									if ((jsonbegin > 0) && (jsonbegin < jsonend)) {
										ivArray.push(htmlkeys[blockindex].substr(jsonbegin, (jsonend - jsonbegin) + 1));
										ivArrayJsonEnd.push(jsonend);
										jsonbegin = htmlkeys[blockindex].indexOf("{", jsonend);
										jsonend = htmlkeys[blockindex].indexOf("}", jsonbegin);
										if ((jsonbegin > 0) && (jsonbegin < jsonend)) {
											ciKeyArray.push(htmlkeys[blockindex].substr(jsonbegin, (jsonend - jsonbegin) + 1));
											ciKeyArrayJsonEnd.push(jsonend);
											jsonbegin = htmlkeys[blockindex].indexOf("{", jsonend);
											jsonend = htmlkeys[blockindex].indexOf("}", jsonbegin);
											if ((jsonbegin > 0) && (jsonbegin < jsonend)) {
												tagArray.push(htmlkeys[blockindex].substr(jsonbegin, (jsonend - jsonbegin) + 1));
												tagArrayJsonEnd.push(jsonend);
											}
										}
									}
								}
							}

							blockindex++;
						}
					}
				}
			}
			while ((blockbegin >= 0) && (blockbegin < blockend));

			if ((identityArray.length > 0) && (identityArray.length == aadArray.length) && (identityArray.length == ivArray.length) && (identityArray.length == ciKeyArray.length) && (identityArray.length == tagArray.length)) {

				for (var i = 0; i < identityArray.length; i++) {
					if (i == 0)
						ibeArray = '{\"ibeArray\":['.concat(identityArray[i], ',', aadArray[i], ',', ivArray[i], ',', ciKeyArray[i], ',', tagArray[i]);
					else
						ibeArray = ibeArray.concat(',', identityArray[i], ',', aadArray[i], ',', ivArray[i], ',', ciKeyArray[i], ',', tagArray[i]);
					if (i == identityArray.length - 1)
						ibeArray = ibeArray.concat(']}');
				}

				var uriTooLarge = false;

				$.ajax({
					type: "POST",
					url: "https://" + DOMAIN_NAME_AIRYKEY + "/ibe-decrypt",
					crossDomain: true,
					xhrFields: {
						withCredentials: true
					},
					beforeSend: function(xhr){
						xhr.withCredentials = true;
					},
					async: false,
					data: "ibeArray=" + ibeArray.toString(),
					success: function(msgJson) {
						if (msgJson.match("414 Request-URI"))
							uriTooLarge = true;
						else {
							ajaxOutputText = msgJson;
							decKeysTxtObj = JSON.parse(msgJson); // or $.parseJSON
						}

						if (uriTooLarge) {
							alert("Error: Too many files.");
							return false;
						}

						if (decKeysTxtObj.hasOwnProperty("error"))	{
							alert(decKeysTxtObj.error);
							return false;
						}

						if (decKeysTxtObj.hasOwnProperty("keyArray")) {
							for (var i = 0; decKeysTxtObj.keyArray[i]; i++) {
								if (decKeysTxtObj.keyArray[i] != "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
									decKeysTxt.push(decKeysTxtObj.keyArray[i]);
							}
						} else {
							alert("Error: AJAX/JSON parse.");
							return false;
						}

						//alert(ajaxOutputText);
					},
					error: function (responseData, textStatus, errorThrown) {
						alert(errorThrown.message);
						return false;
					}
				});

				if (htmlkeys.length == htmldata.length) {
					for (var i = 0; i < htmlkeys.length; i++) {
						var idx = -1;
						for (var k = 0; ciKeyArray[k]; k++) {
							if (ciKeyArray[k] == htmlkeys[i].substr(ivArrayJsonEnd[k] + 1, ciKeyArrayJsonEnd[k] - ivArrayJsonEnd[k])) {
								idx = k;
								break;
							}
						}
						if ((idx > -1) && (idx < decKeysTxt.length)) {
							if (decKeysTxt[idx].length > 2) {
								dataTxt = htmldata[i];

								var errorReadingTxt = false;

								try {
									dataTxt = Crypto.doDecryptTxt(idx);
								} catch(e) {
									errorReadingTxt = true;
									alert("Error when reading text: " + (typeof(e) === "object" ? e.message : e));
								}

								if (!errorReadingTxt) {
									if (i > 0) {
										htmltextout += "<br />";
									}
									htmltextout += dataTxt;
								}
							} else {
								alert("Not sufficient rights to decrypt text.");
							}
						} else {
							throw new Error("Can't decrypt: unknown format.");
						}
					}
				} else {
					alert("Error when reading keys: keys and data index do not match.");
				}
			} else {
				alert("Error when reading keys: IBE Keys do not match.");
			}

			if (htmltextout.length > 0) {
				plainTextEditor.$area.val(htmltextout);
				plainTextEditor.updateFrame();
			}

			htmltextout = "";
			dataTxt = "";

			ibeArray.length = 0;
			identityArray.length = 0;
			aadArray.length = 0;
			ivArray.length = 0;
			ciKeyArray.length = 0;
			tagArray.length = 0;
			identityArrayJsonEnd.length = 0;
			aadArrayJsonEnd.length = 0;
			ivArrayJsonEnd.length = 0;
			ciKeyArrayJsonEnd.length = 0;
			tagArrayJsonEnd.length = 0;
			decKeysTxt.length = 0;
		}

		decKeysTxtObj = {};

		decKeysObj = {};

		//////////////////////////////////////////////////////////////////////////

		if (inFileNameList.length > 0) {
			ibeArray.length = 0;
			identityArray.length = 0;
			aadArray.length = 0;
			ivArray.length = 0;
			ciKeyArray.length = 0;
			identityArrayJsonEnd.length = 0;
			aadArrayJsonEnd.length = 0;
			ivArrayJsonEnd.length = 0;
			ciKeyArrayJsonEnd.length = 0;
			decKeys.length = 0;

			var errorReadingZip = false;

			for (var i = 0, f; f = inFileNameList[i]; i++) {
				if (sjclEnabled) {
					var zip = new JSUnzip(JSZipBase64.decode(inFileDataList[i]));

					try {
						zip.readEntries();
						for (var j = 0, f; f = zip.entries[j]; j++) {
							if (zip.entries[j].uncompressedSize > 0) {
								if (zip.entries[j].isEncrypted()) {
									jsonbegin = zip.entries[j].data.indexOf("{");
									jsonend = zip.entries[j].data.indexOf("}");
									if ((jsonbegin == 0) && (jsonbegin < jsonend)) {
										identityArray.push(zip.entries[j].data.substr(jsonbegin, (jsonend - jsonbegin) + 1));
										identityArrayJsonEnd.push(jsonend);
										jsonbegin = zip.entries[j].data.indexOf("{", jsonend);
										jsonend = zip.entries[j].data.indexOf("}", jsonbegin);
										if ((jsonbegin > 0) && (jsonbegin < jsonend)) {
											aadArray.push(zip.entries[j].data.substr(jsonbegin, (jsonend - jsonbegin) + 1));
											aadArrayJsonEnd.push(jsonend);
											jsonbegin = zip.entries[j].data.indexOf("{", jsonend);
											jsonend = zip.entries[j].data.indexOf("}", jsonbegin);
											if ((jsonbegin > 0) && (jsonbegin < jsonend)) {
												ivArray.push(zip.entries[j].data.substr(jsonbegin, (jsonend - jsonbegin) + 1));
												ivArrayJsonEnd.push(jsonend);
												jsonbegin = zip.entries[j].data.indexOf("{", jsonend);
												jsonend = zip.entries[j].data.indexOf("}", jsonbegin);
												if ((jsonbegin > 0) && (jsonbegin < jsonend)) {
													ciKeyArray.push(zip.entries[j].data.substr(jsonbegin, (jsonend - jsonbegin) + 1));
													ciKeyArrayJsonEnd.push(jsonend);
													jsonbegin = zip.entries[j].data.indexOf("{", jsonend);
													jsonend = zip.entries[j].data.indexOf("}", jsonbegin);
													if ((jsonbegin > 0) && (jsonbegin < jsonend)) {
														tagArray.push(zip.entries[j].data.substr(jsonbegin, (jsonend - jsonbegin) + 1));
														tagArrayJsonEnd.push(jsonend);
													}
												}
											}
										}
									}
								}
							}
						}
					} catch(e) {
						alert("Error when reading Zip file: " + (typeof(e) === "object" ? e.message : e));
						errorReadingZip = true;
						break;
					}
				} else {
					controlInFileList.ZipInReadKeys(i);
				}
			}

			if ((identityArray.length > 0) && (identityArray.length == aadArray.length) && (identityArray.length == ivArray.length) && (identityArray.length == ciKeyArray.length) && (identityArray.length == tagArray.length)) {
				// OK
			} else {
				alert("Error when reading Zip file: IBE Keys do not match.");

				ibeArray.length = 0;
				identityArray.length = 0;
				aadArray.length = 0;
				ivArray.length = 0;
				ciKeyArray.length = 0;
				tagArray.length = 0;
				identityArrayJsonEnd.length = 0;
				aadArrayJsonEnd.length = 0;
				ivArrayJsonEnd.length = 0;
				ciKeyArrayJsonEnd.length = 0;
				tagArrayJsonEnd.length = 0;
				decKeys.length = 0;

				decKeysObj = {};

				return false;
			}

			for (var i = 0; i < identityArray.length; i++) {
				if (i == 0)
					ibeArray = '{\"ibeArray\":['.concat(identityArray[i], ',', aadArray[i], ',', ivArray[i], ',', ciKeyArray[i], ',', tagArray[i]);
				else
					ibeArray = ibeArray.concat(',', identityArray[i], ',', aadArray[i], ',', ivArray[i], ',', ciKeyArray[i], ',', tagArray[i]);
				if (i == identityArray.length - 1)
					ibeArray = ibeArray.concat(']}');
			}

			var uriTooLarge = false;

			//ajax ibeKeys
			$.ajax({
				type: "POST",
				url: "ibe-decrypt",
				async: false,
				//data: "identityArray=" + identityArray.toString() + "&aadArray=" + aadArray.toString() + "&ivArray=" + ivArray.toString() + "&ciKeyArray=" + ciKeyArray.toString() + "&tagArray=" + tagArray.toString(),
				data: "ibeArray=" + ibeArray.toString(),
				success: function(msgJson) {
					if (msgJson.match("414 Request-URI"))
						uriTooLarge = true;
					else
						decKeysObj = JSON.parse(msgJson); // what you do once the request is completed
				}
			});

			if (uriTooLarge) {
				alert("Error: Too many files.");
				return false;
			}

			if (decKeysObj.hasOwnProperty("error")) {
				alert(decKeysObj.error);
				return false;
			}

			if (decKeysObj.hasOwnProperty("keyArray")) {
				for (var i = 0; decKeysObj.keyArray[i]; i++) {
					if (decKeysObj.keyArray[i] != "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
						decKeys.push(decKeysObj.keyArray[i]);
				}
			} else {
				alert("Error: AJAX/JSON parse.");
				return false;
			}

			/*decKeys.push("DD463109508D82B9E32071CF23844F0660A855509F04A5961296CEBAC910B9B5");
			decKeys.push("CF6872DC01DCA59303D4DBD1EF0323F0CDFF2B2CB397C2BCFEE39D33914D1206");*/

			var notSufficientRights = false;

			sizeLimit = 0;

			if (!errorReadingZip) {
				for (var i = 0, f; f = inFileNameList[i]; i++) {
					if (!reachedFileListCountLimit && !reachedFileListSizeLimit) {
						if (sjclEnabled) {
							var zip = new JSUnzip(JSZipBase64.decode(inFileDataList[i]));

							try {
								zip.readEntries();
								for (var j = 0, f; f = zip.entries[j]; j++) {
									notSufficientRights = false;
									//reachedFileListCountLimit = controlOutFileList.ReachedCountLimit(fcount);
									Crypto.controlOutFileListReachedCountLimit(fcount);
									if (!reachedFileListCountLimit && fcount < DEFAULT_OUT_FILES_COUNT_LIMIT)
									{
										if (zip.entries[j].uncompressedSize > 0) {
											fsize += zip.entries[j].uncompressedSize;

											if (fsize < DEFAULT_OUT_FILES_SIZE_LIMIT) {
												if (zip.entries[j].isEncrypted()) {
													var idx = -1;
													for (var k = 0; ciKeyArray[k]; k++) {
														if (ciKeyArray[k] == zip.entries[j].data.substr(ivArrayJsonEnd[k] + 1, ciKeyArrayJsonEnd[k] - ivArrayJsonEnd[k])) {
															idx = k;
															break;
														}
													}
													if ((idx > -1) && (idx < decKeys.length)) {
														if (decKeys[idx].length > 2) {
															zipEntryData.push(zip.entries[j].data.substr(tagArrayJsonEnd[idx] + 1));
															outFileDataList.push(Crypto.doDecrypt(idx));
															outFileNameList.push(zip.entries[j].fileName);
															zipEntryData.length = 0;
														} else {
															notSufficientRights = true;
															alert(zip.entries[j].fileName + " not sufficient rights to decrypt.");
														}
													} else {
														throw new Error("Can't decrypt: unknown format.");
													}
												} else {
													if (zip.entries[j].compressionMethod === JSUnzip.COMPRESSION_METHOD_DEFLATE) {
														outFileDataList.push(JSZipBase64.encode(JSInflate.inflate(zip.entries[j].data)));
													} else {
														outFileDataList.push(JSZipBase64.encode(zip.entries[j].data));
													}
													outFileNameList.push(zip.entries[j].fileName);
												}
												if (!notSufficientRights) {
													//reachedFileListCountLimit = controlOutFileList.AddFileName(zip.entries[j].fileName, fcount);
													reachedFileListCountLimit = Crypto.controlOutFileListAddFileName(zip.entries[j].fileName, fcount);
													if (!reachedFileListCountLimit) {
														fcount++;
													} else
														break;
												}
											} else {
												reachedFileListSizeLimit = true;
												break;
											}
										}
									} else {
										showAlertReachedFileListCountLimit = !reachedFileListCountLimit;
										reachedFileListCountLimit = true;
										break;
									}
								}
							} catch(e) {
								zipEntryData.length = 0; // finally
								alert("Error when reading Zip file: " + (typeof(e) === "object" ? e.message : e));
								break;
							}
						} else {
							try {
								fcount = controlInFileList.ZipInExtractDecrypt(i, fcount);
							} catch(e) {
								zipEntryData.length = 0; // finally
								alert("Error when reading Zip file: " + (typeof(e) === "object" ? e.message : e));
							}
						}
					}

					if (showAlertReachedFileListCountLimit) {
						alert("The file list has reached the " + DEFAULT_OUT_FILES_COUNT_LIMIT + " files limit.");
						break;
					}

					if (reachedFileListSizeLimit)
						alert("The file list has reached the " + (DEFAULT_OUT_FILES_SIZE_LIMIT / (1024 * 1024)) + "MB limit.");
				}
			}

			Crypto.updateOutList();
			outStatus.innerHTML = 'To download file, click on file names.';

			ibeArray.length = 0;
			identityArray.length = 0;
			aadArray.length = 0;
			ivArray.length = 0;
			ciKeyArray.length = 0;
			tagArray.length = 0;
			identityArrayJsonEnd.length = 0;
			aadArrayJsonEnd.length = 0;
			ivArrayJsonEnd.length = 0;
			ciKeyArrayJsonEnd.length = 0;
			tagArrayJsonEnd.length = 0;
			decKeys.length = 0;
		}

		decKeysObj = {};
	};

	Crypto.controlOutFileListReachedCountLimit = function (fcount) {
		if (silverlightEnabled) {
			reachedFileListCountLimit = controlOutFileList.ReachedCountLimit(fcount);
			return reachedFileListCountLimit;
		} else {
			return false;
		}	
	};

	Crypto.controlOutFileListReachedSizeLimit = function (fsize) {
		sizeLimit += parseInt(fsize);
		reachedFileListSizeLimit = (sizeLimit >= DEFAULT_OUT_FILES_SIZE_LIMIT);
		return reachedFileListSizeLimit;
	};

	Crypto.controlOutFileListAddFileName = function (fileName, fcount) {
		if (silverlightEnabled) {
			return controlOutFileList.AddFileName(fileName, fcount);
		}	
	};

	Crypto.randomize = function (field, words, paranoia) {
		form[field].set(sjcl.random.randomWords(words, paranoia));
		if (field == 'salt') { form.key.set([]); }
	};

	/* Encrypt a data */
	Crypto.doEncrypt = function(idx) {
		var ct, v = form.get(), iv, key, adata = "", rp = {}, p;
		var L = 4;
		iv = sjcl.codec.hex.toBits(encKeysObj.ivArray[idx].substr(0, 2*(15-L)));
		key = sjcl.codec.hex.toBits(encKeysObj.keyArray[idx]);

		v.iv = iv;
		v.key = key;

		form.set(v);

		adata = encKeysObj.ibeArray[idx * IBE_ARRAY_CNT].identityArray[0];

		p = {
			adata: adata,
			iter: 1000,
			mode: "ccm",
			ts:parseInt("64"),
			ks:parseInt("256"),
			iv: iv};

		ct = Crypto.encKeysToJSON(idx) + sjcl.encrypt(key, inFileDataList[idx], p, rp);

		return ct;
	};

	/* Decrypt a data */
	Crypto.doDecrypt = function(idx) {
		var key = "", rp = {}, pt = "";

		if (idx < decKeys.length) {
			if (sjclEnabled) {
				key = sjcl.codec.hex.toBits(decKeys[idx]);
			}

			if (zipEntryData[0].match("{") && zipEntryData[0].match("}")) {
				/* it's jsonized */
				try {
					if (sjclEnabled) {
						pt = sjcl.decrypt(key, zipEntryData[0], {}, rp, false);
					} else {
						pt = controlInFileList.DecryptData(idx);
					}
				} catch(e) {
					throw "Can't decrypt.";
				}
			} else {
				throw "Can't decrypt: unknown format.";
			}
		} else {
			throw "Can't decrypt: missing key.";
		}

		return pt;
	};

	/* Encrypt a text data */
	Crypto.doEncryptTxt = function(idx) {
		var ct, v = form.get(), iv, key, adata = "", rp = {}, p;
		var L = 4;

		iv = sjcl.codec.hex.toBits(encKeysTxtObj.ivArray[idx].substr(0, 2*(15-L)));
		key = sjcl.codec.hex.toBits(encKeysTxtObj.keyArray[idx]);
		adata = encKeysTxtObj.ibeArray[idx * IBE_ARRAY_CNT].identityArray[0];

		v.iv = iv;
		v.key = key;

		form.set(v);

		p = {
			adata: adata,
			iter: 1000,
			mode: "ccmtxt",
			ts:parseInt("64"),
			ks:parseInt("256"),
			iv: iv};

		ct = Crypto.encKeysTxtToJSON(idx) + sjcl.encrypt(key, dataTxt, p, rp);

		return "*[" + ct.replace(/\x2C/g,", ").replace(/\x7D/g,"} ").replace(/^\s+|\s+$/g, "") + "]*";
	};

	/* Decrypt a text data */
	Crypto.doDecryptTxt = function(idx) {
		var key = "", rp = {}, pt = "";

		if (idx < decKeysTxt.length) {
			//if (sjclEnabled) {
			key = sjcl.codec.hex.toBits(decKeysTxt[idx]);
			//}

			if (dataTxt.match("{") && dataTxt.match("}")) {
				/* it's jsonized */
				try {
					//if (sjclEnabled) {
					pt = sjcl.decrypt(key, dataTxt, {}, rp, true);
					//} else {
					//    pt = controlInFileList.DecryptData(idx);
					//}
				} catch(e) {
					throw "Can't decrypt.";
				}
			} else {
				throw "Can't decrypt: unknown format.";
			}
		} else {
			throw "Can't decrypt: missing key.";
		}

		return pt;
	};

	Crypto.encKeysToJSON = function(idx) {
		var ek = JSON.stringify(encKeysObj.ibeArray[0 + (idx * IBE_ARRAY_CNT)]);
		ek = ek + JSON.stringify(encKeysObj.ibeArray[1 + (idx * IBE_ARRAY_CNT)]);
		ek = ek + JSON.stringify(encKeysObj.ibeArray[2 + (idx * IBE_ARRAY_CNT)]);
		ek = ek + JSON.stringify(encKeysObj.ibeArray[3 + (idx * IBE_ARRAY_CNT)]);
		ek = ek + JSON.stringify(encKeysObj.ibeArray[4 + (idx * IBE_ARRAY_CNT)]);

		return ek;
	};

	Crypto.encKeysTxtToJSON = function(idx) {
		var ek = JSON.stringify(encKeysTxtObj.ibeArray[0 + (idx * IBE_ARRAY_CNT)]);
		ek = ek + JSON.stringify(encKeysTxtObj.ibeArray[1 + (idx * IBE_ARRAY_CNT)]);
		ek = ek + JSON.stringify(encKeysTxtObj.ibeArray[2 + (idx * IBE_ARRAY_CNT)]);
		ek = ek + JSON.stringify(encKeysTxtObj.ibeArray[3 + (idx * IBE_ARRAY_CNT)]);
		ek = ek + JSON.stringify(encKeysTxtObj.ibeArray[4 + (idx * IBE_ARRAY_CNT)]);

		return ek;
	};

	Crypto.errorHandler = function (evt) {
		switch (evt.target.error.code) {
			case evt.target.error.NOT_FOUND_ERR:
				alert('File Not Found!');
				break;
			case evt.target.error.NOT_READABLE_ERR:
				alert('File is not readable');
				break;
			case evt.target.error.ABORT_ERR:
				break; // noop
			default:
				alert('An error occurred reading this file.');
		};
	};

})(window, document);
