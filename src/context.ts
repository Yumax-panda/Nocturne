import type { Nocturne } from "./nocturne";
import type { Env } from "./types";

export interface Context<E extends Env> {
	env: E["Bindings"];
	request: Request;
	setRequest(request: Request): void;
	response: Response;
	setResponse(response: Response): void;
	isTLS: boolean;
	isWebSocket: boolean;
	scheme: "http" | "https";
	realIP: string;
	path: string;
	setPath(path: string): void;
	params: Record<string, string>;
	nocturne(): Nocturne<E>;
}
