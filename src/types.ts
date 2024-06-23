export type Bindings = Record<string, unknown>;
export type Variables = Record<string, unknown>;

export type Env = Partial<{
	Bindings: Bindings;
	Variables: Variables;
}>;

export type EmptyEnv = {};

export type Next = () => Promise<void>;

export type SupportedMethod =
	| "GET"
	| "POST"
	| "PUT"
	| "PATCH"
	| "DELETE"
	| "OPTIONS";
