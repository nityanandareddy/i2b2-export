package edu.emory.cci.aiw.i2b2patientdataexport.output;

import edu.emory.cci.aiw.i2b2patientdataexport.entity.OutputConfiguration;

/**
 *
 */
public final class FormatOptions {
	private final String columnSeparator;
	private final String missingData;

	public FormatOptions(OutputConfiguration config) {
		this.columnSeparator = config.getSeparator();
		this.missingData = config.getMissingValue();
	}

	public String getColumnSeparator() {
		return columnSeparator;
	}

	public String getMissingData() {
		return missingData;
	}

}