// this file contains a list of all files that need to be loaded dynamically for this i2b2 Cell
// every file in this list will be loaded after the cell's Init function is called
{
	files:[
		"PatientDataExport_ctrlr.js"
	],
	css:[ 
		"PatientDataExport.css"
	],
	config: {
		// additional configuration variables that are set by the system
		short_name: "Patient Data Export",
		name: "Patient Data Export",
		description: "Export the results of a patient query.",
		category: ["celless","plugin","local"],
		plugin: {
			isolateHtml: false,  // this means do not use an IFRAME
			isolateComm: false,  // this means to expect the plugin to use AJAX communications provided by the framework
			standardTabs: true, // this means the plugin uses standard tabs at top
			html: {
				source: 'injected_screens.html',
				mainDivId: 'PatientDataExport-mainDiv'
			}
		}
	}
}