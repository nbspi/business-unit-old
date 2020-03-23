sap.ui.define([
	"sap/ui/test/Opa5"
], function(Opa5) {
	"use strict";

	return Opa5.extend("com.apptech.bfi-businessunit.test.integration.arrangements.Startup", {

		iStartMyApp: function () {
			this.iStartMyUIComponent({
				componentConfig: {
					name: "com.apptech.bfi-businessunit",
					async: true,
					manifest: true
				}
			});
		}

	});
});
