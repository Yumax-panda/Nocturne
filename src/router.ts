import type { INocturne as Nocturne } from "./nocturne";
import type { Route } from "./types";
import type { Env, Handler } from "./types";

export type Router<E extends Env> = {
	tree: Node<E>;
	routes: Record<string, Route>;
	srv: Nocturne<E>;
};

type Node<E extends Env> = {
	methods: RouteMethods<E>;
	parent: Node<E> | null;
	paramChild: Node<E> | null;
	anyChild: Node<E> | null;
	notFound: RouteMethods<E> | null;
	prefix: string;
	originalPath: string;
	isLeaf: boolean;
};

interface RouteMethod<E extends Env> {
	handler: Handler<E>;
	path: string;
	names: string[];
}

interface RouteMethods<E extends Env> {
	connect: RouteMethod<E>;
	delete: RouteMethod<E>;
	get: RouteMethod<E>;
	head: RouteMethod<E>;
	options: RouteMethod<E>;
	patch: RouteMethod<E>;
	post: RouteMethod<E>;
	put: RouteMethod<E>;
	trace: RouteMethod<E>;
	allowHeader: string;
}
