sap.ui.define([ 
"sap/ui/core/mvc/Controller",
"sap/ui/model/json/JSONModel",
"sap/ui/core/Fragment",
"sap/ui/model/Filter",
"com/apptech/bfi-businessunit/controller/AppUI5",
"sap/ui/model/FilterOperator"
], function(Controller, JSONModel, Fragment, Filter, AppUI5, FilterOperator) {
  "use strict";

  return Controller.extend("com.apptech.bfi-businessunit.controller.Requestrecord", {
    onRoutePatternMatched: function(event){
      this.fClearField();
      this.fprepareTable(false,0);
      this.oMdlAllRecord.refresh();
    },
    onInit: function () {
      ///ON LOAD
		  var route = this.getOwnerComponent().getRouter().getRoute("Requestrecord");
		  route.attachPatternMatched(this.onRoutePatternMatched,this);
			//USER DATA
			this.sDataBase = jQuery.sap.storage.Storage.get("dataBase");
            this.sUserCode = jQuery.sap.storage.Storage.get("userCode");
      //getButtons
			this.oMdlButtons = new JSONModel();
			this.oResults = AppUI5.fGetButtons(this.sDataBase,this.sUserCode,"Requestrecord");
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
			this.oMdlAllItems.setSizeLimit(9999999);
            this.oMdlAllItems.getData().allitems = [];

				// Get DateToday
			this.getView().byId("transactiondate").setDateValue(new Date());
     	    this.getView().byId("dpickerpostingdate").setDateValue(new Date());

			///Initialize model
			this.oModel = new JSONModel("model/requestrecord.json");
			this.oModel.setSizeLimit(9999999);
			this.getView().setModel(this.oModel);

			//QPV 03-31-2021 BLANK JSONMODEL FOR ALL UOM FOR TEMPLATE 
			this.oMdlAllUom = new JSONModel();
			this.oMdlAllUom.setSizeLimit(9999999);
			this.oMdlAllUom.getData().alluom = [];

			
			//// INITIALIZE Variables FOR TABLE
			this.isClickedIssue = true;
			this.aCols = [];
			this.aColsDetails = [];
			this.columnData = [];
			this.columnDataDetail = [];
			this.oEditRecord = {};
			this.iRecordCount = 0;
			this.oIconTab = this.getView().byId("tab1");
			///Table ID
			this.oTableDetails = this.getView().byId("tblDetails");
			this.oMdlAllRecord = new JSONModel();
			this.tableId = "tblRecords";
			this.fprepareTable(true,"");
			this.gGetInventoryTransactionType();

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
      // var oTranstypefilter = this.getView().byId("transfilter").getSelectedKey();
      // var oStatus = this.getView().byId("TranStatus").getSelectedKey();
      this.fprepareTable("",0);
      this.oMdlAllRecord.refresh();
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
		var issueBU = this.oModel.getData().EditRecord.IssueBU;
		if (transtype === "0") {
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
		var count = 1;
		for (var i = 0; i < selectedIndeices.length; i++) {
			row = selectedIndeices[i];
			this.oModel.getData().EditRecord.DocumentLines.splice(row, 1);
			count = count + 1;
		}
		//Clearing Table Selection
		oTable.clearSelection();
		this.oModel.refresh();
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
    fprepareTable: function (bIsInit,transType) {
      var oTransTatus = this.getView().byId("TranStatus").getSelectedKey();
      if (transType === ""){
        var transtypefilter = "1";
      }else{
        var transtypefilter = this.getView().byId("transfilter").getSelectedKey();
      }
      var aResults;
      if (transtypefilter === ""){
        aResults = this.fgetAllTransaction(transtypefilter,oTransTatus);
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
        aResults = this.fgetAllTransaction(transtypefilter,oTransTatus);
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
        var table = this.getView().byId(this.tableId);
        var oModel1 = new sap.ui.model.json.JSONModel();
        var data =[];
        this.oMdlAllRecord.setData(data);
        table.setModel(this.oMdlAllRecord, "odata");
      }
    },
    ///GETTING ALL THE THE TRANSACTION DATA/S
    fgetAllTransaction: function (transtypefilter,oTransTatus) {
      var value1 = transtypefilter;
      var value2 = oTransTatus;
      var aReturnResult = [];
      $.ajax({
        url: "https://xsjs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&QUERYTAG=getAllFilteredRequest&VALUE1="+ value1 +"&VALUE2="+ value2 +"&VALUE3=&VALUE4=",
        type: "GET",
        async: false,
        datatype:"json",
        beforeSend: function (xhr) {
          xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:Qwerty0987"));
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

    },///ON VIEW SHOWING ALL DATA AND CHANGING NAME INTO EDIT
    onView: function (oEvent) {
		var iIndex = this.oTable.getSelectedIndex();
		var TransNo = "";
		var TransType = "";
		var oDocStatus = "";
		if (iIndex !== -1) {
			var oRowSelected = this.oTable.getBinding().getModel().getData().rows[this.oTable.getBinding().aIndices[iIndex]];
			TransNo = oRowSelected.U_APP_TransNo;
			TransType = oRowSelected.U_APP_TransType;
			oDocStatus = oRowSelected.U_APP_DocType;
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
		var oitemdetails = {};
		if(TransType === "3"){
			//this.getView().byId("ItemNum").setEnabled(true);
			oitemdetails.IsItemNumEnabled = true;
			oitemdetails.IsQuantityEnabled = true;
		}else{
			oitemdetails.IsItemNumEnabled = false;
			oitemdetails.IsQuantityEnabled = false;
		}

		if(oDocStatus==="Cancelled"){
			this.getView().byId("btnCancel").setEnabled(false);
		}else{
			this.getView().byId("btnCancel").setEnabled(true);
		}
      	this.oModel.getData().EditRecord.DocumentLines.push(oitemdetails);
		this.oModel.refresh();
		

    /// this.getView().byId("idIconTabBarInlineMode").getItems()[1].setText("Transaction No: " + TransNo + " [EDIT]");
		var tab = this.getView().byId("idIconTabBarInlineMode");
		tab.setSelectedKey("tab2");
    },
    //Generic selecting of data
    fgetHeader: function (dbName, procName, queryTag, value1, value2, value3, value4) {
      //get all open AP base on parameters
      $.ajax({
        url: "https://xsjs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName=" + dbName + "&procName=spAppBusinessUnit&QUERYTAG=" + queryTag + "&VALUE1=" + value1 +
          "&VALUE2=" + value2 + "&VALUE3=" + value3 + "&VALUE4=",
        type: "GET",
        datatype:"json",
        beforeSend: function(xhr){
          xhr.setRequestHeader("Authorization","Basic " + btoa("SYSTEM:Qwerty0987"));
        },
        error: function (xhr, status, error) {
          console.error(JSON.stringify(xhr));
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
		  this.oModel.getData().EditRecord.BusinessUnit = results[0].BusinessUnit;
		  //QPV 09-07-2021
          this.oModel.getData().EditRecord.InventoryTransactionType = results[0].InventoryTransactionType;
		  var isPostedGI = (results[0].IsPostedGI === "Y" ? false:true)
          var oDocStatus=results[0].Status;
          this.oModel.getData().EditRecord.ReceivedBy = this.sUserCode;
          // Disable Add Button if Status is Posted/Cancelled
          if(oDocStatus==="4" || oDocStatus==="5"){
            this.getView().byId("btnCancel").setEnabled(false);
            this.getView().byId("btnSendToRequest").setEnabled(false);
          }else{
            this.getView().byId("btnCancel").setEnabled(true);
            this.getView().byId("btnSendToRequest").setEnabled(true);
		  }
		//   this.getView().byId("btnCancel").setEnabled(isPostedGI)

          //disable textfield depends on transaction type
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
        url: "https://xsjs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName=" + dbName + "&procName=spAppBusinessUnit&QUERYTAG=" + queryTag + "&VALUE1=" + value1 +
          "&VALUE2=" + value2 + "&VALUE3=" + value3 + "&VALUE4=",
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
          results.map(obj=> ({ ...obj, CostProdEnable: false }));
          this.oModel.getData().EditRecord.DocumentLines = results;
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
  	////CANCELL  POSTED
	onCancel: function () {
		AppUI5.showBusyIndicator(10000);
		var ostatus ="5";
		var oDocType ="Cancelled";
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
		oBusiness_Unit.U_APP_DocType = oDocType;
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
			url: "https://sl-eut.biotechfarms.net/b1s/v1/$batch",
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
					sap.m.MessageToast.show("Request Has Been Cancelled!");
					this.fprepareTable(false,"");
					this.fClearField();
					this.oModel.refresh();
					AppUI5.hideBusyIndicator();
				}
			}
		});
    },
    ////UPDATE  POSTED
	onSendToRequest: function () {
		AppUI5.showBusyIndicator(10000);
		var ostatus ="4";
		var oDocType ="Request";
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
		oBusiness_Unit.U_APP_DocType = oDocType;
		oBusiness_Unit.U_APP_ReceivedBy = this.sUserCode;
		oBusiness_Unit.U_APP_RequestToBusinessUnit = this.oModel.getData().EditRecord.BusinessUnit;
		//QPV 09-07-2021
		oBusiness_Unit.U_APP_InventoryTransactionType = this.oModel.getData().EditRecord.InventoryTransactionType;
		///HEADER BATCH
		var BatchHeader =
			//directly insert data if data is single row per table 
			{
				"tableName": "U_APP_OINT",
				"data": oBusiness_Unit
			};
		var sBodyRequest = this.fprepareUpdatePostedRequestBody(BatchHeader, getcode);
		$.ajax({
			url: "https://sl-eut.biotechfarms.net/b1s/v1/$batch",
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
					sap.m.MessageToast.show("Request Has Been Sent!");
					this.fprepareTable(false,"");
					this.fClearField();
					this.oModel.refresh();
					AppUI5.hideBusyIndicator();
				}
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
		//	if (this.oModel.getData().AllItems.length <= 1) {
				//GET ALL ITEMS
				$.ajax({
					url: "https://xsjs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getallitems&value1&value2&value3&value4",
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
		//	}

			var aList = this.oMdlAllItems.getProperty("/allitems");
			aList.forEach(function (oRecord) {
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
		this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].Uom = ItemDetails[0].InventoryUom;
		this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].UomEntry = ItemDetails[0].UomEntry;
		if(transtype === "4"){
			var oCostToProduce =this.f_getAveragePrice(ItemDetails[0].ItemCode,receivebu);
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].CostProd = this.f_getAveragePrice(ItemDetails[0].ItemCode,receivebu);
		}else{
			var oCostToProduce =this.f_getAveragePrice(ItemDetails[0].ItemCode,issuebu);
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].CostProd = this.f_getAveragePrice(ItemDetails[0].ItemCode,issuebu);
		}
		// this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].MarketPrice = this.f_getMarketPrice(ItemDetails[0].ItemCode);
		var oMarketPrice = this.f_getMarketPrice(ItemDetails[0].ItemCode);

		if (transtype === "1") {
			this.oModel.getData().EditRecord.DocumentLines[this.iSelectedRow].MarketPrice = this.f_getMarketPrice(ItemDetails[0].ItemCode);
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

		///GET Market Type
	f_getMarketPrice: function (ItemCode) {
		var iReturnMarketPrice = 0;
		$.ajax({
			url: "https://xsjs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getMarketPrice&value1=" + ItemCode +
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
			url: "https://xsjs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getAveragePrice&value1=" + ItemCode +
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


	
	//QPV 09-07-2021
	gGetInventoryTransactionType: function(){
		$.ajax({
			url: "https://xsjs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&queryTag=getInventoryTransactionType&value1&value2&value3&value4",
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
				this.oModel.getData().InventoryTransactionType = results;
				this.oModel.refresh();
			}
		});
	},
  });
});
