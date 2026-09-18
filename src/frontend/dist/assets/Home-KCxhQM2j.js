import { j as jsxRuntimeExports, S as SecondaryButton, L as Link, C as Container, P as PrimaryButton, r as reactExports, u as useComposedRefs, R as React, c as cn, a as useActor, b as useQuery, d as createActor, e as useSiteContent } from "./index-nAhl1N96.js";
import { S as Section } from "./Section-CHXUaDCD.js";
import { A as ArrowRight } from "./arrow-right-icfR0l-3.js";
import { u as useControllableState, P as Primitive, a as useId, c as composeEventHandlers, b as createContextScope, d as useLayoutEffect2, e as createCollection, f as useDirection } from "./index-eq1rYzWb.js";
import { P as Presence } from "./index-DEJoxP4m.js";
import { C as ChevronDown } from "./chevron-down-HjXZtePm.js";
import { S as Skeleton } from "./skeleton-BTXYXnLQ.js";
import { i as isAbsoluteUrl, r as resolveSiteCopy } from "./siteCopy-yL4ekaS-.js";
import { u as useProducts, P as ProductCard } from "./useProducts-BE45W7cN.js";
import { P as PageMeta } from "./PageMeta-BLn8XJz2.js";
import "./format-CdAHKqJe.js";
function AboutPreview({ copy }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Section,
    {
      index: "04",
      label: "About Ovanite",
      "data-ocid": "home.about_section",
      className: "border-b border-border",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-10 md:grid-cols-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-balance font-display text-3xl font-bold tracking-tight md:text-4xl", children: copy.aboutTitle }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-7", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground", children: copy.aboutBody }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SecondaryButton, { asChild: true, size: "lg", className: "mt-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/about", "data-ocid": "home.about_link", children: [
            "More about Ovanite",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { "aria-hidden": "true", className: "h-4 w-4" })
          ] }) })
        ] })
      ] })
    }
  );
}
function ApproachSection({ copy }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Section,
    {
      index: "03",
      label: "Approach",
      muted: true,
      "data-ocid": "home.approach_section",
      className: "border-b border-border",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-10 md:grid-cols-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-balance font-display text-3xl font-bold tracking-tight md:text-4xl", children: copy.approachTitle }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-7", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground", children: copy.approachBody }) })
      ] })
    }
  );
}
function ContactCta() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "section",
    {
      "data-ocid": "home.contact_cta_section",
      className: "bg-ink text-ink-foreground",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Container, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-10 py-20 md:grid-cols-12 md:py-28", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-7", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-3 border-t border-ink-foreground/20 pt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-medium tracking-[0.22em] text-accent", children: "06" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-medium uppercase tracking-[0.22em] text-ink-foreground/60", children: "Get in touch" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-8 text-balance font-display text-3xl font-bold tracking-tight md:text-5xl", children: "Let’s build something that matters." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col justify-end md:col-span-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-md text-pretty text-lg leading-relaxed text-ink-foreground/70", children: "Tell us what you are working on, or join the waitlist to follow what we ship next." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-9 flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryButton, { asChild: true, size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/contact", "data-ocid": "home.contact_cta_button", children: [
              "Start a conversation",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { "aria-hidden": "true", className: "h-4 w-4" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              SecondaryButton,
              {
                asChild: true,
                size: "lg",
                className: "border-ink-foreground/25 bg-transparent text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/waitlist", "data-ocid": "home.waitlist_cta_button", children: "Join the waitlist" })
              }
            )
          ] })
        ] })
      ] }) })
    }
  );
}
var COLLAPSIBLE_NAME = "Collapsible";
var [createCollapsibleContext, createCollapsibleScope] = createContextScope(COLLAPSIBLE_NAME);
var [CollapsibleProvider, useCollapsibleContext] = createCollapsibleContext(COLLAPSIBLE_NAME);
var Collapsible = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeCollapsible,
      open: openProp,
      defaultOpen,
      disabled,
      onOpenChange,
      ...collapsibleProps
    } = props;
    const [open, setOpen] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen ?? false,
      onChange: onOpenChange,
      caller: COLLAPSIBLE_NAME
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      CollapsibleProvider,
      {
        scope: __scopeCollapsible,
        disabled,
        contentId: useId(),
        open,
        onOpenToggle: reactExports.useCallback(() => setOpen((prevOpen) => !prevOpen), [setOpen]),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.div,
          {
            "data-state": getState$1(open),
            "data-disabled": disabled ? "" : void 0,
            ...collapsibleProps,
            ref: forwardedRef
          }
        )
      }
    );
  }
);
Collapsible.displayName = COLLAPSIBLE_NAME;
var TRIGGER_NAME$1 = "CollapsibleTrigger";
var CollapsibleTrigger = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeCollapsible, ...triggerProps } = props;
    const context = useCollapsibleContext(TRIGGER_NAME$1, __scopeCollapsible);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.button,
      {
        type: "button",
        "aria-controls": context.contentId,
        "aria-expanded": context.open || false,
        "data-state": getState$1(context.open),
        "data-disabled": context.disabled ? "" : void 0,
        disabled: context.disabled,
        ...triggerProps,
        ref: forwardedRef,
        onClick: composeEventHandlers(props.onClick, context.onOpenToggle)
      }
    );
  }
);
CollapsibleTrigger.displayName = TRIGGER_NAME$1;
var CONTENT_NAME$1 = "CollapsibleContent";
var CollapsibleContent = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { forceMount, ...contentProps } = props;
    const context = useCollapsibleContext(CONTENT_NAME$1, props.__scopeCollapsible);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || context.open, children: ({ present }) => /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContentImpl, { ...contentProps, ref: forwardedRef, present }) });
  }
);
CollapsibleContent.displayName = CONTENT_NAME$1;
var CollapsibleContentImpl = reactExports.forwardRef((props, forwardedRef) => {
  const { __scopeCollapsible, present, children, ...contentProps } = props;
  const context = useCollapsibleContext(CONTENT_NAME$1, __scopeCollapsible);
  const [isPresent, setIsPresent] = reactExports.useState(present);
  const ref = reactExports.useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, ref);
  const heightRef = reactExports.useRef(0);
  const height = heightRef.current;
  const widthRef = reactExports.useRef(0);
  const width = widthRef.current;
  const isOpen = context.open || isPresent;
  const isMountAnimationPreventedRef = reactExports.useRef(isOpen);
  const originalStylesRef = reactExports.useRef(void 0);
  reactExports.useEffect(() => {
    const rAF = requestAnimationFrame(() => isMountAnimationPreventedRef.current = false);
    return () => cancelAnimationFrame(rAF);
  }, []);
  useLayoutEffect2(() => {
    const node = ref.current;
    if (node) {
      originalStylesRef.current = originalStylesRef.current || {
        transitionDuration: node.style.transitionDuration,
        animationName: node.style.animationName
      };
      node.style.transitionDuration = "0s";
      node.style.animationName = "none";
      const rect = node.getBoundingClientRect();
      heightRef.current = rect.height;
      widthRef.current = rect.width;
      if (!isMountAnimationPreventedRef.current) {
        node.style.transitionDuration = originalStylesRef.current.transitionDuration;
        node.style.animationName = originalStylesRef.current.animationName;
      }
      setIsPresent(present);
    }
  }, [context.open, present]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Primitive.div,
    {
      "data-state": getState$1(context.open),
      "data-disabled": context.disabled ? "" : void 0,
      id: context.contentId,
      hidden: !isOpen,
      ...contentProps,
      ref: composedRefs,
      style: {
        [`--radix-collapsible-content-height`]: height ? `${height}px` : void 0,
        [`--radix-collapsible-content-width`]: width ? `${width}px` : void 0,
        ...props.style
      },
      children: isOpen && children
    }
  );
});
function getState$1(open) {
  return open ? "open" : "closed";
}
var Root = Collapsible;
var Trigger = CollapsibleTrigger;
var Content = CollapsibleContent;
var ACCORDION_NAME = "Accordion";
var ACCORDION_KEYS = ["Home", "End", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"];
var [Collection, useCollection, createCollectionScope] = createCollection(ACCORDION_NAME);
var [createAccordionContext] = createContextScope(ACCORDION_NAME, [
  createCollectionScope,
  createCollapsibleScope
]);
var useCollapsibleScope = createCollapsibleScope();
var Accordion$1 = React.forwardRef(
  (props, forwardedRef) => {
    const { type, ...accordionProps } = props;
    const singleProps = accordionProps;
    const multipleProps = accordionProps;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.Provider, { scope: props.__scopeAccordion, children: type === "multiple" ? /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionImplMultiple, { ...multipleProps, ref: forwardedRef }) : /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionImplSingle, { ...singleProps, ref: forwardedRef }) });
  }
);
Accordion$1.displayName = ACCORDION_NAME;
var [AccordionValueProvider, useAccordionValueContext] = createAccordionContext(ACCORDION_NAME);
var [AccordionCollapsibleProvider, useAccordionCollapsibleContext] = createAccordionContext(
  ACCORDION_NAME,
  { collapsible: false }
);
var AccordionImplSingle = React.forwardRef(
  (props, forwardedRef) => {
    const {
      value: valueProp,
      defaultValue,
      onValueChange = () => {
      },
      collapsible = false,
      ...accordionSingleProps
    } = props;
    const [value, setValue] = useControllableState({
      prop: valueProp,
      defaultProp: defaultValue ?? "",
      onChange: onValueChange,
      caller: ACCORDION_NAME
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      AccordionValueProvider,
      {
        scope: props.__scopeAccordion,
        value: React.useMemo(() => value ? [value] : [], [value]),
        onItemOpen: setValue,
        onItemClose: React.useCallback(() => collapsible && setValue(""), [collapsible, setValue]),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionCollapsibleProvider, { scope: props.__scopeAccordion, collapsible, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionImpl, { ...accordionSingleProps, ref: forwardedRef }) })
      }
    );
  }
);
var AccordionImplMultiple = React.forwardRef((props, forwardedRef) => {
  const {
    value: valueProp,
    defaultValue,
    onValueChange = () => {
    },
    ...accordionMultipleProps
  } = props;
  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue ?? [],
    onChange: onValueChange,
    caller: ACCORDION_NAME
  });
  const handleItemOpen = React.useCallback(
    (itemValue) => setValue((prevValue = []) => [...prevValue, itemValue]),
    [setValue]
  );
  const handleItemClose = React.useCallback(
    (itemValue) => setValue((prevValue = []) => prevValue.filter((value2) => value2 !== itemValue)),
    [setValue]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    AccordionValueProvider,
    {
      scope: props.__scopeAccordion,
      value,
      onItemOpen: handleItemOpen,
      onItemClose: handleItemClose,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionCollapsibleProvider, { scope: props.__scopeAccordion, collapsible: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionImpl, { ...accordionMultipleProps, ref: forwardedRef }) })
    }
  );
});
var [AccordionImplProvider, useAccordionContext] = createAccordionContext(ACCORDION_NAME);
var AccordionImpl = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAccordion, disabled, dir, orientation = "vertical", ...accordionProps } = props;
    const accordionRef = React.useRef(null);
    const composedRefs = useComposedRefs(accordionRef, forwardedRef);
    const getItems = useCollection(__scopeAccordion);
    const direction = useDirection(dir);
    const isDirectionLTR = direction === "ltr";
    const handleKeyDown = composeEventHandlers(props.onKeyDown, (event) => {
      var _a;
      if (!ACCORDION_KEYS.includes(event.key)) return;
      const target = event.target;
      const triggerCollection = getItems().filter((item) => {
        var _a2;
        return !((_a2 = item.ref.current) == null ? void 0 : _a2.disabled);
      });
      const triggerIndex = triggerCollection.findIndex((item) => item.ref.current === target);
      const triggerCount = triggerCollection.length;
      if (triggerIndex === -1) return;
      event.preventDefault();
      let nextIndex = triggerIndex;
      const homeIndex = 0;
      const endIndex = triggerCount - 1;
      const moveNext = () => {
        nextIndex = triggerIndex + 1;
        if (nextIndex > endIndex) {
          nextIndex = homeIndex;
        }
      };
      const movePrev = () => {
        nextIndex = triggerIndex - 1;
        if (nextIndex < homeIndex) {
          nextIndex = endIndex;
        }
      };
      switch (event.key) {
        case "Home":
          nextIndex = homeIndex;
          break;
        case "End":
          nextIndex = endIndex;
          break;
        case "ArrowRight":
          if (orientation === "horizontal") {
            if (isDirectionLTR) {
              moveNext();
            } else {
              movePrev();
            }
          }
          break;
        case "ArrowDown":
          if (orientation === "vertical") {
            moveNext();
          }
          break;
        case "ArrowLeft":
          if (orientation === "horizontal") {
            if (isDirectionLTR) {
              movePrev();
            } else {
              moveNext();
            }
          }
          break;
        case "ArrowUp":
          if (orientation === "vertical") {
            movePrev();
          }
          break;
      }
      const clampedIndex = nextIndex % triggerCount;
      (_a = triggerCollection[clampedIndex].ref.current) == null ? void 0 : _a.focus();
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      AccordionImplProvider,
      {
        scope: __scopeAccordion,
        disabled,
        direction: dir,
        orientation,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.Slot, { scope: __scopeAccordion, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.div,
          {
            ...accordionProps,
            "data-orientation": orientation,
            ref: composedRefs,
            onKeyDown: disabled ? void 0 : handleKeyDown
          }
        ) })
      }
    );
  }
);
var ITEM_NAME = "AccordionItem";
var [AccordionItemProvider, useAccordionItemContext] = createAccordionContext(ITEM_NAME);
var AccordionItem$1 = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAccordion, value, ...accordionItemProps } = props;
    const accordionContext = useAccordionContext(ITEM_NAME, __scopeAccordion);
    const valueContext = useAccordionValueContext(ITEM_NAME, __scopeAccordion);
    const collapsibleScope = useCollapsibleScope(__scopeAccordion);
    const triggerId = useId();
    const open = value && valueContext.value.includes(value) || false;
    const disabled = accordionContext.disabled || props.disabled;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      AccordionItemProvider,
      {
        scope: __scopeAccordion,
        open,
        disabled,
        triggerId,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Root,
          {
            "data-orientation": accordionContext.orientation,
            "data-state": getState(open),
            ...collapsibleScope,
            ...accordionItemProps,
            ref: forwardedRef,
            disabled,
            open,
            onOpenChange: (open2) => {
              if (open2) {
                valueContext.onItemOpen(value);
              } else {
                valueContext.onItemClose(value);
              }
            }
          }
        )
      }
    );
  }
);
AccordionItem$1.displayName = ITEM_NAME;
var HEADER_NAME = "AccordionHeader";
var AccordionHeader = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAccordion, ...headerProps } = props;
    const accordionContext = useAccordionContext(ACCORDION_NAME, __scopeAccordion);
    const itemContext = useAccordionItemContext(HEADER_NAME, __scopeAccordion);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.h3,
      {
        "data-orientation": accordionContext.orientation,
        "data-state": getState(itemContext.open),
        "data-disabled": itemContext.disabled ? "" : void 0,
        ...headerProps,
        ref: forwardedRef
      }
    );
  }
);
AccordionHeader.displayName = HEADER_NAME;
var TRIGGER_NAME = "AccordionTrigger";
var AccordionTrigger$1 = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAccordion, ...triggerProps } = props;
    const accordionContext = useAccordionContext(ACCORDION_NAME, __scopeAccordion);
    const itemContext = useAccordionItemContext(TRIGGER_NAME, __scopeAccordion);
    const collapsibleContext = useAccordionCollapsibleContext(TRIGGER_NAME, __scopeAccordion);
    const collapsibleScope = useCollapsibleScope(__scopeAccordion);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.ItemSlot, { scope: __scopeAccordion, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Trigger,
      {
        "aria-disabled": itemContext.open && !collapsibleContext.collapsible || void 0,
        "data-orientation": accordionContext.orientation,
        id: itemContext.triggerId,
        ...collapsibleScope,
        ...triggerProps,
        ref: forwardedRef
      }
    ) });
  }
);
AccordionTrigger$1.displayName = TRIGGER_NAME;
var CONTENT_NAME = "AccordionContent";
var AccordionContent$1 = React.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAccordion, ...contentProps } = props;
    const accordionContext = useAccordionContext(ACCORDION_NAME, __scopeAccordion);
    const itemContext = useAccordionItemContext(CONTENT_NAME, __scopeAccordion);
    const collapsibleScope = useCollapsibleScope(__scopeAccordion);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Content,
      {
        role: "region",
        "aria-labelledby": itemContext.triggerId,
        "data-orientation": accordionContext.orientation,
        ...collapsibleScope,
        ...contentProps,
        ref: forwardedRef,
        style: {
          ["--radix-accordion-content-height"]: "var(--radix-collapsible-content-height)",
          ["--radix-accordion-content-width"]: "var(--radix-collapsible-content-width)",
          ...props.style
        }
      }
    );
  }
);
AccordionContent$1.displayName = CONTENT_NAME;
function getState(open) {
  return open ? "open" : "closed";
}
var Root2 = Accordion$1;
var Item = AccordionItem$1;
var Header = AccordionHeader;
var Trigger2 = AccordionTrigger$1;
var Content2 = AccordionContent$1;
function Accordion({
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Root2, { "data-slot": "accordion", ...props });
}
function AccordionItem({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Item,
    {
      "data-slot": "accordion-item",
      className: cn("border-b last:border-b-0", className),
      ...props
    }
  );
}
function AccordionTrigger({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Header, { className: "flex", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Trigger2,
    {
      "data-slot": "accordion-trigger",
      className: cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" })
      ]
    }
  ) });
}
function AccordionContent({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Content2,
    {
      "data-slot": "accordion-content",
      className: "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm",
      ...props,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("pt-0 pb-4", className), children })
    }
  );
}
const faqsQueryKey = ["faqs", "published"];
function useFaqs(limit = 12) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: [...faqsQueryKey, limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPublishedFaqs(BigInt(limit));
    },
    enabled: !!actor && !isFetching
  });
}
function buildFaqJsonLd(faqs) {
  var _a, _b;
  const mainEntity = [];
  for (const faq of faqs) {
    const question = (_a = faq.question) == null ? void 0 : _a.trim();
    const answer = (_b = faq.answer) == null ? void 0 : _b.trim();
    if (!question || !answer) continue;
    mainEntity.push({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer
      }
    });
  }
  if (mainEntity.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity
  };
}
const SKELETON_IDS$1 = Array.from({ length: 4 }, (_, i) => `faq-skeleton-${i}`);
const JSON_LD_ELEMENT_ID = "faq-jsonld";
function useFaqJsonLd(jsonLd) {
  const serialized = jsonLd ? JSON.stringify(jsonLd) : null;
  reactExports.useEffect(() => {
    if (!serialized) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = JSON_LD_ELEMENT_ID;
    script.setAttribute("data-ocid", "home.faq_jsonld");
    script.textContent = serialized;
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [serialized]);
}
function FaqSection() {
  const { data: faqs, isLoading, isError, refetch } = useFaqs(5);
  const visible = (faqs ?? []).slice(0, 5);
  const jsonLd = buildFaqJsonLd(visible);
  useFaqJsonLd(jsonLd);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Section,
    {
      index: "05",
      label: "FAQ",
      muted: true,
      "data-ocid": "home.faq_section",
      className: "border-b border-border",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-10 md:grid-cols-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-balance font-display text-3xl font-bold tracking-tight md:text-4xl", children: "Questions, answered." }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-8", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "data-ocid": "home.faq_loading_state",
            className: "space-y-4 border-t border-border pt-6",
            children: SKELETON_IDS$1.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 rounded-sm" }, id))
          }
        ) : isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "home.faq_error_state",
            className: "border border-border bg-card p-8",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "We couldn’t load the FAQ right now." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => void refetch(),
                  "data-ocid": "home.faq_retry_button",
                  className: "mt-4 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  children: "Try again"
                }
              )
            ]
          }
        ) : visible.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "data-ocid": "home.faq_empty_state",
            className: "border border-border bg-card p-8",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No questions published yet. Reach out and we’ll answer directly." })
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Accordion,
            {
              type: "single",
              collapsible: true,
              "data-ocid": "home.faq_accordion",
              className: "border-t border-border",
              children: visible.map((faq, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                AccordionItem,
                {
                  value: `faq-${faq.id}`,
                  "data-ocid": `home.faq.item.${i + 1}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionTrigger, { className: "py-5 font-display text-base font-semibold tracking-tight hover:no-underline md:text-lg", children: faq.question }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionContent, { className: "max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground", children: faq.answer })
                  ]
                },
                String(faq.id)
              ))
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sr-only", "data-ocid": "home.faq_crawlable_content", children: visible.map((faq, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { "data-ocid": `home.faq.crawlable_question.${i + 1}`, children: faq.question }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { "data-ocid": `home.faq.crawlable_answer.${i + 1}`, children: faq.answer })
          ] }, `crawlable-${String(faq.id)}`)) })
        ] }) })
      ] })
    }
  );
}
function Hero({ copy }) {
  const primaryExternal = isAbsoluteUrl(copy.primaryCtaHref);
  const secondaryExternal = isAbsoluteUrl(copy.secondaryCtaHref);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": "home.hero_section",
      className: "relative overflow-hidden border-b border-border",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "aria-hidden": "true",
            className: "pointer-events-none absolute inset-0 bg-dot-grid opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-3 border-t border-border pt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-medium tracking-[0.22em] text-primary", children: "00" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "eyebrow", children: "Software company" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-12 py-20 md:grid-cols-12 md:gap-10 md:py-28", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-7", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-balance font-display text-5xl font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl", children: copy.heroHeadline }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col justify-end md:col-span-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-md text-pretty text-lg leading-relaxed text-muted-foreground", children: copy.heroDescription }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-9 flex flex-wrap gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryButton, { asChild: true, size: "lg", children: primaryExternal ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "a",
                  {
                    href: copy.primaryCtaHref,
                    rel: "noreferrer",
                    target: "_blank",
                    "data-ocid": "home.primary_cta_button",
                    children: [
                      copy.primaryCtaLabel,
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { "aria-hidden": "true", className: "h-4 w-4" })
                    ]
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Link,
                  {
                    to: copy.primaryCtaHref,
                    "data-ocid": "home.primary_cta_button",
                    children: [
                      copy.primaryCtaLabel,
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { "aria-hidden": "true", className: "h-4 w-4" })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SecondaryButton, { asChild: true, size: "lg", children: secondaryExternal ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "a",
                  {
                    href: copy.secondaryCtaHref,
                    rel: "noreferrer",
                    target: "_blank",
                    "data-ocid": "home.secondary_cta_button",
                    children: copy.secondaryCtaLabel
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Link,
                  {
                    to: copy.secondaryCtaHref,
                    "data-ocid": "home.secondary_cta_button",
                    children: copy.secondaryCtaLabel
                  }
                ) })
              ] })
            ] })
          ] })
        ] })
      ]
    }
  );
}
function PhilosophySection({ copy }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Section,
    {
      index: "01",
      label: "Philosophy",
      "data-ocid": "home.philosophy_section",
      className: "border-b border-border",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-10 md:grid-cols-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-balance font-display text-3xl font-bold tracking-tight md:text-4xl", children: copy.philosophyTitle }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-7", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground", children: copy.philosophyBody }) })
      ] })
    }
  );
}
const SKELETON_IDS = Array.from(
  { length: 3 },
  (_, i) => `product-skeleton-${i}`
);
function ProductsPreview() {
  const { data: products, isLoading, isError, refetch } = useProducts();
  const visible = (products ?? []).slice(0, 3);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Section,
    {
      index: "02",
      label: "Products",
      "data-ocid": "home.products_section",
      className: "border-b border-border",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-10 flex flex-wrap items-end justify-between gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-balance font-display text-3xl font-bold tracking-tight md:text-4xl", children: "Products in development." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SecondaryButton, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/products", "data-ocid": "home.products_link", children: [
            "View all products",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { "aria-hidden": "true", className: "h-4 w-4" })
          ] }) })
        ] }),
        isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "data-ocid": "home.products_loading_state",
            className: "grid gap-6 md:grid-cols-3",
            children: SKELETON_IDS.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-64 rounded-sm" }, id))
          }
        ) : isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "home.products_error_state",
            className: "border border-border bg-card p-8",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "We couldn’t load our products right now." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SecondaryButton,
                {
                  type: "button",
                  className: "mt-4",
                  onClick: () => void refetch(),
                  "data-ocid": "home.products_retry_button",
                  children: "Try again"
                }
              )
            ]
          }
        ) : visible.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "home.products_empty_state",
            className: "border border-border bg-card p-10 md:p-14",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "eyebrow", children: "In development" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground", children: "We are building our first products now. Join the waitlist to hear when they launch." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SecondaryButton, { asChild: true, className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/waitlist", "data-ocid": "home.products_waitlist_link", children: "Join the waitlist" }) })
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 md:grid-cols-3", children: visible.map((product, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          ProductCard,
          {
            product,
            position: i + 1,
            total: visible.length
          },
          String(product.id)
        )) })
      ]
    }
  );
}
function Home() {
  const { data } = useSiteContent();
  const copy = resolveSiteCopy(data);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageMeta,
      {
        title: "Software, built to matter",
        description: "Ovanite is a software company building products designed to matter — precise, durable, and made for the long term."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Hero, { copy }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(PhilosophySection, { copy }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ProductsPreview, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ApproachSection, { copy }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AboutPreview, { copy }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FaqSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ContactCta, {})
  ] });
}
export {
  Home as default
};
