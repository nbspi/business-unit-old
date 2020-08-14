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
  return Controller.extend("com.apptech.bfi-businessunit.controller.Pendingrequest", {

    onRoutePatternMatched: function(event){
      this.fClearField();
      this.fprepareTable(false,"");
      this.oModel.refresh();
    },

    onInit: function () {
      ///ON LOAD
      var route = this.getOwnerComponent().getRouter().getRoute("Pendingrequest");
      route.attachPatternMatched(this.onRoutePatternMatched,this);

      //USER DATA
      this.sDataBase = jQuery.sap.storage.Storage.get("dataBase");
      this.sUserCode = jQuery.sap.storage.Storage.get("userCode");

      //getButtons
      this.oMdlButtons = new JSONModel();
      this.oResults = AppUI5.fGetButtons(this.sDataBase,this.sUserCode,"Pendingrequest");
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

      ///Initialize model
      this.oModel = new JSONModel("model/pendingrequest.json");
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

      //CPA
      this.currentFile = {}; //File Object
        //For Attachment File Name
      this.Attachment = "";
      //For Attachment File Key
      this.FileKey = null;

    },
    fprintGoodsIssue: function(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,ostatus,oDocType,oDetails,oAttachment,oAttachmentKey){

      //doc.text(20, 20, 'Biotech Farms Inc.(BFI)');
      doc.setFontSize(12)
      doc.text(77, 32, 'Bo.6,Banga, South Cotabato');

      doc.setFontSize(22)
      // doc.text(20,40, 'MATERIAL REQUESITION AND ISSUANCE SLIP');
      // doc.text(80,40, 'GOODS ISSUE');
      doc.text(77,50, 'GOODS ISSUE');
      
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

    // this.getView().byId("idIconTabBarInlineMode").getItems()[1].setText("Transaction No: " + TransNo + " [EDIT]");
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
          // this.getView().byId("fileUploader").setValue(results[0].Attachment);
          this.Attachment = results[0].Attachment;
          var oFileKey = results[0].Attachmentkey;
          if(oFileKey===""){
            this.FileKey = null;
          }else{
            this.FileKey = results[0].Attachmentkey;
          }
          var transtype = this.oModel.getData().EditRecord.TransType = results[0].TransType;
          if (transtype === "1") {
            this.getView().byId("inputwhsreceive").setEnabled(true);
            this.getView().byId("inputbpcode").setEnabled(false);
          } else if (transtype === "2") {
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
    onAddReceipt: function () {
      //INITIALIZE VARIABLES
        var transtype = this.oModel.getData().EditRecord.TransType;
        var transno = this.oModel.getData().EditRecord.TransNo;
        var oCardCode = this.oModel.getData().EditRecord.BPCode;
        var oPostingDate = this.oModel.getData().EditRecord.PostingDate;
        var oMarkupType = this.oModel.getData().EditRecord.MarkupType;
        var oIssueBU = this.oIssueBu;
        var oReceiveBU = this.oReceiveBu;
        var oRemarks = this.oModel.getData().EditRecord.Remarks;
        var oDetails = this.oModel.getData().EditRecord.DocumentLines;
        var oCountDetails = this.oModel.getData().EditRecord.DocumentLines.length;
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
          /////Call Bu to Charge to Expense and Draft
          this.fBUtoChargetoExpense(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey);
        }else if(transtype === "3"){
          /////Call Bu to Inter Org - ISSUE and Draft
          this.fBuToInterOrgIssue(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey);
        }else if(transtype === "4"){
          /////Call Bu to Inter Org - Receipt and Draft
          this.fBuToInterOrgReceipt(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey);
        }else if (transtype === "5") {
          /////Call Renewable Energy Transfer Function
          this.fRenewableEnergyTransfer(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey);
        }
    },
    ////POSTING BU TO BU BUSINESS TYPE
    fBuToBu: function (transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey) {
      AppUI5.showBusyIndicator(10000);
      //Initialize Variables
      var ostatus= "1";
      var oDocType ="Goods Issue";
      var oGoodsIssue = {};
      var oGoodsIssueHeader = {};
      oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
      oGoodsIssue.AttachmentEntry = oAttachmentKey;
      oGoodsIssue.U_APP_GI_TransType = "BU";
      oGoodsIssue.U_APP_BU_TransNum = this.oModel.getData().EditRecord.TransNo;
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
      AppUI5.showBusyIndicator(10000);
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
        url: "https://18.136.35.41:50000/b1s/v1/InventoryGenExits",
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
          oInvoiceHeader.AccountCode ="4110101101";
          oInvoiceHeader.TaxCode = "GST-EO";
          oInvoiceHeader.LineTotal =results.DocTotal;
          oInvoice.DocumentLines.push(JSON.parse(JSON.stringify(oInvoiceHeader)));

          $.ajax({
            url: "https://18.136.35.41:50000/b1s/v1/Invoices",
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
                  url: "https://18.136.35.41:50000/b1s/v1/IncomingPayments",
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
                    this.fprintGoodsIssue(transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,ostatus,oDocType,oDetails,oAttachment,oAttachmentKey);
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
      AppUI5.showBusyIndicator(10000);
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
        url: "https://18.136.35.41:50000/b1s/v1/InventoryGenExits",
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
          oInvoiceHeader.AccountCode ="4110101101";
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
              AppUI5.fErrorLogs("OINV","Insert","null","null",Message,"Bu to Vale",this.sUserCode,"null",JSON.stringify(oInvoice));
              console.error(JSON.stringify(Message));
              sap.m.MessageToast.show(Message);

            },
            success: function (json) {
              //this.oPage.setBusy(false);
              //UPDATE RECORDS ON UDT
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
    ////POSTING ON BU TO CHARGE TO EXPENSE
    fBUtoChargetoExpense: function (transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey) {
      AppUI5.showBusyIndicator(10000);
      //Initialize Variables
      var ostatus="2";
      var oDocType ="Goods Issue";
      var oGoodsIssue = {};
      var oGoodsIssueHeader = {};
      oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
      oGoodsIssue.AttachmentEntry = oAttachmentKey;
      oGoodsIssue.U_APP_GI_TransType = "BU";
      oGoodsIssue.U_APP_BU_TransNum = this.oModel.getData().EditRecord.TransNo;
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

        url: "https://18.136.35.41:50000/b1s/v1/InventoryGenExits",
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
      oGoodsIssue.AttachmentEntry = oAttachmentKey;
      oGoodsIssue.U_APP_GI_TransType = "BU";
      oGoodsIssue.U_APP_BU_TransNum = this.oModel.getData().EditRecord.TransNo;
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
        url: "https://18.136.35.41:50000/b1s/v1/InventoryGenExits",
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
          var oInvoice = {};
          var oInvoiceHeader = {};
          oInvoice.CardCode = ocardcode;
          oInvoice.DocType ="dDocument_Service";
          oInvoice.AttachmentEntry = oAttachmentKey;
          oInvoice.DocumentLines = [];
          ///HARD CODED ACCOUNT CODE FOR TESTING
          oInvoiceHeader.ItemDescription = oDescription;
          oInvoiceHeader.AccountCode ="4110101101";
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
              AppUI5.fErrorLogs("OINV","Insert","null","null",Message,"Inter Org Issue",this.sUserCode,"null",JSON.stringify(oInvoice));
              console.error(JSON.stringify(Message));
              sap.m.MessageToast.show(Message);

            },
            success: function (json) {
            //UPDATE RECORDS ON UDT
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
    ///POSTING ON BU TO INTER ORG ISSUE
    fBuToInterOrgReceipt: function (transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey) {
      AppUI5.showBusyIndicator(10000);
      //Initialize Variables
      var ostatus="2";
      var oDocType ="Goods Receipt/Purchase Invoices";
      var oInvoice = {};
      var oGoodsReceipt= {};
      var oInvoiceHeader = {};
      var oGoodsReceiptHeader = {};
      oInvoice.CardCode = this.oModel.getData().EditRecord.BPCode;
      oInvoice.Comments = this.oModel.getData().EditRecord.Remarks;
      oInvoice.DocumentLines = [];
      oGoodsReceipt.Comments = this.oModel.getData().EditRecord.Remarks;
      // oGoodsReceipt.U_APP_GR_TransType = "BU";
      oGoodsReceipt.DocumentLines = [];
      ///LOOP FOR THE DETAILS
      var d;
      for (d = 0; d < this.oModel.getData().EditRecord.DocumentLines.length; d++) {
        ///Goods Receipt Details
        oInvoiceHeader.WarehouseCode = this.oReceiveBu;
        oInvoiceHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
        oInvoiceHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
        oInvoiceHeader.UnitPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice; //adjustment

        ///Goods Issue Details
        oGoodsReceiptHeader.WarehouseCode = this.oReceiveBu;
        oGoodsReceiptHeader.ItemCode = this.oModel.getData().EditRecord.DocumentLines[d].ItemNum;
        oGoodsReceiptHeader.Quantity = this.oModel.getData().EditRecord.DocumentLines[d].Quantity;
        oGoodsReceiptHeader.UnitPrice = this.oModel.getData().EditRecord.DocumentLines[d].TransferPrice;

        oInvoice.DocumentLines.push(JSON.parse(JSON.stringify(oInvoiceHeader)));
        oGoodsReceipt.DocumentLines.push(JSON.parse(JSON.stringify(oGoodsReceiptHeader)));
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
        "data": oGoodsReceipt
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
            sap.m.MessageToast.show("Transaction Type "+ TransType +" Draft Has Been Created!");
            this.fClearField();
            this.oModel.refresh();
            AppUI5.hideBusyIndicator();
          }
        }
      });
    },
    ////POSTING Renewable Energy Transfer BUSINESS TYPE
    fRenewableEnergyTransfer: function (transtype,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails,oAttachment,oAttachmentKey) {
      AppUI5.showBusyIndicator(10000);
      //Initialize Variables
      var ostatus= "1";
      var oDocType ="Goods Issue";
      var oGoodsIssue = {};
      var oGoodsIssueHeader = {};
      oGoodsIssue.Comments = this.oModel.getData().EditRecord.Remarks;
      oGoodsIssue.U_APP_GI_TransType = "BU";
      oGoodsIssue.U_APP_BU_TransNum = this.oModel.getData().EditRecord.TransNo;
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
          //UPDATE RECORDS ON UDT
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

      var objectUDTDetails = "";

      //objectUDTDetails = oDetails;
      for (var i = 0; i < oDetails.length; i++) {
        objectUDTDetails = oDetails[i];
        batchRequest = batchRequest + "--b\nContent-Type:application/http\nContent-Transfer-Encoding:binary\n\n";
        batchRequest = batchRequest + "POST /b1s/v1/" + objectUDTDetails.tableName;
        batchRequest = batchRequest + "\nContent-Type: application/json\n\n";
        batchRequest = batchRequest + JSON.stringify(objectUDTDetails.data) + "\n\n";
      }
      batchRequest = batchRequest + endBatch;

      return batchRequest;

    },
    ////UPDATE  POSTED
    fUpdatePending: function (transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,ostatus,oDocType,oDetails,oAttachment,oAttachmentKey) {
      var TransNo = transno;
      var TransType = transtype;
      $.ajax({
        url: "https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=" + this.sDataBase + "&procName=spAppBusinessUnit&queryTag=deleteDraftDetails&value1=" +
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
      if(transtype === "4") {
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
    }

  });
});
