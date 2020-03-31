sap.ui.define([
	"sap/ui/core/BusyIndicator",
	'sap/ui/core/Element',
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"com/apptech/bfi-businessunit/controller/AppUI5",
	"sap/ui/model/FilterOperator"
], function(BusyIndicator,Element,Controller, JSONModel, Fragment, Filter, AppUI5, FilterOperator) {
  "use strict";
  return Controller.extend("com.apptech.bfi-businessunit.controller.BusinessUnit", {
    _data: {
			"date": new Date()
		},
		onRoutePatternMatched: function (event) {
			document.title = "BFI Business Unit Transfer";
		},

		onInit: function () {

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
			this.oModel = new JSONModel("model/businessunit.json");
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
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppBusinessUnit&queryTag=getallwarehouses&value1&value2&value3&value4",
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
			this.fprepareTable(true,"");

		},

		onTransTypeFilter : function(oEvent){
			this.fprepareTable("",0);
			this.oMdlAllRecord.refresh();
		},
		onSelectionChange: function (oEvent) {
			var ostatus = this.getView().byId("TranStatus").getSelectedKey();
			///sap.m.MessageToast.show(ostatus);
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
		},
		//Preparing table
		fprepareTable: function (bIsInit,transType) {
			var oTransTatus = this.getView().byId("TranStatus").getSelectedKey();
			if (transType === ""){
				var transtypefilter = "";
			}else{
				var transtypefilter = this.getView().byId("transfilter").getSelectedKey();
			}


			if (transtypefilter === ""){
				var aResults = this.fgetAllTransaction(transtypefilter,oTransTatus);
			}else{
				var aResults = this.fgetAllTransaction(transtypefilter,oTransTatus);
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
				urltag ="https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppBusinessUnit&QUERYTAG=getTransactions&VALUE1=&VALUE2=&VALUE3=&VALUE4=";
			}else{
				urltag ="https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppBusinessUnit&QUERYTAG=getFilteredTransactions&VALUE1="+ value1 +"&VALUE2="+ value2 +"&VALUE3=&VALUE4=";
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
				this.oModel.refresh();
			} catch (err) {
				//console.log(err.message);
			}

		},
	///TRIGGER TO GO TO ADD
		onAddMode: function (oEvent) {
			///Changing the Name of Icon Bar
			this.getView().byId("idIconTabBarInlineMode").getItems()[1].setText("TRANSACTION [ADD]");
			this.getView().byId("SaveDraft").setText("SAVE AS DRAFT");
			var tab = this.getView().byId("idIconTabBarInlineMode");
			tab.setSelectedKey("tab2");

			//Clear All Fields 
			this.fClearField();
			this.getView().byId("inputbpcode").setEnabled(true);
			this.getView().byId("inputaccountname").setEnabled(true);

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
						oitemdetails.CostProdEnable = false;
						oitemdetails.MarkupPriceEnable = false;
						oitemdetails.TransferPriceEnable = false;
						oitemdetails.MarketPriceEnable = false;
						this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
						this.oModel.refresh();
					} else if (transtype === "2") {
						oitemdetails.CostProdEnable = false;
						oitemdetails.MarkupPriceEnable = false;
						oitemdetails.TransferPriceEnable = false;
						oitemdetails.MarketPriceEnable = false;
						this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
						this.oModel.refresh();
					} else if (transtype === "3") {
						oitemdetails.CostProdEnable = false;
						oitemdetails.MarkupPriceEnable = false;
						oitemdetails.TransferPriceEnable = false;
						oitemdetails.MarketPriceEnable = false;
						this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
						this.oModel.refresh();
					} else if (transtype === "4") {
						oitemdetails.CostProdEnable = false;
						oitemdetails.MarkupPriceEnable = false;
						oitemdetails.TransferPriceEnable = false;
						oitemdetails.MarketPriceEnable = false;
						this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
						this.oModel.refresh();
					} else if (transtype === "5") {
						oitemdetails.CostProdEnable = false;
						oitemdetails.MarkupPriceEnable = false;
						oitemdetails.TransferPriceEnable = false;
						oitemdetails.MarketPriceEnable = false;
						this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
						this.oModel.refresh();
					} else if (transtype === "6") {
						oitemdetails.CostProdEnable = false;
						oitemdetails.MarkupPriceEnable = false;
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

		////DRAFT Function POSTING ON UDT
		fAddDraftFunction: function (ostatus) {
			if (ostatus===""){
				var ostatus ="0";
			}
			AppUI5.showBusyIndicator(4000);
			//GET TRANSACTION NUMBER
			var sGeneratedTransNo = "";
			var TransType = this.oModel.getData().EditRecord.TransType;
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppBusinessUnit&queryTag=getTransactionNumber&value1=" +
					TransType + "&value2&value3&value4",
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
				success: function (json) {},
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
			oBusiness_Unit.Code = CodeH;
			oBusiness_Unit.Name = CodeH;
			oBusiness_Unit.U_APP_TransType = TransType;
			oBusiness_Unit.U_APP_TransNo = sGeneratedTransNo;
			oBusiness_Unit.U_APP_TransDate = this.getTodaysDate();
			oBusiness_Unit.U_APP_CardCode = this.oModel.getData().EditRecord.BPCode;
			oBusiness_Unit.U_APP_CustomerName = this.oModel.getData().EditRecord.BPName;
			oBusiness_Unit.U_APP_PostingDate = this.oModel.getData().EditRecord.PostingDate;
			oBusiness_Unit.U_APP_MarkupType = this.oModel.getData().EditRecord.MarkupType;
			oBusiness_Unit.U_APP_IssueBU = this.oModel.getData().EditRecord.IssueBU;
			oBusiness_Unit.U_APP_ReceivingBU = this.oModel.getData().EditRecord.ReceiveBU;
			oBusiness_Unit.U_APP_Remarks = this.oModel.getData().EditRecord.Remarks;
			oBusiness_Unit.U_APP_Status = ostatus;
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
					//this.oPage.setBusy(false);
					sap.m.MessageToast.show(xhr.responseText);
				},
				success: function (json) {
					sap.m.MessageToast.show("Transaction Type "+ TransType +" Draft Has Been Created!");

				},
				context: this
			}).done(function (results) {
				if (results) {
					this.fprepareTable(false,"");
					this.fClearField();
					this.oModel.refresh();
					AppUI5.hideBusyIndicator();
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
				}
			} else {
			this.fonUpdateDraft();
			}
		},

		//GETTING DATE NOW
		getTodaysDate: function () {
			var today = new Date();
			var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
			return date;
		},

		//DISABLING TEXTBOX
		onChangeTrans: function (oEvent) {
			var transtype = this.getView().byId("TransID").getSelectedKey();
			if (transtype === "1") {
				this.getView().byId("inputbpcode").setValue("");
				this.getView().byId("inputaccountname").setValue("");
				this.getView().byId("inputbpcode").setEnabled(false);
				this.getView().byId("inputaccountname").setEnabled(false);
				this.getView().byId("inputwhsreceive").setEnabled(true);

			} else if (transtype === "2") {
				this.getView().byId("inputbpcode").setEnabled(true);
				this.getView().byId("inputaccountname").setEnabled(true);
				this.getView().byId("inputwhsreceive").setEnabled(false);
			} else if (transtype === "3") {
				this.getView().byId("inputbpcode").setEnabled(true);
				this.getView().byId("inputaccountname").setEnabled(true);
				this.getView().byId("inputwhsreceive").setEnabled(false);
			} else if (transtype === "4") {
				this.getView().byId("inputbpcode").setValue("");
				this.getView().byId("inputaccountname").setValue("");
				this.getView().byId("inputbpcode").setEnabled(false);
				this.getView().byId("inputaccountname").setEnabled(false);
				this.getView().byId("inputwhsreceive").setEnabled(false);
			}else if (transtype === "5") {
				this.getView().byId("inputbpcode").setValue("");
				this.getView().byId("inputaccountname").setValue("");
				this.getView().byId("inputbpcode").setEnabled(true);
				this.getView().byId("inputaccountname").setEnabled(true);
				this.getView().byId("inputwhsreceive").setEnabled(false);
			}else if (transtype === "6") {
				this.getView().byId("inputbpcode").setValue("");
				this.getView().byId("inputaccountname").setValue("");
				this.getView().byId("inputbpcode").setEnabled(true);
				this.getView().byId("inputaccountname").setEnabled(true);
				this.getView().byId("inputwhsissue").setEnabled(false);
				this.getView().byId("inputwhsreceive").setEnabled(true);
			} else {
				this.getView().byId("inputbpcode").setEnabled(true);
				this.getView().byId("inputaccountname").setEnabled(true);
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
			if (!this._oValueHelpDialogs) {
				Fragment.load({
					name: "com.apptech.bfi-businessunit.view.fragments.BPDialogFragment",
					controller: this
				}).then(function (oValueHelpDialogs) {
					this._oValueHelpDialogs = oValueHelpDialogs;
					this.getView().addDependent(this._oValueHelpDialogs);
					this.f_configValueHelpDialogs();
					this._oValueHelpDialogs.open();
				}.bind(this));
			} else {
				this.f_configValueHelpDialogs();
				this._oValueHelpDialogs.open();
			}
		},
		//GETTING ALL BP
		f_configValueHelpDialogs: function () {
			var sInputValue = this.byId("inputbpcode").getValue();
			if (this.oMdlAllBP.getData().allbp.length <= 0) {
			var TransType = this.oModel.getData().EditRecord.TransType;
					var customertype ="";
					if (TransType ==="6"){
						customertype = "S";
					}else{
						customertype = "C";
					}
				//GET ALL BP
				$.ajax({
					url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppBusinessUnit&queryTag=getallbp&value1="+ customertype +"&value2&value3&value4",
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
					url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppBusinessUnit&queryTag=getallitems&value1&value2&value3&value4",
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
		///Search on BP
		handleSearchBP: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("CardCode", FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},
		///Search on Issuing Whs
		handleSearchWhs: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("WhsCode", FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},
		///Search on Receiving Whs
		handleSearchWhsreceive: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("WhsCode", FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},
		///Search on Item
		handleSearchItem: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("ItemCode", FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
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
			this.getView().byId("inputaccountname").setValue(CardDetails[0].CardName);
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
			this.getView().byId("inputwhsissue").setValue(CardDetails[0].WhsCode);
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
			this.getView().byId("inputwhsreceive").setValue(CardDetails[0].WhsCode);
			this.oModel.refresh();
		},
		//Closing selection on Item
		handleValueHelpCloseItem: function (oEvent) {
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
			// this.getView().byId("inputitemnum").setValue(ItemDetails[0].ItemCode);
			this.oModel.refresh();
		},
		///GET Market Type
		f_getMarketPrice: function (ItemCode) {
			//GET MARKET PRICE
			var iReturnMarketPrice = 0;
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppBusinessUnit&queryTag=getMarketPrice&value1=" + ItemCode +
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
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppBusinessUnit&queryTag=getAveragePrice&value1=" + ItemCode +
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

		///ON VIEW SHOWING ALL DATA AND CHANGING NAME INTO EDIT
		onView: function (oEvent) {
			this.getView().byId("SaveDraft").setText("UPDATE DRAFT");
			this.triggercondition = "UPDATE DRAFT";
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
				dbName = "SBODEMOAU_SL";
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
					// if (xhr.status === 400) {
					// 	sap.m.MessageToast.show("Session End. Redirecting to Login Page..");
					// 	sap.ui.core.UIComponent.getRouterFor(this).navTo("Login");
					// }else{
					// 	sap.m.MessageToast.show(error);
					// }
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
					this.oModel.getData().EditRecord.BPName = results[0].CustomerName;
					this.oModel.getData().EditRecord.PostingDate = results[0].PostingDate;
					this.oModel.getData().EditRecord.TransType = results[0].TransType;
					this.oModel.getData().EditRecord.MarkupType = results[0].MarkupType;
					this.oModel.getData().EditRecord.IssueBU = results[0].IssueBU;
					this.oModel.getData().EditRecord.ReceiveBU = results[0].ReceiveBU;
					this.oModel.getData().EditRecord.Remarks = results[0].Remarks;

					// this.oModel.setJSON("{\"EditRecord\" : " + oResult + "}");

					var transtype = this.oModel.getData().EditRecord.TransType = results[0].TransType;
					if (transtype === "1") {
						this.getView().byId("inputwhsreceive").setEnabled(true);
						this.getView().byId("inputbpcode").setEnabled(false);
						this.getView().byId("inputaccountname").setEnabled(false);

					} else if (transtype === "2") {
						this.getView().byId("inputbpcode").setEnabled(true);
						this.getView().byId("inputaccountname").setEnabled(true);
						this.getView().byId("inputwhsreceive").setEnabled(false);

					} else if (transtype === "3") {
						this.getView().byId("inputbpcode").setEnabled(true);
						this.getView().byId("inputaccountname").setEnabled(true);
						this.getView().byId("inputwhsreceive").setEnabled(false);
					} else if (transtype === "4") {
						this.getView().byId("inputwhsreceive").setEnabled(true);
						this.getView().byId("inputbpcode").setEnabled(false);
						this.getView().byId("inputaccountname").setEnabled(false);
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
					sap.m.MessageToast.show(error);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results) {
					////	console.log(results);
					// var transtype = this.oModel.getData().EditRecord.DocumentLines.TransType = results[0].TransType;
					// if (transtype === "1") {
					// 	this.getView().byId("markupprice").setEnabled(false);
					// } else if (transtype === "2") {
					// 	this.getView().byId("inputbpcode").setEnabled(true);
					//      	this.getView().byId("inputaccountname").setEnabled(true);
					// 	this.getView().byId("inputwhsreceive").setEnabled(false);
					// }
					results.map(obj=> ({ ...obj, CostProdEnable: false }));
					this.oModel.getData().EditRecord.DocumentLines = results;
					this.oModel.refresh();

					//this.oModel.setJSON("{\"EditRecord/DocumentLines\" : " + JSON.stringify(results) + "}");

					

				}
			});
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
		////POSTING BU TO BU BUSINESS TYPE
		fBuToBu: function () {
			AppUI5.showBusyIndicator(4000);
			//Initialize Variables
			var oGoodsIssue = {};
			var oGoodsIssueHeader = {};
			oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
			oGoodsIssue.DocumentLines = [];
			///LOOP FOR THE DETAILS
			var d;
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
				// oGoodsIssueHeader.WarehouseCode = this.oModel.getData().EditRecord.IssueBU;
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
					sap.m.MessageToast.show(Message);
					AppUI5.hideBusyIndicator();
				},
				success: function (json) {
					//this.oPage.setBusy(false);
					sap.m.MessageToast.show("Added Successfully");
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

		fBuToCashSales: function () {
			//Initialize Variables
			AppUI5.showBusyIndicator(4000);
			var oGoodsIssue = {};
			var oGoodsIssueHeader = {};
			var ocardcode = this.oModel.getData().EditRecord.BPCode;
			oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
			oGoodsIssue.DocumentLines = [];
			///LOOP FOR THE DETAILS
			var d;
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
				// oGoodsIssueHeader.WarehouseCode = this.oModel.getData().EditRecord.IssueBU;
				oGoodsIssueHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
				oGoodsIssueHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
				oGoodsIssueHeader.UnitPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
				oGoodsIssue.DocumentLines.push(JSON.parse(JSON.stringify(oGoodsIssueHeader)));
			}
			$.ajax({
				url: "https://18.136.35.41:50000/b1s/v1/InventoryGenExits",
				type: "POST",
				data: JSON.stringify(oGoodsIssue),
				crossDomain: true,
                xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					sap.m.MessageToast.show(Message);
				},
				success: function (json) {
					this.fprepareTable(false,"");
					this.fClearField();
					this.oModel.refresh();
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
					oInvoice.DocumentLines = [];
					///HARD CODED ACCOUNT CODE FOR TESTING
					oInvoiceHeader.ItemDescription ="Testing";
					oInvoiceHeader.AccountCode ="102020";
					oInvoiceHeader.LineTotal =results.DocTotal;
					oInvoice.DocumentLines.push(JSON.parse(JSON.stringify(oInvoiceHeader)));

					$.ajax({
						url: "https://18.136.35.41:50000/b1s/v1/Invoices",
						type: "POST",
						data: JSON.stringify(oInvoice),
						crossDomain: true,
						xhrFields: {
							withCredentials: true
						},
						error: function (xhr, status, error) {
							var Message = xhr.responseJSON["error"].message.value;
							sap.m.MessageToast.show(Message);
							
						},
						success: function (json) {
							//this.oPage.setBusy(false);
							
							this.fprepareTable(false,"");
							this.fClearField();
							this.oModel.refresh();
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
									url: "https://18.136.35.41:50000/b1s/v1/IncomingPayments",
									type: "POST",
									data: JSON.stringify(oIncomingPayment),
									xhrFields: {
										withCredentials: true
									},
									error: function (xhr, status, error) {
										var Message = xhr.responseJSON["error"].message.value;
										sap.m.MessageToast.show(Message);
									},
									success: function (json) {
										//this.oPage.setBusy(false);
										sap.m.MessageToast.show("Successfully Added");
										this.fprepareTable(false,"");
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
		fBuToVale: function () {
			//Initialize Variables
			AppUI5.showBusyIndicator(4000);
			var oGoodsIssue = {};
			var oGoodsIssueHeader = {};
			var ocardcode = this.oModel.getData().EditRecord.BPCode;
			oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
			oGoodsIssue.DocumentLines = [];
			///LOOP FOR THE DETAILS
			var d;
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
				// oGoodsIssueHeader.WarehouseCode = this.oModel.getData().EditRecord.IssueBU;
				oGoodsIssueHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
				oGoodsIssueHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
				oGoodsIssueHeader.UnitPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
				oGoodsIssue.DocumentLines.push(JSON.parse(JSON.stringify(oGoodsIssueHeader)));
			}
			$.ajax({
				url: "https://18.136.35.41:50000/b1s/v1/InventoryGenExits",
				type: "POST",
				data: JSON.stringify(oGoodsIssue),
				crossDomain: true,
                xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					sap.m.MessageToast.show(Message);
					
				},
				success: function (json) {
					//this.oPage.setBusy(false);
					///sap.m.MessageToast.show("Posting of Goods Issue is Successful");
					this.fprepareTable(false,"");
					this.fClearField();
					this.oModel.refresh();
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
					oInvoice.DocumentLines = [];
					///HARD CODED ACCOUNT CODE FOR TESTING
					oInvoiceHeader.ItemDescription ="Testing";
					oInvoiceHeader.AccountCode ="102020";
					oInvoiceHeader.LineTotal =results.DocTotal;
					oInvoice.DocumentLines.push(JSON.parse(JSON.stringify(oInvoiceHeader)));
					$.ajax({
						url: "https://18.136.35.41:50000/b1s/v1/Invoices",
						type: "POST",
						data: JSON.stringify(oInvoice),
						crossDomain: true,
						xhrFields: {
							withCredentials: true
						},
						error: function (xhr, status, error) {
							var Message = xhr.responseJSON["error"].message.value;
							sap.m.MessageToast.show(Message);
							
						},
						success: function (json) {
							//this.oPage.setBusy(false);
							sap.m.MessageToast.show("Posting of Goods Issue is Successful");
							this.fprepareTable(false,"");
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
		fBUtoChargetoExpense: function () {
			AppUI5.showBusyIndicator(4000);
			//Initialize Variables
			var oGoodsIssue = {};
			var oGoodsIssueHeader = {};
			oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
			oGoodsIssue.DocumentLines = [];
			///LOOP FOR THE DETAILS
			var d;
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
				// oGoodsIssueHeader.WarehouseCode = this.oModel.getData().EditRecord.IssueBU;
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
					sap.m.MessageToast.show(Message);
					AppUI5.hideBusyIndicator();
				},
				success: function (json) {
					//this.oPage.setBusy(false);
					sap.m.MessageToast.show("Added Successfully");
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

		////POSTING ON BU TO INTER ORG ISSUE
		fBuToInterOrgIssue: function () {
			//Initialize Variables
			AppUI5.showBusyIndicator(4000);
			var oGoodsIssue = {};
			var oGoodsIssueHeader = {};
			var ocardcode = this.oModel.getData().EditRecord.BPCode;
			oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
			oGoodsIssue.DocumentLines = [];
			///LOOP FOR THE DETAILS
			var d;
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
				// oGoodsIssueHeader.WarehouseCode = this.oModel.getData().EditRecord.IssueBU;
				oGoodsIssueHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
				oGoodsIssueHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
				oGoodsIssueHeader.UnitPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;
				oGoodsIssue.DocumentLines.push(JSON.parse(JSON.stringify(oGoodsIssueHeader)));
			}
			$.ajax({
				url: "https://18.136.35.41:50000/b1s/v1/InventoryGenExits",
				type: "POST",
				data: JSON.stringify(oGoodsIssue),
				crossDomain: true,
                xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					sap.m.MessageToast.show(Message);
					
				},
				success: function (json) {
					//this.oPage.setBusy(false);
					///sap.m.MessageToast.show("Posting of Goods Issue is Successful");
					this.fprepareTable(false,"");
					this.fClearField();
					this.oModel.refresh();
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
					oInvoice.DocumentLines = [];
					
					
				
					
					///HARD CODED ACCOUNT CODE FOR TESTING
					oInvoiceHeader.ItemDescription ="Testing";
					oInvoiceHeader.AccountCode ="102020";
					oInvoiceHeader.LineTotal =results.DocTotal;
					oInvoice.DocumentLines.push(JSON.parse(JSON.stringify(oInvoiceHeader)));

					$.ajax({
						url: "https://18.136.35.41:50000/b1s/v1/Invoices",
						type: "POST",
						data: JSON.stringify(oInvoice),
						crossDomain: true,
						xhrFields: {
							withCredentials: true
						},
						error: function (xhr, status, error) {
							var Message = xhr.responseJSON["error"].message.value;
							sap.m.MessageToast.show(Message);
							
						},
						success: function (json) {
							//this.oPage.setBusy(false);
							sap.m.MessageToast.show("Posting of Goods Issue is Successful");
							this.fprepareTable(false,"");
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
		///POSTING ON BU TO INTER ORG ISSUE
		fBuToInterOrgReceipt: function () {
			AppUI5.showBusyIndicator(4000);
			//Initialize Variables
			var oInvoice = {};
			var oGoodsIssue = {};
			var oInvoiceHeader = {};
			var oGoodsIssueHeader = {};
			oInvoice.CardCode = this.oModel.getData().EditRecord.BPCode;
			oInvoice.Comments = this.oModel.getData().EditRecord.Remarks;
			oInvoice.DocumentLines = [];
			oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
			oGoodsIssue.DocumentLines = [];
			///LOOP FOR THE DETAILS
			var d;
			for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
				///Goods Receipt Details
				oInvoiceHeader.WarehouseCode = this.oModel.getData().EditRecord.ReceiveBU;
				oInvoiceHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
				oInvoiceHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
				oInvoiceHeader.UnitPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice; //adjustment
				///Goods Issue Details
				// oGoodsIssueHeader.WarehouseCode = this.oModel.getData().EditRecord.IssueBU;
				oGoodsIssueHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
				oGoodsIssueHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
				oGoodsIssueHeader.UnitPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;

				oInvoice.DocumentLines.push(JSON.parse(JSON.stringify(oInvoiceHeader)));
				oGoodsIssue.DocumentLines.push(JSON.parse(JSON.stringify(oGoodsIssueHeader)));
			}

			var batchArray = [
				//directly insert data if data is single row per table 
				{
					"tableName": "PurchaseInvoices",
					"data": oInvoice
				}
			];

			batchArray.push(JSON.parse(JSON.stringify(({
				"tableName": "InventoryGenEntries",
				"data": oGoodsIssue
			}))));

			var sBodyRequest = this.fprepareBatchRequestBody(batchArray);
			//ajax call to SL
			$.ajax({

				url: "https://18.136.35.41:50000/b1s/v1/$batch",
				type: "POST",
				contentType: "multipart/mixed;boundary=a",
				data: sBodyRequest, //If batch, body data should not be JSON.stringified
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					sap.m.MessageToast.show(Message);
					AppUI5.hideBusyIndicator();
				},
				success: function (json) {
					//this.oPage.setBusy(false);
					sap.m.MessageToast.show("Added Successfully");
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
		/// Record Posting
		onAddRecords: function (oEvent) {
			var transtype = this.oModel.getData().EditRecord.TransType;
			var transno = this.oModel.getData().EditRecord.TransNo;
			var ostatus= "1";
			if (transtype === "") {
				sap.m.MessageToast.show("Please Select Transaction Type.");
			}  else if (transtype === "1" & transno === "") {
				/////Call BU to BU AND DRAFT transaction Function
				this.fAddDraftFunction(ostatus);
				this.fBuToBu();
				this.onAddMode();
			} else if (transtype === "1" & transno !== "") {
				/////Call BU to BU transaction Function
				this.fUpdatePending(ostatus)
				this.fBuToBu();
				this.onAddMode();
			} else if (transtype === "2" & transno === "") {
				/////Call Bu to Cash Sales AND DRAFT Function
				this.fAddDraftFunction(ostatus);
				this.fBuToCashSales();
				this.onAddMode();
			} else if (transtype === "2" & transno !== "") {
				/////Call Bu to Cash Sales Function
				this.fUpdatePending(ostatus)
				this.fBuToCashSales();
				this.onAddMode();
			} else if (transtype === "3" & transno === "") {
				/////Call Bu to Vale and Draft
				this.fAddDraftFunction(ostatus);
				this.fBuToVale();
				this.onAddMode();
			} else if (transtype === "3" & transno !== "") {
				/////Call Bu to Vale Function
				this.fUpdatePending(ostatus)
				this.fBuToVale();
				this.onAddMode();
			} else if (transtype === "4" & transno === "") {
				/////Call Bu to Charge to Expense and Draft
				this.fAddDraftFunction(ostatus);
				this.fBUtoChargetoExpense();
				this.onAddMode();
			} else if (transtype === "4" & transno !== "") {
				/////Call Bu to Charge to Expense Function
				this.fUpdatePending(ostatus)
				this.fBUtoChargetoExpense();
				this.onAddMode();
			} else if (transtype === "5" & transno === "") {
				/////Call Bu to Inter Org - ISSUE and Draft
				this.fAddDraftFunction(ostatus);
				this.fBuToInterOrgIssue();
			} else if (transtype === "5" & transno !== "") {
				/////Call Bu to Inter Org - ISSUEFunction
				this.fUpdatePending(ostatus)
				this.fBuToInterOrgIssue();
				this.onAddMode();
			} else if (transtype === "6" & transno === "") {
				/////Call Bu to Inter Org - Receipt and Draft
				this.fAddDraftFunction(ostatus);
				this.fBuToInterOrgReceipt();
				this.onAddMode();
			} else if (transtype === "6" & transno !== "") {
				/////Call Bu to Inter Org Receipt Function
				this.fBuToInterOrgReceipt();
				this.onAddMode();
			}
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
		////UPDATE  
		fonUpdateDraft: function () {
			AppUI5.showBusyIndicator(4000);
			//GET MARKET PRICE
			var TransNo = this.oModel.getData().EditRecord.TransNo;
			var TransType = this.oModel.getData().EditRecord.TransType;
			$.ajax({
				url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppBusinessUnit&queryTag=deleteDraftDetails&value1=" +
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
			oBusiness_Unit.U_APP_TransDate = this.getTodaysDate();
			oBusiness_Unit.U_APP_CardCode = this.oModel.getData().EditRecord.BPCode;
			oBusiness_Unit.U_APP_CustomerName = this.oModel.getData().EditRecord.BPName;
			oBusiness_Unit.U_APP_PostingDate = this.oModel.getData().EditRecord.PostingDate;
			oBusiness_Unit.U_APP_MarkupType = this.oModel.getData().EditRecord.MarkupType;
			oBusiness_Unit.U_APP_IssueBU = this.oModel.getData().EditRecord.IssueBU;
			oBusiness_Unit.U_APP_ReceivingBU = this.oModel.getData().EditRecord.ReceiveBU;
			oBusiness_Unit.U_APP_Remarks = this.oModel.getData().EditRecord.Remarks;
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
				oBusiness_Unit_Details.U_APP_TransNo = TransNo;
				oBusiness_Unit_Details.U_APP_TransType = TransType;
				//	oBusiness_Unit_Details.APP_TransNo = this.getView().byId("TransNo").getValue();
				batchArray.push(JSON.parse(JSON.stringify(({
					"tableName": "U_APP_INT1",
					"data": oBusiness_Unit_Details
				}))));

			}
			var sBodyRequest = this.fprepareUpdateBatchRequestBody(BatchHeader, batchArray, getcode);
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
					sap.m.MessageToast.show(Message);
				},
				success: function (json) {
					sap.m.MessageToast.show("Draft Transaction Number '" + this.oModel.getData().EditRecord.TransNo + "' Has Been Updated!");

				},
				context: this
			}).done(function (results) {
				if (results) {
					this.fprepareTable(false,"");
					this.oModel.refresh();
				}
			});
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
		fUpdatePending: function (ostatus) {
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
			oBusiness_Unit.U_APP_TransDate = this.getTodaysDate();
			oBusiness_Unit.U_APP_CardCode = this.oModel.getData().EditRecord.BPCode;
			oBusiness_Unit.U_APP_CustomerName = this.oModel.getData().EditRecord.BPName;
			oBusiness_Unit.U_APP_PostingDate = this.oModel.getData().EditRecord.PostingDate;
			oBusiness_Unit.U_APP_MarkupType = this.oModel.getData().EditRecord.MarkupType;
			oBusiness_Unit.U_APP_IssueBU = this.oModel.getData().EditRecord.IssueBU;
			oBusiness_Unit.U_APP_ReceivingBU = this.oModel.getData().EditRecord.ReceiveBU;
			oBusiness_Unit.U_APP_Remarks = this.oModel.getData().EditRecord.Remarks;
			oBusiness_Unit.U_APP_Status = ostatus;
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
					sap.m.MessageToast.show(Message);
				},
				success: function (json) {
					sap.m.MessageToast.show("Transaction Number '" + this.oModel.getData().EditRecord.TransNo + "' Has Been Posted!");
				},
				context: this
			}).done(function (results) {
				if (results) {
					this.fprepareTable(false,"");
					this.oModel.refresh();
				}
			});
		}

		


  });
});
