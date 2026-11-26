const pointerUtility = /(?:^|[:!])(?:cursor-pointer|cursor-\[pointer\]|\[cursor:pointer\])!?$/;
const classHelpers = new Set(["clsx", "cn", "twMerge", "tv", "createTV"]);

function isClassValue(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === "JSXAttribute") return parent.name.name === "className";
    if (parent.type === "CallExpression" && classHelpers.has(parent.callee.name)) return true;
    if (parent.type.endsWith("Statement")) return false;
  }
  return false;
}

const respectCursorPreference = {
  create(context) {
    function checkClasses(node, value) {
      if (value?.split(/\s+/).some((token) => pointerUtility.test(token)) && isClassValue(node)) {
        context.report({
          node,
          message: "Use the global cursor preference or the cursor-interactive utility.",
        });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === "string") checkClasses(node, node.value);
      },
      TemplateElement(node) {
        checkClasses(node, node.value.cooked);
      },
      Property(node) {
        const key = node.computed || node.key.type === "Literal" ? node.key.value : node.key.name;
        const value =
          node.value.type === "TemplateLiteral" && node.value.expressions.length === 0
            ? node.value.quasis[0].value.cooked
            : node.value.value;
        if (key === "cursor" && value === "pointer") {
          context.report({
            node,
            message: "Use cursor: var(--interactive-cursor) for interactive styles.",
          });
        }
      },
    };
  },
};

const requireTypography = {
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier" || !/^(h[1-6]|p)$/.test(node.name.name)) return;
        context.report({
          node: node.name,
          message: `Use Typography as="${node.name.name}" to preserve the element's semantics.`,
        });
      },
    };
  },
};

export default {
  meta: { name: "design-system" },
  rules: {
    "respect-cursor-preference": respectCursorPreference,
    "require-typography": requireTypography,
  },
};
