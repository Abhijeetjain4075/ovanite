import { f as createLucideIcon, j as jsxRuntimeExports, s as LoaderCircle, S as SecondaryButton, o as SubmissionStatus, M as MicroBadge, g as StatusDot, c as cn, P as PrimaryButton, B as Button, r as reactExports, u as useComposedRefs, C as Container, w as SubmissionKind } from "./index-nAhl1N96.js";
import { f as formatDateTime } from "./format-CdAHKqJe.js";
import { M as Mail } from "./mail-C5X0p1tP.js";
import { C as Check, R as RefreshCw, u as useCallbackRef } from "./index-BbcBv9K7.js";
import { T as Trash2 } from "./trash-2-7l5MbcQX.js";
import { S as Skeleton } from "./skeleton-BTXYXnLQ.js";
import { P as PageMeta } from "./PageMeta-BLn8XJz2.js";
import { a as useId, P as Primitive, c as composeEventHandlers, b as createContextScope, e as createCollection, f as useDirection, u as useControllableState } from "./index-eq1rYzWb.js";
import { P as Presence } from "./index-DEJoxP4m.js";
import { u as useAdminSubmissions, a as useSetSubmissionStatus, b as useDeleteSubmission } from "./useAdminSubmissions-CMn0QApc.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12", key: "o97t9d" }],
  [
    "path",
    {
      d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
      key: "oot6mr"
    }
  ]
];
const Inbox = createLucideIcon("inbox", __iconNode);
const STATUS_LABEL$1 = {
  [SubmissionStatus.new_]: "New",
  [SubmissionStatus.read]: "Read",
  [SubmissionStatus.handled]: "Handled"
};
function kindLabel$1(kind) {
  return kind === "waitlist" ? "Waitlist" : "Contact";
}
function Field({ label, value }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border py-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "eyebrow", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "mt-2 break-words text-sm text-foreground", children: value })
  ] });
}
function SubmissionDetail({
  submission,
  isLoading,
  isError,
  onRetry,
  onMarkRead,
  onMarkHandled,
  onDelete,
  isUpdating,
  isDeleting,
  actionError
}) {
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "admin.submission_detail.loading_state",
        className: "flex h-full min-h-[320px] items-center justify-center gap-3 rounded-sm border border-border bg-card text-muted-foreground",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { "aria-hidden": "true", className: "h-5 w-5 animate-spin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Loading submission…" })
        ]
      }
    );
  }
  if (isError) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "admin.submission_detail.error_state",
        className: "rounded-sm border border-destructive/30 bg-destructive/5 p-8 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-base font-semibold", children: "Could not load this submission" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "It may have been removed, or the connection dropped." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SecondaryButton,
            {
              type: "button",
              className: "mt-4",
              "data-ocid": "admin.submission_detail.retry_button",
              onClick: onRetry,
              children: "Retry"
            }
          )
        ]
      }
    );
  }
  if (!submission) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "admin.submission_detail.empty_state",
        className: "flex h-full min-h-[320px] flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/30 px-6 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Inbox, { "aria-hidden": "true", className: "h-6 w-6 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 font-display text-base font-semibold", children: "Select a submission" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-xs text-sm text-muted-foreground", children: "Choose an entry from the inbox to read the full message and update its status." })
        ]
      }
    );
  }
  const isUnread = submission.status === SubmissionStatus.new_;
  const isHandled = submission.status === SubmissionStatus.handled;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "article",
    {
      "data-ocid": "admin.submission_detail.panel",
      className: "rounded-sm border border-border bg-card",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "border-b border-border p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MicroBadge, { children: kindLabel$1(submission.kind) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "span",
              {
                className: cn(
                  "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.14em]",
                  isUnread ? "border-primary/40 text-primary" : "border-border text-muted-foreground"
                ),
                children: [
                  isUnread ? /* @__PURE__ */ jsxRuntimeExports.jsx(StatusDot, {}) : null,
                  STATUS_LABEL$1[submission.status]
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 font-display text-2xl font-bold tracking-tight", children: submission.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 flex items-center gap-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { "aria-hidden": "true", className: "h-4 w-4 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "a",
              {
                href: `mailto:${submission.email}`,
                className: "break-all underline-offset-4 hover:text-foreground hover:underline",
                children: submission.email
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Message", value: submission.message ?? "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Field,
              {
                label: "Received",
                value: formatDateTime(submission.createdAt)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Field,
              {
                label: "Last updated",
                value: formatDateTime(submission.updatedAt)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Reference", value: `#${submission.id.toString()}` })
          ] }),
          actionError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "admin.submission_detail.error_state",
              role: "alert",
              className: "mt-4 rounded-sm border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive",
              children: actionError
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              PrimaryButton,
              {
                type: "button",
                "data-ocid": "admin.submission_detail.mark_read_button",
                onClick: onMarkRead,
                disabled: isUpdating || !isUnread,
                children: [
                  isUpdating ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    LoaderCircle,
                    {
                      "aria-hidden": "true",
                      className: "mr-2 h-4 w-4 animate-spin"
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { "aria-hidden": "true", className: "mr-2 h-4 w-4" }),
                  "Mark as read"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              SecondaryButton,
              {
                type: "button",
                "data-ocid": "admin.submission_detail.mark_handled_button",
                onClick: onMarkHandled,
                disabled: isUpdating || isHandled,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { "aria-hidden": "true", className: "mr-2 h-4 w-4" }),
                  "Mark as handled"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              SecondaryButton,
              {
                type: "button",
                className: "ml-auto border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive",
                "data-ocid": "admin.submission_detail.delete_button",
                onClick: onDelete,
                disabled: isDeleting,
                children: [
                  isDeleting ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    LoaderCircle,
                    {
                      "aria-hidden": "true",
                      className: "mr-2 h-4 w-4 animate-spin"
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { "aria-hidden": "true", className: "mr-2 h-4 w-4" }),
                  "Delete"
                ]
              }
            )
          ] })
        ] })
      ]
    }
  );
}
const STATUS_LABEL = {
  [SubmissionStatus.new_]: "New",
  [SubmissionStatus.read]: "Read",
  [SubmissionStatus.handled]: "Handled"
};
function statusTone(status) {
  if (status === SubmissionStatus.new_) return "border-primary/40 text-primary";
  if (status === SubmissionStatus.handled) return "border-border text-muted-foreground";
  return "border-border text-foreground";
}
function kindLabel(kind) {
  return kind === "waitlist" ? "Waitlist" : "Contact";
}
function SubmissionList({
  submissions,
  selectedId,
  onSelect,
  isLoading,
  isError,
  onRetry
}) {
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        "data-ocid": "admin.submissions.loading_state",
        className: "space-y-2",
        "aria-busy": "true",
        children: Array.from({ length: 5 }, (_, i) => `submission-skeleton-${i}`).map(
          (id) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "rounded-sm border border-border bg-card p-4",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-20" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "mt-3 h-4 w-40" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "mt-2 h-3 w-28" })
              ]
            },
            id
          )
        )
      }
    );
  }
  if (isError) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "admin.submissions.error_state",
        className: "rounded-sm border border-destructive/30 bg-destructive/5 p-6 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-base font-semibold", children: "Could not load submissions" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The inbox is unavailable right now. Check your connection and try again." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            SecondaryButton,
            {
              type: "button",
              className: "mt-4",
              "data-ocid": "admin.submissions.retry_button",
              onClick: onRetry,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { "aria-hidden": "true", className: "mr-2 h-4 w-4" }),
                "Retry"
              ]
            }
          )
        ]
      }
    );
  }
  if (submissions.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "admin.submissions.empty_state",
        className: "rounded-sm border border-dashed border-border bg-muted/30 px-6 py-14 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Inbox,
            {
              "aria-hidden": "true",
              className: "mx-auto h-6 w-6 text-muted-foreground"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 font-display text-base font-semibold", children: "No submissions here" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-2 max-w-xs text-sm text-muted-foreground", children: "Nothing matches the current filter. Try a different kind or status." })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "ul",
    {
      "data-ocid": "admin.submissions.list",
      className: "space-y-2",
      "aria-label": "Submissions",
      children: submissions.map((submission, index) => {
        const isSelected = selectedId === submission.id;
        const isUnread = submission.status === SubmissionStatus.new_;
        return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            "data-ocid": `admin.submissions.item.${index + 1}`,
            "aria-current": isSelected ? "true" : void 0,
            onClick: () => onSelect(submission.id),
            className: cn(
              "w-full rounded-sm border bg-card p-4 text-left transition-smooth",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isSelected ? "border-primary/50 shadow-subtle" : "border-border hover:border-primary/30 hover:shadow-subtle"
            ),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                  isUnread ? /* @__PURE__ */ jsxRuntimeExports.jsx(StatusDot, {}) : null,
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MicroBadge, { children: kindLabel(submission.kind) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: cn(
                      "rounded-sm border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.14em]",
                      statusTone(submission.status)
                    ),
                    children: STATUS_LABEL[submission.status]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "p",
                {
                  className: cn(
                    "mt-3 truncate font-display text-sm",
                    isUnread ? "font-semibold" : "font-medium"
                  ),
                  children: submission.name
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { "aria-hidden": "true", className: "h-3 w-3 shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: submission.email })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 font-mono text-[0.6875rem] text-muted-foreground", children: formatDateTime(submission.createdAt) })
            ]
          }
        ) }, submission.id.toString());
      })
    }
  );
}
function SubmissionListFooter({
  count,
  onRefresh,
  isRefreshing
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between border-t border-border pt-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground", children: [
      count,
      " ",
      count === 1 ? "entry" : "entries"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        type: "button",
        variant: "ghost",
        size: "sm",
        className: "rounded-sm",
        "data-ocid": "admin.submissions.refresh_button",
        onClick: onRefresh,
        disabled: isRefreshing,
        children: [
          isRefreshing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            LoaderCircle,
            {
              "aria-hidden": "true",
              className: "mr-2 h-3.5 w-3.5 animate-spin"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { "aria-hidden": "true", className: "mr-2 h-3.5 w-3.5" }),
          "Refresh"
        ]
      }
    )
  ] });
}
var ENTRY_FOCUS = "rovingFocusGroup.onEntryFocus";
var EVENT_OPTIONS = { bubbles: false, cancelable: true };
var GROUP_NAME = "RovingFocusGroup";
var [Collection, useCollection, createCollectionScope] = createCollection(GROUP_NAME);
var [createRovingFocusGroupContext, createRovingFocusGroupScope] = createContextScope(
  GROUP_NAME,
  [createCollectionScope]
);
var [RovingFocusProvider, useRovingFocusContext] = createRovingFocusGroupContext(GROUP_NAME);
var RovingFocusGroup = reactExports.forwardRef(
  (props, forwardedRef) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.Provider, { scope: props.__scopeRovingFocusGroup, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.Slot, { scope: props.__scopeRovingFocusGroup, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RovingFocusGroupImpl, { ...props, ref: forwardedRef }) }) });
  }
);
RovingFocusGroup.displayName = GROUP_NAME;
var RovingFocusGroupImpl = reactExports.forwardRef((props, forwardedRef) => {
  const {
    __scopeRovingFocusGroup,
    orientation,
    loop = false,
    dir,
    currentTabStopId: currentTabStopIdProp,
    defaultCurrentTabStopId,
    onCurrentTabStopIdChange,
    onEntryFocus,
    preventScrollOnEntryFocus = false,
    ...groupProps
  } = props;
  const ref = reactExports.useRef(null);
  const composedRefs = useComposedRefs(forwardedRef, ref);
  const direction = useDirection(dir);
  const [currentTabStopId, setCurrentTabStopId] = useControllableState({
    prop: currentTabStopIdProp,
    defaultProp: defaultCurrentTabStopId ?? null,
    onChange: onCurrentTabStopIdChange,
    caller: GROUP_NAME
  });
  const [isTabbingBackOut, setIsTabbingBackOut] = reactExports.useState(false);
  const handleEntryFocus = useCallbackRef(onEntryFocus);
  const getItems = useCollection(__scopeRovingFocusGroup);
  const isClickFocusRef = reactExports.useRef(false);
  const [focusableItemsCount, setFocusableItemsCount] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const node = ref.current;
    if (node) {
      node.addEventListener(ENTRY_FOCUS, handleEntryFocus);
      return () => node.removeEventListener(ENTRY_FOCUS, handleEntryFocus);
    }
  }, [handleEntryFocus]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    RovingFocusProvider,
    {
      scope: __scopeRovingFocusGroup,
      orientation,
      dir: direction,
      loop,
      currentTabStopId,
      onItemFocus: reactExports.useCallback(
        (tabStopId) => setCurrentTabStopId(tabStopId),
        [setCurrentTabStopId]
      ),
      onItemShiftTab: reactExports.useCallback(() => setIsTabbingBackOut(true), []),
      onFocusableItemAdd: reactExports.useCallback(
        () => setFocusableItemsCount((prevCount) => prevCount + 1),
        []
      ),
      onFocusableItemRemove: reactExports.useCallback(
        () => setFocusableItemsCount((prevCount) => prevCount - 1),
        []
      ),
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Primitive.div,
        {
          tabIndex: isTabbingBackOut || focusableItemsCount === 0 ? -1 : 0,
          "data-orientation": orientation,
          ...groupProps,
          ref: composedRefs,
          style: { outline: "none", ...props.style },
          onMouseDown: composeEventHandlers(props.onMouseDown, () => {
            isClickFocusRef.current = true;
          }),
          onFocus: composeEventHandlers(props.onFocus, (event) => {
            const isKeyboardFocus = !isClickFocusRef.current;
            if (event.target === event.currentTarget && isKeyboardFocus && !isTabbingBackOut) {
              const entryFocusEvent = new CustomEvent(ENTRY_FOCUS, EVENT_OPTIONS);
              event.currentTarget.dispatchEvent(entryFocusEvent);
              if (!entryFocusEvent.defaultPrevented) {
                const items = getItems().filter((item) => item.focusable);
                const activeItem = items.find((item) => item.active);
                const currentItem = items.find((item) => item.id === currentTabStopId);
                const candidateItems = [activeItem, currentItem, ...items].filter(
                  Boolean
                );
                const candidateNodes = candidateItems.map((item) => item.ref.current);
                focusFirst(candidateNodes, preventScrollOnEntryFocus);
              }
            }
            isClickFocusRef.current = false;
          }),
          onBlur: composeEventHandlers(props.onBlur, () => setIsTabbingBackOut(false))
        }
      )
    }
  );
});
var ITEM_NAME = "RovingFocusGroupItem";
var RovingFocusGroupItem = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeRovingFocusGroup,
      focusable = true,
      active = false,
      tabStopId,
      children,
      ...itemProps
    } = props;
    const autoId = useId();
    const id = tabStopId || autoId;
    const context = useRovingFocusContext(ITEM_NAME, __scopeRovingFocusGroup);
    const isCurrentTabStop = context.currentTabStopId === id;
    const getItems = useCollection(__scopeRovingFocusGroup);
    const { onFocusableItemAdd, onFocusableItemRemove, currentTabStopId } = context;
    reactExports.useEffect(() => {
      if (focusable) {
        onFocusableItemAdd();
        return () => onFocusableItemRemove();
      }
    }, [focusable, onFocusableItemAdd, onFocusableItemRemove]);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Collection.ItemSlot,
      {
        scope: __scopeRovingFocusGroup,
        id,
        focusable,
        active,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.span,
          {
            tabIndex: isCurrentTabStop ? 0 : -1,
            "data-orientation": context.orientation,
            ...itemProps,
            ref: forwardedRef,
            onMouseDown: composeEventHandlers(props.onMouseDown, (event) => {
              if (!focusable) event.preventDefault();
              else context.onItemFocus(id);
            }),
            onFocus: composeEventHandlers(props.onFocus, () => context.onItemFocus(id)),
            onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
              if (event.key === "Tab" && event.shiftKey) {
                context.onItemShiftTab();
                return;
              }
              if (event.target !== event.currentTarget) return;
              const focusIntent = getFocusIntent(event, context.orientation, context.dir);
              if (focusIntent !== void 0) {
                if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
                event.preventDefault();
                const items = getItems().filter((item) => item.focusable);
                let candidateNodes = items.map((item) => item.ref.current);
                if (focusIntent === "last") candidateNodes.reverse();
                else if (focusIntent === "prev" || focusIntent === "next") {
                  if (focusIntent === "prev") candidateNodes.reverse();
                  const currentIndex = candidateNodes.indexOf(event.currentTarget);
                  candidateNodes = context.loop ? wrapArray(candidateNodes, currentIndex + 1) : candidateNodes.slice(currentIndex + 1);
                }
                setTimeout(() => focusFirst(candidateNodes));
              }
            }),
            children: typeof children === "function" ? children({ isCurrentTabStop, hasTabStop: currentTabStopId != null }) : children
          }
        )
      }
    );
  }
);
RovingFocusGroupItem.displayName = ITEM_NAME;
var MAP_KEY_TO_FOCUS_INTENT = {
  ArrowLeft: "prev",
  ArrowUp: "prev",
  ArrowRight: "next",
  ArrowDown: "next",
  PageUp: "first",
  Home: "first",
  PageDown: "last",
  End: "last"
};
function getDirectionAwareKey(key, dir) {
  if (dir !== "rtl") return key;
  return key === "ArrowLeft" ? "ArrowRight" : key === "ArrowRight" ? "ArrowLeft" : key;
}
function getFocusIntent(event, orientation, dir) {
  const key = getDirectionAwareKey(event.key, dir);
  if (orientation === "vertical" && ["ArrowLeft", "ArrowRight"].includes(key)) return void 0;
  if (orientation === "horizontal" && ["ArrowUp", "ArrowDown"].includes(key)) return void 0;
  return MAP_KEY_TO_FOCUS_INTENT[key];
}
function focusFirst(candidates, preventScroll = false) {
  const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
  for (const candidate of candidates) {
    if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
    candidate.focus({ preventScroll });
    if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
  }
}
function wrapArray(array, startIndex) {
  return array.map((_, index) => array[(startIndex + index) % array.length]);
}
var Root = RovingFocusGroup;
var Item = RovingFocusGroupItem;
var TABS_NAME = "Tabs";
var [createTabsContext] = createContextScope(TABS_NAME, [
  createRovingFocusGroupScope
]);
var useRovingFocusGroupScope = createRovingFocusGroupScope();
var [TabsProvider, useTabsContext] = createTabsContext(TABS_NAME);
var Tabs$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeTabs,
      value: valueProp,
      onValueChange,
      defaultValue,
      orientation = "horizontal",
      dir,
      activationMode = "automatic",
      ...tabsProps
    } = props;
    const direction = useDirection(dir);
    const [value, setValue] = useControllableState({
      prop: valueProp,
      onChange: onValueChange,
      defaultProp: defaultValue ?? "",
      caller: TABS_NAME
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      TabsProvider,
      {
        scope: __scopeTabs,
        baseId: useId(),
        value,
        onValueChange: setValue,
        orientation,
        dir: direction,
        activationMode,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.div,
          {
            dir: direction,
            "data-orientation": orientation,
            ...tabsProps,
            ref: forwardedRef
          }
        )
      }
    );
  }
);
Tabs$1.displayName = TABS_NAME;
var TAB_LIST_NAME = "TabsList";
var TabsList$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeTabs, loop = true, ...listProps } = props;
    const context = useTabsContext(TAB_LIST_NAME, __scopeTabs);
    const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeTabs);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Root,
      {
        asChild: true,
        ...rovingFocusGroupScope,
        orientation: context.orientation,
        dir: context.dir,
        loop,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.div,
          {
            role: "tablist",
            "aria-orientation": context.orientation,
            ...listProps,
            ref: forwardedRef
          }
        )
      }
    );
  }
);
TabsList$1.displayName = TAB_LIST_NAME;
var TRIGGER_NAME = "TabsTrigger";
var TabsTrigger$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeTabs, value, disabled = false, ...triggerProps } = props;
    const context = useTabsContext(TRIGGER_NAME, __scopeTabs);
    const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeTabs);
    const triggerId = makeTriggerId(context.baseId, value);
    const contentId = makeContentId(context.baseId, value);
    const isSelected = value === context.value;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Item,
      {
        asChild: true,
        ...rovingFocusGroupScope,
        focusable: !disabled,
        active: isSelected,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Primitive.button,
          {
            type: "button",
            role: "tab",
            "aria-selected": isSelected,
            "aria-controls": contentId,
            "data-state": isSelected ? "active" : "inactive",
            "data-disabled": disabled ? "" : void 0,
            disabled,
            id: triggerId,
            ...triggerProps,
            ref: forwardedRef,
            onMouseDown: composeEventHandlers(props.onMouseDown, (event) => {
              if (!disabled && event.button === 0 && event.ctrlKey === false) {
                context.onValueChange(value);
              } else {
                event.preventDefault();
              }
            }),
            onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
              if ([" ", "Enter"].includes(event.key)) context.onValueChange(value);
            }),
            onFocus: composeEventHandlers(props.onFocus, () => {
              const isAutomaticActivation = context.activationMode !== "manual";
              if (!isSelected && !disabled && isAutomaticActivation) {
                context.onValueChange(value);
              }
            })
          }
        )
      }
    );
  }
);
TabsTrigger$1.displayName = TRIGGER_NAME;
var CONTENT_NAME = "TabsContent";
var TabsContent = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeTabs, value, forceMount, children, ...contentProps } = props;
    const context = useTabsContext(CONTENT_NAME, __scopeTabs);
    const triggerId = makeTriggerId(context.baseId, value);
    const contentId = makeContentId(context.baseId, value);
    const isSelected = value === context.value;
    const isMountAnimationPreventedRef = reactExports.useRef(isSelected);
    reactExports.useEffect(() => {
      const rAF = requestAnimationFrame(() => isMountAnimationPreventedRef.current = false);
      return () => cancelAnimationFrame(rAF);
    }, []);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || isSelected, children: ({ present }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.div,
      {
        "data-state": isSelected ? "active" : "inactive",
        "data-orientation": context.orientation,
        role: "tabpanel",
        "aria-labelledby": triggerId,
        hidden: !present,
        id: contentId,
        tabIndex: 0,
        ...contentProps,
        ref: forwardedRef,
        style: {
          ...props.style,
          animationDuration: isMountAnimationPreventedRef.current ? "0s" : void 0
        },
        children: present && children
      }
    ) });
  }
);
TabsContent.displayName = CONTENT_NAME;
function makeTriggerId(baseId, value) {
  return `${baseId}-trigger-${value}`;
}
function makeContentId(baseId, value) {
  return `${baseId}-content-${value}`;
}
var Root2 = Tabs$1;
var List = TabsList$1;
var Trigger = TabsTrigger$1;
function Tabs({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Root2,
    {
      "data-slot": "tabs",
      className: cn("flex flex-col gap-2", className),
      ...props
    }
  );
}
function TabsList({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    List,
    {
      "data-slot": "tabs-list",
      className: cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      ),
      ...props
    }
  );
}
function TabsTrigger({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Trigger,
    {
      "data-slot": "tabs-trigger",
      className: cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props
    }
  );
}
const KIND_TABS = [
  { value: "all", label: "All" },
  { value: SubmissionKind.contact, label: "Contact" },
  { value: SubmissionKind.waitlist, label: "Waitlist" }
];
const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: SubmissionStatus.new_, label: "Unread" },
  { value: SubmissionStatus.read, label: "Read" },
  { value: SubmissionStatus.handled, label: "Handled" }
];
function friendlyError(error) {
  const raw = error instanceof Error ? error.message : String(error);
  if (/unauthor|not.?admin|forbidden|access required/i.test(raw)) {
    return "You do not have permission to perform this action.";
  }
  if (/not.?ready|backend/i.test(raw)) {
    return "The backend is not ready yet. Try again in a moment.";
  }
  return "Something went wrong. Please try again.";
}
function AdminSubmissions() {
  const [kind, setKind] = reactExports.useState("all");
  const [status, setStatus] = reactExports.useState("all");
  const [selectedId, setSelectedId] = reactExports.useState(null);
  const [actionError, setActionError] = reactExports.useState(null);
  const filter = reactExports.useMemo(
    () => ({
      kind: kind === "all" ? void 0 : kind,
      status: status === "all" ? void 0 : status
    }),
    [kind, status]
  );
  const {
    data: submissions = [],
    isLoading,
    isError,
    refetch,
    isFetching
  } = useAdminSubmissions(filter);
  const { data: allSubmissions = [] } = useAdminSubmissions({});
  const setStatusMutation = useSetSubmissionStatus();
  const deleteMutation = useDeleteSubmission();
  const selected = reactExports.useMemo(
    () => submissions.find((item) => item.id === selectedId) ?? null,
    [submissions, selectedId]
  );
  const unreadCount = reactExports.useMemo(
    () => allSubmissions.filter((item) => item.status === SubmissionStatus.new_).length,
    [allSubmissions]
  );
  function handleSelect(id) {
    setActionError(null);
    setSelectedId(id);
  }
  function handleMarkRead() {
    if (!selected) return;
    setActionError(null);
    setStatusMutation.mutate(
      { id: selected.id, status: SubmissionStatus.read },
      { onError: (error) => setActionError(friendlyError(error)) }
    );
  }
  function handleMarkHandled() {
    if (!selected) return;
    setActionError(null);
    setStatusMutation.mutate(
      { id: selected.id, status: SubmissionStatus.handled },
      { onError: (error) => setActionError(friendlyError(error)) }
    );
  }
  function handleDelete() {
    if (!selected) return;
    setActionError(null);
    deleteMutation.mutate(selected.id, {
      onSuccess: () => setSelectedId(null),
      onError: (error) => setActionError(friendlyError(error))
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageMeta,
      {
        title: "Submissions",
        description: "Review contact and waitlist submissions for Ovanite."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Container, { className: "py-10 md:py-14", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "eyebrow", children: "Admin · Inbox" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl", children: "Submissions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 max-w-xl text-sm text-muted-foreground", children: "Contact and waitlist entries, newest first. No emails are sent — every submission is retained here for review." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(MicroBadge, { "data-ocid": "admin.submissions.unread_badge", children: [
        unreadCount,
        " unread"
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { className: "py-10 md:py-14", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "eyebrow mb-2", children: "Kind" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Tabs,
            {
              value: kind,
              onValueChange: (value) => setKind(value),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TabsList,
                {
                  "data-ocid": "admin.submissions.kind.tab",
                  className: "rounded-sm",
                  children: KIND_TABS.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TabsTrigger,
                    {
                      value: tab.value,
                      "data-ocid": `admin.submissions.kind.${tab.value}`,
                      className: "rounded-sm",
                      children: tab.label
                    },
                    tab.value
                  ))
                }
              )
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "eyebrow mb-2", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Tabs,
            {
              value: status,
              onValueChange: (value) => setStatus(value),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TabsList,
                {
                  "data-ocid": "admin.submissions.status.tab",
                  className: "rounded-sm",
                  children: STATUS_TABS.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TabsTrigger,
                    {
                      value: tab.value,
                      "data-ocid": `admin.submissions.status.${tab.value}`,
                      className: "rounded-sm",
                      children: tab.label
                    },
                    tab.value
                  ))
                }
              )
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("min-w-0"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SubmissionList,
            {
              submissions,
              selectedId,
              onSelect: handleSelect,
              isLoading,
              isError,
              onRetry: () => void refetch()
            }
          ),
          !isLoading && !isError && submissions.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            SubmissionListFooter,
            {
              count: submissions.length,
              onRefresh: () => void refetch(),
              isRefreshing: isFetching
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SubmissionDetail,
          {
            submission: selected,
            isLoading: isLoading && selectedId !== null,
            isError: isError && selectedId !== null,
            onRetry: () => void refetch(),
            onMarkRead: handleMarkRead,
            onMarkHandled: handleMarkHandled,
            onDelete: handleDelete,
            isUpdating: setStatusMutation.isPending,
            isDeleting: deleteMutation.isPending,
            actionError
          }
        ) })
      ] })
    ] })
  ] });
}
export {
  AdminSubmissions as default
};
