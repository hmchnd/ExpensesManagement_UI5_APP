sap.ui.define([
               'com/bnsf/eam/tne/controller/BaseController',
               'sap/ui/core/Fragment',
               'com/bnsf/eam/tne/util/Validators',
               'sap/m/MessageBox'
               ], function(BaseController, Fragment, Validators,MessageBox) {
	"use strict";

	var LUEmployeeController = BaseController.extend("com.bnsf.eam.tne.controller.LUEmployee", {

		onInit : function (oEvent) {
			var oModel=this.getModel();
			this.getView().setModel(oModel);

			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);
		},

		_onRouteMatched:function(oEvent){
			var sRoute = oEvent.getParameter("name");
			var oArgs= oEvent.getParameter("arguments").EmpID; 
			if(sRoute == "LUEmployee"){ 				
				var context = this.getModel().getContext('/selGang/lineupDisplay/'+oArgs+'');				
				this._dataBeforeShow = jQuery.extend(true, {}, this.getModel().getProperty(context.sPath));				
				this.getView().setBindingContext(context);				
				this.getView().byId("tne.lineup.tbl_lineup").setBindingContext(context);;
			};
		},

		_getDialog: function (oEvent) {

			var oAbsenteeModel = this.getModel("oAbsenteeType");
			if (! this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("myFrag","com.bnsf.eam.tne.fragments.AddAbsentee", this);
				this._oDialog.setModel(oAbsenteeModel);
				sap.ui.core.Fragment.byId("myFrag", "tne.lnupEmp.frag.ErrorLab").setText("");
				this.getView().addDependent(this._oDialog);

			}

			return this._oDialog;
		},
		addAbsenteeDialogOpen : function () {
			this._getDialog().open();
		},
		_closeAbsentDialog : function () {
			this._getDialog().close();
		},
		
		onBack : function() {
			this._handlePageExit(this.onNavBack);			
		},
		
		onSave: function(){
			this._dataBeforeShow = undefined;
			this.onNavBack();
		},
		
		_handlePageExit: function(mCallback){
			//compare current screen state vs before load
			//TODO: Need to compare more attributes of the object later
			var bChanged = true;
			var oCall = function(){};
			var that=this;
			var context = this.getView().getBindingContext();
			var oCurrentObject = this.getModel().getProperty(context.sPath);
			if(this._dataBeforeShow.empReference.NavAbsentees.length  != oCurrentObject.empReference.NavAbsentees.length){
				bChanged = true;
			}else
				bChanged = false;
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			if (bChanged){
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
															oCurrentObject=that._dataBeforeShow;
															that._dataBeforeShow = undefined;
															oCall = mCallback(); //calling callback
														}else{
															return; 								
														};
											}
					}
				);				  
			}else{
				this._dataBeforeShow = undefined;
				oCall = mCallback();  //calling callback
			};			
			
		},
		
		//Add an absentee to the table
		_addAbsenteeDetails:function(){
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			
			//get New absentee attributes
			var Code = sap.ui.core.Fragment.byId("myFrag", "myControl").getSelectedKey();
			var actualstDate = sap.ui.core.Fragment.byId("myFrag", "tne.lnupEmp.frag.stTime").getDateValue();
			var actualEndDate = sap.ui.core.Fragment.byId("myFrag", "tne.lnupEmp.frag.EndTime").getDateValue();
			if((actualstDate!==null && (actualEndDate!==null)) && Code!="")	//Validating dialog box 
				{
			var absenteeStartTime = com.bnsf.eam.tne.util.DateAndTimeConversion.convertLocalDateToMilliSec(actualstDate);
			var absenteeEndTime = com.bnsf.eam.tne.util.DateAndTimeConversion.convertLocalDateToMilliSec(actualEndDate);
			
				}
			else
				{
				
				MessageBox.alert(
						bundle.getText("tne.lineup.err.SelectDate"));
				return;
				}
			//Get new absentee type reference
			var abenteeCode=sap.ui.getCore().getModel("oAbsenteeType").getData().results;
			var oAbReference = undefined;
			var iRefAbCodeIndex = com.bnsf.eam.tne.util.Validators.getAbsenteeByCode(Code);
			iRefAbCodeIndex != -1 ? oAbReference = abenteeCode[iRefAbCodeIndex] : null;
			
			//get selected Emp
			var oSelectedEmp = this.getModel().getProperty(this.getView().getBindingContext().sPath).empReference;
			
			var oNewAbsentee = {
					AbsenteeType: Code,
					Action: "C",
					Deletable:true,
					EmployeeId:oSelectedEmp.EmployeeId,
					EndDate:actualEndDate,
					EndTime:{__edmType: "Edm.Time", ms:absenteeEndTime },
					Extension1:"",
					GangId:oSelectedEmp.GangId,
					SourceSystem:"",
					StartDate:actualstDate,
					StartTime:{__edmType: "Edm.Time", ms:absenteeStartTime },
					WorkDate:oSelectedEmp.WorkDate,
					UserID:oSelectedEmp.UserID,
					AbsentRef:oAbReference,		
			};
			
			sap.ui.core.Fragment.byId("myFrag", "tne.lnupEmp.frag.ErrorLab").setVisible(false);
			sap.ui.core.Fragment.byId("myFrag", "tne.lnupEmp.frag.ErrorLab").setText("");
			
			var oReturn = com.bnsf.eam.tne.util.Validators.verifyAbsenteeOverlap(oSelectedEmp, oNewAbsentee);

			if(oReturn.ValidationResult == "E"){
				var sErrorString = "Error: " + oReturn.Validations[0].Message;
				if(oReturn.Validations.length > 1){
					for(var i = 1; i < oReturn.Validations.length; i++){
						var sThisError = "\n Error: " + oReturn.Validations[i].Message;
						sErrorString = sErrorString  + sThisError;
					};
				};
				sap.ui.core.Fragment.byId("myFrag", "tne.lnupEmp.frag.ErrorLab").setText(sErrorString);
				sap.ui.core.Fragment.byId("myFrag", "tne.lnupEmp.frag.ErrorLab").setVisible(true);
			}else{
				oSelectedEmp.NavAbsentees.push(oNewAbsentee);
				this.getModel().refresh();
				this._closeAbsentDialog();
			};
		},
		
		//delete an absentee from the table on click of trash/delete button
		deleteAbsentee:function(evt)
		{		
			var getPath=evt.getSource().getBindingContext().sPath;
			var oNavAbsenteeTable = this.getView().byId("tne.lineup.tbl_lineup");
			var actionType=oNavAbsenteeTable.getModel().getProperty(getPath+"/Action")
			if(actionType == 'C'){				
				if (evt.getSource().getParent().getParent().getItems().length > 0) {
	                        var item = evt.getSource().getParent();
	                        var index = evt.getSource().getParent().getParent().indexOfItem(item);            
	                        var strlen = getPath.length-2;
	                        var newPath = getPath.substr(0, strlen);	                        
	                        var navAbsenteeArray = oNavAbsenteeTable.getModel().getProperty(newPath);	                      
	                        navAbsenteeArray.splice(index, 1);	//splice the row data,which removes data from model	                        			
				}				 				 				
			}else if(actionType == "" || actionType == "D"){
					oNavAbsenteeTable.getModel().setProperty(getPath+"/Action",'D')
			};
			oNavAbsenteeTable.getModel().refresh()   //model refresh
		},
		
		onEmpStTimeChange: function(oEvent){
			var bundle= sap.ui.getCore().getModel("i18n").getResourceBundle();
			var oStTime = new Date(oEvent.getParameters().value);
			var StartTimeMS = oStTime.getTime();
			
			//get selected Emp
			var oSelectedEmp = this.getModel().getProperty(this.getView().getBindingContext().sPath).empReference;
			
			var oEmpShift = {
				StartTime: 	{__edmType: "Edm.Time", ms:StartTimeMS},
				EndTime: oSelectedEmp.EndTime
			};
			
			this.getView().byId("tne.lnupEmp.ShiftTime.st").setValueState(bundle.getText("tne.lnupEmp.txt.None"));
			this.getView().byId("tne.lnupEmp.ShiftTime.st").setValueStateText("");
			
			var oReturn = com.bnsf.eam.tne.util.Validators.verifyEmpShiftOverlap(oSelectedEmp, oEmpShift);
			
			
			//If error, set control in value state error
			if(oReturn.ValidationResult == "E" && oReturn.StartTimeOverlap){
				this.getView().byId("tne.lnupEmp.ShiftTime.st").setValueState(bundle.getText("tne.lnupEmp.txt.Error"));				
				this.getView().byId("tne.lnupEmp.ShiftTime.st").setValueStateText(bundle.getText("tne.lnupEmp.txt.AbsenteeOverlapStartTime"));
			}else{
				//TODO: Update Employee Shift Start time and action flag
			};
		},
		
		onEmpEnTimeChange: function(oEvent){
			var bundle= sap.ui.getCore().getModel("i18n").getResourceBundle();
			var oEnTime = new Date(oEvent.getParameters().value);
			var EndTimeMS = oEnTime.getTime();
			
			//get selected Emp
			var oSelectedEmp = this.getModel().getProperty(this.getView().getBindingContext().sPath).empReference;
			
			var oEmpShift = {
				StartTime: oSelectedEmp.StartTime,
				EndTime: {__edmType: "Edm.Time", ms:EndTimeMS}
			};
			
			this.getView().byId("tne.lnupEmp.ShiftTime.et").setValueState(bundle.getText("tne.lnupEmp.txt.None"));
			this.getView().byId("tne.lnupEmp.ShiftTime.et").setValueStateText("");
			
			var oReturn = com.bnsf.eam.tne.util.Validators.verifyEmpShiftOverlap(oSelectedEmp, oEmpShift);
			//If error, set control in value state error
			if(oReturn.ValidationResult == "E" && oReturn.EndTimeOverlap){
				this.getView().byId("tne.lnupEmp.ShiftTime.et").setValueState(bundle.getText("tne.lnupEmp.txt.Error"));
				this.getView().byId("tne.lnupEmp.ShiftTime.et").setValueStateText(bundle.getText("tne.lnupEmp.txt.AbsenteeOverlapEndTime"));				
			}else{
				//TODO: Update Employee Shift end time and action flag
			};
		},
		
		absenteeRowVisibileFormatter: function(sAction){
			if(sAction == "D")
				return false;
			else 
				return true;
		}
		
	});
	return LUEmployeeController;
});