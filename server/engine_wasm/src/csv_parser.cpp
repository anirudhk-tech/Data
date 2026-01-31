#include "csv_parser.h"
#include <sstream>

namespace pipeline {

// Parse a single CSV line handling quotes
static std::vector<std::string> parse_csv_line(const std::string& line, char delimiter) {
    std::vector<std::string> result;
    std::string current;
    bool in_quotes = false;
    
    for (size_t i = 0; i < line.size(); i++) {
        char c = line[i];
        char next = (i + 1 < line.size()) ? line[i + 1] : '\0';
        
        if (in_quotes) {
            if (c == '"' && next == '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else if (c == '"') {
                // End of quoted field
                in_quotes = false;
            } else {
                current += c;
            }
        } else {
            if (c == '"') {
                // Start of quoted field
                in_quotes = true;
            } else if (c == delimiter) {
                // End of field
                // Trim whitespace
                size_t start = current.find_first_not_of(" \t");
                size_t end = current.find_last_not_of(" \t");
                if (start != std::string::npos) {
                    result.push_back(current.substr(start, end - start + 1));
                } else {
                    result.push_back("");
                }
                current.clear();
            } else {
                current += c;
            }
        }
    }
    
    // Don't forget the last field
    size_t start = current.find_first_not_of(" \t");
    size_t end = current.find_last_not_of(" \t");
    if (start != std::string::npos) {
        result.push_back(current.substr(start, end - start + 1));
    } else {
        result.push_back("");
    }
    
    return result;
}

// Split string by newlines (handling \r\n and \n)
static std::vector<std::string> split_lines(const std::string& content) {
    std::vector<std::string> lines;
    std::string current;
    
    for (size_t i = 0; i < content.size(); i++) {
        char c = content[i];
        if (c == '\r') {
            // Skip \r, next \n will trigger line break
            continue;
        } else if (c == '\n') {
            lines.push_back(current);
            current.clear();
        } else {
            current += c;
        }
    }
    
    // Add last line if not empty
    if (!current.empty()) {
        lines.push_back(current);
    }
    
    return lines;
}

CSVData parse_csv(const std::string& csv_content, char delimiter) {
    CSVData data;
    
    auto lines = split_lines(csv_content);
    if (lines.empty()) {
        return data;
    }
    
    // First line is headers
    data.headers = parse_csv_line(lines[0], delimiter);
    
    // Remaining lines are data rows
    for (size_t i = 1; i < lines.size(); i++) {
        const auto& line = lines[i];
        // Skip empty lines
        if (line.find_first_not_of(" \t\r\n") == std::string::npos) {
            continue;
        }
        data.rows.push_back(parse_csv_line(line, delimiter));
    }
    
    return data;
}

// Check if a field needs quoting
static bool needs_quoting(const std::string& field, char delimiter) {
    return field.find(delimiter) != std::string::npos ||
           field.find('"') != std::string::npos ||
           field.find('\n') != std::string::npos ||
           field.find('\r') != std::string::npos;
}

// Escape a field for CSV output
static std::string escape_field(const std::string& field, char delimiter) {
    if (needs_quoting(field, delimiter)) {
        std::string escaped = "\"";
        for (char c : field) {
            if (c == '"') {
                escaped += "\"\""; // Escape quotes by doubling
            } else {
                escaped += c;
            }
        }
        escaped += "\"";
        return escaped;
    }
    return field;
}

std::string serialize_csv(const CSVData& data, char delimiter) {
    std::ostringstream oss;
    
    // Write headers
    for (size_t i = 0; i < data.headers.size(); i++) {
        if (i > 0) oss << delimiter;
        oss << escape_field(data.headers[i], delimiter);
    }
    oss << "\n";
    
    // Write rows
    for (const auto& row : data.rows) {
        for (size_t i = 0; i < row.size(); i++) {
            if (i > 0) oss << delimiter;
            oss << escape_field(row[i], delimiter);
        }
        oss << "\n";
    }
    
    return oss.str();
}

} // namespace pipeline
