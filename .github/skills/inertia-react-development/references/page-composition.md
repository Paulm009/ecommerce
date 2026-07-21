# Page composition

A normal administrative page contains:

1. `Head`;
2. application layout;
3. page header;
4. feedback;
5. optional summary;
6. filters;
7. primary content;
8. pagination or next action.

Keep server-derived state in props and URL parameters. Extract components when they own a
recognizable responsibility, not merely to shorten a file.
