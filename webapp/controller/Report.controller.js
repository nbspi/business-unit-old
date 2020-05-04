sap.ui.define([
  "sap/ui/core/BusyIndicator",
	"sap/ui/core/Element",
  "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"com/apptech/bfi-businessunit/controller/AppUI5",
	"sap/ui/model/FilterOperator"
], function(BusyIndicator,Element,Controller, JSONModel, Fragment, Filter, AppUI5, FilterOperatortroller) {
  "use strict";

  return Controller.extend("com.apptech.bfi-businessunit.controller.Report", {
    onInit: function () {
			//USER DATA

      var doc = new jsPDF()
      // It can parse html:
      doc.autoTable({ html: '#my-table' })
    
      // Or use javascript directly:
      doc.autoTable({
        head: [['Name', 'Email', 'Country']],
        body: [
          ['David', 'david@example.com', 'Sweden'],
          ['Castille', 'castille@example.com', 'Norway'],
          // ...
        ],
      })
    
      doc.save('table.pdf')
		}

  });
});
