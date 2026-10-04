/**
 * Living regression examples for the local ESLint rules in
 * eslint-local-rules.mjs.
 *
 * Every violation below is marked with an `eslint-disable-next-line`
 * comment naming the rule expected to fire on the following line --
 * `eslint.config.mjs` turns on `linterOptions.reportUnusedDisableDirectives:
 * "error"`, so a disable comment that doesn't actually suppress anything
 * (because a rule regressed and stopped catching the case it's meant to)
 * becomes a real lint error on its own. Cases with no disable comment are
 * expected to report nothing at all -- if one of those starts erroring,
 * that's a false positive to fix in the rule.
 *
 * In other words: `npx eslint eslint-local-rules.examples.tsx` passing
 * clean *is* the test. Never run `--fix` here expecting it to "clean up"
 * a violation -- a suppressed problem's fix never gets applied either, so
 * the bad example stays intact, but there's no reason to try.
 *
 * This file is never imported by the app; it exists purely to be linted
 * (and type-checked, since nothing excludes it from tsc). Every example is
 * exported so `@typescript-eslint/no-unused-vars` doesn't add noise
 * unrelated to what's actually being tested here.
 */
import { defineAnimation, defineKeyframes, defineStyle } from "@lib/css";
import { createState, For } from "ags";

type KeyedItem = { id: number; label: string };
type PlainItem = { name: string };

// --- local/require-for-id ---

export const ForWithAccessedId = () => {
  const [items] = createState<KeyedItem[]>([]);
  return (
    // eslint-disable-next-line local/require-for-id -- item.id is accessed in the body; expect the autofixable suggestion
    <For each={items}>{(item) => <label label={item.id.toString()} />}</For>
  );
};

export const ForWithDestructuredId = () => {
  const [items] = createState<KeyedItem[]>([]);
  return (
    // eslint-disable-next-line local/require-for-id -- a destructured `id` should be found too
    <For each={items}>
      {({ id, label }) => <label label={`${id}: ${label}`} />}
    </For>
  );
};

export const ForWithNoSuggestableProperty = () => {
  const [items] = createState<PlainItem[]>([]);
  return (
    // eslint-disable-next-line local/require-for-id -- only `.name` is accessed; no id/index/key to suggest, so no autofix
    <For each={items}>{(item) => <label label={item.name} />}</For>
  );
};

export const ForWithIdProp = () => {
  const [items] = createState<KeyedItem[]>([]);
  // valid -- an `id` prop is already present, expect no report
  return (
    <For each={items} id={(item) => item.id}>
      {(item) => <label label={item.label} />}
    </For>
  );
};

export const ForWithSpread = () => {
  const [items] = createState<KeyedItem[]>([]);
  // valid -- a spread might supply `id`, so the rule can't rule that out statically
  return (
    <For each={items} {...{ cleanup: () => {} }}>
      {(item) => <label label={item.label} />}
    </For>
  );
};

// --- local/require-define-scope ---
// (shared by defineStyle(), defineKeyframes(), and defineAnimation() --
// all three have the identical "exactly once, at module scope" contract.)

defineStyle({ class: "ExampleModuleScope", style: { opacity: 1 } }); // valid -- called at module scope

export const ExampleWrongScope = () => {
  // eslint-disable-next-line local/require-define-scope -- called inside an ordinary function, not a define* factory
  defineStyle({ class: "ExampleWrongScope", style: { opacity: 1 } });
};

const defineExampleWidget = () => {
  defineStyle({ class: "ExampleWidget", style: { opacity: 1 } }); // valid -- one function deep inside a module-scope define* factory
  return {};
};
export const exampleWidget = defineExampleWidget();

const defineNestedFactory = () => {
  const registerStyle = () => {
    // eslint-disable-next-line local/require-define-scope -- two functions deep inside the define* factory, not one
    defineStyle({ class: "ExampleNestedFactory", style: { opacity: 1 } });
  };
  return registerStyle;
};
export const nestedFactory = defineNestedFactory();

export const wrapDefineWidget = () => {
  const defineInnerWidget = () => {
    // eslint-disable-next-line local/require-define-scope -- the define* factory itself isn't at module scope
    defineStyle({ class: "ExampleInnerFactory", style: { opacity: 1 } });
  };
  return defineInnerWidget();
};

export const ExampleKeyframesWrongScope = () => {
  // eslint-disable-next-line local/require-define-scope -- defineKeyframes() shares the same module-scope contract
  defineKeyframes({
    name: "ExampleKeyframesWrongScope",
    from: { opacity: 0 },
    to: { opacity: 1 },
  });
};

export const ExampleAnimationWrongScope = () => {
  // eslint-disable-next-line local/require-define-scope -- defineAnimation() shares the same module-scope contract too
  defineAnimation({
    keyframes: { from: { opacity: 0 }, to: { opacity: 1 } },
    defaults: { duration: 300 },
  });
};

// --- local/require-transform-space-separator ---
// (the disable comment must sit directly above the `transform`/`transition`
// line itself -- these rules report on the value node, not the whole
// defineStyle() call, so `eslint-disable-next-line` only reaches that far.)

defineStyle({
  class: "ExampleCommaSeparatedTransform",
  style: {
    // eslint-disable-next-line local/require-transform-space-separator -- a comma between whole transform calls is invalid GTK CSS
    transform: "translateX(10px), scale(2)",
  },
});

defineStyle({
  class: "ExampleSpaceSeparatedTransform",
  style: {
    transform: "translateX(10px) scale(2)", // valid
  },
});

// --- local/require-valid-transform-units ---

defineStyle({
  class: "ExampleScaleWithUnit",
  style: {
    // eslint-disable-next-line local/require-valid-transform-units -- scale() must be a bare unitless number
    transform: "scale(50%)",
  },
});

defineStyle({
  class: "ExampleTranslateMissingUnit",
  style: {
    // eslint-disable-next-line local/require-valid-transform-units -- translateX() needs an explicit length unit
    transform: "translateX(10)",
  },
});

defineStyle({
  class: "ExampleTranslatePercent",
  style: {
    // eslint-disable-next-line local/require-valid-transform-units -- translateX() can't take a percentage in GTK CSS
    transform: "translateX(50%)",
  },
});

defineStyle({
  class: "ExampleValidTransformUnits",
  style: {
    transform: "translateX(10px) scale(2)", // valid
  },
});

// --- local/prefer-transition-helper ---

defineStyle({
  class: "ExampleRepeatedTransitionTiming",
  style: {
    // eslint-disable-next-line local/prefer-transition-helper -- every property here shares the same timing
    transition: "background 200ms ease-out, color 200ms ease-out",
  },
});

defineStyle({
  class: "ExampleIndependentTransitionTiming",
  style: {
    transition: "background 200ms ease-out, color 400ms linear", // valid -- different timings, nothing to compose
  },
});

defineStyle({
  class: "ExampleSingleTransition",
  style: {
    transition: "background 200ms ease-out", // valid -- one property, no repetition to flag
  },
});
