/**
 * @projectDescription	Example using the Patient Data Object (PDO).
 * @inherits	i2b2
 * @namespace	i2b2.DataDownloader
 * @author	Nick Benik, Griffin Weber MD PhD
 * @version 	1.3
 * ----------------------------------------------------------------------------------------
 * updated 11-06-08: 	Initial Launch [Nick Benik] 
 */

i2b2.DataDownloader.SERVICE_URL = 'http://192.168.86.128/DataDownloader/rest';
// global row index counter because the concept drop handlers
// seem to fail if a handler is applied to the same object twice in the same session
i2b2.DataDownloader.ROW_INDEX = 1;

i2b2.DataDownloader.Init = function(loadedDiv) {
	// register DIV as valid DragDrop target for Patient Record Sets (PRS) objects
	var op_trgt = {dropTarget:true};
	i2b2.sdx.Master.AttachType("DataDownloader-CONCPTDROP-1", "CONCPT", op_trgt);
	i2b2.sdx.Master.AttachType("DataDownloader-PRSDROP", "PRS", op_trgt);
	// drop event handlers used by this plugin
	i2b2.sdx.Master.setHandlerCustom("DataDownloader-CONCPTDROP-1", "CONCPT", "DropHandler", 
		function(sdxData) {
                        sdxData = sdxData[0]; // only interested in first concept
                        i2b2.DataDownloader.model.configuration.columnConfigs['1'].conceptRecord = sdxData;
                        // let the user know that the drop was successful by displaying the name of the concept
                        $("DataDownloader-CONCPTDROP-1").innerHTML = i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName);
                        // temporarly change background color to give GUI feedback of a successful drop occuring
                        $("DataDownloader-CONCPTDROP-1").style.background = "#CFB";
                        setTimeout("$('DataDownloader-CONCPTDROP-1').style.background='#DEEBEF'", 250);
			$("DataDownloader-CONCPTDROP-1").className = "droptrgt SDX-CONCPT";		
	
			// populate the column name field with the name of the concept
			$("DataDownloader-columnName-1").value = i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName);

			// populate the display format dropdown based on the type of concept dropped    
			i2b2.DataDownloader.populateDispFmtSelect('1', sdxData);

			// clear out the display format specific options
		        $("DataDownloader-timerange-container-1").style.display = "none";
			$("DataDownloader-units-container-1").style.display = "none";
        	        $("DataDownloader-aggregation-container-1").style.display = "none";
	                $("DataDownloader-howmany-container-1").style.display = "none";

                        // optimization to prevent requerying the hive for new results if the input dataset has not changed
                        i2b2.DataDownloader.model.dirtyResultsData = true;
		}
	);
	i2b2.sdx.Master.setHandlerCustom("DataDownloader-PRSDROP", "PRS", "DropHandler", i2b2.DataDownloader.prsDropped);
	// initialize configuration object
	i2b2.DataDownloader.model.configuration = {};
	i2b2.DataDownloader.model.configuration.columnConfigs = [];

	// initialize the first configuration
	i2b2.DataDownloader.initColumnConfig('1');

	$("DataDownloader-userConfigsList").addEventListener("change", i2b2.DataDownloader.userConfigSelected);
	$("DataDownloader-upBtn-1").addEventListener("click", i2b2.DataDownloader.moveUp);
	$("DataDownloader-dnBtn-1").addEventListener("click", i2b2.DataDownloader.moveDown);
	$("DataDownloader-dispfmt-select-1").addEventListener("change", i2b2.DataDownloader.onDispFmtChange);
	$("DataDownloader-addColumnBtn").addEventListener("click", i2b2.DataDownloader.addColumnConfig);
	$("DataDownloader-previewBtn").addEventListener("click", i2b2.DataDownloader.generatePreview);
	$("DataDownloader-saveonly").addEventListener("click", i2b2.DataDownloader.saveConfiguration);
	$("DataDownloader-export").addEventListener("click", i2b2.DataDownloader.exportData);
	$("DataDownloader-deleteConfigBtn").addEventListener("click", i2b2.DataDownloader.deleteConfig);
	$("DataDownloader-loadConfigBtn").addEventListener("click", i2b2.DataDownloader.loadConfig);

	// populate the list of configurations
	i2b2.DataDownloader.populateConfigList();

	// manage YUI tabs
	this.yuiTabs = new YAHOO.widget.TabView("DataDownloader-TABS", {activeIndex:0});
	this.yuiTabs.on('activeTabChange', function(ev) { 
		//Tabs have changed 
		if (ev.newValue.get('id')=="DataDownloader-TAB1") {
			// user switched to Results tab
			if (i2b2.DataDownloader.model.concepts && i2b2.DataDownloader.model.concepts.length > 0 && i2b2.DataDownloader.model.prsRecord) {
				// contact PDO only if we have data
				if (i2b2.DataDownloader.model.dirtyResultsData) {
					// recalculate the results only if the input data has changed
					i2b2.DataDownloader.getResults();
				}
			}
		}
	});

	YAHOO.util.Event.addListener(window, 'resize', i2b2.DataDownloader.resizeDataTable);
};

