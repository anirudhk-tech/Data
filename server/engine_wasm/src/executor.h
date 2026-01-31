#ifndef PIPELINE_EXECUTOR_H
#define PIPELINE_EXECUTOR_H

#include "types.h"
#include <string>

namespace pipeline {

// Execute a pipeline on input CSV data
// Returns output CSV string on success, or error JSON on failure
std::string execute_pipeline(const PipelineSpec& spec, const std::string& input_csv);

} // namespace pipeline

#endif // PIPELINE_EXECUTOR_H
