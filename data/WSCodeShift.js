function soapCall(handler, soapFunction, soapBody) {
	try {
		var xmlhttp = new XMLHttpRequest();
		var endpoint = "http://www.eurorisksystems.com:8080/PMSWS/PMSWS11?wsdl"
		xmlhttp.open("POST", endpoint, true);
		xmlhttp.onreadystatechange = function () {
			if (this.readyState == 4) {
				var xml = xmlhttp.responseXML;
				if (this.status != 200) {
					 alert("Parse error: " + xml.parseError.reason);
				} else{
					if (xml.getElementsByTagName("responseCode").length > 0){
						var responseCode = xml.getElementsByTagName("responseCode")[0].textContent;
						if (responseCode == "OK") {
							handler(xml);
						} else if (responseCode == 'INVALID_TOKEN' || responseCode == 'EXECUTION_NODE_IS_NOT_AVAILABLE'|| responseCode == 'EXPIRED_TOKEN'){
							token = "";
							alert("Expired session!");
							pause = true;
							loading(false);
						} else {
							alert("Bussiness exception: " + responseCode);
							toolbar.enableItem("logout");
							loginForm.enableItem("login");
							pause = true;
							loading(false);
						}
					} else {
						alert("Proxy Exception: responseCode not found");
						pause = true;
						loading(false);
					}
				}
			}
		}
		xmlhttp.setRequestHeader("Content-Type", "text/xml");
		xmlhttp.setRequestHeader("SOAPAction", endpoint + "/" + soapFunction);
		var header = "<soapenv:Header/>";
		var body = "<soapenv:Body>" + soapBody + "</soapenv:Body></soapenv:Envelope>";
		xmlhttp.send("<?xml version='1.0' encoding='UTF-8'?><soapenv:Envelope xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/' xmlns:ers='http://ers.bg'>" + header + body);
	} catch (e) {
		console.log("EVERYTHING IS BROKEN");
		console.log(e.message)
		loading(false);
		pause = false;
		return;
	}
}

function getAvailableDomains() {
	soapCall(
		function(xml) {
			try {
				domains = xml.getElementsByTagName("domains");
				for (var i=0; i < domains.length; i++) {
					loginForm.getCombo("domain").addOption([
						[domains[i].textContent,domains[i].textContent]
					]);
				}
				loginForm.getCombo("domain").selectOption(1);
		    } catch (e) {
				alert("An error has occured.\nPlease refresh your page.")
			}
		},
		"getAvailableDomains",
		"<ers:getAvailableDomains/>",
	);
}

function login() {
	soapCall(
		function(xml) {
			try {
				token = xml.getElementsByTagName("token")[0].textContent;
				userName = loginForm.getItemValue("user");
				document.getElementById("usertext").innerHTML = "User: " + userName;
				loginWin.hide();
				getPortfolios();
				loginForm.enableItem("login");
			} catch (e) {
				loading(false);
				alert("Incorrect username or password.")
				loginForm.enableItem("login");
			}
		},
		"login",
		"<ers:login>" +
			"<userName>" + loginForm.getItemValue("user") + "</userName>" +
			"<password>" + loginForm.getItemValue("pass") + "</password>" +
			"<domain>" + loginForm.getItemValue("domain") + "</domain>" +
		"</ers:login>"
	);
}

function logout() {
	if (actionMode == true) {
		soapCall(
			function(xml) {
				actionMode = false;
				logoutA();
			},
			"endActionMode",
			"<ers:endActionMode><token>" + token + "</token></ers:endActionMode>",
		)
	} else {
		logoutA();
	}
	function logoutA() {
		soapCall(
			function(xml) {
				loginWin.show();
				document.getElementById("usertext").innerHTML = "Not logged in"
				loginForm.setItemValue("user", "");
				loginForm.setItemValue("pass", "");
				portGrid.clearAll();
				ordersGrid.clearAll();
				execGrid.clearAll();
				expGrid.clearAll();
				form1.clear();
				form2.clear();
				portCombo.unSelectOption();
				document.getElementById("load").disabled = true;
				document.getElementById("rebook").disabled = true;
				toolbar.disableItem("logout");
				loading(false);
				token = "";
				loginWin.setModal(true);
			},
			"shutDown",
			"<ers:shutDown><token>" + token + "</token></ers:shutDown>",
		)
	}
}

