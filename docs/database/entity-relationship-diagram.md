# Entity Relationship Diagram

The diagram shows evidence-backed high-level relationships, not every Prisma model or cardinality constraint. Consult `prisma/parts` for the source schema.

```mermaid
erDiagram
  ORGANIZATION ||--o{ USER : has_membership_and_access_data
  ORGANIZATION ||--o{ CHANNEL : owns
  CHANNEL ||--o{ CHANNEL_MEMBER : includes
  CHANNEL ||--o{ MESSAGE : contains
  USER ||--o{ MESSAGE : authors
  MESSAGE ||--o{ MESSAGE_REACTION : receives
  USER ||--o{ MESSAGE_REACTION : creates
  MESSAGE ||--o{ MESSAGE_MENTION : includes
  USER ||--o{ MESSAGE_MENTION : receives
```

TODO Confirm with team: whether this diagram should be expanded and maintained as a complete data-model artifact.