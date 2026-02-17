export interface ExtractedCommentTag {
  tag: string;
  text: string;
}

export interface ExtractedSymbol {
  id: number;
  name: string;
  kind: string;
  summary: string;
  tags: ExtractedCommentTag[];
  sourcePath?: string;
  line?: number;
}

export interface ExtractedModule {
  id: number;
  name: string;
  summary?: string;
  sourcePath?: string;
  symbols: ExtractedSymbol[];
}

export interface ExtractedModel {
  schemaVersion: string;
  modules: ExtractedModule[];
}
