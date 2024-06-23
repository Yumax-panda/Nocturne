import type { Params, Path, Result, Router } from "../router";
import type { SupportedMethod } from "../types";

const MISSING = Symbol("missing sentinel");

class LinearRouter<T> implements Router<T> {
	constructor(public routes: [SupportedMethod, string, T][] = []) {}

	add(method: SupportedMethod, path: Path, handler: T): void {}

	match(method: SupportedMethod, path: Path): Result<T> {
		const handlerAndParams: [T, Params][] = [];

		return [handlerAndParams];
	}
}
