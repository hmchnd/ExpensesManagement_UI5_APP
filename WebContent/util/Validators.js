jQuery.sap.declare("com.bnsf.eam.tne.util.Validators");

com.bnsf.eam.tne.util.Validators = {
		verifyAbsenteeOverlap: function(oEmp, oAbs){

			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			var oReturn = {
					EmpNo: oEmp.EmployeeId,
					ValidationResult: "S",
					Validations: []
			};

			var oEmpShiftTime = com.bnsf.eam.tne.util.DateAndTimeConversion._offsetStEdDateTime(oEmp.StartTime.ms, oEmp.EndTime.ms);
			var newAbsTime = com.bnsf.eam.tne.util.DateAndTimeConversion._offsetStEdDateTime(oAbs.StartTime.ms, oAbs.EndTime.ms);
			//check if new absentee start time is earlier than end time			
			if(newAbsTime.oStartDT.getTime() > newAbsTime.oEndDT.getTime()){
				var oValidationRes = {
						Result: "E",
						Message: bundle.getText("tne.util.Valdtr.EndTmElrStTm"),
				};
				oReturn.Validations.push(oValidationRes);
				oReturn.ValidationResult = "E";
				return oReturn;
			};

			//Check if Absentee Start time is earlier than Employee Shift time
			if(newAbsTime.oStartDT.getTime() < oEmpShiftTime.oStartDT.getTime()){
				var oValidationRes = {
						Result: "E",
						Message: bundle.getText("tne.util.Valdtr.AbsenteeSTErEmpShftST")
				};
				oReturn.Validations.push(oValidationRes);
				oReturn.ValidationResult = "E";
				return oReturn;
			};

			//Check if Absentee End time is later than Employee Shift time
			if(newAbsTime.oEndDT.getTime() > oEmpShiftTime.oEndDT.getTime()){
				var oValidationRes = {
						Result: "E",
						Message: bundle.getText("tne.util.Valdtr.AbsenteeSTErEmpShftST")
				};
				oReturn.Validations.push(oValidationRes);
				oReturn.ValidationResult = "E";
				return oReturn;
			};

			//Check for new absentee overlap with other existing absentees
			if(oAbs.AbsentRef.OtherDetails == "X")	//IF new absentee allows overlap no need to check for overlap		
				return oReturn;
			else{
				var aExtAbs = oEmp.NavAbsentees;
				for(var i=0; i < aExtAbs.length; i++){
					if(aExtAbs[i].AbsentRef.OtherDetails == "X") //IF existing absentee allows overlap on need to check for overlap
						continue;
					else{
						var extAbsTime = com.bnsf.eam.tne.util.DateAndTimeConversion._offsetStEdDateTime(aExtAbs[i].StartTime.ms, aExtAbs[i].EndTime.ms);
						// |---------| Existing Abs
						//       |--------| New Abs
						if(newAbsTime.oStartDT.getTime() >= extAbsTime.oStartDT.getTime() && 
								newAbsTime.oStartDT.getTime() < extAbsTime.oEndDT.getTime()){
							var oValidationRes = {
									Result: "E",
									Message: "Absentee overlaps with existing absence " + aExtAbs[i].AbsentRef.Description
							};
							oReturn.Validations.push(oValidationRes);
							oReturn.ValidationResult = "E";
						}
						//           |---------| Existing Abs
						//|-------------|		 New Abs
						else if(newAbsTime.oEndDT.getTime() > extAbsTime.oStartDT.getTime() && 
								newAbsTime.oEndDT.getTime() <= extAbsTime.oEndDT.getTime()){
							var oValidationRes = {
									Result: "E",
									Message: bundle.getText("tne.util.Valdtr.AbsenteeOvrlpWithExtAbsence") + aExtAbs[i].AbsentRef.Description
							};
							oReturn.Validations.push(oValidationRes);
							oReturn.ValidationResult = "E";
							//		|---------| Existing Abs
							//|--------------------|		 New Abs	
						}else if(newAbsTime.oEndDT.getTime() <= extAbsTime.oStartDT.getTime() && 
								newAbsTime.oEndDT.getTime() >= extAbsTime.oEndDT.getTime()){
							var oValidationRes = {
									Result: "E",
									Message:  bundle.getText("tne.util.Valdtr.AbsenteeOvrlpWithExtAbsence") + aExtAbs[i].AbsentRef.Description
							};
							oReturn.Validations.push(oValidationRes);
							oReturn.ValidationResult = "E";
						}else{};

					};
				};
				return oReturn;
			};
			return oReturn;	
		},

		verifyEmpShiftOverlap: function(oEmp, oShift){

			var bundle = sap.ui.getCore().getModel("i18n").getResourceBundle();
			var oReturn = {
					EmpNo: oEmp.EmployeeId,
					ValidationResult: "S",
					StartTimeOverlap: false,
					EndTimeOverlap: false
			};

			var oShiftOffset = com.bnsf.eam.tne.util.DateAndTimeConversion._offsetStEdDateTime(oShift.StartTime.ms, oShift.EndTime.ms);

			var aExtAbs = oEmp.NavAbsentees;
			for(var i=0; i < aExtAbs.length; i++){
				var extAbsTime = com.bnsf.eam.tne.util.DateAndTimeConversion._offsetStEdDateTime(aExtAbs[i].StartTime.ms, aExtAbs[i].EndTime.ms);
				if(oShiftOffset.oStartDT.getTime() > extAbsTime.oStartDT.getTime()){
					oReturn.ValidationResult = "E";
					oReturn.StartTimeOverlap = true;
				};
				if(oShiftOffset.oEndDT.getTime() < extAbsTime.oEndDT.getTime()){
					oReturn.ValidationResult = "E";
					oReturn.EndTimeOverlap = true;
				};
			};

			return oReturn;

		},

		getAbsenteeByCode: function(sAbsenteeCode){
			var aAbsentees = sap.ui.getCore().getModel("oAbsenteeType").getData().results;
			if(aAbsentees.length > 0){
				for(var count = 0; count < aAbsentees.length; count++){
					if(aAbsentees[count].Code == sAbsenteeCode)
						return count;
				};			
			};
			return -1;
		},

		getPeopleCount:function(results){
			var pplcount=results.length;
			
			return pplcount;
		},

		rcAfterBefore:function(OTCode){
			if(OTCode == "")
				return false;
			else 
				return true;
		},

		IconFormatter:function(Results, Selected)
		{		
			if(Selected && !jQuery.isEmptyObject(Results))
				return true;
			else
				return false;	
		},

		ColorFormatter:function(Results){
			if(Results != undefined){ 
				if(Results.ErrorCount != null && Results.ErrorCount > 0){	
					return "#EE0000";
				}else if(Results.WarningCount != null && Results.WarningCount > 0){
					return "#E69A17";
				}else
					return "#000000";
			};
		},

		//This function will check whether overlap is present
		//if return true = overlap
		//if return false = not overlapping
		chkOverlap : function(stFirst, etFirst, stSecond, etSecond){
			//All the input values should be in millisecond


			//	     |--------------------|
			// |-----------|
			if(stFirst > stSecond && stFirst < etSecond){
				return true;
			}
			//      |---------|
			//          |---|
			// ,or,
			//    |-----|
			//	  |-----|
			else if(stFirst <= stSecond && etFirst >= etSecond){
				return true;
			}
			//		|--------|
			//		     |--------|
			else if(etFirst > stSecond &&	etFirst < etSecond){
				return true;
			}

			return false;
		},

		// Validation For Expense Save 

		ValidationDIFF: function(sPaycode, sDuration){
			var oReturn = {
					isPayCodeNull: false,
					isDurationNull: false,

			};
			//validating Paycode
			if(sPaycode == null || sPaycode == "") {

				oReturn.isPayCodeNull = true;

			};
			//validating Duration

			if(sDuration == 0 || sDuration == "") {

				oReturn.isDurationNull = true;
			};

			return oReturn;

		},

		ValidationMEAL: function(sPaycode, sIndex, sLS, sZip, sMP, sBMP,sEMP){			
			var oReturn = {
					isPayCodeNull: false,
					isSelectedLS: false,
					isSelectedZIP: false,
					isLSblank: false,
					isMilePostBlank:false,
					isMilePostNotInRange:false,
					isOriginZipBlank:false,

			};
			//validating Paycode
			if(sPaycode == null || sPaycode == "") {

				oReturn.isPayCodeNull = true;

			};
			//validating is LS or ZIP selected		
			if(sIndex == 0 ) {				
				oReturn.isSelectedLS = true;

				if(sLS == "0" || sLS == ""){
					oReturn.isLSblank = true;
				};
				if(sMP == ""){
					oReturn.isMilePostBlank = true;
				}
				if(!(sMP >= parseFloat(sBMP) && sMP <= parseFloat(sEMP))){
					oReturn.isMilePostNotInRange  = true;

				}


			}else if(sIndex == 1 ){				
				oReturn.isSelectedZIP = true;
				if(sZip == ""){
					oReturn.isOriginZipBlank = true;
				}
			} ;		

			return oReturn;
		},

		ValidationVHCL: function(sPaycode, sTrvlCode, sMiles, sDZip, sDCity, sDState, sOZip, sOCity, sOState, sStTime, sDuration){			
			var oReturn = {
					isPayCodeNull: false,
					isTrvlCodeBlank: false,
					isMilesZero: false,
					isZipCityStateNull: false,
					isStTimeNull: false,
					isDurationNull: false,

			};

			//validating Paycode
			if(sPaycode == null || sPaycode == "") {

				oReturn.isPayCodeNull = true;

			};
			//Validate TravelCode
			if(sTrvlCode == null || sTrvlCode == "") {

				oReturn.isTrvlCodeBlank = true;

			};

			//Validate Miles
			if(sMiles == "0000" || sMiles == "") {

				oReturn.isMilesZero = true;

			};

			//validate ZIP/City/State
			if((sDZip == "" && sOZip == "")){				
				oReturn.isZipCityStateNull = true;
				if((sDCity == "" && sOCity == "")){
					oReturn.isZipCityStateNull = true;
					if((sDState == "" && sOState == "")){
						oReturn.isZipCityStateNull = true;
					}else
						oReturn.isZipCityStateNull = false;

				}else
					oReturn.isZipCityStateNull = false;

			}else
				oReturn.isZipCityStateNull = false;;

				// validate start Time			
				if(sStTime == 0 || sStTime == "") {

					oReturn.isStTimeNull = true;
				};

				//validating Duration				
				if(sDuration == 0 || sDuration == "") {

					oReturn.isDurationNull = true;
				};


				return oReturn;

		},
		/**
		 * sets all the checkbox to selected,if the checkbox in the people's header column is selected
		 * if the checkbox is deselected in the table's header,All the checkbox in people table are deselected.		 * 
		 *
		 * 
		 * @returns null
		 */	
		selectDeselect:function(oEvent)
		{
			var oselectFlag=oEvent.getSource().getSelected();
			var oActivityDetailsModel=sap.ui.getCore().getModel("oActivityDetailsModel");
			var aNavActivityPpl=oActivityDetailsModel.getProperty('/NavActivityPeople');
				
					for(var i=0;i<aNavActivityPpl.length;i++)
					{
						if(oselectFlag)
					{
						oActivityDetailsModel.setProperty('/NavActivityPeople/'+i+'/Selected',true);
					
					}
						else
							{
							oActivityDetailsModel.setProperty('/NavActivityPeople/'+i+'/Selected',false);
							}
				}
				
				},
				getEmployeeErrWarnType:function(type)
				{
					if(type=="Error")
						{
						return "sap-icon://error";
						}
					else
						{
						return  "sap-icon://warning"
						}
					
				}

};