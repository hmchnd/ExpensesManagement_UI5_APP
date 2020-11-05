sap.ui.define([
               'com/bnsf/eam/tne/controller/BaseController',
               'sap/ui/model/json/JSONModel',
               'com/bnsf/eam/tne/model/models',
               'com/bnsf/eam/tne/util/ServiceErrorHandler'
               ], function(BaseController,JSONModel,models,ServiceErrorHandler) {
	"use strict";

	var DashMessagesController = BaseController.extend("com.bnsf.eam.tne.controller.DashMessages", {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf system
		 */
		onInit : function(oEvent) { 		
			var oDataSrvForMessagesFetch =	sap.ui.getCore().getModel('oDataSrvForMessagesFetch');
			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(this._onRouteMatched, this);
			var busyIndicator = new sap.m.BusyDialog('tne.DashMsg.BusyDialog',{
				title:'{i18n>tne.app.BusyIndTitle}',
				showCancelButton: false
			});
		},
		
		/**
		 * On route matched for DashMessage screen
		 * @private
		 * @memberOf tne.dashMsg
		 * @returns null
		 */
		_onRouteMatched: function(oEvent){
			var oArgs;
			var sRoute = oEvent.getParameter("name");
			if(sRoute == "DashDetailsMsg"){
				oArgs = oEvent.getParameter("arguments");
				var defaultModel = sap.ui.getCore().getModel();
				this.sSelGang = oArgs.GangId;
				defaultModel.setProperty("/selGang/id", this.sSelGang);
				this._callDetailsContentMessage(oArgs.GangId);

			};
		},
		
		/**
		 * Sets the number of messages to the Table Header area
		 * Sets the Messages data to the Table
		 * @private
		 * @memberOf tne.dashMsg
		 * @returns null
		 */
		_callDetailsContentMessage : function(GangId){    			
			var that = this;
			var UId = this.getModel().getProperty("/user/id");
			var MsgGrp = GangId;	

			var oDataSrvForMessagesFetch = sap.ui.getCore().getModel('oDataSrvForMessagesFetch');
			var readURL = "/MessageHeaderSet?$filter=(UserId eq '"+UId+"' and MsgGrp eq '"+MsgGrp+"')&$expand=NavMessages";
			sap.ui.getCore().byId("tne.DashMsg.BusyDialog").open();
			oDataSrvForMessagesFetch.read(readURL,
					null,{}, true,
					function(oData, oResponse){
						try{

							var oModel = new sap.ui.model.json.JSONModel(oData.results);
							var oMsgLen = oData.results.length;
							//**** Changes Started -- by Ankush(C840236)--9th Dec'16 ****//							
							if(oMsgLen >= 0){							
								if(oMsgLen == 0){
									var MessageLen = oData.results.length;										
								}else if(oMsgLen > 0){									
									var MessageLen = oData.results[0].NavMessages.results.length;
								}
								//**** Changes End -- by Ankush(C840236)--9th Dec'16 ****//
								var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
								var sTblHdrLbl = "";

								MessageLen > 1 ? sTblHdrLbl = bundle.getText("tne.dashMsg.lbl.TblHdrMultpl", [MessageLen]) :
									sTblHdrLbl = bundle.getText("tne.dashMsg.lbl.TblHdrSingle", [MessageLen]);
								that.byId("tne.DashMsg.TabHdrTitle").setText(sTblHdrLbl);
							};

							//set model to Messages table
							that.getView().byId("tne.DashMsg.TableId").setModel(oModel);
							sap.ui.getCore().byId("tne.DashMsg.BusyDialog").close();
							//This Close busy Dialog ensures that call is returned correctly and data processed correctly
						}catch (e){
							//This Close busy Dialog ensures that call is returned correctly but data processing has errors
							sap.ui.getCore().byId("tne.DashMsg.BusyDialog").close();
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Dashboard - I01008: Error reading Gangs from Search Gangs service");							
						}

					},function(error){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();								
						jQuery.sap.require("sap.m.MessageBox");
						try {
							//This Close busy Dialog ensures that it is closed when backend call returns error
							sap.ui.getCore().byId("tne.DashMsg.BusyDialog").close();
							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.dashMsg.msg.oDataDashFailureMessages"),bundle.getText("tne.dashMsg.msg.MessageScreenErrorNumber"));
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Dashboard - I01002: Error handling exception in Get Gangs Service");
						}

					});

		},
		
		/**
		 * Formatter for Read Messages Status
		 * @public
		 * @memberOf tne.dashMsg
		 * @returns boolean
		 */
		messageReadStatusIconFormatter: function(bRead){
			var sSource = "";
			bRead ? sSource = "sap-icon://email-read" : sSource = "sap-icon://email";
			return sSource;
		},

		/**
		 * Handle for reading the table messages Items
		 * Displaying the Message Dialog box containing message description
		 * @public
		 * @memberOf tne.dashMsg
		 * @returns null
		 */
		callDialogMessagebox:function(oEvent){
			var that = this;
			var oDataSrvForMessagesFetch = sap.ui.getCore().getModel('oDataSrvForMessagesFetch');
			sap.ui.getCore().byId("tne.DashMsg.BusyDialog").open(); 
			// Opening a Busy Indicator while reading the Message		
			var oSelectedElement = sap.ui.getCore().getElementById(oEvent.getSource().sId).getBindingContext().sPath;
			//Get values for read call to Messages

			var userId = that.getModel().getProperty("/user/id");		
			var oTableModel = oEvent.getSource().getModel();
			var MsgID = oTableModel.getProperty(oSelectedElement).MsgID;
			var MsgGrp = oTableModel.getProperty(oSelectedElement).MsgGrp;

			var readURLfrMsg = "/messages(UserId='"+userId+"',MsgGrp='"+MsgGrp+"',MsgID='"+MsgID+"')";

			if (! this._oPopover){			
				this._oPopover = sap.ui.xmlfragment("com.bnsf.eam.tne.fragments.MessageDialog", this);
			};	

			this.oMsgModel = new sap.ui.model.json.JSONModel();
			
			//Read message details
			oDataSrvForMessagesFetch.read(readURLfrMsg,
					null,{}, true,
					function(oData, oResponse){
						try{
							that.oMsgModel.setData(oData);
							//parse message body for breaks in hyperlinks
							var parsedBody = oData.Body;
							//check if message has hyperlinks
							var aHREFfound = oData.Body.match(/href\=\"(.*?)\"/g);

							if(aHREFfound && aHREFfound.length > 0){ //if found, remove white space from hyperlinks
								var aHREFParsed = aHREFfound.map(function(val){
									return val.replace(/ /g, '');
								});

								var index = 0;
								parsedBody = oData.Body.replace(/href\=\"(.*?)\"/g, function() {
									index++;
									return aHREFParsed[index -1];
								});
							};
							//set parsed body to OData.Body
							oData.Body = parsedBody;

							that._oPopover.setModel(that.oMsgModel);
							sap.ui.getCore().byId("tne.DashMsg.BusyDialog").close();
							that.getView().addDependent(that._oPopover);

							that._oPopover.open();
						}catch (e){
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Dashboard - I01008: Error reading Gangs from Search Gangs service");
							sap.ui.getCore().byId("tne.DashMsg.BusyDialog").close();
						};
					},function(error){
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();								
						jQuery.sap.require("sap.m.MessageBox");
						try {
							sap.ui.getCore().byId("tne.DashMsg.BusyDialog").close();
							com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.dashMsg.msg.oDataDashFailureMessages"),bundle.getText("tne.dashMsg.msg.MessageScreenErrorNumber"));
						} catch (e) {
							com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e, "Dashboard - I01002: Error handling exception in Get Gangs Service");
						};
					});
		},
		
		/**
		 * Handler for Message dialog Close
		 * Calling the update function when message property ‘Read’ is false
		 * @public
		 * @memberOf tne.dashMsg.MessageDialog
		 * @returns null
		 */
		onMessagePreviewClose: function(e){ // Calling this method from MessageDialog.fragment
			this._oPopover.close();
			var oDataSrvForMessagesFetch = sap.ui.getCore().getModel('oDataSrvForMessagesFetch');
			var oMsgModelData = this._oPopover.getModel().getData();
			var userId = this.getModel().getProperty("/user/id");
			var MsgGrp = oMsgModelData.MsgGrp;
			var MsgID = oMsgModelData.MsgID;
			var read = oMsgModelData.Read;	
			
			// Help Desk = H, SuperUser = U, TimeKeeper = T
			// For the Users, ensures that the roles "U" and "H" should update the status of  messages. 
			var oUiModel = this.getModel();
			var role = oUiModel.getProperty("/user/role");
			
			if(!read && !((role == "H") || (role == "U"))){ //call the update function when message property ‘Read’ is false
				
				var readURL = "/messages(UserId='"+userId+"',MsgGrp='"+MsgGrp+"',MsgID='"+MsgID+"')";						
				var updateData = {
						MsgID:oMsgModelData.MsgID,
						MsgGrp:oMsgModelData.MsgGrp
				};
				var that = this;
				oDataSrvForMessagesFetch.update(readURL,updateData ,null,
						function(oData,oResponse){
					try{														
						//that.oMsgModel.setProperty("/Read",true);
						that._callDetailsContentMessage(MsgGrp);

						jQuery.sap.require("sap.m.MessageBox");
						var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();						
						sap.m.MessageToast.show(bundle.getText("tne.dashMsg.msg.oDataMessagesReadConfirmation"), {
							duration: 2000,                
							width: "20em",                   
							my: sap.ui.core.Popup.Dock.CenterCenter,             
							at: sap.ui.core.Popup.Dock.CenterCenter,            
						});	
					}catch (e) {
						com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Messages - I00005: Error handling response in Get Messages Service");
					}

				},function(error){
					var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
					jQuery.sap.require("sap.m.MessageBox");
					try {
						com.bnsf.eam.tne.util.ServiceErrorHandler.handleODataError(error,bundle.getText("tne.dashMsg.msg.oDataErrRdngMsg"),bundle.getText("tne.dashMsg.msg.MessageScreenErrorNumber"));
					} catch (e) {
						com.bnsf.eam.tne.util.ServiceErrorHandler.unknownErrorFunc(e,"Messages - I00006: Error handling exception in Get Messages Service");
					}
				});
			};
		},
		/**
		 * Formatter for acknowledge reading the message
		 * @public
		 * @memberOf tne.dashMsg
		 * @returns boolean
		 */
		formatMsgAck: function(type){ // Calling this method from MessageDialog.fragment
			var bReturn = true;
			type == "G" ? bReturn = true : bReturn = false;
			return bReturn;
		}

	});
	return DashMessagesController;
});