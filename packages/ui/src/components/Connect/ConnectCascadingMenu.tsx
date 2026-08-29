"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent, ReactNode } from "react";

import {
    CheckRounded,
    ChevronLeftRounded,
    ChevronRightRounded,
} from "@mui/icons-material";

import {
    Divider,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    MenuList,
    Paper,
    Popper,
    Stack,
    Typography,
} from "@mui/material";

export type ConnectCascadingMenuItem = {
    id: string;
    label: string;
    icon?: ReactNode;
    danger?: boolean;
    selected?: boolean;
    sectionTitle?: string;
    dividerAbove?: boolean;
    endAdornment?: ReactNode;

    /**
    
    * Only applies to leaf items.
    * Parent items with children always open their submenu.
      */
    closeOnClick?: boolean;

    onClick?: (
        event: MouseEvent<HTMLElement>,
        item?: ConnectCascadingMenuItem,
    ) => void;

    children?: ConnectCascadingMenuItem[];
};

type ConnectCascadingMenuProps = {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    items: ConnectCascadingMenuItem[];
    minWidth?: number;
    heading?: string;
    maxDepth?: number;
};

type SubmenuState = {
    itemId: string;
    anchorEl: HTMLElement;
    openLeft: boolean;
};

const PAPER_SX = {
    mt: 1,
    border: "1px solid #eef2f7",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
    borderRadius: 1,
};

