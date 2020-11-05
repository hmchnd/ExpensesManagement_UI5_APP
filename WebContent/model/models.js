sap.ui.define([
		"sap/ui/model/json/JSONModel",
		"sap/ui/Device"
	], function (JSONModel, Device) {
		"use strict";

		return {
			createDeviceModel : function () {
				var oModel = new JSONModel(Device);
				oModel.setDefaultBindingMode("OneWay");
				return oModel;
			},
			
			createTNEuiModel: function(){
				var oLocalModel = {
					deviceDetails:Device,
					today:"",
					user: {
						id:"",
						empNo: "",
						fName: "",
						mName: "",
						lName: "",
						salutation: "",
						role: "",
					},
					gangs:[],
					selGang:{
						id: "",
						multiPrsnInd: false,
						multiDayInd: false,
						shiftHrs: "",
						userPriviledge:"",
						workDate:"",
						dayType:"",
						dayUsrPriviledge: "",
						defaultCostCenter: "",
						dayGangProfile: {},
						uniqueEmployeeList:[],
						lineup: [],
						lineupDisplay: [],
						activities: [],
						paycodes: [],
						pcTreeDisplay: [],
						valueHelp: {
							PCType: [],
							ExpType: [],
							LineSegments: [],
							OVReason: []
						}
					}
				};
				var oModel = new JSONModel(oLocalModel);
				
				return oModel;
			},
			
			createPCExpenseModel: function(sGangId, oSelectedDate, sEmpID){
				var oPCExpenseModel = {
						Action: "N",
						AdditiveType:"DIFF",
						Comments:"",
						DestinationCity:"",
						DestinationState:"",
						DestinationZip:"",
						Duration: new Date(1970, 0, 1,"00","00"),
						EmpId: sEmpID,	
						EndTime: {__edmType: "Edm.Time", ms: 0},
						EtEPOC: new Date(1970, 0, 1,"00","00"),
						ExpenseRef: {},
						ExpenseTypeRef: {},
						GangId: sGangId,
						Hours:"00",
						LineSegment:"",
						MilePost:"",
						Miles:"",
						Mins:"00",
						OriginCity:"",
						OriginState:"",
						OriginZip:"",
						Paycode:"",
						PaycodeType:"",
						StEPOC: new Date(1970, 0, 1,"00","00"),
						StartTime: {__edmType: "Edm.Time", ms: 0},
						TravelCode:"",
						WorkDate: oSelectedDate							
				};
				var oModel = new JSONModel(oPCExpenseModel);
				
				return oModel;
			},
			
			createActivityDetailsModel: function(sGangId, oSelectedDate, oGangST, oGangET){
				var oNewActivity = {
						AFENumber: "",
						Action: "N",
						ActivityID: 0,
						ActivityName: "",
						ActivityType: "",
						ActivityTypeRef: [],
						BMP:"",
						DelayType: "",
						Deletable: true,
						DerivedAFENum: "",
						EMP: "",
						EndDate: oSelectedDate,
						EndTime: new Date(com.bnsf.eam.tne.util.DateAndTimeConversion.offsetConversion(oGangET)),
						GangId: sGangId,
						GenAfeNum: "",
						LineSegment: "",
						NavActivityPeople: [],
						RcAfter: "",
						RcBefore: "",
						OVReasonRef: [],
						StartDate: oSelectedDate,
						StartTime: new Date(com.bnsf.eam.tne.util.DateAndTimeConversion.offsetConversion(oGangST)),
						TaskCategory: "",
						TaskName: "",
						WorkDate: oSelectedDate,
						WorkOrderNo: ""
				};
				
				var oModel = new JSONModel(oNewActivity);
				
				return oModel;
			},
			
			getActualHoursValueHelp: function(){
				
				var oActivityTyperefrence = [	
				            				 {key: "AH", description: "Actual Hours", active: true},
				            				 {key: "MB", description: "Meal Break", active: true },
				            				 {key: "WM", description: "Working Meal", active: true}
				            			];
				
				return oActivityTyperefrence;
			},
			
			getSelectDateValueHelp: function(iCount){
				var iCounter = 2;
				if(!(iCount == undefined || iCount == null || iCount != ""))
					iCounter = parseInt(iCount);
				
				var oDateOptions = [];
				
				var oWorkDate = sap.ui.getCore().getModel().getProperty("/selGang/workDate");
				
				for(var i = 0; i < iCounter; i++){
					var oNFDate = new Date(Date.UTC(oWorkDate.getUTCFullYear(), oWorkDate.getUTCMonth(), oWorkDate.getUTCDate(), 0, 0));
					var oIndexDate = com.bnsf.eam.tne.util.DateAndTimeConversion.offsetConversion(oNFDate.getTime());
					oIndexDate.setDate(oIndexDate.getDate() + i); 
					var oDateSelItem = {
						key: i,
						value: oIndexDate,
						display: com.bnsf.eam.tne.util.DateAndTimeConversion.dateDisplaySelect(oIndexDate)
					};
					oDateOptions.push(oDateSelItem);
				};
				
				return oDateOptions;
				
			}
				
			
		};

	}
);