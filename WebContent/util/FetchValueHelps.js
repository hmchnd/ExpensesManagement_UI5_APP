jQuery.sap.declare("com.bnsf.eam.tne.util.FetchValueHelps");

com.bnsf.eam.tne.util.FetchValueHelps = {

		getLineSegment: function(sLS){
			var oReturn = undefined;

			var oUiModel = sap.ui.getCore().getModel();

			var aLS = oUiModel.getProperty("/selGang/valueHelp/LineSegments");

			var aLineSegments = [];
			if(aLS == undefined || aLS.length <= 0){
				var oDataModelLineSegValueHlp = sap.ui.getCore().getModel( "oDataModelLineSegValueHlp");
				oDataModelLineSegValueHlp.read("/FuncLocationSet",
						null,{}, false/*sync*/, function(oData,oResponse){
							try{
								var oModelForLineSegValueHlp = new sap.ui.model.json.JSONModel();
								sap.ui.getCore().setModel(oModelForLineSegValueHlp,"oModelForLineSegValueHlp");							
								oUiModel.setProperty("/selGang/valueHelp/LineSegments", oData.results);								
								aLineSegments = oUiModel.getProperty("/selGang/valueHelp/LineSegments");
								oModelForLineSegValueHlp.setProperty('/items',oData.results);
								oModelForLineSegValueHlp.refresh();

//								return aLineSegments;
								if(!(sLS == null || sLS == undefined || sLS == "")){
									for(var i = 0; i < aLineSegments.length; i++){
										if(aLineSegments[i].LineSegment == sLS)
											oReturn = aLineSegments[i];
									};
								}else{
									oReturn = undefined;
								};

							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling response in Get Line Segment Value Help Service");							
							}
						},
						function(error){
							var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
							try {
								com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.util.ValueHlp.msg.VHFetchErrorLS"),bundle.getText("tne.util.ValueHlp.lbl.ValueHelpScreenErrorNo"));

							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling exception in Get Line Segment Value Help Service");

							}
						});

			}else{
				aLineSegments = aLS;

//				return aLineSegments;
				if(!(sLS == null || sLS == undefined || sLS == "")){
					for(var i = 0; i < aLineSegments.length; i++){
						if(aLineSegments[i].LineSegment == sLS)
							oReturn = aLineSegments[i];
					};
				}else{
					oReturn = undefined;
				};
			};

			return oReturn;
		},

		getPCType: function(sPCType){

			var oUiModel = sap.ui.getCore().getModel();

			var selectedGangTitle = oUiModel.getProperty("/selGang/id");		
			var userID = oUiModel.getProperty('/user/id');
			var selectedDateTime = oUiModel.getProperty("/selGang/workDate");
			selectedDateTime = new Date(selectedDateTime); 
			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);	

			var oValueHelpModel = sap.ui.getCore().getModel("oValueHelpModel");

			var aPCType = oUiModel.getProperty("/selGang/valueHelp/PCType");

			var PCTypeArray = [];

			if(aPCType == undefined || aPCType.length == 0){
				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'PAYCODE_TYPE' and ScreenIndicator eq 'PAYCODES'" +
						"and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+ vDate +"' " +
						"and ImportParam1 eq 'BASE' and UserID eq '" + userID  + "'",
						null,{}, false /*sync*/,
						function(oData, oResponse){
							try{
								oUiModel.setProperty("/selGang/valueHelp/PCType", oData.results);
								PCTypeArray = oUiModel.getProperty("/selGang/valueHelp/PCType");
							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling response in Get Paycode Type Value Help Service");							
							};
						},
						function(error){
							var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
							try {
								com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.util.ValueHlp.msg.VHFetchErrorPCType"),bundle.getText("tne.util.ValueHlp.lbl.ValueHelpScreenErrorNo"));
							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling exception in Get Paycode Type Value Help Service");
							};
						}
				);					
			}else 
				PCTypeArray = aPCType;

			if(!(sPCType == null || sPCType == "")){
				for(var i = 0; i < PCTypeArray.length; i++){
					if(PCTypeArray[i].Code == sPCType){
						return PCTypeArray[i];
					};						
				};
			}else
				return undefined;
		},

		getPaycode: function(sPCType, sPC){		

			var oUiModel = sap.ui.getCore().getModel();

			var selectedGangTitle = oUiModel.getProperty("/selGang/id");		
			var userID = oUiModel.getProperty('/user/id');
			var selectedDateTime = oUiModel.getProperty("/selGang/workDate");
			selectedDateTime = new Date(selectedDateTime); 
			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);	

			var oValueHelpModel = sap.ui.getCore().getModel("oValueHelpModel");

			var PCTypeRef = com.bnsf.eam.tne.util.FetchValueHelps.getPCType(sPCType);
			var aPC = [];
			if(PCTypeRef.Paycodes == undefined || PCTypeRef.Paycodes.length <= 0){
				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'PAYCODE' and ScreenIndicator eq 'PAYCODES' " +
						"and GangId eq '"+ selectedGangTitle +"' and WorkDate eq datetime'"+ vDate + "' " +
						"and ImportParam1 eq '"+ sPCType +"' and UserID eq '" + userID  + "'",
						null,{}, false /*sync*/,
						function(oData, oResponse){
							try{
								PCTypeRef.Paycodes = oData.results;
								aPC = PCTypeRef.Paycodes;
							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling response in Get Paycode Value Help Service");							
							};
						},
						function(error){
							var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
							try {
								com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.util.ValueHlp.msg.VHFetchErrorPaycode"),bundle.getText("tne.util.ValueHlp.lbl.ValueHelpScreenErrorNo"));
							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling exception in Get Paycode Value Help Service");
							};
						}
				);					
			}else
				aPC = PCTypeRef.Paycodes;
			for(var i = 0; i < aPC.length ; i++){
				if(aPC[i].Code == sPC)
					return aPC[i];
			};

		},


		getExpType: function(sExpType){
			var oUiModel = sap.ui.getCore().getModel();
			var selectedGangTitle = oUiModel.getProperty("/selGang/id");		
			var userID = oUiModel.getProperty('/user/id');
			var selectedDateTime = oUiModel.getProperty("/selGang/workDate");
			selectedDateTime = new Date(selectedDateTime); 
			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);	

			var oValueHelpModel = sap.ui.getCore().getModel("oValueHelpModel");

			var aExpType = oUiModel.getProperty("/selGang/valueHelp/ExpType");

			var ExpTypeArray = [];

			if(aExpType == undefined || aExpType.length == 0){
				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'EXPENSE_TYPE' and ScreenIndicator eq 'PAYCODES' " +
						"and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+vDate+"' " +
						"and UserID eq '" + userID  + "'",
						null,{}, false /*sync*/,
						function(oData, oResponse){
							try{
								oUiModel.setProperty("/selGang/valueHelp/ExpType", oData.results);
								ExpTypeArray = oUiModel.getProperty("/selGang/valueHelp/ExpType");
							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling response in Get Expense Type Value Help Service");							
							};
						},
						function(error){
							var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
							try {
								com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.util.ValueHlp.msg.VHFetchErrorPCType"),bundle.getText("tne.util.ValueHlp.lbl.ValueHelpScreenErrorNo"));
							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling exception in Get Expense Type Value Help Service");
							};
						}
				);					
			}else 
				ExpTypeArray = aExpType;

			if(!(sExpType == null || sExpType == "")){
				for(var i = 0; i < ExpTypeArray.length; i++){
					if(ExpTypeArray[i].Code == sExpType){

						return ExpTypeArray[i];

					};						
				};
			}else
				return undefined;

		},

		getExpense: function(sExpType, sExp){

			var oUiModel = sap.ui.getCore().getModel();
			var selectedGangTitle = oUiModel.getProperty("/selGang/id");		
			var userID = oUiModel.getProperty('/user/id');
			var selectedDateTime = oUiModel.getProperty("/selGang/workDate");
			selectedDateTime = new Date(selectedDateTime); 
			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);	

			var oValueHelpModel = sap.ui.getCore().getModel("oValueHelpModel");

			var ExpTypeRef = com.bnsf.eam.tne.util.FetchValueHelps.getExpType(sExpType);

			var aExp = [];
			if(ExpTypeRef.Paycodes == undefined || ExpTypeRef.Paycodes.length <= 0){
				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'EXPENSE_PAYCODE' and " +
						"ScreenIndicator eq 'PAYCODES'and GangId eq '"+selectedGangTitle+"' " +
						"and WorkDate eq datetime'"+vDate+"' and ImportParam1 eq '"+sExpType+"' " +
						"and UserID eq '" + userID  + "'",
						null,{}, false/*sync*/,
						function(oData, oResponse){
							try{							
								ExpTypeRef.Paycodes = oData.results;
								aExp = ExpTypeRef.Paycodes;
							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling response in Get Expense Type Value Help Service");							
							};
						},
						function(error){
							var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
							try {
								com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.util.ValueHlp.msg.VHFetchErrorPaycode"),bundle.getText("tne.util.ValueHlp.lbl.ValueHelpScreenErrorNo"));
							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling exception in Get Expense Value Help Service");
							};
						}
				);					
			}else
				aExp = ExpTypeRef.Paycodes;

			for(var i = 0; i < aExp.length ; i++){
				if(aExp[i].Code == sExp)
					return aExp[i];
			};



		},

		getOVReason: function(sOVReason){
			var oUiModel = sap.ui.getCore().getModel();
			var selectedGangTitle = oUiModel.getProperty("/selGang/id");		
			var userID = oUiModel.getProperty('/user/id');
			var selectedDateTime = oUiModel.getProperty("/selGang/workDate");
			selectedDateTime = new Date(selectedDateTime); 
			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);	

			var aOTReason = oUiModel.getProperty("/selGang/valueHelp/OVReason");

			var aOTR = [];

			if(aOTReason == undefined || aOTReason.length == 0){
				var oValueHelpModel = sap.ui.getCore().getModel("oValueHelpModel");

				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'OTRCODE' and ScreenIndicator eq 'OVERTIME'" +
						"and GangId eq '"+selectedGangTitle+"' and WorkDate eq datetime'"+ vDate +"' " +
						"and UserID eq '" + userID  + "'",
						null,{} , false/*sync*/,
						function(oData, oResponse){
							try{
								oUiModel.setProperty("/selGang/valueHelp/OVReason", oData.results);
								aOTR = oUiModel.getProperty("/selGang/valueHelp/OVReason");

							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling response in Get Overtime Reason Value Help Service");							
							};
						},
						function(error){
							var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
							try {
								com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.util.ValueHlp.msg.VHFetchErrorOVReason"),bundle.getText("tne.util.ValueHlp.lbl.ValueHelpScreenErrorNo"));
							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling exception in Get Overtime Reason Value Help Service");
							};
						}
				);					
			}else 
				aOTR = aOTReason;		
