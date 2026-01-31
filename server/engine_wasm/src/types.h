#ifndef PIPELINE_TYPES_H
#define PIPELINE_TYPES_H

#include <string>
#include <vector>
#include <map>
#include <set>
#include "../lib/json.hpp"

using json = nlohmann::json;

namespace pipeline {

// Valid operation types
const std::set<std::string> VALID_OPS = {
    "parse_csv",
    "filter",
    "select_columns",
    "dedupe",
    "rename_columns",
    "transform",
    "validate_email",
    "fix_dates",
    "output_csv"
};

// Pipeline node structure
struct PipelineNode {
    std::string id;
    std::string op;
    json config;
    std::vector<std::string> inputs;
    
    static PipelineNode from_json(const json& j) {
        PipelineNode node;
        node.id = j.value("id", "");
        node.op = j.value("op", "");
        node.config = j.value("config", json::object());
        node.inputs = j.value("inputs", std::vector<std::string>{});
        return node;
    }
};

// Pipeline specification
struct PipelineSpec {
    std::vector<PipelineNode> nodes;
    
    static PipelineSpec from_json(const json& j) {
        PipelineSpec spec;
        if (j.contains("nodes") && j["nodes"].is_array()) {
            for (const auto& node_json : j["nodes"]) {
                spec.nodes.push_back(PipelineNode::from_json(node_json));
            }
        }
        return spec;
    }
};

// Validation result
struct ValidationResult {
    bool valid;
    std::vector<std::string> errors;
    
    json to_json() const {
        return json{
            {"valid", valid},
            {"errors", errors}
        };
    }
};

// CSV data representation
struct CSVData {
    std::vector<std::string> headers;
    std::vector<std::vector<std::string>> rows;
    
    // Get column index by name, returns -1 if not found
    int get_column_index(const std::string& name) const {
        for (size_t i = 0; i < headers.size(); i++) {
            if (headers[i] == name) {
                return static_cast<int>(i);
            }
        }
        return -1;
    }
    
    // Add a new column
    void add_column(const std::string& name, const std::string& default_value = "") {
        headers.push_back(name);
        for (auto& row : rows) {
            row.push_back(default_value);
        }
    }
};

// Record representation (for easier manipulation)
using Record = std::map<std::string, std::string>;

// Convert CSVData to vector of Records
inline std::vector<Record> csv_to_records(const CSVData& csv) {
    std::vector<Record> records;
    for (const auto& row : csv.rows) {
        Record record;
        for (size_t i = 0; i < csv.headers.size() && i < row.size(); i++) {
            record[csv.headers[i]] = row[i];
        }
        records.push_back(record);
    }
    return records;
}

// Convert vector of Records back to CSVData
inline CSVData records_to_csv(const std::vector<Record>& records, const std::vector<std::string>& headers) {
    CSVData csv;
    csv.headers = headers;
    
    for (const auto& record : records) {
        std::vector<std::string> row;
        for (const auto& header : headers) {
            auto it = record.find(header);
            row.push_back(it != record.end() ? it->second : "");
        }
        csv.rows.push_back(row);
    }
    
    return csv;
}

} // namespace pipeline

#endif // PIPELINE_TYPES_H
