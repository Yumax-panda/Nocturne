import type { Route } from "./nocturne";
import type { Router } from "./router";
import type { Env, Handler, Middleware, SupportedMethod } from "./types";

export interface GroupMixin<E extends Env> {
	middleware: Middleware<E>[];
	router: Router<E>;
	get: Callback<E>;
	post: Callback<E>;
	put: Callback<E>;
	patch: Callback<E>;
	delete: Callback<E>;
	options: Callback<E>;
	trace: Callback<E>;
	head: Callback<E>;
	group: (path: string) => Group<E>;
	match: (
		methods: SupportedMethod[],
		...args: Parameters<Callback<E>>
	) => Route[];
	add: (method: SupportedMethod, path: string, handler: Handler<E>) => Route;
}

type Callback<E extends Env> = (
	path: string,
	handler: Handler<E>,
	...middlewares: Middleware<E>[]
) => Route;

export interface Group<E extends Env> extends GroupMixin<E> {
	host: string;
	prefix: string;
}
