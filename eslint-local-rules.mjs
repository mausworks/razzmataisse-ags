/**
 * Project-specific ESLint rules, kept local rather than published -- see
 * eslint.config.mjs for how this gets wired in under the "local/" prefix.
 */

/** Priority order for the property-name heuristic below -- matches the
 * order given when this rule's autofix was requested. */
const ID_CANDIDATE_PROPERTIES = ["id", "index", "key"];

/**
 * Recursively finds every `paramName.prop` (non-computed) member access
 * inside `node`, where `prop` is one of `candidates`, and returns the
 * first candidate found in priority order (or null). Plain object-tree
 * walk rather than a second ESLint visitor pass, since it only ever runs
 * on the small subtree of one already-found <For> render callback.
 */
const findAccessedProperty = (node, paramName, candidates) => {
  const found = new Set();

  const visit = (current) => {
    if (!current || typeof current !== "object") return;

    if (
      current.type === "MemberExpression" &&
      !current.computed &&
      current.object.type === "Identifier" &&
      current.object.name === paramName &&
      current.property.type === "Identifier"
    ) {
      found.add(current.property.name);
    }

    for (const key in current) {
      // `parent` back-references would turn this into an infinite loop.
      if (key === "parent") continue;

      const value = current[key];
      if (Array.isArray(value)) {
        for (const child of value) visit(child);
      } else if (value && typeof value.type === "string") {
        visit(value);
      }
    }
  };

  visit(node);

  return candidates.find((name) => found.has(name)) ?? null;
};

/** A destructured render-callback param's top-level property names, e.g.
 * `{ id, isFocused }` or `{ id: workspaceId }` -> ["id"] either way (the
 * source property name, not whatever it's locally renamed/bound to). */
const destructuredProperties = (pattern) =>
  pattern.properties
    .filter((prop) => prop.type === "Property" && !prop.computed)
    .map((prop) => (prop.key.type === "Identifier" ? prop.key.name : null))
    .filter((name) => name !== null);

/** Finds the <For> render callback -- either nested JSX children
 * (`<For each={x}>{(item) => ...}</For>`, this codebase's convention) or a
 * `children` prop -- and returns it, or null if there isn't exactly one. */
const getRenderCallback = (openingElement) => {
  const childrenProp = openingElement.attributes.find(
    (attr) =>
      attr.type === "JSXAttribute" &&
      attr.name.type === "JSXIdentifier" &&
      attr.name.name === "children",
  );
  if (childrenProp?.value?.type === "JSXExpressionContainer") {
    return isFunctionExpr(childrenProp.value.expression)
      ? childrenProp.value.expression
      : null;
  }

  const jsxElement = openingElement.parent;
  if (jsxElement?.type !== "JSXElement") return null;

  const callbacks = jsxElement.children
    .filter((child) => child.type === "JSXExpressionContainer")
    .map((child) => child.expression)
    .filter(isFunctionExpr);

  return callbacks.length === 1 ? callbacks[0] : null;
};

const isFunctionExpr = (node) =>
  node?.type === "ArrowFunctionExpression" ||
  node?.type === "FunctionExpression";

/**
 * Mirrors React's `react/jsx-key`, but for gnim's `<For>` instead of
 * `Array.prototype.map`.
 *
 * `<For>` (see node_modules/gnim/dist/jsx/For.ts) keys items "by value in
 * case of primitive values, reference otherwise" when no `id` prop is
 * given. For object items, that means every recompute of `each` that
 * produces fresh object references -- e.g. a `.as()` transform that
 * rebuilds its array from scratch every run, as opposed to mutating a
 * cached one -- looks like "every old item removed, every new item added"
 * to `<For>`, even though nothing conceptually changed. It tears down and
 * reconstructs every child instead of reusing and updating it, which
 * silently breaks CSS transitions (a freshly-created widget has no prior
 * value to transition from) and any other state a widget was holding.
 *
 * The base check is the same shallow AST-only one `react/jsx-key` itself
 * does (no type information, so it can't tell whether `each` actually
 * yields objects -- an `id` on a `<For>` over primitives is harmless, just
 * unnecessary). The autofix is a heuristic on top of that, also AST-only
 * (no type information): it looks at how the render callback's own
 * parameter is used --
 *   - destructured (`{ id, ... }` or `{ id: renamed, ... }`) -- checks the
 *     destructured property names directly, or
 *   - a plain identifier (`ws`) -- scans the callback body for a
 *     non-computed `ws.prop` access --
 * for `id`, `index`, or `key`, in that priority order, and if it finds
 * one, adds `id={(item) => item.prop}` (or the destructured equivalent).
 * If it can't confidently find a candidate (including: the render
 * callback isn't in a shape this can analyze at all, e.g. more than one
 * JSX-expression child, or a destructured/defaulted parameter this
 * doesn't special-case), it reports without a fix rather than guess --
 * there's no automatically-correct choice when nothing points to one.
 */
