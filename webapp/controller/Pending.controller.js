sap.ui.define([
  "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"com/apptech/bfi-businessunit/controller/AppUI5",
	"sap/ui/model/FilterOperator"
], function(Controller, JSONModel, Fragment, Filter, AppUI5, FilterOperator) {
  "use strict";
	var doc = new jsPDF();
	return Controller.extend("com.apptech.bfi-businessunit.controller.Pending", {
		_data: {
			"date": new Date()
		},
		onRoutePatternMatched: function(event){
			this.fprepareTable(false,"");
			this.fClearField();
			this.oModel.refresh();
		},
		onInit: function () {
			///ON LOAD
			var route = this.getOwnerComponent().getRouter().getRoute("Pending");
			route.attachPatternMatched(this.onRoutePatternMatched,this);
			//USER DATA
			this.sDataBase = jQuery.sap.storage.Storage.get("dataBase");
			this.sUserCode = jQuery.sap.storage.Storage.get("userCode");

			//getButtons
			this.oMdlButtons = new JSONModel();
			this.oResults = AppUI5.fGetButtons(this.sDataBase,this.sUserCode,"Pending");
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
			//BLANK JSONMODEL FOR ALL ITEMS FOR TEMPLATE
			this.oMdlAllItems = new JSONModel();
			this.oMdlAllItems.getData().allitems = [];
				// Get DateToday
			this.getView().byId("transactiondate").setDateValue(new Date());
			this.bCancel = false;

			///Initialize model
			this.oModel = new JSONModel("model/pending.json");
			this.getView().setModel(this.oModel);
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
			this.tableId = "tblRecords";
			this.oIssueBu = "";
			this.oReceiveBu= "";
			this.fprepareTable(true,"");

		},

		fprintGoodsReceipt: function(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails){
			//doc.text(20, 20, 'Biotech Farms Inc.(BFI)');
			doc.setFontSize(12)
			doc.text(77, 32, 'Bo.6,Banga, South Cotabato');

			doc.setFontSize(22)
			// doc.text(20,40, 'MATERIAL REQUESITION AND ISSUANCE SLIP');
			// doc.text(80,40, 'GOODS ISSUE');
			doc.text(77,50, 'GOODS RECEIPT');

			var img = new Image()
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
			doc.text(20, 170, 'REQUESTED BY:____________________');
			doc.text(20, 180, 'APPROVED BY:____________________');
			doc.text(20, 190, 'RECEIVED BY:____________________');
			doc.text(120, 170, 'PREPARED BY:____________________');
			doc.text(120, 180, 'CHECKED BY:______________________');
			doc.text(120, 190, 'COUNTERED CHECK BY:______________');
			doc.output('Goods Receipt_'+ transno +'.pdf');
			doc.save('Goods Receipt_'+ transno +'.pdf');
			doc = new jsPDF();
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

		},

   		onTransTypeFilter : function(oEvent){
			this.fprepareTable("",0);
			this.oMdlAllRecord.refresh();
		},
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
		fprepareTable: function (bIsInit,transType) {
			if (transType === ""){
				var transtypefilter = "1";
			}else{
				var transtypefilter = this.getView().byId("transfilter").getSelectedKey();
			}
			if (transtypefilter === ""){
				var aResults = this.fgetAllTransaction(transtypefilter);
			}else{
				var aResults = this.fgetAllTransaction(transtypefilter);
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
				var table = this.getView().byId(this.tableId);
				var oModel1 = new sap.ui.model.json.JSONModel();
				var data =[];
				this.oMdlAllRecord.setData(data);
				table.setModel(this.oMdlAllRecord, "odata");
			}
		},
    	///GETTING ALL THE THE TRANSACTION DATA/S
		fgetAllTransaction: function (transtypefilter) {
			var value1 = transtypefilter;
			var aReturnResult = [];
			var urltag = "";
			if (value1 ===""){
				urltag ="https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&QUERYTAG=getTransactions&VALUE1=&VALUE2=&VALUE3=&VALUE4=";
			}else{
				urltag ="https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&QUERYTAG=getAllPendingTransaction&VALUE1="+ value1 +"&VALUE2=1&VALUE3=&VALUE4=";

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
				} else {
					aReturnResult = results;
				}
			});
			return aReturnResult;

		},
		///ON VIEW SHOWING ALL DATA AND CHANGING NAME INTO EDIT
		onView: function (oEvent) {
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
		},
		//Generic selecting of data
		fgetHeader: function (dbName, procName, queryTag, value1, value2, value3, value4) {
			//get all open AP base on parameters
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + dbName + "&procName=spAppBusinessUnit&QUERYTAG=" + queryTag + "&VALUE1=" + value1 +
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
					// this.oModel.setJSON("{\"EditRecord\" : " + oResult + "}");

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
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + dbName + "&procName=spAppBusinessUnit&QUERYTAG=" + queryTag + "&VALUE1=" + value1 +
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
					results.map(obj=> ({ ...obj, CostProdEnable: false }));
					this.oModel.getData().EditRecord.DocumentLines = results;
					this.oModel.refresh();

				}
			});
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
			// var sInputValue = this.byId("inputitemnum").getValue();
			if (this.oModel.getData().allitems.length <= 1) {
				//GET ALL ITEMS
				$.ajax({
					url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getallitems&value1&value2&value3&value4",
					type: "GET",
					datatype:"json",
				beforeSend: function(xhr){
					xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:P@ssw0rd805~"));
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
						this.oModel.getData().allitems.length = 0;
						this.oModel.getData().allitems = JSON.parse(JSON.stringify(results));
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
				new Filter("ItemCode", FilterOperator.Contains, sValue),
				new Filter("ItemName", FilterOperator.Contains, sValue)
				], false);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(oFilters);
		},
		//Closing selection on Item
		handleValueHelpCloseItem: function (oEvent) {
			var transtype = this.oModel.getData().EditRecord.TransType;
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

			if (transtype === "1") {
				if(oCostToProduce <= oMarketPrice){
					this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
				}else{
					this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice=oMarketPrice;
				}
			} else if (transtype === "2") {
				this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
			}else if (transtype === "3") {
				///for revise
				this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
			}else if (transtype === "4") {
				///for revise
				this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
			}
			this.oModel.refresh();
		},
		////POSTING BU TO BU BUSINESS TYPE
		fAddReceipt: function (oTransType,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails) {
			AppUI5.showBusyIndicator(10000);
			var oDocType = "Goods Receipt";
			//Initialize Variables
			var oGoodsReceipt = {};
			var oGoodsReceiptHeader = {};
			//oGoodsReceipt.CardCode = this.oModel.getData().EditRecord.BPCode;
			oGoodsReceipt.Comments = this.oModel.getData().EditRecord.Remarks;
			oGoodsReceipt.U_APP_BU_TransNum = transno;
			// oGoodsReceipt.U_APP_GR_TransType = "BU";
			oGoodsReceipt.DocumentLines = [];
			///LOOP FOR THE DETAILS
			var d;
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
				// oGoodsIssueHeader.WarehouseCode = this.oModel.getData().EditRecord.IssueBU;
				oGoodsReceiptHeader.WarehouseCode = (this.bCancel ? this.oReceiveBu : this.oIssueBu);
				oGoodsReceiptHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
				oGoodsReceiptHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
				var oTransferPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
				var oCostToProduce = this.oModel.getData().EditRecord.DocumentLines[d].CostProd;
				if(oTransferPrice==="0" || oTransferPrice===0 || oTransferPrice===""){
					oGoodsReceiptHeader.UnitPrice = oCostToProduce;
				}else{
					oGoodsReceiptHeader.UnitPrice = oTransferPrice;
				}
				oGoodsReceiptHeader.UnitPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
				oGoodsReceipt.DocumentLines.push(JSON.parse(JSON.stringify(oGoodsReceiptHeader)));
			}

			$.ajax({
				url: "https://18.136.35.41:50000/b1s/v1/InventoryGenEntries",
				type: "POST",
				data: JSON.stringify(oGoodsReceipt),
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					AppUI5.fErrorLogs("OPDN","Insert","null","null",Message,"Receipt",this.sUserCode,"null",JSON.stringify(oGoodsReceipt));

					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);
					AppUI5.hideBusyIndicator();
				},
				success: function (json) {
					//this.oPage.setBusy(false);
					this.fUpdatePending();
					if (this.bCancel === false){
						//this.fAddNewReceipt(oDocType);
						this.fprintGoodsReceipt(oTransType,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails);
					}else{
						this.fPostGoodsIssue(transno);
					}
					this.fprepareTable(false,"");
					this.bCancel = false;
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
		///CREATE JOURNAL ENTRY
		fCreateJE: function () {
			AppUI5.showBusyIndicator(10000);
			var oDocType = "Journal Entry";
			//Initialize Variables
			var oJournalEnty = {};
			var oJournalEntyHeaderCredit = {};
			var oJournalEntyHeaderDebit = {};
			oJournalEnty.JournalEntryLines = [];
			var d;
			var oQuantity ="";
			var oCostProd="";
			var oSubTotal = "";
			var oTotal ="";
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
				oQuantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
				oCostProd = this.oModel.getData().EditRecord.DocumentLines[d].CostProd;
				oSubTotal = Number([oQuantity]) * Number([oCostProd]);
				oTotal = Number([oTotal]) + Number([oSubTotal]);
			}
			//For Credit
			oJournalEntyHeaderCredit.AccountCode = this.oModel.getData().EditRecord.DocumentLines[0].CreditAccount;
			oJournalEntyHeaderCredit.Credit = oTotal;
			oJournalEnty.JournalEntryLines.push(JSON.parse(JSON.stringify(oJournalEntyHeaderCredit)));
			//For Debit
			oJournalEntyHeaderDebit.AccountCode = this.oModel.getData().EditRecord.DocumentLines[0].DebitAccount;
			oJournalEntyHeaderDebit.Debit = oTotal;
			oJournalEnty.JournalEntryLines.push(JSON.parse(JSON.stringify(oJournalEntyHeaderDebit)));


			$.ajax({
				url: "https://18.136.35.41:50000/b1s/v1/JournalEntries",
				type: "POST",
				data: JSON.stringify(oJournalEnty),
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					AppUI5.fErrorLogs("OJDT","Insert","null","null",Message,"Journal Entry",this.sUserCode,"null",JSON.stringify(oJournalEnty));

					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);
					AppUI5.hideBusyIndicator();
				},
				success: function (json) {
					this.fUpdatePending();
					//this.fAddNewReceipt(oDocType);
					this.fprepareTable(false,"");
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

		onAddReceipt: function (oEvent) {
			var oTransType = this.oModel.getData().EditRecord.TransType;
			var transno = this.oModel.getData().EditRecord.TransNo;
			var oCardCode = this.oModel.getData().EditRecord.BPCode;
			var oPostingDate = this.oModel.getData().EditRecord.PostingDate;
			var oMarkupType = this.oModel.getData().EditRecord.MarkupType;
			var oIssueBU = this.oIssueBu;
			var oReceiveBU = this.oReceiveBu;
			var oRemarks = this.oModel.getData().EditRecord.Remarks;
			var oDetails = this.oModel.getData().EditRecord.DocumentLines;
			var oCountDetails = this.oModel.getData().EditRecord.DocumentLines.length;
			if(oTransType === "4"){
				this.fCreateJE();
			}else{
				this.fAddReceipt(oTransType,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails);
			}


		},
		onCancelReceipt: function (oEvent) {
			var oTransType = this.oModel.getData().EditRecord.TransType;
			var transno = this.oModel.getData().EditRecord.TransNo;
			var oCardCode = this.oModel.getData().EditRecord.BPCode;
			var oPostingDate = this.oModel.getData().EditRecord.PostingDate;
			var oMarkupType = this.oModel.getData().EditRecord.MarkupType;
			var oIssueBU = this.oIssueBu;
			var oReceiveBU = this.oReceiveBu;
			var oRemarks = this.oModel.getData().EditRecord.Remarks;
			var oDetails = this.oModel.getData().EditRecord.DocumentLines;
			var oCountDetails = this.oModel.getData().EditRecord.DocumentLines.length;
			this.bCancel = true;
			if(oTransType !== "3"){
				this.fAddReceipt(oTransType,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails);
			}
		},
		//GETTING DATE NOW
		fgetTodaysDate: function () {
			var today = new Date();
			var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
			return date;
		},
		//Batch Request for Updating Draft
		fprepareUpdatePostedRequestBody: function (oHeader, getcode) {
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

			batchRequest = batchRequest + endBatch;

			return batchRequest;

		},
			////UPDATE  POSTED
		fUpdatePending: function () {
			var ostatus = (this.bCancel ? "5" : "2");
			AppUI5.showBusyIndicator(4000);
			var TransNo = this.oModel.getData().EditRecord.TransNo;
			var TransType = this.oModel.getData().EditRecord.TransType;
			//INITIALIZE FOR UPDATE
			var getcode = this.code;
			var oBusiness_Unit = {};
			oBusiness_Unit.Code = getcode;
			oBusiness_Unit.Name = getcode;
			oBusiness_Unit.U_APP_TransType = TransType;
			oBusiness_Unit.U_APP_TransNo = TransNo;
			oBusiness_Unit.U_APP_TransDate = this.fgetTodaysDate();
			oBusiness_Unit.U_APP_CardCode = this.oModel.getData().EditRecord.BPCode;
			oBusiness_Unit.U_APP_CustomerName = this.oModel.getData().EditRecord.BPName;
			oBusiness_Unit.U_APP_PostingDate = this.oModel.getData().EditRecord.PostingDate;
			oBusiness_Unit.U_APP_MarkupType = this.oModel.getData().EditRecord.MarkupType;
			oBusiness_Unit.U_APP_IssueBU = this.oIssueBu;
			oBusiness_Unit.U_APP_ReceivingBU = this.oReceiveBu;
			oBusiness_Unit.U_APP_Remarks = this.oModel.getData().EditRecord.Remarks;
			oBusiness_Unit.U_APP_Status = ostatus;
			oBusiness_Unit.U_APP_ReceivedBy = this.sUserCode;
			if(TransType === "3"){
				oBusiness_Unit.U_APP_IsPostedGR = "Y";
			}
			if(this.bCancel !== false){
				oBusiness_Unit.U_APP_IsPostedGI = "Y";
			}else{
				oBusiness_Unit.U_APP_IsPostedGR = "N";
				oBusiness_Unit.U_APP_IsPostedGR = "N";
			}
			///HEADER BATCH
			var BatchHeader =
				//directly insert data if data is single row per table
				{
					"tableName": "U_APP_OINT",
					"data": oBusiness_Unit
				};
			var sBodyRequest = this.fprepareUpdatePostedRequestBody(BatchHeader, getcode);
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
					AppUI5.fErrorLogs("U_APP_OINT/U_APP_INT1","Update",TransNo,"null",oMessage,"Update",this.sUserCode,"null",sBodyRequest);
					sap.m.MessageToast.show(oMessage);
				}else{
					if (results) {
						this.fprepareTable(false,"");
						this.fClearField();
						this.oModel.refresh();
						AppUI5.hideBusyIndicator();
					}
				}

			});
		},
		// Batch POSTING ON UDT
		fAddNewReceipt: function (oDocType) {
			var ostatus ="2";
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
			oBusiness_Unit.U_APP_TransDate = this.fgetTodaysDate();
			oBusiness_Unit.U_APP_CardCode = this.oModel.getData().EditRecord.BPCode;
			oBusiness_Unit.U_APP_PostingDate = this.oModel.getData().EditRecord.PostingDate;
			oBusiness_Unit.U_APP_MarkupType = this.oModel.getData().EditRecord.MarkupType;
			oBusiness_Unit.U_APP_IssueBU = this.oIssueBu;
			oBusiness_Unit.U_APP_ReceivingBU = this.oReceiveBu;
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
				oBusiness_Unit_Details.U_APP_Uom = this.oModel.getData().EditRecord.DocumentLines[d].Uom;
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
					AppUI5.fErrorLogs("U_APP_OINT/U_APP_INT1","Insert","null","null",oMessage,"Add Draft",this.sUserCode,"null",sBodyRequest);
					sap.m.MessageToast.show(oMessage);
				}else{
					if (results) {
						sap.m.MessageToast.show(""+ oDocType +" Has Been Posted!");
						this.fprepareTable(false,"");
						this.fClearField();
						this.oModel.refresh();
						AppUI5.hideBusyIndicator();
					}
				}
			});
		},
		fPostGoodsIssue: function(transno){
			AppUI5.showBusyIndicator(10000);
			//Initialize Variables
			var ostatus= "1";
			var oDocType ="Goods Issue";
			var oGoodsIssue = {};
			var oGoodsIssueHeader = {};
			oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
			//oGoodsIssue.AttachmentEntry = oAttachmentKey;
			//oGoodsIssue.U_APP_GI_TransType = "BU";
			oGoodsIssue.U_APP_BU_TransNum = transno;
			oGoodsIssue.DocumentLines = [];
			///LOOP FOR THE DETAILS
			var d;
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
				oGoodsIssueHeader.WarehouseCode = this.oReceiveBu; //(this.bCancel ? this.oReceiveBu : this.oIssueBu);
				oGoodsIssueHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
				oGoodsIssueHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
				oGoodsIssueHeader.UnitPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
				oGoodsIssue.DocumentLines.push(JSON.parse(JSON.stringify(oGoodsIssueHeader)));
			}
			$.ajax({
				url: "https://18.136.35.41:50000/b1s/v1/InventoryGenExits",
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
				//ADD UDT RECORDS
				//sap.m.MessageToast.show("Added Successfully");
				this.fClearField();
				this.oModel.refresh();
				AppUI5.hideBusyIndicator();
				},
				context: this

			}).done(function (results) {
				if (results) {
				}
			});
		}
  	});
});