i2b2.DataDownloader.populateConfigList = function() {
	new Ajax.Request(i2b2.DataDownloader.SERVICE_URL + "/config/getAll", {
		method: 'POST',
		contentType: 'application/json',
		postBody: Object.toJSON(i2b2.DataDownloader.createI2b2AuthRequestObject()),
		requestHeaders: {"Accept": "application/json"},
		asynchronous: true,
		onSuccess: function(response) {
			var select = $("DataDownloader-userConfigsList");
			var configSummaries = response.responseJSON;
			while (select.hasChildNodes()) {
				select.removeChild(select.firstChild);
			}
			configSummaries.forEach(function(config) {
				var opt = document.createElement("option");
				opt.value = config.configurationId;
				opt.text = config.configurationName;
				select.appendChild(opt);
			});
			$("DataDownloader-loadConfigBtn").disabled = true;
			$("DataDownloader-deleteConfigBtn").disabled = true;
		}	
	});
};

i2b2.DataDownloader.userConfigSelected = function(evt) {
	$("DataDownloader-loadConfigBtn").disabled = false;
	$("DataDownloader-deleteConfigBtn").disabled = false;
	for (var i = 0; i < evt.target.options.length; i++) {
		if (evt.target.options[i].selected === true) {
			$("DataDownloader-saveas").value = evt.target.options[i].text;
			return;
		}
	}	
};

i2b2.DataDownloader.initColumnConfig = function(index) {
	i2b2.DataDownloader.model.configuration.columnConfigs[index] = {};
        i2b2.DataDownloader.model.configuration.columnConfigs[index].conceptRecord = null;
        i2b2.DataDownloader.model.configuration.columnConfigs[index].columnName = '';
        i2b2.DataDownloader.model.configuration.columnConfigs[index].displayFormat = '';
        i2b2.DataDownloader.model.configuration.columnConfigs[index].howMany = 0;
	i2b2.DataDownloader.model.configuration.columnConfigs[index].includeTimeRange = false;
	i2b2.DataDownloader.model.configuration.columnConfigs[index].includeUnits = false;
	i2b2.DataDownloader.model.configuration.columnConfigs[index].aggregation = '';
};

i2b2.DataDownloader.populateDispFmtSelect = function(index, sdxData) {
        var dispFmtSel = $("DataDownloader-dispfmt-select-" + index);
        while (dispFmtSel.hasChildNodes()) {
        	dispFmtSel.removeChild(dispFmtSel.lastChild);
        }

        var selectOpt = document.createElement("option");
        selectOpt.disabled = true;
        selectOpt.selected = true;
        selectOpt.text = "Select one:";
        dispFmtSel.appendChild(selectOpt);

        var existOpt = document.createElement("option");
        existOpt.value = "existence";
        existOpt.text = "Existence";

        var valOpt = document.createElement("option");
        valOpt.value = "value";
        valOpt.text = "Value";

        dispFmtSel.appendChild(existOpt);
        dispFmtSel.appendChild(valOpt);

        var lvMetaDatas = i2b2.h.XPath(sdxData.origData.xmlOrig, 'metadataxml/ValueMetadata');
        if (lvMetaDatas.length > 0) {
	        var aggOpt = document.createElement("option");
                aggOpt.value = "aggregation";
                aggOpt.text = "Aggregation";

                dispFmtSel.appendChild(aggOpt);
        }
};

i2b2.DataDownloader.onDispFmtChange = function(evt) {
	var dispFmt = evt.target.value;
	var index = evt.target.id.split('-')[3];
	i2b2.DataDownloader.showHideDispFmt(index, dispFmt);
};

i2b2.DataDownloader.showHideDispFmt = function(index, dispFmt) {
	if (dispFmt === "existence") {
		$("DataDownloader-timerange-container-" + index).style.display = "none";
		$("DataDownloader-howmany-container-" + index).style.display = "none";
		$("DataDownloader-units-container-" + index).style.display = "none";
		$("DataDownloader-aggregation-container-" + index).style.display = "none";
	} else if (dispFmt === "value") {
		$("DataDownloader-timerange-container-" + index).style.display = "block";
		$("DataDownloader-timerange-container-" + index).style.marginBottom = "5px";
		$("DataDownloader-howmany-container-" + index).style.display = "block";
		var lvMetaDatas = i2b2.h.XPath(i2b2.DataDownloader.model.configuration.columnConfigs[index].conceptRecord.origData.xmlOrig, 'metadataxml/ValueMetadata');
		if (lvMetaDatas.length > 0) {
			$("DataDownloader-units-container-" + index).style.display = "block";
		} else {
			$("DataDownloader-units-container-" + index).style.display = "none";
		}
		$("DataDownloader-aggregation-container-" + index).style.display = "none";
	} else if (dispFmt === "aggregation") {
		$("DataDownloader-timerange-container-" + index).style.display = "none";
		$("DataDownloader-howmany-container-" + index).style.display = "none";
		$("DataDownloader-units-container-" + index).style.display = "block";
		$("DataDownloader-aggregation-container-" + index).style.display = "block";
	}
};

