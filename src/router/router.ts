import type { Params, Result, Router } from "../router";
import { SupportedMethod } from "../types";

const MISSING = Symbol("missing sentinel");

export class LinearRouter<T> implements Router<T> {}
