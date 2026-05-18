# VOX UI kit

The full interactive product UI kit for VOX. Demo entrypoint and a four-screen click-through prototype.

## Entry point

- **Demo:** [`/VOX.html`](../../VOX.html), the live prototype

## Screens

| Screen              | File                                | Notes                                                              |
|---------------------|-------------------------------------|--------------------------------------------------------------------|
| Biblioteca          | `vox/library.jsx`                   | Dashboard greeting + soft stats + sermon grid                      |
| Novo sermão (3-step)| `vox/new-sermon.jsx`                | Framework picker → details → outline preview                       |
| Editor              | `vox/editor.jsx`                    | Three-pane: outline / canvas / refs (refs auto-collapse <1100px)   |
| Modo Apresentação   | `vox/presentation.jsx`              | Dark stage view with timer, navigation, "a seguir" rail            |

## Shared components

| Component           | File                                | Notes                                                              |
|---------------------|-------------------------------------|--------------------------------------------------------------------|
| Sidebar             | `vox/sidebar.jsx`                   | 240px ↔ 64px collapsible nav, recents, user                        |
| Primitives          | `vox/primitives.jsx`                | `VoxIcon`, `VoxMark`, `FrameworkBadge`, `Status`, `Kbd`            |
| Tweaks panel        | `vox/tweaks-panel.jsx`              | Glassy floating panel, host-protocol wired                         |
| App shell + routing | `vox/app.jsx`                       | Screen router, keyboard shortcuts, tweaks integration              |
| Static data         | `vox/data.js`                       | Sermons, frameworks, block-types, editor draft                     |
| Tokens              | `vox/styles.css`                    | Component-scoped CSS (mirrors `colors_and_type.css`)               |

## How to fork

To start a new artifact using this kit:

1. Copy `colors_and_type.css` (or `vox/styles.css`) into your new project.
2. Copy `vox/primitives.jsx` for icons, mark, badges, and status pills.
3. Copy `vox/tweaks-panel.jsx` if you need tweakable settings.
4. Re-use the React + Babel script block from `VOX.html`.

The kit is **not** a production library, it's a hi-fi interaction reference. Feel free to lift code and re-style; don't try to install it as a dependency.

## Verified behaviors

- Sidebar auto-collapses below 1080px viewport.
- Editor right rail auto-hides below 1100px viewport with toolbar toggle.
- Keyboard: `Cmd/Ctrl+N` opens new sermon; `Esc` exits Modo Apresentação; `←/→/Space` navigate stage blocks.
- Tweaks panel persists state via the host `__edit_mode_set_keys` protocol, refresh keeps your choices.

## Caveats

- All sermon copy is placeholder material in Brazilian Portuguese.
- Pastor name "Edmundo Marques" and church "IBP Vila Pauliceia" are stand-ins.
- Slash-command "/" autocomplete in the editor is visual only, not wired.