i2b2.DataDownloader.updateColumnConfigFirstRow = function() {
	var table = $("DataDownloader-configTable");
	var delCell = table.rows[1].cells[0];
	while (delCell.hasChildNodes()) {
		delCell.removeChild(delCell.lastChild);
	}
	var img = document.createElement('img');

	// if only one config row is left, we don't want to allow deletion of it
	if (table.rows.length === 2) {
		img.src = "http://placehold.it/35/dbe8ff";
		delCell.appendChild(img);
	} else {
	        img.src = "http://placehold.it/35/dbe8ff/ff0000&text=x";
        	//img.style.border = "1px solid red";
	        img.addEventListener("click", i2b2.DataDownloader.deleteBtnClickListener);
        	var anchor = document.createElement('a');
	        anchor.href = "#";
        	anchor.appendChild(img);
	        delCell.className = "deleteBtn";
	        delCell.appendChild(anchor);
	}	
};

i2b2.DataDownloader.addColumnConfig = function() {
	var table = $("DataDownloader-configTable");
	var newIndex = i2b2.DataDownloader.addColumnConfigRow(table);
	i2b2.DataDownloader.updateColumnConfigFirstRow();
	
	return newIndex;
};

i2b2.DataDownloader.deleteBtnClickListener = function(evt) {
	var node = evt.target;
	while (node.nodeName !== 'TR') {
		node = node.parentNode;
	}
	var tr = node;
	tr.parentNode.removeChild(tr);
	var index = tr.id.split('-')[2];
	delete i2b2.DataDownloader.model.configuration.columnConfigs[index];
	i2b2.DataDownloader.updateColumnConfigFirstRow();
};

i2b2.DataDownloader.moveDown = function(evt) {
	var element = evt.target.ancestors()[2];
	var next = element.next();
	if (next) {
		next.remove();
		element.insert({before:next});
	}
};

i2b2.DataDownloader.moveUp = function(evt) {
	var element = evt.target.ancestors()[2];
	var prev = element.previous();
	if (prev && prev.id !== "DataDownloader-headerRow") {
		prev.remove();
		element.insert({after:prev});
	}
};

