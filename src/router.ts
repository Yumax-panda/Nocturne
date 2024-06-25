import type { Nocturne } from "./nocturne";
import { type Route, RouteNotFound } from "./nocturne";
import type { Env, Handler, SupportedMethod } from "./types";

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

const PARAM_LABEL = ":";
const ANY_LABEL = "*";

export class RouteMethods<E extends Env> {
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

	constructor({
		anyOther = {},
	}: { anyOther?: Record<string, RouteMethod<E>> }) {
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

export class Router<E extends Env> {
	tree: Node<E>;
	private _routes: Record<string, Route>;
	n: Nocturne<E>;

	constructor({ n }: { n: Nocturne<E> }) {
		this.n = n;
		this.tree = new Node<E>({ methods: new RouteMethods<E>({}) });
		this._routes = {};
	}

	routes(): Route[] {
		return Object.values(this._routes);
	}
}

type Children<E extends Env> = Node<E>[];

export class RouteMethod<E extends Env> {
	handler: Handler<E>;
	path: string;
	names: string[];

	constructor({
		handler,
		path = "",
		names = [],
	}: {
		handler: Handler<E>;
		path?: string;
		names?: string[];
	}) {
		this.handler = handler;
		this.path = path;
		this.names = names;
	}
}

export class Node<E extends Env> {
	methods: RouteMethods<E>;
	parent?: Node<E>;
	paramChild?: Node<E>;
	anyChild?: Node<E>;
	notFound?: RouteMethod<E>;
	prefix?: string;
	originalPath: string;
	staticChildren: Children<E>;
	paramsCount: number;
	label: string;
	kind: number;
	isLeaf: boolean;
	isHandler: boolean;

	constructor({
		t = 0,
		pre = "",
		p = undefined,
		sc = [],
		originalPath = "",
		methods,
		paramsCount = 0,
		paramChildren = undefined,
		anyChildren = undefined,
		notFound = undefined,
	}: {
		t?: number;
		pre?: string;
		p?: Node<E> | undefined;
		sc?: Children<E>;
		originalPath?: string;
		methods: RouteMethods<E>;
		paramsCount?: number;
		paramChildren?: Node<E> | undefined;
		anyChildren?: Node<E> | undefined;
		notFound?: RouteMethod<E> | undefined;
	}) {
		this.kind = t;
		this.label = pre[0];
		this.prefix = pre;
		this.parent = p;
		this.staticChildren = sc;
		this.originalPath = originalPath;
		this.methods = methods;
		this.paramsCount = paramsCount;
		this.paramChild = paramChildren;
		this.anyChild = anyChildren;
		this.isLeaf = sc.length === 0 && !paramChildren && !anyChildren;
		this.isHandler = methods.isHandler();
		this.notFound = notFound;
	}

	addStaticChild(c: Node<E>): void {
		this.staticChildren.push(c);
	}

	findStaticChild(label: string): Node<E> | undefined {
		for (const child of this.staticChildren) {
			if (child.label === label) {
				return child;
			}
		}

		return undefined;
	}

	findChildWithLabel(label: string): Node<E> | undefined {
		const c = this.findStaticChild(label);

		if (c) return c;

		if (label === PARAM_LABEL) {
			return this.paramChild;
		}

		if (label === ANY_LABEL) {
			return this.anyChild;
		}

		return undefined;
	}

	addMethod(method: string, h?: RouteMethod<E>): void {
		switch (method) {
			case AllowHeader.CONNECT:
				this.methods.connect = h;
				break;
			case "DELETE":
				this.methods.delete = h;
				break;
			case AllowHeader.GET:
				this.methods.get = h;
				break;
			case AllowHeader.HEAD:
				this.methods.head = h;
				break;
			case AllowHeader.OPTIONS:
				this.methods.options = h;
				break;
			case AllowHeader.PATCH:
				this.methods.patch = h;
				break;
			case AllowHeader.POST:
				this.methods.post = h;
				break;
			case AllowHeader.PROPFIND:
				this.methods.propfind = h;
				break;
			case AllowHeader.PUT:
				this.methods.put = h;
				break;
			case AllowHeader.TRACE:
				this.methods.trace = h;
				break;
			case AllowHeader.REPORT:
				this.methods.report = h;
				break;
			case RouteNotFound:
				this.notFound = h;
				break;
			default:
				if (!h) {
					delete this.methods.anyOther[method];
					return;
				}

				this.methods.anyOther[method] = h;
		}

		this.methods.updateAllowHeader();
		this.isHandler = true;
	}

	findMethod(method: SupportedMethod): RouteMethod<E> | undefined {
		switch (method) {
			case AllowHeader.CONNECT:
				return this.methods.connect;
			case "DELETE":
				return this.methods.delete;
			case AllowHeader.GET:
				return this.methods.get;
			case AllowHeader.HEAD:
				return this.methods.head;
			case AllowHeader.OPTIONS:
				return this.methods.options;
			case AllowHeader.PATCH:
				return this.methods.patch;
			case AllowHeader.POST:
				return this.methods.post;
			case AllowHeader.PROPFIND:
				return this.methods.propfind;
			case AllowHeader.PUT:
				return this.methods.put;
			case AllowHeader.TRACE:
				return this.methods.trace;
			case AllowHeader.REPORT:
				return this.methods.report;
			default:
				return this.methods.anyOther[method];
		}
	}
}

const normalizePathSlash = (path: string): string => {
	if (!path.startsWith("/")) return `/${path}`;

	return path;
};
