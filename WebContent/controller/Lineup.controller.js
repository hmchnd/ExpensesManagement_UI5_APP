sap.ui.define([
               'com/bnsf/eam/tne/controller/BaseController',
               'com/bnsf/eam/tne/util/DateAndTimeConversion',
               'com/bnsf/eam/tne/util/UserNameFormatter',
               'com/bnsf/eam/tne/util/Validators',
               'sap/ui/model/json/JSONModel',
               'sap/m/MessageBox',
               'sap/ui/model/Sorter',
               'com/bnsf/eam/tne/util/ServiceErrorHandler'
               ], function(BaseController, DateAndTimeConversion, UserNameFormatter, Validators, JSONModel, MessageBox, Sorter, ServiceErrorHandler) {


	var LineupController = BaseController.extend("com.bnsf.eam.tne.controller.Lineup", {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf system
		 */	
		onInit: function() {		
//			this.PLANNED_LINE_UP = "P";
//			this.CREATE_SYS_FRONTEND = 'F';
//			this.CREATE_SYS_BACKEND = 'B';
//			this.ONE_MAN_GANG ='O';
//			this.ASSIGN_CODE_06 ='TIME';
			this.LINEUP_CHANGED = false;

			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);

			var oUiModel = this.getModel();
			this.setModel(oUiModel);	
		},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf system
		 */
		onBeforeRendering: function(evt) {
			//	this.getView().getController()._mCallMethod('getLineup','C');
		},
		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf system
		 */
//		onAfterRendering: function() {

//		},

		/**
		 * Cleanup on Exit of view
		 * 
		 * @public
		 * @memberOf system
		 * @returns null
		 */
		onExit: function(){
			if (this._oDialog) {
				this._oDialog.destroy(true);
			};
			this.LINEUP_CHANGED.destroy(true);
//			this.PLANNED_LINE_UP.destroy();
//			this.CREATE_SYS_FRONTEND.destroy();
//			this.CREATE_SYS_BACKEND.destroy();
//			this.ONE_MAN_GANG.destroy();
//			this.ASSIGN_CODE_06.destroy();

		},


		/**
		 * On route matched for Lineup screen
		 * Instantiates absentee value help, gang profile, linup
		 * @private
		 * @memberOf tne.lineup
		 * @returns null
		 */
		_onRouteMatched: function(oEvent){	
			var that=this;
			var oArgs;
			this.count=0;
			var sRoute = oEvent.getParameter("name");
			var viewLevel=this.getRouter().getTargets()._oLastDisplayedTarget._oTargetHandler._iCurrentViewLevel;
			var param=oEvent.getParameter("arguments").lineup; 
			if(sRoute == "Lineup"){
				if(viewLevel != 2)
					that._mCallMethod('initalizeScreen', 'C');
				else{
					this._sortAndFilterFactory();
				};

			};
		},

		/**
		 * Generic method to route backend calls 
		 * Handles busy indicator and service errors
		 * @private
		 * @memberOf tne.lineup
		 * @returns boolean
		 */
		_mCallMethod :function(pMethod,pEvent){
			var oController = this;
			var oDummyModel = sap.ui.getCore().getModel("userModel");	
			oDummyModel.fireRequestSent();
			var bStatus = null;
			oDummyModel.read('/ServerDetails', null,{}, true,
					function(oData, oResponse){
				try{
					switch(pMethod){
					case 'getGangProfile':
						oController._getGangProfile(pEvent)
						break;
					case 'getLineup': 
						oController._getLineup(pEvent);
						break;
					case 'initalizeScreen':
						oController._initalizeLinupScreen(pEvent)
						break;
					case 'getOnDemandLineup':
						oController._getOnDemandLineup(pEvent);
						break;
					case 'saveDraft': 
						oController._saveDraft(pEvent);
						break;
					case 'goNext': 
						oController._goNext(pEvent);
						break;
					case 'saveGangProfile':
						bStatus = oController._fnSaveGngHdrDetails(pEvent);
						break;
					}
					oDummyModel.fireRequestCompleted();
				}
				catch(e){
					oDummyModel.fireRequestCompleted();
					com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03015: Error handling Response in Dummy Service");
				};
			},
			function(error){
				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
				try{
					com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.lineup.msg.ConnectionFailuremsgHeader"),bundle.getText("tne.lineup.msg.LineupScreenErrorNumber"));
					oDummyModel.fireRequestCompleted(); 
				}
				catch(e){
					oDummyModel.fireRequestCompleted(); 
					com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03018: Error handling exception in Dummy Service");
				}
			});
			return bStatus;
		},
		handlePageExit:function(){

			this.onNavBack();	

		},
		/**
		 * Called when a screen is instantiated to load lineup data and Gang Profile.
		 * Can be called with two modes A and C
		 * A - Initially represented Activity - A mode does not trigger SAP Time confirmation (activities) pull
		 * C - Initially represented calendar - C triggers a pull for time confirmations (Activities) if not already loaded
		 * 
		 * In A mode Absentee value help model or Gang profile will not be loaded
		 * In C mode Absentee value help model will be first loaded and then lineup
		 * @memberOf tne.lineup
		 */	
		_initalizeLinupScreen: function(pEvent){		
			var oController = this;	 
			var  oUiModel = this.getModel();

			//clear any existing lineup data
			oUiModel.setProperty("/selGang/lineup", null);

			//Get parameters for service call 
			var selectedGangTitle = oUiModel.getProperty("/selGang/id");		
			var userID = oUiModel.getProperty('/user/id');
			var selectedDateTime = oUiModel.getProperty("/selGang/workDate");

			selectedDateTime = new Date(selectedDateTime);  

			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);	

			if(pEvent == "A"){
				oController._getLineup(pEvent);
			}else{
				
				//fetching Gang Profile Ends here
				var bReturn = oController._getGangProfile();

				if(bReturn){
					var oValueHelpAbsenteeModel  = sap.ui.getCore().getModel("oValueHelpModel");
					var oAbsenteeType = sap.ui.getCore().getModel("oAbsenteeType");

					oValueHelpAbsenteeModel.read("/ValueHelpSet?$filter=FieldName eq 'ABSENT_TYPE' and ScreenIndicator eq 'LINEUP' " +
							"and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"'",
							null,{}, true,
							function(oData, oResponse){
								try{  
									oAbsenteeType.setData(oData);
									oAbsenteeType.refresh();
									//fetching lineup
									oController._getLineup(pEvent);					
								} catch (e) {
									com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03005: Error handling response in Get Absentee Type Value Help Service");
								}
							},function(error){
								try{
									var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();							
									com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.lineup.msg.ErrRdngAbsType"),bundle.getText("tne.lineup.msg.LineupScreenErrorNumber"));
								}
								catch (e) {							
									com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03006: Error handling Exception in Get Absentee Type Value Help Service");
								};
							});	
				};

			};		
		},

		/**
		 * Called to get Gang profile
		 * Loads gang profile and sets in default UI model
		 * @memberOf tne.lineup
		 * @return boolean
		 */	
		_getGangProfile: function(){
			var oController = this;
			var  oUiModel = this.getModel();
			var bReturn = false;

			//clear any existing lineup profile data
			oUiModel.setProperty("/selGang/dayGangProfile", null);

			//Get parameters for service call
			var selectedGangTitle = oUiModel.getProperty("/selGang/id");		
			var userID = oUiModel.getProperty('/user/id');
			var selectedDateTime = oUiModel.getProperty("/selGang/workDate");

			selectedDateTime = new Date(selectedDateTime);  

			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);		  

			var oLocalGangDetailDaysModel =  new JSONModel();

			var oModelLineUp = sap.ui.getCore().getModel("lineupModel");
			var oWrkDate  = new Date(Date.UTC(selectedDateTime.getUTCFullYear(),
					selectedDateTime.getUTCMonth(), 
					selectedDateTime.getUTCDate(),
					"12","00"
			));
			var oDefaultProfileData = {
					WorkDate: oWrkDate,
					StartDate: "",
					StartTime: {__edmType: "Edm.Time", ms: ""},
					EndDate: "",
					EndTime: {__edmType: "Edm.Time", ms: ""},
					RestDays: "",
					Hours: "",
					LineupType:"",
					Extension1 : "",
					Extension2 : "",
					Extension3 :"",
					GangId : selectedGangTitle,
					ScrInd : "",
					UserID : userID

			};
			oLocalGangDetailDaysModel.setData(oDefaultProfileData); 

			oModelLineUp.read("/LineUps(GangId='"+selectedGangTitle+"',WorkDate=datetime'"+vDate+"',UserID='"+userID+"')",
					null,{}, false,
					function(oData, oResponse){
						try{
							oLocalGangDetailDaysModel.setData(oData);
							var oDateWorkDate = oData.WorkDate;
							var date = oDateWorkDate.getUTCDate();
							var month = oDateWorkDate.getUTCMonth();
							var year = oDateWorkDate.getUTCFullYear();
							var newDate = Date.UTC(year, month, date, 0, 0);
							var oWorkDate = new Date(newDate);
							oLocalGangDetailDaysModel.setProperty("/WorkDate", oWorkDate);
							/**
							 * Call method to set  Start and End date
							 */
							var dateGangObject = com.bnsf.eam.tne.util.DateAndTimeConversion.createStartandEndDates(
									selectedDateTime,
									oLocalGangDetailDaysModel.getProperty("/StartTime/ms"),
									oLocalGangDetailDaysModel.getProperty("/EndTime/ms")
							);

							var oGangSTDate =  new Date(newDate); 
							var oGangEDDate =  new Date(newDate);
							
							//if date is sent from backend use the same
							if(oData.StartDate != null){
								oGangSTDate = new Date(Date.UTC(oData.StartDate.getUTCFullYear(), oData.StartDate.getUTCMonth(), oData.StartDate.getUTCDate(), 0, 0));
							};
							
							var oGangSTms = oLocalGangDetailDaysModel.getProperty("/StartTime/ms");
							var oGangEDms = oLocalGangDetailDaysModel.getProperty("/EndTime/ms");
							
							//derive multi day 
							if(oGangSTms > oGangEDms){
								oUiModel.setProperty("/selGang/multiDayInd", true);
								//If multi day, increment Gang Profile End Date
								oGangEDDate.setDate(oWorkDate.getDate() + 1);
							}else{
								oUiModel.setProperty("/selGang/multiDayInd", false);
							};
							
							//if date is sent from backend use the same
							if(oData.EndDate != null){
								oGangEDDate = new Date(Date.UTC(oData.EndDate.getUTCFullYear(), oData.EndDate.getUTCMonth(), oData.EndDate.getUTCDate(), 0, 0));
							};
							
							//Set Gang Profile Start Date and End Dates as derived above
							oLocalGangDetailDaysModel.setProperty("/StartDate" , DateAndTimeConversion.displayValueDate(oGangSTDate.getTime()));
							oLocalGangDetailDaysModel.setProperty("/EndDate" , DateAndTimeConversion.displayValueDate(oGangEDDate.getTime()));
							
							//Set Gang Profile Start Time and End Time as date objects
							oLocalGangDetailDaysModel.setProperty("/LocalStartTime" , DateAndTimeConversion.offsetConversion(oGangSTms));
							oLocalGangDetailDaysModel.setProperty("/LocalEndTime" , DateAndTimeConversion.offsetConversion(oGangEDms));
							
							if(oData.Hours != undefined && oData.Hours != null )
								oUiModel.setProperty("/selGang/shiftHrs", oData.Hours);
							else
								oUiModel.setProperty("/selGang/shiftHrs", "08");

							//set data to local UI model
							oUiModel.setProperty("/selGang/dayGangProfile", oLocalGangDetailDaysModel.getData());
							bReturn = true;
						}catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03001: Error handling response in Get Lineup Service");
							bReturn = false;
						}					  
					},function(error){
						try{ 
							var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();	
							if(JSON.parse(error.response.body).error.code=="ZPM_TNA/031"){
								com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.lineup.err.NoGangProfileTitle"),bundle.getText("tne.lineup.msg.LineupScreenErrorNumber"), function(){ 
									oController.openGangDayProfileDialog();});
							}
							else{
								com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.lineup.err.NoGangProfileTitle"),bundle.getText("tne.lineup.msg.LineupScreenErrorNumber"), function(){sap.ui.getCore().byId('idLineUpPage').getController().goToHome();});
							}
						}
						catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Lineup - I03002: Error handling exception for Get Lineup Service");
						}
						//if error return
						bReturn = false;
					});	
			return bReturn;
		},

		/**
		 * Fetches the Lineup and 
		 * sets the lineup node in the default UI model
		 * 
		 * @memberOf tne.lineup
		 * @return null
		 */	
		_getLineup: function(pEvent){
			var oController = this;
			var bReturn = false;
			var  oUiModel = this.getModel();

			//clear any existing lineup data
			oUiModel.setProperty("/selGang/lineup", null);

			//Get parameters for service call
			var selectedGangTitle = oUiModel.getProperty("/selGang/id");		
			var userID = oUiModel.getProperty('/user/id');
			var selectedDateTime = oUiModel.getProperty("/selGang/workDate");

			selectedDateTime = new Date(selectedDateTime);  

			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);	

			var oModelLineUp = sap.ui.getCore().getModel("lineupModel");

			oModelLineUp.read("/LineUps?$filter= (GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+
					"' and UserID eq '"+userID+"' and ScrInd eq '"+ pEvent +"')&$expand=NavPositions/NavEmployees,NavLineEmp/NavAbsentees",
					null,{}, false,
					function(oData, oResponse){			 
						/**
						 * Load Positions and Employees
						 */
						try{
							if(oData.results == null || oData.results.length == 0){
								//TODO: Show message "Lineup blank. Pull lineup "YES"/"NO" on NO return on YES call pull lineup function.
								return;
							}
							else{
								var data = oData.results[0];
								oController._mCreateStructureForLineUp(data);
//								oController._loadPositionsAndEmployees();
								oController._sortAndFilterFactory();
							}
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03003: Error handling response in Get Lineup Service");
						}
					},function(error){
						try{
							oController._sortAndFilterFactory();
							var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();					
							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.lineup.msg.ErrReadingLineUp"),bundle.getText("tne.lineup.msg.LineupScreenErrorNumber"));
						}
						catch (e) {					
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03004: Error handling exception in Get Lineup Service");
						}
					});
		},

		/**
		 * converts service data received for linup header and linup
		 * into local data
		 * creates references from position to employee list 
		 * creates references from employee to absentee value help
		 * sets the formatted data in local UI model 
		 * @private
		 * @memberOf tne.lineup
		 * @returns null
		 */
		_mCreateStructureForLineUp: function(oData){

			var locGangModel = this.getModel();
			var vDate 	= locGangModel.getProperty("/selGang/workDate");
			var oDateWorkDate = oData.WorkDate;
			var date = oDateWorkDate.getUTCDate();
			var month = oDateWorkDate.getUTCMonth();
			var year = oDateWorkDate.getUTCFullYear();
			var newDate = Date.UTC(year,month,date,"12","00");
			newDate = new Date(newDate);

			var arrayLineEmp = oData.NavLineEmp.results;
			var userID = locGangModel.getProperty('/user/id');
			var NavLineEmp = [];

			var gangStartTime = $.extend(true,{},locGangModel.getProperty("/selGang/dayGangProfile/StartTime"));
			var gangEndTime  =  $.extend(true,{},locGangModel.getProperty("/selGang/dayGangProfile/EndTime"));
			var gangStartDate = locGangModel.getProperty("/selGang/dayGangProfile/StartDate");
			var gangEndDate  =  locGangModel.getProperty("/selGang/dayGangProfile/EndDate");



			var abenteeCode=sap.ui.getCore().getModel("oAbsenteeType").getData().results;

			if(arrayLineEmp != null && arrayLineEmp.length > 0 ){
				for ( var iteratorEmp = 0; iteratorEmp < arrayLineEmp.length; iteratorEmp++) {
					var aNavAbsentees =[]; 
					var arrayAbsentee = arrayLineEmp[iteratorEmp].NavAbsentees.results;

					if(arrayAbsentee != null && arrayAbsentee.length > 0){
						for ( var interatorAbs = 0; interatorAbs < arrayAbsentee.length; interatorAbs++) {
							var element = arrayAbsentee[interatorAbs];
							var oAbReference = undefined;
//							var iRefAbCodeIndex = this._findDescriptionByCode(element.AbsenteeType ,abenteeCode,AbCodearrayLength);
							var iRefAbCodeIndex = com.bnsf.eam.tne.util.Validators.getAbsenteeByCode(element.AbsenteeType);
							iRefAbCodeIndex != -1 ? oAbReference = abenteeCode[iRefAbCodeIndex] : null;

							var absenteeElement = {
									AbsenteeType: element.AbsenteeType,
									Action:element.Action,
									Deletable:element.Deletable,
									EmployeeId:element.EmployeeId,
									EndDate:element.EndDate,
									EndTime:element.EndTime,
									Extension1:element.Extension1,
									GangId:element.GangId,
									SourceSystem:element.SourceSystem,
									StartDate:element.StartDate,
									StartTime:element.StartTime,
									WorkDate:newDate,
									UserID:userID,
									AbsentRef:oAbReference,
//									AbsenteeTypeList:abenteeCode								
							};
							/**
							 * Call method to set Absentee Start and End date
							 */
							var dateObject = com.bnsf.eam.tne.util.DateAndTimeConversion.createStartandEndDates(vDate,element.StartTime.ms,element.EndTime.ms);
							absenteeElement.StartDate = dateObject.startDate;
							absenteeElement.EndDate = dateObject.endDate;
							/**
							 *  Call method to set Absentee Start and End date- End
							 */
							aNavAbsentees.push(absenteeElement);
						};
					};

					//check if employee already exists in array, if yes append NAv absentee else insert
					var indexOfEmployee = this._findEmployeeByID(arrayLineEmp[iteratorEmp].EmployeeId, NavLineEmp);
					if(indexOfEmployee == -1){

						var employeeElement = {
								AssignCode:arrayLineEmp[iteratorEmp].AssignCode,
								Salutation: arrayLineEmp[iteratorEmp].Salutation,
								FirstName: arrayLineEmp[iteratorEmp].FirstName,
								MiddleName: arrayLineEmp[iteratorEmp].MiddleName,
								LastName: arrayLineEmp[iteratorEmp].LastName,
								Designation:	arrayLineEmp[iteratorEmp].Designation,
								RoleCode	:	arrayLineEmp[iteratorEmp].RoleCode,
								EmployeeId:arrayLineEmp[iteratorEmp].EmployeeId,
								EndDate:arrayLineEmp[iteratorEmp].EndDate,
								EndTime:arrayLineEmp[iteratorEmp].EndTime,
								Extension1:arrayLineEmp[iteratorEmp].Extension1,
								Extension1:arrayLineEmp[iteratorEmp].Extension2,
								Extension1:arrayLineEmp[iteratorEmp].Extension3,
								GangId:arrayLineEmp[iteratorEmp].GangId,
								NavAbsentees:aNavAbsentees,
								StartDate:arrayLineEmp[iteratorEmp].StartDate,
								StartTime:arrayLineEmp[iteratorEmp].StartTime,
								WorkDate:newDate,
								UserID:userID
						};

						/**
						 * Call method to set  Start and End date
						 */


						/**
						 * If planned line up copy the dates of gang 
						 */

						if(oData.LineupType == com.bnsf.eam.tne.util.Constants.PLANNED_LINE_UP || 
								oData.LineupType == null || oData.LineupType == undefined || oData.LineupType == ""){
							employeeElement.StartTime = gangStartTime;
							employeeElement.EndTime = gangEndTime;
							employeeElement.StartDate = gangStartDate;
							employeeElement.EndDate = gangEndDate;
						}else{

							var dateEmpObject = com.bnsf.eam.tne.util.DateAndTimeConversion.createStartandEndDates(vDate, employeeElement.StartTime.ms,employeeElement.EndTime.ms);

							employeeElement.StartDate == null ? employeeElement.StartDate = dateEmpObject.startDate : null ;
							employeeElement.EndDate == null ? employeeElement.StartDate = dateEmpObject.startDate : null ;

						};
						NavLineEmp.push(employeeElement);
					}else{
						var existingEmpRec = NavLineEmp[indexOfEmployee].NavAbsentees.concat(aNavAbsentees);
					};
				};
				//set the list of employees in local model to filtered list of employees
				locGangModel.setProperty("/selGang/uniqueEmployeeList", NavLineEmp);
			}else{
				locGangModel.setProperty("/selGang/uniqueEmployeeList", []);
			};



			/**
			 * Finding Positions
			 */
			var NavPositions =[];
			var arrayPositions = oData.NavPositions.results;
			if(arrayPositions !=null && arrayPositions.length > 0){
				for ( var iteratorPos = 0; iteratorPos < arrayPositions.length; iteratorPos++) {
					var arrayNavEmployees = arrayPositions[iteratorPos].NavEmployees.results;
					var NavEmployees = [];

					if(arrayNavEmployees != null && arrayNavEmployees.length > 0){
						for ( var interatorEmp = 0; interatorEmp < arrayNavEmployees.length; interatorEmp++) {
							var oEmpReference = undefined;
							var iRefEmpIndex = this._findEmployeeByID(arrayNavEmployees[interatorEmp].EmployeeId ,NavLineEmp);
							iRefEmpIndex != -1 ? oEmpReference = NavLineEmp[iRefEmpIndex] : null;
							var employeeEle = {
									Action:arrayNavEmployees[interatorEmp].Action,
									AssignCode:arrayNavEmployees[interatorEmp].AssignCode,
									Deletable:arrayNavEmployees[interatorEmp].Deletable,
									PosReliefNo : arrayNavEmployees[interatorEmp].PosReliefNo,
									Active: arrayNavEmployees[interatorEmp].Active,
									Salutation	:	arrayNavEmployees[interatorEmp].Salutation,
									FirstName	:	arrayNavEmployees[interatorEmp].FirstName,
									MiddleName	:	arrayNavEmployees[interatorEmp].MiddleName,
									LastName	:	arrayNavEmployees[interatorEmp].LastName,
									Designation:	arrayNavEmployees[interatorEmp].Designation,
									RoleCode	:	arrayNavEmployees[interatorEmp].RoleCode,
									EmployeeId:arrayNavEmployees[interatorEmp].EmployeeId,
									EndDate:arrayNavEmployees[interatorEmp].EndDate,
									EndTime:arrayNavEmployees[interatorEmp].EndTime,
									Extension1:arrayNavEmployees[interatorEmp].Extension1,
									Extension2:arrayNavEmployees[interatorEmp].Extension2,
									Extension3:arrayNavEmployees[interatorEmp].Extension3,
									GangId:arrayNavEmployees[interatorEmp].GangId,
									PositionId:arrayNavEmployees[interatorEmp].PositionId,
									StartDate:arrayNavEmployees[interatorEmp].StartDate,
									StartTime:arrayNavEmployees[interatorEmp].StartTime,
									WorkDate:newDate,
									UserID:userID,
									NavEmployeeRef: oEmpReference
							};


							/**
							 * Call method to set  Start and End date
							 */

							if(oData.LineupType == com.bnsf.eam.tne.util.Constants.PLANNED_LINE_UP || 
									oData.LineupType == null || oData.LineupType == undefined || oData.LineupType == ""){

								(employeeEle.Action == "" || employeeEle.Action == "U")?
										employeeEle.Action = "U":
											employeeEle.Action = "C";

								employeeEle.StartTime = gangStartTime;
								employeeEle.EndTime = gangEndTime;
								employeeEle.StartDate = gangStartDate;
								employeeEle.EndDate = gangEndDate;
							}else{
								var dateNavEmpObject = com.bnsf.eam.tne.util.DateAndTimeConversion.createStartandEndDates(vDate,employeeEle.StartTime.ms,employeeEle.EndTime.ms);
								employeeEle.StartDate = dateNavEmpObject.startDate;
								employeeEle.EndDate = dateNavEmpObject.endDate;
							};
							NavEmployees.push(employeeEle);
						};
					};

					var NavPositionEle = {
							GangId:arrayPositions[iteratorPos].GangId,
							NavEmployees:NavEmployees,
							PayRate:arrayPositions[iteratorPos].PayRate,
							PositionId:arrayPositions[iteratorPos].PositionId,
							PositionName:arrayPositions[iteratorPos].PositionName,
							WorkDate:newDate,
							UserID:userID
					};
					NavPositions.push(NavPositionEle);
				};
			};

			var lineUp ={
					EndDate:oData.EndDate,
					EndTime:oData.EndTime,
//					Extension1:oData.Extension1,
					Extension1: "V2",  				//To Identify Source application version for all Write calls 
					Extension2:oData.Extension2,
					Extension3:oData.Extension3,
					GangId:oData.GangId,
					Hours:oData.Hours,
					LineupType:oData.LineupType,
					NavLineEmp:NavLineEmp,
					NavPositions:NavPositions,
					RestDays:oData.RestDays,
					StartDate:oData.StartDate,
					StartTime:oData.StartTime,
					WorkDate:newDate,
					UserID:userID
			};

			/**
			 * Call method to set  Start and End date
			 */

			var dateLineUpObject = com.bnsf.eam.tne.util.DateAndTimeConversion.createStartandEndDates(vDate,lineUp.StartTime.ms,lineUp.EndTime.ms);

			lineUp.StartDate = dateLineUpObject.startDate;
			lineUp.EndDate = dateLineUpObject.endDate;

			//set data in local UI model
			locGangModel.setProperty("/selGang/lineup", lineUp);
		},

		/**
		 * Factory for sorting and filtering linup table data
		 * Takes the sorting and filtering condition and 
		 * prepares the data for local UI model linked to linup table
		 * @private
		 * @memberOf tne.linup
		 * @returns null
		 */
		_sortAndFilterFactory: function(sActionType, sAction, oFilter, sSorter){
			var locGangModel = this.getModel();
			var aLineup = locGangModel.getProperty("/selGang/lineup/NavPositions");

			var aFlattenedLineup = [];
			if(aLineup == null){
				locGangModel.setProperty("/selGang/lineupDisplay", {});
				locGangModel.refresh();
			}else{	
				for(var index = 0; index < aLineup.length; index++){
					var aAssignments = aLineup[index].NavEmployees;
					for(var emp = 0; emp < aAssignments.length; emp++){
						var oEmpRef = aAssignments[emp].NavEmployeeRef;
						var oFlatPosition={
								positionName:aLineup[index].PositionName,
								payRate: aLineup[index].PayRate,
								positionId:aLineup[index].PositionId,
								empId:aAssignments[emp].EmployeeId,
								empName:com.bnsf.eam.tne.util.UserNameFormatter.empNoWithAbbName(oEmpRef.EmployeeId, oEmpRef.FirstName, oEmpRef.MiddleName, oEmpRef.LastName, oEmpRef.Salutation, 50),
								assignment:aAssignments[emp].AssignCode,
								posReliefNo: aAssignments[emp].PosReliefNo,
								active: aAssignments[emp].Active,
//								startTime: com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(aAssignments[emp].StartTime.ms), 
//								endTime:com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(aAssignments[emp].EndTime.ms), 
								startTime: com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(oEmpRef.StartTime.ms), 
								endTime:com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(oEmpRef.EndTime.ms), 
								navAbsentees: this._formatAbsenteeIndicator(oEmpRef.NavAbsentees),
								empReference:oEmpRef
						};
						aFlattenedLineup.push(oFlatPosition);
					};
				};

				//call appropriate sorter function:
//				aFlattenedLineup.sort(this._sortLineupByPayRate);

				locGangModel.setProperty("/selGang/lineupDisplay", aFlattenedLineup);
				locGangModel.refresh();
			};
		},

		/**
		 * Sorter method for column Pay Rate
		 * @private
		 * @memberOf tne.linup
		 * @returns int
		 */
		_sortLineupByPayRate: function(a, b){
			return  parseFloat(b.payRate) - parseFloat(a.payRate);
		},

