export interface Router<T> {
	name: string;
	add(method: string, path: string, handler: T): void;
	match(method: string, path: string): Result<T>;
}
export type ParamIndexMap = Record<string, number>;
export type Params = Record<string, string>;
export type ParamStash = string[];
export type Result<T> = [[T, ParamIndexMap][], ParamStash] | [[T, Params][]];
