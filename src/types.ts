import type { Context } from "./context";

export type Bindings = Record<string, unknown>;
export type Variables = Record<string, unknown>;

export type Env = Partial<{
	Bindings: Bindings;
	Variables: Variables;
}>;

export type EmptyEnv = {};

export type SupportedMethod =
	| "GET"
	| "POST"
	| "PUT"
	| "PATCH"
	| "DELETE"
	| "OPTIONS"
	| "TRACE"
	| "HEAD";

export type Middleware<E extends Env> = (next: Handler<E>) => Promise<void>;

export type Handler<E extends Env> = (c: Context<E>) => Promise<void>;

export type Route = {
	method: SupportedMethod;
	path: string;
	name: string;
};