//		_loadPositionsAndEmployees: function(){
//		var oLocGangModel = this.getModel();	
//		oLocGangModel.refresh();
//		var oLocalGangDetailDaysModel = sap.ui.getCore().getModel("oLocalGangDetailDaysModel");

//		/**
//		* All Employees 
//		*/
//		var navPositionsArray = oLocGangModel.getProperty("/selGang/lineup/NavPositions");		 

//		for ( var int = 0; int < navPositionsArray.length; int++) {
//		var navEmployeeArray = navPositionsArray[int].NavEmployees;

//		if(navEmployeeArray != null){
//		for ( var int2 = 0; int2 < navEmployeeArray.length; int2++) {

//		if(navEmployeeArray[int2].Action == "D"){
//		continue;
//		}


//		if (oLocGangModel.getProperty("/selGang/gangType") == this.ONE_MAN_GANG 
//		|| oLocGangModel.getProperty("/selGang/gangType") == null
//		|| oLocGangModel.getProperty("/selGang/gangType") == "") {
//		var masterEmployeesArray =  oLocGangModel.getProperty("/selGang/lineup/NavLineEmp");

//		for(var incrementor = 0 ;incrementor<masterEmployeesArray.length;incrementor++){
//		if(masterEmployeesArray[incrementor].EmployeeId == navEmployeeArray[int2].EmployeeId){