//			return aOTR;
			if(!(sOVReason == null || sOVReason == "")){
				for(var i = 0; i < aOTR.length; i++){
					if(aOTR[i].Code == sOVReason){
						return aOTR[i];
					};						
				};
			}else
				return undefined;
		},

		getTravelCode: function(sExpType, sTravelCode){

			var oUiModel = sap.ui.getCore().getModel();
			var selectedGangTitle = oUiModel.getProperty("/selGang/id");		
			var userID = oUiModel.getProperty('/user/id');
			var selectedDateTime = oUiModel.getProperty("/selGang/workDate");
			selectedDateTime = new Date(selectedDateTime); 
			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);	

			var ExpTypeRef = com.bnsf.eam.tne.util.FetchValueHelps.getExpType(sExpType);
			var aTrvlCode = [];

			if(ExpTypeRef.TravelCodes == undefined || ExpTypeRef.TravelCodes.length <= 0){
				var oValueHelpModel = sap.ui.getCore().getModel("oValueHelpModel");
				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'TRAVEL_CODE' and ScreenIndicator eq 'PAYCODES' " +
						"and GangId eq '"+ selectedGangTitle +"' and WorkDate eq datetime'"+ vDate +"' " +
						"and UserID eq '" + userID  + "'",
						null,{}, false/*sync*/,
						function(oData, oResponse){
							try{
								ExpTypeRef.TravelCodes = oData.results;
								aTrvlCode = ExpTypeRef.TravelCodes;
							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling response in Get Travel Code Value Help Service");							
							};
						},
						function(error){
							var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
							try {
								com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.util.ValueHlp.msg.VHFetchErrorPCType"),bundle.getText("tne.util.ValueHlp.lbl.ValueHelpScreenErrorNo"));
							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling exception in Get Travel Code Value Help Service");
							};
						}
				);
			}else
				aTrvlCode = ExpTypeRef.Paycodes;			

			for(var i = 0; i < aTrvlCode.length ; i++){
				if(aTrvlCode[i].Code == sTravelCode)
					return aTrvlCode[i];
			};
		},

		getHotelCode: function(sExpType, sZipCode){

			var oUiModel = sap.ui.getCore().getModel();
			var selectedGangTitle = oUiModel.getProperty("/selGang/id");		
			var userID = oUiModel.getProperty('/user/id');
			var selectedDateTime = oUiModel.getProperty("/selGang/workDate");
			selectedDateTime = new Date(selectedDateTime); 
			var vDate =  sap.ui.core.format.DateFormat.getDateInstance({
				style:"full", pattern: "yyyy-MM-ddThh:mm:ss"
			}).format(selectedDateTime);	

			var ExpTypeRef = com.bnsf.eam.tne.util.FetchValueHelps.getExpType(sExpType);

			var aHotelCode = [];

			if(ExpTypeRef.HotelCodes == undefined || ExpTypeRef.HotelCodes.length <= 0){
				var oValueHelpModel = sap.ui.getCore().getModel("oValueHelpModel");
				oValueHelpModel.read("ValueHelpSet?$filter=FieldName eq 'HOTEL' and ScreenIndicator eq 'EXPENSE' and " +
						"ImportParam1 eq '"+sZipCode+"' and GangId eq '"+selectedGangTitle+"' and " +
						"WorkDate eq datetime'"+vDate+"' and UserID eq '" + userID  + "'",
						null,{}, false/*sync*/,
						function(oData, oResponse){
							try{
								ExpTypeRef.HotelCodes = oData.results;
								aHotelCode = ExpTypeRef.HotelCodes;

							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling response in Get Hotel Code Value Help Service");							
							};
						},
						function(error){
							var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
							try {
								com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.util.ValueHlp.msg.VHFetchErrorPCType"),bundle.getText("tne.util.ValueHlp.lbl.ValueHelpScreenErrorNo"));
							} catch (e) {
								com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "ValueHelp - I07001: Error handling exception in Get Hotel Code Value Help Service");
							};
						}
				);
			}else
				aHotelCode = ExpTypeRef.HotelCodes;			

			for(var i = 0; i < aHotelCode.length ; i++){
				if(aHotelCode[i].Code == sZipCode)
					return aHotelCode[i];
			};
		}
};