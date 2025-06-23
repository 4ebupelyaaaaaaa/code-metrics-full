//осталось с прошлой реализации, может понадобится
export interface FunctionAnalysis {
  name: string;
  cyclomaticComplexity: number;
  nestingDepth: number;
  argumentsCount: number;
  linesOfCode: number;
}

export interface DuplicationLocation {
  file: string;
  lines: number[];
}

export interface AnalysisError {
  functionName: string;
  message: string;
}

export interface ErrorStats {
  [errorType: string]: number;
}

export interface AnalysisResult {
  cyclomaticComplexity: number;
  nestingDepth: number;
  duplicateLines: number;
  linesOfCode: number;
  averageLineLength: number;
  topNestedFunctions?: FunctionAnalysis[];
  highComplexityFunctions?: FunctionAnalysis[];
  duplicatePercentage?: number;
  averageArgumentsPerFunction?: number;
  maxFunctionLength?: number;
  averageFunctionNesting?: number;
  complexityDistribution?: Record<string, number>;
  duplicationLocations?: DuplicationLocation[];
  errors?: AnalysisError[];
  errorStats?: ErrorStats;
}

export interface FilterOptions {
  minNestingDepth?: number;
  minCyclomaticComplexity?: number;
}
