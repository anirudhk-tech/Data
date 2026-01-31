#include "executor.h"
#include "csv_parser.h"
#include <algorithm>
#include <cctype>
#include <regex>
#include <sstream>
#include <iomanip>
#include <ctime>

namespace pipeline {

// ============================================
// Helper Functions
// ============================================

static std::string to_lower(const std::string& s) {
    std::string result = s;
    std::transform(result.begin(), result.end(), result.begin(), ::tolower);
    return result;
}

static std::string to_upper(const std::string& s) {
    std::string result = s;
    std::transform(result.begin(), result.end(), result.begin(), ::toupper);
    return result;
}

static std::string trim(const std::string& s) {
    size_t start = s.find_first_not_of(" \t\r\n");
    if (start == std::string::npos) return "";
    size_t end = s.find_last_not_of(" \t\r\n");
    return s.substr(start, end - start + 1);
}

static bool is_number(const std::string& s) {
    if (s.empty()) return false;
    try {
        std::stod(s);
        return true;
    } catch (...) {
        return false;
    }
}

// ============================================
// Operation Implementations
// ============================================

// Filter operation
static void execute_filter(
    std::vector<Record>& data,
    const json& config
) {
    std::string condition = config.value("condition", "");
    if (condition.empty()) return;
    
    // Parse simple conditions: column == 'value', column > 100, column contains 'text'
    std::regex pattern(R"((\w+)\s*(==|!=|>|<|>=|<=|contains)\s*(.+))");
    std::smatch match;
    
    if (!std::regex_match(condition, match, pattern)) {
        return; // Can't parse, skip filter
    }
    
    std::string column = match[1].str();
    std::string op = match[2].str();
    std::string raw_value = match[3].str();
    
    // Remove quotes from value if present
    if (raw_value.size() >= 2 && 
        ((raw_value.front() == '\'' && raw_value.back() == '\'') ||
         (raw_value.front() == '"' && raw_value.back() == '"'))) {
        raw_value = raw_value.substr(1, raw_value.size() - 2);
    }
    
    data.erase(std::remove_if(data.begin(), data.end(), [&](const Record& record) {
        auto it = record.find(column);
        if (it == record.end()) return true; // Remove if column doesn't exist
        
        const std::string& cell_value = it->second;
        
        if (op == "==") {
            return cell_value != raw_value;
        } else if (op == "!=") {
            return cell_value == raw_value;
        } else if (op == ">") {
            if (is_number(cell_value) && is_number(raw_value)) {
                return std::stod(cell_value) <= std::stod(raw_value);
            }
            return true;
        } else if (op == "<") {
            if (is_number(cell_value) && is_number(raw_value)) {
                return std::stod(cell_value) >= std::stod(raw_value);
            }
            return true;
        } else if (op == ">=") {
            if (is_number(cell_value) && is_number(raw_value)) {
                return std::stod(cell_value) < std::stod(raw_value);
            }
            return true;
        } else if (op == "<=") {
            if (is_number(cell_value) && is_number(raw_value)) {
                return std::stod(cell_value) > std::stod(raw_value);
            }
            return true;
        } else if (op == "contains") {
            return to_lower(cell_value).find(to_lower(raw_value)) == std::string::npos;
        }
        
        return false;
    }), data.end());
}

// Select columns operation
static void execute_select_columns(
    std::vector<Record>& data,
    std::vector<std::string>& headers,
    const json& config
) {
    if (!config.contains("columns") || !config["columns"].is_array()) return;
    
    std::vector<std::string> columns = config["columns"].get<std::vector<std::string>>();
    
    // Update headers
    headers = columns;
    
    // Update records to only keep selected columns
    for (auto& record : data) {
        Record new_record;
        for (const auto& col : columns) {
            auto it = record.find(col);
            new_record[col] = (it != record.end()) ? it->second : "";
        }
        record = new_record;
    }
}

// Dedupe operation
static void execute_dedupe(
    std::vector<Record>& data,
    const json& config
) {
    if (!config.contains("key_columns") || !config["key_columns"].is_array()) return;
    
    std::vector<std::string> key_columns = config["key_columns"].get<std::vector<std::string>>();
    std::set<std::string> seen;
    
    data.erase(std::remove_if(data.begin(), data.end(), [&](const Record& record) {
        std::string key;
        for (const auto& col : key_columns) {
            auto it = record.find(col);
            key += (it != record.end() ? it->second : "") + "|";
        }
        
        if (seen.count(key)) {
            return true; // Duplicate, remove
        }
        seen.insert(key);
        return false;
    }), data.end());
}

// Rename columns operation
static void execute_rename_columns(
    std::vector<Record>& data,
    std::vector<std::string>& headers,
    const json& config
) {
    if (!config.contains("mapping") || !config["mapping"].is_object()) return;
    
    auto mapping = config["mapping"].get<std::map<std::string, std::string>>();
    
    // Update headers
    for (auto& header : headers) {
        auto it = mapping.find(header);
        if (it != mapping.end()) {
            header = it->second;
        }
    }
    
    // Update records
    for (auto& record : data) {
        Record new_record;
        for (const auto& [key, value] : record) {
            auto it = mapping.find(key);
            std::string new_key = (it != mapping.end()) ? it->second : key;
            new_record[new_key] = value;
        }
        record = new_record;
    }
}

// Transform operation
static void execute_transform(
    std::vector<Record>& data,
    const json& config
) {
    std::string column = config.value("column", "");
    std::string expression = config.value("expression", "");
    
    if (column.empty() || expression.empty()) return;
    
    for (auto& record : data) {
        auto it = record.find(column);
        if (it == record.end()) continue;
        
        std::string value = it->second;
        
        if (expression == "lower(value)") {
            record[column] = to_lower(value);
        } else if (expression == "upper(value)") {
            record[column] = to_upper(value);
        } else if (expression == "trim(value)") {
            record[column] = trim(value);
        } else if (expression.find("replace(") == 0) {
            // Parse replace(value, 'old', 'new')
            std::regex replace_pattern(R"(replace\(value,\s*'([^']*)',\s*'([^']*)'\))");
            std::smatch match;
            if (std::regex_match(expression, match, replace_pattern)) {
                std::string old_str = match[1].str();
                std::string new_str = match[2].str();
                size_t pos = 0;
                std::string result = value;
                while ((pos = result.find(old_str, pos)) != std::string::npos) {
                    result.replace(pos, old_str.length(), new_str);
                    pos += new_str.length();
                }
                record[column] = result;
            }
        }
    }
}

// Validate email operation
static void execute_validate_email(
    std::vector<Record>& data,
    std::vector<std::string>& headers,
    const json& config
) {
    std::string column = config.value("column", "");
    bool strict = config.value("strict", false);
    
    if (column.empty()) return;
    
    // Add email_valid column if not present
    if (std::find(headers.begin(), headers.end(), "email_valid") == headers.end()) {
        headers.push_back("email_valid");
    }
    
    // Email regex patterns
    std::regex strict_pattern(R"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})");
    std::regex loose_pattern(R"([^\s@]+@[^\s@]+\.[^\s@]+)");
    
    const std::regex& pattern = strict ? strict_pattern : loose_pattern;
    
    for (auto& record : data) {
        auto it = record.find(column);
        std::string email = (it != record.end()) ? it->second : "";
        bool is_valid = std::regex_match(email, pattern);
        record["email_valid"] = is_valid ? "true" : "false";
    }
}

// Fix dates operation
static void execute_fix_dates(
    std::vector<Record>& data,
    const json& config
) {
    std::string column = config.value("column", "");
    std::string format = config.value("format", "YYYY-MM-DD");
    
    if (column.empty()) return;
    
    for (auto& record : data) {
        auto it = record.find(column);
        if (it == record.end()) continue;
        
        std::string date_str = it->second;
        
        // Try to parse various date formats
        std::tm tm = {};
        std::istringstream ss(date_str);
        
        // Try common formats
        const char* formats[] = {
            "%Y-%m-%d",      // 2024-01-15
            "%m/%d/%Y",      // 01/15/2024
            "%d/%m/%Y",      // 15/01/2024
            "%Y/%m/%d",      // 2024/01/15
            "%b %d, %Y",     // Jan 15, 2024
            "%B %d, %Y",     // January 15, 2024
        };
        
        bool parsed = false;
        for (const char* fmt : formats) {
            ss.clear();
            ss.str(date_str);
            ss >> std::get_time(&tm, fmt);
            if (!ss.fail()) {
                parsed = true;
                break;
            }
        }
        
        if (parsed) {
            std::ostringstream out;
            if (format == "YYYY-MM-DD") {
                out << std::put_time(&tm, "%Y-%m-%d");
            } else if (format == "MM/DD/YYYY") {
                out << std::put_time(&tm, "%m/%d/%Y");
            } else if (format == "DD/MM/YYYY") {
                out << std::put_time(&tm, "%d/%m/%Y");
            } else {
                out << std::put_time(&tm, "%Y-%m-%d"); // Default
            }
            record[column] = out.str();
        }
        // If parsing fails, keep original value
    }
}

// ============================================
// Main Executor
// ============================================

std::string execute_pipeline(const PipelineSpec& spec, const std::string& input_csv) {
    // Parse input CSV
    CSVData csv_data = parse_csv(input_csv);
    
    // Convert to records for easier manipulation
    std::vector<Record> data = csv_to_records(csv_data);
    std::vector<std::string> headers = csv_data.headers;
    
    // Execute each node
    for (const auto& node : spec.nodes) {
        if (node.op == "parse_csv") {
            // Already parsed, nothing to do
            continue;
        }
        else if (node.op == "output_csv") {
            // Will be handled at the end
            continue;
        }
        else if (node.op == "filter") {
            execute_filter(data, node.config);
        }
        else if (node.op == "select_columns") {
            execute_select_columns(data, headers, node.config);
        }
        else if (node.op == "dedupe") {
            execute_dedupe(data, node.config);
        }
        else if (node.op == "rename_columns") {
            execute_rename_columns(data, headers, node.config);
        }
        else if (node.op == "transform") {
            execute_transform(data, node.config);
        }
        else if (node.op == "validate_email") {
            execute_validate_email(data, headers, node.config);
        }
        else if (node.op == "fix_dates") {
            execute_fix_dates(data, node.config);
        }
        // Unknown operations are skipped
    }
    
    // Convert back to CSV
    CSVData output = records_to_csv(data, headers);
    return serialize_csv(output);
}

} // namespace pipeline
