jQuery.sap.declare("com.bnsf.eam.tne.util.ServiceErrorHandler");

com.bnsf.eam.tne.util.ServiceErrorHandler={
		
	handleODataError : function(error,sTitle,iErrorNumber,callBackParameter){	
		try{
			jQuery.sap.require("sap.m.MessageBox");	
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle(); 
			
			if (sTitle==undefined||sTitle==""){
				sTitle = bundle.getText("tne.util.SrvErrHandler.CallFailureMsgHeader"); //Error as Title,If title is not passed 
			};
			
			var errMsgBody = ""; 
			if(iErrorNumber != undefined && iErrorNumber !=""){
				errMsgBody = "Error Number: " + iErrorNumber+ "\n\n";
			};
			
			var onCloseFn = function(){};
			
			if(error.code == 19){
				errMsgBody = errMsgBody + bundle.getText("tne.util.SrvErrHandler.OdataError0Body");
			}else{
				//handle different error codes seperately 
				if(error.response.statusCode == 0){
					errMsgBody = errMsgBody + bundle.getText("tne.util.SrvErrHandler.OdataError0Body");
				}else if(error.response.statusCode == 500){
					errMsgBody = errMsgBody + bundle.getText("tne.util.SrvErrHandler.OdataError500Body");
				}else if(error.response.statusCode == 400){
					var sError = error.response.body;
					var oJSON =JSON.parse(sError);
					errMsgBody = errMsgBody + oJSON.error.message.value;
					if(callBackParameter != undefined){
						onCloseFn = function(){callBackParameter();};
					};			
				}else if(error.response.statusCode == 401){
					errMsgBody = errMsgBody + bundle.getText("tne.util.SrvErrHandler.OdataError401Body");		
				}else if(error.response.statusCode == 403){
					errMsgBody = errMsgBody + bundle.getText("tne.util.SrvErrHandler.OdataError403Body");		
				}else if(error.response.statusCode == 404){
					errMsgBody = errMsgBody + bundle.getText("tne.util.SrvErrHandler.OdataError404Body");		
				}
				else{
					errMsgBody = errMsgBody + bundle.getText("tne.util.SrvErrHandler.HTTPErrorUnknown");
				};
			};
			//throw exception message
			sap.m.MessageBox.show(errMsgBody,{
				icon:sap.m.MessageBox.Icon.ERROR,
				title: sTitle,
				actions: [sap.m.MessageBox.Action.OK],
				styleClass:"dummyStyleClass",
				onClose: onCloseFn
			});
			
			//log error
			
			var errText = "";
			try{				
				errText = error.message;
				var oError = error.response.body;
				if(oError != undefined && oError != ""){
					var oErrorJSON =JSON.parse(oError);
					errText = oErrorJSON.error.message.value;
				}
			}catch(e){
				if (errText == "")
					errText = bundle.getText("tne.util.SrvErrHandler.errText");
			};
			//var errTitle = "BNSF-ETER Error in - " + sTitle;
			var errTitle = bundle.getText("tne.util.SrvErrHandler.errTitle") + sTitle;
			jQuery.sap.log.error(errTitle, errText);
		}catch(e){
			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			sap.m.MessageBox.show(
					bundle.getText("tne.util.SrvErrHandler.OdataErrorServiceHandleMsgBody"), 
					sap.m.MessageBox.Icon.ERROR, 
					bundle.getText("tne.util.SrvErrHandler.OdataErrorServiceHandlerMsgTitle"),
					sap.m.MessageBox.Action.OK,
					null,
					null,
					'dummyStyleClass'
			);
			
			//var errTitle = "BNSF-ETER Error in - " + sTitle;
			var errTitle = bundle.getText("tne.util.SrvErrHandler.errTitle") + sTitle;
			jQuery.sap.log.error(errTitle, e.stack);
		} 
	},

	unknownErrorFunc : function(oError, sErrroArea){
		var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle(); 
		if(sErrroArea == undefined || sErrroArea == null || sErrroArea == ""){
			sErrroArea = bundle.getText("tne.util.SrvErrHandler.OdataErrorServiceHandlerMsgTitle");
		};
		jQuery.sap.require("sap.m.MessageBox");
		 
		sap.m.MessageBox.show(
				bundle.getText("tne.util.SrvErrHandler.OdataErrorServiceHandleMsgBody"), 
				sap.m.MessageBox.Icon.ERROR, 
				bundle.getText("tne.util.SrvErrHandler.OdataErrorServiceHandlerMsgTitle"),
				sap.m.MessageBox.Action.OK,
				null,
				null,
				'dummyStyleClass'
		);
		
		//var errTitle = "BNSF-ETER Error in - " + sErrroArea;
		var errTitle = bundle.getText("tne.util.SrvErrHandler.errTitle") + sErrroArea;
		jQuery.sap.log.error(errTitle, oError.stack);
	}
};	