function getPortfolios() {
	soapCall(
		function(xml) {
			analyses = xml.getElementsByTagName("nomValues")[0].textContent;
			analyses += ";Export";
		},
		"getListItemsWithNom",
		"<ers:getListItemsWithNom><token>" + token + "</token><listName>AnalysisList</listName></ers:getListItemsWithNom>",
	);
	soapCall(
		function(xml) {
			var portTemp = xml.getElementsByTagName("nomValues")[0].textContent;
			portfolios = portTemp.split(";");
			for (var i = 2; i < portfolios.length; i++) {
				portfolio = portfolios[i];
				portCombo.addOption([
					[portfolio,portfolio]
				]);
			}
			portCombo.selectOption(0);
			importOE();
		},
		"getListItemsWithNom",
		"<ers:getListItemsWithNom><token>" + token + "</token><listName>Portfolios</listName></ers:getListItemsWithNom>",
	);
	soapCall(
		function(xml) {
			scenarios = xml.getElementsByTagName("nomValues")[0].textContent;
		},
		"getListItemsWithNom",
		"<ers:getListItemsWithNom><token>" + token + "</token><listName>Scenarios</listName></ers:getListItemsWithNom>",
	);
}

function runAnalysis() {
	if (actionMode == true) {
		soapCall(
			function(xml) {
				actionMode = false;
				runAnalysisA();
			},
			"endActionMode",
			"<ers:endActionMode><token>" + token + "</token></ers:endActionMode>",
		)
	} else {
		runAnalysisA()
	}
	function runAnalysisA() {
		rebookPort = portCombo.getActualValue();
	 	document.getElementById("loading-text").innerHTML = "Loading Portfolio: " + portCombo.getComboText();
		form1.clear();
		try {
		 	soapCall(
				function(xml) {
					actionMode = true;
					try {
						soapCall(
							function(xml) {
								checkRunAnalysisStatus();
							},
						"startActionAsync",
						"<ers:startActionAsync>" +
							"<token>" + token + "</token>" +
							"<scenarioID>Standard</scenarioID>" +
							"<outputType>" + portCombo.getActualValue()	+ "</outputType>" +
							"<analysisDate>" + dateISO() + "</analysisDate>" +
							"<analyses><name>Portfolio Load</name></analyses>" +
			        "<analyses><name>Export</name></analyses>" +
						"</ers:startActionAsync>",
			   		);
					} catch (e) {
						endActionMode();
						caught();
					}
				},
				"beginActionMode",
		 		"<ers:beginActionMode>" +
					"<token>" + token + "</token>" +
			    "<positionSelectorType>" + "Portfolio" + "</positionSelectorType>" +
		    	"<selectorID>" + portCombo.getActualValue() + "</selectorID>" +
				"</ers:beginActionMode>",
			);
		} catch(e) {
			caught();
		}
	}
}

function rebook() {
 	document.getElementById("loading-text").innerHTML = "Rebooking Portfolio: " + portCombo.getComboText();
	form1.clear();
	try {
		soapCall(
			function(xml) {
				checkRebook();
			},
		"startActionAsync",
		"<ers:startActionAsync>" +
			"<token>" + token + "</token>" +
			"<scenarioID>Standard</scenarioID>" +
			"<outputType>" + rebookPort	+ "</outputType>" +
			"<analyses><name>Rebooking</name></analyses>" +
		"</ers:startActionAsync>",
			);
	} catch (e) {
		endActionMode();
		caught();
	}

	function checkRebook() {
		soapCall(
			function(xml) {
				var statusCode = "NOK";
				try {
					statusCode = xml.getElementsByTagName("return")[0].getElementsByTagName("statusCode")[0].textContent;
					if (statusCode == "IDLE") {
						return;
					} if (statusCode == "ANOTHER_ACTION_IN_PROCESS") {
						alert("Another action is in process.");
					} if (statusCode == "IDLE_IN_ACTION_MODE") {
						document.getElementById("loading-text").innerHTML = "Reloading Portfolio"
						runAnalysis();
					} else {
						checkRebook();
					}
				} catch(e) {
					endActionMode();
					caught();
				}
			},
			"getCurrentStatus",
			"<ers:getCurrentStatus><token>" + token + "</token></ers:getCurrentStatus>",
		);
	}
}


