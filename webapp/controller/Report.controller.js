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
  var doc = new jsPDF();
  return Controller.extend("com.apptech.bfi-businessunit.controller.Report", {
    onInit: function () {
			//USER DATA
			this.oModel = new JSONModel("model/report.json");
			this.getView().setModel(this.oModel);
		},

		onPrint:function(){

			doc.text(20, 20, 'Biotech Farms Inc.(BFI)');
			doc.setFontSize(12)
			doc.text(20, 25, 'Bo.6,Banga, South Cotabato');

			doc.setFontSize(22)
			doc.text(20,40, 'MATERIAL REQUESITION AND ISSUANCE SLIP');
			doc.text(70,50, 'INTERNAL(MRISI)');

			doc.setFontSize(12)
			doc.text(150, 60, 'Date:________________');
			doc.text(166, 59, '03-10-2020');

			doc.setFontSize(12)
			doc.text(20, 80, 'REQUESTOR:WAREHOUSE 1');
			doc.text(20, 90, 'PURPOSE:WAREHOUSE 2');

			var oModel  = this.oModel.oData.Records;
				var columns = ["ID","Quantity","UOM","Description"];
				var data = [];
						for(var i=0;i<oModel.length;i++)
						{
								data[i]=[oModel[i].Id,oModel[i].quantity,oModel[i].uom,oModel[i].description];
						}
			doc.autoTable(columns,data,{startY:100});
			doc.output('Test.pdf');
			doc.save('Test.pdf');


		}

  });
});