i2b2.DataDownloader.addColumnConfigRow = function(table) {
	i2b2.DataDownloader.ROW_INDEX += 1; // increment the global row index counter
	var index = i2b2.DataDownloader.ROW_INDEX;
	i2b2.DataDownloader.initColumnConfig(index);
	var tr = table.insertRow(-1);
	tr.id = "DataDownloader-columnConfig-" + index;

	var delCell = document.createElement('td');
	var img = document.createElement('img');
	img.src = "http://placehold.it/35/dbe8ff/ff0000&text=x";
	//img.style.border = "1px solid red";
	img.addEventListener("click", i2b2.DataDownloader.deleteBtnClickListener);
	var anchor = document.createElement('a');
	anchor.href = "#";
	anchor.appendChild(img);
	delCell.className = "deleteBtn";
	delCell.appendChild(anchor);
	tr.appendChild(delCell);

	var reorderCell = document.createElement('td');
	reorderCell.className = "deleteBtn";
	var upImg = document.createElement('img');
	upImg.src = "http://placehold.it/20/dbe8ff/00ff00&text=UP";
	upImg.addEventListener("click", i2b2.DataDownloader.moveUp);
	var upAnchor = document.createElement('a');
	upAnchor.href = '#';
	upAnchor.appendChild(upImg);
	var dnImg = document.createElement('img');
	dnImg.src = "http://placehold.it/20/dbe8ff/00ff00&text=DN";
	dnImg.addEventListener("click", i2b2.DataDownloader.moveDown);
	var dnAnchor = document.createElement('a');
	dnAnchor.href = '#';
	dnAnchor.appendChild(dnImg);
	reorderCell.appendChild(upAnchor);
	reorderCell.appendChild(document.createElement('br'));
	reorderCell.appendChild(dnAnchor);
	tr.appendChild(reorderCell);

	var concptCell = document.createElement('td');
	var concptDiv = document.createElement('div');
	var concptSpan = document.createElement('span');
	concptSpan.className = "droptrgtInit";
	concptSpan.textContent = "Drop a concept here";
	concptDiv.className = "droptrgtInit SDX-CONCPT";
	concptDiv.id = "DataDownloader-CONCPTDROP-" + index;
	concptDiv.appendChild(concptSpan);
	concptCell.className = "droptrgtCell";
	concptCell.appendChild(concptDiv);
	tr.appendChild(concptCell);

	i2b2.sdx.Master.AttachType("DataDownloader-CONCPTDROP-" + index, "CONCPT", {dropTarget:true});
	i2b2.sdx.Master.setHandlerCustom("DataDownloader-CONCPTDROP-" + index, "CONCPT", "DropHandler", 
		function(sdxData) {
			sdxData = sdxData[0]; // only interested in first concept
			i2b2.DataDownloader.model.configuration.columnConfigs[index.toString()].conceptRecord = sdxData;
			// let the user know that the drop was successful by displaying the name of the concept
			$("DataDownloader-CONCPTDROP-" + index).innerHTML = i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName);
			// temporarly change background color to give GUI feedback of a successful drop occuring
			$("DataDownloader-CONCPTDROP-" + index).style.background = "#CFB";
			setTimeout("$('DataDownloader-CONCPTDROP-" + index + "').style.background='#DEEBEF'", 250);	
			$("DataDownloader-CONCPTDROP-" + index).className = "droptrgt SDX-CONCPT";
			
			// populate the column name field with the name of the concept
			$("DataDownloader-columnName-" + index).value = i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName);

			// populate the display format dropdown based on the type of concept dropped	
			i2b2.DataDownloader.populateDispFmtSelect(index, sdxData);		
	
			// clear out the display format specific options
		        $("DataDownloader-timerange-container-" + index).style.display = "none";
			$("DataDownloader-units-container-" + index).style.display = "none";
        	        $("DataDownloader-aggregation-container-" + index).style.display = "none";
	                $("DataDownloader-howmany-container-" + index).style.display = "none";
			// optimization to prevent requerying the hive for new results if the input dataset has not changed
			i2b2.DataDownloader.model.dirtyResultsData = true;		
		}
	);

	var colNameCell = document.createElement('td');
	colNameCell.className = 'columnNameCell';
	var colNameText = document.createElement('input');
	colNameText.type = 'text';
	colNameText.id = 'DataDownloader-columnName-' + index;
	colNameText.name = 'columnName-' + index;
	colNameText.placeholder = 'Column name';
	colNameText.size = '16';
	colNameText.maxLength = '32';
	colNameCell.appendChild(colNameText);
	tr.appendChild(colNameCell);

	var dispfmtCell = document.createElement('td');
	dispfmtCell.className = 'dispfmt';
	var dispfmtSelect = document.createElement('select');
	dispfmtSelect.id = 'DataDownloader-dispfmt-select-' + index;
	dispfmtSelect.name = 'dispfmt-' + index;
	dispfmtSelect.addEventListener("change", i2b2.DataDownloader.onDispFmtChange);
	var dispfmtOpt = document.createElement('option');
	dispfmtOpt.disabled = true;
	dispfmtOpt.selected = true;
	dispfmtOpt.text = 'Select a concept first';
	dispfmtSelect.appendChild(dispfmtOpt);
	dispfmtCell.appendChild(dispfmtSelect);
	tr.appendChild(dispfmtCell);

	var optionsCell = document.createElement('td');
	
	var showTimeDiv = document.createElement('div');
	showTimeDiv.className = 'options';
	showTimeDiv.id = 'DataDownloader-timerange-container-' + index;
	showTimeDiv.style.display = 'none';
	var showTimeLbl = document.createElement('label');
	showTimeLbl.htmlFor = 'DataDownloader-timerange-' + index;
	showTimeLbl.textContent = 'Include time range';
	var showTimeCheck = document.createElement('input');
	showTimeCheck.type = 'checkbox';
	showTimeCheck.name = 'timerange-' + index;
	showTimeCheck.id = 'DataDownloader-timerange-' + index;
	showTimeDiv.appendChild(showTimeCheck);
	showTimeDiv.appendChild(showTimeLbl);

	var unitsDiv = document.createElement('div');
	unitsDiv.className = 'options';
	unitsDiv.id = 'DataDownloader-units-container-' + index;
	unitsDiv.style.display = 'none';
	var unitsLbl = document.createElement('label');
	unitsLbl.htmlFor = 'DataDownloader-units-' + index;
	unitsLbl.textContent = 'Include units';
	var unitsCheck = document.createElement('input');
	unitsCheck.type = 'checkbox';
	unitsCheck.name = 'units-' + index;
	unitsCheck.id = 'DataDownloader-units-' + index;
	unitsDiv.appendChild(unitsCheck);
	unitsDiv.appendChild(unitsLbl);

	var howManyDiv = document.createElement('div');
	howManyDiv.className = 'options';
	howManyDiv.id = 'DataDownloader-howmany-container-' + index;
	howManyDiv.style.display = 'none';

	var howManyLbl = document.createElement('label');
	howManyLbl.style.paddingLeft = '5px';
	howManyLbl.htmlFor = 'DataDownloader-howmany-' + index;
	howManyLbl.textContent = 'How many? ';

	var howManyText = document.createElement('input');
	howManyText.id = 'DataDownloader-howmany-' + index;
	howManyText.type = 'text';
	howManyText.name = 'howmany-' + index;
	howManyText.value = '1';
	howManyText.size = '4';

	howManyDiv.appendChild(howManyLbl);
	howManyDiv.appendChild(howManyText);
	
	var aggDiv = document.createElement('div');
	aggDiv.className = 'options';
	aggDiv.id = 'DataDownloader-aggregation-container-' + index;
	aggDiv.style.display = 'none';
	var minLbl = document.createElement('label');
	minLbl.htmlFor = 'DataDownloader-min-' + index;
	minLbl.className = 'aggMargin';
	minLbl.textContent = 'Min';
	var minRadio = document.createElement('input');
	minRadio.type = 'radio';
	minRadio.name = 'aggregation-' + index;
	minRadio.id = 'DataDownloader-min-' + index;
	minRadio.value = 'min';

	var maxLbl = document.createElement('label');
	maxLbl.htmlFor = 'DataDownloader-max-' + index;
	maxLbl.className = 'aggMargin';
	maxLbl.textContent = 'Max';
	var maxRadio = document.createElement('input');
	maxRadio.type = 'radio';
	maxRadio.name = 'aggregation-' + index;
	maxRadio.id = 'DataDownloader-max-' + index;
	maxRadio.value = 'max';

	var avgLbl = document.createElement('label');
	avgLbl.htmlFor = 'DataDownloader-avg-' + index;
	avgLbl.className = 'aggMargin';
	avgLbl.textContent = 'Avg';
	var avgRadio = document.createElement('input');
	avgRadio.type = 'radio';
	avgRadio.name = 'aggregation-' + index;
	avgRadio.id = 'DataDownloader-avg-' + index;
	avgRadio.value = 'avg';

	aggDiv.appendChild(minRadio);
	aggDiv.appendChild(minLbl);
	aggDiv.appendChild(maxRadio);
	aggDiv.appendChild(maxLbl);
	aggDiv.appendChild(avgRadio);
	aggDiv.appendChild(avgLbl);

	optionsCell.appendChild(howManyDiv);
	optionsCell.appendChild(aggDiv);
	optionsCell.appendChild(unitsDiv);
	optionsCell.appendChild(showTimeDiv);

	tr.appendChild(optionsCell);

	return index;	
};