function checkRunAnalysisStatus() {
	soapCall(
		function(xml) {
			var statusCode = "NOK";
			try {
  			statusCode = xml.getElementsByTagName("return")[0].getElementsByTagName("statusCode")[0].textContent;
				if (statusCode == "IDLE") {
					return;
				} if (statusCode == "ANOTHER_ACTION_IN_PROCESS") {
					alert("Another action is in process.");
				} if (statusCode == "IDLE_IN_ACTION_MODE") {
					document.getElementById("loading-text").innerHTML = "Requesting data"
					getFieldValues();
				} else {
					checkRunAnalysisStatus();
				}
			} catch(e) {
				endActionMode();
				caught();
			}
		},
  	"getCurrentStatus",
  	"<ers:getCurrentStatus><token>" + token + "</token></ers:getCurrentStatus>",
 	);
}

function getFieldValues() {
		soapCall(
			function(xml) {
				try {
					document.getElementById("loading-text").innerHTML = "Importing data"
					portGrid.clearAll();
					var rows = xml.getElementsByTagName("return")[0].getElementsByTagName("rows");
					var buffer = "";
					for (var row = 0; row < rows.length; row++) {
						var cols = rows[row].getElementsByTagName("cols");
						for (var col = 0; col < cols.length; col++) {
							var colItem = cols[parseInt(col)].textContent;
							buffer = buffer + cols[col].textContent + ",";
						}
						buffer += "\n";
					}
					var data = buffer.split("\n");
					var dataArray = [];
					for (i = 0; i < data.length-1; i++) {
						dataArray[i] = data[i].split(",")
						dataArray[i][7] = round(dataArray[i][7],2)
						dataArray[i][8] = round(dataArray[i][8],2)
						dataArray[i][11] = round(dataArray[i][11],2)
						dataArray[i][14] = round(dataArray[i][14],2)
					}
					pause = false;
					portGrid.parse(dataArray,"jsarray");
					loading(false);
					toolbar.enableItem("logout");
					document.getElementById("load").disabled = false
					document.getElementById("rebook").disabled = false
					if (ordersGrid.getSelectedRowId()) {
						form2.unlock();
					} else {
						form1.unlock();
					}
					//toolbar.hideItem("cancel")
					//toolbar.showItem("load")
				} catch (e) {
					endActionMode();
					caught();
				}
			},
			"getFieldValue",
	  	"<ers:getFieldValue>" +
	  		"<token>" + token + "</token>" +
	  		"<fields>Pos ID</fields>" +
				"<fields>ISIN</fields>" +
	  		"<fields>Serial Number</fields>" +
				"<fields>SC Trade</fields>" +
				"<fields>Instr Type</fields>" +
	  		"<fields>Subportfolio/Instrument Name</fields>" +
	  		"<fields>Curr</fields>" +
	  		"<fields>Market Price</fields>" +
				"<fields>Market Price</fields>" +
				"<fields>Market Price Date</fields>" +
				"<fields>Market</fields>" +
	  		"<fields>Volume</fields>" +
				"<fields>Issuer ID</fields>" +
				"<fields>Issuer Name</fields>" +
				"<fields>Depot ID</fields>" +
	  	"</ers:getFieldValue>",
	 	);
}

/*function cancelCurrentAction() {
	soapCall(
		function(xml) {
			document.getElementById("loading-text").innerHTML = "Cancelling";
			endActionMode();
		},
		"cancelCurrentAction",
		"<ers:cancelCurrentAction><token>" + token + "</token></ers:cancelCurrentAction>",
	);
}*/

function endActionMode() {
	soapCall(
		function(xml) {
			actionMode = false;
			pause = false;
			loading(false);
			toolbar.enableItem("logout");
			document.getElementById("load").disabled = false
			if (ordersGrid.getSelectedRowId()) {
				form2.unlock();
			} else {
				form1.unlock();
			}
		},
		"endActionMode",
		"<ers:endActionMode><token>" + token + "</token></ers:endActionMode>",
	)
}

