/* UNUSED */
import { ExtractedSpan } from './extracted-span';

/* Citation extracted from the syllabus */
export interface Citation {
  doc_span: ExtractedSpan;
  parsed_citation: ParsedCitation;
  catalog_key?: CatalogKey;
  catalog_record?: CatalogRecord;
}

/* Parsed citation information */
export interface ParsedCitation {
  title?: ExtractedSpan[];
  subtitle?: ExtractedSpan[];
  author?: ExtractedSpan[];
  editor?: ExtractedSpan[];
  publisher?: ExtractedSpan[];
  isbn?: ExtractedSpan[];
}

/* Catalog key for looking up standardized citation information */
export interface CatalogKey {
  clean_title: string;
  clean_author: {
    forenames: string;
    keyname: string;
  };
  title_key: string;
  author_key: string;
}

/* Standardized catalog record */
export interface CatalogRecord {
  _id: number;
  work_cluster_size: number;

  sources: Record<string, string[]>;

  title: string;
  subtitle?: string;

  authors: {
    forenames: string;
    keyname: string;
  }[];

  publisher?: string;
  year?: number;
  description?: string;

  image_urls?: string[];
  dois?: string[];
  isbns?: string[];
  issns?: string[];
  urls?: string[];

  publication_type?: string;
  open_access?: boolean;

  article?: {
    venue?: string;
    volume?: string;
    issue?: string;
    page_start?: string;
    page_end?: string;
    abstract?: string;
  };
}