//		oLocGangModel.setProperty(
//		"/selGang/lineup/NavLineEmp/"+incrementor+"/StartTime",
//		oLocalGangDetailDaysModel.getProperty("/StartTime") );

//		oLocGangModel.setProperty(
//		"/selGang/lineup/NavLineEmp/"+incrementor+"/StartDate",
//		oLocalGangDetailDaysModel.getProperty("/StartDate") );

//		oLocGangModel.setProperty(
//		"/selGang/lineup/NavLineEmp/"+incrementor+"/EndTime",
//		oLocalGangDetailDaysModel.getProperty("/EndTime") );
//		oLocGangModel.setProperty(
//		"/selGang/lineup/NavLineEmp/"+incrementor+"/EndDate",
//		oLocalGangDetailDaysModel.getProperty("/EndDate") );

//		break;
//		};
//		};
//		} else{
//		var masterEmployeesArray =  oLocGangModel.getProperty("/selGang/lineup/NavLineEmp");
//		for(var incrementor = 0 ;incrementor<masterEmployeesArray.length;incrementor++){
//		if(masterEmployeesArray[incrementor].EmployeeId == navEmployeeArray[int2].EmployeeId){


//		oLocGangModel.setProperty(
//		"/selGang/lineup/NavLineEmp/"+incrementor+"/StartTime",
//		oLocalGangDetailDaysModel.getProperty("/StartTime") );
//		oLocGangModel.setProperty(
//		"/selGang/lineup/NavLineEmp/"+incrementor+"/StartDate",
//		oLocalGangDetailDaysModel.getProperty("/StartDate") );

