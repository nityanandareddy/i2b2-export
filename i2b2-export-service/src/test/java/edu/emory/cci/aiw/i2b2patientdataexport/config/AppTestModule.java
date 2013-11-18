package edu.emory.cci.aiw.i2b2patientdataexport.config;

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

import com.google.inject.AbstractModule;
import com.google.inject.persist.jpa.JpaPersistModule;
import edu.emory.cci.aiw.i2b2patientdataexport.dao.MockOutputColumnConfigurationDao;
import edu.emory.cci.aiw.i2b2patientdataexport.dao.MockOutputConfigurationDao;
import edu.emory.cci.aiw.i2b2patientdataexport.dao.OutputColumnConfigurationDao;
import edu.emory.cci.aiw.i2b2patientdataexport.dao.OutputConfigurationDao;
import edu.emory.cci.aiw.i2b2patientdataexport.i2b2.I2b2PdoRetriever;
import edu.emory.cci.aiw.i2b2patientdataexport.i2b2.I2b2UserAuthenticator;
import edu.emory.cci.aiw.i2b2patientdataexport.i2b2.MockI2b2PdoRetriever;
import edu.emory.cci.aiw.i2b2patientdataexport.i2b2.MockI2b2UserAuthenticator;

public class AppTestModule extends AbstractModule {

	@Override
	protected void configure() {
		install(new JpaPersistModule("i2b2-patient-data-export-persist"));
		bind(OutputConfigurationDao.class).to(MockOutputConfigurationDao.class);
		bind(OutputColumnConfigurationDao.class).to(MockOutputColumnConfigurationDao.class);
		bind(I2b2UserAuthenticator.class).to(MockI2b2UserAuthenticator.class);
		bind(I2b2PdoRetriever.class).to(MockI2b2PdoRetriever.class);
	}
}