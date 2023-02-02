sap.ui.define([
  "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"com/apptech/bfi-businessunit/controller/AppUI5",
	"sap/ui/model/FilterOperator"
], function(Controller, JSONModel, Fragment, Filter, AppUI5, FilterOperator) {
  "use strict";

  	return Controller.extend("com.apptech.bfi-businessunit.controller.Request", {
		onRoutePatternMatched: function(event){
			this.fClearField();
		},
		onInit: function () {
			//ON LOAD
			var route = this.getOwnerComponent().getRouter().getRoute("Request");
			route.attachPatternMatched(this.onRoutePatternMatched,this);
			//USER DATA
			this.sDataBase = jQuery.sap.storage.Storage.get("dataBase");
			this.sUserCode = jQuery.sap.storage.Storage.get("userCode");

			//getButtons
			this.oMdlButtons = new JSONModel();
			this.oResults = AppUI5.fGetButtons(this.sDataBase,this.sUserCode,"Request");
			var newresult = [];
			this.oResults.forEach((e)=> {
				var d = {};
				d[e.U_ActionDesc] = JSON.parse(e.visible);
				newresult.push(JSON.parse(JSON.stringify(d)));
			});
			var modelresult = JSON.parse("{" + JSON.stringify(newresult).replace(/{/g,"").replace(/}/g,"").replace("[","").replace("]","") + "}");
			this.oMdlButtons.setJSON("{\"buttons\" : " + JSON.stringify(modelresult) + "}");
			this.getView().setModel(this.oMdlButtons, "buttons");

			//TO STORED SELECTED ROW
			this.iSelectedRow = 0;

			//BLANK JSONMODEL FOR ALL BP FOR TEMPLATE
			this.oMdlAllBP = new JSONModel();
			this.oMdlAllBP.setSizeLimit(100000);
			this.oMdlAllBP.getData().allbp = [];

			//BLANK JSONMODEL FOR ALL BP FOR TEMPLATE
			this.oMdlAllWhs = new JSONModel();
			this.oMdlAllWhs.setSizeLimit(100000);
			this.oMdlAllWhs.getData().allwhs = [];

			// Get DateToday
			this.getView().byId("transactiondate").setDateValue(new Date());
			this.getView().byId("dpickerpostingdate").setDateValue(new Date());
			

			//BLANK JSONMODEL FOR ALL ITEMS FOR TEMPLATE
			this.oMdlAllItems = new JSONModel();
			this.oMdlAllItems.setSizeLimit(100000);
			this.oMdlAllItems.getData().allitems = [];

			//BLANK JSONMODEL FOR ALL UOM FOR TEMPLATE
			this.oMdlAllUom = new JSONModel();
			this.oMdlAllUom.setSizeLimit(100000);
			this.oMdlAllUom.getData().alluom = [];

			//BIND TO MAIN MODEL
			this.oModel = new JSONModel("model/request.json");
			this.oModel.setSizeLimit(100000);
			this.getView().setModel(this.oModel);

			//this.getView().byId("inputremarks").setValue("Test");

			///INITIALIZE FOR MARKETPRICE
			this.MarketPrice = "";
			////Initialize code when onview is clicked
			this.Code = "";
			//Value for used for condition for add/Update Draft
			this.triggercondition = "SAVE AS DRAFT";
			///Table ID
			this.oTableDetails = this.getView().byId("tblDetails");

			//GET ALL WAREHOUSE
			$.ajax({
			url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getallwarehouses&value1&value2&value3&value4",
			type: "GET",
			datatype:"json",
			beforeSend: function (xhr) {
				xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:Qwerty0987"));
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
				this.oModel.getData().AllWarehouses = results;
				this.oMdlAllRecord.refresh();
			}
			});
			//// INITIALIZE Variables FOR TABLE
			this.isClickedIssue = true;
			this.aCols = [];
			this.aColsDetails = [];
			this.columnData = [];
			this.columnDataDetail = [];
			this.oEditRecord = {};
			this.iRecordCount = 0;
			this.oIconTab = this.getView().byId("tab1");
			this.oMdlAllRecord = new JSONModel();
			this.tableId = "tblDrafts";
			this.oIssueBu = "";
			this.oReceiveBu= "";
			//CPA
			this.currentFile = {}; //File Object
			//For Attachment File Key
			this.FileKey = null;
			/// REQUESTOR DATA
			var oRequestor =this.sUserCode;
			this.getView().byId("inputrequestor").setValue(oRequestor);
			AppUI5.hideBusyIndicator();

			this.gGetBusinessUnit();
			this.gGetInventoryTransactionType();
		},
		//GETTING DATE NOW
		getTodaysDate: function () {
			var today = new Date();
			var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
			return date;
		},
		///On Clear Fields Function
		fClearField: function () {
			try {
				this.oModel.getData().EditRecord.TransType = "";
				this.oModel.getData().EditRecord.InventoryTransactionType = "";
				this.oModel.getData().EditRecord.TransNo = "";
				this.oModel.getData().EditRecord.BPCode = "";
				this.oModel.getData().EditRecord.BPName = "";
				this.oModel.getData().EditRecord.PostingDate = "";
				this.oModel.getData().EditRecord.IssueBU = "";
				this.oModel.getData().EditRecord.ReceiveBU = "";
				this.oModel.getData().EditRecord.Remarks = "";
				this.oModel.getData().EditRecord.DocumentLines.length = 0;
				this.oModel.getData().EditRecord.BusinessUnit = "";

			    this.oModel.getData().EditRecord.ExpDate= "";
				this.oModel.getData().EditRecord.ManufacturingDate= "";
				this.oModel.getData().EditRecord.LotNumber= "";
			    this.oModel.getData().EditRecord.BatchNumber= "";

				this.oIssueBu = "";
				this.oReceiveBu= "";
				this.getView().byId("fileUploader").setValue("");
				this.currentFile = {};
				this.FileKey = null;
				this.oModel.refresh();
			} catch (err) {
				//console.log(err.message);
			}
		},
		
		///BP LIST FROM FRAGMENT
		handleValueHelpBPCode: function () {
			var TransType = this.getView().byId("TransID").getSelectedKey();
			var customertype ="";
					if (TransType ==="4" || TransType ==="3"){
						customertype = "S";
					}else{
						customertype = "C";
					}
			if (!this._oValueHelpDialogs) {
				Fragment.load({
					name: "com.apptech.bfi-businessunit.view.fragments.BPDialogFragment",
					controller: this
				}).then(function (oValueHelpDialogs) {
					this._oValueHelpDialogs = oValueHelpDialogs;
					this.getView().addDependent(this._oValueHelpDialogs);
					this.f_configValueHelpDialogs(TransType,customertype);
					this._oValueHelpDialogs.open();
				}.bind(this));
			} else {
				this.f_configValueHelpDialogs(TransType,customertype);
				this._oValueHelpDialogs.open();
			}
		},
		//GETTING ALL BP
		f_configValueHelpDialogs: function (TransType,customertype) {
			var sInputValue = this.byId("inputbpcode").getValue();
				//GET ALL BP
				$.ajax({
					url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getallbp&value1="+ customertype +"&value2&value3&value4",
					type: "GET",
					datatype:"json",
				beforeSend: function(xhr){
					xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:Qwerty0987"));
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
						this.oMdlAllBP.getData().allbp = results;
						this.oMdlAllBP.refresh();
						this.getView().setModel(this.oMdlAllBP, "oMdlAllBP");
					}
				});
			var aList = this.oMdlAllBP.getProperty("/allbp");

			aList.forEach(function (oRecord) {
				oRecord.selected = (oRecord.CardCode === sInputValue);
			});
		},
		///Search on BP
		handleSearchBP: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilters = new Filter([
				new Filter("CardName", FilterOperator.Contains, sValue),
				new Filter("CardCode", FilterOperator.Contains, sValue)
				], false);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(oFilters);
		},
		//Closing selection on Search BP
		handleValueHelpCloseBatch: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			var CardDetails = {};
			if (aContexts && aContexts.length) {
				CardDetails = aContexts.map(function (oContext) {
					var oCard = {};
					oCard.CardCode = oContext.getObject().CardCode;
					oCard.CardName = oContext.getObject().CardName;
					return oCard;
				});
			}
			oEvent.getSource().getBinding("items").filter([]);
			this.getView().byId("inputbpcode").setValue(CardDetails[0].CardCode);
			this.oModel.refresh();
		},
		///GETTING WAREHOUSE LIST FROM FRAGMENTS
		handleValueHelpIssueingBu: function (oEvent) {
			if (!this._oValueHelpDialogscodeissue) {
				Fragment.load({
					name: "com.apptech.bfi-businessunit.view.fragments.WarehouseDialogFragment",
					controller: this
				}).then(function (oValueHelpDialogs) {
					this._oValueHelpDialogscodeissue = oValueHelpDialogs;
					this.getView().addDependent(this._oValueHelpDialogscodeissue);
					this.f_configValueHelpDialogsWhsIssue();
					this._oValueHelpDialogscodeissue.open();
				}.bind(this));
			} else {
				this.f_configValueHelpDialogsWhsIssue();
				this._oValueHelpDialogscodeissue.open();
			}
		},
		//Warehouse List For Requesting BU from Fragment
		handleValueHelpRequestingBu: function () {
			if (!this._oValueHelpDialogscodereceive) {
				Fragment.load({
					name: "com.apptech.bfi-businessunit.view.fragments.WarehouseDialogFragmentReceive",
					controller: this
				}).then(function (oValueHelpDialogs) {
					this._oValueHelpDialogscodereceive = oValueHelpDialogs;
					this.getView().addDependent(this._oValueHelpDialogscodereceive);
					this.f_configValueHelpDialogsWhsReceive();
					this._oValueHelpDialogscodereceive.open();

				}.bind(this));
			} else {
				this.f_configValueHelpDialogsWhsReceive();
				this._oValueHelpDialogscodereceive.open();
			}
		},
		///GETTING ALL ISSUING WAREHOUSE
		f_configValueHelpDialogsWhsIssue: function () {
			var sInputValue = this.byId("inputwhsissue").getValue();
			var aList = this.oModel.getProperty("/AllWarehouses");
			aList.forEach(function (oRecord) {
				oRecord.selected = (oRecord.WhsCode === sInputValue);
			});
		},
		///GETTING ALL REQUESTING WAREHOUSE
		f_configValueHelpDialogsWhsReceive: function () {
			var sInputValuereceive = this.byId("inputwhsreceive").getValue();
			var aList = this.oModel.getProperty("/AllWarehouses");
			aList.forEach(function (oRecord) {
				oRecord.selected = (oRecord.WhsCode === sInputValuereceive);
			});
		},
	
		///Search on Issuing Whs
		handleSearchWhs: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilters = new Filter([
				new Filter("WhsCode", FilterOperator.Contains, sValue),
				new Filter("WhsName", FilterOperator.Contains, sValue)
				], false);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(oFilters);
		},
		///Search on Requesting Whs
		handleSearchWhsreceive: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilters = new Filter([
				new Filter("WhsCode", FilterOperator.Contains, sValue),
				new Filter("WhsName", FilterOperator.Contains, sValue)
				], false);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(oFilters);
		},
	
		//Closing selection on Issuing Whs
		handleValueHelpCloseWhs: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			var CardDetails = {};
			if (aContexts && aContexts.length) {

				CardDetails = aContexts.map(function (oContext) {
					var oCard = {};
					oCard.WhsCode = oContext.getObject().WhsCode;
					oCard.WhsName = oContext.getObject().WhsName;
					return oCard;
				});
			}
			oEvent.getSource().getBinding("items").filter([]);
			this.getView().byId("inputwhsissue").setValue(CardDetails[0].WhsName);
			this.oIssueBu=CardDetails[0].WhsCode;
			this.oModel.refresh();
		},
		//Closing selection on Requesting Whs
		handleValueHelpCloseWhsreceive: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			var CardDetails = {};
			if (aContexts && aContexts.length) {
				CardDetails = aContexts.map(function (oContext) {
					var oCard = {};
					oCard.WhsCode = oContext.getObject().WhsCode;
					oCard.WhsName = oContext.getObject().WhsName;
					return oCard;
				});
			}
			oEvent.getSource().getBinding("items").filter([]);
			this.getView().byId("inputwhsreceive").setValue(CardDetails[0].WhsName);
			this.oReceiveBu=CardDetails[0].WhsCode;
			this.oModel.refresh();
		},
		//ALL ITEM LIST FROM FRAGMENT
		handleValueitemdetails: function (oEvent) {
			this.iSelectedRow = oEvent.getSource().getBindingContext().sPath.match(/\d+/g)[0];
			if (!this._oValueHelpDialogsItem) {
				Fragment.load({
					name: "com.apptech.bfi-businessunit.view.fragments.ItemDialogFragment",
					controller: this
				}).then(function (oValueHelpDialogs) {
					this._oValueHelpDialogsItem = oValueHelpDialogs;
					this.getView().addDependent(this._oValueHelpDialogsItem);
					this.f_configValueHelpDialogsItems();
					this._oValueHelpDialogsItem.open();
				}.bind(this));
			} else {
				this.f_configValueHelpDialogsItems();
				this._oValueHelpDialogsItem.open();
			}
		},
		///GETTING ALL ITEMS CONFIGURATION FROM UDT
		f_configValueHelpDialogsItems: function () {
			if (this.oModel.getData().AllItems.length <= 1) {
				//GET ALL ITEMS
				$.ajax({
					url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getallitems&value1&value2&value3&value4",
					type: "GET",
					datatype:"json",
				beforeSend: function(xhr){
					xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:Qwerty0987"));
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
						this.oModel.getData().AllItems.length = 0;
						this.oModel.getData().AllItems = JSON.parse(JSON.stringify(results));
						this.oModel.refresh();
					}
				});
			}

			var aList = this.oMdlAllItems.getProperty("/allitems");
			aList.forEach(function (oRecord) {
				//	oRecord.selected = (oRecord.ItemCode === sInputValue);
			});
		},
		///Search on Item
		handleSearchItem: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilters = new Filter([
				new Filter("ItemName", FilterOperator.Contains, sValue),
				new Filter("ItemCode", FilterOperator.Contains, sValue)
				], false);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(oFilters);
		},
		//Closing selection on Item
		handleValueHelpCloseItem: function (oEvent) {
			var transtype = this.oModel.getData().EditRecord.TransType;
			var issuebu = this.oIssueBu;
			var receivebu = this.oReceiveBu;
			var aContexts = oEvent.getParameter("selectedContexts");
			var ItemDetails = {};
			if (aContexts && aContexts.length) {

				ItemDetails = aContexts.map(function (oContext) {
					var oItem = {};
					oItem.ItemCode = oContext.getObject().ItemCode;
					oItem.ItemName = oContext.getObject().ItemName;
					oItem.InventoryUom = oContext.getObject().InvntryUom;
					oItem.UomEntry = oContext.getObject().UomEntry;
					return oItem;
				});
			}
			oEvent.getSource().getBinding("items").filter([]);
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].ItemNum = ItemDetails[0].ItemCode;
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].Description = ItemDetails[0].ItemName;
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].UomCode = ItemDetails[0].InventoryUom;
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].UomEntry = ItemDetails[0].UomEntry;
			if(transtype === "3"){
				var oCostToProduce =this.f_getAveragePrice(ItemDetails[0].ItemCode,receivebu);
				this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].CostProd = oCostToProduce;
			}else{
				var oCostToProduce =this.f_getAveragePrice(ItemDetails[0].ItemCode,issuebu);
				this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].CostProd = oCostToProduce;
			}
			var oMarketPrice = this.f_getMarketPrice(ItemDetails[0].ItemCode);
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].MarketPrice = oMarketPrice;
			

			if (transtype === "1") {
				if(oCostToProduce <= oMarketPrice){
					this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
				}else{
					this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice=oMarketPrice;
				}
			}else if (transtype === "2") {
				this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
			}else if (transtype === "3") {
				this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
			}
			this.oModel.refresh();
		},
		///GET Market Type
		f_getMarketPrice: function (ItemCode) {
			var iReturnMarketPrice = 0;
			$.ajax({
				url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getMarketPrice&value1=" + ItemCode +
					"&value2=7&value3&value4",
				type: "GET",
				async: false,
				datatype:"json",
				beforeSend: function(xhr){
					xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:Qwerty0987"));
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);

				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results.length > 0) {
					iReturnMarketPrice = results[0].Price;
				}

			});
			return iReturnMarketPrice;

		},

		f_getAveragePrice: function (ItemCode,WareHouse) {
			var iReturnAveragePrice = 0;
			$.ajax({
				url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getAveragePrice&value1=" + ItemCode +
					"&value2=" + WareHouse + "&value3&value4",
				type: "GET",
				async: false,
				datatype:"json",
				beforeSend: function(xhr){
					xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:Qwerty0987"));
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results.length > 0) {
					iReturnAveragePrice = results[0].AvgPrice;
				}

			});
			return iReturnAveragePrice;

		},
		//DISABLING TEXTBOX
		onChangeTrans: function (oEvent) {
			var transtype = this.getView().byId("TransID").getSelectedKey();
			if (transtype === "1") {
				this.getView().byId("inputbpcode").setValue("");
				this.getView().byId("inputwhsreceive").setValue("");
				this.getView().byId("inputbpcode").setEnabled(false);
				this.getView().byId("inputwhsissue").setEnabled(true);
				this.getView().byId("inputwhsreceive").setEnabled(true);
				this.getView().byId("inputmarkuptype").setEnabled(false);
				this.getView().byId("inputmarkuptype").setValue("");
				this.oModel.getData().EditRecord.DocumentLines.length = 0;
				this.oModel.refresh();
			}else if (transtype === "2") {
				this.getView().byId("inputbpcode").setValue("");
				this.getView().byId("inputwhsissue").setValue("");
				this.getView().byId("inputwhsreceive").setValue("");
				this.getView().byId("inputbpcode").setEnabled(true);
				this.getView().byId("inputwhsissue").setEnabled(false);
				this.getView().byId("inputwhsreceive").setEnabled(true);
				this.getView().byId("inputmarkuptype").setEnabled(true);
				this.oModel.getData().EditRecord.DocumentLines.length = 0;
				this.oModel.refresh();
			}else if (transtype === "3") {
				this.getView().byId("inputbpcode").setValue("");
				this.getView().byId("inputwhsreceive").setValue("");
				this.getView().byId("inputbpcode").setEnabled(true);
				this.getView().byId("inputwhsissue").setEnabled(true);
				this.getView().byId("inputwhsreceive").setEnabled(true);
				this.getView().byId("inputmarkuptype").setEnabled(false);
				this.oModel.getData().EditRecord.DocumentLines.length = 0;
				this.oModel.refresh();
			}else if (transtype === "4") {
				this.getView().byId("inputbpcode").setValue("");
				this.getView().byId("inputwhsreceive").setValue("");
				this.getView().byId("inputbpcode").setEnabled(false);
				this.getView().byId("inputwhsissue").setEnabled(true);
				this.getView().byId("inputwhsreceive").setEnabled(true);
				this.getView().byId("inputmarkuptype").setEnabled(false);
				this.getView().byId("inputmarkuptype").setValue("");
				this.oModel.getData().EditRecord.DocumentLines.length = 0;
				this.oModel.refresh();
			} else {
				this.getView().byId("inputbpcode").setEnabled(true);
				this.getView().byId("inputwhsreceive").setEnabled(true);
				this.getView().byId("inputbpcode").setEnabled(false);
			}
		},
		// ADD ROWS ON TABLE
		onAddRow: function (oEvent) {
			var oitemdetails = {};
			oitemdetails.ItemNum = "";
			oitemdetails.Description = "";
			oitemdetails.Quantity = "";
			oitemdetails.Uom = "";
			oitemdetails.CostProd = "";
			oitemdetails.MarkupPrice = "";
			oitemdetails.TransferPrice = "";
			oitemdetails.MarketPrice = "";
			var transtype = this.getView().byId("TransID").getSelectedKey();
			var oIssueBU = this.oModel.getData().EditRecord.IssueBU;
			if (transtype === "" ) {
				sap.m.MessageToast.show("Please Select Transaction Type.");
			} else {
				if (transtype === "1") {
					oitemdetails.DescriptionEnable = false;
					oitemdetails.CostProdEnable = false;
					oitemdetails.MarkupPriceEnable = false;
					oitemdetails.TransferPriceEnable = false;
					oitemdetails.MarketPriceEnable = false;
					oitemdetails.UomEnable = false;
					this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
					this.oModel.refresh();	
				} else if (transtype === "2") {
					oitemdetails.DescriptionEnable = false;
					oitemdetails.CostProdEnable = false;
					oitemdetails.MarkupPriceEnable = true;
					oitemdetails.TransferPriceEnable = false;
					oitemdetails.MarketPriceEnable = false;
					oitemdetails.UomEnable = false;
					this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
					this.oModel.refresh();
				} else if (transtype === "3") {
					oitemdetails.DescriptionEnable = false;
					oitemdetails.CostProdEnable = true;
					oitemdetails.MarkupPriceEnable = true;
					oitemdetails.TransferPriceEnable = false;
					oitemdetails.MarketPriceEnable = false;
					oitemdetails.UomEnable = false;
					this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
					this.oModel.refresh();
				} else if (transtype === "4") {
					oitemdetails.DescriptionEnable = false;
					oitemdetails.CostProdEnable = false;
					oitemdetails.MarkupPriceEnable = false;
					oitemdetails.TransferPriceEnable = false;
					oitemdetails.MarketPriceEnable = false;
					oitemdetails.UomEnable = false;
					this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
					this.oModel.refresh();
				}
			}
		},
		////REMOVE ROW ON TABLE
		onRemoveRow: function (oEvent) {
			var oTable = this.oTableDetails;
			var selectedIndeices = oTable.getSelectedIndices();
			//ROW COUNT VARIABLE
			var row;
			var count = 0;
			for (var i = 0; i < selectedIndeices.length; i++) {
				row = selectedIndeices[i];
				 this.oModel.getData().EditRecord.DocumentLines.splice(row -count,1);
				 count = count + 1;
			}
			//Clearing Table Selection
			oTable.clearSelection();
			this.oModel.refresh();
		},
		onAddDraft: function (oEvent){
			var oIssueBu = this.getView().byId("inputwhsissue").getValue();
			var oRequestBu = this.getView().byId("inputwhsreceive").getValue();
			var oPostingDate = this.getView().byId("dpickerpostingdate").getValue();
			var oRemarks = this.getView().byId("inputremarks").getValue();
			var oDetails = this.oModel.getData().EditRecord.DocumentLines.length;
			var oRequesttoBusinessUnit=this.oModel.getData().EditRecord.BusinessUnit;
			// if(oIssueBu===""){
			// 	sap.m.MessageToast.show("Please Select Issueing BU");
			// }else if(oRequestBu===""){
			// 	sap.m.MessageToast.show("Please Select Requesting BU");
			// }else if(oPostingDate===""){
			// 	sap.m.MessageToast.show("Please Select Posting Date");
			if(oRequesttoBusinessUnit==="" || oRequesttoBusinessUnit===null ||oRequesttoBusinessUnit===undefined){
				sap.m.MessageToast.show("Please Choose Request Business Unit!");
				return;
			}
			if(oRemarks===""){
				sap.m.MessageToast.show("Please Enter Remarks");
			}else if(oDetails===0){
				sap.m.MessageToast.show("Please Enter Item Details");
			}else{
				this.fAddRequestDraft();
			}
		},
		onAddRequest: function (oEvent){
			//AppUI5.showBusyIndicator(10000);
			var oIssueBu = this.getView().byId("inputwhsissue").getValue();
			var oRequestBu = this.getView().byId("inputwhsreceive").getValue();
			var oBusinessUnit = this.oModel.getData().EditRecord.BusinessUnit;
			var oPostingDate = this.getView().byId("dpickerpostingdate").getValue();
			var oRemarks = this.getView().byId("inputremarks").getValue();
			var oDetails = this.oModel.getData().EditRecord.DocumentLines.length;
			var oFile = this.getView().byId("fileUploader").getValue();

			var oInventoryTransactionType = this.oModel.getData().EditRecord.InventoryTransactionType;

			if(oBusinessUnit==="" || oBusinessUnit=== undefined || oBusinessUnit === null){
				sap.m.MessageToast.show("Please Choose Request Business Unit!");
				return;
			}

			if(oPostingDate===""){
				sap.m.MessageToast.show("Please Select Posting Date");
			}else if(oRemarks===""){
				sap.m.MessageToast.show("Please Enter Remarks");
			}else if(oDetails===0){
				sap.m.MessageToast.show("Please Enter Item Details");
			}else if(oFile === ""){
				sap.m.MessageToast.show("Please attach a document");
			}else{
				this.fAddRequest();
			}
			//AppUI5.hideBusyIndicator();

		},
		////ADD REQUEST Function POSTING ON UDT
		fAddRequestDraft: function (oEvent) {
			var ostatus ="3";
			var oDocType = "Request Draft";
			AppUI5.showBusyIndicator(4000);
			//GET TRANSACTION NUMBER
			var sGeneratedTransNo = "";
			var TransType = this.oModel.getData().EditRecord.TransType;
			$.ajax({
				url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getTransactionNumber&value1&value2&value3&value4",
				type: "GET",
				async: false,
				datatype:"json",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:Qwerty0987"));
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);
					AppUI5.hideBusyIndicator();
				},
				success: function (json) {

				},
				context: this
			}).done(function (results) {
				if (results) {
					sGeneratedTransNo = results[0][""];
				}
			});
			///GET GENERATED CODE FROM SP
			var CodeH = AppUI5.generateUDTCode("GetCode");
			var oBusiness_Unit = {};
			var oBusiness_Unit_Details = {};
			///INITIALIZE VARIABLES FOR DRAFT POSTING
			oBusiness_Unit.Code = CodeH; //"200407095347.79702";
			oBusiness_Unit.Name = CodeH; //"200407095347.79702";
			oBusiness_Unit.U_APP_TransType = TransType;
			oBusiness_Unit.U_APP_TransNo = sGeneratedTransNo;
			oBusiness_Unit.U_APP_TransDate = this.getTodaysDate();
			oBusiness_Unit.U_APP_CardCode = this.oModel.getData().EditRecord.BPCode;
			oBusiness_Unit.U_APP_PostingDate = this.getTodaysDate();
			oBusiness_Unit.U_APP_MarkupType = this.oModel.getData().EditRecord.MarkupType;
			oBusiness_Unit.U_APP_IssueBU = this.oIssueBu;
			oBusiness_Unit.U_APP_ReceivingBU = this.oReceiveBu;
			oBusiness_Unit.U_APP_Remarks = this.oModel.getData().EditRecord.Remarks;
			oBusiness_Unit.U_APP_Status = ostatus;
			oBusiness_Unit.U_APP_DocType = oDocType;
			oBusiness_Unit.U_APP_Attachment = this.getView().byId("fileUploader").getValue();
			oBusiness_Unit.U_APP_AttachmentKey = this.FileKey;
			oBusiness_Unit.U_APP_RequestToBusinessUnit = this.oModel.getData().EditRecord.BusinessUnit;
			///HEADER BATCH Array
			 //QPV 03/23/2021 aded LotNum,ExpDate & ManuDate & Batch Num
			 oBusiness_Unit.U_APP_ExpiryDate = this.oModel.getData().EditRecord.ExpDate;
			 oBusiness_Unit.U_APP_MfngDate = this.oModel.getData().EditRecord.ManufacturingDate;
			 oBusiness_Unit.U_APP_LotNo = this.oModel.getData().EditRecord.LotNumber;
			 oBusiness_Unit.U_App_BatchNum = this.oModel.getData().EditRecord.BatchNumber;
			 //QPV 09/07/2021
			oBusiness_Unit.U_APP_InventoryTransactionType = this.oModel.getData().EditRecord.InventoryTransactionType;
			var batchArray = [
				//directly insert data if data is single row per table
				{
					"tableName": "U_APP_OINT",
					"data": oBusiness_Unit
				}
			];
			var d;
			var code = "";
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
				code = AppUI5.generateUDTCode("GetCode");
				oBusiness_Unit_Details.Code = code;
				oBusiness_Unit_Details.Name = code;
				oBusiness_Unit_Details.U_APP_ItemNum = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
				oBusiness_Unit_Details.U_APP_Description = this.oModel.getData().EditRecord.DocumentLines[d].Description;
				oBusiness_Unit_Details.U_APP_Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
				oBusiness_Unit_Details.U_APP_CostProd = this.oModel.getData().EditRecord.DocumentLines[d].CostProd;
				oBusiness_Unit_Details.U_APP_MarkUp = this.oModel.getData().EditRecord.DocumentLines[d].MarkupPrice;
				oBusiness_Unit_Details.U_APP_TransferPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
				oBusiness_Unit_Details.U_APP_MarketPrice = this.oModel.getData().EditRecord.DocumentLines[d].MarketPrice;
				oBusiness_Unit_Details.U_APP_TransNo = sGeneratedTransNo;
				oBusiness_Unit_Details.U_APP_TransType = TransType;
				oBusiness_Unit_Details.U_APP_Uom = this.oModel.getData().EditRecord.DocumentLines[d].UomCode;
				oBusiness_Unit_Details.U_APP_UomEntry = this.oModel.getData().EditRecord.DocumentLines[d].UomEntry;
				//oBusiness_Unit_Details.APP_TransNo = this.getView().byId("TransNo").getValue();
				batchArray.push(JSON.parse(JSON.stringify(({
					"tableName": "U_APP_INT1",
					"data": oBusiness_Unit_Details //this.generateUDTCode();
				}))));
			}
			//BATCH FORMATING
			var sBodyRequest = AppUI5.prepareBatchRequestBody(batchArray);
		////BATCH POSTING FOR DRAFT
			$.ajax({
				url: "https://test-sapsldv10.biotechfarms.net/b1s/v1/$batch",
				type: "POST",
				contentType: "multipart/mixed;boundary=a",
				data: sBodyRequest,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);
					sap.m.MessageToast.show(xhr.responseText);
				},
				success: function (json) {

				},
				context: this
			}).done(function (results) {
				if(JSON.stringify(results).search("400 Bad") !== -1) {
					var oStartIndex = results.search("value") + 10;
					var oEndIndex = results.indexOf("}") - 8;
					var oMessage = results.substring(oStartIndex,oEndIndex);
					AppUI5.fErrorLogs("U_APP_OINT/U_APP_INT1","Add Draft","1","1",oMessage,"Insert",this.sUserCode,"1");
					sap.m.MessageToast.show(oMessage);
				}else{
					if (results) {
						sap.m.MessageToast.show("Document "+ sGeneratedTransNo +" Request Draft Has Been Created");
						//this.fprepareTable(false,"");
						this.fClearField();
						this.oModel.refresh();
						AppUI5.hideBusyIndicator();
					}
				}
			});
		},
		////ADD REQUEST Function POSTING ON UDT
		fAddRequest: function (oEvent) {
			var ostatus ="4";
			var oDocType = "Request";
			AppUI5.showBusyIndicator(10000);
			//GET TRANSACTION NUMBER
			var sGeneratedTransNo = "";
			var TransType = this.oModel.getData().EditRecord.TransType;
			$.ajax({
				url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getTransactionNumber&value1&value2&value3&value4",
				type: "GET",
				async: false,
				datatype:"json",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:Qwerty0987"));
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);
					AppUI5.hideBusyIndicator();
				},
				success: function (json) {

				},
				context: this
			}).done(function (results) {
				if (results) {
					sGeneratedTransNo = results[0][""];
				}
			});
			///GET GENERATED CODE FROM SP
			var CodeH = AppUI5.generateUDTCode("GetCode");
			var oBusiness_Unit = {};
			var oBusiness_Unit_Details = {};
			///INITIALIZE VARIABLES FOR DRAFT POSTING
			oBusiness_Unit.Code = CodeH; //"200407095347.79702";
			oBusiness_Unit.Name = CodeH; //"200407095347.79702";
			oBusiness_Unit.U_APP_TransType = TransType;
			oBusiness_Unit.U_APP_TransNo = sGeneratedTransNo;
			oBusiness_Unit.U_APP_TransDate = this.getTodaysDate();
			oBusiness_Unit.U_APP_CardCode = this.oModel.getData().EditRecord.BPCode;
			oBusiness_Unit.U_APP_PostingDate = this.getView().byId("dpickerpostingdate").getValue();
			oBusiness_Unit.U_APP_MarkupType = this.oModel.getData().EditRecord.MarkupType;
			oBusiness_Unit.U_APP_IssueBU = this.oIssueBu;
			oBusiness_Unit.U_APP_ReceivingBU = this.oReceiveBu;
			oBusiness_Unit.U_APP_Remarks = this.oModel.getData().EditRecord.Remarks;
			oBusiness_Unit.U_APP_Status = ostatus;
			oBusiness_Unit.U_APP_DocType = oDocType;
			oBusiness_Unit.U_APP_Attachment = this.getView().byId("fileUploader").getValue();
			oBusiness_Unit.U_APP_AttachmentKey = this.FileKey;
			oBusiness_Unit.U_APP_RequestToBusinessUnit = this.oModel.getData().EditRecord.BusinessUnit;
			 //QPV 03/23/2021 aded LotNum,ExpDate & ManuDate & Batch Num
			oBusiness_Unit.U_APP_ExpiryDate = this.oModel.getData().EditRecord.ExpDate;
			oBusiness_Unit.U_APP_MfngDate = this.oModel.getData().EditRecord.ManufacturingDate;
			oBusiness_Unit.U_APP_LotNo = this.oModel.getData().EditRecord.LotNumber;
			oBusiness_Unit.U_App_BatchNum = this.oModel.getData().EditRecord.BatchNumber;

			//QPV 09/07/2021
			oBusiness_Unit.U_APP_InventoryTransactionType = this.oModel.getData().EditRecord.InventoryTransactionType;
			//oBusiness_Unit.U_APP_IsPostedGI = ""
			///HEADER BATCH Array
			var batchArray = [
				//directly insert data if data is single row per table
				{
					"tableName": "U_APP_OINT",
					"data": oBusiness_Unit
				}
			];

			var d;
			var code = "";
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
				code = AppUI5.generateUDTCode("GetCode");
				oBusiness_Unit_Details.Code = code;
				oBusiness_Unit_Details.Name = code;
				oBusiness_Unit_Details.U_APP_ItemNum = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
				oBusiness_Unit_Details.U_APP_Description = this.oModel.getData().EditRecord.DocumentLines[d].Description;
				oBusiness_Unit_Details.U_APP_Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
				oBusiness_Unit_Details.U_APP_CostProd = this.oModel.getData().EditRecord.DocumentLines[d].CostProd;
				oBusiness_Unit_Details.U_APP_MarkUp = this.oModel.getData().EditRecord.DocumentLines[d].MarkupPrice;
				oBusiness_Unit_Details.U_APP_TransferPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
				oBusiness_Unit_Details.U_APP_MarketPrice = this.oModel.getData().EditRecord.DocumentLines[d].MarketPrice;
				oBusiness_Unit_Details.U_APP_TransNo = sGeneratedTransNo;
				oBusiness_Unit_Details.U_APP_TransType = TransType;
				oBusiness_Unit_Details.U_APP_Uom = this.oModel.getData().EditRecord.DocumentLines[d].UomCode;
				oBusiness_Unit_Details.U_APP_UomEntry = this.oModel.getData().EditRecord.DocumentLines[d].UomEntry;
				
				if(this.oModel.getData().EditRecord.DocumentLines[d].Quantity <= 0){
					AppUI5.hideBusyIndicator();
					sap.m.MessageToast.show("Quantity must be greater than zero!");
					return;
				}


				batchArray.push(JSON.parse(JSON.stringify(({
					"tableName": "U_APP_INT1",
					"data": oBusiness_Unit_Details //this.generateUDTCode();
				}))));
			}
			//BATCH FORMATING
			var sBodyRequest = AppUI5.prepareBatchRequestBody(batchArray);
		////BATCH POSTING FOR DRAFT
			$.ajax({
				url: "https://test-sapsldv10.biotechfarms.net/b1s/v1/$batch",
				type: "POST",
				contentType: "multipart/mixed;boundary=a",
				data: sBodyRequest,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);
					sap.m.MessageToast.show(xhr.responseText);
					AppUI5.hideBusyIndicator();
				},
				success: function (json) {

				},
				context: this
			}).done(function (results) {
				if(JSON.stringify(results).search("400 Bad") !== -1) {
					var oStartIndex = results.search("value") + 10;
					var oEndIndex = results.indexOf("}") - 8;
					var oMessage = results.substring(oStartIndex,oEndIndex);
					AppUI5.fErrorLogs("U_APP_OINT/U_APP_INT1","Add Draft","1","1",oMessage,"Insert",this.sUserCode,"1");
					sap.m.MessageToast.show(oMessage);
					AppUI5.hideBusyIndicator();
				}else{
					if (results) {
						sap.m.MessageToast.show("Request Has Been Sent");
						this.fClearField();
						this.oModel.refresh();
						AppUI5.hideBusyIndicator();
					}
				}
			});
		},
		//GET MARKUP FORMULA
		fgetmarkup: function (oEvent) {
			var oMarkupType = this.getView().byId("inputmarkuptype").getSelectedKey();
			var oMarkPrice = oEvent.mParameters.value;
			var oCostToProduce = this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].CostProd;
			if(oMarkupType==="1"){
				var oTransferPrice = ((Number([oMarkPrice] * 0.01) * Number([oCostToProduce])) + Number([oCostToProduce]));
			}else if(oMarkupType==="2"){
				var oTransferPrice = Number([oMarkPrice]) + Number([oCostToProduce]);
			}
			this.getView().byId("transferprice").setValue(oTransferPrice);
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice=oTransferPrice;
			this.oModel.refresh();
		},
		handleValueChange: function (oEvt){
			var aFiles = oEvt.getParameters().files;
			this.currentFile = aFiles[0];
			var FileName = this.getView().byId("fileUploader").getValue();
			var form = new FormData();
			form.append("",this.currentFile,FileName);
			//Postinf Attachment in SAP
			$.ajax({
				url: "https://test-sapsldv10.biotechfarms.net/b1s/v1/Attachments2",
				data: form,
				type: "POST",
				processData:false,
				mimeType: "multipart/form-data",
				contentType: false,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var ErrorMassage = xhr.responseJSON["error"].message.value;
					sap.m.MessageToast.show(ErrorMassage);
					this.fHideBusyIndicator();
					console.error(ErrorMassage);
				},
				context: this,
				success: function (json) {}
			}).done(function (results) {
				if (results) {
					var oResult =JSON.parse(results);
					this.FileKey = oResult.AbsoluteEntry;
				}
			});
		},
		
		gGetBusinessUnit: function(){
			$.ajax({
				url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getBusinessUnit&value1="+this.sUserCode+"&value2&value3&value4",
				type: "GET",
				datatype:"json",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:Qwerty0987"));
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
					this.oModel.getData().BusinessUnit = results;
					this.oModel.refresh();
				}
			});
		},
		//QPV 09-07-2021
		gGetInventoryTransactionType: function(){
			$.ajax({
				url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getInventoryTransactionType&value1&value2&value3&value4",
				type: "GET",
				datatype:"json",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:Qwerty0987"));
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
         		    this.oModel.getData().InventoryTransactionType=results;
					this.oModel.refresh();
				}
			});
		},

		 ////////UOMS/////////
		handleValueUom: function (oEvent) {
		this.iSelectedRow=oEvent.getSource().getParent().getIndex();
		console.log(this.iSelectedRow);
		if(this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].ItemNum === undefined){
			MessageToast.show("Select Item to proceed.");
			return;
		}
		if (!this._oValueHelpDialogUom) {
			Fragment.load({
			name: "com.apptech.bfi-businessunit.view.fragments.UomsDialogFragment",
			controller: this
			}).then(function (oValueHelpDialog) {
			this._oValueHelpDialogUom = oValueHelpDialog;
			this.getView().addDependent(this._oValueHelpDialogUom);
			
			this._configValueHelpDialogUom();
			this._oValueHelpDialogUom.open();
			}.bind(this));
		} else {

			this._configValueHelpDialogUom();
			this._oValueHelpDialogUom.open();
		}
		},
		_configValueHelpDialogUom: function () {
			var v1 = this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].ItemNum;
			//GET ALL UOM
			$.ajax({
				url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getalluom&value1="+ v1 +"&value2&value3&value4",
				type: "GET",
				datatype:"json",
			beforeSend: function(xhr){
				xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:Qwerty0987"));
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
					// this.oModel.getData().allUom.length = 0;
					this.oModel.getData().allUom = JSON.parse(JSON.stringify(results));
					this.oModel.refresh();
				}
			});
			var aList = this.oMdlAllUom.getProperty("/alluom");
			aList.forEach(function (oRecord) {
			});
		},
		handleValueCloseUom: function (oEvent) {
		var aContexts = oEvent.getParameter("selectedContexts");
		var Details = {};
		if (aContexts && aContexts.length) {
			Details = aContexts.map(function (oContext) {
			var oDetails = {};
			oDetails.UomCode = oContext.getObject().UomCode;
			oDetails.UomEntry = oContext.getObject().UomEntry;
			return oDetails;
			});
		}
		oEvent.getSource().getBinding("items").filter([]);
		// console.log(Details[0].UomCode);
		this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].UomCode = Details[0].UomCode;
		this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].UomEntry = Details[0].UomEntry;
		this.oModel.refresh();
		},
		handleSearchUoms: function(oEvent) {
		var sValue = oEvent.getParameter("value");
		var oFilter = new Filter([
			new Filter("UomCode", FilterOperator.Contains, sValue),
			new Filter("UomName", FilterOperator.Contains, sValue)
		], false);
		
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(oFilter);
		}
  	});
});
