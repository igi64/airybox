var AccountBalance = AccountBalance || {};

(function (w, d) {

	var accountBalanceForm;

	var accountBalanceDay;
	var accountBalanceMonth;
	var accountBalanceYear;
	var accountBalanceAmount;

	var reloadButton;
	var saveButton;

	var plainTextEditor;
	var cipherTextEditor;

	AccountBalance.init = function () {

		plainTextEditor = $("#plainTextEditor").cleditor()[0];
		cipherTextEditor = $("#cipherTextEditor").cleditor()[0];

		/*$('#accountBalanceAmount').priceFormat({
			prefix: '',
			suffix: '€'
		});*/

		accountBalanceForm = d.getElementById("accountBalanceForm");

		accountBalanceDay = d.getElementById("accountBalanceDay");
		accountBalanceMonth = d.getElementById("accountBalanceMonth");
		accountBalanceYear = d.getElementById("accountBalanceYear");
		accountBalanceAmount = d.getElementById("accountBalanceAmount");

		reloadButton = d.getElementById("reloadButton");
		saveButton = d.getElementById("saveButton");

		if (reloadButton.addEventListener) {
			reloadButton.addEventListener("click", AccountBalance.reload, false);
			saveButton.addEventListener("click", AccountBalance.save, false);
		} else if (reloadButton.attachEvent){
			reloadButton.attachEvent("onclick", AccountBalance.reload);
			saveButton.attachEvent("onclick", AccountBalance.save);
		}
	}

	AccountBalance.enable = function() {
		$(accountBalanceDay).selectmenu('enable');
		$(accountBalanceMonth).selectmenu('enable');
		$(accountBalanceYear).selectmenu('enable');
		$(accountBalanceAmount).textinput('enable');

		$(reloadButton).button('enable');
		//$(saveButton).button('enable');

		AccountBalance.reload();
	}

	AccountBalance.disable = function() {
		accountBalanceDay.selectedIndex = 0;
		accountBalanceMonth.selectedIndex = 0;
		accountBalanceYear.selectedIndex = 0;
		accountBalanceAmount.value = '';

		$(accountBalanceDay).selectmenu("refresh", false);
		$(accountBalanceMonth).selectmenu("refresh", false);
		$(accountBalanceYear).selectmenu("refresh", false);

		$(accountBalanceDay).selectmenu('disable');
		$(accountBalanceMonth).selectmenu('disable');
		$(accountBalanceYear).selectmenu('disable');
		$(accountBalanceAmount).textinput('disable');

		$(reloadButton).button('disable');
		$(saveButton).button('disable');
	}

	AccountBalance.reload = function() {
		OAuth.returnFile(AccountBalance.do_reload);
	}

	AccountBalance.do_reload = function() {
		var formData;

		//formData = '{"accountBalanceDay":"10","accountBalanceMonth":"dec","accountBalanceYear":"2012","accountBalanceAmount":"12.34€"}';

		OAuth.decryptAll();

		if (plainTextEditor.doc.body.outerHTML) {
			formData = plainTextEditor.doc.body.outerText;
		} else {
			formData = new XMLSerializer().serializeToString(plainTextEditor.doc.body);
		}

		formData = JSON.parse(formData);

		js2form(accountBalanceForm, formData);

		$(accountBalanceDay).selectmenu("refresh", false);
		$(accountBalanceMonth).selectmenu("refresh", false);
		$(accountBalanceYear).selectmenu("refresh", false);

		//alert('Reloaded.');
	}

	AccountBalance.save = function() {
		var formData;

		plainTextEditor.$area.val("");

		formData = form2js(accountBalanceForm, '.', true);

		if (formData) {
			console.log(JSON.stringify(formData));

			plainTextEditor.$area.val(JSON.stringify(formData));
		}

		plainTextEditor.updateFrame();

		OAuth.permissionsFile(true); //OAuth.encryptAll(), OAuth.updateFile()

		//OAuth.encryptAll();

		//OAuth.updateFile();
	}

})(window, document);