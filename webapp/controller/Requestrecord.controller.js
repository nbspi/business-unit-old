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
			this.oMdlAllItems.getData().allitems = [];
				// Get DateToday
			this.getView().byId("transactiondate").setDateValue(new Date());
      this.getView().byId("dpickerpostingdate").setDateValue(new Date());

			///Initialize model
			this.oModel = new JSONModel("model/requestrecord.json");
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
        url: "https://xs.biotechfarms.net/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&QUERYTAG=getAllFilteredRequest&VALUE1="+ value1 +"&VALUE2="+ value2 +"&VALUE3=&VALUE4=",
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

    },///ON VIEW SHOWING ALL DATA AND CHANGING NAME INTO EDIT
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

    /// this.getView().byId("idIconTabBarInlineMode").getItems()[1].setText("Transaction No: " + TransNo + " [EDIT]");
      var tab = this.getView().byId("idIconTabBarInlineMode");
      tab.setSelectedKey("tab2");
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
          var oDocStatus=results[0].Status;
          this.oModel.getData().EditRecord.ReceivedBy = this.sUserCode;
          // Disable Add Button if Status is Posted/Cancelled
          if(oDocStatus==="4" || oDocStatus==="5"){
            this.getView().byId("btnCancel").setEnabled(false);
            this.getView().byId("btnSendToRequest").setEnabled(false);
          }else if(oDocStatus==="3"){
            this.getView().byId("btnCancel").setEnabled(true);
            this.getView().byId("btnSendToRequest").setEnabled(true);
          }else{
            this.getView().byId("btnCancel").setEnabled(true);
            this.getView().byId("btnSendToRequest").setEnabled(true);
          }

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
					AppUI5.fErrorLogs("U_APP_OINT/U_APP_INT1","Update",TransNo,"null",oMessage,"Update",this.sUserCode,"null",sBodyRequest);
					sap.m.MessageToast.show(oMessage);
				}else{
					if (results) {
						sap.m.MessageToast.show("Request Has Been Cancelled!");
						this.fprepareTable(false,"");
						this.fClearField();
						this.oModel.refresh();
					
					}
				}
				
			});
    },
    ////UPDATE  POSTED
		onSendToRequest: function () {
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
			///HEADER BATCH
			var BatchHeader =
				//directly insert data if data is single row per table 
				{
					"tableName": "U_APP_OINT",
					"data": oBusiness_Unit
				};
			var sBodyRequest = this.fprepareUpdatePostedRequestBody(BatchHeader, getcode);
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
					AppUI5.fErrorLogs("U_APP_OINT/U_APP_INT1","Update",TransNo,"null",oMessage,"Update",this.sUserCode,"null",sBodyRequest);
					sap.m.MessageToast.show(oMessage);
				}else{
					if (results) {
						sap.m.MessageToast.show("Request Has Been Sent!");
						this.fprepareTable(false,"");
						this.fClearField();
						this.oModel.refresh();
					
					}
				}
				
			});
    }
  
  
  });
});