var tables 	= ['OMSOrders','OMSExecutions'];
var buffers	= ['OrdersBuffer','ExecutionsBuffer'];
var varIncr = 0;
var varLimiter = 0;
var bufferOE = '';

function importOE() {
	var idxImport = 0;
	document.getElementById("loading-text").innerHTML = "Importing " + tables[idxImport];
	varLimiter = 2;
	varIncr = idxImport
	importNextTable(idxImport);
}

function importNextTable(idxImport) {
		var table = tables[idxImport];
		soapCall(
			function(xml) {
				checkImportStatusOE();
			},
			"startResultsBuildAsync",
			"<ers:startResultsBuildAsync>" +
				"<token>" + token + "</token>" +
				"<tableName>" + table + "</tableName>" +
				"<selectParams>" +
					"<name>ORD_OWNER</name>" +
					"<value>" + userName + "</value>" +
				"</selectParams>" +
			"</ers:startResultsBuildAsync>",
		);
}

function checkImportStatusOE(){
	soapCall(
		function(xml) {
			var statusCode = 'NOK';
			statusCode = xml.getElementsByTagName("return")[0].getElementsByTagName("statusCode")[0].textContent;
			if (statusCode == "IDLE") {
				importTableOE();
			} else {
				checkImportStatusOE();
				document.getElementById("loading-text").innerHTML += ".";
			}
		},
		'getCurrentStatus',
		'<ers:getCurrentStatus><token>' + token + '</token></ers:getCurrentStatus>',
	);
}

function getBuffer(idx) {
	if (idx == 0) {
		return 'OrdersBuffer';
	} else if	(idx == 1) {
		return 'ExecutionsBuffer';
	} else {
		return '';
	}
}

function importTableOE() {
	soapCall(
		function(xml) {
			try {
				var idxImport = varIncr;
				var data = Base64.decode(xml.getElementsByTagName("return")[0].getElementsByTagName("data")[0].textContent).replace(/,/g, '.').replace(/;/g, ',');
				var buffer = getBuffer(idxImport);
				idxImport++;
				varIncr = idxImport;
				var maxIdxImport = varLimiter
				var dataArray = [];
				var dataArrayTemp = data.split(",");
				var dataArrayTemp2 = [];
				if (idxImport == maxIdxImport) {
					document.getElementById("load").disabled = false
					toolbar.enableItem("logout");
					loading(false);
					for (i = 0; i < dataArrayTemp.length; i++) {
						if (i % 8 == 0 && i != 0) {
							if (i % 7 != 0) {
								dataArrayTemp2.push(dataArrayTemp[i-8], dataArrayTemp[i-7], dataArrayTemp[i-6], dataArrayTemp[i-5], dataArrayTemp[i-4],
									dataArrayTemp[i-3], dataArrayTemp[i-2]);
								dataArray.push(dataArrayTemp2);
								dataArrayTemp2 = [];
							}
						}
					}
				execGrid.clearAll();
				execGrid.parse(dataArray,"jsarray");
				execGrid.sortRows(1,"sort_custom","asc");
				pause = false;
        loginWin.setModal(false);
				} else {
					for (i = 0; i < dataArrayTemp.length; i++) {
						if (i % 14 == 0 && i != 0) {
							if (dataArrayTemp[i-1] == "GTC") {
								dataArrayTemp[i-3] = "Valid Till Cancel";
							}
							dataArrayTemp2.push(dataArrayTemp[i-14], dataArrayTemp[i-13], dataArrayTemp[i-12], dataArrayTemp[i-11], dataArrayTemp[i-10],
								dataArrayTemp[i-9], dataArrayTemp[i-8], dataArrayTemp[i-7], dataArrayTemp[i-6], dataArrayTemp[i-5], dataArrayTemp[i-4],
								dataArrayTemp[i-3], dataArrayTemp[i-2], dataArrayTemp[i-1]);
							if (dataArrayTemp2[6] == "Limit" || dataArrayTemp2[6] == "Stop Limit") {
							} else {
								dataArrayTemp2[7] = "-";
							}
							if (dataArrayTemp2[6] == "Stop" || dataArrayTemp2[6] == "Stop Limit") {
							} else {
								dataArrayTemp2[8] = "-";
							}
							dataArrayTemp2[0] = dataArrayTemp2[0].replace(/(\r\n|\n|\r)/gm,"");
							dataArray.push(dataArrayTemp2);
							dataArrayTemp2 = [];
						}
					}
					ordersGrid.clearAll();
					ordersGrid.parse(dataArray,"jsarray");
					validMove();

					ordersGrid.sortRows(0,"sort_custom","asc");
					expGrid.sortRows(0,"sort_custom","asc");
					document.getElementById("loading-text").innerHTML = "Importing " + tables[idxImport];
					importNextTable(idxImport);
				}
			} catch(e){
				console.log(e);
				caught();
			}
		},
		'getCurrentResultsWithColDef',
		'<ers:getCurrentResultsWithColDef><token>' + token + '</token></ers:getCurrentResultsWithColDef>',
	);
}

