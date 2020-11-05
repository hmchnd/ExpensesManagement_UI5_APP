sap.ui.define([
               'com/bnsf/eam/tne/controller/BaseController',
               'sap/ui/model/json/JSONModel',
               'sap/m/MessageBox'
               ], function(BaseController, JSONModel,MessageBox) {
	"use strict";

	var LUMultiEmployeeController = BaseController.extend("com.bnsf.eam.tne.controller.LUMultiEmployee", {

		onInit : function (oEvent) {       		
			this._bStartEndTimeChanged=true;            		
			var oModel=this.getModel();
			this.getView().setModel(oModel);
			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);           	
		},
		_onRouteMatched:function(oEvent){
			var sRoute = oEvent.getParameter("name");
			var oArgs= oEvent.getParameter("arguments"); 
			if(sRoute == "LUMultiEmployee"){ 	        				
				this._loadSelectedEmployees();	//Load the view data
			}
		},

		_loadSelectedEmployees:function()
		{        			        			
			var oUiModel=this.getModel();
			var selectedEmpModel = sap.ui.getCore().getModel("tne.lunpMultiEmp.mdl.SelEmp").getData();	//Getting the model which was set in Lineup Controller        			
			var selectedEmployees = $.grep(selectedEmpModel,function(employees){
				return employees;
			});      
			var gangStartTime=oUiModel.getProperty('/selGang/dayGangProfile/StartDate');
			var gangEndTime=oUiModel.getProperty('/selGang/dayGangProfile/EndDate');
			var mutliDayFlag=oUiModel.getProperty('/selGang/multiDayInd');

			//Local JSONModel for the screen		
			var empSelectedData = {        					
					selectedEmp: selectedEmployees, //selected Employees with reference
					startTime: gangStartTime,
					endTime:gangEndTime,
					multiDayInd: mutliDayFlag,
					absentees: []				
			}; 
			var oEmpSelectedModel=new sap.ui.model.json.JSONModel(empSelectedData);
			this.getView().setModel(oEmpSelectedModel);        		        			
		},

		//delete a token and remove that employee data array from the model
		_deleteToken:function(evt)
		{
			var token=evt.getParameter('token');
			var oBindingInfo = this.getView().byId("tne.lunpMultiEmp.tokenizer").getBindingInfo('tokens');
			var oModel = oBindingInfo.binding.getModel();
			var sPath = oBindingInfo.path;
			var data = oModel.getProperty(sPath);
			var key = oBindingInfo.template.getBindingInfo('key').parts[0].path;

			for (var i = 0; i < data.length; i++) {
				if (data[i][key] === token.getKey()) {
					data.splice(i, 1);
					break;
				};
			};
			this.getView().byId("tne.lunpMultiEmp.tokenizer").getModel().refresh();

		},
		_getDialog: function (oEvent) {

			var oAbsenteeModel = this.getModel("oAbsenteeType");
			if (! this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("tne.lnupEmp.frag","com.bnsf.eam.tne.fragments.AddAbsentee", this);
				this._oDialog.setModel(oAbsenteeModel);
				sap.ui.core.Fragment.byId("tne.lnupEmp.frag", "tne.lnupEmp.frag.ErrorLab").setText("");
				this.getView().addDependent(this._oDialog);
			};
			return this._oDialog;
		},

		addAbsenteeDialogOpen : function () {
			this._getDialog().open();	// call the dialog
		},
		
		_closeAbsentDialog : function () {
			this._getDialog().close();
		},

		//Add absentees 
		_addAbsenteeDetails:function(){
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();

			//get New absentee attributes
			var Code = sap.ui.core.Fragment.byId("tne.lnupEmp.frag", "myControl").getSelectedKey();
			var actualstDate = sap.ui.core.Fragment.byId("tne.lnupEmp.frag", "tne.lnupEmp.frag.stTime").getDateValue();
			var actualEndDate = sap.ui.core.Fragment.byId("tne.lnupEmp.frag", "tne.lnupEmp.frag.EndTime").getDateValue();
			if((actualstDate !== null && actualEndDate !== null) && Code != ""){
				var absenteeStartTime = com.bnsf.eam.tne.util.DateAndTimeConversion.convertLocalDateToMilliSec(actualstDate);
				var absenteeEndTime = com.bnsf.eam.tne.util.DateAndTimeConversion.convertLocalDateToMilliSec(actualEndDate);

			}else{      				
				MessageBox.alert(
						bundle.getText("tne.lunpMultiEmp.err.SelectDate"));
				return;
			}
			//Get new absentee type reference
			var abenteeCode=sap.ui.getCore().getModel("oAbsenteeType").getData().results;
			var oAbReference = undefined;
			var iRefAbCodeIndex = com.bnsf.eam.tne.util.Validators.getAbsenteeByCode(Code);
			iRefAbCodeIndex != -1 ? oAbReference = abenteeCode[iRefAbCodeIndex] : null;

			//get selected Emp
			var selectedEmp = [];
			selectedEmp = this.getView().getModel().getProperty('/selectedEmp');

			//array or validation results
			var aValResults = [];
			var bError = false;
			var sErrorString = "";

			sap.ui.core.Fragment.byId("tne.lnupEmp.frag", "tne.lnupEmp.frag.ErrorLab").setText("");
			sap.ui.core.Fragment.byId("tne.lnupEmp.frag", "tne.lnupEmp.frag.ErrorLab").setVisible(false);

			//validate absentee for each employee selected
			for(var i=0; i < selectedEmp.length; i++){
				var oSelectedEmp=this.getView().getModel().getProperty('/selectedEmp'+"/"+i).empReference;
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
				var oReturn = com.bnsf.eam.tne.util.Validators.verifyAbsenteeOverlap(oSelectedEmp, oNewAbsentee);
				if(oReturn.ValidationResult == "E"){
					bError = true;
					var sErrorThisEmp = "\n Error: Employee " + oReturn.EmpNo + " - " + oReturn.Validations[0].Message; 
					sErrorString =  sErrorString + sErrorThisEmp;
				};

			};

			//IF there are errors with even a single employee throw error message
			if(bError){		
				sap.ui.core.Fragment.byId("tne.lnupEmp.frag", "tne.lnupEmp.frag.ErrorLab").setText(sErrorString);
				sap.ui.core.Fragment.byId("tne.lnupEmp.frag", "tne.lnupEmp.frag.ErrorLab").setVisible(true);
			}else{
				this.getView().getModel().oData.absentees.push(oNewAbsentee);
				this.getView().getModel().refresh();
				this._closeAbsentDialog();
			};       			
		},	


		//delete a row from a table on click of delete button
		_deleteAbsentee:function(evt)
		{		
			var getPath=evt.getSource().getBindingContext().sPath;
			var oNavAbMultiEmpTable=this.getView().byId("tne.lunpMultiEmp.tbl_lineup");
			var actionType=oNavAbMultiEmpTable.getModel().getProperty(getPath+"/Action")
			if(actionType=='C'){
				if (evt.getSource().getParent().getParent().getItems().length > 0) {
					var item = evt.getSource().getParent();
					var index = evt.getSource().getParent().getParent().indexOfItem(item);
					var strlen = getPath.length-2;
					var newPath = getPath.substr(0, strlen);
					var navAbsenteeArray = oNavAbMultiEmpTable.getModel().getProperty(newPath);
					navAbsenteeArray.splice(index, 1);	//remove a row data depending on the delete button index clicked
				};
			}else if(actionType == "" ||actionType == "D"){
				oNavAbsenteeTable.getModel().setProperty(getPath+"/Action",'D')	// else set action flag to D 
			}
			oNavAbMultiEmpTable.getModel().refresh()
		},

		_onSave:function()
		{
			var oUiModel = this.getModel();
			var absenteeArray = this.getView().getModel().getData().absentees;
			var selectedEmpArray = this.getView().getModel().getData().selectedEmp; 
			var aLineUp = oUiModel.getProperty('/selGang/lineup/NavLineEmp');
			
			for(var i=0;i<aLineUp.length;i++){
				var aNavAbsentees=oUiModel.getProperty("/selGang/lineup/NavLineEmp/"+i+"/NavAbsentees")	 		
					for(var j = 0;j < selectedEmpArray.length; j++){
						if(aLineUp[i].EmployeeId == selectedEmpArray[j].empId){
							for(var k = 0 ; k < absenteeArray.length ; k++){
//								var oAbsenteeCopy = jQuery.extend(true, {}, absenteeArray[k]);
//								oAbsenteeCopy.EmployeeId = selectedEmpArray[j].empId;
								var oNewAbsentee = {
										AbsenteeType: absenteeArray[k].AbsenteeType,
										Action: "C",
										Deletable:true,
										EmployeeId:selectedEmpArray[j].empId,
										EndDate: selectedEmpArray[j].empReference.EndDate,
										EndTime:{__edmType: "Edm.Time", ms:absenteeArray[k].EndTime.ms },
										Extension1:"",
										GangId:selectedEmpArray[j].empReference.GangId,
										SourceSystem:"",
										StartDate:selectedEmpArray[j].empReference.StartDate,
										StartTime:{__edmType: "Edm.Time", ms:absenteeArray[k].StartTime.ms },
										WorkDate:selectedEmpArray[j].empReference.WorkDate,
										UserID:selectedEmpArray[j].empReference.UserID,
										AbsentRef: absenteeArray[k].AbsentRef,		
								}; 
								aNavAbsentees.push(oNewAbsentee);		//pushing an array ,here need to push an object
							};
						};
					};
	 		};
		
			//Navigate back to Lineup page 
			this.getView().getModel().getData().absentees = [];
			this._handlePageExit(this.onNavBack);
		},

		_handlePageExit: function(mCallback){
			//check if new absentee added in this screen
			var bChanged = true;
			var oCall = function(){};
			var that = this;
			var absenteeArray = this.getView().getModel().getData().absentees;
			absenteeArray.length == 0 ? bChanged = false : bChanged = true;
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
									//TODO: destroy sap.ui.getCore().getModel("tne.lunpMultiEmp.mdl.SelEmp")
									that.getView().getModel().destroy(); 	//destroying "tne.lunpMultiEmp.mdl.SelEmp" Model
									oCall = mCallback(); //calling callback
								}else{
									return; 								
								};
							}
						}
				);				  
			}else{
				//TODO: destroy sap.ui.getCore().getModel("tne.lunpMultiEmp.mdl.SelEmp")
				this.getView().getModel().destroy(); 	//destroying "tne.lunpMultiEmp.mdl.SelEmp" Model
				oCall = mCallback();  //calling callback
			};			

		},
		_onCancel:function()
		{
			this._handlePageExit(this.onNavBack);	
		},


		navBackToLineUp:function()
		{
			this._handlePageExit(this.onNavBack);
		},

		onExit:function()
		{
			sap.ui.getCore().getModel("tne.lunpMultiEmp.mdl.SelEmp").destroy();
			this.getView().getModel().destroy();
		}

	})			
	return LUMultiEmployeeController;
});