//		oLocGangModel.setProperty(
//		"/selGang/lineup/NavLineEmp/"+incrementor+"/EndTime",
//		oLocalGangDetailDaysModel.getProperty("/EndTime") );
//		oLocGangModel.setProperty(
//		"/selGang/lineup/NavLineEmp/"+incrementor+"/EndDate",
//		oLocalGangDetailDaysModel.getProperty("/EndDate") );

//		break;
//		};
//		};
//		};
//		}; 
//		};		
//		};
//		var oAllEmployeesArray = oLocGangModel.getProperty("/selGang/lineup/NavLineEmp");	
//		var selectedGangTitle = oLocGangModel.getProperty("/selGang/id");
//		var selectedDateTime = oLocGangModel.getProperty("/selGang/workDate");

//		for(var iEmp = 0 ;iEmp < oAllEmployeesArray.length;iEmp++){
//		oAllEmployeesArray[iEmp].WorkDate = selectedDateTime;
//		oAllEmployeesArray[iEmp].GangId = selectedGangTitle;
//		}
//		oLocGangModel.refresh();

//		vGlobalPropertyName="Position: ";
//		vGlobalGrouping = "None";
//		this.getView().getController().factory_createIntermediateModel(vGlobalGrouping,"",false);	
//		},
//		/**
//		* This is factory function
//		* This function is used to populate oModelGroup, enable the drag & drop and add styleclass
//		* @memberOf bninsepctionmgmt.GangMembers
//		*/	
//		factory_createIntermediateModel : function(propertyName,filters,empSearch){
//		var that = this;
//		var groupedList;
//		if(empSearch == false){			
//		var data = $.extend(true,[], that.getModel().getData().selGang.lineup);
//		groupedList =  that.getView().getController().groupingCallingFunc(data,propertyName,filters);	
//		}else{
//		var data = that.getView().getController().searchEmpNameFilter(empSearch);

//		var foundEmp = 0;
//		for(var index=0; index<data.NavPositions.length; index++){
//		if(data.NavPositions[index].NavEmployees.length > 0){
//		foundEmp=1;
//		break;
//		}
//		}

//		if(foundEmp == 1){
//		groupedList =  that.getView().getController().groupingCallingFunc(data,propertyName,filters);
//		}else{
//		sap.m.MessageBox.show(bundle.getText("FacIntetModel_NoEmp"),//"No Employee Found"
//		sap.m.MessageBox.Icon.ERROR,bundle.getText("FacIntetModel_NoEmpHead"),//"Search Failed"
//		sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
//		return;
//		}
//		}			


//		var oModelGroup = sap.ui.getCore().getModel('oModelGroup');
//		oModelGroup.setData(groupedList);
//		oModelGroup.refresh();

//		var flattened_array=[];           
//		var flattened_data={};
//		for(var index=0;index<oModelGroup.getData().length;index++)  
//		{
//		var employeeId= oModelGroup.getProperty("/"+index+"/items/0/EmployeeId");

//		var PositonName=oModelGroup.getProperty("/"+index+"/pattern");

//		var positionId=oModelGroup.getProperty("/"+index+"/items/0/PositionId");

//		var empFName=oModelGroup.getProperty("/"+index+"/items/0/FirstName");

//		var empMName=oModelGroup.getProperty("/"+index+"/items/0/MiddleName");

//		var empLName=oModelGroup.getProperty("/"+index+"/items/0/LastName");

//		var AssgnCode=oModelGroup.getProperty("/"+index+"/items/0/AssignCode");

//		var startTime=oModelGroup.getProperty("/"+index+"/items/0/StartTime");

//		var ifAbsent=this.getModel().getProperty("/selGang/lineup/NavLineEmp/"+index+"/NavAbsentees").length;

//		var ifAbsent;
//		var absentee;
//		if(ifAbsent>0)
//		{
//		absentee="A";
//		}
//		else
//		{
//		absentee="";
//		}
//		var endTime= oModelGroup.getProperty("/"+index+"/items/0/EndTime");
//		var empName= empFName+" "+empMName+" "+empLName;
//		flattened_data={

//		positionName:PositonName,
//		positionId:positionId,
//		empId:employeeId,
//		empName:empName,
//		assignment:AssgnCode,
//		startTime:startTime,
//		endTime:endTime,
//		navAbsentees:absentee

//		};


//		flattened_array.push(flattened_data)
//		}







