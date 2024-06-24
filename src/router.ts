import type { INocturne as Nocturne } from "./nocturne";
import type { Route } from "./types";
import type { Env, Handler } from "./types";

enum AllowHeader {
	CONNECT = "CONNECT",
	DELETE = "DELETE",
	GET = "GET",
	HEAD = "HEAD",
	OPTIONS = "OPTIONS",
	PATCH = "PATCH",
	POST = "POST",
	PROPFIND = "PROPFIND",
	PUT = "PUT",
	TRACE = "TRACE",
	REPORT = "REPORT",
}

export type IRouter<E extends Env> = {
	tree: INode<E>;
	routes: Record<string, Route>;
	n: Nocturne<E>;
};

type INode<E extends Env> = {
	methods?: RouteMethods<E>;
	parent?: INode<E>;
	paramChild?: INode<E>;
	anyChild?: INode<E>;
	notFound?: RouteMethod<E>;
	prefix?: string;
	originalPath: string;
	staticChildren: Children<E>;
	paramsCount: number;
	label: string;
	kind: number;
	isLeaf: boolean;
	isHandler: boolean;
};

type Children<E extends Env> = INode<E>[];

interface RouteMethod<E extends Env> {
	handler: Handler<E>;
	path: string;
	names: string[];
}

interface IRouteMethods<E extends Env> {
	connect?: RouteMethod<E>;
	delete?: RouteMethod<E>;
	get?: RouteMethod<E>;
	head?: RouteMethod<E>;
	options?: RouteMethod<E>;
	patch?: RouteMethod<E>;
	post?: RouteMethod<E>;
	propfind?: RouteMethod<E>;
	put?: RouteMethod<E>;
	trace?: RouteMethod<E>;
	report?: RouteMethod<E>;
	anyOther: Record<string, RouteMethod<E>>;
	allowHeader: string;
}

export class RouteMethods<E extends Env> implements IRouteMethods<E> {
	connect?: RouteMethod<E>;
	delete?: RouteMethod<E>;
	get?: RouteMethod<E>;
	head?: RouteMethod<E>;
	options?: RouteMethod<E>;
	patch?: RouteMethod<E>;
	post?: RouteMethod<E>;
	propfind?: RouteMethod<E>;
	put?: RouteMethod<E>;
	trace?: RouteMethod<E>;
	report?: RouteMethod<E>;
	anyOther: Record<string, RouteMethod<E>>;
	allowHeader: string;

	constructor(anyOther: Record<string, RouteMethod<E>> = {}) {
		this.anyOther = anyOther;
		this.allowHeader = "";
	}

	isHandler(): boolean {
		return (
			this.connect !== undefined ||
			this.delete !== undefined ||
			this.get !== undefined ||
			this.head !== undefined ||
			this.options !== undefined ||
			this.patch !== undefined ||
			this.post !== undefined ||
			this.propfind !== undefined ||
			this.put !== undefined ||
			this.trace !== undefined ||
			this.report !== undefined ||
			Object.keys(this.anyOther).length > 0
		);
	}

	updateAllowHeader(): void {
		const allowHeaders: string[] = [AllowHeader.OPTIONS];

		if (this.connect) {
			allowHeaders.push(AllowHeader.CONNECT);
		}

		if (this.delete) {
			allowHeaders.push(AllowHeader.DELETE);
		}

		if (this.get) {
			allowHeaders.push(AllowHeader.GET);
		}

		if (this.head) {
			allowHeaders.push(AllowHeader.HEAD);
		}

		if (this.patch) {
			allowHeaders.push(AllowHeader.PATCH);
		}

		if (this.post) {
			allowHeaders.push(AllowHeader.POST);
		}

		if (this.propfind) {
			allowHeaders.push(AllowHeader.PROPFIND);
		}

		if (this.put) {
			allowHeaders.push(AllowHeader.PUT);
		}

		if (this.trace) {
			allowHeaders.push(AllowHeader.TRACE);
		}

		if (this.report) {
			allowHeaders.push(AllowHeader.REPORT);
		}

		for (const method in this.anyOther) {
			allowHeaders.push(method);
		}

		this.allowHeader = allowHeaders.join(", ");
	}
}
