#ifndef PIPELINE_VALIDATOR_H
#define PIPELINE_VALIDATOR_H

#include "types.h"

namespace pipeline {

// Validate a pipeline specification
ValidationResult validate_pipeline(const PipelineSpec& spec);

} // namespace pipeline

#endif // PIPELINE_VALIDATOR_H
