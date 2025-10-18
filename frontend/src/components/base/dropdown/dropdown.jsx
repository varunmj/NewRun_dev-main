import React from "react";
import { DotsVertical } from "@untitledui/icons";
import {
    Button as AriaButton,
    Header as AriaHeader,
    Menu as AriaMenu,
    MenuItem as AriaMenuItem,
    MenuTrigger as AriaMenuTrigger,
    Popover as AriaPopover,
    Separator as AriaSeparator,
} from "react-aria-components";
import { cx } from "../../../utils/cx";

const DropdownItem = ({ label, children, addon, icon: Icon, unstyled, ...props }) => {
    if (unstyled) {
        return <AriaMenuItem id={label} textValue={label} {...props} />;
    }

    return (
        <AriaMenuItem
            {...props}
            className={(state) =>
                cx(
                    "group block cursor-pointer px-1.5 py-px outline-hidden",
                    state.isDisabled && "cursor-not-allowed",
                    typeof props.className === "function" ? props.className(state) : props.className,
                )
            }
        >
            {(state) => (
                <div
                    className={cx(
                        "relative flex items-center justify-between rounded-md px-2.5 py-2 outline-focus-ring transition duration-100 ease-linear",
                        !state.isDisabled && "group-hover:bg-gray-50",
                        state.isFocused && "bg-gray-50",
                        state.isFocusVisible && "outline-2 -outline-offset-2",
                    )}
                >
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <Icon
                                aria-hidden="true"
                                className={cx("w-4 h-4 shrink-0", state.isDisabled ? "text-gray-400" : "text-gray-500")}
                            />
                        )}

                        <span
                            className={cx(
                                "text-sm font-medium",
                                state.isDisabled ? "text-gray-400" : "text-gray-700",
                            )}
                        >
                            {label || (typeof children === "function" ? children(state) : children)}
                        </span>
                    </div>

                    {addon && (
                        <span
                            className={cx(
                                "text-xs font-mono",
                                state.isDisabled ? "text-gray-400" : "text-gray-400",
                            )}
                        >
                            {addon}
                        </span>
                    )}
                </div>
            )}
        </AriaMenuItem>
    );
};

const DropdownMenu = (props) => {
    return (
        <AriaMenu
            disallowEmptySelection
            selectionMode="single"
            {...props}
            className={(state) =>
                cx("h-min overflow-y-auto py-1 outline-hidden select-none", typeof props.className === "function" ? props.className(state) : props.className)
            }
        />
    );
};

const DropdownPopover = (props) => {
    return (
        <AriaPopover
            placement="bottom right"
            {...props}
            className={(state) =>
                cx(
                    "w-64 origin-top-right overflow-auto rounded-lg bg-white shadow-lg border border-gray-200 will-change-transform",
                    state.isEntering &&
                        "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                    state.isExiting &&
                        "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                    typeof props.className === "function" ? props.className(state) : props.className,
                )
            }
        >
            {props.children}
        </AriaPopover>
    );
};

const DropdownSeparator = (props) => {
    return <AriaSeparator {...props} className={cx("my-1 h-px w-full bg-gray-200", props.className)} />;
};

const DropdownDotsButton = (props) => {
    return (
        <AriaButton
            {...props}
            aria-label="Open menu"
            className={(state) =>
                cx(
                    "cursor-pointer rounded-md text-fg-quaternary outline-focus-ring transition duration-100 ease-linear",
                    (state.isPressed || state.isHovered) && "text-fg-quaternary_hover",
                    (state.isPressed || state.isFocusVisible) && "outline-2 outline-offset-2",
                    typeof props.className === "function" ? props.className(state) : props.className,
                )
            }
        >
            <DotsVertical className="size-5 transition-inherit-all" />
        </AriaButton>
    );
};

export const Dropdown = {
    Root: AriaMenuTrigger,
    Popover: DropdownPopover,
    Menu: DropdownMenu,
    Section: ({ children, ...props }) => <div {...props}>{children}</div>,
    SectionHeader: AriaHeader,
    Item: DropdownItem,
    Separator: DropdownSeparator,
    DotsButton: DropdownDotsButton,
};
