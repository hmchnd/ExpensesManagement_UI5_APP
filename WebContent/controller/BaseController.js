sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/routing/History"
	], function (Controller, History) {
		"use strict";

		return Controller.extend("com.bnsf.eam.tne.controller.BaseController", {
			/**
			 * Convenience method for accessing the router in every controller of the application.
			 * @public
			 * @returns {sap.ui.core.routing.Router} the router for this component
			 */
			getRouter : function () {
//				return this.getOwnerComponent().getRouter();
				return sap.ui.core.UIComponent.getRouterFor(this);
			},

			/**
			 * Convenience method for getting the view model by name in every controller of the application.
			 * @public
			 * @param {string} sName the model name
			 * @returns {sap.ui.model.Model} the model instance
			 */
			getModel : function (sName) {
//				return this.getView().getModel(sName);
				return sap.ui.getCore().getModel(sName);
			},

			/**
			 * Convenience method for setting the view model in every controller of the application.
			 * @public
			 * @param {sap.ui.model.Model} oModel the model instance
			 * @param {string} sName the model name
			 * @returns {sap.ui.mvc.View} the view instance
			 */
			setModel : function (oModel, sName) {
				return this.getView().setModel(oModel, sName);
//				return sap.ui.getCore().setModel(oModel, sName);
			},

			/**
			 * Convenience method for getting the resource bundle.
			 * @public
			 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
			 */
			getResourceBundle : function () {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			},

			/**
			 * Event handler for navigating back.
			 * It there is a history entry we go one step back in the browser history
			 * If not, it will replace the current entry of the browser history with the master route.
			 * @public
			 */
			onNavBack : function() {
				var sPreviousHash = History.getInstance().getPreviousHash();

					if (sPreviousHash !== undefined) {
					history.go(-1);
				} else {
					this.getRouter().navTo("Dashboard", {}, true);
				}
			},
			
			navToDashMaster: function() {
				this.getRouter().navTo("Dashboard", {}, true);
			},
			
			navToDashCalendar: function() {
				var oUiModel = this.getModel();
				var sGangId=oUiModel.getProperty('/selGang/id');
				
				this.getRouter().navTo('DashDetailsCal', {GangId: sGangId}, true);
			},
			
			navToLineup:function() {
				var oUiModel = this.getModel();
				var sGangId = oUiModel.getProperty('/selGang/id');
				var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(oUiModel.getProperty("/selGang/workDate"));
				
				this.getRouter().navTo('Lineup', {GangId: sGangId, WorkDate: sFormattedDate}, true);
			},
			
			navToActivities:function() {
				var oUiModel = this.getModel();
				var sGangId = oUiModel.getProperty('/selGang/id');
				var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(oUiModel.getProperty("/selGang/workDate"));
				
				this.getRouter().navTo('Activities', {GangId: sGangId, WorkDate: sFormattedDate}, true);
			},
			
			navToPaycodes:function() {
				var oUiModel = this.getModel();
				var sGangId = oUiModel.getProperty('/selGang/id');
				var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(oUiModel.getProperty("/selGang/workDate"));
				
				this.getRouter().navTo('Paycode', {GangId: sGangId, WorkDate: sFormattedDate}, true);
			},
			
			
			/**
			 * Hendler for setting date object into binding context 
			 * if combobox control is used for date selection 
			 * @public
			 */
			onDateSelctionInCombo: function(oEvent){
				var oSectctedDate = new Date(oEvent.getParameters().selectedItem.mProperties.key);
				
				var context  = oEvent.getSource().getBindingContext().sPath + "/" + 
				oEvent.getSource().mBindingInfos.selectedKey.binding.sPath;
				oEvent.getSource().getModel().setProperty(context, oSectctedDate);
				
			}

		});

	}
);