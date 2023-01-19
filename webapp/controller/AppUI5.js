sap.ui.define([
	"sap/ui/core/BusyIndicator",
	"sap/m/MessageBox"
], function (BusyIndicator,MessageBox) {
	"use strict";
	var doc = new jsPDF();
	return ("com.apptech.bfi-businessunit.controller.AppUI5",{

		/*
		Guide on improving Apptech JS library:
		1. Make sure that all functions are independent to the your app. Always use method parameters to get necessary data.
		2. Always return a value; and don't interact with the calling js.
		*/
		/*
		Generic function helper to create table.
		@@ params : Table Name
					Table Description
					Table Type  - ("bott_Document","bott_DocumentLines",
									"bott_MasterData","bott_MasterDataLines",
									"bott_NoObject","bott_NoObjectAutoIncrement")
		*/
		createTable: function (sTableName, sDescription, sTableType) {
			var tableInfo = {};
			tableInfo.TableName = sTableName;
			tableInfo.TableDescription = sDescription;
			tableInfo.TableType = sTableType;

			var stringTableInfo = JSON.stringify(tableInfo);
			$.ajax({
				url: "https://18.141.110.57:50000/b1s/v1/UserTablesMD",
				data: stringTableInfo,
				type: "POST",
				async: false,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					return error;
				},
				success: function (json) {
					return 0;
				},
				context: this
			});

		},

		/*
		Generic function helper to create field.
		@@ params : Field Name
					Field Description
					Table Name - ex. "@APP_OAMS"
					Field Type - ("db_Alpha", "db_Date","db_Float","db_Memo","db_Numeric")
					Field SubType - ("st_Percentage", "st_Price", "st_Quantity", "st_Rate", "st_Sum", "st_Image")
					Character Size
		*/
		createField: function (sFieldName, sDescription, sTableName, sType, sSubType, iSize) {
			var oFieldInfo = {};
			if (sFieldName === undefined || sDescription === undefined || sTableName === undefined) {
				return -1;
			}

			oFieldInfo.Description = sDescription;
			oFieldInfo.Name = sFieldName;
			oFieldInfo.TableName = sTableName;
			oFieldInfo.Type = sType;

			if (iSize === undefined || sType === "db_Numeric") {
				iSize = 11;
			}

			oFieldInfo.EditSize = iSize;
			oFieldInfo.Size = iSize;

			if (sType === "db_Float" || (!sSubType === undefined)) {
				oFieldInfo.SubType = sSubType;
			}

			var dataString = JSON.stringify(oFieldInfo);

			$.ajax({
				url: "https://18.141.110.57:50000/b1s/v1/UserFieldsMD",
				data: dataString,
				type: "POST",
				async: false,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					return error;
				},
				success: function (json) {

					return 0;
				},
				context: this
			});

			return -1;

		},

		createMandatoryFields: function (sTableName) {
			// createField()
			this.createField("App_CreatedDate", "Created Date", sTableName, "db_Date", undefined, undefined);
			this.createField("App_CreatedBy", "Created By", sTableName, "db_Alpha", undefined, undefined);
			this.createField("App_UpdatedDate", "Updated Date", sTableName, "db_Date", undefined, undefined);
			this.createField("App_UpdatedBy", "Created By", sTableName, "db_Alpha", undefined, undefined);
			/*
			U_App_CreatedDate
			U_App_CreatedBy
			U_App_UpdatedDate
			U_App_UpdatedBy
			*/
		},

		generateUDTCode: function (docType) {

			var generatedCode = "";

			$.ajax({
				url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/ExecQuery.xsjs?dbName="+jQuery.sap.storage.Storage.get("dataBase")+"&procName=SPAPP_GENERATENUMBER&DocType="+ docType,
				type: "GET",
				async: false,
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:Qwerty0987"));
			  	},
				error: function (xhr, status, error) {
					sap.m.MessageToast.show(error);
				},
				success: function (json) {
					generatedCode = json[0][""];

				},
				context: this
			}).done(function (results) {
				if (results) {
					if (docType === "GetCode"){
						generatedCode = results[0][""];
					}else{
						generatedCode = results[0]["Code"];
					}
				}
			});
			return generatedCode;
		},

		generateDocNum: function (sTableName) {
			var docNum = 0;

			$.ajax({
				url: "/rexsjs/public/rexsjs/ExecQuery.xsjs?dbName=APP_RE&procName=SPAPP_RE_GETDOCNUM&tableName=" +
					sTableName,
				type: "GET",
				async: false,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					jQuery.sap.log.error("This should never have happened!");
				},
				success: function (json) {
					docNum = json[0][""];

				},
				context: this
			}).done(function (results) {
				if (results) {
					docNum = results[0][""];

				}
			});

			return docNum;
		},

		prepareBatchRequestBody: function (oRequest) {

			var batchRequest = "";

			var beginBatch = "--a\nContent-Type: multipart/mixed;boundary=b\n\n";
			var endBatch = "--b--\n--a--";

			batchRequest = batchRequest + beginBatch;

			var objectUDT = "";
			for (var i = 0; i < oRequest.length; i++) {

				objectUDT = oRequest[i];
				batchRequest = batchRequest + "--b\nContent-Type:application/http\nContent-Transfer-Encoding:binary\n\n";
				batchRequest = batchRequest + "POST /b1s/v1/" + objectUDT.tableName + "\n\n";
				//Commented 02/24/2020 due to bad format response
				//batchRequest = batchRequest + "\nContent-Type: application/json\n\n";
				batchRequest = batchRequest + JSON.stringify(objectUDT.data) + "\n\n";
			}

			batchRequest = batchRequest + endBatch;

			return batchRequest;

		},

		getTodaysDate: function () {
			var today = new Date();
			var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
			return date ;
		},

		replaceKeyJSON: function (keyToBeReplace, newKey, oJSON) {
			var strJSON = JSON.stringify(oJSON);
			strJSON = strJSON.replace(/\"keyToBeReplace":/g, "\"newKey\":");
			return JSON.parse(strJSON);
		},

		postData: function (oPostData, sURL) {
			var returnValue = 0;
			var res = {} ;
			$.ajax({
				url: "/rexsjs/public/rexsjs/PostData.xsjs?dbName=APP_RE",
				type: "POST",
				async: false,
				data: JSON.stringify(oPostData),
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					res.Result = "Failed";
					res.Cause = xhr.responseText;
					returnValue = res;
					jQuery.sap.log.error("error on AppUi5.postData() " + xhr.responseText);

				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results) {
					returnValue = 0;
				}
			});

			return returnValue;
		},

		getAllByColumn: function (tableName, columnName, columnValue) {
			var getAllByColumnURL = "/rexsjs/public/rexsjs/ExecQuery.xsjs?dbName=APP_RE&procName=SPAPP_RE_GETALLDATA_BYCOL&tableName=" +
				tableName + "&colName=" + columnName + "&colValue=" + columnValue;
			$.ajax({
				url: getAllByColumnURL,
				type: "GET",
				async: false,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					jQuery.sap.log.error("error on AppUi5.getAllByColumn() " + xhr.responseText);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results.length <= 0) {
					return results;
				}
			});
		},

		getDatePostingFormat: function (sDate) {
			var year = new Date(sDate).getYear() + 1900;
			var month = new Date(sDate).getMonth() + 1;
			var date = new Date(sDate).getDate();
			return month + "/" + date + "/" + year;
		},

		generateNumber: function (sDocType) {
			var generateNumberURL = "";
			switch (sDocType) {
			case "Quote":
				generateNumberURL = "/rexsjs/public/rexsjs/ExecQuery.xsjs?dbName=APP_RE&procName=SPAPP_RE_GENERATENUMBER&DocType=Quote";
				break;
			case "Reservation":
				generateNumberURL = "/rexsjs/public/rexsjs/ExecQuery.xsjs?dbName=APP_RE&procName=SPAPP_RE_GENERATENUMBER&DocType=Reservation";
				break;
			case "Contract":
				generateNumberURL = "/rexsjs/public/rexsjs/ExecQuery.xsjs?dbName=APP_RE&procName=SPAPP_RE_GENERATENUMBER&DocType=Contract";
				break;
			}
			var returnCode = [];
			$.ajax({
				url: generateNumberURL,
				type: "GET",
				async: false,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					jQuery.sap.log.error("error on AppUi5.generateNumber() " + xhr.responseText);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results.length > 0) {
					returnCode = results;
				} else {
					returnCode = [];
				}
			});

			return returnCode;
		},

		//Returning and array of all columns and rows for specific table in specified Key Column
		//If error, this will return empty array
		getAllDataByKeyAJAX: function (sTableName, sKeyCode, sQueryType) {
			var aReturnResult = [];
			$.ajax({
				url: "/rexsjs/public/rexsjs/ExecQuery.xsjs?dbName=APP_RE&procName=SPAPP_RE_GETALLDATA_BYKEY&tableName=" + sTableName +
					"&keyCode=" + sKeyCode + "&queryType=" + sQueryType,
				type: "GET",
				xhrFields: {
					withCredentials: true
				},
				async: false,
				error: function (xhr, status, error) {
					return [];
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

		getHANAData: function (sModule, sQueryType, sKey, sKey2) {
			var aReturnResult = [];
			var sURL = "/rexsjs/public/rexsjs/ExecQuery.xsjs?dbName=APP_RE&procName=SPAPP_RE_" + sModule + "&queryType=" + sQueryType +
				"&colValue=" + sKey + "&colValue=" + sKey2;
			$.ajax({
				url: sURL,
				type: "GET",
				async: false,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					aReturnResult = [];
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

		getAllDataByColAJAX: function (sTableName, sColName, sColValue, sQueryType) {
			var aReturnResult = [];
			$.ajax({
				url: "/rexsjs/public/rexsjs/ExecQuery.xsjs?dbName=APP_RE&procName=SPAPP_RE_GETALLDATA_BYCOL&tableName=" + sTableName +
					"&colName=" + sColName + "&colValue=" + sColValue + "&queryType=" + sQueryType,
				type: "GET",
				async: false,
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					aReturnResult = [];
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

		renameKey: function (obj, old_key, new_key) {
			if (old_key !== new_key) {
				Object.defineProperty(obj, new_key, Object.getOwnPropertyDescriptor(obj, old_key));
				delete obj[old_key];
			}
		},

		deleteKey: function(obj, delete_key){
			delete obj[delete_key];
		},

		addKey: function(obj, add_key, add_value){
			obj[add_key] = add_value;
		},


		///BUSY INDICATOR
		hideBusyIndicator : function() {
			BusyIndicator.hide();
		},

		showBusyIndicator : function (iDuration, iDelay) {
			BusyIndicator.show(iDelay);

			if (iDuration && iDuration > 0) {
				if (this._sTimeoutId) {
					clearTimeout(this._sTimeoutId);
					this._sTimeoutId = null;
				}

				this._sTimeoutId = setTimeout(function() {
					this.hideBusyIndicator();
				}.bind(this), iDuration);
			}
		},

		fErrorLogs: function (sTableAffected,sOperation,sKey1,sKey2,sErrorDesc,sProcess,sProcessBy,sKey3,sInputbody) {
			//var returnValue = 0;
			var oDate = this.getTodaysDate();
			var sCode = this.generateUDTCode("GetCode");
			var sBodyRequest = {};
			sBodyRequest.Code = sCode,
			sBodyRequest.Name = sCode,
			sBodyRequest.U_TableAffected = sTableAffected,
			sBodyRequest.U_Operation = sOperation,
			sBodyRequest.U_Key1 = sKey1,
			sBodyRequest.U_Key2 = sKey2,
			sBodyRequest.U_ErrorDesc = sErrorDesc,
			sBodyRequest.U_Process = sProcess,
			sBodyRequest.U_ProcessBy = sProcessBy,
			sBodyRequest.U_ProcessDate = oDate,
			sBodyRequest.U_Key3 = sKey3
			sBodyRequest.U_INPUTBODY = sInputbody

			$.ajax({
				url: "https://18.141.110.57:50000/b1s/v1/U_APP_ERRORLOGS",
				type: "POST",
				contentType: "multipart/mixed;boundary=a",
				data: JSON.stringify(sBodyRequest),
				xhrFields: {
					withCredentials: true
				},
				error: function (xhr, status, error) {
					console.error("Error on Error Logs");
				},
				success: function (json) {
					//sap.m.MessageToast.show("Success saving Batch: " + BatchCode );
				},
				context: this

			}).done(function (results) {
				if (results) {
					//
				}
			});
			//return returnValue;
		},
		//GET BUTTON
		fGetButtons: function(sDatabase,sUserCode,sModule){
			var aReturnResult = [];
			$.ajax({
				url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/ExecQuery.xsjs?dbName="+ sDatabase +"&procName=spAppBankIntegration&QUERYTAG=getButtons" +
				"&VALUE1="+ sUserCode +"&VALUE2="+ sModule +"&VALUE3=&VALUE4=",
				type: "GET",
				async: false,
				dataType: "json",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:Qwerty0987"));
				},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["error"].message.value;
					sap.m.MessageToast.show(Message);
				},
				success: function (json) {},
				context: this
			}).done(function (results) {
				if (results) {
					aReturnResult = results;
				}
			});
			return aReturnResult;
		},
		//NDC 07/08/2020
		//Goods Receipt
		fprintGoodsReceipt: function(oUserCode,transtype,transno,oCardCode,oPostingDate,oMarkupType,oIssueBU,oReceiveBU,oRemarks,oDetails){
			try {
				//doc.text(20, 20, 'Biotech Farms Inc.(BFI)');
			doc.setFontSize(12)
			doc.text(77, 32, 'Bo.6,Banga, South Cotabato');
	
			doc.setFontSize(22)
			// doc.text(20,40, 'MATERIAL REQUESITION AND ISSUANCE SLIP');
			// doc.text(80,40, 'GOODS ISSUE');
			doc.text(77,50, 'GOODS RECEIPT');
	
			var img = new Image()
			img.src = './css/BFI.jpg'
			doc.addImage(img, 'jpg', 85, 8, 40, 20)//margin, position, imgWidth, imgHeight
	
			doc.setFontSize(12)
			doc.text(150, 60, 'Date:________________');
			doc.text(166, 59, oPostingDate);
	
			doc.setFontSize(12)
			doc.text(20, 70, 'Transaction #: '+ transno +'');
			doc.text(20, 80, 'REQUESTOR: '+ oReceiveBU +'');
			doc.text(20, 90, 'PURPOSE: '+ oRemarks +'');
	
			var oModel  = oDetails;
			var columns = ["Item Code","Quantity","UOM","Description"];
			var data = [];
				for(var i=0;i<oModel.length;i++)
				{
						data[i]=[oModel[i].ItemNum,oModel[i].Quantity,oModel[i].UomCode,oModel[i].Description];
				}
			doc.autoTable(columns,data,{startY:100});
			doc.text(20, 170, 'REQUESTED BY:'+ oUserCode +'');
			doc.text(20, 180, 'APPROVED BY:____________________');
			doc.text(20, 190, 'RECEIVED BY:____________________');
			doc.text(120, 170, 'PREPARED BY:____________________');
			doc.text(120, 180, 'CHECKED BY:______________________');
			doc.text(120, 190, 'COUNTERED CHECK BY:______________');
			doc.output('Goods Receipt_'+ transno +'.pdf');
			doc.save('Goods Receipt_'+ transno +'.pdf');

			return true;
			} catch (error) {
				console.log("Error on printing GOODS RECEIPT.")
				//return false;
			}
		},
		fGenerateTransNum: function(sDataBase){
			var sGeneratedTransNo = ""
			$.ajax({
				url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/ExecQuery.xsjs?dbName="+ sDataBase +"&procName=spAppBusinessUnit&queryTag=getTransactionNumber&value1&value2&value3&value4",
				type: "GET",
				async: false,
				datatype:"json",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa("SYSTEM:Qwerty0987"));
			  	},
				error: function (xhr, status, error) {
					var Message = xhr.responseJSON["ErrorMessage"].message.value;
					console.error(JSON.stringify(Message));
					sap.m.MessageToast.show(Message);
					AppUI5.hideBusyIndicator();
				},
				success: function (json) {

				},
				context: this
			}).done(function (results) {
				if (results) {
					sGeneratedTransNo = results[0][""];
				}
			});
			return sGeneratedTransNo;
		},
		gGetArrayOfValues: function(oDB,oProc,oTag,oVal1,oVal2,oVal3,oVal4){
			var oValue = ""
			$.ajax({
				url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/ExecQuery.xsjs?dbName="+ oDB +"&procName="+ oProc +"&queryTag="+ oTag +
				"&value1="+ oVal1 +"&value2="+ oVal2 +"&value3="+ oVal3 +"&value4="+ oVal4 +"",
				type: "GET",
				datatype:"json",
				async: false,
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
					oValue = results;
				}
			});
			return oValue;
		},
		gGetValue: function(oDB,oProc,oTag,oVal1,oVal2,oVal3,oVal4){
			var oValue = ""
			$.ajax({
				url: "https://test-saphanav10.biotechfarms.net/xsjs/app_xsjs/ExecQuery.xsjs?dbName="+ oDB +"&procName="+ oProc +"&queryTag="+ oTag +
				"&value1="+ oVal1 +"&value2="+ oVal2 +"&value3="+ oVal3 +"&value4="+ oVal4 +"",
				type: "GET",
				datatype:"json",
				async: false,
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
					oValue = results[0].Value;
				}
			});
			return oValue;
		}


	});

});
