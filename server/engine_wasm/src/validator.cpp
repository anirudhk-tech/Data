#include "validator.h"
#include <algorithm>

namespace pipeline {

// Validate node-specific configuration
static void validate_node_config(const PipelineNode& node, std::vector<std::string>& errors) {
    const auto& config = node.config;
    
    if (node.op == "select_columns") {
        if (!config.contains("columns") || !config["columns"].is_array()) {
            errors.push_back("Node " + node.id + ": select_columns requires 'columns' array");
        }
    }
    else if (node.op == "dedupe") {
        if (!config.contains("key_columns") || !config["key_columns"].is_array()) {
            errors.push_back("Node " + node.id + ": dedupe requires 'key_columns' array");
        }
    }
    else if (node.op == "filter") {
        if (!config.contains("condition") || !config["condition"].is_string()) {
            errors.push_back("Node " + node.id + ": filter requires 'condition' string");
        }
    }
    else if (node.op == "rename_columns") {
        if (!config.contains("mapping") || !config["mapping"].is_object()) {
            errors.push_back("Node " + node.id + ": rename_columns requires 'mapping' object");
        }
    }
    else if (node.op == "transform") {
        if (!config.contains("column") || !config["column"].is_string()) {
            errors.push_back("Node " + node.id + ": transform requires 'column' string");
        }
        if (!config.contains("expression") || !config["expression"].is_string()) {
            errors.push_back("Node " + node.id + ": transform requires 'expression' string");
        }
    }
    else if (node.op == "validate_email") {
        if (!config.contains("column") || !config["column"].is_string()) {
            errors.push_back("Node " + node.id + ": validate_email requires 'column' string");
        }
    }
    else if (node.op == "fix_dates") {
        if (!config.contains("column") || !config["column"].is_string()) {
            errors.push_back("Node " + node.id + ": fix_dates requires 'column' string");
        }
    }
}

ValidationResult validate_pipeline(const PipelineSpec& spec) {
    ValidationResult result;
    result.valid = true;
    
    // Check if nodes array exists and is not empty
    if (spec.nodes.empty()) {
        result.valid = false;
        result.errors.push_back("Pipeline must have at least one node");
        return result;
    }
    
    std::set<std::string> node_ids;
    std::map<std::string, int> node_order;
    
    // First pass: collect node IDs and check for duplicates
    for (size_t i = 0; i < spec.nodes.size(); i++) {
        const auto& node = spec.nodes[i];
        
        // Check for missing ID
        if (node.id.empty()) {
            result.errors.push_back("Node missing required 'id' field");
            continue;
        }
        
        // Check for duplicate IDs
        if (node_ids.count(node.id)) {
            result.errors.push_back("Duplicate node ID: " + node.id);
        }
        node_ids.insert(node.id);
        node_order[node.id] = static_cast<int>(i);
    }
    
    // Second pass: validate each node
    for (const auto& node : spec.nodes) {
        if (node.id.empty()) continue;
        
        // Check for missing op
        if (node.op.empty()) {
            result.errors.push_back("Node " + node.id + ": missing 'op' field");
            continue;
        }
        
        // Validate operation type
        if (VALID_OPS.find(node.op) == VALID_OPS.end()) {
            result.errors.push_back("Node " + node.id + ": unknown operation '" + node.op + "'");
        }
        
        // Validate inputs reference existing nodes
        for (const auto& input_id : node.inputs) {
            if (node_ids.find(input_id) == node_ids.end()) {
                result.errors.push_back("Node " + node.id + ": references unknown input '" + input_id + "'");
            }
        }
        
        // Validate operation-specific config
        validate_node_config(node, result.errors);
    }
    
    // Check that pipeline starts with parse_csv
    if (!spec.nodes.empty() && spec.nodes[0].op != "parse_csv") {
        result.errors.push_back("Pipeline must start with parse_csv node");
    }
    
    // Check that pipeline ends with output_csv
    if (!spec.nodes.empty() && spec.nodes.back().op != "output_csv") {
        result.errors.push_back("Pipeline must end with output_csv node");
    }
    
    // Check for cycles (inputs must reference earlier nodes)
    for (const auto& node : spec.nodes) {
        if (node.id.empty()) continue;
        
        int node_index = node_order[node.id];
        for (const auto& input_id : node.inputs) {
            auto it = node_order.find(input_id);
            if (it != node_order.end() && it->second >= node_index) {
                result.errors.push_back("Node " + node.id + ": creates cycle by referencing '" + input_id + "'");
            }
        }
    }
    
    result.valid = result.errors.empty();
    return result;
}

} // namespace pipeline
