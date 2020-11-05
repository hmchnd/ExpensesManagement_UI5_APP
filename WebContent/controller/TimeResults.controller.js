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

	var TimeResultsController = BaseController.extend("com.bnsf.eam.tne.controller.TimeResults", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf view.TimeResults
		 */
		onInit: function() {
			var oUiModel = this.getModel();
			this.setModel(oUiModel);

			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);

		},

		_onRouteMatched: function(oEvent){
			var sRoute = oEvent.getParameter("name");	
			if(sRoute == "TimeResults"){ 
//				var context = this.getModel().getContext('/selGang/TimeResults/');
//				this.getView().setBindingContext(context);	
			}
		},

		handlePageExit:function(){
			this.onNavBack();	
		},
		handleSubmitAnother: function(){
			this.navToDashCalendar();
			
		},
		handleResultsItemPress:function(oEvent){
			var oBindingContext = oEvent.getSource().getBindingContext();
			var sPath = oBindingContext.sPath;	
			var sMsgBody = this.getModel().getProperty(sPath).Message;
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();	
			sap.m.MessageBox.show(
					sMsgBody,{
						icon: sap.m.MessageBox.Icon.INFORMATION,
						title: bundle.getText("tne.timeResults.ResultsMessage"),
						actions: sap.m.MessageBox.Action.OK,
						onClose: function(oAction) { 
							if(oAction=="OK"){
								return;							
							};
						}
					}

			);
		},

		TimeResultsIconFormatter: function(sMsgType){

			switch(sMsgType){
			case 'S':

				var src = "sap-icon://message-success";
				return src;
				break;

			case 'E':

				var src = "sap-icon://message-error";
				return src;
				break;

			case 'W':

				var src = "sap-icon://message-warning";
				return src;
				break;
			}


		},

		TimeResultsIconColorFormatter: function(sMsgType){

			switch(sMsgType){
			case 'S':

				var color = "#29a329";
				return color;
				break;

			case 'E':

				var color = "#ff3300";
				return color;
				break;

			case 'W':

				var color = "#ff9933";
				return color;
				break;
			}

		}


	});

	return TimeResultsController;




});