i2b2.DataDownloader.assembleColumnConfig = function(index) {
	// the concept object is populated at drop-time, so we just focus on the other fields here
	var config = i2b2.DataDownloader.model.configuration.columnConfigs[index];
	config.columnName = $("DataDownloader-columnName-" + index).value;
	config.displayFormat = $("DataDownloader-dispfmt-select-" + index).value;
	switch (config.displayFormat) {
		case "value":
			config.howMany = parseInt($("DataDownloader-howmany-" + index).value);
			config.includeTimeRange = $("DataDownloader-timerange-" + index).checked;
			config.includeUnits = $("DataDownloader-units-" + index).checked;
			break;
		case "aggregation":
			var aggs = document.getElementsByName("aggregation-" + index);
			for (var i = 0; i < aggs.length; i++) {
				if (aggs[i].checked) {
					config.aggregation = aggs[i].value;
					break;
				}
			}
			config.includeUnits = $("DataDownloader-units-" + index).checked;
			break;
		default:
			break;
	}
};

i2b2.DataDownloader.assembleConfig = function() {
	var table = $("DataDownloader-configTable");
	for (var i = 1; i < table.rows.length; i++) {
		var index = table.rows[i].id.split('-')[2];
		if (i2b2.DataDownloader.model.configuration.columnConfigs[index].conceptRecord) {
			i2b2.DataDownloader.assembleColumnConfig(index);
			i2b2.DataDownloader.model.configuration.columnConfigs[index].order = i;
		}
	}
	i2b2.DataDownloader.model.configuration.rowDimension = $("DataDownloader-rowdim").value;
	i2b2.DataDownloader.model.configuration.whitespace = $("DataDownloader-whitespace").value;
	i2b2.DataDownloader.model.configuration.delimiter = $("DataDownloader-delimiter").value;
	i2b2.DataDownloader.model.configuration.missing = $("DataDownloader-missing").value;
};

