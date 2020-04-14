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

    onInit: function () {
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
    // var urltag = "";
    // if (value1 ===""){
    //   urltag ="https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&QUERYTAG=getTransactions&VALUE1=&VALUE2=&VALUE3=&VALUE4=";
    // }else{
    //   urltag ="https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&QUERYTAG=getAllPendingRequest&VALUE1="+ value1 +"&VALUE2=1&VALUE3=&VALUE4=";
    
    // }
    $.ajax({
      url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName="+ this.sDataBase +"&procName=spAppBusinessUnit&QUERYTAG=getAllPendingRequest&VALUE1="+ value1 +"&VALUE2=1&VALUE3=&VALUE4=",
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
        sap.m.MessageToast.show(error);
      },
      success: function (json) {},
      context: this
    }).done(function (results) {
      if (results) {
        results.map(obj=> ({ ...obj, CostProdEnable: false }));
        this.oModel.getData().EditRecord.DocumentLines = results;
        this.oModel.refresh();
        //this.oModel.setJSON("{\"EditRecord/DocumentLines\" : " + JSON.stringify(results) + "}");

      }
    });
  }
  
  
  });
});
