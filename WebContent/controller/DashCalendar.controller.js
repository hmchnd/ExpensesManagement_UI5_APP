sap.ui.define([
               'com/bnsf/eam/tne/controller/BaseController',
               'sap/ui/model/json/JSONModel',
               'com/bnsf/eam/tne/util/DateAndTimeConversion'
               ], function(BaseController,JSONModel, DateAndTimeConversion) {
	"use strict";

	var DashCalendarController = BaseController.extend("com.bnsf.eam.tne.controller.DashCalendar", {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf system
		 */	
		onInit : function (oEvent) {
			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);
			var busyIndicator = new sap.m.BusyDialog('tne.DashCal.BusyDialog',{
				title:'{i18n>tne.app.BusyIndTitle}',
				showCancelButton: false
			});
		},

		/**
		 * On route matched for Dash Calendar screen
		 * @private
		 * @memberOf tne.dashCal
		 * @returns null
		 */
		_onRouteMatched: function(oEvent){
			var oArgs;
			var sRoute = oEvent.getParameter("name");
			if(sRoute == "DashDetailsCal"){
				oArgs = oEvent.getParameter("arguments");
				var defaultModel = sap.ui.getCore().getModel();
				var sSelGang = oArgs.GangId;
				defaultModel.setProperty("/selGang/id", sSelGang);
				this._loadCalendar(oArgs);
			};
		},
		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * Based on the Role sets the Calendar Dates
		 * @memberOf system
		 */

		onAfterRendering:function()
		{

			var oModel = sap.ui.getCore().getModel();
			var role = oModel.getProperty("/user/role");
			if ((role == "U")||(role=="H")){
				this.getView().byId("tne_dashCal_idBiWeeklyCal").setBackScroll(26);
			}else{
				this.getView().byId("tne_dashCal_idBiWeeklyCal").setBackScroll(2);
			};
			this.getView().byId("tne_dashCal_idBiWeeklyCal").setFwdScroll(3);

		},

		/**
		 * Load the BiWeekely Calendar and sets the Date
		 * Calling the method to fetch the Data into the Calendar
		 * @private
		 * @memberOf tne.dashCal
		 * @returns null
		 */
		_loadCalendar: function(){
			this.getView().byId("tne_dashCal_idBiWeeklyCal").setCycle(new Date());
			this._fetchCalendarData();

		},
		
		/**
		 * Load the BiWeekely Calendar and binds the data to the Calendar		 
		 * @private
		 * @memberOf tne.dashCal
		 * @returns null
		 */
		_fetchCalendarData:function(){
			var that = this;
			var locGangModel = sap.ui.getCore().getModel();
			var selectedGang = locGangModel.getProperty("/selGang/id");
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: "yyyy-MM-ddThh:mm:ss"});
			var oModel = sap.ui.getCore().getModel();
			var empid = oModel.getProperty("/user/empNo");
			var uID = oModel.getProperty("/user/id");
			var calendarBounds = this._getUserNavigationBounds();

			var oCalItem = new com.bnsf.tne.CalendarEvents({
				date:{ path: 'Date',
					formatter: function(oDate){ 
						if (oDate) { 
							var TimezoneOffset = new Date(0).getTimezoneOffset()*60*1000; 
							var oTimeMilliSec = new Date(oDate.getTime()+TimezoneOffset);
							return oTimeMilliSec;
						} else
							return oDate;
					}
				},
				dayType:"{DayType}", 
				event:"{Status}", 
				editable:"{Editable}"
			});

			var oCalDataModel = new JSONModel()
			oCalDataModel.setData();
			this.getView().byId("tne_dashCal_idBiWeeklyCal").setModel(oCalDataModel);
			
			sap.ui.getCore().byId("tne.DashCal.BusyDialog").open();
			
			sap.ui.getCore().getModel("gangsModel").read("/TimeSummarySet?$filter=UserID eq '"+ uID 
					+"' and  GangID eq '"+selectedGang+"' and StartDay eq datetime'"
					+oDateFormat.format(calendarBounds.startDate) +"' and EndDay eq datetime'"
					+oDateFormat.format(calendarBounds.endDate)+"'",
					null,{},false,
					function(odata,ors){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						try{
							oCalDataModel.setSizeLimit("440");
							oCalDataModel.setData(odata);
							that.getView().byId("tne_dashCal_idBiWeeklyCal").setModel(oCalDataModel);
							that.getView().byId("tne_dashCal_idBiWeeklyCal").bindAggregation("items", {
								path:"/results", 
								template: oCalItem 
							});

							sap.ui.getCore().byId("tne.DashCal.BusyDialog").close();
							
//							jQuery.sap.delayedCall(1000, this, function() {
//								sap.ui.getCore().byId("tne.DashCal.BusyDialog").close();
//							});

						}catch (e) {
							sap.ui.getCore().byId("tne.DashCal.BusyDialog").close();
							sap.m.MessageBox.show(bundle.getText("tne.dashCal.msg.oDataUnknownFailureMsgBody"), sap.m.MessageBox.Icon.ERROR, bundle.getText("tne.dashCal.msg.oDataUnknownFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');					
						};
					},
					function(error){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
						jQuery.sap.require("sap.m.MessageBox");
						try {
							var sError = error.response.body;
							var oJSON =JSON.parse(sError);
							sap.ui.getCore().byId("tne.DashCal.BusyDialog").close();
							sap.m.MessageBox.show(oJSON.error.message.value, sap.m.MessageBox.Icon.ERROR,error.message);

						} catch (e) {
							sap.ui.getCore().byId("tne.DashCal.BusyDialog").close();
							sap.m.MessageBox.show(bundle.getText("tne.dashCal.msg.oDataUnknownFailureMsgBody"), sap.m.MessageBox.Icon.ERROR, bundle.getText("tne.dashCal.msg.oDataUnknownFailureMsgHeader"),sap.m.MessageBox.Action.OK,null,null,'dummyStyleClass');
						};
					});
		},
		
		/**
		 * Load the BiWeekely Calendar and binds the data to the Calendar		 
		 * @private
		 * @memberOf tne.dashCal
		 * @returns StartDate and endDate
		 */
		_getUserNavigationBounds: function(){
			var oModel = sap.ui.getCore().getModel();
			var role = oModel.getProperty("/user/role");

			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: "yyyy-MM-ddThh:mm:ss"});

			var calBounds = {
					startDate: new Date(),
					endDate: new Date()
			};

			var oCycle = new Date();
			if ((role == "U")||(role=="H")){


				if(oCycle.getDate() <= 15){
					calBounds.startDate = new Date(oCycle.getFullYear(), oCycle.getMonth()-13, 16); //16th one year and one month back
//					calBounds.endDate = new Date(oCycle.getFullYear(), oCycle.getMonth(), 15); //15th of current month
					calBounds.endDate = new Date(oCycle.getFullYear(), oCycle.getMonth()+2, 0); //end of next month
				}else{
					calBounds.startDate = new Date(oCycle.getFullYear(), oCycle.getMonth()-12, 1); //1st current month
//					calBounds.endDate = new Date(oCycle.getFullYear(), oCycle.getMonth()+1, 0); //end of current month
					calBounds.endDate = new Date(oCycle.getFullYear(), oCycle.getMonth()+2, 15); //15th of next to next month (3 cycles)
				}
			}
			else{
				if(oCycle.getDate() <= 15){
					calBounds.startDate = new Date(oCycle.getFullYear(), oCycle.getMonth()-1, 16); //16th last month
//					calBounds.endDate = new Date(oCycle.getFullYear(), oCycle.getMonth(), 15); //15th of current month
					calBounds.endDate = new Date(oCycle.getFullYear(), oCycle.getMonth()+2, 0); //end of next month
				}else{
					calBounds.startDate = new Date(oCycle.getFullYear(), oCycle.getMonth()-0, 1); //1st current month
//					calBounds.endDate = new Date(oCycle.getFullYear(), oCycle.getMonth()+1, 0); //end of current month
					calBounds.endDate = new Date(oCycle.getFullYear(), oCycle.getMonth()+2, 15); //15th of next to next month (3 cycles)
				}
			};

			return calBounds;

		},
		/**
		 * Based of the dayType,workDate and GangId Navigates to the Lineup view
		 * @public
		 * @memberOf tne.dashCal
		 * @returns null
		 */
		onWorkDateSelected: function(oEvent){
			var selectedDate = oEvent.getParameter("selectedDate");
			var bRestType = false;         		
			oEvent.getParameter("dayType") == "R" ? bRestType = true: bRestType = false;

			var oUiModel = this.getModel();
			oUiModel.setProperty("/selGang/workDate", selectedDate);
			oUiModel.setProperty("/selGang/dayType", bRestType);	//set the property DayType to true or false (True if odd day selected in the calendar else false)

			var sGangId = oUiModel.getProperty("/selGang/id");

			var sFormattedDate = com.bnsf.eam.tne.util.DateAndTimeConversion.getDateDisplayMMddyyyy(selectedDate);

			this.getRouter().navTo("Lineup",{GangId: sGangId, WorkDate: sFormattedDate}, true);
//			this.getRouter().navTo("Activities",{GangId: sGangId, WorkDate: sFormattedDate}, true);
//			this.getRouter().navTo('Paycode',{GangId: sGangId, WorkDate: sFormattedDate}, true);
		},
	});
	return DashCalendarController;
});