# Controller patterns

## Read controller

- Authorize.
- Parse filters.
- Query required columns and relations.
- Preserve query string for pagination.
- Return minimal Inertia props.

## Write controller

- Receive a Form Request.
- Inject one focused Action when the operation is non-trivial.
- Return a named-route redirect with a clear flash message.

## Split controllers when

- an operation has a distinct permission;
- an operation has a distinct route and lifecycle;
- a resource controller method would need unrelated branches.

Do not split a simple CRUD controller merely to increase the file count.
