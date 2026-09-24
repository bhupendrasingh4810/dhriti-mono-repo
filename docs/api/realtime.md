# Real-time Connect

The Connect gateway is a Socket.IO server at namespace `/connect`. Its CORS origins come from `CONNECT_SOCKET_ALLOWED_ORIGINS` or fall back to `CORS_ORIGINS`. It supports `websocket` and `polling` transports.

## Connection behavior

The gateway authenticates each socket through `WsAuthService`. On a principal with an organization, it records presence and joins an organization room. Authentication failure emits an `error` event with code `UNAUTHORIZED` and disconnects the socket.

The gateway delegates presence, typing, publishing, adapter lifecycle, and rate limiting to dedicated services. The repository dependencies include the Socket.IO Redis adapter, and the gateway initializes an adapter lifecycle service; consult those services for deployment-specific behavior.

## Client events

| Event               | Purpose                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `channel:join`      | Verify channel access and join a channel room                                                                 |
| `channel:leave`     | Verify channel access and leave a channel room                                                                |
| `typing`            | Set and publish a channel typing state                                                                        |
| `message:send`      | Create and publish a message; accepts channel ID, content, optional parent ID, and optional client message ID |
| `presence:set`      | Set and publish the caller's presence status                                                                  |
| `channel:mark-read` | Mark the caller's channel state as read and publish that state                                                |

Successful handlers return an acknowledgement shaped as `{ ok: true }` or, for `message:send`, `{ ok: true, message }`. Handler errors are normalized by the gateway's execution path; clients should handle negative acknowledgements and emitted errors rather than assuming every event succeeds.

TODO Confirm with team: the supported client library version, reconnection policy, payload compatibility guarantees, and public event versioning policy are not documented by the repository.