function omsNewOrder() {
	if (form1.getItemValue("tif") == "GTD") {
		soapCall(
			function(xml) {
				document.getElementById("loading-text").innerHTML = "Creating new order";
				omsCheckErrors();
			},
			"omsNewOrder",
			"<ers:omsNewOrder>" +
				"<token>" + token + "</token>" +
				"<symbol>" + form1.getItemValue("isin") + "</symbol>" +
				"<quantity>" + form1.getItemValue("quantity") + "</quantity>" +
				"<side>" + form1.getItemValue("side") + "</side>" +
				"<type>" + form1.getItemValue("type") + "</type>" +
				"<limit>" + form1.getItemValue("limit") + "</limit>" +
				"<stop>" + form1.getItemValue("stop") + "</stop>" +
				"<tif>" + form1.getItemValue("tif") + "</tif>" +
				"<expire>" + form1.getCalendar("date").getFormatedDate("%Y%m%d-%H:%i:%s") + "</expire>" +
			"</ers:omsNewOrder>",
		);
	} else {
		soapCall(
			function(xml) {
				document.getElementById("loading-text").innerHTML = "Creating new order";
				omsCheckErrors();
			},
			"omsNewOrder",
			"<ers:omsNewOrder>" +
				"<token>" + token + "</token>" +
				"<symbol>" + form1.getItemValue("isin") + "</symbol>" +
				"<quantity>" + form1.getItemValue("quantity") + "</quantity>" +
				"<side>" + form1.getItemValue("side") + "</side>" +
				"<type>" + form1.getItemValue("type") + "</type>" +
				"<limit>" + form1.getItemValue("limit") + "</limit>" +
				"<stop>" + form1.getItemValue("stop") + "</stop>" +
				"<tif>" + form1.getItemValue("tif") + "</tif>" +
			"</ers:omsNewOrder>",
		);
	}
}

function omsCancelOrder() {
	try {
		soapCall(
			function(xml) {
				document.getElementById("loading-text").innerHTML = "Cancelling order";
				omsCheckErrors();
			},
			"omsCancelOrder",
			"<ers:omsCancelOrder>" +
				"<token>" + token + "</token>" +
				"<origID>" + ordersGrid.cells(ordersGrid.getSelectedRowId(),0).getValue() + "</origID>" +
			"</ers:omsCancelOrder>"
		)
	} catch(e) {
		caught();
	}
};

function omsReplaceOrder() {
	try {
		soapCall(
			function(xml) {
				document.getElementById("loading-text").innerHTML = "Replacing order";
				omsCheckErrors();
			},
			"omsReplaceOrder",
			"<ers:omsReplaceOrder>" +
				"<token>" + token + "</token>" +
				"<origID>" + ordersGrid.cells(ordersGrid.getSelectedRowId(),0).getValue() + "</origID>" +
				"<quantity>" + form2.getItemValue("o_quantity") + "</quantity>" +
				"<limit>" + form2.getItemValue("o_limit") + "</limit>" +
			"</ers:omsReplaceOrder>"
		)
	} catch(e) {
		caught();
	}
};

