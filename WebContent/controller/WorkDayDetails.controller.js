/*-------------------------------------------------
 * Author			: C840859
 * Creation Date	: 27-Dec-2016
 * Technical Design	:
 * Description		: Controller for WorkDayDetail Screen
 * 
 * -----------------------------------------------*/
sap.ui.define([
               'com/bnsf/eam/tne/controller/BaseController',
               'sap/ui/model/json/JSONModel',
               "com/bnsf/eam/tne/model/models",
               'sap/m/MessageToast'
               ], function(BaseController, JSONModel,models,MessageToast) {
	"use strict";

	var WorkDayDetailsController = BaseController.extend("com.bnsf.eam.tne.controller.WorkDayDetails", {


		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf system
		 */	
		onInit : function (oEvent) {
			this._activityDetailsChanged=false; 
			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);
		},


		/**
		 * On route matched for workDayDetail screen
		 * Instantiates Actual hours details data
		 * @private
		 * @memberOf tne.wrkDayDetail
		 * @returns null
		 */

		_onRouteMatched :function(oEvent){

			var sRoute = oEvent.getParameter("name");        				
			if(sRoute == "WorkDayDetails"){ 
				this._initalizeActHrsDetailsPage();  //called to load the Actual hours details data

			};

		},
		/**
		 * Loads the Activity details 
		 * @private
		 * @memberOf tne.wrkDayDetail
		 * @returns null
		 */
		_initalizeActHrsDetailsPage:function()
		{



			var oActivityDetailsModel=  sap.ui.getCore().getModel('oActivityDetailsModel').getData();       			

			this.getView().setModel(sap.ui.getCore().getModel('oActivityDetailsModel'));
			var OTReasonCodeComboBox=this.byId("tne.wrkDayDetail.OTReasonCode");
			var ovTime=this._checkForOvertime();

			ovTime? OTReasonCodeComboBox.setEnabled(true): OTReasonCodeComboBox.setEnabled(false);

		},
		/**
		 * change event for time picker and Date picker
		 * checks for overtime and returns whether the activity has overtime or not
		 * @public
		 * @memberOf tne.wrkDayDetail
		 * @returns boolean
		 */

		
				customChange_StartDate:function()
				{
					
					var oActivityDetailsModel= sap.ui.getCore().getModel("oActivityDetailsModel");
					
					
					this._activityDetailsChanged=true;
					
					
					var oActppl=  sap.ui.getCore().getModel('oActivityDetailsModel').getProperty('/NavActivityPeople');		
					
					
					
					var OTReasonCodeComboBox=this.byId("tne.wrkDayDetail.OTReasonCode")
					var ovTime=	this._checkForOvertime();

					ovTime? OTReasonCodeComboBox.setEnabled(true): OTReasonCodeComboBox.setEnabled(false);
					
				for(var i=0;i<oActppl.length;i++)
					{
										
					oActivityDetailsModel.setProperty('/NavActivityPeople/'+i+'/StartDate',oActivityDetailsModel.getProperty('/StartDate'));
					oActivityDetailsModel.refresh();
					}
					},
					customChange_StartTime:function()
					{
						
						var oActivityDetailsModel= sap.ui.getCore().getModel("oActivityDetailsModel");
						
						
						this._activityDetailsChanged=true;
						
						
						var oActppl=  sap.ui.getCore().getModel('oActivityDetailsModel').getProperty('/NavActivityPeople');		
						
						
						
						var OTReasonCodeComboBox=this.byId("tne.wrkDayDetail.OTReasonCode")
						var ovTime=	this._checkForOvertime();

						ovTime? OTReasonCodeComboBox.setEnabled(true): OTReasonCodeComboBox.setEnabled(false);
						
					for(var i=0;i<oActppl.length;i++)
						{
						
						oActivityDetailsModel.setProperty('/NavActivityPeople/'+i+'/StartTime',oActivityDetailsModel.getProperty('/StartTime'));
						oActivityDetailsModel.refresh();
					
						}
						},
						customChange_EndDate:function()
						{
							
							var oActivityDetailsModel= sap.ui.getCore().getModel("oActivityDetailsModel");
							
							
							this._activityDetailsChanged=true;
							
							
							var oActppl=  sap.ui.getCore().getModel('oActivityDetailsModel').getProperty('/NavActivityPeople');		
							
							
							
							var OTReasonCodeComboBox=this.byId("tne.wrkDayDetail.OTReasonCode")
							var ovTime=	this._checkForOvertime();

							ovTime? OTReasonCodeComboBox.setEnabled(true): OTReasonCodeComboBox.setEnabled(false);
							
						for(var i=0;i<oActppl.length;i++)
							{
						
							oActivityDetailsModel.setProperty('/NavActivityPeople/'+i+'/EndDate',oActivityDetailsModel.getProperty('/EndDate'));
							oActivityDetailsModel.refresh();
							}
							},
							
							customChange_EndTime:function()
							{
								
								var oActivityDetailsModel= sap.ui.getCore().getModel("oActivityDetailsModel");
								
								
								this._activityDetailsChanged=true;
								
								
								var oActppl=  sap.ui.getCore().getModel('oActivityDetailsModel').getProperty('/NavActivityPeople');		
								
								
								
								var OTReasonCodeComboBox=this.byId("tne.wrkDayDetail.OTReasonCode")
								var ovTime=	this._checkForOvertime();

								ovTime? OTReasonCodeComboBox.setEnabled(true): OTReasonCodeComboBox.setEnabled(false);
								
							for(var i=0;i<oActppl.length;i++)
								{
																
								oActivityDetailsModel.setProperty('/NavActivityPeople/'+i+'/EndTime',oActivityDetailsModel.getProperty('/EndTime'));
								oActivityDetailsModel.refresh();
								}
								},
		/**
		 * Selection change event for OTReason code drop down
		 * checks for overtime and activity type and returns whether the activity has overtime or not
		 * @public
		 * @memberOf tne.wrkDayDetail
		 * @returns boolean
		 */
		enableOTReasonCode:function(oEvent)
		{
			this._activityDetailsChanged=true;
			var oActivityDetailsModel= sap.ui.getCore().getModel("oActivityDetailsModel");
			var OTReasonCodeComboBox=this.byId("tne.wrkDayDetail.OTReasonCode");
			if(oActivityDetailsModel.getProperty('/ActivityType')==='WM')		//if activity working meal,no need to check for overtime
				{
				OTReasonCodeComboBox.setEnabled(true);		//enable OTReasoncode dropdown box
				return;
				}
			else
				{
				
				var ovTime=	this._checkForOvertime();

				ovTime? OTReasonCodeComboBox.setEnabled(true): OTReasonCodeComboBox.setEnabled(false);        
				
				}
			
					


		},	

		/**
		 * Method called on click of save button
		 * Calls private method __activity_validations() to check for the activity validations
		 * 
		 * @public
		 * @memberOf tne.wrkDayDetail
		 * @returns object
		 */
		saveActualHrs:function(){
			var oController = this;
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			var oUiModel = oController.getModel();
			var oActValidations = oController._activity_validations();

			var activities = oUiModel.getProperty('/selGang/activities');
			var oActivityDetailsModel=sap.ui.getCore().getModel('oActivityDetailsModel');
			var sCallMode = "";

			oActivityDetailsModel.getProperty("/Action") == 'N'? sCallMode = "N": sCallMode = "U";

			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();

			if(oActValidations.sValidationResult === "E"){
				sap.m.MessageBox.show(
						oActValidations.sValidationResultText, 
						sap.m.MessageBox.Icon.ERROR,
						bundle.getText("tne.app.Error"),
						sap.m.MessageBox.Action.OK,
						null,
						null,
						'dummyStyleClass'
				);
				oActValidations.fnValidationAction();	
				return;
			}
			else if(oActValidations.sValidationResult === "S"){
				 //method to consolidate payload data
				var payLoadData = this._preparePayloadData(sCallMode);
				if(sCallMode == "N"){				
					var iActivitesLength = activities.length;
					payLoadData.Index = iActivitesLength;
					
//					this._removeIndexProperty(payLoadData);
					
					
					activities.push(payLoadData);
					//TODO: Keep message Toast with message 'New Work Hours Details created successfully" in i18n and nav back to activities page 
					MessageToast.show(bundle.getText("tne.wrkDayetail.msg.wrkHrsDataCreateSuccess")); 
					this._activityDetailsChanged=false;
				}else if(sCallMode == "U"){
					//TODO: Keep message Toast with message 'Work Hours Details updated" in i18n and 
					//replace node payLoadData.Index of activities with payLoadData; nav back to activities page
					
					//activities.splice(position,numberOfItemsToRemove);
//					 activities.splice(payLoadData.Index, 1)	//remove the activity that's being updated from the node.
					
					//activities.splice(position, numberOfItemsToRemove, itemtobeInsertedAfterUpdate);
					  activities.splice(payLoadData.Index, 1, payLoadData);
					 
//					this._removeIndexProperty(payLoadData);
					
					MessageToast.show(bundle.getText("tne.wrkDayetail.msg.wrkHrsDataUpdateSuccess")); 
					this._activityDetailsChanged=false;
					
				
					oUiModel.refresh();
				
				};
				this.onNavBack();
			};
		},

//		_removeIndexProperty:function(payLoadData)
//		{
//			var oUiModel = this.getModel();
//			var activities = oUiModel.getProperty('/selGang/activities');
//			var oActivityDetailsModel=sap.ui.getCore().getModel('oActivityDetailsModel')
//			var oActDetailsData=oActivityDetailsModel.getData(); 
//			for(var actIndex=0;actIndex<activities.length;actIndex++)
//			{
//			
//			delete activities[actIndex].Index;						//remove index property
//			}
//			
//			delete payLoadData["Index"];
//			
//			//converting date object in starttime node back to edm type time
//			var actPeople=oActDetailsData.NavActivityPeople;
//			for(var iterator=0;iterator<actPeople.length;iterator++){
//			actPeople[iterator].StartTime=com.bnsf.eam.tne.util.DateAndTimeConversion.convertDateObjecttoms2(actPeople[iterator].StartTime.ms);	//to re create the object of edm type time 
//			actPeople[iterator].EndTime=com.bnsf.eam.tne.util.DateAndTimeConversion.convertDateObjecttoms2(actPeople[iterator].EndTime.ms)
//		};
//		},
		/**
		 * 
		 * Method called from saveActualHrs if sValidationResult="S" and the call mode is "C" or "U"  
		 * and returns the payload data to the called method       		 
		 * @private
		 * @memberOf tne.wrkDayDetail
		 * @returns object
		 */
		_preparePayloadData:function(sMode){
			var oUiModel=this.getModel();
			var oActivityDetailsModel=sap.ui.getCore().getModel('oActivityDetailsModel')
			var oActDetailsData=oActivityDetailsModel.getData(); 
			var Action = "";
			
			if(sMode == "N"){
				Action = "C";
			}else
				Action = "U";
//			}else if(sMode == "")
//				Action = "U";
//			else
//				Action = oActDetailsData.Action;
			   		
			
			var oPeople = oActDetailsData.NavActivityPeople;
			var aActivityPeople = [];
			
			for (var index = 0; index < oPeople.length; index++){
				if(oPeople[index].Selected){
					var oPeopleStruct = {
							Action : Action,
							ActivityID: oPeople[index].ActivityID,
							EmployeeId : oPeople[index].EmployeeId,
							EndDate : oPeople[index].EndDate ,
							EndTime :com.bnsf.eam.tne.util.DateAndTimeConversion.convertDateObjecttoms(oPeople[index].EndTime) ,//convert a date object into an object of EDM Type time
							EventID: oPeople[index].EventID ,
							GangId: oPeople[index].GangId ,
							PositionId: "" ,
							StartDate: oPeople[index].StartDate,
							StartTime : com.bnsf.eam.tne.util.DateAndTimeConversion.convertDateObjecttoms(oPeople[index].StartTime),
							WorkDate : oPeople[index].WorkDate
					};
					aActivityPeople.push(oPeopleStruct);
				};			
			};
			
			var payLoadObject = {    						
					AFENumber:oActDetailsData.AFENumber,
					Action: Action,
					ActivityID:oActDetailsData.ActivityID,
					ActivityName:oActDetailsData.ActivityName,
					ActivityType:oActDetailsData.ActivityType,
					BMP:oActDetailsData.BMP,
					BillToCenter:oUiModel.getProperty('/selGang/defaultCostCenter'),			
					DelayType:oActDetailsData.DelayType,
					Deletable:oActDetailsData.Deletable,
					DerivedAFENum:'234, 456,8908, 789798, 9809809, 7777, 789798, 86367',	//hard coded it for now
					EMP:oActDetailsData.EMP,
					EndDate:oActDetailsData.EndDate,
					EndTime:com.bnsf.eam.tne.util.DateAndTimeConversion.convertDateObjecttoms(oActDetailsData.EndTime),
					GangId:oActDetailsData.GangId,
					GenAfeNum:oActDetailsData.GenAfeNum,
					Index:oActDetailsData.Index,
					LineSegment:oActDetailsData.LineSegment,
					NavActivityPeople:aActivityPeople,
					RcAfter:oActDetailsData.RcAfter,
					RcBefore:oActDetailsData.RcBefore,
					StartDate:oActDetailsData.StartDate,
					StartTime:com.bnsf.eam.tne.util.DateAndTimeConversion.convertDateObjecttoms(oActDetailsData.StartTime),						
					TaskCategory:oActDetailsData.TaskCategory,
					TaskName:oActDetailsData.TaskName,
					WorkDate:oActDetailsData.WorkDate,
					WorkOrderNo:oActDetailsData.WorkOrderNo		
			};

			return payLoadObject; // the consolidated structure for payload
		},

		/**
		 * 
		 * Method called to check for overtime in  an activity 
		 * return true if there is an overlap 
		 * return false if no overlap            		 
		 * @private
		 * @memberOf tne.wrkDayDetail
		 * @returns boolean
		 */
		//check for overtime
		_checkForOvertime:function(){
			var flag=true;

			var oActHrsDetailController=this;

			oActHrsDetailController.byId("tne.wrkDayDetail.ActHrs.st").setValueState(sap.ui.core.ValueState.None);
			oActHrsDetailController.byId("tne.wrkDayDetail.ActHrs.et").setValueState(sap.ui.core.ValueState.None);

			oActHrsDetailController.byId("DP4").setValueState(sap.ui.core.ValueState.None);
			oActHrsDetailController.byId("DP5").setValueState(sap.ui.core.ValueState.None);
			//	var OTReasonCodeComboBox=this.byId("tne.wrkDayDetail.OTReasonCode")
			var oUiModel=sap.ui.getCore().getModel();

			var oGangStartDate=oUiModel.getProperty('/selGang/dayGangProfile/StartDate')
			var oGangStartTime=oUiModel.getProperty('/selGang/dayGangProfile/StartTime/ms')

			var oGangEndDate=oUiModel.getProperty('/selGang/dayGangProfile/EndDate')
			var oGangEndTime=oUiModel.getProperty('/selGang/dayGangProfile/EndTime/ms')	

			if(oGangStartDate !=="" && oGangStartTime!=="" &&oGangEndDate!=="" &&oGangEndTime!=="")		
			{
				var oCombineGangSd_St=com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScr(oGangStartDate,oGangStartTime);        	
				var oCombineGangEd_Et=com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScr(oGangEndDate,oGangEndTime);

				var oComb_GangStartTime=oCombineGangSd_St;
				var oComb_GangEndTime=oCombineGangEd_Et;	
			}	
			var oActivityDetailsModel= sap.ui.getCore().getModel('oActivityDetailsModel');	

			var oActivityType=oActivityDetailsModel.getProperty('/ActivityType');

			var oActStartDate=oActivityDetailsModel.getProperty('/StartDate');

			var oActStartTime=oActivityDetailsModel.getProperty('/StartTime');

			var oActEndDate=oActivityDetailsModel.getProperty('/EndDate');

			var oActEndTime=oActivityDetailsModel.getProperty('/EndTime');

			if(oActStartDate !=="" && oActStartTime!=="" && oActEndDate!=="" &&oActEndTime!=="" &&

					oActStartDate !==null && oActStartTime!==null && oActEndDate!==null &&oActEndTime!==null)


			{
				//compute start date,time and End date,time in millisecs		
				var oCombineActSd_St=com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(oActStartDate,oActStartTime.getTime());        	
				var oCombineActEd_Et=com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(oActEndDate,oActEndTime.getTime());


				var oCombActStartTime=oCombineActSd_St
				var oCombActEndTime=oCombineActEd_Et;	






				if((oCombActStartTime<oComb_GangStartTime || oCombActEndTime>oComb_GangEndTime 
						|| oCombActStartTime>oComb_GangEndTime || oCombActEndTime < oComb_GangStartTime)&& (oActivityType!=="MB"))
				{


					return flag;
					//	OTReasonCodeComboBox.setEnabled(true);	//Enable OTReason Code only if the activity time is within gang time and not of activity type MB

				}
				else
				{
					//	OTReasonCodeComboBox.setEnabled(false);
					flag=false;
					return flag;
				}
			}
		},

		/**
		 * Method checks for activity validations 
		 * if Error, It returns oValidResult object which has the error details with flag  _flagValdError = "E";	
		 * if No errors, It returns oValidResult object with flag _flagValdSucess = "S"	 
		 * @private
		 * @memberOf tne.wrkDayDetail
		 * @returns object
		 */
		_activity_validations:function()
		{

			var oController=this;

			var oUiModel=this.getModel();	
			var oActivityDetailsModel=sap.ui.getCore().getModel('oActivityDetailsModel')

			var activities=oUiModel.getProperty('/selGang/activities');

			var _flagValdSucess = "S";
			//		var _flagValdWarning = "W";
			var _flagValdError = "E";


			var oValidResult = {
					sValidationResult: _flagValdSucess,
					sValidationResultText: "Successful",
					fnValidationAction: function(){}

			};

			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();

			var OTReasonCodeComboBox=this.byId("tne.wrkDayDetail.OTReasonCode");

			var oActivityType=oActivityDetailsModel.getProperty('/ActivityType');

			var oActStartDate=oActivityDetailsModel.getProperty('/StartDate');

			var oActStartTime=oActivityDetailsModel.getProperty('/StartTime');

			var oActEndDate=oActivityDetailsModel.getProperty('/EndDate');

			var oActEndTime=oActivityDetailsModel.getProperty('/EndTime');


			if(oActivityType=="" || oActivityType==null)
			{
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.wrkDayDetail.msg.actTypeBlank");

				return oValidResult;	

			}
			if(oActStartDate !=="" && oActStartTime!=="" &&oActEndDate!=="" &&oActEndTime!=="" &&

					oActStartDate !==null && oActStartTime!==null &&oActEndDate!==null &&oActEndTime!==null)

			{
				//compute start date,time and End date,time in millisecs		
				var oCombineActSd_St=com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(oActStartDate,oActStartTime.getTime());        	
				var oCombineActEd_Et=com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(oActEndDate,oActEndTime.getTime());


				var oCombActStartTime=oCombineActSd_St
				var oCombActEndTime=oCombineActEd_Et;	

			}



			if(oActivityDetailsModel.getProperty("/StartDate") ==null || oActivityDetailsModel.getProperty("/StartDate")==""){
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.wrkDayDetail.msg.StDateEmpty");
				oValidResult.fnValidationAction = function(){
					oController.byId('DP4').setValueState(sap.ui.core.ValueState.Error);

				};
				return oValidResult;						



			}	

			if(oActivityDetailsModel.getProperty("/StartTime") ==null || oActivityDetailsModel.getProperty("/StartTime")==""){
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.wrkDayDetail.msg.GngActFillStartTime");
				oValidResult.fnValidationAction = function(){
					oController.byId('tne.wrkDayDetail.ActHrs.st').setValueState(sap.ui.core.ValueState.Error);

				};
				return oValidResult;						



			}			

			if(oActivityDetailsModel.getProperty("/EndDate") ==null || oActivityDetailsModel.getProperty("/EndDate")==""){
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.wrkDayDetail.msg.EndDateEmpty");
				oValidResult.fnValidationAction = function(){
					oController.byId('DP5').setValueState(sap.ui.core.ValueState.Error);

				};
				return oValidResult;						



			}	

			if(oActivityDetailsModel.getProperty("/EndTime") ==null || oActivityDetailsModel.getProperty("/EndTime")==""){
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.wrkDayDetail.msg.GngActFillEndTime");
				oValidResult.fnValidationAction = function(){
					oController.byId('tne.wrkDayDetail.ActHrs.et').setValueState(sap.ui.core.ValueState.Error);

				};
				return oValidResult;						



			}	

			if(oCombActStartTime > oCombActEndTime){
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.wrkDayDetail.msg.StLtEnd");
				oValidResult.fnValidationAction = function(){
					oController.byId('tne.wrkDayDetail.EndTime').setValueState(sap.ui.core.ValueState.Error);

				};
				return oValidResult;  					

			}	

			if(OTReasonCodeComboBox.getEnabled())
			{
				if(oActivityDetailsModel.getProperty('/RcBefore')=="")
				{
					oValidResult.sValidationResult = _flagValdError;
					oValidResult.sValidationResultText = bundle.getText("tne.wrkDayDetail.msg.oTcodeBlank");        					    		
					return oValidResult; 
				}

			}

			//TODO 

						if(oActivityDetailsModel.getProperty('/ActivityType')==="AH")
    					{

    					for(var i=0;i<activities.length;i++)
    						{

    						if(activities[i].ActivityType=="AH")
    							{

    							var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
    							var othrActStrTime_ms =com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScr(activities[i].WorkDate,activities[i].StartTime.ms);

    							var othrActEndTime_ms = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScr(activities[i].WorkDate,activities[i].EndTime.ms);
    							
    						var chkOvlp_AllAct_currAct_Flag = com.bnsf.eam.tne.util.Validators.chkOverlap(othrActStrTime_ms,othrActEndTime_ms,
    								oCombActStartTime,oCombActEndTime);

    						if(chkOvlp_AllAct_currAct_Flag){ //overlap = true


        						oValidResult.sValidationResult = _flagValdError;
            					oValidResult.sValidationResultText = bundle.getText("tne.wrkDayDetail.msg.ActHrsOvLap");        					    		
            					return oValidResult; 
    						}
    						}
    						}

    					}
			 
			var NavActivityPeople=	oActivityDetailsModel.getData().NavActivityPeople;

			var iNumEmpAssigned=0; 
			var bPplErrorExists = false;
			for(var empIndex=0;empIndex<NavActivityPeople.length;empIndex++)
			{

				var oEmployee=NavActivityPeople[empIndex]
				if(oEmployee.Selected)
				{

					iNumEmpAssigned ++;
					var	oPplErrorObj = { 
							EmpNo: oEmployee.EmployeeId, 

							Errors: [], 
							Warnings: [], 
							TableIndex: 0 //to be used later to display corresponing pople level errors against each employee entry 
					};

					if(oEmployee.StartDate == null || oEmployee.StartDate== "")
					{
						oPplErrorObj.Errors.push({
							type: "Error",
							title: bundle.getText("tne.wrkDayDetail.msg.GngActVldtActPplStTimeErr"),
							description: bundle.getText("tne.wrkDayDetail.msg.StDateMissing")
						});

					}

					if(oEmployee.StartTime == null || oEmployee.StartTime == "")
					{
						oPplErrorObj.Errors.push({
							type: "Error",
							title: bundle.getText("tne.wrkDayDetail.msg.GngActVldtActPplStTimeErr"),
							description: bundle.getText("tne.wrkDayDetail.msg.StTimeMissing")
						});

					}

					if(oEmployee.EndDate == null || oEmployee.EndDate== "")
					{
						oPplErrorObj.Errors.push({
							type: "Error",
							title: bundle.getText("tne.wrkDayDetail.msg.GngActVldtActPplStTimeErr"),
							description: bundle.getText("tne.wrkDayDetail.msg.EndDateMissing")
						});

					}

					if(oEmployee.EndTime == null || oEmployee.EndTime == "")
					{
						oPplErrorObj.Errors.push({
							type: "Error",
							title: bundle.getText("tne.wrkDayDetail.msg.GngActVldtActPplEtTimeErrTitle"),
							description: bundle.getText("tne.wrkDayDetail.msg.EndTimeMissing")
						});

					}

					if(oEmployee.StartDate !== null && oEmployee.StartTime !==null && oEmployee.EndDate !==null && oEmployee.EndTime!==null)
					{
						var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
						var oEmpStartTime=com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScr(oEmployee.StartDate,oEmployee.StartTime-(TZOffsetMs));
						var oEmpEndTime=com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScr(oEmployee.EndDate,oEmployee.EndTime-(TZOffsetMs));



						if(oEmpStartTime>oEmpEndTime)
						{
							oPplErrorObj.Errors.push({
								type: "Error",
								title: bundle.getText("tne.wrkDayDetail.msg.GngActVldtActPplStErrTitle"),
								description: bundle.getText("tne.wrkDayDetail.msg.StTimegtEt")
							});
							break;
						}

					}
				}


			}

			//check for employee selected or not	
			if(iNumEmpAssigned <= 0)
			{

				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText('tne.wrkDayDetail.msg.GngActAddEmployees');

				return oValidResult;
			}

			if(oPplErrorObj.Errors.length > 0){

				bPplErrorExists = true;
				var objErrWarn = {

						ErrorCount:oPplErrorObj.Errors.length,
						ResultsList: oPplErrorObj.Errors
				};	

			}

			if(bPplErrorExists){
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText('tne.wrkDayDetail.msg.StEtInvalid');

				return oValidResult;
			}

			return oValidResult;
		},

		/**
		 * search an employee from the table
		 * if Error, It returns oValidResult object which has the error details with flag  _flagValdError = "E";	
		 * if No errors, It returns oValidResult object with flag _flagValdSucess = "S"	 
		 * @public
		 * @memberOf tne.wrkDayDetail
		 * @returns null
		 */	

		searchEmployee:function(oEvent)
		{
			var aFilters=[];
			var query =oEvent.getSource().getValue();
			var sQuery = query.toUpperCase();

			if (sQuery && sQuery.length > 0) {
				var filter = new sap.ui.model.Filter("EmployeeDisplayName", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			};

			// update list binding
			var list = this.getView().byId("tne.wrkDayDetails.pplTbl");			
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");

		},
		  
		/****
		 *  this method is used to delete records from the table in the actual hours side bar  
		 * 
		 */
		delRecords:function(oEvent){
			
			var oActivityDetailsModel=sap.ui.getCore().getModel("oActivityDetailsModel");
			
			var oUiModel= this.getModel();
			var activityAction = oActivityDetailsModel.getProperty('/Action');
			
			var selActivityIndex= oActivityDetailsModel.getProperty('/Index');
			if(activityAction == 'N')
				{
				
				oActivityDetailsModel.setProperty('/Action','D');
				this.onNavBack();
				
				}
			else if(activityAction=="")
				{
				
				oActivityDetailsModel.setProperty('/Action','D');
				oUiModel.setProperty('/selGang/activities/'+selActivityIndex+'/Action','D');
				oUiModel.refresh();
				this.onNavBack();
				}
			
			
			
	},

	/**
	 * Calls method selectDeselect in util.Validators to 
	 * select and deselect all employees in the people/employee table depending on the state.	 * 
	 * 
	 * @public
	 * @memberOf tne.wrkDayDetail
	 * @returns null
	 */	
	selectDeselect:function(oEvent){ com.bnsf.eam.tne.util.Validators.selectDeselect(oEvent);},			
	
	
		/**
		 * Handler for back Button
		 * calls private method navBackToActivity
		 * parameter passed this.onNavBack
		 * Navigates to Activities page
		 * @public
		 * @memberOf tne.wrkDayDetail
		 * @returns null
		 */
		navBackToActivity:function()
		{
			this._handlePageExit(this.onNavBack);
		},

		/**
		 * Handler for back Button
		 * parameter passed this.onNavBack
		 * Navigates to Activities page
		 * @private
		 * @memberOf tne.wrkDayDetail
		 * @returns nothing if No button is clicked on Messagebox
		 */
		_handlePageExit: function(mCallback){

			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			var oCall = function(){};
			var that = this;

				if(this._activityDetailsChanged)
					{
					sap.m.MessageBox.show(
							bundle.getText("tne.app.UnsavedDataMsgBody"),{
								icon: sap.m.MessageBox.Icon.WARNING,
								title: bundle.getText("tne.app.UnsavedDataMsgTitle"),
								actions: [sap.m.MessageBox.Action.NO, sap.m.MessageBox.Action.YES],
								onClose: function(oAction) 
								{ 
									if(oAction=="YES"){	

										oCall = mCallback(); //calling callback
									}else{
										return; 								
									};
								}
							}
					);		
					}
				else
					{
					oCall = mCallback();
					}
					  


		},

	});
	return WorkDayDetailsController;
});