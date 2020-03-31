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
    
    onInit: function () {
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
    },
    //Preparing table
		fprepareTable: function (bIsInit,transType) {
			if (transType === ""){
				var transtypefilter = "";
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
			}
    },
    	///GETTING ALL THE THE TRANSACTION DATA/S
		fgetAllTransaction: function (transtypefilter) {
			var value1 = transtypefilter;
			var aReturnResult = [];
			var urltag = "";
			if (value1 ===""){
				urltag ="https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppBusinessUnit&QUERYTAG=getTransactions&VALUE1=&VALUE2=&VALUE3=&VALUE4=";
			}else{
				urltag ="https://18.136.35.41:4300/app_xsjs/ExecQuery.xsjs?dbName=SBODEMOAU_SL&procName=spAppBusinessUnit&QUERYTAG=getAllPendingTransaction&VALUE1="+ value1 +"&VALUE2=1&VALUE3=&VALUE4=";
			
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
				} else {
					aReturnResult = results;
				}
			});
			return aReturnResult;

		}


  });
});