function omsCheckErrors() {
	soapCall(
		function(xml) {
			try {
				var returned = xml.getElementsByTagName("return")[0].textContent;
				if (returned == "OK") {
					omsCheckOrders();
				} else {
					var errorMessages = xml.getElementsByTagName("return")[0].getElementsByTagName("messages")[0].textContent;
					alert(errorMessages);
					loading(false);
					return;
				}
			} catch (e) {
				caught();
			}
		},
		'omsCheckErrors',
		'<ers:omsCheckErrors>' +
			'<token>' + token + '</token>' +
		'</ers:omsCheckErrors>',
	);
}

function omsCheckOrders() {
	soapCall(
		function(xml) {
			try {
				var dataArray2 = []
				var data = [];
				var dataTemp = xml.getElementsByTagName("return")[0].getElementsByTagName("messages");
				for (i = 0; i < dataTemp.length; i++) {
					data += dataTemp[i].textContent + ",";
				}
				var dataArray = data.split(",");
				dataArray.pop();
				for (i = 0; i <= dataArray.length; i++) {
					if (i % 14 == 0 && i != 0) {
						if (dataArray[i-1] == "GTC") {
							dataArray[i-3] = "Valid Till Cancel";
						}
						if (dataArray[i-8] == "Limit" || dataArray[i-8] == "Stop Limit") {
						} else {
							dataArray[i-7] = "-";
						}
						if (dataArray[i-8] == "Stop" || dataArray[i-8] == "Stop Limit") {
						} else {
							dataArray[i-6] = "-";
						}
						dataArray[i-5] = round(dataArray[i-5],0);
						ordersGrid.forEachRow(function(id){
							if (dataArray[i-14] == ordersGrid.cells(id,0).getValue()) {
								ordersGrid.deleteRow(id);
								form1.unlock();
								form2.lock();
							}
						});
						dataArray2.push(dataArray[i-14], dataArray[i-13], dataArray[i-12], dataArray[i-11], dataArray[i-10], dataArray[i-9], dataArray[i-8], dataArray[i-7],
							dataArray[i-6], dataArray[i-5], dataArray[i-4], dataArray[i-3], dataArray[i-2], dataArray[i-1], dataArray[i]);
						ordersGrid.filterBy(0,"");
						ordersGrid._f_rowsBuffer = null;
						var newId = (new Date()).valueOf();
						ordersGrid.addRow(newId,dataArray2);
						validMove();
						ordersGrid.sortRows(0,"sort_custom","asc");
						expGrid.sortRows(0,"sort_custom","asc");
						ordersGrid.filterByAll();
						dataArray2 = []
					}
				}
			pause = false;
			} catch (e) {
				caught();
			};
			omsCheckExecutions()
		},
		'omsCheckOrders',
		'<ers:omsCheckOrders>' +
			'<token>' + token + '</token>' +
		'</ers:omsCheckOrders>',
	);
}

function omsCheckExecutions() {
	soapCall(
		function(xml) {
			try {
				var dataArray2 = []
				var data = [];
				var dataTemp = xml.getElementsByTagName("return")[0].getElementsByTagName("messages");
				for (i = 0; i < dataTemp.length; i++) {
			    data += dataTemp[i].textContent + ",";
				}
				var dataArray = data.split(",");
				dataArray.pop();
				for (i = 0; i <= dataArray.length; i++) {
					if (i % 8 == 0 && i != 0) {
						dataArray[i-5] = round(dataArray[i-5],0);
						dataArray[i-3] = round(dataArray[i-3],0);
						dataArray2.push(dataArray[i-8], dataArray[i-7], dataArray[i-6], dataArray[i-5], dataArray[i-4], dataArray[i-3], dataArray[i-2], dataArray[i-1], dataArray[i])
						var newId = (new Date()).valueOf();
						execGrid.addRow(newId,dataArray2);
						execGrid.sortRows(1,"sort_custom","asc");
						addExecutionData(dataArray[i-7] + '_' + dataArray[i-8], dataArray[i-2], dataArray[i-4], dataArray[i-5], dataArray[i-3], dataArray[i-6])
						dataArray2 = [];
					}
				}
			} catch (e) {
				caught();
			};
			loading(false);
			pause = false;
		},
		'omsCheckExecutions',
		'<ers:omsCheckExecutions>' +
			'<token>' + token + '</token>' +
		'</ers:omsCheckExecutions>',
	);
}