export function ConnectCascadingMenu({
    anchorEl,
    open,
    onClose,
    items,
    minWidth = 220,
    heading,
    maxDepth = 4,
}: ConnectCascadingMenuProps) {
    /**
    
    * One object per opened submenu.
    *
    * submenuStates[0]
    * -> root item's submenu
    *
    * submenuStates[1]
    * -> level 1 item's submenu
      */
    const [submenuStates, setSubmenuStates] = useState<
        SubmenuState[]

    >([]);

    const safeMaxDepth = Math.min(
        Math.max(maxDepth, 1),
        4,
    );

    useEffect(() => {
        if (!open) {
            setSubmenuStates([]);
        }
    }, [open]);

    /**
    
    * Reset all submenu state.
      */
    function resetSubmenus() {
        setSubmenuStates([]);
    }

    /**
    
    * Close complete cascading menu.
      */
    function closeAll() {
        resetSubmenus();
        onClose();
    }

    /**
    
    * Close from a specific level.
    *
    * Level 0 = close complete menu
    * Level 1 = close first submenu and deeper
    * Level 2 = close second submenu and deeper
      */
    function closeFromLevel(level: number) {
        if (level === 0) {
            closeAll();
            return;
        }

        setSubmenuStates((previous) =>

            previous.slice(0, level - 1),
        );

    }

    /**
    
    * Check whether submenu should open on the left.
      */
    function shouldOpenLeft(
        element: HTMLElement,
    ) {
        const rect =
            element.getBoundingClientRect();

        const estimatedWidth =

            minWidth + 24;

        const availableRight =
            window.innerWidth - rect.right;

        return availableRight < estimatedWidth;

    }

    /**
    
    * Returns menu items for a specific level.
    *
    * Level 0 -> root items
    * Level 1 -> children of submenuStates[0]
    * Level 2 -> children of submenuStates[1]
      */
    const itemsByLevel = useMemo(() => {
        const levels: ConnectCascadingMenuItem[][] = [
            items,
        ];

        for (

            let level = 0;
            level < submenuStates.length;
            level += 1
        ) {
            const state =
                submenuStates[level];

            const parentItems =
                levels[level];

            const parentItem =
                parentItems?.find(
                    (item) =>
                        item.id === state.itemId,
                );

            if (!parentItem?.children?.length) {
                break;
            }

            levels.push(parentItem.children);
        }

        return levels;

    }, [items, submenuStates]);

    /**
    
    * Open a submenu.
      */
    function openSubmenu(
        level: number,
        item: ConnectCascadingMenuItem,
        itemElement: HTMLElement,
    ) {
        const openLeft =
            shouldOpenLeft(itemElement);

        setSubmenuStates((previous) => {

            /**
             * Remove all deeper submenu levels.
             */
            const next =
                previous.slice(0, level);

            next[level] = {
                itemId: item.id,
                anchorEl: itemElement,
                openLeft,
            };

            return next;
        });

    }

    /**
    
    * Handle every menu item click.
      */
    function handleItemClick(
        level: number,
        item: ConnectCascadingMenuItem,
        event: MouseEvent<HTMLElement>,
    ) {
        /**
      
        * IMPORTANT:
        *
        * Capture currentTarget immediately.
        *
        * Do not access event.currentTarget
        * later inside a state callback.
          */
        const itemElement =
            event.currentTarget;

        const hasChildren =

            Boolean(item.children?.length) &&
            level < safeMaxDepth - 1;

        /**
         * Parent item.
         *
         * Always open submenu.
         */
        if (hasChildren) {
            openSubmenu(
                level,
                item,
                itemElement,
            );

            /**
             * Parent callback is optional.
             */
            item.onClick?.(event, item);

            return;
        }

        /**
         * Leaf item.
         */
        item.onClick?.(event, item);

        /**
         * Keep menu open if explicitly requested.
         */
        if (item.closeOnClick === false) {
            return;
        }

        closeAll();

    }

    return (
        <>
            {Array.from({
                length: safeMaxDepth,
            }).map((_, level) => {
                const levelItems =
                    itemsByLevel[level] ?? [];

                /**
                 * Root menu.
                 */
                if (level === 0) {
                    return (
                        <Menu
                            key="cascading-menu-root"
                            anchorEl={anchorEl}
                            open={
                                open &&
                                Boolean(anchorEl)
                            }
                            onClose={closeAll}
                            disableScrollLock
                            disableAutoFocusItem
                            disableRestoreFocus
                            keepMounted
                            slotProps={{
                                paper: {
                                    sx: {
                                        ...PAPER_SX,
                                        minWidth,
                                    },
                                },
                            }}
                            anchorOrigin={{
                                horizontal: "right",
                                vertical: "bottom",
                            }}
                            transformOrigin={{
                                horizontal: "right",
                                vertical: "top",
                            }}
                        >
                            {heading ? (
                                <Typography
                                    sx={{
                                        px: 1.75,
                                        pt: 1.5,
                                        pb: 0.75,
                                        fontSize: 12,
                                        fontWeight: 800,
                                        letterSpacing:
                                            "0.08em",
                                        color: "#9ca3af",
                                        textTransform:
                                            "uppercase",
                                    }}
                                >
                                    {heading}
                                </Typography>
                            ) : null}

                            {levelItems.map(
                                (item) => (
                                    <MenuItem
                                        key={item.id}
                                        onClick={(event) =>
                                            handleItemClick(
                                                0,
                                                item,
                                                event,
                                            )
                                        }
                                        sx={{
                                            py: 1.5,
                                            gap: 0.5,
                                        }}
                                    >
                                        {renderMenuItem(
                                            item,
                                            0,
                                        )}
                                    </MenuItem>
                                ),
                            )}
                        </Menu>
                    );
                }

                /**
                 * Submenu.
                 *
                 * Level 1 uses submenuStates[0]
                 * Level 2 uses submenuStates[1]
                 */
                const submenuState =
                    submenuStates[level - 1];

                if (
                    !submenuState ||
                    levelItems.length === 0
                ) {
                    return null;
                }

                const openLeft =
                    submenuState.openLeft;

                return (
                    <Popper
                        key={`cascading-menu-level-${level}`}
                        open={open}
                        anchorEl={submenuState.anchorEl}
                        placement={
                            openLeft
                                ? "left-start"
                                : "right-start"
                        }
                        modifiers={[
                            {
                                name: "offset",
                                options: {
                                    offset: [0, 4],
                                },
                            },
                        ]}
                        sx={{
                            zIndex: (theme) =>
                                theme.zIndex.modal + level,
                        }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                ...PAPER_SX,
                                minWidth,
                                mt: 0,
                            }}
                        >
                            <MenuList
                                autoFocusItem={false}
                                onKeyDown={(event) => {
                                    if (event.key === "Escape") {
                                        closeFromLevel(level);
                                    }
                                }}
                            >
                                {levelItems.map(
                                    (item) => (
                                        <MenuItem
                                            key={item.id}
                                            onClick={(event) =>
                                                handleItemClick(
                                                    level,
                                                    item,
                                                    event,
                                                )
                                            }
                                            sx={{
                                                py: 1.5,
                                                gap: 0.5,
                                            }}
                                        >
                                            {renderMenuItem(
                                                item,
                                                level,
                                            )}
                                        </MenuItem>
                                    ),
                                )}
                            </MenuList>
                        </Paper>
                    </Popper>
                );
            })}
        </>
    );

    /**
    
    * Render item content.
      */
    function renderMenuItem(
        item: ConnectCascadingMenuItem,
        level: number,
    ) {
        const hasChildren =
            Boolean(item.children?.length) &&
            level < safeMaxDepth - 1;


        const selectedSubmenu =
            submenuStates[level];

        return (
            <>
                {item.selected ? (
                    <ListItemIcon
                        sx={{
                            minWidth: 26,
                            color: "#16a34a",
                        }}
                    >
                        <CheckRounded
                            fontSize="small"
                        />
                    </ListItemIcon>
                ) : item.icon ? (
                    <ListItemIcon
                        sx={{
                            minWidth: 26,
                        }}
                    >
                        {item.icon}
                    </ListItemIcon>
                ) : (
                    <ListItemIcon
                        sx={{
                            minWidth: 26,
                        }}
                    />
                )}

                <ListItemText
                    primary={item.label}
                    sx={{
                        "& .MuiListItemText-primary":
                        {
                            fontSize: 14,

                            color: item.danger
                                ? "#dc2626"
                                : "#374151",

                            fontWeight:
                                item.selected
                                    ? 700
                                    : 500,
                        },
                    }}
                />

                {item.endAdornment ? (
                    item.endAdornment
                ) : hasChildren ? (
                    selectedSubmenu?.openLeft ? (
                        <ChevronLeftRounded
                            sx={{
                                fontSize: 16,
                                color: "#9ca3af",
                            }}
                        />
                    ) : (
                        <ChevronRightRounded
                            sx={{
                                fontSize: 16,
                                color: "#9ca3af",
                            }}
                        />
                    )
                ) : null}
            </>
        );
    }
}