const requireForId = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require an `id` prop on <For> so items are keyed by a stable value instead of by object reference.",
    },
    fixable: "code",
    schema: [],
    messages: {
      missingId:
        "<For> has no `id` prop. Without one, object items are keyed by " +
        "reference, so a `each` that rebuilds fresh objects every run " +
        "(e.g. most .as() transforms) makes <For> tear down and recreate " +
        "every child instead of reusing it -- silently breaking CSS " +
        "transitions and any per-widget state. Add id={(item) => item.someStableKey}.",
      missingIdNoSuggestion:
        "<For> has no `id` prop, and no id/index/key-shaped property was " +
        "found on its render callback's item to suggest one from. Without " +
        "one, object items are keyed by reference, so a `each` that " +
        "rebuilds fresh objects every run makes <For> tear down and " +
        "recreate every child instead of reusing it. Add " +
        "id={(item) => item.someStableKey}.",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "For") {
          return;
        }

        const hasId = node.attributes.some(
          (attr) =>
            attr.type === "JSXAttribute" &&
            attr.name.type === "JSXIdentifier" &&
            attr.name.name === "id",
        );

        // `<For {...props}>` might supply `id` through the spread -- can't
        // rule that out statically, so don't flag it.
        const hasSpread = node.attributes.some(
          (attr) => attr.type === "JSXSpreadAttribute",
        );

        if (hasId || hasSpread) return;

        const callback = getRenderCallback(node);
        const param = callback?.params[0];

        let idExpression = null;
        if (param?.type === "Identifier") {
          const prop = findAccessedProperty(
            callback.body,
            param.name,
            ID_CANDIDATE_PROPERTIES,
          );
          if (prop) idExpression = `(${param.name}) => ${param.name}.${prop}`;
        } else if (param?.type === "ObjectPattern") {
          const prop = ID_CANDIDATE_PROPERTIES.find((name) =>
            destructuredProperties(param).includes(name),
          );
          if (prop) idExpression = `({ ${prop} }) => ${prop}`;
        }

        if (!idExpression) {
          context.report({ node, messageId: "missingIdNoSuggestion" });
          return;
        }

        context.report({
          node,
          messageId: "missingId",
          fix: (fixer) => {
            const lastAttr = node.attributes[node.attributes.length - 1];
            return fixer.insertTextAfter(
              lastAttr ?? node.name,
              ` id={${idExpression}}`,
            );
          },
        });
      },
    };
  },
};

/**
 * `defineStyle()`'s own doc comment states the contract: "Must be called
 * exactly once per class name, at module scope -- calling it from inside a
 * render function re-registers (and throws) on every run." Right now
 * that's only enforced by a runtime throw the *second* time the enclosing
 * component re-renders -- this catches the mistake at lint time instead.
 *
 * One addition on top of "module scope only": a `defineStyle()` call is
 * also allowed one function deep, if that function is itself declared at
 * module scope and its name matches `/^define[A-Z]/` -- the
 * `defineBarMeter`-style pattern (see ui/BarMeter.tsx) of a factory that
 * builds a family of related classes (and often a component) together.
 * That factory function still only *runs* once, at module-evaluation time
 * (its call site is itself typically a module-scope `const X = defineY(...)`),
 * so the same "exactly once" contract holds -- it's just spread across
 * more than one class.
 */