//		var ojsonModelnew= new sap.ui.model.json.JSONModel();
//		ojsonModelnew.setData(flattened_array);
//		sap.ui.getCore().setModel(ojsonModelnew,"flatModel");	
//		},

		/**
		 * Search handler for linup table
		 * searches and filters the results for lineup table
		 * @public
		 * @memberOf tne.lineup
		 * @returns index
		 */
		searchGangEmployee:function(oEvent){
			var aFilters=[];
			var query =oEvent.getSource().getValue();
			var sQuery = query.toUpperCase();

			if (sQuery && sQuery.length > 0) {
				var filter = new sap.ui.model.Filter("empName", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			};

			// update list binding
			var list = this.getView().byId("tne.lineup.tbl_lineup");			
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");
		},

		/**
		 * Search employee in master list of employee for linking in position
		 * used to create reference for employee
		 * @private
		 * @memberOf tne.lineup
		 * @returns index
		 */
		_findEmployeeByID: function(ID, array){
			for(var index = 0; index < array.length; index++){
				if(array[index].EmployeeId == ID)
					return index;
			};
			return -1;
		},

		/**
		 * Formatter for absentee indicator node in local data
		 * Returns true if absentee present
		 * @private
		 * @memberOf tne.lineup
		 * @returns boolean
		 */
		_formatAbsenteeIndicator: function(aAbsentee){
			var bAbsentee = false
			aAbsentee.length > 0 ? bAbsentee = true: bAbsentee = false;
			return bAbsentee;
		},

		/**
		 * Formatter for absentee icon
		 * @public
		 * @memberOf tne.lineup
		 * @returns sap-icon
		 */
		iconFormatter:function(absentee)
		{
			if(absentee)
			{
				return "sap-icon://cancel-maintenance";
			}
		},

		/**
		 * Handler for Link Employee and Lineup table Item 
		 * Navigates to page LUEmployee
		 * @public
		 * @memberOf tne.lineup
		 * @returns null
		 */
		handleLineItemPress:function(oEvent){
			var oBindingContext=oEvent.getSource().getBindingContext();
			var sPath = oBindingContext.sPath;	
			var sEmpID = this.getModel().getProperty(sPath).empId;
			var sGangId = this.getModel().getProperty("/selGang/id");	
			var oSelectedDate = this.getModel().getProperty("/selGang/workDate");
			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(oSelectedDate);
			var start = sPath.lastIndexOf("/") + 1;			
			var indexPath = sPath.substring(start, sPath.length);			
			this.getRouter().navTo('LUEmployee',{GangId: sGangId, WorkDate: sFormattedDate, EmpID: indexPath}, false);
		},

		/**
		 * Handler for Link Position
		 * Navigates to page LUPosition
		 * @public
		 * @memberOf tne.lineup
		 * @returns null
		 */
		goToLUPositionPage:function(oEvent){
			var oBindingContext=oEvent.getSource().getBindingContext();
			var sPath = oBindingContext.sPath;					
			var sPosID = this.getModel().getProperty(sPath).positionId;
			var sGangId = this.getModel().getProperty("/selGang/id");	
			var oSelectedDate = this.getModel().getProperty("/selGang/workDate");
			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(oSelectedDate);
			this.getRouter().navTo('LUPosition',{GangId: sGangId, WorkDate: sFormattedDate, PosNo: sPosID}, false);
		},


		/**
		 * Handler for Gang Profile display button
		 * Opens the dialog for Gang profile
		 * @public
		 * @memberOf tne.linup.GangProfile
		 * @returns null
		 */
		openGangDayProfileDialog:function(){
			this._getGangDialog().open();

		},

		/**
		 * Handler for Gang Profile dialog Close
		 * Closes the dialog for Gang profile
		 * @public
		 * @memberOf tne.linup.GangProfile
		 * @returns null
		 */
		closeGangProfileDialog : function () {
			that = this;
			var oGangProfile = sap.ui.getCore().getModel().getProperty("/selGang/dayGangProfile");
			if(oGangProfile != undefined || oGangProfile != null )
				this._oDialog.destroy(true);
			else{				
				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
				sap.m.MessageBox.show(
						bundle.getText("tne.lineup.misGngPrf.GngActCancMsg"), {
							icon: sap.m.MessageBox.Icon.QUESTION,
							title: bundle.getText("tne.lineup.misGngPrf.GngActCancTitle"),
							actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.IGNORE],
							onClose: function(oAction) { 
								if(oAction == "IGNORE")
									that.handlePageExit();
							}
						}
				);
			};

		},

		/**
		 * Handler for Gang Profile dialog Save button
		 * calls backend service to save Gang profile
		 * calls generic method to save gang profile 
		 * which load busy indicator and handles service errors
		 * @public
		 * @memberOf tne.linup.GangProfile
		 * @returns null
		 */
		saveGangProfileData:function(oEvent){
			this._mCallMethod('saveGangProfile', oEvent);
		},

		/**
		 * Sets Gang profile in Dialog fragment
		 * 
		 * @private
		 * @memberOf tne.linup.GangProfile
		 * @returns sap.m.Dialog
		 */
		_getGangDialog: function (oEvent) {

			var oUiModel = this.getModel();
			oUiModel.refresh();

			var getHrs = oUiModel.getProperty('/selGang/dayGangProfile/Hours');
			var restDayIndex = parseInt(oUiModel.getProperty('/selGang/dayGangProfile/RestDays'));

			this._oDialog = sap.ui.xmlfragment("gangProfileDialog","com.bnsf.eam.tne.fragments.GangDayProfile", this);
			this._oDialog.setModel(oUiModel);

			this.getView().addDependent(this._oDialog);
			if(getHrs==8)
			{
				sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.10hrsGroup").setVisible(false);
				sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.8hrsGroup").setVisible(true);					
				sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.8hr").setSelected(true);					
				sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.8hrsGroup").setSelectedIndex(restDayIndex);
			}else if(getHrs==10){
				sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.10hr").setSelected(true)
				sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.10hrsGroup").setVisible(true);
				sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.10hrsGroup").setSelectedIndex(restDayIndex);
				sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.8hrsGroup").setVisible(false);
			}

			else if(getHrs==null || getHrs==undefined)
			{
				sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.10hr").setSelected(false);
				sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.8hr").setSelected(false);	
				sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.10hrsGroup").setVisible(false);
				sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.8hrsGroup").setVisible(false);				

			}
			return this._oDialog;
		},

		/**
		 * Handler for Gang Profile 8 hours radio button
		 * Hides the 10 hour profile rest days and shows the 8 hour profile rest days 
		 * @public
		 * @memberOf tne.linup.GangProfile
		 * @returns null
		 */
		selectRadioBtn8hrsGroup:function(restDayIndex){
			sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.10hrsGroup").setVisible(false);
			sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.8hrsGroup").setVisible(true);		
		},

		/**
		 * Handler for Gang Profile 10 hours radio button
		 * Hides the 8 hour profile rest days and shows the 10 hour profile rest days 
		 * @public
		 * @memberOf tne.linup.GangProfile
		 * @returns null
		 */
		selectRadioBtn10hrsGroup:function(restDayIndex){
			sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.10hrsGroup").setVisible(true);
			sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.8hrsGroup").setVisible(false);
		},


		/**
		 * Handler for Gang Profile data save
		 * Updates the profile data on the Dialog
		 * Prepares the service call payload
		 * Makes the backend call 
		 * @private
		 * @memberOf tne.linup.GangProfile
		 * @returns boolean
		 */
		_fnSaveGngHdrDetails:function(oEvent){
			this._updateGangProfileData(); //calling the method to update the dialog data
			var that = this;
			var oUiModel = this.getModel();
			/**
			 * Send the data for Posting and refresh the screen
			 */

			/**
			 * Gang Header Data 
			 * 
			 * 
			 */

			/**
			 * Saving value
			 * 
			 */
			var oGangStartTime = sap.ui.core.Fragment.byId("gangProfileDialog", "tne.lnupEmp.frag.startTime").getDateValue();
			var oGangEndTime = sap.ui.core.Fragment.byId("gangProfileDialog", "tne.lnupEmp.frag.EndTime").getDateValue();
			var oGangStartTimeMilliSec = com.bnsf.eam.tne.util.DateAndTimeConversion.convertLocalDateToMilliSec(oGangStartTime);
			var oGangEndTimeMilliSec = com.bnsf.eam.tne.util.DateAndTimeConversion.convertLocalDateToMilliSec(oGangEndTime);

			var oUiModel=this.getModel();
			var oldStartTime = oUiModel.getProperty("/selGang/dayGangProfile/StartTime/ms");
			var oldEndTime = oUiModel.getProperty("/selGang/dayGangProfile/EndTime/ms");
			oUiModel.setProperty("/selGang/dayGangProfile/StartTime/ms",oGangStartTimeMilliSec);
			oUiModel.setProperty("/selGang/dayGangProfile/EndTime/ms",oGangEndTimeMilliSec);	





			var bValidation = this._fnValidateAbsenteeTimes();
			/*}*/


			if(bValidation){

				oUiModel.setProperty("/selGang/dayGangProfile/StartTime/ms",oldStartTime);
				oUiModel.setProperty("/selGang/dayGangProfile/EndTime/ms",oldEndTime);
				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
				sap.m.MessageBox.show(bundle.getText("tne.lineup.msg.AbstTimeOverlappWithNewTime"), sap.m.MessageBox.Icon.ERROR, 
						bundle.getText("tne.lineup.msg.ErrHdrUpdtLineup") ,sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
				return;


			}

			else
			{


				var bStatus = null;
				var updateData =  oUiModel.getProperty('/selGang/dayGangProfile');
				var userID = oUiModel.getProperty('/user/id');
				var selectedGangTitle = oUiModel.getProperty("/selGang/id");
				var selectedDateTime 	= oUiModel.getProperty("/selGang/workDate");
				selectedDateTime = new Date(selectedDateTime);  

				var vDate =  sap.ui.core.format.DateFormat.getDateInstance( {
					style:"full", pattern: "yyyy-MM-ddThh:mm:ss"})
					.format(selectedDateTime);
				var oGangDetailDaysModel = sap.ui.getCore().getModel("lineupModel");

				oGangDetailDaysModel.update("/LineUps(GangId='"+selectedGangTitle+"',WorkDate=datetime'"+vDate+"',UserID='"+userID+"')",
						updateData ,null,
						function(oData, oResponse){


					/**
					 * LineUp Data
					 */
					// If 'One Man Gang' or its a 'Planned Lineup' copy the details to all the employees

					try{ 
						var upData =  oUiModel.getProperty('/selGang/dayGangProfile');
						var oLocalGangDetailDupModel=new JSONModel();
						var dupData = $.extend(true,{},upData);
						oLocalGangDetailDupModel.setData(dupData);

						var oGangStartTimeMilliSec = updateData.StartTime.ms;
						var oGangEndTimeMilliSec = updateData.EndTime.ms;

						var dateGangObject = com.bnsf.eam.tne.util.DateAndTimeConversion.createStartandEndDates(selectedDateTime,oGangStartTimeMilliSec,
								oGangEndTimeMilliSec);

						if (oUiModel.getProperty("/selGang/gangType")== "O" 
							|| oUiModel.getProperty("/selGang/gangType")==null
							|| oUiModel.getProperty("/selGang/gangType")=="" ||
							oUiModel.getProperty("/selGang/dayGangProfile/LineupType")== PLANNED_LINE_UP 
							|| oUiModel.getProperty("/selGang/dayGangProfile/LineupType")==null
							|| oUiModel.getProperty("/selGang/dayGangProfile/LineupType")=="" ) {

							var lineupdisplay= oUiModel.getProperty('/selGang/lineupDisplay');
							var arrayLineEmp = oUiModel.getProperty("/selGang/lineup/NavLineEmp");
							var navPositionsArray = oUiModel.getProperty("/selGang/lineup/NavPositions");



							if(lineupdisplay!=null && lineupdisplay!==undefined)
							{


								for(var lineInt=0;lineInt<lineupdisplay.length;lineInt++)
								{

									oUiModel.setProperty('/selGang/lineupDisplay/'+lineInt+'/startTime',oGangStartTime);
									oUiModel.setProperty('/selGang/lineupDisplay/'+lineInt+'/endTime',oGangEndTime);

								}

							}



							if(arrayLineEmp!==null && arrayLineEmp!==undefined){
								for(var intEmp=0;intEmp<arrayLineEmp.length;intEmp++){
									oUiModel.setProperty("/selGang/lineup/NavLineEmp/"+intEmp+"/StartTime/ms",oGangStartTimeMilliSec);
									oUiModel.setProperty("/selGang/lineup/NavLineEmp/"+intEmp+"/EndTime/ms",oGangEndTimeMilliSec);
									oUiModel.setProperty("/selGang/lineup/NavLineEmp/"+intEmp+"/StartDate",dateGangObject.startDate);
									oUiModel.setProperty("/selGang/lineup/NavLineEmp/"+intEmp+"/EndDate",dateGangObject.endDate);

								};

							};
							if(navPositionsArray!==null && navPositionsArray!==undefined){
								for(var intPos=0;intPos<navPositionsArray.length;intPos++){
									var navEmployeeArray = navPositionsArray[intPos].NavEmployees;
									if(navEmployeeArray!=null && navEmployeeArray!==undefined){
										for(var intPosEmp =0;intPosEmp<navEmployeeArray.length;intPosEmp++){
											oUiModel.setProperty("/selGang/lineup/NavPositions/"+intPos+"/NavEmployees/"+intPosEmp+"/StartTime/ms",oGangStartTimeMilliSec);
											oUiModel.setProperty("/selGang/lineup/NavPositions/"+intPos+"/NavEmployees/"+intPosEmp+"/EndTime/ms",oGangEndTimeMilliSec);
											oUiModel.setProperty("/selGang/lineup/NavPositions/"+intPos+"/NavEmployees/"+intPosEmp+"/StartDate",dateGangObject.startDate);
											oUiModel.setProperty("/selGang/lineup/NavPositions/"+intPos+"/NavEmployees/"+intPosEmp+"/EndDate",dateGangObject.endDate);

											/**
											 * If Nav Position timings are modified make send the marker
											 */

											if(oUiModel.getProperty("/selGang/lineup/NavPositions/"+intPos+"/NavEmployees/"+intPosEmp+"/Action") == ""
												|| oUiModel.getProperty("/selGang/lineup/NavPositions/"+intPos+"/NavEmployees/"+intPosEmp+"/Action") == "U"){

												oUiModel.setProperty("/selGang/lineup/NavPositions/"+intPos+"/NavEmployees/"+intPosEmp+"/Action",'U');
												oUiModel.refresh();
											}else{
												oUiModel.setProperty("/selGang/lineup/NavPositions/"+intPos+"/NavEmployees/"+intPosEmp+"/Action",'C');

											};
										};
										oUiModel.refresh();};
								};
							};
						};
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();

						sap.m.MessageBox.show(bundle.getText("tne.lineup.msg.DataUpdatedSuccessfully"), 
								sap.m.MessageBox.Icon.SUCCESS, 
								bundle.getText("tne.lineup.msg.CallSuccessMsgHeader")
								,sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
						//	that._oDialog.close();
						that._oDialog.destroy();
						// next button enabled
						//		sap.ui.getCore().getElementById("btnLineUpTrFtrNext").setEnabled(true);

						//**
						// Data has been saved-- Keep a field to mark changes are saved so need need for confirmation on back button
						//*

//						LineUpChanged = false;

						bStatus = true;
						return bStatus;


					} catch (e) {
						util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03016: Error handling response in Update Lineup Data");
					}

				},function(error){
					bStatus =false;
					var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
					/*
					var oLocalGangDetailDupModel = oUiModel.getProperty('/selGang/dayGangProfile');
					var dupData = $.extend(true,{},oLocalGangDetailDupModel);
					oLocalGangDetailDaysModel.setData(dupData);

					sap.ui.getCore().byId('idLineUpPage').getController().modifyGangDetails();*/								 

					try {
						if(error.response.statusCode.toString().charAt(0)=="5")
						{
							sap.m.MessageBox.show(error.response.statusText+bundle.getText("tne.lineup.msg.LineUpMsgHdrProfileUpdateFailed"), sap.m.MessageBox.Icon.ERROR,error.message,sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
						}else if(error.response.statusCode.toString().charAt(0)=="4"){
							var sError = error.response.body;
							var oJSON = JSON.parse(sError);
							sap.m.MessageBox.show(oJSON.error.message.value+bundle.getText("tne.lineup.msg.LineUpMsgHdrProfileUpdateFailed"), sap.m.MessageBox.Icon.ERROR,bundle.getText("tne.lineup.msg.ErrHdrUpdtLineup"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
						}else{
							sap.m.MessageBox.show(bundle.getText("tne.lineup.msg.CallFailureMsgHeader")+bundle.getText("tne.lineup.msg.LineUpMsgHdrProfileUpdateFailed"), sap.m.MessageBox.Icon.ERROR, bundle.getText("tne.lineup.msg.HTTPErrorUnknown") ,sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
						}
						com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.lineup.msg.ErrHdrUpdtLineup"),bundle.getText("tne.lineup.msg.LineupScreenErrorNumber"));

					} catch (e) {				
						sap.m.MessageBox.show(bundle.getText("tne.lineup.msg.UnknownFailureMsgBody")+bundle.getText("tne.lineup.msg.LineUpMsgHdrProfileUpdateFailed"), 
								sap.m.MessageBox.Icon.ERROR, 
								bundle.getText("tne.lineup.msg.UnknownFailureMsgBody"),
								sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
						com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03017: Error handling exception in Update Lineup Data");
					}
					return bStatus;
				});		

			}

		},

		/**
		 * Updates the Gang Profile in the Dialog
		 * @private
		 * @memberOf tne.linup.GangProfile
		 * @returns null
		 */
		_updateGangProfileData:function()
		{

			var oGangStartTime = sap.ui.core.Fragment.byId("gangProfileDialog", "tne.lnupEmp.frag.startTime").getDateValue();
			var oGangEndTime = sap.ui.core.Fragment.byId("gangProfileDialog", "tne.lnupEmp.frag.EndTime").getDateValue();
			var oGangStartTimeMilliSec = com.bnsf.eam.tne.util.DateAndTimeConversion.convertLocalDateToMilliSec(oGangStartTime);
			var oGangEndTimeMilliSec = com.bnsf.eam.tne.util.DateAndTimeConversion.convertLocalDateToMilliSec(oGangEndTime);

			var oUiModel=this.getModel();
			var oldStartTime = oUiModel.getProperty("/selGang/dayGangProfile/StartTime/ms");
			var oldEndTime = oUiModel.getProperty("/selGang/dayGangProfile/EndTime/ms");
			oUiModel.setProperty("/selGang/dayGangProfile/StartTime/ms",oGangStartTimeMilliSec);
			oUiModel.setProperty("/selGang/dayGangProfile/EndTime/ms",oGangEndTimeMilliSec);	

			var selectedGangTitle=oUiModel.getProperty('/selGang/id');
			var	selectedDateTime=oUiModel.getProperty('/selGang/workDate');
			var	userID=oUiModel.getProperty('/user/id');
			var vDate =  sap.ui.core.format.DateFormat.getDateInstance( {
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"})
				.format(selectedDateTime);

			var	oGangDetailDaysModel=sap.ui.getCore().getModel("lineupModel")
			var oHoursSelected;	
			sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.10hr").getSelected()?
					oHoursSelected = "10" : oHoursSelected = "8";

			var startTime = sap.ui.core.Fragment.byId("gangProfileDialog", "tne.lnupEmp.frag.startTime").getDateValue();
			var endTime = sap.ui.core.Fragment.byId("gangProfileDialog", "tne.lnupEmp.frag.EndTime").getDateValue();

			var selectedRadioBtnIndex;
			if(sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.10hrsGroup").getVisible() == true){
				selectedRadioBtnIndex=sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.10hrsGroup").getSelectedIndex();

			}else{
				selectedRadioBtnIndex=sap.ui.core.Fragment.byId("gangProfileDialog", "tne.gangDay.frag.8hrsGroup").getSelectedIndex();

			};

			var selectedRadioBtnIndexStr= selectedRadioBtnIndex.toString();
			oUiModel.setProperty('/selGang/dayGangProfile/Hours',oHoursSelected);
			oUiModel.setProperty('/selGang/shiftHrs',oHoursSelected);
			oUiModel.setProperty('/selGang/dayGangProfile/StartDate',startTime);
			oUiModel.setProperty('/selGang/dayGangProfile/EndDate',endTime);
			oUiModel.setProperty('/selGang/dayGangProfile/StartTime/ms',oGangStartTimeMilliSec);
			oUiModel.setProperty('/selGang/dayGangProfile/EndTime/ms',oGangEndTimeMilliSec);
			oUiModel.setProperty('/selGang/dayGangProfile/RestDays',selectedRadioBtnIndexStr)


		},

		/**
		 * Validates if Gang profile changes overlap with existing absentees  
		 * @private
		 * @memberOf tne.linup.GangProfile
		 * @returns null
		 */
		_fnValidateAbsenteeTimes:function()
		{
			var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
			var oUiModel =  this.getModel();

			var multiDayFlag = oUiModel.getProperty("/selGang/multiDayInd");

			var selectedGang = oUiModel.getProperty("/selGang/lineup");
			var bError = false;
			if(selectedGang != null){
				var gangStartTime = oUiModel.getProperty("/selGang/dayGangProfile/StartTime/ms") ;
				var gangEndTime = oUiModel.getProperty("/selGang/dayGangProfile/EndTime/ms") ;

				var returnObject = {
						startDate:0,
						endDate:0,
						error:false,
						errorMsg:""
				};

				var selectedDateTime = oUiModel.getProperty("/selGang/workDate");
				selectedDateTime = new Date(selectedDateTime);

				var aEmployeeArray = selectedGang.NavLineEmp;

				for (var int = 0; int < aEmployeeArray.length && !bError; int++) {
					var empElement = aEmployeeArray[int];

					if(oUiModel.getProperty("/selGang/GangType")== "O" 
						|| oUiModel.getProperty("/selGang/GangType")==null
						|| oUiModel.getProperty("/selGang/GangType")=="" ){

						var dateEmployee = com.bnsf.eam.tne.util.DateAndTimeConversion.createStartandEndDates(selectedDateTime,
								gangStartTime,
								gangEndTime);
					}
					else{
						var dateEmployee = com.bnsf.eam.tne.util.DateAndTimeConversion.createStartandEndDates(selectedDateTime,
								empElement.StartTime.ms,
								empElement.EndTime.ms);
					}

					var absenteeArray = empElement.NavAbsentees;
					for (var int2 = 0; int2 < absenteeArray.length; int2++) {
						var absElement = absenteeArray[int2];
						var dateAbsentee = com.bnsf.eam.tne.util.DateAndTimeConversion.createStartandEndDates(selectedDateTime,
								absElement.StartTime.ms,absElement.EndTime.ms);

						/**
						 * 1st case 
						 * 		Emp time - 			!-----------------!
						 * 		Absentee Time -   !----! 
						 * 
						 * 2nd case 
						 * 		Emp time - 			!-----------------!
						 * 		Absentee Time -    					!----!
						 */

						if(dateEmployee.startDate.getTime()  > dateAbsentee.startDate.getTime() ){
							bError=true;
							break;
						}

						if(dateAbsentee.endDate.getTime()  > dateEmployee.endDate.getTime() ){
							bError=true;
							break;
						}
					}
				}
			}else{
				bError = false;
			}

			return bError;		
		},


		/**
		 * Handler for Edit selected button in lineup page
		 * @public
		 * @memberOf tne.linup
		 * @returns null
		 */
		openEditMultipleEmpDetPage: function(){
//			jQuery.sap.require("sap.m.MessageBox");
			var bundle= sap.ui.getCore().getModel("i18n").getResourceBundle();
			var contexts = this.getView().byId("tne.lineup.tbl_lineup").getSelectedContexts();
			//If no employees selected
			if(contexts.length <= 0){
				sap.m.MessageBox.alert(
						bundle.getText("tne.lineup.selectEmp")
				);
				return;
			};

			var selectedItems = contexts.map(function(selectedContext) {
				return selectedContext.getObject();
			});

			var oModel=  new JSONModel(selectedItems)
			sap.ui.getCore().setModel(oModel,"tne.lunpMultiEmp.mdl.SelEmp");

			var oUiModel=this.getModel();
			var sSelGang= oUiModel.getProperty('/selGang/id')
			var workDate= oUiModel.getProperty('/selGang/workDate');
			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(workDate)
			this.getRouter().navTo('LUMultiEmployee',{GangId:sSelGang,WorkDate:sFormattedDate},false);
		},


		/**
		 * Handler for pull lineup  button in lineup page
		 * Calls the backend service to fetch linup on demand (pulled from Third party system by ECC) 
		 * @public
		 * @memberOf tne.linup
		 * @returns null
		 */
		getOnDemandLineUp: function(){
			var that = this;
			var oUiModel=this.getModel();
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			var oCancelDialog = null;

			oCancelDialog = new sap.m.Dialog({
				title: bundle.getText("tne.lineup.lbl.PullLineup"),
				content:[
				         new sap.m.Text({
				        	 text: bundle.getText("tne.lineup.msg.PullLineupConfirmBody")
				         })
				         ],
				         beginButton: new sap.m.Button({
				        	 text:bundle.getText("tne.lineup.txt.No"),
				        	 type:bundle.getText("tne.lineup.txt.Accept"),
				        	 press:function(){
				        		 oCancelDialog.close();
				        	 }
				         }),//.addStyleClass("primaryButtonTextureStyle").addStyleClass("popoverFooterPrimaryBtnPositionStyle"),
				         endButton: new sap.m.Button({
				        	 text:bundle.getText("tne.lineup.txt.Yes"),
				        	 type:bundle.getText("tne.lineup.txt.Reject"),
				        	 press:function(){
				        		 oCancelDialog.close();
				        		 that._mCallMethod('getOnDemandLineup');	        		 	
				        		 that.getView().byId('tne.lineup.tbl_lineup').setModel(oUiModel);
				        		 that.getView().byId('tne.lineup.tbl_lineup').rerender();
				        	 }
				         })
			}).open();
		},

		/**
		 * Handler for employee shift time change from Lineup table
		 * @public
		 * @memberOf tne.linup
		 * @returns null
		 */
		onEmpStTimeChange: function(oEvent){
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			var oStTime = new Date(oEvent.getParameters().value);
			var StartTimeMS = oStTime.getTime();

			//get selected Emp
			var index=oEvent.getSource().getParent().getParent().indexOfItem(oEvent.getSource().getParent())
			//get selected Emp
			var oSelectedEmp = (this.byId('tne.lineup.tbl_lineup').getModel().getProperty('/selGang/lineupDisplay/'+index)).empReference;

			var oSelectedTableListItem =  oEvent.getSource().getParent();
			var oCustomDateTimeInputSt = oSelectedTableListItem.getCells()[4];
			var oEmpShift = {
					StartTime: 	{__edmType: "Edm.Time", ms:StartTimeMS},
					EndTime: oSelectedEmp.EndTime
			};

			oCustomDateTimeInputSt.setValueState(bundle.getText("tne.lineup.txt.None"));
			oCustomDateTimeInputSt.setValueStateText("");

			var oReturn = com.bnsf.eam.tne.util.Validators.verifyEmpShiftOverlap(oSelectedEmp, oEmpShift);

			//If error, set control in value state error
			if(oReturn.ValidationResult == "E" && oReturn.StartTimeOverlap){
				oCustomDateTimeInputSt.setValueState(bundle.getText("tne.lineup.txt.Error"));
				oCustomDateTimeInputSt.setValueStateText(bundle.getText("tne.lineup.txt.AbsenteeOverlapStartTime"));
			}else{
				//TODO: Update Employee Shift Start time and action flag
			};
		},	

		/**
		 * Handler for employee shift time change from Lineup table
		 * @public
		 * @memberOf tne.linup
		 * @returns null
		 */
		onEmpEnTimeChange: function(oEvent){
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			var oEnTime = new Date(oEvent.getParameters().value);
			var EndTimeMS = oEnTime.getTime();

			//get selected Emp
			var index=oEvent.getSource().getParent().getParent().indexOfItem(oEvent.getSource().getParent())
			//get selected Emp
			var oSelectedEmp = (this.byId('tne.lineup.tbl_lineup').getModel().getProperty('/selGang/lineupDisplay/'+index)).empReference;


			var oEmpShift = {
					StartTime: oSelectedEmp.StartTime,
					EndTime: {__edmType: "Edm.Time", ms:EndTimeMS}
			};

			var oSelectedTableListItem =  oEvent.getSource().getParent();
			var oCustomDateTimeInputEnd = oSelectedTableListItem.getCells()[5];



			oCustomDateTimeInputEnd.setValueState(bundle.getText("tne.lineup.txt.None"));
			oCustomDateTimeInputEnd.setValueStateText("");

			var oReturn = com.bnsf.eam.tne.util.Validators.verifyEmpShiftOverlap(oSelectedEmp, oEmpShift);

			//If error, set control in value state error
			if(oReturn.ValidationResult == "E" && oReturn.EndTimeOverlap){
				oCustomDateTimeInputEnd.setValueState(bundle.getText("tne.lineup.txt.Error"));
				oCustomDateTimeInputEnd.setValueStateText(bundle.getText("tne.lineup.txt.AbsenteeOverlapEndTime"));
			}else{
				//TODO: Update Employee Shift end time and action flag
			};
		},


		/**
		 * Handler for Save draft button in lineup page
		 * Saves the current state of the linup data
		 * Calls generic method to call backend service, which
		 * handles the Busy indicator and backend errors
		 * @public
		 * @memberOf tne.linup
		 * @returns null
		 */
		handleSaveDraft:function(oEvent){
			this._mCallMethod('saveDraft',oEvent)
		},

		/**
		 * Handler for Next button in lineup page
		 * Validates the Linup data and saves the linup data
		 * Calls generic method to call backend service, which
		 * handles the Busy indicator and backend errors
		 * @public
		 * @memberOf tne.linup
		 * @returns null
		 */
		handleNext:function(oEvent){
//			var sGangId = this.getModel().getProperty("/selGang/id");	
//			var oSelectedDate = this.getModel().getProperty("/selGang/workDate");
//			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(oSelectedDate);
//			this.getRouter().navTo('Paycode',{GangId: sGangId, WorkDate: sFormattedDate},false);
			this._mCallMethod('goNext',oEvent);
		},

		/**
		 * Fetches the On Demand Lineup from Backend service
		 * Backend makes a sync call to thirdparty service 
		 * to fetch Live Lineup
		 * 
		 * Method sets the new lineup and table display node of the default UI Model
		 * @private
		 * @memberOf tne.linup
		 * @returns null
		 */
		_getOnDemandLineup: function(oEvent){

			var that = this;
			var oUiModel=this.getModel();

			//initalize parameters for service call
			var userID = oUiModel.getProperty('/user/id');
			var selectedGangTitle = oUiModel.getProperty("/selGang/id");
			var selectedDateTime 	= new Date(oUiModel.getProperty("/selGang/workDate"));
			selectedDateTime = new Date(selectedDateTime);  
			var vDate =  sap.ui.core.format.DateFormat.getDateInstance( {
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"})
				.format(selectedDateTime);	

			var oModelLineUp = sap.ui.getCore().getModel("lineupModel");

			var data = null;
			oModelLineUp.read("/LineUps?$filter=(GangId eq '"+selectedGangTitle+"'and WorkDate eq datetime'"+vDate+"' and LineupType eq 'O' and UserID eq '"+userID+"')&$expand=NavPositions/NavEmployees,NavLineEmp/NavAbsentees",
					null,{}, false,
					function(oData, oResponse){
						/**
						 * Load Positions and Employees
						 */
						try{
							if(oData.results == null || oData.results.length == 0){
								return;
							}
							else{	
								var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
								sap.m.MessageBox.show(bundle.getText("tne.lineup.msg.LineUpOnDemandSuccess"), sap.m.MessageBox.Icon.SUCCESS, bundle.getText("tne.lineup.msg.CallSuccessMsgHeader") ,sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
								data = oData.results[0];
								that._mCreateStructureForLineUp(oData.results[0]); //To prepare data for lineupdisplay
								that._sortAndFilterFactory();
							};
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03009: Error handling response in Get Lineup Service");
						};	
					},function(error){
						try{
							var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();			        						 
							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.lineup.msg.ErrRdngOnDemand"),bundle.getText("tne.lineup.msg.LineupScreenErrorNumber"));
						}
						catch (e) {			        						
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03010: Error handling exception in Get Lineup Service");
						};
					});
		},

		/**
		 * Saves the current state of the linup data
		 * Send the data for Posting and refresh the screen
		 * 
		 * @private
		 * @memberOf tne.linup
		 * @returns null
		 */

		_saveDraft: function(oEvent){

			var that = this;
			var oUiModel = this.getModel();
			/*	
			var oLocalGangDetailDaysModel = sap.ui.getCore().getModel("oLocalGangDetailDaysModel");

			var locGangModel = sap.ui.getCore().getModel("locGangModel");
			var updateData = oLocalGangDetailDaysModel.getData();
			var userID = sap.ui.getCore().getModel('uModel').getProperty('/userData/UserID');
			var selectedGangTitle = locGangModel.getProperty("/gangs/selectedGang/GangTitle");
			var selectedDateTime 	= locGangModel.getProperty("/gangs/selectedDate");
			selectedDateTime = new Date(selectedDateTime);  

			var vDate =  sap.ui.core.format.DateFormat.getDateInstance( {
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"})
				.format(selectedDateTime);
			var oGangDetailDaysModel = sap.ui.getCore().getModel("oDataAllGangDetailsModel");


			 * If there is no data ,just go to the next page


			if(oLocalGangDetailDaysModel.getProperty("/GangId")==null || 
					oLocalGangDetailDaysModel.getProperty("/GangId")==undefined ){

			 *//**
			 * Display message - no data found
			 *//*
				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
				sap.m.MessageBox.show(bundle.getText("Gng_no_data_to_save"), sap.m.MessageBox.Icon.ERROR, bundle.getText("CallFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
				return;
			}*/

			/**
			 * LineUp Data
			 */
			/*
			 * Sending Lineup Data to Backend, only if data exists
			 */
			if(oUiModel .getProperty("/selGang/id") == null || 
					oUiModel.getProperty("/selGang/id") == undefined){ //if selected Gang is blank
//				this._getLineup();
				that._mCallMethod('getLineup','A');
				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
				sap.m.MessageBox.show(bundle.getText("tne.lineup.msg.DataUpdatedSuccessfully"), 
						sap.m.MessageBox.Icon.SUCCESS, 
						bundle.getText("tne.lineup.msg.CallSuccessMsgHeader")
						,sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
				/**
				 * Data has been saved-- Keep a field to mark changes are saved so need need for confirmation on back button
				 */

				this.LINEUP_CHANGED = false;
			}else{	//if selected Gang is not blank, call update method 					
				var linePayLoadP = this._getServicePayloadForLineup('P');		//calling the function to get the actual payload data
				var oLineupModel = sap.ui.getCore().getModel('lineupModel');
				//call backend service
				oLineupModel.create("/LineUps",linePayLoadP, null,
						function(oData, oResponse){		
					try{
						that._mCallMethod('getLineup','A'); //on success read new linup data from backend
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						sap.m.MessageBox.show(bundle.getText("tne.lineup.msg.DataUpdatedSuccessfully"), 
								sap.m.MessageBox.Icon.SUCCESS, 
								bundle.getText("tne.lineup.msg.CallSuccessMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');

						/**
						 * Data has been saved-- Keep a field to mark changes are saved so need need for confirmation on back button
						 */

						this.LINEUP_CHANGED = false;
					} catch (e) {
						this.LINEUP_CHANGED = true;
						com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03013: Error handling response in Post Lineup Data, using Save Draft");
					};
				},
				function(error){
					try{
						this.LINEUP_CHANGED = true;
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();						 			
						com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.lineup.msg.ErrUpdtLineup"),bundle.getText("tne.lineup.msg.LineupScreenErrorNumber"));
					}
					catch (e) {										
						com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03014: Error handling exception in Post Lineup Data");
					};
				}
				);
			};
		},

		/**
		 * Saves the linup data to backend and goes to the next screen
		 * Send the data for Posting and refresh the screen
		 * 
		 * @private
		 * @memberOf tne.linup
		 * @returns null
		 */
		_goNext:function(oEvent){
			var that = this;
			var oUiModel = this.getModel();

			var sGangId=oUiModel.getProperty('/selGang/id');
			var oSelectedDate = this.getModel().getProperty("/selGang/workDate");
			var sFormattedDate = sap.ui.core.format.DateFormat.getDateInstance( {
				style:"full", pattern: "MM-dd-yyyy"})
				.format(oSelectedDate);
			/**
			 * Perform lineup validataions
			 */
			var bValidation = this._validateLineUpData();

			if(!bValidation){
				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
				sap.m.MessageBox.show(bundle.getText("tne.lineup.msg.AbstTimeOverlappWithGngTime"), sap.m.MessageBox.Icon.ERROR, 
						bundle.getText("tne.lineup.msg.CallFailureMsgHeader") ,sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
				return;
			};

			/*
			 * Sending Lineup Data to Backend, only if data exists
			 */
			if(oUiModel .getProperty("/selGang/id") == null || 
					oUiModel.getProperty("/selGang/id")== undefined){ //if selected Gang is blank
				that._mCallMethod('getLineup','A')
				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
				sap.m.MessageBox.show(bundle.getText("tne.lineup.msg.DataUpdatedSuccessfully"), 
						sap.m.MessageBox.Icon.SUCCESS, 
						bundle.getText("tne.lineup.msg.CallFailureMsgHeader")
						,sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
				/**
				 * Data has been saved-- Keep a field to mark changes are saved so need need for confirmation on back button
				 */
				this.LINEUP_CHANGED = false;
			}else{		//if selected Gang is not blank, call update method				

				/**
				 * Send the data
				 */
				var oLineupModel = sap.ui.getCore().getModel('lineupModel');

				var linePayLoadA = this._getServicePayloadForLineup('A'); //call the method with lineupType "A" and get the payload data
				oLineupModel.create("/LineUps",linePayLoadA, null,
						function(oData, oResponse){		
					try{
						that._mCallMethod('getLineup','A');
//						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
//						sap.m.MessageBox.show(bundle.getText("tne.lineup.msg.DataUpdatedSuccessfully"),{ 
//							icon: sap.m.MessageBox.Icon.SUCCESS, 
//							title: bundle.getText("tne.app.Success"),
//							title: sap.m.MessageBox.Action.OK, 
//							onClose: function(oAction) { 
//								/**
//								 * Data has been saved-- Keep a field to mark changes are saved so need need for confirmation on back button
//								 */
//
//								this.LINEUP_CHANGED = false;
//								//navigate to Activites screen
//								that.getRouter().navTo("Activities",{GangId: sGangId, WorkDate: sFormattedDate});
//
//							}
//						});
						this.LINEUP_CHANGED = false;
						//navigate to Activites screen
						that.getRouter().navTo("Activities",{GangId: sGangId, WorkDate: sFormattedDate});
					} catch (e) {	
						this.LINEUP_CHANGED = true;
						com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03013: Error handling response in Post Lineup Data");
					};
				},
				function(error){
					try{
						this.LINEUP_CHANGED = false;
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();						 			
						com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.lineup.msg.ErrUpdtLineup"),bundle.getText("tne.lineup.msg.LineupScreenErrorNumber"));
					}
					catch (e) {										
						com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03014: Error handling exception in Post Lineup Data");
					};
				}
				);
			}
		},

		/**
		 * Performs all validations on linup before Data is saved
		 * Called on click of Page Next
		 * Returns validation results
		 * @private
		 * @memberOf tne.linup
		 * @returns boolean
		 */
		_validateLineUpData:function()
		{
			var flag;
//			var items = this.byId('tne.lineup.tbl_lineup').getItems();
//			for(var incItems =0;incItems<items.length;incItems++){
//			var cells = items[incItems].getCells();
//			var startTimeCell =cells[4];
//			var endTimeCell =cells[5];
//			if(startTimeCell.getValueState()=='Error'
//			||endTimeCell.getValueState()=='Error'	){
//			flag = false;
//			return flag;
//			};
//			};

			flag = true;
			return flag;

		},

		/**
		 * Prepares the payload for posting data to backend
		 * from local data.
		 * 
		 * @private
		 * @memberOf tne.linup
		 * @returns Object
		 */
		_getServicePayloadForLineup: function(sMode){
			var oUiModel = this.getModel();
			var lineupdata = oUiModel.getProperty('/selGang/lineup');		
			if(lineupdata != undefined || lineupdata != null){
				var dupLineup = $.extend(true,{},lineupdata);
				var navLineEmpArray=dupLineup.NavLineEmp;
				var navPositionArray=dupLineup.NavPositions;
				for(var empIterator = 0; empIterator < navLineEmpArray.length; empIterator++){
					var navAbsenteesArray=dupLineup.NavLineEmp[empIterator].NavAbsentees;
					for(var absenteeIterator = 0;absenteeIterator < navAbsenteesArray.length; absenteeIterator++){
						var removeAbProp = navLineEmpArray[empIterator].NavAbsentees[absenteeIterator];
						delete removeAbProp["AbsentRef"];	
					};
				};
				for(var posIterator = 0; posIterator < navPositionArray.length; posIterator++){
					var navEmpArray=dupLineup.NavPositions[posIterator].NavEmployees;
					for(var navEmpIterator = 0; navEmpIterator < navEmpArray.length; navEmpIterator++){
						var removeEmpRefProp=navPositionArray[posIterator].NavEmployees[navEmpIterator];
						delete removeEmpRefProp["NavEmployeeRef"];												
					};
				};
				sMode == "P" ? dupLineup.LineupType = "P": dupLineup.LineupType="A"
			};	

			return dupLineup;
		},

		/**
		 * Calling the SortDialog Fragment to sort the list of items in the table
		 * @public
		 * @memberOf  tne.linup
		 * @returns null
		 */
		onGangTableSettingsPressed:function(){
			if (!this._oSortLineupDialog) {
				this._oSortLineupDialog = sap.ui.xmlfragment("com.bnsf.eam.tne.fragments.LineupSortDialog", this);
			};
			this._oSortLineupDialog.open();
		},
		
		/**
		 * Sorting the linup table based on PayRate, FirstName, LastName and EmployeeNo.
		 * @public
		 * @memberOf  tne.linup
		 * @returns null
		 */
		sortLineup:function(oEvent){// Calling this method from SortDialog.fragment
			
			var oView = this.getView();
			var oTable = oView.byId("tne.lineup.tbl_lineup");
			
			var mParams = oEvent.getParameters();
			var oBinding = oTable.getBinding("items");
			
			var aSorters = [];			
			if (mParams.groupItem) {
				var sPath = mParams.groupItem.getKey();
				var bDescending = mParams.groupDescending;
				var vGroup = this.mGroupFunctions[sPath];
				aSorters.push(new Sorter(sPath, bDescending, vGroup));
			}
			var sPath = mParams.sortItem.getKey();
					
			if(sPath == "empName"){
			var empNameData = oBinding.oList;
				for(var i=0; i<empNameData.length; i++){					
					var EmplyData = empNameData[i].empName;
					var trunk_empData = EmplyData.replace(/[^A-Z,a-z]+/g, '');
					var DESCENDING = true;
					var GROUP =false;
					aSorters.push(new Sorter(trunk_empData, DESCENDING, GROUP));
				};
				oBinding.sort(aSorters);
			}else{
				var bDescending = mParams.sortDescending;
				aSorters.push(new Sorter(sPath, bDescending));
				oBinding.sort(aSorters);
			};
		}

	});
	return LineupController;
});