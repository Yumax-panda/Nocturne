import type { SupportedMethod } from "./types";

export interface Router<T> {
	routes: Routes<T>;
	add(method: SupportedMethod, path: string, handler: T): void;
	match(method: SupportedMethod, path: string): Result<T>;
}
/**
 * [method, path, handler]
 */
export type Routes<T> = [SupportedMethod, string, T][];
export type ParamIndexMap = Record<string, number>;
export type Params = Record<string, string>;
export type ParamStash = string[];
export type Result<T> = [[T, ParamIndexMap][], ParamStash] | [[T, Params][]];