i2b2.DataDownloader.generatePreview = function() {
	i2b2.DataDownloader.assembleConfig();
	var previewStr = '';
	switch (i2b2.DataDownloader.model.configuration.rowDimension) {
		case "patient":
			previewStr += 'Patient_id';
			break;
		case "visit":
		    previewStr += 'Patient_id'
			previewStr += 'Visit_id';
			previewStr += 'Visit_start';
			previewStr += 'Visit_end';
			break;
		case "provider":
			previewStr += 'Provider_name';
			break;
	}
	i2b2.DataDownloader.model.configuration.columnConfigs.forEach(function(config) {
		if (config.conceptRecord) {
			var colName = config.columnName;
			if (i2b2.DataDownloader.model.configuration.whitespace !== '') {
				colName = colName.replace(' ', i2b2.DataDownloader.model.configuration.whitespace, 'g');
			}
			if (config.displayFormat === 'value') {
				var howMany = config.howMany;
				if (!howMany || howMany < 1) {
					howMany = 1;
				}
				for (var i = 0; i < howMany; i++) {
					previewStr += i2b2.DataDownloader.model.configuration.delimiter + colName + '_value';
			
					if (config.includeUnits) {
						previewStr += i2b2.DataDownloader.model.configuration.delimiter + colName + '_unit';
					}
					if (config.includeTimeRange) {
						previewStr += i2b2.DataDownloader.model.configuration.delimiter + colName + '_start' + i2b2.DataDownloader.model.configuration.delimiter + colName + '_end';
					}	
				}
			} else if (config.displayFormat === 'aggregation') {
				colName += '_' + config.aggregation;
				previewStr += i2b2.DataDownloader.model.configuration.delimiter + colName;
				if (config.includeUnits) {
					previewStr += i2b2.DataDownloader.model.configuration.delimiter + colName + '_unit';
				}
			} else {
				previewStr += i2b2.DataDownloader.model.configuration.delimiter + colName;
			} 
		}	
	});	
	$("DataDownloader-previewText").textContent = previewStr;
};

i2b2.DataDownloader.Unload = function() {
	// purge old data
	i2b2.DataDownloader.model.configuration = false;
	i2b2.DataDownloader.model.prsRecord = false;
	i2b2.DataDownloader.model.dirtyResultsData = true;
	return true;
};

i2b2.DataDownloader.prsDropped = function(sdxData) {
	sdxData = sdxData[0];	// only interested in first record
	// save the info to our local data model
	i2b2.DataDownloader.model.prsRecord = sdxData;
	// let the user know that the drop was successful by displaying the name of the patient set
	$("DataDownloader-PRSDROP").innerHTML = i2b2.h.Escape(sdxData.sdxInfo.sdxDisplayName);
	// temporarly change background color to give GUI feedback of a successful drop occuring
	$("DataDownloader-PRSDROP").style.background = "#CFB";
	setTimeout("$('DataDownloader-PRSDROP').style.background='#DEEBEF'", 250);	
	// optimization to prevent requerying the hive for new results if the input dataset has not changed
	i2b2.DataDownloader.model.dirtyResultsData = true;		

	$("DataDownloader-export").disabled = false;
};

i2b2.DataDownloader.createI2b2AuthRequestObject = function() {
	return {
		domain: i2b2.h.getDomain(), 
		username: i2b2.h.getUser(), 
		passwordNode: i2b2.h.getPass(), 
		projectId: i2b2.h.getProject()
		};
};

i2b2.DataDownloader.colConfigComp = function(a, b) { 
	return a.columnOrder - b.columnOrder; 
}

i2b2.DataDownloader.createConfigRequestObject = function() {
	i2b2.DataDownloader.assembleConfig();
        var rawConfig = i2b2.DataDownloader.model.configuration;
        var request = {};
        request.i2b2AuthMetadata = i2b2.DataDownloader.createI2b2AuthRequestObject();
        var config = {};
        config.name = $("DataDownloader-saveas").value;
        config.rowDimension = rawConfig.rowDimension.toUpperCase();
        config.whitespaceReplacement = rawConfig.whitespace;
        config.separator = rawConfig.delimiter;
        config.missingValue = rawConfig.missing;
        config.columnConfigs = [];

        rawConfig.columnConfigs.forEach(function(colConfigRaw) {
                if (colConfigRaw.conceptRecord) {
                        var columnConfig = {};
                        columnConfig.columnOrder = colConfigRaw.order;
                        columnConfig.columnName = colConfigRaw.columnName;
                        columnConfig.displayFormat = colConfigRaw.displayFormat.toUpperCase();
                        if (colConfigRaw.displayFormat === 'value') {
                                var howMany = colConfigRaw.howMany;
                                if (!howMany || howMany < 1) {
                                        howMany = 1;
                                }
                                columnConfig.howMany = howMany;
                                columnConfig.includeTimeRange = colConfigRaw.includeTimeRange;
                                columnConfig.includeUnits = colConfigRaw.includeUnits;
                        } else if (colConfigRaw.displayFormat === 'aggregation') {
                                columnConfig.includeUnits = colConfigRaw.includeUnits;
                                columnConfig.aggregation = colConfigRaw.aggregation.toUpperCase();
                        }                            
			var conceptData = colConfigRaw.conceptRecord.origData;                           
                        columnConfig.i2b2Concept = {
					i2b2Key: conceptData.key,
                                        level: parseInt(conceptData.level),
                                        tableName: conceptData.table_name,
					columnName: conceptData.column_name,
                                        dimensionCode: conceptData.dim_code,
                                        isSynonym: "N",
					hasChildren: conceptData.hasChildren,
					icd9: conceptData.icd9,
					name: conceptData.name,
					operator: conceptData.operator,
					displayName: colConfigRaw.conceptRecord.sdxInfo.sdxDisplayName,
					tooltip: conceptData.tooltip,
					xmlOrig: i2b2.h.Xml2String(conceptData.xmlOrig)
			};         
                                                                     
                        config.columnConfigs.push(columnConfig);        
                }
        });

	// ensure we save the column configs in the correct order
	config.columnConfigs.sort(i2b2.DataDownloader.colConfigComp);
        request.outputConfiguration = config;

	return request;
}

