sap.ui.define([
  "jquery.sap.global",
	"sap/ui/Device",
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Popover",
	"sap/m/Button",
	"sap/m/library",
	"sap/m/MessageToast"
], function(jQuery, Device, Fragment, Controller, JSONModel, Popover, Button, mobileLibrary, MessageToast) {
  "use strict";

  return Controller.extend("com.apptech.bfi-businessunit.controller.Main", {
    
    onInit: function () {
			this.oMdlMenu = new JSONModel("model/menus.json");
			this.getView().setModel(this.oMdlMenu);

			this.router = this.getOwnerComponent().getRouter();
			this.router.navTo("BusinessUnit");
		},
		
		
		//-------------------------------------------
		onRoutePatternMatched: function (event) {
			var key = event.getParameter("name");
			this.byId("childViewSegmentedButton").setSelectedKey(key);
		},

		onAfterShow: function (router) {
			router.navTo("BusinessUnit");
		},

		onSelect: function (event) {
			this.router = this.getOwnerComponent().getRouter();
			this.router.navTo(event.getParameter("key"));
		},

		//-------------------------------------------
		
		onMenuButtonPress: function () {
			var toolPage = this.byId("toolPage");
			toolPage.setSideExpanded(!toolPage.getSideExpanded());
		},

		onIconPress: function (oEvent) {
			this.router.navTo("BusinessUnit");
		},

		onItemSelect: function (oEvent) {
			var sSelectedMenu = oEvent.getSource().getProperty("selectedKey");
			switch (sSelectedMenu) {
			case "butransfer":
				this.router.navTo("BusinessUnit");
				break;
			default:

			}
		},

		
		onLogout: function (oEvent) {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("Login");
		}


  });
});
