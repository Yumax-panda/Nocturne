import type { Nocturne } from "./nocturne";
import { Route, RouteNotFound } from "./nocturne";
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

enum Kind {
	Static = 0,
	Param = 1,
	Any = 2,
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

	get routes(): Route[] {
		return Object.values(this._routes);
	}

	/**
	 * ルートの名前に基づいてURIを生成する.
	 * 例えば, ルートが`/users/:id`である場合, `reverse("users", 1)`は`/users/1`を返す.
	 * @param name ルートの名前
	 * @param params 文字列に変換可能なパラメータ
	 * @returns 生成したURI
	 */
	reverse(name: string, ...params: { toString: () => string }[]): string {
		const route = this.routes.find((r) => r.name === name);

		if (!route) {
			return "";
		}

		let path = "";
		const segments = route.path.split("/");
		const currentIdx = 0;
		const paramsCount = params.length;

		for (const segment of segments) {
			if (segment[0] === ANY_LABEL) return path;

			if (segment[0] === PARAM_LABEL) {
				if (currentIdx < paramsCount) {
					path += `/${params[currentIdx].toString()}`;
				}
				continue;
			}

			path += `/${segment}`;
		}

		return path;
	}

	add(
		method: SupportedMethod,
		path: string,
		name: string,
		handler: Handler<E>,
	): Route {
		const normalized = normalizePathSlash(path);
		this.insert(method, normalized, handler);

		const route = new Route({ method, path: normalized, name });
		const identifier = `${method}${normalized}`;
		this._routes[identifier] = route;
		return route;
	}

