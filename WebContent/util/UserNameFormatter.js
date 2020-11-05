jQuery.sap.declare("com.bnsf.eam.tne.util.Formatter");

com.bnsf.eam.tne.util.UserNameFormatter ={
		empNoWithAbbName: function(EmpNo,EmpFirst,EmpMiddle,EmpLast,EmpSalutation,maxLength){
			if(maxLength==undefined||maxLength==""){
				maxLength=35;
			};
			//			Capitalizing the initials
			EmpFirst=EmpFirst.charAt(0).toUpperCase()+EmpFirst.slice(1).toLowerCase();
			EmpMiddle=EmpMiddle.charAt(0).toUpperCase()+EmpMiddle.slice(1).toLowerCase();
			EmpLast=EmpLast.charAt(0).toUpperCase()+EmpLast.slice(1).toLowerCase();
			
			
			var nameFormat0 = ""; //full name
			var nameFormat1 = ""; //middle initial
			var nameFormat2 = ""; //middle and first initial
			var nameFormat3 = ""; //last name only
			if(EmpLast == undefined || EmpLast == ""){
				//return only emo no.
				return  EmpNo;
			}else if(EmpMiddle == undefined || EmpMiddle == ""){
				//get full name
				nameFormat0 = EmpNo + " - " + EmpLast + ", " + EmpFirst ;
				//get name Middle initial
				nameFormat1 = EmpNo + " - " + EmpLast + ", " + EmpFirst ;
				//get name First and Middle initial
				nameFormat2 = EmpNo + " - " + EmpLast + ", " + EmpFirst.charAt(0) ;
				//get last name only
				nameFormat3 = EmpNo + " - " + EmpLast ;
			}else{
				//get full name
				nameFormat0 = EmpNo + " - " + EmpLast + ", " + EmpFirst + " " + EmpMiddle ;
				//get name Middle initial
				nameFormat1 = EmpNo + " - " + EmpLast + ", " + EmpFirst + " " + EmpMiddle.charAt(0) ;
				//get name First and Middle initial
				nameFormat2 = EmpNo + " - " + EmpLast + ", " + EmpFirst.charAt(0) + " " + EmpMiddle.charAt(0) ;
				//get last name only
				nameFormat3 = EmpNo + " - " + EmpLast ;
			};
			
			if (nameFormat0.length <= maxLength)
				return nameFormat0;
			else if (nameFormat1.length <= maxLength)
				return nameFormat1;
			else if (nameFormat2.length <= maxLength )
				return nameFormat2;
			else if (nameFormat3.length <= maxLength )
				return nameFormat3;
			else{
				var empName =  nameFormat3.slice(0,maxLength-3) + "...";
				return empName;
			}				
		},
		
		empNoWithNameInitCaps: function(EmpNo,EmpFirst,EmpMiddle,EmpLast,EmpSalutation){
			//Capitalizing the initials			
			EmpFirst=EmpFirst.charAt(0).toUpperCase()+EmpFirst.slice(1).toLowerCase();
			EmpMiddle=EmpMiddle.charAt(0).toUpperCase()+EmpMiddle.slice(1).toLowerCase();
			EmpLast=EmpLast.charAt(0).toUpperCase()+EmpLast.slice(1).toLowerCase();
			
			if(EmpLast == undefined || EmpLast == ""){
				//return only emo no.
				return  EmpNo;
			}else{
				//return full name
				var nameFormat0 = EmpNo + " - " + EmpLast + ", " + EmpFirst + " " + EmpMiddle ;
				return nameFormat0;
			};
			
		}			
};