i2b2.DataDownloader.saveConfiguration = function() {
	var saveAs = $("DataDownloader-saveas").value;
	if (saveAs.length <= 0) {
		alert("Please name this configuration");
	} else {
		new Ajax.Request(i2b2.DataDownloader.SERVICE_URL + '/config/save', {
			method: 'POST',
			contentType: 'application/json',
			postBody: Object.toJSON(i2b2.DataDownloader.createConfigRequestObject()),
			requestHeaders: {"Accept": "application/json"},
			asynchronous: true,
			onSuccess: function(response) {
				i2b2.DataDownloader.populateConfigList();
				alert("Saved configuration: '" + saveAs + "'");
			}
		});
	}
};

i2b2.DataDownloader.exportData = function() {
	new Ajax.Request(i2b2.DataDownloader.SERVICE_URL + '/download/configDetails', {
		method: 'POST',
		contentType: 'application/json',
		postBody: Object.toJSON(i2b2.DataDownloader.createConfigRequestObject()),
		requestHeaders: {"Accept": "application/json"},
		asynchronous: true,
		onSuccess: function (response) {
			var downloadForm = $("DataDownloader-downloadForm");
			if (downloadForm) {
				$("DataDownloader-saveRunPanel").removeChild(downloadForm);
			}

			downloadForm = document.createElement("form");
			downloadForm.id = "DataDownloader-downloadForm";
			downloadForm.display = "none";

			var i2b2Domain = document.createElement("input");
			i2b2Domain.type = "hidden";
			i2b2Domain.name = "i2b2-domain";
			i2b2Domain.value = i2b2.h.getDomain();
			downloadForm.appendChild(i2b2Domain);

			var i2b2User = document.createElement("input");
			i2b2User.type = "hidden";
			i2b2User.name = "i2b2-user";
			i2b2User.value = i2b2.h.getUser();
			downloadForm.appendChild(i2b2User);
	
			var i2b2Pass = document.createElement("input");
			i2b2Pass.type = "hidden";
			i2b2Pass.name = "i2b2-pass";
			i2b2Pass.value = i2b2.h.getPass();
			downloadForm.appendChild(i2b2Pass);

			var i2b2Project = document.createElement("input");
			i2b2Project.type = "hidden";
			i2b2Project.name = "i2b2-project";
			i2b2Project.value = i2b2.h.getProject();
			downloadForm.appendChild(i2b2Project);

			var configId = document.createElement("input");
			configId.type = "hidden";
			configId.name = "config-id";
			configId.value = response.responseJSON;
			downloadForm.appendChild(configId);

			var patientSetCollId = document.createElement("input");
			patientSetCollId.type = "hidden";
			patientSetCollId.name = "patient-set-coll-id";
			patientSetCollId.value = parseInt(i2b2.DataDownloader.model.prsRecord.origData.PRS_id); 
			downloadForm.appendChild(patientSetCollId);

			var patientSetSize = document.createElement("input");
			patientSetSize.type = "hidden";
			patientSetSize.name = "patient-set-size";
			patientSetSize.value = parseInt(i2b2.DataDownloader.model.prsRecord.origData.size);
			downloadForm.appendChild(patientSetSize);

			document.getElementById("DataDownloader-saveRunPanel").appendChild(downloadForm);
			var f = $$("FORM#DataDownloader-downloadForm")[0];
			f.action = i2b2.DataDownloader.SERVICE_URL + "/download/configId"
			f.method = "POST";			
			f.submit();
			
		}
	});
};

