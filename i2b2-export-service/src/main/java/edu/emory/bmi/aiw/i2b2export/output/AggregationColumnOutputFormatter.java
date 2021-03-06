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

import edu.emory.bmi.aiw.i2b2export.entity.OutputColumnConfigurationEntity;
import java.io.BufferedWriter;
import java.io.IOException;

import java.math.BigDecimal;
import java.util.Collection;
import org.eurekaclinical.i2b2.client.pdo.Observation;

/**
 * Column formatter for aggregation columns.
 *
 * @author Michel Mansour
 * @since 1.0
 */
final class AggregationColumnOutputFormatter extends AbstractColumnOutputFormatter {

	/**
	 * Default constructor
	 *
	 * @param columnConfig the configuration of the column to format
	 * @param formatOptions the global format options to apply to the column
	 */
	AggregationColumnOutputFormatter(OutputColumnConfigurationEntity columnConfig, FormatOptions formatOptions) {
		super(columnConfig, formatOptions);
	}

	@Override
	public int format(Collection<Observation> data, BufferedWriter writer, int numCol) throws IOException {
		String units = "";

		if (data == null || data.isEmpty()) {
			write(getFormatOptions().getMissingData(), writer, numCol++);
			units = getFormatOptions().getMissingData();
		} else {
			switch (getColumnConfig().getAggregation()) {
				case MIN:
					BigDecimal minValue = new BigDecimal(Double.MAX_VALUE);
					for (Observation obx : data) {
						BigDecimal value = new BigDecimal(obx.getNval());
						if (value.compareTo(minValue) < 0) {
							minValue = value;
							units = obx.getUnits();
						}
					}
					write(minValue.toString(), writer, numCol++);
					break;
				case MAX:
					BigDecimal maxValue = new BigDecimal(Double.MIN_VALUE);
					for (Observation obx : data) {
						BigDecimal value = new BigDecimal(obx.getNval());
						if (value.compareTo(maxValue) > 0) {
							maxValue = value;
							units = obx.getUnits();
						}
					}
					write(maxValue.toString(), writer, numCol++);
					break;
				case AVG:
					BigDecimal sum = new BigDecimal(0.0);
					int scale = 0;
					for (Observation obx : data) {
						BigDecimal value = new BigDecimal(obx.getNval());
						sum = sum.add(value);
						units = obx.getUnits();
						int dotIdx = obx.getNval().indexOf('.');
						if (dotIdx > -1) {
							int tempScale = obx.getNval().length() - obx.getNval()
									.indexOf('.');
							if (tempScale > scale) {
								scale = tempScale;
							}
						}
					}
					BigDecimal avg = sum.divide(new BigDecimal(data.size()),
							scale);
					write(avg.toString(), writer, numCol++);
					break;
				default:
					throw new RuntimeException("aggregation type not provided");
			}
		}
		if (getColumnConfig().getIncludeUnits()) {
			write(units, writer, numCol++);
		}

		return numCol;
	}
}
