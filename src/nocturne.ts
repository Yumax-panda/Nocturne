import type { Router } from "./router";
import type { EmptyEnv, Env, Middleware, SupportedMethod } from "./types";

export const RouteNotFound = "nocturne_route_not_found";

export class Nocturne<E extends Env = EmptyEnv> {
	env: E;
	router: Router<E>;
	routers: Record<string, Router<E>>;
	middlewares: Middleware<E>[];
}

export class Route {
	constructor(
		public method: SupportedMethod,
		public path: string,
		public name: string,
	) {}
}
