sap.ui.define([
               'com/bnsf/eam/tne/controller/BaseController',
               'sap/ui/model/json/JSONModel',
               'com/bnsf/eam/tne/util/DateAndTimeConversion',
               'com/bnsf/eam/tne/util/FetchValueHelps',
              
               ], function(BaseController, JSONModel, DateAndTimeConversion, FetchValueHelps) {
	"use strict";

	var ActDetailsController = BaseController.extend("com.bnsf.eam.tne.controller.ActivityDetails", {

		onInit : function (oEvent) {
			
			this.OPTION_AFE ="AFE";
			this.OPTION_BTC ="BTC";
			this.PARAMETER_BTC = 'B';
			this.PARAMETER_AFE ='A';
			this.PARAMETER_GENERIC_AFE ='G';
			
			//fetch value helps for Line Segments
			com.bnsf.eam.tne.util.FetchValueHelps.getLineSegment();
			
//			this.byId('tne.actDetail.oTextFieldFrLS').setModel(sap.ui.getCore().getModel());

			this.byId('tne.actDetail.oTextFieldFrLS').setFilterFunction(function(sTerm, oItem){
				return oItem.getText().match(new RegExp(sTerm, "i"));  //SetFilter Function for LS text field Suggestion
			});	
			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);
		},
		
		_onRouteMatched :function(oEvent){
			var sRoute = oEvent.getParameter("name");
			
			if(sRoute == "ActivityDetails"){ 
				this._initalizeActivityDetailsPage();
//				this.getView().setModel(sap.ui.getCore().getModel("oActivityDetailsModel"));
			};
		},
		
		_initalizeActivityDetailsPage: function(){
			var oActDetils = sap.ui.getCore().getModel("oActivityDetailsModel").getData();
			var oFuncLoc = com.bnsf.eam.tne.util.FetchValueHelps.getLineSegment(oActDetils.LineSegment);
			
			if(oFuncLoc != undefined)
				this.byId('tne.actDetail.lblBMPEMPRange').setText(oFuncLoc.BMP+" - "+ oFuncLoc.EMP);
			
			var oAFENoModel = new JSONModel();
			oAFENoModel.setData();
			sap.ui.getCore().setModel(oAFENoModel,"oAFENoModel")

			var oTaskCategory = new JSONModel();
			oTaskCategory.setData();
			sap.ui.getCore().setModel(oTaskCategory,"oTaskCategory");

			var oTaskNameModel = new JSONModel();
			oTaskNameModel.setData();
			sap.ui.getCore().setModel(oTaskNameModel,"oTaskNameModel");
			
			this.getView().setModel(sap.ui.getCore().getModel("oActivityDetailsModel"));
			
			this._setActivityForm();
			
			this.getView().getModel().refresh();
		},
		
		_setActivityForm:function(pActivityId){			
			var activity = sap.ui.getCore().getModel("oActivityDetailsModel").getData();
			/**
			 * Setting the value state of controls to none on page load
			 */
			this.byId("tne.actDetail.oTextFieldFrLS").setValueState(sap.ui.core.ValueState.None);
			this.byId("tne.actDetail.bmpInput").setValueState(sap.ui.core.ValueState.None);
			this.byId("tne.actDetail.EmpInput").setValueState(sap.ui.core.ValueState.None);
			this.byId("tne.actDetail.ActHrs.st").setValueState(sap.ui.core.ValueState.None);
			this.byId("tne.actDetail.ActHrs.et").setValueState(sap.ui.core.ValueState.None);
			this.byId("DP4").setValueState(sap.ui.core.ValueState.None);
			this.byId("DP5").setValueState(sap.ui.core.ValueState.None);
			this.byId("tne.actDetail.postOTDD").setValueState(sap.ui.core.ValueState.None);
			this.byId("tne.actDetail.preOTDD").setValueState(sap.ui.core.ValueState.None);
			
			
			this._enableDisableOTCodeDD();  
			
			/**
			 * Logic for AFE and BTC Center - Radio button and disabled and enabled fields
			 */
			if((activity.AFENumber == "" || activity.AFENumber == null||  activity.AFENumber == undefined)){
				this._getTaskCategoryValueHelp(activity.AFENumber,activity.TaskCategory,activity.TaskName);
				this.byId('oDropDownAFENo').setEnabled(false);
				this.byId('oBTCInput').setEnabled(true);
				this.byId('oRadioButtonAFENo').setSelected(false);
				this.byId('oBTCRadioButton').setSelected(true);
				this.byId('oGangActivityGenericAFENo').setVisible(false);
				this.byId('oGangActivityPopActGenericAFELabel').setVisible(false);
				if(activity.BillToCenter == "") 
					activity.BillToCenter = this.getModel().getProperty('/selGang/defaultCostCenter');				
			}else if((activity.AFENumber != "")){
				if(activity.AFENumber == "OTHERS"){

					this._getAFEValueHelp(activity.LineSegment,activity.BMP,activity.EMP,activity.AFENumber);
					/**
					 * If others, send the Genereic afe-Logic change
					 */
					this._getTaskCategoryValueHelp(activity.GenAfeNum,activity.TaskCategory,activity.TaskName);
					this.byId('oGangActivityGenericAFENo').setVisible(true);
					this.byId('oGangActivityPopActGenericAFELabel').setVisible(true);
				}else{
					this.byId('oGangActivityGenericAFENo').setVisible(false);
					this.byId('oGangActivityPopActGenericAFELabel').setVisible(false);
					this.byId('oDropDownAFENo').setEnabled(true);
					this.byId('oBTCInput').setEnabled(false);
					this.byId('oRadioButtonAFENo').setSelected(true);
					this.byId('oBTCRadioButton').setSelected(false);
					this._getAFEValueHelp(activity.LineSegment,activity.BMP,activity.EMP,activity.AFENumber);
					this._getTaskCategoryValueHelp(activity.AFENumber,activity.TaskCategory,activity.TaskName);
				};

				this.byId('oDropDownAFENo').setEnabled(true);
				this.byId('oRadioButtonAFENo').setSelected(true);
				this.byId('oBTCRadioButton').setSelected(false);
				this.byId('oGangActivityGenericAFENo').setVisible(false);
				this.byId('oGangActivityPopActGenericAFELabel').setVisible(false);
			};

			/**
			 * AFE and BTC Logic Ends here
			 */
			
			
		},

		/**
		 * Method is called to enable/disable the OTCode dropdown box 
		 * 
		 * if an activity time is less than Gang Start Time,Then PreOT dropdown  is Enabled
		 *  if an activity time is greater than Gang End Time,Then PostOT dropdown  is Enabled
		 * @private
		 * @member of tne.actDetail
		 */
			_enableDisableOTCodeDD :function(){
				var preOtDD = this.byId("tne.actDetail.preOTDD");
				var postOtDD = this.byId("tne.actDetail.postOTDD");
				var oResOtObj = this._detectOT();	//obj returns preOT and postOT 
				
				var bPreOT = oResOtObj.PreOT;		//fetch the boolean value from the object oResOtObj for PreOT code
				var bPostOT = oResOtObj.PostOT;	//fetch the boolean value from the object oResOtObj for Post code
				
				preOtDD.setEnabled(bPreOT);
				postOtDD.setEnabled(bPostOT);
			},
			
			
			/**
			 * Method combines the date and time in current millisecs
			 * compares the activity time with Gang time and returns an overtime if present
			 * 
			 *
			 * @private
			 * @member of tne.actDetail
			 * returns object
			 */
			_detectOT:function(){						
				var oUiModel=this.getModel();
				
				var oReturn = {
					PreOT: true,
                    PostOT: true
				};
				
				var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
				
				var oGangStartDate = oUiModel.getProperty('/selGang/dayGangProfile/StartDate')
				var oGangStartTime = oUiModel.getProperty('/selGang/dayGangProfile/StartTime/ms')

				var oGangEndDate = oUiModel.getProperty('/selGang/dayGangProfile/EndDate')
				var oGangEndTime = oUiModel.getProperty('/selGang/dayGangProfile/EndTime/ms')	

				if(oGangStartDate !== "" && oGangStartTime!== "" &&oGangEndDate!== "" &&oGangEndTime!== "" &&					
					oGangStartDate !== null && oGangStartTime !== null &&oGangEndDate !== null &&oGangEndTime !== null){
					
					var oGangSTDateTime = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(oGangStartDate, (oGangStartTime + TZOffsetMs));        	
					var oGangEDDateTime = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(oGangEndDate, (oGangEndTime + TZOffsetMs));
				}else{
					return oReturn;
				};
				var oActivityDetailsModel= sap.ui.getCore().getModel('oActivityDetailsModel');	

				var oActivityType = oActivityDetailsModel.getProperty('/ActivityType');
				
				var oActStartDate = oActivityDetailsModel.getProperty('/StartDate');
				var oActStartTime = oActivityDetailsModel.getProperty('/StartTime');
				var oActEndDate = oActivityDetailsModel.getProperty('/EndDate');
				var oActEndTime = oActivityDetailsModel.getProperty('/EndTime');

				if(oActStartDate !=="" && oActStartTime!=="" && oActEndDate!=="" &&oActEndTime!=="" &&
						oActStartDate !==null && oActStartTime!==null && oActEndDate!==null &&oActEndTime!==null){
					//compute start date,time and End date,time in millisecs		
					var oActivitySTDateTime = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(oActStartDate, oActStartTime.getTime());        	
					var oActivityEDDateTime = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(oActEndDate, oActEndTime.getTime());
				}else{
					return oReturn;
				};
				
				//if activity time is less than gang start time 
				if(oActivitySTDateTime < oGangSTDateTime){
					oReturn.PreOT = true;
				}else{
					oReturn.PreOT = false;
				};
				
				//activity end time is greater than gang end time
				if(oActivityEDDateTime > oGangEDDateTime){
					oReturn.PostOT = true;
				}else{
					oReturn.PostOT = false;
				};
				
				return oReturn;								
		},
		
		/**
		 * Method to fetch value help for Task Category
		 * Sets the selected key for the Task Category Dropdown
		 * Fetches the Task Name value help for the Selected Task Category
		 *
		 * @private
		 * @member of tne.actDetail
		 * returns null
		 */
			
		_getTaskCategoryValueHelp: function(pParam, pSelectedKey, pTaskName){
			var oController = this;

			var oValueHelpModelForTaskCategory  = sap.ui.getCore().getModel("oValueHelpModel");
			var oTaskCategory  = sap.ui.getCore().getModel("oTaskCategory");
			var oTaskNameModel  = sap.ui.getCore().getModel("oTaskNameModel");
			
			oTaskNameModel.setData();
			
			var oUiModel = this.getModel();

			var selectedGangTitle =	oUiModel.getProperty('/selGang/id');
			var selectedDateTime=oUiModel.getProperty('/selGang/workDate');
			var vDate =  sap.ui.core.format.DateFormat.getDateInstance( {
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"})
				.format(selectedDateTime);
			var oAFENo = pParam;
			
			//call backend service for Task Category
			var oControlTaskCategory  = oController.byId('oDropDownTaskCategory');
			oControlTaskCategory.setBusy(true);
			var oControlTaskName  = oController.byId('oDropDownTaskName');
			oControlTaskName.setBusy(true);
			oValueHelpModelForTaskCategory.read(
					"ValueHelpSet?$filter=FieldName eq 'TASK_CATEGORY' and ScreenIndicator eq 'JOURNAL' and ImportParam1 eq '"+selectedGangTitle+"' and ImportParam2 eq '"+oAFENo+"' " +
					"and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"'",
					null,{}, false /*sync*/,
					function(oData, oResponse){
						try{
							oTaskCategory.setData(oData);
							oTaskCategory.refresh(); 
							oControlTaskCategory.setModel(oTaskCategory);
							
							if(pSelectedKey == undefined || pSelectedKey == null || pSelectedKey == ""){
								pSelectedKey = oControlTaskCategory.getFirstItem().getKey();
							};
							
							oControlTaskCategory.setSelectedKey(pSelectedKey);
							
							oControlTaskCategory.setBusy(false);
							
							var sPath = oControlTaskCategory.getItemByKey(pSelectedKey).getBindingContext().sPath;
							var noOfTaskNames = oTaskCategory.getProperty(sPath+"/OtherDetails");
							
							//If Task category has only one task there is no need to fetch task name value help
							if(parseInt(noOfTaskNames) <= 1){
								var item = oTaskCategory.getProperty(sPath);
								var data = {
										results:[
										         item
										]
								};
								oTaskNameModel.setData(data);
//								oControlTaskName.setSelectedKey(pTaskName);
								oControlTaskName.setModel(oTaskNameModel)
								oTaskNameModel.refresh();
								oControlTaskName.setBusy(false);
							}else{
								oController._getTaskNameValueHelp(pParam, pSelectedKey, pTaskName);
								oControlTaskName.setBusy(false);
							};
							oController.ActivityModified = false;
						} catch (e) {
							oControlTaskCategory.setBusy(false);
							oControlTaskName.setBusy(false);
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04021: Error handling response in Task Category Value Help Service");
						};
					},function(error){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						try {
							oControlTaskCategory.setBusy(false);
							oControlTaskName.setBusy(false);
							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.actDetail.msg.ActivityTCValueHelpErrorHeader"),bundle.getText("tne.actDetail.msg.ActivityScreenErrorNumber"));
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04022: Error handling exception in Task Category Value Help Service");							
						};

					}
			);
		},
		
		/**
		 * Method to fetch value help for Task Name
		 * Sets the selected key for the Task Name Dropdown
		 *
		 * @private
		 * @member of tne.actDetail
		 * returns null
		 */

		_getTaskNameValueHelp:function(pParam, pTaskCategory, pTaskName){		
			var oController=this;

			var taskNameModel =  sap.ui.getCore().getModel("oTaskNameModel");
			var oValueHelpModelForTaskName  = sap.ui.getCore().getModel("oValueHelpModel");	
			var oUiModel = this.getModel();

			var selectedGangTitle =	oUiModel.getProperty('/selGang/id');

			var selectedDateTime=oUiModel.getProperty('/selGang/workDate');
			var vDate =  sap.ui.core.format.DateFormat.getDateInstance( {
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"})
				.format(selectedDateTime);

			var oAFENo = pParam;

			//call backend service for Task Name
			var oControlTaskName  = oController.byId('oDropDownTaskName');
			oControlTaskName.setBusy(true);
			oValueHelpModelForTaskName.read(
					"ValueHelpSet?$filter=FieldName eq 'TASK_NAME' and ScreenIndicator eq 'JOURNAL' " +
					"and ImportParam1 eq '"+ selectedGangTitle +"' and " +
					"ImportParam2 eq '"+ oAFENo +"' and " +
					"ImportParam3 eq '"+ pTaskCategory +"' " +
					"and GangId eq '"+ selectedGangTitle +"' and WorkDate eq datetime'"+vDate+"'",
					null,{}, false /*sync*/,
					function(oData, oResponse){
						try{
							taskNameModel.setData(oData);
							taskNameModel.refresh();
							oControlTaskName.setModel(taskNameModel);
							oControlTaskName.setBusy(false);
							if(pTaskName == undefined || pTaskName == null || pTaskName == "")
								pTaskName = oControlTaskName.getFirstItem().getKey();
							
							oControlTaskName.setSelectedKey(pTaskName);	
							oController.ActivityModified = false;
						} catch (e) {
							oControlTaskName.setBusy(false);
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04023: Error handling response in Task Name Value Help Service");
						};
					},function(error){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						try {
							oControlTaskName.setBusy(false);
							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.actDetail.msg.ActivityTNValueHelpErrorHeader"),bundle.getText("tne.actDetail.msg.ActivityScreenErrorNumber"));
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04024: Error handling exception in Task Name Value Help Service");
						};
					});
		},

		/**
		 * Method to fetch value help AFE dropdown
		 * Sets the selected key for AFE dropdown if selected key is passed
		 * Fetches the value help for Task Category for selected task category
		 * Sets the selected key for the Task Category Dropdown
		 * Fetches the Task Name value help for the Selected Task Category
		 * Sets the selected key for the Task Name Dropdown
		 *
		 * @private
		 * @member of tne.actDetail
		 * returns null
		 */
		_getAFEValueHelp: function(pLS, pBMP, pEMP, pSelectedKey){
			var oController = this;
			var oValueHelpAbsenteeModel  = sap.ui.getCore().getModel("oValueHelpModel");
			var oAfeNumber = sap.ui.getCore().getModel("oAFENoModel");

			var oLineSegment = pLS;
			var oBMP = pBMP;
			var oEMP =  pEMP;

			var oUiModel = this.getModel();

			var selectedGangTitle=	oUiModel.getProperty('/selGang/id');
			var selectedDateTime=oUiModel.getProperty('/selGang/workDate');
			var vDate =  sap.ui.core.format.DateFormat.getDateInstance( {
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"})
				.format(selectedDateTime);

			this.byId('oDropDownAFENo').setBusy(true);
			
			oValueHelpAbsenteeModel.read("ValueHelpSet?$filter=FieldName eq 'AFE' and ScreenIndicator eq 'ACTIVITY' and ImportParam1 eq '"+oLineSegment+"' and ImportParam2 eq '"+oBMP+"' and ImportParam3 eq '"+oEMP+"' " +
					"and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"'",
					null,{}, false /*sync*/,
					function(oData, oResponse){
						try{
							oAfeNumber.setData(oData);
							oAfeNumber.refresh();
							oController.byId('oDropDownAFENo').setModel(oAfeNumber);
							//If AFE list contains only OTHERS as the option, enable Generic AFE field
							if(oData.results.length == 1 && oData.results[0].ID == 'OTHERS'){
								sap.ui.getCore().byId('oGangActivityPopActGenericAFELabel').setVisible(true);
								sap.ui.getCore().byId('oGangActivityGenericAFENo').setVisible(true);
							}else{
								oController.byId('oGangActivityPopActGenericAFELabel').setVisible(false);
								oController.byId('oGangActivityGenericAFENo').setVisible(false);
							};
							
							if(pSelectedKey == undefined || pSelectedKey == "" || pSelectedKey == null){
								pSelectedKey = oController.byId('oDropDownAFENo').getFirstItem().getKey();
								oController.byId('oDropDownAFENo').open();
							}else
								oController.byId('oDropDownAFENo').setSelectedKey(pSelectedKey);
							oController.byId('oDropDownAFENo').setBusy(false);
							oController.ActivityModified = false;
							
							//fire value help for Task Category and Name again
							oController._getTaskCategoryValueHelp(pSelectedKey);
							
						} catch (e) {
							sap.ui.getCore().byId('oDropDownAFENo').setBusy(false);
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04019: Error handling response in Afe Value Help Service");
						};
					},function(error){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						try {
							sap.ui.getCore().byId('oDropDownAFENo').setBusy(false);
							oAfeNumber.setData();
							oAfeNumber.refresh();
							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.actDetail.msg.ActivityAFEValueHelpErrorHeader"),bundle.getText("tne.actDetail.msg.ActivityScreenErrorNumber"));
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04020: Error handling exception in Afe Value Help Service");
						};
					}
			);
		},

		onSelectOAFERadioBtn:function(oEvent){
			var oController = this;
			
			var activity = this.getView().getModel().getData();
			
			this.byId("oBTCInput").setEnabled(false);
			//reset bill to center to default BTC
			this.getView().getModel().setProperty('/BillToCenter', this.getModel().getProperty('/selGang/defaultCostCenter'));

			oController.ActivityModified = true;
			if(oEvent.getParameters('selected').selected){				
				this.byId('oDropDownAFENo').setEnabled(true);
				this.getModel("oAFENoModel").setData();
				this.getModel("oAFENoModel").refresh();
//				if(this.getView().getModel().getProperty('/ActivityType') == 'WA'){
					this.getModel("oTaskCategory").setData();
					this.getModel("oTaskCategory").refresh();
					this.getModel("oTaskNameModel").setData();
					this.getModel("oTaskNameModel").refresh();
//				};
				oController._getAFEValueHelp(activity.LineSegment, activity.BMP, activity.EMP, activity.AFENumber);
			};
		},
		
		onSelectOfBTC:function(oControlEvent){
			var oController = this;
			var activity = this.getView().getModel().getData();
			
			oController.ActivityModified = true;
			if(oControlEvent.getParameters('selected').selected){
				this.byId('oDropDownAFENo').setEnabled(false);
				this.byId('oBTCInput').setEnabled(true);
				//check if BTC input field is blank, if yes default it:
				if(activity.BillToCenter == "") 
					activity.BillToCenter = this.getModel().getProperty('/selGang/defaultCostCenter');
				this.byId('oGangActivityGenericAFENo').setVisible(false);
				this.byId('oGangActivityPopActGenericAFELabel').setVisible(false);
				/*
				 * fire change event of bill to center
				 */
				sap.ui.getCore().getModel("oTaskCategory").setData();
				sap.ui.getCore().getModel("oTaskCategory").refresh();

				sap.ui.getCore().getModel("oTaskNameModel").setData();
				sap.ui.getCore().getModel("oTaskNameModel").refresh();
				
				oController._getTaskCategoryValueHelp("", "", "");
			};
		},
		
		onAFEDropDownChange:function(oEvent){
			var oController = this;
			oController.ActivityModified = true;
			
			var sSelectedKey = oEvent.getParameters().selectedItem.mProperties.key;
			oController._getTaskCategoryValueHelp(sSelectedKey);
			
			if(sSelectedKey == "OTHERS"){
				this.byId("oGangActivityGenericAFENo").setValueState(sap.ui.core.ValueState.None);
				this.byId('oGangActivityPopActGenericAFELabel').setVisible(true);
				this.byId('oGangActivityGenericAFENo').setVisible(true);
				/*  return true;*/
			}else{
				this.getView().getModel().setProperty("/GenAfeNum", '');
				this.byId('oGangActivityPopActGenericAFELabel').setVisible(false);
				this.byId('oGangActivityGenericAFENo').setVisible(false);
			};
		},
		
		
		onselectionChangeTaskCategory:function(oEvent){
			var oController = this;
			var oTaskCatModel = sap.ui.getCore().getModel("oTaskCategory");
			var oTaskNameModel = sap.ui.getCore().getModel("oTaskNameModel");
			var activity = this.getView().getModel().getData();
			
			oTaskNameModel.setData();
			
			var oRadioButtonAFENo = this.byId("oRadioButtonAFENo");
			var oDropDownAFENo = this.byId("oDropDownAFENo");
			oController.ActivityModified = true;
			
			var sSelectedTaskContext = oEvent.getParameters().selectedItem.getBindingContext();
			var sSelectedKey = oEvent.getParameters().selectedItem.mProperties.key;
			
			var oSelectedTaskObj = oTaskCatModel.getProperty(sSelectedTaskContext.sPath);
			
			//No. of Task Names for category 
			var iTaskNameCount = parseInt(oSelectedTaskObj.OtherDetails);
			
			if(iTaskNameCount <= 1){
				var item = oTaskCatModel.getProperty(sSelectedTaskContext.sPath);
				var data = {
						results:[
						         item
						]
				};
				oTaskNameModel.setData(data);
				oTaskNameModel.refresh();
			}else{
				if(oRadioButtonAFENo.getSelected()){
					if(oDropDownAFENo.getSelectedKey() == "OTHERS"){
						this._getTaskNameValueHelp(activity.GenAfeNum, sSelectedKey);
					}else{
						this._getTaskNameValueHelp(activity.AFENumber, sSelectedKey);
					};					
				}else{
					this._getTaskNameValueHelp("", sSelectedKey);
				};
				
			};
		},	
		
		/**
		 * Handler for start date change
		 * Checks if Activity needs overtime code, enables appropriate overtime
		 * Copies change in start date to People table
		 *
		 * @public
		 * @member of tne.actDetail
		 * returns null
		 */
		onStDateChange :function(){
			this._activityDetailsChanged = true;
			this._enableDisableOTCodeDD();
				
			var oActivityDetailsModel = sap.ui.getCore().getModel('oActivityDetailsModel');
			var oActppl =  sap.ui.getCore().getModel('oActivityDetailsModel').getProperty('/NavActivityPeople');		
			for(var i=0;i<oActppl.length;i++){			
				oActivityDetailsModel.setProperty('/NavActivityPeople/'+i+'/StartDate', oActivityDetailsModel.getProperty('/StartDate'));
				
			};
		},
		
		/**
		 * Handler for start time change
		 * Checks if Activity needs overtime code, enables appropriate overtime
		 * Copies change in start time to People table
		 *
		 * @public
		 * @member of tne.actDetail
		 * returns null
		 */			
		onStTimeChange :function(){
			this._activityDetailsChanged = true;
			this._enableDisableOTCodeDD();
			
			var oActivityDetailsModel = sap.ui.getCore().getModel('oActivityDetailsModel');
			var oActppl =  sap.ui.getCore().getModel('oActivityDetailsModel').getProperty('/NavActivityPeople');						
			for(var i=0;i<oActppl.length;i++){					
				oActivityDetailsModel.setProperty('/NavActivityPeople/'+i+'/StartTime', oActivityDetailsModel.getProperty('/StartTime'));
				
			};
		},
		
		/**
		 * Handler for end date change
		 * Checks if Activity needs overtime code, enables appropriate overtime
		 * Copies change in end date to People table
		 *
		 * @public
		 * @member of tne.actDetail
		 * returns null
		 */
		onEndDateChange :function(){
			this._activityDetailsChanged = true;
			this._enableDisableOTCodeDD();		
			
			var oActivityDetailsModel = sap.ui.getCore().getModel('oActivityDetailsModel');
			var oActppl =  sap.ui.getCore().getModel('oActivityDetailsModel').getProperty('/NavActivityPeople');						
			for(var i=0;i<oActppl.length;i++){										
				oActivityDetailsModel.setProperty('/NavActivityPeople/'+i+'/EndDate', oActivityDetailsModel.getProperty('/EndDate'));
			};
		},
		
		/**
		 * Handler for end time change
		 * Checks if Activity needs overtime code, enables appropriate overtime
		 * Copies change in end time to People table
		 *
		 * @public
		 * @member of tne.actDetail
		 * returns null
		 */
		onEndTimeChange :function(){
			this._activityDetailsChanged = true;
			this._enableDisableOTCodeDD();	
				
			var oActivityDetailsModel = sap.ui.getCore().getModel("oActivityDetailsModel");		
			var oActppl =  sap.ui.getCore().getModel('oActivityDetailsModel').getProperty('/NavActivityPeople');		
			
			for(var i=0;i<oActppl.length;i++){										
				oActivityDetailsModel.setProperty('/NavActivityPeople/'+i+'/EndTime', oActivityDetailsModel.getProperty('/EndTime'));					
			};
		},
		
		/**
		 * Handler for Pre Overtime Reason dropdown change
		 * Resets value state to None
		 *
		 * @public
		 * @member of tne.actDetail
		 * returns null
		 */
		onPreOTDDChange: function(oEvent){
			oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
		},
		
		/**
		 * Handler for Post Overtime Reason dropdown change
		 * Resets value state to None
		 *
		 * @public
		 * @member of tne.actDetail
		 * returns null
		 */
		onPostOTDDChange: function(oEvent){
			oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
		},
		
		//validate LS selection
		validateLSSelection:function(oEvent){
			var oController = this;
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			
			oController.ActivityModified = true;
			
			var oTextFieldFrLS = oEvent.getSource();
			var oLabelBMPEMPRange = this.getView().byId("tne.actDetail.lblBMPEMPRange");
			
			sap.ui.getCore().getModel("oAFENoModel").setData("");
			sap.ui.getCore().getModel("oTaskCategory").setData();
			sap.ui.getCore().getModel("oTaskNameModel").setData();
			
			if(oTextFieldFrLS.getValue() != null|| oTextFieldFrLS.getValue() != ""){
				oTextFieldFrLS.setValueState(sap.ui.core.ValueState.None);
				var oFuncLoc = com.bnsf.eam.tne.util.FetchValueHelps.getLineSegment(oTextFieldFrLS.getValue());
				
				if(oFuncLoc != undefined){
					oLabelBMPEMPRange.setText(oFuncLoc.BMP+" - "+ oFuncLoc.EMP);
					this._onChangeReadAFETaskCatTaskName();
				}else{
					sap.m.MessageBox.show(bundle.getText("tne.actDetail.msg.GngActInvalidLS"), sap.m.MessageBox.Icon.ERROR,
							bundle.getText("tne.app.Error"),sap.m.MessageBox.Action.OK,function(){
					},null,'dummyStyleClass');

					oTextFieldFrLS.setValueState(sap.ui.core.ValueState.Error);
					oLabelBMPEMPRange.setText('');
				};				
			}else{
				sap.m.MessageBox.show(bundle.getText("tne.actDetail.msg.GngActLSNumErr"), 
						sap.m.MessageBox.Icon.ERROR,  
						bundle.getText("tne.app.Error"),
						sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
				oTextFieldFrLS.setValueState(sap.ui.core.ValueState.Error);
				oLabelBMPEMPRange.setText('');
			};			
		},
			
		paddingTrailingZeros:function(str, max){
			var str = str.toString();
			return str.length < max ? this.paddingTrailingZeros("0" + str, max) : str;
		},
		
		validateMPFormat:function(oEvent){
			var oSourceField = oEvent.getSource(); 
			this.ActivityModified = true;
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			var value = oSourceField.getValue();
			var exp = /^\d{1,4}(\.\d{1,5})?$/;
			if(!exp.test(value)){
				oSourceField.setValueState(sap.ui.core.ValueState.Error);
				oSourceField.setValueStateText(bundle.getText("tne.actDetail.msg.EMPBMPErrTxt"))
			}else{
				oSourceField.setValueState(sap.ui.core.ValueState.None);
			};
		},
		
		inBMPChange:function(oEvent){
//			var oTextFieldFrBMP = this.getView().byId("tne.actDetail.bmpInput"); 
			var oTextFieldFrBMP = oEvent.getSource();
			
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			
			var oUiModel = this.getModel();
			var oController = this;
			oController.ActivityModified = true;
			var fEnteredBMP = parseFloat(oTextFieldFrBMP.getValue());
			
			//Check for BMP Format
			var exp = /^\d{1,4}(\.\d{1,5})?$/;
			if(!exp.test(fEnteredBMP)){
				
				oTextFieldFrBMP.setValueState(sap.ui.core.ValueState.Error);
			}else{
				oTextFieldFrBMP.setValueState(sap.ui.core.ValueState.None);
			};
			
			var sLS = this.getView().getModel().getData().LineSegment;
			
			if(sLS != ""){
				var oFuncLoc = com.bnsf.eam.tne.util.FetchValueHelps.getLineSegment(sLS);
				
				if(oFuncLoc != undefined){
					var fBMPRange = parseFloat(oFuncLoc.BMP);
					var fEMPRange = parseFloat(oFuncLoc.EMP);
					if(!(fBMPRange <= fEnteredBMP && fEnteredBMP <= fEMPRange) ){                                  
							sap.m.MessageBox.show(
									bundle.getText("tne.actDetail.msg.GngActBMPErr"), 
									sap.m.MessageBox.Icon.ERROR, 
									bundle.getText("tne.app.Error"),
									sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass'
							);
							oTextFieldFrBMP.setValueState(sap.ui.core.ValueState.Error);
					}else{
						oTextFieldFrBMP.setValueState(sap.ui.core.ValueState.None);
						sap.ui.getCore().getModel("oTaskCategory").setData("");
						sap.ui.getCore().getModel("oTaskNameModel").setData("");
						sap.ui.getCore().getModel("oAFENoModel").setData("");
//						this._readTaskCatAndNameWithoutAFE(oController);
						this._onChangeReadAFETaskCatTaskName();
					};
				};
			
			};
		},
		
		inEMPChange:function(oEvent){
//			var oTextFieldFrBMP = this.getView().byId("tne.actDetail.bmpInput"); 
			var oTextFieldFrEMP = oEvent.getSource();
			
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			
			var oUiModel = this.getModel();
			var oController = this;
			oController.ActivityModified = true;
			var fEnteredEMP = parseFloat(oTextFieldFrEMP.getValue());
			
			//Check for EMP Format
			var exp = /^\d{1,4}(\.\d{1,5})?$/;
			if(!exp.test(fEnteredEMP)){
				
				oTextFieldFrEMP.setValueState(sap.ui.core.ValueState.Error);
			}else{
				oTextFieldFrEMP.setValueState(sap.ui.core.ValueState.None);
			};
			
			var sLS = this.getView().getModel().getData().LineSegment;
			
			if(sLS != ""){
				var oFuncLoc = com.bnsf.eam.tne.util.FetchValueHelps.getLineSegment(sLS);
				
				if(oFuncLoc != undefined){
					var fBMPRange = parseFloat(oFuncLoc.BMP);
					var fEMPRange = parseFloat(oFuncLoc.EMP);
					if(!(fBMPRange <= fEnteredEMP && fEnteredEMP <= fEMPRange) ){                                  
							sap.m.MessageBox.show(
									bundle.getText("tne.actDetail.msg.GngActEMPErr"), 
									sap.m.MessageBox.Icon.ERROR, 
									bundle.getText("tne.app.Error"),
									sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass'
							);
							oTextFieldFrEMP.setValueState(sap.ui.core.ValueState.Error);
					}else{
						oTextFieldFrEMP.setValueState(sap.ui.core.ValueState.None);
						sap.ui.getCore().getModel("oTaskCategory").setData("");
						sap.ui.getCore().getModel("oTaskNameModel").setData("");
						sap.ui.getCore().getModel("oAFENoModel").setData("");
//						this._readTaskCatAndNameWithoutAFE(oController);
						this._onChangeReadAFETaskCatTaskName();
					};
				};
			
			};
		},
		
		_onChangeReadAFETaskCatTaskName: function(){
			var activity = this.getView().getModel().getData();
			//if AFE is selected call method to load AFE, Task Cat and Task Name
			//if BTC is selected call method to load Task Cat and Task Name
			if(this.byId('oRadioButtonAFENo').getSelected()){
				var sSelectedKey = this.byId("oDropDownAFENo").getSelectedKey();
				//get AFE value help
				this._getAFEValueHelp(activity.LineSegment, activity.BMP, activity.EMP, sSelectedKey);
				//get Task Category and Task Name
				if(sSelectedKey == "OTHERS"){
					if(activity.GenAfeNum != "" )
						this._getTaskCategoryValueHelp(activity.GenAfeNum, activity.TaskCategory, activity.TaskName);
				}else{
					this._getTaskCategoryValueHelp(activity.AFENumber, activity.TaskCategory, activity.TaskName);
				};
			}else{
				this._getTaskCategoryValueHelp("", activity.TaskCategory, activity.TaskName);
			};		
		},
		
		
		saveActivityDetails:function(){
			
			var sCallMode = "";
			var ActChanged = false;
			
			var that = this;
			var oUiModel = that.getModel();
			var activity = this.getView().getModel().getData();
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			
			var oActValidations = that._activity_validations();

			activity.Action == "N" ? sCallMode = "N" : sCallMode = "U";
			
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
			}else if (oActValidations.sValidationResult === "W"){
				var oCntrlr = that;
				var oMessageDialog = new sap.m.Dialog({
					title: bundle.getText("tne.app.Warning"),
					content:[
					         new sap.m.Text({
					        	 text:oActValidations.sValidationResultText 
					         })
					],
					beginButton: new sap.m.Button({
						text:"{i18n>GngActIgnrandSaveBtn}",
						press:function(){
							oMessageDialog.close();//call function() _saveNewActivity to plot values
							ActChanged = true;
							oCntrlr._saveActivity(sCallMode);
						}
					}),
					endButton: new sap.m.Button({
						text:"{i18n>GngEditActBtn}",
						press:function(oEvent){
							oActValidations.fnValidationAction();
							oMessageDialog.close();
							oCntrlr.getView().getModel().refresh();
						}
					})
				}).open();
			}else if (oActValidations.sValidationResult === "I"){
				return;
			}else if (oActValidations.sValidationResult === "S"){
				ActChanged = true;
				that._saveActivity(sCallMode);
			}else{
				sap.m.MessageBox.show(
						"Validation Failed, please try Saving again.", 
						sap.m.MessageBox.Icon.ERROR,
						bundle.getText("tne.app.Error"),
						sap.m.MessageBox.Action.OK,
						null,
						null,
						'dummyStyleClass'
				);
			};
		},
		
		
		_activity_validations:function(){
			var oController = this;
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			var currentActivityModel = this.getView().getModel();

			var _flagValdSucess = "S";
			var _flagValdWarning = "W";
			var _flagValdError = "E";
			var _flagValdInfo = "I";

			var oValidResult = {
					sValidationResult: _flagValdSucess,
					sValidationResultText: "Successful",
					fnValidationAction: function(){}

			};

			//	var duplicateEmployeeModel = sap.ui.getCore().getModel("duplicateEmployeeModel");

			/*	var returnActTime =  mCreateMultiDayTiming(
						util.DateAndTimeConversion.convertYYYY_MM_DDTHH_mmToMilliSec(currentActivityModel.getProperty("/StartTime")),
						util.DateAndTimeConversion.convertYYYY_MM_DDTHH_mmToMilliSec(currentActivityModel.getProperty("/EndTime")));


				var	activityStartMilliSec = returnActTime.startDate.getTime();
				var	activityEndMilliSec = returnActTime.endDate.getTime();*/

			//AH1-AH5 Validation begin

			//validation for LS
			var flag = true;		
			if(currentActivityModel.getProperty("/LineSegment") == undefined || 
					currentActivityModel.getProperty("/LineSegment") == ""){					
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngActFillLS");
				oValidResult.fnValidationAction = function(){
					oController.byId("tne.actDetail.oTextFieldFrLS").setValueState(sap.ui.core.ValueState.Error);		
				};
				return oValidResult;
			}else{
				var regExp = /^\d{1,4}$/;
				if(!regExp.test(currentActivityModel.getProperty("/LineSegment"))){
					oValidResult.sValidationResult = _flagValdError;
					oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngActLSNum");
					oValidResult.fnValidationAction = function(){
						oController.byId("tne.actDetail.oTextFieldFrLS").setValueState(sap.ui.core.ValueState.Error);	
					};
					return oValidResult;
				};
			};


			//Validation for BMP			
			if(currentActivityModel.getProperty("/BMP") == null || currentActivityModel.getProperty("/BMP") == ""){
				//test if BMP is blank
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngActFillBMP");
				oValidResult.fnValidationAction = function(){
					oController.byId('tne.actDetail.bmpInput').setValueState(sap.ui.core.ValueState.Error);

				};
				return oValidResult;							
			}else{
				//test if BMP format is correct
				var valueBMP = currentActivityModel.getProperty("/BMP");
				var exp = /^\d{1,4}(\.\d{1,5})?$/;
				if(!exp.test(valueBMP)){
					oValidResult.sValidationResult = _flagValdError;
					oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.InvalidBMP");
					oValidResult.fnValidationAction = function(){
						oController.byId('tne.actDetail.bmpInput').setValueState(sap.ui.core.ValueState.Error);	
					};
					return oValidResult;						
				}else{
					var sLS = currentActivityModel.getProperty("/LineSegment");
					var oFuncLoc = com.bnsf.eam.tne.util.FetchValueHelps.getLineSegment(sLS);
					if(oFuncLoc != undefined){
						//test if BMP is in allowed range
						var fBMPRange = parseFloat(oFuncLoc.BMP);
						var fEMPRange = parseFloat(oFuncLoc.EMP);
						if(!(fBMPRange <= valueBMP && valueBMP <= fEMPRange) ){ 
							oValidResult.sValidationResult = _flagValdError;
							oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngActBMPErr");
							oValidResult.fnValidationAction = function(){
								oController.byId('tne.actDetail.bmpInput').setValueState(sap.ui.core.ValueState.Error);	
							};
							return oValidResult;							
						}else
							oController.byId('tne.actDetail.bmpInput').setValueState(sap.ui.core.ValueState.None);
					};
				};
			};	

			//Validation for EMP						
			if(currentActivityModel.getProperty("/EMP") == null || currentActivityModel.getProperty("/EMP") == ""){					
				//test if BMP is blank	
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngActFillEMP");
				oValidResult.fnValidationAction = function(){
					oController.byId('tne.actDetail.EmpInput').setValueState(sap.ui.core.ValueState.Error);						
				};
				return oValidResult;				
			}else{
				//test if EMP format is correct
				var valueEMP = currentActivityModel.getProperty("/EMP");
				var exp = /^\d{1,4}(\.\d{1,5})?$/;
				if(!exp.test(valueEMP)){						
					oValidResult.sValidationResult = _flagValdError;
					oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.InvalidEMP");
					oValidResult.fnValidationAction = function(){
						oController.byId('tne.actDetail.EmpInput').setValueState(sap.ui.core.ValueState.Error);

					};
					return oValidResult;											
				}else{
					var sLS = currentActivityModel.getProperty("/LineSegment");
					var oFuncLoc = com.bnsf.eam.tne.util.FetchValueHelps.getLineSegment(sLS);
					//test if EMP is in allowed range
					if(oFuncLoc != undefined){
						var fBMPRange = parseFloat(oFuncLoc.BMP);
						var fEMPRange = parseFloat(oFuncLoc.EMP);
						if(!(fBMPRange <= valueEMP && valueEMP <= fEMPRange) ){                                  
							sap.m.MessageBox.show(
									bundle.getText("tne.actDetail.msg.GngActEMPErr"), 
									sap.m.MessageBox.Icon.ERROR, 
									bundle.getText("tne.app.Error"),
									sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass'
							);
						}else
							oController.byId('tne.actDetail.EmpInput').setValueState(sap.ui.core.ValueState.None);
					};
				};
			};	

			//AH3-Validation for AFE/BTC Radio Button selected					
			/**
			 * Change- AFE/Bill to Center validation
			 */
			if(oController.byId('oRadioButtonAFENo').getSelected()){
				if(oController.byId('oDropDownAFENo').getSelectedKey() == null ||oController.byId('oDropDownAFENo').getSelectedKey() == ""){					
					oValidResult.sValidationResult = _flagValdError;
					oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngActFillAFENo");
					oValidResult.fnValidationAction = function(){

					};
					return oValidResult;					
				}else if(oController.byId('oDropDownAFENo').getSelectedKey() == "OTHERS" && 
						(oController.byId('oGangActivityGenericAFENo').getValue() == ""||
								oController.byId('oGangActivityGenericAFENo').getValue() == null)){
					oValidResult.sValidationResult = _flagValdError;
					oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngActFillGenericAFENo");
					oValidResult.fnValidationAction = function(){
						sap.ui.getCore().byId('oGangActivityGenericAFENo').setValueState(sap.ui.core.ValueState.Error);

					};
					return oValidResult;
				};

			};

			/**
			 * Validation for Generic Afe 
			 */
			if(oController.byId('oDropDownAFENo').getSelectedKey() == "OTHERS"){
				if(oController.byId('oGangActivityGenericAFENo').getValueState() == "Error"){	
					oValidResult.sValidationResult = _flagValdError;
					oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngAcTGenAfeInvValMsg");
					oValidResult.fnValidationAction = function(){};
					return oValidResult;}
			};

			/**
			 * Validation for Generic Afe - Over
			 */

			/**
			 * Validation for BTC RadioBtn and BTC Textfield
			 */
			if(oController.byId('oBTCRadioButton').getSelected() &&
					(oController.byId('oBTCInput').getValue()==""||
							oController.byId('oBTCInput').getValue()==null)){

				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngActFillBTC");
				oValidResult.fnValidationAction = function(){
					oController.byId('oBTCInput').setValueState(sap.ui.core.ValueState.Error);

				};
				return oValidResult;				
			}else {
				if(oController.byId('oBTCRadioButton').getSelected() &&
						(oController.byId('oBTCInput').getValue()!= undefined)){
					var regExp = /^\d{1,10}$/;
					if(!regExp.test(oController.byId('oBTCInput').getValue())){						
						oValidResult.sValidationResult = _flagValdError;
						oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngActBTCNum");
						oValidResult.fnValidationAction = function(){
							oController.byId('oBTCInput').setValueState(sap.ui.tne.actDetail.msgcore.ValueState.Error);							
						};
						return oValidResult;				
					};
				};
			};

			/**
			 * Validation for Task Category and task name dropdown box
			 */
			if(oController.byId('oDropDownTaskCategory').getSelectedKey() == null || 
					oController.byId('oDropDownTaskCategory').getSelectedKey() == ""){
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngActFillTaskCat");
				oValidResult.fnValidationAction = function(){ };
				return oValidResult;

			};

			/**
			 * Validation for Task Category and task name dropdown box -End
			 */	
			if(oController.byId('oDropDownTaskName').getSelectedKey() == null || 
					oController.byId('oDropDownTaskName').getSelectedKey() == ""){
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngActFillTaskName");
				oValidResult.fnValidationAction = function(){ };
				return oValidResult;			
			};	

			/**
			 * Validation for Start Time
			 */			
			if(currentActivityModel.getProperty("/StartTime") == null || 
					currentActivityModel.getProperty("/StartTime") == ""){
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngActFillStartTime");
				oValidResult.fnValidationAction = function(){
					oController.byId('tne.actDetail.ActHrs.st').setValueState(sap.ui.core.ValueState.Error);

				};
				return oValidResult;										
			};

			if(oController.byId('tne.actDetail.ActHrs.st').getValueState() == 'Error'){
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngActFillStartTime");
				oValidResult.fnValidationAction = function(){ };
				return oValidResult;
			}; 

			/**
			 * Validation for End Time
			 */	
			if(currentActivityModel.getProperty("/EndTime") == null || 
					currentActivityModel.getProperty("/EndTime") == ""){					
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngActFillEndTime");
				oValidResult.fnValidationAction = function(){
					oController.byId('tne.actDetail.ActHrs.et').setValueState(sap.ui.core.ValueState.Error);					
				};
				return oValidResult;			
			};

			if(oController.byId('tne.actDetail.ActHrs.et').getValueState()=='Error'){
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngActFillEndTime");
				oValidResult.fnValidationAction = function(){ };
				return oValidResult;
			}; 
			
	//TODO: Validation for Overtime code 
			
			var oActivityDetails=sap.ui.getCore().getModel("oActivityDetailsModel");
			var oDropDownRcBefore=this.byId("tne.actDetail.preOTDD");
			var oDropDownRcAfter=this.byId("tne.actDetail.postOTDD")
				
				if(oDropDownRcBefore.getEnabled())
					{
						
						if(oActivityDetails.getProperty("/RcBefore")==null || oActivityDetails.getProperty("/RcBefore")=="")
							{
							oValidResult.sValidationResult = _flagValdError;
							oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngRcBeforBlank");
							oValidResult.fnValidationAction = function(){
								oDropDownRcBefore.setValueState(sap.ui.core.ValueState.Error);					
							};
							return oValidResult;
							}
					
						
					}
			if(oDropDownRcAfter.getEnabled())
			{
				
				if(oActivityDetails.getProperty("/RcAfter")==null || oActivityDetails.getProperty("/RcAfter")=="")
					{
					oValidResult.sValidationResult = _flagValdError;
					oValidResult.sValidationResultText = bundle.getText("tne.actDetail.msg.GngRcAfterBlank");
					oValidResult.fnValidationAction = function(){
						oDropDownRcAfter.setValueState(sap.ui.core.ValueState.Error);					
					};
					return oValidResult;
					}
			
				
			}

			/*
			 * Determie activites overlapping with current activity being validated.
			 * Requied to check people level opverlap later in the process
			 * In this process only activites overlapping with current activity are checked
			 * Also current activity if edited needs to be removed from list of overlapping activites
			 * to prevent comoparision against self
			 */


//			var	activityStartMilliSec = returnActTime.startDate.getTime();
//			var	activityEndMilliSec = returnActTime.endDate.getTime();
			var oUiModel = this.getModel();
			var activityStartMilliSec = oUiModel.getProperty("/selGang/dayGangProfile/StartTime/ms") ;
			var activityEndMilliSec = oUiModel.getProperty("/selGang/dayGangProfile/EndTime/ms");

			var aOverlapActivities = [];

			var allActivity = oUiModel.getProperty("/selGang/activities");
			//var currentActivityModel = sap.ui.getCore().getModel("currentActivityModel");
			var currentActivity = currentActivityModel.getData();

			var currentActivityIndex = -1;
			
			if(currentActivity.Action != "N")
				currentActivityIndex = currentActivity.Index;

			/**
			 * To caluclate Activity time now in millisec!(Pass workdate obj and time now in ms)
			 * 
			 * Return current Date-Time in ms
			 */		
			var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
			var actStoffset = currentActivity.StartTime.getTime()-(TZOffsetMs);
			var actEndoffset = currentActivity.EndTime.getTime()-(TZOffsetMs);
			
			//Current activity time stamp (combining date and times)
			var activityStartMilliSec = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScr(currentActivity.StartDate,actStoffset);
			var activityEndMilliSec = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScr(currentActivity.EndDate,actEndoffset);

			for (var i = 0; i< allActivity.length; i++){
				if((allActivity[i].ActivityType != "AH" && allActivity[i].ActivityType != "WM" && allActivity[i].ActivityType != "MB") && allActivity[i].Action != "D"
					&& currentActivityIndex !== allActivity[i].Index){

					/**
					 * To caluclate each activity time in millisec! (Pass workdate obj and time  in ms)
					 * 
					 * Return current Date-Time in ms
					 */	
//					var othrActStrTime_ms =com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(allActivity[i].WorkDate,allActivity[i].StartTime);
//					var othrActEndTime_ms = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(allActivity[i].WorkDate,allActivity[i].EndTime);
					var othrActStrTime_ms =com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(allActivity[i].StartDate, (allActivity[i].StartTime.ms + TZOffsetMs));
					var othrActEndTime_ms = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(allActivity[i].EndDate, (allActivity[i].EndTime.ms + TZOffsetMs));

					var chkOvlp_AllAct_currAct_Flag = com.bnsf.eam.tne.util.Validators.chkOverlap(othrActStrTime_ms,othrActEndTime_ms,
							activityStartMilliSec,activityEndMilliSec);

					if(chkOvlp_AllAct_currAct_Flag){ //overlap = true
						aOverlapActivities.push(allActivity[i]);
					};
				};
			};

//			Get model data and start time and end time
			var errorwarnModel = new sap.ui.model.json.JSONModel();
			var iNumEmpAssigned = 0;
			var aPplValidationErrors = [];
//			var duplicateEmployeeModel = sap.ui.getCore().getModel("oTableDetailsModel");
			var selectedEmployees = currentActivity.NavActivityPeople; 


			var bPplErrorExists = false;
			var bPplWarningExists = false;
			/*
			 * Declare variables to calculte earliest start and latest end of people assignemnt
			 * Requied to validate if activity time has been assigned with some person working throughout
			 */
			var dEarliestStartTime = activityEndMilliSec;
			var dLatestEndTime = activityStartMilliSec;


			/*
			 * Loop on all employees in gang
			 * Perform all people level validations
			 * 	•	AP1 - Each employee should have Start and end time
			 *	•	AP2 - Multiple assignments for employees do not overlap
			 *	•	AP3 - Each employee time should be >= activity start time and <= activity end time
			 *	•	AP4 - Complete duration of activity should be covered by employee assignments
			 *	•	AP5 - Employee assignment should not overlap with the same employee’s time from some other activity 
			 *
			 * Also make the following activity level validation
			 * 	•	AH6 - Validate atleast one employee is selected/assigned 
			 */
			var Results = {};

			for ( var int = 0; int < selectedEmployees.length; int++) {		
				if(selectedEmployees[int].Selected){
					//Object to store people level errors and warnings
					var	oPplErrorObj = { 
							EmpNo: selectedEmployees[int].EmployeeId, 
							Errors: [], 
							Warnings: [], 
							TableIndex: 0 //to be used later to display corresponing pople level errors against each employee entry 
					};

					//increment emp count to coolect date for AH6

					//increment emp count to collect date for AH6
					iNumEmpAssigned ++;

					if(selectedEmployees[int].StartTime == null||selectedEmployees[int].StartTime == '' 
						|| selectedEmployees[int].StartDate==null ||selectedEmployees[int].StartDate==''){
						oPplErrorObj.Errors.push({
							type: "Error",
							title: bundle.getText("tne.actDetail.msg.GngActVldtActPplStTimeErr"),
							description: bundle.getText("tne.actDetail.msg.GngActVldtActPplStTimeErr")
						});


					};

					//checking for end time for AP1
					if(selectedEmployees[int].EndTime == null || selectedEmployees[int].EndTime == '' 
						||selectedEmployees[int].EndDate==null || selectedEmployees[int].EndDate==''){

						oPplErrorObj.Errors.push({
							type: "Error",
							title: bundle.getText("tne.actDetail.msg.GngActVldtActPplEndTimeErr"),
							description: bundle.getText("tne.actDetail.msg.GngActVldtActPplEndTimeErr")
						});

					};				

					if((selectedEmployees[int].StartTime !== null && selectedEmployees[int].StartTime !== '') 
							&& (selectedEmployees[int].StartDate !==null && selectedEmployees[int].StartDate!=='')
							&&	(selectedEmployees[int].EndTime !== null && selectedEmployees[int].EndTime !== '') 
							&& (selectedEmployees[int].EndDate !==null && selectedEmployees[int].EndDate !=='')){
						var oEmpStartTime = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScr(selectedEmployees[int].StartDate,(selectedEmployees[int].StartTime - (TZOffsetMs)));
						var oEmpEndTime = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScr(selectedEmployees[int].EndDate,(selectedEmployees[int].EndTime - (TZOffsetMs)));

						//checking whether emp start time is within activity time for AP3
						if( oEmpStartTime < activityStartMilliSec){

							oPplErrorObj.Errors.push({
								type: "Error",
								title: bundle.getText("tne.actDetail.msg.GngActVldtActPplStErrTitle"),
								description: bundle.getText("tne.actDetail.msg.GngActVldtActPplStLtAtErr")
							});

						};

						if(oEmpStartTime  >= activityEndMilliSec){

							oPplErrorObj.Errors.push({
								type: "Error",
								title: bundle.getText("tne.actDetail.msg.GngActVldtActPplStErrTitle"),
								description: bundle.getText("tne.actDetail.msg.GngActVldtActPplStGtAtErr")
							});

						};


						if( oEmpEndTime <= activityStartMilliSec){

							oPplErrorObj.Errors.push({
								type: "Error",
								title: bundle.getText("tne.actDetail.msg.GngActVldtActPplEtErrTitle"),
								description: bundle.getText("tne.actDetail.msg.GngActVldtActPplEtLtAtErr")
							});

						};

						if( oEmpEndTime > activityEndMilliSec){


							oPplErrorObj.Errors.push({
								type: "Error",
								title: bundle.getText("tne.actDetail.msg.GngActVldtActPplEtErrTitle"),
								description: bundle.getText("tne.actDetail.msg.GngActVldtActPplEtGtAtErr")
							});

						};						


						//TODO				//Checking for multiple employee assignment overlap-AP2 


						/*
						 * check for full utilization of emp in the activity time 
						 * (Collecting date for AP4 - to be validated at the end of for loop)
						 */
						if(dEarliestStartTime > oEmpStartTime){
							dEarliestStartTime=oEmpStartTime;
						};

						if( dLatestEndTime < oEmpEndTime){
							dLatestEndTime=oEmpEndTime;
						};


						/* Start validation AP5
						 * Loop on all overlapping activites (determined earlie in this method
						 * Find corresponding employee as the current index employee (of all employees loop)
						 * assignment time for other overlapping activies to determine overlap with other activites
						 */

						var bIsOverlap;
						for(var olapIndex = 0; olapIndex < aOverlapActivities.length; olapIndex++){
							var actPeople = aOverlapActivities[olapIndex].NavActivityPeople;
							for (var k = 0; k < actPeople.length; k++){ // Loop 3
								if(selectedEmployees[int].EmployeeId === actPeople[k].EmployeeId && selectedEmployees[int].Selected){
//									if(selectedEmployees[int].StartTime != "" && selectedEmployees[int].EndTime != ""){
//										var	actPeopleStrTime = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(allActivity[k].WorkDate,actPeople[k].StartTime);
//										var	actPeopleEndTime = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(allActivity[k].WorkDate,actPeople[k].EndTime);
									if(actPeople[k].StartTime != "" && actPeople[k].EndTime != ""){
										var	actPeopleStrTime = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(actPeople[k].StartDate, (actPeople[k].StartTime.ms + TZOffsetMs));
										var	actPeopleEndTime = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(actPeople[k].EndDate, (actPeople[k].EndTime.ms + TZOffsetMs));

										bIsOverlap = com.bnsf.eam.tne.util.Validators.chkOverlap(oEmpStartTime,oEmpEndTime,
												actPeopleStrTime,actPeopleEndTime);

										if(bIsOverlap){// OverLap ==  true

											oPplErrorObj.Warnings.push({
												type: "Warning",
												title: (bundle.getText("tne.actDetail.msg.GngActVldtActPplLevelOverLapTitle")),
												description: bundle.getText("tne.actDetail.msg.GngActVldtActPplLevelOverLap", [aOverlapActivities[olapIndex].ActivityName])
											});

										}		
									}
								};
							};


						}							


					};			
					/*
					 * End of AP5
					 */

					//log in people level error array if any errors or warnings found


					if(oPplErrorObj.Errors.length > 0 && oPplErrorObj.Warnings.length > 0){
//						aPplValidationErrors.push(oPplErrorObj);   //Push oPplErrorObj into aPplValidationErrors
						bPplErrorExists = true;
						bPplWarningExists = true;
						var aResults = oPplErrorObj.Errors;
						aResults.concat(oPplErrorObj.Warnings);
						var objErrWarn = {
								ErrorCount:oPplErrorObj.Errors.length,
								WarningCount:oPplErrorObj.Warnings,
								ResultsList: aResults
						};	
						selectedEmployees[int].Results = objErrWarn;
						currentActivityModel.refresh();	//refresh the model mandatory to show icons
//						duplicateEmployeeModel.setProperty("/"+int+"/Results",objErrWarn); //pushing objErrWarn inside Results property of DuplicateEmployeeModel
					}else if(oPplErrorObj.Errors.length > 0){
//						aPplValidationErrors.push(oPplErrorObj);   //Push oPplErrorObj into aPplValidationErrors
						bPplErrorExists = true;
						var objErrWarn = {
								WarningCount:0,
								ErrorCount:oPplErrorObj.Errors.length,
								ResultsList: oPplErrorObj.Errors
						};			
//						duplicateEmployeeModel.setProperty("/"+int+"/Results",objErrWarn); //pushing objErrWarn inside Results property of DuplicateEmployeeModel
						selectedEmployees[int].Results = objErrWarn;
					//	this.getView().getModel().setProperty('/NavActivityPeople/'+int+'/Results',objErrWarn)
						//selectedEmployees[int].Results = objErrWarn;
						currentActivityModel.refresh();  //refresh the model mandatory to show icons
					}else if(oPplErrorObj.Warnings.length > 0){
//						aPplValidationErrors.push(oPplErrorObj);   //Push oPplErrorObj into aPplValidationErrors
						bPplWarningExists = true;
						var objErrWarn = {
								ErrorCount: 0,
								WarningCount:oPplErrorObj.Warnings.length,
								ResultsList: oPplErrorObj.Warnings
						};

//						duplicateEmployeeModel.setProperty("/"+int+"/Results",objErrWarn); //pushing objErrWarn inside Results property of DuplicateEmployeeModel
						
						selectedEmployees[int].Results = objErrWarn;
						
						currentActivityModel.refresh();   //refresh the model mandatory to show icons
					};					
					//Push oPplErrorObj into aPplValidationErrors
				};

			};	

			/*
			 * Validate AH6 - atleast one employee is selected/assigned
			 */
			if(iNumEmpAssigned <= 0){
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText('tne.actDetail.msg.GngActAddEmployees');

				return oValidResult;
			}else if(bPplErrorExists){
				oValidResult.sValidationResult = _flagValdError;
				oValidResult.sValidationResultText = bundle.getText('tne.actDetail.msg.GngActVldtActPplErrWarn');

				return oValidResult;
			}else if(bPplWarningExists){
				oValidResult.sValidationResult = _flagValdWarning;
				oValidResult.sValidationResultText = bundle.getText('tne.actDetail.msg.GngActpplOvrlp_MsgBoxTxt');

				return oValidResult;
			}else if((dEarliestStartTime  != activityStartMilliSec)  || (dLatestEndTime != activityEndMilliSec)){
				// To check whether complete duration is completed by people -AP4 Validation
				oValidResult.sValidationResult = _flagValdWarning;
				oValidResult.sValidationResultText = bundle.getText('tne.actDetail.msg.GngActVldtActNotFullyAssignedWrn');

				return oValidResult;
			};
			return oValidResult
		},
		
		
		displayPopover:function(oEvent)
		{
			this.byId('PplErrorList').setModel(this.getView().getModel());
			var oPplErrWrngDetailsTemplate = new sap.m.StandardListItem({
			
				title:'{title}',
				icon:{
					path:"type",
					formatter:com.bnsf.eam.tne.util.Validators.getEmployeeErrWarnType
						}
						
			});

			this.byId('PplErrorList').setModel(this.getView().getModel());
			
			this.byId('PplErrorList').bindAggregation("items",{
				path: oEvent.getSource().getBindingContext() + "/Results/ResultsList",
				template:oPplErrWrngDetailsTemplate
			});
			
		
			
			this.byId("oPopover").openBy(oEvent.getSource())
		},
		
		handlePageExit:function()
		{
			this.onNavBack();
		},
		_saveActivity: function(sMode){			
			var activities = this.getModel().getProperty('/selGang/activities');
			var oActivityDetailsModel=sap.ui.getCore().getModel('oActivityDetailsModel');
			
			var payLoadData = this._preparePayloadData(sMode);
			if(sMode == "N"){				
				var iActivitesLength = activities.length;
				payLoadData.Index = iActivitesLength;								
				activities.push(payLoadData);
				this.onNavBack();
			}else if(sMode == "U"){
//				activities.splice(payLoadData.Index, 1)	
				activities.splice(payLoadData.Index, 1, payLoadData); //remove the activity that's being updated from the node.
				this.onNavBack();
			};
		},
		
		
		_preparePayloadData: function(sMode){
			var oUiModel = this.getModel();
			var oActivityDetailsModel = sap.ui.getCore().getModel('oActivityDetailsModel');
			var oActivity = oActivityDetailsModel.getData(); 
			var Action = "";
			
			if(sMode == "N"){
				Action = "C";
			}else
				Action = "U"; 
			
			//structure for People
			
			var oPeople = oActivity.NavActivityPeople;
			var aActivityPeople = [];
			
			for (var index = 0; index < oPeople.length; index++){
				if(oPeople[index].Selected){
					var oPeopleStruct = {
							Action : "C", //Action for people level is always C
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
			
			//default BTC if blank
			var sBTC = this.getModel().getProperty('/selGang/defaultCostCenter');
			if(oActivity.BillToCenter != "")
				sBTC =  oActivity.BillToCenter;
			
			//structure for activity
			var oActivityStrucForBackend={
					
				AFENumber: oActivity.AFENumber,
				Action: Action,
				ActivityID: oActivity.ActivityID,
//				ActivityName: oActivity.ActivityName,
				ActivityName: this.byId('oDropDownTaskName').getSelectedKey(),
				ActivityType: oActivity.ActivityType,
				BMP: oActivity.BMP,
				BillToCenter: sBTC,			
				DelayType: oActivity.DelayType,
				Deletable: oActivity.Deletable,
//				DerivedAFENum:'234, 456,8908, 789798, 9809809, 7777, 789798, 86367',
				DerivedAFENum: oActivity.DerivedAFENum,
				EMP: oActivity.EMP,
				EndDate: oActivity.EndDate,
				EndTime: com.bnsf.eam.tne.util.DateAndTimeConversion.convertDateObjecttoms(oActivity.EndTime),
				GangId: oActivity.GangId,
				GenAfeNum: oActivity.GenAfeNum,
				Index: oActivity.Index,
				LineSegment: oActivity.LineSegment,
				NavActivityPeople: aActivityPeople,
				RcAfter: oActivity.RcAfter,
				RcBefore: oActivity.RcBefore,
				StartDate: oActivity.StartDate,
				StartTime: com.bnsf.eam.tne.util.DateAndTimeConversion.convertDateObjecttoms(oActivity.StartTime),						
//				TaskCategory: oActivity.TaskCategory,
//				TaskName: oActivity.TaskName,
				TaskCategory: this.byId('oDropDownTaskCategory').getSelectedKey(),
				TaskName: this.byId('oDropDownTaskName').getSelectedKey(),
				WorkDate: oActivity.WorkDate,
				WorkOrderNo: oActivity.WorkOrderNo							
			};
			return oActivityStrucForBackend; //return the navGangActivityPayload 
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
		
//		readAFENo:function()
//		{
//			var oController=this;
//
//			var oUiModel=this.getModel();
//			/**
//			 * If Popover is not open, do not send RFC request on change
//			 */
//			/*	if(!sap.ui.getCore().byId('oPopoverAdWrkAct').isOpen()){*/
//
//			var oValueHelpAbsenteeModel  = sap.ui.getCore().getModel("oValueHelpModel");
//
//			var oAfeNumber = sap.ui.getCore().getModel("oAFENoModel");
//
//			var currentActivityModel = sap.ui.getCore().getModel("currentActivityModel");
//			var oLineSegment = currentActivityModel.getProperty('/LineSegment');
//			var oBMP =  currentActivityModel.getProperty('/BMP');
//			var oEMP =  currentActivityModel.getProperty('/EMP');
//
//			/**
//			 * resetting model
//			 */
//			oAfeNumber.setData();
//
//			if(!this.byId('oRadioButtonAFENo').getSelected()){
//				return;
//			}
//
//
//			var selectedGangTitle=	oUiModel.getProperty('/selGang/id');
//
//			var selectedDateTime=oUiModel.getProperty('/selGang/workDate');
//			var vDate =  sap.ui.core.format.DateFormat.getDateInstance( {
//				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"})
//				.format(selectedDateTime);
//
//			var vDate =  sap.ui.core.format.DateFormat.getDateInstance( {
//				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"})
//				.format(selectedDateTime);
//
//			/**
//			 * Setting AFE no busy
//			 */		  
//
//
//			this.byId('oDropDownAFENo').setBusy(true); 
//
//
//
//			/*jQuery.sap.delayedCall(1000, this, function () {*/
//			oValueHelpAbsenteeModel.read("ValueHelpSet?$filter=FieldName eq 'AFE' and ScreenIndicator eq 'ACTIVITY' and ImportParam1 eq '"+oLineSegment+"' and ImportParam2 eq '"+oBMP+"' and ImportParam3 eq '"+oEMP+"' " +
//					"and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"'",
//					null,{}, true,
//					function(oData, oResponse){
//
//						try{
//
//
//							oAfeNumber.setData(oData);
//							oAfeNumber.refresh();
//							oController.byId('oDropDownAFENo').setModel(oAfeNumber);
//							if(currentActivityModel.getProperty('/ActivityType')=='IO'){
//								if((oData.results.length ==1 && oData.results[0].ID == 'OTHERS') || oController.byId('oDropDownAFENo').getSelectedKey() === "OTHERS"){
//									oController.byId('oGangActivityPopActGenericAFELabel').setVisible(true);
//									oController.byId('oGangActivityGenericAFENo').setVisible(true);
//								}
//								this.byId('oDropDownAFENo').setBusy(false);
//								this.byId('oDropDownAFENo').open();
//								return;
//							}
//							else{
//
//								if((oData.results.length ==1 && oData.results[0].ID =='OTHERS') || oController.byId('oDropDownAFENo').getSelectedKey() === "OTHERS"){
//									oController.byId('oGangActivityPopActGenericAFELabel').setVisible(true);
//									oController.byId('oGangActivityGenericAFENo').setVisible(true);
//								}
//								else{
//									oController.byId('oDropDownAFENo').setSelectedItem(oController.byId('oDropDownAFENo').getFirstItem());
//									oController.readTaskCategoryAndName(oController,"F");
//									oController.byId('oGangActivityPopActGenericAFELabel').setVisible(false);
//									oController.byId('oGangActivityGenericAFENo').setVisible(false);
//								}
//							}
//
//
//							oController.byId('oDropDownAFENo').setBusy(false);
//
//							oController.byId('oDropDownAFENo').open();
//
//
//
//
//						} catch (e) {
//							util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04007: Error handling response in Get AFE Value Help Service");
//							/*sap.m.MessageBox.show(bundle.getText("UnknownFailureMsgBody"), sap.m.MessageBox.Icon.ERROR, bundle.getText("UnknownFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');*/
//						}
//					},function(error){					
//						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
//						try {
//							oAfeNumber.setData();
//							oAfeNumber.refresh();
//							sap.ui.getCore().byId('oDropDownAFENo').setBusy(false);
//
//
//							/* var sError = error.response.body;
//				                       oJSON =JSON.parse(sError);
//
//				                       sap.m.MessageBox.show(oJSON.error.message.value, sap.m.MessageBox.Icon.ERROR,error.message,sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');*/
//							util.ServiceErrorHandler.handleODataError(error,bundle.getText("ActivityAFEValueHelpErrorHeader"),bundle.getText("ActivityScreenErrorNumber"));
//						} catch (e) {
//							util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04008: Error handling exception in Get AFE Value Help Service");
//							/*	sap.m.MessageBox.show(bundle.getText("UnknownFailureMsgBody"), sap.m.MessageBox.Icon.ERROR, bundle.getText("UnknownFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');*/
//						}
//
//					});
//
//
//			/*	});	*/
//
//
//		},

//		enableGenericAFENo:function(){
//
//			var selectedKey = this.byId('oDropDownAFENo').getSelectedKey();
//			if(selectedKey=='OTHERS'){
//				this.byId('oGangActivityPopActGenericAFELabel').setVisible(true);
//				this.byId('oGangActivityGenericAFENo').setVisible(true);
//				/*  return true;*/
//			}else{
//				sap.ui.getCore().getModel("currentActivityModel").setProperty("/GenAfeNum",'');
//				this.byId('oGangActivityPopActGenericAFELabel').setVisible(false);
//				this.byId('oGangActivityGenericAFENo').setVisible(false);
//				/*  return false;*/
//			}
//		},

		
//		readTaskCategoryAndName:function(pController,pIndicator){
//			/**
//			 * If Popover is not open, do not send RFC request on change
//			 */
//			/*if(!sap.ui.getCore().byId('oPopoverAdWrkAct').isOpen()){*/
//
//
//			var oController=this;
//			var selectedKey =  this.byId('oDropDownAFENo').getSelectedKey();
//			if((selectedKey==null||selectedKey=="")&&(this.byId('oRadioButtonAFENo').getSelected())){
//				var oAfeNumber = sap.ui.getCore().getModel("oAFENoModel");
//				selectedKey = oAfeNumber.getProperty("/results/"+0+"/ID");
//
//			}
//			if((selectedKey==null||selectedKey=="")&&(this.byId('oRadioButtonAFENo').getSelected())){
//				return false;
//			}
//
//			var oValueHelpModelForTaskCategory  = sap.ui.getCore().getModel("oValueHelpModel");
//			var oTaskCategory  = sap.ui.getCore().getModel("oTaskCategory");
//			oTaskCategory.setData();
//			var oUiModel = this.getModel();
//
//			var selectedGangTitle=	oUiModel.getProperty('/selGang/id');
//
//			var selectedDateTime=oUiModel.getProperty('/selGang/workDate');
//			var vDate =  sap.ui.core.format.DateFormat.getDateInstance( {
//				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"})
//				.format(selectedDateTime);
//
//
//			if(pIndicator == this.PARAMETER_AFE){
//				selectedKey = this.byId('oDropDownAFENo').getSelectedKey();
//			}
//			else  if(pIndicator == this.PARAMETER_BTC){
//				/**
//				 * Logic change -- if indicator is Bill_To_Center then send Blank AFE
//				 */
//				selectedKey ="";
//			}
//			else  if(pIndicator == this.PARAMETER_GENERIC_AFE){
//
//				selectedKey = this.byId('oGangActivityGenericAFENo').getValue();
//			}
//			oValueHelpModelForTaskCategory.read(
//					"ValueHelpSet?$filter=FieldName eq 'TASK_CATEGORY' and ScreenIndicator eq 'JOURNAL' and ImportParam1 eq '"+selectedGangTitle+"' and ImportParam2 eq '"+selectedKey+"' " +
//					"and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"'",
//					null,{}, false,
//					function(oData, oResponse){
//						try{
//							oTaskCategory.setData(oData);
//						
//							oTaskCategory.refresh();
//							oController.byId('oDropDownTaskCategory').setModel(oTaskCategory)
//							oController.byId('oDropDownTaskCategory').setSelectedKey(oController.byId('oDropDownTaskCategory').getFirstItem().getKey());
//							oController.readTaskName(pIndicator);
//						} catch (e) {
//							util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04009: Error handling response in Get Task Category Value Help Service");
//							/*sap.m.MessageBox.show(bundle.getText("UnknownFailureMsgBody"), sap.m.MessageBox.Icon.ERROR, bundle.getText("UnknownFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');*/
//						}
//
//					},function(error){
//						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
//						try {
//
//							/*var sError = error.response.body;
//			  			  oJSON =JSON.parse(sError);
//			             sap.m.MessageBox.show(oJSON.error.message.value, sap.m.MessageBox.Icon.ERROR,error.message,sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');*/
//							util.ServiceErrorHandler.handleODataError(error,bundle.getText("ActivityTCValueHelpErrorHeader"),bundle.getText("ActivityScreenErrorNumber"));
//							sap.ui.getCore().byId('oDropDownTaskCategory').setSelectedKey(null);
//							sap.ui.getCore().byId('oDropDownTaskName').setSelectedKey(null);
//							oTaskCategory.setData();
//							sap.ui.getCore().getModel("oTaskNameModel").setData();
//						} catch (e) {
//							util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04010: Error handling exception in Get Task Category Value Help Service");
//							/*sap.m.MessageBox.show(bundle.getText("UnknownFailureMsgBody"), sap.m.MessageBox.Icon.ERROR, bundle.getText("UnknownFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');*/
//						}
//
//
//					});
//
//		},
//
//		readTaskName:function(pIndicator)
//		{
//
//			var oController=this;
//
//			var selectedKey =  this.byId('oDropDownAFENo').getSelectedKey();
//
//			var taskCategoryKey =  this.byId('oDropDownTaskCategory').getSelectedKey();
//
//
//
//
//			var selectedItem = this.byId('oDropDownTaskCategory').getSelectedItem();
//			if(selectedKey==null || selectedKey==""){
//				var oAfeNumber = sap.ui.getCore().getModel("oAFENoModel");
//				selectedKey = oAfeNumber.getProperty("/results/"+0+"/ID");
//
//			}
//			if(pIndicator == this.PARAMETER_AFE){
//				selectedKey = this.byId('oDropDownAFENo').getSelectedKey();
//			}
//			else  if(pIndicator == this.PARAMETER_BTC){
//				selectedKey ="";
//			}
//			else  if(pIndicator == this.PARAMETER_GENERIC_AFE){
//
//				selectedKey = this.byId('oGangActivityGenericAFENo').getValue();
//			}
//			if((selectedKey==null || selectedKey=="" ) && (pIndicator == this.PARAMETER_AFE)){
//
//				return false;
//			}
//			else  if((selectedKey==null || selectedKey=="" ) && (pIndicator == this.PARAMETER_BTC)){
//				selectedKey ="";
//
//			}
//			var oTaskCategory= sap.ui.getCore().getModel("oTaskCategory");
//			var taskCategoryModel = sap.ui.getCore().getModel("oTaskCategory");
//			var taskNameModel = sap.ui.getCore().getModel("oTaskNameModel");
//			var sPath="";
//			taskNameModel.setData();
//			taskNameModel.refresh();
//			if(taskCategoryKey==null || taskCategoryKey==""){
//
//				taskCategoryKey = taskCategoryModel.getProperty("/results/"+0+"/ID");
//				selectedItem = taskCategoryModel.getProperty("/results/"+0);
//				sPath = "/results/"+0;
//			}
//			if(taskCategoryKey==null || taskCategoryKey==""){
//				return false;
//			}
//
//
//			if(selectedItem != null && selectedItem.OtherDetails == "01"){
//
//				var item = oTaskCategory.getProperty(sPath);
//				var data={
//						results:[
//						         item
//						         ]
//				};
//				taskNameModel.setData(data);
//				taskNameModel.refresh();
//				oController.byId('oDropDownTaskName').setSelectedKey(sap.ui.getCore().byId('oDropDownTaskName').getFirstItem().getKey());
//				return;
//			}
//
//
//			else{
//
//
//				if(selectedItem != null && 
//						(selectedItem.OtherDetails == null || selectedItem.OtherDetails==null )){
//
//					var sPath = oController.byId('oDropDownTaskCategory').getSelectedItem().getBindingContext().sPath;
//
//					var noOfTaskNames = oTaskCategory.getProperty(sPath+"/OtherDetails");
//
//					if(noOfTaskNames =="01"){
//
//						var item = oTaskCategory.getProperty(sPath);
//						var data={
//								results:[
//								         item
//								         ]
//						};
//						oTaskNameModel.setData(data);
//						oTaskNameModel.refresh();
//						oController.byId('oDropDownTaskName').setSelectedKey(oController.byId('oDropDownTaskName').getFirstItem().getKey());
//						return;
//
//					}
//
//				}
//
//
//				var oValueHelpModelForTaskCategory  = sap.ui.getCore().getModel("oValueHelpModel");		 
//				var oUiModel = this.getModel();
//
//				var selectedGangTitle=	oUiModel.getProperty('/selGang/id');
//
//				var selectedDateTime=oUiModel.getProperty('/selGang/workDate');
//				var vDate =  sap.ui.core.format.DateFormat.getDateInstance( {
//					style:"full", pattern: "yyyy-MM-ddThh:mm:ss"})
//					.format(selectedDateTime);
//
//				oValueHelpModelForTaskCategory.read(
//						"ValueHelpSet?$filter=FieldName eq 'TASK_NAME' and ScreenIndicator eq 'JOURNAL' " +
//						"and ImportParam1 eq '"+selectedGangTitle+"' and " +
//						"ImportParam2 eq '"+selectedKey+"' and " +
//						"ImportParam3 eq '"+taskCategoryKey+"' " +
//						"and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"'",
//						null,{}, false,
//						function(oData, oResponse){
//							try{ 
//								
//								taskNameModel.setData(oData);
//								taskNameModel.refresh();
//								oController.byId('oDropDownTaskName').setModel(taskNameModel);
//								oController.byId('oDropDownTaskName').setSelectedKey(oController.byId('oDropDownTaskName').getFirstItem().getKey());
//								//	oController.byId('idGangActivityPage').getController().enableActivitiesTabs(true);
//							} catch (e) {
//								util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04011: Error handling response in Get Task Name Value Help Service");
//								/*sap.m.MessageBox.show(bundle.getText("UnknownFailureMsgBody"), sap.m.MessageBox.Icon.ERROR, bundle.getText("UnknownFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');*/
//							}
//						},function(error){
//							var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
//
//
//							try {
//								/* var sError = error.response.body;
//				  			  oJSON =JSON.parse(sError);
//
//				  			  sap.m.MessageBox.show(oJSON.error.message.value, sap.m.MessageBox.Icon.ERROR,error.message,sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
//								 */
//								util.ServiceErrorHandler.handleODataError(error,bundle.getText("ActivityTNValueHelpErrorHeader"),bundle.getText("ActivityScreenErrorNumber"));
//							} catch (e) {
//								util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04012: Error handling exception in Get Task Name Value Help Service");
//								/*sap.m.MessageBox.show(bundle.getText("UnknownFailureMsgBody"), sap.m.MessageBox.Icon.ERROR, bundle.getText("UnknownFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');*/
//							}
//
//						});
//
//
//			}
//
//
//		},
		






		


		
		//LS Validations end
		
//		/**
//		 * BMP validations
//		 */
//		inLiveChangeBMP:function(oEvent)
//
//		{
//			var oController=this;
//			var oTextFieldFrBMP= this.getView().byId("tne.actDetail.bmpInput"); 
//			oController.ActivityModified = true;
//			var value = oTextFieldFrBMP.getValue();
//			var exp = /^\d{1,4}(\.\d{1,5})?$/;
//			if(!exp.test(value)){
//
//				oTextFieldFrBMP.setValueState(sap.ui.core.ValueState.Error);
//
//			}
//			else{
//				oTextFieldFrBMP.setValueState(sap.ui.core.ValueState.None);
//
//			}
//
//		}
//		,
//		inLiveChangeEMP:function()
//		{
//			var oController=this;
//			var oTextFieldFrEMP= this.getView().byId("tne.actDetail.EmpInput"); 
//			oController.ActivityModified = true;
//			var value = oTextFieldFrEMP.getValue();
//			var exp = /^\d{1,4}(\.\d{1,5})?$/;
//			if(!exp.test(value)){
//
//				oTextFieldFrEMP.setValueState(sap.ui.core.ValueState.Error);
//			}
//			else{
//				oTextFieldFrEMP.setValueState(sap.ui.core.ValueState.None);
//			}
//
//
//
//		},
		
//		inlivechangeLS:function(oEvent){
		//binding the input box with LineSegment suggestion items			
//		var oTextFieldFrLS = this.byId("tne.actDetail.oTextFieldFrLS");
//		oTextFieldFrLS.setModel(sap.ui.getCore().getModel('oModelForLineSegValueHlp'));
//		this.byId("tne.actDetail.lblBMPEMPRange").setModel(sap.ui.getCore().getModel('oModelForLineSegValueHlp'));
//		sap.ui.getCore().getModel('oModelForLineSegValueHlp').setProperty('/LineSegment',{})
//		oTextFieldFrLS.bindAggregation('suggestionItems','/items', new sap.ui.core.Item({text:'{LineSegment}'}));	
//	},
		
//		fnCheckEnteredLS:function(oEvent){
//			var oController=this;
//			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
//			var oLabelBMPEMPRange = this.getView().byId("tne.actDetail.lblBMPEMPRange");
//
//			var oTextFieldFrLS = this.getView().byId("tne.actDetail.oTextFieldFrLS");
//			if(oTextFieldFrLS.getValue()== undefined || oTextFieldFrLS.getValue() == ''){
//				sap.m.MessageBox.show(bundle.getText("GngActLSNumErr"), sap.m.MessageBox.Icon.ERROR,  bundle.getText("CallFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
//				oTextFieldFrLS.setValueState(sap.ui.core.ValueState.Error);
//				oLabelBMPEMPRange.setText('');
//				return ;
//			}else{
//				var oArrayItems = oTextFieldFrLS.getSuggestionItems();
//				var found = false;
//				var enteredValue = oTextFieldFrLS.getValue();
//				if (isNaN(parseInt(enteredValue))) {                                    
//					sap.m.MessageBox.show(bundle.getText("GngActLSNumErr"), sap.m.MessageBox.Icon.ERROR,  bundle.getText("CallFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
//					oTextFieldFrLS.setValueState(sap.ui.core.ValueState.Error);
//					return;
//				};
//				var pEnteredValue = oController.paddingTrailingZeros(enteredValue,4);
//
//				for (var int = 0; int < oArrayItems.length; int++) {
//					var array_element = oArrayItems[int];
//					if(array_element.getText() == pEnteredValue){
//						oTextFieldFrLS. fireSuggestionItemSelected({selectedItem:array_element,
//							selectedRow:new sap.m.ColumnListItem()});
//						found=true;
//						break;
//					};
//				};
//				if(!found){
//					sap.m.MessageBox.show(bundle.getText("GngActInvalidLS"), sap.m.MessageBox.Icon.ERROR,
//							bundle.getText("CallFailureMsgHeader"),sap.m.MessageBox.Action.OK,function(){
//					},null,'dummyStyleClass');
//
//					oTextFieldFrLS.setValueState(sap.ui.core.ValueState.Error);
//					oLabelBMPEMPRange.setText('');
//				};
//			};
//		},

//		inBMPChange:function(oEvent)
//		{
//			var oTextFieldFrBMP= this.getView().byId("tne.actDetail.bmpInput"); 
//			
//			
//			var oUiModel=this.getModel();
//			var oController=this;
//			oController.ActivityModified = true;
//			var oTextFieldFrBMP= this.getView().byId("tne.actDetail.bmpInput");
//			var currentActivityModel;
//			if(this.ActivityIndex!=="newActivity")
//				{
//				 currentActivityModel = oUiModel.getProperty(this.globalContext.sPath)
//				 if(currentActivityModel.ActivityType=='WA'){
//
//						sap.ui.getCore().getModel("oTaskCategory").setData("");
//						sap.ui.getCore().getModel("oTaskNameModel").setData("");
//						this._readTaskCatAndNameWithoutAFE(oController);
//
//
//
//					}
//				}
//			else
//				{
//				currentActivityModel=sap.ui.getCore().getModel("currentActivityModel").getData();
//				var bmpval = oTextFieldFrBMP.getValue();
//				var currentActivityModel=sap.ui.getCore().getModel("currentActivityModel");
//				currentActivityModel.setProperty("/BMP",bmpval)
//				if(currentActivityModel.getData().ActivityType=='WA'){
//
//					sap.ui.getCore().getModel("oTaskCategory").setData("");
//					sap.ui.getCore().getModel("oTaskNameModel").setData("");
//					this._readTaskCatAndNameWithoutAFE(oController);
//
//
//
//				}
//
//				}
//		
//			sap.ui.getCore().getModel("oAFENoModel").setData("");
//			
//
//			if(oTextFieldFrBMP.getValue() !=null|| oTextFieldFrBMP.getValue()!=""){
//				oTextFieldFrBMP.setValueState(sap.ui.core.ValueState.None);
//				oController.fnValidateBMP(oEvent);
//			}
//
//
//
//		},
		/**
		 * BMP Validations end
		 * 
		 */
		
		
		/**
		 * EMP Validation Start
		 */
//		inEMPChange:function(oEvent)
//		{
//
//			var oUiModel=this.getModel();
//			var oController=this;
//			oController.ActivityModified = true;
//			var oTextFieldFrEMP= this.getView().byId("tne.actDetail.EmpInput");
//			var currentActivityModel;
//			
//			if(this.ActivityIndex!=="newActivity")
//			{
//			 currentActivityModel = oUiModel.getProperty(this.globalContext.sPath);
//			 sap.ui.getCore().getModel("oAFENoModel").setData("");
//				if(currentActivityModel.ActivityType=='WA'){
//
//					sap.ui.getCore().getModel("oTaskCategory").setData("");
//					sap.ui.getCore().getModel("oTaskNameModel").setData("");
//					this._readTaskCatAndNameWithoutAFE(oController);
//
//
//
//				}
//			}
//		else
//			{
//			currentActivityModel=sap.ui.getCore().getModel("currentActivityModel").getData();
//			var empval = oTextFieldFrEMP.getValue();
//			var currentActivityModel=sap.ui.getCore().getModel("currentActivityModel");
//			currentActivityModel.setProperty("/EMP",empval)
//			sap.ui.getCore().getModel("oAFENoModel").setData("");
//			if(currentActivityModel.getData().ActivityType=='WA'){
//
//				sap.ui.getCore().getModel("oTaskCategory").setData("");
//				sap.ui.getCore().getModel("oTaskNameModel").setData("");
//				this._readTaskCatAndNameWithoutAFE(oController);
//
//
//
//			}
//			}
//			sap.ui.getCore().getModel("oAFENoModel").setData("");
//			
//			if(oTextFieldFrEMP.getValue() !=null|| oTextFieldFrEMP.getValue()!=""){
//				oTextFieldFrEMP.setValueState(sap.ui.core.ValueState.None);
//				oController.fnValidateEMP(oEvent);
//			}
//
//
//
//		},

		/**
		 * EMP Validation End
		 */
		
		/**
		 * 
		 * private function to read TASK CATEGORY AND TASK NAME without AFE
		 */
//		_readTaskCatAndNameWithoutAFE:function()
//		{
//			var oController=this;
//			var oUiModel=this.getModel();
//			var flag = false;
//			var currentActivityModel 
//			if(this.ActivityIndex!=="newActivity")
//				{
//				 currentActivityModel = oUiModel.getProperty(this.globalContext.sPath);
//				}
//			else
//				{
//				currentActivityModel=sap.ui.getCore().getModel("currentActivityModel").getData();
//				}
//			
//			if(this.byId('oBTCRadioButton').getSelected()){
//
//				if((currentActivityModel.LineSegment!=undefined ||
//						currentActivityModel.LineSegment!='')
//						&& (currentActivityModel.EMP!=undefined ||
//								currentActivityModel.EMP!='')
//								&& (currentActivityModel.BMP!=undefined ||
//										currentActivityModel.BMP!='')){
//					this.readTaskCategoryAndName(oController,this.PARAMETER_BTC);
//				}
//			}
//
//		},
		
		
		/**
		 * Validations for BMP
		 */
//		fnValidateBMP:function(oEvent){
//
//			var oUiModel=this.getModel();
//			var oTextFieldFrLS= this.getView().byId("tne.actDetail.oTextFieldFrLS");
//			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
//			var TextFieldFrBMP= this.byId("tne.actDetail.bmpInput");
//			var oLabelBMPEMPRange = this.byId('tne.actDetail.lblBMPEMPRange');
//			if(oLabelBMPEMPRange.getText()== '' 
//				||oLabelBMPEMPRange.getText()==undefined ){
//				sap.m.MessageBox.show(bundle.getText("GngActLSAutoCompSelTxt"), sap.m.MessageBox.Icon.ERROR,
//						bundle.getText("CallFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
//				oTextFieldFrLS.setValueState(sap.ui.core.ValueState.Error);		
//				return;
//			}
//
//			var currentActivityModel;
//			if(this.ActivityIndex!=="newActivity")
//				{
//				 currentActivityModel = oUiModel.getProperty(this.globalContext.sPath);
//				}
//			else
//				{
//				 currentActivityModel=sap.ui.getCore().getModel("currentActivityModel").getData();
//				}
//			
//			
//			var valueBMP = currentActivityModel.BMP;
//
//			if (isNaN(valueBMP)) {                                    
//				sap.m.MessageBox.show(bundle.getText("GngActBMPNumErr"), sap.m.MessageBox.Icon.ERROR, 
//						bundle.getText("CallFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,
//				'dummyStyleClass');
//				TextFieldFrBMP.setValueState(sap.ui.core.ValueState.Error);
//				return;
//			}
//
//			var exp = /^\d{1,4}(\.\d{1,5})?$/;
//			if(!exp.test(valueBMP)){
//				sap.m.MessageBox.show(bundle.getText("EMPBMPErrTxt"), 
//						sap.m.MessageBox.Icon.ERROR,  bundle.getText("CallFailureMsgHeader"),
//						sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
//				TextFieldFrBMP.setValueState(sap.ui.core.ValueState.Error);
//				return;
//			}
//			else{
//				TextFieldFrBMP.setValueState(sap.ui.core.ValueState.None);
//			}
//
//			var path = oLabelBMPEMPRange.getBindingContext();
//			var oModelForLineSegValueHlp = sap.ui.getCore().getModel('oModelForLineSegValueHlp');
//			var bmp = oModelForLineSegValueHlp.getProperty(path + "/BMP");
//			if(bmp== undefined)
//			{
//
//				//	var bmp=	
//				var helpBMP=oModelForLineSegValueHlp.getData().items
//				for(var i=0;i<oModelForLineSegValueHlp.getData().items.length;i++)
//				{
//					if(helpBMP[i].LineSegment==oTextFieldFrLS.getValue())
//					{
//						bmp=oModelForLineSegValueHlp.getData().items[i].BMP;
//					}
//				}
//
//
//			}
//			bmp = parseFloat(bmp);                                 
//			var emp = oModelForLineSegValueHlp.getProperty(path + "/EMP");
//			if(emp== undefined)
//			{
//
//				var helpEMP=oModelForLineSegValueHlp.getData().items
//				for(var i=0;i<oModelForLineSegValueHlp.getData().items.length;i++)
//				{
//					if(helpEMP[i].LineSegment==oTextFieldFrLS.getValue())
//					{
//						emp=oModelForLineSegValueHlp.getData().items[i].EMP;
//					}
//				}
//
//			}
//			emp = parseFloat(emp);
//
//			if (!(bmp <= valueBMP && valueBMP <= emp)) {                                    
//				sap.m.MessageBox.show(bundle.getText("GngActBMPErr"), sap.m.MessageBox.Icon.ERROR, bundle.getText("CallFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
//				TextFieldFrBMP.setValueState(sap.ui.core.ValueState.Error);
//				return;
//			}
//		},

/**
 * validations for BMP END
 */

		
		/**
		 * Validations for EMP start
		 * 
		 */
//		fnValidateEMP:function(oEvent)
//		{
//
//			var oUiModel=this.getModel();
//			var oTextFieldFrLS= this.getView().byId("tne.actDetail.oTextFieldFrLS");
//			var EmpInput=this.byId("tne.actDetail.EmpInput");
//			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
//			var oLabelBMPEMPRange = this.byId('tne.actDetail.lblBMPEMPRange');
//			if(oLabelBMPEMPRange.getText()=='' 
//				||oLabelBMPEMPRange.getText()==undefined ){
//				sap.m.MessageBox.show(bundle.getText("GngActLSAutoCompSelTxt"), sap.m.MessageBox.Icon.ERROR,
//						bundle.getText("CallFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
//				oTextFieldFrLS.setValueState(sap.ui.core.ValueState.Error);	
//				return;
//			}
//			var currentActivityModel;
//			if(this.ActivityIndex!=="newActivity")
//				{
//				 currentActivityModel = oUiModel.getProperty(this.globalContext.sPath);
//				}
//			else
//				{
//				 currentActivityModel=sap.ui.getCore().getModel("currentActivityModel").getData();
//				}
//			var valueEMP = currentActivityModel.EMP;
//			var path = oLabelBMPEMPRange.getBindingContext();
//			var oModelForLineSegValueHlp = sap.ui.getCore().getModel('oModelForLineSegValueHlp');
//
//
//
//
//			var bmp = oModelForLineSegValueHlp.getProperty(path + "/BMP");
//			if(bmp== undefined)//for first value binded the bmp will always be undefined,so fetching it from local model
//			{
//
//
//				var BMP=oModelForLineSegValueHlp.getData().items
//				for(var i=0;i<oModelForLineSegValueHlp.getData().items.length;i++)
//				{
//					if(BMP[i].LineSegment==oTextFieldFrLS.getValue())
//					{
//						bmp=oModelForLineSegValueHlp.getData().items[i].BMP;
//					}
//				}
//
//
//			}
//			bmp = parseFloat(bmp);                                 
//			var emp = oModelForLineSegValueHlp.getProperty(path + "/EMP");
//			if(emp== undefined)  //for first value binded the emp will always be undefined,so fetching it from local model
//			{
//
//				var EMP=oModelForLineSegValueHlp.getData().items
//				for(var i=0;i<oModelForLineSegValueHlp.getData().items.length;i++)
//				{
//					if(EMP[i].LineSegment==oTextFieldFrLS.getValue())
//					{
//						emp=oModelForLineSegValueHlp.getData().items[i].EMP;
//					}
//				}
//
//			}
//			emp = parseFloat(emp);
//
//			if (isNaN(valueEMP)) {                                    
//				sap.m.MessageBox.show(bundle.getText("GngActEMPNumErr"), sap.m.MessageBox.Icon.ERROR,  bundle.getText("CallFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
//				sap.ui.getCore().byId("TextFieldFrEMP").setValueState(sap.ui.core.ValueState.Error);
//				return;
//			}
//
//
//			var exp = /^\d{1,4}(\.\d{1,5})?$/;
//			if(!exp.test(valueEMP)){
//				sap.m.MessageBox.show(bundle.getText("EMPBMPErrTxt"), sap.m.MessageBox.Icon.ERROR, 
//						bundle.getText("CallFailureMsgHeader"),
//						sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
//				EmpInput.setValueState(sap.ui.core.ValueState.Error);
//				return;
//			}
//			else{
//				EmpInput.setValueState(sap.ui.core.ValueState.None);
//			}
//
//
//			if (!(bmp <= valueEMP && valueEMP <= emp)) {                                    
//				sap.m.MessageBox.show(bundle.getText("GngActEMPErr"), sap.m.MessageBox.Icon.ERROR, bundle.getText("CallFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
//				EmpInput.setValueState(sap.ui.core.ValueState.Error);
//				return;
//			}
//
//
//		},
/**
 * Validations for EMP END
 */
		
		
/**
 * PRIVATE Function called for new Activity
 */		
//		_mCreateNewActivty:function(DateAndTimeConversion)
//		{
//			
//			var oUiModel=this.getModel();
//			var NavActivitPeople=oUiModel.getProperty("/selGang/activitiesDisplay/activities/0/NavActivityPeople");
//			
//			
//var newActPplTable= oUiModel.getProperty("/selGang/activitiesDisplay/actualHours/0/NavActivityPeople");
//			
//			
//			var dupEmpArray=[];
//		
//			for(var i=0;i<newActPplTable.length;i++)
//				{
//				var newAct= newActPplTable[i];
//				
//				var startTime=DateAndTimeConversion.offsetConversion(newAct.StartTime.ms);
//				var endTime=DateAndTimeConversion.offsetConversion(newAct.EndTime.ms);
//				
//		var oDupObj=	{
//				
//				Action:newAct.Action,
//				
//				ActivityID:newAct.ActivityID,
//				
//				EmployeeId:newAct.EmployeeId,
//			
//				EndDate:oUiModel.getProperty("/selGang/workDate"),
//			
//				EndTime:endTime,
//				
//				EventID:newAct.EventID,
//				
//				GangId:newAct.GangId,
//				
//				PositionId:newAct.PositionId,
//				
//				Selected:false,
//			
//				StartDate:oUiModel.getProperty("/selGang/workDate"),
//				
//				StartTime:startTime,
//				
//				WorkDate:newAct.WorkDate						
//				
//				
//				}
//				
//		dupEmpArray.push(oDupObj);
//				}
//			
//			var oLocalPplModel=new JSONModel(dupEmpArray);
//			sap.ui.getCore().setModel(oLocalPplModel,"oTableDetailsModel")
//			
//				this.byId("tne.actDetail.pplTbl").setModel(sap.ui.getCore().getModel("oTableDetailsModel"));  
//
//			
//	/*			sap.ui.getCore().byId('oDropDownAFENo').setVisible(true);
//		sap.ui.getCore().byId('TextFieldFrLS').setValueState(sap.ui.core.ValueState.None);
//		sap.ui.getCore().byId('TextFieldFrBMP').setValueState(sap.ui.core.ValueState.None);
//		sap.ui.getCore().byId('TextFieldFrEMP').setValueState(sap.ui.core.ValueState.None);
//		sap.ui.getCore().byId('oGangActivityGenericAFENo').setValueState(sap.ui.core.ValueState.None);
//
//		sap.ui.getCore().byId('oTextFieldActStart').setValueState(sap.ui.core.ValueState.None);
//		sap.ui.getCore().byId('oTextFieldActEnd').setValueState(sap.ui.core.ValueState.None);
//
//		sap.ui.getCore().byId('oGangActivityPopActAFELabel').setRequired(true);
//		sap.ui.getCore().byId('oGangActivityPopActBillCentrLabel').setRequired(false);*/
//			
//			
//			
//			
//			this.byId("tne.actDetail.oTextFieldFrLS").setValueState(sap.ui.core.ValueState.None);
//			this.byId("tne.actDetail.bmpInput").setValueState(sap.ui.core.ValueState.None);
//			this.byId("tne.actDetail.EmpInput").setValueState(sap.ui.core.ValueState.None);
//			this.byId("tne.actDetail.ActHrs.st").setValueState(sap.ui.core.ValueState.None);
//			this.byId("tne.actDetail.ActHrs.et").setValueState(sap.ui.core.ValueState.None);
//			this.byId("DP4").setValueState(sap.ui.core.ValueState.None);
//			this.byId("DP5").setValueState(sap.ui.core.ValueState.None);
//			
//			
//			
//			
//			
//			
//			
//			
//			
//			
//		/**
//		 * Enabling fields which were disabled on Edit
//		 */
//		this.byId('tne.actDetail.oTextFieldFrLS').setEnabled(true);
//		this.byId('tne.actDetail.oTextFieldFrLS').setValue(null);
//	this.byId('tne.actDetail.bmpInput').setEnabled(true);
//	this.byId('tne.actDetail.EmpInput').setEnabled(true);
//	this.byId('oDropDownTaskCategory').setEnabled(true);
//	this.byId('oDropDownTaskName').setEnabled(true);
//	this.byId('tne.actDetail.ActHrs.st').setEnabled(true);
//	this.byId('tne.actDetail.ActHrs.et').setEnabled(true);
//	
//	var oDropDownTaskCategory=this.byId('oDropDownTaskCategory');
//	oDropDownTaskCategory.setModel();
//	oDropDownTaskCategory.setSelectedItem(new sap.ui.core.Item( {}));
//
//		var oDropDownTaskName = this.byId('oDropDownTaskName')
//		oDropDownTaskName.setModel();
//		oDropDownTaskName.setSelectedItem(new sap.ui.core.Item( {}));
//		
//	//	this.byId('oLabelBMPEMPRange').setBindingContext('');
//		/**
//		 * Setting Bill to center Default checked
//		 */
//		this.byId('oRadioButtonAFENo').setSelected(false);
//		this.byId('oBTCRadioButton').setSelected(true);
//		this.byId('oDropDownAFENo').setEnabled(false);
//		this.byId('oGangActivityGenericAFENo').setVisible(false);
//		this.byId('oGangActivityPopActGenericAFELabel').setVisible(false);
//	//	this.byId('TextFieldFrBillCenter').setEnabled(true);
//		/*sap.ui.getCore().byId('idGangActivityPage').getController().taskNameAndCategory();*/
//		/*sap.ui.getCore().byId('oRadioButtonBillToCenter').fireSelect();*/
//		//Setting Bill to center checked = over
//
//
//		var oAFENoModel=new JSONModel();
//		oAFENoModel.setData();
//
//		sap.ui.getCore().setModel(oAFENoModel,"oAFENoModel")
//
//		var oTaskCategory=new JSONModel();
//		oTaskCategory.setData();
//		sap.ui.getCore().setModel(oTaskCategory,"oTaskCategory");
//
//		var oTaskNameModel=new JSONModel();
//		oTaskNameModel.setData();
//		sap.ui.getCore().setModel(oTaskNameModel,"oTaskNameModel");
//			
//		
//	//	var oBTCInput=this.getView().byId("oBTCInput");
//	//	oBTCInput.setValue(oUiModel.getProperty('/selGang/defaultCostCenter'));
//		var oTextFieldFrBMP= this.getView().byId("tne.actDetail.bmpInput"); 
//		
//		var bmpval = oTextFieldFrBMP.getValue();
//		var oBMPVal=""
//		var oEMPVal=""
//		this.byId('tne.actDetail.lblBMPEMPRange').setText(oBMPVal+" - "+oEMPVal);	
//		
//		//	var activityarray=[];
//			var activityData=
//			{
//					AFENumber:"",
//					Action:"C",
//					ActivityID:"0",
//					ActivityName:this.byId('oDropDownTaskName').getSelectedKey(),
//					ActivityType:"WA",
//					BMP:"",
//					selGang:{
//						defaultCostCenter:oUiModel.getProperty('/selGang/defaultCostCenter')
//					},
//					DelayType:"",
//					Deletable:true,
//					DerivedAFENum:"",
//					EMP:"",
//					EndDate:oUiModel.getProperty('/selGang/workDate'),
//					EndTime:DateAndTimeConversion.offsetConversion(oUiModel.getProperty("/selGang/dayGangProfile/EndTime/ms")),
//					GangId:oUiModel.getProperty('/selGang/id'),
//					GenAfeNum:"",
//					LineSegment:"",
//					NavActivityPeople:NavActivitPeople,
//					RcAfter:"",
//					RcBefore:"",
//					StartDate:oUiModel.getProperty('/selGang/workDate'),
//					StartTime:DateAndTimeConversion.offsetConversion(oUiModel.getProperty("/selGang/dayGangProfile/StartTime/ms")),
//								
//							
//					TaskCategory:this.byId('oDropDownTaskCategory').getSelectedKey(),
//					TaskName:this.byId('oDropDownTaskName').getSelectedKey(),
//					WorkDate:oUiModel.getProperty('/selGang/workDate'),
//					WorkOrderNo:""
//			}
//			
//		//	activityarray.push(activityData)
//			var currentActivityModel=new JSONModel(activityData);
//			sap.ui.getCore().setModel(currentActivityModel,"currentActivityModel");
//			this.getView().setModel(sap.ui.getCore().getModel("currentActivityModel"));	
//			var context=this.getView().getModel().getContext('/');
//			this.getView().setBindingContext(context)
//			
//			var oController=this;
//			var oModelForLineSegValueHlp=new JSONModel();
//			sap.ui.getCore().setModel(oModelForLineSegValueHlp,"oModelForLineSegValueHlp")
//			var oDataModelLineSegValueHlp = sap.ui.getCore().getModel( "oDataModelLineSegValueHlp");
//			oDataModelLineSegValueHlp.read("/FuncLocationSet",
//					null,{},true,function(oData,oResponse){
//						try{
//							var oModelForLineSegValueHlp = sap.ui.getCore().getModel("oModelForLineSegValueHlp");
//							oModelForLineSegValueHlp.setProperty('/items',oData.results);
//
//							oModelForLineSegValueHlp.refresh();
//
//
//
//						/*	var BMPEMP=oModelForLineSegValueHlp.getData().items;
//							var oTextFieldFrLS=oController.byId("tne.actDetail.oTextFieldFrLS");
//							for(var i=0;i<oModelForLineSegValueHlp.getData().items.length;i++)
//							{
//								if(BMPEMP[i].LineSegment==oTextFieldFrLS.getValue()  )
//								{
//									var oBMPVal=oModelForLineSegValueHlp.getData().items[i].BMP;
//									var oEMPVal=oModelForLineSegValueHlp.getData().items[i].EMP;
//								}
//							}
//
//
//							oController.byId('tne.actDetail.lblBMPEMPRange').setText(oBMPVal+" - "+oEMPVal);*/
//						} catch (e) {
//							util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04005: Error handling response in Get Line Segment Value Help Service");
//							/*sap.m.MessageBox.show(bundle.getText("UnknownFailureMsgBody"), sap.m.MessageBox.Icon.ERROR, bundle.getText("UnknownFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');*/
//						}
//					},
//					function(error){
//						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
//						try {
//							util.ServiceErrorHandler.handleODataError(error,bundle.getText("ActivityLSValueHelpErrorHeader"),bundle.getText("ActivityScreenErrorNumber"));
//
//						} catch (e) {
//							util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04006: Error handling exception in Get Line Segment Value Help Service");
//
//						}
//					});
//
//			
//			
//		
//
//		},
		
		
		/**
		 * Function called when save button is clicked for validation purpose
		 */
		
//		SaveActivityDetails:function(oEvent)
//		{
//			var oController=this;
//			var oUiModel=oController.getModel();
//			var currentActivityModel = sap.ui.getCore().getModel("currentActivityModel");
//			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
//			var sCallMode = "";
//			var ActChanged=false;
//			currentActivityModel.getProperty("/Action") == 'C'? sCallMode = "C": sCallMode = "U";
//			
//			var RestDay=oUiModel.getProperty("/selGang/dayType");
//			//if(currentActivityModel.getProperty("/mode")=='create'){
//		
//
//			var oActValidations = oController._activity_validations();
//
//		
//			if(oActValidations.sValidationResult === "E"){
//				sap.m.MessageBox.show(
//						oActValidations.sValidationResultText, 
//						sap.m.MessageBox.Icon.ERROR,
//						bundle.getText("CallFailureMsgHeader"),
//						sap.m.MessageBox.Action.OK,
//						null,
//						null,
//						'dummyStyleClass'
//				);
//				oActValidations.fnValidationAction();	
//
//			}else if (oActValidations.sValidationResult === "W"){
//				var oMessageDialog = new sap.m.Dialog({
//					title: bundle.getText("CallWarningMsgHeader"),
//					content:[new sap.m.Text({
//						text:oActValidations.sValidationResultText 
//					})
//					],
//					beginButton: new sap.m.Button({
//						text:"{i18n>GngActIgnrandSaveBtn}",
//						press:function(){
//							oMessageDialog.close();//call function() _saveNewActivity to plot values
//							ActChanged = true;
//							if(sCallMode === "C")
//								{
////								oController._saveNewActivity();
//								}
//				
//							else if(sCallMode === "U")
//								{
//								//			oController._saveEditedActivity(false);
//								//			
//								}
//			
//						}
//					}).addStyleClass("primaryButtonTextureStyle").addStyleClass("popoverFooterPrimaryBtnPositionStyle"),
//					endButton: new sap.m.Button({
//						text:"{i18n>GngEditActBtn}",
//						press:function(){
//							oActValidations.fnValidationAction();
//							oMessageDialog.close();
//						}
//					}).addStyleClass("secondaryButtonTextureStyle").addStyleClass("popoverFooterSecondaryBtnPositionStyle")
//				}).open();
//			}else if (oActValidations.sValidationResult === "I"){
//				return;
//			}
//			else if (oActValidations.sValidationResult === "S"){
//				ActChanged = true;
//				if(sCallMode === "C")
//					{
//					oController._saveNewActivity(sCallMode);
//					}
//			//		
//				else if(sCallMode === "U")
//					oController._saveEditedActivity();
//	
//			}
//
//			else{
//				sap.m.MessageBox.show(
//						"Validation Failed, please try Saving again.", 
//						sap.m.MessageBox.Icon.ERROR,
//						bundle.getText("CallFailureMsgHeader"),
//						sap.m.MessageBox.Action.OK,
//						null,
//						null,
//						'dummyStyleClass'
//				);
//			};
//
//		},
		
		
		
		
		
		
		
		
		
/**
 * Private Function for activity header and people level(AH1-AH6 and AP1-AP6 Validation)
 */		
//		_activity_validations:function()
//		{
//			
//			var oController=this;
//				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
//
//				var currentActivityModel = sap.ui.getCore().getModel("currentActivityModel");
//				
//				var _flagValdSucess = "S";
//				var _flagValdWarning = "W";
//				var _flagValdError = "E";
//				var _flagValdInfo = "I";
//
//				var oValidResult = {
//						sValidationResult: _flagValdSucess,
//						sValidationResultText: "Successful",
//						fnValidationAction: function(){}
//						
//				};
//				
//			//	var duplicateEmployeeModel = sap.ui.getCore().getModel("duplicateEmployeeModel");
//
//			/*	var returnActTime =  mCreateMultiDayTiming(
//						util.DateAndTimeConversion.convertYYYY_MM_DDTHH_mmToMilliSec(currentActivityModel.getProperty("/StartTime")),
//						util.DateAndTimeConversion.convertYYYY_MM_DDTHH_mmToMilliSec(currentActivityModel.getProperty("/EndTime")));
//
//
//				var	activityStartMilliSec = returnActTime.startDate.getTime();
//				var	activityEndMilliSec = returnActTime.endDate.getTime();*/
//
//				//AH1-AH5 Validation begin
//				
//		//validation for LS
//				var flag = true;		
//				if(currentActivityModel.getProperty("/LineSegment") ==undefined || currentActivityModel.getProperty("/LineSegment")==""){
//					
//				
//					
//					oValidResult.sValidationResult = _flagValdError;
//					oValidResult.sValidationResultText = bundle.getText("GngActFillLS");
//					oValidResult.fnValidationAction = function(){
//						oController.byId("tne.actDetail.oTextFieldFrLS").setValueState(sap.ui.core.ValueState.Error);
//						
//					};
//					return oValidResult;
//				} else {
//					if(currentActivityModel.getProperty("/LineSegment") !=undefined){
//										var regExp = /^\d{1,4}$/;
//						if(!regExp.test(currentActivityModel.getProperty("/LineSegment"))){
//							oValidResult.sValidationResult = _flagValdError;
//							oValidResult.sValidationResultText = bundle.getText("GngActLSNum");
//							oValidResult.fnValidationAction = function(){
//								oController.byId("tne.actDetail.oTextFieldFrLS").setValueState(sap.ui.core.ValueState.Error);
//								
//							};
//							return oValidResult;
//						}
//					}
//				}
//		
//				
//	//Validation for BMP			
//				if(currentActivityModel.getProperty("/BMP") ==null || currentActivityModel.getProperty("/BMP")==""){
//					oValidResult.sValidationResult = _flagValdError;
//					oValidResult.sValidationResultText = bundle.getText("GngActFillBMP");
//					oValidResult.fnValidationAction = function(){
//						oController.byId('tne.actDetail.bmpInput').setValueState(sap.ui.core.ValueState.Error);
//						
//					};
//					return oValidResult;						
//							
//					
//				}
//				else{
//					var value = currentActivityModel.getProperty("/BMP");
//					var exp = /^\d{1,4}(\.\d{1,5})?$/;
//					if(!exp.test(value)){
//						oValidResult.sValidationResult = _flagValdError;
//						oValidResult.sValidationResultText = bundle.getText("InvalidBMP");
//						oValidResult.fnValidationAction = function(){
//							oController.byId('tne.actDetail.bmpInput').setValueState(sap.ui.core.ValueState.Error);
//							
//						};
//						return oValidResult;						
//								
//						
//					}else{
//						oController.byId('tne.actDetail.bmpInput').setValueState(sap.ui.core.ValueState.None);
//					}
//				}	
//				
//		//Validation for EMP			
//				
//				if(currentActivityModel.getProperty("/EMP") ==null || currentActivityModel.getProperty("/EMP")==""){
//					
//					oValidResult.sValidationResult = _flagValdError;
//					oValidResult.sValidationResultText = bundle.getText("GngActFillEMP");
//					oValidResult.fnValidationAction = function(){
//						oController.byId('tne.actDetail.EmpInput').setValueState(sap.ui.core.ValueState.Error);
//						
//					};
//					return oValidResult;
//					
//					
//					
//					
//					
//					
//					
//				}else{
//					var value = currentActivityModel.getProperty("/EMP");
//					var exp = /^\d{1,4}(\.\d{1,5})?$/;
//					if(!exp.test(value)){
//						
//						oValidResult.sValidationResult = _flagValdError;
//						oValidResult.sValidationResultText = bundle.getText("InvalidEMP");
//						oValidResult.fnValidationAction = function(){
//							oController.byId('tne.actDetail.EmpInput').setValueState(sap.ui.core.ValueState.Error);
//							
//						};
//						return oValidResult;					
//						
//						
//						
//					}
//					else{
//						oController.byId('tne.actDetail.EmpInput').setValueState(sap.ui.core.ValueState.None);
//					}
//				}	
//				
//			//AH3-Validation for AFE/BTC Radio Button selected	
//				
//				/**
//				 * Change- AFE/Bill to Center validation
//				 */
//				if(oController.byId('oRadioButtonAFENo').getSelected()){
//					if(oController.byId('oDropDownAFENo').getSelectedKey() ==null ||oController.byId('oDropDownAFENo').getSelectedKey()==""){
//						
//						oValidResult.sValidationResult = _flagValdError;
//						oValidResult.sValidationResultText = bundle.getText("GngActFillAFENo");
//						oValidResult.fnValidationAction = function(){
//							
//						};
//						return oValidResult;	
//						
//						
//					}else if(oController.byId('oDropDownAFENo').getSelectedKey()=="OTHERS" && 
//							(oController.byId('oGangActivityGenericAFENo').getValue()==""||oController.byId('oGangActivityGenericAFENo').getValue()==null)){oValidResult.sValidationResult = _flagValdError;
//							oValidResult.sValidationResultText = bundle.getText("GngActFillGenericAFENo");
//							oValidResult.fnValidationAction = function(){
//								sap.ui.getCore().byId('oGangActivityGenericAFENo').setValueState(sap.ui.core.ValueState.Error);
//								
//							};
//							return oValidResult;}
//									
//				}
//			
//				/**
//				 * Validation for Generic Afe 
//				 */
//				if(oController.byId('oDropDownAFENo').getSelectedKey()=="OTHERS"){
//					if(oController.byId('oGangActivityGenericAFENo').getValueState()== "Error"){	
//					oValidResult.sValidationResult = _flagValdError;
//					oValidResult.sValidationResultText = bundle.getText("GngAcTGenAfeInvValMsg");
//					
//					return oValidResult;}
//				}
//
//				/**
//				 * Validation for Generic Afe - Over
//				 */
//				
//				/**
//				 * Validation for BTC RadioBtn and BTC Textfield
//				 */
//			
//				
//
//				if(oController.byId('oBTCRadioButton').getSelected() &&
//						(oController.byId('oBTCInput').getValue()==""||oController.byId('oBTCInput').getValue()==null)){
//					
//					oValidResult.sValidationResult = _flagValdError;
//					oValidResult.sValidationResultText = bundle.getText("GngActFillBTC");
//					oValidResult.fnValidationAction = function(){
//						oController.byId('oBTCInput').setValueState(sap.ui.core.ValueState.Error);
//					
//					};
//					return oValidResult;							
//					
//
//					
//				}else {
//					if(oController.byId('oBTCRadioButton').getSelected() &&
//							(oController.byId('oBTCInput').getValue()!=undefined)){
//						var regExp = /^\d{1,10}$/;
//						if(!regExp.test(oController.byId('oBTCInput').getValue())){
//							
//							oValidResult.sValidationResult = _flagValdError;
//							oValidResult.sValidationResultText = bundle.getText("GngActBTCNum");
//							oValidResult.fnValidationAction = function(){
//								oController.byId('oBTCInput').setValueState(sap.ui.core.ValueState.Error);
//								
//							};
//							return oValidResult;				
//							
//							
//							
//							
//						}
//					}
//				}
//				
//				/**
//				 * Validation for Task Category and task name dropdown box
//				 */
//				if(oController.byId('oDropDownTaskCategory').getSelectedKey() ==null || oController.byId('oDropDownTaskCategory').getSelectedKey()==""){
//					oValidResult.sValidationResult = _flagValdError;
//				oValidResult.sValidationResultText = bundle.getText("GngActFillTaskCat");
//				
//				return oValidResult;
//				
//				}
//				if(oController.byId('oDropDownTaskName').getSelectedKey() ==null || oController.byId('oDropDownTaskName').getSelectedKey()==""){
//
//					oValidResult.sValidationResult = _flagValdError;
//					oValidResult.sValidationResultText = bundle.getText("GngActFillTaskName");
//					
//					return oValidResult;
//				
//				}		
//				
//				/**
//				 * Validation for Task Category and task name dropdown box -End
//				 */
//				
//		
//				
//				if(currentActivityModel.getProperty("/StartTime") ==null || currentActivityModel.getProperty("/StartTime")==""){
//					oValidResult.sValidationResult = _flagValdError;
//					oValidResult.sValidationResultText = bundle.getText("GngActFillStartTime");
//					oValidResult.fnValidationAction = function(){
//						oController.byId('tne.actDetail.ActHrs.st').setValueState(sap.ui.core.ValueState.Error);
//						
//					};
//					return oValidResult;						
//					
//					
//					
//				}
//				if(currentActivityModel.getProperty("/EndTime") ==null || currentActivityModel.getProperty("/EndTime")==""){
//					
//					oValidResult.sValidationResult = _flagValdError;
//					oValidResult.sValidationResultText = bundle.getText("GngActFillEndTime");
//					oValidResult.fnValidationAction = function(){
//						oController.byId('tne.actDetail.ActHrs.et').setValueState(sap.ui.core.ValueState.Error);
//						
//					};
//					return oValidResult;		
//					
//					
//				}
//				if(oController.byId('tne.actDetail.ActHrs.st').getValueState()=='Error'){
//					oValidResult.sValidationResult = _flagValdError;
//				oValidResult.sValidationResultText = bundle.getText("GngActFillStartTime");
//				
//				return oValidResult;
//				} 
//
//				if(oController.byId('tne.actDetail.ActHrs.et').getValueState()=='Error'){
//					oValidResult.sValidationResult = _flagValdError;
//				oValidResult.sValidationResultText = bundle.getText("GngActFillEndTime");
//				
//				return oValidResult;
//				} 
//				
//				//Function to check header validation
//				
//				
//
//				/**
//				 * validations done
//				 */
//			
//			
//	//TODO		
//			//Overtimecode 
//				
//				/*
//				 * Determie activites overlapping with current activity being validated.
//				 * Requied to check people level opverlap later in the process
//				 * In this process only activites overlapping with current activity are checked
//				 * Also current activity if edited needs to be removed from list of overlapping activites
//				 * to prevent comoparision against self
//				 */
//				
//
//		//		var	activityStartMilliSec = returnActTime.startDate.getTime();
//	//			var	activityEndMilliSec = returnActTime.endDate.getTime();
//				var oUiModel = this.getModel();
//				var activityStartMilliSec = oUiModel.getProperty("/selGang/dayGangProfile/StartTime/ms") ;
//				var activityEndMilliSec = oUiModel.getProperty("/selGang/dayGangProfile/EndTime/ms");
//
//				var aOverlapActivities= [];
//			
//				var allActivity = oUiModel.getProperty("/selGang/activities");
//				//var currentActivityModel = sap.ui.getCore().getModel("currentActivityModel");
//				var currentActivity = sap.ui.getCore().getModel("currentActivityModel").getData();
//
//				var currentActivityID = sap.ui.getCore().getModel("currentActivityModel").getData().ActivityID;
//				
//		/**
//		 * To caluclate Activity time now in millisec!(Pass workdate obj and time now in ms)
//		 * 
//		 * Return current Date-Time in ms
//		 */		
//			var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
//			var actStoffset=currentActivity.StartTime.getTime()-(TZOffsetMs);
//			var actEndoffset=currentActivity.EndTime.getTime()-(TZOffsetMs);
//			var activityStartMilliSec=com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScr(currentActivity.StartDate,actStoffset);
//			
//			var activityEndMilliSec=com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScr(currentActivity.EndDate,actEndoffset);
//				
//				
//				
//				for (var i = 0; i<allActivity.length; i++){
//					if((allActivity[i].ActivityType != "AH" && allActivity[i].ActivityType != "WM" && allActivity[i].ActivityType != "MB") && allActivity[i].Action != "D"
//						&& currentActivityID !== allActivity[i].ActivityID){
//						
//						/**
//						 * To caluclate each activity time in millisec!(Pass workdate obj and time  in ms)
//						 * 
//						 * Return current Date-Time in ms
//						 */	
//						
//						
//			var othrActStrTime_ms =com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(allActivity[i].WorkDate,allActivity[i].StartTime);
//							
//			var othrActEndTime_ms = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(allActivity[i].WorkDate,allActivity[i].EndTime);
//
//						
//						
//
//						//Negating time zone offset
//			//			var othrActStrTime_ms = util.DateAndTimeConversion.displayValueDate(allActStrTime_ms).getTime();
//		//				var othrActEndTime_ms = util.DateAndTimeConversion.displayValueDate(allActEndTime_ms).getTime();
//
//						//Negating time zone offset
//			//			var othrActStrTime_ms = com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(allActStrTime_ms).getTime();
//			//			var othrActEndTime_ms = com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(allActEndTime_ms).getTime();
//
//
//
//						var chkOvlp_AllAct_currAct_Flag = com.bnsf.eam.tne.util.Validators.chkOverlap(othrActStrTime_ms,othrActEndTime_ms,
//								activityStartMilliSec,activityEndMilliSec);
//
//						if(chkOvlp_AllAct_currAct_Flag){ //overlap = true
//							aOverlapActivities.push(allActivity[i]);
//						};
//					};
//				};
//				
////				Get model data and start time and end time
//				var errorwarnModel = new sap.ui.model.json.JSONModel();
//				var iNumEmpAssigned = 0;
//				var aPplValidationErrors = [];
//				var selectedEmployees =[];
//				var duplicateEmployeeModel=sap.ui.getCore().getModel("oTableDetailsModel");
//				selectedEmployees = duplicateEmployeeModel.getData(); 
//				
//				
//				var bPplErrorExists = false;
//				var bPplWarningExists = false;
//				/*
//				 * Declare variables to calculte earliest start and latest end of people assignemnt
//				 * Requied to validate if activity time has been assigned with some person working throughout
//				 */
//				var dEarliestStartTime = activityEndMilliSec;
//				var dLatestEndTime = activityStartMilliSec;
//				
//
//				/*
//				 * Loop on all employees in gang
//				 * Perform all people level validations
//				 * 	•	AP1 - Each employee should have Start and end time
//				 *	•	AP2 - Multiple assignments for employees do not overlap
//				 *	•	AP3 - Each employee time should be >= activity start time and <= activity end time
//				 *	•	AP4 - Complete duration of activity should be covered by employee assignments
//				 *	•	AP5 - Employee assignment should not overlap with the same employee’s time from some other activity 
//				 *
//				 * Also make the following activity level validation
//				 * 	•	AH6 - Validate atleast one employee is selected/assigned 
//				 */
//				var Results={};
//				
//				for ( var int = 0; int < selectedEmployees.length; int++) {		
//					
//					if(selectedEmployees[int].Selected){
//					
//
//						//Object to store people level errors and warnings
//						var	oPplErrorObj = { 
//								EmpNo: selectedEmployees[int].EmployeeId, 
//							
//								Errors: [], 
//								Warnings: [], 
//								TableIndex: 0 //to be used later to display corresponing pople level errors against each employee entry 
//						};
//
//						//increment emp count to coolect date for AH6
//						
//						//increment emp count to collect date for AH6
//						iNumEmpAssigned ++;
//						
//					
//						
//						if(selectedEmployees[int].StartTime == null||selectedEmployees[int].StartTime == '' 
//							|| selectedEmployees[int].StartDate==null ||selectedEmployees[int].StartDate==''){
//							oPplErrorObj.Errors.push({
//								type: "Error",
//								title: bundle.getText("GngActVldtActPplStTimeErr"),
//								description: bundle.getText("GngActVldtActPplStTimeErr")
//							});
//							
//							
//						};
//
//						//checking for end time for AP1
//						if(selectedEmployees[int].EndTime == null || selectedEmployees[int].EndTime == '' 
//							||selectedEmployees[int].EndDate==null || selectedEmployees[int].EndDate==''){
//							
//							oPplErrorObj.Errors.push({
//								type: "Error",
//								title: bundle.getText("GngActVldtActPplEndTimeErr"),
//								description: bundle.getText("GngActVldtActPplEndTimeErr")
//							});
//							
//						};				
//						
//						if((selectedEmployees[int].StartTime !== null && selectedEmployees[int].StartTime !== '') 
//							&& (selectedEmployees[int].StartDate !==null && selectedEmployees[int].StartDate!=='')
//							&&	(selectedEmployees[int].EndTime !== null && selectedEmployees[int].EndTime !== '') 
//									 && (selectedEmployees[int].EndDate !==null && selectedEmployees[int].EndDate !==''))	
//						
//						
//						
//							{
//							var oEmpStartTime=com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScr(selectedEmployees[int].StartDate,(selectedEmployees[int].StartTime-(TZOffsetMs)));
//							var oEmpEndTime=com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScr(selectedEmployees[int].EndDate,(selectedEmployees[int].EndTime-(TZOffsetMs)));
//														
//							//checking whether emp start time is within activity time for AP3
//							if( oEmpStartTime < activityStartMilliSec){
//							
//								oPplErrorObj.Errors.push({
//									type: "Error",
//									title: bundle.getText("GngActVldtActPplStErrTitle"),
//									description: bundle.getText("GngActVldtActPplStLtAtErr")
//								});
//								
//							};
//
//							if(oEmpStartTime  >= activityEndMilliSec){
//								
//								oPplErrorObj.Errors.push({
//									type: "Error",
//									title: bundle.getText("GngActVldtActPplStErrTitle"),
//									description: bundle.getText("GngActVldtActPplStGtAtErr")
//								});
//							
//							};
//	
//							
//							if( oEmpEndTime <= activityStartMilliSec){
//							
//								oPplErrorObj.Errors.push({
//									type: "Error",
//									title: bundle.getText("GngActVldtActPplEtErrTitle"),
//									description: bundle.getText("GngActVldtActPplEtLtAtErr")
//								});
//								
//							};
//
//							if( oEmpEndTime > activityEndMilliSec){
//								
//							
//								oPplErrorObj.Errors.push({
//									type: "Error",
//									title: bundle.getText("GngActVldtActPplEtErrTitle"),
//									description: bundle.getText("GngActVldtActPplEtGtAtErr")
//								});
//								
//							};						
//							
//	
//	//TODO				//Checking for multiple employee assignment overlap-AP2 
//		
//					
//							/*
//							 * check for full utilization of emp in the activity time 
//							 * (Collecting date for AP4 - to be validated at the end of for loop)
//							 */
//							if(dEarliestStartTime > oEmpStartTime){
//								dEarliestStartTime=oEmpStartTime;
//							};
//
//							if( dLatestEndTime < oEmpEndTime){
//								dLatestEndTime=oEmpEndTime;
//							};
//					
//	
//							/* Start validation AP5
//							 * Loop on all overlapping activites (determined earlie in this method
//							 * Find corresponding employee as the current index employee (of all employees loop)
//							 * assignment time for other overlapping activies to determine overlap with other activites
//							 */
//
//							var bIsOverlap;
//							for(var olapIndex=0; olapIndex < aOverlapActivities.length; olapIndex++){
//								var actPeople = aOverlapActivities[olapIndex].NavActivityPeople;
//								for (var k = 0; k < actPeople.length; k++){ // Loop 3
//
//									if(selectedEmployees[int].EmployeeId === actPeople[k].EmployeeId && selectedEmployees[int].Selected){
//
//										if(selectedEmployees[int].StartTime!="" && selectedEmployees[int].EndTime!="")
//										{
////TODO need to change the workdate to start and End date respectively
//										var	actPeopleStrTime = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(allActivity[k].WorkDate,actPeople[k].StartTime);
//										var	actPeopleEndTime = com.bnsf.eam.tne.util.DateAndTimeConversion.dateObjForActScroffSet(allActivity[k].WorkDate,actPeople[k].EndTime);
//
//											bIsOverlap = com.bnsf.eam.tne.util.Validators.chkOverlap(oEmpStartTime,oEmpEndTime,
//													actPeopleStrTime,actPeopleEndTime);
//											
//											if(bIsOverlap){// OverLap ==  true
//
//												oPplErrorObj.Warnings.push({
//													type: "Warning",
//													title: (bundle.getText("GngActVldtActPplLevelOverLapTitle")),
//													description: bundle.getText("GngActVldtActPplLevelOverLap", [aOverlapActivities[olapIndex].ActivityName])
//												});
//
//											}		
//										}
//									};
//								};
//
//
//							}							
//							
//							
//							};			
//							/*
//							 * End of AP5
//							 */
//
//							//log in people level error array if any errors or warnings found
//
//		
//							if(oPplErrorObj.Errors.length > 0 && oPplErrorObj.Warnings.length > 0){
////								aPplValidationErrors.push(oPplErrorObj);   //Push oPplErrorObj into aPplValidationErrors
//								bPplErrorExists = true;
//								bPplWarningExists = true;
//								var aResults = oPplErrorObj.Errors;
//								aResults.concat(oPplErrorObj.Warnings);
//								var objErrWarn = {
//										ErrorCount:oPplErrorObj.Errors.length,
//										WarningCount:oPplErrorObj.Warnings,
//										ResultsList: aResults
//								};				
//								duplicateEmployeeModel.setProperty("/"+int+"/Results",objErrWarn); //pushing objErrWarn inside Results property of DuplicateEmployeeModel
//							}else if(oPplErrorObj.Errors.length > 0){
////								aPplValidationErrors.push(oPplErrorObj);   //Push oPplErrorObj into aPplValidationErrors
//								bPplErrorExists = true;
//								var objErrWarn = {
//										WarningCount:0,
//										ErrorCount:oPplErrorObj.Errors.length,
//										ResultsList: oPplErrorObj.Errors
//								};			
//								duplicateEmployeeModel.setProperty("/"+int+"/Results",objErrWarn); //pushing objErrWarn inside Results property of DuplicateEmployeeModel
//							}else if(oPplErrorObj.Warnings.length > 0){
////								aPplValidationErrors.push(oPplErrorObj);   //Push oPplErrorObj into aPplValidationErrors
//								bPplWarningExists = true;
//								var objErrWarn = {
//										ErrorCount: 0,
//										WarningCount:oPplErrorObj.Warnings.length,
//										ResultsList: oPplErrorObj.Warnings
//								};
//
//								duplicateEmployeeModel.setProperty("/"+int+"/Results",objErrWarn); //pushing objErrWarn inside Results property of DuplicateEmployeeModel
//							};					
//													
//
//							//Push oPplErrorObj into aPplValidationErrors
//			
//							
//							
//						
//					
//					};
//				
//				};	
//				
//
//				/*
//				 * Validate AH6 - atleast one employee is selected/assigned
//				 */
//				
//				if(iNumEmpAssigned <= 0)
//				{
////					sap.m.MessageBox.show(bundle.getText("GngActAddEmployees"), sap.m.MessageBox.Icon.ERROR,bundle.getText("GngActEmpMissing"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
////					sap.ui.getCore().byId('oIconTabBarActivities').setSelectedKey('oIconTabFilterEmployees');
////					flag = false;
////					return flag;
//					oValidResult.sValidationResult = _flagValdError;
//					oValidResult.sValidationResultText = bundle.getText('GngActAddEmployees');
//				
//					return oValidResult;
//				}
//				
//				
//				else if(bPplErrorExists){
//					oValidResult.sValidationResult = _flagValdError;
//					oValidResult.sValidationResultText = bundle.getText('GngActVldtActPplErrWarn');
//					
//					return oValidResult;
//				}
//				
//				
//				else if(bPplWarningExists){
//					oValidResult.sValidationResult = _flagValdWarning;
//					oValidResult.sValidationResultText = bundle.getText('GngActpplOvrlp_MsgBoxTxt');
//					
//					return oValidResult;
//				}
//				
//				// To check whether complete duration is completed by people -AP4 Validation
//				else if((dEarliestStartTime  != activityStartMilliSec)  || (dLatestEndTime != activityEndMilliSec))
//				{
//
//					oValidResult.sValidationResult = _flagValdWarning;
//					oValidResult.sValidationResultText = bundle.getText('GngActVldtActNotFullyAssignedWrn');
//					
//					return oValidResult;
//
//				};
//					
//				
//				return oValidResult
//		},
		
//		_saveNewActivity:function(sCallMode)
//		{
//			
//			/**
//			 * Adding the selected Employees into the current activity model
//			 */
//			
//			var oUiModel=this.getModel();
//			var NavActivityPeopleData=[];
//			var localModel_ActivityArray= oUiModel.getData().selGang.activities;
//			var currentActModel=sap.ui.getCore().getModel("currentActivityModel");
//			
//			
//			var oTaskCategorySelected=this.byId('oDropDownTaskCategory').getSelectedKey();
//			var oTaskNameSelected=this.byId('oDropDownTaskName').getSelectedKey();
//			currentActModel.setProperty('/TaskCategory',oTaskCategorySelected);
//			currentActModel.setProperty('/TaskName',oTaskNameSelected);
//			currentActModel.setProperty('/ActivityName',oTaskNameSelected);
//			
//			
//			
//			
//			
//			var selectedEmployees=sap.ui.getCore().getModel("oTableDetailsModel").getData();
//			for ( var index = 0; index < selectedEmployees.length; index++) {		
//				
//				if(selectedEmployees[index].Selected){					
//					
//					NavActivityPeopleData.push(selectedEmployees[index]);			
//				
//				
//				}				
//				
//				}
//			
//			currentActModel.setProperty('/NavActivityPeople',NavActivityPeopleData);
//			currentActModel.refresh();
//					
//		
//
//			
//		var aConsolidated_payLoad=this.createPayloadStructure(sCallMode);
//		localModel_ActivityArray.push(aConsolidated_payLoad);		// get the localModel_ActivityArray and push the consolidated payload
//		oUiModel.refresh();
//		},
//		
//		_saveEditedActivity:function()
//		{			
//			/**
//			 * Adding the selected Employees into the current activity model
//			 */
//			
//			var oUiModel=this.getModel();
//			var NavActivityPeopleData=[];
//			var localModel_ActivityArray= oUiModel.getData().selGang.activities;
//			var currentActModel=sap.ui.getCore().getModel("currentActivityModel");
//			
///**Updating the data in activity detail page **/			
//			var oTaskCategorySelected=this.byId('oDropDownTaskCategory').getSelectedKey();
//			var oTaskNameSelected=this.byId('oDropDownTaskName').getSelectedKey();
//			var oAFESelected=this.byId('oAFEDropdown').getSelectedKey();
//			
//			if(oAFESelected==undefined || oAFESelected==null)
//				{
//				oAFESelected="";
//				}
//			
//			currentActModel.setProperty('/AFENumber',oAFESelected);
//			currentActModel.setProperty('/TaskCategory',oTaskCategorySelected);
//			currentActModel.setProperty('/TaskName',oTaskNameSelected);
//			currentActModel.setProperty('/ActivityName',oTaskNameSelected);
//			
//			
//			var selectedEmployees=sap.ui.getCore().getModel("oTableDetailsModel").getData();
//			for ( var index = 0; index < selectedEmployees.length; index++) {		
//				
//				if(selectedEmployees[index].Selected)
//				{										
//					NavActivityPeopleData.push(selectedEmployees[index]);					
//				
//				}
//				
//				
//				
//				
//				}
//			
//			
//			currentActModel.setProperty('/NavActivityPeople',NavActivityPeopleData);	//update or add the people to the currentactivity
//			currentActModel.refresh();
//		
//			
//			for(var i=0;i<localModel_ActivityArray.length;i++)
//				{
//				
//				if(localModel_ActivityArray[i].ActivityID==currentActModel.getData().ActivityID) 	//check the activityID with the default model and currentActivity
//					{
//					
//					localModel_ActivityArray[i]=currentActModel.getData();  //update the model data,if the user has edited it and store it in the default local model
//					
//					}
//				
//				
//				}
//					
//		
//		
//			
//			
//		},
		
		/**
		 * Prepate payload for sending it to the backend
		 */
//		createPayloadStructure:function(sCallMode)
//		{
//			
//			
//			var oUiModel=this.getModel();
//			
//			var activities= oUiModel.getProperty('/selGang/activities')
//			
//			
//			
//			
//			/** Deleting the __metadata from object **/
//			for(var i=0;i<activities.length;i++)
//				{
//				var navPplArray=  oUiModel.getProperty('/selGang/activities/'+i+'/NavActivityPeople');
//				delete activities[i].__metadata;
//				for(var j=0;j<navPplArray.length;j++)
//					{
//					
//					delete navPplArray[j].__metadata;
//					}
//				}		
//			
//			
//			
//			var aconsolidatePpl_Array=[];
//			var otableEmployees=sap.ui.getCore().getModel("currentActivityModel").getProperty('/NavActivityPeople');
//			
//			/** Converting the date object to Time of EDM Type time in people array **/
//			for ( var index = 0; index < otableEmployees.length; index++)
//			{		
//				
//				
//				var opplPayloadStructure=
//					{
//						Action :sCallMode,
//						ActivityID:otableEmployees[index].ActivityID,
//						EmployeeId : otableEmployees[index].EmployeeId,
//						EndDate :otableEmployees[index].EndDate ,
//						EndTime :com.bnsf.eam.tne.util.DateAndTimeConversion.convertDateObjecttoms(otableEmployees[index].EndTime) ,//convert a date object into an object of EDM Type time
//						EventID: otableEmployees[index].EventID ,
//						GangId:otableEmployees[index].GangId ,
//						PositionId:"S8231" ,
//						StartDate:otableEmployees[index].StartDate,
//						StartTime :com.bnsf.eam.tne.util.DateAndTimeConversion.convertDateObjecttoms(otableEmployees[index].StartTime),
//						WorkDate :otableEmployees[index].WorkDate						
//						
//					}
//				
//				aconsolidatePpl_Array.push(opplPayloadStructure);
//				
//				
//				}				
//				
//				
//			
//			
//			var ocurrentActivity =sap.ui.getCore().getModel('currentActivityModel').getData();
//			
//				var actIter= ocurrentActivity;
//				
//				var oActivityStrucForBackend={
//						
//					AFENumber:actIter.AFENumber,
//					Action:actIter.Action,
//					ActivityID:actIter.ActivityID,
//					ActivityName:actIter.ActivityName,
//					ActivityType:actIter.ActivityType,
//					BMP:actIter.BMP,
//					BillToCenter:sap.ui.getCore().getModel('currentActivityModel').getProperty('/selGang/defaultCostCenter'),			
//					DelayType:actIter.DelayType,
//					Deletable:actIter.Deletable,
//					DerivedAFENum:'234, 456,8908, 789798, 9809809, 7777, 789798, 86367',
//					EMP:actIter.EMP,
//					EndDate:actIter.EndDate,
//					EndTime:com.bnsf.eam.tne.util.DateAndTimeConversion.convertDateObjecttoms(actIter.EndTime),
//					GangId:actIter.GangId,
//					GenAfeNum:actIter.GenAfeNum,
//					LineSegment:actIter.LineSegment,
//					NavActivityPeople:aconsolidatePpl_Array,
//					RcAfter:actIter.RcAfter,
//					RcBefore:actIter.RcBefore,
//					StartDate:actIter.StartDate,
//					StartTime:com.bnsf.eam.tne.util.DateAndTimeConversion.convertDateObjecttoms(actIter.StartTime),						
//					TaskCategory:actIter.TaskCategory,
//					TaskName:actIter.TaskName,
//					WorkDate:actIter.WorkDate,
//					WorkOrderNo:actIter.WorkOrderNo				
//												
//				
//				
//				}
//			
//			
//	//		var ocurrentActivity=sap.ui.getCore().getModel('currentActivityModel').getData;		
//			
//			
///*ocurrentActivity['StartTime']=com.bnsf.eam.tne.util.DateAndTimeConversion.convertDateObjecttoms(ocurrentActivity['StartTime']);	
//ocurrentActivity['EndTime']=com.bnsf.eam.tne.util.DateAndTimeConversion.convertDateObjecttoms(ocurrentActivity['EndTime']);		*/
//			
//			
//			
//			
//			return oActivityStrucForBackend; //return the navGangActivityPayload 
//			
//			
//			
//			
//			
//			
//			
//			
//			
//			
//			
//			
//			
//			
//		},
//		mSaveActivityDetails:function()
//		{
//			
//			this.SaveActivityDetails();
			
			/*var oUiModel=this.getModel();		
			
		
			
			
			var oDataSrvForGangActivity =  sap.ui.getCore().getModel("oDataSrvForGangActivity");
			
			var updateData; 		
			
			updateData={
					
				DefaultCostCenter: oUiModel.getProperty('/selGang/defaultCostCenter'),	
				Extension1:"V2",
				Extension2:"",
				GangId: oUiModel.getProperty('/selGang/id'),
				NavGangActivity: oUiModel.getProperty('/selGang/activities'),
				NavGangActivityPeople: [], 
				OpResult:"",
				OpResultMsg:"",
				OpType:"S",
				UserId:oUiModel.getProperty('/user/id'),
				WorkDate: oUiModel.getProperty('/selGang/workDate')
	
					
			}
			
			

			oDataSrvForGangActivity.create(
					"/GangActivities",
					updateData ,null,
					function(oData, oResponse){
						*//**
						 * once the data is sent, send request to backend so all Update,Create markers are initialised again.
						 *//*
						try{
							jQuery.sap.require("sap.m.MessageBox"); 
							if(oData.OpResult =='E'){
							
								var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();

								sap.m.MessageBox.show(oData.OpResultMsg, 
										sap.m.MessageBox.Icon.ERROR, 
										bundle.getText("CallFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
							}else{

								*//**
								 * Data has been saved-- Keep a field to mark changes are saved so need need for confirmation on back button
								 *//*
								
								ActChanged = false;


								var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();

								sap.m.MessageBox.show(bundle.getText("DataUpdatedSuccessfully"), 
										sap.m.MessageBox.Icon.SUCCESS, 
										bundle.getText("CallSuccessMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
							}

							fnResetActivityAllDay();
						} catch (e) {
							util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04027: Error handling response in Post Gang Activity Service"); 
							sap.m.MessageBox.show(bundle.getText("UnknownFailureMsgBody"), sap.m.MessageBox.Icon.ERROR, bundle.getText("UnknownFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
						}
					},
					function(error){

						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						jQuery.sap.require("sap.m.MessageBox");
						try {
						//	fnResetActivityAllDay();

							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("ActivityNextBtnFailHeader"),bundle.getText("ActivityScreenErrorNumber"));
							if(error.response.statusCode.toString().charAt(0)=="5")
							{
								sap.m.MessageBox.show(error.response.statusText, sap.m.MessageBox.Icon.ERROR,error.message ,sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
							}else if(error.response.statusCode.toString().charAt(0)=="4"){
							  var sError = error.response.body;
							  oJSON =JSON.parse(sError);
							  sap.m.MessageBox.show(oJSON.error.message.value, sap.m.MessageBox.Icon.ERROR,bundle.getText("ErrUpdtAct"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
							}else{
								sap.m.MessageBox.show(bundle.getText("CallFailureMsgHeader"), sap.m.MessageBox.Icon.ERROR, bundle.getText("HTTPErrorUnknown") ,sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
							}
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Activity - I04028: Error handling exception in Post Gang Activity Service"); 
							sap.m.MessageBox.show(bundle.getText("UnknownFailureMsgBody"), sap.m.MessageBox.Icon.ERROR, bundle.getText("UnknownFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
						}



					}

			);
	*/
			
			
		
//		},
		
	});
	return ActDetailsController;
});