sap.ui.define([
        		'com/bnsf/eam/tne/controller/BaseController',
        		'sap/ui/model/json/JSONModel',
        		'sap/m/MessageBox'
        	], function(BaseController, JSONModel, MessageBox) {
        	"use strict";

        	var LUPositionController = BaseController.extend("com.bnsf.eam.tne.controller.LUPosition", {


        		onInit : function (oEvent) {
        			var oModel=this.getModel();
        			this.getView().setModel(oModel);
        			var oRouter = this.getRouter();
        			oRouter.attachRouteMatched(this._onRouteMatched, this);
        		},

        		_onRouteMatched:function(oEvent){
        			var sRoute = oEvent.getParameter("name");
        			var oArgs= oEvent.getParameter("arguments"); 
        			if(sRoute == "LUPosition"){ 	
        				
        				var foundIndex = this._findPositionById(oArgs.PosNo);
        				if(foundIndex == -1){
        					//throw errror and navigate to Lineup screen
        					MessageBox.show(
            						bundle.getText("tne.lunpPos.msg.PosNotFound"), //Position Not Found
            						{
            							 icon: MessageBox.Icon.Error,
            					         title: bundle.getText("tne.app.Error"),
            					         actions: [sap.m.MessageBox.Action.OK],
            					         onClose: function(oAction) {  
            					        		 this.handlePageExit();
            					         }
            						}
            					);
        				}else{
        					var oModel = this.getModel();
                			this.getView().setModel(oModel);
            				var context = this.getModel().getContext('/selGang/lineup/NavPositions/'+foundIndex+'');
            				this.getView().setBindingContext(context);
            				//keep deep copy of Position and Unique employee list to reintanciate in case user exits without saving:
            				this._positionBeforeShow = jQuery.extend(true, {}, this.getModel().getProperty(context.sPath));
            				this._lineupBeforeShow = jQuery.extend(true, {}, this.getModel().getProperty('/selGang/lineup'));
            				this._uniqueEmpListBeforeShow = jQuery.extend(true, {}, this.getModel().getProperty('/selGang/uniqueEmployeeList'));
        				};
        			};
        		},

        		_findPositionById: function(sPosID){
        			var aPositions = this.getModel().getProperty("/selGang/lineup/NavPositions");
        			for(var index = 0; index < aPositions.length; index++){
        				if (aPositions[index].PositionId == sPosID)
        					return index;
        			};
        			return -1;
        		},
        		
        		/**
        		 * Handler for page exit on back navigation or any other navigation
        		 * @public
        		 * @memberOf tne.lunpPos
        		 * @returns null
        		 */
        		handlePageExit:function(){
        			//TODO: Compare postion before load and current, if diffrent, throw warning and revert back to roriginal if user does not want to save
        			if(this._positionBeforeShow)
        				this._positionBeforeShow = undefined;
        			if(this._lineupBeforeShow)
        				this._lineupBeforeShow = undefined;
        			if(this._uniqueEmpListBeforeShow)
        				this._uniqueEmpListBeforeShow = undefined;
        			this.onNavBack();				
        		},
        		
        		/**
        		 * Search Employee within Gang
        		 * @public
        		 * @memberOf tne.lunpPos
        		 * @returns null
        		 */        		
        		searchEmployee: function(oEvent){
        			
        			var  oUiModel = this.getModel();
        			
        			var query = oEvent.getSource().getValue();
        			var oEmployee = undefined;
        			
        			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
        			
        			var regEx = /^\d+$/; //numeric only
        			if(!regEx.test(query)){
        				MessageBox.show(
        						bundle.getText("tne.lunpPos.msg.SrchEmpIncorrectFormat"),
        						{
        							 icon: MessageBox.Icon.Error,
        					         title: bundle.getText("tne.app.Error"),
        					         actions: [sap.m.MessageBox.Action.OK],
        					         onClose: function(oAction) { return; }
        						}
        					);
        			}else{
        			
	        			var searchedEmp = query.replace(/\b0+/g, '');
	        			
	        			var aEmployees = oUiModel.getProperty("/selGang/uniqueEmployeeList"); //Incorrect format. Please enter numeric values only.
	        			var aLineup = oUiModel.getProperty(this.getView().getBindingContext().sPath);
	        			var aPositionEmp = aLineup.NavEmployees;
	        			var sPositionID = aLineup.PositionId;
	        			
	        			for(var i = 0; i < aEmployees.length; i++){
	        				var gangEmp = aEmployees[i].EmployeeId.replace(/\b0+/g, '');
	        				if(searchedEmp == gangEmp){
	        					oEmployee = aEmployees[i];
	        					break;
	        					
	        				};
	        			};
	        			
	        			//if employee is found check if employee already assigned to position.
	        			if (oEmployee != undefined){
	        				var that = this;
	        				var bEmpAlreadyAssigned = false;
	        				for(var j = 0; j < aPositionEmp.length; j++){
	        					var inPosEmp = aPositionEmp[j].EmployeeId.replace(/\b0+/g, '');
	        					if(searchedEmp == inPosEmp){
	        						if(aPositionEmp[j].Active){
		        						bEmpAlreadyAssigned = true;
		        						MessageBox.show(
		        								bundle.getText("tne.lunpPos.msg.SrchEmpAlreadyInPos"), //Employee Already assigned to this Position.
		                						{
		                							 icon: MessageBox.Icon.Error,
		                					         title: bundle.getText("tne.app.Error"),
		                					         actions: [sap.m.MessageBox.Action.OK],
		                					         onClose: function(oAction) { return; }
		                						}
		                				);
		        						break;
	        						}else{
	        							//remove employee from original position and assign to new position.
	    	        					var oNewTargetPos = that._findEmpPosAndAssign(oEmployee);	
	        						};
	        					};
	        				};
	        				if(bEmpAlreadyAssigned)
	        					return;
	        				else{
	        					//remove employee from original position and assign to new position.
	        					var oNewTargetPos = that._findEmpPosAndAssign(oEmployee);	
	        				}
	        			}else{ //if employee is not found in Gang query back end
	        				oEmployee = this._searchEmployeeOutsideGang(searchedEmp);
	        				if(oEmployee != undefined){
	        					//push new employee to Position 
	        					oEmployee.PositionId = sPositionID;
	        					aPositionEmp.push(oEmployee);
	        					//push new employee to unique list of employees
	        					aEmployees.push(oEmployee.NavEmployeeRef);
	        					//refresh display to show new employee
	        					oUiModel.refresh();
	        				};      			
	        			};
        			};
        		},
        		
        		/**
        		 * Search Employee outside Gang
        		 * returns employee object if found, else returns undefined
        		 * @private
        		 * @memberOf tne.lunpPos
        		 * @returns object
        		 */ 
        		_searchEmployeeOutsideGang: function(sSearchTerm){
        			
        			var that = this;
        			
        			var oModelLineUp = sap.ui.getCore().getModel("lineupModel");
        			
        			var  oUiModel = this.getModel();
        			
        			//Get parameters for service call
        			var selectedGangTitle = oUiModel.getProperty("/selGang/id");		
        			var userID = oUiModel.getProperty('/user/id');
        			var selectedDateTime = oUiModel.getProperty("/selGang/workDate");
        			
        			var gangStTime = oUiModel.getProperty("/selGang/dayGangProfile/StartTime");
        			var gangEnTime = oUiModel.getProperty("/selGang/dayGangProfile/EndTime");

        			selectedDateTime = new Date(selectedDateTime);  

        			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
        				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
        			}).format(selectedDateTime);
        			
        			var element = undefined;
        			
        			oModelLineUp.read("/AllEmployeesSet?$filter=EmployeeId eq '"+ sSearchTerm +"' " +
        					"and GangId eq '"+ selectedGangTitle +"' and WorkDate eq datetime'"+vDate+"'", 
        					null,{}, false,
        					function(oData, oResponse){
        						try{  
//        							element = {
//        									GangId: selectedGangTitle,
//        									EmployeeId: oData.results[0].EmployeeId,
//
//        									Salutation	:	oData.results[0].Salutation,
//        									FirstName	:	oData.results[0].FirstName,
//        									MiddleName	:	oData.results[0].MiddleName,
//        									LastName	:	oData.results[0].LastName,
//        									Designation:	oData.results[0].Designation,
//        									RoleCode	:	oData.results[0].RoleCode,
//
//        									PositionId: "",
//        									WorkDate: selectedDateTime,
//        									StartTime: gangStTime,
//        									EndTime: gangEnTime,
//        									Extension1: oData.results[0].Extention1,
//        									Extension2: "",
//        									Extension3: "",
//        									EndDate: selectedDateTime,
//        									StartDate: selectedDateTime,
//        									AssignCode:"TIME",
//        									RoleCode: "6",
//        									Action:"C",
//        									Active :true,
//        									Deletable:true,
//        									UserID: userID,	
//        									NavEmployeeRef: {
//        										AssignCode: "TIME",
//        										Designation: "",
//        										EmployeeId : oData.results[0].EmployeeId,
//        										EndDate: selectedDateTime,
//        										EndTime: gangEnTime,
//        										Extension1: "",
//        										FirstName: oData.results[0].FirstName,
//        										GangId: selectedGangTitle,
//        										LastName: oData.results[0].LastName,
//        										MiddleName: oData.results[0].MiddleName,
//        										NavAbsentees: [],
//        										RoleCode: oData.results[0].RoleCode,
//        										Salutation: oData.results[0].Salutation,
//        										StartDate: selectedDateTime,
//        										StartTime: gangStTime,
//        										UserID: userID,
//        										WorkDate: selectedDateTime
//        									}
//        							};
        							
        							element = that._prepareEmpObjectFor06(oData.results[0], "");
        						} catch (e) {
        							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03011: Error handling response in Get All Employee Set Service");
        						}
        					},function(error){
        						try{
        							var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();			 			
        							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.lunpPos.msg.ErrSearchEmp"),bundle.getText("tne.lunpPos.msg.LineupScreenErrorNumber"));
        						}
        						catch (e) {						
        							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Lineup - I03012: Error handling exception in Get All Employee Set Service");
        						}
        					});
        			return element;
        		},
        		
        		/**
        		 * Handler for Employee Active/Inactive Checkbox 
        		 * @public
        		 * @memberOf tne.lunpPos
        		 * @returns null
        		 */
        		handlePosActiveCB: function(oEvent){
        			var  oUiModel = this.getView().getModel();
        			var sPath = oEvent.getSource().getBindingContext().sPath;
        			var sPathAction = sPath + "/Action";
        			var Action = oUiModel.getProperty(sPathAction);
        			if(Action == "")
        				oUiModel.setProperty(sPathAction, "U");
        			else if(Action == "C"){ //if employee was assigned in current run and inactivated, remove employee from position
        				var end = sPath.lastIndexOf("/");			
        				var sPositionPath = sPath.substring(0, end);
        				var iIndex = sPath.substring((end+1), sPath.length);
        				var aSourceAssignEmp = oUiModel.getProperty(sPositionPath);
        				aSourceAssignEmp.splice(iIndex, 1);
        				oUiModel.refresh();
        			};
        		},
        		
        		/**
        		 * Swaps employee number passed as input from source
        		 * to target position. Deactivates employee in Source Position
        		 * Activates employee in Target position
        		 * If employee in source position was 06ed outside the gang,
        		 * employee reference in Source position will be all together deleted
        		 * @private
        		 * @memberOf tne.lunpPos.06
        		 * @returns null
        		 */
        		_findEmpPosAndAssign: function(oEmployee){
        			var that = this;
        			
        			var  oUiModel = this.getModel();
        			
        			var oReturn = undefined;
        			
        			var aLinup = oUiModel.getProperty("/selGang/lineup/NavPositions");
        			
        			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
        			
        			var oSourcePos = undefined;
        			var oTargetPosition = oUiModel.getProperty(this.getView().getBindingContext().sPath);
        			var sEmpID = oEmployee.EmployeeId.replace(/\b0+/g, '');
        			for(var i = 0; i <aLinup.length; i++){
        				var aAssignedEmp = aLinup[i].NavEmployees;
        				for(var j = 0; j <aAssignedEmp.length; j++){
        					var inPosEmp = aAssignedEmp[j].EmployeeId.replace(/\b0+/g, '');
        					if(inPosEmp == sEmpID && aAssignedEmp[j].Active){
        						oSourcePos = aLinup[i];
        						break;
        					};
        				};
        				
        			};
        			
        			if(oSourcePos != undefined){
        				MessageBox.show(
        						bundle.getText("tne.lunpPos.msg.ReassignEmpPosition", [oSourcePos.PositionName]), //Employee already active in Position {0}. Do you want to reassign employee?
        						{
        							 icon: MessageBox.Icon.Error,
        					         title: bundle.getText("tne.app.Confirm"),
        					         actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
        					         onClose: function(oAction) {  
        					        	//On YES - Reassign Employee
        					        	 if(oAction == "YES"){
        					        		 oReturn = that._changeEmployeePosition(oSourcePos, oTargetPosition, sEmpID);
        					        		 oUiModel.refresh();
        					        	 };
        					         }
        						}
        					);
        			}else{
        				var oNewEmployee = this._prepareEmpObjectFor06(oEmployee, oTargetPosition.PositionId);
        				oTargetPosition.NavEmployees.push(oNewEmployee);
        				oReturn = oTargetPosition;
        				oUiModel.refresh();
        			};		
        			return oReturn;
        		},
        		
        		/**
        		 * Swaps employee number passed as input from source
        		 * to target position. Deactivates employee in Source Position
        		 * Activates employee in Target position
        		 * If employee in source position was 06ed outside the gang,
        		 * employee reference in Source position will be all together deleted
        		 * @private
        		 * @memberOf tne.lunpPos.06
        		 * @returns null
        		 */
        		_changeEmployeePosition: function(oSourcePos, oTargetPosition, sEmpID){
        			var aSourceAssignEmp = oSourcePos.NavEmployees;
        			var aTargetAssignEmp = oTargetPosition.NavEmployees;
        			
        			//find if employee already present in Target but inactive
        			var bTargetEmpPresent = false;
        			var oTargetEmpFoundRef = undefined
        			for(var i = 0; i <aTargetAssignEmp.length; i++){
        				var inPosEmp = aTargetAssignEmp[i].EmployeeId.replace(/\b0+/g, '');
        				if(inPosEmp == sEmpID){
        					bTargetEmpPresent = true;
        					oTargetEmpFoundRef = aTargetAssignEmp[i];
        				};
        			};
        			
        			for(var j = 0; j <aSourceAssignEmp.length; j++){
    					var inPosEmp = aSourceAssignEmp[j].EmployeeId.replace(/\b0+/g, '');
    					if(inPosEmp == sEmpID && aSourceAssignEmp[j].Active){
    						aSourceAssignEmp[j].Active = false;
    						
    						if(bTargetEmpPresent){//if employee already present in the target just reactive employee
    							oTargetEmpFoundRef.Active = true;
    							oTargetEmpFoundRef.AssignCode = "TIME";
    							oTargetEmpFoundRef.PosReliefNo = "6";
    							oTargetEmpFoundRef.Action = "U";
    						}else{	
    							var oNewEmployee = this._prepareEmpObjectFor06(aSourceAssignEmp[j].NavEmployeeRef, oTargetPosition.PositionId);
    							oTargetPosition.NavEmployees.push(oNewEmployee);
    						};
    						
    						//update the assignment for source position
    						if(!aSourceAssignEmp[j].Deletable){//If employee is permenantly assigned to position, only Action is U
    							aSourceAssignEmp[j].Action = "U";
    						}else{ //If employee was activated to position in this run or a prior run
	    						if(aSourceAssignEmp[j].Action == "U" || aSourceAssignEmp[j].Action == "")//If employee activated in a prior run
	    							aSourceAssignEmp[j].Action = "D";
	    						else if(aSourceAssignEmp[j].Action == "C")//If employee activated in a prior run
	    							aSourceAssignEmp.splice(j,1); //remove employee that was added as part of 06 during this run
    						};
	    					break;
    					};
    				};
    				return oTargetPosition;
        		},
        		
        		/**
        		 *Prepares the Employee object to be added to new Position
        		 *To be added for 06 process
        		 *Returns the newly created object.
        		 * @private
        		 * @memberOf tne.lunpPos.06
        		 * @returns Object
        		 */        		
        		_prepareEmpObjectFor06: function(oEmployeeRef, sNewPositionID){
        			
        			var oEmployee  = jQuery.extend(true, {}, oEmployeeRef);
        
        			var  oUiModel = this.getModel();
        			
        			//Get parameters for service call
        			var selectedGangTitle = oUiModel.getProperty("/selGang/id");		
        			var userID = oUiModel.getProperty('/user/id');
        			var selectedDateTime = oUiModel.getProperty("/selGang/workDate");
        			
        			var gangStTime = oUiModel.getProperty("/selGang/dayGangProfile/StartTime");
        			var gangEnTime = oUiModel.getProperty("/selGang/dayGangProfile/EndTime");
        			
        			var oPositionEmployee = {
							GangId: selectedGangTitle,
							EmployeeId: oEmployee.EmployeeId,

							Salutation	:	oEmployee.Salutation,
							FirstName	:	oEmployee.FirstName,
							MiddleName	:	oEmployee.MiddleName,
							LastName	:	oEmployee.LastName,
							Designation:	oEmployee.Designation,
							RoleCode	:	oEmployee.RoleCode,

							PositionId: sNewPositionID,
							WorkDate: selectedDateTime,
							StartTime: gangStTime,
							EndTime: gangEnTime,
							Extension1: oEmployee.Extention1,
							Extension2: "",
							EndDate: selectedDateTime,
							StartDate: selectedDateTime,
							AssignCode:"TIME",
							PosReliefNo: "6",
							Action:"C",
							Active :true,
							Deletable:true,
							UserID: userID,	
							NavEmployeeRef: {
								AssignCode: "TIME",
								Designation: "",
								EmployeeId : oEmployee.EmployeeId,
								EndDate: selectedDateTime,
								EndTime: gangEnTime,
								Extension1: "",
								FirstName: oEmployee.FirstName,
								GangId: selectedGangTitle,
								LastName: oEmployee.LastName,
								MiddleName: oEmployee.MiddleName,
								NavAbsentees: [],
								RoleCode: oEmployee.RoleCode,
								Salutation: oEmployee.Salutation,
								StartDate: selectedDateTime,
								StartTime: gangStTime,
								UserID: userID,
								WorkDate: selectedDateTime
							}
					};
        			
        			return oPositionEmployee;
        		}
        		
        	});
        	return LUPositionController;
});