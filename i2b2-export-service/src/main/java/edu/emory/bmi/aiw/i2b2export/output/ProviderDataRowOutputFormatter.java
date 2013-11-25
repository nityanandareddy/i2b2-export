package edu.emory.bmi.aiw.i2b2export.output;

/*
 * #%L
 * i2b2 Export Service
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

import edu.emory.bmi.aiw.i2b2export.entity.I2b2Concept;
import edu.emory.bmi.aiw.i2b2export.entity.OutputConfiguration;
import edu.emory.bmi.aiw.i2b2export.i2b2.pdo.Observation;
import edu.emory.bmi.aiw.i2b2export.i2b2.pdo.Observer;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Output formatter for a provider row.
 *
 * @author Michel Mansour
 * @since 1.0
 */
final class ProviderDataRowOutputFormatter extends DataRowOutputFormatter {
	private final Observer provider;

	ProviderDataRowOutputFormatter(OutputConfiguration config, Observer provider) {
		super(config);
		this.provider = provider;
	}

	@Override
	protected List<String> rowPrefix() {
		List<String> result = new ArrayList<>();
		result.add(provider.getName());
		return result;
	}

	@Override
	protected Collection<Observation> matchingObservations(I2b2Concept i2b2Concept) {
		Collection<Observation> result = new ArrayList<>();

		for (Observation o : provider.getObservations()) {
			if (o.getConceptPath().equals(i2b2Concept.getI2b2Key())) {
				result.add(o);
			}
		}

		return result;
	}
}