	private insertNode(
		method: SupportedMethod,
		path: string,
		t: Kind,
		rm: RouteMethod<E>,
	): void {
		const paramsLen = rm.paramNames.length;

		if (this.n.maxParam < paramsLen) {
			this.n.maxParam = paramsLen;
		}

		let currentNode = this.tree;
		let search = path;

		while (true) {
			const searchLen = search.length;
			const prefixLen = currentNode.prefix.length;
			let lcpLen = 0;

			let max = prefixLen;

			if (searchLen < max) {
				max = searchLen;
			}

			while (
				lcpLen < searchLen &&
				lcpLen < prefixLen &&
				search[lcpLen] === currentNode.prefix[lcpLen]
			) {
				lcpLen++;
			}

			if (lcpLen === 0) {
				currentNode.label = search[0];
				currentNode.prefix = search;

				if (rm.handler) {
					currentNode.kind = t;
					currentNode.addMethod(method, rm);
					currentNode.paramsCount = rm.paramNames.length;
					currentNode.originalPath = rm.pristinePath;
				}
				const isLeaf =
					currentNode.staticChildren.length === 0 &&
					!currentNode.paramChild &&
					!currentNode.anyChild;

				currentNode.isLeaf = isLeaf;
			} else if (lcpLen < prefixLen) {
				const newNode = new Node<E>({
					t: currentNode.kind,
					pre: currentNode.prefix.slice(lcpLen),
					p: currentNode,
					sc: currentNode.staticChildren,
					originalPath: currentNode.originalPath,
					methods: currentNode.methods,
					paramsCount: currentNode.paramsCount,
					paramChildren: currentNode.paramChild,
					anyChildren: currentNode.anyChild,
					notFound: currentNode.notFound,
				});

				for (const child of currentNode.staticChildren) {
					child.parent = newNode;
				}

				if (currentNode.paramChild) {
					currentNode.paramChild.parent = newNode;
				}

				if (currentNode.anyChild) {
					currentNode.anyChild.parent = newNode;
				}

				currentNode.kind = Kind.Static;
				currentNode.label = currentNode.prefix[0];
				currentNode.prefix = currentNode.prefix.slice(0, lcpLen);
				currentNode.staticChildren = [];
				currentNode.originalPath = "";
				currentNode.methods = new RouteMethods<E>({});
				currentNode.paramsCount = 0;
				currentNode.paramChild = undefined;
				currentNode.anyChild = undefined;
				currentNode.isLeaf = false;
				currentNode.isHandler = false;
				currentNode.notFound = undefined;

				currentNode.addStaticChild(newNode);

				if (lcpLen === searchLen) {
					currentNode.kind = t;
					if (rm.handler) {
						currentNode.addMethod(method, rm);
						currentNode.paramsCount = rm.paramNames.length;
						currentNode.originalPath = rm.pristinePath;
					}
				} else {
					const newNode = new Node<E>({
						t: t,
						pre: search.slice(lcpLen),
						p: currentNode,
						sc: [],
						originalPath: "",
						methods: new RouteMethods<E>({}),
						paramsCount: 0,
						paramChildren: undefined,
						anyChildren: undefined,
						notFound: undefined,
					});

					if (rm.handler) {
						newNode.addMethod(method, rm);
						newNode.paramsCount = rm.paramNames.length;
						newNode.originalPath = rm.pristinePath;
					}

					currentNode.addStaticChild(newNode);
				}
				const isLeaf =
					currentNode.staticChildren.length === 0 &&
					!currentNode.paramChild &&
					!currentNode.anyChild;
				currentNode.isLeaf = isLeaf;
			} else if (lcpLen < searchLen) {
				search = search.slice(lcpLen);
				const child = currentNode.findStaticChild(search[0]);

				if (child) {
					currentNode = child;
					continue;
				}

				const newNode = new Node<E>({
					t,
					pre: search,
					p: currentNode,
					sc: [],
					originalPath: rm.pristinePath,
					methods: new RouteMethods<E>({}),
					paramsCount: 0,
					paramChildren: undefined,
					anyChildren: undefined,
					notFound: undefined,
				});

				if (rm.handler) {
					newNode.addMethod(method, rm);
					newNode.paramsCount = rm.paramNames.length;
				}

				if (t === Kind.Static) {
					currentNode.addStaticChild(newNode);
				} else if (t === Kind.Param) {
					currentNode.paramChild = newNode;
				} else {
					currentNode.anyChild = newNode;
				}

				const isLeaf =
					currentNode.staticChildren.length === 0 &&
					!currentNode.paramChild &&
					!currentNode.anyChild;

				currentNode.isLeaf = isLeaf;
			} else {
				if (rm.handler) {
					currentNode.addMethod(method, rm);
					currentNode.paramsCount = rm.paramNames.length;
					currentNode.originalPath = rm.pristinePath;
				}
			}
			return;
		}
	}
	// TODO
	insert(method: SupportedMethod, path: string, handler: Handler<E>): void {
		const normalized = normalizePathSlash(path);
		const segments = normalized.split("/");
		let current = this.tree;
		let paramsCount = 0;

		for (const segment of segments) {
			if (segment === "") continue;

			const node = current.findChildWithLabel(segment);

			if (node) {
				current = node;
				continue;
			}

			const newNode = new Node<E>({
				t: segment[0] === PARAM_LABEL ? 1 : 0,
				pre: segment,
				p: current,
				sc: [],
				originalPath: normalized,
				methods: new RouteMethods<E>({}),
				paramsCount,
			});

			if (segment[0] === PARAM_LABEL) {
				current.paramChild = newNode;
				paramsCount++;
			} else if (segment[0] === ANY_LABEL) {
				current.anyChild = newNode;
			} else {
				current.addStaticChild(newNode);
			}

			current = newNode;
		}

		const routeMethod = new RouteMethod<E>({
			handler,
			pristinePath: normalized,
		});
		current.addMethod(method, routeMethod);
	}
}

const normalizePathSlash = (path: string): string => {
	if (!path.startsWith("/")) return `/${path}`;

	return path;
};

type Children<E extends Env> = Node<E>[];

export class RouteMethod<E extends Env> {
	handler?: Handler<E>;
	pristinePath: string;
	paramNames: string[];

	constructor({
		handler,
		pristinePath = "",
		paramNames = [],
	}: {
		handler?: Handler<E>;
		pristinePath?: string;
		paramNames?: string[];
	}) {
		this.handler = handler;
		this.pristinePath = pristinePath;
		this.paramNames = paramNames;
	}
}

export class Node<E extends Env> {
	methods: RouteMethods<E>;
	parent?: Node<E>;
	paramChild?: Node<E>;
	anyChild?: Node<E>;
	notFound?: RouteMethod<E>;
	prefix: string;
	originalPath: string;
	staticChildren: Children<E>;
	paramsCount: number;
	label: string;
	kind: Kind;
	isLeaf: boolean;
	isHandler: boolean;

	constructor({
		t = Kind.Static,
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
		t?: Kind;
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
