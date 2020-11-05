jQuery.sap.require("sap/ui/thirdparty/d3");
jQuery.sap.require("sap.ui.commons.DropdownBox");
jQuery.sap.require("sap.ui.core.ListItem");
jQuery.sap.require("sap.m.Select");
jQuery.sap.require("sap.m.ObjectListItem");
jQuery.sap.declare("com.bnsf.tne.BiWeeklyCalendar");

sap.ui.core.Control.extend("com.bnsf.tne.BiWeeklyCalendar", {
	metadata : {
		properties: {
			title: {type : "string", group : "Misc", defaultValue : "Calendar Title"},
			cycle: {type:"any", group: "Misc", defaultValue: new Date()},
			fwdScroll: {type : "int", group : "Misc", defaultValue : 0},
			backScroll: {type : "int", group : "Misc", defaultValue : 0},
			cellWidth: {type : "float", group : "Misc", defaultValue : 100},
			cellHeight: {type : "float", group : "Misc", defaultValue : 100}
		},
		aggregations : {
			"items" : { type: "com.bnsf.tne.CalendarEvents", multiple : true, singularName : "item"},
			_cycles : { type: "sap.m.Select", multiple : false, visibility: "hidden"}
		}
		,
		defaultAggregation : "items",
		events: {
			"onSelect" : {enablePreventDefault : true},
			"onChange":{enablePreventDefault : true}		
		}			
	},

	
	init : function() {
		oCycleList   = new sap.m.Select("idCycleList", {
			autoAdjustWidth:true
		});
		this.setAggregation("_cycles", oCycleList);
		initailizedFlag = false;
	},
	
	
	/**
	 * The renderer render calls all the functions which are necessary to create the control,
	 * @param oRm {RenderManager}
	 * @param oControl {Control}
	 */
	renderer : function(oRm, oControl) {
		var ctrID = oControl.getId();
		oRm.write("<div id=\"" + ctrID + "\"");
		oRm.writeControlData(oControl);
		oRm.write(">");
		oRm.write("<div id=\"back\"");
		oRm.writeClasses();
		oRm.write(">");
			oRm.write("<button id=\"btnBack\" class=\"bnsf-calendar-backBtn\"><</button>");
		oRm.write("</div>");
		oRm.write("<div id=\"cal\"");
		oRm.addClass("bnsf-calendar");
		oRm.writeClasses(); 
		oRm.write(">");
			oRm.write("<div>");
            oRm.renderControl(oControl.getAggregation("_cycles"));
            oRm.write("</div>");
			oRm.write("<div id=\"" + ctrID + "-cal\"");
			oRm.write("></div>");
		oRm.write("</div>");
		oRm.write("<div id=\"forward\">");
		oRm.writeClasses(); 
			oRm.write("<button id=\"btnForward\" class=\"bnsf-calendar-fwdBtn\">></button>");
		oRm.write("</div>");
		oRm.write("</div>");

	},
	
	onAfterRendering: function(){
		var cItems = this.getItems();
		var calEvents = [];
		for (var i=0;i<cItems.length;i++){
			var oEntry = {};
			for (var j in cItems[i].mProperties) {
				oEntry[j]=cItems[i].mProperties[j];
			}					
			calEvents.push(oEntry);
		};
		//D3.js code 
		var calendar,
		parent = this,
		scrollCount = 0,
		parentElem = "#" + this.getId() +"-cal",
        cellWidth = getElementFontSize(this.getCellWidth()),
        cellHeight = getElementFontSize(this.getCellHeight()),
        headerCellHeight = cellHeight/3.33,
        footerCellHeight = cellHeight/3,
        calendarWidth = cellWidth*7, 
        calendarHeight = (cellHeight*4) + headerCellHeight + footerCellHeight,
        backScroll = this.getBackScroll();
        fwdScroll = this.getFwdScroll();
        ACTIVE_CELL_STYLE = 'activeCell',
        INACTIVE_CELL_STYLE = 'inactiveCell',
        ACTIVE_TEXT_STYLE = 'activeCellText',
        INACTIVE_TEXT_STYLE = 'inactiveCellText',
        CURRENT_DAY_TEXT_STYLE = 'currentDayCellText',
        REST_TEXT_STYLE = 'restCellText',
        HEADER_CELL_STYLE = 'headerCell',
        HEADER_TEXT_STYLE = 'headerText', 
        INACTIVE_EVENT_STYLE = 'inactiveEvtStyle',
        LEGEND_TEXT_STYLE = 'legendText',
        months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        legendData=["Accepted", "Rejected","Draft"],
        legendDataRest= ["Rest Day Accepted", "Rest Day Rejected" , "Rest Day Draft"],
//        selectedCycle = new Date(),
        selectedCycle = this.getCycle(),
        currentCycle = getCurrentCycle(),
        dropDownPopulate = getSelectableCycleList(),
        initialrenderer = renderCalendarCommons(),
        currentCycleRenderer = renderCurrentCycle();
        initCycles = getSelectableCycleList();
        
        $('#btnBack').click(displayPreviousCycle);
		$('#btnForward').click(displayNextCycle);
		$('#idCal').on("swiperight",function(){
			displayPreviousCycle();
        }); 
        $('#idCal').on("swipeleft",function(){
        	displayNextCycle();
        });
        
        //enable or diable navigation buttons
        if(scrollCount >= fwdScroll){
        	$('#btnForward').prop("disabled", true);
    		$('#btnForward').addClass("bnsf-calendar-scrollBtn-disabled");
    	}else{
    		$('#btnForward').prop("disabled", false);
    		$('#btnForward').removeClass("bnsf-calendar-scrollBtn-disabled");
    	};
    	if(scrollCount <= (-1*(backScroll - 1)) ){
    		$('#btnBack').prop("disabled", true);
    		$('#btnBack').addClass("bnsf-calendar-scrollBtn-disabled");
    	}
    	else{
    		$('#btnBack').prop("disabled", false);
    		$('#btnBack').removeClass("bnsf-calendar-scrollBtn-disabled");
    	};
    	
//        $('#btnForward').prop("disabled",true);
//		$('#btnForward').addClass("bnsf-calendar-scrollBtn-disabled");
        
        oCycleList.attachChange("",function(oEvent){
			selectedCycle = new Date(oEvent.oSource.getSelectedKey());
			var selectedIndex = oEvent.oSource.indexOfItem(oEvent.getParameters().selectedItem);
//			scrollCount = selectedIndex*-1;
			scrollCount = fwdScroll -  selectedIndex;
        	if(scrollCount >= fwdScroll ){
        		$('#btnForward').prop("disabled", true);
        		$('#btnForward').addClass("bnsf-calendar-scrollBtn-disabled");
        	}
        	else{
        		$('#btnForward').prop("disabled", false);
        		$('#btnForward').removeClass("bnsf-calendar-scrollBtn-disabled");
        	}
        	if(scrollCount <= (-1*(backScroll - 1)) ){
        		$('#btnBack').prop("disabled", true);
        		$('#btnBack').addClass("bnsf-calendar-scrollBtn-disabled");
        	}
        	else{
        		$('#btnBack').prop("disabled", false);
        		$('#btnBack').removeClass("bnsf-calendar-scrollBtn-disabled");
        	}
			renderCurrentCycle();
		});
        
        function getEvents(){
     	   var currentCycleEvents = [];
     	   var cycleStart = selectedCycle;
     	   var cycleEnd;
     	   var oToday = new Date();
     	   (cycleStart.getDate() < 16)? 
     			   (cycleEnd = new Date(cycleStart.getFullYear(), cycleStart.getMonth(), 16)) : 
     			   (cycleEnd = new Date(cycleStart.getFullYear(), cycleStart.getMonth()+1, 1));	
     	   for(i=0; i < calEvents.length; i++){
     		   var eventDateMS = Date.parse(calEvents[i].date);
     		   var eventDate = new Date(eventDateMS);
     		   if((eventDateMS >= cycleStart) && (eventDateMS < cycleEnd))
     			   currentCycleEvents[eventDate.getDate()] = calEvents[i];  		   
     	   }  
 		 //check for current date event
     	   if((oToday >= cycleStart) && (oToday <= cycleEnd)){
     		   if(currentCycleEvents[oToday.getDate()] != null)
     			 currentCycleEvents[oToday.getDate()].today = true;
     		   else
     			 	currentCycleEvents[oToday.getDate()] = {"today" : true};   
     	   }
     	   return currentCycleEvents;   	   
         }
		
		
        function createCalendarData() {
        	var sc = selectedCycle;
     	   	var dataArray = [];
     	   	var oEvents = getEvents();
     	   
            var monthStartDay = new Date(sc.getFullYear(), sc.getMonth(), 1).getDay();
            var monthEndDay = new Date(sc.getFullYear(), sc.getMonth()+1, 0).getDay();
            var monthLastDate = new Date(sc.getFullYear(), sc.getMonth() +1, 0 ).getDate();
            var prevMonthStartDate = new Date(sc.getFullYear(), sc.getMonth(), (-1 * monthStartDay)+1 ).getDate();
            var prevMonthEndDate = new Date(sc.getFullYear(), sc.getMonth(), 0 ).getDate();
            var vDate;	
            var data;
     	   	if (sc.getDate() <=15){
     	   		if (monthStartDay != 0){
     	   			for (i = prevMonthStartDate ; i <= prevMonthEndDate; i++){
     	   				vDate = new Date(sc.getFullYear(), sc.getMonth()-1, i);
     	   				dataArray.push({cell: "", today: false, text: i, type: "I", event: "B", date: vDate, active: false});
     	   			}
     	   		}
     		   for (i = 1; i <= 15; i++){
     			   vDate = new Date(sc.getFullYear(), sc.getMonth(), i);
     			   data = {cell: "", today: false, text: i, type: "W", event: "B", date: vDate, active: false};
     			   if (oEvents[i] != null){
     				   if(oEvents[i].today)
     					   data.today = true;
     				   if(oEvents[i].event != null)
     					   data.event = getEventType(oEvents[i].event);
     				   if(oEvents[i].editable != null)
     					   data.active = oEvents[i].editable;
     				   if(oEvents[i].dayType != null)
     					   data.type = getDayType(oEvents[i].dayType);
     			   }
     			   dataArray.push(data);	
     		   }
     		   for (i = 16; i <= (21-monthStartDay); i++){
  			   	  var vDate = new Date(sc.getFullYear(), sc.getMonth(), i);
	              dataArray.push({cell: "", today: false, text: i, type: "I", event: "B", date: vDate, active: false});
     		   }
     	   	}else {
     		   //16 of month starts the next day as 1st
     	   		if (monthStartDay != 6){  //No days from previous cycle required if month starts on Sat
	        		   for (i = (15-monthStartDay); i <= 15; i++) {
	      			   	  vDate = new Date(sc.getFullYear(), sc.getMonth(), i);
		                  dataArray.push({cell: [], today: false, text: i, type: "I", event: "B", date: vDate, active: false});
	        		   }
     	   		}
     	   		for (i = 16; i <= monthLastDate; i++) {
      			   vDate = new Date(sc.getFullYear(), sc.getMonth(), i);
      			   data = {cell: [], today: false, text: i, type: "W", event: "B", date: vDate, active: false};
      			   if (oEvents[i] != null){
      				   if(oEvents[i].today)
      					   data.today = true;
      				   if(oEvents[i].event != null)
      					   data.event = getEventType(oEvents[i].event);
      				   if(oEvents[i].editable != null)
      					   data.active = oEvents[i].editable;
      				   if(oEvents[i].dayType != null)
      					   data.type = getDayType(oEvents[i].dayType);
      			   }
      			   dataArray.push(data);		                   
     	   		}
     	   		if(monthEndDay != 6){
	        		   for (i = 1; i <= (6 - monthEndDay); i++){
	      			   	  vDate = new Date(sc.getFullYear(), sc.getMonth()+1, i);
		                  dataArray.push({cell: [], today: false, text: i, type: "I", event: "B", date: vDate, active: false});
	        		   }        		   
     	   		}
     	   	}
     	   	
     	   var noOfWeeks = Math.round(dataArray.length/7);
           for (var y = 0; y < noOfWeeks; y++) {
               for (var x = 0; x < 7; x++) {
            	   dataArray[(7*y)+x].cell = [(x * cellWidth), (y * cellHeight) + headerCellHeight];
               }
           }
            return dataArray;	        	  	   
        }
        
        
        function getEventType(oEvent){
     	   switch (oEvent) {
     	    case "A":
     	        return "A";
     	        break;
     	    case "R":
     	    	return "R";
     	        break;
     	    case "P":
     	    	return "P";
     	        break;
     	    default:
     	    	return "B";
     	    	break;
     	   }
         }
        
        function getEventText(oEvent){
            switch (oEvent) {
             case "A":
                 return "Accepted";
                 break;
             case "R":
            	 return "Rejected";
                 break;
             case "P":
            	 return "Draft";
                 break;
             default:
                return "";
               	break;
            }
         }
        
        function getDayType(oEvent){
      	   switch (oEvent) {
      	    case "Work":
      	        return "W";
      	        break;
      	    case "Rest":
      	    	return "R";
      	        break;
      	    default:
      	    	return "W";
      	    	break;
      	   }
         }
        
        function getCurrentCycle(){
//     	   var oDate = new Date();
           if(selectedCycle == null || selectedCycle == undefined || isNaN(Date.parse(selectedCycle))){
         	   selectedCycle = new Date();
           };
      	   var oDate = new Date(Date.parse(selectedCycle));
     	   if(oDate.getDate() <= 15){
     		   selectedCycle = new Date(oDate.getFullYear(), oDate.getMonth(), 1); 
     	   }else{
     		   selectedCycle = new Date(oDate.getFullYear(), oDate.getMonth(), 16);
     	   };
     	   
     	   //calculate scroll count for selected cycle vs current date
     	  var selectedCycleStart = new Date(selectedCycle);
     	  var oToday = new Date();
     	  var dTodayCycleStart = null;
     	  if(oToday.getDate() <= 15){
     		 dTodayCycleStart = new Date(oToday.getFullYear(), oToday.getMonth(), 1); 
   	   	  }else{
   	   		 dTodayCycleStart = new Date(oToday.getFullYear(), oToday.getMonth(), 16);
   	   	  }; 
   	   	  
   	   	  //Find difference of cycles:
   	   	  var diffYrs = dTodayCycleStart.getFullYear() - selectedCycleStart.getFullYear();
   	   	  var diffMonths = dTodayCycleStart.getMonth() - selectedCycleStart.getMonth();
   	   	  var diffDays = dTodayCycleStart.getDate() - selectedCycleStart.getDate();
   	   	  
   	   	  var diffOfCycles = 24*diffYrs + 2*diffMonths + (diffDays/15);
   	   	  scrollCount = -1*diffOfCycles;
        }
        
        function incrementCycle(){
        	if(scrollCount < fwdScroll){
		     	   var oDate = selectedCycle;
		     	   scrollCount++;
				   if(scrollCount > (fwdScroll-1)){
					   $('#btnForward').prop("disabled",true);
					   $('#btnForward').addClass("bnsf-calendar-scrollBtn-disabled");
				   }
				   if(scrollCount > (1 - backScroll)){
					   $('#btnBack').prop("disabled",false);
					   $('#btnBack').removeClass("bnsf-calendar-scrollBtn-disabled");
				   }
		     	   if(oDate.getDate() <= 15){
		     		   selectedCycle = new Date(oDate.getFullYear(), oDate.getMonth(), 16); 
		     	   }else{
		     		   selectedCycle = new Date(oDate.getFullYear(), oDate.getMonth()+1, 1);
		     	   }
		     	  renderCurrentCycle();
		    	  parent.fireOnChange({selectedCycle: selectedCycle});	     	   
        	}
        }
        
        function decrementCycle(){
        	if(scrollCount > (-1*(backScroll-1))){
			   var oDate = selectedCycle;
			   scrollCount--;
			   if(scrollCount < fwdScroll){
				   $('#btnForward').prop("disabled",false);
				   $('#btnForward').removeClass("bnsf-calendar-scrollBtn-disabled");
			   }
			   if(scrollCount < (2 - backScroll)){
				   $('#btnBack').prop("disabled",true);
				   $('#btnBack').addClass("bnsf-calendar-scrollBtn-disabled");
			   }
			   if(oDate.getDate() <= 15){
	 		   selectedCycle = new Date(oDate.getFullYear(), oDate.getMonth()-1, 16);
			   }else{
				   selectedCycle = new Date(oDate.getFullYear(), oDate.getMonth(), 1);
			   }
			   renderCurrentCycle();
		       parent.fireOnChange({selectedCycle: selectedCycle});	   
        	}
        }
		   
        function getSelectedCycleText(){
		   var oDate = selectedCycle;
		   var selCylText =   months[oDate.getMonth()] + " ";
		   if(oDate.getDate() <= 15){
			   selCylText = selCylText + " 1 - 15";
		   }else{
			   selCylText = selCylText + " 16 - " + new Date(oDate.getFullYear(), oDate.getMonth() + 1, 0).getDate();
		   }
		   selCylText = selCylText + ", " + oDate.getFullYear();
		   return selCylText;
        }
        
        function getSelectedCycleId(){
        	var oDate = selectedCycle;
        	
        	return "_" + oDate.getDate().toString() + oDate.getMonth().toString() + oDate.getFullYear().toString();
        }
        
        function getSelectableCycleList(){
        	if (!initailizedFlag && (backScroll != 0 || fwdScroll != 0)) {
//		  		   var oDate = new Date(selectedCycle);	
        		 var oDate = new Date();
        		 if(fwdScroll > 0 ){
        			 var scrollYear = Math.floor(fwdScroll/24);
        			 var scrollMonth = Math.floor((fwdScroll%24)/2);
        			 var scrollCycle = ((fwdScroll%24)%2);
        			 if(scrollCycle != 0){
        				 if(new Date().getDate() <= 15)
        					 oDate = new Date(new Date().getFullYear(), new Date().getMonth(), 16, 0, 0, 0);
        				 else
        					 oDate = new Date(new Date().getFullYear(), (new Date().getMonth() + 1), 1, 0, 0, 0);
        			 };
        			 if (scrollMonth > 0)
        				 oDate = new Date(oDate.getFullYear(), (oDate.getMonth() + scrollMonth ), oDate.getDate(), 0, 0, 0);
        			 if (scrollYear > 0)
        				 oDate = new Date((oDate.getFullYear() + scrollYear), oDate.getMonth(), oDate.getDate(), 0, 0, 0);
        		 }else{
        			 if(new Date().getDate() <= 15)
    					 oDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0);
    				 else
    					 oDate = new Date(new Date().getFullYear(), new Date().getMonth(), 16, 0, 0, 0);
        		 };
	
		  		 var selCylText = "";
		  		 for(var i = 0; i < (backScroll + fwdScroll); i++){
					   selCylText =   months[oDate.getMonth()] + " ";
					   var orginalDate = new Date(oDate);
					   if(oDate.getDate() <= 15){
						   selCylText = selCylText + " 1 - 15";
						   oDate.setDate(16);
						   oDate.setMonth(oDate.getMonth()-1);
					   }else{
						   selCylText = selCylText + " 16 - " + new Date(oDate.getFullYear(), oDate.getMonth() + 1, 0).getDate();
						   oDate.setDate(1);
					   }
					  selCylText = selCylText + ", " + orginalDate.getFullYear();
					  id = "_" + orginalDate.getDate().toString() + orginalDate.getMonth().toString() + orginalDate.getFullYear().toString();
					  var oItem = new sap.ui.core.ListItem({text:  selCylText, key: orginalDate, id: id});
			     	  oCycleList.addItem(oItem);
		  		 } 
		  		initailizedFlag = true;
        	}
		 return null;
       }
	       
        function displayPreviousCycle() {
    	   decrementCycle();
        }

        function displayNextCycle(){
    	   incrementCycle();
        }
	       
	       
        function getEventStyle(oEvent){
    	   switch (oEvent) {
    	    case "A":
    	        return "acceptedCell";
    	        break;
    	    case "R":
    	    	return "rejectedCell";
    	        break;
    	    case "P":
    	    	return "pendingCell";
    	        break;
    	    default:
    	    	return INACTIVE_EVENT_STYLE;
    	    	break;
    	   }
        }
	       
       function renderCalendarCommons() {
	    	// Add the svg element to the parent element ie. Flex box.	    	   
    	   calendar = d3.select(parentElem)
    	   				.append("svg")
                        .attr("class", "calendar")
                        .attr("width", calendarWidth )
                        .attr("height", calendarHeight)
                        .append("g");
	           
           calendar.append("svg:g").selectAll("rect")
                   .data(weekDays)
                   .enter()
                   .append("rect")
                   .attr("x", function (d, i) { return i * cellWidth; })
                   .attr("y", 0 )
                   .attr("width", cellWidth)
                   .attr("height", headerCellHeight)
                   .attr("class", HEADER_CELL_STYLE);
	           
           calendar.append("svg:g").selectAll("headers")
	                .data(weekDays)
	                .enter()
	                .append("text")
	                .attr("x", function (d, i) { return i * cellWidth ; })
	                .attr("y", function(d) {return headerCellHeight/2 ;})
	                .attr("dx", cellWidth/2) // right padding
	                .attr("dy", 5) // vertical alignment : middle
	                .text(function (d) { return d; })
	                .attr("text-anchor", "middle")
	                .attr("class", HEADER_TEXT_STYLE);
           
           var lw = legendData.length;
           var yOfset = calendarHeight-footerCellHeight+(cellHeight*.10);
           var legCirRad = (cellHeight > cellWidth)? cellWidth : cellHeight;
           
           calendar.append("svg:g").selectAll("legend")
		           .data(legendData)
		           .enter()
		           .append("circle")
		           .attr("cx", function (d, i) { return (i * cellWidth) + (cellWidth*0.10) ; } )
			       .attr("cy", yOfset + (legCirRad*0.10) )
			       .attr("r", (legCirRad*0.10))
			       .attr("fill", function (d){ return (d=="Accepted")? "Green":(d=="Rejected")? "Red":"Yellow" ;});
           
           calendar.append("svg:g").selectAll("legendtext")
		           .data(legendData)
		           .enter()
		           .append("text")
		           .attr("x", function (d, i) { return (i * cellWidth) ; })
		           .attr("y", yOfset)
		           .attr("dx", (cellWidth*0.25)) // right padding
		           .attr("dy", (cellHeight*0.15)) // vertical alignment : middle
		           .text(function (d) { return d; })
		           .attr("text-anchor", "left")
		           .attr("class", LEGEND_TEXT_STYLE );
           
           var xOfset = lw*cellWidth*.9;
           
           calendar.append("svg:g").selectAll("legendRest")
		           .data(legendDataRest)
		           .enter()
		           .append("polygon")
		           .attr("points", function (d, i) { return (xOfset+(cellWidth*.10)+(1.5* i * cellWidth)) + "," + (yOfset+(cellHeight*0)) + "," +
						                                 (xOfset+(cellWidth*0)+(1.5* i * cellWidth)) + "," + (yOfset+(cellHeight*.20)) + "," +		
							                             (xOfset+(cellWidth*.20)+(1.5* i * cellWidth)) + "," + (yOfset+(cellHeight*.20));
												})     
		           .attr("fill", "blue")
		           .attr("stroke", function (d){ return (d=="Rest Day Accepted")? "Green":(d=="Rest Day Rejected")? "Red": "Yellow" ;})
		           .attr("stroke-width", 4);
           
           calendar.append("svg:g").selectAll("legendTextRest")
		           .data(legendDataRest)
		           .enter()
		           .append("text")
		           .attr("x", function (d, i) { return (1.5* i * cellWidth) + xOfset ; })
		           .attr("y", yOfset)
		           .attr("dx", (cellWidth*0.25)) // right padding
		           .attr("dy", (cellHeight*0.15)) // vertical alignment : middle
		           .text(function (d) { return d; })
		           .attr("text-anchor", "left")
		           .attr("class", LEGEND_TEXT_STYLE );	    
           
           
	           calendar.append("svg:g")
			   		   .attr("id", "ID_CELLS");     
	           calendar.append("svg:g")
	   		   		   .attr("id", "ID_CIRCLES");
	           calendar.append("svg:g")
		   		   .attr("id", "ID_TRIANGLES");
	           calendar.append("svg:g")
               		.attr("id", "ID_STATUS_TEXT");

	           
	       }
	       
	       // Function for rendering the days of the cycle in the grid.
       	function renderCurrentCycle() {
	       oCycleList.setSelectedItemId(getSelectedCycleId());
         
           var cellData = createCalendarData();
           
		   calendar.select("#ID_CELLS")
		   		   .selectAll("rect")
                   .data(cellData)
                   .enter()
                   .append("rect")
                   .attr("x", function (d) { return d.cell[0]; })
                   .attr("y", function (d) { return d.cell[1]; })
                   .attr("width", cellWidth)
                   .attr("height", cellHeight)
                   .on("click", function (d) { if(d.active) handleClick(d); });	   							
		   
		   calendar.select("#ID_CELLS")
		   			.selectAll("rect")
                   	.data(cellData)
                   	.exit()
                   	.remove(); 
		   
		   calendar.select("#ID_CELLS")
			   		.selectAll("rect")
			   		.data(cellData)
			   		.attr("class", function (d) { 
			   								return (d.type == "I")? INACTIVE_CELL_STYLE : ACTIVE_CELL_STYLE; })
           
		   var oRadius = (cellWidth>cellHeight)? (cellHeight*.30) : (cellWidth* .30);	   								
			   								
           calendar.select("#ID_CIRCLES")
		   		   .selectAll("circle")
		           .data(cellData)
		           .enter()
		           .append("circle")
		           .attr("cx", function (d) { return d.cell[0] + (cellWidth*.50); })
		           .attr("cy",function (d) { return d.cell[1] + (cellHeight*.40); })
		           .attr("r", oRadius) 	
				   .on("click", function (d) { if(d.active) handleClick(d); });
           
           calendar.select("#ID_CIRCLES")
		  			.selectAll("circle")
		          	.data(cellData)
		          	.exit()
		          	.remove();
           
           calendar.select("#ID_CIRCLES")
		 			.selectAll("circle")
		         	.data(cellData)
		         	.attr("visibility",  function(d){return (d.type === "R")? "hidden": "visible";})
		            .attr("class", function (d) { 
							return getEventStyle(d.event); });
           
		   calendar.select("#ID_TRIANGLES")
		   		   .selectAll("polygon")
		           .data(cellData)
		           .enter()
		           .append("polygon")
		           .attr("points", function (d) { return (d.cell[0]+(cellWidth*.50)) + "," + (d.cell[1]+(cellHeight*.05)) + "," +
		        	   								     (d.cell[0]+(cellWidth*.15)) + "," + (d.cell[1]+(cellHeight*.60)) + "," +		
		        	   								     (d.cell[0]+(cellWidth*.85)) + "," + (d.cell[1]+(cellHeight*.60));
		           								})
		           .on("click", function (d) { if(d.active) handleClick(d); });
		           
		   calendar.select("#ID_TRIANGLES")
		  			.selectAll("polygon")
		          	.data(cellData)
		          	.exit()
		          	.remove();
		   
		   calendar.select("#ID_TRIANGLES")
		 			.selectAll("polygon")
		         	.data(cellData)
		         	.attr("fill", function(d){return (d.type === "R")? "blue": "transparent"; })
		         	.attr("visibility",  function(d){return (d.type === "R")? "visible": "hidden";})
				    .attr("class", function (d) {return getEventStyle(d.event);});

		   
           calendar.select("#ID_DATES").remove();
		   
		   calendar.append("svg:g")
		   			.attr("id", "ID_DATES")
		            .selectAll("text")
		            .data(cellData)
		            .enter()
                	.append("text")
		            .attr("x", function (d) { return d.cell[0]; })
		            .attr("y", function (d) { return d.cell[1]; })
		            .attr("dx", cellWidth/2)
		            .attr("dy", cellHeight/2)
		            .attr("text-anchor", "middle")
		            .text(function (d) { return d.text; })
                    .attr("class", function (d) {
                    	if(d.today)
                    		return CURRENT_DAY_TEXT_STYLE;
                    	else
                    		return (d.type === "W")? (d.active)? ACTIVE_TEXT_STYLE :INACTIVE_TEXT_STYLE: 
                                                                  (d.type === "R")? REST_TEXT_STYLE:INACTIVE_TEXT_STYLE;})
		            .on("click", function (d) { if(d.active) handleClick(d); });
		   
		   calendar.select("#ID_STATUS_TEXT")
           			 .selectAll("text")
		             .data(cellData)
		             .enter()
		             .append("text")
		             .attr("x", function (d) { return d.cell[0]+ (cellWidth*.00); })
		             .attr("y", function (d) { return d.cell[1]+(cellHeight*.68); })
		             .attr("dx", cellWidth/2)
		             .attr("dy", cellHeight/4)
		             .attr("text-anchor", "middle");
		             
 
			calendar.select("#ID_STATUS_TEXT")
			          .selectAll("text")
					  .data(cellData)
					  .exit()
					  .remove();

			calendar.select("#ID_STATUS_TEXT")
			       	  .selectAll("text")
					  .data(cellData)
					  .text(function (d) {return getEventText(d.event);})
					  .attr("class", function(d){return getEventStyle(d.event) + "Text"; })
					  .attr("visibility",  function(d){return (d.event === "B")? "hidden":"visible" ;});	   
       		}	
       
       function handleClick(oItem){
    	   parent.fireOnSelect({selectedDate: oItem.date,
    		   					dayType : oItem.type
    	   });
       }	
       
       function getElementFontSize(oSize) {
		    // Returns a number
		    return parseFloat(
		        // of the computed font-size, so in px
		        getComputedStyle(
		            // for the root <html> element
		            document.documentElement
		        )
		        .fontSize
		    )*oSize;
		}
       	
	}
});
