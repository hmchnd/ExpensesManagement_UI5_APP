sap.ui.define([
'com/bnsf/eam/tne/controller/BaseController',
'com/bnsf/eam/tne/util/DateAndTimeConversion',
'com/bnsf/eam/tne/util/UserNameFormatter',
'com/bnsf/eam/tne/util/Validators',
'sap/ui/model/json/JSONModel',
"com/bnsf/eam/tne/model/models",
'sap/m/MessageBox',
'com/bnsf/eam/tne/util/ServiceErrorHandler',
'com/bnsf/eam/tne/util/FetchValueHelps'
], function(BaseController, DateAndTimeConversion, UserNameFormatter, Validators, JSONModel, models, MessageBox, ServiceErrorHandler,FetchValueHelp) {
	"use strict";

	var PCEmployeeController = BaseController.extend("com.bnsf.eam.tne.controller.PCEmployee", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf view.PCEmployee
		 */
		onInit: function() {

			var oUiModel = this.getModel();
			this.setModel(oUiModel);

			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);			

		},
		/**
		 * On route matched for PCEmployee screen
		 * Instantiates PCEmployee 
		 * @private
		 * @memberOf tne.pcEmp
		 * @returns null
		 */
		_onRouteMatched: function(oEvent){
			var sRoute = oEvent.getParameter("name");			
			var oArgs= oEvent.getParameter("arguments").EmpID; 	
			this._EmpRef = oArgs;	
			var viewLevel=this.getRouter().getTargets()._oLastDisplayedTarget._oTargetHandler._iCurrentViewLevel;
			if(sRoute == "PCEmployee"){
				if(viewLevel != 2 ){
					var context = this.getModel().getContext('/selGang/pcTreeDisplay/categories/'+oArgs+'');
					var sPath = context.sPath;			
//					var dataToBeModified = this.getModel().getProperty(sPath);
//					this._oDataModifier(dataToBeModified);
					this._dataBeforeShow = jQuery.extend(true, {}, this.getModel().getProperty(sPath));
					this.getView().setBindingContext(context);	
				};

			};
		},

		_oDataModifier: function(data){
			var aNavBaseTimePaycode = data.EmpReference.NavBaseTimePaycode.results;
			var aNavAdditiveDetail = data.EmpReference.NavAdditiveDetail.results;
			for(var i = 0; i<aNavBaseTimePaycode.length; i++){
				//Createing EPOC Duration for Time Picker
				var durationSec = DateAndTimeConversion.convertHHmmToMilliSec(aNavBaseTimePaycode[i].Hours+aNavBaseTimePaycode[i].Minutes);
				var Duration = DateAndTimeConversion.displayValueDate(durationSec);
				aNavBaseTimePaycode[i].Duration = Duration;
				//Creating StartTime and End Time EPOC Formats
				aNavBaseTimePaycode[i].StEPOC = DateAndTimeConversion.displayValueDate(aNavBaseTimePaycode[i].StartTime.ms);
				aNavBaseTimePaycode[i].EtEPOC = DateAndTimeConversion.displayValueDate(aNavBaseTimePaycode[i].StartTime.ms+durationSec);
				
			};
			

		},

		handleTimeChange: function(oEvent){			
			var sPath = oEvent.getSource().getBindingContext().sPath;
			var oNavBaseTimeTable = this.getView().byId("tne.pcEmp.tbl_pcEmp_Time");
			var nDurationHrs = oNavBaseTimeTable.getModel().getProperty(sPath+"/Duration").getHours();
			nDurationHrs = String(nDurationHrs);
			if (nDurationHrs.length == 1) {
				nDurationHrs = "0" + nDurationHrs;
			}
			oNavBaseTimeTable.getModel().setProperty(sPath+"/Hours",nDurationHrs);	
			var nDurationMins = oNavBaseTimeTable.getModel().getProperty(sPath+"/Duration").getMinutes();
			nDurationMins = String(nDurationMins);
			if (nDurationMins.length == 1) {
				nDurationMins = "0" + nDurationMins;
			}
			oNavBaseTimeTable.getModel().setProperty(sPath+"/Minutes",nDurationMins);			
			var nStEPOCHrs = oNavBaseTimeTable.getModel().getProperty(sPath+"/StEPOC").getHours();
			nStEPOCHrs = String(nStEPOCHrs);
			if (nStEPOCHrs.length == 1) {
				nStEPOCHrs = "0" + nStEPOCHrs;
			}
			var nStEPOCMins = oNavBaseTimeTable.getModel().getProperty(sPath+"/StEPOC").getMinutes();
			nStEPOCMins = String(nStEPOCMins);
			if (nStEPOCMins.toString().length == 1) {
				nStEPOCMins = "0" + nStEPOCMins;
			}
			
			oNavBaseTimeTable.getModel().setProperty(sPath+"/StartTime/ms",DateAndTimeConversion.convertHHmmToMilliSec(nStEPOCHrs+nStEPOCMins));	
			var nEtEPOC = new Date(DateAndTimeConversion.displayValueDate(DateAndTimeConversion.convertHHmmToMilliSec(nDurationHrs+nDurationMins)+DateAndTimeConversion.convertHHmmToMilliSec(nStEPOCHrs+nStEPOCMins)));
			oNavBaseTimeTable.getModel().setProperty(sPath+"/EtEPOC",nEtEPOC);	
			//updating EndDate
			var startDate = oNavBaseTimeTable.getModel().getProperty(sPath+"/StartDate");
//			var nEndDate = DateAndTimeConversion.displayValueDate(oNavBaseTimeTable.getModel().getProperty(sPath+"/StartDate").getTime()+ nEtEPOC.getTime());			
			var nEndDate = DateAndTimeConversion.displayValueDate(DateAndTimeConversion.saveValueDateInMilliSec(startDate)+DateAndTimeConversion.saveValueDateInMilliSec(nEtEPOC));
			oNavBaseTimeTable.getModel().setProperty(sPath+"/EndDate",nEndDate);
			oNavBaseTimeTable.getModel().refresh()   //model refresh
		},
		/**
		 * Dialog box to for Add BaseTime Paycode		 
		 */
		_getDialog: function (oEvent) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("tne.pcEmp.fragAddBaseTime", "com.bnsf.eam.tne.fragments.AddBaseTimePaycode", this);				
				sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime", "tne.pcEmp.frag.myPcType").setModel(new sap.ui.model.json.JSONModel(this.getModel().getProperty("/selGang/valueHelp/PCType")));
				this.getView().addDependent(this._oDialog);
			};
			return this._oDialog;
		},

		/**
		 * called when user clicks on Add New button from Time table header
		 * @private
		 * @memberOf tne.pcEmp
		 * @returns null
		 */
		addPaycodeDialogOpen : function () {
			this._getDialog().open();
		},
		/**
		 * called when user clicks on Save button from addPaycodeDetails dialog
		 * creates a structure for New Basetime and do the all validations 
		 * pushes the new Paycode details to the default model
		 * @private
		 * @memberOf tne.pcEmp
		 * @returns null
		 */
		addPaycodeDetails :function(){
			var that = this;
			var oUiModel = this.getModel();
			var BindingContext = this.getView().getBindingContext();
			var sPath = BindingContext.sPath;

			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();

			var paycodetype = sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.myPcType").getSelectedKey();			

			if (paycodetype ==undefined || paycodetype ==""){
				sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.myPcType").setValueState(sap.ui.core.ValueState.Error);
			}else{
				sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.myPcType").setValueState(sap.ui.core.ValueState.None);

			}
			var paycodeTypeRef = com.bnsf.eam.tne.util.FetchValueHelps.getPCType(paycodetype);

			var paycode = sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.myPaycode").getSelectedKey();	
			if (paycode ==undefined || paycode ==""){
				sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.myPaycode").setValueState(sap.ui.core.ValueState.Error);

			}else{
				sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.myPaycode").setValueState(sap.ui.core.ValueState.None);

			}
			var paycodeRef = com.bnsf.eam.tne.util.FetchValueHelps.getPaycode(paycodetype, paycode);

			var ovReason = sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.myOtRescode").getSelectedKey();
			if(paycodetype=="OV" && (ovReason == undefined || ovReason == "")){

				sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.myOtRescode").setValueState(sap.ui.core.ValueState.Error);
			}else{
				sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.myOtRescode").setValueState(sap.ui.core.ValueState.None);
			}
			var ovReasonRef = com.bnsf.eam.tne.util.FetchValueHelps.getOVReason(ovReason);

			//ToDo: Need to check in the util so it wont throw error
			var vStartTime = sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.stTime").getDateValue();
			if(vStartTime == null || startTime == ""){
				sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.stTime").setValueState(sap.ui.core.ValueState.Error);
			}else{
				sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.stTime").setValueState(sap.ui.core.ValueState.None);
				var startTime = com.bnsf.eam.tne.util.DateAndTimeConversion.convertLocalDateToMilliSec(vStartTime);
			}
			var Duration = sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.Duration").getDateValue();

			if(Duration == null || Duration == ""){

				sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.Duration").setValueState(sap.ui.core.ValueState.Error,"Manditory Field");
			}else{
				sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.Duration").setValueState(sap.ui.core.ValueState.None);
			}
			var hrs = Duration.getHours();
			hrs = String(hrs);
			if (hrs.length == 1) {
				hrs = "0" + hrs;
			}
			var mins = Duration.getMinutes();
			mins = String(mins);
			if (mins.length == 1) {
				mins = "0" + mins;
			}

			var sHrs = vStartTime.getHours();
			sHrs = String(sHrs);
			if (sHrs.length == 1) {
				sHrs = "0" + sHrs;
			}
			var sMins = vStartTime.getMinutes();
			sMins = String(sMins);
			if (sMins.length == 1) {
				sMins = "0" + sMins;
			}
			var DurationMillSec = DateAndTimeConversion.convertHHmmToMilliSec(hrs+mins);
			var StTimeMillSec = DateAndTimeConversion.convertHHmmToMilliSec(sHrs+sMins);
			var vEtEPOC = DateAndTimeConversion.displayValueDate(DurationMillSec+StTimeMillSec);
			var empId = this.getModel().getProperty(sPath).EmpReference.EmpId;
			var gangId = this.getModel().getProperty(sPath).EmpReference.GangId;	
			var startDate = this.getModel().getProperty(sPath).EmpReference.StartDate;			
			var workDate = this.getModel().getProperty(sPath).EmpReference.WorkDate;
			//Updating End Date 
			var endDate = DateAndTimeConversion.displayValueDate(DateAndTimeConversion.saveValueDateInMilliSec(startDate)+DateAndTimeConversion.saveValueDateInMilliSec(vEtEPOC));

			if(paycode ==undefined || paycodetype =="" ||paycodetype ==undefined || paycodetype ==""
				|| startTime == undefined || startTime == "" ||Duration == undefined || Duration == ""){

				sap.m.MessageBox.show(
						bundle.getText("tne.app.ManditoryFieldsMsgBody"),{
							icon: sap.m.MessageBox.Icon.WARNING,
							title: bundle.getText("tne.app.ManditoryFieldsMsgTitle"),
							actions: [sap.m.MessageBox.Action.OK ],
							onClose: function(oAction) { 
								return;
							}
						}
				);
			}
			//create blank new Object for Base time paycode

			var oNewBaseTime = {
					ActionFlag: "C",
					DateRef: oUiModel.getProperty("/selGang/valueHelp/DateRef"),
					Duration: Duration,
					EditAllowed: "X",
					EmpId: empId,
					EndDate: endDate,
					EtEPOC: vEtEPOC,
					GangId: gangId,
					Hours: hrs,
					Minutes: mins,
					OTReasonCode: ovReason,
					OVReasonRef: ovReasonRef,
					OverlapAllowed: "",
					Paycode: paycode,
					PaycodeRef: paycodeRef,
					PaycodeType: paycodetype,
					PaycodeTypeRef: paycodeTypeRef,
					StEPOC: vStartTime,
					StartDate: startDate,
					StartTime: {__edmType: "Edm.Time", ms:startTime},
					WorkDate: workDate
			};

			this._getDialog().close();

			var sWarningBody = "";
			var bValidationError = false;

			//validate Total Base time
			var oValidateTotalBT = this._validateTotalBaseTime(oNewBaseTime);

			if(!oValidateTotalBT.bEquals){
				bValidationError = true;
				var oOriginalDuration = com.bnsf.eam.tne.util.DateAndTimeConversion.convertMilliSecToHHmm(oValidateTotalBT.OriginalDuration.getTime());
				var oNewDuration = com.bnsf.eam.tne.util.DateAndTimeConversion.convertMilliSecToHHmm(oValidateTotalBT.NewDuration.getTime());

				//Add appropriate message for warning
				if(oValidateTotalBT.NewDurationGreater)
					sWarningBody = bundle.getText("tne.pcEmp.msg.BaseTimeDurationGreater", [oOriginalDuration, oNewDuration])
					+ "\n\n";
				else
					sWarningBody = bundle.getText("tne.pcEmp.msg.BaseTimeDurationLesser", [oOriginalDuration, oNewDuration])
					+ "\n\n";
			};

			//validate Start time matches
			var oValidateStartTime = this._validateStartTimeOfBaseTime(oNewBaseTime)

			if(!oValidateStartTime.bStartTimeEquals){
				bValidationError = true;
				var oOriginalStartTime = com.bnsf.eam.tne.util.DateAndTimeConversion.convertMilliSecToHHmm(oValidateStartTime.OriginalStartTime);
				var oNewStartTime = com.bnsf.eam.tne.util.DateAndTimeConversion.convertMilliSecToHHmm(oValidateStartTime.NewStartTime);

				//Add appropriate message for warning
				sWarningBody = sWarningBody +
				bundle.getText("tne.pcEmp.msg.StartTimeOfBaseTime", [oOriginalStartTime, oNewStartTime])
				+ "\n\n";			
			};


			if(bValidationError){
				sWarningBody = sWarningBody  +
				bundle.getText("tne.pcEmp.msg.AddingPayCodeTimeValidation");
				sap.m.MessageBox.show(
						sWarningBody, {
							icon: sap.m.MessageBox.Icon.WARNING,
							title: bundle.getText("tne.app.Warning"),
							actions: [sap.m.MessageBox.Action.NO, sap.m.MessageBox.Action.YES],
							onClose: function(oAction) { 
								if(oAction=="YES"){				
									that.getModel().getProperty(sPath).EmpReference.NavBaseTimePaycode.results.push(oNewBaseTime);
									that.getModel().getProperty(sPath).Total = oValidateTotalBT.NewDuration;
									that.getModel().refresh();
								};
							}
						}
				);
			}else{
				that.getModel().getProperty(sPath).EmpReference.NavBaseTimePaycode.results.push(oNewBaseTime);
				that.getModel().getProperty(sPath).Total = oValidateTotalBT.NewDuration;
				that.getModel().refresh();
			};
		},
		/**
		 * called when user clicks on Delete button from Time Table row		
		 * Deletes the paycode from the default Model
		 * @private
		 * @memberOf tne.pcEmp
		 * @returns null
		 */
		handleDeleteBaseTime: function(oEvent){
			//this._deleteBaseTime(oEvent)
			var sPath = oEvent.getSource().getBindingContext().sPath;
			var oNavBaseTimeTable = this.getView().byId("tne.pcEmp.tbl_pcEmp_Time");
			var actionFlag = oNavBaseTimeTable.getModel().getProperty(sPath+"/ActionFlag")

			if(actionFlag == "C" ){
				if (oEvent.getSource().getParent().getParent().getItems().length > 0) {
					var item = oEvent.getSource().getParent();
					var index = oEvent.getSource().getParent().getParent().indexOfItem(item);            
					var strlen = sPath.length-2;
					var newPath = sPath.substr(0, strlen);	                        
					var navBaseTimeArray = oNavBaseTimeTable.getModel().getProperty(newPath);	                      
					navBaseTimeArray.splice(index, 1);	//splice the row data,which removes data from model	                        			
				}				

			}else if(actionFlag == "" || actionFlag == "D"){
				this.getModel().setProperty(sPath+"/ActionFlag","D");
			};

			oNavBaseTimeTable.getModel().refresh()   //model refresh
		},

		/**
		 * validations for Total Basetime
		 * @param oNewPaycode
		 * @returns object 
		 */

		_validateTotalBaseTime: function(oNewPaycode){

			var sPath = this.getView().getBindingContext().sPath;

			var oTotalDurCurrent = this.getModel().getProperty(sPath).Total;
			var oTotalDurInitial = this._dataBeforeShow.Total;

			if(oNewPaycode != undefined || oNewPaycode != null){
				var oNewPCDuration = new Date(Date.UTC(1970, 0, 1, oNewPaycode.Hours,
						oNewPaycode.Minutes));
				//add time from new paycode to existing paycodes
				oTotalDurCurrent = new Date(oTotalDurCurrent.getTime() + oNewPCDuration.getTime());
			};

			var oReturn = {
					OriginalDuration: oTotalDurInitial,
					NewDuration: oTotalDurCurrent,
					NewDurationGreater: false,
					bEquals: false
			};

			if (oTotalDurCurrent.getTime() > oTotalDurInitial.getTime()){
				oReturn.bEquals = false;
				oReturn.NewDurationGreater = true;
			}else if(oTotalDurCurrent.getTime() == oTotalDurInitial.getTime())
				oReturn.bEquals = true;
			else{
				oReturn.bEquals = false;
			};

			return oReturn;
		},

		/**
		 * Validations for Newly added basetme paycode start time
		 * @param oNewPaycode
		 * @returns object
		 */
		_validateStartTimeOfBaseTime: function(oNewPaycode){// Validation for calculating earliest start time

			var sPath = this.getView().getBindingContext().sPath;

			var aBaseTimeCurrent = this.getModel().getProperty(sPath).EmpReference.NavBaseTimePaycode.results;
			var aBaseTimeInitial = this._dataBeforeShow.EmpReference.NavBaseTimePaycode.results;

			//get earliest start time for original records
			var oEarliestStartOrignl = aBaseTimeInitial[0].StartTime.ms;
			for(var i = 0; i < aBaseTimeInitial.length; i++){	
				if (oEarliestStartOrignl <= aBaseTimeInitial[i].StartTime.ms){
					oEarliestStartOrignl = oEarliestStartOrignl;
				}else{
					oEarliestStartOrignl = aBaseTimeInitial[i].StartTime.ms;
				};
			};

			//get earliest start time for current records
			var oEarliestStartCurr = aBaseTimeCurrent[0].StartTime.ms;
			for(var i = 0; i < aBaseTimeCurrent.length; i++){	
				if (oEarliestStartCurr <= aBaseTimeCurrent[i].StartTime.ms){
					oEarliestStartCurr = oEarliestStartCurr;
				}else{
					oEarliestStartCurr = aBaseTimeCurrent[i].StartTime.ms;
				};
			};

			//if new Paycode is being evaluated, check for earliest start time in the new Paycode object as well
			if(oNewPaycode != undefined && oEarliestStartCurr > oNewPaycode.StartTime.ms){
				oEarliestStartCurr = oNewPaycode.StartTime.ms;
			};

			var oReturn = {
					OriginalStartTime: oEarliestStartOrignl,
					NewStartTime: oEarliestStartCurr,
					NewStartTimeLesser: false,
					bStartTimeEquals: false
			};

			//compare and return
			if(oEarliestStartCurr < oEarliestStartOrignl){
				oReturn.NewStartTimeLesser = true;
				oReturn.bStartTimeEquals = false;
			}else if(oEarliestStartCurr = oEarliestStartOrignl){
				oReturn.bStartTimeEquals = true;
				oReturn.NewStartTimeLesser = false;
			}else{
				oReturn.bStartTimeEquals = false;
			};

			return oReturn;
		},

		_closePaycodeDialog : function () {
			this._getDialog().close();
		},

		/**
		 * called when user changes paycode type from addpaycode dialogbox 
		 * @param myPaycodeType
		 * @returns null
		 */
		onChangeBasePaycodeType: function(myPaycodeType){
			var selectedGangTitle = this.getModel().getProperty("/selGang/id");		
			var userID = this.getModel().getProperty('/user/id');
			var selectedDateTime = this.getModel().getProperty("/selGang/workDate");
			selectedDateTime = new Date(selectedDateTime);  

			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);

			var oValueHelpModel = sap.ui.getCore().getModel("oValueHelpModel");

			var myPaycodeType = sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.myPcType").getSelectedKey();

			if(myPaycodeType !== "OV"){
				sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.lbl.otRsnCode").setVisible(false);
				sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.myOtRescode").setVisible(false);
				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'PAYCODE' and ScreenIndicator eq 'PAYCODES'and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"' and ImportParam1 eq '"+myPaycodeType+"' and UserID eq '" + userID  + "'",
						null,{}, false,
						function(oData, oResponse){						
							sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.myPaycode").setModel(new sap.ui.model.json.JSONModel(oData.results));
						}
				);			
			}else{
				sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.lbl.otRsnCode").setVisible(true);
				sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.myOtRescode").setVisible(true);
				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'PAYCODE' and ScreenIndicator eq 'PAYCODES'and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"' and ImportParam1 eq '"+myPaycodeType+"' and UserID eq '" + userID  + "'",
						null,{}, false,
						function(oData, oResponse){						
							sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.myPaycode").setModel(new sap.ui.model.json.JSONModel(oData.results));
						}
				);

				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'OTRCODE' and ScreenIndicator eq 'OVERTIME'" +
						"and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"' " +
						"and UserID eq '" + userID  + "'",
						null,{}, false,
						function(oData, oResponse){						
							sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.frag.myOtRescode").setModel(new sap.ui.model.json.JSONModel(oData.results));
						}

				);


			}


		},

		/**
		 * Dialog for openPaycodepopUp
		 * @param oEvent
		 * @returns null
		 */
		_getDialogPaycode: function (oEvent) {
			if (!this._oDialogPaycode) {	
				var selectedGangTitle = this.getModel().getProperty("/selGang/id");		
				var userID = this.getModel().getProperty('/user/id');
				var selectedDateTime = this.getModel().getProperty("/selGang/workDate");
				selectedDateTime = new Date(selectedDateTime);  

				var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
					style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
				}).format(selectedDateTime);

				var PCtype = oEvent.PaycodeType;
				var oValueHelpModel = sap.ui.getCore().getModel("oValueHelpModel");
				this._oDialogPaycode = sap.ui.xmlfragment("tne.pcEmp.fragChangeBaseTime","com.bnsf.eam.tne.fragments.ChangeBaseTimePaycode", this);			
				sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frg.PaycodeType").setModel(new sap.ui.model.json.JSONModel(this.getModel().getProperty("/selGang/valueHelp/PCType")));

				if(PCtype !== "OV"){
					sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.lbl.otRsnCode").setVisible(false);
					sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frag.OTRescode").setVisible(false);
					oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'PAYCODE' and " +
							"ScreenIndicator eq 'PAYCODES'and GangId eq '"+selectedGangTitle+"' and " +
							"WorkDate eq datetime'"+vDate+"' and ImportParam1 eq '"+PCtype+"' and " +
							"UserID eq '" + userID  + "'",
							null,{}, false,
							function(oData, oResponse){						
								sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frg.Paycodes").setModel(new sap.ui.model.json.JSONModel(oData.results));
							}
					);			
				}else{
					sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.lbl.otRsnCode").setVisible(true);
					sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frag.OTRescode").setVisible(true);
					oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'PAYCODE' and " +
							"ScreenIndicator eq 'PAYCODES'and GangId eq '"+selectedGangTitle+"' and " +
							"WorkDate eq datetime'"+vDate+"' and ImportParam1 eq '"+PCtype+"' and " +
							"UserID eq '" + userID  + "'",
							null,{}, false,
							function(oData, oResponse){						
								sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frg.Paycodes").setModel(new sap.ui.model.json.JSONModel(oData.results));
							}
					);

					oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'OTRCODE' and ScreenIndicator eq 'OVERTIME'" +
							"and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"' " +
							"and UserID eq '" + userID  + "'",
							null,{}, false,
							function(oData, oResponse){						
								sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frag.OTRescode").setModel(new sap.ui.model.json.JSONModel(oData.results));
								sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frag.OTRescode").setSelectedKey(oEvent.OTReasonCode);
							}

					);
				}
				sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frg.PaycodeType").setSelectedKey(oEvent.PaycodeType);
				sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frg.Paycodes").setSelectedKey(oEvent.Paycode);
				this.getView().addDependent(this._oDialogPaycode);
			};
			return this._oDialogPaycode;
		},
		/**
		 * On click of value help from Time table row
		 * @private
		 * @memberOf tne.pcEmp
		 * @returns null
		 */
		onOpenChangeBaseTimePaycodePopUp: function(oEvent){	
			this.SelectedKeys = undefined;
			var BindingContext = oEvent.getSource().getParent().getBindingContext();
			var sPath = BindingContext.sPath;
//			var SelectedKeys = jQuery.extend(true, {}, this.getModel().getProperty(sPath));
			this.SelectedKeys = this.getModel().getProperty(sPath);

			this._getDialogPaycode(this.SelectedKeys).open();
		},

		handlecloseChangePaycodesDialog: function(){
			this._getDialogPaycode().close();			
		},
		handleSaveChangePaycodesDetails: function(){
			var isManditoryField = false;
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			//New Pay code Type
			var newPaycodeType = sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frg.PaycodeType").getSelectedKey();
			if (newPaycodeType ==undefined || newPaycodeType ==""){
				sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frg.PaycodeType").setValueState(sap.ui.core.ValueState.Error);
				isManditoryField = true;
			}else{
				sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frg.PaycodeType").setValueState(sap.ui.core.ValueState.None);

			}
			var paycodeTypeRef = FetchValueHelp.getPCType(newPaycodeType);
			this.SelectedKeys.PaycodeType = newPaycodeType;	
			this.SelectedKeys.PaycodeTypeRef = paycodeTypeRef;
			// New Paycodeselected
			var newPaycode = sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frg.Paycodes").getSelectedKey();
			if (newPaycode ==undefined || newPaycode ==""){
				sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frg.Paycodes").setValueState(sap.ui.core.ValueState.Error);
				isManditoryField = true;
			}else{
				sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frg.Paycodes").setValueState(sap.ui.core.ValueState.None);

			}
			var paycodeRef = FetchValueHelp.getPaycode(newPaycodeType, newPaycode);
			this.SelectedKeys.Paycode = newPaycode;
			this.SelectedKeys.PaycodeRef = paycodeRef;
			//New OverTime Reason Selected when Paycode Type is OV
			if(newPaycodeType == "OV" ){				
				var newOTreason = sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frag.OTRescode").getSelectedKey();
				if(newOTreason == undefined || newOTreason == ""){
					sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frag.OTRescode").setValueState(sap.ui.core.ValueState.Error);
					isManditoryField = true;
				}else{
					sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frag.OTRescode").setValueState(sap.ui.core.ValueState.None);
				}
				var ovReasonRef = FetchValueHelp.getOVReason(newOTreason);
				this.SelectedKeys.OTReasonCode = newOTreason;
				this.SelectedKeys.OVReasonRef = ovReasonRef;
			}else{
				this.SelectedKeys.OTReasonCode = "";
				this.SelectedKeys.OVReasonRef = undefined;
			}


			if(isManditoryField){
				sap.m.MessageBox.show(
						bundle.getText("tne.app.ManditoryFieldsMsgBody"),{
							icon: sap.m.MessageBox.Icon.WARNING,
							title: bundle.getText("tne.app.ManditoryFieldsMsgTitle"),
							actions: [sap.m.MessageBox.Action.OK ],
							onClose: function(oAction) { 
								return;
							}
						}
				);
			}else{
				this.getModel().refresh();
				this._getDialogPaycode().close();
			}


		},

		/**
		 * on changing the Paycode type from paycode details dialog 
		 * changes the binding to the paycodes dropdown
		 * @private
		 * @memberOf tne.pcEmp
		 * @returns null
		 */
		onChangePaycodeType: function(){
			var selectedGangTitle = this.getModel().getProperty("/selGang/id");		
			var userID = this.getModel().getProperty('/user/id');
			var selectedDateTime = this.getModel().getProperty("/selGang/workDate");
			selectedDateTime = new Date(selectedDateTime);  

			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);

			var oValueHelpModel = sap.ui.getCore().getModel("oValueHelpModel");

			var PCtype = sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frg.PaycodeType").getSelectedKey();
			sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frg.Paycodes").setSelectedKey();

			if(PCtype !== "OV"){
				sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.lbl.otRsnCode").setVisible(false);
				sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frag.OTRescode").setVisible(false);
				sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frag.OTRescode").setSelectedKey();
				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'PAYCODE' and " +
						"ScreenIndicator eq 'PAYCODES'and GangId eq '"+selectedGangTitle+"' and " +
						"WorkDate eq datetime'"+vDate+"' and ImportParam1 eq '"+PCtype+"' and " +
						"UserID eq '" + userID  + "'",
						null,{}, false,
						function(oData, oResponse){						
							sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frg.Paycodes").setModel(new sap.ui.model.json.JSONModel(oData.results));
						}
				);			
			}else{
				sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.lbl.otRsnCode").setVisible(true);
				sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frag.OTRescode").setVisible(true);
				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'PAYCODE' and " +
						"ScreenIndicator eq 'PAYCODES'and GangId eq '"+selectedGangTitle+"' and " +
						"WorkDate eq datetime'"+vDate+"' and ImportParam1 eq '"+PCtype+"' and " +
						"UserID eq '" + userID  + "'",
						null,{}, false,
						function(oData, oResponse){						
							sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frg.Paycodes").setModel(new sap.ui.model.json.JSONModel(oData.results));
						}
				);

				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'OTRCODE' and ScreenIndicator eq 'OVERTIME'" +
						"and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"' " +
						"and UserID eq '" + userID  + "'",
						null,{}, false,
						function(oData, oResponse){						
							sap.ui.core.Fragment.byId("tne.pcEmp.fragChangeBaseTime","tne.pcEmp.frag.OTRescode").setModel(new sap.ui.model.json.JSONModel(oData.results));
						}

				);


			}
		},
		/**
		 * called when clicking on a row from Expense table 
		 * Create and set ExpenseDetails model 
		 * Navigates to PcViewExp page
		 * @private
		 * @memberOf tne.pcEmp
		 * @returns null
		 */
		handleLineItemPress: function(oEvent){			
			var oBindingContext = oEvent.getSource().getBindingContext();
			var sPath = oBindingContext.sPath;	

			var sGangId = this.getModel().getProperty("/selGang/id");	
			var oSelectedDate = this.getModel().getProperty("/selGang/workDate");
			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(oSelectedDate);

			var start = sPath.lastIndexOf("/") + 1;			
			var indexPath = sPath.substring(start, sPath.length);

			//copy expense details to new Model bound to the Exp Details page.
			var oExpenseDetails = jQuery.extend(true, {}, this.getModel().getProperty(sPath));
			//Createing EPOC Duration for Time Picker	
			var Duration = DateAndTimeConversion.displayValueDate(DateAndTimeConversion.convertHHmmToMilliSec(oExpenseDetails.Hours+oExpenseDetails.Mins))
			oExpenseDetails.Duration = Duration;
			//Creating StartTime and End Time EPOC Formats
			oExpenseDetails.StEPOC = DateAndTimeConversion.displayValueDate(oExpenseDetails.StartTime.ms);
			oExpenseDetails.EtEPOC = DateAndTimeConversion.displayValueDate(oExpenseDetails.EndTime.ms);
			//creating Expense JSON Model 
			var oExpenseDetailsModel = new JSONModel(oExpenseDetails);
			var EmpIndexRef = this._EmpRef;
			//set expense model
			sap.ui.getCore().setModel(oExpenseDetailsModel, "oExpenseDetailsModel");

			this.getRouter().navTo('PCViewExp',{GangId: sGangId, WorkDate: sFormattedDate, EmpID: EmpIndexRef, ExpPC: indexPath}, false);



		},

		/**
		 * called when clicking on a Add New button from Expense table 
		 * Create and set empty ExpenseDetails model  
		 * Navigates to PcViewExp page
		 * @private
		 * @memberOf tne.pcEmp
		 * @returns null
		 */
		handleAddNewExpense: function(){		
			var sGangId = this.getModel().getProperty("/selGang/id");	
			var oSelectedDate = this.getModel().getProperty("/selGang/workDate");
			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(oSelectedDate);	
			var EmpIndexRef = this._EmpRef;
			var sPath = "/selGang/pcTreeDisplay/categories/"+EmpIndexRef+"/EmpReference/EmpId"
			var sEmpID = this.getModel().getProperty(sPath);			
			//create default model for new expense
			var oExpenseDetailsModel = models.createPCExpenseModel(sGangId, oSelectedDate, sEmpID);
			//set expense model
			sap.ui.getCore().setModel(oExpenseDetailsModel, "oExpenseDetailsModel");			
			this.getRouter().navTo('PCViewExp',{GangId: sGangId, WorkDate: sFormattedDate, EmpID: EmpIndexRef, ExpPC: "addExpense"}, false);
		},

		/**
		 * called when clicking back button from page header 		 
		 * Navigates to Paycode screen
		 * @private
		 * @memberOf tne.pcEmp
		 * @returns null
		 */
		onBack : function() {
			this._handlePageExit(this.onNavBack);			
		},

		/**
		 * Page exit method to validate componets and display error messages
		 * @param mCallback
		 * @private
		 * @memberOf tne.pcEmp
		 * @returns null
		 */

		_handlePageExit:function(mCallback){
			//compare current screen state vs before load
			var oCall = function(){};
			var that = this;
			var validationRef = that._compareObjectState();
			var context = this.getView().getBindingContext();
			var oCurrentObject = this.getModel().getProperty(context.sPath);
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			if (validationRef == false){
				//Show warning message message with text "Unsaved changes, Do you want to Exit?" YES and NO. 
				//On NO stay on screen 
				//On YES replace the Object in default pointing to context.sPath with this._dataBeforeShow
				//set this._dataBeforeShow = null and execute call back function.
				sap.m.MessageBox.show(
						bundle.getText("tne.app.UnsavedDataMsgBody"),{
							icon: sap.m.MessageBox.Icon.WARNING,
							title: bundle.getText("tne.app.UnsavedDataMsgTitle"),
							actions: [sap.m.MessageBox.Action.NO, sap.m.MessageBox.Action.YES],
							onClose: function(oAction) { 
								if(oAction=="YES"){									
									oCurrentObject = that._dataBeforeShow;
									that._dataBeforeShow = undefined; //TODO: Check if this is valid, will it invalidate the oCurrent Object as well?
									oCall = mCallback(); //calling callback
								}else{
									return; 								
								};
							}
						}
				);				  
			}else{
				this._dataBeforeShow = undefined;
				oCall = mCallback(); //calling callback
			};	
		},

		/**
		 * Methos to compare page objects on navigating to previous screen
		 * @returns {Boolean}
		 */
		_compareObjectState: function(){
			var context = this.getView().getBindingContext();
			var oCurrentObject = this.getModel().getProperty(context.sPath);

			var oOriginalObject = this._dataBeforeShow;

			if(oOriginalObject.Total != oCurrentObject.Total)
				return false;

			if(oOriginalObject.EmpReference.NavBaseTimePaycode.results.length  != oCurrentObject.EmpReference.NavBaseTimePaycode.results.length)
				return false;

			if(oOriginalObject.EmpReference.NavAdditiveDetail.results.length  != oCurrentObject.EmpReference.NavAdditiveDetail.results.length)
				return false;

			var oOriginalBaseTime = oOriginalObject.EmpReference.NavBaseTimePaycode.results;
			var oCurrentBaseTime = oCurrentObject.EmpReference.NavBaseTimePaycode.results;

			for(var i = 0; i <oOriginalBaseTime.length; i++){
				if(oOriginalBaseTime[i].Paycode != oCurrentBaseTime[i].Paycode)
					return false;
				if(oOriginalBaseTime[i].Hours != oCurrentBaseTime[i].Hours)
					return false;
				if(oOriginalBaseTime[i].Minutes != oCurrentBaseTime[i].Minutes)
					return false;
				if(oOriginalBaseTime[i].StartTime.ms != oCurrentBaseTime[i].StartTime.ms)
					return false;
				if(oOriginalBaseTime[i].OTReasonCode != oCurrentBaseTime[i].OTReasonCode)
					return false;
			};

			var oOriginalAdditives = oOriginalObject.EmpReference.NavAdditiveDetail.results;
			var oCurrentAdditives = oCurrentObject.EmpReference.NavAdditiveDetail.results;

			for (var j = 0; j < oOriginalAdditives.length; j++ ){
				if(oOriginalAdditives[j].Paycode != oCurrentAdditives[j].Paycode)
					return false;
				if(oOriginalAdditives[j].Hours != oCurrentAdditives[j].Hours)
					return false;
				if(oOriginalAdditives[j].Minutes != oCurrentAdditives[j].Minutes)
					return false;
				if(oOriginalAdditives[j].Miles != oCurrentAdditives[j].Miles)
					return false;
			};
		},

		/**
		 * Calls when clicking on Save button from footer of the page 
		 * validates the data in the pageand shows error message if validation fails
		 */
		handlePCEmployeeSave: function(){
			this._paycodeEmpValidations();
		},

		/**
		 * validations for pcEmployee page save
		 */

		_paycodeEmpValidations: function(){			
			//validation start - Total duration equals to Original duration
			var oNewBaseTime = undefined;
			var oValidateTotalBT = this._validateTotalBaseTime(oNewBaseTime);

			if(!oValidateTotalBT.bEquals){
				//MessageBox.alert("Base time Total not equal to original,Do you want to proceed and adjust later? ");
				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
				var oOriginalDuration = com.bnsf.eam.tne.util.DateAndTimeConversion.convertMilliSecToHHmm(oValidateTotalBT.OriginalDuration.getTime());
				var oNewDuration = com.bnsf.eam.tne.util.DateAndTimeConversion.convertMilliSecToHHmm(oValidateTotalBT.NewDuration.getTime());

				var sWarningBody = "";
				var isValidationError = false
				if(oValidateTotalBT.NewDurationGreater)
					sWarningBody = bundle.getText("tne.pcEmp.msg.BaseTimeDurationGreater", [oOriginalDuration, oNewDuration]) + "\n\n" +
					bundle.getText("tne.pcEmp.msg.OnSaveTotalDurationMismatch");
				else
					isValidationError = true
					sWarningBody = bundle.getText("tne.pcEmp.msg.BaseTimeDurationLesser", [oOriginalDuration, oNewDuration]) + "\n\n" ;

			};


			//validation start - earliest start time •	Earliest start time of Base time entries should be 
			//equal to earliest start time of entries on load 
			var ovalidateStartTime = this._validateStartTimeOfBaseTime(oNewBaseTime);
			if(!ovalidateStartTime.bStartTimeEquals) {
				var oOriginalStartTime = com.bnsf.eam.tne.util.DateAndTimeConversion.convertMilliSecToHHmm(ovalidateStartTime.OriginalStartTime);
				var oNewStartTime = com.bnsf.eam.tne.util.DateAndTimeConversion.convertMilliSecToHHmm(ovalidateStartTime.NewStartTime);
				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();			
				isValidationError = true
				sWarningBody = sWarningBody + bundle.getText("tne.pcEmp.msg.StartTimeOfBaseTime", [oOriginalStartTime, oNewStartTime]) + "\n\n" +
				bundle.getText("tne.pcEmp.msg.OnSavePCEmpStartTimeMismatch");				

			};

			if(isValidationError){

				sap.m.MessageBox.show(
						sWarningBody, {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: bundle.getText("tne.app.Error"),
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function(oAction) { 
								return;
							}
						}
				);

			}else{
				//if no validations hit nav back
				this.onNavBack();	
			}



		},

		/**
		 * Formmatter to get end time 
		 * @param StartTime
		 * @param Hours
		 * @param Minutes
		 * @returns {Date}
		 */
		calEndDate: function(StartTime, Hours, Minutes){
			var hours = com.bnsf.eam.tne.util.DateAndTimeConversion.convertHHmmToMilliSec(Hours + Minutes);
			//var minutes = com.bnsf.eam.tne.util.DateAndTimeConversion.convertHHmmToMilliSec(Minutes);			
			var endTime = com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(StartTime+hours);
			return new Date(endTime);
		},

		/**
		 * Formatter to calculate ExpenseTime
		 * @param Hours
		 * @param Mins
		 * @returns {Date}
		 */
		calExpTime: function(Hours, Mins){
			var hours = com.bnsf.eam.tne.util.DateAndTimeConversion.convertHHmmToMilliSec(Hours+Mins);				
			var ExpTime = com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(hours);
			return ExpTime;
		},

		/**
		 * Formatter for Duration
		 * @param Hours
		 * @param Minutes
		 * @returns {Date}
		 */
		DurationTime: function(Hours,Minutes){
			var hours = com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(com.bnsf.eam.tne.util.DateAndTimeConversion.convertHHmmToMilliSec(Hours+Minutes));
			return hours;
		},
		/**
		 * Formatter for Start time
		 * @param StartTime
		 * @returns {Date}
		 */
		StartTime: function(StartTime){
			var starttime = com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(StartTime);
			return starttime;
		},

		/**
		 * Formatter for Start Date
		 */
		StDate: function(stDate){
			var month = stDate.getMonth();
			var day = stDate.getDay();
			var date = month+"-"+day;
			return date;
		},

		/**
		 * Formatter to enable Overtime reason code dropdown  in the table
		 * @param sCode
		 * @returns {Boolean}
		 */
		formatOTReasonEnabled: function(sCode){
			if(sCode == "" || sCode == undefined){
				//sap.ui.core.Fragment.byId("tne.pcEmp.fragAddBaseTime","tne.pcEmp.OTresCode").setEnabled(false);
				return false;
			}
			else
				return true;
		},
		/**
		 * To change the display rows in base time Table 
		 * @param sActionFlag
		 * @returns {Boolean}
		 */
		baseTimeRowVisibileFormatter: function(sActionFlag){
			if(sActionFlag == "D")
				return false;
			else 
				return true;


		},
		baseTimeRowEditableFormatter: function(sEditAllowed){
			if(sEditAllowed == "X")
				return true;
			else 
				return false;			
		},
		
		baseTimeEndDateFormatter: function(sWorkDate, sStartTime, sDuration){
			
			var oNewEndDate = sWorkDate.setTime(sWorkDate.getTime()+sStartTime.getTime()+sDuration.getTime());
			return oNewEndDate;
			
		}


	});

	return PCEmployeeController;


});