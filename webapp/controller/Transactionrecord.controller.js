sap.ui.define([
  	"sap/ui/core/BusyIndicator",
	"sap/ui/core/Element",
  	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"com/apptech/bfi-businessunit/controller/AppUI5",
	"sap/ui/model/FilterOperator"
], function(BusyIndicator,Element,Controller, JSONModel, Fragment, Filter, AppUI5, FilterOperator) {
  	"use strict";
	  var doc = new jsPDF();
  	return Controller.extend("com.apptech.bfi-businessunit.controller.Transactionrecord", {
		onRoutePatternMatched: function(event){
			this.fClearField();
			this.fprepareTable(false,0);
			this.oModel.refresh();
		},
		onInit: function () {
			///ON LOAD
			var route = this.getOwnerComponent().getRouter().getRoute("Transactionrecord");
			route.attachPatternMatched(this.onRoutePatternMatched,this);
			//USER DATA
			this.sDataBase = jQuery.sap.storage.Storage.get("dataBase");
			this.sUserCode = jQuery.sap.storage.Storage.get("userCode");

			//getButtons
			this.oMdlButtons = new JSONModel();
			this.oResults = AppUI5.fGetButtons(this.sDataBase,this.sUserCode,"Transactionrecord");
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
			this.oMdlAllBP.getData().allbp = [];

			//BLANK JSONMODEL FOR ALL BP FOR TEMPLATE
			this.oMdlAllWhs = new JSONModel();
			this.oMdlAllWhs.getData().allwhs = [];

			// Get DateToday
			this.getView().byId("transactiondate").setDateValue(new Date());
			this.getView().byId("dpickerpostingdate").setDateValue(new Date());

			//BLANK JSONMODEL FOR ALL ITEMS FOR TEMPLATE
			this.oMdlAllItems = new JSONModel();
			this.oMdlAllItems.getData().allitems = [];

			//BIND TO MAIN MODEL
			this.oModel = new JSONModel("model/transactionrecord.json");
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
				url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getallwarehouses&value1&value2&value3&value4",
				type: "GET",
				datatype:"json",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					console.error(JSON.stringify(Message));
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
			this.oIssueBu = "";
			this.oReceiveBu= "";
			this.fprepareTable(true,"");
			//CPA
			this.currentFile = {}; //File Object
				//For Attachment File Name
			this.Attachment = "";
			//For Attachment File Key
			this.FileKey = null;

			this.iTranNum=0;
		},
		/////PRINT
		fprintGoodsIssue: function(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,ostatus,oDocType,oDetails,oAttachment,oAttachmentKey){
			//doc.text(20, 20, 'Biotech Farms Inc.(BFI)');
			doc.setFontSize(12)
			doc.text(77, 32, 'Bo.6,Banga, South Cotabato');

			doc.setFontSize(22)
			doc.text(77,50, 'GOODS ISSUE');

			var img = new Image()
			if (this.sDataBase.toLocaleUpperCase().includes("BIOTECH") || this.sDataBase.toLocaleUpperCase().includes("BFI")){
				img.src = './css/BFI.jpg'
			}else{
				img.src = './css/REVIVE.jpg'
			}
			doc.addImage(img, 'jpg', 85, 8, 40, 20)//margin, position, imgWidth, imgHeight
			doc.setFontSize(12)
			doc.text(150, 60, 'Date:________________');
			doc.text(166, 59, oPostingDate);

			doc.setFontSize(12)
			doc.text(20, 70, 'Transaction #: '+ transno +'');
			doc.text(20, 80, 'REQUESTOR: '+ oIssueBU +'');
			doc.text(20, 90, 'PURPOSE: '+ oRemarks +'');

			var oModel  = oDetails;
				var columns = ["Item Code","Quantity","UOM","Description"];
				var data = [];
						for(var i=0;i<oModel.length;i++)
						{
								data[i]=[oModel[i].ItemNum,oModel[i].Quantity,oModel[i].Uom,oModel[i].Description];
						}
			doc.autoTable(columns,data,{startY:100});
			doc.text(20, 170, 'REQUESTED BY:'+ this.sUserCode +'');
			doc.text(20, 180, 'APPROVED BY:____________________');
			doc.text(20, 190, 'RECEIVED BY:____________________');
			doc.text(120, 170, 'PREPARED BY:____________________');
			doc.text(120, 180, 'CHECKED BY:______________________');
			doc.text(120, 190, 'COUNTERED CHECK BY:______________________');
			doc.output('Goods Issue_'+ transno +'.pdf');
			doc.save('Goods Issue_'+ transno +'.pdf');
			doc = new jsPDF();
		},
			//GETTING DATE NOW
		fgetTodaysDate: function () {
			var today = new Date();
			var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
			return date;
		},

		onTransTypeFilter : function(oEvent){
			this.fprepareTable("",0);
			this.oMdlAllRecord.refresh();
		},
		onSelectionChange: function (oEvent) {
			this.fprepareTable("",0);
			this.oMdlAllRecord.refresh();

		},
		//RENAMING COLUMNS FOR THE TABLE
		frenameColumns: function () {
			this.oTable.getColumns()[0].setLabel("Transaction No");
			this.oTable.getColumns()[0].setFilterProperty("U_APP_TransNo");
			this.oTable.getColumns()[1].setLabel("Transaction Type");
			this.oTable.getColumns()[1].setFilterProperty("U_APP_TransType");
			this.oTable.getColumns()[2].setLabel("Posting Date");
			this.oTable.getColumns()[2].setFilterProperty("U_APP_PostingDate");
			this.oTable.getColumns()[3].setLabel("Remarks");
			this.oTable.getColumns()[3].setFilterProperty("U_APP_Remarks");
			this.oTable.getColumns()[4].setLabel("Doc Type");
			this.oTable.getColumns()[4].setFilterProperty("U_APP_Doctype");
		},
		//Preparing table
		fprepareTable: function (bIsInit,transType,oTransTatus) {
			var oTransTatus = this.getView().byId("TranStatus").getSelectedKey();
			if (transType === ""){
				var transtypefilter = "";
			}else{
				var transtypefilter = this.getView().byId("transfilter").getSelectedKey();
			}
			///FOR ENHANCEMENT
			var aResults;
			if (transtypefilter === ""){
				var aResults = this.fgetAllTransaction(transtypefilter,oTransTatus);
				if(aResults.length ===0){
					aResults = [{
					  "U_APP_TransNo" : "",
					  "U_APP_TransType" : "",
					  "U_APP_PostingDate" : "",
					  "U_APP_Remarks" : "",
					  "U_APP_DocType" : ""
					}];
				  }
			}else{
				var aResults = this.fgetAllTransaction(transtypefilter,oTransTatus);
				if(aResults.length ===0){
					aResults = [{
					  "U_APP_TransNo" : "",
					  "U_APP_TransType" : "",
					  "U_APP_PostingDate" : "",
					  "U_APP_Remarks" : "",
					  "U_APP_DocType" : ""
					}];
				  }
			}

			if (aResults.length !== 0) {
				this.aCols = Object.keys(aResults[0]);
				var i;
				this.iRecordCount = aResults.length;
				this.oIconTab.setCount(this.iRecordCount);
				if (bIsInit) {
					for (i = 0; i < this.aCols.length; i++) {
						this.columnData.push({
							"columnName": this.aCols[i]
						});
					}
				}
				this.oMdlAllRecord.setData({
					rows: aResults,
					columns: this.columnData
				});
				if (bIsInit) {
					this.oTable = this.getView().byId(this.tableId);
					this.oTable.setModel(this.oMdlAllRecord);
					this.oTable.bindColumns("/columns", function (sId, oContext) {
						var columnName = oContext.getObject().columnName;
						return new sap.ui.table.Column({
							label: columnName,
							template: new sap.m.Text({
								text: "{" + columnName + "}"
							})
						});
					});
					this.oTable.bindRows("/rows");
					this.oTable.setSelectionMode("Single");
					this.oTable.setSelectionBehavior("Row");
					this.frenameColumns();
				}
			}else{
				// var table = this.getView().byId(this.tableId)
				// table.removeColumn();
				// table.setNoData(new sap.ui.commons.TextView({text: "Sorry, no data available!"}));
				var table = this.getView().byId(this.tableId);
				var oModel1 = new sap.ui.model.json.JSONModel();
				var data =[];
				this.oMdlAllRecord.setData(data);
				// var aData = oModel1.getProperty("/d/results");
				// oModel1.setData({ modelData : aData });
				table.setModel(this.oMdlAllRecord, "odata");
			}
		},

		///GETTING ALL THE THE TRANSACTION DATA/S
		fgetAllTransaction: function (transtypefilter,oTransTatus) {
			var value1 = transtypefilter;
			var value2 = oTransTatus;
			var aReturnResult = [];
			var urltag = "";
			if (value1 ===""){
				urltag ="https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&QUERYTAG=getFilteredTransactions&VALUE1=1&VALUE2=0&VALUE3=&VALUE4=";// getTransactions
			}else{
				urltag ="https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&QUERYTAG=getFilteredTransactions&VALUE1="+ value1 +"&VALUE2="+ value2 +"&VALUE3=&VALUE4=";
			}
			$.ajax({
				url: urltag,
				type: "GET",
				async: false,
				datatype:"json",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:P@ssw0rd805~"));
			  	},
				error: function (xhr, status, error) {
					aReturnResult = [];
					var Message = xhr.responseJSON["error"].message.value;
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(error);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results.length <= 0) {
					aReturnResult = [];
					// this.oMdlAllRecord.setJSON("{\"allRecords\" : " + JSON.stringify(results) + "}");
					// this.getView().setModel(this.oMdlAllRecord, "oMdlAllRecord");
				} else {
					aReturnResult = results;
				}
			});
			return aReturnResult;

    	},
   		//DISABLING TEXTBOX
		onChangeTrans: function (oEvent) {
			var transtype = this.getView().byId("TransID").getSelectedKey();
			if (transtype === "1") {
				this.getView().byId("inputbpcode").setValue("");
				this.getView().byId("inputbpcode").setEnabled(false);
				this.getView().byId("inputwhsreceive").setEnabled(true);
				this.getView().byId("inputmarkuptype").setEnabled(false);
			}else if (transtype === "2") {
				this.getView().byId("inputbpcode").setValue("");
				this.getView().byId("inputbpcode").setEnabled(true);
				this.getView().byId("inputwhsreceive").setEnabled(false);
				this.getView().byId("inputmarkuptype").setEnabled(true);
			}else if (transtype === "3") {
				this.getView().byId("inputbpcode").setValue("");
				this.getView().byId("inputbpcode").setEnabled(true);
				this.getView().byId("inputwhsissue").setEnabled(false);
				this.getView().byId("inputwhsreceive").setEnabled(true);
				this.getView().byId("inputmarkuptype").setEnabled(true);
			} else {
				this.getView().byId("inputbpcode").setEnabled(true);
				this.getView().byId("inputwhsreceive").setEnabled(true);
			}

		},

		///GETTING WAREHOUSE LIST FROM FRAGMENTS
		handleValueHelpWhsCode: function (oEvent) {
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

		//Warehouse List For Receiving BU from Fragment
		handleValueHelpWhsCodeReceive: function () {
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
		///BP LIST FROM FRAGMENT
		handleValueHelpBPCode: function () {
			var TransType = this.getView().byId("TransID").getSelectedKey();
			var customertype ="";
					if (TransType ==="6"){
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
			if (this.oMdlAllBP.getData().allbp.length <= 0) {

				//GET ALL BP
				$.ajax({
					url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getallbp&value1="+ customertype +"&value2&value3&value4",
					type: "GET",
					datatype:"json",
				beforeSend: function(xhr){
					xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				},
					error: function (xhr, status, error) {
						var Message = xhr.responseJSON["error"].message.value;
						console.error(JSON.stringify(Message));
						sap.m.MessageToast.show(error);
					},
					success: function (json) {},
					context: this
				}).done(function (results) {
					if (results) {
						this.oMdlAllBP.getData().allbp = results;
						this.getView().setModel(this.oMdlAllBP, "oMdlAllBP");
					}
				});
			}

			var aList = this.oMdlAllBP.getProperty("/allbp");

			aList.forEach(function (oRecord) {
				oRecord.selected = (oRecord.CardCode === sInputValue);
			});
		},
		///GETTING ALL ISSUING WAREHOUSE
		f_configValueHelpDialogsWhsIssue: function () {
			var sInputValue = this.byId("inputwhsissue").getValue();
			var aList = this.oModel.getProperty("/AllWarehouses");
			aList.forEach(function (oRecord) {
				oRecord.selected = (oRecord.WhsCode === sInputValue);
			});
		},
		///GETTING ALL RECEIVING WAREHOUSE
		f_configValueHelpDialogsWhsReceive: function () {
			var sInputValuereceive = this.byId("inputwhsreceive").getValue();

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
					url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getallitems&value1&value2&value3&value4",
					type: "GET",
					datatype:"json",
				beforeSend: function(xhr){
					xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				},
					error: function (xhr, status, error) {
						var Message = xhr.responseJSON["error"].message.value;
						console.error(JSON.stringify(Message));
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
		///Search on BP
		handleSearchBP: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilters = new Filter([
				new Filter("CardCode", FilterOperator.Contains, sValue),
				new Filter("CardName", FilterOperator.Contains, sValue)
				], false);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(oFilters);
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
		///Search on Receiving Whs
		handleSearchWhsreceive: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilters = new Filter([
				new Filter("WhsCode", FilterOperator.Contains, sValue),
				new Filter("WhsName", FilterOperator.Contains, sValue)
				], false);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(oFilters);
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
		//Closing selection on Receiving Whs
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
					return oItem;
				});
			}
			oEvent.getSource().getBinding("items").filter([]);
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].ItemNum = ItemDetails[0].ItemCode;
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].Description = ItemDetails[0].ItemName;
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].Uom = ItemDetails[0].InventoryUom;
			if(transtype === "3"){
				var oCostToProduce =this.f_getAveragePrice(ItemDetails[0].ItemCode,receivebu);
				this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].CostProd = this.f_getAveragePrice(ItemDetails[0].ItemCode,receivebu);
			}else{
				var oCostToProduce =this.f_getAveragePrice(ItemDetails[0].ItemCode,issuebu);
				this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].CostProd = this.f_getAveragePrice(ItemDetails[0].ItemCode,issuebu);
			}
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].MarketPrice = this.f_getMarketPrice(ItemDetails[0].ItemCode);
			var oMarketPrice = this.f_getMarketPrice(ItemDetails[0].ItemCode);

			if (transtype === "1") {
				if(oCostToProduce <= oMarketPrice){
					this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
				}else{
					this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice=oMarketPrice;
				}
			}else if (transtype === "2") {
				///for revise
				this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
			}else if (transtype === "3") {
				///for revise
				this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
			}
			this.oModel.refresh();
		},
		///GET Market Type
		f_getMarketPrice: function (ItemCode) {
			//GET MARKET PRICE
			var iReturnMarketPrice = 0;
			$.ajax({
				url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getMarketPrice&value1=" + ItemCode +
					"&value2=7&value3&value4",
				type: "GET",
				async: false,
				datatype:"json",
				beforeSend: function(xhr){
					xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					console.error(JSON.stringify(Message));
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
				url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getAveragePrice&value1=" + ItemCode +
					"&value2=" + issuebu + "&value3&value4",
				type: "GET",
				async: false,
				datatype:"json",
				beforeSend: function(xhr){
					xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					console.error(JSON.stringify(Message));
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
		///ON VIEW SHOWING ALL DATA AND CHANGING NAME INTO EDIT
		onProcess: function (oEvent) {
			var iIndex = this.oTable.getSelectedIndex();
			var TransNo = "";
			var TransType = "";
			if (iIndex !== -1) {
				var oRowSelected = this.oTable.getBinding().getModel().getData().rows[this.oTable.getBinding().aIndices[iIndex]];
				TransNo = oRowSelected.U_APP_TransNo;
				TransType = oRowSelected.U_APP_TransType;
			}
			/////INITIALIZED HEADER AND DETAILS DATA FOR ONVIEW
			var queryTag = "",
				value1 = "",
				value2 = "",
				value3 = "",
				value4 = "",
				dbName = this.sDataBase;
			value1 = TransNo;
			value2 = TransType;
			this.fgetHeader(dbName, "spAppBusinessUnit", "getDraftHeader", value1, value2, value3, value4);
			this.fgetDetails(dbName, "spAppBusinessUnit", "getDraftDetails", value1, value2, value3, value4);

			this.getView().byId("idIconTabBarInlineMode").getItems()[1].setText("Transaction No: " + TransNo + " [EDIT]");
			var tab = this.getView().byId("idIconTabBarInlineMode");
			tab.setSelectedKey("tab2");
			var oTransTatus = this.getView().byId("TranStatus").getSelectedKey();
			if(oTransTatus === "5"){
				this.getView().byId("btnCancelRecords").setVisible(false);
			}else{
				this.getView().byId("btnCancelRecords").setVisible(true);
			}

			if(TransType ==="2"){
				this.getView().byId("inputwhsreceive").setEnabled(false);
				this.getView().byId("inputwhsissue").setEnabled(true);
			  }else if(TransType ==="3"){
				this.getView().byId("inputwhsreceive").setEnabled(true);
				this.getView().byId("inputwhsissue").setEnabled(false);
			}
		},
		//Generic selecting of data
		fgetHeader: function (dbName, procName, queryTag, value1, value2, value3, value4) {
			//get all open AP base on parameters
			$.ajax({
				url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName=" + dbName + "&procName=spAppBusinessUnit&QUERYTAG=" + queryTag + "&VALUE1=" + value1 +
					"&VALUE2=" + value2 + "&VALUE3=" + value3 + "&VALUE4=",
				type: "GET",
				datatype:"json",
				beforeSend: function(xhr){
					xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(error);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results) {
					//var oResult = JSON.parse(JSON.stringify(results).replace("[", "").replace("]", ""));
					this.code = results[0].Code;
					this.oModel.getData().EditRecord.TransType = results[0].TransType;
					this.oModel.getData().EditRecord.TransNo = results[0].TransNo;
					this.oModel.getData().EditRecord.TransactionDate = results[0].TransactionDate;
					this.oModel.getData().EditRecord.BPCode = results[0].CardCode;
					this.oModel.getData().EditRecord.PostingDate = results[0].PostingDate;
					this.oModel.getData().EditRecord.TransType = results[0].TransType;
					this.oModel.getData().EditRecord.MarkupType = results[0].MarkupType;
					this.oModel.getData().EditRecord.IssueBU = results[0].IssueBU;
					this.oModel.getData().EditRecord.ReceiveBU = results[0].ReceiveBU;
					this.oIssueBu=results[0].IssueBUCode;
					this.oReceiveBu=results[0].ReceiveBUCode;
					this.oModel.getData().EditRecord.Remarks = results[0].Remarks;
					this.oModel.getData().EditRecord.ReceivedBy = this.sUserCode;
					this.Attachment = results[0].Attachment;
					this.FileKey = results[0].Attachmentkey;
					var oDocStatus=results[0].Status;

					this.iTranNum = results[0].TransNo;
					// Disable Add Button if Status is Posted/Cancelled
					if(oDocStatus==="2" || oDocStatus==="5"){
						this.getView().byId("btnAddRecords").setEnabled(false);
					}else{
						this.getView().byId("btnAddRecords").setEnabled(true);
					}

					var transtype = this.oModel.getData().EditRecord.TransType = results[0].TransType;
					if (transtype === "1") {
						this.getView().byId("inputwhsreceive").setEnabled(true);
						this.getView().byId("inputbpcode").setEnabled(false);

					}
					this.oModel.refresh();
				}
			});

		},
		///GETTING DETAILS BASED ON HEADER
		fgetDetails: function (dbName, procName, queryTag, value1, value2, value3, value4) {
			$.ajax({
				url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName=" + dbName + "&procName=spAppBusinessUnit&QUERYTAG=" + queryTag + "&VALUE1=" + value1 +
					"&VALUE2=" + value2 + "&VALUE3=" + value3 + "&VALUE4=",
				type: "GET",
				datatype:"json",
				beforeSend: function(xhr){
					xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:P@ssw0rd805~"));
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(error);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results) {
					// results.map(obj=> ({ ...obj, CostProdEnable: false }));

					var resultsWithDisableField = results.map((e) => {
						e.CostProdEnable = false;
						e.MarkupPriceEnable = false;
						e.TransferPriceEnable = false;
						e.MarketPriceEnable = false;
						e.DescriptionEnable = false;
					})
					this.oModel.getData().EditRecord.DocumentLines = results;
					this.oModel.refresh();

				}
			});
    	},
    	///On Clear Fields Function
		fClearField: function () {
			try {
				this.oModel.getData().EditRecord.TransType = "";
				this.oModel.getData().EditRecord.TransNo = "";
				this.oModel.getData().EditRecord.BPCode = "";
				this.oModel.getData().EditRecord.BPName = "";
				this.oModel.getData().EditRecord.PostingDate = "";
				this.oModel.getData().EditRecord.IssueBU = "";
				this.oModel.getData().EditRecord.ReceiveBU = "";
				this.oModel.getData().EditRecord.Remarks = "";
				this.oModel.getData().EditRecord.DocumentLines.length = 0;
				this.oIssueBu = "";
				this.oReceiveBu= "";
				this.oModel.refresh();
			} catch (err) {
				//console.log(err.message);
			}

		},// ADD ROWS ON TABLE
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

   		},
		////POSTING BU TO BU BUSINESS TYPE
		fBuToBu: function (transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey) {
			AppUI5.showBusyIndicator(10000);
			//this.iTranNum = AppUI5.fGenerateTransNum(this.sDataBase);
			//Initialize Variables
			var ostatus= "1";
			var oDocType ="Goods Issue";
			var oGoodsIssue = {};
			var oGoodsIssueHeader = {};
			oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
			oGoodsIssue.AttachmentEntry = oAttachmentKey;
			oGoodsIssue.U_APP_GI_TransType = "BU";
			oGoodsIssue.U_APP_BU_TransNum = transno;
			oGoodsIssue.DocumentLines = [];
			///LOOP FOR THE DETAILS
			var d;
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
				oGoodsIssueHeader.WarehouseCode = oIssueBU;
				oGoodsIssueHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
				oGoodsIssueHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
				var oTransferPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
				var oCostToProduce = this.oModel.getData().EditRecord.DocumentLines[d].CostProd;
				if(oTransferPrice==="0" || oTransferPrice===0 || oTransferPrice===""){
					oGoodsIssueHeader.UnitPrice = oCostToProduce;
				}else{
					oGoodsIssueHeader.UnitPrice = oTransferPrice;
				}
				oGoodsIssue.DocumentLines.push(JSON.parse(JSON.stringify(oGoodsIssueHeader)));
			}

			$.ajax({
				url: "https://sl.biotechfarms.net/b1s/v1/InventoryGenExits",
				type: "POST",
				data: JSON.stringify(oGoodsIssue),
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					AppUI5.fErrorLogs("OIGE","Insert","null","null",Message,"Bu to Bu",this.sUserCode,"null",JSON.stringify(oGoodsIssue));
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);
					AppUI5.hideBusyIndicator();
				},
				success: function (json) {
					// UDT RECORDS
					this.fUpdatePending(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,ostatus,oDocType,oDetails,oAttachment,oAttachmentKey);
					this.fprintGoodsIssue(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,ostatus,oDocType,oDetails,oAttachment,oAttachmentKey);
					sap.m.MessageToast.show("Added Successfully");
					this.fClearField();
					this.oModel.refresh();
					AppUI5.hideBusyIndicator();
				},
				context: this

			}).done(function (results) {
				if (results) {
					//
				}
			});
		},
		
		////POSTING BU TO CASH SALES
		fBuToCashSales: function (transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey) {
			//Initialize Variables
			AppUI5.showBusyIndicator(4000);
			var ostatus="2";
			var oDocType ="Goods Issue/Invoice/Incoming Payments";
			var oGoodsIssue = {};
			var oGoodsIssueHeader = {};
			var ocardcode = this.oModel.getData().EditRecord.BPCode;
			var oDescription = this.oModel.getData().EditRecord.Remarks;
			oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
			oGoodsIssue.AttachmentEntry = oAttachmentKey;
			oGoodsIssue.U_APP_GI_TransType = "BU";
			oGoodsIssue.DocumentLines = [];
			///LOOP FOR THE DETAILS
			var d;
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
			  oGoodsIssueHeader.WarehouseCode = this.oIssueBu;
			  oGoodsIssueHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
			  oGoodsIssueHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
			  oGoodsIssueHeader.UnitPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
			  oGoodsIssue.DocumentLines.push(JSON.parse(JSON.stringify(oGoodsIssueHeader)));
			}
			$.ajax({
			  url: "https://sl.biotechfarms.net/b1s/v1/InventoryGenExits",
			  type: "POST",
			  data: JSON.stringify(oGoodsIssue),
			  crossDomain: true,
			  async: false,
					  xhrFields: {
				withCredentials: true
			  },
			  error: function (xhr, status, error) {
				var Message = xhr.responseJSON["error"].message.value;
				AppUI5.fErrorLogs("OIGE","Insert","null","null",Message,"Bu to Cash Sale",this.sUserCode,"null",JSON.stringify(oGoodsIssue));
				console.error(JSON.stringify(Message));
				sap.m.MessageToast.show(Message);
			  },
			  success: function (json) {
				AppUI5.hideBusyIndicator();
			  },
			  context: this
			}).done(function (results) {
			  if (results) {
				//POSTING OF INVOICE
				var oInvoice = {};
				var oInvoiceHeader = {};
				oInvoice.CardCode = ocardcode;
				oInvoice.DocType ="dDocument_Service";
				oInvoice.AttachmentEntry = oAttachmentKey;
				oInvoice.DocumentLines = [];
				///HARD CODED ACCOUNT CODE FOR TESTING
				oInvoiceHeader.ItemDescription = oDescription;
				oInvoiceHeader.AccountCode ="4110101101-000-000-000-000-000";
				oInvoiceHeader.TaxCode = "GST-EO";
				oInvoiceHeader.LineTotal =results.DocTotal;
				oInvoice.DocumentLines.push(JSON.parse(JSON.stringify(oInvoiceHeader)));

				$.ajax({
				  url: "https://sl.biotechfarms.net/b1s/v1/Invoices",
				  type: "POST",
				  data: JSON.stringify(oInvoice),
				  crossDomain: true,
				  async: false,
				  xhrFields: {
					withCredentials: true
				  },
				  error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					AppUI5.fErrorLogs("OINV","Insert","null","null",Message,"Bu to Cash Sale",this.sUserCode,"null",JSON.stringify(oInvoice));
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);

				  },
				  success: function (json) {
					//this.oPage.setBusy(false);
					AppUI5.hideBusyIndicator();
				  },
				  context: this
				}).done(function (results) {
				  if (results) {
					////////
					  var oDocEntry = results.DocEntry;
					  var oDocTotal = results.DocTotal;

					  var oIncomingPayment = {};
					  var oIncomingPaymentHeader = {};
					  oIncomingPayment.CardCode = ocardcode;
					  oIncomingPayment.CashSum = oDocTotal;
					  oIncomingPayment.PaymentInvoices = [];

					  oIncomingPaymentHeader.LineNum = 0;
					  oIncomingPaymentHeader.DiscountPercent = 0;
					  oIncomingPaymentHeader.DocEntry = oDocEntry;
					  oIncomingPaymentHeader.SumApplied = oDocTotal;
					  oIncomingPaymentHeader.InvoiceType = "it_Invoice";
					  oIncomingPayment.PaymentInvoices.push(JSON.parse(JSON.stringify(oIncomingPaymentHeader)));
					  //ajax call to SL
					  $.ajax({
						url: "https://sl.biotechfarms.net/b1s/v1/IncomingPayments",
						type: "POST",
						data: JSON.stringify(oIncomingPayment),
						async: false,
						xhrFields: {
						  withCredentials: true
						},
						error: function (xhr, status, error) {
						  var Message = xhr.responseJSON["error"].message.value;
						  AppUI5.fErrorLogs("ORCT","Insert","null","null",Message,"Bu to Cash Sale",this.sUserCode,"null",JSON.stringify(oIncomingPayment));
						  console.error(JSON.stringify(Message));
						  sap.m.MessageToast.show(Message);
						},
						success: function (json) {
						  //UPDATE RECORDS ON UDT
						  this.fUpdatePending(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,ostatus,oDocType,oDetails,oAttachment,oAttachmentKey);
						  sap.m.MessageToast.show("Successfully Added");
						  this.fClearField();
						  this.oModel.refresh();
						  AppUI5.hideBusyIndicator();
						},
						context: this

					  });
				  }////END INCOMING PAYMENTS
				});

			  }  /////POSTING A/R INVOICE END
			}); ////GOODS ISSUE END
		},
		////POSTING ON BU TO VALE
		fBuToVale: function (transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey) {
			//Initialize Variables
			AppUI5.showBusyIndicator(4000);
			var ostatus="2";
			var oDocType ="Goods Issue/Invoices";
			var oGoodsIssue = {};
			var oGoodsIssueHeader = {};
			var ocardcode = this.oModel.getData().EditRecord.BPCode;
			var oDescription = this.oModel.getData().EditRecord.Remarks;
			oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
			oGoodsIssue.AttachmentEntry = oAttachmentKey;
			oGoodsIssue.U_APP_GI_TransType = "BU";
			oGoodsIssue.DocumentLines = [];
			///LOOP FOR THE DETAILS
			var d;
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
			  oGoodsIssueHeader.WarehouseCode = this.oIssueBu;
			  oGoodsIssueHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
			  oGoodsIssueHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
			  oGoodsIssueHeader.UnitPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
			  oGoodsIssue.DocumentLines.push(JSON.parse(JSON.stringify(oGoodsIssueHeader)));
			}
			$.ajax({
			  url: "https://sl.biotechfarms.net/b1s/v1/InventoryGenExits",
			  type: "POST",
			  data: JSON.stringify(oGoodsIssue),
			  crossDomain: true,
					  xhrFields: {
				withCredentials: true
			  },
			  error: function (xhr, status, error) {
				var Message = xhr.responseJSON["error"].message.value;
				AppUI5.fErrorLogs("OIGE","Insert","null","null",Message,"Bu to Vale",this.sUserCode,"null",JSON.stringify(oGoodsIssue));
				console.error(JSON.stringify(Message));
				sap.m.MessageToast.show(Message);

			  },
			  success: function (json) {
				AppUI5.hideBusyIndicator();
			  },
			  context: this
			}).done(function (results) {
			  if (results) {
				//POSTING OF INVOICE
				var oInvoice = {};
				var oInvoiceHeader = {};
				oInvoice.CardCode = ocardcode;
				oInvoice.DocType ="dDocument_Service";
				oInvoice.AttachmentEntry = oAttachmentKey;
				oInvoice.DocumentLines = [];
				///HARD CODED ACCOUNT CODE FOR TESTING
				oInvoiceHeader.ItemDescription = oDescription;
				oInvoiceHeader.AccountCode ="4110101101-000-000-000-000-000";
				oInvoiceHeader.LineTotal =results.DocTotal;
				oInvoice.DocumentLines.push(JSON.parse(JSON.stringify(oInvoiceHeader)));
				$.ajax({
				  url: "https://sl.biotechfarms.net/b1s/v1/Invoices",
				  type: "POST",
				  data: JSON.stringify(oInvoice),
				  crossDomain: true,
				  xhrFields: {
					withCredentials: true
				  },
				  error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					AppUI5.fErrorLogs("OINV","Insert","null","null",Message,"Bu to Vale",this.sUserCode,"null",JSON.stringify(oInvoice));
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);

				  },
				  success: function (json) {
					//this.oPage.setBusy(false);
					//UPDATE RECORDS ON UDT
					this.fUpdatePending(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,ostatus,oDocType,oDetails,oAttachment,oAttachmentKey);
					sap.m.MessageToast.show("Posting of Goods Issue is Successful");
					this.fClearField();
					this.oModel.refresh();
					AppUI5.hideBusyIndicator();
				  },
				  context: this
				}).done(function (results) {
				  if (results) {
					////////
				  }
				});

			  }  /////POSTING A/R INVOICE END
			}); ////GOODS ISSUE END
		},

		////POSTING ON BU TO CHARGE TO EXPENSE
		fBUtoChargetoExpense: function (transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey) {
			AppUI5.showBusyIndicator(4000);
			//Initialize Variables
			var ostatus="2";
			var oDocType ="Goods Issue";
			var oGoodsIssue = {};
			var oGoodsIssueHeader = {};
			oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
			oGoodsIssue.AttachmentEntry = oAttachmentKey;
			oGoodsIssue.U_APP_GI_TransType = "BU";
			oGoodsIssue.DocumentLines = [];
			///LOOP FOR THE DETAILS
			var d;
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
			oGoodsIssueHeader.WarehouseCode = this.oIssueBu;
			oGoodsIssueHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
			oGoodsIssueHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
			oGoodsIssueHeader.UnitPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
			oGoodsIssue.DocumentLines.push(JSON.parse(JSON.stringify(oGoodsIssueHeader)));
			}

			$.ajax({

			url: "https://sl.biotechfarms.net/b1s/v1/InventoryGenExits",
			type: "POST",
			data: JSON.stringify(oGoodsIssue),
			xhrFields: {
				withCredentials: true
			},
			error: function (xhr, status, error) {
				var Message = xhr.responseJSON["error"].message.value;
				AppUI5.fErrorLogs("OIGE","Insert","null","null",Message,"Charge to Expense",this.sUserCode,"null",JSON.stringify(oGoodsIssue));
				console.error(JSON.stringify(Message));
				sap.m.MessageToast.show(Message);
				AppUI5.hideBusyIndicator();
			},
			success: function (json) {
				//UPDATE RECORDS ON UDT
				this.fUpdatePending(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,ostatus,oDocType,oDetails,oAttachment,oAttachmentKey);
				sap.m.MessageToast.show("Added Successfully");
				this.fClearField();
				this.oModel.refresh();
				AppUI5.hideBusyIndicator();
			},
			context: this

			}).done(function (results) {
			if (results) {
				//

			}
			});
		},

		////POSTING ON BU TO INTER ORG ISSUE
		fBuToInterOrgIssue: function (transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey) {
			//Initialize Variables
			AppUI5.showBusyIndicator(10000);
			var ostatus="2";
			var oDocType ="Goods Issue/Invoices";
			var oGoodsIssue = {};
			var oGoodsIssueHeader = {};
			var ocardcode = this.oModel.getData().EditRecord.BPCode;
			var oDescription = this.oModel.getData().EditRecord.Remarks;
			oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
			// oGoodsIssue.AttachmentEntry = this.FileKey;
			oGoodsIssue.U_APP_GI_TransType = "BU";
			oGoodsIssue.U_APP_BU_TransNum = transno;
			oGoodsIssue.DocumentLines = [];
			///LOOP FOR THE DETAILS
			var d;
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
				oGoodsIssueHeader.WarehouseCode = this.oIssueBu;
				oGoodsIssueHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
				oGoodsIssueHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
				oGoodsIssueHeader.UnitPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
				oGoodsIssue.DocumentLines.push(JSON.parse(JSON.stringify(oGoodsIssueHeader)));
			}
			$.ajax({
				url: "https://sl.biotechfarms.net/b1s/v1/InventoryGenExits",
				type: "POST",
				data: JSON.stringify(oGoodsIssue),
				crossDomain: true,
                xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					AppUI5.fErrorLogs("OIGE","Insert","null","null",Message,"Inter Org Issue",this.sUserCode,"null",JSON.stringify(oGoodsIssue));
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);
				},
				success: function (json) {
					AppUI5.hideBusyIndicator();
				},
				context: this
			}).done(function (results) {
				if (results) {
					//POSTING OF INVOICE
					var oAccountCode="";
					if(this.sDataBase==="PROD_RCI"){
						var oAccountCode="_SYS00000000985";
					}else{
						var oAccountCode="_SYS00000000942";
					}

					var oInvoice = {};
					var oInvoiceHeader = {};
					oInvoice.CardCode = ocardcode;
					oInvoice.DocType ="dDocument_Service";
					// oInvoice.AttachmentEntry = this.FileKey;
					oInvoice.DocumentLines = [];
					///HARD CODED ACCOUNT CODE FOR TESTING
					oInvoiceHeader.ItemDescription = oDescription;
					oInvoiceHeader.AccountCode =oAccountCode; //4110101101//_SYS00000000942//4110101101-000-000-000-000-000
					oInvoiceHeader.LineTotal =results.DocTotal;
					oInvoice.DocumentLines.push(JSON.parse(JSON.stringify(oInvoiceHeader)));

					$.ajax({
						url: "https://sl.biotechfarms.net/b1s/v1/Invoices",
						type: "POST",
						data: JSON.stringify(oInvoice),
						crossDomain: true,
						xhrFields: {
							withCredentials: true
						},
						error: function (xhr, status, error) {
							var Message = xhr.responseJSON["error"].message.value;
							AppUI5.fErrorLogs("OINV","Insert","null","null",Message,"Inter Org Issue",this.sUserCode,"null",JSON.stringify(oInvoice));
							console.error(JSON.stringify(Message));
							sap.m.MessageToast.show(Message);

						},
						success: function (json) {
							this.fUpdatePending(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,ostatus,oDocType,oDetails,oAttachment,oAttachmentKey);
							this.fprintGoodsIssue(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,ostatus,oDocType,oDetails,oAttachment,oAttachmentKey);
							sap.m.MessageToast.show("Posting of Goods Issue is Successful");
							this.fClearField();
							this.oModel.refresh();
							AppUI5.hideBusyIndicator();
						},
						context: this
					}).done(function (results) {
						if (results) {
							////////
						}
					});

				}  /////POSTING A/R INVOICE END
			}); ////GOODS ISSUE END
		},
		 ///PREPARING BATCH REQUEST
		fprepareBatchRequestBody: function (oRequest) {
			var batchRequest = "";
			var beginBatch = "--a\nContent-Type: multipart/mixed;boundary=b\n\n";
			var endBatch = "--b--\n--a--";

			batchRequest = batchRequest + beginBatch;

			var objectUDT = "";
			for (var i = 0; i < oRequest.length; i++) {

			  objectUDT = oRequest[i];
			  batchRequest = batchRequest + "--b\nContent-Type:application/http\nContent-Transfer-Encoding:binary\n\n";
			  batchRequest = batchRequest + "POST /b1s/v1/" + objectUDT.tableName;
			  batchRequest = batchRequest + "\nContent-Type: application/json\n\n";
			  batchRequest = batchRequest + JSON.stringify(objectUDT.data) + "\n\n";
			}

			batchRequest = batchRequest + endBatch;

			return batchRequest;

		},
		///POSTING ON BU TO INTER ORG RECEIPT
		
		fBuToInterOrgReceipt: function (transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey) {
			AppUI5.showBusyIndicator(15000);
			//Initialize Variables
			var ostatus="2";
			var oDocType ="Goods Receipt"; ///Purchase Invoices
			var oInvoice = {};
			var oGoodsReceipt= {};
			var oInvoiceHeader = {};
			var oGoodsReceiptHeader = {};
			oInvoice.CardCode = this.oModel.getData().EditRecord.BPCode;
			oInvoice.Comments = this.oModel.getData().EditRecord.Remarks;
			oInvoice.DocumentLines = [];
			oGoodsReceipt.Comments = this.oModel.getData().EditRecord.Remarks;
			oGoodsReceipt.U_APP_GR_TransType = "BU";
			oGoodsReceipt.U_APP_BU_TransNum = transno;
			oGoodsReceipt.DocumentLines = [];
			///LOOP FOR THE DETAILS
			var d;
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
				///Goods Receipt Details
				oInvoiceHeader.WarehouseCode = oReceiveBU;
				oInvoiceHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
				oInvoiceHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
				var oTransferPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
				var oCostToProduce = this.oModel.getData().EditRecord.DocumentLines[d].CostProd;
				if(oTransferPrice==="0" || oTransferPrice===0 || oTransferPrice===""){
					oInvoiceHeader.UnitPrice = oCostToProduce;
				}else{
					oInvoiceHeader.UnitPrice = oTransferPrice;
				}
				oInvoiceHeader.UoMEntry = this.oModel.getData().EditRecord.DocumentLines[d].UomEntry;
				oInvoiceHeader.VatGroup = "IVAT-E";
				///Goods Issue Details
				oGoodsReceiptHeader.WarehouseCode = oReceiveBU;
				oGoodsReceiptHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
				oGoodsReceiptHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
				oGoodsReceiptHeader.UnitPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
				oGoodsReceiptHeader.UoMEntry = this.oModel.getData().EditRecord.DocumentLines[d].UomEntry;

				oInvoice.DocumentLines.push(JSON.parse(JSON.stringify(oInvoiceHeader)));
				oGoodsReceipt.DocumentLines.push(JSON.parse(JSON.stringify(oGoodsReceiptHeader)));
			}
			var batchArray = [
				//directly insert data if data is single row per table
				{
				  "tableName": "PurchaseInvoices",
				  "data": oInvoice
				//   "tableName": "InventoryGenEntries",
				//   "data": oGoodsReceipt
				}
			  ];

			batchArray.push(JSON.parse(JSON.stringify(({
				"tableName": "InventoryGenEntries",
				"data": oGoodsReceipt
			}))));

			var sBodyRequest = this.fprepareBatchRequestBody(batchArray);
			//ajax call to SL
			$.ajax({
				url: "https://sl.biotechfarms.net/b1s/v1/$batch",
				type: "POST",
				contentType: "multipart/mixed;boundary=a",
				data: sBodyRequest, //If batch, body data should not be JSON.stringified
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);
					AppUI5.hideBusyIndicator();
				},
				success: function (json) {
					AppUI5.hideBusyIndicator();
				},
				context: this

			}).done(function (results) {
				if(JSON.stringify(results).search("400 Bad") !== -1) {
					var oStartIndex = results.search("value") + 10;
					var oEndIndex = results.indexOf("}") - 8;
					var oMessage = results.substring(oStartIndex,oEndIndex);
					AppUI5.fErrorLogs("OIGE/OPCH","Insert","null","null",oMessage,"Insert",this.sUserCode,"null",sBodyRequest);
					sap.m.MessageToast.show(oMessage);
				}else{
					if (results) {
						//UPDATE RECORDS ON UDT
					    this.fUpdatePending(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,ostatus,oDocType,oDetails,oAttachment,oAttachmentKey);
						AppUI5.fprintGoodsReceipt(this.sUserCode,transtype,this.iTranNum,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails);
						sap.m.MessageToast.show("Transaction Type "+ transtype +" Draft Has Been Created!");
						this.fClearField();
						this.oModel.refresh();
						AppUI5.hideBusyIndicator();
					}
				}
			});
		},
		
		////POSTING Renewable Energy Transfer BUSINESS TYPE
		fRenewableEnergyTransfer: function (transtype,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey) {
			AppUI5.showBusyIndicator(4000);
			//Initialize Variables
			var ostatus= "1";
			var oDocType ="Goods Issue";
			var oGoodsIssue = {};
			var oGoodsIssueHeader = {};
			oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
			oGoodsIssue.U_APP_GI_TransType = "BU";
			oGoodsIssue.AttachmentEntry = oAttachmentKey;
			oGoodsIssue.DocumentLines = [];
			///LOOP FOR THE DETAILS
			var d;
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
				oGoodsIssueHeader.WarehouseCode = this.oIssueBu;
				oGoodsIssueHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
				oGoodsIssueHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
				oGoodsIssueHeader.UnitPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
				oGoodsIssue.DocumentLines.push(JSON.parse(JSON.stringify(oGoodsIssueHeader)));
			}

			$.ajax({
				url: "https://sl.biotechfarms.net/b1s/v1/InventoryGenExits",
				type: "POST",
				data: JSON.stringify(oGoodsIssue),
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					AppUI5.fErrorLogs("OIGE","Insert","null","null",Message,"Bu to Bu",this.sUserCode,"null",JSON.stringify(oGoodsIssue));
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);
					AppUI5.hideBusyIndicator();
				},
				success: function (json) {
					//UPDATE RECORDS ON UDT
					this.fUpdatePending(transtype,this.iTranNum,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,ostatus,oDocType,oDetails,oAttachment,oAttachmentKey);
					sap.m.MessageToast.show("Added Successfully");
					this.fClearField();
					this.oModel.refresh();
					AppUI5.hideBusyIndicator();
				},
				context: this

			}).done(function (results) {
				if (results) {
					//

				}
			});
		},
		onAddDraft: function (oEvent) {
			var transtype = this.getView().byId("TransID").getSelectedKey();
			var ostatus= "0";
			if (this.triggercondition === "SAVE AS DRAFT") {
				if (transtype === "") {
					sap.m.MessageToast.show("Please Select Transaction Type.");
				} else {
					this.fAddDraftFunction(ostatus);
					this.fClearField();
				}
			} else {
			this.fonUpdateDraft();
			}
		},
    /// Record Posting
		onAddRecords: function (oEvent) {
			//INITIALIZE VARIABLES
			var transtype = this.oModel.getData().EditRecord.TransType;
			var transno = this.iTranNum;
			var oCardCode = this.oModel.getData().EditRecord.BPCode;
			var oPostingDate = this.getView().byId("dpickerpostingdate").getValue();
			var oMarkupType = this.oModel.getData().EditRecord.MarkupType;
			var oIssueBU = this.oIssueBu;
			var oReceiveBU = this.oReceiveBu;
			var oRemarks = this.oModel.getData().EditRecord.Remarks;
			var oDetails = this.oModel.getData().EditRecord.DocumentLines;
			var oCountDetails = this.oModel.getData().EditRecord.DocumentLines.length;
			//var sAttachment = this.getView().byId("fileUploader").getValue();
			var oAttachment = this.Attachment;
			var oAttachmentKey = this.FileKey;
			if (transtype === "" || transno === "") {
				sap.m.MessageToast.show("Please Select Transaction.");
			}else if(oCountDetails===0){
				sap.m.MessageToast.show("Please Select Transaction.");
			}else if(transtype === "1"){
				/////Call BU to BU AND DRAFT transaction Function
				this.fBuToBu(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey);
			}else if(transtype === "2"){
			/////Call Bu to Inter Org - ISSUE and Draft
				this.fBuToInterOrgIssue(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey);
			}else if(transtype === "3"){
			/////Call Bu to Inter Org - Receipt and Draft
				this.fBuToInterOrgReceipt(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey);
			}else if (transtype === "4") {
				/////Call Renewable Energy Transfer Function
				this.fRenewableEnergyTransfer(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey);
			}
		},
		onCancelRecords: function (oEvent) {
			AppUI5.showBusyIndicator(10000);
			var oTransTatus = this.getView().byId("TranStatus").getSelectedKey();	
			var oTransType = this.oModel.getData().EditRecord.TransType;
			this.bCancel = true;
			// if(oTransTatus === "0"){}
			var getcode = this.code;
			var oBusiness_Unit = {};
			oBusiness_Unit.U_APP_Status = "5";
			oBusiness_Unit.U_APP_IsPostedGR = "N";
			oBusiness_Unit.U_APP_IsPostedGI = "N";
			///HEADER BATCH
			var BatchHeader =
				{
					"tableName": "U_APP_OINT",
					"data": oBusiness_Unit
				};
			var sBodyRequest = this.fprepareUpdatePostedRequestBody(BatchHeader, "",getcode);
			$.ajax({
				url: "https://sl.biotechfarms.net/b1s/v1/$batch",
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
					if (Message === "Invalid session."){
						this.fRoutToLogin();
					}
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
					AppUI5.fErrorLogs("U_APP_OINT/U_APP_INT1","Update",TransNo,"null",oMessage,"Update",this.sUserCode,"null",sBodyRequest);
					sap.m.MessageToast.show(oMessage);
					AppUI5.hideBusyIndicator();
				}else{
					if (results) {
						sap.m.MessageToast.show("Record Cancelled!");
						this.fprepareTable(false,"");
						this.fClearField();
						this.oModel.refresh();
						AppUI5.hideBusyIndicator();
					}
				}
			});
		
		},
		//Batch Request for Updating Draft
		fprepareUpdateBatchRequestBody: function (oHeader, oRequest, getcode) {
			var batchRequest = "";
			var beginBatch = "--a\nContent-Type: multipart/mixed;boundary=b\n\n";
			var endBatch = "--b--\n--a--";

			batchRequest = batchRequest + beginBatch;

			var objectUDTHeader = "";
			objectUDTHeader = oHeader;
			batchRequest = batchRequest + "--b\nContent-Type:application/http\nContent-Transfer-Encoding:binary\n\n";
			batchRequest = batchRequest + "PATCH /b1s/v1/" + objectUDTHeader.tableName + "('" + getcode + "')";
			batchRequest = batchRequest + "\nContent-Type: application/json\n\n";
			batchRequest = batchRequest + JSON.stringify(objectUDTHeader.data) + "\n\n";

			var objectUDT = "";
			for (var i = 0; i < oRequest.length; i++) {
				objectUDT = oRequest[i];
				batchRequest = batchRequest + "--b\nContent-Type:application/http\nContent-Transfer-Encoding:binary\n\n";
				batchRequest = batchRequest + "POST /b1s/v1/" + objectUDT.tableName;
				batchRequest = batchRequest + "\nContent-Type: application/json\n\n";
				batchRequest = batchRequest + JSON.stringify(objectUDT.data) + "\n\n";
			}

			batchRequest = batchRequest + endBatch;

			return batchRequest;

		},

		//Batch Request for Updating Draft
		fprepareUpdatePostedRequestBody: function (oHeader,oDetails,getcode) {
			var batchRequest = "";
			var beginBatch = "--a\nContent-Type: multipart/mixed;boundary=b\n\n";
			var endBatch = "--b--\n--a--";

			batchRequest = batchRequest + beginBatch;

			var objectUDTHeader = "";
			objectUDTHeader = oHeader;
			batchRequest = batchRequest + "--b\nContent-Type:application/http\nContent-Transfer-Encoding:binary\n\n";
			batchRequest = batchRequest + "PATCH /b1s/v1/" + objectUDTHeader.tableName + "('" + getcode + "')";
			batchRequest = batchRequest + "\nContent-Type: application/json\n\n";
			batchRequest = batchRequest + JSON.stringify(objectUDTHeader.data) + "\n\n";

			if(oDetails !== ""){
			var objectUDTDetails = "";
			//objectUDTDetails = oDetails;
				for (var i = 0; i < oDetails.length; i++) {
				objectUDTDetails = oDetails[i];
				batchRequest = batchRequest + "--b\nContent-Type:application/http\nContent-Transfer-Encoding:binary\n\n";
				batchRequest = batchRequest + "POST /b1s/v1/" + objectUDTDetails.tableName;
				batchRequest = batchRequest + "\nContent-Type: application/json\n\n";
				batchRequest = batchRequest + JSON.stringify(objectUDTDetails.data) + "\n\n";
				}
			}
			batchRequest = batchRequest + endBatch;

			return batchRequest;

		  },
		////UPDATE  POSTED
		fUpdatePending: function (transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,ostatus,oDocType,oDetails,oAttachment,oAttachmentKey) {
			var TransNo = transno;
			var TransType = transtype;
			$.ajax({
			url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName=" + this.sDataBase + "&procName=spAppBusinessUnit&queryTag=deleteDraftDetails&value1=" +
				TransNo + "&value2=" + TransType + "&value3&value4",
			type: "POST",
			contentType: "application/json",
			async: false,
			datatype:"json",
			beforeSend: function(xhr){
				xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:P@ssw0rd805~"));
			},
			error: function (xhr, status, error) {
				var Message = xhr.responseJSON["error"].message.value;
				console.error(JSON.stringify(Message));
				sap.m.MessageToast.show(Message);
				AppUI5.hideBusyIndicator();
			},
			success: function (json) {},
			context: this
			}).done(function (results) {
			if (results) {
				///
			}
			});
			//INITIALIZE FOR UPDATE
			var getcode = this.code;
			var oBusiness_Unit = {};
			var oBusiness_Unit_Details = {};
			oBusiness_Unit.Code = getcode;
			oBusiness_Unit.Name = getcode;
			oBusiness_Unit.U_APP_TransType = TransType;
			oBusiness_Unit.U_APP_TransNo = TransNo;
			oBusiness_Unit.U_APP_TransDate = this.fgetTodaysDate();
			oBusiness_Unit.U_APP_CardCode = oCardCode;
			oBusiness_Unit.U_APP_PostingDate = oPostingDate;
			oBusiness_Unit.U_APP_MarkupType = oMarkupType;
			oBusiness_Unit.U_APP_IssueBU = this.oIssueBu;
			oBusiness_Unit.U_APP_ReceivingBU = this.oReceiveBu;
			oBusiness_Unit.U_APP_Remarks = oRemarks;
			oBusiness_Unit.U_APP_Status = ostatus;
			oBusiness_Unit.U_APP_DocType = oDocType;
			oBusiness_Unit.U_APP_Attachment = oAttachment;
			oBusiness_Unit.U_APP_AttachmentKey = oAttachmentKey;
			if(transtype === "3") {
				oBusiness_Unit.U_APP_IsPostedGR = "Y";
			}else{
				oBusiness_Unit.U_APP_IsPostedGI = "Y";
			}
			
			///HEADER BATCH
			var BatchHeader =
			//directly insert data if data is single row per table
			{
				"tableName": "U_APP_OINT",
				"data": oBusiness_Unit
			};

			var d;
			var code = "";
			var batchArray = [];
			for (d = 0; d < oDetails.length; d++) {
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
				oBusiness_Unit_Details.U_APP_TransNo = TransNo;
				oBusiness_Unit_Details.U_APP_TransType = TransType;
				oBusiness_Unit_Details.U_APP_Uom = this.oModel.getData().EditRecord.DocumentLines[d].Uom;
				//	oBusiness_Unit_Details.APP_TransNo = this.getView().byId("TransNo").getValue();
				batchArray.push(JSON.parse(JSON.stringify(({
					"tableName": "U_APP_INT1",
					"data": oBusiness_Unit_Details
				}))));

			}
			var sBodyRequest = this.fprepareUpdatePostedRequestBody(BatchHeader,batchArray, getcode);
			$.ajax({
			url: "https://sl.biotechfarms.net/b1s/v1/$batch",
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
			},
			success: function (json) {

			},
			context: this
			}).done(function (results) {
			if(JSON.stringify(results).search("400 Bad") !== -1) {
				var oStartIndex = results.search("value") + 10;
				var oEndIndex = results.indexOf("}") - 8;
				var oMessage = results.substring(oStartIndex,oEndIndex);
				AppUI5.fErrorLogs("APP_OINT/APP_INT1","Update",TransNo,"null",oMessage,"Update",this.sUserCode,"null",sBodyRequest);
				sap.m.MessageToast.show(oMessage);
			}else{
				if (results) {
				sap.m.MessageToast.show("Transaction Type "+ TransType +" Has Been Posted!");
				this.fprepareTable(false,"");
				this.fClearField();
				this.oModel.refresh();
				AppUI5.hideBusyIndicator();
				}
			}
			});
		},
		fgetmarkup: function (oEvent) {
			var oMarkupType = this.getView().byId("inputmarkuptype").getSelectedKey();
			var oMarkPrice = oEvent.mParameters.value;
			var oCostToProduce = this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].CostProd;
			if(oMarkupType==="1"){
				var oTransferPrice = Number([oMarkPrice] * 0.1) * Number([oCostToProduce]);
			}else if(oMarkupType==="2"){
				var oTransferPrice = Number([oMarkPrice]) + Number([oCostToProduce]);
			}
			this.getView().byId("transferprice").setValue(oTransferPrice);
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice=oTransferPrice;
			this.oModel.refresh();
		},
		fRoutToLogin: function(){
			jQuery.sap.storage.Storage.clear();
			sap.ui.core.UIComponent.getRouterFor(this).navTo("Login", null, true);
		}
  	});
});
