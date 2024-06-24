import type { INocturne as Nocturne } from "./nocturne";
import { RouteNotFound } from "./nocturne";
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

const PARAM_LABEL = ":";
const ANY_LABEL = "*";

export type IRouter<E extends Env> = {
	tree: INode<E>;
	routes: Record<string, Route>;
	n: Nocturne<E>;
};

type INode<E extends Env> = {
	methods: RouteMethods<E>;
	parent?: INode<E>;
	paramChild?: INode<E>;
	anyChild?: INode<E>;
	notFound?: IRouteMethod<E>;
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

interface IRouteMethod<E extends Env> {
	handler: Handler<E>;
	path: string;
	names: string[];
}

interface IRouteMethods<E extends Env> {
	connect?: IRouteMethod<E>;
	delete?: IRouteMethod<E>;
	get?: IRouteMethod<E>;
	head?: IRouteMethod<E>;
	options?: IRouteMethod<E>;
	patch?: IRouteMethod<E>;
	post?: IRouteMethod<E>;
	propfind?: IRouteMethod<E>;
	put?: IRouteMethod<E>;
	trace?: IRouteMethod<E>;
	report?: IRouteMethod<E>;
	anyOther: Record<string, IRouteMethod<E>>;
	allowHeader: string;
}

export class Node<E extends Env> implements INode<E> {
	methods: RouteMethods<E>;
	parent?: INode<E>;
	paramChild?: INode<E>;
	anyChild?: INode<E>;
	notFound?: IRouteMethod<E>;
	prefix?: string;
	originalPath: string;
	staticChildren: Children<E>;
	paramsCount: number;
	label: string;
	kind: number;
	isLeaf: boolean;
	isHandler: boolean;

	constructor(
		t: number,
		pre: string,
		p: INode<E> | undefined,
		sc: Children<E>,
		originalPath: string,
		methods: RouteMethods<E>,
		paramsCount: number,
		paramChildren: INode<E> | undefined,
		anyChildren: INode<E> | undefined,
		notFound: IRouteMethod<E> | undefined,
	) {
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
		this.isHandler = methods?.isHandler();
		this.notFound = notFound;
	}

	addStaticChild(c: INode<E>): void {
		this.staticChildren.push(c);
	}

	findStaticChild(label: string): INode<E> | undefined {
		for (const child of this.staticChildren) {
			if (child.label === label) {
				return child;
			}
		}

		return undefined;
	}

	findChildWithLabel(label: string): INode<E> | undefined {
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

	addMethod(method: string, h?: IRouteMethod<E>): void {
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
	}
}

export class RouteMethods<E extends Env> implements IRouteMethods<E> {
	connect?: IRouteMethod<E>;
	delete?: IRouteMethod<E>;
	get?: IRouteMethod<E>;
	head?: IRouteMethod<E>;
	options?: IRouteMethod<E>;
	patch?: IRouteMethod<E>;
	post?: IRouteMethod<E>;
	propfind?: IRouteMethod<E>;
	put?: IRouteMethod<E>;
	trace?: IRouteMethod<E>;
	report?: IRouteMethod<E>;
	anyOther: Record<string, IRouteMethod<E>>;
	allowHeader: string;

	constructor(anyOther: Record<string, IRouteMethod<E>> = {}) {
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
