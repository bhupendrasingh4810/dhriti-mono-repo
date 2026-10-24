CREATE TABLE "post_comment_reactions" (
    "id" UUID NOT NULL,
    "commentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_comment_reactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_comment_reactions_commentId_userId_key" ON "post_comment_reactions"("commentId", "userId");
CREATE INDEX "post_comment_reactions_commentId_idx" ON "post_comment_reactions"("commentId");

ALTER TABLE "post_comment_reactions" ADD CONSTRAINT "post_comment_reactions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_comment_reactions" ADD CONSTRAINT "post_comment_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
