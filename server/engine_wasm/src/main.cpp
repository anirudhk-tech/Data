#include <emscripten.h>
#include <cstdlib>
#include <cstring>
#include "types.h"
#include "validator.h"
#include "executor.h"

using namespace pipeline;

// Helper to allocate and copy a string result
static char* copy_to_heap(const std::string& str) {
    char* result = (char*)malloc(str.size() + 1);
    if (result) {
        strcpy(result, str.c_str());
    }
    return result;
}

extern "C" {

// Validate a pipeline specification
// Input: JSON string of PipelineSpec
// Output: JSON string of ValidationResult {"valid": bool, "errors": string[]}
EMSCRIPTEN_KEEPALIVE
const char* validate_pipeline(const char* spec_json) {
    try {
        // Parse JSON input
        json j = json::parse(spec_json);
        PipelineSpec spec = PipelineSpec::from_json(j);
        
        // Validate
        ValidationResult result = pipeline::validate_pipeline(spec);
        
        // Convert result to JSON string
        std::string output = result.to_json().dump();
        return copy_to_heap(output);
        
    } catch (const std::exception& e) {
        // Return error as validation failure
        json error_result = {
            {"valid", false},
            {"errors", {std::string("Parse error: ") + e.what()}}
        };
        return copy_to_heap(error_result.dump());
    }
}

// Execute a pipeline on input CSV data
// Input: JSON string of PipelineSpec, CSV string
// Output: CSV string (on success) or JSON error (on failure)
EMSCRIPTEN_KEEPALIVE
const char* run_pipeline(const char* spec_json, const char* input_csv) {
    try {
        // Parse JSON input
        json j = json::parse(spec_json);
        PipelineSpec spec = PipelineSpec::from_json(j);
        
        // Execute pipeline
        std::string output_csv = execute_pipeline(spec, std::string(input_csv));
        
        return copy_to_heap(output_csv);
        
    } catch (const std::exception& e) {
        // Return error as JSON
        json error_result = {
            {"error", true},
            {"message", std::string("Execution error: ") + e.what()}
        };
        return copy_to_heap(error_result.dump());
    }
}

// Free a result string allocated by validate_pipeline or run_pipeline
EMSCRIPTEN_KEEPALIVE
void free_result(const char* ptr) {
    if (ptr) {
        free((void*)ptr);
    }
}

} // extern "C"
