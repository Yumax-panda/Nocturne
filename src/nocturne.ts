import type { Router } from "./router";
import type { EmptyEnv, Env, Middleware, SupportedMethod } from "./types";

export const RouteNotFound = "nocturne_route_not_found";

export class Nocturne<E extends Env = EmptyEnv> {
	env: E;
	maxParam: number;
	router: Router<E>;
	routers: Record<string, Router<E>>;
	middlewares: Middleware<E>[];
}

export class Route {
	method: SupportedMethod;
	path: string;
	name: string;
	constructor({
		method,
		path,
		name,
	}: { method: SupportedMethod; path: string; name: string }) {
		this.method = method;
		this.path = path;
		this.name = name;
	}
}
