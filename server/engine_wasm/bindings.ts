// ============================================
// WASM Engine Bindings
// ============================================

import type { PipelineSpec, ParsedCSV, ValidationResult } from "../src/lib/types";
import { parseCSV, serializeCSV } from "../src/lib/csv";

// TypeScript fallback implementations
import {
  validatePipeline as tsValidate,
  runPipeline as tsRun,
} from "../src/lib/wasm-engine";

// ============================================
// WASM Module Interface
// ============================================

interface WasmModule {
  _validate_pipeline: (specPtr: number) => number;
  _run_pipeline: (specPtr: number, csvPtr: number) => number;
  _free_result: (ptr: number) => void;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  UTF8ToString: (ptr: number) => string;
  stringToUTF8: (str: string, ptr: number, maxBytes: number) => void;
  lengthBytesUTF8: (str: string) => number;
}

// ============================================
// Module State
// ============================================

let wasmModule: WasmModule | null = null;
let useWasm = false;

// ============================================
// WASM Loading
// ============================================

export async function loadWasmEngine(): Promise<boolean> {
  try {
    // Dynamic import of the Emscripten-generated module
    // This will be available after building with `make`
    const createModule = await import("./build/pipeline_engine.js");
    wasmModule = await createModule.default();
    useWasm = true;
    console.log("WASM engine loaded successfully");
    return true;
  } catch (error) {
    console.log("WASM engine not available, using TypeScript fallback:", error);
    useWasm = false;
    return false;
  }
}

export function isWasmLoaded(): boolean {
  return useWasm && wasmModule !== null;
}

// ============================================
// Helper Functions
// ============================================

function allocateString(wasm: WasmModule, str: string): number {
  const bytes = wasm.lengthBytesUTF8(str) + 1;
  const ptr = wasm._malloc(bytes);
  wasm.stringToUTF8(str, ptr, bytes);
  return ptr;
}

// ============================================
// Exported Functions
// ============================================

export function validatePipeline(spec: PipelineSpec): ValidationResult {
  // Use WASM if available
  if (useWasm && wasmModule) {
    try {
      const specJson = JSON.stringify(spec);
      const specPtr = allocateString(wasmModule, specJson);
      
      const resultPtr = wasmModule._validate_pipeline(specPtr);
      const resultJson = wasmModule.UTF8ToString(resultPtr);
      
      // Free allocated memory
      wasmModule._free(specPtr);
      wasmModule._free_result(resultPtr);
      
      return JSON.parse(resultJson) as ValidationResult;
    } catch (error) {
      console.error("WASM validation failed, falling back to TS:", error);
    }
  }

  // Fallback to TypeScript implementation
  return tsValidate(spec);
}

export function runPipeline(spec: PipelineSpec, inputCSV: ParsedCSV): ParsedCSV {
  // Use WASM if available
  if (useWasm && wasmModule) {
    try {
      const specJson = JSON.stringify(spec);
      const csvString = serializeCSV(inputCSV);
      
      const specPtr = allocateString(wasmModule, specJson);
      const csvPtr = allocateString(wasmModule, csvString);
      
      const resultPtr = wasmModule._run_pipeline(specPtr, csvPtr);
      const resultString = wasmModule.UTF8ToString(resultPtr);
      
      // Free allocated memory
      wasmModule._free(specPtr);
      wasmModule._free(csvPtr);
      wasmModule._free_result(resultPtr);
      
      // Check if result is an error JSON
      if (resultString.startsWith('{"error":')) {
        const error = JSON.parse(resultString);
        throw new Error(error.message);
      }
      
      // Parse the output CSV
      return parseCSV(resultString);
    } catch (error) {
      console.error("WASM execution failed, falling back to TS:", error);
    }
  }

  // Fallback to TypeScript implementation
  return tsRun(spec, inputCSV);
}
