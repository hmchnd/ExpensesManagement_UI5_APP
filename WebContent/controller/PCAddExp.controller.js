sap.ui.define([
'com/bnsf/eam/tne/controller/BaseController',
'com/bnsf/eam/tne/util/DateAndTimeConversion',
'com/bnsf/eam/tne/util/UserNameFormatter',
'com/bnsf/eam/tne/util/Validators',
'sap/ui/model/json/JSONModel',
'sap/m/MessageBox',
'com/bnsf/eam/tne/util/ServiceErrorHandler',
'com/bnsf/eam/tne/util/FetchValueHelps'
], function(BaseController, DateAndTimeConversion, UserNameFormatter, Validators,JSONModel,MessageBox,ServiceErrorHandler,FetchValueHelp) {
	"use strict";

	var PCAddExpController = BaseController.extend("com.bnsf.eam.tne.controller.PCAddExp", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf system
		 */
		onInit : function (oEvent) {	          		
		/*	var oUiModel = this.getModel();
			this.setModel(oUiModel);*/
			
			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);           	
		},

		/**
		 * On route matched for PCAddExp screen
		 * Instantiates PCAddExp screen elements
		 * @private
		 * @memberOf tne.pcAddExp
		 * @returns null
		 */
		_onRouteMatched:function(oEvent){
			var sRoute = oEvent.getParameter("name");
			var oArgs= oEvent.getParameter("arguments"); 
			if(sRoute == "PCAddExp"){ 	        				
				this._loadSelectedEmployees();	//Load the view data
			}
		},

		_loadSelectedEmployees:function()
		{        			        			
			
			var oPCAddExpMulEmpModel = sap.ui.getCore().getModel("oPCAddExpMulEmpModel");	//Getting the model which was set in Lineup Controller        			
			this.getView().byId("tne.pcAddExp.tokenizer").setModel(oPCAddExpMulEmpModel); 

			var oAddExpenseDetailsModel = sap.ui.getCore().getModel("oAddExpenseDetailsModel");
			this.getView().setModel(oAddExpenseDetailsModel);

			this._dataBeforeShow = jQuery.extend(true, {}, oAddExpenseDetailsModel.getData());

			var ExpTypeDropDown = this.getView().byId("tne.pcAddExp.ExpType").setModel(new sap.ui.model.json.JSONModel(this.getModel().getProperty("/selGang/valueHelp/ExpType")));
			this.getView().byId("tne.pcAddExp.ExpType").setEnabled(true);

			var sExpType = sap.ui.getCore().getModel("oAddExpenseDetailsModel").getData().AdditiveType;
			ExpTypeDropDown.setSelectedKey(sExpType);

			this._handleExpenseTypeChange(sExpType);
		},

		/**
		 * On Change of expense type from the dropdown 
		 * appropriate fragment will be loaded
		 * @private
		 * @memberOf tne.pcAddExp
		 * @returns null
		 */

		onExpChange: function(){

			var sExpType = this.getView().byId("tne.pcAddExp.ExpType").getSelectedKey();

			this._handleExpenseTypeChange(sExpType);

		},

		// setting default expense type to the panel
		_handleExpenseTypeChange: function(sExpType){

			var selectedGangTitle = this.getModel().getProperty("/selGang/id");		
			var userID = this.getModel().getProperty('/user/id');
			var selectedDateTime = this.getModel().getProperty("/selGang/workDate");
			selectedDateTime = new Date(selectedDateTime);  

			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);

			var oValueHelpModel = sap.ui.getCore().getModel("oValueHelpModel");
			var oAddExpenseDetailsModel = sap.ui.getCore().getModel("oAddExpenseDetailsModel");


			var oPanelContainer = this.getView().byId("tne.pcAddExp.panel");	

			switch(sExpType){
			case 'VHCL':				
				oPanelContainer.destroyContent();
				oAddExpenseDetailsModel.getData().AdditiveType = sExpType;
				var fragVHCL = sap.ui.xmlfragment("pcAddExp.Frag.VHCL","com.bnsf.eam.tne.fragments.ExpenseTypeVHCL",this);
				var ExpTypeRef = FetchValueHelp.getExpType(sExpType);
				oAddExpenseDetailsModel.getData().ExpenseTypeRef = ExpTypeRef;
				if(ExpTypeRef.Paycodes == undefined || ExpTypeRef.Paycodes.length <= 0){

					var ExpRef = FetchValueHelp.getExpense(sExpType);

				}/*else{

					oAddExpenseDetailsModel.getData().Paycode = ExpTypeRef.Paycodes[0].Code;					
				}*/
				var TrvlCodeRef = FetchValueHelp.getTravelCode(sExpType);			
				oPanelContainer.addContent(fragVHCL);	
				break;

			case 'DIFF': 
				oAddExpenseDetailsModel.getData().AdditiveType = sExpType;
				oPanelContainer.destroyContent();
				var fragDIFF = sap.ui.xmlfragment("pcAddExp.Frag.DIFF","com.bnsf.eam.tne.fragments.ExpenseTypeDIFF",this);
				var ExpTypeRef = FetchValueHelp.getExpType(sExpType);
				oAddExpenseDetailsModel.getData().ExpenseTypeRef = ExpTypeRef;
				if(ExpTypeRef.Paycodes == undefined || ExpTypeRef.Paycodes.length <= 0){

					var ExpRef = FetchValueHelp.getExpense(sExpType);

				}
				oPanelContainer.addContent(fragDIFF);	
				break;

			case 'MEAL':
				oAddExpenseDetailsModel.getData().AdditiveType = sExpType;
				oPanelContainer.destroyContent();
				var fragMEAL = sap.ui.xmlfragment("pcAddExp.Frag.MEAL","com.bnsf.eam.tne.fragments.ExpenseTypeMEAL",this);
				var ExpTypeRef = FetchValueHelp.getExpType(sExpType);
				var LineSegRef = FetchValueHelp.getLineSegment();				
				oAddExpenseDetailsModel.getData().ExpenseTypeRef = ExpTypeRef;
				oAddExpenseDetailsModel.getData().ExpenseTypeRef.LineSegment = LineSegRef;
				if(ExpTypeRef.Paycodes == undefined || ExpTypeRef.Paycodes.length <= 0){

					var ExpRef = FetchValueHelp.getExpense(sExpType);

				}/*else{

					oAddExpenseDetailsModel.getData().Paycode = ExpTypeRef.Paycodes[0].Code;
				}*/;	
				if(ExpTypeRef.LineSegment == undefined || ExpTypeRef.LineSegment.length <= 0){

					ExpTypeRef.LineSegment = this.getModel().getProperty("/selGang/valueHelp/LineSegments");

				}/*else{

					oAddExpenseDetailsModel.getData().LineSegment = ExpTypeRef.LineSegment[0].Code;
				}*/;
				oPanelContainer.addContent(fragMEAL);
				break;
			};

		},


		/**
		 * On Deleting token from employee tokenizer		 
		 * @private
		 * @memberOf tne.pcAddExp
		 * @returns null
		 */
		_deleteToken:function(evt)
		{
			var token=evt.getParameter('token');
			var oBindingInfo = this.getView().byId("tne.pcAddExp.tokenizer").getBindingInfo('tokens');
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
			this.getView().byId("tne.pcAddExp.tokenizer").getModel().refresh();

		},

		onExit: function(){
			var oPanelContainer = this.getView().byId("tne.pcAddExp.panel");
			oPanelContainer.destroyContent();
		},

		/**
		 * called when the radio  button selection changed in MEAL expense type		
		 * @private
		 * @memberOf tne.pcAddExp
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

				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.lbl.AssembPoint").setVisible(false);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.AssembPoint").setVisible(false);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.lbl.LS").setVisible(false);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.LS").setVisible(false);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.lbl.Milepost").setVisible(false);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.Milepost").setVisible(false);

				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.lbl.ZIP").setVisible(true);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.ZIP").setVisible(true);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.lbl.Hotel").setVisible(true);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.Hotel").setVisible(true);

			}else{

				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.lbl.ZIP").setVisible(false);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.ZIP").setVisible(false);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.lbl.Hotel").setVisible(false);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.Hotel").setVisible(false);


				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.lbl.AssembPoint").setVisible(true);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.AssembPoint").setVisible(true);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.lbl.LS").setVisible(true);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.LS").setVisible(true);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.lbl.Milepost").setVisible(true);
				sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.Milepost").setVisible(true);	
			}	

		},

//		***********************************************************************************************************

		/**
		 * Method initialised on live change of Line Segment value 		
		 * @private
		 * @memberOf tne.pcAddExp
		 * @returns null
		 */
		inlivechangeLS:function(oEvent)
		{
			var oTextFieldFrLS= sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.LS")
			oTextFieldFrLS.setModel(sap.ui.getCore().getModel('oModelForLineSegValueHlp'));
			sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.AssembPoint").setModel(sap.ui.getCore().getModel('oModelForLineSegValueHlp'));
			sap.ui.getCore().getModel('oModelForLineSegValueHlp').setProperty('/LineSegment',{})
			oTextFieldFrLS.bindAggregation('suggestionItems','/items', new sap.ui.core.Item({text:'{LineSegment}'}));
		}, 

		/**
		 * Method initialised on Selecting a suggestion item of Line Segment value 		
		 * @private
		 * @memberOf tne.pcAddExp
		 * @returns null
		 */
		suggestionForLS:function(oEvent)
		{

			var oController=this;	
			var oUiModel=this.getModel();
			var oPCExpModelData = this.getView().getModel().getData();

			var oTextFieldFrLS= sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.LS");
			var oLabelBMPEMPRange=sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.AssembPoint");		

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
		 * @memberOf tne.pcAddExp
		 * @returns null
		 */
		LSChange:function()
		{
			var oUiModel=this.getModel();
			var oPCExpModelData = this.getView().getModel().getData();
			var oController=this;			
			var oTextFieldFrLS= sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.LS");
			var oLabelBMPEMPRange=sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.AssembPoint");			
			var sLS = oPCExpModelData.LineSegment;
			var LineSegmentRef = FetchValueHelp.getLineSegment(sLS);
			var range = "BMP "+LineSegmentRef.BMP+" - "+"EMP "+LineSegmentRef.EMP;	
			oTextFieldFrLS.setValue(sLS);
			oLabelBMPEMPRange.setText(range);
		},		 

//		***********************************************************************************************************


		/**
		 * called when back arrow is clicked 
		 * validates the screen componets and shows error messages
		 * navigates to previous screen		
		 * @private
		 * @memberOf tne.pcAddExp
		 * @returns null
		 */
		handlePageExit:function(){
			this._handlePageExit(this.onNavBack);

		},
		/**
		 * called when Cancell is clicked 
		 * validates the screen componets and shows error messages
		 * navigates to previous screen		
		 * @private
		 * @memberOf tne.pcAddExp
		 * @returns null
		 */
		handlePCAddExpCancel: function(){
			this._handlePageExit(this.onNavBack);
		},
		/**
		 * called when Save button from page footer is clicked
		 * validates respective validations and 
		 * pushes the expense details to the default Model		
		 * @private
		 * @memberOf tne.pcAddExp
		 * @returns null
		 */
		handlePCAddExpSave: function(){

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
						/*var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);	*/
						var oPCAddExpMulEmpModel = sap.ui.getCore().getModel("oPCAddExpMulEmpModel");
						var oPCAddExpMulEmpModelData = oPCAddExpMulEmpModel.getData();

						for(var i = 0; i<oPCAddExpMulEmpModelData.length; i++){
							var oPCExpModelDataCopy = $.extend(true, {},oPCExpModelData);
							
							oPCExpModelDataCopy.EmpId = oPCAddExpMulEmpModelData[i].EmpId;
							
							var Duration = oPCExpModelData.Duration; 
							var hrs = Duration.getHours();
							if (hrs.toString().length == 1) {
								hrs = "0" + hrs;
							}
							oPCExpModelDataCopy.Hours = hrs;
							oPCExpModelDataCopy.Mins = String(Duration.getMinutes());


							delete oPCExpModelDataCopy.Duration;
							delete oPCExpModelDataCopy.StEPOC;
							delete oPCExpModelDataCopy.EtEPOC;


							oPCExpModelDataCopy.Action = "C";
							// calling Util Method for paycode reference
							var sPaycode = oPCExpModelDataCopy.Paycode;
							var ExpTypeRef = FetchValueHelp.getExpType(sExpType);
							oPCExpModelDataCopy.ExpenseTypeRef = ExpTypeRef;
							if(ExpTypeRef.Paycodes != undefined || ExpTypeRef.Paycodes.length >= 0){

								oPCExpModelDataCopy.ExpenseRef = FetchValueHelp.getExpense(sExpType,sPaycode);

							}						
							oPCAddExpMulEmpModelData[i].NavAdditiveDetail.results.push(oPCExpModelDataCopy);							
							oPCAddExpMulEmpModel.refresh();	
						}

						this.onNavBack();

					}
				}
				break;

			case 'MEAL':
				oPCExpModelData.LineSegment = sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frg.LS").getValue();

				var sPaycode = oPCExpModelData.Paycode;
				var sIndex = sap.ui.core.Fragment.byId("pcAddExp.Frag.MEAL","tne.pcViewExp.frag.RBG.Hours").getSelectedIndex();
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
						/*var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);*/
						var oPCAddExpMulEmpModel = sap.ui.getCore().getModel("oPCAddExpMulEmpModel");
						var oPCAddExpMulEmpModelData = oPCAddExpMulEmpModel.getData();

						for(var i = 0; i<oPCAddExpMulEmpModelData.length; i++){

							oPCExpModelData.EmpId = oPCAddExpMulEmpModelData[i].EmpId;

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

							oPCAddExpMulEmpModelData[i].NavAdditiveDetail.results.push(oPCExpModelData);							
							oPCAddExpMulEmpModel.refresh();

						}


						this.onNavBack();

					}
				}else if(!oValidationError && oValidateMEAL.isSelectedZIP){

					if(oPCExpModelData.Action=="N"){
						/*var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);	*/

						var oPCAddExpMulEmpModel = sap.ui.getCore().getModel("oPCAddExpMulEmpModel");
						var oPCAddExpMulEmpModelData = oPCAddExpMulEmpModel.getData();

						for(var i = 0; i<oPCAddExpMulEmpModelData.length; i++){

							oPCExpModelData.EmpId = oPCAddExpMulEmpModelData[i].EmpId;							
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

							oPCAddExpMulEmpModelData[i].NavAdditiveDetail.results.push(oPCExpModelData);							
							oPCAddExpMulEmpModel.refresh();

						}				

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
						/*var DefaultModel = sap.ui.getCore().getModel();	
						var context = DefaultModel.getContext('/selGang/pcTreeDisplay/categories/'+this._EmpIdRef+'/EmpReference/NavAdditiveDetail/results');
						var sPath = context.sPath;			
						var aNavAdditive = DefaultModel.getProperty(sPath);*/

						var oPCAddExpMulEmpModel = sap.ui.getCore().getModel("oPCAddExpMulEmpModel");
						var oPCAddExpMulEmpModelData = oPCAddExpMulEmpModel.getData();

						for(var i = 0; i<oPCAddExpMulEmpModelData.length; i++){
							var oPCExpModelDataCopy = $.extend(true, {},oPCExpModelData);
							
							oPCExpModelDataCopy.EmpId = oPCAddExpMulEmpModelData[i].EmpId;
							
							var StHr = oPCExpModelData.StEPOC.getHours();
							var StMn = oPCExpModelData.StEPOC.getMinutes();
							StHr = String(StHr);
							StMn = String(StMn);
							if (StHr.length == 1) {
								StHr = "0" + StHr;
							}
							oPCExpModelDataCopy.StartTime.ms = DateAndTimeConversion.convertHHmmToMilliSec(StHr+StMn);

							var EtHr = oPCExpModelDataCopy.EtEPOC.getHours();
							var EtMn = oPCExpModelDataCopy.EtEPOC.getMinutes();
							EtHr = String(EtHr);
							EtMn = String(EtMn);
							if (EtHr.length == 1) {
								EtHr = "0" + EtHr;
							}
							oPCExpModelDataCopy.EndTime.ms = DateAndTimeConversion.convertHHmmToMilliSec(EtHr+EtMn);

							delete oPCExpModelDataCopy.Duration;
							delete oPCExpModelDataCopy.StEPOC;
							delete oPCExpModelDataCopy.EtEPOC;
							oPCExpModelDataCopy.Action = "C";
							// calling Util Method for paycode reference
							var sPaycode = oPCExpModelDataCopy.Paycode;
							var ExpTypeRef = FetchValueHelp.getExpType(sExpType);
							oPCExpModelDataCopy.ExpenseTypeRef = ExpTypeRef;
							if(ExpTypeRef.Paycodes != undefined || ExpTypeRef.Paycodes.length >= 0){

								oPCExpModelDataCopy.ExpenseRef = FetchValueHelp.getExpense(sExpType,sPaycode);

							}
							oPCAddExpMulEmpModelData[i].NavAdditiveDetail.results.push(oPCExpModelDataCopy);							
							oPCAddExpMulEmpModel.refresh();


						}
						this.onNavBack();

					}					

				}											

				break;
			};



		},

		/**
		 * called when back arrow is clicked 
		 * validates the screen componets and shows error messages
		 * navigates to previous screen		
		 * @private
		 * @memberOf tne.pcAddExp
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
		 * Method to validate the screen objects		
		 * @private
		 * @memberOf tne.pcAddExp
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

		/**
		 * Formatter for Radio Button To be selected
		 * @param sZip
		 * @returns num
		 */
		formatRadioButton: function(sZip){

			if(sZip == undefined || sZip == "") {
				this._ControllsVisible(0);
				return 0;
			}else{
				this._ControllsVisible(1);
				return 1;

			}

		}
	});

	return PCAddExpController;




});