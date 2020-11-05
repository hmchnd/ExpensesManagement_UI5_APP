sap.ui.define([
       		'com/bnsf/eam/tne/controller/BaseController',
       	], function(BaseController) {
       	"use strict";

       	var AppController = BaseController.extend("com.bnsf.eam.tne.controller.App", {

       		onInit : function (oEvent) {
       			//initialize model
       			var oUiModel = this.getModel();
       			
       			//initialize clock
       			this._clock = function(oModel, oController) {
       			
       				var oDate = new Date();
       				var sToday = String(oDate);
       				oModel.setProperty("/today", sToday);
       				
       				var t= setTimeout(function(){oController._clock(oModel, oController)},1000);
       			};
       			
       			//start clock
       			this._clock(oUiModel, this);
       			
       		},
       		
       		onExit: function() {
       			this._clock.destroy();
       		}
       	});
       	return AppController;
});