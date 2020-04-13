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

    onInit: function () {
       //USER DATA
			this.sDataBase = jQuery.sap.storage.Storage.get("dataBase");
			this.sUserCode = jQuery.sap.storage.Storage.get("userCode");
			//TO STORED SELECTED ROW
			this.iSelectedRow = 0;

			//BLANK JSONMODEL FOR ALL BP FOR TEMPLATE
			this.oMdlAllBP = new JSONModel();
			this.oMdlAllBP.getData().allbp = [];

			//BLANK JSONMODEL FOR ALL BP FOR TEMPLATE
			this.oMdlAllWhs = new JSONModel();
			this.oMdlAllWhs.getData().allwhs = [];

			// Get DateToday
			this.getView().byId("transactiondate").setDateValue(new Date());

			//BLANK JSONMODEL FOR ALL ITEMS FOR TEMPLATE
			this.oMdlAllItems = new JSONModel();
			this.oMdlAllItems.getData().allitems = [];

			//BIND TO MAIN MODEL
			this.oModel = new JSONModel("model/request.json");
			this.getView().setModel(this.oModel);
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
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getallwarehouses&value1&value2&value3&value4",
				type: "GET",
				datatype:"json",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
			  	},
				error: function (xhr, status, error) {
					sap.m.MessageToast.show(error);
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
 	   //	this.fprepareTable(true,"");

     /// REQUESTOR DATA
     var oRequestor =this.sUserCode;
     this.getView().byId("inputrequestor").setValue(oRequestor);
	},
		//GETTING DATE NOW
		getTodaysDate: function () {
			var today = new Date();
			var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
			return date;
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
			var sInputValuereceive = this.byId("inputwhsrequest").getValue();
			var aList = this.oModel.getProperty("/AllWarehouses");
			aList.forEach(function (oRecord) {
				oRecord.selected = (oRecord.WhsCode === sInputValuereceive);
			});
    },
    	///GETTING ALL ITEMS CONFIGURATION FROM UDT
		f_configValueHelpDialogsItems: function () {
			// var sInputValue = this.byId("inputitemnum").getValue();
			if (this.oModel.getData().AllItems.length <= 1) {
				//GET ALL ITEMS
				$.ajax({
					url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getallitems&value1&value2&value3&value4",
					type: "GET",
					datatype:"json",
				beforeSend: function(xhr){
					xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				},
					error: function (xhr, status, error) {
						sap.m.MessageToast.show(error);
					},
					success: function (json) {},
					context: this
				}).done(function (results) {
					if (results) {
						this.oModel.getData().AllItems.length = 0;
						this.oModel.getData().AllItems = JSON.parse(JSON.stringify(results));
						this.oModel.refresh();

						// this.oMdlAllItems.getData().allitems = results;
						// this.getView().setModel(this.oMdlAllItems, "oMdlAllItems");
					}
				});
			}

			var aList = this.oMdlAllItems.getProperty("/allitems");
			aList.forEach(function (oRecord) {
				//	oRecord.selected = (oRecord.ItemCode === sInputValue);
			});
		},
    ///Search on Issuing Whs
		handleSearchWhs: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("WhsCode", FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
    },
    ///Search on Requesting Whs
		handleSearchWhsreceive: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("WhsCode", FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
    },
    ///Search on Item
		handleSearchItem: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("ItemName", FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
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
			this.getView().byId("inputwhsissue").setValue(CardDetails[0].WhsCode);
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
			this.getView().byId("inputwhsrequest").setValue(CardDetails[0].WhsCode);
			this.oModel.refresh();
    },
    //Closing selection on Item
		handleValueHelpCloseItem: function (oEvent) {
			// var transtype = this.oModel.getData().EditRecord.TransType;
			var aContexts = oEvent.getParameter("selectedContexts");
			var ItemDetails = {};
			if (aContexts && aContexts.length) {

				ItemDetails = aContexts.map(function (oContext) {
					var oItem = {};
					oItem.ItemCode = oContext.getObject().ItemCode;
					oItem.ItemName = oContext.getObject().ItemName;
					return oItem;
				});
			}
			oEvent.getSource().getBinding("items").filter([]);
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].ItemNum = ItemDetails[0].ItemCode;
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].Description = ItemDetails[0].ItemName;
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].CostProd = this.f_getAveragePrice(ItemDetails[0].ItemCode);
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].MarketPrice = this.f_getMarketPrice(ItemDetails[0].ItemCode);
			var oCostToProduce =this.f_getAveragePrice(ItemDetails[0].ItemCode);
			var oMarketPrice = this.f_getMarketPrice(ItemDetails[0].ItemCode);

			// if (transtype === "1") {
			// 	if(oCostToProduce <= oMarketPrice){
			// 		this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
			// 	}else{
			// 		this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice=oMarketPrice;
			// 	}
			// }
			this.oModel.refresh();
	},
		///GET Market Type
		f_getMarketPrice: function (ItemCode) {
			//GET MARKET PRICE
			var iReturnMarketPrice = 0;
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getMarketPrice&value1=" + ItemCode +
					"&value2=7&value3&value4",
				type: "GET",
				async: false,
				datatype:"json",
				beforeSend: function(xhr){
					xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				},
				error: function (xhr, status, error) {
					sap.m.MessageToast.show(error);
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

		f_getAveragePrice: function (ItemCode) {
			//GET MARKET PRICE
			var issuebu = this.oModel.getData().EditRecord.IssueBU;
			var iReturnAveragePrice = 0;
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getAveragePrice&value1=" + ItemCode +
					"&value2=" + issuebu + "&value3&value4",
				type: "GET",
				async: false,
				datatype:"json",
				beforeSend: function(xhr){
					xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				},
				error: function (xhr, status, error) {
					sap.m.MessageToast.show(error);
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
    // ADD ROWS ON TABLE
		onAddRow: function (oEvent) {
			var oitemdetails = {};
			oitemdetails.ItemNum = "";
			oitemdetails.Description = "";
			oitemdetails.Quantity = "";
			oitemdetails.CostProd = "";
			oitemdetails.MarkupPrice = "";
			oitemdetails.TransferPrice = "";
			oitemdetails.MarketPrice = "";
			var transtype = this.getView().byId("TransID").getSelectedKey();
			var issueBU = this.oModel.getData().EditRecord.IssueBU;
			if (transtype === "") {
				sap.m.MessageToast.show("Please Select Transaction Type.");
			} else {
					if (transtype === "1") {
						oitemdetails.DescriptionEnable = false;
						oitemdetails.CostProdEnable = false;
						oitemdetails.MarkupPriceEnable = false;
						oitemdetails.TransferPriceEnable = false;
						oitemdetails.MarketPriceEnable = false;
						this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
						this.oModel.refresh();
					} else if (transtype === "2") {
						oitemdetails.DescriptionEnable = false;
						oitemdetails.CostProdEnable = false;
						oitemdetails.MarkupPriceEnable = true;
						oitemdetails.TransferPriceEnable = false;
						oitemdetails.MarketPriceEnable = false;
						this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
						this.oModel.refresh();
					} else if (transtype === "3") {
						oitemdetails.DescriptionEnable = false;
						oitemdetails.CostProdEnable = false;
						oitemdetails.MarkupPriceEnable = true;
						oitemdetails.TransferPriceEnable = false;
						oitemdetails.MarketPriceEnable = false;
						this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
						this.oModel.refresh();
					} else if (transtype === "4") {
						oitemdetails.DescriptionEnable = false;
						oitemdetails.CostProdEnable = false;
						oitemdetails.MarkupPriceEnable = true;
						oitemdetails.TransferPriceEnable = false;
						oitemdetails.MarketPriceEnable = false;
						this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
						this.oModel.refresh();
					} else if (transtype === "5") {
						oitemdetails.DescriptionEnable = false;
						oitemdetails.CostProdEnable = false;
						oitemdetails.MarkupPriceEnable = true;
						oitemdetails.TransferPriceEnable = false;
						oitemdetails.MarketPriceEnable = false;
						this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
						this.oModel.refresh();
					} else if (transtype === "6") {
						oitemdetails.DescriptionEnable = false;
						oitemdetails.CostProdEnable = false;
						oitemdetails.MarkupPriceEnable = true;
						oitemdetails.TransferPriceEnable = false;
						oitemdetails.MarketPriceEnable = false;
						this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
						this.oModel.refresh();
					}
			} 
    },
    ////REMOVE ROW ON TABLE
		onRemoveRow: function (oEvent) {
			var oTable = this.oTableDetails;
			// var myTableRows= oTable.getRows();
			var selectedIndeices = oTable.getSelectedIndices();
			//ROW COUNT VARIABLE
			var row;
			var count = 1;
			for (var i = 0; i < selectedIndeices.length; i++) {
				row = selectedIndeices[i];
				this.oModel.getData().EditRecord.DocumentLines.splice(selectedIndeices, 1);
				count = count + 1;
			}
			//Clearing Table Selection
			oTable.clearSelection();
			this.oModel.refresh();

			//	this.oModel.getData().EditRecord.DocumentLines.splice(this.oTableDetails.selectedIndeices(), 1);
			// this.oModel.refresh();
		},
		onAddRequest: function (oEvent){
			var oIssueBu = this.getView().byId("inputwhsissue").getValue();
			var oRequestBu = this.getView().byId("inputwhsrequest").getValue();
			var oRemarks = this.getView().byId("inputremarks").getValue();
			if(oIssueBu==="" || oRequestBu==="" || oRemarks===""){
				sap.m.MessageToast.show("Fill Up All Fields");
			}else{
				this.fAddRequest();
			}
			
		},
		////DRAFT Function POSTING ON UDT
		fAddRequest: function (oEvent) {
			var ostatus ="3";
			var oDocType = "Request";
			AppUI5.showBusyIndicator(4000);
			//GET TRANSACTION NUMBER
			var sGeneratedTransNo = "";
			var TransType = this.oModel.getData().EditRecord.TransType;
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getTransactionNumber&value1&value2&value3&value4",
				type: "GET",
				async: false,
				datatype:"json",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
			  	},
				error: function (xhr, status, error) {
					sap.m.MessageToast.show(error);
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
			oBusiness_Unit.U_APP_PostingDate = this.oModel.getData().EditRecord.PostingDate;
			oBusiness_Unit.U_APP_MarkupType = this.oModel.getData().EditRecord.MarkupType;
			oBusiness_Unit.U_APP_IssueBU = this.oModel.getData().EditRecord.IssueBU;
			oBusiness_Unit.U_APP_ReceivingBU = this.oModel.getData().EditRecord.ReceiveBU;
			oBusiness_Unit.U_APP_Remarks = this.oModel.getData().EditRecord.Remarks;
			oBusiness_Unit.U_APP_Status = ostatus;
			oBusiness_Unit.U_APP_DocType = oDocType;
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
				url: "https://18.136.35.41:50000/b1s/v1/$batch",
				type: "POST",
				contentType: "multipart/mixed;boundary=a",
				data: sBodyRequest,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					sap.m.MessageToast.show(error);
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
					AppUI5.fErrorLogs("U_APP_OINT","Add Draft","1","1",oMessage,"Insert",this.sUserCode,"1");
					sap.m.MessageToast.show(oMessage);
				}else{
					if (results) {
						sap.m.MessageToast.show("Transaction Type "+ TransType +" Draft Has Been Created!");
						this.fprepareTable(false,"");
						this.fClearField();
						this.oModel.refresh();
						AppUI5.hideBusyIndicator();
					}
				}
			});
		}
  });
});
