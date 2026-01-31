# Pipeline Engine WASM Build
# Requires: Emscripten SDK (emsdk)

EMCC = emcc
SRC_DIR = src
LIB_DIR = lib
BUILD_DIR = build

# Source files
SOURCES = $(SRC_DIR)/main.cpp \
          $(SRC_DIR)/validator.cpp \
          $(SRC_DIR)/executor.cpp \
          $(SRC_DIR)/csv_parser.cpp

# Output
OUTPUT = $(BUILD_DIR)/pipeline_engine.js

# Compiler flags
CFLAGS = -std=c++17 \
         -O3 \
         -s WASM=1 \
         -s MODULARIZE=1 \
         -s EXPORT_ES6=1 \
         -s ENVIRONMENT='web,node' \
         -s ALLOW_MEMORY_GROWTH=1 \
         -s EXPORTED_FUNCTIONS='["_validate_pipeline","_run_pipeline","_free_result","_malloc","_free"]' \
         -s EXPORTED_RUNTIME_METHODS='["UTF8ToString","stringToUTF8","lengthBytesUTF8"]' \
         -I$(LIB_DIR)

# Debug build flags
DEBUG_FLAGS = -g -s ASSERTIONS=1

.PHONY: all clean debug

all: $(OUTPUT)

$(OUTPUT): $(SOURCES)
	@mkdir -p $(BUILD_DIR)
	$(EMCC) $(SOURCES) $(CFLAGS) -o $(OUTPUT)
	@echo "Build complete: $(OUTPUT)"

debug: CFLAGS += $(DEBUG_FLAGS)
debug: $(OUTPUT)

clean:
	rm -rf $(BUILD_DIR)/*

# Install nlohmann/json header
install-deps:
	@mkdir -p $(LIB_DIR)
	curl -L https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp -o $(LIB_DIR)/json.hpp
	@echo "Dependencies installed"
