sap.ui.define([
               "sap/ui/core/UIComponent",
               "sap/ui/Device",
               "com/bnsf/eam/tne/model/models",
               "sap/ui/model/odata/ODataModel",
               "sap/m/BusyDialog",
               "com/bnsf/eam/tne/util/Constants"
               ], function (UIComponent, Device, models, ODataModel, BusyDialog, Constants) {
	"use strict";

	return UIComponent.extend("com.bnsf.eam.tne.Component", {

		metadata : {
			manifest : "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this method, the device models are set and the router is initialized.
		 * @public
		 * @override
		 */
		init : function () {				
			// set the device model
//			this.setModel(models.createDeviceModel(), "device");
			//set local model

			sap.ui.getCore().setModel(models.createTNEuiModel());
			// call the base component's init function and create the App view
			UIComponent.prototype.init.apply(this, arguments);


//			var hostAndPort = "https://uid3.bnsf.com/sap/opu/odata/sap"; 
			
			var hostAndPort = com.bnsf.eam.tne.util.Constants.APP_SERVICE_URL;

			//define model for user information
			var userUrl = hostAndPort + "/ZPM_GW_TNA_USER_SRV";


			var busyIndicator = new BusyDialog('id_busyDialog',{
				title:'Please Wait',
				showCancelButton: false
			}).addStyleClass('custom_busyDialog');

			var oUserModel = new sap.ui.model.odata.ODataModel(userUrl ,true);
			sap.ui.getCore().setModel(oUserModel, "userModel");
			this.setModel(oUserModel, "userModel");

			//OData model for gangs information and Calendar data
			var gangsUrl = hostAndPort + "/zpm_gw_tna_gangs_srv";

			var oGangsModel = new sap.ui.model.odata.ODataModel(gangsUrl ,true);
			oGangsModel.setSizeLimit(410);
			sap.ui.getCore().setModel(oGangsModel, "gangsModel");	
			this.setModel(oGangsModel, "gangsModel");

			//OData Model for Lineup details
			var oDataAllGangDetailsModel  = new sap.ui.model.odata.ODataModel(
					hostAndPort+"/ZPM_GW_TNA_LINEUP_SRV",true
			);
			oDataAllGangDetailsModel.setSizeLimit(5000);
			sap.ui.getCore().setModel(oDataAllGangDetailsModel,"lineupModel");

			
			
			oUserModel.attachRequestSent(function(){
				busyIndicator.open();
			});
			oUserModel.attachRequestCompleted(function(){
				busyIndicator.close();
			});


			//Odata Model for Gang messages
			var oDataSrvForMessagesFetch = new sap.ui.model.odata.ODataModel(
					hostAndPort+"/ZPM_GW_TNA_MESSAGES_SRV",true);
			sap.ui.getCore().setModel(oDataSrvForMessagesFetch,"oDataSrvForMessagesFetch");
			this.setModel(oDataSrvForMessagesFetch,"oDataSrvForMessagesFetch");

//			oDataSrvForMessagesFetch.attachRequestSent(function(){
//			busyIndicator.open();
//			});
//			oDataSrvForMessagesFetch.attachRequestCompleted(function(){
//			busyIndicator.close();
//			});
			
			//Odata Model for Activites
			var oDataSrvForGangActivity = new sap.ui.model.odata.ODataModel(
					hostAndPort+"/ZPM_GW_TNA_ACTIVITY_SRV",true);
			sap.ui.getCore().setModel(oDataSrvForGangActivity,"oDataSrvForGangActivity");
			
			//OData Model for PayCode Screen
			var oDataPaycodeScreenModel = new sap.ui.model.odata.ODataModel(
					hostAndPort+"/ZPM_GW_TNA_PAYCODE_SRV",true);
			oDataPaycodeScreenModel.setSizeLimit(5000);
			sap.ui.getCore().setModel(oDataPaycodeScreenModel,"oDataPaycodeScreenModel");

			//Models for Value helps

			//Model for Absentee value help
			var oAbsenteeType =  new sap.ui.model.json.JSONModel();
			sap.ui.getCore().setModel(oAbsenteeType,"oAbsenteeType");
			this.setModel(oAbsenteeType,"oAbsenteeType");
			oAbsenteeType.setSizeLimit(5000);

			//OData Model for Generic Value help service
			var oValueHelpModel =  new sap.ui.model.odata.ODataModel(
					hostAndPort + "/ZPM_GW_TNA_VALUE_HELP_SRV", true);
			oValueHelpModel.setSizeLimit(5000);
			sap.ui.getCore().setModel(oValueHelpModel,"oValueHelpModel");

			//OData Model for Function Location (Line Segment)
			var oDataModelLineSegValueHlp = new sap.ui.model.odata.ODataModel(
					hostAndPort + "/ZPM_HOS_GW_VALUE_HELP_SRV", true);
			sap.ui.getCore().setModel(oDataModelLineSegValueHlp, "oDataModelLineSegValueHlp");
			oDataModelLineSegValueHlp.setSizeLimit(10000);

			//Local value help models
			
			//Model for ExpViewFragments type value help
			var EmployeeIndexModel =  new sap.ui.model.json.JSONModel();
			sap.ui.getCore().setModel(EmployeeIndexModel,"EmployeeIndexModel");
			this.setModel(EmployeeIndexModel,"EmployeeIndexModel");
			
			oDataSrvForGangActivity.attachRequestSent(function(){
				busyIndicator.open();
			});
			oDataSrvForGangActivity.attachRequestSent(function(){
				busyIndicator.close();
			});
			//Resource bundle model
			var i18nModel = new sap.ui.model.resource.ResourceModel({ 
				bundleUrl : "i18n/messageBundle.properties" 
			}); 
			this.setModel(i18nModel, "i18n");
			sap.ui.getCore().setModel(i18nModel, "i18n");

			// create the views based on the url/hash
			this.getRouter().initialize();			

		},

		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ListSelector and ErrorHandler are destroyed.
		 * @public
		 * @override
		 */
		destroy : function () {
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass : function() {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		}

	});

}
);

