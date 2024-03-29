sap.ui.define([
  "jquery.sap.global",
	"sap/ui/Device",
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/Controller",
	"com/apptech/bfi-businessunit/controller/AppUI5",
	"sap/ui/model/json/JSONModel",
	"sap/m/Popover",
	"sap/m/Button",
	"sap/m/library",
	"sap/m/MessageToast"
], function(jQuery, Device, Fragment, Controller,AppUI5, JSONModel, Popover, Button, mobileLibrary, MessageToast) {
  "use strict";

  	return Controller.extend("com.apptech.bfi-businessunit.controller.Main", {
   		onInit: function () {
			//USER DATA
			this.sDataBase = jQuery.sap.storage.Storage.get("dataBase");
			this.sUserCode = jQuery.sap.storage.Storage.get("userCode");

			if(this.sUserCode === "" || this.sUserCode === undefined || this.sUserCode === null){
				window.location.replace("/index.html");
				return;
			}

			this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
    		this._oRouter.attachRouteMatched(this.handleRouteMatched, this);

			// var oManger =this.sUserCode;
			// this.getView().byId("userbutton").setText(oManger);

			this.oMdlMenu = new JSONModel();
			this.fGetAllMenu(this.sDataBase);
			// this.oMdlMenu = new JSONModel("model/menus.json");
			// this.getView().setModel(this.oMdlMenu);

			this.router = this.getOwnerComponent().getRouter();
			this.router.navTo("Request");
		},

		fGetAllMenu: function(sDataBase){
			$.ajax({
				url: "https://xsjsv10.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName="+ sDataBase +"&procName=spAppBusinessUnit&QUERYTAG=getAllMenu" +
				"&VALUE1="+ this.sUserCode +"&VALUE2=&VALUE3=&VALUE4=",
				type: "GET",
				async: false,
				dataType: "json",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:Qwerty0987"));
				},
				error: function (xhr, status, error) {
					///var Message = xhr.responseJSON["error"].message.value;
					sap.m.MessageToast.show(xhr);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results) {
					this.oMdlMenu.setJSON("{\"navigation\" : " + JSON.stringify(results) + "}");
					this.getView().setModel(this.oMdlMenu);
				}
			});
		},
		handleRouteMatched : function (evt) {
			this.sDataBase = jQuery.sap.storage.Storage.get("dataBase");
			this.sUserCode = jQuery.sap.storage.Storage.get("userCode");
			//set user name
			this.getView().byId("userbutton").setText(this.sUserCode);
			//load menu
			this.fGetAllMenu(this.sDataBase);

		},
		onRoutePatternMatched: function (event) {
			var key = event.getParameter("name");
			this.byId("childViewSegmentedButton").setSelectedKey(key);
		},

		onAfterShow: function (router) {
			router.navTo("Request");
		},

		onSelect: function (event) {
			this.router = this.getOwnerComponent().getRouter();
			this.router.navTo(event.getParameter("key"));
		},

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
			case "Request":
			this.router.navTo("Request");
			break;
			case "BusinessUnit":
				this.router.navTo("BusinessUnit");
				break;
			case "Pending":
				this.router.navTo("Pending");
				break;
			case "Requestrecord":
			this.router.navTo("Requestrecord");
			break;
			case "Transactionrecord":
			this.router.navTo("Transactionrecord");
			break;
			case "Pendingrequest":
			this.router.navTo("Pendingrequest");
			break;
			case "Report":
			this.router.navTo("Report");
			break;
			default:

			}
		},

		handleOpen: function (oEvent) {
			var oButton = oEvent.getSource();

			// create action sheet only once
			if (!this._actionSheet) {
				this._actionSheet = sap.ui.xmlfragment(
					"com.apptech.bfi-businessunit.view.fragments.UserActionFragment",
					this
				);

				this.getView().addDependent(this._actionSheet);
			}

			this._actionSheet.openBy(oButton);
		},
		onLogout: function (){
			$.ajax({
				url: "https://slv10.biotechfarms.net/b1s/v1/Logout",
				type: "POST",
				error: function (xhr, status, error) {
				  var Message = xhr.responseJSON["error"].message.value;
				  sap.m.MessageToast.show(Message);
				},
				context:this,
				success: function (json) {
					sap.m.MessageToast.show("Session End");
					jQuery.sap.storage.Storage.clear();
					// sap.ui.core.UIComponent.getRouterFor(this).navTo("Login", null, true);
					window.location.replace("/index.html");
				}
			});
		}

  });
});
