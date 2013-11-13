package edu.emory.cci.aiw.i2b2patientdataexport.xml;

/*
 * #%L
 * i2b2 Patient Data Export Service
 * %%
 * Copyright (C) 2013 Emory University
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */

import edu.emory.cci.aiw.i2b2patientdataexport.resource.I2b2PatientDataExportServiceException;

public class I2b2PatientDataExportServiceXmlException extends I2b2PatientDataExportServiceException {

	public I2b2PatientDataExportServiceXmlException() {
		super();
	}

	public I2b2PatientDataExportServiceXmlException(String message, Throwable cause) {
		super(message, cause);
	}

	public I2b2PatientDataExportServiceXmlException(String message) {
		super(message);
	}

	public I2b2PatientDataExportServiceXmlException(Throwable cause) {
		super(cause);
	}

}
