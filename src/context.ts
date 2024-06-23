import type { Env, Handler } from "./types";

export interface Context<E extends Env> {
	env: E["Bindings"];
	request: Request;
	response: Response;
	isTLS: boolean;
	isWebSocket: boolean;
	scheme: "http" | "https";
	realIP: string;
	path: string;
	setPath(path: string): void;
	params: Record<string, string>;
	query: URLSearchParams;
	formValues: URLSearchParams;
	formFile(name: string): Promise<File | null>;
	cookies: Record<string, string>;
	string(code: number, text: string): void;
	json(code: number, data: JsonSerializable): void;
	redirect(code: number, url: string): void;
	handler: Handler<E>;
}

type JsonSerializable =
	| string
	| number
	| boolean
	| null
	| JsonSerializable[]
	| { [key: string]: JsonSerializable };