i2b2.DataDownloader.loadConfig = function() {
	var selectedConfigId = parseInt($("DataDownloader-userConfigsList").value);
	if (!selectedConfigId) {
		alert("Please select a configuration to load.");
	} else {
		new Ajax.Request(i2b2.DataDownloader.SERVICE_URL + '/config/load', {
		method: 'POST',
		contentType: 'application/json',
		postBody: Object.toJSON({'authMetadata': i2b2.DataDownloader.createI2b2AuthRequestObject(), 'outputConfigurationId': selectedConfigId}),
		requestHeaders: {"Accept": "application/json"},
		asynchronous: true,
		onSuccess: function(response) {
			var config = response.responseJSON;
			$("DataDownloader-whitespace").value = config.whitespaceReplacement;
			$("DataDownloader-delimiter").value = config.separator;
			$("DataDownloader-missing").value = config.missingValue;
			var rowDimOptions = $("DataDownloader-rowdim").options;
			for (var i = 0; i < rowDimOptions.length; i++) {
				var option = rowDimOptions.item(i);
				if (option.value === config.rowDimension.toLowerCase()) {
					option.selected = true;
					break;
				}
			}

			// remove all existing table rows
			var table = $("DataDownloader-configTable");
			var rowHolder = table.rows[0].parentNode;
			while (rowHolder.children.length > 1) {
				// we want to keep the header row
				rowHolder.removeChild(rowHolder.lastChild);
			}

			i2b2.DataDownloader.model.configuration.columnConfigs = [];
			// ensure we are looping over the column configs in the correct order
			config.columnConfigs.sort(i2b2.DataDownloader.colConfigComp);
			config.columnConfigs.forEach(function(colConfig) {
				var index = i2b2.DataDownloader.addColumnConfig();

				// repopulate the concept record for this column
				var c = colConfig.i2b2Concept;
				var crOrigData = {
					key: c.i2b2Key,
					level: c.level,
					dim_code: c.dimensionCode,
					table_name: c.tableName,
					column_name: c.columnName,
					hasChildren: c.hasChildren,
					icd9: c.icd9,
					name: c.name,
					operator: c.operator,
					tooltip: c.tooltip,
					xmlOrig: i2b2.h.parseXml(c.xmlOrig).getElementsByTagName('concept')[0]
				};
				var crSdxInfo = {
					sdxControlCell: "ONT",
					sdxDisplayName: c.displayName,
					sdxKeyName: "key",
					sdxKeyValue: c.i2b2Key,
					sdxType: "CONCPT"
				};
				var cr = { origData: crOrigData, sdxInfo: crSdxInfo, renderData: {}};
				i2b2.DataDownloader.model.configuration.columnConfigs[index].conceptRecord = cr;
				// let the user know that the drop was successful by displaying the name of the concept
	                        $("DataDownloader-CONCPTDROP-" + index).innerHTML = i2b2.h.Escape(cr.sdxInfo.sdxDisplayName);
	                        $("DataDownloader-CONCPTDROP-" + index).className = "droptrgt SDX-CONCPT";
	
				$("DataDownloader-columnName-" + index).value = colConfig.columnName;
				i2b2.DataDownloader.populateDispFmtSelect(index, cr);
				var dispFmtOptions = $("DataDownloader-dispfmt-select-" + index).options;
				for (var i = 0; i < dispFmtOptions.length; i++) {
					var option = dispFmtOptions.item(i);
					if (option.value === colConfig.displayFormat.toLowerCase()) {
						option.selected = true;
						break;
					}
				}
				i2b2.DataDownloader.showHideDispFmt(index, colConfig.displayFormat.toLowerCase());
				if (colConfig.displayFormat === "VALUE") {
					$("DataDownloader-howmany-" + index).value = colConfig.howMany;
					$("DataDownloader-timerange-" + index).checked = colConfig.includeTimeRange;
					$("DataDownloader-units-" + index).checked = colConfig.includeUnits;
				} else if (colConfig.displayFormat === "AGGREGATION") {
					$("DataDownloader-" + colConfig.aggregation.toLowerCase() + "-" + index).checked = true;	
					$("DataDownloader-units-" + index).checked = colConfig.includeUnits;
				}
			});
		}
		}); // end AJAX request
	}
};

i2b2.DataDownloader.deleteConfig = function() {
	var selectedConfigId = parseInt($("DataDownloader-userConfigsList").value);
	if (!selectedConfigId) {
		alert("Please select a configuration to delete.");
	} else {
		var configsList = $("DataDownloader-userConfigsList");
		var configName = '';
		for (var i = 0; i < configsList.options.length; i++) {
			if (configsList.options[i].selected) {
				configName = configsList.options[i].text;
				break;
			}
		}
		if (confirm("Are you sure want to delete this configuration: '" + configName + "'?")) {
			new Ajax.Request(i2b2.DataDownloader.SERVICE_URL + '/config/delete', {
				method: 'POST',
				contentType: 'application/json',
				postBody: Object.toJSON({'authMetadata': i2b2.DataDownloader.createI2b2AuthRequestObject(), 'outputConfigurationId': selectedConfigId}),
				requestHeaders: {"Accept": "application/json"},
				asynchronous: true,
				onSuccess: function(response) {
					i2b2.DataDownloader.populateConfigList();
					alert("Successfully deleted configuration: '" + configName + "'");
				}
			});
		}
	}
};