function addExecutionData(trNo, execTime, side, quantity, price, isin) {
	var dateNow = new Date();
	var dd   = dateNow.getDate();
	if(dd < 10) { dd = '0' + dd; }
	var mm   = dateNow.getMonth() + 1;
	if(mm < 10) { mm = '0' + mm; }
	var yyyy = dateNow.getFullYear();
	var ddmmyyyy = dd + '.' + mm + '.' + yyyy;
	var hh   = dateNow.getHours();
	if(hh < 10) { hh = '0' + hh; }
	var mi   = dateNow.getMinutes();
	if(mi < 10) { mi = '0' + mi; }
	var ss   = dateNow.getSeconds();
	if(ss < 10) { ss = '0' + ss; }
	var hhmiss = hh + ':' + mi + ':' + ss;
	var dataRow = 'N|20200|' + ddmmyyyy + '|' + hhmiss + '|OMS-ER|20201|' + trNo + '|20203||20205||20206||20210|'
	+ execTime + '|20216|' + side + '|20220||20221|' + quantity + '.00|20222||20223|' + price + '.00';
	dataRow = addBufferData(isin, dataRow);
	if (dataRow) {
		addTransaction(dataRow);
	}
}

function addBufferData(isin, dataRow) {
	var p = 0;
	var colID = findISIN();
	portGrid.forEachRow(function(id) {
		if (portGrid.cells(id,colID).getValue() == isin) {
			//1 Depot ID
			p = dataRow.indexOf('|20203|') + 7;
			dataRow = dataRow.substr(0,p) + portGrid.cells(id,15).getValue() + dataRow.substr(p);
			//2 Serial Number
			p = dataRow.indexOf('|20205|') + 7;
			dataRow = dataRow.substr(0,p) + portGrid.cells(id,2).getValue() + dataRow.substr(p);
			//3 Pos ID
			p = dataRow.indexOf('|20206|') + 7;
			dataRow = dataRow.substr(0,p) + portGrid.cells(id,0).getValue() + dataRow.substr(p);
			//4 Market
			p = dataRow.indexOf('|20220|') + 7;
			dataRow = dataRow.substr(0,p) + portGrid.cells(id,10).getValue() + dataRow.substr(p);
			//5 Curr
			p = dataRow.indexOf('|20222|') + 7;
			dataRow = dataRow.substr(0,p) + portGrid.cells(id,6).getValue() + dataRow.substr(p);
			return dataRow;
		}
	});
	return dataRow;
}

