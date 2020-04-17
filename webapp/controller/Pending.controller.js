sap.ui.define([
  "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"com/apptech/bfi-businessunit/controller/AppUI5",
	"sap/ui/model/FilterOperator"
], function(Controller, JSONModel, Fragment, Filter, AppUI5, FilterOperator) {
  "use strict";

  return Controller.extend("com.apptech.bfi-businessunit.controller.Pending", {
    _data: {
		"date": new Date()
	},
	onRoutePatternMatched: function(event){
		this.fprepareTable(false,"");
		this.oModel.refresh();
		},

    onInit: function () {
		  ///ON LOAD
		  var route = this.getOwnerComponent().getRouter().getRoute("Pending");
		  route.attachPatternMatched(this.onRoutePatternMatched,this);
			//USER DATA
			this.sDataBase = jQuery.sap.storage.Storage.get("dataBase");
			this.sUserCode = jQuery.sap.storage.Storage.get("userCode");

			//TO STORED SELECTED ROW
			this.iSelectedRow = 0;
			//BLANK JSONMODEL FOR ALL ITEMS FOR TEMPLATE
			this.oMdlAllItems = new JSONModel();
			this.oMdlAllItems.getData().allitems = [];
				// Get DateToday
			this.getView().byId("transactiondate").setDateValue(new Date());

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
			this.fprepareTable(true,"");

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
					this.oModel.getData().EditRecord.Remarks = results[0].Remarks;
					this.oModel.getData().EditRecord.ReceivedBy = this.sUserCode;
					// this.oModel.setJSON("{\"EditRecord\" : " + oResult + "}");

					var transtype = this.oModel.getData().EditRecord.TransType = results[0].TransType;
					if (transtype === "1") {
						this.getView().byId("inputwhsreceive").setEnabled(true);
						this.getView().byId("inputbpcode").setEnabled(false);

					} else if (transtype === "2") {
						this.getView().byId("inputbpcode").setEnabled(true);
						this.getView().byId("inputwhsreceive").setEnabled(false);

					} else if (transtype === "3") {
						this.getView().byId("inputbpcode").setEnabled(true);
						this.getView().byId("inputwhsreceive").setEnabled(false);
					} else if (transtype === "4") {
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

		///Search on Item
		handleSearchItem: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("ItemCode", FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
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
				}else if (transtype === "2") {
					this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
				} else if (transtype === "3") {
					this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
				} else if (transtype === "4") {
					this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
				}else if (transtype === "5") {
					///for revise
					this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
				}else if (transtype === "6") {
					///for revise
					this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].TransferPrice = oCostToProduce;
				}
				this.oModel.refresh();
			},
			////POSTING BU TO BU BUSINESS TYPE
			fAddReceipt: function () {
				AppUI5.showBusyIndicator(4000);
				//Initialize Variables
				var oGoodsReceipt = {};
				var oGoodsReceiptHeader = {};
				//oGoodsReceipt.CardCode = this.oModel.getData().EditRecord.BPCode;
				oGoodsReceipt.Comments = this.oModel.getData().EditRecord.Remarks;
				oGoodsReceipt.DocumentLines = [];
				///LOOP FOR THE DETAILS
				var d;
				for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
					// oGoodsIssueHeader.WarehouseCode = this.oModel.getData().EditRecord.IssueBU;
					oGoodsReceiptHeader.WarehouseCode = this.oModel.getData().EditRecord.IssueBU;
					oGoodsReceiptHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
					oGoodsReceiptHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
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
						sap.m.MessageToast.show("Added Successfully");
						this.fUpdatePending();
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
				this.fAddReceipt();
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
			var ostatus ="2";
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
			oBusiness_Unit.U_APP_IssueBU = this.oModel.getData().EditRecord.IssueBU;
			oBusiness_Unit.U_APP_ReceivingBU = this.oModel.getData().EditRecord.ReceiveBU;
			oBusiness_Unit.U_APP_Remarks = this.oModel.getData().EditRecord.Remarks;
			oBusiness_Unit.U_APP_Status = ostatus;
			oBusiness_Unit.U_APP_ReceivedBy = this.sUserCode;
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
					//	sap.m.MessageToast.show("Transaction Type "+ TransType +" Draft Has Been Created!");
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
