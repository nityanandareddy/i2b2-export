package edu.emory.cci.aiw.i2b2patientdataexport.output;

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

import edu.emory.cci.aiw.i2b2patientdataexport.entity.I2b2Concept;
import edu.emory.cci.aiw.i2b2patientdataexport.entity.OutputConfiguration;
import edu.emory.cci.aiw.i2b2patientdataexport.i2b2.I2b2CommUtil;
import edu.emory.cci.aiw.i2b2patientdataexport.i2b2.pdo.Event;
import edu.emory.cci.aiw.i2b2patientdataexport.i2b2.pdo.Observation;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

final class VisitDataRowOutputFormatter extends DataRowOutputFormatter {
	private final Event visit;

	public VisitDataRowOutputFormatter(OutputConfiguration config, Event visit) {
		super(config);
		this.visit = visit;

	}

	@Override
	public List<String> rowPrefix() {
		List<String> result = new ArrayList<String>();
		DateFormat fmt = new SimpleDateFormat(I2b2CommUtil.I2B2_DATE_FMT);

		result.add(visit.getPatient().getPatientId());
		result.add(visit.getEventId());
		result.add(fmt.format(visit.getStartDate()));
		result.add(fmt.format(visit.getEndDate()));

		return result;
	}

	@Override
	protected Collection<Observation> matchingObservations(I2b2Concept i2b2Concept) {
		Collection<Observation> result = new ArrayList<Observation>();

		for (Observation o : visit.getObservations()) {
			if (o.getConceptPath().equals(i2b2Concept.getI2b2Key())) {
				result.add(o);
			}
		}

		return result;
	}
}
