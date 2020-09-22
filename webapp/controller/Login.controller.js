sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "com/apptech/bfi-businessunit/controller/AppUI5",
    "sap/m/MessageToast"
], function (Controller, JSONModel, AppUI5 ,MessageToast) {
    "use strict";

    return Controller.extend("com.apptech.bfi-businessunit.controller.Login", {
        onInit: function () {

            //get all databse
            this.oMdlDatabase = new JSONModel("model/databases.json");
            this.oMdlLogin = new JSONModel("model/login.json");
            this.getView().setModel(this.oMdlLogin);
            this.fGetAllRecords("getAllDB");

        },

        action: function (oEvent) {
            var that = this;
            var actionParameters = JSON.parse(oEvent.getSource().data("wiring").replace(/'/g, "\""));
            var eventType = oEvent.getId();
            var aTargets = actionParameters[eventType].targets || [];
            aTargets.forEach(function (oTarget) {
                var oControl = that.byId(oTarget.id);
                if (oControl) {
                    var oParams = {};
                    for (var prop in oTarget.parameters) {
                        oParams[prop] = oEvent.getParameter(oTarget.parameters[prop]);
                    }
                    oControl[oTarget.action](oParams);
                }
            });
            var oNavigation = actionParameters[eventType].navigation;
            if (oNavigation) {
                var oParams = {};
                (oNavigation.keys || []).forEach(function (prop) {
                    oParams[prop.name] = encodeURIComponent(JSON.stringify({
                        value: oEvent.getSource().getBindingContext(oNavigation.model).getProperty(prop.name),
                        type: prop.type
                    }));
                });
                if (Object.getOwnPropertyNames(oParams).length !== 0) {
                    this.getOwnerComponent().getRouter().navTo(oNavigation.routeName, oParams);
                } else {
                    this.getOwnerComponent().getRouter().navTo(oNavigation.routeName);
                }
            }
        },

        onLogin: function (oEvent) {
            AppUI5.showBusyIndicator(10000);
            var sDBCompany = this.getView().byId("selectDatabase").getSelectedKey();
           /// var sDBCompany = this.oMdlDatabase.getData().Database;
            var username = this.oMdlLogin.getData().Login.username;
            var password = this.oMdlLogin.getData().Login.password;
            //var sDBCompany = "SBODEMOAU_SL";//"DEVBFI_FSQR";
            var oLoginCredentials = {};
            oLoginCredentials.CompanyDB = sDBCompany;
            oLoginCredentials.UserName = username;//"manager";
            oLoginCredentials.Password = password;//"1234";
            $.ajax({
                url: "https://18.136.35.41:50000/b1s/v1/Login",
                data: JSON.stringify(oLoginCredentials),
                type: "POST",
                crossDomain: true,
                xhrFields: {
					withCredentials: true
				},
                error: function (xhr, status, error) {
                    var Message = xhr.responseJSON["error"].message.value;
					console.error(JSON.stringify(Message));
                    MessageToast.show(Message);
                    AppUI5.hideBusyIndicator();
                },
                context: this,
                success: function (json) { }
            }).done(function (results) {
                if (results) {
					sap.m.MessageToast.show("Welcome: " + username);
					this.loadUDandUDF();
                    sap.ui.core.UIComponent.getRouterFor(this).navTo("Request");
                    jQuery.sap.storage.Storage.put("dataBase",sDBCompany);
					jQuery.sap.storage.Storage.put("userCode",username);
                    jQuery.sap.intervalCall(1800000,this,"hidePanelAgain",[this]);
                    //AppUI5.hideBusyIndicator();
                }
            });
        },

        //---- If Session is 30 mins Already
        hidePanelAgain: function (passedthis) {
            MessageToast.show("Timed Out");
            jQuery.sap.storage.Storage.clear();
            this.oLogin.getData().Login.Pass = "";
            this.oLogin.refresh();
            sap.ui.core.UIComponent.getRouterFor(this).navTo("Login");
        },

        fGetAllRecords: function(queryTag){
			// var aReturnResult = [];
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppBusinessUnit&QUERYTAG="+ queryTag +"&value1=&value2=&value3=&value4=",
				type: "GET",
				dataType: "json",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
			  	},
				error: function (xhr, status, error) {
                    var Message = xhr.responseJSON["error"].message.value;
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results) {
					this.oMdlDatabase.setJSON("{\"Database\" : " + JSON.stringify(results) + "}");
					this.getView().setModel(this.oMdlDatabase, "oMdlDatabase");
				}
			});

		},
		loadUDandUDF:function(){
			// // create udt
			// // Business Unit Draft  Header
			// AppUI5.createTable("APP_OINT", "Business Unit - Header", "bott_NoObject");
			// // Business Unit
			// AppUI5.createTable("APP_INT1", "Business Unit - Details", "bott_NoObject");

			// //create udf
			// //Business Unit Header
			// AppUI5.createField("APP_TransType", "Transaction Type", "@APP_OINT", "db_Alpha", "", 50);
			// AppUI5.createField("APP_TransNo", "Transaction Number", "@APP_OINT", "db_Alpha", "", 50);
			// AppUI5.createField("APP_TransDate", "Transaction Date", "@APP_OINT", "db_Alpha", "", 50);
			// AppUI5.createField("APP_CardCode", "Customer No", "@APP_OINT", "db_Alpha", "", 50);
			// AppUI5.createField("APP_CustomerName", "Customer Name", "@APP_OINT", "db_Alpha", "", 50);
			// AppUI5.createField("APP_MarkupType", "Markup Type", "@APP_OINT", "db_Alpha", "", 50);
			// AppUI5.createField("APP_IssueBU", "Issuing BU", "@APP_OINT", "db_Alpha", "", 50);
			// AppUI5.createField("APP_ReceivingBU", "Receiving BU", "@APP_OINT", "db_Alpha", "", 50);
			// AppUI5.createField("APP_Remarks", "Remarks", "@APP_OINT", "db_Alpha", "", 200);
			// AppUI5.createField("CreatedBy", "Created By", "@APP_OINT", "db_Alpha", "", 50);
			// AppUI5.createField("UpdatedBy", "Updated By", "@APP_OINT", "db_Alpha", "", 50);
			// AppUI5.createField("UpdatedDate", "Updated Date", "@APP_OINT", "db_Alpha", "", 50);
			// AppUI5.createField("APP_PostingDate", "Posting Date", "@APP_OINT", "db_Alpha", "", 50);
			// AppUI5.createField("APP_Status", "Status", "@APP_OINT", "db_Alpha", "", 50);
			// AppUI5.createField("APP_DocType", "Document Type", "@APP_OINT", "db_Alpha", "", 50);
			// AppUI5.createField("APP_ReceivedBy", "Received By", "@APP_OINT", "db_Alpha", "", 50);
			// AppUI5.createField("APP_Attachment", "Attachment", "@APP_OINT", "db_Alpha", "", 50);
        	// AppUI5.createField("APP_AttachmentKey", "Attechment Key", "@APP_OINT", "db_Alpha", "", 50);
            // AppUI5.createField("APP_IsPostedGI", "Posted Goods Issue", "@APP_OINT", "db_Alpha", "", 10);
            // AppUI5.createField("APP_IsPostedGR", "Posted Goods Receipt", "@APP_OINT", "db_Alpha", "", 10);
            // AppUI5.createField("APP_UserRole", "User Role", "@APP_OINT", "db_Alpha", "", 10);

			// //Business Unit Details
			// AppUI5.createField("APP_ItemNum", "Item Number", "@APP_INT1", "db_Alpha", "", 50);
			// AppUI5.createField("APP_Description", "Description", "@APP_INT1", "db_Alpha", "", 50);
			// AppUI5.createField("APP_Quantity", "Quantity", "@APP_INT1", "db_Alpha", "", 50);
			// AppUI5.createField("APP_CostProd", "Cost to Produce", "@APP_INT1", "db_Alpha", "", 50);
			// AppUI5.createField("APP_MarkUp", "Mark Up", "@APP_INT1", "db_Alpha", "", 50);
			// AppUI5.createField("APP_TransferPrice", "Transfer Price", "@APP_INT1", "db_Alpha", "", 50);
			// AppUI5.createField("APP_MarketPrice", "Market Price", "@APP_INT1", "db_Alpha", "", 50);
			// AppUI5.createField("APP_TransNo", "Transaction Number", "@APP_INT1", "db_Alpha", "", 50);
			// AppUI5.createField("APP_TransType", "Transaction Type", "@APP_INT1", "db_Alpha", "", 50);
        	// AppUI5.createField("APP_Uom", "UOM", "@APP_INT1", "db_Alpha", "", 50);
        
            // //NDC add udf in OIGE
            // AppUI5.createField("APP_BU_TransNum", "BU TransNum", "OIGE", "db_Alpha", "", 30);
            ////User TAble
            // AppUI5.createField("APP_UserRole", "User Role", "OUSR", "db_Alpha", "", 10);
            
		}
    });
});
