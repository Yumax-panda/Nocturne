import type { Router } from "./router";
import type { EmptyEnv, Env, Middleware } from "./types";

export interface INocturne<E extends Env = EmptyEnv> {
	env: E;
	router: Router<E>;
	routers: Record<string, Router<E>>;
	middlewares: Middleware<E>[];
}
