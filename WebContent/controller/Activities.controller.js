/*-------------------------------------------------
 * Author			: 
 * Creation Date	: 27-Dec-2016
 * Technical Design	:
 * Description		: Controller for Activities Screen
 * 
 * -----------------------------------------------*/
sap.ui.define([
               'com/bnsf/eam/tne/controller/BaseController',
               'sap/ui/model/json/JSONModel',
               'com/bnsf/eam/tne/util/ServiceErrorHandler',
               "com/bnsf/eam/tne/model/models",
               'sap/m/MessageBox',
               'com/bnsf/eam/tne/util/Validators'
               ], function(BaseController, JSONModel, ServiceErrorHandler, models, MessageBox, Validators) {
	"use strict";

	var ActivitiyController = BaseController.extend("com.bnsf.eam.tne.controller.Activities", {

		onInit : function (oEvent) {

			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);
		},


		_onRouteMatched :function(oEvent){
			var uId=this.getModel().getProperty('/user/id');
			var sRoute = oEvent.getParameter("name");
			var selGangId= oEvent.getParameter("arguments").GangId; 
			var workDate= oEvent.getParameter("arguments").WorkDate;

			var viewLevel=this.getRouter().getTargets()._oLastDisplayedTarget._oTargetHandler._iCurrentViewLevel;
			if(sRoute == "Activities"){ 				
				if(viewLevel != 2 )				//check for the viewLevel and bypass the existing activities,if coming back from wrkDayDetail page
					this._mCallMethod('getActivites');  //call mCallMethod to load activities
				else
					this._prepareActivitiesData();
				
			};
		},

		/**
		 * Handler for page exit on back navigation or any other navigation
		 * @private
		 * @memberOf tne.lineup
		 * @returns null
		 */
		handlePageExit:function(){
			this.onNavBack();				
		},

		/**
		 * Generic method to route backend calls 
		 * Handles busy indicator and service errors
		 * @private
		 * @memberOf tne.activities
		 * @returns boolean
		 */
		_mCallMethod : function(pMethod, oArgs){
			var oController = this;
			var oDummyModel = sap.ui.getCore().getModel("userModel");	
			oDummyModel.fireRequestSent();
			var bStatus = null;
			oDummyModel.read('/ServerDetails', null,{}, true,
					function(oData, oResponse){
				try{
					switch(pMethod){
					case 'getActivites':
						oController._onLoad();
						break;
					case 'getPeopleView': 
						oController._getPeopleViewData(oArgs);
						break;
					case 'saveDraft': 
						oController._saveDraft();
						break;
					case 'goNext': 
						oController._goNext();
						break;
					case 'confirmAutoFillGaps': 
						oController._goNextConfirmAutoFill();
						break;	
					}
					oDummyModel.fireRequestCompleted();
				}
				catch(e){
					oDummyModel.fireRequestCompleted();
					ServiceErrorHandler.unknownErrorFunc(e,"Activity - I04001: Error handling Response in Dummy Service");
				};
			},
			function(error){
				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
				try{
					ServiceErrorHandler.handleODataError(error,bundle.getText("tne.app.Error"), bundle.getText("tne.activities.msg.LineupScreenErrorNumber"));
					oDummyModel.fireRequestCompleted(); 
				}
				catch(e){
					oDummyModel.fireRequestCompleted(); 
					ServiceErrorHandler.unknownErrorFunc(e,"Activity - I04002: Error handling exception in Dummy Service");
				}
			});
			return bStatus;
		},

		/**
		 * Called when a screen is instantiated to load activities data 
		 * Loads activities data and sets in default UI model
		 * @memberOf tne.Activities
		 */	
		_onLoad:function(){
			var oUiModel=this.getModel();
			var oDataSrvForGangActivity =  sap.ui.getCore().getModel("oDataSrvForGangActivity");
			var oController=this;
			var selectedGangTitle = oUiModel.getProperty('/selGang/id');
			var userID = oUiModel.getProperty('/user/id');

			var selectedDateTime = oUiModel.getProperty("/selGang/workDate");

			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);

			oDataSrvForGangActivity.read(
					"/GangActivities?$filter=(GangId eq '"+selectedGangTitle+"' and UserId eq '"+userID+"' " +
					"and WorkDate eq datetime'"+vDate+"' and Extension1 eq 'V2')&$expand=NavGangActivity/NavActivityPeople",
					null,{}, true,
					function(oData, oResponse){
						try
						{
							var aActivites = oData.results[0].NavGangActivity.results;
							var defaultWorkCenter = oData.results[0].DefaultCostCenter;
							
							for(var i = 0; i < aActivites.length; i++){
								if(aActivites[i].StartDate == null){
									aActivites[i].StartDate = oUiModel.getProperty('/selGang/workDate');
								}else{
									//format start date to remove time zone offset
									aActivites[i].StartDate = com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(aActivites[i].StartDate.getTime());
								};
								
								if(aActivites[i].EndDate == null){
									aActivites[i].EndDate = oUiModel.getProperty('/selGang/workDate');
								}else{
									//format end date to remove time zone offset
									aActivites[i].EndDate = com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(aActivites[i].EndDate.getTime());
								};
								
								//format work date to remove time zone offset
								aActivites[i].WorkDate = com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(aActivites[i].WorkDate.getTime());
								
								//get activity people
								var navActPeople = aActivites[i].NavActivityPeople.results;
								//default start and end dates if null and time zone negate them in Activity-People
								for(var j = 0; j < navActPeople.length; j++){
									if(navActPeople[j] != null || navActPeople[j] != undefined){
										if(navActPeople[j].StartDate == null){
											navActPeople[j].StartDate = oUiModel.getProperty('/selGang/workDate');
										}else{
											//format start date to remove time zone offset
											navActPeople[j].StartDate = com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(navActPeople[j].StartDate.getTime());
										};
										if(navActPeople[j].EndDate == null){
											navActPeople[j].EndDate = oUiModel.getProperty('/selGang/workDate');
										}else{
											//format end date to remove time zone offset
											navActPeople[j].EndDate = com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(navActPeople[j].EndDate.getTime());
										};
									};
								};
								
								aActivites[i].NavActivityPeople = navActPeople;
							};

							//set properties of default UI model
							oUiModel.setProperty('/selGang/defaultCostCenter',defaultWorkCenter);
							oUiModel.setProperty('/selGang/activities', aActivites);

							oUiModel.refresh();
							oController._prepareActivitiesData();
						}catch (e) {
							ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04025: Error handling response in Get Gang Activity Service"); 
						}
					},
					function(error){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();					
						try {
							ServiceErrorHandler.handleODataError(error,bundle.getText("tne.activities.msg.ActivityReadErrorHeader"),bundle.getText("tne.Activities.msg.ActivityScreenErrorNumber"));
						} catch (e) {
							ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04026: Error handling exception in Get Gang Activity Service"); 
						};
					}
			)
		},
		
		/**
		 * 
		 * Method called from _onLoad function to prepare the activites data
		 * Also the local model's activitiesDisplay node data is populated,
		 * The ActivityDetails view data is set in this function 
		 * 		       		 
		 * @private
		 * @memberOf tne.Activities
		 * @returns null
		 */

		_prepareActivitiesData: function(){

			var oUiModel=this.getModel();

			var aActivites = oUiModel.getProperty('/selGang/activities');

//			var navactPpl= oUiModel.getProperty('/selGang/activities/NavActivityPeople');

			if(aActivites != null){
				var actualHrsArray = [];
				var activityArray = [];
				var peopleArray = [];
				
				var iActivitesCount = 0 ;

				for(var i = 0; i < aActivites.length; i++){
					var activityType = oUiModel.getProperty('/selGang/activities/'+i+'/ActivityType');
					
					//insert index of Activity for later updates
					aActivites[i].Index = i;

					//find activities for Actual Hours
					if(activityType == "AH" || activityType == "MB" || activityType == "WM" ){
						aActivites[i].TaskName = this._getWorkDayTypeDescription(activityType);
						actualHrsArray.push(aActivites[i]);
					}else if(activityType =="WA" || activityType == "IO" || activityType == "DE"){
						iActivitesCount++;
						activityArray.push(aActivites[i]);
						activityArray.reverse();
					};
				};
				
				if(iActivitesCount > 0)
					this._mCallMethod('getPeopleView');		//call peopleViewData via generic handler

				var activityStructure = {
						actualHours: actualHrsArray,
						activities: activityArray,
						people: peopleArray      				
				};

				oUiModel.setProperty('/selGang/activitiesDisplay', activityStructure);
				oUiModel.refresh();
				this.getView().setModel(oUiModel);
			};
		},
		
		/**
		 * 
		 * Gets the description of Work Day Activity type for Code	
		 * Return the Descriptin of the ActivityType code passed	       		 
		 * @private
		 * @memberOf tne.Activities
		 * @returns String
		 */
		_getWorkDayTypeDescription: function(oWorkDayType){
			var aActivityTypes = models.getActualHoursValueHelp();
			var sActivityDesc = "";
			for(var i = 0; i < aActivityTypes.length; i++ ){
				if(aActivityTypes[i].key == oWorkDayType){
					sActivityDesc = aActivityTypes[i].description;
					break;
				};
			};
			
			return sActivityDesc;
		},

		/**
		 * 
		 * Handler method called when clicked on an activity other than Actual hrs
		 * Navigates to activityDetails view		       		 
		 * @public
		 * @memberOf tne.Activities
		 * @returns null
		 */

		handleLineItemPress:function(oEvent){
			var oUiModel = this.getModel();
			var sGangId = oUiModel.getProperty("/selGang/id");
			var workDate = oUiModel.getProperty('/selGang/workDate');
			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(workDate);

			var oBindingContext = oEvent.getSource().getBindingContext();
			var sPath = oBindingContext.sPath;		

			var oSelActivity = oUiModel.getProperty(sPath);

			var aActivityPeople = this._fetchPplData(oSelActivity);

			var oActivity = jQuery.extend(true, {}, oSelActivity);

			//update the format or Date and times
			oActivity.StartTime =  com.bnsf.eam.tne.util.DateAndTimeConversion.offsetConversion(oSelActivity.StartTime.ms);
			oActivity.EndTime =  com.bnsf.eam.tne.util.DateAndTimeConversion.offsetConversion(oSelActivity.EndTime.ms);
			oActivity.StartDate = com.bnsf.eam.tne.util.DateAndTimeConversion.activityDateDDMM(oSelActivity.StartDate);
			oActivity.EndDate = com.bnsf.eam.tne.util.DateAndTimeConversion.activityDateDDMM(oSelActivity.EndDate);
			oActivity.NavActivityPeople = aActivityPeople;
			oActivity.LSRef = oUiModel.getProperty('/selGang/valueHelp/LineSegments');
			
			com.bnsf.eam.tne.util.FetchValueHelps.getOVReason(""); //call the util method to populate OTcode
			oActivity.OVReasonRef = oUiModel.getProperty('/selGang/valueHelp/OVReason')
			var oActivityDetailsModel = new JSONModel();
			oActivityDetailsModel.setData(oActivity);
			sap.ui.getCore().setModel(oActivityDetailsModel, "oActivityDetailsModel");

			var start = sPath.lastIndexOf("/") + 1;			
			var indexPath = sPath.substring(start, sPath.length);

			this.getRouter().navTo("ActivityDetails",{GangId: sGangId, WorkDate: sFormattedDate, ActSeq: indexPath});	
		},

		/**
		 * Handler method called when a screen is instantiated to load activities data 
		 * Loads activities data and sets in default UI model
		 * Navigates to workDayDetails view	
		 * 
		 * @public
		 * @memberOf tne.Activities
		 */	
		handleItemPress_ActualHrs:function(oEvent)
		{

			var oUiModel = this.getModel();
			var sGangId = oUiModel.getProperty("/selGang/id");
			var workDate = oUiModel.getProperty('/selGang/workDate');
			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(workDate);
			var oBindingContext = oEvent.getSource().getBindingContext();
			var sPath = oBindingContext.sPath;		
			var oSelActivity = oUiModel.getProperty(sPath);
			var aActivityPeople = this._fetchPplData(oSelActivity);	//fetch the people data
			var oActivity = jQuery.extend(true, {}, oSelActivity);	 
			
			var aActivityTypes = models.getActualHoursValueHelp();

			//update the format or Date and times
			oActivity.StartTime =  com.bnsf.eam.tne.util.DateAndTimeConversion.offsetConversion(oSelActivity.StartTime.ms);
			oActivity.EndTime =  com.bnsf.eam.tne.util.DateAndTimeConversion.offsetConversion(oSelActivity.EndTime.ms);
			oActivity.StartDate = com.bnsf.eam.tne.util.DateAndTimeConversion.activityDateDDMM(oSelActivity.StartDate);
			oActivity.EndDate = com.bnsf.eam.tne.util.DateAndTimeConversion.activityDateDDMM(oSelActivity.EndDate);
			oActivity.NavActivityPeople = aActivityPeople;

			oActivity.ActivityTypeRef = aActivityTypes;	//push the array into the model structure
			com.bnsf.eam.tne.util.FetchValueHelps.getOVReason(""); //call the util method to populate OTcode
			oActivity.OVReasonRef = oUiModel.getProperty('/selGang/valueHelp/OVReason');
			var oActivityDetailsModel = new JSONModel();
			oActivityDetailsModel.setData(oActivity);
			sap.ui.getCore().setModel(oActivityDetailsModel, "oActivityDetailsModel");

			var start = sPath.lastIndexOf("/") + 1;			
			var indexPath = sPath.substring(start, sPath.length);

			this.getRouter().navTo("WorkDayDetails",{GangId: sGangId, WorkDate: sFormattedDate,ActSeq: indexPath});	

		},
		/**
		 * Called from handleItemPress_ActualHrs method to fetch the people data by creating a structure
		 * 
		 * 
		 * @private
		 * @memberOf tne.Activities
		 * 
		 * returns array
		 */	
		
		_fetchPplData: function(oActivity){
			var oUiModel = this.getModel();

			var uniqueEmpList = oUiModel.getProperty('/selGang/uniqueEmployeeList');

			var ActPPlArray = [];

			//default values if activity is not passed
			var aActivityPeople = [];
			var ActivityID = 0;
			var EventID = 0;
			var PositionId = 0;
			var GangID = oUiModel.getProperty("/selGang/id");
			var oWorkDate = oUiModel.getProperty('/selGang/workDate');
			var oStartDate = oWorkDate;
			var oEndDate = oWorkDate;
			var oStartTime = oUiModel.getProperty("/selGang/dayGangProfile/StartTime/ms");
			var oEndTime = oUiModel.getProperty("/selGang/dayGangProfile/EndTime/ms");
			if(!(oActivity == undefined || oActivity == null)){ //assign values if activity is passed
				aActivityPeople = oActivity.NavActivityPeople;
				ActivityID = oActivity.ActivityID;
				PositionId = oActivity.PositionId;
				EventID = oActivity.EventID;
				oEndDate =	oActivity.EndDate;
				oStartDate = oActivity.StartDate;
				oStartTime = oActivity.StartTime.ms;
				oEndTime = oActivity.EndTime.ms;
			};

			for(var i = 0; i < uniqueEmpList.length; i++){
				//create structure for Activity People
				var pplStruct={
						Selected: false,
						Action : "",
						ActivityID: ActivityID,
						EmployeeId : uniqueEmpList[i].EmployeeId,
						EmployeeDisplayName : com.bnsf.eam.tne.util.UserNameFormatter.empNoWithAbbName(uniqueEmpList[i].EmployeeId, uniqueEmpList[i].FirstName, uniqueEmpList[i].MiddleName, uniqueEmpList[i].LastName, uniqueEmpList[i].Salutation, 50),
						EndDate : "",
						EndTime : "",
						EventID:  EventID,
						GangId: GangID,
						PositionId: PositionId,
						StartDate: "",
						StartTime : "",
						WorkDate : oWorkDate	
				};

				for(var j = 0; j < aActivityPeople.length; j++){		
					if(uniqueEmpList[i].EmployeeId == aActivityPeople[j].EmployeeId){ //match found
						pplStruct.Selected = true;
						pplStruct.Action = aActivityPeople[j].Action;
						pplStruct.EndDate = com.bnsf.eam.tne.util.DateAndTimeConversion.activityDateDDMM(aActivityPeople[j].EndDate);
						pplStruct.EndTime = com.bnsf.eam.tne.util.DateAndTimeConversion.offsetConversion(aActivityPeople[j].EndTime.ms);
						pplStruct.StartDate = com.bnsf.eam.tne.util.DateAndTimeConversion.activityDateDDMM(aActivityPeople[j].StartDate);
						pplStruct.StartTime = com.bnsf.eam.tne.util.DateAndTimeConversion.offsetConversion(aActivityPeople[j].StartTime.ms);

						ActPPlArray.push(pplStruct);
					};
				};
				if(!pplStruct.Selected){//match not found push employee as unselected
					pplStruct.Action = "N";
					pplStruct.EndDate = com.bnsf.eam.tne.util.DateAndTimeConversion.activityDateDDMM(oEndDate);
					pplStruct.EndTime = com.bnsf.eam.tne.util.DateAndTimeConversion.offsetConversion(oEndTime);
					pplStruct.StartDate = com.bnsf.eam.tne.util.DateAndTimeConversion.activityDateDDMM(oStartDate);
					pplStruct.StartTime = com.bnsf.eam.tne.util.DateAndTimeConversion.offsetConversion(oStartTime);

					ActPPlArray.push(pplStruct)
				};
			};
			return ActPPlArray;
		},

/** on click of add new button in the activity screen
 * Condition, Activity type=WA
 * @param oEvent
 * 
 * **/
		onAddNewActivity:function(oEvent){
			this._addNew("WA"); //Get model for new Work activity and call Activity Details page
		},

/** on click of add new button in the activity screen
 * 
 * Condition, Activity type=AH * 
 * @param oEvent
 */		
		onAddNewWorkDetails:function(oEvent){
			this._addNew("AH"); //Get model for new Actual Hours and call Activity Details page
		},


		_addNew: function(sType){
			var oUiModel=this.getModel();
			var sGangId= oUiModel.getProperty("/selGang/id");
			var workDate = oUiModel.getProperty('/selGang/workDate');
			var oGangST = oUiModel.getProperty("/selGang/dayGangProfile/StartTime/ms");
			var oGangET = oUiModel.getProperty("/selGang/dayGangProfile/EndTime/ms");
			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(workDate);

			//get People structure:
			var aActivityPeople = this._fetchPplData(undefined);
			//create default model for new expense
			var oNewActivityModel = models.createActivityDetailsModel(sGangId, workDate, oGangST, oGangET);
			if(sType == "AH"){
				oNewActivityModel.setProperty("/ActivityTypeRef", models.getActualHoursValueHelp());
				com.bnsf.eam.tne.util.FetchValueHelps.getOVReason(""); //call the util method to populate OTcode
				oNewActivityModel.setProperty("/OVReasonRef", oUiModel.getProperty('/selGang/valueHelp/OVReason'));
			}else{
				oNewActivityModel.setProperty("/ActivityType", "WA");
			};
			oNewActivityModel.setProperty("/NavActivityPeople", aActivityPeople);
			//set expense model
			sap.ui.getCore().setModel(oNewActivityModel, "oActivityDetailsModel");
			
			var indexPath = "-1";

			if(sType == "AH"){
				this.getRouter().navTo("WorkDayDetails",{GangId:sGangId, WorkDate:sFormattedDate, ActSeq:indexPath});
			}else{
				com.bnsf.eam.tne.util.FetchValueHelps.getOVReason(""); //call the util method to populate OTcode
				oNewActivityModel.setProperty("/OVReasonRef", oUiModel.getProperty('/selGang/valueHelp/OVReason'));
				this.getRouter().navTo("ActivityDetails",{GangId:sGangId, WorkDate:sFormattedDate, ActSeq:indexPath});	
			};
						
		},

		/**
		 * called on click of save draft button
		 * method in turn calls Generic method with argument 'saveDraft'
		 * 
		 * 
		 * returns null
		 */
		saveDraft_Activity:function(){
			this._mCallMethod('saveDraft');	
		},
/**
 * 1. This method tailors the payload according the backend structure 
 * 2. Save the data to the backend
 * 
 * @private
 */
		_saveDraft:function(){

			var oUiModel = this.getModel();
			var oDataSrvForGangActivity =  sap.ui.getCore().getModel("oDataSrvForGangActivity");
			this._mCleanUpPayload(); //cleanup metadata from the navGangActivity and it's people	
			var updateData = this._prepareActivityPostPayload({Mode: "S"});	

			//call create operation to save activites
			oDataSrvForGangActivity.create(
					"/GangActivities",
					updateData ,null,
					function(oData, oResponse){
						/**
						 * once the data is sent, send request to backend so all Update,Create markers are initialised again.
						 */
						try{
							jQuery.sap.require("sap.m.MessageBox"); 
							if(oData.OpResult =='E'){
								var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
								sap.m.MessageBox.show(oData.OpResultMsg, 
										sap.m.MessageBox.Icon.ERROR, 
										bundle.getText("tne.app.Error"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
							}else{
								/**
								 * Data has been saved-- Keep a field to mark changes are saved so need need for confirmation on back button
								 */								
//								this.ActChanged = false;
								var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
								sap.m.MessageBox.show(bundle.getText("tne.activties.msg.DataUpdatedSuccessfully"), 
										sap.m.MessageBox.Icon.SUCCESS, 
										bundle.getText("tne.app.Success"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
							};							
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04027: Error handling response in Post Gang Activity Service"); 							
						};
					},
					function(error){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						jQuery.sap.require("sap.m.MessageBox");
						try {							
							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.activities.msg.ActivitySendActErrorHeader"),bundle.getText("tne.Activities.msg.ActivityScreenErrorNumber"));
//							sap.m.MessageBox.show(oData.error.message.value, 
//									sap.m.MessageBox.Icon.ERROR, 
//									bundle.getText("tne.app.Error"), sap.m.MessageBox.Action.OK, null, null, 'dummyStyleClass');
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04028: Error handling exception in Post Gang Activity Service"); 
						};
					}
			);		
		},

		/**
		 * method calls the generic method _mcallMethod 
		 * @public
		 */
		goNext:function(){
			this._mCallMethod('goNext');
		},
/**
 * creates the structure for posting the data to the backend
 * Navigates to paycode screen if OpResult='S'
 * if OpResult='E'
 * 
 * 
 * @private
 */
		_goNext:function(){
			var oController = this;
			var oUiModel = this.getModel();
			var sGangId = this.getModel().getProperty("/selGang/id");	
			var oSelectedDate = this.getModel().getProperty("/selGang/workDate");
			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(oSelectedDate);
			var oDataSrvForGangActivity =  sap.ui.getCore().getModel("oDataSrvForGangActivity");			
			var updateData = oController._prepareActivityPostPayload({Mode: "U"});

			//call backend service
			oDataSrvForGangActivity.create(
					"/GangActivities",
					updateData ,null,
					function(oData, oResponse){
						/**
						 * once the data is sent, send request to backend so all Update,Create markers are initialised again.
						 */
						try{
//							jQuery.sap.require("sap.m.MessageBox");
							var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
							if(oData.OpResult == 'E'){
								MessageBox.show(oData.OpResultMsg,{ 
									icon: sap.m.MessageBox.Icon.ERROR, 
									title: bundle.getText("tne.app.Error"), 
									actions: [sap.m.MessageBox.Action.OK], 
									onClose: function(){
										oController._getPeopleViewData();  //call method _getPeopleViewData
										return;
									}
								});

								/**
								 * Data has been saved-- Keep a field to mark changes are saved so need need for confirmation on back button
								 */							
							}else if(oData.OpResult == 'W'){
								MessageBox.show(oData.OpResultMsg, {
									icon: sap.m.MessageBox.Icon.QUESTION, 
									title: bundle.getText("tne.app.Confirm"), 
									actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
									onClose: function(oAction){
										if(oAction == "OK"){
											//post activites data once again with OP Mode "P"
											oController._mCallMethod('confirmAutoFillGaps');
										};
									}
								});
							}else if(oData.OpResult == 'S' || oData.OpResult == ''){
								//navigate to paycode screen
								oController.getRouter().navTo('Paycode',{GangId:sGangId, WorkDate:sFormattedDate});
							};
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04027: Error handling response in Post Gang Activity Service"); 
						};
					},
					function(error){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						jQuery.sap.require("sap.m.MessageBox");
						try {
							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.activities.msg.ActivityNextBtnFailHeader"),bundle.getText("tne.Activities.msg.ActivityScreenErrorNumber"));
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04028: Error handling exception in Post Gang Activity Service"); 
						};
					}
			);		
		},

		_goNextConfirmAutoFill: function(){
			var oController = this;
			var oUiModel = this.getModel();
			var sGangId = this.getModel().getProperty("/selGang/id");	
			var oSelectedDate = this.getModel().getProperty("/selGang/workDate");
			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(oSelectedDate);
			var oDataSrvForGangActivity =  sap.ui.getCore().getModel("oDataSrvForGangActivity");		

			var updateData = oController._prepareActivityPostPayload({Mode: "P"});

			//call backend service
			oDataSrvForGangActivity.create(
					"/GangActivities",
					updateData ,null,
					function(oData, oResponse){
						/**
						 * once the data is sent, send request to backend so all Update,Create markers are initialised again.
						 */
						try{
//							jQuery.sap.require("sap.m.MessageBox");
							var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
							if(oData.OpResult == 'E'){
								MessageBox.show(oData.OpResultMsg,{ 
									icon: sap.m.MessageBox.Icon.ERROR, 
									title: bundle.getText("tne.app.Error"), 
									actions: [sap.m.MessageBox.Action.OK], 
									onClose: function(){
										oController._getPeopleViewData();  //call method _getPeopleViewData
										return;
									}
								});

								/**
								 * Data has been saved-- Keep a field to mark changes are saved so need need for confirmation on back button
								 */							
							}else if(oData.OpResult == 'S' || oData.OpResult == ''){
								//navigate to paycode screen
								oController.getRouter().navTo('Paycode',{GangId:sGangId, WorkDate:sFormattedDate});
							};
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04027: Error handling response in Post Gang Activity Service"); 
						};
					},
					function(error){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						jQuery.sap.require("sap.m.MessageBox");
						try {
							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.activities.msg.ActivityNextFillGapHeader"),bundle.getText("tne.Activities.msg.ActivityScreenErrorNumber"));
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04028: Error handling exception in Post Gang Activity Service"); 
						};
					}
			);		
		},

		_getPeopleViewData:function(){
			var oController = this;
			var oUiModel = this.getModel();
			var sGangId = this.getModel().getProperty("/selGang/id");	
			var oSelectedDate = this.getModel().getProperty("/selGang/workDate");
			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(oSelectedDate);
			var oDataSrvForGangActivity =  sap.ui.getCore().getModel("oDataSrvForGangActivity");			
			var updateData = oController._prepareActivityPostPayload({Mode: "V"});

			//call backend service
			oDataSrvForGangActivity.create(
					"/GangActivities",
					updateData ,null,
					function(oData, oResponse){
						/**
						 * once the data is sent, send request to backend so all Update,Create markers are initialised again.
						 */
						try{						
							oController._populatePeopleTableData(oData);	//call one more method to popualte people table data
						}catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04027: Error handling response in Post Gang Activity Service"); 
						};
					},
					function(error){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						jQuery.sap.require("sap.m.MessageBox");
						try {
							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.activities.msg.ActivityNextBtnFailHeader"),bundle.getText("tne.Activities.msg.ActivityScreenErrorNumber"));
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04028: Error handling exception in Post Gang Activity Service"); 
						};
					},true
			);		
		
			
			
			
			
		},
		/**
		 * method to populate people's data in activities screen
		 * 
		 * 
		 * member of tne.Activities
		 * @param oData
		 * 
		 * returns null
		 */
		_populatePeopleTableData:function(oData){
			var navActPpl = oData.NavGangActivityPeople.results;			
			var oUiModel = this.getModel();
			var aPplArray = [];
			for(var i=0;i<navActPpl.length;i++){								
				var oPplStructure = {
					EmployeeId:navActPpl[i].EmpId,
					EmployeeDisplayName:com.bnsf.eam.tne.util.UserNameFormatter.empNoWithAbbName (navActPpl[i].EmpId,navActPpl[i].FirstName,
							navActPpl[i].MiddleName,navActPpl[i].LastName,navActPpl[i].Salutation,50),
					ActivityCount: "", //Count of items in NavPeopleActivity
					Overlap: true,// when looping NavPeopleActivity check if any of the records have property TimeOvelap as true
					NavPeopleActivity: [],//Items of NavPeopleActivity with following structure
				};
				aPplArray.push(oPplStructure);
			};
			oUiModel.setProperty('/selGang/activitiesDisplay/people',aPplArray);
		},
		
		/**
		 * method to navigate to people's activity page to show the overlap
		 * 
		 * 
		 * member od tne.activities
		 * returns null
		 * 
		 * 
		 */
		goToPeopleActPage:function(oEvent){
			var oUiModel=this.getModel();
			var sGangId = oUiModel.getProperty("/selGang/id");
			var workDate = oUiModel.getProperty('/selGang/workDate');
			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(workDate);
	
			var oBindingContext = oEvent.getSource().getBindingContext();
			var sPath = oBindingContext.sPath;		
			var start = sPath.lastIndexOf("/") + 1;			
			var indexPath = sPath.substring(start, sPath.length);	
			var oEmpID = oUiModel.getProperty(sPath+"/EmployeeId");
			
			this.getRouter().navTo("ActivityPeople",{GangId: sGangId, WorkDate: sFormattedDate, ActSeq:indexPath,EmpID: oEmpID});
		},
		

		/**
		 * 
		 * This method creates the final structure to be sent to the backend and returns the data back to the called function
		 * 
		 * @param oArgs Mode="S" or Mode = "P"
		 * 
		 * @returns object
		 */
		_prepareActivityPostPayload: function(oArgs){
			if(oArgs == undefined || oArgs == null){
				return undefined;
			}else if(oArgs.Mode == undefined || oArgs.Mode == null || oArgs.Mode == ""){
				return undefined;
			}else{
				var oUiModel=this.getModel();

				var aActivities = this._mCleanUpPayload(); //cleanup metadata from the navGangActivity and it's people

				var updateData = {					
						DefaultCostCenter: oUiModel.getProperty('/selGang/defaultCostCenter'),	
						Extension1:"V2",
						Extension2:"",
						GangId: oUiModel.getProperty('/selGang/id'),
//						NavGangActivity: oUiModel.getProperty('/selGang/activities'),
						NavGangActivity: aActivities,
						NavGangActivityPeople: [{NavPeopleActivity: []}], //blank structures to ensure these entities are sent back in OData response.
						OpResult:"",
						OpResultMsg:"",
						OpType: oArgs.Mode,					//opType U for goNext method
						UserId:oUiModel.getProperty('/user/id'),
						WorkDate: oUiModel.getProperty('/selGang/workDate')				
				};
				return updateData;
			};
		},
		/**
		 * 
		 * method to clean up metadata and Index object from the local model
		 */
		_mCleanUpPayload:function(){
			var oUiModel=this.getModel();	
			var activities = jQuery.extend(true, [], oUiModel.getProperty('/selGang/activities'));

			/** Deleting the __metadata from object **/
			for(var i=0; i<activities.length; i++){
				delete activities[i].Index;						//remove index property
			var navPplArray=  oUiModel.getProperty('/selGang/activities/'+i+'/NavActivityPeople');
				delete activities[i].__metadata;
				for(var j=0;j<navPplArray.length;j++){
					delete navPplArray[j].__metadata;
				};
			};
			
			return activities;
		}

	});
	return ActivitiyController;
});