function addTransaction(dataRow) {
	soapCall(
		function(xml) {
		},
		'importDataDuringActionMode',
		'<ers:importDataDuringActionMode>' +
			'<token>' + token + '</token>' +
			'<params>' +
				'<name>DataRow</name>' +
				'<value>' + dataRow + '</value>' +
			'</params>' +
			"<params>" +
				"<name>STI_chFieldSeparator</name>" +
				"<value>STI_chFieldSeparator=|</value>" +
			"</params>" +
			"<params>" +
				"<name>STI_chThousendSeparator</name>" +
				"<value>STI_chThousendSeparator=,</value>" +
			"</params>" +
			"<params>" +
				"<name>STI_chDecimalSeparator</name>" +
				"<value>STI_chDecimalSeparator=.</value>" +
			"</params>" +
			"<params>" +
				"<name>STI_chDateSeparator</name>" +
				"<value>STI_chDateSeparator=.</value>" +
			"</params>" +
			"<params>" +
				"<name>STI_chTimeSeparator</name>" +
				"<value>STI_chTimeSeparator=:</value>" +
			"</params>" +
		'</ers:importDataDuringActionMode>',
	);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////

function findISIN() {
	for (var ii = 0; ii < portGrid.getColumnsNum(); ii++) {
		if (portGrid.getColLabel(ii) == "ISIN") {
			return ii;
		}
	}
}

function validMove() {
	ordersGrid.forEachRow(function(id) {
		if (ordersGrid.cells(id,3).getValue() == "0") {
			ordersGrid.moveRow(id,"row_sibling","",expGrid);
			expGrid.cells(id,3).setValue(expGrid.cells(id,4).getValue());
			expGrid.cells(id,4).setValue(expGrid.cells(id,2).getValue()-expGrid.cells(id,3).getValue());
			expGrid.cells(id,12).setValue(expGrid.cells(id,13).getValue());
			expGrid.cells(id,13).setValue(expGrid.cells(id,11).getValue());
			var executed = parseInt(expGrid.cells(id,3).getValue());
			var quantity = parseInt(expGrid.cells(id,2).getValue());
			var tif = expGrid.cells(id,12);
			if (executed == 0) {
				expGrid.cells(id,14).setValue("Nothing");
			}
			else if (executed == quantity) {
				expGrid.cells(id,14).setValue("Fully");
			}
			else if (executed > 0 && executed < quantity) {
				expGrid.cells(id,14).setValue("Partly");
			}
			if (tif.getValue() == "DAY") {
				tif.setValue("Day")
			}
			else if (expGrid.cells(id,12).getValue() == "GTC") {
				tif.setValue("Good Till Cancel")
			}
			else if (tif.getValue() == "IOC") {
				tif.setValue("Immediate or Cancel")
			}
			else if (tif.getValue() == "FOK") {
				tif.setValue("Fill or Kill")
			}
			else if (tif.getValue() == "GTD") {
				tif.setValue("Good Till Date")
			}
			if (tif.getValue() != "Day" && tif.getValue() != "Good Till Date") {
				expGrid.cells(id,13).setValue("-");
			}
		}
	});
	expGrid.refreshFilters();
}

function typeVal() {
	if (form1.getItemValue("type") == "Market") {
		form1.disableItem("limit");
		form1.disableItem("stop");
		form1.setItemValue("limit", "");
		form1.setItemValue("stop", "");
	} else if (form1.getItemValue("type") == "Limit") {
		form1.enableItem("limit");
		form1.disableItem("stop");
		form1.setItemValue("stop", "");
	} else if (form1.getItemValue("type") == "Stop") {
		form1.enableItem("stop");
		form1.disableItem("limit");
		form1.setItemValue("limit", "");
	} else if (form1.getItemValue("type") == "Stop Limit") {
		form1.enableItem("stop");
		form1.enableItem("limit");
	}
	if (form1.getItemValue("tif") == "GTD") {
		form1.showItem("date");
	} else {
		form1.hideItem("date");
	}
}

function round(value, exp) {
  if (typeof exp === 'undefined' || +exp === 0)
    return Math.round(value);
  value = +value;
  exp = +exp;
  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
    return "";
  value = value.toString().split('e');
  value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));
  value = value.toString().split('e');
  return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}

function today() {
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1;
	var yyyy = today.getFullYear();
	if(dd < 10){
		dd='0'+dd;
	}
	if(mm < 10){
		mm='0'+mm;
	}
	today = yyyy+'-'+mm+'-'+dd;
	return today;
}

function dateISO() {
	var dateISO = new Date();
	var dd = dateISO.getDate();
	var mm = dateISO.getMonth()+1;
	var yyyy = dateISO.getFullYear();
	if(dd < 10){
		dd='0'+dd;
	}
	if (mm < 10){
		mm='0'+mm;
	}
	if (toolbar.getValue("date") == today()) {
		dateISO = yyyy+"-"+mm+"-"+dd + "T00:00:00.000Z";
	} else {
		dateISO = toolbar.getValue("date") + "T00:00:00.000Z";
	}
	return dateISO;
}

function caught() {
	pause = false;
	loading(false);
	return;
}

function omstextSize() {
	if (document.documentElement.clientWidth <= 1040) {
		document.getElementById("omstext").style.width = "40%";
		if (document.documentElement.clientWidth <= 920) {
			document.getElementById("omstext").style.width = "30%";
			if (document.documentElement.clientWidth <= 850) {
				toolbar.hideItem("omstext");
			} else {
				toolbar.showItem("omstext");
			}
		}
	} else {
		document.getElementById("omstext").style.width = "50%";
	}
}

var Base64 = {
	_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	encode: function(input) {
		var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;
    input = Base64._utf8_encode(input);
    while (i < input.length) {
			chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      if (isNaN(chr2)) {
      	enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }
        return output;
    },
	decode: function(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

    _utf8_encode: function(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    _utf8_decode: function(utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }
}
