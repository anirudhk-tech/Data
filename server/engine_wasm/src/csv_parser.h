#ifndef PIPELINE_CSV_PARSER_H
#define PIPELINE_CSV_PARSER_H

#include "types.h"

namespace pipeline {

// Parse CSV string into CSVData structure
CSVData parse_csv(const std::string& csv_content, char delimiter = ',');

// Serialize CSVData back to CSV string
std::string serialize_csv(const CSVData& data, char delimiter = ',');

} // namespace pipeline

#endif // PIPELINE_CSV_PARSER_H
