sap.ui.define([
               'com/bnsf/eam/tne/controller/BaseController',
               'sap/ui/core/format/DateFormat'
               ], function(BaseController, dateFormat) {
	"use strict";

	var DashDetailController = BaseController.extend("com.bnsf.eam.tne.controller.DashDetail", {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf system
		 */
		onInit : function (oEvent) {
			var oUiModel = this.getModel();
			this.setModel(oUiModel);	
//			this.getView().setModel(oUiModel);

			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);
		},
		/**
		 * Handles Navigation of one step back through back button
		 * @public
		 * @memberOf tne.dashDetails
		 * @returns null
		 */
		navToMaster: function(){
			this.onNavBack();
		},
		
		/**
		 * On route matched for Dash Detail screen
		 * Implements the header buttons based on the page navigation
		 * @private
		 * @memberOf tne.dashDetails
		 * @returns null
		 */
		_onRouteMatched: function(oEvent){
			var oArgs;
			var sRoute = oEvent.getParameter("name");
			if(sRoute == "DashDetails"){
				oArgs = oEvent.getParameter("arguments");
				this.getView().byId("tne.dashDet.page").removeAllContent();
				this.getView().byId("tne.dashDet.page").setTitle(oArgs.GangId);//Setting title for Gang Id
				this._callDetailsContent(oArgs);
			}else if(sRoute == "DashDetailsMsg"){
				this.getView().byId('tne.dashDet.hdrSegBtn').setSelectedKey("tne.dashDet.icoKeyMsg");
			}else if(sRoute == "DashDetailsCal"){
				this.getView().byId('tne.dashDet.hdrSegBtn').setSelectedKey("tne.dashDet.icoKeyCal");
			};
		},

		/**
		 * Based on the UnRead count messages enable and disable the header icons
		 * based on the key navigates to the views 
		 * @private
		 * @memberOf tne.dashDetails
		 * @returns null
		 */
		_callDetailsContent: function(oArgs){
			var that = this;
			var oSelectedKey = this.getView().byId('tne.dashDet.hdrSegBtn').getSelectedKey();
			var defaultModel = sap.ui.getCore().getModel();
			var sSelGang = oArgs.GangId;
			var allGangs = defaultModel.oData.gangs;    			
			for(var i = 0 ; i < allGangs.length ; i++){
				if(allGangs[i].GangID == sSelGang){	
					var ParseIntVal_UnRdMsgCount = parseInt(allGangs[i].UnReadMessageCount);
					if(ParseIntVal_UnRdMsgCount <= 0){  							
						this.getView().byId("tne.dashDet.emailId").setIcon("sap-icon://email-read");
						this.getView().byId("tne.dashDet.calenderId").setEnabled(true);
					}else if(ParseIntVal_UnRdMsgCount > 0){
						this.getView().byId("tne.dashDet.calenderId").setEnabled(false);
						this.getView().byId("tne.dashDet.emailId").setIcon("sap-icon://email");
						oSelectedKey = "tne.dashDet.icoKeyMsg";
					};	
				};
			};
			defaultModel.setProperty("/selGang/id", sSelGang);

			switch (oSelectedKey){
			case "tne.dashDet.icoKeyCal":
				this.getRouter().navTo('DashDetailsCal', {GangId: oArgs.GangId}, true);        					
				break;
			case "tne.dashDet.icoKeyMsg":
				this.getRouter().navTo('DashDetailsMsg', {GangId: oArgs.GangId}, true);
				break;
			case "tne.dashDet.icoKeyTR":
				break;
			default:
				break;
			};
		},
		
		/**
		 * Formatter for sap://icons
		 * @public
		 * @memberOf tne.dashDetails
		 * @returns boolean
		 */
		msgReadStatusIconFormatter:function(bRead){
			var sSource = "";
			bRead ? sSource = "sap-icon://email-read" : sSource = "sap-icon://email";
			return sSource;
		},
		
		/**
		 * Handles to navigates the Calendar view
		 * sets the header Calendar icon 
		 * @public
		 * @memberOf tne.dashDetails
		 * @returns null
		 */
		onCalenderCall:function(){  
			this.getView().byId("tne.dashDet.page").removeAllContent();
			var defaultModel = sap.ui.getCore().getModel();
			var sSelGang = defaultModel.getProperty("/selGang/id");	
			this.getView().byId('tne.dashDet.hdrSegBtn').setSelectedKey("tne.dashDet.icoKeyCal");
			this.getRouter().navTo('DashDetailsCal', {GangId: sSelGang}, true);

		},
		
		/**
		 * Handles to navigates the Message view
		 * sets the header message icon 
		 * @public
		 * @memberOf tne.dashDetails
		 * @returns null
		 */
		onMessageCall:function(){
			this.getView().byId("tne.dashDet.page").removeAllContent();
			var defaultModel = sap.ui.getCore().getModel();
			var sSelGang = defaultModel.getProperty("/selGang/id");
			this.getView().byId('tne.dashDet.hdrSegBtn').setSelectedKey("tne.dashDet.icoKeyMsg");
			this.getRouter().navTo('DashDetailsMsg', {GangId: sSelGang}, true);
		},
		
		/**
		 * Formatter for date and time
		 * @public
		 * @memberOf tne.dashDetails
		 * @returns Date
		 */
		formatFooterClockTime: function(oTime){
			if (oTime) {
				var d = new Date(oTime);  
				var vDate =  sap.ui.core.format.DateFormat.getDateInstance( {
					style:"full", pattern: "EEEE, MMM dd - HH:mm"}).format(d);
				return vDate;
			};
		}
	});
	return DashDetailController;
});