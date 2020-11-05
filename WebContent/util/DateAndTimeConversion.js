jQuery.sap.declare("com.bnsf.eam.tne.util.DateAndTimeConversion");

com.bnsf.eam.tne.util.DateAndTimeConversion = {

	convertHHmmToMilliSec : function(pHHmmTime){			
		var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({pattern: "HH:mm"}); 			  
		var oTimeMilliSec = new Date(timeFormat.parse(pHHmmTime)-TZOffsetMs).getTime();
		return oTimeMilliSec;
	},

	convertMilliSecToHHmm : function(pMilliSec){			
		var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({pattern: "HH:mm"}); 
		var oTimeInHHmm = timeFormat.format(new Date(pMilliSec + TZOffsetMs)); 
		return oTimeInHHmm;			 
	},

	convertYYYY_MM_DDTHH_mmToMilliSec : function(Time){
		var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({pattern: "1970-01-01THH:mm"}); 			  
		var oTimeMilliSec = new Date(timeFormat.parse(Time)-TZOffsetMs).getTime();
		return oTimeMilliSec;
	},

	convertLocalDateToMilliSec:function(oDate){
		var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		var oTimeMilliSec = new Date(oDate.getTime() - TZOffsetMs).getTime();				
		return oTimeMilliSec;
	},

	convertLocalTimeMilliSecToHHmm : function(pMilliSec){
		var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({pattern: "HH:mm"}); 
		var oTimeInHHmm = timeFormat.format(new Date(pMilliSec)); 
		return oTimeInHHmm;
	},

	viewConvertLocalTimeMilliSecToHHmm : function(pMilliSec){
		if(pMilliSec == null){
			return null;
		};
		var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		// var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({pattern: "1970-01-01THH:mm"}); 
		var oTimeInHHmm = new Date( pMilliSec + (TZOffsetMs)); 
		return oTimeInHHmm;
	},

	displayDateDDMM:function(oDate){
		if(oDate == null || oDate == undefined){			
			var workDate = this.getModel().getProperty('/selGang/workDate');
			return workDate;
		}else{
			return oDate;
		};
	},

	activityDateDDMM:function(oDate){
		if(oDate == null || oDate == undefined){
			var workDate = sap.ui.getCore().getModel().getProperty('/selGang/workDate');
			return workDate;
		}else{
			return oDate;
		};
	},

	activityTimemstoDate:function(oTime){
		if(oTime != null||oDate != undefined){
			var returnTime=new Date(oTime.ms)
			return returnTime;
		}else
			return oTime;			
	},
	/**
	 * util method to derive current time in ms
	 * 
	 * oDate- Activity WorkDate
	 * oTime-Activity Time 
	 * 
	 * returns activity time in ms
	 *
	 */		
	dateObjForActScr:function(oDate, oTime){
		if((oDate != null || oDate != undefined || oDate !== '') &&
				(oTime != null || oTime != undefined || oTime !== '')){
			var now = oDate;
			var time_now = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
					now.getHours(), now.getMinutes(), now.getSeconds(), oTime);
			var time_now_ms=time_now.getTime();
			return time_now_ms;		
		}else
			return null;
	},

	/*	dateObjForActScroffSet:function(oDate, oTime){
		var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		if((oDate !== null && oDate !== undefined && oDate !== '' )&&
				(oTime !== null && oTime !== undefined && oTime !== '')){
			var now = oDate;
			var time_now = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
					now.getHours(), now.getMinutes(), now.getSeconds(), oTime);
			var time_now_ms=time_now.getTime()-(TZOffsetMs);
			return time_now_ms;		
		}else
			return null;
	},*/

	dateObjForActScroffSet:function(oDate, oTime){
		var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		if((oDate !== null && oDate !== undefined && oDate !== '' )&&
				(oTime !== null && oTime !== undefined && oTime !== '')){
			var now = oDate;
			var time_now = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
			//			oTime.getHours(), oTime.getMinutes())); //, oTime.getSeconds(), oTime);
			var time_now_ms=time_now.getTime() + oTime;
			return time_now_ms;		
		}else
			return null;
	},

	offsetConversion:function(oTimems){
		var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		var offSetTime = oTimems + (TZOffsetMs);
		var oDateTime = new Date(offSetTime)
		return oDateTime;
	},

	/** Function to convert a date object into an object of EDM Type time **/	
	convertDateObjecttoms:function(oDateTime)
	{
		if(oDateTime!==null || oDateTime!== undefined)
			var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		var oTimeEdmMs=oDateTime.getTime()-(TZOffsetMs);
		var returnobjtime={
				__edmType:"Edm.Time",
				ms :oTimeEdmMs				

		}

		return returnobjtime;

	},
	convertDateObjecttoms2:function(oDateTime)
	{
		if(oDateTime!==null || oDateTime!== undefined)
			var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		var oTimeEdmMs=oDateTime-(TZOffsetMs);
		var returnobjtime={
				__edmType:"Edm.Time",
				ms :oTimeEdmMs				

		}

		return returnobjtime;

	},

	convertYYYY_MM_DDTHH_mmToHHmm : function(Time){			
		var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({pattern: "1970-01-01THH:mm"}); 
		var oTimeMilliSec = new Date(timeFormat.parse(Time)-TZOffsetMs).getTime();
		var newTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance({pattern: "HH:mm"}); 
		var oTimeInHHmm = newTimeFormat.format(new Date(oTimeMilliSec + TZOffsetMs)); 
		return oTimeInHHmm;
	},

	convertMilliSecToYYYY_MM_DDTHH_mm : function(pMilliSec){
		var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({pattern: "1970-01-01THH:mm"}); 
		var oTimeInHHmm = timeFormat.format(new Date(pMilliSec + TZOffsetMs)); 
		return oTimeInHHmm;	 
	},

	truncateText:function(pText){
		if(pText==null||pText==""){
			return pText;
		}else if (pText.length>150) {
			pText= pText.substring(0,147)+"...";
			return pText;
		} else {
			return pText;
		}
	},

	createStartandEndDates:function(pWorkDate,pStartDate,pEndDate){			
		var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		pStartDate = pStartDate + TZOffsetMs;
		pEndDate = pEndDate + TZOffsetMs;
		var year = pWorkDate.getFullYear();
		var month = pWorkDate.getMonth();
		var day = pWorkDate.getDate();
		var startHour = new Date(pStartDate).getHours();
		var startMins = new Date(pStartDate).getMinutes();
		var startSeconds = new Date(pStartDate).getSeconds();

		var endHour = new Date(pEndDate).getHours();
		var endMins = new Date(pEndDate).getMinutes();
		var endSeconds = new Date(pEndDate).getSeconds();

		var returnStartDate = new Date(1970,0,1,startHour,startMins,startSeconds);
		var returnEndDate = new Date(1970,0,1,endHour,endMins,endSeconds);

		if(returnStartDate.getTime() > returnEndDate.getTime()){

			returnEndDate.setDate(returnEndDate.getDate() + 1);
			var oLocGangModel =  sap.ui.getCore().getModel("locGangModel");

		};

		var returnObject = {
				startDate:returnStartDate,
				endDate: returnEndDate
		};
		return returnObject;

	},

	saveValueDateInMilliSec:function(pDate){
		var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		var returnMS = pDate.getTime()-TZOffsetMs;
		return returnMS;
	},

	displayValueDate:function(pDate){
		var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		var returnDate = new Date(pDate + TZOffsetMs);
		return returnDate;
	},

	getDateDisplayMMddyyyy: function(oDate){
		var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({pattern: "MM-dd-yyyy"}); 
		var sFormattedDate = timeFormat.format(oDate); 
		return sFormattedDate;
	},

	_offsetStEdDateTime: function(oStartTimeMS, oEndTimeMS){
		var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;
		var oEpoh = new Date(1970, 0, 1, 0, 0, 0, 000).getTime() - TZOffsetMs;
		var oEpohDay2 = new Date(1970, 0, 2, 0, 0, 0, 000).getTime() - TZOffsetMs;
		var oEpohMidNit = new Date(1970, 0, 1, 23, 59, 59, 999).getTime() - TZOffsetMs;

		var bMultiDay = sap.ui.getCore().getModel().getProperty("/selGang/multiDayInd");
		var oShiftST = sap.ui.getCore().getModel().getProperty("/selGang/dayGangProfile/StartTime").ms;
		var oShiftET = sap.ui.getCore().getModel().getProperty("/selGang/dayGangProfile/EndTime").ms;
		if (bMultiDay){
			oShiftET = oEpohDay2 + oShiftET;
		};

		var oReturn = {
				oStartDT: undefined,	
				oEndDT: undefined
		};

		//evaluate start time
		if (!bMultiDay){
			oReturn.oStartDT = new Date(oEpoh + oStartTimeMS);
		}else if(oStartTimeMS >= oShiftST && oStartTimeMS <= oEpohMidNit){
			oReturn.oStartDT = new Date(oEpoh + oStartTimeMS);
		}else if(oStartTimeMS >= oEpohMidNit && oStartTimeMS <= oShiftET){
			oReturn.oStartDT = new Date(oEpohDay2 + oStartTimeMS);
		}else{
			oReturn.oStartDT = new Date(oEpoh + oStartTimeMS);
		};

		//evaluate end time
		if (!bMultiDay){
			oReturn.oEndDT = new Date(oEpoh + oEndTimeMS);
		}else if(oEndTimeMS >= oShiftST && oEndTimeMS <= oEpohMidNit){
			oReturn.oEndDT = new Date(oEpoh + oEndTimeMS);
		}else if(oEndTimeMS >= oEpoh && oEndTimeMS <= oShiftET){
			oReturn.oEndDT = new Date(oEpohDay2 + oEndTimeMS);
		}else{
			oReturn.oEndDT = new Date(oEpoh + oEndTimeMS);
		};

		return oReturn;
	},

	workDateDisplayBreadcrumb: function(oDate){
		var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({pattern: "MMM dd"}); 
		var sFormattedDate = timeFormat.format(oDate); 
		return sFormattedDate;
	},
	
	dateDisplaySelect: function(oDate){
		var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({pattern: "MMM-dd"}); 
		var sFormattedDate = timeFormat.format(oDate); 
		return sFormattedDate;
	},
};