const requireDefineStyleScope = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Restrict defineStyle() to module scope (or one function deep, inside a module-scope define* factory).",
    },
    schema: [],
    messages: {
      wrongScope:
        "defineStyle() must be called at module scope, or one function " +
        "deep inside a module-scope factory function named define* (e.g. " +
        "defineBarMeter) -- calling it anywhere else (a component body, a " +
        "nested closure, a non-module-scope function) re-registers the " +
        "same CSS class on every call and throws after the first.",
    },
  },
  create(context) {
    const isFunction = (node) =>
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression";

    const getEnclosingFunction = (node) => {
      for (let current = node.parent; current; current = current.parent) {
        if (isFunction(current)) return current;
      }
      return null;
    };

    const getFunctionName = (fn) => {
      if (fn.type === "FunctionDeclaration") return fn.id?.name ?? null;

      // `const name = function () {}` / `const name = () => {}`
      if (
        fn.parent?.type === "VariableDeclarator" &&
        fn.parent.id.type === "Identifier"
      ) {
        return fn.parent.id.name;
      }

      return null;
    };

    return {
      CallExpression(node) {
        if (
          node.callee.type !== "Identifier" ||
          node.callee.name !== "defineStyle"
        ) {
          return;
        }

        const enclosingFn = getEnclosingFunction(node);
        if (!enclosingFn) return; // called at module scope -- OK

        const isNestedFurther = getEnclosingFunction(enclosingFn) !== null;
        const name = getFunctionName(enclosingFn);

        if (!isNestedFurther && name && /^define[A-Z]/.test(name)) {
          return; // one function deep, inside a module-scope define* factory -- OK
        }

        context.report({ node, messageId: "wrongScope" });
      },
    };
  },
};

// --- shared helpers for the transform-value rules below ---

/** A complete `name(args)` transform function call. */
const TRANSFORM_FUNCTION_RE = /^([a-zA-Z][\w-]*)\((.*)\)$/s;

const SCALE_FUNCTIONS = new Set([
  "scale",
  "scaleX",
  "scaleY",
  "scaleZ",
  "scale3d",
]);
const TRANSLATE_FUNCTIONS = new Set([
  "translate",
  "translateX",
  "translateY",
  "translateZ",
  "translate3d",
]);

const NUMBER_RE = /^-?\d*\.?\d+$/;
const NUMBER_WITH_UNIT_RE = /^(-?\d*\.?\d+)([a-zA-Z%]+)$/;

/**
 * Splits `text` on every top-level occurrence of `separator` -- ones not
 * nested inside a function call's own parens, e.g. splitting
 * "translateX(10px), scale(2)" on "," gives two parts, but splitting
 * "scale(1, 2)" on "," gives one (that comma is inside scale()'s own
 * parens). Same algorithm as lib/css/index.ts's splitSelectorList,
 * reimplemented here since this is a plain .mjs file with no access to
 * the project's TS source.
 */
const splitTopLevel = (text, separator) => {
  const parts = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "(") depth++;
    else if (char === ")") depth--;
    else if (char === separator && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));

  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
};

/**
 * Splits a whole `transform` value into its individual function calls,
 * tolerating either a space or a comma between them (whichever was
 * actually used -- that mistake is a different rule's job) while still
 * respecting paren depth, so `scale(1, 2)`'s own comma-separated arguments
 * survive intact as one call.
 */
const splitFunctionCalls = (text) => {
  const calls = [];
  let depth = 0;
  let current = "";

  for (const char of text) {
    if (char === "(") depth++;
    if (char === ")") depth--;

    if (depth === 0 && (char === "," || /\s/.test(char))) {
      if (current.trim()) calls.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) calls.push(current.trim());

  return calls;
};

/**
 * Reads a string or no-substitution template literal node's static text,
 * plus a `render` function that re-wraps a new value in the same
 * quote/backtick style for an autofix. Returns null for anything else
 * (a template literal with interpolation can't be statically checked).
 */
const getStaticString = (node) => {
  if (node.type === "Literal" && typeof node.value === "string") {
    const quote = node.raw[0];
    return { value: node.value, render: (value) => `${quote}${value}${quote}` };
  }

  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return {
      value: node.quasis[0].value.cooked,
      render: (value) => `\`${value}\``,
    };
  }

  return null;
};

const getKeyName = (key) => {
  if (key.type === "Identifier") return key.name;
  if (key.type === "Literal" && typeof key.value === "string") return key.value;
  return null;
};

/**
 * Inserts an `import { ...names } from source` if any of `names` isn't
 * already imported from `source` -- adding specifiers to an existing
 * import from the same source instead of a whole new statement, if there
 * is one. All of `names` are resolved together against one another (rather
 * than each calling this independently), so a fix that needs more than one
 * new name produces a single merged import instead of one statement per
 * name. Returns null if every name in `names` is already imported.
 */
