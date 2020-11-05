sap.ui.define([
               'com/bnsf/eam/tne/controller/BaseController',
               'sap/ui/model/json/JSONModel'
               ], function(BaseController, JSONModel) {
	"use strict";

	var ActivityPeopleController = BaseController.extend("com.bnsf.eam.tne.controller.ActivityPeople", {



		onInit : function (oEvent) {

			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);
		},

		_onRouteMatched:function(oEvent)
		{

			var sRoute = oEvent.getParameter("name");
			var oArgs= oEvent.getParameter("arguments").ActSeq; 

			console.log(oEvent.getSource())
			if(sRoute == "ActivityPeople"){       				



				var context = this.getModel().getContext('/selGang/activitiesDisplay/people/NavPeopleActivity/'+oArgs+'');				

				this.getView().setBindingContext(context);				


			};

		},














	});
	return ActivityPeopleController;
});