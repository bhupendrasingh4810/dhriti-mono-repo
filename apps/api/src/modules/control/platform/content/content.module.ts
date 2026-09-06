import { Module } from "@nestjs/common";

import { LegalDocumentController } from "./legal-document/legal-document.controller";
import { LegalDocumentService } from "./legal-document/legal-document.service";
import { FaqController } from "./faq/faq.controller";
import { FaqService } from "./faq/faq.service";
import { CareerController } from "./careers/career.controller";
import { CareerService } from "./careers/career.service";
import { BlogPostController } from "./blogs/posts/blog-post.controller";
import { BlogPostService } from "./blogs/posts/blog-post.service";
import { BlogCategoryController } from "./blogs/categories/blog-category.controller";
import { BlogCategoryService } from "./blogs/categories/blog-category.service";
import { BlogTagController } from "./blogs/tags/blog-tag.controller";
import { BlogTagService } from "./blogs/tags/blog-tag.service";

@Module({
  controllers: [
    LegalDocumentController,
    FaqController,
    CareerController,
    BlogPostController,
    BlogCategoryController,
    BlogTagController,
  ],
  providers: [
    LegalDocumentService,
    FaqService,
    CareerService,
    BlogPostService,
    BlogCategoryService,
    BlogTagService,
  ],
  exports: [
    LegalDocumentService,
    FaqService,
    CareerService,
    BlogPostService,
    BlogCategoryService,
    BlogTagService,
  ],
})
export class ContentModule {}