const ensureNamedImports = (context, fixer, names, source) => {
  const sourceCode = context.sourceCode ?? context.getSourceCode();
  const body = sourceCode.ast.body;

  const sameSource = body.filter(
    (node) => node.type === "ImportDeclaration" && node.source.value === source,
  );

  const alreadyImported = new Set();
  for (const decl of sameSource) {
    for (const specifier of decl.specifiers) {
      if (specifier.type === "ImportSpecifier") {
        alreadyImported.add(specifier.imported.name);
      }
    }
  }

  const missing = names.filter((name) => !alreadyImported.has(name));
  if (missing.length === 0) return null;

  const [firstWithSpecifiers] = sameSource.filter(
    (decl) => decl.specifiers.length > 0,
  );
  if (firstWithSpecifiers) {
    const last =
      firstWithSpecifiers.specifiers[firstWithSpecifiers.specifiers.length - 1];
    return fixer.insertTextAfter(last, `, ${missing.join(", ")}`);
  }

  return fixer.insertTextBefore(
    body[0],
    `import { ${missing.join(", ")} } from "${source}";\n`,
  );
};

/**
 * Every GTK transform function this project has a builder for in
 * @lib/css/transform -- kept in sync with that file's exports by hand
 * (there's no cheap way for a plain .mjs lint rule to import the real TS
 * source and introspect it).
 */
const TRANSFORM_HELPER_NAMES = new Set([
  "translateX",
  "translateY",
  "translateZ",
  "translate",
  "translate3d",
  "scale",
  "scaleX",
  "scaleY",
  "scaleZ",
  "scale3d",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
  "rotate3d",
  "skew",
  "skewX",
  "skewY",
  "perspective",
  "matrix",
]);

const ROTATE_FUNCTIONS = new Set(["rotate", "rotateX", "rotateY", "rotateZ"]);
const SKEW_FUNCTIONS = new Set(["skew", "skewX", "skewY"]);

/**
 * Converts one already-valid `name(args)` transform-function-call string
 * into the equivalent @lib/css/transform helper call, e.g.
 * "translateX(10px)" -> "translateX(10)", "scale(2)" -> "scale(2)",
 * "rotate(45deg)" -> 'rotate("45deg")'. Returns null if `name` has no
 * helper, or if an argument's shape isn't something the helper could
 * reproduce (e.g. a translate*()/perspective() length that isn't already in
 * px, since the helper always emits px, or a scale*()/matrix() argument
 * that isn't a bare number).
 */
const toHelperCall = (part) => {
  const match = TRANSFORM_FUNCTION_RE.exec(part);
  if (!match) return null;

  const [, name, argsText] = match;
  if (!TRANSFORM_HELPER_NAMES.has(name)) return null;

  const args = splitTopLevel(argsText, ",");

  if (TRANSLATE_FUNCTIONS.has(name) || name === "perspective") {
    const numbers = args.map(
      (arg) => /^(-?\d*\.?\d+)px$/.exec(arg)?.[1] ?? null,
    );
    if (numbers.some((n) => n === null)) return null;
    return `${name}(${numbers.join(", ")})`;
  }

  if (SCALE_FUNCTIONS.has(name) || name === "matrix") {
    if (!args.every((arg) => NUMBER_RE.test(arg))) return null;
    return `${name}(${args.join(", ")})`;
  }

  if (ROTATE_FUNCTIONS.has(name) && args.length === 1) {
    return `${name}(${JSON.stringify(args[0])})`;
  }

  if (SKEW_FUNCTIONS.has(name) && args.length >= 1) {
    return `${name}(${args.map((arg) => JSON.stringify(arg)).join(", ")})`;
  }

  if (name === "rotate3d" && args.length === 4) {
    const vector = args.slice(0, 3);
    if (!vector.every((arg) => NUMBER_RE.test(arg))) return null;
    return `rotate3d(${vector.join(", ")}, ${JSON.stringify(args[3])})`;
  }

  return null;
};

/**
 * Attempts to rewrite a whole sequence of transform-function-call strings
 * into a single `transforms(...)` call built from real @lib/css/transform
 * helpers -- one converted call per part, via `toHelperCall`. Returns null
 * (meaning: fall back to fixing the raw CSS string instead) if any part
 * can't be converted.
 */
