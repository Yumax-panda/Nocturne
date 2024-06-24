import type { IRouter as Router } from "./router";
import type { EmptyEnv, Env, Middleware } from "./types";

export const RouteNotFound = "nocturne_route_not_found";

export interface INocturne<E extends Env = EmptyEnv> {
	env: E;
	router: Router<E>;
	routers: Record<string, Router<E>>;
	middlewares: Middleware<E>[];
}

export class Nocturne<E extends Env = EmptyEnv> implements INocturne<E> {
	env: E;
	router: Router<E>;
	routers: Record<string, Router<E>>;
	middlewares: Middleware<E>[];
}
