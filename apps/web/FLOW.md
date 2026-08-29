Design and implement the [SCREEN NAME] screen for Flow, an enterprise project and work management application.

Flow is a Jira-like application responsible for planning, tracking and executing organizational work.

IMPORTANT UI ARCHITECTURE:

The application already has a common global shell shared by all applications.

Global sidebar:
Home
Connect
Flow
Atlas
Pulse
Nexus
Control

Flow must be highlighted as the active application.

Flow has its own secondary navigation:
Dashboard
My Work
Projects
Issues
Backlog
Boards
Sprints
Roadmap
Reports

Use the existing global shell and existing reusable components.

THEME:
Use the existing MUI theme and design tokens exactly as they already exist.

Do NOT:
- Create a new theme
- Create a theme package
- Create duplicate UI components
- Create another UI library
- Introduce Tailwind
- Change the existing application shell
- Create unnecessary abstractions
- Rename existing components
- Use Dhriti in any type, class, method, interface, function, or variable naming

Use Material UI components wherever appropriate.

DESIGN PRINCIPLES:

- Enterprise-grade
- Clean
- Modern
- Dense enough for professional work management
- Excellent information hierarchy
- Responsive
- Accessible
- Keyboard-friendly
- Consistent spacing
- Consistent typography
- Minimal decorative elements
- Avoid excessive cards
- Prioritize real work information
- Clear empty states
- Clear loading states
- Clear error states
- Clear permission states

The screen must feel like part of the same product as Connect, Atlas and Pulse.

FUNCTIONAL REQUIREMENTS:

[INSERT SCREEN-SPECIFIC REQUIREMENTS HERE]

INTERACTION REQUIREMENTS:

- Buttons must have meaningful actions
- Tables should support sorting/filtering where applicable
- Lists should support selection where applicable
- Links should navigate to related screens
- Dialogs should have proper validation
- Destructive actions require confirmation
- Loading states must be represented
- Empty states must be represented
- Error states must be represented

WORK GRAPH:

Where relevant, show relationships between:
Connect conversations
Issues
Projects
Atlas documents
Pulse meetings
Decisions
People

Do not invent functionality outside the requirements.

The result should be production-quality frontend UI using the existing architecture and existing MUI-based component system.