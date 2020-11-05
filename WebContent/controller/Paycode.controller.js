sap.ui.define([
'com/bnsf/eam/tne/controller/BaseController',
'com/bnsf/eam/tne/util/DateAndTimeConversion',
'com/bnsf/eam/tne/util/UserNameFormatter',
'com/bnsf/eam/tne/util/Validators',
'sap/ui/model/json/JSONModel',
'sap/m/MessageBox',
'com/bnsf/eam/tne/util/ServiceErrorHandler',
'com/bnsf/eam/tne/model/models'
], function(BaseController, DateAndTimeConversion, UserNameFormatter, Validators,JSONModel,MessageBox,ServiceErrorHandler,models) {
	"use strict";

	var PaycodeController = BaseController.extend("com.bnsf.eam.tne.controller.Paycode", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf system
		 */
		onInit : function () {	
			var oUiModel = this.getModel();
			this.setModel(oUiModel);

			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);


		},
		/**
		 * On route matched for Paycode screen
		 * Instantiates paycode tree table data,value helps
		 * @private
		 * @memberOf tne.paycode
		 * @returns null
		 */
		_onRouteMatched: function(oEvent){
			var that = this;
			var sRoute = oEvent.getParameter("name");			
			var oArgs = oEvent.getParameter("arguments").EmpID; 
			var viewLevel=this.getRouter().getTargets()._oLastDisplayedTarget._oTargetHandler._iCurrentViewLevel;
			if(sRoute == "Paycode"){				
				if(viewLevel != 2 )
//					this._initalizePaycodeScreen(oArgs);
					that._mCallMethod('initalizeScreen');
				else
//					this._preparePCTreeTableData();
					that._mCallMethod('preparePCTreeTableData');
			};
		},

		/**
		 * Generic method to route backend calls 
		 * Handles busy indicator and service errors
		 * @private
		 * @memberOf tne.paycode
		 * @returns boolean
		 */
		_mCallMethod :function(pMethod){
			var oController = this;
			var oDummyModel = sap.ui.getCore().getModel("userModel");	
			oDummyModel.fireRequestSent();
			var bStatus = null;
			oDummyModel.read('/ServerDetails', null,{}, true,
					function(oData, oResponse){
				try{
					switch(pMethod){
					case 'initalizeScreen':
						oController._initalizePaycodeScreen()
						break;
					case 'preparePCTreeTableData':
						oController._preparePCTreeTableData()
						break;
					case 'handleSaveDraft':
						oController._handleSaveDraft()
						break;
					case 'handleNext':
						oController._handleNext()
						break;

					}
					oDummyModel.fireRequestCompleted();
				}
				catch(e){
					oDummyModel.fireRequestCompleted();
					com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Paycode - I05015: Error handling Response in Dummy Service");
				};
			},
			function(error){
				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
				try{
					com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.paycode.msg.ConnectionFailuremsgHeader"),bundle.getText("tne.paycode.msg.PaycodeScreenErrorNumber"));
					oDummyModel.fireRequestCompleted(); 
				}
				catch(e){
					oDummyModel.fireRequestCompleted(); 
					com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Paycode - I03018: Error handling exception in Dummy Service");
				}
			});

		},
		/**
		 * Initialises the data for Paycode table on first time load		 
		 * @private
		 * @memberOf tne.paycode
		 * @returns null
		 */
		_initalizePaycodeScreen: function(oArgs){
			var oUiModel = this.getModel();
			var that =this;
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();	
			var oPaycodeDataModel  = sap.ui.getCore().getModel("oDataPaycodeScreenModel");

			//initialize parameters for service call
			var selectedGangTitle = oUiModel.getProperty("/selGang/id");		
			var userID = oUiModel.getProperty('/user/id');
			var selectedDateTime = oUiModel.getProperty("/selGang/workDate");
			selectedDateTime = new Date(selectedDateTime);  
			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);

			var oTreeTable = this.getView().byId("tne.paycode.TreeTable");

			oPaycodeDataModel.read("/PaycodeHeaderSet?$filter=(GangId eq '"+selectedGangTitle+"' and UserId eq '"+userID+"' and WorkDate eq datetime'"+vDate+"')" +
					"&$expand=NavPeople/NavAdditiveDetail,NavPeople/NavBaseTimePaycode",
					null,{}, false,
					function(oData, oResponse){
						try{		
							
							//format start end and work dates to negate time zone
							var aPaycodes  = oData.results[0];
							aPaycodes.WorkDate = DateAndTimeConversion.displayValueDate(aPaycodes.WorkDate.getTime());
							var aPCEmployees = aPaycodes.NavPeople.results;
							for(var i = 0; i < aPCEmployees.length; i++){
								var aBaseTime = aPCEmployees[i].NavBaseTimePaycode.results;
								var aAdditive = aPCEmployees[i].NavAdditiveDetail.results;
								aPCEmployees[i].WorkDate = DateAndTimeConversion.displayValueDate(aPCEmployees[i].WorkDate.getTime());
								aPCEmployees[i].StartDate = DateAndTimeConversion.displayValueDate(aPCEmployees[i].StartDate.getTime());
								aPCEmployees[i].EndDate = DateAndTimeConversion.displayValueDate(aPCEmployees[i].EndDate.getTime());
								for(var j = 0; j < aBaseTime.length; j++ ){
									aBaseTime[j].WorkDate = DateAndTimeConversion.displayValueDate(aBaseTime[j].WorkDate.getTime());
									aBaseTime[j].StartDate = DateAndTimeConversion.displayValueDate(aBaseTime[j].StartDate.getTime());
									aBaseTime[j].EndDate = aBaseTime[j].StartDate;
								};
								for(var k = 0; k < aAdditive.length; k++){
									aAdditive[k].WorkDate = DateAndTimeConversion.displayValueDate(aAdditive[k].WorkDate.getTime());
									aAdditive[k].StartDate = DateAndTimeConversion.displayValueDate(aAdditive[k].StartDate.getTime());
									aAdditive[k].EndDate = DateAndTimeConversion.displayValueDate(aAdditive[k].EndDate.getTime());
								};
							};
							
							oUiModel.setProperty("/selGang/paycodes", aPaycodes);
							that._preparePCTreeTableData();
							//Add method
						}catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Paycode - I03001: Error handling response in Get Paycode Service");
						};
					},
					function(error){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						try {
							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.paycode.msg.PaycodeReadErrorHeader"),bundle.getText("tne.paycode.msg.PaycodeScreenErrorNumber"));
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Paycodes - I05002: Error handling exception in Get Paycodes Service");		
						};
					}
			);			
		},

		/**
		 * Prepares the data for Paycode table after adding paycodes		 
		 * @private
		 * @memberOf tne.paycode
		 * @returns null
		 */
		_preparePCTreeTableData: function(){

			var oUiModel = this.getModel();
			var oTreeTable = this.getView().byId("tne.paycode.TreeTable");
			var arrayNavPeople = oUiModel.getProperty("/selGang/paycodes/NavPeople/results");
			//oUiModel.setProperty("/selGang/paycodes", aPaycodes);

			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();	

			//create default model Date value Help
			var oDateValueHelpModel = models.getSelectDateValueHelp();	
			oUiModel.setProperty("/selGang/valueHelp/DateRef", oDateValueHelpModel);	
			var oUiModel = this.getModel();
			var that = this;
			var oLocalModel = {	
					categories:[]				
			};

			var aL0Categories = [];

			//Constructing the local model object			
			for ( var iteratorEmp = 0; iteratorEmp < arrayNavPeople.length; iteratorEmp++) {
				var TotalTime = new Date(Date.UTC(1970, 0, 1,"00","00"));
				var TotalReg = 	new Date(Date.UTC(1970, 0, 1,"00","00"));
				var TotalOvt = 	new Date(Date.UTC(1970, 0, 1,"00","00"));
				var TotalExp = 0;
				

				//Object for Level 0
				var oEmployeeObj = {
						Name:"",
						Total: "",
						RegularHrs:"",
						OvrTimeHrs:"",
						Expense:"",
						categories:[],
						Level:"0",
						EmpReference: arrayNavPeople[iteratorEmp]
				}; 

				//Object for Level 1 - Time
				var oTimeObj = {
						Name:bundle.getText("tne.paycode.lbl.Time"),
						Total:"",
						RegularHrs:"",
						OvrTimeHrs:"",
						Expense: "-",
						categories: [],
						Level: "1",
						EmpReference: arrayNavPeople[iteratorEmp]
				};

				//Object for Level 1 - Expense
				var oExpenseObj = {
						Name:bundle.getText("tne.paycode.lbl.Expense"),
						Total:"",
						RegularHrs:"-",
						OvrTimeHrs:"-",
						Expense:"",
						categories: [],
						Level: "1",
						EmpReference: arrayNavPeople[iteratorEmp]
				};	


				var aL1Categories = [];
				var aTimeCategories = [];
				var aExpCategories = [];

				var EmpId = arrayNavPeople[iteratorEmp].EmpId;
				var firstName = arrayNavPeople[iteratorEmp].FirstName;	
				var middleName = arrayNavPeople[iteratorEmp].MiddleName;
				var lastName = 	arrayNavPeople[iteratorEmp].LastName;
				var Salutation = arrayNavPeople[iteratorEmp].Salutation;
				oEmployeeObj.Name = com.bnsf.eam.tne.util.UserNameFormatter.empNoWithAbbName(EmpId, firstName, middleName, lastName, Salutation, 50);				

				var arrayNavBaseTimePaycode = arrayNavPeople[iteratorEmp].NavBaseTimePaycode.results;
				var arrayNavAdditiveDetail = arrayNavPeople[iteratorEmp].NavAdditiveDetail.results;

				//get nodes for Level 2 entries - Time (Base time)
				for ( var BaseTime = 0; BaseTime < arrayNavBaseTimePaycode.length; BaseTime++) {
					var timeContent = {
							Name:"",
							Total: "",
							RegularHrs:"",
							OvrTimeHrs:"",
							Expense:"-",
							Level: "2",
					};
					var ActionFlag = arrayNavBaseTimePaycode[BaseTime].ActionFlag;
					if(ActionFlag != "D"){
						var PayCode = arrayNavBaseTimePaycode[BaseTime].Paycode;

						var PaycodeType = arrayNavBaseTimePaycode[BaseTime].PaycodeType;
						var OVReasonCode = arrayNavBaseTimePaycode[BaseTime].OTReasonCode;

						//call reference to set Over Time reason code to employee reference to the Employee Reference
						if(OVReasonCode != undefined || OVReasonCode != ""){											
							arrayNavBaseTimePaycode[BaseTime].OVReasonRef  = com.bnsf.eam.tne.util.FetchValueHelps.getOVReason(OVReasonCode);
						};							

						//call reference to paycode type and set the reference to the Employee Reference
						arrayNavBaseTimePaycode[BaseTime].PaycodeTypeRef = com.bnsf.eam.tne.util.FetchValueHelps.getPCType(PaycodeType);

						//call reference to paycode value help
						arrayNavBaseTimePaycode[BaseTime].PaycodeRef = com.bnsf.eam.tne.util.FetchValueHelps.getPaycode(PaycodeType, PayCode);
						arrayNavBaseTimePaycode[BaseTime].DateRef = oDateValueHelpModel;
						//arrayNavBaseTimePaycode[BaseTime].StartDate = DateAndTimeConversion.displayValueDate(arrayNavBaseTimePaycode[BaseTime].StartDate.getTime());
						//arrayNavBaseTimePaycode[BaseTime].EndDate = arrayNavBaseTimePaycode[BaseTime].StartDate;
						timeContent.Name = PayCode+" - "+ arrayNavBaseTimePaycode[BaseTime].PaycodeRef.Description;
						if(PaycodeType == "RE"){												
							var RegHours = new Date(Date.UTC(1970, 0, 1,arrayNavBaseTimePaycode[BaseTime].Hours,
									arrayNavBaseTimePaycode[BaseTime].Minutes));												
							timeContent.Total = RegHours;
							timeContent.RegularHrs = RegHours;	
							timeContent.OvrTimeHrs = "-";
							TotalTime = new Date(TotalTime.setTime(TotalTime.getTime() + RegHours.getTime()));																			
							TotalReg =  new Date(TotalReg.setTime(TotalReg.getTime() + RegHours.getTime()));

						}else{											
							var OvrTimeHrs = new Date(Date.UTC(1970, 0, 1, arrayNavBaseTimePaycode[BaseTime].Hours,
									arrayNavBaseTimePaycode[BaseTime].Minutes));											
							timeContent.Total = OvrTimeHrs;
							timeContent.RegularHrs = "-";
							timeContent.OvrTimeHrs = OvrTimeHrs;
							TotalTime = new Date(TotalTime.setTime(TotalTime.getTime() + OvrTimeHrs.getTime()));
							TotalOvt = new Date(TotalOvt.setTime(TotalOvt.getTime() + OvrTimeHrs.getTime()));										
						};
						//Createing EPOC Duration for Time Picker
						var durationSec = DateAndTimeConversion.convertHHmmToMilliSec(arrayNavBaseTimePaycode[BaseTime].Hours+arrayNavBaseTimePaycode[BaseTime].Minutes);
						var Duration = DateAndTimeConversion.displayValueDate(durationSec);
						arrayNavBaseTimePaycode[BaseTime].Duration = Duration;
						//Creating StartTime and End Time EPOC Formats
						arrayNavBaseTimePaycode[BaseTime].StEPOC = DateAndTimeConversion.displayValueDate(arrayNavBaseTimePaycode[BaseTime].StartTime.ms);
						arrayNavBaseTimePaycode[BaseTime].EtEPOC = DateAndTimeConversion.displayValueDate(arrayNavBaseTimePaycode[BaseTime].StartTime.ms+durationSec);
						
						
						aTimeCategories.push(timeContent);
					}
				};

				oTimeObj.Total = TotalTime;
				oTimeObj.RegularHrs = TotalReg;
				oTimeObj.OvrTimeHrs = TotalOvt;
				oTimeObj.categories = aTimeCategories;

				aL1Categories.push(oTimeObj);

				//get nodes for Level 2 entries - Expense (Additives)
				for ( var AddTime = 0; AddTime < arrayNavAdditiveDetail.length; AddTime++) {
					//TotalExp = arrayNavAdditiveDetail.length;
					var ExpenseContent = {
							Name:"",
							Total: 0,
							RegularHrs: "-",
							OvrTimeHrs: "-",
							Expense:0,	
							Level: "2",
					}
					var Action = arrayNavAdditiveDetail[AddTime].Action;
					if(Action != "D"){
						TotalExp = TotalExp+1;
						var payCodeExp = arrayNavAdditiveDetail[AddTime].Paycode;
						var payCodeExpType = arrayNavAdditiveDetail[AddTime].AdditiveType;

						//call reference to Exp type and set the reference to the Employee Reference
						arrayNavAdditiveDetail[AddTime].ExpenseTypeRef = com.bnsf.eam.tne.util.FetchValueHelps.getExpType(payCodeExpType);

						//call reference to Expense Paycodes value help
						arrayNavAdditiveDetail[AddTime].ExpenseRef = com.bnsf.eam.tne.util.FetchValueHelps.getExpense(payCodeExpType, payCodeExp);

						//call reference to Expense Paycodes value help
						//arrayNavAdditiveDetail[AddTime].ExpenseRef = com.bnsf.eam.tne.util.FetchValueHelps.getTravelCode(payCodeExpType);
						arrayNavAdditiveDetail[AddTime].DateRef = oDateValueHelpModel;
						
						ExpenseContent.Name = payCodeExp + " - " + arrayNavAdditiveDetail[AddTime].ExpenseRef.Description;
						var HoursExp = arrayNavAdditiveDetail[AddTime].Hours;
						var MilesExp = arrayNavAdditiveDetail[AddTime].Miles;
						if(HoursExp != "00"){
							var Expense = HoursExp;
							ExpenseContent.Total = parseInt(ExpenseContent.Total) + 1;
							ExpenseContent.Expense = parseInt(ExpenseContent.Expense) + 1;
						}else{
							var Expense = MilesExp;
							ExpenseContent.Total = parseInt(ExpenseContent.Total) + 1;
							ExpenseContent.Expense = parseInt(ExpenseContent.Expense) + 1;
						};

						aExpCategories.push(ExpenseContent);
					}
				};

				oExpenseObj.Expense = TotalExp;
				oExpenseObj.Total = TotalExp;
				oExpenseObj.categories = aExpCategories;	

				aL1Categories.push(oExpenseObj);

				oEmployeeObj.Total = TotalTime;
				oEmployeeObj.RegularHrs = TotalReg;
				oEmployeeObj.OvrTimeHrs = TotalOvt;
				oEmployeeObj.Expense = TotalExp;
				oEmployeeObj.categories = aL1Categories;

				aL0Categories.push(oEmployeeObj);	
			};		

			oLocalModel.categories = aL0Categories;
			oUiModel.setProperty("/selGang/pcTreeDisplay", oLocalModel);

//			************************ End of Tree Table Array ****************************************************************
		},

		/**
		 * called when user click on back button		 
		 * @private
		 * @memberOf tne.paycode
		 * @returns null
		 */
		handlePageExit:function(){
			this.onNavBack();	
		},
		onExpandFirstLevel: function () {
			var oTreeTable = this.getView().byId("tne.paycode.TreeTable");
			oTreeTable.expandToLevel(1);
		},

		onExpandAll: function () {
			var oTreeTable = this.getView().byId("tne.paycode.TreeTable");
			oTreeTable.expandToLevel(2);
		},

		onCollapseAll: function () {
			var oTreeTable = this.getView().byId("tne.paycode.TreeTable");
			oTreeTable.collapseAll();
		},




		/**
		 * called when user click on employee from paycode table
		 * Navigates to the PcEmployee Screen
		 * @private
		 * @memberOf tne.paycode
		 * @returns null
		 */
		handleLinkPress: function(oEvent){
			var oBindingContext=oEvent.getSource().getBindingContext();	
			var sPath = oBindingContext.sPath;
			var sEmpID = oEvent.getSource().getModel().getProperty(sPath).EmpReference.EmpId;	
			var sGangId = this.getModel().getProperty("/selGang/id");	
			var oSelectedDate = this.getModel().getProperty("/selGang/workDate");
			var start = sPath.lastIndexOf("/") + 1;			
			var indexPath = sPath.substring(start, sPath.length);	
			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(oSelectedDate);
				
			this.getRouter().navTo('PCEmployee',{GangId: sGangId, WorkDate: sFormattedDate, EmpID: indexPath},false);
		},

		/**
		 * called when user click on AddExpense button from Paycode screen footer
		 * if atleast one employee is selected will navigate to PcAddExp screen
		 * creates and sets the default model for New Expense
		 * @private
		 * @memberOf tne.paycode
		 * @returns null
		 */

		handleAddExpense: function(oEvent){
			var oTreeTable = this.getView().byId("tne.paycode.TreeTable");
			var rowsSelected = oTreeTable.getSelectedIndices();					
			var selEmp = [];
			if(rowsSelected.length!=0){
				var sGangId = this.getModel().getProperty("/selGang/id");	
				var oSelectedDate = this.getModel().getProperty("/selGang/workDate");
				var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(oSelectedDate);				
				for(var i=0; i<rowsSelected.length; i++){					
					var oBindingContext=oTreeTable.getRows()[oTreeTable.getSelectedIndices()[i]].getBindingContext();
					var sPath = oBindingContext.sPath;
					var selEmpReference = oTreeTable.getModel().getProperty(sPath).EmpReference;
					selEmp[i] = selEmpReference;
				};				
				var oPCAddExpMulEmpModel =  new JSONModel(selEmp)
				sap.ui.getCore().setModel(oPCAddExpMulEmpModel,"oPCAddExpMulEmpModel");

				//create default model for new expense
				var oAddExpenseDetailsModel = models.createPCExpenseModel(sGangId, oSelectedDate);
				//set expense model
				sap.ui.getCore().setModel(oAddExpenseDetailsModel, "oAddExpenseDetailsModel");

				this.getRouter().navTo('PCAddExp',{GangId: sGangId, WorkDate: sFormattedDate},false);	
			}else{
				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
				sap.m.MessageBox.show(
						bundle.getText("tne.paycode.misEmpSltd.AddExpCancMsg"), {
							icon: sap.m.MessageBox.Icon.QUESTION,
							title: bundle.getText("tne.paycode.misEmpSltd.AddExpCancTitle"),
							actions: [sap.m.MessageBox.Action.OK],

						}
				);
			};		

		},

		/**
		 * Creates a structure for Payload data for Paycode screen.
		 * @private
		 * @memberOf tne.paycode
		 * @returns array
		 */
		mStructureSave: function(oData){
			var aData = oData;
			var aNavPeople = [];

			for (var i = 0; i<aData.length; i++){

				var oPeople = {				
						Comments: "",
						Designation:"",
						EmpId:"",
						EndTime:"",
						FirstName:"",
						GangId:"",
						LastName:"",
						MiddleName:"",
						NavAdditiveDetail:[],
						NavBaseTimePaycode:[],
						PositionId:"",
						PositionName:"",
						RoleCode:"",
						Salutation:"",
						StartTime:" ",
						WorkDate:""

				};

				oPeople.Comments = aData[i].Comments;
				oPeople.Designation = aData[i].Designation;
				oPeople.EmpId = aData[i].EmpId;
				oPeople.EndTime = aData[i].EndTime;
				oPeople.FirstName = aData[i].FirstName;
				oPeople.GangId = aData[i].GangId;
				oPeople.LastName = aData[i].LastName;
				oPeople.MiddleName = aData[i].MiddleName;
				oPeople.NavAdditiveDetail = aData[i].NavAdditiveDetail.results;
				oPeople.NavBaseTimePaycode = aData[i].NavBaseTimePaycode.results;
				oPeople.PositionId = aData[i].PositionId;
				oPeople.PositionName = aData[i].PositionName;
				oPeople.RoleCode = aData[i].RoleCode;
				oPeople.Salutation = aData[i].Salutation;
				oPeople.StartTime = aData[i].StartTime;
				oPeople.WorkDate = aData[i].WorkDate;

				aNavPeople.push(oPeople);
			};

			return aNavPeople;


		},
		/**
		 * called when user click on Save Draft button from Paycode screen footer
		 * Generates Payload for Paycode screen and Post data to backend with create method.		 
		 * @private
		 * @memberOf tne.paycode
		 * @returns null
		 */
		handleSaveDraft: function(){
			this._mCallMethod('handleSaveDraft');
		},

		_handleSaveDraft: function(){
			var oTreeTable = this.getView().byId("tne.paycode.TreeTable");
			var rows = oTreeTable.getBinding("rows").getLength(); 			

			var PayloadEntries = 
			{
					DefaultCostCenter:"15495", //TODO:Remove hardcoding of cost center and read from local
					GangId:" ",
					NavPaycodeError:[],
					NavPeople:[],
					OperationResult:"",
					OperationResultMsg:"",
					OperationType:"",
					Submit:"",
					UserId:"",
					WorkDate:""
			};
			//PayloadEntries.DefaultCostCenter = this.getModel().getProperty("/selGang/defaultCostCenter");
			PayloadEntries.GangId = this.getModel().getProperty("/selGang/id");				
			var aNavPeopleActual =   this.getModel().getProperty("/selGang/paycodes/NavPeople/results");
			var aNavPeople = this.mStructureSave(aNavPeopleActual);

			for(var i = 0; i<aNavPeople.length; i++){

				var aNavAdditiveDetail  = aNavPeople[i].NavAdditiveDetail;				
				for(var j=0; j<aNavAdditiveDetail.length; j++){
					delete aNavPeople[i].NavAdditiveDetail[j].ExpenseRef;
					delete aNavPeople[i].NavAdditiveDetail[j].ExpenseTypeRef;
					delete aNavPeople[i].NavAdditiveDetail[j].DateRef;					
					delete aNavPeople[i].NavAdditiveDetail[j].__metadata;
				}

				var aNavBaseTimePaycode  = aNavPeople[i].NavBaseTimePaycode;				
				for(var k=0; k<aNavBaseTimePaycode.length; k++){
					delete aNavPeople[i].NavBaseTimePaycode[k].PaycodeRef;
					delete aNavPeople[i].NavBaseTimePaycode[k].PaycodeTypeRef;
					delete aNavPeople[i].NavBaseTimePaycode[k].OVReasonRef;
					delete aNavPeople[i].NavBaseTimePaycode[k].Duration;
					delete aNavPeople[i].NavBaseTimePaycode[k].StEPOC;
					delete aNavPeople[i].NavBaseTimePaycode[k].EtEPOC;
					delete aNavPeople[i].NavBaseTimePaycode[k].DateRef;
					delete aNavPeople[i].NavBaseTimePaycode[k].EndDate;
					delete aNavPeople[i].NavBaseTimePaycode[k].__metadata;					
				}				
				delete aNavPeople[i].__metadata;

			};

			PayloadEntries.NavPeople = aNavPeople;
			PayloadEntries.UserId = this.getModel().getProperty("/user/id");		
			PayloadEntries.WorkDate = this.getModel().getProperty("/selGang/workDate");	

			var oPaycodeDataModel  = sap.ui.getCore().getModel("oDataPaycodeScreenModel");
			oPaycodeDataModel.create("/PaycodeHeaderSet",PayloadEntries,null,					
					function(oData, oResponse){		
				try{
					var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
					sap.m.MessageBox.show(bundle.getText("tne.paycode.msg.DataUpdatedSuccessfully"), 
							sap.m.MessageBox.Icon.SUCCESS, 
							bundle.getText("tne.app.Success"),sap.m.MessageBox.Action.OK, null, null, 'dummyStyleClass');
				}catch (e) {	
					com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Paycode - I03013: Error handling response in Post Paycode Data");
				};
			},
			function(error){
				try{
					var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();						 			
					com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.paycode.msg.PaycodeUpdFailureMsgHeader"),bundle.getText("tne.paycode.msg.PaycodeScreenErrorNumber"));
				}catch (e) {										
					com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Paycode - I03014: Error handling exception in Post Paycode Data");
				};

			}
			);
		},

		_oNavTimeResults: function(){					
			var sGangId = this.getModel().getProperty("/selGang/id");	
			var oSelectedDate = this.getModel().getProperty("/selGang/workDate");			
			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(oSelectedDate);
			this.getRouter().navTo('TimeResults',{GangId: sGangId, WorkDate: sFormattedDate},false);
		},

		/**
		 * called when user click on Next button from Paycode screen footer
		 * Generates Payload for Paycode screen and Post data to backend with create method.		 
		 * @private
		 * @memberOf tne.paycode
		 * @returns null
		 */	
		handleNext: function(){
			this._mCallMethod('handleNext');
		},

		_handleNext: function(){
			var that = this;
			var oUiModel = that.getModel();
			var oTreeTable = this.getView().byId("tne.paycode.TreeTable");
			var rows = oTreeTable.getBinding("rows").getLength(); 			

			var PayloadEntries = 
			{
					DefaultCostCenter:"15495", //TODO:Remove hardcoding of cost center and read from local
					GangId:" ",
					NavPaycodeError:[],
					NavPeople:[],
					OperationResult:"",
					OperationResultMsg:"",
					OperationType:"",
					Submit:"X",
					UserId:"",
					WorkDate:""
			};
			//PayloadEntries.DefaultCostCenter = this.getModel().getProperty("/selGang/defaultCostCenter");
			PayloadEntries.GangId = this.getModel().getProperty("/selGang/id");				
			var aNavPeopleActual =   this.getModel().getProperty("/selGang/paycodes/NavPeople/results");
			var aNavPeople = this.mStructureSave(aNavPeopleActual);

			for(var i = 0; i<aNavPeople.length; i++){

				var aNavAdditiveDetail  = aNavPeople[i].NavAdditiveDetail;				
				for(var j=0; j<aNavAdditiveDetail.length; j++){
					delete aNavPeople[i].NavAdditiveDetail[j].ExpenseRef;
					delete aNavPeople[i].NavAdditiveDetail[j].ExpenseTypeRef;
					delete aNavPeople[i].NavAdditiveDetail[j].DateRef;					
					delete aNavPeople[i].NavAdditiveDetail[j].__metadata;
				}

				var aNavBaseTimePaycode  = aNavPeople[i].NavBaseTimePaycode;				
				for(var k=0; k<aNavBaseTimePaycode.length; k++){
					delete aNavPeople[i].NavBaseTimePaycode[k].PaycodeRef;
					delete aNavPeople[i].NavBaseTimePaycode[k].PaycodeTypeRef;
					delete aNavPeople[i].NavBaseTimePaycode[k].OVReasonRef;
					delete aNavPeople[i].NavBaseTimePaycode[k].Duration;
					delete aNavPeople[i].NavBaseTimePaycode[k].StEPOC;
					delete aNavPeople[i].NavBaseTimePaycode[k].EtEPOC;
					delete aNavPeople[i].NavBaseTimePaycode[k].DateRef;
					delete aNavPeople[i].NavBaseTimePaycode[k].EndDate;
					delete aNavPeople[i].NavBaseTimePaycode[k].__metadata;					
				}				
				delete aNavPeople[i].__metadata;

			};

			PayloadEntries.NavPeople = aNavPeople;
			PayloadEntries.UserId = this.getModel().getProperty("/user/id");		
			PayloadEntries.WorkDate = this.getModel().getProperty("/selGang/workDate");		

			var oPaycodeDataModel  = sap.ui.getCore().getModel("oDataPaycodeScreenModel");
			oPaycodeDataModel.create("/PaycodeHeaderSet",PayloadEntries,null,					
					function(oData, oResponse){		
				try{					
					oUiModel.setProperty("/selGang/TimeResults", oData.NavPaycodeError.results);
					that._oNavTimeResults();
//					var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
//					sap.m.MessageBox.show(bundle.getText("tne.paycode.msg.DataUpdatedSuccessfully"), 
//					sap.m.MessageBox.Icon.SUCCESS, 
//					bundle.getText("tne.app.Success"),sap.m.MessageBox.Action.OK, null, null, 'dummyStyleClass');
				}catch (e) {	
					com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Paycode - I03013: Error handling response in Post Paycode Data");
				};
			},
			function(error){
				try{
					var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();						 			
					com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.paycode.msg.PaycodeUpdFailureMsgHeader"),bundle.getText("tne.paycode.msg.PaycodeScreenErrorNumber"));
				}catch (e) {										
					com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Paycode - I03014: Error handling exception in Post Paycode Data");
				};

			}
			);
		},

		/**
		 * date formatter for Paycode table entries
		 * to convert date object into HHmm Format
		 * @private
		 * @memberOf tne.paycode
		 * @returns int
		 */
		dateFormat: function(Total){
			if (Total instanceof Date){
				return com.bnsf.eam.tne.util.DateAndTimeConversion.convertMilliSecToHHmm(Total.getTime());
			}else{
				return Total;
			}
		},

		treeTableLinkFormatter: function(oLevel){
			if(oLevel == "0" || oLevel == "1")
				return true;
			else
				return false;

		}

	});

	return PaycodeController;

});