const buildTransformsCall = (parts) => {
  const calls = parts.map(toHelperCall);
  if (calls.some((call) => call === null)) return null;

  const helperNames = new Set(
    calls.map((call) => call.slice(0, call.indexOf("("))),
  );
  return { call: `transforms(${calls.join(", ")})`, helperNames };
};

/** Applies the fixes needed to rewrite a `transform:` value into a
 * `transforms(...)` call: replacing the value, plus importing `transforms`
 * and every helper function it used from @lib/css/transform. */
const applyTransformsCallFix = (context, fixer, node, helperResult) => {
  const fixes = [fixer.replaceText(node, helperResult.call)];

  const importFix = ensureNamedImports(
    context,
    fixer,
    ["transforms", ...helperResult.helperNames],
    "@lib/css/transform",
  );
  if (importFix) fixes.push(importFix);

  return fixes;
};

/**
 * Sequential transform functions are only valid space-separated in GTK CSS
 * -- `transform: translateX(10px), scale(2);` fails to parse at all
 * ("Junk at end of value for transform"), unlike some other multi-value
 * CSS properties (e.g. `transition`) where a comma is correct. Easy typo
 * to make coming from web CSS, where this would also be wrong, but silently
 * so (multiple comma-separated transforms there just apply the last one).
 */
const requireTransformSpaceSeparator = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Sequential transform functions must be space-separated, not comma-separated -- GTK CSS rejects a comma between them.",
    },
    fixable: "code",
    schema: [],
    messages: {
      commaSeparated:
        'Sequential transform functions must be space-separated: GTK CSS rejects "{{value}}" outright ' +
        '(parsing error: "Junk at end of value for transform"). Consider composing them with the ' +
        "transforms() helper from @lib/css/transform instead of a hand-written string.",
    },
  },
  create(context) {
    return {
      Property(node) {
        if (getKeyName(node.key) !== "transform") return;

        const str = getStaticString(node.value);
        if (!str) return;

        const parts = splitTopLevel(str.value, ",");
        if (parts.length < 2) return;

        // Only the "multiple whole function calls joined by commas"
        // shape is this mistake -- if a part isn't itself a complete
        // `name(...)` call, the comma more likely belongs to a single
        // function's own argument list that a malformed/unbalanced
        // string caused to split unexpectedly. Leave that alone.
        if (!parts.every((part) => TRANSFORM_FUNCTION_RE.test(part))) return;

        const helperResult = buildTransformsCall(parts);

        context.report({
          node: node.value,
          messageId: "commaSeparated",
          data: { value: str.value },
          fix: (fixer) =>
            helperResult
              ? applyTransformsCallFix(context, fixer, node.value, helperResult)
              : fixer.replaceText(node.value, str.render(parts.join(" "))),
        });
      },
    };
  },
};

/**
 * GTK CSS's transform functions are pickier about units than web CSS:
 * `scale()` must be a bare unitless number (a `%`, `px`, or any other unit
 * fails with "Percentages are not allowed here" or similar), while
 * `translate*()` requires an explicit length unit -- a bare number fails
 * with "Unit is missing" -- and, unlike web CSS, doesn't accept `%` at all
 * ("Percentages are not allowed here"). All empirically confirmed against
 * a real Gtk.CssProvider; see the session history for the exact test.
 */
