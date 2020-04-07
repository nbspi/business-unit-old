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
      
        //TO STORED SELECTED ROW
        this.iSelectedRow = 0;
        //BLANK JSONMODEL FOR ALL ITEMS FOR TEMPLATE
        this.oMdlAllItems = new JSONModel();
        this.oMdlAllItems.getData().allitems = [];
       // Get DateToday
        this.getView().byId("transactiondate").setDateValue(new Date());
        ///Initialize model
        this.oModel = new JSONModel("model/request.json");
        this.getView().setModel(this.oModel);
        
    }


  });
});
