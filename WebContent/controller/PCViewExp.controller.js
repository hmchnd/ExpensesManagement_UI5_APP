sap.ui.define([
'com/bnsf/eam/tne/controller/BaseController',
'com/bnsf/eam/tne/util/DateAndTimeConversion',
'com/bnsf/eam/tne/util/UserNameFormatter',
'com/bnsf/eam/tne/util/Validators',
'com/bnsf/eam/tne/util/FetchValueHelps',
'sap/ui/model/json/JSONModel',
'sap/m/MessageBox',
'com/bnsf/eam/tne/util/ServiceErrorHandler'
], function(BaseController, DateAndTimeConversion, UserNameFormatter, Validators, FetchValueHelp, JSONModel,MessageBox,ServiceErrorHandler) {
	"use strict";

	var PCViewExpController = BaseController.extend("com.bnsf.eam.tne.controller.PCViewExp", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf view.PCViewExp
		 */
		onInit: function() {
			/*var oUiModel = this.getModel();
			this.setModel(oUiModel);
*/
			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);	

		},
		/**
		 * On route matched for PCViewExp screen
		 * Instantiates PCViewExp 
		 * @private
		 * @memberOf tne.pcViewExp
		 * @returns null
		 */
		_onRouteMatched: function(oEvent){

			var sRoute = oEvent.getParameter("name");			
			var ExpPCindex= oEvent.getParameter("arguments").ExpPC; 	
			this._ExpRef = ExpPCindex;
			this._EmpIdRef = oEvent.getParameter("arguments").EmpID;
			if(sRoute == "PCViewExp"){

				if(ExpPCindex == "addExpense"){

					this._initialiseAddExpScreen();

				}else
					this._initiaseViewExpScreen(ExpPCindex);
			};
		},

		/**
		 * Initialises PCViewExp screen for Adding New Expense		
		 * @private
		 * @memberOf tne.pcViewExp
		 * @returns null
		 */
		_initialiseAddExpScreen: function(){			
			var oExpenseDetailsModel = sap.ui.getCore().getModel("oExpenseDetailsModel");
			this.getView().setModel(oExpenseDetailsModel);

			this._dataBeforeShow = jQuery.extend(true, {}, oExpenseDetailsModel.getData());


			var ExpTypeDropDown = this.getView().byId("tne.pcViewExp.ExpType").setModel(new sap.ui.model.json.JSONModel(this.getModel().getProperty("/selGang/valueHelp/ExpType")));
			this.getView().byId("tne.pcViewExp.ExpType").setEnabled(true);

			var sExpType = sap.ui.getCore().getModel("oExpenseDetailsModel").getData().AdditiveType;
			ExpTypeDropDown.setSelectedKey(sExpType);

			this._handleExpenseTypeChange(sExpType);


		},
		/**
		 * Initialises PCViewExp screen To view details for selected expense Expense		
		 * @private
		 * @memberOf tne.pcViewExp
		 * @returns null
		 */
		_initiaseViewExpScreen: function(ExpPCindex){			
			var oExpenseDetailsModel = sap.ui.getCore().getModel("oExpenseDetailsModel");
			this.getView().setModel(oExpenseDetailsModel);

			var sExpType = sap.ui.getCore().getModel("oExpenseDetailsModel").getData().AdditiveType;

			this._dataBeforeShow = jQuery.extend(true, {}, oExpenseDetailsModel.getData());			

//			var selectedGangTitle = this.getModel().getProperty("/selGang/id");		
//			var userID = this.getModel().getProperty('/user/id');
//			var selectedDateTime = this.getModel().getProperty("/selGang/workDate");
//			selectedDateTime = new Date(selectedDateTime);  

//			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
//			style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
//			}).format(selectedDateTime);

//			var oValueHelpModel = sap.ui.getCore().getModel("oValueHelpModel");

			var ExpTypeDropDown = this.getView().byId("tne.pcViewExp.ExpType").setModel(new sap.ui.model.json.JSONModel(this.getModel().getProperty("/selGang/valueHelp/ExpType")));
			this.getView().byId("tne.pcViewExp.ExpType").setEnabled(false);
			ExpTypeDropDown.setSelectedKey(sExpType);

			var oPanelContainer = this.getView().byId("tne.pcViewExp.panel");
//			var oPanelContainerMEAL = this.getView().byId("tne.pcViewExp.MEAL.panel");

			switch(sExpType){
			case 'VHCL':
				oPanelContainer.destroyContent();
				var fragVHCL = sap.ui.xmlfragment("myFragVHCL","com.bnsf.eam.tne.fragments.ExpenseTypeVHCL",this);	
				FetchValueHelp.getTravelCode(sExpType);		
				oPanelContainer.addContent(fragVHCL);
				break;

			case 'DIFF': 
				oPanelContainer.destroyContent();
				var fragDIFF = sap.ui.xmlfragment("myFragDIFF","com.bnsf.eam.tne.fragments.ExpenseTypeDIFF", this);
				oPanelContainer.addContent(fragDIFF);	
				break;

			case 'MEAL':					
				oPanelContainer.destroyContent();
				var fragMEAL = sap.ui.xmlfragment("myFragMEAL","com.bnsf.eam.tne.fragments.ExpenseTypeMEAL",this);								
				var ZipCode = sap.ui.getCore().getModel("oExpenseDetailsModel").getData().OriginZip;
				var LineSeg = sap.ui.getCore().getModel("oExpenseDetailsModel").getData().LineSegment;

				if(ZipCode != ""){
					FetchValueHelp.getHotelCode(sExpType,ZipCode);
				}else{

					this.LSChange();
				}

				FetchValueHelp.getLineSegment();
				oPanelContainer.addContent(fragMEAL);
				break;
			};
		},
		
		handleZipCodeChange: function(){
			var oExpenseDetailsModel = sap.ui.getCore().getModel("oExpenseDetailsModel");
			var sExpType = oExpenseDetailsModel.getData().AdditiveType;
			var ZipCode = oExpenseDetailsModel.getData().OriginZip;
			FetchValueHelp.getHotelCode(sExpType,ZipCode);
		},

		/**
		 * called when Expense Type is changed from dropdown		
		 * @private
		 * @memberOf tne.pcViewExp
		 * @returns null
		 */
		onExpChange: function(){

			var sExpType = this.getView().byId("tne.pcViewExp.ExpType").getSelectedKey();

			this._handleExpenseTypeChange(sExpType);

		},

		onExit: function(){

			var oPanelContainer = this.getView().byId("tne.pcViewExp.panel");
			oPanelContainer.destroyContent();
		},

		/**
		 * To change the fragments respective to Expense type change
		 * Method to fetch the value help vales and populate default model		
		 * @private
		 * @memberOf tne.pcViewExp
		 * @returns null
		 */
		_handleExpenseTypeChange: function(sExpType){

			var selectedGangTitle = this.getModel().getProperty("/selGang/id");		
			var userID = this.getModel().getProperty('/user/id');
			var selectedDateTime = this.getModel().getProperty("/selGang/workDate");
			selectedDateTime = new Date(selectedDateTime);  

			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);

			var oValueHelpModel = sap.ui.getCore().getModel("oValueHelpModel");
			var oExpenseDetailsModel = sap.ui.getCore().getModel("oExpenseDetailsModel");


			var oPanelContainer = this.getView().byId("tne.pcViewExp.panel");	

			switch(sExpType){
			case 'VHCL':				
				oPanelContainer.destroyContent();
				oExpenseDetailsModel.getData().AdditiveType = sExpType;
				var fragVHCL = sap.ui.xmlfragment("myFragVHCL","com.bnsf.eam.tne.fragments.ExpenseTypeVHCL",this);
				var ExpTypeRef = FetchValueHelp.getExpType(sExpType);
				oExpenseDetailsModel.getData().ExpenseTypeRef = ExpTypeRef;
				if(ExpTypeRef.Paycodes == undefined || ExpTypeRef.Paycodes.length <= 0){

					var ExpRef = FetchValueHelp.getExpense(sExpType);

				}/*else{

					oExpenseDetailsModel.getData().Paycode = ExpTypeRef.Paycodes[0].Code;					
				}*/
				var TrvlCodeRef = FetchValueHelp.getTravelCode(sExpType);
//				
//				FetchValueHelp.getExpense(sExpType);					
//				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'EXPENSE_PAYCODE' and ScreenIndicator eq 'PAYCODES'and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"' and ImportParam1 eq 'VHCL' and UserID eq '" + userID  + "'",
//				null,{}, false,
//				function(oData, oResponse){	
//			
//				oExpenseDetailsModel.setProperty('/ExpenseTypeRef/Paycodes',oData.results);
//				}

//				);	

//				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'TRAVEL_CODE' and ScreenIndicator eq 'PAYCODES' and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"' and UserID eq '" + userID  + "'",
//				null,{}, false,
//				function(oData, oResponse){						
//				oExpenseDetailsModel.setProperty('/ExpenseTypeRef/Travelcodes',oData.results);
//				}

//				);
//				fragVHCL.setModel(oExpenseDetailsModel);				
				oPanelContainer.addContent(fragVHCL);	
				break;
			case 'DIFF': 
				oExpenseDetailsModel.getData().AdditiveType = sExpType;
				oPanelContainer.destroyContent();
				var fragDIFF = sap.ui.xmlfragment("myFragDIFF","com.bnsf.eam.tne.fragments.ExpenseTypeDIFF",this);
				var ExpTypeRef = FetchValueHelp.getExpType(sExpType);
				oExpenseDetailsModel.getData().ExpenseTypeRef = ExpTypeRef;
				if(ExpTypeRef.Paycodes == undefined || ExpTypeRef.Paycodes.length <= 0){

					var ExpRef = FetchValueHelp.getExpense(sExpType);

				}/*else{

					oExpenseDetailsModel.getData().Paycode = ExpTypeRef.Paycodes[0].Code;
				}*/

//				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'EXPENSE_PAYCODE' and ScreenIndicator eq 'PAYCODES'and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"' and ImportParam1 eq 'DIFF' and UserID eq '" + userID  + "'",
//				null,{}, false,
//				function(oData, oResponse){								
//				oExpenseDetailsModel.setProperty('/ExpenseTypeRef/Paycode',oData.results);
//				}

//				);	
//				fragDIFF.setModel(oExpenseDetailsModel);
				oPanelContainer.addContent(fragDIFF);	
				break;
			case 'MEAL':
				oExpenseDetailsModel.getData().AdditiveType = sExpType;
				oPanelContainer.destroyContent();
				var fragMEAL = sap.ui.xmlfragment("myFragMEAL","com.bnsf.eam.tne.fragments.ExpenseTypeMEAL",this);
				var ExpTypeRef = FetchValueHelp.getExpType(sExpType);
				var LineSegRef = FetchValueHelp.getLineSegment();				
				oExpenseDetailsModel.getData().ExpenseTypeRef = ExpTypeRef;
				oExpenseDetailsModel.getData().ExpenseTypeRef.LineSegment = LineSegRef;
				if(ExpTypeRef.Paycodes == undefined || ExpTypeRef.Paycodes.length <= 0){

					var ExpRef = FetchValueHelp.getExpense(sExpType);

				}/*else{

					oExpenseDetailsModel.getData().Paycode = ExpTypeRef.Paycodes[0].Code;
				};*/	
				if(ExpTypeRef.LineSegment == undefined || ExpTypeRef.LineSegment.length <= 0){

					ExpTypeRef.LineSegment = this.getModel().getProperty("/selGang/valueHelp/LineSegments");

				}/*else{

					oExpenseDetailsModel.getData().LineSegment = ExpTypeRef.LineSegment[0].Code;
				};*/
				oPanelContainer.addContent(fragMEAL);	

				/*oPanelContainer.destroyContent();
				oPanelContainer.addContent(sap.ui.xmlfragment("myFragMEAL","com.bnsf.eam.tne.fragments.ExpenseTypeMEAL",this));
				var oUiModel = this.getModel();
				var oModelForLineSegValueHlp=new JSONModel();
				sap.ui.getCore().setModel(oModelForLineSegValueHlp,"oModelForLineSegValueHlp")
				var oDataModelLineSegValueHlp = sap.ui.getCore().getModel( "oDataModelLineSegValueHlp");
				oDataModelLineSegValueHlp.read("/FuncLocationSet",
						null,{}, true,
						function(oData, oResponse){	
							
							oUiModel.setProperty("/selGang/valueHelp/LineSegments", oData.results);
							oModelForLineSegValueHlp.setProperty('/items',oData.results);
							oModelForLineSegValueHlp.refresh();
						}

				);			

				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'EXPENSE_PAYCODE' and ScreenIndicator eq 'PAYCODES'and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"' and ImportParam1 eq 'MEAL' and UserID eq '" + userID  + "'",
						null,{}, false,
						function(oData, oResponse){	
							
							sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.ExpCodeMeal").setModel(new sap.ui.model.json.JSONModel(oData));
						}

				);*/
				/*
				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'HOTEL' and ScreenIndicator eq 'EXPENSE' and ImportParam1 eq '73161' and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"' and UserID eq '" + userID  + "'",
						null,{}, false,
						function(oData, oResponse){	
							
							sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.Hotel").setModel(new sap.ui.model.json.JSONModel(oData.results));
						}

				);
				 */
				break;
			};

		},
		/**
		 * called when the radiobutton selection changed in MEAL expense type		
		 * @private
		 * @memberOf tne.pcViewExp
		 * @returns null
		 */
		onRadioButtonChange: function(oEvent){


			var index = oEvent.getParameters().selectedIndex;
			
			this._ControllsVisible(index);


		},
		/**
		 * To change the controles that should be visible 
		 * when radio button selection changed
		 * @param index
		 */
		_ControllsVisible: function(index){

			if(index==1){

				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.lbl.AssembPoint").setVisible(false);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.AssembPoint").setVisible(false);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.lbl.LS").setVisible(false);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.LS").setVisible(false);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.lbl.Milepost").setVisible(false);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.Milepost").setVisible(false);

				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.lbl.ZIP").setVisible(true);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.ZIP").setVisible(true);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.lbl.Hotel").setVisible(true);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.Hotel").setVisible(true);

			}else{

				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.lbl.ZIP").setVisible(false);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.ZIP").setVisible(false);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.lbl.Hotel").setVisible(false);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.Hotel").setVisible(false);


				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.lbl.AssembPoint").setVisible(true);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.AssembPoint").setVisible(true);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.lbl.LS").setVisible(true);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.LS").setVisible(true);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.lbl.Milepost").setVisible(true);
				sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.Milepost").setVisible(true);	
			}	

		},

		onBack:function(){
			this._handlePageExit(this.onNavBack);
		},

		/**
		 * called when cancell button is clocked from footer
		 * validates screen objects and shows error messages
		 * navigates to previous screen 	
		 * @private
		 * @memberOf tne.pcViewExp
		 * @returns null
		 */
		handlePCViewExpCancel: function(){
			this._handlePageExit(this.onNavBack);
		},

		/**
		 * called when Save button from page footer is clicked
		 * validates respective validations and 
		 * pushes the expense details to the default Model		
		 * @private
		 * @memberOf tne.pcViewExp
		 * @returns null
		 */
		handlePCViewExpSave: function(){

			var oPCExpModelData = this.getView().getModel().getData();
			var sExpType = oPCExpModelData.AdditiveType;

			switch(sExpType){
			case 'DIFF':
				var sPaycode = oPCExpModelData.Paycode;
				var sDuration = oPCExpModelData.Duration.getHours()+ oPCExpModelData.Duration.getMinutes();
				var oValidateDIFF = Validators.ValidationDIFF(sPaycode, sDuration);
				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
				var oValidationError = false;
				var sWarningBody = "";

				if(oValidateDIFF.isPayCodeNull){

					sWarningBody = bundle.getText("tne.pcEmp.msg.PayCodeNullError") + "\n\n";
					oValidationError = true;
				}

				if(oValidateDIFF.isDurationNull){

					sWarningBody = sWarningBody + bundle.getText("tne.pcEmp.msg.DurationNullError");
					oValidationError = true;
				}

				if(oValidationError){

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

					if(oPCExpModelData.Action=="N"){
						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);	
						var Duration = oPCExpModelData.Duration; 
						var hrs = Duration.getHours();
						if (hrs.toString().length == 1) {
							hrs = "0" + hrs;
						}
						oPCExpModelData.Hours = hrs;
						oPCExpModelData.Mins = String(Duration.getMinutes());

						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;
						oPCExpModelData.Action = "C";
						// calling Util Method for paycode reference
						var sPaycode = oPCExpModelData.Paycode;
						var ExpTypeRef = FetchValueHelp.getExpType(sExpType);
						oPCExpModelData.ExpenseTypeRef = ExpTypeRef;
						if(ExpTypeRef.Paycodes != undefined || ExpTypeRef.Paycodes.length >= 0){

							oPCExpModelData.ExpenseRef = FetchValueHelp.getExpense(sExpType,sPaycode);

						}						
						aNavAdditive.push(oPCExpModelData);	
						DefaultModel.refresh();
						//sap.ui.getCore().byId("tne.pcEmp.tbl_pcEmp_Expense").getModel().refresh();
						this.onNavBack();
					}
					else if(oPCExpModelData.Action=="C")
					{
						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditiveObj = DefaultModel.getProperty(sPath);

						var Duration = oPCExpModelData.Duration; 
						var hrs = Duration.getHours();
						if (hrs.toString().length == 1) {
							hrs = "0" + hrs;
						}
						oPCExpModelData.Hours = hrs;
						oPCExpModelData.Mins = String(Duration.getMinutes());

						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;						
						aNavAdditiveObj[this._ExpRef] = oPCExpModelData;							
						DefaultModel.refresh();
						//sap.ui.getCore().byId("tne.pcEmp.tbl_pcEmp_Expense").getModel().refresh();
						this.onNavBack();
					}
					else if(oPCExpModelData.Action=="U" || oPCExpModelData.Action=="")
					{

						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditiveObj = DefaultModel.getProperty(sPath);

						var Duration = oPCExpModelData.Duration; 
						var hrs = Duration.getHours();
						if (hrs.toString().length == 1) {
							hrs = "0" + hrs;
						}
						oPCExpModelData.Hours = hrs;
						oPCExpModelData.Mins = String(Duration.getMinutes());

						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;

						oPCExpModelData.Action = "U";
						aNavAdditiveObj[this._ExpRef] = oPCExpModelData;							
						DefaultModel.refresh();

						this.onNavBack();

					}else{

						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditiveObj = DefaultModel.getProperty(sPath);

						var Duration = oPCExpModelData.Duration; 
						var hrs = Duration.getHours();
						if (hrs.toString().length == 1) {
							hrs = "0" + hrs;
						}
						oPCExpModelData.Hours = hrs;
						oPCExpModelData.Mins = String(Duration.getMinutes());

						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;					

						aNavAdditiveObj[this._ExpRef] = oPCExpModelData;							
						DefaultModel.refresh();

						this.onNavBack();						

					}
				}
				break;

			case 'MEAL':
				oPCExpModelData.LineSegment = sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.LS").getValue();

				var sPaycode = oPCExpModelData.Paycode;
				var sIndex = sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frag.RBG.Hours").getSelectedIndex();
				if(sIndex == 0){
					var sLS = oPCExpModelData.LineSegment;	
					var sMP = oPCExpModelData.MilePost; 
					var sBMP = oPCExpModelData.ExpenseTypeRef.LineSegmentRef.BMP;
					var sEMP = oPCExpModelData.ExpenseTypeRef.LineSegmentRef.EMP;
				}else				
					var sZip = oPCExpModelData.OriginZip;


				var oValidateMEAL = Validators.ValidationMEAL(sPaycode, sIndex, sLS, sZip, sMP, sBMP,sEMP);				
				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
				var oValidationError = false;
				var sWarningBody = "";

				if(oValidateMEAL.isPayCodeNull){

					sWarningBody = bundle.getText("tne.pcEmp.msg.PayCodeNullError") + "\n\n";
					oValidationError = true;
				};			

				if(oValidateMEAL.isSelectedLS){

					if(oValidateMEAL.isLSblank){
						sWarningBody = sWarningBody + bundle.getText("tne.pcEmp.msg.LSNullError") + "\n\n";
						oValidationError = true;
					};

					if(oValidateMEAL.isMilePostBlank){
						sWarningBody = sWarningBody + bundle.getText("tne.pcEmp.msg.MilePostBlankError") + "\n\n";
						oValidationError = true;
					};

					if(oValidateMEAL.isMilePostNotInRange){

						sWarningBody = sWarningBody + bundle.getText("tne.pcEmp.msg.MilePostNotInRangeError") + "\n\n";
						oValidationError = true;
					}
				}else if(oValidateMEAL.isSelectedZIP){					
					if(oValidateMEAL.isOriginZipBlank){
						sWarningBody = sWarningBody + bundle.getText("tne.pcEmp.msg.ZIPNullError") + "\n\n";
						oValidationError = true;
					};
				};

				if(!oValidationError && oValidateMEAL.isSelectedLS){

					if(oPCExpModelData.Action=="N"){
						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);	
						/*var Duration = oPCExpModelData.Duration; 
						var hrs = Duration.getHours();
						if (hrs.toString().length == 1) {
							hrs = "0" + hrs;
						}
						oPCExpModelData.Hours = hrs;
						oPCExpModelData.Mins = String(Duration.getMinutes());*/

						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;
						oPCExpModelData.Action = "C";
						// calling Util Method for paycode reference
						var sPaycode = oPCExpModelData.Paycode;
						var ExpTypeRef = FetchValueHelp.getExpType(sExpType);
						oPCExpModelData.ExpenseTypeRef = ExpTypeRef;
						if(ExpTypeRef.Paycodes != undefined || ExpTypeRef.Paycodes.length >= 0){

							oPCExpModelData.ExpenseRef = FetchValueHelp.getExpense(sExpType,sPaycode);

						}

						aNavAdditive.push(oPCExpModelData);							
						DefaultModel.refresh();

						this.onNavBack();

					}
					else if(oPCExpModelData.Action=="C")
					{
						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);	
						/*var Duration = oPCExpModelData.Duration; 
						var hrs = Duration.getHours();
						if (hrs.toString().length == 1) {
							hrs = "0" + hrs;
						}
						oPCExpModelData.Hours = hrs;
						oPCExpModelData.Mins = String(Duration.getMinutes());*/

						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;

						aNavAdditive[this._ExpRef] = oPCExpModelData;							
						DefaultModel.refresh();
						this.onNavBack();

					}
					else if(oPCExpModelData.Action=="U" || oPCExpModelData.Action==""){

						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);	
						/*var Duration = oPCExpModelData.Duration; 
						var hrs = Duration.getHours();
						if (hrs.toString().length == 1) {
							hrs = "0" + hrs;
						}
						oPCExpModelData.Hours = hrs;
						oPCExpModelData.Mins = String(Duration.getMinutes());*/

						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;
						oPCExpModelData.Action = "U";
						aNavAdditive[this._ExpRef] = oPCExpModelData;							
						DefaultModel.refresh();
						this.onNavBack();

					}else {

						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);	
						/*var Duration = oPCExpModelData.Duration; 
						var hrs = Duration.getHours();
						if (hrs.toString().length == 1) {
							hrs = "0" + hrs;
						}
						oPCExpModelData.Hours = hrs;
						oPCExpModelData.Mins = String(Duration.getMinutes());*/

						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;
						//oPCExpModelData.Action = "U";
						aNavAdditive[this._ExpRef] = oPCExpModelData;							
						DefaultModel.refresh();
						this.onNavBack();
					}

				}else if(!oValidationError && oValidateMEAL.isSelectedZIP){

					if(oPCExpModelData.Action=="N"){
						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);	
						/*var Duration = oPCExpModelData.Duration; 
						var hrs = Duration.getHours();
						if (hrs.toString().length == 1) {
							hrs = "0" + hrs;
						}
						oPCExpModelData.Hours = hrs;
						oPCExpModelData.Mins = String(Duration.getMinutes());*/

						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;
						oPCExpModelData.Action = "C";
						// calling Util Method for paycode reference
						var sPaycode = oPCExpModelData.Paycode;
						var ExpTypeRef = FetchValueHelp.getExpType(sExpType);
						oPCExpModelData.ExpenseTypeRef = ExpTypeRef;
						if(ExpTypeRef.Paycodes != undefined || ExpTypeRef.Paycodes.length >= 0){

							oPCExpModelData.ExpenseRef = FetchValueHelp.getExpense(sExpType,sPaycode);

						}

						aNavAdditive.push(oPCExpModelData);							
						DefaultModel.refresh();

						this.onNavBack();
					}else if(oPCExpModelData.Action=="C"){						
						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);	
						/*var Duration = oPCExpModelData.Duration; 
						var hrs = Duration.getHours();
						if (hrs.toString().length == 1) {
							hrs = "0" + hrs;
						}
						oPCExpModelData.Hours = hrs;
						oPCExpModelData.Mins = String(Duration.getMinutes());*/

						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;						
						aNavAdditive[this._ExpRef] = oPCExpModelData;							
						DefaultModel.refresh();
						this.onNavBack();
					}					
					else if(oPCExpModelData.Action=="U" || oPCExpModelData.Action==""){

						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);	
						/*var Duration = oPCExpModelData.Duration; 
						var hrs = Duration.getHours();
						if (hrs.toString().length == 1) {
							hrs = "0" + hrs;
						}
						oPCExpModelData.Hours = hrs;
						oPCExpModelData.Mins = String(Duration.getMinutes());*/

						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;
						oPCExpModelData.Action = "U";
						aNavAdditive[this._ExpRef] = oPCExpModelData;							
						DefaultModel.refresh();
						this.onNavBack();

					}else {

						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);	
						/*var Duration = oPCExpModelData.Duration; 
						var hrs = Duration.getHours();
						if (hrs.toString().length == 1) {
							hrs = "0" + hrs;
						}
						oPCExpModelData.Hours = hrs;
						oPCExpModelData.Mins = String(Duration.getMinutes());*/

						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;
						//oPCExpModelData.Action = "U";
						aNavAdditive[this._ExpRef] = oPCExpModelData;							
						DefaultModel.refresh();
						this.onNavBack();
					}


				}else{

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

				}
				break;

			case 'VHCL':
				var sPaycode = oPCExpModelData.Paycode;
				var sTrvlCode = oPCExpModelData.TravelCode;
				var sMiles = oPCExpModelData.Miles;
				var sDZip = oPCExpModelData.DestinationZip;
				var sDCity = oPCExpModelData.DestinationCity;
				var sDState = oPCExpModelData.DestinationState;
				var sOZip = oPCExpModelData.OriginZip;
				var sOCity = oPCExpModelData.OriginCity;
				var sOState = oPCExpModelData.OriginState;
				var sStTime = oPCExpModelData.StEPOC.getHours()+ oPCExpModelData.StEPOC.getMinutes();
				var sDuration = oPCExpModelData.Duration.getHours()+ oPCExpModelData.Duration.getMinutes();

				var oValidateVHCL = Validators.ValidationVHCL(sPaycode, sTrvlCode, sMiles, sDZip, sDCity, sDState, sOZip, sOCity, sOState, sStTime, sDuration);				
				var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
				var oValidationError = false;
				var sWarningBody = "";

				if(oValidateVHCL.isPayCodeNull){

					sWarningBody = bundle.getText("tne.pcEmp.msg.PayCodeNullError") + "\n\n";
					oValidationError = true;
				}

				/*if(oValidateVHCL.isDurationNull){

					sWarningBody = sWarningBody + bundle.getText("tne.pcEmp.msg.DurationNullError")+ "\n\n";
					oValidationError = true;
				}*/

				if(oValidateVHCL.isTrvlCodeBlank){

					sWarningBody = sWarningBody + bundle.getText("tne.pcEmp.msg.TrvlCodeNullError")+ "\n\n";
					oValidationError = true;
				}			

				if(oValidateVHCL.isMilesZero){

					sWarningBody = sWarningBody + bundle.getText("tne.pcEmp.msg.MilesNullError")+ "\n\n";
					oValidationError = true;
				}

				if(oValidateVHCL.isZipCityStateNull){

					sWarningBody = sWarningBody + bundle.getText("tne.pcEmp.msg.ZipCityStateNullError")+ "\n\n";
					oValidationError = true;
				}
				if(oValidateVHCL.isStTimeNull){

					sWarningBody = sWarningBody + bundle.getText("tne.pcEmp.msg.StTimeNullError")+ "\n\n";
					oValidationError = true;
				}

				if(oValidationError){

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
					if(oPCExpModelData.Action=="N"){
						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);	

						var StHr = oPCExpModelData.StEPOC.getHours();
						var StMn = oPCExpModelData.StEPOC.getMinutes();
						StHr = String(StHr);
						StMn = String(StMn);
						if (StHr.length == 1) {
							StHr = "0" + StHr;
						}
						oPCExpModelData.StartTime.ms = DateAndTimeConversion.convertHHmmToMilliSec(StHr+StMn);

						var EtHr = oPCExpModelData.EtEPOC.getHours();
						var EtMn = oPCExpModelData.EtEPOC.getMinutes();
						EtHr = String(EtHr);
						EtMn = String(EtMn);
						if (EtHr.length == 1) {
							EtHr = "0" + EtHr;
						}
						oPCExpModelData.EndTime.ms = DateAndTimeConversion.convertHHmmToMilliSec(EtHr+EtMn);

						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;
						oPCExpModelData.Action = "C";
						// calling Util Method for paycode reference
						var sPaycode = oPCExpModelData.Paycode;
						var ExpTypeRef = FetchValueHelp.getExpType(sExpType);
						oPCExpModelData.ExpenseTypeRef = ExpTypeRef;
						if(ExpTypeRef.Paycodes != undefined || ExpTypeRef.Paycodes.length >= 0){

							oPCExpModelData.ExpenseRef = FetchValueHelp.getExpense(sExpType,sPaycode);

						}
						aNavAdditive.push(oPCExpModelData);							
						DefaultModel.refresh();
						this.onNavBack();

					}else if(oPCExpModelData.Action=="C"){

						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);	

						var StHr = oPCExpModelData.StEPOC.getHours();
						var StMn = oPCExpModelData.StEPOC.getMinutes();
						StHr = String(StHr);
						StMn = String(StMn);
						if (StHr.length == 1) {
							StHr = "0" + StHr;
						}
						oPCExpModelData.StartTime.ms = DateAndTimeConversion.convertHHmmToMilliSec(StHr+StMn);

						var EtHr = oPCExpModelData.EtEPOC.getHours();
						var EtMn = oPCExpModelData.EtEPOC.getMinutes();
						EtHr = String(EtHr);
						EtMn = String(EtMn);
						if (EtHr.length == 1) {
							EtHr = "0" + EtHr;
						}
						oPCExpModelData.EndTime.ms = DateAndTimeConversion.convertHHmmToMilliSec(EtHr+EtMn);
						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;						
						aNavAdditive[this._ExpRef] = oPCExpModelData;							
						DefaultModel.refresh();
						this.onNavBack();						
					}

					else if(oPCExpModelData.Action=="U" || oPCExpModelData.Action==""){

						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);	

						var StHr = oPCExpModelData.StEPOC.getHours();
						var StMn = oPCExpModelData.StEPOC.getMinutes();
						StHr = String(StHr);
						StMn = String(StMn);
						if (StHr.length == 1) {
							StHr = "0" + StHr;
						}
						oPCExpModelData.StartTime.ms = DateAndTimeConversion.convertHHmmToMilliSec(StHr+StMn);

						var EtHr = oPCExpModelData.EtEPOC.getHours();
						var EtMn = oPCExpModelData.EtEPOC.getMinutes();
						EtHr = String(EtHr);
						EtMn = String(EtMn);
						if (EtHr.length == 1) {
							EtHr = "0" + EtHr;
						}
						oPCExpModelData.EndTime.ms = DateAndTimeConversion.convertHHmmToMilliSec(EtHr+EtMn);


						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;
						oPCExpModelData.Action = "U";
						aNavAdditive[this._ExpRef] = oPCExpModelData;							
						DefaultModel.refresh();

						this.onNavBack();

					}else {

						var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);	

						var StHr = oPCExpModelData.StEPOC.getHours();
						var StMn = oPCExpModelData.StEPOC.getMinutes();
						StHr = String(StHr);
						StMn = String(StMn);
						if (StHr.length == 1) {
							StHr = "0" + StHr;
						}
						oPCExpModelData.StartTime.ms = DateAndTimeConversion.convertHHmmToMilliSec(StHr+StMn);

						var EtHr = oPCExpModelData.EtEPOC.getHours();
						var EtMn = oPCExpModelData.EtEPOC.getMinutes();
						EtHr = String(EtHr);
						EtMn = String(EtMn);
						if (EtHr.length == 1) {
							EtHr = "0" + EtHr;
						}
						oPCExpModelData.EndTime.ms = DateAndTimeConversion.convertHHmmToMilliSec(EtHr+EtMn);


						delete oPCExpModelData.Duration;
						delete oPCExpModelData.StEPOC;
						delete oPCExpModelData.EtEPOC;

						aNavAdditive[this._ExpRef] = oPCExpModelData;							
						DefaultModel.refresh();

						this.onNavBack();

					}						

				}											

				break;
			};



		},

		handleDeleteExp: function(){
			var oPCExpModelData = this.getView().getModel().getData();
			var actionFlag = oPCExpModelData.Action;
						
			if(actionFlag == "C" || actionFlag == "D" || actionFlag == "U" || actionFlag == ""){
				var DefaultModel = sap.ui.getCore().getModel();	
				var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
				var sPath = context.sPath;			
				var aNavAdditive = DefaultModel.getProperty(sPath);
				
				delete oPCExpModelData.Duration;
				delete oPCExpModelData.StEPOC;
				delete oPCExpModelData.EtEPOC;

				oPCExpModelData.Action = "D";
				aNavAdditive[this._ExpRef] = oPCExpModelData;
				DefaultModel.refresh();
				//sap.ui.getCore().byId("tne.pcEmp.tbl_pcEmp_Expense").getModel.refresh();
				this.onNavBack();
			}

		},

		/**
		 * called when back arrow is clicked 
		 * validates the screen componets and shows error messages
		 * navigates to previous screen		
		 * @private
		 * @memberOf tne.pcViewExp
		 * @returns null
		 */

		_handlePageExit:function(mCallback){
			//compare current screen state vs before load
			var oCall = function(){};
			var that = this;
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();	
			var validationRef = that._compareObjectState();
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
									//var context = that.getView().getBindingContext();
									
									var oCurrentObject = that.getView().getModel();
									oCurrentObject.setData(that._dataBeforeShow);
									that._dataBeforeShow = undefined;  //TODO: Check if this is valid, will it invalidate the oCurrent Object as well?
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
		 * Method to Delete a  expense 	
		 * @private
		 * @memberOf tne.pcViewExp
		 * @returns null
		 */


		/**
		 * Method to validate the screen objects		
		 * @private
		 * @memberOf tne.pcViewExp
		 * @returns null
		 */
		_compareObjectState: function(){
			var oCurrentObject = this.getView().getModel().getData();
			var oOriginalObject = this._dataBeforeShow;			

			if(oOriginalObject.Action != oCurrentObject.Action)
				return false;

			if(oOriginalObject.AdditiveType != oCurrentObject.AdditiveType)
				return false;

			if(oOriginalObject.Comments != oCurrentObject.Comments)
				return false;

			if(oOriginalObject.DestinationCity != oCurrentObject.DestinationCity)
				return false;

			if(oOriginalObject.DestinationState != oCurrentObject.DestinationState)
				return false;

			if(oOriginalObject.DestinationZip != oCurrentObject.DestinationZip)
				return false;

			if(oOriginalObject.Duration != oCurrentObject.Duration)
				return false;

			if(oOriginalObject.EmpId != oCurrentObject.EmpId)
				return false;

			if(oOriginalObject.EtEPOC != oCurrentObject.EtEPOC)
				return false;

			if(oOriginalObject.GangId != oCurrentObject.GangId)
				return false;

			if(oOriginalObject.Hours != oCurrentObject.Hours)
				return false;

			if(oOriginalObject.LineSegment != oCurrentObject.LineSegment)
				return false;

			if(oOriginalObject.MilePost != oCurrentObject.MilePost)
				return false;

			if(oOriginalObject.Miles != oCurrentObject.Miles)
				return false;

			if(oOriginalObject.Mins != oCurrentObject.Mins)
				return false;

			if(oOriginalObject.OriginCity != oCurrentObject.OriginCity)
				return false;

			if(oOriginalObject.OriginState != oCurrentObject.OriginState)
				return false;

			if(oOriginalObject.OriginZip != oCurrentObject.OriginZip)
				return false;

			if(oOriginalObject.Paycode != oCurrentObject.Paycode)
				return false;

			if(oOriginalObject.PaycodeType != oCurrentObject.PaycodeType)
				return false;

			if(oOriginalObject.StEPOC != oCurrentObject.StEPOC)
				return false;

			if(oOriginalObject.StartTime.ms != oCurrentObject.StartTime.ms)
				return false;

			if(oOriginalObject.TravelCode != oCurrentObject.TravelCode)
				return false;

			if(oOriginalObject.WorkDate != oCurrentObject.WorkDate)
				return false;


		},

//		***********************************************************************************************************

		/**
		 * Method initialised on live change of Line Segment value 		
		 * @private
		 * @memberOf tne.pcViewExp
		 * @returns null
		 */
		inlivechangeLS:function(oEvent)
		{
			var oTextFieldFrLS= sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.LS")
			oTextFieldFrLS.setModel(sap.ui.getCore().getModel('oModelForLineSegValueHlp'));
			sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.AssembPoint").setModel(sap.ui.getCore().getModel('oModelForLineSegValueHlp'));
			sap.ui.getCore().getModel('oModelForLineSegValueHlp').setProperty('/LineSegment',{})
			oTextFieldFrLS.bindAggregation('suggestionItems','/items', new sap.ui.core.Item({text:'{LineSegment}'}));
		}, 
		/**
		 * Method initialised on Selecting a suggestion item of Line Segment value 		
		 * @private
		 * @memberOf tne.pcViewExp
		 * @returns null
		 */
		suggestionForLS:function(oEvent)
		{

			var oController=this;	
			var oUiModel=this.getModel();
			var oPCExpModelData = this.getView().getModel().getData();

			var oTextFieldFrLS= sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.LS");
			var oLabelBMPEMPRange=sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.AssembPoint");		

			var item = oEvent.getParameters('selectedItem');		
			var source =oEvent.getSource();

			if(item != undefined){
				var path = item.selectedItem.getBindingContext().sPath;
				var range = "BMP "+source.getModel().getProperty(path+"/BMP")+" - "+"EMP "+source.getModel().getProperty(path+"/EMP");	
				var sLS = source.getModel().getProperty(path+"/LineSegment");

				oPCExpModelData.ExpenseTypeRef.LineSegmentRef = FetchValueHelp.getLineSegment(sLS)

				oTextFieldFrLS.setValue(source.getModel().getProperty(path+"/LineSegment"));
				//sap.ui.getCore().getModel().setProperty('selGang/valueHelp/LineSegments',item.selectedItem.getText())
				oLabelBMPEMPRange.setText(range);
				oLabelBMPEMPRange.setBindingContext(path);
			}	

		}, 

		/**
		 * Method initialised on change of Line Segment value 		
		 * @private
		 * @memberOf tne.pcViewExp
		 * @returns null
		 */

		LSChange:function()
		{
			var oUiModel=this.getModel();
			var oPCExpModelData = this.getView().getModel().getData();
			var oController=this;			
			var oTextFieldFrLS= sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.LS");
			var oLabelBMPEMPRange=sap.ui.core.Fragment.byId("myFragMEAL","tne.pcViewExp.frg.AssembPoint");			
			var sLS = oPCExpModelData.LineSegment;
			var LineSegmentRef = FetchValueHelp.getLineSegment(sLS);
			var range = "BMP "+LineSegmentRef.BMP+" - "+"EMP "+LineSegmentRef.EMP;	
			oTextFieldFrLS.setValue(sLS);
			oLabelBMPEMPRange.setText(range);
		},
//		***********************************************************************************************************

		/**
		 * Formatters For XML elements
		 */
		formatDuration: function(Hours, Mins){			
			var DurationHHmm = Hours+Mins;
			var DurMilliSec = com.bnsf.eam.tne.util.DateAndTimeConversion.convertHHmmToMilliSec(DurationHHmm);	
			var Duration = com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(DurMilliSec);
			return Duration; 
		},

		formatTime: function(ms){

			var time = com.bnsf.eam.tne.util.DateAndTimeConversion.displayValueDate(ms);
			return time;
		},

		formatRadioButton: function(sZip){

			if(sZip == undefined || sZip == "" || sZip == "00") {
				this._ControllsVisible(0);
				return 0;
			}else{
				this._ControllsVisible(1);
				return 1;

			}

		},
		
		DeleteExpformatter: function(sAction){
			
			if(sAction == "N"){
				return false;
			}else{
				return true;
			}
			
		}

	});

	return PCViewExpController;

});