const requireValidTransformUnits = {
  meta: {
    type: "problem",
    docs: {
      description:
        "scale() must be unitless and translate*() needs a non-percentage length unit -- GTK CSS rejects both the other way around.",
    },
    fixable: "code",
    schema: [],
    messages: {
      scaleHasUnit:
        'scale()\'s argument must be a bare unitless number: GTK CSS rejects "{{arg}}" (e.g. ' +
        '"Percentages are not allowed here" for %). Consider the scale()/scaleX()/scaleY()/scaleZ()/' +
        "scale3d() helpers from @lib/css/transform instead of a hand-written string.",
      translateMissingUnit:
        'translate*() needs an explicit length unit: GTK CSS rejects the bare number "{{arg}}" ' +
        '("Unit is missing"). Consider the translateX()/translateY()/translateZ()/translate()/' +
        "translate3d() helpers from @lib/css/transform, which always emit px.",
      translatePercent:
        'translate*() can\'t use "%" in GTK CSS ("Percentages are not allowed here"), unlike web CSS -- use an absolute length instead.',
    },
  },
  create(context) {
    return {
      Property(node) {
        if (getKeyName(node.key) !== "transform") return;

        const str = getStaticString(node.value);
        if (!str) return;

        const calls = splitFunctionCalls(str.value);
        if (calls.length === 0) return;

        const issues = [];

        const fixedCalls = calls.map((call) => {
          const match = TRANSFORM_FUNCTION_RE.exec(call);
          if (!match) return call;

          const [, name, argsText] = match;
          const args = splitTopLevel(argsText, ",");

          const fixedArgs = args.map((arg) => {
            if (SCALE_FUNCTIONS.has(name)) {
              const withUnit = NUMBER_WITH_UNIT_RE.exec(arg);
              if (withUnit) {
                issues.push({ messageId: "scaleHasUnit", arg, fixable: true });
                return withUnit[1];
              }
            } else if (TRANSLATE_FUNCTIONS.has(name)) {
              if (NUMBER_RE.test(arg)) {
                issues.push({
                  messageId: "translateMissingUnit",
                  arg,
                  fixable: true,
                });
                return `${arg}px`;
              }

              const withUnit = NUMBER_WITH_UNIT_RE.exec(arg);
              if (withUnit && withUnit[2] === "%") {
                issues.push({
                  messageId: "translatePercent",
                  arg,
                  fixable: false,
                });
              }
            }

            return arg;
          });

          return `${name}(${fixedArgs.join(", ")})`;
        });

        if (issues.length === 0) return;

        const helperResult = buildTransformsCall(fixedCalls);
        const fixedValue = str.render(fixedCalls.join(" "));

        for (const issue of issues) {
          context.report({
            node: node.value,
            messageId: issue.messageId,
            data: { arg: issue.arg },
            fix: issue.fixable
              ? (fixer) =>
                  helperResult
                    ? applyTransformsCallFix(
                        context,
                        fixer,
                        node.value,
                        helperResult,
                      )
                    : fixer.replaceText(node.value, fixedValue)
              : undefined,
          });
        }
      },
    };
  },
};

/**
 * A *soft* companion to the two transform rules above -- unlike those,
 * there's no GTK parse error backing this one. `transition: prop1 dur,
 * prop2 dur` is genuinely correct GTK CSS syntax; writing out the same
 * timing per property by hand is just repetition, not a mistake, so this
 * only nudges (warn, not error) toward the transitions() helper -- and only
 * when every comma-separated property actually shares one timing, which is
 * the one shape the helper (currently) knows how to compose.
 */
const preferTransitionHelper = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer the transitions() helper over a hand-written multi-property transition string that repeats the same timing.",
    },
    fixable: "code",
    schema: [],
    messages: {
      preferHelper:
        'Every property here shares the same timing ("{{timing}}") -- consider ' +
        "{{example}} from @lib/css/transition instead of repeating it by hand.",
    },
  },
  create(context) {
    return {
      Property(node) {
        if (getKeyName(node.key) !== "transition") return;

        const str = getStaticString(node.value);
        if (!str) return;

        const parts = splitTopLevel(str.value, ",");
        if (parts.length < 2) return;

        const parsed = parts.map((part) => {
          const [property, ...rest] = part.split(/\s+/);
          return { property, timing: rest.join(" ") };
        });

        if (parsed.some(({ property, timing }) => !property || !timing)) {
          return;
        }

        const timing = parsed[0].timing;
        if (!parsed.every((p) => p.timing === timing)) return;

        const entries = parsed
          .map(
            (p) => `[${JSON.stringify(p.property)}, ${JSON.stringify(timing)}]`,
          )
          .join(", ");
        const call = `transitions(${entries})`;

        context.report({
          node: node.value,
          messageId: "preferHelper",
          data: { timing, example: call },
          fix(fixer) {
            const fixes = [fixer.replaceText(node.value, call)];

            const importFix = ensureNamedImports(
              context,
              fixer,
              ["transitions"],
              "@lib/css/transition",
            );
            if (importFix) fixes.push(importFix);

            return fixes;
          },
        });
      },
    };
  },
};

export default {
  rules: {
    "require-for-id": requireForId,
    "require-definestyle-scope": requireDefineStyleScope,
    "require-transform-space-separator": requireTransformSpaceSeparator,
    "require-valid-transform-units": requireValidTransformUnits,
    "prefer-transition-helper": preferTransitionHelper,
  },
};
