var OAuth = OAuth || {};

(function (w, d) {
  var SHARE_CLIENT_ID = 'xxxxxxxxxxxx';
	var AIRYBOX_CLIENT_ID = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com';
	var AIRYBOX_SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.install';
	var AIRYKEY_CLIENT_ID = 'xxxxxxxxxxxx.apps.googleusercontent.com';
	var AIRYKEY_SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';

	var API_KEY = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

  var DOMAIN_NAME_AIRYKEY = 'airykey.org';

	var SIGNOUT_LABEL = 'Sign Out';
	var SIGNOUTFROM_LABEL = 'Sign Out: ';
	var AUTHENTICATEWITHGOOGLE_LABEL = 'Authenticate with Google';

	var accountBalanceFileName = 'AccountBalanceX.txt';
	var accountBalanceFileID = '';

	var share = null;
	var GDriveAPI = null;

	var airyboxAuthButton;
	var airykeyAuthButton;

	var airykeyAuthDiv;

	var reloadButton;
	var saveButton;

	var btnEncryptAll;
	var btnDecryptAll;

	var listButton;
	var createButton;
	var updateButton;
	var returnButton;
	var getButton;
	var permissionsButton;
	var shareButton;
	var deleteButton;

	var authDisplayName;
	var authPermissionId;
	var authIdentity;

	var otherIdentities;

	var identityData;

	var fileList = [];

	var plainTextEditor;
	var cipherTextEditor;

	var log;

	OAuth.init = function () {
		Crypto.init();
		AccountBalance.init();

		plainTextEditor = $("#plainTextEditor").cleditor()[0];
		cipherTextEditor = $("#cipherTextEditor").cleditor()[0];

		airyboxAuthButton = d.getElementById("airyboxAuthButton");
		airykeyAuthButton = d.getElementById("airykeyAuthButton");

		airykeyAuthDiv = d.getElementById("airykeyAuthDiv");

		reloadButton = d.getElementById("reloadButton");
		saveButton = d.getElementById("saveButton");

		btnEncryptAll = d.getElementById("encryptAll");
		btnDecryptAll = d.getElementById("decryptAll");

		listButton = d.getElementById("listButton");
		createButton = d.getElementById("createButton");
		updateButton = d.getElementById("updateButton");
		returnButton = d.getElementById("returnButton");
		getButton = d.getElementById("getButton");
		permissionsButton = d.getElementById("permissionsButton");
		shareButton = d.getElementById("shareButton");
		deleteButton = d.getElementById("deleteButton");

		authDisplayName = d.getElementById("authDisplayName");
		authPermissionId = d.getElementById("authPermissionId");
		authIdentity = d.getElementById("authIdentity");

		authDisplayName.value = "";
		authPermissionId.value = "";
		authIdentity.value = "";

		otherIdentities = d.getElementById("otherIdentities");

		log = d.getElementById("log");

		//test IE
		if (airyboxAuthButton.addEventListener) {
			airykeyAuthButton.addEventListener("click", OAuth.handle_airykeySignInClick, false);
			btnEncryptAll.addEventListener("click", OAuth.encryptAll, false);
			btnDecryptAll.addEventListener("click", OAuth.decryptAll, false);
			listButton.addEventListener("click", OAuth.listFiles, false);
			createButton.addEventListener("click", OAuth.createFile, false);
			updateButton.addEventListener("click", OAuth.updateFile, false);
			returnButton.addEventListener("click", OAuth.returnFile, false);
			getButton.addEventListener("click", OAuth.getFile, false);
			permissionsButton.addEventListener("click", OAuth.permissionsFile, false);
			shareButton.addEventListener("click", OAuth.shareFile, false);
			deleteButton.addEventListener("click", OAuth.deleteFile, false);
		} else if (airyboxAuthButton.attachEvent){
			airykeyAuthButton.attachEvent("onclick", OAuth.handle_airykeySignInClick);
			listButton.attachEvent("onclick", OAuth.listFiles);
			btnEncryptAll.attachEvent("onclick", OAuth.encryptAll);
			btnDecryptAll.attachEvent("onclick", OAuth.decryptAll);
			createButton.attachEvent("onclick", OAuth.createFile);
			updateButton.attachEvent("onclick", OAuth.updateFile);
			returnButton.attachEvent("onclick", OAuth.returnFile);
			getButton.attachEvent("onclick", OAuth.getFile);
			permissionsButton.attachEvent("onclick", OAuth.permissionsFile);
			shareButton.attachEvent("onclick", OAuth.shareFile);
			deleteButton.attachEvent("onclick", OAuth.deleteFile);
		}

		GDriveAPI = new GDrive(gapi, null);

		window.setTimeout(OAuth.do_airyboxInitAuth, 1);
	};

	OAuth.logResult = function(err, result) {
		console.log(result);
		log.value = result;
	}

	OAuth.listFiles = function() {
		fileList.length = 0;

		var filter = "title='" + accountBalanceFileName + "'";

		accountBalanceFileID = '';

		GDriveAPI.list(function(err, result) {
			OAuth.logResult(err, result);

			if (!err) {
				fileList = result;

				if (fileList.length > 0 && fileList[0].Name == accountBalanceFileName) {
					accountBalanceFileID = fileList[0].ETag;

					OAuth.permissionsFile(false);

					AccountBalance.enable();
				} else {
					OAuth.createFile();
				}
			} else {
				fileList.length = 0;
			}

		}, filter);
	}

	OAuth.createFile = function() {
		//if (fileList.length == 0) {
		accountBalanceFileID = '';

		GDriveAPI.insert(accountBalanceFileName, function(err, result) {
			OAuth.logResult(err, result);

			if (!err) {
				file = result;

				fileList.push(file);

				if (file.Name == accountBalanceFileName) {
					accountBalanceFileID = file.ETag;

					$(shareButton).button('enable');

					AccountBalance.enable();
				}
			}
		});
		//}
	}

	OAuth.updateFile = function() {
		var file = new File();

		file.Name = accountBalanceFileName;
		file.id = accountBalanceFileID;
		file.ContentType = 'text/plain';

		var fileData;

		if (cipherTextEditor.doc.body.innerText) {
			fileData = cipherTextEditor.doc.body.innerText;
		} else {
			fileData = cipherTextEditor.doc.body.textContent;
		}

		GDriveAPI.update(accountBalanceFileID, file, fileData, function(err, result) {
			if (!err) {
				alert('Saved.');
			} else {
				alert('Error on update.');
			}
		});
	}

	OAuth.returnFile = function(callback) {
		GDriveAPI.retrieve(accountBalanceFileID, function(err, result) {
			if (!err) {
				if (result.length > 0) {
					cipherTextEditor.$area.val(result);
					cipherTextEditor.updateFrame();

					if (callback === AccountBalance.do_reload) {
						callback();
					}
				}
			} else {
				OAuth.logResult(err, result);
			}
		});
	}

	OAuth.getFile = function() {
		GDriveAPI.get(accountBalanceFileID, function(err, result) {
			if (!err) {
				if (result) {
					cipherTextEditor.$area.val(result);
					cipherTextEditor.updateFrame();
				}
			} else {
				OAuth.logResult(err, result);
			}
		});
	}

	OAuth.permissionsFile = function(encrypt_and_update) {
		GDriveAPI.permissions(accountBalanceFileID, function(err, result) {
			if (!err) {
				if (result) {
					var permissions = result;

					if (fileList.length > 0) {
						for (i = 0; i < fileList.length; i++) {
							var file = fileList[i];

							delete file['permissions'];

							if (file.ETag == accountBalanceFileID) {
								if (permissions && permissions.items && permissions.items.length > 0) {
									file.permissions = permissions;
								}

								if (encrypt_and_update === true) {
									OAuth.encryptAll();

									OAuth.updateFile();
								}
							}
						}
					}
				}

				for (var i = 0; i < fileList.length; i++) {
					if (fileList[i].ETag == accountBalanceFileID && fileList[i].permissions && fileList[i].permissions.items && fileList[i].permissions.items.length > 0) {
						for (var j = 0; j < fileList[i].permissions.items.length; j++) {
							if (fileList[i].permissions.items[j].id == authPermissionId.value) {
								if (fileList[i].permissions.items[j].role == 'owner' || fileList[i].permissions.items[j].role == 'writer') {
									$(saveButton).button('enable');
								} else {
									$(saveButton).button('disable');
								}

								if (fileList[i].permissions.items[j].role == 'owner') {
									$(shareButton).button('enable');
								} else {
									$(shareButton).button('disable');
								}

								break;
							}
						}
					}
				}

			} else {
				OAuth.logResult(err, result);
			}
		});
	}

	OAuth.shareFile = function() {
		if (accountBalanceFileID.length > 0) {
			share.setItemIds([accountBalanceFileID]);
			share.showSettingsDialog();
		}
	}

	OAuth.deleteFile = function() {
		GDriveAPI.remove(accountBalanceFileID, OAuth.logResult);

		for (var i = 0; i < fileList.length; i++) {
			if (fileList[i].ETag == accountBalanceFileID) {
				fileList.splice(i, 1);

				break;
			}
		}
	}

	OAuth.displayTime = function() {
		var str = "";

		var currentTime = new Date()
		var hours = currentTime.getHours()
		var minutes = currentTime.getMinutes()
		var seconds = currentTime.getSeconds()

		if (minutes < 10) {
			minutes = "0" + minutes
		}
		if (seconds < 10) {
			seconds = "0" + seconds
		}
		str += hours + ":" + minutes + ":" + seconds + " ";
		if(hours > 11){
			str += "PM"
		} else {
			str += "AM"
		}
		return str;
	}

	OAuth.encryptAll = function() {
		for (var i = 0; i < fileList.length; i++) {
			if (fileList[i].ETag == accountBalanceFileID && fileList[i].permissions && fileList[i].permissions.items && fileList[i].permissions.items.length > 0) {
				var other_identities = '';
				var email_mockup;

				for (var j = 0; j < fileList[i].permissions.items.length; j++) {
					if (fileList[i].permissions.items[j].id != authPermissionId.value) {
						email_mockup = fileList[i].permissions.items[j].id + '@' + 'drive.google.com';

						if  (other_identities.length == 0) {
							other_identities = email_mockup;
						} else {
							other_identities = other_identities + ' ' + email_mockup;
						}
					}
				}

				Crypto.encryptAll(other_identities);
			}
		}
	}

	OAuth.decryptAll = function() {
		Crypto.decryptAll();
	}

	OAuth.do_airyboxInitShare = function() {
    share = new gapi.drive.share.ShareClient(SHARE_CLIENT_ID);
	}

	OAuth.do_airyboxInitAuth = function () {
		gapi.client.setApiKey(API_KEY);

		gapi.auth.init(OAuth.do_airyboxCheckAuth);
	}

	OAuth.do_airyboxCheckAuth = function () {
		gapi.auth.authorize({client_id: AIRYBOX_CLIENT_ID, scope: AIRYBOX_SCOPES, immediate: true}, OAuth.handle_airyboxAuthResult);
	}

	OAuth.do_airykeyCheckAuth = function () {
		gapi.auth.authorize({client_id: AIRYKEY_CLIENT_ID, scope: AIRYKEY_SCOPES, immediate: true}, OAuth.handle_airykeyAuthResult);
	}

	OAuth.handle_airyboxSignInClick = function(event) {
		authDisplayName.value = "";
		authPermissionId.value = "";
		authIdentity.value = "";

		gapi.auth.authorize({client_id: AIRYBOX_CLIENT_ID, scope: AIRYBOX_SCOPES, immediate: false}, OAuth.handle_airyboxAuthResult);
		return false;
	}

	OAuth.handle_airykeySignInClick = function(event) {
		authDisplayName.value = "";
		authPermissionId.value = "";
		authIdentity.value = "";

		gapi.auth.authorize({client_id: AIRYKEY_CLIENT_ID, scope: AIRYKEY_SCOPES, immediate: false}, OAuth.handle_airykeyAuthResult);
		return false;
	}

	OAuth.handle_gdriveAuthResult = function(authResult) {
		if (authResult && !authResult.error) {


		}
	}

	OAuth.handle_airyboxAuthResult = function(authResult) {
		if (authResult && !authResult.error) {
			gapi.load('drive-share', OAuth.do_airyboxInitShare);

			GDriveAPI.cors.access_token = authResult.access_token;
			//GDriveAPI.authorize(OAuth.handle_gdriveAuthResult);

			window.setTimeout(OAuth.do_airykeyCheckAuth, 1);

			airyboxAuthButton.innerHTML = airyboxAuthButton.innerHTML.replace(AUTHENTICATEWITHGOOGLE_LABEL, SIGNOUT_LABEL);

			if (airyboxAuthButton.addEventListener) {
				airyboxAuthButton.removeEventListener("click", OAuth.handle_airyboxSignInClick, false);
				airyboxAuthButton.removeEventListener("click", OAuth.handle_airyboxSignOutClick, false);
				airyboxAuthButton.addEventListener("click", OAuth.handle_airyboxSignOutClick, false);
			} else if (airyboxAuthButton.attachEvent){
				airyboxAuthButton.detachEvent("onclick", OAuth.handle_airyboxSignInClick);
				airyboxAuthButton.detachEvent("onclick", OAuth.handle_airyboxSignOutClick);
				airyboxAuthButton.attachEvent("onclick", OAuth.handle_airyboxSignOutClick);
			}

			//OAuth.makeApiCall(authResult.access_token);
		} else {
			GDriveAPI.cors.access_token = '';

			airyboxAuthButton.innerHTML = airyboxAuthButton.innerHTML.replace(SIGNOUTFROM_LABEL + authDisplayName.value, AUTHENTICATEWITHGOOGLE_LABEL);
			airyboxAuthButton.innerHTML = airyboxAuthButton.innerHTML.replace(SIGNOUT_LABEL, AUTHENTICATEWITHGOOGLE_LABEL);

			if (airyboxAuthButton.addEventListener) {
				airyboxAuthButton.removeEventListener("click", OAuth.handle_airyboxSignInClick, false);
				airyboxAuthButton.removeEventListener("click", OAuth.handle_airyboxSignOutClick, false);
				airyboxAuthButton.addEventListener("click", OAuth.handle_airyboxSignInClick, false);
			} else if (airyboxAuthButton.attachEvent){
				airyboxAuthButton.detachEvent("onclick", OAuth.handle_airyboxSignInClick);
				airyboxAuthButton.detachEvent("onclick", OAuth.handle_airyboxSignOutClick);
				airyboxAuthButton.attachEvent("onclick", OAuth.handle_airyboxSignInClick);
			}
		}
	}

	OAuth.handle_airykeyAuthResult = function(authResult) {
		if (authResult && !authResult.error) {
			airykeyAuthDiv.style.visibility = 'hidden';
			airykeyAuthDiv.style.display = 'none';
			OAuth.make_airykeySignIn(authResult.access_token);
		} else {
			airykeyAuthDiv.style.visibility = '';
			airykeyAuthDiv.style.display = '';
		}
	}

	// Load the API and make an API call.  Display the results on the screen.
	OAuth.make_airykeySignIn = function(access_token) {
		identityData = {};

		$.ajax({
			type: "POST",
			url: "https://" + DOMAIN_NAME_AIRYKEY + "/login" + "?api=driveabout",
			crossDomain: true,
			 xhrFields: {
			 withCredentials: true
			 },
			 beforeSend: function(xhr){
			 xhr.withCredentials = true;
			 },
			async: false,
			data: "access_token=" +  access_token,
			success: function(msgJson) {
				identityData = JSON.parse(msgJson);

				if (identityData.hasOwnProperty("error"))	{
					alert(identityData.error);
					return false;
				}

				if (identityData.hasOwnProperty("identity_email")) {
					authIdentity.value = identityData.identity_email;

					if (identityData.hasOwnProperty("permission_id")) {
						authPermissionId.value = identityData.permission_id;
					}

					if (identityData.hasOwnProperty("display_name")) {
						authDisplayName.value = identityData.display_name;
					} else {
						authDisplayName.value = identityData.identity_email;
					}

					airyboxAuthButton.innerHTML = airyboxAuthButton.innerHTML.replace(SIGNOUT_LABEL, SIGNOUTFROM_LABEL + authDisplayName.value);

					OAuth.listFiles();

					console.log(identityData.identity_email);
				} else {
					alert("Error: AJAX/JSON parse.");
					return false;
				}
			},
			error: function (responseData, textStatus, errorThrown) {
				alert(errorThrown.message);
				return false;
			}
		});
	}

	OAuth.handle_airyboxSignOutClick = function(event) {
		// airykeySignOut
		$.ajax({
			type: "GET",
			url: "https://" + DOMAIN_NAME_AIRYKEY + "/logout",
			crossDomain: true,
			 xhrFields: {
			 withCredentials: true
			 },
			 beforeSend: function(xhr){
			 xhr.withCredentials = true;
			 },
			async: false,
			data: "",
			success: function(msgJson) {
				GDriveAPI.cors.access_token = '';

				airyboxAuthButton.innerHTML = airyboxAuthButton.innerHTML.replace(SIGNOUTFROM_LABEL + authDisplayName.value, AUTHENTICATEWITHGOOGLE_LABEL);
				airyboxAuthButton.innerHTML = airyboxAuthButton.innerHTML.replace(SIGNOUT_LABEL, AUTHENTICATEWITHGOOGLE_LABEL);

				authDisplayName.value = "";
				authPermissionId.value = "";
				authIdentity.value = "";

				AccountBalance.disable();

				accountBalanceFileID = '';
				fileList.length = 0;

				if (airyboxAuthButton.addEventListener) {
					airyboxAuthButton.removeEventListener("click", OAuth.handle_airyboxSignInClick, false);
					airyboxAuthButton.removeEventListener("click", OAuth.handle_airyboxSignOutClick, false);
					airyboxAuthButton.addEventListener("click", OAuth.handle_airyboxSignInClick, false);
				} else if (airyboxAuthButton.attachEvent){
					airyboxAuthButton.detachEvent("onclick", OAuth.handle_airyboxSignInClick);
					airyboxAuthButton.detachEvent("onclick", OAuth.handle_airyboxSignOutClick);
					airyboxAuthButton.attachEvent("onclick", OAuth.handle_airyboxSignInClick);
				}
			},
			error: function (responseData, textStatus, errorThrown) {
				alert(errorThrown.message);
				return false;
			}
		});
	}

})(window, document);

window.onload = OAuth.init;
