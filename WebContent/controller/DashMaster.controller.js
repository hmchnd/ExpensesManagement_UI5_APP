sap.ui.define([
               'jquery.sap.global',
               'sap/m/GroupHeaderListItem',
               'com/bnsf/eam/tne/controller/BaseController',
               'sap/ui/model/json/JSONModel',
               'com/bnsf/eam/tne/model/models',
               'com/bnsf/eam/tne/util/ServiceErrorHandler'
               ], function(jQuery, GroupHeaderListItem, BaseController,JSONModel,models,ServiceErrorHandler) {
	"use strict";

	var DashMasterController = BaseController.extend("com.bnsf.eam.tne.controller.DashMaster", {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf system
		 */
		onInit : function (oEvent) {
			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);
		},

		/**
		 * On route matched for Dash Master screen
		 * @private
		 * @memberOf tne.dashMaster
		 * @returns null
		 */
		_onRouteMatched: function(oEvent){
//			var oArgs;
//			var sRoute = oEvent.getParameter("name");
//			if(sRoute == "Dashboard")
//			this._initializeApp();
//			else if(sRoute == "DashDetailsCal" || sRoute == "DashDetailsMSg" || sRoute == "DashDetailsTR"){
//			oArgs = oEvent.getParameter("arguments");
//			this._initializeAppFromRoute(oArgs.GangId);
//			};
		},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * calling the function
		 * @memberOf system
		 */
		onAfterRendering:function(){
			this._initializeApp();
		},

		/**
		 * Validate user and get User data
		 * Check if GangID is passed and if it is valid, if Valid call Select date screen
		 * @private
		 * @memberOf tne.dashMaster
		 * @returns null
		 */
		_initializeApp:function(){

			var urlParamValues = {
					UserID: null,
					GangID: null,
					WorkDate: null
			};
			var urlParam = window.location.search.split("?");
			if (urlParam[1]!=undefined){
				var keyValuePairs = urlParam[1].split("&");
				var aKeyValues = [];

				for(var i=0;i<keyValuePairs.length;i++){
					var keyValueSeperated = keyValuePairs[i].split("=");
					if(undefined != keyValueSeperated[1] || keyValueSeperated[1] != ""){
						switch (keyValueSeperated[0]){
						case "UserID":
							urlParamValues.UserID = keyValueSeperated[1].toUpperCase();
							break;
						case "GangID":
							urlParamValues.GangID = keyValueSeperated[1].toUpperCase();
							break;
						case "WorkDate":
							urlParamValues.WorkDate = keyValueSeperated[1];
							break;
						default:
							break;	
						};
					};
				};
			};

			/*************************Start Changes for Prod release - Area 2***********************
			 *Toggle commented and uncommented*/
			//VAlidate user and get User data
			if(urlParamValues.UserID != null){
				sap.ui.getCore().getElementById("oTextFieldFrUId").setValue(urlParamValues.UserID);			
				//Check if GAngID is passed and if it is valid, if VAlid call Select date screen
				var validateUser = this._getUId(urlParamValues.UserID);
				if( validateUser && urlParamValues.GangID != null){ //Navigate to Gang passed in URL parameter
					var gangIDValidate = this._validateURLParamGang(urlParamValues.GangID);
					if(gangIDValidate){
						var bReplace = !sap.ui.getCore().getModel().getProperty("/deviceDetails/system/phone");
						var defaultModel = sap.ui.getCore().getModel();
						defaultModel.setProperty("/selGang/id", urlParamValues.GangID);
						this.getRouter().navTo('DashDetails', {GangId: urlParamValues.GangID}, bReplace);
//						sap.ui.controller("bnsf.eam.tne.controllers.Dashboard").goToSelectDate();
//						if(urlParamValues.WorkDate != null){
//						//Navigate to Work Date passed in URL parameter
//						var paramDate = new Date(Date.parse(urlParamValues.WorkDate));
//						var bValidWorkDate = sap.ui.controller("bnsf.eam.tne.controllers.SelectDate").validateURLParamWrkDate(paramDate);
//						if(bValidWorkDate){
//						//Set selected date and Navigate to Lineup screen
//						sap.ui.controller("bnsf.eam.tne.controllers.SelectDate").goToLineUp(paramDate);
//						}else{
//						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
//						sap.m.MessageToast.show(bundle.getText("UrlParamWorkDateFailMsg"), {
//						duration: 2000,                
//						width: "20em",                   
//						my: sap.ui.core.Popup.Dock.CenterCenter,             
//						at: sap.ui.core.Popup.Dock.CenterCenter,            
//						});
//						};
//						};
					}
					else{
						// replaced with messae toast (Abhishek C834469)
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						sap.m.MessageToast.show(bundle.getText("tne.dashMst.msg.oDataURlParamGangFailMsg")+" "+urlParamValues.GangID, {
							duration: 2000,                
							width: "20em",                   
							my: sap.ui.core.Popup.Dock.CenterCenter,             
							at: sap.ui.core.Popup.Dock.CenterCenter,            
						});

					};
				};
			}else{
				var favButton = this.getView().byId('toolbarSearch');
				this.getView().byId('tne.dashMst.oinputPopover').openBy(favButton);
			};



			/**************************End Changes for Prod release - Area 2*************************/
		},

		_initializeAppFromRoute: function(sGangId){
			var oURLParams = this._getURLQueryParams();
			if(oURLParams != null){	
				var validateUser = this._getUId(oURLParams.UserID);	

				if( validateUser && sGangId != null){ //Navigate to Gang passed in URL parameter
					var gangIDValidate = this._validateURLParamGang(sGangId);
					if(gangIDValidate){
						var bReplace = !sap.ui.getCore().getModel().getProperty("/deviceDetails/system/phone");
						var defaultModel = sap.ui.getCore().getModel();
						defaultModel.setProperty("/selGang/id", sGangId);
						this.getRouter().navTo('DashDetails', {GangId: sGangId}, bReplace);
					}else{
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						sap.m.MessageToast.show(bundle.getText("tne.dashMst.msg.oDataURlParamGangFailMsg")+" "+urlParamValues.GangID, {
							duration: 2000,                
							width: "20em",                   
							my: sap.ui.core.Popup.Dock.CenterCenter,             
							at: sap.ui.core.Popup.Dock.CenterCenter,            
						});
					};
				};
			};
		},

		/**
		 * Gets the Valid user ID
		 * calling the function
		 * @public
		 * @memberOf tne.dashMaster
		 * @returns null
		 */
		initializeAppFromPopup: function(){
			var UId = this.getView().byId("oTextFieldFrUId").getValue();
			this._getUId(UId)
		},

		_getURLQueryParams: function(){
			var urlParamValues = {
					UserID: null,
					GangID: null,
					WorkDate: null
			};
			var urlParam = window.location.search.split("?");
			if (urlParam[1]!=undefined){
				var keyValuePairs = urlParam[1].split("&");
				var aKeyValues = [];

				for(var i=0;i<keyValuePairs.length;i++){
					var keyValueSeperated = keyValuePairs[i].split("=");
					if(undefined != keyValueSeperated[1] || keyValueSeperated[1] != ""){
						switch (keyValueSeperated[0]){
						case "UserID":
							urlParamValues.UserID = keyValueSeperated[1].toUpperCase();
							break;
						case "GangID":
							urlParamValues.GangID = keyValueSeperated[1].toUpperCase();
							break;
						case "WorkDate":
							urlParamValues.WorkDate = keyValueSeperated[1];
							break;
						default:
							break;	
						};
					};
				};
				return urlParamValues;
			}else
				return null;
		},

		/**
		 * Validate user role and get User data
		 * Set all gangs for user
		 * @private
		 * @memberOf tne.dashMaster
		 * @returns boolean
		 */		
		_getUId:function(UId)
		{
			var oLocalModel = new JSONModel();
			var validationResult = false;
			var that=this;
			sap.ui.getCore().setModel(models.createTNEuiModel());		    
//			var UId = this.getView().byId("oTextFieldFrUId").getValue();
			sap.ui.getCore().getModel("userModel").read(
					/*************************Start Changes for Prod release - Area 3***********************
					 *Toggle commented and uncommented*/

					"/Users/?$filter=UserID eq '"+UId+"'",
//					"/Users",
					/**************************End Changes for Prod release - Area 3*************************/	
					null,
					null,
					false,
					function(oData, oResponse){
						try{
							/*************************Start Changes for Prod release - Area 4***********************
							 * Delete only*/					
							that.getView().byId("tne.dashMst.oinputPopover").close();				
							/**************************End Changes for Prod release - Area 4*************************/

							oLocalModel.setData(oData);
							var d = oResponse.data.results[0];					
							//		var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
							var modelUser = sap.ui.getCore().getModel();
							modelUser.setProperty("/user/role",d.RoleCode);
							modelUser.setProperty("/user/empNo",d.EmpNo);
							modelUser.setProperty("/user/id",d.UserID);
							modelUser.setProperty("/user/fName",d.FirstName);
							modelUser.setProperty("/user/mName",d.Middlename);
							modelUser.setProperty("/user/lName",d.LastName);
							modelUser.setProperty("/user/salutation",d.Salutation);
							var role = modelUser.getProperty("/user/role");					
							if(role == "T" ){
								//Set all gangs for user
								sap.ui.getCore().getModel("gangsModel").read(
										"/Gangs/?$filter=UserID eq '"+ d.UserID + "'",
										null,
										null,
										false,
										function(oDataGang, oResponseGang){
											try{	
												var locGangModel = sap.ui.getCore().getModel();

												var allGangs = oResponseGang.data.results;

												locGangModel.setProperty("/gangs", allGangs);

												that.getView().byId('tne.dashMst.LstGangs').setModel(locGangModel);
											}
											catch (e) {
												com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Dashboard - I01001: Error handling response in Get Gangs Service");
												validationResult = false;
											}

										},
										function(error){
											var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();								
											jQuery.sap.require("sap.m.MessageBox");
											try {
												com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.dashMst.msg.oDataGangFailureMsgHeader"),bundle.getText("tne.dashMst.msg.DashboardScreenErrorNumber"));
												validationResult = false;
											} catch (e) {
												com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Dashboard - I01002: Error handling exception in Get Gangs Service");
												validationResult = false;
											}
										}
								);	

								//			sap.ui.getCore().byId('idTitleOthersTitle').setVisible(false);
							}	
							else if(role == "U" ){
								//		sap.ui.getCore().byId('idTitleTitle').setVisible(false);
								//		sap.ui.getCore().byId('idTitleOthersTitle').setVisible(false);
								//		sap.ui.getCore().byId('idTitleAssnTitle').setVisible(false);		
							}
							else{
								//Set all gangs for user
								sap.ui.getCore().getModel("gangsModel").read(
										"/Gangs/?$filter=UserID eq '"+ d.UserID + "'",
										null,
										null,
										false,
										function(oDataGang, oResponseGang){
											try{


												//	sap.ui.getCore().getModel()

												var locGangModel = sap.ui.getCore().getModel();

												var allGangs = oResponseGang.data.results;

												locGangModel.setProperty("/gangs", allGangs);

												that.getView().byId('tne.dashMst.LstGangs').setModel(locGangModel);

											}catch (e){
												com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Dashboard - I01003: Error handling response in Get Gangs Service");
												validationResult = false;
											}
										},
										function(error){
											var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
											jQuery.sap.require("sap.m.MessageBox");						 			
											try {
												com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.dashMst.msg.oDataInvalidUserID"),bundle.getText("tne.dashMst.msg.DashboardScreenErrorNumber"));
												validationResult = false;
												/*sap.m.MessageBox.show(bundle.getText("InvalidUserID"), sap.m.MessageBox.Icon.ERROR, bundle.getText("CallFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass' );
       									 			sap.ui.getCore().getElementById("oTextFieldFrUId").setValue("");*/

											} catch (e) {
												com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Dashboard - I01004: Error handling exception in Get Gangs Service");
												validationResult = false;
											};
										}
								);						
							};
							validationResult = true;
						}catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Dashboard - I01005: Error handling response for Get User Details Service");
							validationResult = false;
						};
					},
					function(error){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						jQuery.sap.require("sap.m.MessageBox");	 			
						try {
							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.dashMst.msg.oDataCallFailureMsgHeader"),bundle.getText("tne.dashMst.msg.DashboardScreenErrorNumber"),function(){sap.ui.getCore().byId('myApp').to("idDashboardErrorReturn")});
							validationResult = false;	
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Dashboard - I01006: Error handling exception in Get User details Service");
							validationResult = false;
						}				
					}
			);	
			return validationResult;
		},    

		/**
		 * Validate user role and get User data
		 * finds Gang ID for selected Gang and other roles
		 * @private
		 * @memberOf tne.dashMaster
		 * @returns boolean
		 */	
		_validateURLParamGang: function(gangID) {
			var validationResult = false;
			var locGangModel = sap.ui.getCore().getModel("locGangModel");
			var selectedGang = null;
			var modelUser = sap.ui.getCore().getModel("uModel");
			var role = modelUser.getProperty("/userData/role");
			if ((role == "H") ||(role == "U")){
				var searchResult = sap.ui.controller("bnsf.pm.wc.tna.controllers.Dashboard")._searchfrmBackend(gangID);
				if(!searchResult)
					validationResult =  false;
				else{//loop through search result and check if a match is found
					var searchedGang=locGangModel.getProperty("/gangs/searchedGangs");
					for(var inc=0; inc<searchedGang.length; inc++){
						if(searchedGang[inc].GangID == gangID){
							locGangModel.setProperty("/gangs/selectedGang",searchedGang[inc]);
							locGangModel.setProperty("/gangs/selectedGang/GangTitle", searchedGang[inc].GangID);
							selectedGang = gangID;
						}
					}
					if(selectedGang == null)
						validationResult = false;
					else
						validationResult = true;
				};
			}else{//find Gang ID for other roles
				var gangs = locGangModel.getProperty("/gangs/allGangs")
				for(var i =0; i<gangs.length; i++){
					if(gangs[i].GangID == gangID){
						selectedGang = gangID;
						locGangModel.setProperty("/gangs/selectedGang", gangs[i]);
//						locGangModel.setProperty("/gangs/selectedGang/GangTitle", gangs[i].GangID);
						break;
					};

				};
				if(selectedGang == null)
					validationResult = false;
				else
					validationResult = true;
			};
			return validationResult;
		},

		/**
		 * Assigning the Title for the Gangs
		 * @public
		 * @memberOf tne.dashMaster
		 * @returns boolean
		 */
		groupGangs: function (oGroup){
			var sTitle = "";
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			switch (oGroup.key){
			case "A":
				sTitle = bundle.getText("tne.dashMst.lbl.GangTypeAssgn");
				break;
			case "O":
				sTitle = bundle.getText("tne.dashMst.lbl.GangTypeOthr");				
				break;
			default:
				sTitle = bundle.getText("tne.dashMst.lbl.GangTypeUnkwn");
			break;
			};
			return new GroupHeaderListItem( {
				title: sTitle,
				upperCase: false
			} );
		},

		/**
		 * Formatter for device details/system/phone
		 * @public
		 * @memberOf tne.dashMaster
		 * @returns string
		 */
		gangListTypeFormatter: function(){
			if(sap.ui.getCore().getModel().getProperty("/deviceDetails/system/phone"))
				return "Navigation";
			else
				return "Active";
		},



		/**
		 * Navigates to the dash details view
		 * @public
		 * @memberOf tne.dashMaster
		 * @returns null
		 */
		dispayGangDetails: function(oEvent) {			
			var bReplace = !sap.ui.getCore().getModel().getProperty("/deviceDetails/system/phone");
			var listContext = sap.ui.getCore().getElementById(oEvent.getSource().sId).getBindingContext().sPath;
			var defaultModel = sap.ui.getCore().getModel();
			var oSelGangContext = defaultModel.getProperty(listContext);
			defaultModel.setProperty("/selGang/id", oSelGangContext.GangID);	
			defaultModel.setProperty('/selGang/gangType', oSelGangContext.GangType);
			this.getRouter().navTo('DashDetails', {GangId: oSelGangContext.GangID}, bReplace);
		},

		/**
		 *  On load of Gangs selected the first entry in the list based on the roles of the User
		 *  so that the DashDetails shows the details for the first gang. 
		 * @public
		 * @memberOf tne.dashMaster
		 * @returns null
		 */
		selectFirstEvent:function(oEvent){
			var isPhone = sap.ui.getCore().getModel().getProperty("/deviceDetails/system/phone");
			
			if (!isPhone){ //select first event should not be fired for phone mode				
				var modelUser = this.getModel();
				var role = modelUser.getProperty("/user/role");
			
				if((role == "H") ||(role == "U")){// Help Desk = H, SuperUser = U, TimeKeeper = T
					var firstItem = this.getView().byId("tne.dashMst.LstGangs").getItems()[0];
					var listContextPath = this.getView().byId("tne.dashMst.LstGangs").getItems()[0].oBindingContexts.undefined.sPath;				
				}else{
					var firstItem = this.getView().byId("tne.dashMst.LstGangs").getItems()[1];
					var listContextPath = this.getView().byId("tne.dashMst.LstGangs").getItems()[1].oBindingContexts.undefined.sPath;
				};
	
				this.getView().byId("tne.dashMst.LstGangs").setSelectedItem(firstItem, true);
	
				var bReplace = !isPhone;	
							
				var defaultModel = sap.ui.getCore().getModel();
				var oSelGangContext = defaultModel.getProperty(listContextPath);
				defaultModel.setProperty("/selGang/id", oSelGangContext.GangID);	
				defaultModel.setProperty('/selGang/gangType', oSelGangContext.GangType);
				this.getRouter().navTo('DashDetails', {GangId: oSelGangContext.GangID}, bReplace);
			};
		},

		/**
		 * To handle the GangId search in the DashMaster SearchField
		 * search effect is achieved by using the user roles
		 * @public
		 * @memberOf tne.dashMaster
		 * @returns null
		 */
		searchGang: function(oEvent){		
			var query = this.getView().byId("tne.dashMst.TxtBxSearchGang").getValue();
			var sQuery = query.toUpperCase();

			var modelUser = this.getModel();
			var role = modelUser.getProperty("/user/role");

			if((role == "T") ||(role == "S"))
			{
				if(sQuery.length == 0){
					this.getView().byId('tne.dashMst.LstGangs').bindAggregation(
							"items", 
							"/gangs", 
							this.getView().byId('tne.dashMst.OLstItmGangs'));
				}else{
					this.inLiveChange();					
				}
			}
			else if((role == "H") ||(role == "U")){			
				this._mCallMethod('_searchfrmBackend',sQuery,this);				

			}
		},

		/**
		 * This event if fired during typing into the SearchField 
		 * and returns the currently entered value
		 * @public
		 * @memberOf tne.dashMaster
		 * @returns null
		 */
		inLiveChange:function(oEvent)
		{
			var modelUser = this.getModel();
			var role =modelUser.getProperty("/user/role");
			if((role == "H") ||(role == "U")){
				return;
			}
			var aFilters=[];
			var query =oEvent.getSource().getValue();
			var sQuery = query.toUpperCase();

			if (sQuery && sQuery.length > 0) {
				var filter = new sap.ui.model.Filter("GangTitle", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(filter);
			};

			// update list binding
			var list = this.getView().byId("tne.dashMst.LstGangs");			
			var binding = list.getBinding("items");
			binding.filter(aFilters, "Application");
		},

		/**
		 * Generic method to route backend calls 
		 * Handles busy indicator and service errors
		 * @private
		 * @memberOf tne.dashMaster
		 * @returns null
		 */
		_mCallMethod :function(pMethod,pEvent){
			var that=this;
			var oDummyModel = sap.ui.getCore().getModel( "userModel");	
			oDummyModel.fireRequestSent();

			oDummyModel.read('/ServerDetails',
					null,{}, true,
					function(oData, oResponse){
						try{
							that.getView().getController()._searchfrmBackend(pEvent);

							oDummyModel.fireRequestCompleted();
						}
						catch (e) {
							oDummyModel.fireRequestCompleted();
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Dashboard - I01013: Error handling response for Dummy service"); 
						}
					},
					function(error){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						try {
							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.dashMst.msg.oDataConnectionFailuremsgHeader"),bundle.getText("tne.dashMst.msg.DashboardScreenErrorNumber"));
							oDummyModel.fireRequestCompleted();

						} catch (e) {
							oDummyModel.fireRequestCompleted();
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Dashboard - I01014: Error handling exception for Dummy service");
						}
					});

		},

		/**
		 * Generic method to route backend calls 
		 * @private
		 * @memberOf tne.dashMaster
		 * @returns boolean
		 */
		_searchfrmBackend: function(oEvent){
			var that=this;
			var validationResult = false;
			var	UId = sap.ui.getCore().getModel().getProperty("/user/id");
			var oGangsModel  = sap.ui.getCore().getModel("gangsModel");		
			oGangsModel.read("Gangs?$filter=UserID eq '"+UId+"' and SearchTerm eq '"+oEvent+"'",		
					null,{}, false,
					function(oData, oResponse){
						try{
							var searchedGangs = [];
							for(var i=0; i<oData.results.length; i++){
								searchedGangs.push(oData.results[i]);					  
							};
							var mdlLocGang =  sap.ui.getCore().getModel();
							mdlLocGang.setProperty("/gangs/searchedGangs",searchedGangs);

							that.getView().byId('tne.dashMst.LstGangs').setModel(mdlLocGang);
							that.getView().byId('tne.dashMst.LstGangs').bindAggregation("items", 
									"/gangs/searchedGangs", 
									that.getView().byId('tne.dashMst.OLstItmGangs'));	
							validationResult = true;
						}catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Dashboard - I01008: Error reading Gangs from Search Gangs service");
							validationResult = false;
						}  
					},function(error){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						try {
							var mdlLocGang =  sap.ui.getCore().getModel();
							mdlLocGang.setProperty("/gangs/searchedGangs","");
							that.getView().byId('tne.dashMst.LstGangs').setModel(mdlLocGang);
							that.getView().byId('tne.dashMst.LstGangs').bindAggregation("items", 
									"/gangs/searchedGangs", 
									that.getView().byId('tne.dashMst.OLstItmGangs'));

							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.dashMst.msg.oDataGngFailureSearchMsgHeader"),bundle.getText("tne.dashMst.msg.DashboardScreenErrorNumber"));
							validationResult = false;		
						}catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Dashboard - I01010: Error handling exception for Search Gangs service");
							validationResult = false;
						}				  
					});
			return validationResult;
		},

		filterGangs:function(sPrefix){
			var allGangs = [];
			var aResult = [];
			var searchedGangs = [];
			aResult.push(sPrefix);
			for(var i=0; i<allGangs.length; i++){
				if(!sPrefix || jQuery.sap.startsWithIgnoreCase(allGangs[i].GangTitle, sPrefix)){
					aResult.push(allGangs[i].GangTitle);
					searchedGangs.push(allGangs[i]);
				}
			}
			sap.ui.getCore().getModel().setProperty("/gangs/searchedGangs", searchedGangs);
			return aResult;
		},

		/**
		 * Formatter for no. of messages
		 * @public
		 * @memberOf tne.dashMaster
		 * @returns string 
		 */
		msgCountFormatter: function(UnReadMessageCount){
			var IntMsg = parseInt(UnReadMessageCount);
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();

			if(IntMsg == 0){
				return bundle.getText("tne.dashMsg.msg.noUnreadMessage"); 
			}else if(IntMsg == 1){
				return bundle.getText("tne.dashMsg.msg.oneUnreadMessage");
			}else{
				return bundle.getText("tne.dashMsg.msg.gtOneUnreadMessage",[IntMsg]);
			}

		},

		/**
		 * Formatter for icons
		 * @public
		 * @memberOf tne.dashMaster
		 * @returns sap://icon
		 */
		gangListIconFormatter: function(sCount){
//			switch (sType){
//			case "M":
//			return "sap-icon://group";
//			case "S":
//			return "sap-icon://employee";
//			};
			var IntMsg = parseInt(sCount);

			if(IntMsg <= 0)
				return "sap-icon://email-read"; 
			else 
				return "sap-icon://email";

		},

		/**
		 * Formatter for no. of messages text state
		 * @public
		 * @memberOf tne.dashMaster
		 * @returns sap.ui.core.ValueState 
		 */
		msgCountStateFormatter: function(UnReadMessageCount){
			var IntMsg = parseInt(UnReadMessageCount);

			if(IntMsg <= 0)
				return "Success"; 
			else 
				return "Error";


		}
	});
	return DashMasterController;
});