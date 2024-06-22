import type { EmptyEnv, Env } from "./types";

export class Nocturne<
	ServerEnv extends Env = EmptyEnv,
	BasePath extends string = "/",
> {
	constructor(
		public env: ServerEnv,
		public basePath: BasePath,
	) {}
}
