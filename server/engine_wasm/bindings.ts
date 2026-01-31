// ============================================
// WASM Engine Bindings
// ============================================

// This file provides the interface for the C++/WASM engine
// For v0, we use the TypeScript implementation in lib/wasm-engine.ts
// When the actual WASM module is available, this file will load and bind to it

import type { PipelineSpec, ParsedCSV, ValidationResult } from "../src/lib/types";
import {
  validatePipeline as tsValidate,
  runPipeline as tsRun,
} from "../src/lib/wasm-engine";

// ============================================
// WASM Module Loading (placeholder)
// ============================================

let wasmModule: WebAssembly.Module | null = null;
let wasmInstance: WebAssembly.Instance | null = null;

export async function loadWasmEngine(): Promise<boolean> {
  // TODO: Load actual WASM module when available
  // const wasmPath = new URL("./pipeline_engine.wasm", import.meta.url);
  // const wasmBytes = await Bun.file(wasmPath).arrayBuffer();
  // wasmModule = await WebAssembly.compile(wasmBytes);
  // wasmInstance = await WebAssembly.instantiate(wasmModule);

  console.log("WASM engine: using TypeScript fallback implementation");
  return false; // Return false to indicate using TS fallback
}

export function isWasmLoaded(): boolean {
  return wasmInstance !== null;
}

// ============================================
// Exported Functions (facade over WASM or TS)
// ============================================

export function validatePipeline(spec: PipelineSpec): ValidationResult {
  if (wasmInstance) {
    // TODO: Call WASM export
    // const specJson = JSON.stringify(spec);
    // const errorsJson = wasmInstance.exports.validate_pipeline(specJson);
    // return JSON.parse(errorsJson);
  }

  // Fallback to TypeScript implementation
  return tsValidate(spec);
}

export function runPipeline(spec: PipelineSpec, inputCSV: ParsedCSV): ParsedCSV {
  if (wasmInstance) {
    // TODO: Call WASM export
    // const specJson = JSON.stringify(spec);
    // const csvBytes = serializeCSV(inputCSV);
    // const outputBytes = wasmInstance.exports.run_pipeline(specJson, csvBytes);
    // return parseCSV(outputBytes);
  }

  // Fallback to TypeScript implementation
  return tsRun(spec, inputCSV);
}
