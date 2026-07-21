# Critical writes

For payment, reservation, stock, ticket validation and cash operations:

1. Assign a unique business or external reference.
2. Validate current state inside the transaction.
3. Lock or atomically update contested rows.
4. Write the primary state and audit record together.
5. Commit before dispatching slow external work.
6. Make jobs and callbacks safe to repeat.
7. Test duplicate, stale and concurrent execution.

Never hold a database transaction open while waiting for a payment provider.
