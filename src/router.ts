import type { SupportedMethod } from "./types";

export interface Router<T> {
	routes: Routes<T>;
	add(method: SupportedMethod, path: Path, handler: T): void;
	match(method: SupportedMethod, path: Path): Result<T>;
}
/**
 * [method, path, handler]
 */
export type Routes<T> = [SupportedMethod, string, T][];
export type ParamIndexMap = Record<string, number>;
export type Params = Record<string, string>;
export type ParamStash = string[];

/**
 * [[handler, paramIndexMap][], paramArray]
 * ```typescript
 * [
 *   [
 *     [middlewareA, {}],                     // '*'
 *     [funcA,       {'id': 0}],              // '/user/:id/*'
 *     [funcB,       {'id': 0, 'action': 1}], // '/user/:id/:action'
 *   ],
 *   ['123', 'abc']
 * ]
 * ```
 *
 * [[handler, params][]]
 * ```typescript
 * [
 *   [
 *     [middlewareA, {}],                             // '*'
 *     [funcA,       {'id': '123'}],                  // '/user/:id/*'
 *     [funcB,       {'id': '123', 'action': 'abc'}], // '/user/:id/:action'
 *   ]
 * ]
 * ```
 */
export type Result<T> = [[T, ParamIndexMap][], ParamStash] | [[T, Params][]];

export type PathParameter = {
	name: string;
	type: "string" | "number";
	required: boolean;
};

export type QueryParameter = {
	[key: string]: {
		type: "string" | "number";
		required: boolean;
	};
};

export type Path = {
	segments: (string | PathParameter)[];
	query: QueryParameter;
};
